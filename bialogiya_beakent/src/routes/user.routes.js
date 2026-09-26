const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const {
  createStudent, createTeacher, createManager, getManagers, updateManager, deleteManager, getManagerBranches, getAllUsers, getStudentsByTeacher, getUserById,
  updateUser, updateProfile, deleteUser, resetStudentPassword, freezeStudent, changePassword,
  getStudentHistory, addStudentNote, deleteStudentNote, awardStudentCoins, testAIPersonalization
} = require('../controllers/user.controller');

router.get('/', verifyToken, requireRole('admin', 'reception', 'manager'), getAllUsers);
router.get('/my-students', verifyToken, requireRole('teacher'), getStudentsByTeacher);
// Creating/editing/deleting student accounts is reception's (and admin/manager's)
// job now - teachers can view their students and freeze them, but not
// create, edit, or delete accounts.
router.post('/create-student', verifyToken, requireRole('admin', 'reception', 'manager'), createStudent);
router.post('/create-teacher', verifyToken, requireRole('admin', 'manager'), createTeacher);
router.post('/create-manager', verifyToken, requireRole('admin'), createManager);
router.get('/managers/list', verifyToken, requireRole('admin'), getManagers);
router.put('/managers/:id', verifyToken, requireRole('admin'), updateManager);
router.delete('/managers/:id', verifyToken, requireRole('admin'), deleteManager);
router.get('/manager/branches', verifyToken, requireRole('manager'), getManagerBranches);
router.put('/profile', verifyToken, updateProfile);
router.post('/change-password', verifyToken, changePassword);
router.post('/ai-test', verifyToken, testAIPersonalization);

// Student History, Notes, Coin Awards
router.get('/:id/history', verifyToken, requireRole('admin', 'reception', 'manager', 'teacher', 'student'), getStudentHistory);
router.post('/:id/notes', verifyToken, requireRole('admin', 'reception', 'manager', 'teacher'), addStudentNote);
router.delete('/:id/notes/:noteId', verifyToken, requireRole('admin', 'reception', 'manager', 'teacher'), deleteStudentNote);
router.post('/:id/award-coins', verifyToken, requireRole('admin', 'reception', 'manager', 'teacher'), awardStudentCoins);

router.get('/:id', verifyToken, requireRole('admin', 'reception', 'manager', 'teacher'), getUserById);
router.put('/:id', verifyToken, requireRole('admin', 'reception', 'manager'), updateUser);
router.delete('/:id', verifyToken, requireRole('admin', 'reception', 'manager'), deleteUser);
router.post('/:id/reset-password', verifyToken, requireRole('admin', 'reception', 'manager'), resetStudentPassword);
router.patch('/:id/freeze', verifyToken, requireRole('teacher', 'admin', 'reception', 'manager'), freezeStudent);

module.exports = router;
