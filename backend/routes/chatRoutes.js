const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

router.get('/messages/:meetingId', auth.protect, chatController.getMessages);
router.get('/private/:otherUserId', auth.protect, chatController.getPrivateMessages);
router.get('/chatted-users', auth.protect, chatController.getChattedUsers);
router.post('/mark-seen', auth.protect, chatController.markMessagesAsSeen);
router.get('/search-users', auth.protect, chatController.searchUsers);

module.exports = router;
