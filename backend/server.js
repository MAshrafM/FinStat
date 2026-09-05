// backend/server.js
// Import the Express library
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db'); // Import the DB connection function
const errorHandler = require('./middleware/errorHandler');
const { NotFoundError } = require('./utils/errors');
const { seedDefaultTaxAndInsurance } = require('./utils/seedTaxAndInsurance');

// Connect to Database and auto-seed defaults
connectDB().then(() => {
  seedDefaultTaxAndInsurance();
}).catch(() => {});

// Create an instance of an Express application
const app = express();

// This enables CORS for all routes, allowing our frontend to make requests
app.use(cors({
  origin: true,
  credentials: true
}));
// This allows us to accept JSON data in the body of requests
app.use(express.json());
// Parse cookies for refresh token handling
app.use(cookieParser()); 

// Define a simple test route
app.get('/', (req, res) => res.send('API Running'));

// ROUTES
app.use('/api/users', require('./routes/users'));
app.use('/api/paychecks', require('./routes/paychecks'));
app.use('/api/salary-profiles', require('./routes/salaryProfiles'));
app.use('/api/salary-profile', require('./routes/salaryProfiles')); // backward compatible route
app.use('/api/social-insurance', require('./routes/socialInsurance'));
app.use('/api/tax-brackets', require('./routes/taxBrackets'));
app.use('/api/expenditures', require('./routes/expenditures'));
app.use('/api/trades', require('./routes/trade'));
app.use('/api/mutual-funds', require('./routes/mutualFundTrades'));
app.use('/api/golds', require('./routes/golds'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/currency', require('./routes/currency'));
app.use('/api/credit-cards', require('./routes/creditCards'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/real-estates', require('./routes/realEstates'));
app.use('/api/categorization-rules', require('./routes/categorizationRules'));
app.use('/api/recurring-suggestions', require('./routes/recurringSuggestions'));
app.use('/api/budgets', require('./routes/budgets'));

// 404 handler specifically scoped to unmatched /api routes
app.use('/api', (req, res, next) => {
  next(new NotFoundError(`API endpoint ${req.originalUrl} not found`));
});

// Centralized error handling middleware (must be registered after all routes)
app.use(errorHandler);

// Define the port the server will run on (local execution only)
if (require.main === module) {
  const { initRecurringCron } = require('./jobs/recurringJob');
  initRecurringCron();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
