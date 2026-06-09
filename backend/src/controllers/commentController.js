import db from '../config/database.js';

export const addComment = (req, res) => {
  const { ticket_id, content, is_internal } = req.body;
  const user_id = req.user.id;

  // Verificar se ticket existe
  db.get('SELECT id, user_id FROM tickets WHERE id = ?', [ticket_id], (err, ticket) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar ticket' });
    }

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    const query = `
      INSERT INTO comments (ticket_id, user_id, content, is_internal)
      VALUES (?, ?, ?, ?)
    `;

    db.run(query, [ticket_id, user_id, content, is_internal ? 1 : 0], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao adicionar comentário' });
      }

      res.status(201).json({
        message: 'Comentário adicionado com sucesso',
        commentId: this.lastID
      });
    });
  });
};

export const getCommentsByTicket = (req, res) => {
  const { ticket_id } = req.params;

  // Verificar acesso ao ticket
  db.get('SELECT user_id FROM tickets WHERE id = ?', [ticket_id], (err, ticket) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar ticket' });
    }

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    let query = `
      SELECT 
        c.*,
        u.name as user_name,
        u.role as user_role
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = ?
    `;

    // Usuários comuns não veem comentários internos
    if (req.user.role === 'user') {
      query += ' AND c.is_internal = 0';
    }

    query += ' ORDER BY c.created_at ASC';

    db.all(query, [ticket_id], (err, comments) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar comentários' });
      }

      res.json(comments);
    });
  });
};
