const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const {
  getMyHero,
  setupHero,
  updateHero,
  reverseTeach,
  getAvailableRaces,
} = require('../controllers/hero.controller');

const studentOrAdmin = [verifyToken, requireRole('student', 'admin', 'manager', 'teacher')];

router.get('/me', ...studentOrAdmin, getMyHero);
router.get('/races', ...studentOrAdmin, getAvailableRaces);
router.post('/setup', ...studentOrAdmin, setupHero);
router.put('/update', ...studentOrAdmin, updateHero);
router.post('/reverse-teach', ...studentOrAdmin, reverseTeach);

module.exports = router;
