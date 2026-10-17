// backend/migrations/20261015_210000_aud_perf_002_realign_expenditure_index.js
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const OLD_INDEX_NAME = 'user_1_date_-1__id_1';
const NEW_INDEX_NAME = 'user_1_date_-1__id_-1';

module.exports = {
  async up(db) {
    const collection = db.collection ? db.collection('expenditures') : db;
    const indexes = await collection.indexes();
    const indexNames = indexes.map((idx) => idx.name);

    // 1. Drop old misaligned index if present
    if (indexNames.includes(OLD_INDEX_NAME)) {
      console.log(`Dropping legacy index: ${OLD_INDEX_NAME}...`);
      await collection.dropIndex(OLD_INDEX_NAME);
      console.log(`Successfully dropped ${OLD_INDEX_NAME}.`);
    } else {
      console.log(`Legacy index ${OLD_INDEX_NAME} not found (already dropped).`);
    }

    // 2. Create aligned compound index if not present
    if (!indexNames.includes(NEW_INDEX_NAME)) {
      console.log(`Creating aligned compound index: ${NEW_INDEX_NAME}...`);
      await collection.createIndex(
        { user: 1, date: -1, _id: -1 },
        { name: NEW_INDEX_NAME, background: true }
      );
      console.log(`Successfully created ${NEW_INDEX_NAME}.`);
    } else {
      console.log(`Aligned index ${NEW_INDEX_NAME} already exists.`);
    }
  },

  async down(db) {
    const collection = db.collection ? db.collection('expenditures') : db;
    const indexes = await collection.indexes();
    const indexNames = indexes.map((idx) => idx.name);

    // 1. Drop aligned index if present
    if (indexNames.includes(NEW_INDEX_NAME)) {
      console.log(`Rolling back: Dropping index ${NEW_INDEX_NAME}...`);
      await collection.dropIndex(NEW_INDEX_NAME);
      console.log(`Successfully dropped ${NEW_INDEX_NAME}.`);
    }

    // 2. Recreate legacy index if not present
    if (!indexNames.includes(OLD_INDEX_NAME)) {
      console.log(`Rolling back: Recreating legacy index ${OLD_INDEX_NAME}...`);
      await collection.createIndex(
        { user: 1, date: -1, _id: 1 },
        { name: OLD_INDEX_NAME, background: true }
      );
      console.log(`Successfully restored ${OLD_INDEX_NAME}.`);
    }
  },
};

// Standalone execution support
if (require.main === module) {
  (async () => {
    try {
      const command = process.argv[2] || 'up';
      console.log(`Connecting to database for migration (${command})...`);
      await mongoose.connect(process.env.MONGO_URI);
      const db = mongoose.connection.db;

      if (command === 'down') {
        await module.exports.down(db);
      } else {
        await module.exports.up(db);
      }

      console.log(`Migration ${command} completed successfully.`);
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('Migration failed:', err);
      process.exit(1);
    }
  })();
}
