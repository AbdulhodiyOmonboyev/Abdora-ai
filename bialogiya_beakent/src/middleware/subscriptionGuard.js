const { prisma } = require('../config/db');
const { error } = require('../utils/apiResponse');

/**
 * Middleware to check subscription status and enforce plan limits / grace period
 */
const checkSubscriptionStatus = async (req, res, next) => {
  // Super Admin is never restricted
  if (req.user?.role === 'admin') {
    return next();
  }

  const centerId = req.user?.centerId;
  if (!centerId) {
    return next();
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { centerId },
      include: { plan: true }
    });

    // If center does not have a subscription entry yet, allow for backwards compatibility
    if (!subscription) {
      return next();
    }

    req.subscription = subscription;
    const { status, nextDueDate, trialEndsAt } = subscription;
    const now = new Date();

    // Check trial expiration
    if (status === 'trial' && trialEndsAt && new Date(trialEndsAt) < now) {
      // Mark as grace
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'grace', nextDueDate: now }
      }).catch(() => {});
      subscription.status = 'grace';
    }

    // Check overdue on active subscriptions
    if (status === 'active' && nextDueDate && new Date(nextDueDate) < now) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'grace' }
      }).catch(() => {});
      subscription.status = 'grace';
    }

    // 1. CANCELLED
    if (subscription.status === 'cancelled') {
      return error(res, "Ushbu o'quv markaz obunasi bekor qilingan. Markaz rahbariyati bilan bog'laning.", 403);
    }

    // 2. SUSPENDED (Read-only for GET, block modifications)
    if (subscription.status === 'suspended') {
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        // Allow subscription/payment endpoints for manager to view or pay
        const path = req.originalUrl || req.url;
        if (path.includes('/payment') || path.includes('/subscription')) {
          return next();
        }
        return error(res, "O'quv markaz obuna to'lovi to'lanmaganligi sababli tizim to'xtatilgan (Suspended). Ma'lumotlarni o'zgartirish cheklangan.", 403);
      }
      return next();
    }

    // 3. GRACE PERIOD (7 days)
    if (subscription.status === 'grace') {
      const dueDate = nextDueDate ? new Date(nextDueDate) : new Date();
      const diffMs = now.getTime() - dueDate.getTime();
      const overdueDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      const path = req.originalUrl || req.url;

      // Day 4-7: Disable AI features
      if (overdueDays >= 3 && (path.includes('/ai') || path.includes('/ai-agents') || path.includes('/speaking') || path.includes('/voice'))) {
        return error(res, "Obuna to'lovi muddati o'tganligi sababli sun'iy intellekt (AI) xizmatlari vaqtincha cheklangan. Iltimos, oylik to'lovni amalga oshiring.", 403);
      }

      // Day 4-7: Disable SMS features
      if (overdueDays >= 3 && path.includes('/sms')) {
        return error(res, "Obuna to'lovi muddati o'tganligi sababli SMS xabarnoma xizmatlari cheklangan.", 403);
      }

      // Day 7+: Suspended (read-only)
      if (overdueDays >= 7) {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
          if (path.includes('/payment') || path.includes('/subscription')) {
            return next();
          }
          return error(res, "Obuna to'lovi uchun 7 kunlik imtiyozli muddat (Grace period) tugadi. O'qituvchi va xodimlar baho yoki davomat qo'ya olmaydi. Iltimos, to'lovni amalga oshiring.", 403);
        }
      }
    }

    next();
  } catch (err) {
    console.error('Subscription guard error:', err.message);
    next();
  }
};

module.exports = {
  checkSubscriptionStatus
};
