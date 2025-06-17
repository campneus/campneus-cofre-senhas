const jwt = require('jsonwebtoken');

// Secret key for JWT (should be stored securely, e.g., in environment variables)
const SECRET_KEY = process.env.JWT_SECRET_KEY || 'your_secret_key';

// Middleware function to authenticate requests
function authenticate(req, res, next) {
    // Get token from headers
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token is missing!' });
    }

    try {
        // Verify token
        const user = jwt.verify(token, SECRET_KEY);
        req.user = user; // Attach user info to request object
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token!' });
    }
}

module.exports = authenticate;