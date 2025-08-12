// backend/routes/currency.js
const express = require('express');
const router = express.Router();
const Certificate = require('../models/Currency');
const auth = require('../middleware/auth');
const Currency = require('../models/Currency');
const axios = require('axios'); // Import axios for making HTTP requests

// Standard CRUD routes, very similar to our other features

// @route   GET api/currency
// @desc    Get all currency
router.get('/', auth, async (req, res) => {
    try {
        // No pagination needed for this feature as the list is usually short
        const currencies = await Certificate.find({ user: req.user.id }).sort({ startDate: -1 });
        res.json(currencies);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   POST api/currency
// @desc    Create a new currency
router.post('/', auth, async (req, res) => {
    try {
        const newCurrency = new Currency({...req.body, user: req.user.id});
        await newCurrency.save();
        res.json(newCurrency);
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
});

router.get('/summary', auth, async (req, res) => {
    try {
        const summary = await Currency.aggregate([
            // Stage 1: Group documents by the karat
            {
                $group: {
                    _id: "$name", // The field to group by. The result will be in the _id field.
                    totalAmount: { $sum: "$amount" }, // Sum up the weight for each karat group
                    totalPrice: { $sum: "$price" },     // Sum up the total amount paid for each group
                }
            }
        ]);
        res.json(summary);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/price', auth, async (req, res) => {
    try {
        const response = await axios.get('https://www.cibeg.com/api/currency/rates', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://www.cibeg.com/',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin'
            }
        });

        const data = response.data.rates;
        
        res.json( data );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/Currency/:id
// @desc    Get a single Currency by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const currency = await Currency.findById(req.params.id);
        if (!currency) return res.status(404).json({ msg: 'Currency not found' });
        res.json(currency);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/Currency/:id
// @desc    Update a Currency
router.put('/:id', auth, async (req, res) => {
    try {
        let currency = await Currency.findById(req.params.id);
        if (!currency) return res.status(404).json({ msg: 'Currency not found' });
        if(currency.user.toString() != req.user.id) {return res.status(401).json({ msg: 'User not authorized' });}
        currency = await Currency.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(currency);
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
});

// @route   DELETE api/Currency/:id
// @desc    Delete a Currency
router.delete('/:id', auth, async (req, res) => {
    try {
        let currency = await Currency.findById(req.params.id);
        if (!currency) return res.status(404).json({ msg: 'Currency not found' });
        if(currency.user.toString() != req.user.id) {return res.status(401).json({ msg: 'User not authorized' });}
        currency = await Currency.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Currency deleted successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
