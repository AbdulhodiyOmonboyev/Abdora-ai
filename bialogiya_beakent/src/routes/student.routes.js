const express = require('express');
const router = express.Router();
const heroRoutes = require('./hero.routes');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const {
  getStudentProgress,
  getStudentCertificates,
} = require('../controllers/student.controller');

router.get('/progress', verifyToken, requireRole('student', 'admin', 'manager', 'teacher'), getStudentProgress);
router.get('/certificates', verifyToken, requireRole('student', 'admin', 'manager'), getStudentCertificates);

router.use('/hero', heroRoutes);

module.exports = router;
