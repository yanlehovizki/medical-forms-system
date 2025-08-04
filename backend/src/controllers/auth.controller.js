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
    res.json({ message: 'Logged out successfully' });
};

exports.forgotPassword = async (req, res) => {
    // Implementation for forgot password
    res.json({ message: 'Password reset functionality coming soon' });
};

exports.resetPassword = async (req, res) => {
    // Implementation for reset password
    res.json({ message: 'Password reset functionality coming soon' });
};