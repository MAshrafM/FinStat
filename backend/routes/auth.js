// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { UnauthorizedError } = require('../utils/errors');
const { createSchema: loginSchema } = require('../validationSchemas/authSchemas');
const { getValidated } = require('../utils/requestHelpers');
require('dotenv').config();

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', validate({ body: loginSchema }), asyncHandler(async (req, res) => {
    const { username, password } = getValidated(req, 'body');

    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
        throw new UnauthorizedError('Invalid credentials');
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new UnauthorizedError('Invalid credentials');
    }

    // User matched, create and sign a JWT
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
}));

module.exports = router;


