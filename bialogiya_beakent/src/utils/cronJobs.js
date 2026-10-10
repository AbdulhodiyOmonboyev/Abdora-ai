const { prisma } = require('../config/db');
const { sendCenterSMS } = require('./smsProvider');

/**
 * Check subscription due dates and trigger reminders or grace period changes
 */
async function checkSubscriptionsAndNotify() {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: { in: ['trial', 'active', 'grace'] }
      },
      include: {
        center: true,
        plan: true
      }
    });

    const now = new Date();

    for (const sub of subscriptions) {
      const dueDate = sub.nextDueDate ? new Date(sub.nextDueDate) : null;
      if (!dueDate) continue;

      const diffTime = dueDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Fetch manager for notifications
      const manager = await prisma.user.findFirst({
        where: { centerId: sub.centerId, role: 'manager', isActive: true },
        select: { id: true, phone: true, name: true }
      });

      // 7 days, 3 days or 0 days notice
      if ([7, 3, 0].includes(daysLeft)) {
        const title = daysLeft === 0
          ? "🔴 Bugun oylik obuna to'lov kuni!"
          : `⚠️ Obuna to'lovi muddati ${daysLeft} kun qoldi`;

        const message = `Hurmatli manager! ${sub.center.name} o'quv markazining ${sub.plan.name} tarifi bo'yicha to'lov muddati: ${daysLeft === 0 ? 'BUGUN' : daysLeft + ' kun qoldi'}. Summa: ${sub.plan.price?.toLocaleString()} ${sub.plan.currency}.`;

        // 1. In-app notification
        if (manager) {
          await prisma.notification.create({
            data: {
              userId: manager.id,
              centerId: sub.centerId,
              title,
              message,
              type: daysLeft === 0 ? 'error' : 'warning'
            }
          }).catch(() => {});

          // 2. SMS notification
          if (manager.phone) {
            await sendCenterSMS({
              centerId: sub.centerId,
              toPhone: manager.phone,
              message,
              trigger: 'subscription_due',
              recipientType: 'manager',
              userId: manager.id
            }).catch(() => {});
          }
        }
      }

      // Check overdue -> move to grace
      if (daysLeft < 0 && sub.status === 'active') {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'grace' }
        });
      }

      // Check grace overdue >= 7 days -> move to suspended
      if (sub.status === 'grace') {
        const overdueDays = Math.abs(daysLeft);
        if (overdueDays >= 7) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'suspended' }
          });
        }
      }
    }
  } catch (err) {
    console.error('Subscription cron check error:', err.message);
  }
}

/**
 * Reset monthly counters for subscriptions (e.g. on 1st of month)
 */
async function resetMonthlyUsageCounters() {
  try {
    const today = new Date();
    if (today.getDate() === 1) {
      await prisma.subscription.updateMany({
        data: {
          currentMonthTokens: 0,
          currentMonthRequests: 0,
          currentMonthSms: 0
        }
      });
      console.log('Monthly subscription counters reset successfully');
    }
  } catch (err) {
    console.error('Reset monthly usage counters error:', err.message);
  }
}

/**
 * Start background timer checks
 */
function startSubscriptionCron() {
  // Run on startup
  checkSubscriptionsAndNotify().catch(() => {});
  resetMonthlyUsageCounters().catch(() => {});

  // Run every 24 hours
  setInterval(() => {
    checkSubscriptionsAndNotify().catch(() => {});
    resetMonthlyUsageCounters().catch(() => {});
  }, 24 * 60 * 60 * 1000);
}

module.exports = {
  checkSubscriptionsAndNotify,
  resetMonthlyUsageCounters,
  startSubscriptionCron
};
