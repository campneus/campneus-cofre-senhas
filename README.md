# Cofre de Senhas - Administrativas - Campneus

Sistema completo de gerenciamento de senhas corporativas desenvolvido em Node.js com PostgreSQL.

## 🚀 Características

- **Backend**: Node.js com Express
- **Banco de Dados**: PostgreSQL
- **Autenticação**: Sistema de sessões com diferentes níveis de acesso
- **Interface**: EJS com design responsivo
- **Cores**: Amarelo (#FFC107), Branco (#FFFFFF), Preto (#000000)

## 📋 Funcionalidades

### Dashboard
- Estatísticas gerais do sistema
- Últimas senhas cadastradas
- Últimos acessos
- Senhas que expiram em breve
- Atividades recentes

### Gestão de Localidades
- Cadastro completo (código, nome, CNPJ, estado, cidade)
- Busca e filtros avançados
- Controle de ativação/desativação

### Gestão de Usuários
- Três níveis de acesso: Admin, Usuário, Visualizador
- Controle de permissões
- Histórico de acessos

### Cofre de Senhas
Organizado em 4 categorias principais:
- **Prefeituras**: Sistemas municipais
- **B2F/Convênios**: Sistemas de convênios
- **Órgãos Governo**: Sistemas governamentais
- **Fornecedores**: Sistemas de parceiros

#### Campos do Cofre:
- Localidade (relacionada à tabela de localidades)
- Usuário e Senha (criptografada)
- URL clicável
- Observações/Modo de Usuário
- Tags personalizáveis
- Sistema de favoritos
- Controle de expiração
- Rastreamento de acessos
- Auditoria completa

## 🛠️ Instalação

### Pré-requisitos
- Node.js 16+
- PostgreSQL 12+
- Git

### Passos para instalação local

1. **Clone ou extraia o projeto**
```bash
# Se usando Git
git clone <seu-repositorio>
cd cofre-senhas-campneus

# Ou extraia o arquivo ZIP
unzip cofre-senhas-campneus.zip
cd cofre-senhas-campneus
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o banco de dados**
```bash
# Crie o banco PostgreSQL
createdb cofre_senhas_db

# Execute o script de criação das tabelas
psql -d cofre_senhas_db -f database/database.sql

# Execute o script de dados fictícios (opcional)
psql -d cofre_senhas_db -f database/seeds.sql
```

4. **Configure as variáveis de ambiente**
```bash
# Copie o arquivo .env e ajuste as configurações
cp .env .env.local

# Edite o arquivo .env.local com suas configurações:
# - Dados do banco PostgreSQL
# - Chave secreta da sessão
# - Outras configurações
```

5. **Inicie o servidor**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

6. **Acesse o sistema**
```
http://localhost:3000
```

## 🚀 Deploy no Render

### 1. Preparação
- Faça upload dos arquivos para um repositório GitHub
- Crie uma conta no [Render](https://render.com)

### 2. Banco de Dados
1. No Render, crie um novo PostgreSQL database
2. Anote a URL de conexão fornecida
3. Execute os scripts SQL:
   ```bash
   # Conecte ao banco via psql usando a URL do Render
   psql <RENDER_DATABASE_URL>

   # Execute os scripts
   \i database/database.sql
   \i database/seeds.sql
   ```

### 3. Web Service
1. Crie um novo Web Service no Render
2. Conecte ao seu repositório GitHub
3. Configure as variáveis de ambiente:
   ```
   DATABASE_URL=<sua-url-postgresql-render>
   NODE_ENV=production
   SESSION_SECRET=<sua-chave-secreta-forte>
   PORT=3000
   ```
4. Deploy automático será executado

### 4. Primeiro Acesso
- **Usuário**: admin@campneus.com.br
- **Senha**: admin123

⚠️ **IMPORTANTE**: Altere a senha do administrador após o primeiro acesso!

## 📁 Estrutura do Projeto

```
cofre-senhas-campneus/
├── app.js                 # Arquivo principal
├── package.json           # Dependências
├── .env                   # Variáveis de ambiente
├── config/
│   └── database.js        # Configuração do banco
├── models/
│   ├── User.js           # Modelo de usuário
│   ├── Localidade.js     # Modelo de localidade
│   └── Senha.js          # Modelo de senha
├── routes/
│   ├── auth.js           # Rotas de autenticação
│   ├── dashboard.js      # Rotas do dashboard
│   ├── localidades.js   # Rotas de localidades
│   ├── usuarios.js       # Rotas de usuários
│   └── senhas.js         # Rotas do cofre
├── middleware/
│   └── auth.js           # Middleware de autenticação
├── views/
│   ├── layout.ejs        # Layout principal
│   ├── login.ejs         # Página de login
│   ├── dashboard.ejs     # Dashboard
│   ├── localidades.ejs  # Gestão de localidades
│   ├── usuarios.ejs      # Gestão de usuários
│   └── senhas.ejs        # Cofre de senhas
├── public/
│   ├── style.css         # Estilos CSS
│   └── script.js         # JavaScript frontend
└── database/
    ├── database.sql      # Script de criação
    └── seeds.sql         # Dados fictícios
```

## 🔐 Níveis de Acesso

### Administrador
- Acesso completo ao sistema
- Gerenciar usuários
- Todas as operações CRUD

### Usuário
- Criar, editar e visualizar senhas
- Gerenciar localidades
- Não pode gerenciar outros usuários

### Visualizador
- Apenas visualizar informações
- Não pode criar ou editar

## 🎨 Personalização

### Cores do Sistema
As cores podem ser alteradas no arquivo `public/style.css`:
```css
:root {
    --cor-primaria: #FFC107;      /* Amarelo */
    --cor-secundaria: #000000;    /* Preto */
    --cor-fundo: #FFFFFF;         /* Branco */
}
```

### Categorias de Senhas
Para adicionar novas categorias, insira na tabela `categorias_senha`:
```sql
INSERT INTO categorias_senha (nome, descricao, cor, icone, ordem) 
VALUES ('Nova Categoria', 'Descrição', '#COR', 'fas fa-icon', 5);
```

## 🔧 Manutenção

### Backup do Banco
```bash
pg_dump cofre_senhas_db > backup_$(date +%Y%m%d).sql
```

### Logs de Atividade
O sistema registra todas as ações na tabela `log_atividades`:
- Criação, edição e exclusão de registros
- Acessos às senhas
- Logins e logouts

### Monitoramento
- Verificar logs de erro no console
- Monitorar uso de memória e CPU
- Verificar espaço em disco do banco

## 📝 Scripts SQL Úteis

### Listar usuários ativos
```sql
SELECT nome, email, nivel_acesso, ultimo_acesso 
FROM usuarios 
WHERE ativo = true 
ORDER BY ultimo_acesso DESC;
```

### Senhas mais acessadas
```sql
SELECT cs.titulo, l.nome as localidade, cs.contador_acessos
FROM cofre_senhas cs
JOIN localidades l ON cs.localidade_id = l.id
WHERE cs.ativo = true
ORDER BY cs.contador_acessos DESC
LIMIT 10;
```

### Atividades por usuário
```sql
SELECT u.nome, COUNT(*) as total_atividades
FROM log_atividades la
JOIN usuarios u ON la.usuario_id = u.id
WHERE la.data_acao >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.nome
ORDER BY total_atividades DESC;
```

## 🆘 Solução de Problemas

### Erro de Conexão com Banco
1. Verifique se o PostgreSQL está rodando
2. Confirme as credenciais no arquivo `.env`
3. Teste a conexão manualmente

### Páginas não carregam
1. Verifique se todas as dependências foram instaladas
2. Confirme se as tabelas foram criadas
3. Verifique logs de erro no console

### Problemas de Permissão
1. Verifique o nível de acesso do usuário
2. Confirme se está logado corretamente
3. Limpe o cache do navegador

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação
2. Consulte os logs de erro
3. Revise as configurações do banco

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

**Desenvolvido para Campneus** - Sistema de Gerenciamento de Senhas Corporativas
