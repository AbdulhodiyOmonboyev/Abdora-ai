const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const {
  getSMSStats,
  getSMSLogs,
  sendTestOrCustomSMS,
  getSMSTemplates,
  updateSMSTemplates
} = require('../controllers/sms.controller');

router.use(verifyToken);
router.use(requireRole(['admin', 'manager']));
router.get('/stats', getSMSStats);
router.get('/logs', getSMSLogs);
router.post('/send', sendTestOrCustomSMS);
router.get('/templates', getSMSTemplates);
router.put('/templates', updateSMSTemplates);

module.exports = router;
