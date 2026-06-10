import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORRETO: banco está em backend/database/
const dbPath = path.join(__dirname, 'database', 'helpdesk.db');
const backupDir = path.join(__dirname, 'backups');

// Criar pasta de backups
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Verificar se o banco existe
if (!fs.existsSync(dbPath)) {
  console.error('❌ Arquivo do banco de dados não encontrado:', dbPath);
  console.log('💡 Verifique se o banco foi inicializado: npm run init-db');
  process.exit(1);
}

// Data e hora para o nome do arquivo
const now = new Date();
const timestamp = now.toISOString()
  .replace(/[:.]/g, '-')
  .replace('T', '_')
  .split('.')[0]; // 2026-06-09_14-30-45

const backupPath = path.join(backupDir, `helpdesk_backup_${timestamp}.db`);

try {
  // Criar backup
  fs.copyFileSync(dbPath, backupPath);
  
  console.log('✅ Backup criado com sucesso!');
  console.log('📁 Local:', backupPath);
  
  // Informações do arquivo
  const stats = fs.statSync(backupPath);
  const fileSizeInKB = (stats.size / 1024).toFixed(2);
  console.log('📊 Tamanho:', fileSizeInKB, 'KB');
  console.log('🕐 Data/Hora:', now.toLocaleString('pt-BR'));
  
  // Limpar backups antigos (manter apenas os últimos 10)
  const backups = fs.readdirSync(backupDir)
    .filter(file => file.startsWith('helpdesk_backup_'))
    .map(file => ({
      name: file,
      path: path.join(backupDir, file),
      time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);
  
  if (backups.length > 10) {
    console.log('\n🧹 Limpando backups antigos...');
    const toDelete = backups.slice(10);
    
    toDelete.forEach(backup => {
      fs.unlinkSync(backup.path);
      console.log('   ❌ Removido:', backup.name);
    });
    
    console.log(`✅ ${toDelete.length} backup(s) antigo(s) removido(s)`);
  }
  
  console.log(`\n📦 Total de backups: ${Math.min(backups.length, 10)}`);
  
} catch (error) {
  console.error('❌ Erro ao criar backup:', error.message);
  process.exit(1);
}
