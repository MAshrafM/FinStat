// migration.js
const mongoose = require('mongoose');
require('dotenv').config(); // To access environment variables like MONGO_URI
const User = require('./models/User');
const Certificate = require('./models/Certificate');
const Expenditure = require('./models/Expenditure');
const Gold = require('./models/Gold');
const MutualFundTrade = require('./models/MutualFundTrade');
const Paycheck = require('./models/Paycheck');
const SalaryProfile = require('./models/SalaryProfile');
const SocialInsurance = require('./models/SocialInsurance');
const Trade = require('./models/Trade');
// ... import all your models

// Make sure to connect to your database

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding...');
  } catch (err) {
    console.error(`Error connecting to DB: ${err.message}`);
    process.exit(1);
  }
};

async function migrateData() {
    await connectDB();
  try {
    // Get your user
    const user = await User.findOne(); // or find by specific criteria
    console.log(user)
    
    if (!user) {
      console.log('No user found');
      return;
    }

    // Update all existing records in each collection
    await Certificate.updateMany(
      { user: { $exists: false } }, // only update records without userId
      { user: user._id }
    );

    await Expenditure.updateMany(
      { user: { $exists: false } },
      { user: user._id }
    );

    await Gold.updateMany(
      { user: { $exists: false } },
      { user: user._id }
    );

    await MutualFundTrade.updateMany(
      { user: { $exists: false } },
      { user: user._id }
    );

    await Paycheck.updateMany(
      { user: { $exists: false } },
      { user: user._id }
    );

    await SalaryProfile.updateMany(
      { user: { $exists: false } },
      { user: user._id }
    );

    await SocialInsurance.updateMany(
      { user: { $exists: false } },
      { user: user._id }
    );


    await Trade.updateMany(
      { user: { $exists: false } },
      { user: user._id }
    );


    console.log('Data migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateData();