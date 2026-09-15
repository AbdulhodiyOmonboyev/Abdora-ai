const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const {
  getStudentProgress,
  getStudentCertificates,
} = require('../controllers/student.controller');

router.get('/progress', verifyToken, requireRole('student', 'admin', 'manager', 'teacher'), getStudentProgress);
router.get('/certificates', verifyToken, requireRole('student', 'admin', 'manager'), getStudentCertificates);

module.exports = router;
