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

const { error } = require('../utils/apiResponse');

router.use(verifyToken);

// Super Admin routes
router.get('/', (req, res, next) => {
  if (req.user.role === 'admin') return getAllSubscriptions(req, res, next);
  if (['manager', 'reception'].includes(req.user.role)) return getCenterSubscription(req, res, next);
  return error(res, 'Ruxsat berilmagan', 403);
});
router.post('/:centerId/assign', requireRole(['admin']), assignPlan);
router.post('/:centerId/mark-paid', requireRole(['admin']), markPaid);
router.post('/:centerId/suspend', requireRole(['admin']), suspendSubscription);
router.post('/:centerId/activate', requireRole(['admin']), activateSubscription);

// Center Manager & Admin routes
router.get('/:centerId', requireRole(['admin', 'manager', 'reception']), getCenterSubscription);
router.post('/byok', requireRole(['admin', 'manager']), configureBYOK);
router.post('/:centerId/byok', requireRole(['admin', 'manager']), configureBYOK);
router.post('/byos', requireRole(['admin', 'manager']), configureBYOS);
router.post('/:centerId/byos', requireRole(['admin', 'manager']), configureBYOS);

module.exports = router;
