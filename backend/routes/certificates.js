// backend/routes/certificates.js
const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
    createSchema,
    updateSchema,
    paramsSchema,
} = require('../validationSchemas/certificateSchemas');
const { getValidated } = require('../utils/requestHelpers');

// Standard CRUD routes, very similar to our other features

// @route   GET api/certificates
// @desc    Get all certificates
router.get('/', auth, async (req, res) => {
    try {
        // No pagination needed for this feature as the list is usually short
        const certificates = await Certificate.find({ user: req.user.id }).sort({ startDate: -1 });
        res.json(certificates);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   POST api/certificates
// @desc    Create a new certificate
router.post('/', auth, validate({ body: createSchema }), async (req, res) => {
    try {
        const validatedBody = getValidated(req, 'body');
        const newCertificate = new Certificate({ ...validatedBody, user: req.user.id });
        await newCertificate.save();
        res.json(newCertificate);
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
});

// @route   GET api/certificates/:id
// @desc    Get a single certificate by ID
router.get('/:id', auth, validate({ params: paramsSchema }), async (req, res) => {
    try {
        const { id } = getValidated(req, 'params');
        const certificate = await Certificate.findOne({ _id: id, user: req.user.id });
        if (!certificate) return res.status(404).json({ msg: 'Certificate not found' });
        res.json(certificate);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/certificates/:id
// @desc    Update a certificate
router.put('/:id', auth, validate({ params: paramsSchema, body: updateSchema }), async (req, res) => {
    try {
        const { id } = getValidated(req, 'params');
        const validatedBody = getValidated(req, 'body');

        let certificate = await Certificate.findById(id);
        if (!certificate) return res.status(404).json({ msg: 'Certificate not found' });
        if (certificate.user.toString() !== req.user.id) { return res.status(401).json({ msg: 'User not authorized' }); }
        certificate = await Certificate.findByIdAndUpdate(id, validatedBody, { new: true, runValidators: true });
        res.json(certificate);
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
});

// @route   DELETE api/certificates/:id
// @desc    Delete a certificate
router.delete('/:id', auth, validate({ params: paramsSchema }), async (req, res) => {
    try {
        const { id } = getValidated(req, 'params');
        let certificate = await Certificate.findById(id);
        if (!certificate) return res.status(404).json({ msg: 'Certificate not found' });
        if (certificate.user.toString() !== req.user.id) { return res.status(401).json({ msg: 'User not authorized' }); }
        certificate = await Certificate.findByIdAndDelete(id);
        res.json({ msg: 'Certificate deleted successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;

