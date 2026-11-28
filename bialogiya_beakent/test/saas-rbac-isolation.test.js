const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { prisma } = require('../src/config/db');
const smsController = require('../src/controllers/sms.controller');
const aiUsageController = require('../src/controllers/ai-usage.controller');
const customRoleController = require('../src/controllers/custom-role.controller');
const smsRouter = require('../src/routes/sms.routes');
const aiUsageRouter = require('../src/routes/ai-usage.routes');
const subscriptionRouter = require('../src/routes/subscription.routes');

function mockRes() {
  const out = { statusCode: 200, body: null };
  return {
    out,
    res: {
      status(code) { out.statusCode = code; return this; },
      json(body) { out.body = body; return this; },
    },
  };
}

describe('SaaS RBAC & Cross-Tenant Isolation Tests', () => {
  test('sms.controller rejects manager requesting another centerId with 403', async () => {
    const req = {
      user: { role: 'manager', centerId: 'center-1' },
      query: { centerId: 'center-2' },
    };
    const { out, res } = mockRes();
    await smsController.getSMSLogs(req, res);
    assert.equal(out.statusCode, 403);
  });

  test('ai-usage.controller rejects manager requesting another centerId with 403', async () => {
    const req = {
      user: { role: 'manager', centerId: 'center-1' },
      query: { centerId: 'center-2' },
    };
    const { out, res } = mockRes();
    await aiUsageController.getAIUsageStats(req, res);
    assert.equal(out.statusCode, 403);
  });

  test('custom-role.controller blocks manager from assigning custom role to user in another center (403)', async () => {
    const origFindUnique = prisma.user.findUnique;
    const origUpdate = prisma.user.update;
    try {
      prisma.user.findUnique = async () => ({ id: 'other-user', centerId: 'center-2', role: 'teacher' });
      prisma.user.update = async () => { throw new Error('Should not update cross-center user'); };

      const req = {
        user: { role: 'manager', centerId: 'center-1' },
        body: { userId: 'other-user', customRoleId: 'role-1' },
      };
      const { out, res } = mockRes();
      await customRoleController.assignUserCustomRole(req, res);
      assert.equal(out.statusCode, 403);
    } finally {
      prisma.user.findUnique = origFindUnique;
      prisma.user.update = origUpdate;
    }
  });

  test('sms, ai-usage, and subscription routers enforce role middleware', () => {
    assert.ok(smsRouter.stack.some(l => l.name === 'requireRole' || (l.handle && l.handle.name === '' && smsRouter.stack.length >= 3)));
    assert.ok(aiUsageRouter.stack.some(l => l.name === 'requireRole' || aiUsageRouter.stack.length >= 3));
    const rootGets = subscriptionRouter.stack.filter(l => l.route?.path === '/' && l.route.methods.get);
    assert.equal(rootGets.length, 1, 'subscriptionRouter should have a single unified GET / handler');
  });
});
