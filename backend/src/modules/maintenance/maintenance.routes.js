const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/auth');
const ctrl = require('./maintenance.controller');

router.use(authenticate);
router.get('/stats', ctrl.stats);
router.get('/', ctrl.list);
router.post('/', [
  body('vehicle_id').notEmpty().withMessage('Vehicle required'),
  body('type').isIn(['Preventive', 'Corrective', 'Emergency']).withMessage('Invalid type'),
  body('description').trim().notEmpty().withMessage('Description required'),
  body('cost').isFloat({ min: 0 }).withMessage('Cost must be positive'),
  body('service_date').isDate().withMessage('Service date required'),
], validate, ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
