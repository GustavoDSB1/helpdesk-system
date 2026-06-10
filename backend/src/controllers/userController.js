import db from '../config/database.js';

// ========================================
// 👥 LISTAR TODOS OS USUÁRIOS (Admin)
// ========================================
export const getAllUsers = (req, res) => {
  try {
    // Verificar se é admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Apenas administradores podem listar usuários' 
      });
    }

    const query = `
      SELECT 
        id, 
        username, 
        email, 
        full_name, 
        role, 
        created_at, 
        updated_at
      FROM users
      ORDER BY created_at DESC
    `;

    db.all(query, [], (err, users) => {
      if (err) {
        console.error('Erro ao buscar usuários:', err);
        return res.status(500).json({ error: 'Erro ao buscar usuários' });
      }

      res.json(users);
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// ========================================
// 🛠️ LISTAR TÉCNICOS (para atribuição)
// ========================================
export const getTechnicians = (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        username, 
        full_name, 
        email
      FROM users
      WHERE role IN ('technician', 'admin')
      ORDER BY username ASC
    `;

    db.all(query, [], (err, technicians) => {
      if (err) {
        console.error('Erro ao buscar técnicos:', err);
        return res.status(500).json({ error: 'Erro ao buscar técnicos' });
      }

      res.json(technicians);
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// ========================================
// ✏️ ATUALIZAR ROLE DE USUÁRIO (Admin)
// ========================================
export const updateUserRole = (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Verificar se é admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Apenas administradores podem alterar roles' 
      });
    }

    // Validar role
    const validRoles = ['user', 'technician', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Role inválida. Use: user, technician ou admin' 
      });
    }

    // Impedir que o usuário mude sua própria role
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ 
        error: 'Você não pode alterar sua própria role' 
      });
    }

    const query = `
      UPDATE users 
      SET role = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;

    db.run(query, [role, id], function(err) {
      if (err) {
        console.error('Erro ao atualizar role:', err);
        return res.status(500).json({ error: 'Erro ao atualizar role' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json({ 
        message: 'Role atualizada com sucesso',
        userId: id,
        newRole: role
      });
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// ========================================
// 🗑️ DELETAR USUÁRIO (Admin)
// ========================================
export const deleteUser = (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se é admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Apenas administradores podem deletar usuários' 
      });
    }

    // Impedir que o usuário delete a si mesmo
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ 
        error: 'Você não pode deletar sua própria conta' 
      });
    }

    // Verificar se o usuário tem tickets
    db.get(
      'SELECT COUNT(*) as count FROM tickets WHERE user_id = ? OR assigned_to = ?', 
      [id, id], 
      (err, result) => {
        if (err) {
          console.error('Erro ao verificar tickets:', err);
          return res.status(500).json({ error: 'Erro ao verificar tickets' });
        }

        if (result.count > 0) {
          return res.status(400).json({ 
            error: `Este usuário tem ${result.count} ticket(s) associado(s). Delete ou reatribua os tickets antes de deletar o usuário.` 
          });
        }

        // Deletar usuário
        db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
          if (err) {
            console.error('Erro ao deletar usuário:', err);
            return res.status(500).json({ error: 'Erro ao deletar usuário' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
          }

          res.json({ 
            message: 'Usuário deletado com sucesso',
            userId: id
          });
        });
      }
    );
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// ========================================
// 🔍 BUSCAR USUÁRIO POR ID
// ========================================
export const getUserById = (req, res) => {
  try {
    const { id } = req.params;

    // Admin pode ver qualquer usuário, outros só podem ver a si mesmos
    if (req.user.role !== 'admin' && parseInt(id) !== req.user.id) {
      return res.status(403).json({ 
        error: 'Você não tem permissão para ver este usuário' 
      });
    }

    const query = `
      SELECT 
        id, 
        username, 
        email, 
        full_name, 
        role, 
        created_at, 
        updated_at
      FROM users
      WHERE id = ?
    `;

    db.get(query, [id], (err, user) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        return res.status(500).json({ error: 'Erro ao buscar usuário' });
      }

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json(user);
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};
