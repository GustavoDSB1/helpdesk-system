import express from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  updateTicketStatus,
  assignTicket,
  addComment
} from '../controllers/ticketController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// ========================================
// ROTAS DE TICKETS (todas protegidas)
// ========================================

// Listar tickets (todos os usuários autenticados)
router.get('/', authenticateToken, getTickets);

// Ver detalhes de um ticket
router.get('/:id', authenticateToken, getTicketById);

// Criar novo ticket
router.post('/', authenticateToken, createTicket);

// Atualizar ticket
router.put('/:id', authenticateToken, updateTicket);

// Deletar ticket (apenas admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteTicket);

// ========================================
// AÇÕES ESPECÍFICAS
// ========================================

// Atualizar status do ticket (técnico ou admin)
router.put('/:id/status', authenticateToken, authorizeRoles('technician', 'admin'), updateTicketStatus);

// Atribuir ticket a técnico (técnico ou admin)
router.put('/:id/assign', authenticateToken, authorizeRoles('technician', 'admin'), assignTicket);

// Adicionar comentário
router.post('/:id/comments', authenticateToken, addComment);

export default router;
