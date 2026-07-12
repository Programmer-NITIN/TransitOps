const authService = require('./auth.service');

exports.register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const result = await authService.getProfile(req.user.id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getRoles = async (req, res, next) => {
  try {
    const { query } = require('../../config/db');
    const result = await query('SELECT id, name, description FROM roles ORDER BY id');
    res.json({ success: true, roles: result.rows });
  } catch (err) {
    next(err);
  }
};
