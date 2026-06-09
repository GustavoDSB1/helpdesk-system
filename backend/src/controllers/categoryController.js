import db from '../config/database.js';

export const getCategories = (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name', (err, categories) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
    res.json(categories);
  });
};

export const createCategory = (req, res) => {
  const { name, description, department } = req.body;

  const query = `
    INSERT INTO categories (name, description, department)
    VALUES (?, ?, ?)
  `;

  db.run(query, [name, description, department], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao criar categoria' });
    }

    res.status(201).json({
      message: 'Categoria criada com sucesso',
      categoryId: this.lastID
    });
  });
};
