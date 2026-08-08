const { prisma } = require('../config/db');

// Returns null for admin (no restriction - sees everything), or an array of
// branch IDs owned by this reception account (possibly empty) otherwise.
// Used everywhere a reception-scoped endpoint needs to check "is this
// teacher/student/group inside one of MY branches".
const getOwnBranchIds = async (user) => {
  if (user.role === 'admin') return null;

  const where = user.role === 'reception'
    ? { receptionId: user.userId }
    : user.role === 'manager'
      ? { managerId: user.userId }
      : null;

  if (!where) return null;

  const branches = await prisma.branch.findMany({ where, select: { id: true } });
  return branches.map(b => b.id);
};

module.exports = { getOwnBranchIds };
