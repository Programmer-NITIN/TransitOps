const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../../config/db');

class AuthService {
  async register({ email, password, full_name, role_id }) {
    // Check if email exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      const err = new Error('Email already registered');
      err.statusCode = 409;
      throw err;
    }

    // Validate role exists
    const role = await query('SELECT id, name FROM roles WHERE id = $1', [role_id]);
    if (role.rows.length === 0) {
      const err = new Error('Invalid role selected');
      err.statusCode = 400;
      throw err;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, role_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, role_id, created_at`,
      [email, password_hash, full_name, role_id]
    );

    const user = result.rows[0];
    user.role = role.rows[0].name;

    // Generate token
    const token = this.generateToken(user);

    return { user: this.sanitizeUser(user), token };
  }

  async login({ email, password }) {
    // Find user with role
    const result = await query(
      `SELECT u.id, u.email, u.password_hash, u.full_name, u.role_id, u.created_at, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const user = result.rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const token = this.generateToken(user);

    return { user: this.sanitizeUser(user), token };
  }

  async getProfile(userId) {
    const result = await query(
      `SELECT u.id, u.email, u.full_name, u.role_id, u.created_at, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    return { user: this.sanitizeUser(result.rows[0]) };
  }

  generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role, role_id: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  sanitizeUser(user) {
    const { password_hash, ...safe } = user;
    return safe;
  }
}

module.exports = new AuthService();
