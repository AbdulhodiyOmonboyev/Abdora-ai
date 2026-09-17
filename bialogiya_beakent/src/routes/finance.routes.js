const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireReceptionPermission } = require('../middleware/auth.middleware');
const {
  createExpense, getExpenses, updateExpense, deleteExpense,
  getPayroll, setTeacherSalary,
  getSummary, getGroupRevenue, getCashReport, getFinancialAdvice,
  getCashbox, createCashboxTransaction,
} = require('../controllers/finance.controller');

// Finance is management-only: teachers and students never see it.
const FINANCE_ROLES = ['admin', 'manager', 'reception'];
// Only admin and manager decide what a teacher is paid.
const PAYROLL_ROLES = ['admin', 'manager'];

router.get('/summary', verifyToken, requireRole(...FINANCE_ROLES), requireReceptionPermission('canViewFinance'), getSummary);
router.get('/by-group', verifyToken, requireRole(...FINANCE_ROLES), requireReceptionPermission('canViewFinance'), getGroupRevenue);
router.get('/cash', verifyToken, requireRole(...FINANCE_ROLES), requireReceptionPermission('canViewFinance'), getCashReport);
router.get('/advice', verifyToken, requireRole(...FINANCE_ROLES), requireReceptionPermission('canViewFinance'), getFinancialAdvice);

router.get('/cashbox', verifyToken, requireRole(...FINANCE_ROLES), requireReceptionPermission('canViewCashbox'), getCashbox);
router.post('/cashbox/transaction', verifyToken, requireRole(...FINANCE_ROLES), requireReceptionPermission('canViewCashbox'), createCashboxTransaction);

router.get('/expenses', verifyToken, requireRole(...FINANCE_ROLES), requireReceptionPermission('canViewFinance'), getExpenses);
router.post('/expenses', verifyToken, requireRole(...FINANCE_ROLES), requireReceptionPermission('canViewFinance'), createExpense);
router.put('/expenses/:id', verifyToken, requireRole(...FINANCE_ROLES), requireReceptionPermission('canViewFinance'), updateExpense);
router.delete('/expenses/:id', verifyToken, requireRole(...FINANCE_ROLES), requireReceptionPermission('canViewFinance'), deleteExpense);

router.get('/payroll', verifyToken, requireRole(...PAYROLL_ROLES), getPayroll);
router.put('/teachers/:id/salary', verifyToken, requireRole(...PAYROLL_ROLES), setTeacherSalary);

module.exports = router;
