const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/auth');
const authorize = require('../../middleware/rbac');
const ctrl = require('./trips.controller');

router.use(authenticate);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', authorize('Fleet Manager', 'Safety Officer'), [
  body('vehicle_id').notEmpty().withMessage('Vehicle required'),
  body('driver_id').notEmpty().withMessage('Driver required'),
  body('source').trim().notEmpty().withMessage('Source required'),
  body('destination').trim().notEmpty().withMessage('Destination required'),
  body('planned_distance_km').isFloat({ min: 0.1 }).withMessage('Distance required'),
], validate, ctrl.create);
router.put('/:id', authorize('Fleet Manager', 'Safety Officer'), ctrl.update);
router.patch('/:id/status', authorize('Fleet Manager', 'Safety Officer'), [body('status').isIn(['Draft', 'Dispatched', 'Completed', 'Cancelled']).withMessage('Invalid status')], validate, ctrl.updateStatus);

module.exports = router;
