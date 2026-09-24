const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const {
  getShopItems,
  createShopItem,
  updateShopItem,
  deleteShopItem,
  purchaseShopItem,
  getShopOrders,
  updateOrderStatus,
} = require('../controllers/shop.controller');

const authOnly = [verifyToken];
const managerOrAdmin = [verifyToken, requireRole('admin', 'manager')];

router.get('/items', ...authOnly, getShopItems);
router.post('/items', ...managerOrAdmin, createShopItem);
router.put('/items/:id', ...managerOrAdmin, updateShopItem);
router.delete('/items/:id', ...managerOrAdmin, deleteShopItem);

router.post('/purchase', verifyToken, purchaseShopItem);
router.get('/orders', ...authOnly, getShopOrders);
router.put('/orders/:id/status', ...managerOrAdmin, updateOrderStatus);

module.exports = router;
