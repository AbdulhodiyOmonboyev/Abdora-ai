const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { getAvatarContext, avatarChat, avatarTts } = require('../controllers/avatarAi.controller');

router.get('/avatar-context', verifyToken, getAvatarContext);
router.post('/avatar-chat', verifyToken, avatarChat);
router.post('/avatar-tts', verifyToken, avatarTts);

module.exports = router;
