const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');

const getRooms = async (req, res, next) => {
  try {
    const { branchId } = req.query;
    let centerId = req.user.centerId;
    if (!centerId && req.user.role !== 'admin') {
      const u = await prisma.user.findUnique({
        where: { id: req.user.userId || req.user.id },
        select: { centerId: true, branch: { select: { centerId: true } } }
      });
      centerId = u?.centerId || u?.branch?.centerId;
      if (!centerId) {
        const firstCenter = await prisma.center.findFirst({ where: { isActive: true }, select: { id: true } });
        centerId = firstCenter?.id;
      }
    }

    const where = {
      isActive: true,
      ...(centerId ? { centerId } : {}),
    };
    if (branchId) where.branchId = branchId;

    let rooms = await prisma.room.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    if (rooms.length === 0) {
      const defaultRooms = [
        { name: '1-xona', capacity: 20, color: '#3B82F6' },
        { name: '2-xona', capacity: 20, color: '#10B981' },
        { name: '3-xona', capacity: 25, color: '#8B5CF6' },
        { name: '4-xona', capacity: 18, color: '#F59E0B' },
        { name: '5-xona', capacity: 30, color: '#EC4899' },
      ];
      await Promise.all(defaultRooms.map(r =>
        prisma.room.create({
          data: {
            ...r,
            centerId: centerId || null,
            branchId: branchId || null,
            amenities: ['Proyektor', 'Doska'],
          }
        }).catch(() => null)
      ));

      rooms = await prisma.room.findMany({
        where,
        include: {
          branch: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
      });
    }

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
