// backend/utils/backupImporter.js
const mongoose = require('mongoose');
const { EJSON } = require('bson');
const { BadRequestError } = require('./errors');
const { COLLECTIONS_TO_EXPORT, BLOCKED_COLLECTIONS } = require('./backupExporter');

/**
 * Detects whether the current MongoDB deployment supports multi-document transactions
 */
async function detectTransactionSupport() {
  if (mongoose.connection._supportsTransactions !== undefined) {
    return mongoose.connection._supportsTransactions;
  }
  try {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    const supported = Boolean(hello.setName || hello.msg === 'isdbgrid');
    mongoose.connection._supportsTransactions = supported;
    return supported;
  } catch {
    mongoose.connection._supportsTransactions = false;
    return false;
  }
}

/**
 * Drops stale _pre_restore_* temporary collections older than 24 hours
 */
async function cleanupStaleRestoreCollections(db) {
  try {
    const collections = await db.listCollections().toArray();
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    for (const coll of collections) {
      if (coll.name.includes('_pre_restore_')) {
        const parts = coll.name.split('_pre_restore_');
        const timestamp = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(timestamp) && timestamp < oneDayAgo) {
          await db.collection(coll.name).drop().catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn('[backup-import] Failed to clean up stale restore collections:', err.message);
  }
}

/**
 * Parses and validates raw upload buffer
 */
function parseAndValidateBackupBuffer(fileBuffer) {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new BadRequestError('Uploaded backup file is empty');
  }

  // Content sniffing: verify first non-whitespace byte is ASCII '{' (0x7b)
  let firstByte = fileBuffer[0];
  let offset = 0;
  while (offset < fileBuffer.length && (fileBuffer[offset] === 0x20 || fileBuffer[offset] === 0x09 || fileBuffer[offset] === 0x0a || fileBuffer[offset] === 0x0d)) {
    offset++;
  }
  if (offset >= fileBuffer.length || fileBuffer[offset] !== 0x7b) {
    throw new BadRequestError(
      'Import requires EJSON format. Please use "Export → JSON" and upload the .json file, not the .xlsx file.'
    );
  }

  let parsed;
  try {
    const jsonString = fileBuffer.toString('utf-8');
    parsed = EJSON.parse(jsonString);
  } catch (err) {
    throw new BadRequestError(`Invalid JSON/EJSON structure: ${err.message}`);
  }

  if (!parsed || typeof parsed !== 'object' || !parsed.version || !parsed.data || typeof parsed.data !== 'object') {
    throw new BadRequestError('Invalid backup format. Expected { version, exportedAt, data }.');
  }

  return parsed;
}

/**
 * Normalizes collection keys and validates against whitelist and blocklist
 */
function normalizeAndValidateCollections(parsedData, allowUsers = false) {
  const normalizedData = {};

  for (const [rawKey, docs] of Object.entries(parsedData)) {
    const key = rawKey.toLowerCase();

    if (BLOCKED_COLLECTIONS.includes(key)) {
      throw new BadRequestError(
        `Backup contains a blocked collection: "${rawKey}". Refusing to import.`
      );
    }

    if (!COLLECTIONS_TO_EXPORT.includes(key)) {
      throw new BadRequestError(
        `Unknown collection in backup: "${rawKey}". Aborting to prevent data corruption.`
      );
    }

    if (!Array.isArray(docs)) {
      throw new BadRequestError(
        `Invalid data format for collection "${rawKey}". Expected an array of documents.`
      );
    }

    normalizedData[key] = docs;
  }

  // Option C: if allowUsers is not explicitly true, omit users collection
  if (!allowUsers && normalizedData.users) {
    delete normalizedData.users;
  }

  return normalizedData;
}

/**
 * Core import engine restoring collections from EJSON backup
 */
async function importBackupBuffer(fileBuffer, { dryRun = false, allowUsers = false, userId = null } = {}) {
  const db = mongoose.connection.db;
  const parsed = parseAndValidateBackupBuffer(fileBuffer);
  const normalizedData = normalizeAndValidateCollections(parsed.data, allowUsers);

  // Clean up stale pre-restore backup collections
  await cleanupStaleRestoreCollections(db);

  const report = {};
  for (const [collName, docs] of Object.entries(normalizedData)) {
    const currentCount = await db.collection(collName).countDocuments();
    report[collName] = {
      willDelete: currentCount,
      willInsert: docs.length,
    };
  }

  if (dryRun) {
    return {
      dryRun: true,
      allowUsers: Boolean(allowUsers),
      collections: report,
    };
  }

  const timestamp = Date.now();
  const supportsTransactions = await detectTransactionSupport();

  console.info(
    '[backup-import]',
    JSON.stringify({
      userId,
      timestamp: new Date().toISOString(),
      transactionSupport: supportsTransactions,
      collections: Object.keys(normalizedData),
      allowUsers: Boolean(allowUsers),
    })
  );

  if (supportsTransactions) {
    // ----------------------------------------------------
    // Replica Set Path: ACID Transaction
    // ----------------------------------------------------
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const [collName, docs] of Object.entries(normalizedData)) {
          const coll = db.collection(collName);
          await coll.deleteMany({}, { session });
          if (docs.length > 0) {
            await coll.insertMany(docs, { session, ordered: true });
          }
        }
      });
    } finally {
      await session.endSession();
    }
  } else {
    // ----------------------------------------------------
    // Standalone Fallback: Staging Swap with Index Preservation
    // ----------------------------------------------------
    const modifiedCollections = [];

    try {
      for (const [collName, docs] of Object.entries(normalizedData)) {
        const coll = db.collection(collName);
        const tempRestoreName = `${collName}_restore_${timestamp}`;
        const preRestoreBackupName = `${collName}_pre_restore_${timestamp}`;

        // 1. Capture existing indexes before swap (excluding default _id_)
        let originalIndexes = [];
        try {
          originalIndexes = (await coll.indexes()).filter((i) => i.name !== '_id_');
        } catch {
          originalIndexes = [];
        }

        // 2. Stage documents into temp collection
        const tempColl = db.collection(tempRestoreName);
        if (docs.length > 0) {
          await tempColl.insertMany(docs);
        }

        // 3. Rename active to backup
        let hasActiveCollection = true;
        try {
          await coll.rename(preRestoreBackupName);
        } catch {
          hasActiveCollection = false;
        }

        // 4. Rename temp to active
        await tempColl.rename(collName);

        // 5. Recreate captured indexes on new active collection
        for (const idx of originalIndexes) {
          try {
            const options = {};
            if (idx.unique) options.unique = true;
            if (idx.sparse) options.sparse = true;
            if (idx.name) options.name = idx.name;
            await coll.createIndex(idx.key, options);
          } catch (idxErr) {
            console.warn(`[backup-import] Could not recreate index ${idx.name} on ${collName}:`, idxErr.message);
          }
        }

        modifiedCollections.push({ collName, preRestoreBackupName, hasActiveCollection });
      }

      // Drop pre-restore backups after full success
      for (const mod of modifiedCollections) {
        if (mod.hasActiveCollection) {
          await db.collection(mod.preRestoreBackupName).drop().catch(() => {});
        }
      }
    } catch (swapErr) {
      // Rollback staging swap on failure
      for (const mod of modifiedCollections) {
        try {
          await db.collection(mod.collName).drop().catch(() => {});
          if (mod.hasActiveCollection) {
            await db.collection(mod.preRestoreBackupName).rename(mod.collName);
          }
        } catch (rollbackErr) {
          console.error(`[backup-import] FATAL: Staging rollback failed for ${mod.collName}:`, rollbackErr);
        }
      }
      throw swapErr;
    }
  }

  return {
    success: true,
    dryRun: false,
    allowUsers: Boolean(allowUsers),
    collections: report,
  };
}

module.exports = {
  detectTransactionSupport,
  parseAndValidateBackupBuffer,
  normalizeAndValidateCollections,
  importBackupBuffer,
};
