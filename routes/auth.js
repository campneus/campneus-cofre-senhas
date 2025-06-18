const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authenticate = require('../middleware/auth');
const User = require('../models/User');

// Secret key for JWT (should be stored securely, e.g., in environment variables)
const SECRET_KEY = process.env.JWT_SECRET_KEY || 'your_secret_key';

// Route for user login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar campos obrigatórios
        if (!email || !password) {
            return res.status(400).json({ message: 'Email e senha são obrigatórios' });
        }

        // Buscar usuário por email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Email ou senha inválidos' });
        }

        // Verificar senha
        const isPasswordValid = await user.verifyPassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Email ou senha inválidos' });
        }

        // Atualizar último acesso
        const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                        (req.connection.socket ? req.connection.socket.remoteAddress : null);
        await user.updateLastAccess(clientIP);

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                uuid: user.uuid,
                email: user.email, 
                nome: user.nome,
                nivel_acesso: user.nivel_acesso 
            }, 
            SECRET_KEY, 
            { expiresIn: '8h' }
        );

        res.json({ 
            token,
            user: user.toJSON()
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Route for user registration (simplified example)
router.post('/register', async (req, res) => {
    try {
        const { nome, email, password, nivel_acesso } = req.body;

        // Validar campos obrigatórios
        if (!nome || !email || !password) {
            return res.status(400).json({ message: 'Nome, email e senha são obrigatórios' });
        }

        // Validar formato do email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Formato de email inválido' });
        }

        // Validar força da senha
        if (password.length < 6) {
            return res.status(400).json({ message: 'Senha deve ter pelo menos 6 caracteres' });
        }

        // Criar usuário
        const newUser = await User.create({
            nome,
            email,
            senha: password,
            nivel_acesso: nivel_acesso || 'usuario'
        });

        res.status(201).json({ 
            message: 'Usuário registrado com sucesso',
            user: newUser.toJSON()
        });

    } catch (error) {
        console.error('Erro no registro:', error);
        
        if (error.message === 'Email já está em uso') {
            return res.status(409).json({ message: error.message });
        }
        
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Route to get current user info (protected)
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        res.json({ user: user.toJSON() });
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Route to change password (protected)
router.post('/change-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Nova senha deve ter pelo menos 6 caracteres' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Verificar senha atual
        const isCurrentPasswordValid = await user.verifyPassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({ message: 'Senha atual incorreta' });
        }

        // Alterar senha
        await user.changePassword(newPassword);

        res.json({ message: 'Senha alterada com sucesso' });

    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

module.exports = router;