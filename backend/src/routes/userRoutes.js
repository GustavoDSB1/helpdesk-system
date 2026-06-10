import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkRole, canManageUsers } from '../middleware/permissions.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// ========================================
// 🔍 LISTAR USUÁRIOS (apenas admin)
// ========================================
router.get('/', authenticateToken, checkRole('admin'), (req, res) => {
  const query = `
    SELECT 
      id, username, email, full_name, role, created_at, updated_at
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
});

// ========================================
// 🔍 LISTAR TÉCNICOS (para atribuição)
// ========================================
router.get('/technicians', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      id, username, full_name, email
    FROM users
    WHERE role IN ('admin', 'technician')
    ORDER BY full_name
  `;

  db.all(query, [], (err, technicians) => {
    if (err) {
      console.error('Erro ao buscar técnicos:', err);
      return res.status(500).json({ error: 'Erro ao buscar técnicos' });
    }
    res.json(technicians);
  });
});

// ========================================
// ✏️ ATUALIZAR ROLE DO USUÁRIO (apenas admin)
// ========================================
router.put('/:id/role', authenticateToken, checkRole('admin'), (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['admin', 'technician', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Role inválida. Use: admin, technician ou user' });
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
});

// ========================================
// 🔍 BUSCAR PERFIL PRÓPRIO
// ========================================
router.get('/me', authenticateToken, (req, res) => {
  const query = `
    SELECT id, username, email, full_name, role, created_at 
    FROM users 
    WHERE id = ?
  `;

  db.get(query, [req.user.id], (err, user) => {
    if (err) {
      console.error('Erro ao buscar perfil:', err);
      return res.status(500).json({ error: 'Erro ao buscar perfil' });
    }

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  });
});

// ========================================
// ✏️ ATUALIZAR PERFIL PRÓPRIO
// ========================================
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { full_name, email, current_password, new_password } = req.body;
    const userId = req.user.id;

    // Se estiver mudando senha, validar senha atual
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ error: 'Senha atual é obrigatória para alterar a senha' });
      }

      // Verificar senha atual
      db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
        if (err) {
          console.error('Erro ao buscar usuário:', err);
          return res.status(500).json({ error: 'Erro ao buscar usuário' });
        }

        const isValidPassword = await bcrypt.compare(current_password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Senha atual incorreta' });
        }

        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Atualizar tudo
        const query = `
          UPDATE users 
          SET full_name = ?, email = ?, password = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `;

        db.run(query, [full_name, email, hashedPassword, userId], function(err) {
          if (err) {
            console.error('Erro ao atualizar perfil:', err);
            return res.status(500).json({ error: 'Erro ao atualizar perfil' });
          }
          res.json({ message: 'Perfil atualizado com sucesso' });
        });
      });
    } else {
      // Atualizar sem mudar senha
      const query = `
        UPDATE users 
        SET full_name = ?, email = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;

      db.run(query, [full_name, email, userId], function(err) {
        if (err) {
          console.error('Erro ao atualizar perfil:', err);
          return res.status(500).json({ error: 'Erro ao atualizar perfil' });
        }
        res.json({ message: 'Perfil atualizado com sucesso' });
      });
    }
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// ========================================
// 🗑️ DELETAR USUÁRIO (apenas admin)
// ========================================
router.delete('/:id', authenticateToken, checkRole('admin'), (req, res) => {
  const { id } = req.params;

  // Não permitir deletar a si mesmo
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Você não pode deletar seu próprio usuário' });
  }

  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Erro ao deletar usuário:', err);
      return res.status(500).json({ error: 'Erro ao deletar usuário' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ message: 'Usuário deletado com sucesso' });
  });
});

export default router;
