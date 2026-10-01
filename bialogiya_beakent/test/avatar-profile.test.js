const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const userController = require('../src/controllers/user.controller');

describe('User Avatar & Profile Tests', () => {
  test('uploadAvatar and getAvatar functions are properly exported', () => {
    assert.strictEqual(typeof userController.uploadAvatar, 'function');
    assert.strictEqual(typeof userController.getAvatar, 'function');
    assert.strictEqual(typeof userController.updateProfile, 'function');
  });

  test('uploadAvatar rejects request without file', async () => {
    let statusCode = null;
    let responseBody = null;

    const req = {
      user: { userId: 'student_123', centerId: 'center_1' },
      file: null,
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseBody = data;
        return this;
      },
    };

    await userController.uploadAvatar(req, res, () => {});
    assert.strictEqual(statusCode, 400);
    assert.strictEqual(responseBody?.success, false);
    assert.match(responseBody?.message, /fayli yuklanmadi/i);
  });
});
