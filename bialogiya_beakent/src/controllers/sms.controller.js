const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { sendCenterSMS } = require('../utils/smsProvider');

/**
 * Get aggregated SMS stats
 */
const getSMSStats = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const centerId = req.query.centerId || (!isAdmin ? req.user.centerId : null);
    const where = centerId ? { centerId } : {};

    const [totalLogs, sentCount, failedCount, totalCostAgg, triggers, providers] = await Promise.all([
      prisma.sMSLog.count({ where }),
      prisma.sMSLog.count({ where: { ...where, status: 'sent' } }),
      prisma.sMSLog.count({ where: { ...where, status: 'failed' } }),
      prisma.sMSLog.aggregate({ where, _sum: { cost: true } }),
      prisma.sMSLog.groupBy({
        by: ['trigger'],
        where,
        _count: { id: true },
        _sum: { cost: true }
      }),
      prisma.sMSLog.groupBy({
        by: ['provider'],
        where,
        _count: { id: true }
      })
    ]);

    return success(res, {
      total: totalLogs,
      sent: sentCount,
      failed: failedCount,
      totalCostUzs: totalCostAgg._sum.cost || 0,
      triggers: triggers.map(t => ({
        trigger: t.trigger,
        count: t._count.id,
        cost: t._sum.cost || 0
      })),
      providers: providers.map(p => ({
        provider: p.provider,
        count: p._count.id
      }))
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Get paginated SMS logs
 */
const getSMSLogs = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const centerId = req.query.centerId || (!isAdmin ? req.user.centerId : null);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const where = {};
    if (centerId) where.centerId = centerId;
    if (req.query.status) where.status = req.query.status;
    if (req.query.trigger) where.trigger = req.query.trigger;

    const [total, logs] = await Promise.all([
      prisma.sMSLog.count({ where }),
      prisma.sMSLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          center: { select: { id: true, name: true } }
        }
      })
    ]);

    return success(res, {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Send manual / custom SMS from manager/admin
 */
const sendTestOrCustomSMS = async (req, res) => {
  try {
    const centerId = req.body.centerId || req.user.centerId;
    const { toPhone, message, trigger = 'custom', recipientType = 'custom' } = req.body;

    if (!toPhone || !message) {
      return error(res, 'Telefon raqam va xabar matni majburiy', 400);
    }

    if (!centerId) {
      return error(res, 'Markaz ID ko\'rsatilmadi', 400);
    }

    const result = await sendCenterSMS({
      centerId,
      toPhone,
      message,
      trigger,
      recipientType,
      userId: req.user.id
    });

    if (!result.success) {
      return error(res, result.error || 'SMS yuborishda xatolik yuz berdi', 400);
    }

    return success(res, result, 'SMS muvaffaqiyatli yuborildi');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Get center SMS templates
 */
const getSMSTemplates = async (req, res) => {
  try {
    const centerId = req.query.centerId || req.user.centerId;
    if (!centerId) return error(res, 'Markaz topilmadi', 400);

    const center = await prisma.center.findUnique({
      where: { id: centerId },
      select: { settings: true }
    });

    const settings = center?.settings || {};
    const defaultTemplates = {
      attendance_missed: "Hurmatli ota-ona! Farzandingiz {studentName} bugun {groupName} guruhidagi darsga qatnashmadi. Ma'lumot uchun: {centerPhone}",
      payment_reminder: "Hurmatli {parentName}! Farzandingiz {studentName} ning {month} oyi uchun o'quv to'lovi muddati yaqinlashmoqda ({amount} so'm). {centerName}",
      subscription_due: "Diqqat: O'quv markazingiz Abdora SaaS oylik obuna to'lovi muddati {daysLeft} kun qoldi. Iltimos, hisobingizni to'ldiring."
    };

    const templates = settings.smsTemplates || defaultTemplates;
    return success(res, templates);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Update center SMS templates
 */
const updateSMSTemplates = async (req, res) => {
  try {
    const centerId = req.body.centerId || req.user.centerId;
    const { templates } = req.body;

    if (!centerId || !templates) {
      return error(res, 'centerId va templates majburiy', 400);
    }

    const center = await prisma.center.findUnique({ where: { id: centerId } });
    if (!center) return error(res, 'Markaz topilmadi', 404);

    const currentSettings = typeof center.settings === 'object' ? center.settings : {};
    const newSettings = {
      ...currentSettings,
      smsTemplates: {
        ...(currentSettings.smsTemplates || {}),
        ...templates
      }
    };

    await prisma.center.update({
      where: { id: centerId },
      data: { settings: newSettings }
    });

    return success(res, newSettings.smsTemplates, 'SMS shablonlari yangilandi');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = {
  getSMSStats,
  getSMSLogs,
  sendTestOrCustomSMS,
  getSMSTemplates,
  updateSMSTemplates
};
