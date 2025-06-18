const express = require('express');
const router = express.Router();

// Mock data de usuários (substitua por consultas ao banco de dados em um aplicativo real)
let users = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
];

// Rota para listar todos os usuários
router.get('/', (req, res) => {
    res.json(users);
});

// Rota para adicionar um novo usuário
router.post('/', (req, res) => {
    const { name, email } = req.body;
    const newUser = { id: users.length + 1, name, email };
    users.push(newUser);
    res.status(201).json(newUser);
});

// Rota para atualizar um usuário existente
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;
    const user = users.find(u => u.id === parseInt(id));

    if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    res.json(user);
});

// Rota para excluir um usuário
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const userIndex = users.findIndex(u => u.id === parseInt(id));

    if (userIndex === -1) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    users.splice(userIndex, 1);
    res.status(204).send();
});

module.exports = router;