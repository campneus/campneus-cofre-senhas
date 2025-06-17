const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const requireAuth = require('../middleware/auth');

// Aplicar middleware de autenticação a todas as rotas
router.use(requireAuth);

// GET /dashboard - Dashboard principal
router.get('/', async (req, res) => {
    try {
        // Buscar estatísticas gerais
        const statsResult = await query(`
            SELECT 
                (SELECT COUNT(*) FROM cofre_senhas WHERE ativo = true) as total_senhas,
                (SELECT COUNT(*) FROM localidades WHERE ativo = true) as total_localidades,
                (SELECT COUNT(*) FROM usuarios WHERE ativo = true) as total_usuarios,
                (SELECT COUNT(*) FROM cofre_senhas WHERE data_criacao >= CURRENT_DATE - INTERVAL '7 days' AND ativo = true) as senhas_semana,
                (SELECT COUNT(*) FROM log_atividades WHERE data_acao >= CURRENT_DATE - INTERVAL '24 hours') as atividades_hoje
        `);

        // Últimas senhas criadas
        const ultimasSenhasResult = await query(`
            SELECT 
                cs.id, cs.titulo, cs.data_criacao,
                l.nome as localidade_nome,
                c.nome as categoria_nome, c.cor as categoria_cor,
                u.nome as usuario_criacao_nome
            FROM cofre_senhas cs
            JOIN localidades l ON cs.localidade_id = l.id
            JOIN categorias_senha c ON cs.categoria_id = c.id
            JOIN usuarios u ON cs.usuario_criacao = u.id
            WHERE cs.ativo = true
            ORDER BY cs.data_criacao DESC
            LIMIT 5
        `);

        // Últimos acessos
        const ultimosAcessosResult = await query(`
            SELECT 
                cs.id, cs.titulo, cs.data_ultimo_acesso, cs.contador_acessos,
                l.nome as localidade_nome,
                c.nome as categoria_nome, c.cor as categoria_cor
            FROM cofre_senhas cs
            JOIN localidades l ON cs.localidade_id = l.id
            JOIN categorias_senha c ON cs.categoria_id = c.id
            WHERE cs.ativo = true AND cs.data_ultimo_acesso IS NOT NULL
            ORDER BY cs.data_ultimo_acesso DESC
            LIMIT 5
        `);

        // Senhas que expiram em breve
        const senhasExpirandoResult = await query(`
            SELECT 
                cs.id, cs.titulo, cs.expira_em,
                l.nome as localidade_nome,
                c.nome as categoria_nome, c.cor as categoria_cor
            FROM cofre_senhas cs
            JOIN localidades l ON cs.localidade_id = l.id
            JOIN categorias_senha c ON cs.categoria_id = c.id
            WHERE cs.ativo = true 
            AND cs.expira_em IS NOT NULL
            AND cs.expira_em BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
            ORDER BY cs.expira_em ASC
            LIMIT 5
        `);

        // Senhas favoritas
        const senhasFavoritasResult = await query(`
            SELECT 
                cs.id, cs.titulo, cs.data_ultimo_acesso,
                l.nome as localidade_nome,
                c.nome as categoria_nome, c.cor as categoria_cor
            FROM cofre_senhas cs
            JOIN localidades l ON cs.localidade_id = l.id
            JOIN categorias_senha c ON cs.categoria_id = c.id
            WHERE cs.ativo = true AND cs.favorito = true
            ORDER BY cs.data_ultimo_acesso DESC, cs.data_criacao DESC
            LIMIT 5
        `);

        // Estatísticas por categoria
        const estatisticasCategoriaResult = await query(`
            SELECT 
                c.nome, c.cor, c.icone,
                COUNT(cs.id) as total_senhas,
                COUNT(CASE WHEN cs.data_criacao >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as senhas_mes
            FROM categorias_senha c
            LEFT JOIN cofre_senhas cs ON c.id = cs.categoria_id AND cs.ativo = true
            WHERE c.ativo = true
            GROUP BY c.id, c.nome, c.cor, c.icone, c.ordem
            ORDER BY c.ordem
        `);

        // Últimas modificações
        const ultimasModificacoesResult = await query(`
            SELECT 
                cs.id, cs.titulo, cs.data_modificacao,
                l.nome as localidade_nome,
                c.nome as categoria_nome, c.cor as categoria_cor,
                u.nome as usuario_modificacao_nome
            FROM cofre_senhas cs
            JOIN localidades l ON cs.localidade_id = l.id
            JOIN categorias_senha c ON cs.categoria_id = c.id
            LEFT JOIN usuarios u ON cs.usuario_modificacao = u.id
            WHERE cs.ativo = true AND cs.data_modificacao > cs.data_criacao
            ORDER BY cs.data_modificacao DESC
            LIMIT 5
        `);

        const stats = statsResult.rows[0];
        const ultimasSenhas = ultimasSenhasResult.rows;
        const ultimosAcessos = ultimosAcessosResult.rows;
        const senhasExpirando = senhasExpirandoResult.rows;
        const senhasFavoritas = senhasFavoritasResult.rows;
        const estatisticasCategoria = estatisticasCategoriaResult.rows;
        const ultimasModificacoes = ultimasModificacoesResult.rows;

        res.render('dashboard', {
            title: 'Dashboard - Cofre de Senhas',
            user: req.session.user,
            stats,
            ultimasSenhas,
            ultimosAcessos,
            senhasExpirando,
            senhasFavoritas,
            estatisticasCategoria,
            ultimasModificacoes
        });

    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        req.flash('error', 'Erro ao carregar dashboard');
        res.render('dashboard', {
            title: 'Dashboard - Cofre de Senhas',
            user: req.session.user,
            stats: {
                total_senhas: 0,
                total_localidades: 0,
                total_usuarios: 0,
                senhas_semana: 0,
                atividades_hoje: 0
            },
            ultimasSenhas: [],
            ultimosAcessos: [],
            senhasExpirando: [],
            senhasFavoritas: [],
            estatisticasCategoria: [],
            ultimasModificacoes: []
        });
    }
});

// GET /dashboard/stats - API para estatísticas em tempo real
router.get('/stats', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                (SELECT COUNT(*) FROM cofre_senhas WHERE ativo = true) as total_senhas,
                (SELECT COUNT(*) FROM localidades WHERE ativo = true) as total_localidades,
                (SELECT COUNT(*) FROM usuarios WHERE ativo = true) as total_usuarios,
                (SELECT COUNT(*) FROM cofre_senhas WHERE data_criacao >= CURRENT_DATE - INTERVAL '7 days' AND ativo = true) as senhas_semana,
                (SELECT COUNT(*) FROM log_atividades WHERE data_acao >= CURRENT_DATE - INTERVAL '24 hours') as atividades_hoje,
                (SELECT COUNT(*) FROM cofre_senhas WHERE favorito = true AND ativo = true) as senhas_favoritas,
                (SELECT COUNT(*) FROM cofre_senhas WHERE expira_em BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' AND ativo = true) as senhas_expirando
        `);

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /dashboard/recent-activity - Atividades recentes
router.get('/recent-activity', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const result = await query(`
            SELECT 
                la.tipo_acao, la.descricao, la.data_acao,
                u.nome as usuario_nome,
                la.ip_address
            FROM log_atividades la
            JOIN usuarios u ON la.usuario_id = u.id
            ORDER BY la.data_acao DESC
            LIMIT $1
        `, [limit]);

        res.json(result.rows);

    } catch (error) {
        console.error('Erro ao buscar atividades recentes:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /dashboard/chart-data - Dados para gráficos
router.get('/chart-data', async (req, res) => {
    try {
        const type = req.query.type || 'senhas-por-categoria';

        if (type === 'senhas-por-categoria') {
            const result = await query(`
                SELECT 
                    c.nome as categoria,
                    c.cor,
                    COUNT(cs.id) as total
                FROM categorias_senha c
                LEFT JOIN cofre_senhas cs ON c.id = cs.categoria_id AND cs.ativo = true
                WHERE c.ativo = true
                GROUP BY c.id, c.nome, c.cor, c.ordem
                ORDER BY c.ordem
            `);

            res.json(result.rows);

        } else if (type === 'atividade-mensal') {
            const result = await query(`
                SELECT 
                    DATE_TRUNC('month', data_criacao) as mes,
                    COUNT(*) as total
                FROM cofre_senhas
                WHERE ativo = true 
                AND data_criacao >= CURRENT_DATE - INTERVAL '12 months'
                GROUP BY DATE_TRUNC('month', data_criacao)
                ORDER BY mes
            `);

            res.json(result.rows);

        } else {
            res.status(400).json({ error: 'Tipo de gráfico não suportado' });
        }

    } catch (error) {
        console.error('Erro ao buscar dados do gráfico:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
