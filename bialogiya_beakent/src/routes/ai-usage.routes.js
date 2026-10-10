const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const {
  getAIUsageStats,
  getAIUsageLogs,
  exportAIUsageCSV
} = require('../controllers/ai-usage.controller');

router.use(verifyToken);
router.get('/stats', getAIUsageStats);
router.get('/logs', getAIUsageLogs);
router.get('/export', exportAIUsageCSV);

module.exports = router;
