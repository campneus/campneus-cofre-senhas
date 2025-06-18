const express = require('express');
const path = require('path');
const router = express.Router();
const authenticate = require('../middleware/auth');

// Example route for dashboard
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
});

// Additional routes can be added here
// Example: router.get('/stats', authenticate, (req, res) => { ... });

module.exports = router;

// Rota para obter dados do dashboard (protegida)
router.get('/data', authenticate, async (req, res) => {
    try {
        // Aqui você pode retornar dados específicos do dashboard
        // baseados no usuário autenticado
        res.json({
            message: 'Dashboard data loaded successfully',
            user: req.user,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

