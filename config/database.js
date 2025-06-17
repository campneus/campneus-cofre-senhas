const { Pool } = require('pg');
require('dotenv').config();

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
    // Usar DATABASE_URL se disponível (Render/produção) ou configurações individuais
    connectionString: process.env.DATABASE_URL || process.env.RENDER_DATABASE_URL,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,

    // Configurações do pool
    max: 20, // Máximo de conexões simultâneas
    idleTimeoutMillis: 30000, // Tempo limite para conexões ociosas
    connectionTimeoutMillis: 2000, // Tempo limite para estabelecer conexão

    // Configurações SSL para produção (Render)
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

// Eventos do pool para debugging
pool.on('connect', (client) => {
    console.log('🔗 Nova conexão PostgreSQL estabelecida');
});

pool.on('error', (err, client) => {
    console.error('❌ Erro na conexão PostgreSQL:', err);
    process.exit(-1);
});

// Função para testar a conexão
const testConnection = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Conexão com PostgreSQL estabelecida com sucesso');
        console.log('🕐 Timestamp do servidor:', result.rows[0].now);
        return true;
    } catch (err) {
        console.error('❌ Erro ao conectar com PostgreSQL:', err.message);
        return false;
    }
};

// Função para executar queries com tratamento de erro
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;

        if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Query executada:', {
                text: text.substring(0, 50) + '...',
                duration: duration + 'ms',
                rows: result.rowCount
            });
        }

        return result;
    } catch (error) {
        console.error('❌ Erro na query:', {
            text: text.substring(0, 50) + '...',
            error: error.message,
            params: params
        });
        throw error;
    }
};

// Função para executar transações
const transaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Função para verificar se as tabelas existem
const checkTables = async () => {
    try {
        const result = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('usuarios', 'localidades', 'categorias_senha', 'cofre_senhas')
        `);

        const expectedTables = ['usuarios', 'localidades', 'categorias_senha', 'cofre_senhas'];
        const existingTables = result.rows.map(row => row.table_name);
        const missingTables = expectedTables.filter(table => !existingTables.includes(table));

        if (missingTables.length > 0) {
            console.warn('⚠️ Tabelas não encontradas:', missingTables);
            console.log('💡 Execute o script database/database.sql para criar as tabelas');
            return false;
        }

        console.log('✅ Todas as tabelas necessárias estão presentes');
        return true;
    } catch (error) {
        console.error('❌ Erro ao verificar tabelas:', error.message);
        return false;
    }
};

// Função para inserir log de atividade
const logActivity = async (userId, action, table, recordId, description, ipAddress, userAgent) => {
    try {
        await query(`
            INSERT INTO log_atividades 
            (usuario_id, tipo_acao, tabela_afetada, registro_id, descricao, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [userId, action, table, recordId, description, ipAddress, userAgent]);
    } catch (error) {
        console.error('❌ Erro ao inserir log de atividade:', error.message);
        // Não propagar o erro para não interromper a operação principal
    }
};

// Função para fechar o pool (útil para testes)
const closePool = async () => {
    try {
        await pool.end();
        console.log('🔌 Pool de conexões PostgreSQL fechado');
    } catch (error) {
        console.error('❌ Erro ao fechar pool:', error.message);
    }
};

// Inicializar e testar conexão na inicialização
const initialize = async () => {
    console.log('🚀 Inicializando conexão com PostgreSQL...');

    const connected = await testConnection();
    if (!connected) {
        console.error('❌ Falha ao conectar com o banco de dados');
        process.exit(1);
    }

    const tablesExist = await checkTables();
    if (!tablesExist) {
        console.warn('⚠️ Execute os scripts SQL para criar as tabelas');
    }

    return connected && tablesExist;
};

module.exports = {
    pool,
    query,
    transaction,
    testConnection,
    checkTables,
    logActivity,
    closePool,
    initialize
};
