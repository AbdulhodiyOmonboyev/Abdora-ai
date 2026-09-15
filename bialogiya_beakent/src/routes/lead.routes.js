const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const {
  createLead, getLeads, getLeadStats, getLeadById, updateLead, deleteLead,
  getLeadActivities, createLeadActivity, convertLead,
} = require('../controllers/lead.controller');

const CRM_ROLES = ['manager', 'admin', 'reception'];

router.get('/', verifyToken, requireRole(...CRM_ROLES), getLeads);
router.get('/stats', verifyToken, requireRole(...CRM_ROLES), getLeadStats);
router.get('/:id', verifyToken, requireRole(...CRM_ROLES), getLeadById);
router.post('/', verifyToken, requireRole(...CRM_ROLES), createLead);
router.put('/:id', verifyToken, requireRole(...CRM_ROLES), updateLead);
router.delete('/:id', verifyToken, requireRole('manager', 'admin'), deleteLead);

router.get('/:id/activities', verifyToken, requireRole(...CRM_ROLES), getLeadActivities);
router.post('/:id/activities', verifyToken, requireRole(...CRM_ROLES), createLeadActivity);
router.post('/:id/convert', verifyToken, requireRole(...CRM_ROLES), convertLead);

module.exports = router;
