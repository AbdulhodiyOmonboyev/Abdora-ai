const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { voiceSampleUpload } = require('../middleware/upload.middleware');
const { uploadVoiceSample, getVoiceProfile, removeVoiceProfile, testVoiceSample } = require('../controllers/voice.controller');

router.post('/clone', verifyToken, voiceSampleUpload.single('sample'), uploadVoiceSample);
router.get('/profile', verifyToken, getVoiceProfile);
router.delete('/profile', verifyToken, removeVoiceProfile);
router.get('/test', verifyToken, testVoiceSample);
router.post('/test', verifyToken, testVoiceSample);

module.exports = router;
