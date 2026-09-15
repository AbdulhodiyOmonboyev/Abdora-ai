const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');

const getRooms = async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const where = {
      isActive: true,
      ...(req.user.role !== 'admin' && req.user.centerId ? { centerId: req.user.centerId } : {}),
    };
    if (branchId) where.branchId = branchId;

    const rooms = await prisma.room.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    return success(res, rooms);
  } catch (err) {
    next(err);
  }
};

const createRoom = async (req, res, next) => {
  try {
    const { name, capacity, color, amenities, branchId } = req.body;
    if (!name?.trim()) return error(res, 'Xona nomi kiritilishi shart', 400);

    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        capacity: capacity ? parseInt(capacity, 10) : null,
        color: color || '#3B82F6',
        amenities: Array.isArray(amenities) ? amenities : [],
        branchId: branchId || null,
        centerId: req.user.centerId || null,
      },
      include: {
        branch: { select: { id: true, name: true } },
      },
    });

    return success(res, room, 'Xona muvaffaqiyatli yaratildi', 201);
  } catch (err) {
    next(err);
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, capacity, color, amenities, branchId, isActive } = req.body;

    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) return error(res, 'Xona topilmadi', 404);

    const updated = await prisma.room.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(capacity !== undefined ? { capacity: parseInt(capacity, 10) } : {}),
        ...(color !== undefined ? { color } : {}),
        ...(amenities !== undefined ? { amenities: Array.isArray(amenities) ? amenities : [] } : {}),
        ...(branchId !== undefined ? { branchId } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: {
        branch: { select: { id: true, name: true } },
      },
    });

    return success(res, updated, 'Xona yangilandi');
  } catch (err) {
    next(err);
  }
};

const deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) return error(res, 'Xona topilmadi', 404);

    await prisma.room.update({
      where: { id },
      data: { isActive: false },
    });

    return success(res, null, 'Xona o\'chirildi');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
};
