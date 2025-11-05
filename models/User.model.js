const { pool } = require('../config/db.postgres');

class User {
  static async findAll() {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY id');
    return rows;
  }

  static async findById(id) {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async createOne({ name, email }) {
    if (!name || !email) throw new Error('Name and email are required');
    
    const { rows } = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name.trim(), email.trim()]
    );
    return rows[0];
  }

  static async updateOne(id, { name, email }) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name.trim());
      paramCount++;
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount}`);
      values.push(email.trim());
      paramCount++;
    }

    if (updates.length === 0) return null;

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  static async deleteOne(id) {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return rowCount > 0;
  }
}

module.exports = User;

module.exports = User;
module.exports = User;