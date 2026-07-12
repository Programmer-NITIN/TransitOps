const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/auth');
const ctrl = require('./expenses.controller');

router.use(authenticate);
router.get('/stats', ctrl.stats);
router.get('/', ctrl.list);
router.post('/', [
  body('category').isIn(['Fuel', 'Maintenance', 'Insurance', 'Toll', 'Salary', 'Penalty', 'Other']).withMessage('Invalid category'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount required'),
  body('description').trim().notEmpty().withMessage('Description required'),
  body('expense_date').isDate().withMessage('Date required'),
], validate, ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
