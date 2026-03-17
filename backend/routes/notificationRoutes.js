const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.get('/', auth.protect, notificationController.getNotifications);
router.patch('/:id/read', auth.protect, notificationController.markAsRead);
router.patch('/read-all', auth.protect, notificationController.markAllAsRead);

module.exports = router;
