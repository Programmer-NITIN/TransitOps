const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/auth');
const authorize = require('../../middleware/rbac');
const ctrl = require('./vehicles.controller');

router.use(authenticate);

// GET /api/vehicles/stats
router.get('/stats', ctrl.stats);

// GET /api/vehicles
router.get('/', ctrl.list);

// GET /api/vehicles/:id
router.get('/:id', ctrl.getById);

// POST /api/vehicles
router.post('/', authorize('Fleet Manager'),
  [
    body('registration_number').trim().notEmpty().withMessage('Registration number required'),
    body('name_model').trim().notEmpty().withMessage('Vehicle model required'),
    body('type').isIn(['Truck', 'Van', 'Trailer', 'Tanker', 'Pickup', 'Bus']).withMessage('Invalid vehicle type'),
    body('max_load_capacity_kg').isFloat({ min: 0.01 }).withMessage('Capacity must be positive'),
    body('acquisition_cost').isFloat({ min: 0.01 }).withMessage('Cost must be positive'),
  ],
  validate,
  ctrl.create
);

// PUT /api/vehicles/:id
router.put('/:id', authorize('Fleet Manager'), ctrl.update);

// DELETE /api/vehicles/:id
router.delete('/:id', authorize('Fleet Manager'), ctrl.remove);

module.exports = router;
