require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { prisma } = require('../src/config/db');

// Import controllers
const { login, getMe } = require('../src/controllers/auth.controller');
const { getLessonById } = require('../src/controllers/lesson.controller');
const { submitTest } = require('../src/controllers/test.controller');
const { recordGameActivity } = require('../src/controllers/analytics.controller');
const { purchaseShopItem, getShopItems, getShopOrders } = require('../src/controllers/shop.controller');
const { getStudentHistory } = require('../src/controllers/user.controller');
// shopItems defined in controller

// Mock req and res generator
function mockReqRes(options = {}) {
  let statusCode = 200;
  let responseData = null;
  let headers = {};

  const req = {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    user: options.user || null,
    method: options.method || 'GET',
    originalUrl: options.url || '/',
  };

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      responseData = data;
      return res;
    },
    setHeader(key, val) {
      headers[key] = val;
      return res;
    },
    _getData: () => responseData,
    _getStatus: () => statusCode,
  };

  const next = (err) => {
    if (err) {
      console.error('[NEXT ERROR]:', err);
      responseData = { success: false, error: err.message, stack: err.stack };
      statusCode = 500;
    }
  };

  return { req, res, next, getData: () => responseData, getStatus: () => statusCode };
}

async function runSimulator() {
  console.log('================================================================');
  console.log(' Abdora AI: O\'quvchi (Student) Jonli Test Simulyatori');
  console.log('================================================================\n');

  // --- Step 0: Setup Mock Data in DB ---
  console.log('[SETUP] Test ma\'lumotlarini tayyorlash...');

  // 1. Center yaratish
  let center = await prisma.center.findFirst({ where: { name: 'Test Biologiya Markazi' } });
  if (!center) {
    center = await prisma.center.create({
      data: {
        name: 'Test Biologiya Markazi',
        isActive: true,
        settings: {
          shopItems: [
            {
              id: 'shop_badge_dna',
              title: 'DNK Ustasi Nishoni',
              description: 'Profil uchun maxsus biologik nishon',
              priceCoins: 30,
              category: 'badge',
              image: '🧬',
              stock: 10,
              isActive: true,
            },
            {
              id: 'shop_pen_premium',
              title: 'Abdora Brend Qalami',
              description: 'Metall korpusli zamonaviy qalam',
              priceCoins: 50,
              category: 'stationery',
              image: '🖊️',
              stock: 5,
              isActive: true,
            }
          ],
          shopOrders: []
        }
      }
    });
  }
  console.log('✅ Center:', center.id, center.name);

  // 2. Teacher yaratish
  const pwdHash = await bcrypt.hash('student123', 10);
  let teacher = await prisma.user.findFirst({ where: { username: 'test_bio_teacher' } });
  if (!teacher) {
    teacher = await prisma.user.create({
      data: {
        name: 'Olimjon Ustoz',
        username: 'test_bio_teacher',
        passwordHash: pwdHash,
        role: 'teacher',
        centerId: center.id,
        isActive: true,
      }
    });
  }
  console.log('✅ Teacher:', teacher.id, teacher.name);

  // 3. Group yaratish
  let group = await prisma.group.findFirst({ where: { name: 'Bio-Guruh 1' } });
  if (!group) {
    group = await prisma.group.create({
      data: {
        name: 'Bio-Guruh 1',
        subject: 'Biologiya',
        teacherId: teacher.id,
        centerId: center.id,
      }
    });
  }
  console.log('✅ Group:', group.id, group.name);

  // 4. Student yaratish
  const initialAchievements = {
    badges: ['welcome_badge'],
    notes: [
      { id: 'note_101', title: 'Fotosintez formulasi', content: '6CO2 + 6H2O -> C6H12O6 + 6O2', date: '2026-11-01' }
    ],
    coinTransactions: [
      { id: 'tx_init', type: 'reward', amount: 100, note: 'Boshlang\'ich bonus tanga', date: '2026-11-01' }
    ]
  };

  let student = await prisma.user.findFirst({ where: { username: 'student_tester' } });
  if (student) {
    // Reset student state for clean run
    student = await prisma.user.update({
      where: { id: student.id },
      data: {
        coins: 100,
        xp: 50,
        level: 1,
        achievements: initialAchievements,
        centerId: center.id,
        groupId: group.id,
        isActive: true,
        isFrozen: false,
      }
    });
  } else {
    student = await prisma.user.create({
      data: {
        name: 'Anvarjon O\'quvchi',
        username: 'student_tester',
        passwordHash: pwdHash,
        role: 'student',
        coins: 100,
        xp: 50,
        level: 1,
        achievements: initialAchievements,
        centerId: center.id,
        groupId: group.id,
        isActive: true,
        isFrozen: false,
      }
    });
  }
  console.log('✅ Student:', student.id, student.name, '| XP:', student.xp, '| Coins:', student.coins);

  // 5. Lesson yaratish
  let lesson = await prisma.lesson.findFirst({ where: { title: 'Hujayra tuzilishi va organoidlari' } });
  if (!lesson) {
    lesson = await prisma.lesson.create({
      data: {
        title: 'Hujayra tuzilishi va organoidlari',
        content: 'Hujayra barcha tirik organizmlarning asosiy tarkibiy va funksional birligidir.',
        subject: 'Biologiya',
        groupId: group.id,
        teacherId: teacher.id,
        centerId: center.id,
        order: 1,
      }
    });
  }
  console.log('✅ Lesson:', lesson.id, lesson.title);

  // 6. Test va Questions yaratish
  let testRecord = await prisma.test.findFirst({
    where: { title: 'Hujayra bo\'yicha oraliq test' },
    include: { questions: true }
  });

  if (!testRecord) {
    testRecord = await prisma.test.create({
      data: {
        title: 'Hujayra bo\'yicha oraliq test',
        groupId: group.id,
        teacherId: teacher.id,
        centerId: center.id,
        totalPoints: 100,
        passingScore: 60,
        questions: {
          create: [
            {
              text: 'Energiya stansiyasi deb qaysi organoid ataladi?',
              points: 50,
              options: [
                { text: 'Mitoxondriya', isCorrect: true },
                { text: 'Ribosoma', isCorrect: false },
                { text: 'Golji majmuasi', isCorrect: false },
                { text: 'Lizosoma', isCorrect: false }
              ]
            },
            {
              text: 'O\'simlik hujayrasida fotosintez qayerda kechadi?',
              points: 50,
              options: [
                { text: 'Vakuola', isCorrect: false },
                { text: 'Xloroplast', isCorrect: true },
                { text: 'Sentriola', isCorrect: false },
                { text: 'Yadro', isCorrect: false }
              ]
            }
          ]
        }
      },
      include: { questions: true }
    });
  }
  console.log('✅ Test:', testRecord.id, testRecord.title, '| Savollar:', testRecord.questions.length);

  // User payload for mocked authentication
  const studentUserPayload = {
    userId: student.id,
    id: student.id,
    role: 'student',
    centerId: center.id,
    groupId: group.id,
  };

  console.log('\n================================================================');
  console.log(' 1-QADAM: Talaba sifatida tizimga kirish (Login) va ma\'lumotlar');
  console.log('================================================================');

  {
    const { req, res, next, getData, getStatus } = mockReqRes({
      body: { username: 'student_tester', password: 'student123' }
    });
    await login(req, res, next);
    const result = getData();
    console.log('Login Status:', getStatus());
    console.log('Login javobi:', {
      success: result?.success,
      message: result?.message,
      user: result?.data?.user ? {
        id: result.data.user.id,
        name: result.data.user.name,
        role: result.data.user.role,
        coins: result.data.user.coins,
        xp: result.data.user.xp,
      } : result
    });
  }

  {
    const { req, res, next, getData, getStatus } = mockReqRes({
      user: studentUserPayload
    });
    await getMe(req, res, next);
    const meResult = getData();
    console.log('getMe Status:', getStatus());
    console.log('Student ma\'lumotlari (getMe):', {
      name: meResult?.data?.name,
      xp: meResult?.data?.xp,
      coins: meResult?.data?.coins,
      level: meResult?.data?.level,
      group: meResult?.data?.group?.name,
      achievementsCount: {
        badges: meResult?.data?.achievements?.badges?.length,
        notes: meResult?.data?.achievements?.notes?.length,
        coinTransactions: meResult?.data?.achievements?.coinTransactions?.length,
      }
    });
  }

  console.log('\n================================================================');
  console.log(' 2-QADAM: Darsni ochish (getLessonById) — XP/Tanga va takroriy chaqiruv');
  console.log('================================================================');

  const studentBeforeLesson = await prisma.user.findUnique({ where: { id: student.id } });
  console.log('Darsdan oldingi ko\'rsatkichlar: XP =', studentBeforeLesson.xp, '| Coins =', studentBeforeLesson.coins);

  // 1-marta chaqirish
  console.log('\n-> 1-marta getLessonById chaqirilmoqda...');
  {
    const { req, res, next, getData, getStatus } = mockReqRes({
      params: { id: lesson.id },
      user: studentUserPayload
    });
    await getLessonById(req, res, next);
    const data = getData();
    console.log('Status:', getStatus(), '| Lesson:', data?.data?.title);
  }

  const studentAfterLesson1 = await prisma.user.findUnique({ where: { id: student.id } });
  console.log('1-marta ochilgandan keyin: XP =', studentAfterLesson1.xp, '(+', studentAfterLesson1.xp - studentBeforeLesson.xp, ')',
              '| Coins =', studentAfterLesson1.coins, '(+', studentAfterLesson1.coins - studentBeforeLesson.coins, ')');
  console.log('achievements.viewedLessons:', studentAfterLesson1.achievements?.viewedLessons);

  // 2-marta chaqirish (Sahifa yangilanishi yoki takroriy kirish)
  console.log('\n-> 2-marta getLessonById chaqirilmoqda (takroriy XP olish bloklanganmi?)...');
  {
    const { req, res, next, getData, getStatus } = mockReqRes({
      params: { id: lesson.id },
      user: studentUserPayload
    });
    await getLessonById(req, res, next);
    const data = getData();
    console.log('Status:', getStatus(), '| Lesson:', data?.data?.title);
  }

  const studentAfterLesson2 = await prisma.user.findUnique({ where: { id: student.id } });
  console.log('2-marta ochilgandan keyin: XP =', studentAfterLesson2.xp, '(O\'zgarish:', studentAfterLesson2.xp - studentAfterLesson1.xp, ')',
              '| Coins =', studentAfterLesson2.coins, '(O\'zgarish:', studentAfterLesson2.coins - studentAfterLesson1.coins, ')');

  if (studentAfterLesson2.xp === studentAfterLesson1.xp && studentAfterLesson2.coins === studentAfterLesson1.coins) {
    console.log('✅ NATIJA: Takroriy XP va tanga olish TO\'G\'RI BLOKLANGAN!');
  } else {
    console.error('❌ XATOLIK: Takroriy dars ochishda XP/tanga qayta berilmoqda!');
  }

  console.log('\n================================================================');
  console.log(' 3-QADAM: Test topshirish (submitTest) — Veb va Mobil formatlar');
  console.log('================================================================');

  const q1 = testRecord.questions[0];
  const q2 = testRecord.questions[1];
  console.log(`Q1: ${q1.text} (To'g'ri javob: Mitoxondriya, indeks: 0)`);
  console.log(`Q2: ${q2.text} (To'g'ri javob: Xloroplast, indeks: 1)`);

  // 3A. Veb format: matn ko'rinishida yuborilganda
  console.log('\n--- 3A. Veb format (Matn: answer = "Mitoxondriya", "Xloroplast") ---');
  const studentBeforeTestWeb = await prisma.user.findUnique({ where: { id: student.id } });
  {
    const { req, res, next, getData, getStatus } = mockReqRes({
      params: { id: testRecord.id },
      user: studentUserPayload,
      body: {
        answers: [
          { questionId: q1.id, answer: 'Mitoxondriya' },
          { questionId: q2.id, answer: 'Xloroplast' }
        ],
        timeTaken: 45
      }
    });
    await submitTest(req, res, next);
    const data = getData();
    console.log('Status:', getStatus());
    console.log('Test natijasi (Web format):', {
      score: data?.data?.score,
      percentage: data?.data?.percentage,
      passed: data?.data?.passed,
      gradedAnswers: data?.data?.result?.answers?.map(a => ({ q: a.questionId, ans: a.answer, isCorrect: a.isCorrect }))
    });
  }

  // Allow async awardXP/background tasks to finish
  await new Promise(r => setTimeout(r, 100));
  const studentAfterTestWeb = await prisma.user.findUnique({ where: { id: student.id } });
  console.log('Veb testdan keyin: XP =', studentAfterTestWeb.xp, '(+', studentAfterTestWeb.xp - studentBeforeTestWeb.xp, ')',
              '| Coins =', studentAfterTestWeb.coins, '(+', studentAfterTestWeb.coins - studentBeforeTestWeb.coins, ')');

  // 3B. Mobil format: indeks yuborilganda (number 0, 1 yoki string "0", "1")
  console.log('\n--- 3B. Mobil format (Indekslar: answer = 0, 1 [Number]) ---');
  const studentBeforeTestMob1 = await prisma.user.findUnique({ where: { id: student.id } });
  {
    const { req, res, next, getData, getStatus } = mockReqRes({
      params: { id: testRecord.id },
      user: studentUserPayload,
      body: {
        answers: [
          { questionId: q1.id, answer: 0 }, // Mitoxondriya is at index 0
          { questionId: q2.id, answer: 1 }  // Xloroplast is at index 1
        ],
        timeTaken: 30
      }
    });
    await submitTest(req, res, next);
    const data = getData();
    console.log('Status:', getStatus());
    console.log('Test natijasi (Mobil Number format):', {
      score: data?.data?.score,
      percentage: data?.data?.percentage,
      passed: data?.data?.passed,
      gradedAnswers: data?.data?.result?.answers?.map(a => ({ q: a.questionId, ans: a.answer, isCorrect: a.isCorrect }))
    });
  }
  await new Promise(r => setTimeout(r, 100));
  const studentAfterTestMob1 = await prisma.user.findUnique({ where: { id: student.id } });
  console.log('Mobil (Number) testdan keyin: XP =', studentAfterTestMob1.xp, '(+', studentAfterTestMob1.xp - studentBeforeTestMob1.xp, ')',
              '| Coins =', studentAfterTestMob1.coins, '(+', studentAfterTestMob1.coins - studentBeforeTestMob1.coins, ')');

  // 3C. Mobil format: indeks string yuborilganda ("0", "1")
  console.log('\n--- 3C. Mobil format (Indekslar: answer = "0", "1" [String]) ---');
  const studentBeforeTestMob2 = await prisma.user.findUnique({ where: { id: student.id } });
  {
    const { req, res, next, getData, getStatus } = mockReqRes({
      params: { id: testRecord.id },
      user: studentUserPayload,
      body: {
        answers: [
          { questionId: q1.id, answer: "0" },
          { questionId: q2.id, answer: "1" }
        ],
        timeTaken: 25
      }
    });
    await submitTest(req, res, next);
    const data = getData();
    console.log('Status:', getStatus());
    console.log('Test natijasi (Mobil String format):', {
      score: data?.data?.score,
      percentage: data?.data?.percentage,
      passed: data?.data?.passed,
      gradedAnswers: data?.data?.result?.answers?.map(a => ({ q: a.questionId, ans: a.answer, isCorrect: a.isCorrect }))
    });
  }
  await new Promise(r => setTimeout(r, 100));
  const studentAfterTestMob2 = await prisma.user.findUnique({ where: { id: student.id } });
  console.log('Mobil (String) testdan keyin: XP =', studentAfterTestMob2.xp, '(+', studentAfterTestMob2.xp - studentBeforeTestMob2.xp, ')',
              '| Coins =', studentAfterTestMob2.coins, '(+', studentAfterTestMob2.coins - studentBeforeTestMob2.coins, ')');

  console.log('\n================================================================');
  console.log(' 4-QADAM: Mini-o\'yin faoliyati (recordGameActivity) va achievements');
  console.log('================================================================');

  const studentBeforeGame = await prisma.user.findUnique({ where: { id: student.id } });
  console.log('O\'yindan oldingi achievements tuzilishi:', {
    keys: Object.keys(studentBeforeGame.achievements || {}),
    notesCount: studentBeforeGame.achievements?.notes?.length,
    coinTxCount: studentBeforeGame.achievements?.coinTransactions?.length,
    badgesCount: studentBeforeGame.achievements?.badges?.length,
    gameActivitiesCount: studentBeforeGame.achievements?.gameActivities?.length,
  });

  {
    const { req, res, next, getData, getStatus } = mockReqRes({
      user: studentUserPayload,
      body: {
        topicTitle: 'Organoidlar dueli',
        gameType: 'matchPairs',
        score: 90,
        moves: 14,
        duration: 35,
        isWon: true,
        mode: 'solo'
      }
    });
    await recordGameActivity(req, res, next);
    const data = getData();
    console.log('Status:', getStatus());
    console.log('recordGameActivity javobi:', data?.data ? {
      xpGained: data.data.xpGained,
      coinsGained: data.data.coinsGained,
      gameActivity: data.data.gameActivity?.id
    } : data);
  }

  const studentAfterGame = await prisma.user.findUnique({ where: { id: student.id } });
  console.log('O\'yindan keyingi ko\'rsatkichlar: XP =', studentAfterGame.xp, '(+', studentAfterGame.xp - studentBeforeGame.xp, ')',
              '| Coins =', studentAfterGame.coins, '(+', studentAfterGame.coins - studentBeforeGame.coins, ')');
  console.log('O\'yindan keyingi achievements tuzilishi:', {
    keys: Object.keys(studentAfterGame.achievements || {}),
    notesCount: studentAfterGame.achievements?.notes?.length,
    coinTxCount: studentAfterGame.achievements?.coinTransactions?.length,
    badgesCount: studentAfterGame.achievements?.badges?.length,
    gameActivitiesCount: studentAfterGame.achievements?.gameActivities?.length,
  });

  // Eski ma'lumotlar saqlanganligini tekshirish
  const notesPreserved = studentAfterGame.achievements?.notes?.length === studentBeforeGame.achievements?.notes?.length;
  const coinTxPreserved = studentAfterGame.achievements?.coinTransactions?.length === studentBeforeGame.achievements?.coinTransactions?.length;
  const badgesPreserved = studentAfterGame.achievements?.badges?.length === studentBeforeGame.achievements?.badges?.length;
  const gameActAdded = studentAfterGame.achievements?.gameActivities?.length === 1;

  if (notesPreserved && coinTxPreserved && badgesPreserved && gameActAdded) {
    console.log('✅ NATIJA: Eski achievements (eslatmalar, tangalar tarixi, nishonlar) TO\'LIQ SAQLANDI!');
  } else {
    console.error('❌ XATOLIK: Eski achievements qisman yoki butunlay yo\'qoldi!', {
      notesPreserved, coinTxPreserved, badgesPreserved, gameActAdded
    });
  }

  console.log('\n================================================================');
  console.log(' 5-QADAM: Do\'kondan tovar buyurtma qilish (purchaseShopItem)');
  console.log('================================================================');

  console.log('\n-> Do\'kondagi mavjud tovarlarni tekshiramiz (getShopItems)...');
  {
    const { req, res, next, getData, getStatus } = mockReqRes({
      user: studentUserPayload
    });
    await getShopItems(req, res, next);
    const data = getData();
    console.log('getShopItems Status:', getStatus(), '| Mahsulotlar soni:', data?.data?.length);
    console.log('Mavjud mahsulot ID lari:', data?.data?.map(i => ({ id: i.id, title: i.title, price: i.priceCoins })));
  }

  const studentBeforeBuy = await prisma.user.findUnique({ where: { id: student.id } });
  console.log('Xariddan oldingi student tangalari:', studentBeforeBuy.coins);

  // 1-tovar: 'item-merch-stickers' narxi 30 tanga
  const itemToBuy = 'item-merch-stickers';
  console.log('Sotib olinayotgan mahsulot: item-merch-stickers (narxi: 30 tanga)');

  {
    const { req, res, next, getData, getStatus } = mockReqRes({
      user: studentUserPayload,
      body: { itemId: itemToBuy }
    });
    await purchaseShopItem(req, res, next);
    const data = getData();
    console.log('Status:', getStatus());
    console.log('purchaseShopItem javobi:', {
      success: data?.success,
      message: data?.data?.message,
      newCoins: data?.data?.newCoins,
      order: data?.data?.order ? {
        id: data.data.order.id,
        itemTitle: data.data.order.itemTitle,
        priceCoins: data.data.order.priceCoins,
        status: data.data.order.status
      } : data
    });
  }

  const studentAfterBuy = await prisma.user.findUnique({ where: { id: student.id } });
  console.log('Xariddan keyingi student tangalari:', studentAfterBuy.coins,
              '(Kamayish:', studentBeforeBuy.coins - studentAfterBuy.coins, 'tanga)');

  if (studentBeforeBuy.coins - studentAfterBuy.coins === 30) {
    console.log('✅ NATIJA: Talaba tangasi TO\'G\'RI KAMAYDI (30 tanga chegirildi)!');
  } else {
    console.error('❌ XATOLIK: Talaba tangasi to\'g\'ri kamaymadi!');
  }

  // Do'kondagi buyurtmalar holati (getShopOrders)
  {
    const { req, res, next, getData, getStatus } = mockReqRes({
      user: studentUserPayload
    });
    await getShopOrders(req, res, next);
    const data = getData();
    console.log('Talaba buyurtmalari ro\'yxati (getShopOrders):', data?.data?.length, 'ta buyurtma');
    if (data?.data?.length > 0) {
      console.log('Oxirgi buyurtma:', {
        id: data.data[0].id,
        itemTitle: data.data[0].itemTitle,
        priceCoins: data.data[0].priceCoins,
        status: data.data[0].status
      });
    }
  }

  // Tangalar yetarli bo'lmagan holatni sinab ko'rish
  console.log('\n--- 5B. Tangalar yetarli bo\'lmagan holatni sinash ---');
  // Student tangasini kamaytiramiz (10 tanga qilamiz)
  await prisma.user.update({ where: { id: student.id }, data: { coins: 10 } });
  {
    const { req, res, next, getData, getStatus } = mockReqRes({
      user: studentUserPayload,
      body: { itemId: 'item-stationery-set' } // narxi 60 tanga, talabada 10 tanga
    });
    await purchaseShopItem(req, res, next);
    const data = getData();
    console.log('Status:', getStatus());
    console.log('Javob (kam tanga bo\'lganda):', data?.message || data?.error || data);
    if (getStatus() === 400) {
      console.log('✅ NATIJA: Tangalar yetarli bo\'lmaganda to\'g\'ri 400 xatolik qaytarildi!');
    } else {
      console.error('❌ XATOLIK: Tangalar yetarli bo\'lmaganda to\'xtatilmadi!');
    }
  }

  console.log('\n================================================================');
  console.log(' 6-QADAM: Talaba to\'liq profili va tarixi (getStudentHistory)');
  console.log('================================================================');

  {
    const { req, res, next, getData, getStatus } = mockReqRes({
      params: { id: student.id },
      user: { userId: student.id, role: 'student', centerId: center.id }
    });
    await getStudentHistory(req, res, next);
    const data = getData();
    console.log('getStudentHistory Status:', getStatus());
    console.log('Talaba tangalar va faoliyat tarixi (coinHistory):');
    const history = data?.data?.coinHistory || [];
    console.log('Jami operatsiyalar soni:', history.length);
    history.forEach((h, idx) => {
      console.log(`  ${idx + 1}. [${h.type}] ${h.title} | Tangalar: ${h.coins} | XP: ${h.xp} | Status: ${h.status}`);
    });
  }

  console.log('\n================================================================');
  console.log(' SIMULYATSIYA YAKUNLANDI');
  console.log('================================================================\n');
}

runSimulator()
  .catch(err => {
    console.error('FATAL ERROR IN SIMULATOR:', err);
  })
  .finally(() => {
    prisma.$disconnect();
  });
