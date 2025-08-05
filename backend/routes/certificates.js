// backend/routes/certificates.js
const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const auth = require('../middleware/auth');

// Standard CRUD routes, very similar to our other features

// @route   GET api/certificates
// @desc    Get all certificates
router.get('/', auth, async (req, res) => {
    try {
        // No pagination needed for this feature as the list is usually short
        const certificates = await Certificate.find().sort({ startDate: -1 });
        res.json(certificates);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   POST api/certificates
// @desc    Create a new certificate
router.post('/', auth, async (req, res) => {
    try {
        const newCertificate = new Certificate(req.body);
        await newCertificate.save();
        res.json(newCertificate);
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
});

// @route   GET api/certificates/:id
// @desc    Get a single certificate by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const certificate = await Certificate.findById(req.params.id);
        if (!certificate) return res.status(404).json({ msg: 'Certificate not found' });
        res.json(certificate);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/certificates/:id
// @desc    Update a certificate
router.put('/:id', auth, async (req, res) => {
    try {
        const certificate = await Certificate.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!certificate) return res.status(404).json({ msg: 'Certificate not found' });
        res.json(certificate);
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
});

// @route   DELETE api/certificates/:id
// @desc    Delete a certificate
router.delete('/:id', auth, async (req, res) => {
    try {
        const certificate = await Certificate.findByIdAndDelete(req.params.id);
        if (!certificate) return res.status(404).json({ msg: 'Certificate not found' });
        res.json({ msg: 'Certificate deleted successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
