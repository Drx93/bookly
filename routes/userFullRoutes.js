const router = require('express').Router();
const ctrl = require('../controllers/userFull.controller');

// GET /api/user-full/:id
router.get('/:id', ctrl.getUserFull);

module.exports = router;
