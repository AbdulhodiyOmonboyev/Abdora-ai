const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireReceptionPermission } = require('../middleware/auth.middleware');
const {
  createLead, getLeads, getLeadStats, getLeadById, updateLead, deleteLead,
  getLeadActivities, createLeadActivity, convertLead,
} = require('../controllers/lead.controller');

const CRM_ROLES = ['manager', 'admin', 'reception'];

router.get('/', verifyToken, requireRole(...CRM_ROLES), requireReceptionPermission('canManageLeads'), getLeads);
router.get('/stats', verifyToken, requireRole(...CRM_ROLES), requireReceptionPermission('canManageLeads'), getLeadStats);
router.get('/:id', verifyToken, requireRole(...CRM_ROLES), requireReceptionPermission('canManageLeads'), getLeadById);
router.post('/', verifyToken, requireRole(...CRM_ROLES), requireReceptionPermission('canManageLeads'), createLead);
router.put('/:id', verifyToken, requireRole(...CRM_ROLES), requireReceptionPermission('canManageLeads'), updateLead);
router.delete('/:id', verifyToken, requireRole('manager', 'admin'), deleteLead);

router.get('/:id/activities', verifyToken, requireRole(...CRM_ROLES), requireReceptionPermission('canManageLeads'), getLeadActivities);
router.post('/:id/activities', verifyToken, requireRole(...CRM_ROLES), requireReceptionPermission('canManageLeads'), createLeadActivity);
router.post('/:id/convert', verifyToken, requireRole(...CRM_ROLES), requireReceptionPermission('canManageLeads'), convertLead);

module.exports = router;
