const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/auth');
const authorize = require('../../middleware/rbac');
const ctrl = require('./maintenance.controller');

router.use(authenticate);
router.get('/stats', ctrl.stats);
router.get('/', ctrl.list);
router.post('/', authorize('Fleet Manager'), [
  body('vehicle_id').notEmpty().withMessage('Vehicle required'),
  body('service_type').trim().notEmpty().withMessage('Service type required'),
  body('description').trim().notEmpty().withMessage('Description required'),
  body('cost').isFloat({ min: 0 }).withMessage('Cost must be positive'),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority'),
], validate, ctrl.create);
router.put('/:id', authorize('Fleet Manager'), ctrl.update);
router.patch('/:id/close', authorize('Fleet Manager'), ctrl.close);
router.delete('/:id', authorize('Fleet Manager'), ctrl.remove);

module.exports = router;
