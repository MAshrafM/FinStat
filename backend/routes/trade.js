// backend/routes/trades.js
const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');
const axios = require('axios');
const auth = require('../middleware/auth');

// @route   GET api/trades
// @desc    Get all trades (with pagination)
router.get('/', auth, async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const skip = (page - 1) * limit;
  const broker = req.query.broker; // Get the broker from the query string

  // 1. Build a dynamic query object
  const query = {};
  query.user = req.user.id;
    if (broker && broker != 'TopUp') {
        query.broker = broker; // If a broker is provided, add it to the query
    } else if (broker === 'TopUp') {
        query.type =  'TopUp'; // If 'TopUp' is specified, filter by type
    }
    
    try {
    const trades = await Trade.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit);
    const total = await Trade.countDocuments(query);
    res.json({
      data: trades,
      totalPages: Math.ceil(total / limit),
      page,
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET api/trades
// @desc    Get all trades (with pagination)
router.get('/all', auth, async (req, res) => {
  try {
    const trades = await Trade.find({ user: req.user.id }).sort({createdAt:-1});
    res.json(trades);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET api/trades/summary
// @desc    Get a summary of trades grouped by broker, stock, and iteration
// @access  Public
/*
router.get('/summary', auth, async (req, res) => {
    try {
        const summary = await Trade.aggregate([
            // Stage 1: Group documents by the unique combination of broker, stockCode, and iteration
            {
                $group: {
                    _id: {
                        broker: "$broker",
                        stockCode: "$stockCode",
                        iteration: "$iteration"
                    },
                    // Stage 2: Use conditional aggregation to calculate separate sums

                    // Sum totalValue ONLY if type is 'Buy'
                    totalBuyValue: {
                        $sum: { $cond: [{ $eq: ["$type", "Buy"] }, "$totalValue", 0] }
                    },
                    // Sum totalValue ONLY if type is 'Sell'
                    totalSellValue: {
                        $sum: { $cond: [{ $eq: ["$type", "Sell"] }, "$totalValue", 0] }
                    },
                    // Sum totalValue ONLY if type is 'Dividend'
                    totalDividendValue: {
                        $sum: { $cond: [{ $eq: ["$type", "Dividend"] }, "$totalValue", 0] }
                    },

                    totalSharesBought: {
                        $sum: { $cond: [{ $eq: ["$type", "Buy"] }, "$shares", 0] }
                    },
                    totalSharesSold: {
                        $sum: { $cond: [{ $eq: ["$type", "Sell"] }, "$shares", 0] }
                    },
                    totalSharesDividend: {
                        $sum: { $cond: [{ $eq: ["$type", "Dividend"] }, "$shares", 0] }
                    },

                    totalFees: { $sum: "$fees" },           // Sum up the fees
                    tradeCount: { $sum: 1 },                // Count the number of trades in the group
                    firstTradeDate: { $min: "$date" },      // Find the earliest trade date in the group
                    lastTradeDate: { $max: "$date" }        // Find the latest trade date in the group
                }
            },
            // Stage 3: Add a new field to calculate the final Realized Profit/Loss
            {
                $addFields: {
                    realizedPL: {
                        $subtract: [
                            { $add: ["$totalSellValue", "$totalDividendValue"] }, // (Sells + Dividends)
                            "$totalBuyValue"                                      // - Buys
                        ]
                    },
                    totDeals: {
                        $subtract: ["$totalSellValue", "$totalBuyValue"] // Total deals = Total sells - Total buys"
                    },
                    currentShares: {
                        $subtract: [
                            { $add: ["$totalSharesBought", "$totalSharesDividend"] }, // Total shares bought and dividends
                            "$totalSharesSold"                                         // - Total shares sold
                            ]
                    },
                }
            },
            // Stage 4: Sort the results for a clean display
            {
                $sort: {
                    "_id.stockCode": 1, // Sort by stock code
                    "lastTradeDate": -1 // Then by the most recent activity
                }
            }
        ]);
        res.json(summary);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
*/
router.get('/summary', auth, async (req, res) => {
    try {
        const summary = await Trade.aggregate([
            // --- Stage 1: Grouping (No Changes) ---
            {
                $group: {
                    _id: {
                        broker: "$broker",
                        stockCode: "$stockCode",
                        iteration: "$iteration"
                    },
                    totalBuyValue: {
                        $sum: { $cond: [{ $eq: ["$type", "Buy"] }, "$totalValue", 0] }
                    },
                    totalSellValue: {
                        $sum: { $cond: [{ $eq: ["$type", "Sell"] }, "$totalValue", 0] }
                    },
                    totalDividendValue: {
                        $sum: { $cond: [{ $eq: ["$type", "Dividend"] }, "$totalValue", 0] }
                    },
                    totalSharesBought: {
                        $sum: { $cond: [{ $eq: ["$type", "Buy"] }, "$shares", 0] }
                    },
                    totalSharesSold: {
                        $sum: { $cond: [{ $eq: ["$type", "Sell"] }, "$shares", 0] }
                    },
                    totalSharesDividend: {
                        $sum: { $cond: [{ $eq: ["$type", "Dividend"] }, "$shares", 0] }
                    },
                    totalFees: { $sum: "$fees" },
                    tradeCount: { $sum: 1 },
                    firstTradeDate: { $min: "$date" },
                    lastTradeDate: { $max: "$date" }
                }
            },

            // --- Stage 2: Calculate Averages & Current Holdings ---
            {
                $addFields: {
                    // Calculate how many shares you currently hold
                    currentShares: {
                        $subtract: [
                            { $add: ["$totalSharesBought", "$totalSharesDividend"] },
                            "$totalSharesSold"
                        ]
                    },
                    // Calculate the Average Price you paid per share
                    averageBuyPrice: {
                        $cond: [
                            { $eq: ["$totalSharesBought", 0] },
                            0,
                            { $divide: ["$totalBuyValue", "$totalSharesBought"] }
                        ]
                    },
                    // Formula: (BuyValue - DividendValue) / (SharesBought + SharesDividend)
                    adjustedAvgPrice: {
                        $cond: [
                            { $eq: [{ $add: ["$totalSharesBought", "$totalSharesDividend"] }, 0] },
                            0,
                            { 
                                $divide: [
                                    { $subtract: ["$totalBuyValue", "$totalDividendValue"] }, 
                                    { $add: ["$totalSharesBought", "$totalSharesDividend"] }
                                ]
                            }
                        ]
                    }
                }
            },

            // --- Stage 3: Calculate Cost of Goods Sold (COGS) ---
            {
                $addFields: {
                    // This is the specific cost of the shares you have actually sold
                    costOfSoldShares: {
                        $multiply: ["$totalSharesSold", "$averageBuyPrice"]
                    },
                    netBreakEvenPrice: {
                        $cond: [
                            // Avoid division by zero if you have sold everything
                            { $lte: ["$currentShares", 0] }, 
                            0, 
                            { 
                                $divide: [
                                    { 
                                        $subtract: [ 
                                            "$totalBuyValue", 
                                            { $add: ["$totalSellValue", "$totalDividendValue"] } // Total Cash Returned
                                        ] 
                                    }, 
                                    "$currentShares"
                                ]
                            }
                        ]
                    }
                }
            },

            // --- Stage 4: Final P/L Calculation ---
            {
                $addFields: {
                    // Realized P/L = (Sell Value - Cost of those specific shares) + Dividends
                    realizedPL: {
                        $add: [
                            { $subtract: ["$totalSellValue", "$costOfSoldShares"] },
                            "$totalDividendValue"
                        ]
                    },
                    // Net Cash Flow (Total money in vs Total money out)
                    // I renamed 'totDeals' to 'netCashFlow' for clarity, but you can change it back.
                    totDeals: {
                        $subtract: [
                            "$totalBuyValue",
                            { $add: ["$totalSellValue", "$totalDividendValue"] }
                        ]
                    },
                    // Optional: Shows how much money is still tied up in the remaining shares
                    investedAmountRemaining: {
                        $multiply: ["$currentShares", "$averageBuyPrice"]
                    }
                }
            },

            // --- Stage 5: Sorting ---
            {
                $sort: {
                    "_id.stockCode": 1,
                    "lastTradeDate": -1
                }
            }
        ]);
        res.json(summary);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/market-prices', auth, async (req, res) => {
    try {
        const response = await axios.get('https://english.mubasher.info/api/1/stocks/prices?country=eg');
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch market prices' });
    }
});

// @route   POST api/trades
// @desc    Create a new trade
router.post('/', auth, async (req, res) => {
  try {
    const newTrade = new Trade({...req.body, user: req.user.id});
    await newTrade.save();
    res.json(newTrade);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

// @route   GET api/trades/:id
// @desc    Get a single trade by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const trade = await Trade.findOne({_id: req.params.id, user: req.user.id});
    if (!trade) return res.status(404).json({ msg: 'Trade not found' });
    res.json(trade);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/trades/:id
// @desc    Update a trade
router.put('/:id', auth, async (req, res) => {
  try {
    let trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ msg: 'Trade not found' });
    if(trade.user.toString() != req.user.id) {return res.status(401).json({ msg: 'User not authorized' });}
    trade = await Trade.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(trade);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

// @route   DELETE api/trades/:id
// @desc    Delete a trade
router.delete('/:id', auth, async (req, res) => {
  try {
    let trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ msg: 'Trade not found' });
    if(trade.user.toString() != req.user.id) {return res.status(401).json({ msg: 'User not authorized' });}
    trade = await Trade.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Trade deleted successfully' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});


module.exports = router;
