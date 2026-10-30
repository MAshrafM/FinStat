// backend/routes/export.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const MAX_EXPORT_ROWS = parseInt(process.env.MAX_EXPORT_ROWS, 10) || 10000;
const auth = require('../middleware/auth');
const Expenditure = require('../models/Expenditure');
const Trade = require('../models/Trade');

/**
 * Bulk Export Rate Limiter:
 * Max 5 exports per 15 minutes per authenticated user.
 */
const exportRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  keyGenerator: (req) => (req.user && req.user.id ? req.user.id : req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  message: {
    error: 'Too many export requests. Please wait 15 minutes before exporting again.',
  },
  skip: (req) => process.env.DISABLE_RATE_LIMIT === 'true',
});

/**
 * Escapes values for safe CSV formatting.
 */
function escapeCsvValue(val) {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) return val.toISOString();
  const str = String(val);
  if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * @route   GET /api/export/expenditures
 * @desc    Stream user expenditures as JSON or CSV (max 5,000 rows)
 * @access  Private
 */
router.get('/expenditures', auth, exportRateLimiter, async (req, res) => {
  try {
    const { format = 'json', startDate, endDate, category } = req.query;

    const query = { user: req.user.id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (category) {
      query.category = category;
    }

    const count = await Expenditure.countDocuments(query);
    if (count > MAX_EXPORT_ROWS) {
      return res.status(400).json({
        error: `Export exceeds maximum limit of ${MAX_EXPORT_ROWS} rows (found ${count}). Please narrow your query filter.`,
      });
    }

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="expenditures-export.csv"');

      res.write('id,date,category,transactionValue,transactionType,description,bank,cash,prepaid\n');

      const cursor = Expenditure.find(query).sort({ date: -1 }).lean().cursor();
      for await (const doc of cursor) {
        const row = [
          escapeCsvValue(doc._id),
          escapeCsvValue(doc.date),
          escapeCsvValue(doc.category),
          escapeCsvValue(doc.transactionValue),
          escapeCsvValue(doc.transactionType),
          escapeCsvValue(doc.description),
          escapeCsvValue(doc.bank),
          escapeCsvValue(doc.cash),
          escapeCsvValue(doc.prepaid),
        ].join(',') + '\n';
        res.write(row);
      }
      return res.end();
    }

    // Default: JSON streaming
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="expenditures-export.json"');

    res.write('[\n');
    let isFirst = true;
    const cursor = Expenditure.find(query).sort({ date: -1 }).lean().cursor();
    for await (const doc of cursor) {
      if (!isFirst) {
        res.write(',\n');
      } else {
        isFirst = false;
      }
      res.write(JSON.stringify(doc));
    }
    res.write('\n]');
    return res.end();
  } catch (err) {
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to export expenditures: ' + err.message });
    }
    res.end();
  }
});

/**
 * @route   GET /api/export/trades
 * @desc    Stream user trades as JSON or CSV (max 5,000 rows)
 * @access  Private
 */
router.get('/trades', auth, exportRateLimiter, async (req, res) => {
  try {
    const { format = 'json', startDate, endDate, ticker, stockCode } = req.query;

    const query = { user: req.user.id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    const targetStock = ticker || stockCode;
    if (targetStock) {
      query.stockCode = targetStock;
    }

    const count = await Trade.countDocuments(query);
    if (count > MAX_EXPORT_ROWS) {
      return res.status(400).json({
        error: `Export exceeds maximum limit of ${MAX_EXPORT_ROWS} rows (found ${count}). Please narrow your query filter.`,
      });
    }

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="trades-export.csv"');

      res.write('id,date,broker,stockCode,type,quantity,price,totalCost,splitRatio\n');

      const cursor = Trade.find(query).sort({ date: -1 }).lean().cursor();
      for await (const doc of cursor) {
        const row = [
          escapeCsvValue(doc._id),
          escapeCsvValue(doc.date),
          escapeCsvValue(doc.broker),
          escapeCsvValue(doc.stockCode),
          escapeCsvValue(doc.type),
          escapeCsvValue(doc.quantity),
          escapeCsvValue(doc.price),
          escapeCsvValue(doc.totalCost),
          escapeCsvValue(doc.splitRatio),
        ].join(',') + '\n';
        res.write(row);
      }
      return res.end();
    }

    // Default: JSON streaming
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="trades-export.json"');

    res.write('[\n');
    let isFirst = true;
    const cursor = Trade.find(query).sort({ date: -1 }).lean().cursor();
    for await (const doc of cursor) {
      if (!isFirst) {
        res.write(',\n');
      } else {
        isFirst = false;
      }
      res.write(JSON.stringify(doc));
    }
    res.write('\n]');
    return res.end();
  } catch (err) {
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to export trades: ' + err.message });
    }
    res.end();
  }
});

module.exports = router;
