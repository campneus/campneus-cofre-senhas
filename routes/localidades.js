const express = require('express');
const router = express.Router();
const authenticate = require("../middleware/auth");

// Mock data de localidades (substitua por consultas ao banco de dados em um aplicativo real)
let localidades = [
    { id: 1, nome: 'São Paulo', estado: 'SP' },
    { id: 2, nome: 'Rio de Janeiro', estado: 'RJ' }
];

// Rota para listar todas as localidades
router.get('/', (req, res) => {
    res.json(localidades);
});

// Rota para adicionar uma nova localidade
router.post('/', (req, res) => {
    const { nome, estado } = req.body;
    const novaLocalidade = { id: localidades.length + 1, nome, estado };
    localidades.push(novaLocalidade);
    res.status(201).json(novaLocalidade);
});

// Rota para atualizar uma localidade existente
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { nome, estado } = req.body;
    const localidade = localidades.find(l => l.id === parseInt(id));

    if (!localidade) {
        return res.status(404).json({ message: 'Localidade não encontrada' });
    }

    localidade.nome = nome || localidade.nome;
    localidade.estado = estado || localidade.estado;
    res.json(localidade);
});

// Rota para excluir uma localidade
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const localidadeIndex = localidades.findIndex(l => l.id === parseInt(id));

    if (localidadeIndex === -1) {
        return res.status(404).json({ message: 'Localidade não encontrada' });
    }

    localidades.splice(localidadeIndex, 1);
    res.status(204).send();
});

module.exports = router;