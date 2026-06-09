import express from 'express';
import { body } from 'express-validator';
import {
  getCategories,
  createCategory
} from '../controllers/categoryController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Validações
const categoryValidation = [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('department').isIn(['TI', 'Manutenção', 'Outros']).withMessage('Departamento inválido')
];

// Listar categorias (requer autenticação)
router.get('/', authenticate, getCategories);

// Criar categoria (apenas admin)
router.post('/', authenticate, authorize('admin'), categoryValidation, createCategory);

export default router;
