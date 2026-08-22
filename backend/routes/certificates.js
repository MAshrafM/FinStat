// backend/routes/certificates.js
const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const {
    createSchema,
    updateSchema,
    paramsSchema,
} = require('../validationSchemas/certificateSchemas');
const { getValidated } = require('../utils/requestHelpers');

// Standard CRUD routes, very similar to our other features

// @route   GET api/certificates
// @desc    Get all certificates
router.get('/', auth, asyncHandler(async (req, res) => {
    const certificates = await Certificate.find({ user: req.user.id }).sort({ startDate: -1 });
    res.json(certificates);
}));

// @route   POST api/certificates
// @desc    Create a new certificate
router.post('/', auth, validate({ body: createSchema }), asyncHandler(async (req, res) => {
    const validatedBody = getValidated(req, 'body');
    const newCertificate = new Certificate({ ...validatedBody, user: req.user.id });
    await newCertificate.save();
    res.status(201).json(newCertificate);
}));

// @route   GET api/certificates/:id
// @desc    Get a single certificate by ID
router.get('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params');
    const certificate = await Certificate.findOne({ _id: id, user: req.user.id });
    if (!certificate) {
        throw new NotFoundError('Certificate not found');
    }
    res.json(certificate);
}));

// @route   PUT api/certificates/:id
// @desc    Update a certificate
router.put('/:id', auth, validate({ params: paramsSchema, body: updateSchema }), asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params');
    const validatedBody = getValidated(req, 'body');

    let certificate = await Certificate.findById(id);
    if (!certificate) {
        throw new NotFoundError('Certificate not found');
    }
    if (certificate.user.toString() !== req.user.id) {
        throw new ForbiddenError('User not authorized');
    }
    certificate = await Certificate.findByIdAndUpdate(id, validatedBody, { new: true, runValidators: true });
    res.json(certificate);
}));

// @route   DELETE api/certificates/:id
// @desc    Delete a certificate
router.delete('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params');
    let certificate = await Certificate.findById(id);
    if (!certificate) {
        throw new NotFoundError('Certificate not found');
    }
    if (certificate.user.toString() !== req.user.id) {
        throw new ForbiddenError('User not authorized');
    }
    await Certificate.findByIdAndDelete(id);
    res.json({ msg: 'Certificate deleted successfully' });
}));

module.exports = router;


