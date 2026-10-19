// backend/server.js
const { validateEnv } = require('./config/envValidator');
// Validate startup environment variables
if (process.env.NODE_ENV !== 'test') {
  validateEnv();
}

// Import the Express library
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db'); // Import the DB connection function
const errorHandler = require('./middleware/errorHandler');
const { NotFoundError } = require('./utils/errors');
const { seedDefaultTaxAndInsurance } = require('./utils/seedTaxAndInsurance');

// Create an instance of an Express application
const app = express();

// Trust reverse proxy (Vercel / Nginx) for accurate client IP resolution in rate limiting
app.set('trust proxy', 1);

// Mount Helmet security headers (disabling CORP to permit cross-origin assets if needed)
app.use(helmet({ crossOriginResourcePolicy: false }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

if (process.env.NODE_ENV !== 'production') {
  ['http://localhost:3000', 'http://127.0.0.1:3000'].forEach((devOrigin) => {
    if (!allowedOrigins.includes(devOrigin)) allowedOrigins.push(devOrigin);
  });
}

// Strict CORS: restrict origins from dynamic reflection with credentials to authorized domains
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
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
app.use('/api/corporate-actions', require('./routes/corporateActions'));
app.use('/api/mutual-funds', require('./routes/mutualFundTrades'));
app.use('/api/golds', require('./routes/golds'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/currency', require('./routes/currency'));
app.use('/api/credit-cards', require('./routes/creditCards'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/backup', require('./routes/backup'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/real-estates', require('./routes/realEstates'));
app.use('/api/categorization-rules', require('./routes/categorizationRules'));
app.use('/api/recurring-suggestions', require('./routes/recurringSuggestions'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/debt-payoff', require('./routes/debtPayoff'));
app.use('/api/jobs', require('./routes/jobs'));

// 404 handler specifically scoped to unmatched /api routes
app.use('/api', (req, res, next) => {
  next(new NotFoundError(`API endpoint ${req.originalUrl} not found`));
});

// Centralized error handling middleware (must be registered after all routes)
app.use(errorHandler);

// Server startup orchestration with fail-fast database connection
async function startServer() {
  try {
    await connectDB();
    await seedDefaultTaxAndInsurance();

    if (require.main === module) {
      const { initRecurringCron } = require('./jobs/recurringJob');
      initRecurringCron();

      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
      });
    }
  } catch (err) {
    console.error('FATAL: Database connection failed during startup:', err);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw err;
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
