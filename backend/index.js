// Import the Express library
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Import the DB connection function

// Create an instance of an Express application
const app = express();

// Connect to Database
connectDB();

// This enables CORS for all routes, allowing our frontend to make requests
app.use(cors()); 
// This allows us to accept JSON data in the body of requests
app.use(express.json()); 

// Define a simple test route
app.get('/', (req, res) => res.send('API Running'));

//ROUTES
app.use('/api/paychecks', require('./routes/paychecks'));
app.use('/api/salary-profile', require('./routes/salaryProfiles'));
app.use('/api/social-insurance', require('./routes/socialInsurance'));
app.use('/api/tax-brackets', require('./routes/taxBrackets'));
app.use('/api/expenditures', require('./routes/expenditures'));
app.use('/api/trades', require('./routes/trade'));
app.use('/api/mutual-funds', require('./routes/mutualFundTrades'));
app.use('/api/golds', require('./routes/golds'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/auth', require('./routes/auth'));

// Export the Express API
module.exports = app;