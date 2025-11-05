const { pool } = require('../config/db.postgres');

class Book {
  static async findAll() {
    const { rows } = await pool.query('SELECT * FROM books ORDER BY id');
    return rows;
  }

  static async findById(id) {
    const { rows } = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async createOne({ title, author, available = true }) {
    if (!title || !author) throw new Error('Title and author are required');
    
    const { rows } = await pool.query(
      'INSERT INTO books (title, author, available) VALUES ($1, $2, $3) RETURNING *',
      [title.trim(), author.trim(), available]
    );
    return rows[0];
  }

  static async updateOne(id, { title, author, available }) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) throw new Error("Invalid title");
      updates.push(`title = $${paramCount}`);
      values.push(title.trim());
      paramCount++;
    }
    if (author !== undefined) {
      if (typeof author !== "string" || !author.trim()) throw new Error("Invalid author");
      updates.push(`author = $${paramCount}`);
      values.push(author.trim());
      paramCount++;
    }
    if (available !== undefined) {
      updates.push(`available = $${paramCount}`);
      values.push(Boolean(available));
      paramCount++;
    }

    if (updates.length === 0) return null;

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE books SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  static async deleteOne(id) {
    const { rowCount } = await pool.query('DELETE FROM books WHERE id = $1', [id]);
    return rowCount > 0;
  }
}

module.exports = Book;

module.exports = Book;