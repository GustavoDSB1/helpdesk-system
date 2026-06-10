import db from '../config/database.js';
import { 
  canViewTicket, 
  canEditTicket, 
  canAssignTicket,
  canDeleteTicket,
  canViewAllTickets,
  canChangeStatus
} from '../middleware/permissions.js';

// ========================================
// 🔍 LISTAR TICKETS (com filtros por role)
// ========================================
export const getTickets = (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role || 'user';
    const { status, priority, category_id, assigned_to } = req.query;

    let query = `
      SELECT 
        t.*,
        u.username as user_name,
        u.email as user_email,
        c.name as category_name,
        c.color as category_color,
        assigned.username as assigned_to_name,
        assigned.full_name as assigned_to_full_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users assigned ON t.assigned_to = assigned.id
      WHERE 1=1
    `;

    const params = [];

    // CONTROLE DE ACESSO POR ROLE
    if (!canViewAllTickets(req.user)) {
      // Usuários comuns veem apenas seus tickets ou atribuídos a eles
      query += ` AND (t.user_id = ? OR t.assigned_to = ?)`;
      params.push(userId, userId);
    }

    // Filtros opcionais
    if (status) {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    if (priority) {
      query += ` AND t.priority = ?`;
      params.push(priority);
    }

    if (category_id) {
      query += ` AND t.category_id = ?`;
      params.push(category_id);
    }

    if (assigned_to) {
      query += ` AND t.assigned_to = ?`;
      params.push(assigned_to);
    }

    query += ` ORDER BY t.created_at DESC`;

    db.all(query, params, (err, tickets) => {
      if (err) {
        console.error('Erro ao buscar tickets:', err);
        return res.status(500).json({ error: 'Erro ao buscar tickets' });
      }

      res.json(tickets);
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// ========================================
// 🔍 BUSCAR TICKET POR ID (com controle de acesso)
// ========================================
export const getTicketById = (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        t.*,
        u.username as user_name,
        u.email as user_email,
        u.full_name as user_full_name,
        c.name as category_name,
        c.color as category_color,
        assigned.username as assigned_to_name,
        assigned.full_name as assigned_to_full_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users assigned ON t.assigned_to = assigned.id
      WHERE t.id = ?
    `;

    db.get(query, [id], (err, ticket) => {
      if (err) {
        console.error('Erro ao buscar ticket:', err);
        return res.status(500).json({ error: 'Erro ao buscar ticket' });
      }

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket não encontrado' });
      }

      // VERIFICAR PERMISSÃO DE VISUALIZAÇÃO
      if (!canViewTicket(ticket, req.user)) {
        return res.status(403).json({ 
          error: 'Você não tem permissão para ver este ticket' 
        });
      }

      res.json(ticket);
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// ========================================
// ➕ CRIAR NOVO TICKET
// ========================================
export const createTicket = (req, res) => {
  try {
    const { title, description, priority, category_id } = req.body;
    const userId = req.user.id;

    if (!title || !description) {
      return res.status(400).json({ 
        error: 'Título e descrição são obrigatórios' 
      });
    }

    const query = `
      INSERT INTO tickets (title, description, priority, category_id, user_id, status)
      VALUES (?, ?, ?, ?, ?, 'open')
    `;

    db.run(
      query,
      [title, description, priority || 'medium', category_id || null, userId],
      function(err) {
        if (err) {
          console.error('Erro ao criar ticket:', err);
          return res.status(500).json({ error: 'Erro ao criar ticket' });
        }

        res.status(201).json({
          id: this.lastID,
          message: 'Ticket criado com sucesso'
        });
      }
    );
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// ========================================
// ✏️ ATUALIZAR TICKET (com controle de permissões)
// ========================================
export const updateTicket = (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, category_id, status, assigned_to } = req.body;

    // Buscar ticket atual
    db.get('SELECT * FROM tickets WHERE id = ?', [id], (err, ticket) => {
      if (err) {
        console.error('Erro ao buscar ticket:', err);
        return res.status(500).json({ error: 'Erro ao buscar ticket' });
      }

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket não encontrado' });
      }

      // VERIFICAR PERMISSÃO DE EDIÇÃO
      if (!canEditTicket(ticket, req.user)) {
        return res.status(403).json({ 
          error: 'Você não tem permissão para editar este ticket' 
        });
      }

      // VERIFICAR PERMISSÃO DE ATRIBUIÇÃO
      if (assigned_to !== undefined && !canAssignTicket(req.user)) {
        return res.status(403).json({ 
          error: 'Você não tem permissão para atribuir tickets' 
        });
      }

      // VERIFICAR PERMISSÃO DE MUDAR STATUS
      if (status && status !== ticket.status && !canChangeStatus(ticket, req.user)) {
        return res.status(403).json({ 
          error: 'Você não tem permissão para alterar o status deste ticket' 
        });
      }

      // Construir query de atualização dinamicamente
      const updates = [];
      const params = [];

      if (title !== undefined) {
        updates.push('title = ?');
        params.push(title);
      }

      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }

      if (priority !== undefined) {
        updates.push('priority = ?');
        params.push(priority);
      }

      if (category_id !== undefined) {
        updates.push('category_id = ?');
        params.push(category_id);
      }

      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
      }

      if (assigned_to !== undefined) {
        updates.push('assigned_to = ?');
        params.push(assigned_to);
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');

      if (updates.length === 1) { // Apenas updated_at
        return res.status(400).json({ error: 'Nenhum campo para atualizar' });
      }

      params.push(id);

      const query = `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`;

      db.run(query, params, function(err) {
        if (err) {
          console.error('Erro ao atualizar ticket:', err);
          return res.status(500).json({ error: 'Erro ao atualizar ticket' });
        }

        res.json({ message: 'Ticket atualizado com sucesso' });
      });
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// ========================================
// 🗑️ DELETAR TICKET (apenas admin)
// ========================================
export const deleteTicket = (req, res) => {
  try {
    const { id } = req.params;

    // VERIFICAR PERMISSÃO
    if (!canDeleteTicket(req.user)) {
      return res.status(403).json({ 
        error: 'Apenas administradores podem deletar tickets' 
      });
    }

    db.run('DELETE FROM tickets WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Erro ao deletar ticket:', err);
        return res.status(500).json({ error: 'Erro ao deletar ticket' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Ticket não encontrado' });
      }

      res.json({ message: 'Ticket deletado com sucesso' });
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// ========================================
// 🔄 ATUALIZAR STATUS DO TICKET
// ========================================
export const updateTicketStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validar status
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Status inválido. Use: ${validStatuses.join(', ')}` 
      });
    }

    // Buscar o ticket
    db.get('SELECT * FROM tickets WHERE id = ?', [id], (err, ticket) => {
      if (err) {
        console.error('Erro ao buscar ticket:', err);
        return res.status(500).json({ error: 'Erro ao buscar ticket' });
      }

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket não encontrado' });
      }

      // VERIFICAR PERMISSÃO DE MUDAR STATUS
      if (!canChangeStatus(ticket, req.user)) {
        return res.status(403).json({ 
          error: 'Você não tem permissão para alterar o status deste ticket' 
        });
      }

      // Atualizar o status
      const query = `
        UPDATE tickets 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;

      db.run(query, [status, id], function(err) {
        if (err) {
          console.error('Erro ao atualizar status:', err);
          return res.status(500).json({ error: 'Erro ao atualizar status' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Ticket não encontrado' });
        }

        // Buscar o ticket atualizado
        const selectQuery = `
          SELECT 
            t.*,
            u.username as user_name,
            u.email as user_email,
            u.full_name as user_full_name,
            c.name as category_name,
            c.color as category_color,
            assigned.username as assigned_to_name,
            assigned.full_name as assigned_to_full_name
          FROM tickets t
          LEFT JOIN users u ON t.user_id = u.id
          LEFT JOIN categories c ON t.category_id = c.id
          LEFT JOIN users assigned ON t.assigned_to = assigned.id
          WHERE t.id = ?
        `;

        db.get(selectQuery, [id], (err, updatedTicket) => {
          if (err) {
            console.error('Erro ao buscar ticket atualizado:', err);
            return res.json({ 
              message: 'Status atualizado com sucesso' 
            });
          }

          res.json({
            message: 'Status atualizado com sucesso',
            ticket: updatedTicket
          });
        });
      });
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// ========================================
// 👤 ATRIBUIR TICKET A UM TÉCNICO/AGENTE
// ========================================
export const assignTicket = (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;

    // VERIFICAR PERMISSÃO DE ATRIBUIÇÃO
    if (!canAssignTicket(req.user)) {
      return res.status(403).json({ 
        error: 'Você não tem permissão para atribuir tickets' 
      });
    }

    // Validar se o ID do usuário foi fornecido
    if (assigned_to === undefined || assigned_to === null) {
      return res.status(400).json({ 
        error: 'ID do usuário é obrigatório' 
      });
    }

    // Buscar o ticket
    db.get('SELECT * FROM tickets WHERE id = ?', [id], (err, ticket) => {
      if (err) {
        console.error('Erro ao buscar ticket:', err);
        return res.status(500).json({ error: 'Erro ao buscar ticket' });
      }

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket não encontrado' });
      }

      // Se assigned_to não for null, verificar se o usuário existe
      if (assigned_to !== null) {
        db.get('SELECT id, role FROM users WHERE id = ?', [assigned_to], (err, user) => {
          if (err) {
            console.error('Erro ao buscar usuário:', err);
            return res.status(500).json({ error: 'Erro ao buscar usuário' });
          }

          if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
          }

          // Verificar se o usuário é técnico ou admin
          if (user.role !== 'technician' && user.role !== 'admin') {
            return res.status(400).json({ 
              error: 'O usuário deve ser um técnico ou administrador' 
            });
          }

          // Atribuir o ticket
          performAssignment(id, assigned_to, res);
        });
      } else {
        // Remover atribuição (assigned_to = null)
        performAssignment(id, null, res);
      }
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// Função auxiliar para realizar a atribuição
function performAssignment(ticketId, assignedTo, res) {
  const query = `
    UPDATE tickets 
    SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `;

  db.run(query, [assignedTo, ticketId], function(err) {
    if (err) {
      console.error('Erro ao atribuir ticket:', err);
      return res.status(500).json({ error: 'Erro ao atribuir ticket' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Buscar o ticket atualizado com informações completas
    const selectQuery = `
      SELECT 
        t.*,
        u.username as user_name,
        u.email as user_email,
        u.full_name as user_full_name,
        c.name as category_name,
        c.color as category_color,
        assigned.username as assigned_to_name,
        assigned.full_name as assigned_to_full_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users assigned ON t.assigned_to = assigned.id
      WHERE t.id = ?
    `;

    db.get(selectQuery, [ticketId], (err, ticket) => {
      if (err) {
        console.error('Erro ao buscar ticket atualizado:', err);
        return res.json({ 
          message: assignedTo 
            ? 'Ticket atribuído com sucesso' 
            : 'Atribuição removida com sucesso' 
        });
      }

      res.json({
        message: assignedTo 
          ? 'Ticket atribuído com sucesso' 
          : 'Atribuição removida com sucesso',
        ticket
      });
    });
  });
}

// ========================================
// 💬 ADICIONAR COMENTÁRIO A UM TICKET
// ========================================
export const addComment = (req, res) => {
  try {
    const { id } = req.params; // ID do ticket
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim() === '') {
      return res.status(400).json({ 
        error: 'O conteúdo do comentário é obrigatório' 
      });
    }

    // Verificar se o ticket existe e se o usuário tem permissão
    db.get('SELECT * FROM tickets WHERE id = ?', [id], (err, ticket) => {
      if (err) {
        console.error('Erro ao buscar ticket:', err);
        return res.status(500).json({ error: 'Erro ao buscar ticket' });
      }

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket não encontrado' });
      }

      // VERIFICAR PERMISSÃO DE VISUALIZAÇÃO (necessário para comentar)
      if (!canViewTicket(ticket, req.user)) {
        return res.status(403).json({ 
          error: 'Você não tem permissão para comentar neste ticket' 
        });
      }

      // Inserir o comentário
      const query = `
        INSERT INTO comments (ticket_id, user_id, content, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `;

      db.run(query, [id, userId, content.trim()], function(err) {
        if (err) {
          console.error('Erro ao criar comentário:', err);
          return res.status(500).json({ error: 'Erro ao criar comentário' });
        }

        // Atualizar o timestamp do ticket
        db.run(
          'UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [id],
          (updateErr) => {
            if (updateErr) {
              console.error('Erro ao atualizar ticket:', updateErr);
            }
          }
        );

        // Buscar o comentário criado com informações do usuário
        const selectQuery = `
          SELECT 
            c.*,
            u.username,
            u.full_name,
            u.email
          FROM comments c
          LEFT JOIN users u ON c.user_id = u.id
          WHERE c.id = ?
        `;

        db.get(selectQuery, [this.lastID], (err, comment) => {
          if (err) {
            console.error('Erro ao buscar comentário:', err);
            return res.status(201).json({
              id: this.lastID,
              message: 'Comentário adicionado com sucesso'
            });
          }

          res.status(201).json({
            message: 'Comentário adicionado com sucesso',
            comment
          });
        });
      });
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// ========================================
// 💬 LISTAR COMENTÁRIOS DE UM TICKET
// ========================================
export const getComments = (req, res) => {
  try {
    const { id } = req.params; // ID do ticket

    // Verificar se o ticket existe e se o usuário tem permissão
    db.get('SELECT * FROM tickets WHERE id = ?', [id], (err, ticket) => {
      if (err) {
        console.error('Erro ao buscar ticket:', err);
        return res.status(500).json({ error: 'Erro ao buscar ticket' });
      }

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket não encontrado' });
      }

      // VERIFICAR PERMISSÃO DE VISUALIZAÇÃO
      if (!canViewTicket(ticket, req.user)) {
        return res.status(403).json({ 
          error: 'Você não tem permissão para ver os comentários deste ticket' 
        });
      }

      // Buscar comentários
      const query = `
        SELECT 
          c.*,
          u.username,
          u.full_name,
          u.email
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.ticket_id = ?
        ORDER BY c.created_at ASC
      `;

      db.all(query, [id], (err, comments) => {
        if (err) {
          console.error('Erro ao buscar comentários:', err);
          return res.status(500).json({ error: 'Erro ao buscar comentários' });
        }

        res.json(comments);
      });
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// ========================================
// 📊 ESTATÍSTICAS (respeitando permissões)
// ========================================
export const getStatistics = (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role || 'user';

    let whereClause = '1=1';
    const params = [];

    // Filtrar por usuário se não for admin/técnico
    if (!canViewAllTickets(req.user)) {
      whereClause = '(user_id = ? OR assigned_to = ?)';
      params.push(userId, userId);
    }

    const queries = {
      total: `SELECT COUNT(*) as count FROM tickets WHERE ${whereClause}`,
      open: `SELECT COUNT(*) as count FROM tickets WHERE status = 'open' AND ${whereClause}`,
      in_progress: `SELECT COUNT(*) as count FROM tickets WHERE status = 'in_progress' AND ${whereClause}`,
      resolved: `SELECT COUNT(*) as count FROM tickets WHERE status = 'resolved' AND ${whereClause}`,
      closed: `SELECT COUNT(*) as count FROM tickets WHERE status = 'closed' AND ${whereClause}`,
      high_priority: `SELECT COUNT(*) as count FROM tickets WHERE priority = 'high' AND ${whereClause}`,
      urgent_priority: `SELECT COUNT(*) as count FROM tickets WHERE priority = 'urgent' AND ${whereClause}`
    };

    const stats = {};
    let completed = 0;
    const total = Object.keys(queries).length;

    Object.entries(queries).forEach(([key, query]) => {
      db.get(query, params, (err, result) => {
        if (err) {
          console.error(`Erro ao buscar ${key}:`, err);
        } else {
          stats[key] = result.count;
        }

        completed++;
        if (completed === total) {
          res.json(stats);
        }
      });
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};
