const { prisma } = require('../config/db');

const getCenterId = (req) => {
  if (req.user?.role === 'admin') return null;
  if (!req.user?.centerId) throw new Error('Center context missing');
  return req.user.centerId;
};

const centerWhere = (req) => {
  const centerId = getCenterId(req);
  return centerId ? { centerId } : {};
};

const assertUserCenter = async (userId, reqUser) => {
  const target = await prisma.user.findFirst({ where: { id: userId }, select: { id: true, centerId: true } });
  if (!target) return { error: 'User not found', status: 404 };
  if (reqUser.role !== 'admin' && target.centerId !== reqUser.centerId) return { error: 'Forbidden', status: 403 };
  return { target };
};

module.exports = { getCenterId, centerWhere, assertUserCenter };