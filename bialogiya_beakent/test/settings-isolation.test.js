const test = require('node:test');
const assert = require('node:assert/strict');

// Mock settings test
test('Settings isolation: role-scoped namespaces prevent cross-account overwriting', () => {
  // Initial state of center.settings in database
  let centerSettings = {
    centerName: 'Bosh Markaz',
    centerPhone: '+998901234567',
    receptionPermissions: {
      canViewFinance: false,
      canViewCashbox: false,
    },
    adminPrefs: {
      theme: 'indigo',
      maxStudentsPerGroup: 20,
      currency: 'UZS',
    },
    managerPrefs: {
      theme: 'emerald',
      maxStudentsPerGroup: 15,
      lessonDurationMinutes: 80,
    },
    receptionPrefs: {
      receiptFormat: '80mm',
      autoPrintReceipt: true,
    },
  };

  // Helper function simulating updateSettings logic
  function applyUpdate(role, newSettings) {
    const rolePrefsKey = role === 'reception' ? 'receptionPrefs'
                       : role === 'manager'   ? 'managerPrefs'
                       :                         'adminPrefs';

    const sharedFieldMap = {
      centerName: 'name', centerAddress: 'address', centerPhone: 'phone',
      centerEmail: 'email', centerWebsite: 'website',
    };
    const roleSpecificData = {};
    const sharedSettingsUpdate = {};

    for (const [key, value] of Object.entries(newSettings)) {
      if (key === 'receptionPermissions' && typeof value === 'object') {
        if (role === 'reception') continue;
        sharedSettingsUpdate.receptionPermissions = {
          ...(centerSettings.receptionPermissions || {}),
          ...value,
        };
      } else if (sharedFieldMap[key] !== undefined) {
        if (key === 'centerName' && role !== 'admin') continue;
        sharedSettingsUpdate[key] = value;
      } else {
        roleSpecificData[key] = value;
      }
    }

    if (role === 'reception') {
      const allowedReceptionKeys = [
        'receiptFormat', 'receiptNote', 'autoPrintReceipt', 'copyReceiptNumber',
        'showStaffOnReceipt', 'defaultPaymentMethod', 'timetableDefaultView',
        'soundNotifications', 'leadSoundAlert', 'paymentSoundAlert',
        'lessonReminderMinutes', 'receptionLanguage', 'theme', 'appearance',
      ];
      const filtered = {};
      for (const k of allowedReceptionKeys) {
        if (roleSpecificData[k] !== undefined) filtered[k] = roleSpecificData[k];
      }
      Object.keys(roleSpecificData).forEach(k => delete roleSpecificData[k]);
      Object.assign(roleSpecificData, filtered);
    }

    if (role === 'manager') {
      delete roleSpecificData.openaiApiKey;
      delete roleSpecificData.geminiApiKey;
      delete roleSpecificData.anthropicApiKey;
    }

    centerSettings = {
      ...centerSettings,
      ...sharedSettingsUpdate,
      [rolePrefsKey]: {
        ...(centerSettings[rolePrefsKey] || {}),
        ...roleSpecificData,
      },
    };
  }

  // Helper function simulating getSettings logic
  function getRoleSettings(role) {
    const shared = {
      centerName: centerSettings.centerName || 'Bosh Markaz',
      centerPhone: centerSettings.centerPhone || '',
      receptionPermissions: centerSettings.receptionPermissions || {},
    };

    const rolePrefsKey = role === 'reception' ? 'receptionPrefs'
                       : role === 'manager'   ? 'managerPrefs'
                       :                         'adminPrefs';
    const rolePrefs = centerSettings[rolePrefsKey] || {};

    return {
      ...shared,
      ...rolePrefs,
    };
  }

  // 1. Admin modifies settings (e.g. changes theme to 'rose', maxStudents to 25)
  applyUpdate('admin', {
    theme: 'rose',
    maxStudentsPerGroup: 25,
    customAdminSetting: 'admin_value_123',
  });

  // Verify Admin's settings changed
  const adminSettings = getRoleSettings('admin');
  assert.equal(adminSettings.theme, 'rose');
  assert.equal(adminSettings.maxStudentsPerGroup, 25);
  assert.equal(adminSettings.customAdminSetting, 'admin_value_123');

  // Verify Manager's settings DID NOT change and remained 'emerald' and 15
  const managerSettings = getRoleSettings('manager');
  assert.equal(managerSettings.theme, 'emerald', "Manager theme must NOT be overwritten by admin's theme");
  assert.equal(managerSettings.maxStudentsPerGroup, 15, "Manager group size must NOT be overwritten by admin");
  assert.equal(managerSettings.customAdminSetting, undefined, "Manager must not receive admin-only custom settings");

  // 2. Manager modifies settings (e.g. changes theme to 'sky', lessonDuration to 90)
  applyUpdate('manager', {
    theme: 'sky',
    lessonDurationMinutes: 90,
  });

  // Verify Manager's settings changed
  const updatedManagerSettings = getRoleSettings('manager');
  assert.equal(updatedManagerSettings.theme, 'sky');
  assert.equal(updatedManagerSettings.lessonDurationMinutes, 90);

  // Verify Admin's settings were NOT changed by Manager
  const recheckedAdminSettings = getRoleSettings('admin');
  assert.equal(recheckedAdminSettings.theme, 'rose', "Admin theme must NOT be overwritten by manager");
  assert.equal(recheckedAdminSettings.maxStudentsPerGroup, 25);

  // 3. Receptionist attempts to change receptionPermissions or AI keys
  applyUpdate('reception', {
    receiptFormat: '58mm',
    receptionPermissions: { canViewFinance: true }, // should be ignored!
    openaiApiKey: 'hacked_key', // should be ignored!
  });

  const receptionSettings = getRoleSettings('reception');
  assert.equal(receptionSettings.receiptFormat, '58mm');
  assert.equal(receptionSettings.receptionPermissions.canViewFinance, false, "Reception cannot grant itself finance permissions");
  assert.equal(receptionSettings.openaiApiKey, undefined);

  // 4. Shared center info updates are shared
  applyUpdate('admin', {
    centerPhone: '+998998887766',
  });
  assert.equal(getRoleSettings('admin').centerPhone, '+998998887766');
  assert.equal(getRoleSettings('manager').centerPhone, '+998998887766');
  assert.equal(getRoleSettings('reception').centerPhone, '+998998887766');
});
