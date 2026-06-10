import express from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// ========================================
// ROTAS DE CATEGORIAS
// ========================================

// Listar todas as categorias (público)
router.get('/', getCategories);

// Ver detalhes de uma categoria (público)
router.get('/:id', getCategoryById);

// Criar nova categoria (apenas admin)
router.post('/', authenticateToken, authorizeRoles('admin'), createCategory);

// Atualizar categoria (apenas admin)
router.put('/:id', authenticateToken, authorizeRoles('admin'), updateCategory);

// Deletar categoria (apenas admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteCategory);

export default router;
