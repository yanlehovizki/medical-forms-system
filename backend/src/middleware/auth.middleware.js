// backend/src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId, {
            attributes: { exclude: ['passwordHash'] }
        });

        if (!user || !user.isActive) {
            throw new Error();
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        next();
    };
};

module.exports = { authenticate, authorize };

// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');

// Register clinic and admin user
router.post('/register',
    [
        body('clinicName').notEmpty().withMessage('Clinic name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
        body('firstName').notEmpty().withMessage('First name is required'),
        body('lastName').notEmpty().withMessage('Last name is required'),
        validate
    ],
    authController.register
);

// Login
router.post('/login',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
        validate
    ],
    authController.login
);

// Refresh token
router.post('/refresh', authController.refreshToken);

// Logout
router.post('/logout', authController.logout);

// Forgot password
router.post('/forgot-password',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        validate
    ],
    authController.forgotPassword
);

// Reset password
router.post('/reset-password',
    [
        body('token').notEmpty().withMessage('Token is required'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
        validate
    ],
    authController.resetPassword
);

module.exports = router;

// backend/src/controllers/auth.controller.js
const { User, Clinic } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const generateRefreshToken = (userId) => {
    return jwt.sign({ userId, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.register = async (req, res) => {
    try {
        const { clinicName, email, password, firstName, lastName, phone, address } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create clinic
        const clinic = await Clinic.create({
            name: clinicName,
            email,
            phone,
            address
        });

        // Create admin user
        const user = await User.create({
            clinicId: clinic.id,
            email,
            passwordHash: password, // Will be hashed by beforeCreate hook
            firstName,
            lastName,
            role: 'admin'
        });

        const token = generateToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        res.status(201).json({
            message: 'Registration successful',
            user: user.toSafeObject(),
            clinic: clinic.toJSON(),
            token,
            refreshToken
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user with clinic info
        const user = await User.findOne({
            where: { email },
            include: [{
                model: Clinic,
                attributes: ['id', 'name', 'subscriptionStatus']
            }]
        });

        if (!user || !(await user.validatePassword(password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        // Update last login
        await user.update({ lastLogin: new Date() });

        const token = generateToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        res.json({
            message: 'Login successful',
            user: user.toSafeObject(),
            clinic: user.Clinic,
            token,
            refreshToken
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        
        if (decoded.type !== 'refresh') {
            return res.status(401).json({ error: 'Invalid token type' });
        }

        const user = await User.findByPk(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'User not found or inactive' });
        }

        const newToken = generateToken(user.id);
        const newRefreshToken = generateRefreshToken(user.id);

        res.json({
            token: newToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
};

exports.logout = async (req, res) => {
    // In a production app, you might want to blacklist the token
    res.json({ message: 'Logged out successfully' });
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await User.findOne({ where: { email } });
        if (!user) {
            // Don't reveal if email exists
            return res.json({ message: 'If the email exists, a reset link has been sent' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        // Save hashed token to database (you'll need to add these fields to User model)
        await user.update({
            resetPasswordToken: crypto.createHash('sha256').update(resetToken).digest('hex'),
            resetPasswordExpiry: resetTokenExpiry
        });

        // In production, send email with reset link
        // For now, just return the token
        res.json({ 
            message: 'Reset token generated',
            resetToken // Remove this in production
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        
        const user = await User.findOne({
            where: {
                resetPasswordToken: hashedToken,
                resetPasswordExpiry: { [Op.gt]: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        // Update password and clear reset token
        await user.update({
            passwordHash: password,
            resetPasswordToken: null,
            resetPasswordExpiry: null
        });

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};

// backend/src/middleware/validate.middleware.js
const { validationResult } = require('express-validator');

exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};