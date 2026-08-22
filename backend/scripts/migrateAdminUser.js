// backend/scripts/migrateAdminUser.js
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');
require('dotenv').config();

const migrateAdminUser = async () => {
  try {
    await connectDB();
    console.log('Connected to DB for migration...');

    // Find all users where role is not admin, or find the single existing user
    const users = await User.find({});
    console.log(`Found ${users.length} user(s).`);

    if (users.length > 0) {
      // Update all existing users or the primary user to admin
      const result = await User.updateMany(
        { $or: [{ role: { $exists: false } }, { role: 'viewer' }, { role: null }] },
        { $set: { role: 'admin', managedBy: null } }
      );
      console.log(`Updated user(s) to 'admin' role:`, result);
    } else {
      console.log('No existing users found to migrate.');
    }

    console.log('Admin migration complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

if (require.main === module) {
  migrateAdminUser();
}

module.exports = migrateAdminUser;
