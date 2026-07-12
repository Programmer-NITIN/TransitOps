const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/auth');
const authorize = require('../../middleware/rbac');
const ctrl = require('./expenses.controller');

router.use(authenticate);
router.get('/stats', ctrl.stats);
router.get('/', ctrl.list);
router.post('/', authorize('Fleet Manager', 'Financial Analyst'), [
  body('vehicle_id').notEmpty().withMessage('Vehicle required'),
  body('category').isIn(['Fuel', 'Toll', 'Maintenance', 'Insurance', 'Parking', 'Fine', 'Other']).withMessage('Invalid category'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount required'),
  body('description').trim().notEmpty().withMessage('Description required'),
  body('expense_date').isDate().withMessage('Date required'),
], validate, ctrl.create);
router.put('/:id', authorize('Fleet Manager', 'Financial Analyst'), ctrl.update);
router.delete('/:id', authorize('Fleet Manager', 'Financial Analyst'), ctrl.remove);

module.exports = router;
