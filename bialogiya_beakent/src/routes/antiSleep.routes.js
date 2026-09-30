const express = require('express');
const router = express.Router();
const antiSleepService = require('../services/antiSleep.service');

// Anti-sleep xizmatining joriy holatini ko'rish
router.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'Abdora AI Anti-Sleep Daemon',
    data: antiSleepService.getStatus(),
  });
});

// Holatni qisqa ko'rinishda olish
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: antiSleepService.getStatus(),
  });
});

// Qo'lda darhol self-ping yuborish (test yoki majburiy uyg'otish uchun)
router.post('/ping', async (req, res) => {
  try {
    const result = await antiSleepService.pingNow();
    res.json({
      success: true,
      message: 'Self-ping so\'rovi bajarildi',
      data: result,
      stats: antiSleepService.getStatus(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Self-ping so\'rovida xatolik yuz berdi',
      error: err.message,
    });
  }
});

// Xizmatni qayta ishga tushirish yoki intervalni o'zgartirish
router.post('/start', (req, res) => {
  const { intervalMs, targetUrl } = req.body || {};
  const status = antiSleepService.start({ intervalMs, targetUrl, startupDelayMs: 0 });
  res.json({
    success: true,
    message: 'Anti-sleep xizmati faollashtirildi',
    data: status,
  });
});

// Xizmatni to'xtatish
router.post('/stop', (req, res) => {
  const status = antiSleepService.stop();
  res.json({
    success: true,
    message: 'Anti-sleep xizmati to\'xtatildi',
    data: status,
  });
});

module.exports = router;
