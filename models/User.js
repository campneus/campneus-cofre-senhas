const bcrypt = require('bcryptjs');
const { query, logActivity } = require('../config/database');

class User {
    constructor(data) {
        this.id = data.id;
        this.uuid = data.uuid;
        this.nome = data.nome;
        this.email = data.email;
        this.senha = data.senha;
        this.ativo = data.ativo;
        this.nivel_acesso = data.nivel_acesso;
        this.ultimo_acesso = data.ultimo_acesso;
        this.data_criacao = data.data_criacao;
        this.data_modificacao = data.data_modificacao;
    }

    // Criar novo usuário
    static async create({ nome, email, senha, nivel_acesso = 'usuario' }) {
        try {
            // Verificar se email já existe
            const existingUser = await this.findByEmail(email);
            if (existingUser) {
                throw new Error('Email já está em uso');
            }

            // Hash da senha
            const hashedPassword = await bcrypt.hash(senha, parseInt(process.env.BCRYPT_ROUNDS) || 12);

            const result = await query(`
                INSERT INTO usuarios (nome, email, senha, nivel_acesso)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `, [nome, email, hashedPassword, nivel_acesso]);

            const user = new User(result.rows[0]);

            // Log da atividade
            await logActivity(user.id, 'CREATE', 'usuarios', user.id, `Usuário criado: ${nome}`, null, null);

            return user;
        } catch (error) {
            throw error;
        }
    }

    // Buscar usuário por ID
    static async findById(id) {
        try {
            const result = await query('SELECT * FROM usuarios WHERE id = $1 AND ativo = true', [id]);
            return result.rows.length ? new User(result.rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Buscar usuário por UUID
    static async findByUuid(uuid) {
        try {
            const result = await query('SELECT * FROM usuarios WHERE uuid = $1 AND ativo = true', [uuid]);
            return result.rows.length ? new User(result.rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Buscar usuário por email
    static async findByEmail(email) {
        try {
            const result = await query('SELECT * FROM usuarios WHERE email = $1 AND ativo = true', [email]);
            return result.rows.length ? new User(result.rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Listar todos os usuários
    static async findAll(limit = 50, offset = 0) {
        try {
            const result = await query(`
                SELECT id, uuid, nome, email, ativo, nivel_acesso, ultimo_acesso, data_criacao, data_modificacao 
                FROM usuarios 
                WHERE ativo = true 
                ORDER BY nome 
                LIMIT $1 OFFSET $2
            `, [limit, offset]);

            return result.rows.map(row => new User(row));
        } catch (error) {
            throw error;
        }
    }

    // Contar total de usuários
    static async count() {
        try {
            const result = await query('SELECT COUNT(*) FROM usuarios WHERE ativo = true');
            return parseInt(result.rows[0].count);
        } catch (error) {
            throw error;
        }
    }

    // Verificar senha
    async verifyPassword(senha) {
        try {
            return await bcrypt.compare(senha, this.senha);
        } catch (error) {
            throw error;
        }
    }

    // Atualizar último acesso
    async updateLastAccess(ipAddress = null) {
        try {
            await query(`
                UPDATE usuarios 
                SET ultimo_acesso = CURRENT_TIMESTAMP 
                WHERE id = $1
            `, [this.id]);

            this.ultimo_acesso = new Date();

            // Log da atividade
            await logActivity(this.id, 'LOGIN', 'usuarios', this.id, 'Login realizado', ipAddress, null);

            return this;
        } catch (error) {
            throw error;
        }
    }

    // Atualizar dados do usuário
    async update(data, updatedBy = null) {
        try {
            const allowedFields = ['nome', 'email', 'nivel_acesso', 'ativo'];
            const fields = [];
            const values = [];
            let paramCount = 1;

            // Verificar se email já existe (se está sendo alterado)
            if (data.email && data.email !== this.email) {
                const existingUser = await User.findByEmail(data.email);
                if (existingUser && existingUser.id !== this.id) {
                    throw new Error('Email já está em uso');
                }
            }

            // Construir query dinamicamente
            for (const field of allowedFields) {
                if (data[field] !== undefined) {
                    fields.push(`${field} = $${paramCount}`);
                    values.push(data[field]);
                    paramCount++;
                }
            }

            if (fields.length === 0) {
                throw new Error('Nenhum campo válido para atualizar');
            }

            values.push(this.id);

            const result = await query(`
                UPDATE usuarios 
                SET ${fields.join(', ')} 
                WHERE id = $${paramCount}
                RETURNING *
            `, values);

            if (result.rows.length === 0) {
                throw new Error('Usuário não encontrado');
            }

            // Atualizar propriedades do objeto
            Object.assign(this, result.rows[0]);

            // Log da atividade
            const userId = updatedBy || this.id;
            await logActivity(userId, 'UPDATE', 'usuarios', this.id, `Usuário atualizado: ${this.nome}`, null, null);

            return this;
        } catch (error) {
            throw error;
        }
    }

    // Alterar senha
    async changePassword(novaSenha, updatedBy = null) {
        try {
            const hashedPassword = await bcrypt.hash(novaSenha, parseInt(process.env.BCRYPT_ROUNDS) || 12);

            await query(`
                UPDATE usuarios 
                SET senha = $1 
                WHERE id = $2
            `, [hashedPassword, this.id]);

            this.senha = hashedPassword;

            // Log da atividade
            const userId = updatedBy || this.id;
            await logActivity(userId, 'UPDATE', 'usuarios', this.id, 'Senha alterada', null, null);

            return this;
        } catch (error) {
            throw error;
        }
    }

    // Desativar usuário (soft delete)
    async deactivate(deactivatedBy = null) {
        try {
            await query(`
                UPDATE usuarios 
                SET ativo = false 
                WHERE id = $1
            `, [this.id]);

            this.ativo = false;

            // Log da atividade
            const userId = deactivatedBy || this.id;
            await logActivity(userId, 'DELETE', 'usuarios', this.id, `Usuário desativado: ${this.nome}`, null, null);

            return this;
        } catch (error) {
            throw error;
        }
    }

    // Reativar usuário
    async reactivate(reactivatedBy = null) {
        try {
            await query(`
                UPDATE usuarios 
                SET ativo = true 
                WHERE id = $1
            `, [this.id]);

            this.ativo = true;

            // Log da atividade
            const userId = reactivatedBy || this.id;
            await logActivity(userId, 'UPDATE', 'usuarios', this.id, `Usuário reativado: ${this.nome}`, null, null);

            return this;
        } catch (error) {
            throw error;
        }
    }

    // Buscar por termo (nome ou email)
    static async search(term, limit = 20) {
        try {
            const result = await query(`
                SELECT id, uuid, nome, email, ativo, nivel_acesso, ultimo_acesso, data_criacao 
                FROM usuarios 
                WHERE ativo = true 
                AND (nome ILIKE $1 OR email ILIKE $1)
                ORDER BY nome 
                LIMIT $2
            `, [`%${term}%`, limit]);

            return result.rows.map(row => new User(row));
        } catch (error) {
            throw error;
        }
    }

    // Converter para JSON (sem senha)
    toJSON() {
        const { senha, ...userWithoutPassword } = this;
        return userWithoutPassword;
    }

    // Verificar se é admin
    isAdmin() {
        return this.nivel_acesso === 'admin';
    }

    // Verificar se pode editar
    canEdit() {
        return ['admin', 'usuario'].includes(this.nivel_acesso);
    }

    // Verificar se pode apenas visualizar
    isViewer() {
        return this.nivel_acesso === 'visualizador';
    }
}

module.exports = User;
