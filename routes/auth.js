const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authenticate = require('../middleware/auth');

// Mock user data (replace with database queries in a real application)
const users = [
    { id: 1, username: 'user1', password: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36Zf4d0x5Q7bX4y5F9y1eG6' } // password: 'password123'
];

// Secret key for JWT (should be stored securely, e.g., in environment variables)
const SECRET_KEY = process.env.JWT_SECRET_KEY || 'your_secret_key';

// Route for user login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Compare password with hashed password
    bcrypt.compare(password, user.password, (err, result) => {
        if (err || !result) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token });
    });
});

// Route for user registration (simplified example)
router.post('/register', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    // Save user to database (mocked here)
    users.push({ id: users.length + 1, username, password: hashedPassword });
    res.status(201).json({ message: 'User registered successfully' });
});

module.exports = router;