const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { encrypt, decrypt } = require('../utils/encryption');

/**
 * Get all subscriptions with center & plan details (Admin only)
 */
const getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        center: {
          select: { id: true, name: true, phone: true, email: true, isActive: true }
        },
        plan: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return success(res, subscriptions);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Get single center subscription (Admin or center Manager)
 */
const getCenterSubscription = async (req, res) => {
  try {
    const centerId = req.params.centerId || req.user.centerId;
    if (!centerId) return error(res, 'Markaz ID topilmadi', 400);

    if (req.user.role !== 'admin' && req.user.centerId !== centerId) {
      return error(res, 'Ruxsat berilmagan', 403);
    }

    const subscription = await prisma.subscription.findUnique({
      where: { centerId },
      include: {
        center: true,
        plan: true,
        invoices: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!subscription) {
      return success(res, null, "Ushbu markaz uchun obuna topilmadi");
    }

    // Hide encrypted keys in response, show hasKey boolean
    const safeData = {
      ...subscription,
      hasByokKey: Boolean(subscription.aiApiKeyEncrypted),
      hasByosKey: Boolean(subscription.smsApiKeyEncrypted),
      aiApiKeyEncrypted: undefined,
      aiApiKeyIV: undefined,
      smsApiKeyEncrypted: undefined,
      smsApiKeyIV: undefined
    };

    return success(res, safeData);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Assign plan to a center (or change plan)
 */
const assignPlan = async (req, res) => {
  try {
    const { centerId } = req.params;
    const { planId, isTrial = true, customTrialDays } = req.body;

    if (!centerId || !planId) {
      return error(res, 'centerId va planId majburiy', 400);
    }

    const [center, plan] = await Promise.all([
      prisma.center.findUnique({ where: { id: centerId } }),
      prisma.plan.findUnique({ where: { id: planId } })
    ]);

    if (!center) return error(res, 'Markaz topilmadi', 404);
    if (!plan) return error(res, 'Tarif topilmadi', 404);

    const now = new Date();
    const trialDays = customTrialDays ? parseInt(customTrialDays, 10) : plan.trialDays;
    const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
    const nextDueDate = isTrial ? trialEndsAt : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.upsert({
      where: { centerId },
      create: {
        centerId,
        planId,
        status: isTrial ? 'trial' : 'active',
        startDate: now,
        trialEndsAt: isTrial ? trialEndsAt : null,
        currentPeriodStart: now,
        currentPeriodEnd: nextDueDate,
        nextDueDate,
        paymentMethod: 'manual'
      },
      update: {
        planId,
        status: isTrial ? 'trial' : 'active',
        trialEndsAt: isTrial ? trialEndsAt : null,
        currentPeriodEnd: nextDueDate,
        nextDueDate
      },
      include: { plan: true }
    });

    // Create an initial invoice if not trial
    if (!isTrial && plan.price > 0) {
      await prisma.invoice.create({
        data: {
          subscriptionId: subscription.id,
          amount: plan.price,
          currency: plan.currency,
          status: 'pending',
          dueDate: nextDueDate,
          note: `${plan.name} tarifi uchun oylik to'lov`
        }
      });
    }

    return success(res, subscription, "Tarif markazga muvaffaqiyatli bog'landi");
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Manually mark subscription as paid (Admin only)
 */
const markPaid = async (req, res) => {
  try {
    const { centerId } = req.params;
    const { amount, note, monthsCount = 1 } = req.body;

    const subscription = await prisma.subscription.findUnique({
      where: { centerId },
      include: { plan: true }
    });

    if (!subscription) return error(res, 'Obuna topilmadi', 404);

    const now = new Date();
    const addedDays = (parseInt(monthsCount, 10) || 1) * 30;
    const currentDue = subscription.nextDueDate && new Date(subscription.nextDueDate) > now
      ? new Date(subscription.nextDueDate)
      : now;
    const nextDueDate = new Date(currentDue.getTime() + addedDays * 24 * 60 * 60 * 1000);

    // Update subscription to active
    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'active',
        lastPaidAt: now,
        currentPeriodStart: now,
        currentPeriodEnd: nextDueDate,
        nextDueDate
      },
      include: { plan: true }
    });

    // Create invoice record
    const invoiceAmount = amount ? parseInt(amount, 10) : subscription.plan.price;
    await prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        amount: invoiceAmount,
        currency: subscription.plan.currency,
        status: 'paid',
        dueDate: now,
        paidAt: now,
        paidBy: req.user.id,
        note: note || `Admin tomonidan qo'lda to'landi deb belgilandi (${monthsCount} oy)`
      }
    });

    return success(res, updated, "To'lov muvaffaqiyatli qabul qilindi va obuna faollashtirildi");
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Suspend subscription (Admin only)
 */
const suspendSubscription = async (req, res) => {
  try {
    const { centerId } = req.params;
    const updated = await prisma.subscription.update({
      where: { centerId },
      data: { status: 'suspended' },
      include: { plan: true }
    });
    return success(res, updated, 'Obuna toxtatildi (Suspended)');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Activate subscription (Admin only)
 */
const activateSubscription = async (req, res) => {
  try {
    const { centerId } = req.params;
    const updated = await prisma.subscription.update({
      where: { centerId },
      data: { status: 'active' },
      include: { plan: true }
    });
    return success(res, updated, 'Obuna faollashtirildi');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Configure AI API Key (BYOK) - encrypted AES-256
 */
const configureBYOK = async (req, res) => {
  try {
    const centerId = req.params.centerId || req.user.centerId;
    const { apiKey, model, source = 'byok' } = req.body;

    if (req.user.role !== 'admin' && req.user.centerId !== centerId) {
      return error(res, 'Ruxsat berilmagan', 403);
    }

    let encData = { encrypted: null, iv: null };
    if (apiKey) {
      encData = encrypt(apiKey);
    }

    const updated = await prisma.subscription.update({
      where: { centerId },
      data: {
        aiApiKeySource: source,
        aiApiKeyEncrypted: encData.encrypted,
        aiApiKeyIV: encData.iv,
        aiPreferredModel: model || null
      }
    });

    return success(res, {
      aiApiKeySource: updated.aiApiKeySource,
      aiPreferredModel: updated.aiPreferredModel,
      hasKey: Boolean(updated.aiApiKeyEncrypted)
    }, "AI sozlamalari muvaffaqiyatli saqlandi");
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Configure SMS API Key (BYOS) - encrypted AES-256
 */
const configureBYOS = async (req, res) => {
  try {
    const centerId = req.params.centerId || req.user.centerId;
    const { apiKey, provider = 'byos', senderName } = req.body;

    if (req.user.role !== 'admin' && req.user.centerId !== centerId) {
      return error(res, 'Ruxsat berilmagan', 403);
    }

    let encData = { encrypted: null, iv: null };
    if (apiKey) {
      encData = encrypt(apiKey);
    }

    const updated = await prisma.subscription.update({
      where: { centerId },
      data: {
        smsProvider: provider,
        smsApiKeyEncrypted: encData.encrypted,
        smsApiKeyIV: encData.iv,
        smsSenderName: senderName || null
      }
    });

    return success(res, {
      smsProvider: updated.smsProvider,
      smsSenderName: updated.smsSenderName,
      hasKey: Boolean(updated.smsApiKeyEncrypted)
    }, "SMS provayder sozlamalari saqlandi");
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = {
  getAllSubscriptions,
  getCenterSubscription,
  assignPlan,
  markPaid,
  suspendSubscription,
  activateSubscription,
  configureBYOK,
  configureBYOS
};
