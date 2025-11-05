const router = require('express').Router();
const ctrl = require('../controllers/profile.controller');

// Routes principales pour les profils - utilise userId comme identifiant
router.get('/:userId', ctrl.getProfileByUserId);
router.post('/', ctrl.createProfile);
router.put('/:userId', ctrl.updateProfileByUserId);

module.exports = router;
