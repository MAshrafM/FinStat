// backend/migrate-categories.js
const mongoose = require('mongoose');
require('dotenv').config();
const Expenditure = require('./models/Expenditure');
const { EXPENDITURE_CATEGORIES } = require('./constants/categories');

const connectAndMigrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Category Migration...');

    const expenditures = await Expenditure.find();
    console.log(`Found ${expenditures.length} expenditure logs to categorize.`);

    const categoryCounts = {};
    EXPENDITURE_CATEGORIES.forEach(c => {
      categoryCounts[c.name] = 0;
    });

    const bulkOps = [];

    for (const doc of expenditures) {
      const desc = (doc.description || '').toLowerCase();
      const matchedCategories = [];

      for (const cat of EXPENDITURE_CATEGORIES) {
        if (cat.name === 'Other') continue;
        
        const hasKeywordMatch = cat.keywords.some(keyword => {
          const regex = new RegExp(`\\b${keyword}\\b|${keyword}`, 'i');
          return regex.test(desc);
        });

        if (hasKeywordMatch) {
          matchedCategories.push(cat.name);
        }
      }

      if (matchedCategories.length === 0) {
        matchedCategories.push('Other');
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { categories: matchedCategories } }
        }
      });

      // Track counts
      matchedCategories.forEach(name => {
        categoryCounts[name] = (categoryCounts[name] || 0) + 1;
      });
    }

    if (bulkOps.length > 0) {
      console.log(`Executing bulkWrite for ${bulkOps.length} operations...`);
      const result = await Expenditure.bulkWrite(bulkOps);
      console.log(`Bulk write completed. Modified: ${result.modifiedCount || result.nModified || result.ok} records.`);
    }

    console.log('\n--- Migration Summary ---');
    console.log('Category breakdown (multiple categories counted individually):');
    Object.keys(categoryCounts).forEach(cat => {
      console.log(`- ${cat}: ${categoryCounts[cat]} logs`);
    });

    mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
};

connectAndMigrate();
