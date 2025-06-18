const bcrypt = require('bcrypt');

// Testar se a senha 'admin123' corresponde ao hash do banco
const senhaTexto = 'admin123';
const hashDoBanco = '$2b$12$LHOYwzVE.HVNzSrN3Qy0OuJxEJjLvFzXa1w1r3YmJzHEgLp8y1z2G';

console.log('Testando senha:', senhaTexto);
console.log('Hash do banco:', hashDoBanco);

bcrypt.compare(senhaTexto, hashDoBanco, (err, result) => {
    if (err) {
        console.error('Erro ao comparar:', err);
        return;
    }
    
    console.log('Senha válida:', result);
    
    if (!result) {
        console.log('\nGerando novo hash para admin123:');
        const novoHash = bcrypt.hashSync(senhaTexto, 12);
        console.log('Novo hash:', novoHash);
        
        // Testar o novo hash
        bcrypt.compare(senhaTexto, novoHash, (err2, result2) => {
            console.log('Novo hash válido:', result2);
        });
    }
});

