const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');

// Default initial plans
const DEFAULT_PLANS = [
  {
    name: 'Starter',
    description: 'Kichik markazlar uchun: LMS va asosiy boshqaruv, AI va SMS talab etilmaydi.',
    price: 199000,
    currency: 'UZS',
    trialDays: 7,
    aiEnabled: false,
    aiProvider: null,
    aiModel: null,
    aiMonthlyTokenLimit: 0,
    aiMonthlyRequestLimit: 0,
    smsEnabled: false,
    smsProvider: null,
    smsMonthlyLimit: 0,
    maxBranches: 1,
    maxStudents: 100,
    maxTeachers: 5,
    maxGroups: 10,
    features: {
      lms: true,
      crm: false,
      finance: true,
      gamification: false,
      ai_chat: false,
      ai_test: false,
      ai_grading: false,
      ai_speaking: false,
      sms: false
    }
  },
  {
    name: 'Starter Pro',
    description: "O'rta markazlar uchun: Gemini Flash AI, 500K token, SMS xabarnomalar va CRM tizimi.",
    price: 399000,
    currency: 'UZS',
    trialDays: 14,
    aiEnabled: true,
    aiProvider: 'gemini',
    aiModel: 'gemini-1.5-flash',
    aiMonthlyTokenLimit: 500000,
    aiMonthlyRequestLimit: 1000,
    smsEnabled: true,
    smsProvider: 'eskiz',
    smsMonthlyLimit: 500,
    maxBranches: 3,
    maxStudents: 500,
    maxTeachers: 20,
    maxGroups: 35,
    features: {
      lms: true,
      crm: true,
      finance: true,
      gamification: true,
      ai_chat: true,
      ai_test: true,
      ai_grading: true,
      ai_speaking: false,
      sms: true,
      byok: true
    }
  },
  {
    name: 'Starter Pro Max',
    description: "Katta o'quv markazlari va tarmoqlar uchun: Cheksiz AI, barcha modellar (Gemini Pro, GPT-4o, Claude), cheksiz filial va o'quvchilar.",
    price: 799000,
    currency: 'UZS',
    trialDays: 30,
    aiEnabled: true,
    aiProvider: 'all',
    aiModel: 'all',
    aiMonthlyTokenLimit: -1, // -1 means unlimited
    aiMonthlyRequestLimit: -1,
    smsEnabled: true,
    smsProvider: 'all',
    smsMonthlyLimit: -1,
    maxBranches: 9999,
    maxStudents: 99999,
    maxTeachers: 9999,
    maxGroups: 9999,
    features: {
      lms: true,
      crm: true,
      finance: true,
      gamification: true,
      ai_chat: true,
      ai_test: true,
      ai_grading: true,
      ai_speaking: true,
      sms: true,
      byok: true,
      byos: true
    }
  }
];

// Helper to seed plans if none exist
const ensureDefaultPlans = async () => {
  const count = await prisma.plan.count();
  if (count === 0) {
    for (const p of DEFAULT_PLANS) {
      await prisma.plan.create({ data: p }).catch(() => {});
    }
  }
};

/**
 * Get all subscription plans
 */
const getPlans = async (req, res) => {
  try {
    await ensureDefaultPlans();
    const plans = await prisma.plan.findMany({
      orderBy: { price: 'asc' },
      include: {
        _count: { select: { subscriptions: true } }
      }
    });
    return success(res, plans);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Get plan by ID
 */
const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        _count: { select: { subscriptions: true } }
      }
    });
    if (!plan) return error(res, 'Tarif topilmadi', 404);
    return success(res, plan);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Create a new plan
 */
const createPlan = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      currency = 'UZS',
      trialDays = 7,
      aiEnabled = false,
      aiProvider,
      aiModel,
      aiMonthlyTokenLimit = 0,
      aiMonthlyRequestLimit = 0,
      smsEnabled = false,
      smsProvider,
      smsMonthlyLimit = 0,
      maxBranches = 1,
      maxStudents = 100,
      maxTeachers = 10,
      maxGroups = 10,
      features = {}
    } = req.body;

    if (!name || price === undefined) {
      return error(res, 'Tarif nomi va narxi majburiy', 400);
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        description,
        price: parseInt(price, 10),
        currency,
        trialDays: parseInt(trialDays, 10) || 7,
        aiEnabled: Boolean(aiEnabled),
        aiProvider: aiProvider || null,
        aiModel: aiModel || null,
        aiMonthlyTokenLimit: parseInt(aiMonthlyTokenLimit, 10) || 0,
        aiMonthlyRequestLimit: parseInt(aiMonthlyRequestLimit, 10) || 0,
        smsEnabled: Boolean(smsEnabled),
        smsProvider: smsProvider || null,
        smsMonthlyLimit: parseInt(smsMonthlyLimit, 10) || 0,
        maxBranches: parseInt(maxBranches, 10) || 1,
        maxStudents: parseInt(maxStudents, 10) || 100,
        maxTeachers: parseInt(maxTeachers, 10) || 10,
        maxGroups: parseInt(maxGroups, 10) || 10,
        features: features || {}
      }
    });

    return success(res, plan, 'Yangi tarif muvaffaqiyatli yaratildi', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Update an existing plan
 */
const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Format numbers
    if (updateData.price !== undefined) updateData.price = parseInt(updateData.price, 10);
    if (updateData.trialDays !== undefined) updateData.trialDays = parseInt(updateData.trialDays, 10);
    if (updateData.aiMonthlyTokenLimit !== undefined) updateData.aiMonthlyTokenLimit = parseInt(updateData.aiMonthlyTokenLimit, 10);
    if (updateData.aiMonthlyRequestLimit !== undefined) updateData.aiMonthlyRequestLimit = parseInt(updateData.aiMonthlyRequestLimit, 10);
    if (updateData.smsMonthlyLimit !== undefined) updateData.smsMonthlyLimit = parseInt(updateData.smsMonthlyLimit, 10);
    if (updateData.maxBranches !== undefined) updateData.maxBranches = parseInt(updateData.maxBranches, 10);
    if (updateData.maxStudents !== undefined) updateData.maxStudents = parseInt(updateData.maxStudents, 10);
    if (updateData.maxTeachers !== undefined) updateData.maxTeachers = parseInt(updateData.maxTeachers, 10);
    if (updateData.maxGroups !== undefined) updateData.maxGroups = parseInt(updateData.maxGroups, 10);

    const plan = await prisma.plan.update({
      where: { id },
      data: updateData
    });

    return success(res, plan, 'Tarif muvaffaqiyatli yangilandi');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Delete a plan
 */
const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const subCount = await prisma.subscription.count({ where: { planId: id } });
    if (subCount > 0) {
      return error(res, `Ushbu tarif ${subCount} ta o'quv markazga bog'langan. O'chirishdan oldin boshqa tarifga o'tkazing.`, 400);
    }
    await prisma.plan.delete({ where: { id } });
    return success(res, null, "Tarif o'chirildi");
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  ensureDefaultPlans
};
