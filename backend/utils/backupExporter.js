// backend/utils/backupExporter.js
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const { EJSON } = require('bson');
const { BadRequestError } = require('./errors');

const MAX_BACKUP_ROWS = 100000;

// Whitelist of collections to export (all lowercase)
const COLLECTIONS_TO_EXPORT = [
  'expenditures',
  'trades',
  'mutualfundtrades',
  'golds',
  'certificates',
  'currencies',
  'creditcards',
  'cardtransactions',
  'cardpayments',
  'paychecks',
  'salaryprofiles',
  'taxbrackets',
  'socialinsurances',
  'users',
  'budgets',
  'categorizationrules',
  'recurringsuggestions',
  'realestates',
  'forexratehistories',
  'corporateactions',
  'rebalancingtargets',
  'debtpayoffplans',
];

// Security-critical collections that must NEVER be exported or imported
const BLOCKED_COLLECTIONS = ['refreshtokens', 'loginaudits'];

// Global/system collections that do not have a per-user `user` field
const SYSTEM_COLLECTIONS = ['taxbrackets', 'socialinsurances', 'currencies', 'forexratehistories'];

/**
 * Calculates total row count across all exportable collections and verifies limit
 */
async function verifyBackupRowLimit(db, filterUserId = null) {
  let totalRows = 0;
  for (const collName of COLLECTIONS_TO_EXPORT) {
    const coll = db.collection(collName);
    const filter = {};
    if (filterUserId && !SYSTEM_COLLECTIONS.includes(collName)) {
      filter.user = new mongoose.Types.ObjectId(filterUserId);
    }
    const count = await coll.countDocuments(filter);
    totalRows += count;
  }

  if (totalRows > MAX_BACKUP_ROWS) {
    throw new BadRequestError(
      `Backup exceeds maximum export threshold of ${MAX_BACKUP_ROWS} rows. (Total records: ${totalRows})`
    );
  }
  return totalRows;
}

/**
 * Normalizes document for human-readable XLSX export
 */
function normalizeForXlsx(doc) {
  const clean = {};
  for (const [key, value] of Object.entries(doc)) {
    if (value === null || value === undefined) {
      clean[key] = '';
    } else if (value instanceof Date) {
      clean[key] = value.toISOString();
    } else if (value && typeof value === 'object') {
      if (value._bsontype === 'ObjectID' || value instanceof mongoose.Types.ObjectId) {
        clean[key] = value.toString();
      } else {
        clean[key] = JSON.stringify(value);
      }
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Builds an EJSON-serialized buffer preserving all MongoDB BSON types (ObjectIds, Dates)
 */
async function buildEjsonBackup(userId = null) {
  const db = mongoose.connection.db;
  await verifyBackupRowLimit(db, userId);

  const backupData = {};

  for (const collName of COLLECTIONS_TO_EXPORT) {
    const coll = db.collection(collName);
    const filter = {};
    if (userId && !SYSTEM_COLLECTIONS.includes(collName)) {
      filter.user = new mongoose.Types.ObjectId(userId);
    }
    const docs = await coll.find(filter).toArray();
    backupData[collName] = docs;
  }

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: backupData,
  };

  const jsonString = EJSON.stringify(payload, { relaxed: false });
  return Buffer.from(jsonString, 'utf-8');
}

/**
 * Builds an XLSX multi-sheet workbook buffer for human inspection
 */
async function buildXlsxBackup(userId = null) {
  const db = mongoose.connection.db;
  await verifyBackupRowLimit(db, userId);

  const workbook = XLSX.utils.book_new();

  for (const collName of COLLECTIONS_TO_EXPORT) {
    const coll = db.collection(collName);
    const filter = {};
    if (userId && !SYSTEM_COLLECTIONS.includes(collName)) {
      filter.user = new mongoose.Types.ObjectId(userId);
    }
    const docs = await coll.find(filter).toArray();
    const cleanDocs = docs.map(normalizeForXlsx);
    const sheet = XLSX.utils.json_to_sheet(cleanDocs);
    XLSX.utils.book_append_sheet(workbook, sheet, collName);
  }

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = {
  COLLECTIONS_TO_EXPORT,
  BLOCKED_COLLECTIONS,
  SYSTEM_COLLECTIONS,
  MAX_BACKUP_ROWS,
  verifyBackupRowLimit,
  buildEjsonBackup,
  buildXlsxBackup,
};
