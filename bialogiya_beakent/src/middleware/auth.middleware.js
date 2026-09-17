const { verifyAccessToken } = require('../utils/tokenService');
const { error } = require('../utils/apiResponse');
const { prisma } = require('../config/db');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'No token provided', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, centerId: true, branchId: true, isActive: true, isFrozen: true },
    });
    if (!user || !user.isActive) return error(res, 'Account is inactive', 403);
    if (user.isFrozen && user.role === 'student') return error(res, 'Hisobingiz muzlatilgan', 403);
    req.user = { ...decoded, id: user.id, userId: user.id, role: user.role, centerId: user.centerId, branchId: user.branchId };
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token', 401);
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return error(res, 'Unauthorized', 401);
    if (!roles.includes(req.user.role)) {
      return error(res, 'Forbidden: insufficient permissions', 403);
    }
    next();
  };
};

const requireReceptionPermission = (permissionKey) => {
  return async (req, res, next) => {
    if (!req.user) return error(res, 'Unauthorized', 401);
    // admin and manager always have full permissions
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      return next();
    }

    if (req.user.role === 'reception') {
      try {
        let centerId = req.user.centerId;
        if (!centerId) {
          const u = await prisma.user.findUnique({
            where: { id: req.user.userId || req.user.id },
            select: { centerId: true, branchId: true }
          });
          centerId = u?.centerId;
          if (!centerId && u?.branchId) {
            const b = await prisma.branch.findUnique({ where: { id: u.branchId }, select: { centerId: true } });
            centerId = b?.centerId;
          }
          if (!centerId) {
            const rb = await prisma.branch.findFirst({ where: { receptionId: req.user.userId || req.user.id }, select: { centerId: true } });
            centerId = rb?.centerId;
          }
        }

        let perms = {};
        if (centerId) {
          const center = await prisma.center.findUnique({ where: { id: centerId }, select: { settings: true } });
          const settings = (center?.settings && typeof center.settings === 'object') ? center.settings : {};
          perms = settings.receptionPermissions || {};
        }

        // Sensitive financial sections (Finance and Cashbox) require explicit permission (default false)
        if (permissionKey === 'canViewFinance' && perms.canViewFinance !== true) {
          return error(res, "Qabulxona uchun moliya bo'limiga kirish ruxsati berilmagan", 403);
        }
        if (permissionKey === 'canViewCashbox' && perms.canViewCashbox !== true) {
          return error(res, "Qabulxona uchun kassa bo'limiga kirish ruxsati berilmagan", 403);
        }

        // Other operational sections default to true unless explicitly disabled (false)
        if (perms[permissionKey] === false) {
          return error(res, `Qabulxona uchun ushbu amalga ruxsat cheklangan`, 403);
        }
      } catch (err) {
        console.error('requireReceptionPermission error:', err);
      }
    }

    next();
  };
};

module.exports = { verifyToken, requireRole, requireReceptionPermission };
