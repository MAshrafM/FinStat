// backend/utils/goldStandardizer.js
const { toPiastres } = require('./currencyUtils');

/**
 * Standardizes a single gold item or karat weight to 24K equivalent grams.
 * 
 * Formula: equivalentGrams24k = weight * (karat / 24)
 * 
 * @param {Number} weight - Weight in grams
 * @param {Number} karat - Karat (e.g. 24, 22, 21, 18)
 * @returns {Number} 24K equivalent weight in grams
 */
function to24kEquivalentGrams(weight, karat) {
  const numWeight = Number(weight || 0);
  const numKarat = Number(karat || 24);

  if (numWeight <= 0 || numKarat <= 0) return 0;
  return Number((numWeight * (numKarat / 24)).toFixed(4));
}

/**
 * Standardizes a list of gold holdings to 24K equivalent weight and current market value.
 * Uses the 24K spot price from marketPriceService.
 * 
 * @param {Array} goldHoldings - Array of gold holdings
 * @param {Object} goldPrices - Object mapping karat string to price per gram, e.g. { '24': 4100, '21': 3600 }
 * @returns {Object} { holdings, summary }
 */
function standardizeGoldHoldings(goldHoldings = [], goldPrices = {}) {
  const spotPrice24k = Number(goldPrices?.['24'] || goldPrices?.['24K'] || 0);

  let totalActualWeight = 0;
  let totalEquivalentGrams24k = 0;
  let totalStandardizedValue = 0;
  let totalOriginalCost = 0;

  const standardizedHoldings = (goldHoldings || []).map((holding) => {
    // Extract karat from holding (e.g. "gold_21k" -> 21, or holding.karat)
    let karat = holding.karat;
    if (!karat && holding.id) {
      const match = holding.id.match(/gold_(\d+)k/i);
      if (match) karat = Number(match[1]);
    }
    if (!karat && holding.name) {
      const match = holding.name.match(/(\d+)k/i);
      if (match) karat = Number(match[1]);
    }
    karat = Number(karat || 24);

    const actualWeight = Number(holding.quantity || holding.weight || 0);
    const equivalentGrams24k = to24kEquivalentGrams(actualWeight, karat);
    const standardizedValue = Number((equivalentGrams24k * spotPrice24k).toFixed(2));
    const totalCost = Number(holding.totalCost || holding.paid || 0);

    totalActualWeight += actualWeight;
    totalEquivalentGrams24k += equivalentGrams24k;
    totalStandardizedValue += standardizedValue;
    totalOriginalCost += totalCost;

    return {
      ...holding,
      karat,
      actualWeight: Number(actualWeight.toFixed(4)),
      equivalentGrams24k,
      spotPrice24k,
      standardizedValue,
      standardizedValueInPiastres: toPiastres(standardizedValue),
    };
  });

  const unrealizedStandardizedPnL = totalStandardizedValue - totalOriginalCost;
  const standardizedPnLPercentage = totalOriginalCost > 0
    ? (unrealizedStandardizedPnL / totalOriginalCost) * 100
    : 0;

  return {
    holdings: standardizedHoldings,
    summary: {
      totalActualWeight: Number(totalActualWeight.toFixed(4)),
      totalEquivalentGrams24k: Number(totalEquivalentGrams24k.toFixed(4)),
      spotPrice24k,
      totalStandardizedValue: Number(totalStandardizedValue.toFixed(2)),
      totalStandardizedValueInPiastres: toPiastres(totalStandardizedValue),
      unrealizedStandardizedPnL: Number(unrealizedStandardizedPnL.toFixed(2)),
      standardizedPnLPercentage: Number(standardizedPnLPercentage.toFixed(2)),
    },
  };
}

module.exports = {
  to24kEquivalentGrams,
  standardizeGoldHoldings,
};
