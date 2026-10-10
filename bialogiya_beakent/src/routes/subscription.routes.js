const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const {
  getAllSubscriptions,
  getCenterSubscription,
  assignPlan,
  markPaid,
  suspendSubscription,
  activateSubscription,
  configureBYOK,
  configureBYOS
} = require('../controllers/subscription.controller');

router.use(verifyToken);

// Super Admin routes
router.get('/', requireRole(['admin']), getAllSubscriptions);
router.post('/:centerId/assign', requireRole(['admin']), assignPlan);
router.post('/:centerId/mark-paid', requireRole(['admin']), markPaid);
router.post('/:centerId/suspend', requireRole(['admin']), suspendSubscription);
router.post('/:centerId/activate', requireRole(['admin']), activateSubscription);

// Center Manager & Admin routes
router.get('/:centerId?', getCenterSubscription);
router.post('/:centerId?/byok', configureBYOK);
router.post('/:centerId?/byos', configureBYOS);

module.exports = router;
