const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const {
  getStats, getTeachers, createTeacher, updateTeacher, deleteTeacher,
  getStudents, getGroups, toggleUserStatus, getSettings, updateSettings,
  getReceptionUsers, createReceptionUser, updateReceptionUser, deleteReceptionUser, getTeacherOverview,
  getBranches, createBranch, updateBranch, deleteBranch, getBranchDetail,
} = require('../controllers/admin.controller');

const adminOnly = [verifyToken, requireRole('admin', 'manager')];
// Reception now has almost all of admin's operational capabilities (manage
// teachers/students/groups, view stats, edit settings) - the one boundary
// that stays admin/manager-exclusive is creating/deactivating OTHER reception
// accounts (see below), so a front-desk account can't grant itself peers.
const adminOrReception = [verifyToken, requireRole('admin', 'reception', 'manager')];

router.get('/stats', ...adminOrReception, getStats);
router.get('/teachers', ...adminOrReception, getTeachers);
router.get('/teachers/:id/overview', ...adminOrReception, getTeacherOverview);
router.post('/teachers', ...adminOrReception, createTeacher);
router.put('/teachers/:id', ...adminOrReception, updateTeacher);
router.delete('/teachers/:id', ...adminOrReception, deleteTeacher);
router.get('/students', ...adminOrReception, getStudents);
router.get('/groups', ...adminOrReception, getGroups);
router.put('/users/:id/toggle', ...adminOrReception, toggleUserStatus);
router.get('/settings', ...adminOrReception, getSettings);
router.put('/settings', ...adminOrReception, updateSettings);

// Centers (O'quv Markazlar) - Superadmin only
const {
  getCenters, getCenterDetail, createCenter, updateCenter, deleteCenter
} = require('../controllers/center.controller');

router.get('/centers', ...adminOnly, getCenters);
router.get('/centers/:id', ...adminOnly, getCenterDetail);
router.post('/centers', ...adminOnly, createCenter);
router.put('/centers/:id', ...adminOnly, updateCenter);
router.delete('/centers/:id', ...adminOnly, deleteCenter);

// Branches - admin only (read permitted for reception & manager)
router.get('/branches', ...adminOrReception, getBranches);
router.post('/branches', ...adminOnly, createBranch);
router.get('/branches/:id', ...adminOnly, getBranchDetail);
router.put('/branches/:id', ...adminOnly, updateBranch);
router.delete('/branches/:id', ...adminOnly, deleteBranch);

// Reception accounts - only admin can create/deactivate them.
router.get('/reception', ...adminOnly, getReceptionUsers);
router.post('/reception', ...adminOnly, createReceptionUser);
router.put('/reception/:id', ...adminOnly, updateReceptionUser);
router.delete('/reception/:id', ...adminOnly, deleteReceptionUser);

// AI Agents
const {
  getAIAgents, createAIAgent, updateAIAgent, deleteAIAgent
} = require('../controllers/ai-agents.controller');

router.get('/ai-agents', ...adminOnly, getAIAgents);
router.post('/ai-agents', ...adminOnly, createAIAgent);
router.put('/ai-agents/:id', ...adminOnly, updateAIAgent);
router.delete('/ai-agents/:id', ...adminOnly, deleteAIAgent);

module.exports = router;
