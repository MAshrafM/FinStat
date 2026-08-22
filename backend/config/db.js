// backend/config/db.js
const mongoose = require('mongoose');
require('dotenv').config();

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!cached.promise || mongoose.connection.readyState === 0) {
    const opts = {
      maxPoolSize: process.env.NODE_ENV === 'production' ? 1 : 10,
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

module.exports = connectDB;
