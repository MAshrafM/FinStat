// backend/utils/seedTaxAndInsurance.js
const TaxBracket = require('../models/TaxBracket');
const SocialInsurance = require('../models/SocialInsurance');

// Egyptian Tax Law No. 91/2005 as amended by Law 30/2023, Law 175/2023, and Law 7/2024
const defaultEgyptianTaxBrackets = [
  { level: 1, from: 0, to: 40000, rate: 0 },
  { level: 2, from: 40000, to: 55000, rate: 10 },
  { level: 3, from: 55000, to: 70000, rate: 15 },
  { level: 4, from: 70000, to: 200000, rate: 20 },
  { level: 5, from: 200000, to: 400000, rate: 22.5 },
  { level: 6, from: 400000, to: 1200000, rate: 25 },
  { level: 7, from: 1200000, to: 1000000000, rate: 27.5 },
];

const defaultTaxBrackets = [
  {
    country: 'Egypt',
    year: 2024,
    personalExemption: 20000,
    isActive: true,
    brackets: defaultEgyptianTaxBrackets,
  },
  {
    country: 'Egypt',
    year: 2025,
    personalExemption: 20000,
    isActive: true,
    brackets: defaultEgyptianTaxBrackets,
  },
  {
    country: 'Egypt',
    year: 2026,
    personalExemption: 20000,
    isActive: true,
    brackets: defaultEgyptianTaxBrackets,
  },
  {
    country: 'Egypt',
    year: 2027,
    personalExemption: 20000,
    isActive: true,
    brackets: defaultEgyptianTaxBrackets,
  },
];

// Law 148/2019: Min/Max insurable wage increases by 15% annually on Jan 1st for 7 years (2020-2027)
const defaultSocialInsurance = [
  {
    country: 'Egypt',
    year: 2024,
    employeeShare: 11,
    employerShare: 18.75,
    maxInsurableIncome: 12600,
    minInsurableIncome: 2000,
    isActive: true,
  },
  {
    country: 'Egypt',
    year: 2025,
    employeeShare: 11,
    employerShare: 18.75,
    maxInsurableIncome: 14500,
    minInsurableIncome: 2300,
    isActive: true,
  },
  {
    country: 'Egypt',
    year: 2026,
    employeeShare: 11,
    employerShare: 18.75,
    maxInsurableIncome: 16700, // 14,500 * 1.15 = 16,675 rounded to 16,700
    minInsurableIncome: 2700,  // 2,300 * 1.15 = 2,645 rounded to 2,700
    isActive: true,
  },
  {
    country: 'Egypt',
    year: 2027,
    employeeShare: 11,
    employerShare: 18.75,
    maxInsurableIncome: 19200, // 16,700 * 1.15 = 19,205 rounded to 19,200
    minInsurableIncome: 3100,  // 2,700 * 1.15 = 3,105 rounded to 3,100
    isActive: true,
  },
];

async function seedDefaultTaxAndInsurance() {
  try {
    // Drop legacy identifier_1 index if present from older versions
    try {
      if (TaxBracket.collection) {
        const indexes = await TaxBracket.collection.indexes();
        if (indexes.some(idx => idx.name === 'identifier_1')) {
          await TaxBracket.collection.dropIndex('identifier_1');
        }
      }
    } catch (ignoredIndexErr) {}

    for (const tb of defaultTaxBrackets) {
      const existing = await TaxBracket.findOne({ year: tb.year, country: tb.country });
      if (!existing) {
        await TaxBracket.create(tb);
      }
    }

    for (const si of defaultSocialInsurance) {
      const existing = await SocialInsurance.findOne({ year: si.year, country: si.country, user: null });
      if (!existing) {
        await SocialInsurance.create(si);
      }
    }
  } catch (err) {
    console.warn('Auto-seed tax and insurance notice:', err.message);
  }
}

module.exports = {
  defaultTaxBrackets,
  defaultSocialInsurance,
  seedDefaultTaxAndInsurance,
};
