const { prisma } = require('../config/db');

// Cost per 1M tokens in USD
const PRICING = {
  gemini: {
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },
    'gemini-1.5-pro': { input: 3.50, output: 10.50 },
    'gemini-2.0-flash': { input: 0.10, output: 0.40 },
    default: { input: 0.10, output: 0.40 }
  },
  openai: {
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    default: { input: 2.50, output: 10.00 }
  },
  anthropic: {
    'claude-3-5-sonnet': { input: 3.00, output: 15.00 },
    'claude-3-haiku': { input: 0.25, output: 1.25 },
    default: { input: 3.00, output: 15.00 }
  }
};

/**
 * Calculate approximate USD cost for token usage
 */
function calculateAICost(provider = 'gemini', model = '', tokensIn = 0, tokensOut = 0) {
  const p = String(provider).toLowerCase();
  const providerPricing = PRICING[p] || PRICING.gemini;
  const modelPricing = providerPricing[model] || providerPricing.default;

  const costIn = (tokensIn / 1_000_000) * modelPricing.input;
  const costOut = (tokensOut / 1_000_000) * modelPricing.output;
  return Number((costIn + costOut).toFixed(6));
}

/**
 * Track an AI invocation, record usage log and update subscription counters
 */
async function trackAIUsage({
  centerId,
  userId = null,
  provider = 'gemini',
  model = 'gemini-1.5-flash',
  useCase = 'chat',
  tokensIn = 0,
  tokensOut = 0,
  requestCount = 1
}) {
  if (!centerId) return null;

  try {
    const totalTokens = (tokensIn || 0) + (tokensOut || 0);
    const costUsd = calculateAICost(provider, model, tokensIn, tokensOut);

    // Find active subscription for the center
    const subscription = await prisma.subscription.findUnique({
      where: { centerId },
      include: { plan: true }
    });

    if (!subscription) {
      // Still log if possible or return
      return null;
    }

    // Create log record
    const log = await prisma.aIUsageLog.create({
      data: {
        provider: String(provider),
        model: String(model),
        useCase: String(useCase),
        tokensIn: Number(tokensIn) || 0,
        tokensOut: Number(tokensOut) || 0,
        totalTokens: Number(totalTokens) || 0,
        requestCount: Number(requestCount) || 1,
        costUsd,
        userId: userId || null,
        centerId,
        subscriptionId: subscription.id
      }
    });

    // Update subscription counters
    const updatedSub = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        currentMonthTokens: { increment: totalTokens },
        currentMonthRequests: { increment: requestCount },
        totalTokensUsed: { increment: totalTokens },
        totalRequestsUsed: { increment: requestCount }
      }
    });

    // Quota alert check (90% threshold)
    if (subscription.plan && subscription.plan.aiMonthlyTokenLimit > 0) {
      const limit = subscription.plan.aiMonthlyTokenLimit;
      const current = updatedSub.currentMonthTokens;
      if (current >= limit * 0.9 && (current - totalTokens) < limit * 0.9) {
        // Send in-app notification to center managers
        const managers = await prisma.user.findMany({
          where: { centerId, role: 'manager', isActive: true },
          select: { id: true }
        });
        for (const m of managers) {
          await prisma.notification.create({
            data: {
              userId: m.id,
              centerId,
              title: "AI Token Limiti Ogohlantirish",
              message: `O'quv markazingiz oylik AI token limitining 90% qismidan (${current.toLocaleString()} / ${limit.toLocaleString()}) foydalandi.`,
              type: 'warning'
            }
          }).catch(() => {});
        }
      }
    }

    return log;
  } catch (err) {
    console.error('Error tracking AI usage:', err.message);
    return null;
  }
}

module.exports = {
  calculateAICost,
  trackAIUsage
};
