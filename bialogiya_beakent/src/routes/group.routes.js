const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const {
  createGroup, getMyGroups, getGroupById, updateGroup, deleteGroup,
  addStudentToGroup, removeStudentFromGroup, getAllGroups, getGroupGradebook,
  transferStudentToGroup, getGroupStageProgress, advanceGroupStage
} = require('../controllers/group.controller');

// Teachers can only VIEW their groups - creating/editing/deleting groups
// and adding/removing students is reception's (and admin's) job now.
router.get('/all', verifyToken, requireRole('admin', 'reception', 'manager'), getAllGroups);
router.get('/', verifyToken, requireRole('teacher', 'admin', 'manager', 'reception'), (req, res, next) => {
  if (req.user.role === 'teacher') return getMyGroups(req, res, next);
  return getAllGroups(req, res, next);
});
router.post('/transfer-student', verifyToken, requireRole('admin', 'reception', 'manager', 'teacher'), transferStudentToGroup);

router.get('/:id', verifyToken, getGroupById);
router.get('/:id/gradebook', verifyToken, requireRole('teacher', 'admin', 'manager', 'reception'), getGroupGradebook);
router.get('/:id/stage-progress', verifyToken, requireRole('teacher', 'admin', 'manager', 'reception', 'student'), getGroupStageProgress);
router.get('/:id/stage', verifyToken, requireRole('teacher', 'admin', 'manager', 'reception', 'student'), getGroupStageProgress);
router.post('/', verifyToken, requireRole('admin', 'reception', 'manager'), createGroup);
router.put('/:id', verifyToken, requireRole('admin', 'reception', 'manager'), updateGroup);
router.delete('/:id', verifyToken, requireRole('admin', 'reception', 'manager'), deleteGroup);
router.post('/:id/students', verifyToken, requireRole('admin', 'reception', 'manager'), addStudentToGroup);
router.delete('/:id/students/:studentId', verifyToken, requireRole('admin', 'reception', 'manager'), removeStudentFromGroup);
router.post('/:id/transfer-student', verifyToken, requireRole('admin', 'reception', 'manager', 'teacher'), transferStudentToGroup);
router.post('/:id/advance-stage', verifyToken, requireRole('admin', 'reception', 'manager', 'teacher'), advanceGroupStage);
router.post('/:id/advance', verifyToken, requireRole('admin', 'reception', 'manager', 'teacher'), advanceGroupStage);

module.exports = router;
