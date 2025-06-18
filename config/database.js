const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  port: 5432, // Default PostgreSQL port
  ssl: {
    rejectUnauthorized: false
  }
});

// Função para registrar atividades no log
async function logActivity(userId, tipoAcao, tabelaAfetada, registroId, descricao, ipAddress, userAgent, dadosAnteriores = null, dadosNovos = null) {
  try {
    await pool.query(`
      INSERT INTO log_atividades (usuario_id, tipo_acao, tabela_afetada, registro_id, descricao, ip_address, user_agent, dados_anteriores, dados_novos)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [userId, tipoAcao, tabelaAfetada, registroId, descricao, ipAddress, userAgent, dadosAnteriores, dadosNovos]);
  } catch (error) {
    console.error('Erro ao registrar atividade:', error);
    // Não lançar erro para não interromper o fluxo principal
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  logActivity: logActivity,
};