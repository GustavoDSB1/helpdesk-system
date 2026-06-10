import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Caminho do banco (arquivo está em database/)
const dbPath = path.join(__dirname, 'helpdesk.db');
const sqlite = sqlite3.verbose();
const db = new sqlite.Database(dbPath);

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // TABELA DE USUÁRIOS
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          full_name TEXT,
          role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'technician', 'user')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('❌ Erro ao criar tabela users:', err);
        else console.log('✅ Tabela users criada/verificada');
      });

      // TABELA DE CATEGORIAS
      db.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          color TEXT DEFAULT '#3B82F6',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('❌ Erro ao criar tabela categories:', err);
        else console.log('✅ Tabela categories criada/verificada');
      });

      // TABELA DE TICKETS
      db.run(`
        CREATE TABLE IF NOT EXISTS tickets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
          priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
          category_id INTEGER,
          user_id INTEGER NOT NULL,
          assigned_to INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id),
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (assigned_to) REFERENCES users(id)
        )
      `, (err) => {
        if (err) console.error('❌ Erro ao criar tabela tickets:', err);
        else console.log('✅ Tabela tickets criada/verificada');
      });

      // TABELA DE COMENTÁRIOS
      db.run(`
        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ticket_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          comment TEXT NOT NULL,
          is_internal BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) console.error('❌ Erro ao criar tabela comments:', err);
        else console.log('✅ Tabela comments criada/verificada');
      });

      // CATEGORIAS PADRÃO
      const categories = [
        ['Hardware', 'Problemas com equipamentos físicos', '#EF4444'],
        ['Software', 'Problemas com programas e sistemas', '#3B82F6'],
        ['Rede', 'Problemas de conectividade', '#10B981'],
        ['Senha', 'Redefinição de senhas', '#F59E0B'],
        ['Outro', 'Outras solicitações', '#6B7280']
      ];

      const insertCategory = db.prepare(`
        INSERT OR IGNORE INTO categories (name, description, color) 
        VALUES (?, ?, ?)
      `);

      categories.forEach(cat => insertCategory.run(cat));

      insertCategory.finalize((err) => {
        if (err) {
          console.error('❌ Erro ao inserir categorias:', err);
          reject(err);
        } else {
          console.log('✅ Categorias padrão inseridas');
          
          // ÍNDICES
          db.run('CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id)');
          db.run('CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assigned_to)');
          db.run('CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)');
          db.run('CREATE INDEX IF NOT EXISTS idx_comments_ticket ON comments(ticket_id)');
          
          console.log('✅ Índices criados/verificados');
          console.log('\n🎉 Banco de dados inicializado com sucesso!\n');
          
          resolve();
        }
      });
    });
  });
};

export { db, initDatabase };
