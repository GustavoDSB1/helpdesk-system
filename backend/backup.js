import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORRETO: banco está em backend/database/
const dbPath = path.join(__dirname, 'database', 'helpdesk.db');
const backupDir = path.join(__dirname, 'backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const backupPath = path.join(backupDir, `helpdesk_backup_${timestamp}.db`);

// Criar pasta de backups se não existir
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Verificar se o banco existe
if (!fs.existsSync(dbPath)) {
  console.error('❌ Arquivo do banco de dados não encontrado:', dbPath);
  console.log('💡 Verifique se o banco foi inicializado: npm run init-db');
  process.exit(1);
}

// Copiar arquivo
try {
  fs.copyFileSync(dbPath, backupPath);
  console.log('✅ Backup criado com sucesso!');
  console.log('📁 Local:', backupPath);
  
  // Mostrar tamanho do arquivo
  const stats = fs.statSync(backupPath);
  const fileSizeInKB = (stats.size / 1024).toFixed(2);
  console.log('📊 Tamanho:', fileSizeInKB, 'KB');
} catch (error) {
  console.error('❌ Erro ao criar backup:', error.message);
  process.exit(1);
}
