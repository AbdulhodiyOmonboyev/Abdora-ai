const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const antiSleepService = require('../src/services/antiSleep.service');

describe('Anti-Sleep Daemon Service Tests', () => {
  let mockServer;
  let mockPort;
  let receivedPings = 0;

  beforeEach(async () => {
    receivedPings = 0;
    antiSleepService.stop();

    // Mock HTTP server yaratish (self-ping so'rovlarini qabul qilish uchun)
    mockServer = http.createServer((req, res) => {
      if (req.url === '/api/health') {
        receivedPings++;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', service: 'Test Mock' }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    await new Promise((resolve) => {
      mockServer.listen(0, '127.0.0.1', () => {
        mockPort = mockServer.address().port;
        resolve();
      });
    });
  });

  afterEach(async () => {
    antiSleepService.stop();
    if (mockServer) {
      await new Promise((resolve) => mockServer.close(resolve));
    }
  });

  test('Target URLs: resolves external URL when provided and includes local fallback', () => {
    const urls = antiSleepService.resolveTargetUrls('https://abdora-ai.onrender.com', 5000);
    assert.ok(urls.includes('https://abdora-ai.onrender.com/api/health'));
    assert.ok(urls.includes('http://127.0.0.1:5000/api/health'));
    assert.strictEqual(urls.length, 2);
  });

  test('Interval: defaults to exactly 2 minutes (120,000 ms)', () => {
    antiSleepService.start({ port: mockPort, startupDelayMs: 0 });
    const status = antiSleepService.getStatus();

    assert.strictEqual(status.isRunning, true);
    assert.strictEqual(status.intervalMs, 120000);
    assert.strictEqual(status.intervalMinutes, 2);
  });

  test('Self-Ping Execution: successfully pings /api/health and updates metrics', async () => {
    antiSleepService.targetUrls = [`http://127.0.0.1:${mockPort}/api/health`];
    antiSleepService.isRunning = true;

    const result = await antiSleepService.pingNow();

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.statusCode, 200);
    assert.strictEqual(typeof result.durationMs, 'number');
    assert.strictEqual(receivedPings, 1);

    const status = antiSleepService.getStatus();
    assert.strictEqual(status.lastPingStatus, 'success');
    assert.strictEqual(status.lastPingStatusCode, 200);
    assert.strictEqual(status.successfulPings >= 1, true);
    assert.ok(status.recentLogs.length > 0);
  });

  test('Stop method: cleanly shuts down daemon and clears timers', () => {
    antiSleepService.start({ port: mockPort, startupDelayMs: 0 });
    assert.strictEqual(antiSleepService.isRunning, true);

    const stopStatus = antiSleepService.stop();
    assert.strictEqual(stopStatus.isRunning, false);
    assert.strictEqual(antiSleepService.timer, null);
    assert.strictEqual(antiSleepService.startupTimer, null);
  });

  test('Router Module: loads correctly and defines status and ping endpoints', () => {
    const router = require('../src/routes/antiSleep.routes');
    assert.ok(router);
    assert.strictEqual(typeof router, 'function'); // Express Router is a callable middleware
  });
});
