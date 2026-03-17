const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', auth.protect, authController.getProfile);
router.put('/update-profile', auth.protect, authController.updateProfile);
router.put('/change-password', auth.protect, authController.changePassword);
router.get('/search', auth.protect, authController.searchUsers);
router.get('/users', auth.protect, authController.getAllUsers);

module.exports = router;

