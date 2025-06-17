-- Cofre de Senhas - Campneus
-- Script de criação do banco de dados
-- Data: 2024

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Usuários
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT true,
    nivel_acesso VARCHAR(20) DEFAULT 'usuario' CHECK (nivel_acesso IN ('admin', 'usuario', 'visualizador')),
    ultimo_acesso TIMESTAMP,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_modificacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Localidades
CREATE TABLE localidades (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    cnpj VARCHAR(18),
    estado VARCHAR(2) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    endereco TEXT,
    telefone VARCHAR(20),
    email VARCHAR(150),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    usuario_criacao INTEGER REFERENCES usuarios(id),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_modificacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Categorias de Senhas
CREATE TABLE categorias_senha (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao TEXT,
    cor VARCHAR(7) DEFAULT '#FFC107', -- Cor amarela padrão
    icone VARCHAR(50),
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela do Cofre de Senhas
CREATE TABLE cofre_senhas (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    localidade_id INTEGER NOT NULL REFERENCES localidades(id),
    categoria_id INTEGER NOT NULL REFERENCES categorias_senha(id),
    titulo VARCHAR(100) NOT NULL,
    usuario VARCHAR(100) NOT NULL,
    senha TEXT NOT NULL, -- Será criptografada
    url TEXT,
    observacoes TEXT,
    modo_usuario TEXT,
    tags TEXT, -- JSON array de tags
    favorito BOOLEAN DEFAULT false,

    -- Controle de acesso e auditoria
    usuario_criacao INTEGER NOT NULL REFERENCES usuarios(id),
    usuario_modificacao INTEGER REFERENCES usuarios(id),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_modificacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_ultimo_acesso TIMESTAMP,
    contador_acessos INTEGER DEFAULT 0,

    -- Configurações de segurança
    expira_em DATE,
    requer_mudanca BOOLEAN DEFAULT false,
    ativo BOOLEAN DEFAULT true
);

-- Tabela de Log de Atividades
CREATE TABLE log_atividades (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    tipo_acao VARCHAR(50) NOT NULL, -- 'CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
    tabela_afetada VARCHAR(50),
    registro_id INTEGER,
    descricao TEXT,
    ip_address INET,
    user_agent TEXT,
    dados_anteriores JSONB,
    dados_novos JSONB,
    data_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX idx_localidades_codigo ON localidades(codigo);
CREATE INDEX idx_localidades_ativo ON localidades(ativo);
CREATE INDEX idx_cofre_senhas_localidade ON cofre_senhas(localidade_id);
CREATE INDEX idx_cofre_senhas_categoria ON cofre_senhas(categoria_id);
CREATE INDEX idx_cofre_senhas_ativo ON cofre_senhas(ativo);
CREATE INDEX idx_cofre_senhas_data_criacao ON cofre_senhas(data_criacao);
CREATE INDEX idx_log_atividades_usuario ON log_atividades(usuario_id);
CREATE INDEX idx_log_atividades_data ON log_atividades(data_acao);

-- Triggers para atualizar data_modificacao automaticamente
CREATE OR REPLACE FUNCTION atualizar_data_modificacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_modificacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_usuarios_data_modificacao
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_data_modificacao();

CREATE TRIGGER trigger_localidades_data_modificacao
    BEFORE UPDATE ON localidades
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_data_modificacao();

CREATE TRIGGER trigger_cofre_senhas_data_modificacao
    BEFORE UPDATE ON cofre_senhas
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_data_modificacao();

-- View para dashboard com estatísticas
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM cofre_senhas WHERE ativo = true) as total_senhas,
    (SELECT COUNT(*) FROM localidades WHERE ativo = true) as total_localidades,
    (SELECT COUNT(*) FROM usuarios WHERE ativo = true) as total_usuarios,
    (SELECT COUNT(*) FROM cofre_senhas WHERE data_criacao >= CURRENT_DATE - INTERVAL '7 days') as senhas_semana,
    (SELECT COUNT(*) FROM log_atividades WHERE data_acao >= CURRENT_DATE - INTERVAL '24 hours') as atividades_hoje;

-- View para últimas senhas criadas
CREATE OR REPLACE VIEW ultimas_senhas AS
SELECT 
    cs.id,
    cs.titulo,
    l.nome as localidade,
    c.nome as categoria,
    u.nome as usuario_criacao,
    cs.data_criacao,
    cs.data_modificacao
FROM cofre_senhas cs
JOIN localidades l ON cs.localidade_id = l.id
JOIN categorias_senha c ON cs.categoria_id = c.id
JOIN usuarios u ON cs.usuario_criacao = u.id
WHERE cs.ativo = true
ORDER BY cs.data_criacao DESC
LIMIT 10;

-- View para últimos acessos
CREATE OR REPLACE VIEW ultimos_acessos AS
SELECT 
    cs.id,
    cs.titulo,
    l.nome as localidade,
    cs.data_ultimo_acesso,
    cs.contador_acessos
FROM cofre_senhas cs
JOIN localidades l ON cs.localidade_id = l.id
WHERE cs.ativo = true AND cs.data_ultimo_acesso IS NOT NULL
ORDER BY cs.data_ultimo_acesso DESC
LIMIT 10;

-- Comentários nas tabelas
COMMENT ON TABLE usuarios IS 'Tabela de usuários do sistema';
COMMENT ON TABLE localidades IS 'Tabela de localidades/empresas';
COMMENT ON TABLE categorias_senha IS 'Categorias para organização das senhas';
COMMENT ON TABLE cofre_senhas IS 'Tabela principal do cofre de senhas';
COMMENT ON TABLE log_atividades IS 'Log de todas as atividades do sistema';

-- Inserir dados básicos
-- As categorias padrão serão inseridas via seeds.sql
