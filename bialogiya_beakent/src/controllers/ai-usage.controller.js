const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');

/**
 * Get aggregated AI usage statistics
 */
const getAIUsageStats = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const centerId = req.query.centerId || (!isAdmin ? req.user.centerId : null);

    const where = centerId ? { centerId } : {};

    // Total counts from AIUsageLog
    const [totalLogs, totalTokensAgg, providerGroups, useCaseGroups] = await Promise.all([
      prisma.aIUsageLog.count({ where }),
      prisma.aIUsageLog.aggregate({
        where,
        _sum: { tokensIn: true, tokensOut: true, totalTokens: true, costUsd: true }
      }),
      prisma.aIUsageLog.groupBy({
        by: ['provider'],
        where,
        _sum: { totalTokens: true, costUsd: true },
        _count: { id: true }
      }),
      prisma.aIUsageLog.groupBy({
        by: ['useCase'],
        where,
        _sum: { totalTokens: true },
        _count: { id: true }
      })
    ]);

    // Center subscriptions usage comparison (for Admin)
    let centerSubscriptions = [];
    if (isAdmin && !centerId) {
      centerSubscriptions = await prisma.subscription.findMany({
        select: {
          id: true,
          status: true,
          currentMonthTokens: true,
          currentMonthRequests: true,
          totalTokensUsed: true,
          totalRequestsUsed: true,
          center: { select: { id: true, name: true } },
          plan: { select: { name: true, aiMonthlyTokenLimit: true, aiModel: true } }
        },
        orderBy: { currentMonthTokens: 'desc' },
        take: 50
      });
    }

    return success(res, {
      summary: {
        totalRequests: totalLogs,
        tokensIn: totalTokensAgg._sum.tokensIn || 0,
        tokensOut: totalTokensAgg._sum.tokensOut || 0,
        totalTokens: totalTokensAgg._sum.totalTokens || 0,
        totalCostUsd: totalTokensAgg._sum.costUsd || 0
      },
      providers: providerGroups.map(p => ({
        provider: p.provider,
        tokens: p._sum.totalTokens || 0,
        costUsd: p._sum.costUsd || 0,
        requests: p._count.id
      })),
      useCases: useCaseGroups.map(u => ({
        useCase: u.useCase,
        tokens: u._sum.totalTokens || 0,
        requests: u._count.id
      })),
      centerSubscriptions
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Get detailed paginated AI usage logs
 */
const getAIUsageLogs = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const centerId = req.query.centerId || (!isAdmin ? req.user.centerId : null);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const where = {};
    if (centerId) where.centerId = centerId;
    if (req.query.provider) where.provider = req.query.provider;
    if (req.query.useCase) where.useCase = req.query.useCase;

    const [total, logs] = await Promise.all([
      prisma.aIUsageLog.count({ where }),
      prisma.aIUsageLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          subscription: {
            select: {
              center: { select: { id: true, name: true } },
              plan: { select: { name: true } }
            }
          }
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
 * Export AI usage to CSV
 */
const exportAIUsageCSV = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const centerId = req.query.centerId || (!isAdmin ? req.user.centerId : null);
    const where = centerId ? { centerId } : {};

    const logs = await prisma.aIUsageLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1000,
      include: {
        subscription: {
          select: {
            center: { select: { name: true } }
          }
        }
      }
    });

    let csv = 'ID,Vaqt,Markaz,Provayder,Model,UseCase,TokensIn,TokensOut,JamiTokens,TaxminiyNarxUSD\n';
    for (const l of logs) {
      const centerName = l.subscription?.center?.name || l.centerId;
      csv += `"${l.id}","${l.createdAt.toISOString()}","${centerName}","${l.provider}","${l.model}","${l.useCase}",${l.tokensIn},${l.tokensOut},${l.totalTokens},${l.costUsd || 0}\n`;
    }

    res.header('Content-Type', 'text/csv');
    res.attachment(`ai-usage-${Date.now()}.csv`);
    return res.send(csv);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = {
  getAIUsageStats,
  getAIUsageLogs,
  exportAIUsageCSV
};
