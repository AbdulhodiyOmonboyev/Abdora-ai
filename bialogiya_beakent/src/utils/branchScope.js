const { prisma } = require('../config/db');

// Returns null for admin (no restriction - sees everything), or an array of
// branch IDs owned by this reception account (possibly empty) otherwise.
// Used everywhere a reception-scoped endpoint needs to check "is this
// teacher/student/group inside one of MY branches".
const getOwnBranchIds = async (user) => {
  if (user.role === 'admin') return null;

  let branchIds = [];

  if (user.role === 'reception') {
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { branchId: true } });
    const userBranchId = dbUser?.branchId || user.branchId;

    const branches = await prisma.branch.findMany({
      where: {
        centerId: user.centerId,
        OR: [
          { receptionId: user.userId },
          ...(userBranchId ? [{ id: userBranchId }] : []),
        ]
      },
      select: { id: true }
    });
    branchIds = branches.map(b => b.id);
  } else if (user.role === 'manager') {
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { branchId: true } });
    const userBranchId = dbUser?.branchId || user.branchId;

    const branches = await prisma.branch.findMany({
      where: {
        centerId: user.centerId,
        OR: [
          { managerId: user.userId },
          ...(userBranchId ? [{ id: userBranchId }] : []),
        ]
      },
      select: { id: true }
    });
    branchIds = branches.map(b => b.id);

    // If manager has no specific branch assignment, manager manages all branches of their center!
    if (branchIds.length === 0 && user.centerId) {
      const allBranches = await prisma.branch.findMany({
        where: { centerId: user.centerId, isActive: true },
        select: { id: true }
      });
      branchIds = allBranches.map(b => b.id);
    }
  }

  // Never fall back to every branch in the business. A manager/reception account
  // must only see their own assigned branch scope; otherwise finance dashboards
  // mix data from unrelated centres.
  return branchIds.length > 0 ? branchIds : [];
};

const assertGroupAccess = async (groupId, user, prisma) => {
  const group = await prisma.group.findFirst({
    where: { id: groupId, ...(user.role !== 'admin' ? { centerId: user.centerId } : {}) },
    select: { id: true, branchId: true, teacherId: true, centerId: true },
  });
  if (!group) return { error: 'Group not found', status: 404 };
  if (user.role === 'admin') return { group };
  if (user.role === 'teacher') {
    if (group.teacherId !== user.userId) return { error: 'Forbidden', status: 403 };
    return { group };
  }
  if (user.role === 'student') {
    const student = await prisma.user.findUnique({ where: { id: user.userId }, select: { groupId: true } });
    if (student?.groupId !== group.id) return { error: 'Forbidden', status: 403 };
    return { group };
  }
  if (user.role === 'manager' && group.centerId === user.centerId) {
    const ownBranchIds = await getOwnBranchIds(user);
    if (!group.branchId || ownBranchIds?.includes(group.branchId) || ownBranchIds.length === 0) {
      return { group };
    }
  }
  const ownBranchIds = await getOwnBranchIds(user);
  if (!ownBranchIds?.includes(group.branchId)) return { error: 'Forbidden', status: 403 };
  return { group };
};

module.exports = { getOwnBranchIds, assertGroupAccess };
