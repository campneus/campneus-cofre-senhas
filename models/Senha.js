const bcrypt = require('bcryptjs');
const { query, logActivity } = require('../config/database');

class Senha {
    constructor(data) {
        this.id = data.id;
        this.uuid = data.uuid;
        this.localidade_id = data.localidade_id;
        this.categoria_id = data.categoria_id;
        this.titulo = data.titulo;
        this.usuario = data.usuario;
        this.senha = data.senha;
        this.url = data.url;
        this.observacoes = data.observacoes;
        this.modo_usuario = data.modo_usuario;
        this.tags = data.tags;
        this.favorito = data.favorito;
        this.usuario_criacao = data.usuario_criacao;
        this.usuario_modificacao = data.usuario_modificacao;
        this.data_criacao = data.data_criacao;
        this.data_modificacao = data.data_modificacao;
        this.data_ultimo_acesso = data.data_ultimo_acesso;
        this.contador_acessos = data.contador_acessos;
        this.expira_em = data.expira_em;
        this.requer_mudanca = data.requer_mudanca;
        this.ativo = data.ativo;

        // Dados relacionados (quando incluídos)
        this.localidade_nome = data.localidade_nome;
        this.categoria_nome = data.categoria_nome;
        this.categoria_cor = data.categoria_cor;
        this.usuario_criacao_nome = data.usuario_criacao_nome;
    }

    // Criar nova senha
    static async create(data, createdBy) {
        try {
            // Criptografar a senha
            const hashedPassword = await bcrypt.hash(data.senha, 10);

            const result = await query(`
                INSERT INTO cofre_senhas 
                (localidade_id, categoria_id, titulo, usuario, senha, url, observacoes, modo_usuario, tags, favorito, usuario_criacao, expira_em, requer_mudanca)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *
            `, [
                data.localidade_id,
                data.categoria_id,
                data.titulo,
                data.usuario,
                hashedPassword,
                data.url || null,
                data.observacoes || null,
                data.modo_usuario || null,
                data.tags ? JSON.stringify(data.tags) : null,
                data.favorito || false,
                createdBy,
                data.expira_em || null,
                data.requer_mudanca || false
            ]);

            const senha = new Senha(result.rows[0]);

            // Log da atividade
            await logActivity(createdBy, 'CREATE', 'cofre_senhas', senha.id, `Senha criada: ${data.titulo}`, null, null);

            return senha;
        } catch (error) {
            throw error;
        }
    }

    // Buscar senha por ID
    static async findById(id) {
        try {
            const result = await query(`
                SELECT 
                    cs.*,
                    l.nome as localidade_nome,
                    c.nome as categoria_nome,
                    c.cor as categoria_cor,
                    u.nome as usuario_criacao_nome
                FROM cofre_senhas cs
                JOIN localidades l ON cs.localidade_id = l.id
                JOIN categorias_senha c ON cs.categoria_id = c.id
                JOIN usuarios u ON cs.usuario_criacao = u.id
                WHERE cs.id = $1 AND cs.ativo = true
            `, [id]);

            return result.rows.length ? new Senha(result.rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Buscar senha por UUID
    static async findByUuid(uuid) {
        try {
            const result = await query(`
                SELECT 
                    cs.*,
                    l.nome as localidade_nome,
                    c.nome as categoria_nome,
                    c.cor as categoria_cor,
                    u.nome as usuario_criacao_nome
                FROM cofre_senhas cs
                JOIN localidades l ON cs.localidade_id = l.id
                JOIN categorias_senha c ON cs.categoria_id = c.id
                JOIN usuarios u ON cs.usuario_criacao = u.id
                WHERE cs.uuid = $1 AND cs.ativo = true
            `, [uuid]);

            return result.rows.length ? new Senha(result.rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Listar todas as senhas
    static async findAll(limit = 50, offset = 0, filters = {}) {
        try {
            let whereClause = 'WHERE cs.ativo = true';
            const params = [];
            let paramCount = 1;

            // Filtros
            if (filters.categoria_id) {
                whereClause += ` AND cs.categoria_id = $${paramCount}`;
                params.push(filters.categoria_id);
                paramCount++;
            }

            if (filters.localidade_id) {
                whereClause += ` AND cs.localidade_id = $${paramCount}`;
                params.push(filters.localidade_id);
                paramCount++;
            }

            if (filters.favorito) {
                whereClause += ` AND cs.favorito = $${paramCount}`;
                params.push(filters.favorito);
                paramCount++;
            }

            if (filters.expirando) {
                whereClause += ` AND cs.expira_em <= CURRENT_DATE + INTERVAL '30 days'`;
            }

            if (filters.search) {
                whereClause += ` AND (cs.titulo ILIKE $${paramCount} OR cs.usuario ILIKE $${paramCount} OR cs.observacoes ILIKE $${paramCount})`;
                params.push(`%${filters.search}%`);
                paramCount++;
            }

            params.push(limit, offset);

            const result = await query(`
                SELECT 
                    cs.id, cs.uuid, cs.titulo, cs.usuario, cs.url, cs.observacoes, cs.modo_usuario,
                    cs.tags, cs.favorito, cs.data_criacao, cs.data_modificacao, cs.data_ultimo_acesso,
                    cs.contador_acessos, cs.expira_em, cs.requer_mudanca,
                    l.nome as localidade_nome,
                    c.nome as categoria_nome,
                    c.cor as categoria_cor,
                    u.nome as usuario_criacao_nome
                FROM cofre_senhas cs
                JOIN localidades l ON cs.localidade_id = l.id
                JOIN categorias_senha c ON cs.categoria_id = c.id
                JOIN usuarios u ON cs.usuario_criacao = u.id
                ${whereClause}
                ORDER BY cs.data_criacao DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `, params);

            return result.rows.map(row => new Senha(row));
        } catch (error) {
            throw error;
        }
    }

    // Contar total de senhas
    static async count(filters = {}) {
        try {
            let whereClause = 'WHERE cs.ativo = true';
            const params = [];
            let paramCount = 1;

            // Aplicar mesmos filtros do findAll
            if (filters.categoria_id) {
                whereClause += ` AND cs.categoria_id = $${paramCount}`;
                params.push(filters.categoria_id);
                paramCount++;
            }

            if (filters.localidade_id) {
                whereClause += ` AND cs.localidade_id = $${paramCount}`;
                params.push(filters.localidade_id);
                paramCount++;
            }

            if (filters.favorito) {
                whereClause += ` AND cs.favorito = $${paramCount}`;
                params.push(filters.favorito);
                paramCount++;
            }

            if (filters.expirando) {
                whereClause += ` AND cs.expira_em <= CURRENT_DATE + INTERVAL '30 days'`;
            }

            if (filters.search) {
                whereClause += ` AND (cs.titulo ILIKE $${paramCount} OR cs.usuario ILIKE $${paramCount} OR cs.observacoes ILIKE $${paramCount})`;
                params.push(`%${filters.search}%`);
                paramCount++;
            }

            const result = await query(`
                SELECT COUNT(*) 
                FROM cofre_senhas cs
                JOIN localidades l ON cs.localidade_id = l.id
                JOIN categorias_senha c ON cs.categoria_id = c.id
                ${whereClause}
            `, params);

            return parseInt(result.rows[0].count);
        } catch (error) {
            throw error;
        }
    }

    // Buscar senhas por categoria
    static async findByCategory(categoryId, limit = 20) {
        try {
            const result = await query(`
                SELECT 
                    cs.id, cs.uuid, cs.titulo, cs.usuario, cs.url, cs.favorito,
                    cs.data_criacao, cs.data_ultimo_acesso, cs.contador_acessos,
                    l.nome as localidade_nome,
                    c.nome as categoria_nome,
                    c.cor as categoria_cor
                FROM cofre_senhas cs
                JOIN localidades l ON cs.localidade_id = l.id
                JOIN categorias_senha c ON cs.categoria_id = c.id
                WHERE cs.categoria_id = $1 AND cs.ativo = true
                ORDER BY cs.data_criacao DESC
                LIMIT $2
            `, [categoryId, limit]);

            return result.rows.map(row => new Senha(row));
        } catch (error) {
            throw error;
        }
    }

    // Buscar senhas favoritas
    static async findFavorites(userId = null, limit = 20) {
        try {
            const result = await query(`
                SELECT 
                    cs.id, cs.uuid, cs.titulo, cs.usuario, cs.url,
                    cs.data_criacao, cs.data_ultimo_acesso, cs.contador_acessos,
                    l.nome as localidade_nome,
                    c.nome as categoria_nome,
                    c.cor as categoria_cor
                FROM cofre_senhas cs
                JOIN localidades l ON cs.localidade_id = l.id
                JOIN categorias_senha c ON cs.categoria_id = c.id
                WHERE cs.favorito = true AND cs.ativo = true
                ORDER BY cs.data_ultimo_acesso DESC, cs.data_criacao DESC
                LIMIT $1
            `, [limit]);

            return result.rows.map(row => new Senha(row));
        } catch (error) {
            throw error;
        }
    }

    // Buscar senhas que expiram em breve
    static async findExpiring(days = 30) {
        try {
            const result = await query(`
                SELECT 
                    cs.id, cs.uuid, cs.titulo, cs.usuario, cs.url, cs.expira_em,
                    l.nome as localidade_nome,
                    c.nome as categoria_nome,
                    c.cor as categoria_cor
                FROM cofre_senhas cs
                JOIN localidades l ON cs.localidade_id = l.id
                JOIN categorias_senha c ON cs.categoria_id = c.id
                WHERE cs.expira_em <= CURRENT_DATE + INTERVAL '${days} days' 
                AND cs.expira_em >= CURRENT_DATE
                AND cs.ativo = true
                ORDER BY cs.expira_em ASC
            `);

            return result.rows.map(row => new Senha(row));
        } catch (error) {
            throw error;
        }
    }

    // Atualizar senha
    async update(data, updatedBy) {
        try {
            const allowedFields = ['localidade_id', 'categoria_id', 'titulo', 'usuario', 'url', 'observacoes', 'modo_usuario', 'tags', 'favorito', 'expira_em', 'requer_mudanca'];
            const fields = [];
            const values = [];
            let paramCount = 1;

            // Construir query dinamicamente
            for (const field of allowedFields) {
                if (data[field] !== undefined) {
                    if (field === 'tags' && data[field]) {
                        fields.push(`${field} = $${paramCount}`);
                        values.push(JSON.stringify(data[field]));
                    } else {
                        fields.push(`${field} = $${paramCount}`);
                        values.push(data[field] === '' ? null : data[field]);
                    }
                    paramCount++;
                }
            }

            // Atualizar senha se fornecida
            if (data.senha) {
                const hashedPassword = await bcrypt.hash(data.senha, 10);
                fields.push(`senha = $${paramCount}`);
                values.push(hashedPassword);
                paramCount++;
            }

            // Adicionar usuario_modificacao
            fields.push(`usuario_modificacao = $${paramCount}`);
            values.push(updatedBy);
            paramCount++;

            if (fields.length === 1) { // Apenas usuario_modificacao
                throw new Error('Nenhum campo válido para atualizar');
            }

            values.push(this.id);

            const result = await query(`
                UPDATE cofre_senhas 
                SET ${fields.join(', ')} 
                WHERE id = $${paramCount}
                RETURNING *
            `, values);

            if (result.rows.length === 0) {
                throw new Error('Senha não encontrada');
            }

            // Atualizar propriedades do objeto
            Object.assign(this, result.rows[0]);

            // Log da atividade
            await logActivity(updatedBy, 'UPDATE', 'cofre_senhas', this.id, `Senha atualizada: ${this.titulo}`, null, null);

            return this;
        } catch (error) {
            throw error;
        }
    }

    // Registrar acesso à senha
    async recordAccess(userId, ipAddress = null) {
        try {
            await query(`
                UPDATE cofre_senhas 
                SET contador_acessos = contador_acessos + 1,
                    data_ultimo_acesso = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [this.id]);

            this.contador_acessos = (this.contador_acessos || 0) + 1;
            this.data_ultimo_acesso = new Date();

            // Log da atividade
            await logActivity(userId, 'READ', 'cofre_senhas', this.id, `Senha acessada: ${this.titulo}`, ipAddress, null);

            return this;
        } catch (error) {
            throw error;
        }
    }

    // Obter senha descriptografada (para visualização)
    async getDecryptedPassword(userId, ipAddress = null) {
        try {
            // Registrar acesso
            await this.recordAccess(userId, ipAddress);

            // Retornar senha (já descriptografada pelo bcrypt não é necessário)
            // Em produção, considere usar criptografia simétrica
            return this.senha;
        } catch (error) {
            throw error;
        }
    }

    // Alternar favorito
    async toggleFavorite(userId) {
        try {
            const newFavoriteStatus = !this.favorito;

            await query(`
                UPDATE cofre_senhas 
                SET favorito = $1 
                WHERE id = $2
            `, [newFavoriteStatus, this.id]);

            this.favorito = newFavoriteStatus;

            // Log da atividade
            const action = newFavoriteStatus ? 'adicionada aos favoritos' : 'removida dos favoritos';
            await logActivity(userId, 'UPDATE', 'cofre_senhas', this.id, `Senha ${action}: ${this.titulo}`, null, null);

            return this;
        } catch (error) {
            throw error;
        }
    }

    // Desativar senha (soft delete)
    async deactivate(deactivatedBy) {
        try {
            await query(`
                UPDATE cofre_senhas 
                SET ativo = false 
                WHERE id = $1
            `, [this.id]);

            this.ativo = false;

            // Log da atividade
            await logActivity(deactivatedBy, 'DELETE', 'cofre_senhas', this.id, `Senha desativada: ${this.titulo}`, null, null);

            return this;
        } catch (error) {
            throw error;
        }
    }

    // Obter estatísticas da senha
    async getStats() {
        try {
            const result = await query(`
                SELECT 
                    COUNT(*) as total_acessos,
                    MAX(data_acao) as ultimo_log,
                    COUNT(CASE WHEN data_acao >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as acessos_semana
                FROM log_atividades 
                WHERE tabela_afetada = 'cofre_senhas' 
                AND registro_id = $1 
                AND tipo_acao = 'READ'
            `, [this.id]);

            return {
                total_acessos: parseInt(result.rows[0].total_acessos),
                ultimo_log: result.rows[0].ultimo_log,
                acessos_semana: parseInt(result.rows[0].acessos_semana),
                contador_acessos: this.contador_acessos || 0
            };
        } catch (error) {
            throw error;
        }
    }

    // Verificar se a senha expirou
    isExpired() {
        if (!this.expira_em) return false;
        return new Date(this.expira_em) < new Date();
    }

    // Verificar se a senha expira em breve
    isExpiringSoon(days = 30) {
        if (!this.expira_em) return false;
        const expirationDate = new Date(this.expira_em);
        const warningDate = new Date();
        warningDate.setDate(warningDate.getDate() + days);
        return expirationDate <= warningDate && expirationDate >= new Date();
    }

    // Converter para JSON (sem senha)
    toJSON() {
        const { senha, ...senhaWithoutPassword } = this;
        return senhaWithoutPassword;
    }

    // Converter tags de string para array
    getTagsArray() {
        if (!this.tags) return [];
        try {
            return typeof this.tags === 'string' ? JSON.parse(this.tags) : this.tags;
        } catch {
            return [];
        }
    }
}

module.exports = Senha;
