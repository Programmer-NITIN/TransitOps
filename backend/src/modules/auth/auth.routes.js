const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/auth');
const authController = require('./auth.controller');

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('full_name').trim().notEmpty().withMessage('Full name required'),
    body('role_id').isInt({ min: 1 }).withMessage('Valid role required'),
  ],
  validate,
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  authController.login
);

// GET /api/auth/me
router.get('/me', authenticate, authController.getProfile);

// GET /api/auth/roles (public — for registration dropdown)
router.get('/roles', authController.getRoles);

module.exports = router;
