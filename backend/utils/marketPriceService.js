// backend/utils/marketPriceService.js
const axios = require('axios');
const MarketPriceCache = require('../models/MarketPriceCache');

// In-memory cache store
const memoryCache = new Map();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Connection': 'keep-alive',
};

/**
 * Get from in-memory cache if valid
 */
function getFromMemory(key) {
  const cached = memoryCache.get(key);
  if (cached && (Date.now() - cached.timestamp < cached.ttl)) {
    return { data: cached.data, isLive: true, isStale: false, source: 'memory-cache', timestamp: cached.timestamp };
  }
  return null;
}

/**
 * Save to in-memory cache and asynchronously persist to MongoDB
 */
async function saveToCache(key, data, source = 'live', ttl = DEFAULT_TTL_MS) {
  const now = Date.now();
  memoryCache.set(key, { data, timestamp: now, ttl, source });

  // Asynchronously persist to DB without blocking caller
  try {
    if (MarketPriceCache && MarketPriceCache.findOneAndUpdate) {
      MarketPriceCache.findOneAndUpdate(
        { key },
        { data, source, updatedAt: new Date(now) },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).catch((err) => {
        // Silently handle DB caching error if DB is disconnected in tests
      });
    }
  } catch (e) {
    // Ignore db cache write errors
  }
}

/**
 * Fetch fallback from MongoDB or last known memory cache
 */
async function getDurableFallback(key) {
  // 1. Check if we have an expired memory cache
  const expiredMemory = memoryCache.get(key);
  if (expiredMemory && expiredMemory.data) {
    return {
      data: expiredMemory.data,
      isLive: false,
      isStale: true,
      source: 'stale-memory',
      timestamp: expiredMemory.timestamp,
    };
  }

  // 2. Check MongoDB collection
  try {
    if (MarketPriceCache && MarketPriceCache.findOne) {
      const doc = await MarketPriceCache.findOne({ key });
      if (doc && doc.data) {
        return {
          data: doc.data,
          isLive: false,
          isStale: true,
          source: 'mongodb-cache',
          timestamp: doc.updatedAt ? new Date(doc.updatedAt).getTime() : Date.now(),
        };
      }
    }
  } catch (err) {
    // DB not reachable
  }

  return null;
}

/**
 * Get Stock Market Prices
 */
async function getStockPrices({ forceRefresh = false } = {}) {
  const cacheKey = 'stocks';
  if (!forceRefresh) {
    const mem = getFromMemory(cacheKey);
    if (mem) return mem;
  }

  try {
    const response = await axios.get('https://english.mubasher.info/api/1/stocks/prices?country=eg', {
      headers: HTTP_HEADERS,
      timeout: 8000,
    });
    const data = response.data;
    await saveToCache(cacheKey, data, 'mubasher-live');
    return { data, isLive: true, isStale: false, source: 'live', timestamp: Date.now() };
  } catch (err) {
    const fallback = await getDurableFallback(cacheKey);
    if (fallback) return fallback;
    // Default empty array if nothing cached
    return { data: [], isLive: false, isStale: true, source: 'fallback-empty', timestamp: Date.now() };
  }
}

/**
 * Get Mutual Fund Latest Price
 */
async function getFundPrice(fundName, { forceRefresh = false } = {}) {
  if (!fundName) {
    return { data: null, isLive: false, isStale: false, source: 'invalid-name', timestamp: Date.now() };
  }

  const cacheKey = `fund_${fundName.trim().toLowerCase()}`;
  if (!forceRefresh) {
    const mem = getFromMemory(cacheKey);
    if (mem) return mem;
  }

  try {
    const response = await axios.get(`https://english.mubasher.info/api/1/funds?country=eg&name=${encodeURIComponent(fundName)}`, {
      headers: HTTP_HEADERS,
      timeout: 8000,
    });
    const data = response.data;
    await saveToCache(cacheKey, data, 'mubasher-funds-live');
    return { data, isLive: true, isStale: false, source: 'live', timestamp: Date.now() };
  } catch (err) {
    const fallback = await getDurableFallback(cacheKey);
    if (fallback) return fallback;
    return { data: { rows: [] }, isLive: false, isStale: true, source: 'fallback-empty', timestamp: Date.now() };
  }
}

/**
 * Get Gold Prices per gram for 24, 21, and 18 Karat
 */
async function getGoldPrices({ forceRefresh = false } = {}) {
  const cacheKey = 'gold';
  if (!forceRefresh) {
    const mem = getFromMemory(cacheKey);
    if (mem) return mem;
  }

  // Tier 1: DahabZaman Live API
  try {
    const fallResponse = await axios.get('https://dahabzaman.eg/en/GoldPrice/GetcurrentPriceList', {
      headers: {
        ...HTTP_HEADERS,
        Referer: 'https://dahabzaman.eg',
      },
      timeout: 8000,
    });
    if (fallResponse.data) {
      const d = fallResponse.data;
      const item24 = d['1'] || d['24'] || {};
      const item21 = d['2'] || d['21'] || {};
      const item18 = d['3'] || d['18'] || {};

      const pricePerGram = {
        '24': Number(item24.SellPrice || item24.price || (typeof item24 === 'number' ? item24 : 0)),
        '21': Number(item21.SellPrice || item21.price || (typeof item21 === 'number' ? item21 : 0)),
        '18': Number(item18.SellPrice || item18.price || (typeof item18 === 'number' ? item18 : 0)),
      };

      if (pricePerGram['24'] > 0 || pricePerGram['21'] > 0) {
        await saveToCache(cacheKey, pricePerGram, 'dahabzaman-live');
        return { data: pricePerGram, isLive: true, isStale: false, source: 'dahabzaman-live', timestamp: Date.now() };
      }
    }
  } catch (err) {
    // Try Tier 2: DahabMasr
  }

  // Tier 2: DahabMasr
  try {
    const response = await axios.get('https://dahabmasr.com/api/price/fetch', {
      headers: {
        ...HTTP_HEADERS,
        Referer: 'https://dahabmasr.com/',
      },
      timeout: 8000,
    });

    if (Array.isArray(response.data) && response.data.length > 0) {
      const data = response.data[0];
      const pricePerGram = {
        '24': Number(data.LocalSellPrice24 || data.Sell24 || 0),
        '21': Number(data.Sell || data.Sell21 || 0),
        '18': Number(data.LocalSellPrice18 || data.Sell18 || 0),
      };
      if (pricePerGram['24'] > 0 || pricePerGram['21'] > 0) {
        await saveToCache(cacheKey, pricePerGram, 'dahabmasr-live');
        return { data: pricePerGram, isLive: true, isStale: false, source: 'dahabmasr-live', timestamp: Date.now() };
      }
    }
  } catch (err) {
    // Both live APIs failed -> retrieve durable fallback
  }

  const fallback = await getDurableFallback(cacheKey);
  if (fallback) return fallback;

  // Fallback defaults if no historical price is stored yet
  const defaultGold = { '24': 0, '21': 0, '18': 0 };
  return { data: defaultGold, isLive: false, isStale: true, source: 'fallback-empty', timestamp: Date.now() };
}

/**
 * Get Currency Exchange Rates from CIB Bank
 */
async function getCurrencyRates({ forceRefresh = false } = {}) {
  const cacheKey = 'currency';
  if (!forceRefresh) {
    const mem = getFromMemory(cacheKey);
    if (mem) return mem;
  }

  try {
    const response = await axios.get('https://www.cibeg.com/api/currency/rates', {
      headers: {
        ...HTTP_HEADERS,
        'Referer': 'https://www.cibeg.com/',
      },
      timeout: 8000,
    });
    const rates = response.data && response.data.rates ? response.data.rates : response.data;
    await saveToCache(cacheKey, rates, 'cib-live');
    return { data: rates, isLive: true, isStale: false, source: 'live', timestamp: Date.now() };
  } catch (err) {
    const fallback = await getDurableFallback(cacheKey);
    if (fallback) return fallback;
    return { data: [], isLive: false, isStale: true, source: 'fallback-empty', timestamp: Date.now() };
  }
}

/**
 * Clear in-memory cache
 */
function clearMemoryCache(key = null) {
  if (key) {
    memoryCache.delete(key);
  } else {
    memoryCache.clear();
  }
}

module.exports = {
  getStockPrices,
  getFundPrice,
  getGoldPrices,
  getCurrencyRates,
  saveToCache,
  getFromMemory,
  getDurableFallback,
  clearMemoryCache,
};
