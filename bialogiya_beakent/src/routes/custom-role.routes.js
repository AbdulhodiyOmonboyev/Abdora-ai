const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const {
  getCustomRoles,
  createCustomRole,
  updateCustomRole,
  deleteCustomRole,
  assignUserCustomRole
} = require('../controllers/custom-role.controller');

router.use(verifyToken);
router.get('/', getCustomRoles);
router.post('/', requireRole(['admin', 'manager']), createCustomRole);
router.put('/:id', requireRole(['admin', 'manager']), updateCustomRole);
router.delete('/:id', requireRole(['admin', 'manager']), deleteCustomRole);
router.post('/assign', requireRole(['admin', 'manager']), assignUserCustomRole);

module.exports = router;
