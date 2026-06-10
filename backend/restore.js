import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORRETO: banco está em backend/database/
const dbPath = path.join(__dirname, 'database', 'helpdesk.db');
const backupDir = path.join(__dirname, 'backups');

// Listar backups disponíveis
if (!fs.existsSync(backupDir)) {
  console.error('❌ Pasta de backups não encontrada');
  console.log('💡 Crie um backup primeiro: npm run backup');
  process.exit(1);
}

const backups = fs.readdirSync(backupDir)
  .filter(file => file.startsWith('helpdesk_backup_') && file.endsWith('.db'))
  .map(file => ({
    name: file,
    path: path.join(backupDir, file),
    time: fs.statSync(path.join(backupDir, file)).mtime
  }))
  .sort((a, b) => b.time - a.time);

if (backups.length === 0) {
  console.error('❌ Nenhum backup encontrado');
  console.log('💡 Crie um backup primeiro: npm run backup');
  process.exit(1);
}

console.log('📦 Backups disponíveis:\n');
backups.forEach((backup, index) => {
  const stats = fs.statSync(backup.path);
  const size = (stats.size / 1024).toFixed(2);
  console.log(`${index + 1}. ${backup.name}`);
  console.log(`   📅 ${backup.time.toLocaleString('pt-BR')}`);
  console.log(`   📊 ${size} KB\n`);
});

// Interface para perguntar ao usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Digite o número do backup para restaurar (ou "c" para cancelar): ', (answer) => {
  if (answer.toLowerCase() === 'c') {
    console.log('❌ Operação cancelada');
    rl.close();
    return;
  }
  
  const index = parseInt(answer) - 1;
  
  if (isNaN(index) || index < 0 || index >= backups.length) {
    console.error('❌ Número inválido');
    rl.close();
    return;
  }
  
  const selectedBackup = backups[index];
  
  rl.question('\n⚠️  ATENÇÃO: Isso vai substituir o banco atual. Continuar? (s/n): ', (confirm) => {
    if (confirm.toLowerCase() !== 's') {
      console.log('❌ Operação cancelada');
      rl.close();
      return;
    }
    
    try {
      // Fazer backup do banco atual antes de substituir
      const currentBackupPath = path.join(backupDir, `helpdesk_before_restore_${Date.now()}.db`);
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, currentBackupPath);
        console.log('✅ Backup de segurança do banco atual criado');
      }
      
      // Restaurar
      fs.copyFileSync(selectedBackup.path, dbPath);
      
      console.log('\n✅ Backup restaurado com sucesso!');
      console.log('📁 Arquivo:', selectedBackup.name);
      console.log('🔄 Reinicie o servidor backend para aplicar as mudanças');
      
    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error.message);
    }
    
    rl.close();
  });
});
