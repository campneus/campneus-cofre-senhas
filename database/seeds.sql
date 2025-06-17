-- Cofre de Senhas - Campneus
-- Dados de exemplo para popular o banco
-- Data: 2024

-- Inserir usuário administrador padrão
-- Senha: admin123 (será hasheada pela aplicação)
INSERT INTO usuarios (nome, email, senha, nivel_acesso) VALUES 
('Administrador Sistema', 'admin@campneus.com.br', '$2b$12$LHOYwzVE.HVNzSrN3Qy0OuJxEJjLvFzXa1w1r3YmJzHEgLp8y1z2G', 'admin'),
('João Silva', 'joao.silva@campneus.com.br', '$2b$12$LHOYwzVE.HVNzSrN3Qy0OuJxEJjLvFzXa1w1r3YmJzHEgLp8y1z2G', 'usuario'),
('Maria Santos', 'maria.santos@campneus.com.br', '$2b$12$LHOYwzVE.HVNzSrN3Qy0OuJxEJjLvFzXa1w1r3YmJzHEgLp8y1z2G', 'usuario'),
('Pedro Oliveira', 'pedro.oliveira@campneus.com.br', '$2b$12$LHOYwzVE.HVNzSrN3Qy0OuJxEJjLvFzXa1w1r3YmJzHEgLp8y1z2G', 'visualizador');

-- Inserir categorias de senhas
INSERT INTO categorias_senha (nome, descricao, cor, icone, ordem) VALUES 
('Prefeituras', 'Senhas de sistemas e portais de prefeituras municipais', '#FFC107', 'fas fa-building', 1),
('B2F/Convênios', 'Senhas de sistemas B2F e convênios diversos', '#FF5722', 'fas fa-handshake', 2),
('Órgãos Governo', 'Senhas de sistemas governamentais estaduais e federais', '#2196F3', 'fas fa-university', 3),
('Fornecedores', 'Senhas de sistemas de fornecedores e parceiros', '#4CAF50', 'fas fa-truck', 4);

-- Inserir localidades de exemplo
INSERT INTO localidades (codigo, nome, cnpj, estado, cidade, endereco, telefone, email, usuario_criacao) VALUES 
('SP001', 'Prefeitura Municipal de São Paulo', '44.075.638/0001-48', 'SP', 'São Paulo', 'Viaduto do Chá, 15 - Centro', '(11) 3113-9000', 'contato@prefeitura.sp.gov.br', 1),
('RJ001', 'Prefeitura Municipal do Rio de Janeiro', '42.498.733/0001-48', 'RJ', 'Rio de Janeiro', 'Rua Afonso Cavalcanti, 455 - Cidade Nova', '(21) 2976-1111', 'contato@rio.rj.gov.br', 1),
('MG001', 'Prefeitura Municipal de Belo Horizonte', '18.715.100/0001-40', 'MG', 'Belo Horizonte', 'Av. Afonso Pena, 1212 - Centro', '(31) 3277-4000', 'prefeitura@pbh.gov.br', 1),
('BA001', 'Prefeitura Municipal de Salvador', '14.230.744/0001-71', 'BA', 'Salvador', 'Praça Tomé de Souza, s/n - Centro Histórico', '(71) 3202-1000', 'prefeitura@salvador.ba.gov.br', 1),
('PR001', 'Prefeitura Municipal de Curitiba', '75.105.299/0001-50', 'PR', 'Curitiba', 'Av. Cândido de Abreu, 817 - Centro Cívico', '(41) 3350-8000', 'contato@curitiba.pr.gov.br', 1),
('RS001', 'Prefeitura Municipal de Porto Alegre', '88.648.076/0001-11', 'RS', 'Porto Alegre', 'Praça Montevidéu, 10 - Centro Histórico', '(51) 3289-1000', 'gabinete@portoalegre.rs.gov.br', 1),
('CONV001', 'Convênio DETRAN-SP', '44.031.467/0001-43', 'SP', 'São Paulo', 'Rua do Convênio, 123', '(11) 2222-3333', 'convenio@detran.sp.gov.br', 1),
('FORN001', 'Fornecedor Tech Solutions Ltda', '12.345.678/0001-90', 'SP', 'São Paulo', 'Av. Paulista, 1000', '(11) 9999-8888', 'contato@techsolutions.com.br', 1);

-- Inserir senhas de exemplo para o cofre
INSERT INTO cofre_senhas (localidade_id, categoria_id, titulo, usuario, senha, url, observacoes, modo_usuario, usuario_criacao) VALUES 
-- Prefeituras
(1, 1, 'Sistema Tributário SP', 'admin.tributario', 'TribSP@2024!', 'https://tributario.prefeitura.sp.gov.br', 'Acesso ao sistema de tributação municipal', 'Administrador do sistema', 1),
(1, 1, 'Portal do Contribuinte SP', 'contribuinte.sp', 'ContribSP#2024', 'https://portal.prefeitura.sp.gov.br/contribuinte', 'Portal para emissão de guias e certidões', 'Usuário padrão', 1),
(2, 1, 'Sistema IPTU Rio', 'iptu.admin', 'IptuRJ@2024$', 'https://iptu.rio.rj.gov.br', 'Sistema de IPTU da cidade do Rio', 'Administrador', 2),
(3, 1, 'Portal PBH Digital', 'pbh.digital', 'PBH_Digital2024!', 'https://digital.pbh.gov.br', 'Portal de serviços digitais de BH', 'Gestor de conteúdo', 1),
(4, 1, 'Sistema Bahia Transparente', 'transparencia.ba', 'BahiaTransp@24', 'https://transparencia.salvador.ba.gov.br', 'Portal da transparência municipal', 'Editor', 2),

-- B2F/Convênios  
(7, 2, 'Sistema DETRAN Convênio', 'detran.convenio', 'DetranConv#2024', 'https://convenio.detran.sp.gov.br', 'Acesso ao sistema de convênio DETRAN', 'Operador de convênio', 1),
(7, 2, 'Portal B2F DETRAN', 'b2f.detran', 'B2F_Detran@24!', 'https://b2f.detran.sp.gov.br/portal', 'Portal B2F para serviços DETRAN', 'Usuário B2F', 3),

-- Órgãos Governo
(5, 3, 'Sistema Curitiba Gov', 'curitiba.gov', 'CuritibaGov2024#', 'https://gov.curitiba.pr.gov.br', 'Sistema governamental de Curitiba', 'Administrador municipal', 1),
(6, 3, 'Portal POA Cidadão', 'poa.cidadao', 'POA_Cidadao@24', 'https://cidadao.portoalegre.rs.gov.br', 'Portal do cidadão de Porto Alegre', 'Atendente', 2),

-- Fornecedores
(8, 4, 'Sistema Fornecedor Tech', 'tech.admin', 'TechSol@2024!', 'https://sistema.techsolutions.com.br', 'Sistema interno do fornecedor', 'Administrador', 1),
(8, 4, 'Portal Parceiro Tech', 'parceiro.tech', 'ParcTech#2024', 'https://parceiro.techsolutions.com.br', 'Portal para parceiros da Tech Solutions', 'Parceiro', 3);

-- Inserir algumas atividades de log de exemplo
INSERT INTO log_atividades (usuario_id, tipo_acao, tabela_afetada, registro_id, descricao, ip_address) VALUES 
(1, 'LOGIN', 'usuarios', 1, 'Login realizado com sucesso', '192.168.1.100'),
(1, 'CREATE', 'cofre_senhas', 1, 'Nova senha criada: Sistema Tributário SP', '192.168.1.100'),
(2, 'LOGIN', 'usuarios', 2, 'Login realizado com sucesso', '192.168.1.101'),
(2, 'READ', 'cofre_senhas', 3, 'Senha acessada: Sistema IPTU Rio', '192.168.1.101'),
(3, 'LOGIN', 'usuarios', 3, 'Login realizado com sucesso', '192.168.1.102'),
(1, 'UPDATE', 'localidades', 1, 'Localidade atualizada: Prefeitura Municipal de São Paulo', '192.168.1.100'),
(2, 'CREATE', 'cofre_senhas', 5, 'Nova senha criada: Sistema Bahia Transparente', '192.168.1.101'),
(3, 'READ', 'cofre_senhas', 7, 'Senha acessada: Portal B2F DETRAN', '192.168.1.102');

-- Atualizar contadores de acesso e datas
UPDATE cofre_senhas SET 
    contador_acessos = 1,
    data_ultimo_acesso = CURRENT_TIMESTAMP - INTERVAL '2 hours'
WHERE id IN (3, 7);

UPDATE cofre_senhas SET 
    contador_acessos = 3,
    data_ultimo_acesso = CURRENT_TIMESTAMP - INTERVAL '30 minutes'
WHERE id = 1;

UPDATE cofre_senhas SET 
    contador_acessos = 2,
    data_ultimo_acesso = CURRENT_TIMESTAMP - INTERVAL '1 hour'
WHERE id = 5;

-- Atualizar último acesso dos usuários
UPDATE usuarios SET ultimo_acesso = CURRENT_TIMESTAMP - INTERVAL '10 minutes' WHERE id = 1;
UPDATE usuarios SET ultimo_acesso = CURRENT_TIMESTAMP - INTERVAL '1 hour' WHERE id = 2;
UPDATE usuarios SET ultimo_acesso = CURRENT_TIMESTAMP - INTERVAL '2 hours' WHERE id = 3;

-- Inserir algumas senhas com datas variadas para simular histórico
INSERT INTO cofre_senhas (localidade_id, categoria_id, titulo, usuario, senha, url, observacoes, modo_usuario, usuario_criacao, data_criacao) VALUES 
(1, 1, 'Sistema Antigo SP', 'antigo.sp', 'AntigoSP@2023', 'https://antigo.sp.gov.br', 'Sistema legado - descontinuado', 'Administrador', 1, CURRENT_TIMESTAMP - INTERVAL '30 days'),
(2, 1, 'Portal Histórico RJ', 'historico.rj', 'HistRJ#2023', 'https://historico.rio.rj.gov.br', 'Portal histórico para consultas', 'Consultor', 2, CURRENT_TIMESTAMP - INTERVAL '15 days'),
(3, 1, 'Sistema Backup BH', 'backup.bh', 'BackupBH@23', 'https://backup.pbh.gov.br', 'Sistema de backup municipal', 'Técnico', 1, CURRENT_TIMESTAMP - INTERVAL '7 days');

-- Definir algumas senhas como favoritas
UPDATE cofre_senhas SET favorito = true WHERE id IN (1, 3, 8);

-- Adicionar tags em algumas senhas (formato JSON)
UPDATE cofre_senhas SET tags = '["prioritario", "producao"]' WHERE id = 1;
UPDATE cofre_senhas SET tags = '["tributario", "municipal"]' WHERE id = 2;
UPDATE cofre_senhas SET tags = '["convenio", "detran"]' WHERE id = 6;
UPDATE cofre_senhas SET tags = '["fornecedor", "parceiro"]' WHERE id IN (10, 11);

-- Commit das alterações
COMMIT;

-- Exibir estatísticas inseridas
SELECT 'Dados de exemplo inseridos com sucesso!' as status;
SELECT 
    'Usuários: ' || COUNT(*) as usuarios FROM usuarios
UNION ALL
SELECT 
    'Localidades: ' || COUNT(*) as localidades FROM localidades  
UNION ALL
SELECT 
    'Categorias: ' || COUNT(*) as categorias FROM categorias_senha
UNION ALL
SELECT 
    'Senhas: ' || COUNT(*) as senhas FROM cofre_senhas
UNION ALL
SELECT 
    'Logs: ' || COUNT(*) as logs FROM log_atividades;
