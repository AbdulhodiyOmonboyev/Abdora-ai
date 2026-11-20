const { prisma } = require('../src/config/db');
const { createLead, convertLead } = require('../src/controllers/lead.controller');
const { markPayment, getPaymentById, getDebtors } = require('../src/controllers/payment.controller');

// Helper to mock Express req, res, next
function mockReqRes(reqData = {}) {
  let statusCode = 200;
  let responseData = null;
  let nextCalled = false;
  let nextError = null;

  const req = {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: {},
    ...reqData,
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    send(data) {
      responseData = data;
      return this;
    },
  };

  const next = (err) => {
    nextCalled = true;
    nextError = err;
  };

  return {
    req,
    res,
    next,
    getStatus: () => statusCode,
    getData: () => responseData,
    getNextCalled: () => nextCalled,
    getNextError: () => nextError,
  };
}

async function runLiveReceptionSimulation() {
  console.log('=== [RECEPTION & SALES JONLI TEST SIMULYATORI] BOSHLANDI ===\n');

  const timestamp = Date.now();
  let testCenter = null;
  let testBranch = null;
  let receptionUser = null;
  let teacherUser = null;
  let testGroup = null;
  let unpaidStudent = null;
  let leadId = null;
  let studentId = null;
  let paymentId = null;

  try {
    // 0. Setup Center, Branch, Users, Group
    console.log('--- 0. TIZIMNI SOZLASH (Center, Branch, Reception, Teacher, Group) ---');
    testCenter = await prisma.center.create({
      data: {
        name: `Test O'quv Markaz ${timestamp}`,
        settings: {
          receptionPermissions: {
            canManageLeads: true,
            canManagePayments: true,
            canViewFinance: false,
            canViewCashbox: false,
          },
        },
      },
    });
    console.log(`[+] Markaz yaratildi: ID=${testCenter.id}, Name=${testCenter.name}`);

    // Create branch with receptionId initially null to check how branchScope behaves
    testBranch = await prisma.branch.create({
      data: {
        name: `Chilonzor Filiali ${timestamp}`,
        centerId: testCenter.id,
      },
    });
    console.log(`[+] Filial yaratildi: ID=${testBranch.id}, Name=${testBranch.name}`);

    // Create reception user
    receptionUser = await prisma.user.create({
      data: {
        name: `Aziza Reception ${timestamp}`,
        username: `reception_${timestamp}`,
        passwordHash: 'dummyhash',
        role: 'reception',
        centerId: testCenter.id,
        branchId: testBranch.id,
        phone: '+998901112233',
        permissions: {
          canManageLeads: true,
          canManagePayments: true,
        },
      },
    });
    console.log(`[+] Qabulxona xodimi yaratildi: ID=${receptionUser.id}, Username=${receptionUser.username}`);

    // Create teacher
    teacherUser = await prisma.user.create({
      data: {
        name: `Botir Ustoz ${timestamp}`,
        username: `teacher_${timestamp}`,
        passwordHash: 'dummyhash',
        role: 'teacher',
        centerId: testCenter.id,
        branchId: testBranch.id,
        phone: '+998909998877',
      },
    });
    console.log(`[+] O'qituvchi yaratildi: ID=${teacherUser.id}, Name=${teacherUser.name}`);

    // Create group (monthlyFee: 500,000 UZS)
    testGroup = await prisma.group.create({
      data: {
        name: `Biologiya Intensive ${timestamp}`,
        teacherId: teacherUser.id,
        branchId: testBranch.id,
        centerId: testCenter.id,
        monthlyFee: 500000,
        subject: 'biologiya',
        isActive: true,
      },
    });
    console.log(`[+] Guruh yaratildi: ID=${testGroup.id}, Name=${testGroup.name}, Fee=${testGroup.monthlyFee} so'm`);

    // Create an unpaid student in the same group to test debt detection
    unpaidStudent = await prisma.user.create({
      data: {
        name: `Qarzdor Talaba ${timestamp}`,
        username: `debtor_${timestamp}`,
        passwordHash: 'dummyhash',
        role: 'student',
        groupId: testGroup.id,
        branchId: testBranch.id,
        centerId: testCenter.id,
        phone: '+998907776655',
      },
    });
    console.log(`[+] Guruhga sinov uchun to'lamaydigan talaba qo'shildi: ID=${unpaidStudent.id}, Name=${unpaidStudent.name}\n`);

    // Common reception context for controller requests
    const receptionContext = {
      userId: receptionUser.id,
      id: receptionUser.id,
      role: 'reception',
      centerId: testCenter.id,
      branchId: testBranch.id,
    };

    // -------------------------------------------------------------
    // STEP 1: Yangi Lid yarating (lead.controller.js -> createLead)
    // -------------------------------------------------------------
    console.log('--- 1. YANGI LID YARATISH (createLead) ---');
    const leadPayload = {
      name: `Jasur Aliyev ${timestamp}`,
      phone: '+998901234567',
      source: 'telegram',
      interestedIn: 'Biologiya Intensive',
      note: 'Dushanba kuni sinov darsiga kelmoqchi',
      branchId: testBranch.id,
      status: 'new',
    };

    const mockCreateLead = mockReqRes({
      user: receptionContext,
      body: leadPayload,
    });

    await createLead(mockCreateLead.req, mockCreateLead.res, mockCreateLead.next);

    if (mockCreateLead.getNextCalled() && mockCreateLead.getNextError()) {
      throw new Error(`createLead xatosi: ${mockCreateLead.getNextError().message}`);
    }

    const createLeadRes = mockCreateLead.getData();
    console.log('Status code:', mockCreateLead.getStatus());
    console.log('Response:', JSON.stringify(createLeadRes, null, 2));

    if (!createLeadRes?.success || !createLeadRes?.data?.id) {
      throw new Error(`Lid yaratilmadi! Javob: ${JSON.stringify(createLeadRes)}`);
    }

    leadId = createLeadRes.data.id;
    console.log(`[OK] Lid muvaffaqiyatli yaratildi! Lead ID: ${leadId}\n`);

    // -------------------------------------------------------------
    // STEP 2: Lidni o'quvchiga aylantiring (convertLead)
    // -------------------------------------------------------------
    console.log('--- 2. LIDNI O\'QUVCHIGA AYLANTIRISH (convertLead) ---');
    const mockConvertLead = mockReqRes({
      user: receptionContext,
      params: { id: leadId },
      body: {
        groupId: testGroup.id,
        startDate: new Date().toISOString(),
      },
    });

    await convertLead(mockConvertLead.req, mockConvertLead.res, mockConvertLead.next);

    if (mockConvertLead.getNextCalled() && mockConvertLead.getNextError()) {
      throw new Error(`convertLead xatosi: ${mockConvertLead.getNextError().message}`);
    }

    const convertRes = mockConvertLead.getData();
    console.log('Status code:', mockConvertLead.getStatus());
    console.log('Response:', JSON.stringify(convertRes, null, 2));

    if (!convertRes?.success || !convertRes?.data?.student?.id) {
      throw new Error(`Lid talabaga aylantirilmadi! Javob: ${JSON.stringify(convertRes)}`);
    }

    studentId = convertRes.data.student.id;
    const generatedUsername = convertRes.data.credentials?.username;
    const generatedPassword = convertRes.data.credentials?.password;
    console.log(`[OK] Talaba yaratildi: Student ID=${studentId}`);
    console.log(`[OK] Login generatsiya qilindi: Username=${generatedUsername}, Password=${generatedPassword}`);

    // DB tekshiruvi: Lid statusi 'enrolled' bo'ldimi?
    const updatedLead = await prisma.lead.findUnique({ where: { id: leadId } });
    console.log(`[DB TEKSHIRUV] Lid statusi: ${updatedLead.status}, studentId: ${updatedLead.studentId}, closedAt: ${updatedLead.closedAt}`);

    // DB tekshiruvi: Student modelida teacherId bormi yoki null qolganmi?
    const studentInDb = await prisma.user.findUnique({ where: { id: studentId } });
    console.log(`[DB TEKSHIRUV] Student user: groupId=${studentInDb.groupId}, teacherId=${studentInDb.teacherId}, centerId=${studentInDb.centerId}, branchId=${studentInDb.branchId}\n`);

    // -------------------------------------------------------------
    // STEP 3: O'quvchi uchun to'lov qabul qiling (markPayment: 500,000 so'm)
    // -------------------------------------------------------------
    console.log('--- 3. O\'QUVCHI UCHUN TO\'LOV QABUL QILISH (markPayment: 500,000 so\'m) ---');
    const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-11"

    const mockPayment = mockReqRes({
      user: receptionContext,
      body: {
        studentId: studentId,
        month: currentMonth,
        amount: 500000,
        expectedAmount: 500000,
        method: 'cash',
        note: 'Qabulxonada naqd to\'landi',
      },
    });

    await markPayment(mockPayment.req, mockPayment.res, mockPayment.next);

    if (mockPayment.getNextCalled() && mockPayment.getNextError()) {
      throw new Error(`markPayment xatosi: ${mockPayment.getNextError().message}`);
    }

    const paymentRes = mockPayment.getData();
    console.log('Status code:', mockPayment.getStatus());
    console.log('Response:', JSON.stringify(paymentRes, null, 2));

    if (!paymentRes?.success || !paymentRes?.data?.id) {
      throw new Error(`To'lov saqlanmadi! Javob: ${JSON.stringify(paymentRes)}`);
    }

    paymentId = paymentRes.data.id;
    console.log(`[OK] To'lov qabul qilindi! Payment ID: ${paymentId}`);
    console.log(`[OK] Payment ma'lumotlari: status=${paymentRes.data.status}, amount=${paymentRes.data.amount}, isPaid=${paymentRes.data.isPaid}, teacherId=${paymentRes.data.teacherId}\n`);

    // -------------------------------------------------------------
    // STEP 4: Yangi qo'shilgan GET /payments/:id (getPaymentById) ni chaqirish
    // -------------------------------------------------------------
    console.log('--- 4. GET /payments/:id (getPaymentById) KVITANSIYA TEKSHIRUVI ---');
    const mockGetPayment = mockReqRes({
      user: receptionContext,
      params: { id: paymentId },
    });

    await getPaymentById(mockGetPayment.req, mockGetPayment.res, mockGetPayment.next);

    if (mockGetPayment.getNextCalled() && mockGetPayment.getNextError()) {
      throw new Error(`getPaymentById xatosi: ${mockGetPayment.getNextError().message}`);
    }

    const receiptRes = mockGetPayment.getData();
    console.log('Status code:', mockGetPayment.getStatus());
    console.log('Response:', JSON.stringify(receiptRes, null, 2));

    const receiptData = receiptRes?.data;
    console.log('\n--- KVITANSIYA MAYDONLARI TEKSHIRUVI ---');
    console.log(`- receiptNumber: "${receiptData?.receiptNumber}" (Kutilgan: payment ID ning oxirgi 6 belgisi bosh harflarda: "${paymentId.slice(-6).toUpperCase()}") -> ${receiptData?.receiptNumber === paymentId.slice(-6).toUpperCase() ? 'TO\'G\'RI' : 'XATO'}`);
    console.log(`- student:`, receiptData?.student);
    console.log(`  student.id: ${receiptData?.student?.id === studentId ? 'TO\'G\'RI' : 'XATO'}`);
    console.log(`  student.name: "${receiptData?.student?.name}"`);
    console.log(`  student.phone: "${receiptData?.student?.phone}"`);
    console.log(`- group:`, receiptData?.group);
    console.log(`  group.id: ${receiptData?.group?.id === testGroup.id ? 'TO\'G\'RI' : 'XATO'}`);
    console.log(`  group.name: "${receiptData?.group?.name}"`);
    console.log(`- amount: ${receiptData?.amount} (Kutilgan: 500000) -> ${receiptData?.amount === 500000 ? 'TO\'G\'RI' : 'XATO'}`);
    console.log(`- method: "${receiptData?.method}"`);
    console.log(`- paidAt: "${receiptData?.paidAt}"\n`);

    // 4b. Xavfsizlik & Ruxsatlar tekshiruvi: Begona markaz qabulxonasi ko'ra olmasligi kerak!
    console.log('--- 4b. GET /payments/:id XAVFSIZLIK VA RUXSATLAR TEKSHIRUVI ---');
    const foreignReceptionContext = {
      userId: 'foreign_reception_id',
      id: 'foreign_reception_id',
      role: 'reception',
      centerId: 'foreign_center_id',
    };
    const mockForbiddenGet = mockReqRes({
      user: foreignReceptionContext,
      params: { id: paymentId },
    });
    await getPaymentById(mockForbiddenGet.req, mockForbiddenGet.res, mockForbiddenGet.next);
    console.log(`Begona markaz so'rovi kodi: ${mockForbiddenGet.getStatus()} (Kutilgan: 403 Forbidden)`);
    console.log(`Begona markaz javobi:`, mockForbiddenGet.getData());

    // -------------------------------------------------------------
    // STEP 5: Qarzdorlar ro'yxatini (getDebtors) tekshiring
    // -------------------------------------------------------------
    console.log('\n--- 5. QARZDORLAR RO\'YXATINI TEKSHIRISH (getDebtors) ---');
    
    // Test A: Receptionist so'rovi (Hozirgi branchScope: receptionId orqali)
    console.log('-> Sinov A: Hozirgi holatda (branch.receptionId hali bog\'lanmagan, faqat user.branchId bor):');
    const mockDebtorsA = mockReqRes({
      user: receptionContext,
      query: { month: currentMonth },
    });
    await getDebtors(mockDebtorsA.req, mockDebtorsA.res, mockDebtorsA.next);
    const debtorsResA = mockDebtorsA.getData();
    console.log('Sinov A Status:', mockDebtorsA.getStatus());
    console.log(`Sinov A Qarzdorlar soni: ${debtorsResA?.data?.count}, totalDebt: ${debtorsResA?.data?.totalDebt}`);
    console.log('Sinov A Natija:', JSON.stringify(debtorsResA?.data?.debtors, null, 2));

    // Test B: Admin so'rovi bilan tekshirish (haqiqiy holatni ko'rish uchun)
    console.log('\n-> Sinov B: Admin roli orqali haqiqiy umumiy qarzdorlar ro\'yxati:');
    const adminContext = {
      userId: 'admin_test_id',
      id: 'admin_test_id',
      role: 'admin',
      centerId: testCenter.id,
    };
    const mockDebtorsB = mockReqRes({
      user: adminContext,
      query: { month: currentMonth },
    });
    await getDebtors(mockDebtorsB.req, mockDebtorsB.res, mockDebtorsB.next);
    const debtorsResB = mockDebtorsB.getData();
    console.log('Sinov B Status:', mockDebtorsB.getStatus());
    console.log(`Sinov B Qarzdorlar soni: ${debtorsResB?.data?.count}, totalDebt: ${debtorsResB?.data?.totalDebt}`);
    console.log('Sinov B Qarzdorlar:', JSON.stringify(debtorsResB?.data?.debtors, null, 2));

    // Test C: branch.receptionId ni receptionUser.id ga bog'lagandan keyin
    console.log('\n-> Sinov C: Filialga receptionId biriktirilgandan so\'ng (branch.receptionId = receptionUser.id):');
    await prisma.branch.update({
      where: { id: testBranch.id },
      data: { receptionId: receptionUser.id },
    });
    const mockDebtorsC = mockReqRes({
      user: receptionContext,
      query: { month: currentMonth },
    });
    await getDebtors(mockDebtorsC.req, mockDebtorsC.res, mockDebtorsC.next);
    const debtorsResC = mockDebtorsC.getData();
    console.log('Sinov C Status:', mockDebtorsC.getStatus());
    console.log(`Sinov C Qarzdorlar soni: ${debtorsResC?.data?.count}, totalDebt: ${debtorsResC?.data?.totalDebt}`);
    console.log('Sinov C Qarzdorlar:', JSON.stringify(debtorsResC?.data?.debtors, null, 2));

    console.log('\n=== [TEST YAKUNLANDI: BARCHA BOSQICHLAR MUVAFFAQIYATLI BAJARILDI] ===');
  } catch (err) {
    console.error('\n[XATOLIK YUZ BERDI]:', err);
  } finally {
    // Cleanup created test records
    console.log('\n--- TOZALASH (CLEANUP) ---');
    try {
      if (paymentId) {
        await prisma.payment.deleteMany({ where: { id: paymentId } });
        console.log(`[-] To'lov o'chirildi: ${paymentId}`);
      }
      if (studentId) {
        await prisma.user.deleteMany({ where: { id: studentId } });
        console.log(`[-] Talaba o'chirildi: ${studentId}`);
      }
      if (unpaidStudent) {
        await prisma.user.deleteMany({ where: { id: unpaidStudent.id } });
        console.log(`[-] Qarzdor talaba o'chirildi: ${unpaidStudent.id}`);
      }
      if (leadId) {
        await prisma.lead.deleteMany({ where: { id: leadId } });
        console.log(`[-] Lid o'chirildi: ${leadId}`);
      }
      if (testGroup) {
        await prisma.group.deleteMany({ where: { id: testGroup.id } });
        console.log(`[-] Guruh o'chirildi: ${testGroup.id}`);
      }
      if (receptionUser) {
        await prisma.user.deleteMany({ where: { id: receptionUser.id } });
        console.log(`[-] Reception user o'chirildi: ${receptionUser.id}`);
      }
      if (teacherUser) {
        await prisma.user.deleteMany({ where: { id: teacherUser.id } });
        console.log(`[-] Teacher user o'chirildi: ${teacherUser.id}`);
      }
      if (testBranch) {
        await prisma.branch.deleteMany({ where: { id: testBranch.id } });
        console.log(`[-] Filial o'chirildi: ${testBranch.id}`);
      }
      if (testCenter) {
        await prisma.center.deleteMany({ where: { id: testCenter.id } });
        console.log(`[-] Markaz o'chirildi: ${testCenter.id}`);
      }
      console.log('[OK] Barcha sinov ma\'lumotlari tozalandi.');
    } catch (cleanErr) {
      console.error('[Cleanup xatosi]:', cleanErr.message);
    } finally {
      await prisma.$disconnect();
    }
  }
}

runLiveReceptionSimulation();
