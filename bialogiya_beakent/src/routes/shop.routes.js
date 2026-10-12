const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { fileUpload } = require('../middleware/upload.middleware');
const {
  getShopItems,
  createShopItem,
  updateShopItem,
  deleteShopItem,
  purchaseShopItem,
  getShopOrders,
  updateOrderStatus,
  uploadShopImage,
  getShopImage,
} = require('../controllers/shop.controller');

const authOnly = [verifyToken];
const managerOrAdmin = [verifyToken, requireRole('admin', 'manager')];

// Public shop image server
router.get('/image/:id', getShopImage);

// Upload shop item image
router.post('/upload-image', ...managerOrAdmin, fileUpload.single('image'), uploadShopImage);

router.get('/items', ...authOnly, getShopItems);
router.post('/items', ...managerOrAdmin, fileUpload.single('image'), createShopItem);
router.put('/items/:id', ...managerOrAdmin, fileUpload.single('image'), updateShopItem);
router.delete('/items/:id', ...managerOrAdmin, deleteShopItem);

router.post('/purchase', verifyToken, purchaseShopItem);
router.get('/orders', ...authOnly, getShopOrders);
router.put('/orders/:id/status', ...managerOrAdmin, updateOrderStatus);

module.exports = router;
