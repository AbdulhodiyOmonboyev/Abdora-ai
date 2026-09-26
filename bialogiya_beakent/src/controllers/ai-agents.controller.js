const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { updateCachedApiKey } = require('../config/gemini');

const formatAgent = (agent) => {
  const extra = (agent.useCases && typeof agent.useCases === 'object') ? agent.useCases : {};
  return {
    id: agent.id,
    name: agent.name,
    provider: agent.provider,
    apiKey: agent.apiKey,
    model: agent.model,
    isActive: agent.isActive,
    baseUrl: extra.baseUrl || '',
    enabledModels: Array.isArray(extra.enabledModels) ? extra.enabledModels : [agent.model],
    usedFor: Array.isArray(extra.usedFor) ? extra.usedFor : (Array.isArray(agent.useCases) ? agent.useCases : []),
    notes: extra.notes || '',
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt,
  };
};

const getAIAgents = async (req, res, next) => {
  try {
    const centerScope = req.user.role !== 'admin' && req.user.centerId ? { centerId: req.user.centerId } : {};
    const agents = await prisma.aIAgent.findMany({
      where: centerScope,
      orderBy: { createdAt: 'desc' },
    });
    return success(res, agents.map(formatAgent));
  } catch (err) { next(err); }
};

const createAIAgent = async (req, res, next) => {
  try {
    const { name, provider, apiKey, baseUrl, isActive, enabledModels, usedFor, notes } = req.body;
    if (!name?.trim()) return error(res, 'Agent nomi kiritilmagan', 400);
    if (!apiKey?.trim()) return error(res, 'API kalit kiritilmagan', 400);

    const primaryModel = (enabledModels && enabledModels[0]) || 'default';

    const agent = await prisma.aIAgent.create({
      data: {
        name: name.trim(),
        provider: provider || 'gemini',
        apiKey: apiKey.trim(),
        model: primaryModel,
        isActive: isActive !== undefined ? isActive : true,
        useCases: {
          baseUrl: baseUrl || '',
          enabledModels: Array.isArray(enabledModels) ? enabledModels : [],
          usedFor: Array.isArray(usedFor) ? usedFor : [],
          notes: notes || '',
        },
        centerId: req.user.centerId || null,
      },
    });

    if (agent.isActive && agent.apiKey) {
      updateCachedApiKey(agent.apiKey);
    }

    return success(res, formatAgent(agent), 'AI Agent qo\'shildi', 201);
  } catch (err) { next(err); }
};

const updateAIAgent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, provider, apiKey, baseUrl, isActive, enabledModels, usedFor, notes } = req.body;

    const existing = await prisma.aIAgent.findUnique({ where: { id } });
    if (!existing) return error(res, 'AI Agent topilmadi', 404);

    const extra = (existing.useCases && typeof existing.useCases === 'object') ? existing.useCases : {};

    const updated = await prisma.aIAgent.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(provider !== undefined && { provider }),
        ...(apiKey !== undefined && { apiKey: apiKey.trim() }),
        ...(isActive !== undefined && { isActive }),
        ...(enabledModels && enabledModels.length && { model: enabledModels[0] }),
        useCases: {
          baseUrl: baseUrl !== undefined ? baseUrl : extra.baseUrl,
          enabledModels: enabledModels !== undefined ? enabledModels : extra.enabledModels,
          usedFor: usedFor !== undefined ? usedFor : extra.usedFor,
          notes: notes !== undefined ? notes : extra.notes,
        },
      },
    });

    if (updated.isActive && updated.apiKey) {
      updateCachedApiKey(updated.apiKey);
    } else {
      updateCachedApiKey(null);
    }

    return success(res, formatAgent(updated), 'AI Agent yangilandi');
  } catch (err) { next(err); }
};

const deleteAIAgent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.aIAgent.findUnique({ where: { id } });
    if (!existing) return error(res, 'AI Agent topilmadi', 404);

    await prisma.aIAgent.delete({ where: { id } });
    updateCachedApiKey(null);
    return success(res, null, 'AI Agent o\'chirildi');
  } catch (err) { next(err); }
};

module.exports = {
  getAIAgents,
  createAIAgent,
  updateAIAgent,
  deleteAIAgent,
};
