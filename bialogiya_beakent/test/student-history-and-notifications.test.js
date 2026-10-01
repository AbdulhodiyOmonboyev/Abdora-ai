const test = require('node:test');
const assert = require('node:assert/strict');
const userController = require('../src/controllers/user.controller');

test('User Controller - Referral logic & History Exports', async (t) => {
  await t.test('controller exports getStudentHistory, getReferralStats and applyReferralCode', () => {
    assert.equal(typeof userController.getStudentHistory, 'function');
    assert.equal(typeof userController.getReferralStats, 'function');
    assert.equal(typeof userController.applyReferralCode, 'function');
  });

  await t.test('applyReferralCode validates missing code parameter', async () => {
    let statusCode = 0;
    let responseData = null;
    const req = {
      user: { id: 'user-1', centerId: 'center-1' },
      body: {}
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      }
    };

    await userController.applyReferralCode(req, res);
    assert.equal(statusCode, 400);
    assert.equal(responseData.success, false);
    assert.ok(responseData.message);
  });
});
