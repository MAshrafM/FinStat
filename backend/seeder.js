// backend/seeder.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const csv = require('csv-parser');
require('dotenv').config(); // To access environment variables like MONGO_URI

// Import the Mongoose model
const Paycheck = require('./models/Paycheck');

// --- DATABASE CONNECTION ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding...');
  } catch (err) {
    console.error(`Error connecting to DB: ${err.message}`);
    process.exit(1);
  }
};

// --- MAIN SEEDER FUNCTION ---
const seedDatabase = async () => {
  await connectDB();

  try {
    // 1. DELETE all existing data
    console.log('Clearing the Paychecks collection...');
    await Paycheck.deleteMany({});
    console.log('Paychecks collection cleared.');

    // 2. READ the CSV file and INSERT new data
    const results = [];
    const filePath = path.join(__dirname, 'db-seed.csv');

    console.log(`Reading data from ${filePath}...`);

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Ensure amount is treated as a number
        data.amount = parseFloat(data.amount);
        results.push(data);
      })
      .on('end', async () => {
        try {
          console.log(`Inserting ${results.length} records...`);
          await Paycheck.insertMany(results);
          console.log('✅ Data successfully seeded!');
          mongoose.connection.close();
          process.exit(0);
        } catch (insertErr) {
          console.error(`Error inserting data: ${insertErr.message}`);
          mongoose.connection.close();
          process.exit(1);
        }
      });
  } catch (err) {
    console.error(`Seeder script failed: ${err.message}`);
    mongoose.connection.close();
    process.exit(1);
  }
};

// --- RUN THE SCRIPT ---
seedDatabase();
