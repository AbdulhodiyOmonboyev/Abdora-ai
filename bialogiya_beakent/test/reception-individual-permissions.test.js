const test = require('node:test');
const assert = require('node:assert/strict');

test('Reception individual permissions & blocking evaluation', () => {
  const centerSettings = {
    receptionPermissions: {
      canViewFinance: false,
      canViewCashbox: false,
      canManagePayments: true,
      canManageLeads: true,
      canManageTimetable: true,
      canManageGroups: true,
      canManageStudents: true,
      canManageTeachers: true,
    }
  };

  // Simulating the permission checker in auth.middleware.js
  function checkPermission(user, permissionKey) {
    if (!user || user.isActive === false || user.isFrozen === true) {
      return { allowed: false, reason: 'blocked' };
    }

    const centerPerms = centerSettings.receptionPermissions || {};
    const userOverrides = user.permissions || {};
    const perms = { ...centerPerms, ...userOverrides };

    if (permissionKey === 'canViewFinance' && perms.canViewFinance !== true) {
      return { allowed: false, reason: 'finance_restricted' };
    }
    if (permissionKey === 'canViewCashbox' && perms.canViewCashbox !== true) {
      return { allowed: false, reason: 'cashbox_restricted' };
    }
    if (perms[permissionKey] === false) {
      return { allowed: false, reason: 'action_restricted' };
    }
    return { allowed: true };
  }

  // 1. Receptionist with standard center defaults (Finance blocked)
  const standardUser = {
    id: 'rec-1',
    role: 'reception',
    isActive: true,
    isFrozen: false,
    permissions: {},
  };
  assert.equal(checkPermission(standardUser, 'canViewFinance').allowed, false);
  assert.equal(checkPermission(standardUser, 'canManagePayments').allowed, true);

  // 2. Receptionist with individual permission granted for finance
  const privilegedUser = {
    id: 'rec-2',
    role: 'reception',
    isActive: true,
    isFrozen: false,
    permissions: { canViewFinance: true, canViewCashbox: true },
  };
  assert.equal(checkPermission(privilegedUser, 'canViewFinance').allowed, true);
  assert.equal(checkPermission(privilegedUser, 'canViewCashbox').allowed, true);

  // 3. Receptionist with individual restriction (e.g. leads blocked)
  const restrictedUser = {
    id: 'rec-3',
    role: 'reception',
    isActive: true,
    isFrozen: false,
    permissions: { canManageLeads: false },
  };
  assert.equal(checkPermission(restrictedUser, 'canManageLeads').allowed, false);
  assert.equal(checkPermission(restrictedUser, 'canManageStudents').allowed, true);

  // 4. Frozen or deactivated receptionist account
  const frozenUser = {
    id: 'rec-4',
    role: 'reception',
    isActive: true,
    isFrozen: true,
    permissions: { canViewFinance: true },
  };
  assert.equal(checkPermission(frozenUser, 'canViewFinance').allowed, false);
  assert.equal(checkPermission(frozenUser, 'canViewFinance').reason, 'blocked');
  assert.equal(checkPermission(frozenUser, 'canManagePayments').allowed, false);
});
