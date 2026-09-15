const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} = require('../controllers/room.controller');

const authUsers = [verifyToken];
const adminOrReception = [verifyToken, requireRole('admin', 'reception', 'manager')];

router.get('/', ...authUsers, getRooms);
router.post('/', ...adminOrReception, createRoom);
router.put('/:id', ...adminOrReception, updateRoom);
router.delete('/:id', ...adminOrReception, deleteRoom);

module.exports = router;
