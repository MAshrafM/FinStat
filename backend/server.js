// Import the Express library
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Import the DB connection function

// Connect to Database
connectDB();
// Create an instance of an Express application
const app = express();

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

// Define the port the server will run on. 
// We use 5000 for the backend to avoid conflict with the React frontend (which usually runs on 3000)
const PORT = process.env.PORT || 5000;

// Start the server and make it listen for incoming requests on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}` );
});
