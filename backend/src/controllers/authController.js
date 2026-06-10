import db from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';

// ========================================
// 📝 REGISTRO DE NOVO USUÁRIO
// ========================================
export const register = async (req, res) => {
  try {
    // Validar erros do express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, full_name, role } = req.body;

    // Validações básicas
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Username, email e senha são obrigatórios' 
      });
    }

    // Validar role (padrão: 'user')
    const validRoles = ['admin', 'technician', 'user'];
    const userRole = role && validRoles.includes(role) ? role : 'user';

    // Verificar se usuário já existe (por email ou username)
    db.get(
      'SELECT id FROM users WHERE email = ? OR username = ?', 
      [email, username], 
      async (err, existingUser) => {
        if (err) {
          console.error('Erro ao verificar usuário:', err);
          return res.status(500).json({ error: 'Erro ao verificar usuário' });
        }

        if (existingUser) {
          return res.status(400).json({ 
            error: 'Email ou username já cadastrado' 
          });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Inserir novo usuário
        const query = `
          INSERT INTO users (username, email, password, full_name, role) 
          VALUES (?, ?, ?, ?, ?)
        `;

        db.run(
          query, 
          [username, email, hashedPassword, full_name || null, userRole], 
          function(err) {
            if (err) {
              console.error('Erro ao criar usuário:', err);
              
              // Verificar se é erro de constraint unique
              if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ 
                  error: 'Username ou email já existe' 
                });
              }
              
              return res.status(500).json({ error: 'Erro ao criar usuário' });
            }

            res.status(201).json({
              message: 'Usuário criado com sucesso',
              userId: this.lastID,
              user: {
                id: this.lastID,
                username,
                email,
                full_name: full_name || null,
                role: userRole
              }
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// ========================================
// 🔐 LOGIN DE USUÁRIO
// ========================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validações básicas
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios' 
      });
    }

    // Buscar usuário por email
    db.get(
      'SELECT * FROM users WHERE email = ?', 
      [email], 
      async (err, user) => {
        if (err) {
          console.error('Erro ao buscar usuário:', err);
          return res.status(500).json({ error: 'Erro ao buscar usuário' });
        }

        if (!user) {
          return res.status(401).json({ 
            error: 'Credenciais inválidas' 
          });
        }

        // Verificar senha
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ 
            error: 'Credenciais inválidas' 
          });
        }

        // Gerar token JWT com role
        const token = jwt.sign(
          { 
            id: user.id, 
            username: user.username,
            email: user.email, 
            role: user.role || 'user'
          },
          process.env.JWT_SECRET,
          { expiresIn: '7d' } // Token válido por 7 dias
        );

        // Retornar dados do usuário (sem a senha)
        res.json({
          message: 'Login realizado com sucesso',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            role: user.role || 'user',
            created_at: user.created_at
          }
        });
      }
    );
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// ========================================
// 👤 OBTER PERFIL DO USUÁRIO AUTENTICADO
// ========================================
export const getProfile = (req, res) => {
  try {
    // req.user vem do middleware authenticateToken
    const userId = req.user.id;

    const query = `
      SELECT 
        id, username, email, full_name, role, 
        created_at, updated_at 
      FROM users 
      WHERE id = ?
    `;

    db.get(query, [userId], (err, user) => {
      if (err) {
        console.error('Erro ao buscar perfil:', err);
        return res.status(500).json({ error: 'Erro ao buscar perfil' });
      }

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json(user);
    });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// ========================================
// ✏️ ATUALIZAR PERFIL DO USUÁRIO
// ========================================
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, email, current_password, new_password } = req.body;

    // Se estiver mudando a senha, validar senha atual
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ 
          error: 'Senha atual é obrigatória para alterar a senha' 
        });
      }

      // Buscar senha atual do usuário
      db.get(
        'SELECT password FROM users WHERE id = ?', 
        [userId], 
        async (err, user) => {
          if (err) {
            console.error('Erro ao buscar usuário:', err);
            return res.status(500).json({ error: 'Erro ao buscar usuário' });
          }

          // Validar senha atual
          const isValidPassword = await bcrypt.compare(
            current_password, 
            user.password
          );

          if (!isValidPassword) {
            return res.status(401).json({ 
              error: 'Senha atual incorreta' 
            });
          }

          // Hash da nova senha
          const hashedPassword = await bcrypt.hash(new_password, 10);

          // Atualizar com nova senha
          const query = `
            UPDATE users 
            SET full_name = ?, email = ?, password = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `;

          db.run(query, [full_name, email, hashedPassword, userId], function(err) {
            if (err) {
              console.error('Erro ao atualizar perfil:', err);
              
              if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ 
                  error: 'Email já está em uso' 
                });
              }
              
              return res.status(500).json({ error: 'Erro ao atualizar perfil' });
            }

            res.json({ 
              message: 'Perfil e senha atualizados com sucesso' 
            });
          });
        }
      );
    } else {
      // Atualizar sem mudar senha
      const query = `
        UPDATE users 
        SET full_name = ?, email = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;

      db.run(query, [full_name, email, userId], function(err) {
        if (err) {
          console.error('Erro ao atualizar perfil:', err);
          
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ 
              error: 'Email já está em uso' 
            });
          }
          
          return res.status(500).json({ error: 'Erro ao atualizar perfil' });
        }

        res.json({ 
          message: 'Perfil atualizado com sucesso' 
        });
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// ========================================
// 🔄 VALIDAR TOKEN (útil para verificar se token ainda é válido)
// ========================================
export const validateToken = (req, res) => {
  // Se chegou até aqui, o token é válido (passou pelo middleware)
  res.json({ 
    valid: true, 
    user: req.user 
  });
};
