const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireReceptionPermission } = require('../middleware/auth.middleware');
const { getGroupPayments, markPayment, removePayment, getDebtors, exportGroupPayments } = require('../controllers/payment.controller');

const STAFF = ['teacher', 'admin', 'reception', 'manager'];

router.get('/debts', verifyToken, requireRole(...STAFF), requireReceptionPermission('canManagePayments'), getDebtors);
router.get('/group/:groupId', verifyToken, requireRole(...STAFF), requireReceptionPermission('canManagePayments'), getGroupPayments);
router.get('/group/:groupId/export', verifyToken, requireRole(...STAFF), requireReceptionPermission('canManagePayments'), exportGroupPayments);
router.post('/', verifyToken, requireRole(...STAFF), requireReceptionPermission('canManagePayments'), markPayment);
router.delete('/:studentId/:month', verifyToken, requireRole(...STAFF), requireReceptionPermission('canManagePayments'), removePayment);

module.exports = router;
