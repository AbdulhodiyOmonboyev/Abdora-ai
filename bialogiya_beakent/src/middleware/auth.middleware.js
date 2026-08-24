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
    req.user = { ...decoded, role: user.role, centerId: user.centerId, branchId: user.branchId };
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

module.exports = { verifyToken, requireRole };
