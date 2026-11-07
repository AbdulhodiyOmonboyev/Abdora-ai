const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { getModelAsync } = require('../config/gemini');
const { awardXP } = require('../services/gamification.service');
const { HERO_RACES, RACE_CATEGORIES, MODERN_CAREERS } = require('../data/heroRaces');
const checkFeynmanAllowed = async (centerId) => {
  if (!centerId) return true;
  try {
    const center = await prisma.center.findUnique({
      where: { id: centerId },
      select: { settings: true },
    });
    if (!center || !center.settings) return true;
    const settings = typeof center.settings === 'string' ? JSON.parse(center.settings) : center.settings;
    if (settings?.features?.feynmanHeroEnabled === false) {
      return false;
    }
  } catch (e) {
    console.warn('checkFeynmanAllowed error:', e.message);
  }
  return true;
};


const DEFAULT_ROOM_TEMPLATES = {
  medical_clinic: {
    title: 'Robotik Jarrohlik & Tibbiyot Markazi',
    subtitle: 'Zamonaviy operatsiyalar, MRT va da Vinci Xi robototexnikasi',
    unlockedItems: ['davinci_xi', 'mri_3t', 'harmonic_scalpel', 'stethoscope'],
    equippedItems: ['davinci_xi', 'stethoscope'],
  },
  bio_lab: {
    title: 'Genetika & Biotexnologiya Markazi',
    subtitle: 'CRISPR genom tahrirlash, DNK sekvenatori va PZR laboratoriyasi',
    unlockedItems: ['crispr_cas9', 'dna_sequencer', 'pcr_cycler', 'cryo_freezer'],
    equippedItems: ['crispr_cas9', 'dna_sequencer'],
  },
  cyber_lab: {
    title: 'Kiber & AI Texnoparki',
    subtitle: 'NVIDIA H100 klasteri, Flipper Zero va superkompyuter stansiyasi',
    unlockedItems: ['gpu_cluster', 'workstation_128', 'flipper_zero', 'kali_workstation'],
    equippedItems: ['gpu_cluster', 'flipper_zero'],
  },
  smart_farm: {
    title: 'Aqlli Agrobiologiya & Smart Issiqxona',
    subtitle: 'DJI Agras droni, multispektral kameralar va avtomatlashgan gidroponika',
    unlockedItems: ['dji_agras', 'ndvi_camera', 'smart_hydroponics', 'soil_sensors'],
    equippedItems: ['dji_agras', 'smart_hydroponics'],
  },
  aerospace_hangar: {
    title: 'Aviakosmik Angar & Astrobiologiya',
    subtitle: 'Sanoat 3D metall printeri, orbital telemetriya va fazoviy teleskop',
    unlockedItems: ['metal_3d_printer', 'space_telescope', 'wind_tunnel', 'telemetry_system'],
    equippedItems: ['metal_3d_printer', 'space_telescope'],
  },
  neuro_lab: {
    title: 'Neyro-interfeys & Ong Laboratoriyasi',
    subtitle: 'BCI neyro-garnitura, 3-Tesla MRT va neyrostimulyator paneli',
    unlockedItems: ['bci_headset', 'mri_3t', 'eeg_sensors', 'dicom_ai'],
    equippedItems: ['bci_headset', 'eeg_sensors'],
  },
  botanical_garden: {
    title: 'Sehrli Issiqxona & Biosfera Bog\'i',
    subtitle: 'FLIR termovizor droni, gaz-spektrometr va quyosh piranometri',
    unlockedItems: ['flir_drone', 'gc_ms_spec', 'magic_pot', 'crystal_lamp'],
    equippedItems: ['magic_pot', 'flir_drone'],
  },
};

/**
 * GET /api/student/hero/me
 * Returns current user's hero profile or setup prompt
 */
const getMyHero = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, xp: true, coins: true, level: true, heroConfig: true, centerId: true },
    });

    if (!user) return error(res, 'Foydalanuvchi topilmadi', 404);

    const isFeynmanAllowed = await checkFeynmanAllowed(user.centerId);

    return success(res, {
      hero: user.heroConfig || null,
      isConfigured: Boolean(user.heroConfig && user.heroConfig.isSetupCompleted),
      isFeynmanAllowed,
      availableRaces: HERO_RACES.slice(0, 15),
      categories: RACE_CATEGORIES,
      careers: MODERN_CAREERS,
      totalRacesCount: HERO_RACES.length,
      playerStats: {
        xp: user.xp,
        coins: user.coins,
        level: user.level,
      },
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/student/hero/races
 * Returns available race catalog & abilities with search & category filtering
 */
const getAvailableRaces = async (req, res) => {
  const { category, search } = req.query;
  let list = HERO_RACES;

  if (category && category !== 'all') {
    list = list.filter(r => r.categoryId === category);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.abilities && r.abilities.toLowerCase().includes(q)) ||
      (r.careers && r.careers.toLowerCase().includes(q))
    );
  }

  return success(res, {
    total: list.length,
    categories: RACE_CATEGORIES,
    careers: MODERN_CAREERS,
    races: list,
  });
};

/**
 * POST /api/student/hero/setup
 * Sets up the student's hero on first onboarding
 */
const setupHero = async (req, res, next) => {
  try {
    const { race, name, archetype, gender, dreamJob, interests, customAppearance } = req.body;

    const userCurrent = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { centerId: true } });
    const isAllowed = await checkFeynmanAllowed(userCurrent?.centerId);
    if (!isAllowed) {
      return error(res, 'Markazingizda Feynman Metodikasi va Qahramon tizimi cheklangan', 403);
    }

    if (!name || !name.trim()) {
      return error(res, 'Qahramon ismini kiriting', 400);
    }

    const selectedRace = HERO_RACES.find(r => r.id === race || r.id.includes(race)) || HERO_RACES[0];
    
    // Map job to room theme
    let roomTheme = selectedRace.defaultRoom || 'bio_lab';
    if (dreamJob === 'robotic_surgeon' || dreamJob === 'doctor') {
      roomTheme = 'medical_clinic';
    } else if (dreamJob === 'genetic_engineer' || dreamJob === 'scientist') {
      roomTheme = 'bio_lab';
    } else if (dreamJob === 'ai_engineer' || dreamJob === 'cyber_security' || dreamJob === 'programmer') {
      roomTheme = 'cyber_lab';
    } else if (dreamJob === 'smart_agronomist') {
      roomTheme = 'smart_farm';
    } else if (dreamJob === 'aerospace_engineer') {
      roomTheme = 'aerospace_hangar';
    } else if (dreamJob === 'neuroscientist') {
      roomTheme = 'neuro_lab';
    } else if (dreamJob === 'green_ecologist' || dreamJob === 'biologist') {
      roomTheme = 'botanical_garden';
    } else if (dreamJob === 'rescue_hero') {
      roomTheme = 'medical_clinic';
    }

    const roomDetails = DEFAULT_ROOM_TEMPLATES[roomTheme] || DEFAULT_ROOM_TEMPLATES.bio_lab;

    const matchedCareer = MODERN_CAREERS.find(c => c.id === dreamJob);

    const heroConfig = {
      isSetupCompleted: true,
      race: selectedRace.id,
      raceName: selectedRace.name,
      raceIcon: selectedRace.icon,
      raceNumber: selectedRace.number,
      category: selectedRace.category,
      abilities: selectedRace.abilities,
      passiveBonus: selectedRace.passiveBonus,
      name: name.trim(),
      archetype: archetype || 'apprentice',
      gender: gender || 'neutral',
      dreamJob: dreamJob || 'robotic_surgeon',
      dreamJobTitle: matchedCareer ? matchedCareer.title : 'Zamonaviy Mutaxassis',
      interests: Array.isArray(interests) ? interests : [dreamJob, 'biologiya', 'texnologiya'],
      customAppearance: customAppearance || {
        height: 175,
        weight: 70,
        skinTone: '#ffd1b3',
        hairStyle: 'short',
        hairColor: '#1e293b',
      },
      stats: {
        ...selectedRace.baseStats,
        teachingSkill: 1,
        totalTaughtLessons: 0,
      },
      room: {
        theme: roomTheme,
        title: roomDetails.title,
        level: 1,
        unlockedItems: [...roomDetails.unlockedItems],
        equippedItems: [...roomDetails.equippedItems],
      },
      dialogueHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: { heroConfig },
      select: { id: true, heroConfig: true, xp: true, coins: true, level: true },
    });

    // Welcome bonus XP!
    await awardXP(req.user.userId, 50, 'hero_creation');

    return success(res, updatedUser.heroConfig, 'Qahramon muvaffaqiyatli yaratildi!', 201);
  } catch (err) { next(err); }
};

/**
 * PUT /api/student/hero/update
 * Updates hero stats, equipped room items, etc.
 */
const updateHero = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { heroConfig: true },
    });

    if (!user || !user.heroConfig) {
      return error(res, 'Qahramon hali yaratilmagan', 400);
    }

    const currentHero = user.heroConfig;
    const { equippedItems, name } = req.body;

    const updatedConfig = {
      ...currentHero,
      name: name ? name.trim() : currentHero.name,
      room: {
        ...currentHero.room,
        equippedItems: Array.isArray(equippedItems) ? equippedItems : currentHero.room?.equippedItems || [],
      },
      updatedAt: new Date().toISOString(),
    };

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { heroConfig: updatedConfig },
    });

    return success(res, updatedConfig, 'Qahramon ma\'lumotlari yangilandi');
  } catch (err) { next(err); }
};

/**
 * POST /api/student/hero/reverse-teach
 * Feynman Technique: Student explains the lesson to their companion!
 * Gemini evaluates, praises, awards XP, and returns hero's joyful reaction!
 */
const reverseTeach = async (req, res, next) => {
  try {
    const { lessonId, lessonTitle, studentExplanation } = req.body;

    const userForCheck = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { centerId: true } });
    const isAllowedTeach = await checkFeynmanAllowed(userForCheck?.centerId);
    if (!isAllowedTeach) {
      return error(res, 'Markazingizda Feynman Metodikasi cheklangan', 403);
    }

    if (!studentExplanation || !studentExplanation.trim()) {
      return error(res, 'Tushuntirishingizni yozing yoki ovoz bilan ayting', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, centerId: true, heroConfig: true },
    });

    const hero = user?.heroConfig || {
      name: 'Sehrgar Do\'st',
      raceName: 'Elf',
      dreamJob: 'Doktor',
    };

    const prompt = `
Sen 8-16 yoshdagi o'quvchining eng yaqin kichik sehrli do'stisan (Isming: ${hero.name}, Irqing: ${hero.raceName || 'Sehrgar Elf'}).
Sening do'sting kelajakda "${hero.dreamJob || 'Doktor'}" bo'lmoqchi.
Bugungi dars mavzusi: "${lessonTitle || 'Dars'}".
Do'sting (o'quvchi) ushbu mavzuni senga tushuntirib berdi:
"${studentExplanation.trim()}".

Vazifang:
1. Sen biroz narsani unutib qo'yganding, endi do'sting senga tushuntirib bergani uchun juda sevinasan.
2. Agar o'quvchining tushuntirishida darsning asosiy ma'nosi (hatto 1-2 jumla bo'lsa ham) bor bo'lsa:
   - Uni samimiy maqtang: "Vau! Menga shunday oddiy tushuntirib berdingki, endi bir umr esimda qoladi!"
   - Uning "${hero.dreamJob}" bo'lish orzusiga bog'lab dalda bering.
   - evaluation: "great", score: 50.
3. Agar juda chala yoki noaniq bo'lsa:
   - Hech qachon koyimang! Bosh qashlab: "Aha, tushundim! Demak bu xuddi... o'xshar ekan-da?" deb to'g'ri fikrni o'zingiz do'stona davom ettiring.
   - evaluation: "good_try", score: 25.

Doim O'ZBEK tilida, iliq va bolalarga xos quvnoq tilda javob bering.
Javobni FAQAT valid JSON formatda qaytaring:
{
  "feedback": "Do'stona maqtov va munosabat (2-3 jumla)",
  "evaluation": "great" yoki "good_try",
  "awardedXp": 50,
  "awardedCoins": 10,
  "reactionEmotion": "amazed" yoki "happy" yoki "thinking"
}
`;

    let parsedResult = {
      feedback: `Vau, do'stim! Buni shunchalik ajoyib tushuntirib berdingki, endi hech qachon esimdan chiqmaydi! Rahmat senga!`,
      evaluation: 'great',
      awardedXp: 50,
      awardedCoins: 10,
      reactionEmotion: 'amazed',
    };

    try {
      const model = await getModelAsync({ jsonMode: true, centerId: user?.centerId });
      const result = await model.generateContent(prompt);
      const rawText = result.response.text();
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      parsedResult = JSON.parse(cleaned);
    } catch (aiErr) {
      console.warn('Reverse teach AI parsing warning:', aiErr.message);
    }

    const xpAmount = parsedResult.awardedXp || 50;
    const { newXP, newLevel } = await awardXP(req.user.userId, xpAmount, 'reverse_teach');

    // Update hero stats
    if (user?.heroConfig) {
      const heroStats = user.heroConfig.stats || {};
      const updatedHeroConfig = {
        ...user.heroConfig,
        stats: {
          ...heroStats,
          teachingSkill: (heroStats.teachingSkill || 1) + 1,
          totalTaughtLessons: (heroStats.totalTaughtLessons || 0) + 1,
        },
        dialogueHistory: [
          ...(user.heroConfig.dialogueHistory || []).slice(-10),
          {
            lessonTitle,
            studentExplanation,
            heroFeedback: parsedResult.feedback,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      await prisma.user.update({
        where: { id: req.user.userId },
        data: { heroConfig: updatedHeroConfig },
      });
    }

    return success(res, {
      ...parsedResult,
      newXP,
      newLevel,
    }, 'Mavzu avatarga muvaffaqiyatli tushuntirildi!');
  } catch (err) { next(err); }
};

module.exports = {
  getMyHero,
  setupHero,
  updateHero,
  reverseTeach,
  getAvailableRaces,
};
