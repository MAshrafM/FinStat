// backend/utils/recurringDetector.js
const Expenditure = require('../models/Expenditure');
const RecurringSuggestion = require('../models/RecurringSuggestion');

/**
 * Calculates the median of an array of numbers.
 */
function calculateMedian(values) {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Infers recurring frequency from a median interval in days.
 * @param {number} medianDays
 * @returns {'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | null}
 */
function inferFrequency(medianDays) {
  if (medianDays >= 0.8 && medianDays <= 3) return 'daily';
  if (medianDays >= 5 && medianDays <= 9) return 'weekly';
  if (medianDays >= 25 && medianDays <= 35) return 'monthly';
  if (medianDays >= 75 && medianDays <= 105) return 'quarterly';
  if (medianDays >= 340 && medianDays <= 390) return 'yearly';
  return null;
}

/**
 * Scans a user's past expenditures to detect recurring patterns and creates/updates suggestions.
 * @param {string | import('mongoose').Types.ObjectId} userId
 * @returns {Promise<Array<object>>}
 */
async function detectRecurring(userId) {
  if (!userId) return [];

  // Fetch non-deleted withdrawal/expense transactions
  const expenditures = await Expenditure.find({
    user: userId,
    deletedAt: null,
  })
    .sort({ date: 1 })
    .lean();

  if (!expenditures || expenditures.length < 3) {
    return [];
  }

  // Group by normalized description
  const groups = new Map();

  for (const exp of expenditures) {
    const rawDesc = (exp.description || '').trim();
    if (!rawDesc) continue;

    const normalizedKey = rawDesc.toLowerCase();
    if (!groups.has(normalizedKey)) {
      groups.set(normalizedKey, {
        rawDescription: rawDesc,
        category: (exp.categories && exp.categories[0]) || 'Other',
        items: [],
      });
    }

    groups.get(normalizedKey).items.push({
      date: new Date(exp.date),
      amount: exp.transactionValue,
      id: exp._id,
      category: (exp.categories && exp.categories[0]) || 'Other',
    });
  }

  const detectedSuggestions = [];

  for (const [, group] of groups.entries()) {
    const { items, rawDescription, category } = group;
    if (items.length < 3) continue;

    // Sort chronologically
    items.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate intervals between consecutive transactions
    const intervals = [];
    for (let i = 1; i < items.length; i++) {
      const diffTime = items[i].date.getTime() - items[i - 1].date.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      intervals.push(diffDays);
    }

    const medianInterval = calculateMedian(intervals);
    const frequency = inferFrequency(medianInterval);

    if (!frequency) {
      continue; // Interval pattern does not match standard frequencies
    }

    // Measure interval consistency (tolerance ±3 days from median)
    let consistentIntervalCount = 0;
    for (const interval of intervals) {
      if (Math.abs(interval - medianInterval) <= 4) {
        consistentIntervalCount++;
      }
    }
    const intervalConsistencyRatio = consistentIntervalCount / intervals.length;

    // Measure amount consistency
    const amounts = items.map((it) => it.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    let consistentAmountCount = 0;
    for (const amt of amounts) {
      const deviation = Math.abs(amt - avgAmount) / (avgAmount || 1);
      if (deviation <= 0.15) {
        // Within 15% tolerance
        consistentAmountCount++;
      }
    }
    const amountConsistencyRatio = consistentAmountCount / amounts.length;

    // Calculate confidence score (0 - 100)
    let score = 30; // base score for having 3 occurrences

    // Occurrences bonus
    if (items.length >= 5) score += 20;
    else if (items.length >= 4) score += 15;
    else score += 10;

    // Interval consistency bonus (up to 30)
    score += Math.round(intervalConsistencyRatio * 30);

    // Amount consistency bonus (up to 20)
    score += Math.round(amountConsistencyRatio * 20);

    const confidenceScore = Math.min(100, Math.max(0, score));

    if (confidenceScore < 50) {
      continue; // Low confidence, skip
    }

    const detectedFrom = items[0].date;
    const detectedTo = items[items.length - 1].date;
    const representativeAmount = Math.round(avgAmount * 100) / 100;

    // Check if an existing suggestion already exists for this user and pattern
    let suggestion = await RecurringSuggestion.findOne({
      user: userId,
      description: rawDescription,
      deletedAt: null,
    });

    if (suggestion) {
      if (!suggestion.isRejected && !suggestion.isAccepted) {
        // Update pending suggestion with updated range and stats
        suggestion.category = category;
        suggestion.amount = representativeAmount;
        suggestion.frequency = frequency;
        suggestion.confidenceScore = confidenceScore;
        suggestion.detectedFrom = detectedFrom;
        suggestion.detectedTo = detectedTo;
        await suggestion.save();
        detectedSuggestions.push(suggestion);
      }
    } else {
      // Create new suggestion
      suggestion = await RecurringSuggestion.create({
        user: userId,
        description: rawDescription,
        category,
        amount: representativeAmount,
        frequency,
        confidenceScore,
        detectedFrom,
        detectedTo,
        isAccepted: false,
        isRejected: false,
      });
      detectedSuggestions.push(suggestion);
    }
  }

  return detectedSuggestions;
}

module.exports = {
  detectRecurring,
  inferFrequency,
  calculateMedian,
};
