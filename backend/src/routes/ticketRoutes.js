import express from 'express';
import { body } from 'express-validator';
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket
} from '../controllers/ticketController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Validações
const createTicketValidation = [
  body('title').trim().notEmpty().withMessage('Título é obrigatório'),
  body('description').trim().notEmpty().withMessage('Descrição é obrigatória'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('category_id').optional().isInt()
];

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas
router.post('/', createTicketValidation, createTicket);
router.get('/', getTickets);
router.get('/:id', getTicketById);
router.put('/:id', updateTicket);
router.delete('/:id', deleteTicket);

export default router;
