// backend/seeder.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const csv = require('csv-parser');

// Load env vars
dotenv.config();

// Load models
const Expenditure = require('./models/Expenditure'); // Make sure to use the correct model

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const results = [];

// --- SCRIPT CONFIGURATION ---
const CSV_FILE_PATH = path.join(__dirname, 'db-seed-ex.csv'); // Change this to your CSV file path
const MODEL_TO_SEED = Expenditure;

// --- MAIN ASYNC FUNCTION ---
const seedData = async () => {
  try {
    // 1. Read all data from the CSV into an array first
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv({
          mapHeaders: ({ header }) => header.trim() // Trim headers to avoid whitespace issues
        }))
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`Read ${results.length} records from CSV.`);

    // 2. Delete existing data in the collection
    console.log('Destroying existing data...');
    await MODEL_TO_SEED.deleteMany();
    console.log('Data Destroyed.');

    // 3. Insert data sequentially using a for...of loop with await
    console.log('Seeding data sequentially...');
    let count = 0;
    for (const record of results) {
      // Here you can transform the data if needed
      // For example, converting date format from MM/DD/YYYY to a proper Date object
      //const [day, month, year] = record.date.split('-');
      const formattedRecord = {
        ...record,
        date: new Date(record.date),
        bank: Number(record.bank),
        cash: Number(record.cash),
      };

      const doc = new MODEL_TO_SEED(formattedRecord);
      await doc.save(); // This 'await' is the key. The loop pauses here until this is done.
      count++;
      console.log(`Inserted record ${count}/${results.length}`);
    }

    console.log('✅ Data successfully seeded in order!');
    process.exit();
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
};

// --- RUN THE SCRIPT ---
seedData();
