const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { generateUsername, generatePassword } = require('../utils/generateCredentials');

// GET /admin/centers
const getCenters = async (req, res, next) => {
  try {
    const centers = await prisma.center.findMany({
      where: { isActive: true },
      include: {
        branches: {
          select: { id: true, name: true, address: true, isActive: true },
        },
        users: {
          where: { role: 'manager', isActive: true },
          select: { id: true, name: true, username: true, phone: true },
        },
        _count: {
          select: {
            users: true,
            groups: true,
            branches: true,
            leads: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Count students per center separately (they belong to center via centerId)
    const studentCounts = await Promise.all(
      centers.map((c) => prisma.user.count({ where: { role: 'student', centerId: c.id, isActive: true } }))
    );

    const formatted = centers.map((c, i) => ({
      id: c.id,
      name: c.name,
      address: c.address,
      phone: c.phone,
      email: c.email || null,
      website: c.website || null,
      isActive: c.isActive,
      createdAt: c.createdAt,
      settings: c.settings,
      _count: {
        branches: c._count.branches,
        students: studentCounts[i],
        groups: c._count.groups,
        leads: c._count.leads,
      },
      branches: c.branches,
      managers: c.users,
      primaryManager: c.users[0] || null,
    }));

    return success(res, formatted);
  } catch (err) {
    next(err);
  }
};

// POST /admin/centers
const createCenter = async (req, res, next) => {
  try {
    const {
      name,
      address,
      phone,
      managerName,
      managerUsername,
      managerPassword,
      managerPhone,
    } = req.body;

    if (!name?.trim()) return error(res, 'O\'quv markaz nomi kiritilishi shart', 400);

    // 1. Create Center
    const center = await prisma.center.create({
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        settings: {},
      },
    });

    let manager = null;
    let credentials = null;

    // 2. If manager account details provided, create manager account for this center
    if (managerName?.trim()) {
      const username = managerUsername?.trim() || generateUsername(managerName, managerPhone || phone);
      const rawPassword = managerPassword?.trim() || generatePassword(managerPhone || phone);
      const passwordHash = await bcrypt.hash(rawPassword, 10);

      // Ensure username uniqueness
      const existingUser = await prisma.user.findUnique({ where: { username } });
      const finalUsername = existingUser ? `${username}_${Math.floor(100 + Math.random() * 900)}` : username;

      manager = await prisma.user.create({
        data: {
          name: managerName.trim(),
          username: finalUsername,
          passwordHash,
          phone: managerPhone?.trim() || phone?.trim() || null,
          role: 'manager',
          centerId: center.id,
        },
      });

      credentials = {
        name: manager.name,
        username: finalUsername,
        password: rawPassword,
      };
    }

    return success(res, {
      center,
      manager,
      credentials,
    }, 'O\'quv markaz va boshqaruvchi hisobi muvaffaqiyatli yaratildi', 201);
  } catch (err) {
    next(err);
  }
};

// PUT /admin/centers/:id
const updateCenter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, address, phone, isActive, settings } = req.body;

    const existing = await prisma.center.findUnique({ where: { id } });
    if (!existing) return error(res, 'O\'quv markaz topilmadi', 404);

    const updated = await prisma.center.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
        ...(settings !== undefined && { settings }),
      },
    });

    return success(res, updated, 'O\'quv markaz yangilandi');
  } catch (err) {
    next(err);
  }
};

// DELETE /admin/centers/:id
const deleteCenter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.center.findUnique({ where: { id } });
    if (!existing) return error(res, 'O\'quv markaz topilmadi', 404);

    await prisma.center.update({
      where: { id },
      data: { isActive: false },
    });

    return success(res, null, 'O\'quv markaz o\'chirildi (nofaol qilindi)');
  } catch (err) {
    next(err);
  }
};

// GET /admin/centers/:id
const getCenterDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const center = await prisma.center.findUnique({
      where: { id },
      include: {
        branches: {
          where: { isActive: true },
          include: {
            manager: { select: { id: true, name: true, phone: true } },
            _count: { select: { groups: true, teachers: true } },
          },
        },
        users: {
          where: { role: 'manager', isActive: true },
          select: { id: true, name: true, username: true, phone: true, createdAt: true },
        },
        _count: {
          select: {
            users: true,
            groups: true,
            branches: true,
            leads: true,
            payments: true,
          },
        },
      },
    });

    if (!center) return error(res, 'O\'quv markaz topilmadi', 404);

    const [studentsCount, teachersCount] = await Promise.all([
      prisma.user.count({ where: { role: 'student', centerId: id, isActive: true } }),
      prisma.user.count({ where: { role: 'teacher', centerId: id, isActive: true } }),
    ]);

    return success(res, {
      ...center,
      studentsCount,
      teachersCount,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCenters,
  getCenterDetail,
  createCenter,
  updateCenter,
  deleteCenter,
};

