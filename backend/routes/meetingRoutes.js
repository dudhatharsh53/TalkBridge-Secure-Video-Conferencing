const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const auth = require('../middleware/auth');

router.get('/ping', (req, res) => res.json({ status: 'alive', time: new Date() }));

router.post('/create', auth.protect, meetingController.createMeeting);
router.post('/join', auth.protect, meetingController.joinMeeting);
router.get('/history', auth.protect, meetingController.getMeetingHistory);
router.post('/end/:meetingId', auth.protect, meetingController.endMeeting);
router.get('/details/:id', auth.protect, meetingController.getMeetingDetails);

module.exports = router;

