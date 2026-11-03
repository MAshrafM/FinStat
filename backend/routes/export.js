// backend/routes/export.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const MAX_EXPORT_ROWS = parseInt(process.env.MAX_EXPORT_ROWS, 10) || 10000;
const auth = require('../middleware/auth');
const Expenditure = require('../models/Expenditure');
const Trade = require('../models/Trade');
const Paycheck = require('../models/Paycheck');
const MutualFundTrade = require('../models/MutualFundTrade');
const Gold = require('../models/Gold');
const Certificate = require('../models/Certificate');

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


/**
 * @route   GET /api/export/financial-ledger
 * @desc    Stream unified multi-module chronological financial ledger as CSV
 * @access  Private
 */
router.get('/financial-ledger', auth, exportRateLimiter, async (req, res) => {
  try {
    const userId = req.effectiveUserId || req.user.id;
    const { year, startYear, endYear, format = 'csv' } = req.query;

    const currentYear = new Date().getFullYear();
    const parsedStart = startYear ? Number(startYear) : (year ? Number(year) : currentYear - 2);
    const parsedEnd = endYear ? Number(endYear) : (year ? Number(year) : currentYear);

    const periodStart = new Date(Date.UTC(parsedStart, 0, 1, 0, 0, 0, 0));
    const periodEnd = new Date(Date.UTC(parsedEnd, 11, 31, 23, 59, 59, 999));

    const MAX_LEDGER_ROWS = parseInt(process.env.MAX_EXPORT_ROWS, 10) || 25000;

    // Check count across modules (supporting payDate and legacy date)
    const [pCount, eCount, tCount, mfCount, gCount, cCount] = await Promise.all([
      Paycheck.countDocuments({
        user: userId,
        deletedAt: null,
        $or: [
          { payDate: { $gte: periodStart, $lte: periodEnd } },
          { date: { $gte: periodStart, $lte: periodEnd } },
        ],
      }),
      Expenditure.countDocuments({ user: userId, date: { $gte: periodStart, $lte: periodEnd }, deletedAt: null }),
      Trade.countDocuments({ user: userId, date: { $gte: periodStart, $lte: periodEnd }, deletedAt: null }),
      MutualFundTrade.countDocuments({ user: userId, date: { $gte: periodStart, $lte: periodEnd }, deletedAt: null }),
      Gold.countDocuments({ user: userId, date: { $gte: periodStart, $lte: periodEnd }, deletedAt: null }),
      Certificate.countDocuments({ user: userId, startDate: { $gte: periodStart, $lte: periodEnd }, deletedAt: null }),
    ]);

    const totalRows = pCount + eCount + tCount + mfCount + gCount + cCount;
    if (totalRows > MAX_LEDGER_ROWS) {
      return res.status(400).json({
        error: `Export exceeds maximum limit of ${MAX_LEDGER_ROWS} rows (found ${totalRows}). Please narrow your query filter.`,
      });
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="financial-ledger-${parsedStart}-${parsedEnd}.csv"`);

    const header = 'Date,Module,AmountEGP,Description,Category\n';
    res.write(header);

    // Initialize 6 streaming cursors sorted chronologically (supporting payDate and legacy date)
    const pCursor = Paycheck.find({
      user: userId,
      deletedAt: null,
      $or: [
        { payDate: { $gte: periodStart, $lte: periodEnd } },
        { date: { $gte: periodStart, $lte: periodEnd } },
      ],
    }).sort({ payDate: 1, date: 1 }).lean().cursor();
    const eCursor = Expenditure.find({ user: userId, date: { $gte: periodStart, $lte: periodEnd }, deletedAt: null }).sort({ date: 1 }).lean().cursor();
    const tCursor = Trade.find({ user: userId, date: { $gte: periodStart, $lte: periodEnd }, deletedAt: null }).sort({ date: 1 }).lean().cursor();
    const mfCursor = MutualFundTrade.find({ user: userId, date: { $gte: periodStart, $lte: periodEnd }, deletedAt: null }).sort({ date: 1 }).lean().cursor();
    const gCursor = Gold.find({ user: userId, date: { $gte: periodStart, $lte: periodEnd }, deletedAt: null }).sort({ date: 1 }).lean().cursor();
    const cCursor = Certificate.find({ user: userId, startDate: { $gte: periodStart, $lte: periodEnd }, deletedAt: null }).sort({ startDate: 1 }).lean().cursor();

    // 6-way cursor merge buffer (holds exactly 1 doc per cursor)
    const cursorSlots = [
      { cursor: pCursor, doc: null, map: d => ({ date: d.payDate || d.date, module: 'Paycheck', amount: d.netPay || d.amount || 0, desc: `Salary - ${d.period || d.month || ''}`, cat: 'Income' }) },
      { cursor: eCursor, doc: null, map: d => ({ date: d.date, module: 'Expenditure', amount: d.transactionValue || 0, desc: d.description || '', cat: (d.categories && d.categories[0]) || 'Other' }) },
      { cursor: tCursor, doc: null, map: d => ({ date: d.date, module: 'Trade', amount: (d.shares || 0) * (d.price || 0), desc: `${d.type || 'Trade'} ${d.stockCode || ''}`, cat: 'Equities' }) },
      { cursor: mfCursor, doc: null, map: d => ({ date: d.date, module: 'MutualFundTrade', amount: (d.units || 0) * (d.price || 0), desc: `${d.type || 'Trade'} ${d.code || d.name || ''}`, cat: 'Mutual Funds' }) },
      { cursor: gCursor, doc: null, map: d => ({ date: d.date, module: 'Gold', amount: d.paid || 0, desc: `${d.item || 'Gold'} (${d.weight || 0}g)`, cat: 'Gold' }) },
      { cursor: cCursor, doc: null, map: d => ({ date: d.startDate, module: 'Certificate', amount: d.amount || 0, desc: d.name || 'Certificate', cat: 'Fixed Income' }) },
    ];

    // Seed slots
    for (const slot of cursorSlots) {
      slot.doc = await slot.cursor.next();
    }

    // Merge loop emitting earliest chronological item
    while (cursorSlots.some(s => s.doc !== null)) {
      let earliestSlot = null;
      let earliestDate = null;

      for (const slot of cursorSlots) {
        if (!slot.doc) continue;
        const mapped = slot.map(slot.doc);
        const itemDate = mapped.date ? new Date(mapped.date).getTime() : 0;
        if (earliestDate === null || itemDate < earliestDate) {
          earliestDate = itemDate;
          earliestSlot = slot;
        }
      }

      if (earliestSlot && earliestSlot.doc) {
        const item = earliestSlot.map(earliestSlot.doc);
        const row = [
          escapeCsvValue(item.date ? new Date(item.date).toISOString().split('T')[0] : ''),
          escapeCsvValue(item.module),
          escapeCsvValue(item.amount),
          escapeCsvValue(item.desc),
          escapeCsvValue(item.cat),
        ].join(',') + '\n';
        res.write(row);
        earliestSlot.doc = await earliestSlot.cursor.next();
      } else {
        break;
      }
    }

    return res.end();
  } catch (err) {
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to export financial ledger: ' + err.message });
    }
    res.end();
  }
});

module.exports = router;
