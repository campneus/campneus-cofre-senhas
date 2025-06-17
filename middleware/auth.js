// Middleware de autenticação
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        req.flash('error', 'Você precisa fazer login para acessar esta página');
        return res.redirect('/auth/login');
    }
    next();
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.nivel_acesso !== 'admin') {
        req.flash('error', 'Acesso negado. Apenas administradores podem acessar esta página');
        return res.redirect('/dashboard');
    }
    next();
};

// Middleware para verificar se pode editar (admin ou usuario)
const requireEdit = (req, res, next) => {
    if (!req.session.user || !['admin', 'usuario'].includes(req.session.user.nivel_acesso)) {
        req.flash('error', 'Acesso negado. Você não tem permissão para editar');
        return res.redirect('/dashboard');
    }
    next();
};

// Middleware para verificar se pode visualizar (todos os níveis logados)
const requireView = (req, res, next) => {
    if (!req.session.user) {
        req.flash('error', 'Você precisa fazer login para visualizar este conteúdo');
        return res.redirect('/auth/login');
    }
    next();
};

// Middleware para verificar nível de acesso específico
const requireLevel = (levels) => {
    return (req, res, next) => {
        if (!req.session.user) {
            req.flash('error', 'Você precisa fazer login para acessar esta página');
            return res.redirect('/auth/login');
        }

        if (!levels.includes(req.session.user.nivel_acesso)) {
            req.flash('error', 'Acesso negado. Você não tem permissão para acessar esta página');
            return res.redirect('/dashboard');
        }

        next();
    };
};

// Middleware para adicionar informações do usuário às views
const addUserToLocals = (req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    res.locals.isLoggedIn = !!req.session.user;
    res.locals.isAdmin = req.session.user && req.session.user.nivel_acesso === 'admin';
    res.locals.canEdit = req.session.user && ['admin', 'usuario'].includes(req.session.user.nivel_acesso);
    res.locals.isViewer = req.session.user && req.session.user.nivel_acesso === 'visualizador';
    next();
};

module.exports = {
    requireAuth,
    requireAdmin,
    requireEdit,
    requireView,
    requireLevel,
    addUserToLocals
};
