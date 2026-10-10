const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');

/**
 * Get custom roles for a center
 */
const getCustomRoles = async (req, res) => {
  try {
    const centerId = req.query.centerId || req.user.centerId;
    if (!centerId) return error(res, 'Markaz ID topilmadi', 400);

    const roles = await prisma.customRole.findMany({
      where: { centerId },
      include: {
        _count: { select: { users: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    return success(res, roles);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Create a new custom role for center
 */
const createCustomRole = async (req, res) => {
  try {
    const centerId = req.body.centerId || req.user.centerId;
    const { name, baseRole = 'reception', permissions = {} } = req.body;

    if (!centerId || !name) {
      return error(res, 'Markaz ID va rol nomi majburiy', 400);
    }

    const customRole = await prisma.customRole.create({
      data: {
        name,
        baseRole,
        permissions,
        centerId
      }
    });

    return success(res, customRole, 'Yangi maxsus rol muvaffaqiyatli yaratildi', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Update custom role
 */
const updateCustomRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, baseRole, permissions, isActive } = req.body;

    const role = await prisma.customRole.findUnique({ where: { id } });
    if (!role) return error(res, 'Rol topilmadi', 404);

    if (req.user.role !== 'admin' && req.user.centerId !== role.centerId) {
      return error(res, 'Ruxsat berilmagan', 403);
    }

    const updated = await prisma.customRole.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(baseRole && { baseRole }),
        ...(permissions !== undefined && { permissions }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return success(res, updated, 'Rol muvaffaqiyatli yangilandi');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Delete custom role
 */
const deleteCustomRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await prisma.customRole.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } }
    });

    if (!role) return error(res, 'Rol topilmadi', 404);

    if (req.user.role !== 'admin' && req.user.centerId !== role.centerId) {
      return error(res, 'Ruxsat berilmagan', 403);
    }

    if (role._count.users > 0) {
      return error(res, `Ushbu rolga ${role._count.users} ta foydalanuvchi biriktirilgan. Avval ularning rolini o'zgartiring.`, 400);
    }

    await prisma.customRole.delete({ where: { id } });
    return success(res, null, "Maxsus rol o'chirildi");
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Assign custom role to user
 */
const assignUserCustomRole = async (req, res) => {
  try {
    const { userId, customRoleId } = req.body;
    if (!userId) return error(res, 'userId majburiy', 400);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { customRoleId: customRoleId || null }
    });

    return success(res, user, "Foydalanuvchiga maxsus rol biriktirildi");
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = {
  getCustomRoles,
  createCustomRole,
  updateCustomRole,
  deleteCustomRole,
  assignUserCustomRole
};
