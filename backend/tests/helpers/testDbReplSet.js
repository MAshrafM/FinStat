const fs = require('fs');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

let replSet = null;

// Auto-detect local mongod installation on Windows to avoid heavy downloads
const defaultWindowsBinary = 'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe';
const systemBinary = process.env.MONGOMS_SYSTEM_BINARY || (fs.existsSync(defaultWindowsBinary) ? defaultWindowsBinary : undefined);

/**
 * Connect to an in-memory single-node MongoDB Replica Set instance.
 * Supports multi-document ACID transactions with minimal overhead.
 */
async function connect() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  const replSetOptions = {
    replSet: {
      count: 1,
      storageEngine: 'wiredTiger',
    },
  };

  if (systemBinary) {
    replSetOptions.binary = { systemBinary };
  }

  replSet = await MongoMemoryReplSet.create(replSetOptions);
  const uri = replSet.getUri();

  await mongoose.connect(uri, {
    autoIndex: true,
  });

  return uri;
}

/**
 * Clear all database collections between tests
 */
async function clearDatabase() {
  if (mongoose.connection.readyState !== 1) return;
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
}

/**
 * Disconnect and stop the in-memory Replica Set instance
 */
async function closeDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (replSet) {
    await replSet.stop();
    replSet = null;
  }
}

module.exports = {
  connect,
  clearDatabase,
  closeDatabase,
};
