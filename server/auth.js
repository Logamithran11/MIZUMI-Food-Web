const jwt = require('jsonwebtoken');
const User = require('./models/User');

/**
 * JWT Authentication Middleware
 * Extracts token from Authorization header, verifies it,
 * and attaches the user to req.user
 */
const auth = async (req, res, next) => {
    try {
        const header = req.header('Authorization');
        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const token = header.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ error: 'User not found.' });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please login again.' });
        }
        res.status(500).json({ error: 'Authentication error.' });
    }
};

/**
 * Optional auth — attaches user if token is present, but doesn't block
 */
const optionalAuth = async (req, res, next) => {
    try {
        const header = req.header('Authorization');
        if (header && header.startsWith('Bearer ')) {
            const token = header.replace('Bearer ', '');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id);
        }
    } catch (err) {
        // Silently continue — user is not authenticated
    }
    next();
};

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

module.exports = { auth, optionalAuth, generateToken };
