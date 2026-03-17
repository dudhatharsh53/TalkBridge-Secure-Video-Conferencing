const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/auth');

router.get('/stats', protect, isAdmin, adminController.getStats);
router.get('/users', protect, isAdmin, adminController.getAllUsers);
router.put('/users/:id', protect, isAdmin, adminController.updateUser);
router.delete('/users/:id', protect, isAdmin, adminController.deleteUser);
router.get('/meetings', protect, isAdmin, adminController.getAllMeetings);
router.delete('/meetings/:id', protect, isAdmin, adminController.deleteMeeting);
router.get('/invitation-stats', protect, isAdmin, adminController.getInvitationStats);

module.exports = router;

