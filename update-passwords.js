const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function updatePasswords() {
    const client = new Client({
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        port: 5432,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Conectado ao banco de dados');

        // Gerar hash correto para 'admin123'
        const senhaTexto = 'admin123';
        const novoHash = await bcrypt.hash(senhaTexto, 12);
        console.log('Novo hash gerado:', novoHash);

        // Atualizar senhas dos usuários
        const emails = [
            'admin@campneus.com.br',
            'joao.silva@campneus.com.br',
            'maria.santos@campneus.com.br',
            'pedro.oliveira@campneus.com.br'
        ];

        for (const email of emails) {
            const result = await client.query(
                'UPDATE usuarios SET senha = $1 WHERE email = $2 RETURNING id, nome, email',
                [novoHash, email]
            );
            
            if (result.rows.length > 0) {
                console.log(`Senha atualizada para: ${result.rows[0].nome} (${result.rows[0].email})`);
            } else {
                console.log(`Usuário não encontrado: ${email}`);
            }
        }

        // Verificar se as atualizações foram feitas
        const verification = await client.query(
            'SELECT id, nome, email FROM usuarios WHERE email = ANY($1)',
            [emails]
        );

        console.log('\nUsuários encontrados no banco:');
        verification.rows.forEach(user => {
            console.log(`- ${user.nome} (${user.email})`);
        });

    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await client.end();
        console.log('Conexão fechada');
    }
}

updatePasswords();

