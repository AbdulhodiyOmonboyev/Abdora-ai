require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { connectDB } = require('./src/config/db');
const { loadKeyFromDb } = require('./src/config/gemini');
const { cleanupOrphanedRecords } = require('./src/utils/cleanupOrphans');
const errorHandler = require('./src/middleware/error.middleware');
const antiSleepService = require('./src/services/antiSleep.service');

const app = express();

// Connect to PostgreSQL (Neon), initialize AI agent keys, and clean orphaned data
const { startSubscriptionCron } = require('./src/utils/cronJobs');
const { ensureDefaultPlans } = require('./src/controllers/plan.controller');

connectDB().then(() => {
  loadKeyFromDb().catch(() => {});
  cleanupOrphanedRecords().catch(() => {});
  ensureDefaultPlans().catch(() => {});
  startSubscriptionCron();
});

// Trust proxy (Render sits behind a reverse proxy)
app.set('trust proxy', 1);

// Security & utilities
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(u => u.trim().replace(/\/$/, ''))
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || origin.endsWith('.onrender.com')) {
      callback(null, true);
    } else {
      callback(new Error('CORS: origin not allowed: ' + origin));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enable gzip compression for responses
app.use(compression());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiters (Anti-sleep va health check so'rovlari chegaralanmaydi)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: "Juda ko'p so'rov yuborildi",
  skip: (req) => req.path === '/health' || req.headers['x-anti-sleep-probe'] === 'true',
});
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: "Juda ko'p urinish, birozdan so'ng qayta urinib ko'ring" });
// Public, unauthenticated form on the landing page - tighter limit than
// the general API limiter to prevent spam submissions.
const applicationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: "Juda ko'p ariza yuborildi, birozdan so'ng qayta urinib ko'ring" });
// Story audio / explainer video / realtime speaking all call paid AI/TTS APIs,
// so they get a tighter per-user-IP cap than the general API limiter.
const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, message: "Juda ko'p AI so'rovi yuborildi, birozdan so'ng qayta urinib ko'ring" });

app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/speaking', aiLimiter);
app.use('/api/voice', aiLimiter);
app.use('/api/applications', (req, res, next) => (req.method === 'POST' ? applicationLimiter(req, res, next) : next()));
app.use((req, res, next) => {
  if (req.path.includes('/ai/')) return aiLimiter(req, res, next);
  next();
});

// Routes
app.use('/api', require('./src/routes/index'));

// Health check & Anti-sleep holati
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    service: 'Abdora AI Backend',
    antiSleep: {
      active: antiSleepService.isRunning,
      intervalMinutes: 2,
      totalPings: antiSleepService.totalPings,
      lastPingTime: antiSleepService.lastPingTime,
      lastStatus: antiSleepService.lastPingStatus,
    },
  });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n[Server] Abdora AI Server running on http://localhost:${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV}`);
  console.log(`[Server] OpenAI Model: ${process.env.OPENAI_MODEL || 'gpt-4o'}\n`);

  // Anti-sleep funksiyasi: Har 2 minutda server o'ziga o'zi so'rov yuborib turadi
  antiSleepService.start({ port: PORT });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  antiSleepService.stop();
  server.close();
});

module.exports = app;
