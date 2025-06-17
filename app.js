require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));

// Configuração da sessão
app.use(session({
    secret: process.env.SESSION_SECRET || 'cofre-senhas-campneus-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true em produção com HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

app.use(flash());

// Middleware para disponibilizar dados globais
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Importar rotas
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const localidadesRoutes = require('./routes/localidades');
const usuariosRoutes = require('./routes/usuarios');
const senhasRoutes = require('./routes/senhas');

// Usar rotas
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/localidades', localidadesRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/senhas', senhasRoutes);

// Rota principal - redirecionar para login ou dashboard
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/auth/login');
    }
});

// Middleware de erro 404
app.use((req, res) => {
    res.status(404).render('404', {
        title: 'Página não encontrada',
        message: 'A página solicitada não foi encontrada.'
    });
});

// Middleware de erro geral
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        title: 'Erro interno',
        message: 'Ocorreu um erro interno no servidor.'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 Acesse: http://localhost:${PORT}`);
});

module.exports = app;
