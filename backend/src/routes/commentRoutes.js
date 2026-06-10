import express from 'express';
import { body } from 'express-validator';
import {
  addComment,
  getCommentsByTicket
} from '../controllers/commentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Validações
const commentValidation = [
  body('ticket_id').isInt().withMessage('ID do ticket é obrigatório'),
  body('content').trim().notEmpty().withMessage('Conteúdo é obrigatório'),
  body('is_internal').optional().isBoolean()
];

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rotas
router.post('/', commentValidation, addComment);
router.get('/ticket/:ticket_id', getCommentsByTicket);

export default router;
