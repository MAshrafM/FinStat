// backend/config/verifyTransactionSupport.js
const mongoose = require('mongoose');

/**
 * Pre-flight verification that the active MongoDB connection supports multi-document ACID transactions.
 * Supported topologies: Replica Set (setName) or Sharded Cluster / mongos (isdbgrid).
 * Standalone mongod instances fail with a fatal actionable startup message.
 *
 * @param {Object} mongooseInstance - Mongoose instance to verify (defaults to global mongoose)
 * @returns {Promise<Object>} hello or ismaster command response
 */
async function verifyTransactionSupport(mongooseInstance = mongoose) {
  try {
    const admin = mongooseInstance.connection.db.admin();
    const hello = await admin.command({ hello: 1 });
    const supportsTransactions = Boolean(hello.setName || hello.msg === 'isdbgrid');

    if (!supportsTransactions) {
      throw new Error(
        "FATAL: Multi-document ACID transactions require a replica set or sharded cluster. " +
        "Run 'mongod --replSet rs0 && rs.initiate()' locally, or connect to MongoDB Atlas."
      );
    }

    return hello;
  } catch (err) {
    if (err.message && err.message.includes('FATAL: Multi-document ACID transactions')) {
      throw err;
    }

    // Only retry with ismaster on pre-5.0 MongoDB servers (CommandNotFound code 59)
    if (err.code !== 59 && !err.message?.includes('no such command')) {
      throw err; // Network or auth error — do not retry
    }

    try {
      const isMaster = await mongooseInstance.connection.db.admin().command({ ismaster: 1 });
      const supports = Boolean(isMaster.setName || isMaster.msg === 'isdbgrid');

      if (!supports) {
        throw new Error(
          "FATAL: Multi-document ACID transactions require a replica set or sharded cluster. " +
          "Run 'mongod --replSet rs0 && rs.initiate()' locally, or connect to MongoDB Atlas."
        );
      }

      return isMaster;
    } catch (fallbackErr) {
      if (fallbackErr.message && fallbackErr.message.includes('FATAL: Multi-document ACID transactions')) {
        throw fallbackErr;
      }

      const error = new Error(
        `FATAL: Failed to verify transaction support. hello: ${err.message}; ismaster: ${fallbackErr.message}`
      );
      error.cause = { helloError: err, ismasterError: fallbackErr };
      throw error;
    }
  }
}

module.exports = {
  verifyTransactionSupport,
};
