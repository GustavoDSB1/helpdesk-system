import express from 'express';
import { 
  register, 
  login, 
  getProfile,
  updateProfile, // ← ADICIONAR
  validateToken  // ← ADICIONAR (opcional)
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { body } from 'express-validator';

const router = express.Router();

// ========================================
// VALIDAÇÕES
// ========================================
const registerValidation = [
  body('username').trim().notEmpty().withMessage('Username é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
];

// ========================================
// ROTAS PÚBLICAS
// ========================================
router.post('/register', registerValidation, register);
router.post('/login', login);

// ========================================
// ROTAS PROTEGIDAS (requerem autenticação)
// ========================================
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile); // ← ADICIONAR
router.get('/validate', authenticateToken, validateToken); // ← ADICIONAR (opcional)

export default router;
