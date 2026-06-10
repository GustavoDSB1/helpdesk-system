// ========================================
// MIDDLEWARE DE PERMISSÕES
// ========================================

/**
 * Verifica se o usuário tem uma das roles permitidas
 * @param {...string} allowedRoles - Roles que podem acessar a rota
 */
export const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const userRole = req.user.role || 'user';

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Acesso negado',
        message: `Esta ação requer uma das seguintes permissões: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Verifica se o usuário pode ver um ticket específico
 * @param {Object} ticket - Objeto do ticket
 * @param {Object} user - Objeto do usuário
 * @returns {boolean}
 */
export const canViewTicket = (ticket, user) => {
  // Admin vê tudo
  if (user.role === 'admin') return true;
  
  // Técnico vê todos os tickets
  if (user.role === 'technician') return true;
  
  // Usuário comum vê apenas os próprios tickets ou tickets atribuídos a ele
  if (user.role === 'user') {
    return ticket.user_id === user.id || ticket.assigned_to === user.id;
  }
  
  return false;
};

/**
 * Verifica se o usuário pode editar um ticket
 * @param {Object} ticket - Objeto do ticket
 * @param {Object} user - Objeto do usuário
 * @returns {boolean}
 */
export const canEditTicket = (ticket, user) => {
  // Admin pode editar tudo
  if (user.role === 'admin') return true;
  
  // Técnico pode editar qualquer ticket
  if (user.role === 'technician') return true;
  
  // Usuário pode editar apenas os próprios tickets (se ainda abertos)
  if (user.role === 'user') {
    return ticket.user_id === user.id && ticket.status === 'open';
  }
  
  return false;
};

/**
 * Verifica se o usuário pode atribuir tickets
 * @param {Object} user - Objeto do usuário
 * @returns {boolean}
 */
export const canAssignTicket = (user) => {
  return ['admin', 'technician'].includes(user.role);
};

/**
 * Verifica se o usuário pode deletar tickets
 * @param {Object} user - Objeto do usuário
 * @returns {boolean}
 */
export const canDeleteTicket = (user) => {
  return user.role === 'admin';
};

/**
 * Verifica se o usuário pode ver todos os tickets
 * @param {Object} user - Objeto do usuário
 * @returns {boolean}
 */
export const canViewAllTickets = (user) => {
  return ['admin', 'technician'].includes(user.role);
};

/**
 * Verifica se o usuário pode gerenciar outros usuários
 * @param {Object} user - Objeto do usuário
 * @returns {boolean}
 */
export const canManageUsers = (user) => {
  return user.role === 'admin';
};

/**
 * Verifica se o usuário pode mudar o status de tickets
 * @param {Object} ticket - Objeto do ticket
 * @param {Object} user - Objeto do usuário
 * @returns {boolean}
 */
export const canChangeStatus = (ticket, user) => {
  // Admin pode mudar qualquer status
  if (user.role === 'admin') return true;
  
  // Técnico pode mudar status de qualquer ticket
  if (user.role === 'technician') return true;
  
  // Usuário pode fechar apenas seus próprios tickets
  if (user.role === 'user') {
    return ticket.user_id === user.id;
  }
  
  return false;
};
