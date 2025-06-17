const express = require('express');
const router = express.Router();

// Mock data de senhas (substitua por consultas ao banco de dados em um aplicativo real)
let senhas = [
    { id: 1, site: 'example.com', username: 'user1', password: 'password123' },
    { id: 2, site: 'another.com', username: 'user2', password: 'password456' }
];

// Rota para listar todas as senhas
router.get('/', (req, res) => {
    res.json(senhas);
});

// Rota para adicionar uma nova senha
router.post('/', (req, res) => {
    const { site, username, password } = req.body;
    const novaSenha = { id: senhas.length + 1, site, username, password };
    senhas.push(novaSenha);
    res.status(201).json(novaSenha);
});

// Rota para atualizar uma senha existente
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { site, username, password } = req.body;
    const senha = senhas.find(s => s.id === parseInt(id));

    if (!senha) {
        return res.status(404).json({ message: 'Senha não encontrada' });
    }

    senha.site = site || senha.site;
    senha.username = username || senha.username;
    senha.password = password || senha.password;
    res.json(senha);
});

// Rota para excluir uma senha
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const senhaIndex = senhas.findIndex(s => s.id === parseInt(id));

    if (senhaIndex === -1) {
        return res.status(404).json({ message: 'Senha não encontrada' });
    }

    senhas.splice(senhaIndex, 1);
    res.status(204).send();
});

module.exports = router;