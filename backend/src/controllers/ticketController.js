import db from '../config/database.js';

export const createTicket = (req, res) => {
  const { title, description, priority, category_id } = req.body;
  const user_id = req.user.id;

  const query = `
    INSERT INTO tickets (title, description, priority, category_id, user_id)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(query, [title, description, priority || 'medium', category_id, user_id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao criar ticket' });
    }

    res.status(201).json({
      message: 'Ticket criado com sucesso',
      ticketId: this.lastID
    });
  });
};

export const getTickets = (req, res) => {
  const { status, priority, category_id } = req.query;
  const user_id = req.user.id;
  const user_role = req.user.role;

  let query = `
    SELECT 
      t.*,
      u.name as user_name,
      u.email as user_email,
      c.name as category_name,
      tech.name as assigned_name
    FROM tickets t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN users tech ON t.assigned_to = tech.id
    WHERE 1=1
  `;

  const params = [];

  // Filtrar por usuário se não for admin ou técnico
  if (user_role === 'user') {
    query += ' AND t.user_id = ?';
    params.push(user_id);
  } else if (user_role === 'technician') {
    query += ' AND (t.assigned_to = ? OR t.assigned_to IS NULL)';
    params.push(user_id);
  }

  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  }

  if (priority) {
    query += ' AND t.priority = ?';
    params.push(priority);
  }

  if (category_id) {
    query += ' AND t.category_id = ?';
    params.push(category_id);
  }

  query += ' ORDER BY t.created_at DESC';

  db.all(query, params, (err, tickets) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar tickets' });
    }
    res.json(tickets);
  });
};

export const getTicketById = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      t.*,
      u.name as user_name,
      u.email as user_email,
      c.name as category_name,
      c.department as category_department,
      tech.name as assigned_name
    FROM tickets t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN users tech ON t.assigned_to = tech.id
    WHERE t.id = ?
  `;

  db.get(query, [id], (err, ticket) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar ticket' });
    }

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Verificar permissões
    if (req.user.role === 'user' && ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json(ticket);
  });
};

export const updateTicket = (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, assigned_to } = req.body;

  // Buscar ticket atual
  db.get('SELECT * FROM tickets WHERE id = ?', [id], (err, ticket) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar ticket' });
    }

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Verificar permissões
    if (req.user.role === 'user' && ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const updates = [];
    const params = [];

    if (title) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description) {
      updates.push('description = ?');
      params.push(description);
    }
    if (status) {
      updates.push('status = ?');
      params.push(status);
      
      if (status === 'resolved' || status === 'closed') {
        updates.push('resolved_at = CURRENT_TIMESTAMP');
      }
    }
    if (priority) {
      updates.push('priority = ?');
      params.push(priority);
    }
    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      params.push(assigned_to);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`;

    db.run(query, params, function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao atualizar ticket' });
      }

      res.json({ message: 'Ticket atualizado com sucesso' });
    });
  });
};

export const deleteTicket = (req, res) => {
  const { id } = req.params;

  db.get('SELECT user_id FROM tickets WHERE id = ?', [id], (err, ticket) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar ticket' });
    }

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Apenas admin ou dono do ticket pode deletar
    if (req.user.role !== 'admin' && ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    db.run('DELETE FROM tickets WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao deletar ticket' });
      }

      res.json({ message: 'Ticket deletado com sucesso' });
    });
  });
};
