// backend/utils/costBasisEngine.js
const { toPiastres, fromPiastres } = require('./currencyUtils');

/**
 * Calculates Cost of Goods Sold (COGS), Realized Gain, and Cost Basis for an array of trades.
 * 
 * Supports:
 * - 'average': Running Weighted Average Cost Basis
 * - 'fifo': First-In, First-Out lot matching
 * - 'lifo': Last-In, First-Out lot matching
 * 
 * Respects FinStat's position lifecycle & iteration system.
 */

/**
 * Clones a lot object.
 */
function cloneLot(lot) {
  return {
    ...lot,
    remainingShares: Number(lot.remainingShares),
    shares: Number(lot.shares),
    price: Number(lot.price),
    totalValue: Number(lot.totalValue),
  };
}

/**
 * Calculates realized gain for a single sell trade against active buy lots.
 * 
 * @param {Array} buyLots - Array of active lots [{ date, shares, remainingShares, price, totalValue, ... }]
 * @param {Object} sellTrade - The sell trade { shares, price, totalValue, fees, date }
 * @param {String} method - 'fifo', 'lifo', or 'average'
 * @returns {Object} { cogs, realizedGain, lotsConsumed }
 */
function calculateRealizedGain(buyLots, sellTrade, method = 'average') {
  const sharesToSell = Number(sellTrade.shares || 0);
  const sellTotalValue = Number(sellTrade.totalValue || 0);
  const normalizedMethod = (method || 'average').toLowerCase();

  if (sharesToSell <= 0 || !Array.isArray(buyLots) || buyLots.length === 0) {
    return {
      cogs: 0,
      realizedGain: sellTotalValue,
      lotsConsumed: [],
    };
  }

  let cogs = 0;
  let remainingToSell = sharesToSell;
  const lotsConsumed = [];

  if (normalizedMethod === 'average') {
    // Weighted average across all remaining shares in active lots
    const totalRemainingShares = buyLots.reduce((sum, lot) => sum + (lot.remainingShares || 0), 0);
    const totalRemainingCost = buyLots.reduce(
      (sum, lot) => sum + (lot.remainingShares || 0) * (lot.price || 0),
      0
    );

    const averagePrice = totalRemainingShares > 0 ? totalRemainingCost / totalRemainingShares : 0;
    cogs = sharesToSell * averagePrice;

    // Proportionally reduce remaining shares across active lots
    for (const lot of buyLots) {
      if (lot.remainingShares > 0 && totalRemainingShares > 0) {
        const consumed = (lot.remainingShares / totalRemainingShares) * sharesToSell;
        lot.remainingShares = Math.max(0, lot.remainingShares - consumed);
        lotsConsumed.push({
          lotId: lot._id || lot.date,
          sharesConsumed: consumed,
          costBasisPerShare: averagePrice,
        });
      }
    }
  } else {
    // FIFO or LIFO
    // FIFO takes from index 0 upwards, LIFO takes from last index downwards
    const iterateOrder = normalizedMethod === 'lifo'
      ? [...buyLots].reverse()
      : [...buyLots];

    for (const lot of iterateOrder) {
      if (remainingToSell <= 0) break;
      if (lot.remainingShares <= 0) continue;

      const take = Math.min(lot.remainingShares, remainingToSell);
      const lotCogs = take * (lot.price || 0);
      cogs += lotCogs;
      lot.remainingShares -= take;
      remainingToSell -= take;

      lotsConsumed.push({
        lotId: lot._id || lot.date,
        sharesConsumed: take,
        costBasisPerShare: lot.price,
      });
    }

    // If more was sold than available in lots (short or data gap), fallback to sell price or 0 cost
    if (remainingToSell > 0) {
      const fallbackPrice = buyLots.length > 0 ? buyLots[buyLots.length - 1].price : 0;
      cogs += remainingToSell * fallbackPrice;
    }
  }

  // Remove completely depleted lots (if remainingShares <= 0.000001)
  for (let i = buyLots.length - 1; i >= 0; i--) {
    if (buyLots[i].remainingShares <= 0.000001) {
      buyLots.splice(i, 1);
    }
  }

  const realizedGain = sellTotalValue - cogs;

  return {
    cogs: Number(cogs.toFixed(4)),
    realizedGain: Number(realizedGain.toFixed(4)),
    lotsConsumed,
  };
}

/**
 * Calculates complete cost basis and P&L metrics for a collection of trades.
 * Trades are assumed to belong to a single stock/broker position and are processed chronologically.
 * 
 * @param {Array} trades - Array of trade objects sorted by date
 * @param {String} method - 'average', 'fifo', or 'lifo'
 * @returns {Object} Calculated metrics
 */
function calculateCostBasis(trades = [], method = 'average') {
  const normalizedMethod = (method || 'average').toLowerCase();
  const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));

  const activeLots = [];
  let totalSharesBought = 0;
  let totalBuyValue = 0;
  let totalSharesSold = 0;
  let totalSellValue = 0;
  let totalSharesDividend = 0;
  let totalDividendValue = 0;
  let totalFees = 0;
  let totalCogs = 0;

  for (const trade of sortedTrades) {
    const type = trade.type;
    const shares = Number(trade.shares || 0);
    const price = Number(trade.price || 0);
    const totalValue = Number(trade.totalValue || 0);
    const fees = Number(trade.fees || 0);
    totalFees += fees;

    if (type === 'Buy') {
      totalSharesBought += shares;
      totalBuyValue += totalValue;

      // Effective cost per share for lot includes allocated fees
      const lotPrice = shares > 0 ? totalValue / shares : price;

      activeLots.push({
        _id: trade._id,
        date: trade.date,
        shares,
        remainingShares: shares,
        price: lotPrice,
        rawPrice: price,
        totalValue,
      });
    } else if (type === 'Dividend') {
      totalDividendValue += totalValue;

      if (shares > 0) {
        // Stock dividend / bonus shares: zero added cost, adds to shares
        totalSharesDividend += shares;
        activeLots.push({
          _id: trade._id,
          date: trade.date,
          shares,
          remainingShares: shares,
          price: 0,
          rawPrice: 0,
          totalValue: 0,
          isDividend: true,
        });
      }
    } else if (type === 'Split') {
      const ratio = Number(trade.splitRatio || 1);
      if (ratio > 0 && ratio !== 1) {
        totalSharesBought = totalSharesBought * ratio;
        totalSharesDividend = totalSharesDividend * ratio;
        totalSharesSold = totalSharesSold * ratio;
        for (const lot of activeLots) {
          lot.shares = lot.shares * ratio;
          lot.remainingShares = lot.remainingShares * ratio;
          lot.price = lot.price / ratio;
        }
      }
    } else if (type === 'Sell') {
      totalSharesSold += shares;
      totalSellValue += totalValue;

      const { cogs } = calculateRealizedGain(activeLots, trade, normalizedMethod);
      totalCogs += cogs;
    }
  }

  const currentShares = Number(
    Math.max(
      0,
      activeLots.reduce((sum, lot) => sum + (lot.remainingShares || 0), 0)
    ).toFixed(4)
  );

  const averageBuyPrice = totalSharesBought > 0
    ? totalBuyValue / totalSharesBought
    : 0;

  const totalEligibleShares = totalSharesBought + totalSharesDividend;
  const adjustedAvgPrice = totalEligibleShares > 0
    ? totalBuyValue / totalEligibleShares
    : 0;

  // Remaining cost basis calculation
  let remainingCostBasis = 0;
  if (normalizedMethod === 'average') {
    remainingCostBasis = currentShares * averageBuyPrice;
  } else {
    remainingCostBasis = activeLots.reduce(
      (sum, lot) => sum + (lot.remainingShares || 0) * (lot.price || 0),
      0
    );
  }

  const tradingPL = totalSellValue - totalCogs;
  const totalRealizedReturn = tradingPL + totalDividendValue;

  const netBreakEvenPrice = currentShares > 0
    ? (totalBuyValue - (totalSellValue + totalDividendValue)) / currentShares
    : 0;

  return {
    method: normalizedMethod,
    totalSharesBought,
    totalBuyValue: Number(totalBuyValue.toFixed(2)),
    totalSharesSold,
    totalSellValue: Number(totalSellValue.toFixed(2)),
    totalSharesDividend,
    totalDividendValue: Number(totalDividendValue.toFixed(2)),
    totalFees: Number(totalFees.toFixed(2)),
    currentShares,
    costOfSoldShares: Number(totalCogs.toFixed(2)),
    tradingPL: Number(tradingPL.toFixed(2)),
    totalRealizedReturn: Number(totalRealizedReturn.toFixed(2)),
    averageBuyPrice: Number(averageBuyPrice.toFixed(4)),
    adjustedAvgPrice: Number(adjustedAvgPrice.toFixed(4)),
    remainingCostBasis: Number(remainingCostBasis.toFixed(2)),
    netBreakEvenPrice: Number(netBreakEvenPrice.toFixed(4)),
    costBasisLots: activeLots.map(cloneLot),
  };
}

/**
 * Groups trades by iteration and computes cost basis per iteration.
 * 
 * @param {Array} trades - Array of trade records for a broker/stock
 * @param {String} method - 'average', 'fifo', or 'lifo'
 * @returns {Map<number, Object>} Map of iteration to cost basis result
 */
function calculateCostBasisPerIteration(trades = [], method = 'average') {
  const iterationMap = new Map();

  for (const trade of trades) {
    const iter = trade.iteration !== undefined && trade.iteration !== null ? trade.iteration : 0;
    if (!iterationMap.has(iter)) {
      iterationMap.set(iter, []);
    }
    iterationMap.get(iter).push(trade);
  }

  const results = new Map();
  for (const [iter, iterTrades] of iterationMap.entries()) {
    results.set(iter, calculateCostBasis(iterTrades, method));
  }

  return results;
}

module.exports = {
  calculateCostBasis,
  calculateRealizedGain,
  calculateCostBasisPerIteration,
};
