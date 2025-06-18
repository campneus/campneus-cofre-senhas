-- Atualizar senhas dos usuários com hash correto para 'admin123'
-- Hash gerado: $2b$12$LHA/MQ9L6rSKDIIqxq2oKuVO8S0QVBChhGvc96rpGO0gtVR4UESO6

UPDATE usuarios SET senha = '$2b$12$LHA/MQ9L6rSKDIIqxq2oKuVO8S0QVBChhGvc96rpGO0gtVR4UESO6' 
WHERE email IN (
    'admin@campneus.com.br',
    'joao.silva@campneus.com.br', 
    'maria.santos@campneus.com.br',
    'pedro.oliveira@campneus.com.br'
);

-- Verificar se as senhas foram atualizadas
SELECT id, nome, email, nivel_acesso, 
       CASE WHEN senha = '$2b$12$LHA/MQ9L6rSKDIIqxq2oKuVO8S0QVBChhGvc96rpGO0gtVR4UESO6' 
            THEN 'Hash correto' 
            ELSE 'Hash incorreto' 
       END as status_senha
FROM usuarios 
WHERE email IN (
    'admin@campneus.com.br',
    'joao.silva@campneus.com.br', 
    'maria.santos@campneus.com.br',
    'pedro.oliveira@campneus.com.br'
);

