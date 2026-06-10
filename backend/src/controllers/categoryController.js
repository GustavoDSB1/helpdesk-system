import db from '../config/database.js';

// ========================================
// 📋 LISTAR TODAS AS CATEGORIAS
// ========================================
export const getCategories = (req, res) => {
  try {
    db.all('SELECT * FROM categories ORDER BY name', (err, categories) => {
      if (err) {
        console.error('Erro ao buscar categorias:', err);
        return res.status(500).json({ error: 'Erro ao buscar categorias' });
      }
      res.json(categories);
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// ========================================
// 🔍 BUSCAR CATEGORIA POR ID
// ========================================
export const getCategoryById = (req, res) => {
  try {
    const { id } = req.params;

    db.get('SELECT * FROM categories WHERE id = ?', [id], (err, category) => {
      if (err) {
        console.error('Erro ao buscar categoria:', err);
        return res.status(500).json({ error: 'Erro ao buscar categoria' });
      }

      if (!category) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }

      res.json(category);
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// ========================================
// ➕ CRIAR NOVA CATEGORIA (apenas admin)
// ========================================
export const createCategory = (req, res) => {
  try {
    const { name, description, color, department } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }

    const query = `
      INSERT INTO categories (name, description, color, department)
      VALUES (?, ?, ?, ?)
    `;

    db.run(
      query,
      [name, description || null, color || '#6366f1', department || null],
      function(err) {
        if (err) {
          console.error('Erro ao criar categoria:', err);
          return res.status(500).json({ error: 'Erro ao criar categoria' });
        }

        res.status(201).json({
          message: 'Categoria criada com sucesso',
          id: this.lastID
        });
      }
    );
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// ========================================
// ✏️ ATUALIZAR CATEGORIA (apenas admin)
// ========================================
export const updateCategory = (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, department } = req.body;

    // Construir query dinamicamente
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color);
    }

    if (department !== undefined) {
      updates.push('department = ?');
      params.push(department);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    params.push(id);

    const query = `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`;

    db.run(query, params, function(err) {
      if (err) {
        console.error('Erro ao atualizar categoria:', err);
        return res.status(500).json({ error: 'Erro ao atualizar categoria' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }

      res.json({ message: 'Categoria atualizada com sucesso' });
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// ========================================
// 🗑️ DELETAR CATEGORIA (apenas admin)
// ========================================
export const deleteCategory = (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se existem tickets associados
    db.get(
      'SELECT COUNT(*) as count FROM tickets WHERE category_id = ?',
      [id],
      (err, result) => {
        if (err) {
          console.error('Erro ao verificar tickets:', err);
          return res.status(500).json({ error: 'Erro ao verificar tickets' });
        }

        if (result.count > 0) {
          return res.status(400).json({
            error: 'Não é possível deletar categoria com tickets associados',
            tickets_count: result.count
          });
        }

        // Deletar a categoria
        db.run('DELETE FROM categories WHERE id = ?', [id], function(err) {
          if (err) {
            console.error('Erro ao deletar categoria:', err);
            return res.status(500).json({ error: 'Erro ao deletar categoria' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada' });
          }

          res.json({ message: 'Categoria deletada com sucesso' });
        });
      }
    );
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};
