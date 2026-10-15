const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

// Auto-detect local mongod installation on Windows to avoid heavy downloads
const defaultWindowsBinary = 'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe';
const systemBinary = process.env.MONGOMS_SYSTEM_BINARY || (fs.existsSync(defaultWindowsBinary) ? defaultWindowsBinary : undefined);

/**
 * Connect to an in-memory MongoDB instance
 */
async function connect() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  const options = {};
  if (systemBinary) {
    options.binary = { systemBinary };
  }

  mongod = await MongoMemoryServer.create(options);
  const uri = mongod.getUri();

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
 * Disconnect and stop the in-memory MongoDB instance
 */
async function closeDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}

module.exports = {
  connect,
  clearDatabase,
  closeDatabase,
};
