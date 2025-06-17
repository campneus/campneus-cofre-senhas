const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// Middleware para verificar se usuário já está logado
const redirectIfLoggedIn = (req, res, next) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    next();
};

// GET /auth/login - Página de login
router.get('/login', redirectIfLoggedIn, (req, res) => {
    res.render('login', {
        title: 'Login - Cofre de Senhas',
        error: req.flash('error'),
        success: req.flash('success')
    });
});

// POST /auth/login - Processar login
router.post('/login', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),
    body('senha')
        .isLength({ min: 1 })
        .withMessage('Senha é obrigatória')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('error', 'Por favor, verifique os dados informados');
            return res.redirect('/auth/login');
        }

        const { email, senha } = req.body;

        // Buscar usuário
        const user = await User.findByEmail(email);
        if (!user) {
            req.flash('error', 'Email ou senha incorretos');
            return res.redirect('/auth/login');
        }

        // Verificar senha
        const isValidPassword = await user.verifyPassword(senha);
        if (!isValidPassword) {
            req.flash('error', 'Email ou senha incorretos');
            return res.redirect('/auth/login');
        }

        // Atualizar último acesso
        await user.updateLastAccess(req.ip);

        // Criar sessão
        req.session.user = {
            id: user.id,
            uuid: user.uuid,
            nome: user.nome,
            email: user.email,
            nivel_acesso: user.nivel_acesso
        };

        req.flash('success', `Bem-vindo, ${user.nome}!`);
        res.redirect('/dashboard');

    } catch (error) {
        console.error('Erro no login:', error);
        req.flash('error', 'Erro interno do servidor');
        res.redirect('/auth/login');
    }
});

// GET /auth/logout - Logout
router.get('/logout', (req, res) => {
    const userName = req.session.user ? req.session.user.nome : 'Usuário';

    req.session.destroy((err) => {
        if (err) {
            console.error('Erro ao destruir sessão:', err);
        }
        req.flash('success', `Até logo, ${userName}!`);
        res.redirect('/auth/login');
    });
});

// GET /auth/register - Página de registro (apenas para admins)
router.get('/register', async (req, res) => {
    try {
        // Verificar se usuário está logado e é admin
        if (!req.session.user || req.session.user.nivel_acesso !== 'admin') {
            req.flash('error', 'Acesso negado');
            return res.redirect('/auth/login');
        }

        res.render('register', {
            title: 'Cadastrar Usuário - Cofre de Senhas',
            error: req.flash('error'),
            success: req.flash('success'),
            user: req.session.user
        });

    } catch (error) {
        console.error('Erro ao carregar página de registro:', error);
        req.flash('error', 'Erro interno do servidor');
        res.redirect('/dashboard');
    }
});

// POST /auth/register - Processar registro
router.post('/register', [
    body('nome')
        .isLength({ min: 2 })
        .withMessage('Nome deve ter pelo menos 2 caracteres'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),
    body('senha')
        .isLength({ min: 6 })
        .withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('confirmar_senha')
        .custom((value, { req }) => {
            if (value !== req.body.senha) {
                throw new Error('Confirmação de senha não confere');
            }
            return true;
        }),
    body('nivel_acesso')
        .isIn(['admin', 'usuario', 'visualizador'])
        .withMessage('Nível de acesso inválido')
], async (req, res) => {
    try {
        // Verificar se usuário está logado e é admin
        if (!req.session.user || req.session.user.nivel_acesso !== 'admin') {
            req.flash('error', 'Acesso negado');
            return res.redirect('/auth/login');
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('error', errors.array()[0].msg);
            return res.redirect('/auth/register');
        }

        const { nome, email, senha, nivel_acesso } = req.body;

        // Criar usuário
        const newUser = await User.create({
            nome,
            email,
            senha,
            nivel_acesso
        });

        req.flash('success', `Usuário ${nome} criado com sucesso!`);
        res.redirect('/usuarios');

    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        if (error.message === 'Email já está em uso') {
            req.flash('error', 'Este email já está sendo usado por outro usuário');
        } else {
            req.flash('error', 'Erro ao criar usuário');
        }
        res.redirect('/auth/register');
    }
});

// GET /auth/change-password - Página para alterar senha
router.get('/change-password', (req, res) => {
    if (!req.session.user) {
        req.flash('error', 'Faça login para continuar');
        return res.redirect('/auth/login');
    }

    res.render('change-password', {
        title: 'Alterar Senha - Cofre de Senhas',
        error: req.flash('error'),
        success: req.flash('success'),
        user: req.session.user
    });
});

// POST /auth/change-password - Processar alteração de senha
router.post('/change-password', [
    body('senha_atual')
        .isLength({ min: 1 })
        .withMessage('Senha atual é obrigatória'),
    body('nova_senha')
        .isLength({ min: 6 })
        .withMessage('Nova senha deve ter pelo menos 6 caracteres'),
    body('confirmar_nova_senha')
        .custom((value, { req }) => {
            if (value !== req.body.nova_senha) {
                throw new Error('Confirmação de nova senha não confere');
            }
            return true;
        })
], async (req, res) => {
    try {
        if (!req.session.user) {
            req.flash('error', 'Faça login para continuar');
            return res.redirect('/auth/login');
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('error', errors.array()[0].msg);
            return res.redirect('/auth/change-password');
        }

        const { senha_atual, nova_senha } = req.body;

        // Buscar usuário atual
        const user = await User.findById(req.session.user.id);
        if (!user) {
            req.flash('error', 'Usuário não encontrado');
            return res.redirect('/auth/login');
        }

        // Verificar senha atual
        const isValidPassword = await user.verifyPassword(senha_atual);
        if (!isValidPassword) {
            req.flash('error', 'Senha atual incorreta');
            return res.redirect('/auth/change-password');
        }

        // Alterar senha
        await user.changePassword(nova_senha, user.id);

        req.flash('success', 'Senha alterada com sucesso!');
        res.redirect('/dashboard');

    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        req.flash('error', 'Erro ao alterar senha');
        res.redirect('/auth/change-password');
    }
});

// GET /auth/profile - Perfil do usuário
router.get('/profile', async (req, res) => {
    try {
        if (!req.session.user) {
            req.flash('error', 'Faça login para continuar');
            return res.redirect('/auth/login');
        }

        const user = await User.findById(req.session.user.id);
        if (!user) {
            req.flash('error', 'Usuário não encontrado');
            return res.redirect('/auth/login');
        }

        res.render('profile', {
            title: 'Meu Perfil - Cofre de Senhas',
            error: req.flash('error'),
            success: req.flash('success'),
            user: req.session.user,
            userData: user
        });

    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        req.flash('error', 'Erro ao carregar perfil');
        res.redirect('/dashboard');
    }
});

// POST /auth/profile - Atualizar perfil
router.post('/profile', [
    body('nome')
        .isLength({ min: 2 })
        .withMessage('Nome deve ter pelo menos 2 caracteres'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido')
], async (req, res) => {
    try {
        if (!req.session.user) {
            req.flash('error', 'Faça login para continuar');
            return res.redirect('/auth/login');
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('error', errors.array()[0].msg);
            return res.redirect('/auth/profile');
        }

        const { nome, email } = req.body;

        const user = await User.findById(req.session.user.id);
        if (!user) {
            req.flash('error', 'Usuário não encontrado');
            return res.redirect('/auth/login');
        }

        await user.update({ nome, email }, user.id);

        // Atualizar dados da sessão
        req.session.user.nome = nome;
        req.session.user.email = email;

        req.flash('success', 'Perfil atualizado com sucesso!');
        res.redirect('/auth/profile');

    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        if (error.message === 'Email já está em uso') {
            req.flash('error', 'Este email já está sendo usado por outro usuário');
        } else {
            req.flash('error', 'Erro ao atualizar perfil');
        }
        res.redirect('/auth/profile');
    }
});

module.exports = router;
