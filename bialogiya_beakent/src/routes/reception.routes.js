const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { createTeacher, getTeachers, getGroups, getMyBranches, getBranchDetail } = require('../controllers/reception.controller');

const receptionOnly = [verifyToken, requireRole('reception', 'admin')];

router.get('/teachers', ...receptionOnly, getTeachers);
router.post('/teachers', ...receptionOnly, createTeacher);
router.get('/groups', ...receptionOnly, getGroups);

// Branches: view only for reception (admin manages branches now)
router.get('/branches', ...receptionOnly, getMyBranches);
router.get('/branches/:id', ...receptionOnly, getBranchDetail);

module.exports = router;
