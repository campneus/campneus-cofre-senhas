const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');

// Example route for dashboard
router.get('/', authenticate, (req, res) => {
    res.sendFile(__dirname + '/../public/dashboard.html');
});

// Additional routes can be added here
// Example: router.get('/stats', authenticate, (req, res) => { ... });

module.exports = router;