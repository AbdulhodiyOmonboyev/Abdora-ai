const test = require('node:test');
const assert = require('node:assert/strict');
const { assertGroupAccess } = require('../src/utils/branchScope');

const groups = [
  { id: 'group-a', centerId: 'center-a', branchId: 'branch-a', teacherId: 'teacher-a' },
  { id: 'group-b', centerId: 'center-b', branchId: 'branch-b', teacherId: 'teacher-b' },
];

const prisma = {
  group: {
    findFirst: async ({ where }) => groups.find(group => group.id === where.id && (!where.centerId || group.centerId === where.centerId)) || null,
  },
  user: {
    findUnique: async ({ where }) => ({ groupId: where.id === 'student-a' ? 'group-a' : null }),
  },
};

test('rejects a cross-center group for a teacher', async () => {
  const result = await assertGroupAccess('group-b', {
    userId: 'teacher-a',
    role: 'teacher',
    centerId: 'center-a',
  }, prisma);

  assert.deepEqual(result, { error: 'Group not found', status: 404 });
});

test('allows a teacher to access their group in their center', async () => {
  const result = await assertGroupAccess('group-a', {
    userId: 'teacher-a',
    role: 'teacher',
    centerId: 'center-a',
  }, prisma);

  assert.equal(result.group.id, 'group-a');
});

test('rejects a student from another group even in the same center', async () => {
  const result = await assertGroupAccess('group-b', {
    userId: 'student-a',
    role: 'student',
    centerId: 'center-b',
  }, prisma);

  assert.deepEqual(result, { error: 'Forbidden', status: 403 });
});
