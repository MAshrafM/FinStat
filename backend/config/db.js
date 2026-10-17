// backend/config/db.js
const mongoose = require('mongoose');
require('dotenv').config();

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const parsePoolSize = (rawVal) => {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;
  const defaultVal = isProd ? 1 : 10;
  if (!rawVal) return defaultVal;

  const parsed = parseInt(rawVal, 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 100) {
    console.warn(`[Config] Invalid MONGO_MAX_POOL_SIZE "${rawVal}". Defaulting to ${defaultVal}.`);
    return defaultVal;
  }
  return parsed;
};

const connectDB = async () => {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!cached.promise || mongoose.connection.readyState === 0) {
    const opts = {
      maxPoolSize: parsePoolSize(process.env.MONGO_MAX_POOL_SIZE),
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongooseInstance) => {
      console.log('MongoDB Connected...');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    console.error('MongoDB connection error:', err.message);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw err;
  }

  return cached.conn;
};

connectDB.parsePoolSize = parsePoolSize;

module.exports = connectDB;
