import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { initDatabase } from '../database/init.js'; 
import open from 'open';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Help Desk API está funcionando',
    timestamp: new Date().toISOString()
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor'
  });
});

// Inicializar banco e servidor
const startServer = async () => {
  try {
    await initDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      const healthUrl = `http://localhost:${PORT}/api/health`;
      
      console.log('\n🚀 ========================================');
      console.log(`✅ Servidor rodando na porta ${PORT}`);
      console.log(`💻 Local: http://localhost:${PORT}/api`);
      console.log(`🌐 Rede: http://192.168.0.15:${PORT}/api`);
      console.log(`🔍 Health: ${healthUrl}`);
      console.log('🚀 ========================================\n');
      
      // 🔥 Abrir navegador automaticamente
      open(healthUrl).then(() => {
        console.log('🌐 Navegador aberto automaticamente!\n');
      }).catch(() => {
        console.log('⚠️  Não foi possível abrir o navegador automaticamente\n');
      });
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();
