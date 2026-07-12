const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/auth');
const authorize = require('../../middleware/rbac');
const ctrl = require('./drivers.controller');

router.use(authenticate);

router.get('/stats', ctrl.stats);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);

router.post('/', authorize('Fleet Manager', 'Safety Officer'),
  [
    body('name').trim().notEmpty().withMessage('Name required'),
    body('license_number').trim().notEmpty().withMessage('License number required'),
    body('license_category').isIn(['A', 'B', 'C', 'D', 'E', 'CE', 'DE']).withMessage('Invalid license category'),
    body('license_expiry').isDate().withMessage('Valid expiry date required'),
    body('contact_number').trim().notEmpty().withMessage('Contact number required'),
  ],
  validate,
  ctrl.create
);

router.put('/:id', authorize('Fleet Manager', 'Safety Officer'), ctrl.update);

module.exports = router;
