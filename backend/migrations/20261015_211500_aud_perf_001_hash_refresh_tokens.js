// backend/migrations/20261015_211500_aud_perf_001_hash_refresh_tokens.js
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const TOKEN_HASH_INDEX_NAME = 'tokenHash_1';

module.exports = {
  async up(db) {
    const collection = db.collection ? db.collection('refreshtokens') : db;

    // 1. Purge legacy bcrypt refresh tokens (Breaking change: users must re-login)
    console.log('Purging legacy unindexed bcrypt refresh tokens...');
    const deleteResult = await collection.deleteMany({});
    console.log(`Purged ${deleteResult.deletedCount || 0} legacy refresh token records.`);

    // 2. Create unique sparse/strict index on tokenHash
    const indexes = await collection.indexes();
    const indexNames = indexes.map((idx) => idx.name);

    if (!indexNames.includes(TOKEN_HASH_INDEX_NAME)) {
      console.log(`Creating unique index: ${TOKEN_HASH_INDEX_NAME}...`);
      await collection.createIndex(
        { tokenHash: 1 },
        { name: TOKEN_HASH_INDEX_NAME, unique: true, background: true }
      );
      console.log(`Successfully created ${TOKEN_HASH_INDEX_NAME}.`);
    } else {
      console.log(`Index ${TOKEN_HASH_INDEX_NAME} already exists.`);
    }
  },

  async down(db) {
    const collection = db.collection ? db.collection('refreshtokens') : db;
    const indexes = await collection.indexes();
    const indexNames = indexes.map((idx) => idx.name);

    if (indexNames.includes(TOKEN_HASH_INDEX_NAME)) {
      console.log(`Rolling back: Dropping index ${TOKEN_HASH_INDEX_NAME}...`);
      await collection.dropIndex(TOKEN_HASH_INDEX_NAME);
      console.log(`Successfully dropped ${TOKEN_HASH_INDEX_NAME}.`);
    }
  },
};
