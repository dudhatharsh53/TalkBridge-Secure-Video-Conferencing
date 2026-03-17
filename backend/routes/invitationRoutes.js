const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');
const auth = require('../middleware/auth');

router.post('/send', auth.protect, invitationController.sendInvitation);
router.get('/sent', auth.protect, invitationController.getSentInvitations);
router.get('/received', auth.protect, invitationController.getReceivedInvitations);
router.patch('/:invitationId', auth.protect, invitationController.updateInvitationStatus);

module.exports = router;
