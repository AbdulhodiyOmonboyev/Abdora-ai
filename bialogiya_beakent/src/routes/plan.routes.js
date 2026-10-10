const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
} = require('../controllers/plan.controller');

// All plan routes require authenticated admin
router.use(verifyToken);
router.get('/', getPlans); // Managers and admins can view plans
router.get('/:id', getPlanById);

// Creation, update and deletion requires super admin
router.post('/', requireRole(['admin']), createPlan);
router.put('/:id', requireRole(['admin']), updatePlan);
router.delete('/:id', requireRole(['admin']), deletePlan);

module.exports = router;
