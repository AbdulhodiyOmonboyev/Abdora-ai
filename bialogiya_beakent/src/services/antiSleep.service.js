/**
 * Anti-Sleep Daemon Service
 * 
 * Ushbu xizmat serverning (ayniqsa Render, Railway kabi bulut platformalarida)
 * faolsizlik sababli uxlab qolishining (spin down / cold start) oldini olish uchun
 * har 2 minutda serverning o'ziga o'zi avtomatik so'rov (self-ping) yuboradi.
 */

class AntiSleepService {
  constructor() {
    this.timer = null;
    this.startupTimer = null;
    this.isRunning = false;
    this.intervalMs = 2 * 60 * 1000; // Standart: har 2 minut (120,000 ms)
    this.startedAt = null;
    this.totalPings = 0;
    this.successfulPings = 0;
    this.failedPings = 0;
    this.lastPingTime = null;
    this.lastPingStatus = null;
    this.lastPingDurationMs = null;
    this.lastPingStatusCode = null;
    this.targetUrls = [];
    this.recentLogs = [];
  }

  /**
   * Ping qilinishi kerak bo'lgan URL'larni aniqlash
   */
  resolveTargetUrls(customUrl, port) {
    const serverPort = port || process.env.PORT || 5000;
    const urls = [];

    // 1. Tashqi platforma URL'lari (Render, Railway, yoki maxsus domen)
    const externalUrl =
      customUrl ||
      process.env.SERVER_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      process.env.BACKEND_URL ||
      process.env.APP_URL ||
      (process.env.NODE_ENV === 'production' ? 'https://abdora-ai-backend.onrender.com' : null);

    if (externalUrl && typeof externalUrl === 'string') {
      const cleanExternal = externalUrl.trim().replace(/\/$/, '');
      urls.push(`${cleanExternal}/api/health`);
    }

    // 2. Lokal ichki manzil (Har doim zaxira sifatida mavjud bo'ladi)
    urls.push(`http://127.0.0.1:${serverPort}/api/health`);

    // Dublikatlarni olib tashlash
    return [...new Set(urls)];
  }

  /**
   * Anti-sleep mexanizmini ishga tushirish
   * @param {Object} options - { intervalMs, targetUrl, port, startupDelayMs }
   */
  start(options = {}) {
    if (this.isRunning) {
      return this.getStatus();
    }

    // Konfiguratsiyani o'qish
    const envInterval = process.env.ANTI_SLEEP_INTERVAL_MS
      ? parseInt(process.env.ANTI_SLEEP_INTERVAL_MS, 10)
      : null;

    this.intervalMs = options.intervalMs || envInterval || (2 * 60 * 1000); // 2 minut
    this.targetUrls = this.resolveTargetUrls(options.targetUrl, options.port);
    this.isRunning = true;
    this.startedAt = new Date().toISOString();

    const intervalMinutes = (this.intervalMs / (60 * 1000)).toFixed(1);
    console.log(`[AntiSleep] Xizmat ishga tushirildi! Har ${intervalMinutes} minutda o'ziga so'rov yuboradi.`);
    console.log(`[AntiSleep] Maqsadli manzillar: ${this.targetUrls.join(', ')}`);

    // Dastlabki tezkor ping (Server to'liq ko'tarilishi uchun 8 soniya kutiladi)
    const startupDelay = options.startupDelayMs !== undefined ? options.startupDelayMs : 8000;
    if (startupDelay > 0) {
      this.startupTimer = setTimeout(() => {
        this.pingNow().catch(() => {});
      }, startupDelay);
    }

    // Doimiy interval taymeri (Har 2 minutda)
    this.timer = setInterval(() => {
      this.pingNow().catch(() => {});
    }, this.intervalMs);

    // Node jarayoni taymer tufayli osilib qolmasligi uchun unref qilish
    if (this.timer.unref) {
      this.timer.unref();
    }

    return this.getStatus();
  }

  /**
   * Anti-sleep taymerini to'xtatish
   */
  stop() {
    if (this.startupTimer) {
      clearTimeout(this.startupTimer);
      this.startupTimer = null;
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('[AntiSleep] Xizmat to\'xtatildi.');
    return this.getStatus();
  }

  /**
   * Bir martalik tezkor self-ping so'rovini amalga oshirish
   */
  async pingNow() {
    const startTime = Date.now();
    this.totalPings++;
    const primaryUrl = this.targetUrls[0] || `http://127.0.0.1:${process.env.PORT || 5000}/api/health`;

    let success = false;
    let statusCode = null;
    let errorMsg = null;
    let successfulUrl = primaryUrl;

    // Navbat bilan manzillarni tekshirish (agar tashqi URL bo'lsa, avval uni, bo'lmasa lokalni)
    for (const url of this.targetUrls) {
      try {
        const response = await this._sendRequest(url);
        if (response.ok || response.status < 500) {
          success = true;
          statusCode = response.status;
          successfulUrl = url;
          break;
        } else {
          statusCode = response.status;
          errorMsg = `HTTP ${response.status}`;
        }
      } catch (err) {
        errorMsg = err.message || 'Ulanish xatosi';
      }
    }

    const durationMs = Date.now() - startTime;
    this.lastPingTime = new Date().toISOString();
    this.lastPingDurationMs = durationMs;
    this.lastPingStatusCode = statusCode;

    if (success) {
      this.successfulPings++;
      this.lastPingStatus = 'success';
      console.log(
        `[AntiSleep] Self-ping muvaffaqiyatli (${statusCode} OK, ${durationMs}ms) -> ${successfulUrl} [Jami: ${this.totalPings}]`
      );
    } else {
      this.failedPings++;
      this.lastPingStatus = 'failed';
      console.warn(
        `[AntiSleep] Self-ping ogohlantirish: ${errorMsg} (${durationMs}ms) -> ${successfulUrl}`
      );
    }

    // So'nggi 15 ta logni saqlash
    this.recentLogs.unshift({
      timestamp: this.lastPingTime,
      url: successfulUrl,
      statusCode,
      durationMs,
      success,
      error: errorMsg,
    });

    if (this.recentLogs.length > 15) {
      this.recentLogs.pop();
    }

    return {
      success,
      statusCode,
      durationMs,
      url: successfulUrl,
      error: errorMsg,
    };
  }

  /**
   * Ichki HTTP/HTTPS so'rov jo'natish
   */
  async _sendRequest(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12 soniya timeout

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Abdora-AntiSleep-Daemon/1.0',
          'X-Anti-Sleep-Probe': 'true',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res;
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  /**
   * Joriy holat va metrikalarni olish
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs,
      intervalMinutes: +(this.intervalMs / (60 * 1000)).toFixed(2),
      targetUrls: this.targetUrls,
      startedAt: this.startedAt,
      totalPings: this.totalPings,
      successfulPings: this.successfulPings,
      failedPings: this.failedPings,
      lastPingTime: this.lastPingTime,
      lastPingStatus: this.lastPingStatus,
      lastPingDurationMs: this.lastPingDurationMs,
      lastPingStatusCode: this.lastPingStatusCode,
      recentLogs: this.recentLogs.slice(0, 5),
    };
  }
}

// Yagona singleton instansiya
const antiSleepService = new AntiSleepService();

module.exports = antiSleepService;
