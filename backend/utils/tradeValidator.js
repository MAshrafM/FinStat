// backend/utils/tradeValidator.js
const { applyCorporateActions } = require('./corporateActionEngine');
const CorporateAction = require('../models/CorporateAction');
const Trade = require('../models/Trade');
const { escapeRegex } = require('./requestHelpers');

/**
 * Validates whether the user has sufficient available shares for a Sell trade,
 * taking into account Buy trades, Dividend bonus shares, Sell trades,
 * and dynamic corporate actions (splits and bonus issues) via corporateActionEngine.
 *
 * @param {string|ObjectId} userId
 * @param {string} broker
 * @param {string} stockCode
 * @param {number} requestedSellShares
 * @param {string|ObjectId|null} excludeTradeId - ID of trade being edited to exclude from deduction
 * @returns {Promise<{valid: boolean, availableShares?: number, requestedShares?: number, message?: string}>}
 */
async function validateAvailableShares(userId, broker, stockCode, requestedSellShares, excludeTradeId = null) {
  if (process.env.ENABLE_STRICT_OVERSELL === 'false') {
    return { valid: true };
  }

  const safeStock = escapeRegex((stockCode || '').trim());
  const stockRegex = new RegExp(`^${safeStock}$`, 'i');

  const rawTrades = await Trade.find({
    user: userId,
    broker,
    stockCode: stockRegex,
    deletedAt: null,
  }).sort({ date: 1, createdAt: 1 });

  const corporateActions = await CorporateAction.find({
    user: userId,
    broker,
    stockCode: stockRegex,
    deletedAt: null,
  });

  // Apply Phase 3 dynamic corporate actions (splits and bonuses)
  const adjustedTrades = applyCorporateActions(rawTrades, corporateActions);

  let totalBought = 0;
  let totalSold = 0;

  for (const t of adjustedTrades) {
    if (excludeTradeId && t._id && t._id.toString() === excludeTradeId.toString()) {
      continue; // Exclude the trade currently being edited
    }
    if (t.type === 'Buy') {
      totalBought += Number(t.shares || 0);
    } else if (t.type === 'Dividend' && Number(t.shares || 0) > 0) {
      totalBought += Number(t.shares || 0);
    } else if (t.type === 'Sell') {
      totalSold += Number(t.shares || 0);
    }
  }

  totalBought = Number(totalBought.toFixed(4));
  totalSold = Number(totalSold.toFixed(4));
  const availableShares = Number(Math.max(0, totalBought - totalSold).toFixed(4));
  const requested = Number(requestedSellShares);

  if (requested > availableShares) {
    return {
      valid: false,
      availableShares,
      requestedShares: requested,
      message: `Insufficient share balance. Available: ${availableShares}, Requested: ${requested}`,
    };
  }

  return { valid: true, availableShares };
}

module.exports = { validateAvailableShares };
