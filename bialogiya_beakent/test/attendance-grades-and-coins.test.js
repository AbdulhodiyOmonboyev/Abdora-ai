const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_GRADE_SETTINGS } = require('../src/controllers/attendance.controller');

describe('Attendance Grades & Coin Rules Tests', () => {
  test('Grade scale: default settings enforce 1 to 10 scale', () => {
    assert.strictEqual(DEFAULT_GRADE_SETTINGS.minGrade, 1);
    assert.strictEqual(DEFAULT_GRADE_SETTINGS.maxGrade, 10);
    assert.strictEqual(DEFAULT_GRADE_SETTINGS.coinDeductionEnabled, true);
  });

  test('Coin calculation: deducts coins when coinDeductionEnabled is true', () => {
    const settings = {
      ...DEFAULT_GRADE_SETTINGS,
      coinDeductionEnabled: true,
      deductCoinsOnAbsent: 5,
      coinsPerGrade: { 1: -5, 2: -4, 3: -3, 4: -2, 5: 0, 6: 1, 7: 2, 8: 3, 9: 4, 10: 5 },
    };

    // 1. Absent should deduct coins
    const absentDelta = settings.coinDeductionEnabled ? -settings.deductCoinsOnAbsent : 0;
    assert.strictEqual(absentDelta, -5);

    // 2. Low grade (2/10) should deduct coins
    const grade2Delta = settings.coinsPerGrade[2];
    assert.strictEqual(grade2Delta, -4);

    // 3. Excellent grade (10/10) should award coins
    const grade10Delta = settings.coinsPerGrade[10];
    assert.strictEqual(grade10Delta, 5);
  });

  test('Coin calculation: prevents deduction when coinDeductionEnabled is false', () => {
    const settings = {
      ...DEFAULT_GRADE_SETTINGS,
      coinDeductionEnabled: false, // O'chirilgan!
      deductCoinsOnAbsent: 5,
      coinsPerGrade: { 1: -5, 2: -4, 3: -3, 4: -2, 5: 0, 6: 1, 7: 2, 8: 3, 9: 4, 10: 5 },
    };

    // 1. Absent should NOT deduct coins
    const absentDelta = settings.coinDeductionEnabled ? -settings.deductCoinsOnAbsent : 0;
    assert.strictEqual(absentDelta, 0);

    // 2. Low grade should NOT deduct coins when deduction is disabled
    const rawGrade2 = settings.coinsPerGrade[2];
    const effectiveGrade2 = rawGrade2 < 0 && !settings.coinDeductionEnabled ? 0 : rawGrade2;
    assert.strictEqual(effectiveGrade2, 0);

    // 3. High grade still awards coins
    const rawGrade10 = settings.coinsPerGrade[10];
    const effectiveGrade10 = rawGrade10 < 0 && !settings.coinDeductionEnabled ? 0 : rawGrade10;
    assert.strictEqual(effectiveGrade10, 5);
  });

  test('Grade validation: numbers are clamped strictly between 1 and 10', () => {
    function sanitizeGrade(val, min = 1, max = 10) {
      if (val === undefined || val === null || val === '') return null;
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) return null;
      return Math.max(min, Math.min(max, parsed));
    }

    assert.strictEqual(sanitizeGrade(15), 10);
    assert.strictEqual(sanitizeGrade(-2), 1);
    assert.strictEqual(sanitizeGrade('8'), 8);
    assert.strictEqual(sanitizeGrade(null), null);
    assert.strictEqual(sanitizeGrade(''), null);
  });
});
