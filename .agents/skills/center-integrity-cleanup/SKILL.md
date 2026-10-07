---
name: center-integrity-cleanup
description: Multi-tenant ta'lim tizimida o'quv markaz (Center) o'chirilganda barcha bog'langan foydalanuvchilar (User), filiallar (Branch), guruhlar (Group) va bog'liq ma'lumotlarni to'liq kaskadli tozalash (cascade delete), orphaned hisoblarni aniqlash hamda o'chirilgan akkauntlar uchun tizimga kirishni (login) "Bu account ma'lumotlari yo'q" xabari bilan to'liq cheklash bo'yicha ko'rsatma.
---

# Multi-Tenant Markazlar va Foydalanuvchilar Yaxlitligi Qo'llanmasi (Center Integrity & Cascade Cleanup)

Ushbu skill Abdora AI platformasida o'quv markazlari (Center) o'chirilganda ma'lumotlar bazasi yaxlitligini (Data Integrity) saqlash, yetim (orphaned) hisoblar paydo bo'lishining oldini olish va o'chirilgan/nofaol markaz foydalanuvchilarining tizimga kirishini to'liq to'sish tartibini belgilaydi.

---

## 1. Asosiy Qoidalar (Core Rules)

1. **Kaskadli Tozalash (Cascade Deletion):**
   - Agar Super Admin o'quv markazni (Center) o'chirsa, ushbu markazga tegishli barcha foydalanuvchilar (`manager`, `teacher`, `student`, `reception`) ham bazadan butunlay o'chirilishi yoki to'liq nofaollashtirilishi shart.
   - Hech bir foydalanuvchi "egasi yo'q" (orphaned) holatda qolib ketmasligi kerak.
   - Markazga tegishli filiallar (`Branch`), guruhlar (`Group`), xonalar (`Room`), darslar (`Lesson`), to'lovlar (`Payment`) va boshqa barcha bog'liq yozuvlar tartib bilan kaskadli o'chiriladi.

2. **Autentifikatsiya va Kirishni Cheklash (Auth & Login Guard):**
   - O'chirilgan foydalanuvchi tizimga kirishga (`POST /auth/login`) uringanda, tizim unga kirishga ruxsat bermasligi kerak.
   - Xato xabari aniq va tushunarli bo'lishi lozim:
     `"Bu account ma'lumotlari yo'q"` (yoki `"Bu hisob ma'lumotlari topilmadi"`).
   - Nofaol qilingan markaz foydalanuvchisi (agar ma'lumotlar arxivlangan bo'lsa ham) kirishga uringanda, markazning `isActive === false` ekanligi tekshirilib, darhol to'xtatilishi shart.

3. **Jonli Sessiyalarni Bekor Qilish (Session Invalidation):**
   - Markaz o'chirilishi bilanoq, unga tegishli barcha foydalanuvchilarning faol tokenlari (`refreshTokenHash`) bekor qilinadi.
   - `verifyToken` middleware har bir so'rovda foydalanuvchining markazi faolligini tekshiradi, agar markaz o'chirilgan bo'lsa, foydalanuvchi darhol tizimdan chiqarib yuboriladi.

---

## 2. Kaskadli O'chirish Tartibi (Prisma Transaction)

O'quv markazni o'chirishda chet el kalitlari (Foreign Key Constraints) xatosi yuz bermasligi uchun o'chirish quyidagi ketma-ketlikda tranzaksiya ichida amalga oshiriladi:

```javascript
await prisma.$transaction(async (tx) => {
  // 1. Markazning barcha filial va guruh identifikatorlarini yig'ish
  const branches = await tx.branch.findMany({ where: { centerId }, select: { id: true } });
  const bIds = branches.map(b => b.id);

  const groups = await tx.group.findMany({
    where: { OR: [{ centerId }, { branchId: { in: bIds } }] },
    select: { id: true },
  });
  const gIds = groups.map(g => g.id);

  // 2. Markazga tegishli barcha foydalanuvchilarni topish
  const users = await tx.user.findMany({
    where: {
      OR: [
        { centerId },
        { branchId: { in: bIds } },
        { groupId: { in: gIds } },
        { taughtGroups: { some: { id: { in: gIds } } } },
      ],
    },
    select: { id: true },
  });
  const uIds = users.map(u => u.id);

  // 3. Aloqador bolalar jadvallarini o'chirish
  // - Lidlar va faoliyatlar (LeadActivity, Lead)
  // - Topshiriqlar va natijalar (Submission, Result)
  // - Davomat (Attendance)
  // - Uy vazifalari, testlar va darslar (Homework, Test, Lesson)
  // - Moliya (Payment, Expense)
  // - Chatlar, xabarnomalar, resurslar, fayllar va xonalar

  // 4. Siklik (circular) va o'zaro bog'lanishlarni bo'shatish
  if (uIds.length > 0) {
    await tx.user.updateMany({
      where: { id: { in: uIds } },
      data: { teacherId: null, groupId: null, branchId: null, centerId: null, isActive: false },
    });
  }
  if (gIds.length > 0) {
    await tx.group.updateMany({
      where: { id: { in: gIds } },
      data: { branchId: null, centerId: null },
    });
  }
  if (bIds.length > 0) {
    await tx.branch.updateMany({
      where: { id: { in: bIds } },
      data: { managerId: null, receptionId: null, centerId: null },
    });
  }

  // 5. Guruhlar, filiallar, foydalanuvchilar va markazning o'zini o'chirish
  if (gIds.length > 0) await tx.group.deleteMany({ where: { id: { in: gIds } } });
  if (bIds.length > 0) await tx.branch.deleteMany({ where: { id: { in: bIds } } });
  if (uIds.length > 0) await tx.user.deleteMany({ where: { id: { in: uIds } } });
  await tx.center.delete({ where: { id: centerId } });
});
```

---

## 3. Kirish (Login) Tekshiruvi Qo'llanmasi

`POST /auth/login` kontrollerida quyidagi tekshiruvlar qat'iy bajarilishi shart:

1. Foydalanuvchi bazada topilmasa yoki `isActive === false` bo'lsa:
   `return error(res, "Bu account ma'lumotlari yo'q", 401);`

2. Foydalanuvchining markazi (`user.centerId` yoki `user.branch.centerId`) nofaol/o'chirilgan bo'lsa:
   `return error(res, "Bu account ma'lumotlari yo'q", 401);`

3. Parol mos kelmasa:
   `return error(res, "Bu account ma'lumotlari yo'q", 401);`

---

## 4. Yangi Modul Qo'shilganda Nazorat Ro'yxati (Checklist)

- [ ] Yangi modelda `centerId` yoki `branchId` mavjudmi?
- [ ] O'quv markaz o'chirilganda ushbu yangi model tozalanishi tranzaksiyaga kiritilganmi?
- [ ] Kirish so'rovlarida foydalanuvchining markaz maqomi tekshiriladimi?
- [ ] Foydalanuvchi interfeysida xatolik aniq `"Bu account ma'lumotlari yo'q"` sifatida ko'rinadimi?
