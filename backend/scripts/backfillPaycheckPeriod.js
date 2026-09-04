const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

async function backfill() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
  const Paycheck = require('../models/Paycheck');

  const result = await Paycheck.updateMany(
    {
      $or: [
        { period: null },
        { period: '' },
        { period: { $exists: false } }
      ]
    },
    [{ $set: { period: '$month' } }]
  );

  console.log('Backfill result:', result);
  await mongoose.disconnect();
}

backfill().catch(err => {
  console.error(err);
  process.exit(1);
});
