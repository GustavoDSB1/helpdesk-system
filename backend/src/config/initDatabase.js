import db from './database.js';

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Criar tabela de usuários
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'user' CHECK (role IN ('user', 'technician', 'admin')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Erro ao criar tabela users:', err);
        else console.log('✅ Tabela users criada/verificada');
      });

      // Criar tabela de categorias
      db.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          department TEXT CHECK (department IN ('TI', 'Manutenção', 'Outros')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Erro ao criar tabela categories:', err);
        else console.log('✅ Tabela categories criada/verificada');
      });

      // Criar tabela de tickets
      db.run(`
        CREATE TABLE IF NOT EXISTS tickets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'cancelled')),
          priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
          category_id INTEGER,
          user_id INTEGER NOT NULL,
          assigned_to INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          resolved_at DATETIME,
          FOREIGN KEY (category_id) REFERENCES categories(id),
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (assigned_to) REFERENCES users(id)
        )
      `, (err) => {
        if (err) console.error('Erro ao criar tabela tickets:', err);
        else console.log('✅ Tabela tickets criada/verificada');
      });

      // Criar tabela de comentários
      db.run(`
        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ticket_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          is_internal INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) console.error('Erro ao criar tabela comments:', err);
        else console.log('✅ Tabela comments criada/verificada');
      });

      // Inserir categorias padrão
      db.run(`
        INSERT OR IGNORE INTO categories (id, name, description, department) VALUES
        (1, 'Hardware', 'Problemas com equipamentos', 'TI'),
        (2, 'Software', 'Problemas com sistemas e aplicativos', 'TI'),
        (3, 'Rede', 'Problemas de conectividade', 'TI'),
        (4, 'Infraestrutura', 'Problemas prediais', 'Manutenção'),
        (5, 'Elétrica', 'Problemas elétricos', 'Manutenção'),
        (6, 'Outros', 'Outras solicitações', 'Outros')
      `, (err) => {
        if (err) console.error('Erro ao inserir categorias:', err);
        else console.log('✅ Categorias padrão inseridas');
      });

      // Criar índices
      db.run('CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to)');
      db.run('CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)');
      db.run('CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON comments(ticket_id)', (err) => {
        if (err) {
          console.error('Erro ao criar índices:', err);
          reject(err);
        } else {
          console.log('✅ Índices criados/verificados');
          console.log('\n🎉 Banco de dados inicializado com sucesso!\n');
          resolve();
        }
      });
    });
  });
};

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase()
    .then(() => {
      console.log('Finalizando...');
      db.close();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Erro fatal:', err);
      process.exit(1);
    });
}

export default initDatabase;
