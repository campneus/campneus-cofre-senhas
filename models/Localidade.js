const { query, logActivity } = require('../config/database');

class Localidade {
    constructor(data) {
        this.id = data.id;
        this.codigo = data.codigo;
        this.nome = data.nome;
        this.cnpj = data.cnpj;
        this.estado = data.estado;
        this.cidade = data.cidade;
        this.endereco = data.endereco;
        this.telefone = data.telefone;
        this.email = data.email;
        this.observacoes = data.observacoes;
        this.ativo = data.ativo;
        this.usuario_criacao = data.usuario_criacao;
        this.data_criacao = data.data_criacao;
        this.data_modificacao = data.data_modificacao;
    }

    // Criar nova localidade
    static async create(data, createdBy) {
        try {
            // Verificar se código já existe
            const existingLocalidade = await this.findByCode(data.codigo);
            if (existingLocalidade) {
                throw new Error('Código já está em uso');
            }

            const result = await query(`
                INSERT INTO localidades 
                (codigo, nome, cnpj, estado, cidade, endereco, telefone, email, observacoes, usuario_criacao)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `, [
                data.codigo,
                data.nome,
                data.cnpj || null,
                data.estado,
                data.cidade,
                data.endereco || null,
                data.telefone || null,
                data.email || null,
                data.observacoes || null,
                createdBy
            ]);

            const localidade = new Localidade(result.rows[0]);

            // Log da atividade
            await logActivity(createdBy, 'CREATE', 'localidades', localidade.id, `Localidade criada: ${data.nome}`, null, null);

            return localidade;
        } catch (error) {
            throw error;
        }
    }

    // Buscar localidade por ID
    static async findById(id) {
        try {
            const result = await query('SELECT * FROM localidades WHERE id = $1 AND ativo = true', [id]);
            return result.rows.length ? new Localidade(result.rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Buscar localidade por código
    static async findByCode(codigo) {
        try {
            const result = await query('SELECT * FROM localidades WHERE codigo = $1 AND ativo = true', [codigo]);
            return result.rows.length ? new Localidade(result.rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Listar todas as localidades
    static async findAll(limit = 50, offset = 0) {
        try {
            const result = await query(`
                SELECT l.*, u.nome as nome_usuario_criacao
                FROM localidades l
                LEFT JOIN usuarios u ON l.usuario_criacao = u.id
                WHERE l.ativo = true 
                ORDER BY l.nome 
                LIMIT $1 OFFSET $2
            `, [limit, offset]);

            return result.rows.map(row => new Localidade(row));
        } catch (error) {
            throw error;
        }
    }

    // Contar total de localidades
    static async count() {
        try {
            const result = await query('SELECT COUNT(*) FROM localidades WHERE ativo = true');
            return parseInt(result.rows[0].count);
        } catch (error) {
            throw error;
        }
    }

    // Buscar localidades por estado
    static async findByState(estado) {
        try {
            const result = await query(`
                SELECT * FROM localidades 
                WHERE estado = $1 AND ativo = true 
                ORDER BY cidade, nome
            `, [estado]);

            return result.rows.map(row => new Localidade(row));
        } catch (error) {
            throw error;
        }
    }

    // Buscar localidades por cidade
    static async findByCity(estado, cidade) {
        try {
            const result = await query(`
                SELECT * FROM localidades 
                WHERE estado = $1 AND cidade ILIKE $2 AND ativo = true 
                ORDER BY nome
            `, [estado, `%${cidade}%`]);

            return result.rows.map(row => new Localidade(row));
        } catch (error) {
            throw error;
        }
    }

    // Buscar por termo (código, nome, cidade)
    static async search(term, limit = 20) {
        try {
            const result = await query(`
                SELECT l.*, u.nome as nome_usuario_criacao
                FROM localidades l
                LEFT JOIN usuarios u ON l.usuario_criacao = u.id
                WHERE l.ativo = true 
                AND (l.codigo ILIKE $1 OR l.nome ILIKE $1 OR l.cidade ILIKE $1 OR l.cnpj ILIKE $1)
                ORDER BY l.nome 
                LIMIT $2
            `, [`%${term}%`, limit]);

            return result.rows.map(row => new Localidade(row));
        } catch (error) {
            throw error;
        }
    }

    // Atualizar localidade
    async update(data, updatedBy) {
        try {
            const allowedFields = ['codigo', 'nome', 'cnpj', 'estado', 'cidade', 'endereco', 'telefone', 'email', 'observacoes'];
            const fields = [];
            const values = [];
            let paramCount = 1;

            // Verificar se código já existe (se está sendo alterado)
            if (data.codigo && data.codigo !== this.codigo) {
                const existingLocalidade = await Localidade.findByCode(data.codigo);
                if (existingLocalidade && existingLocalidade.id !== this.id) {
                    throw new Error('Código já está em uso');
                }
            }

            // Construir query dinamicamente
            for (const field of allowedFields) {
                if (data[field] !== undefined) {
                    fields.push(`${field} = $${paramCount}`);
                    values.push(data[field] === '' ? null : data[field]);
                    paramCount++;
                }
            }

            if (fields.length === 0) {
                throw new Error('Nenhum campo válido para atualizar');
            }

            values.push(this.id);

            const result = await query(`
                UPDATE localidades 
                SET ${fields.join(', ')} 
                WHERE id = $${paramCount}
                RETURNING *
            `, values);

            if (result.rows.length === 0) {
                throw new Error('Localidade não encontrada');
            }

            // Atualizar propriedades do objeto
            Object.assign(this, result.rows[0]);

            // Log da atividade
            await logActivity(updatedBy, 'UPDATE', 'localidades', this.id, `Localidade atualizada: ${this.nome}`, null, null);

            return this;
        } catch (error) {
            throw error;
        }
    }

    // Desativar localidade (soft delete)
    async deactivate(deactivatedBy) {
        try {
            // Verificar se há senhas associadas
            const senhasResult = await query(
                'SELECT COUNT(*) FROM cofre_senhas WHERE localidade_id = $1 AND ativo = true',
                [this.id]
            );

            const totalSenhas = parseInt(senhasResult.rows[0].count);
            if (totalSenhas > 0) {
                throw new Error(`Não é possível desativar. Existem ${totalSenhas} senha(s) associada(s) a esta localidade.`);
            }

            await query(`
                UPDATE localidades 
                SET ativo = false 
                WHERE id = $1
            `, [this.id]);

            this.ativo = false;

            // Log da atividade
            await logActivity(deactivatedBy, 'DELETE', 'localidades', this.id, `Localidade desativada: ${this.nome}`, null, null);

            return this;
        } catch (error) {
            throw error;
        }
    }

    // Reativar localidade
    async reactivate(reactivatedBy) {
        try {
            await query(`
                UPDATE localidades 
                SET ativo = true 
                WHERE id = $1
            `, [this.id]);

            this.ativo = true;

            // Log da atividade
            await logActivity(reactivatedBy, 'UPDATE', 'localidades', this.id, `Localidade reativada: ${this.nome}`, null, null);

            return this;
        } catch (error) {
            throw error;
        }
    }

    // Obter estatísticas da localidade
    async getStats() {
        try {
            const result = await query(`
                SELECT 
                    COUNT(*) as total_senhas,
                    COUNT(CASE WHEN favorito = true THEN 1 END) as senhas_favoritas,
                    COUNT(CASE WHEN data_criacao >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as senhas_mes,
                    MAX(data_ultimo_acesso) as ultimo_acesso_senha
                FROM cofre_senhas 
                WHERE localidade_id = $1 AND ativo = true
            `, [this.id]);

            return {
                total_senhas: parseInt(result.rows[0].total_senhas),
                senhas_favoritas: parseInt(result.rows[0].senhas_favoritas),
                senhas_mes: parseInt(result.rows[0].senhas_mes),
                ultimo_acesso_senha: result.rows[0].ultimo_acesso_senha
            };
        } catch (error) {
            throw error;
        }
    }

    // Listar senhas da localidade
    async getSenhas(limit = 20) {
        try {
            const result = await query(`
                SELECT 
                    cs.id, cs.titulo, cs.usuario, cs.url, cs.favorito,
                    cs.data_criacao, cs.data_ultimo_acesso, cs.contador_acessos,
                    c.nome as categoria, c.cor as categoria_cor
                FROM cofre_senhas cs
                JOIN categorias_senha c ON cs.categoria_id = c.id
                WHERE cs.localidade_id = $1 AND cs.ativo = true
                ORDER BY cs.data_criacao DESC
                LIMIT $2
            `, [this.id, limit]);

            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    // Obter lista de estados únicos
    static async getStates() {
        try {
            const result = await query(`
                SELECT DISTINCT estado 
                FROM localidades 
                WHERE ativo = true 
                ORDER BY estado
            `);

            return result.rows.map(row => row.estado);
        } catch (error) {
            throw error;
        }
    }

    // Obter lista de cidades por estado
    static async getCitiesByState(estado) {
        try {
            const result = await query(`
                SELECT DISTINCT cidade 
                FROM localidades 
                WHERE estado = $1 AND ativo = true 
                ORDER BY cidade
            `, [estado]);

            return result.rows.map(row => row.cidade);
        } catch (error) {
            throw error;
        }
    }

    // Validar CNPJ (básico)
    static validateCNPJ(cnpj) {
        if (!cnpj) return true; // CNPJ é opcional

        // Remove caracteres não numéricos
        const cleanCNPJ = cnpj.replace(/[^\d]/g, '');

        // Verifica se tem 14 dígitos
        return cleanCNPJ.length === 14;
    }

    // Formatar CNPJ
    static formatCNPJ(cnpj) {
        if (!cnpj) return '';

        const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
        if (cleanCNPJ.length === 14) {
            return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }

        return cnpj;
    }
}

module.exports = Localidade;
