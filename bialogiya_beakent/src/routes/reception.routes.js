const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { createTeacher, getTeachers, getGroups, getMyBranches, getBranchDetail, createBranch, updateBranch, deleteBranch } = require('../controllers/reception.controller');

const receptionOnly = [verifyToken, requireRole('reception', 'admin')];

router.get('/teachers', ...receptionOnly, getTeachers);
router.post('/teachers', ...receptionOnly, createTeacher);
router.get('/groups', ...receptionOnly, getGroups);

// Branches: admin can view (oversight) but only reception can create/edit/delete them.
router.get('/branches', ...receptionOnly, getMyBranches);
router.get('/branches/:id', ...receptionOnly, getBranchDetail);
router.post('/branches', verifyToken, requireRole('reception'), createBranch);
router.put('/branches/:id', verifyToken, requireRole('reception'), updateBranch);
router.delete('/branches/:id', verifyToken, requireRole('reception'), deleteBranch);

module.exports = router;
