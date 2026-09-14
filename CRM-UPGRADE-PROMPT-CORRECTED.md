# ABDORA AI — TO'LIQ CRM'GA YETKAZISH (TO'G'IRLANGAN PROMPT)

> Bu hujjat asl "CRM + ERP + LMS Upgrade" promptining **tekshirilgan va to'g'irlangan** versiyasi.
> Original prompt 67 bo'limdan iborat butun korporativ ERP+LMS+HR+Marketing platformasini
> bir sessiyada "avtonom" qurishni so'ragan — bu real emas va aksariyati "CRM" talabiga
> aloqasi yo'q. Quyida **haqiqiy koddan tekshirilgan** holat va **CRM'ga aniq yo'naltirilgan**
> real reja berilgan.

---

## 0. ENG MUHIM TUZATISH

Original prompt "hamma narsani qur, savol berma" deydi. Bu **noto'g'ri yondashuv**:

* Bu — **jonli production loyiha**, haqiqiy foydalanuvchilar va ma'lumotlar bor.
* Har bir o'zgarish **avval koddan tasdiqlanishi**, keyin build/test qilinishi kerak.
* Bitta sessiyada 40+ sahifa, 10+ yangi model, to'liq ERP+HR+Marketing qurish — bu
  **mumkin emas** va urinish loyihani buzish xavfini oshiradi.
* To'g'ri yondashuv: **kichik, tekshiriladigan bosqichlar**, har birida build + funksional
  tekshiruv, GitHub'ga push.

---

## 1. HAQIQIY HOLAT (koddan tasdiqlangan, 2026-yil sentyabr)

### Nima ALLAQACHON bor (qayta yaratma!)

**Ma'lumotlar bazasi (Prisma modellari):**
`Center, User, Group, Branch, Lesson, LessonMedia, Homework, Submission, Test, Question, Result, Attendance, Notification, AIChat, UploadedFile, Resource, Payment, Lead, Expense, Application`

**Lead (CRM yadrosi) — kutilganidan yaxshi:**
* Status pipeline allaqachon bor: `new -> contacted -> trial -> enrolled -> frozen -> archived -> lost`
* `source` (instagram/telegram/referral/walkin/landing/other)
* `studentId` — lead o'quvchiga aylantirilganda bog'lanish saqlanadi (conversion tracking bor!)
* `closedAt`/`closeReason` — yopilgan lidlar tarixi
* Backend: `lead.controller.js`, to'liq CRUD + statistika (`/leads/stats`)
* Frontend: `ManagerLeads.jsx` — **jadval (table) ko'rinishida**, Kanban EMAS

**Moliya/ERP asosi bor:**
* `Payment`, `Expense` modellari, `finance.controller.js`
* Frontend: FinanceDashboard, FinanceExpenses, FinancePayroll, ManagerPayments, ReceptionPayments
* Oylik hisobot, guruh bo'yicha daromad, ish haqi hisoblash — ishlaydi

**Ta'lim boshqaruvi to'liq:**
* Lesson (AI generatsiya, PDF/hujjatdan o'qib yaratish), Homework, Test/Question/Result,
  Attendance — barchasi ishlaydi

**Ko'p filial/markaz arxitekturasi ishlaydi va xavfsiz:**
* `Center -> Branch -> User/Group` ierarxiyasi
* `getOwnBranchIds()`, `getCenterId()` orqali scope qilingan — bitta markaz boshqasining
  ma'lumotini ko'ra olmaydi (bu ko'p marta test qilingan va tuzatilgan)

**Qayta ishlatiladigan UI komponentlar (hammasi bor, original prompt to'g'ri aytgan):**
`StatCard, ChartCard, PageHeader, StatusBadge, SearchInput, ThemeBuilder,
BranchLocationPicker, ConfirmDialog, Loader, Skeleton, EmptyState, ErrorState,
MobileBottomNav`

**Theme tizimi:**
* Light/Dark rejim bor, `ThemeBuilder.jsx` orqali `primaryColor`/`secondaryColor`/
  `accentColor`/`background` moslashtirish **allaqachon ishlaydi**

**Tillar:** `locales/{uz,ru,en}/translation.json` — uchala til ham bor, `react-i18next`

**Gamifikatsiya:** XP, coins, level, streak — o'quvchi tomonida ishlaydi

**Rollar:** admin, manager, reception, teacher, student — har biri o'z sahifalariga ega,
mobil pastki navigatsiya (`MobileBottomNav.jsx`) bor

### Nima YO'Q (koddan tasdiqlangan — bular haqiqiy bo'shliqlar)

* **Lead Kanban ko'rinishi** — faqat jadval bor
* **Lead activity/communication tarixi** — qo'ng'iroq, xabar, eslatma jurnali yo'q
  (faqat bitta `note` maydoni bor, tarix emas)
* **CRM Task/follow-up eslatmalari** — "3 kundan keyin qo'ng'iroq qil" kabi vazifa tizimi yo'q
* **Parent (ota-ona) modeli va portali** — umuman yo'q
* **Course (kurs) modeli** — yo'q, `Group` bevosita fan/narxni o'z ichiga oladi
* **Campaign/Marketing tracking** — yo'q
* **Granular Permission/RolePermission tizimi** — faqat rol enum bor, "kim nima qila oladi"
  matritsasi yo'q
* **Audit Log** — kim nimani o'zgartirgani haqida yozuv yo'q
* **Global qidiruv / Ctrl+K command palette** — yo'q
* **AI Insights bo'limi** (bosh sahifada "3 ta guruhda davomat pasaygan" kabi avtomatik
  xulosalar) — yo'q, lekin AI dars generatsiyasi allaqachon ishlaydi (asos bor)

---

## 2. "TO'LIQ CRM" NIMANI ANGLATADI — ANIQ TA'RIF

Foydalanuvchi "CRM nomini bajara oladigan darajada" deb so'ragan. Bu quyidagini anglatadi
(sanoat standarti bo'yicha CRM'ning **majburiy** tarkibiy qismlari):

1. Lead/mijoz ma'lumotlari — **bor**
2. Pipeline/status boshqaruvi — **bor** (lekin faqat jadval, Kanban yo'q)
3. **Aloqa tarixi** (har bir qo'ng'iroq/xabar/uchrashuv yozuvi) — **yo'q, kerak**
4. **Follow-up/eslatma vazifalari** (kim, qachon, nima qilishi kerak) — **yo'q, kerak**
5. Lead -> mijoz konversiyasi — **bor**
6. Manba/konversiya tahlili — qisman bor (source maydoni bor, lekin campaign-darajasida
   tahlil yo'q)
7. **Kanban vizual pipeline** — **yo'q, kuchli tavsiya etiladi** (CRM'ning eng ko'rinadigan
   xususiyati)

**Xulosa:** Abdora AI'da CRM'ning **yadrosi** (ma'lumot + status) bor, lekin **jarayonni
boshqarish qatlami** (aloqa tarixi, vazifalar, Kanban) yetishmayapti. Shu 3 narsa qo'shilsa,
bu haqiqatan ham to'liq CRM deb atalishi mumkin.

---

## 3. REAL BOSQICHLAR (faqat CRM'ga tegishli, bajarilishi mumkin bo'lgan)

### BOSQICH 1 — Lead Activity (aloqa tarixi) — ENG MUHIM

**Backend:**
* Yangi Prisma modeli: `LeadActivity`
  ```prisma
  model LeadActivity {
    id        String   @id @default(cuid())
    leadId    String
    lead      Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
    type      String   // call | message | meeting | note | status_change
    text      String?
    createdBy String
    creator   User     @relation(fields: [createdBy], references: [id])
    createdAt DateTime @default(now())
  }
  ```
* `Lead` modeliga `activities LeadActivity[]` qo'sh
* `db.js`dagi custom migratsiyaga `CREATE TABLE IF NOT EXISTS "LeadActivity" (...)` qo'sh
  (loyiha shu naqshni ishlatadi — `prisma db push` emas)
* Yangi endpointlar: `POST /leads/:id/activities`, `GET /leads/:id/activities`
* Lead status o'zgarganda avtomatik `type: 'status_change'` activity yoziladigan qilib
  `updateLead`ni yangila

**Frontend:**
* `ManagerLeads.jsx`dagi lead detali/modaliga "Tarix" (Activity timeline) bo'limini qo'sh
* Har bir activity: ikon (qo'ng'iroq/xabar/eslatma turi bo'yicha), matn, vaqt, kim qo'shgani

### BOSQICH 2 — Follow-up vazifalari

**Backend:**
* `Lead` modeliga `nextFollowUp DateTime?` maydoni qo'sh (yangi jadval shart emas — oddiy)
* Yoki to'liqroq: `CRMTask` modeli (agar kelajakda umumiy vazifa tizimi kerak bo'lsa)
* `GET /leads?followUpDue=true` — muddati kelgan follow-up'larni qaytaradigan filter

**Frontend:**
* Lead formaga "Keyingi aloqa sanasi" maydoni
* Dashboard'da "Bugun aloqa qilish kerak bo'lgan lidlar" widget'i (StatCard + ro'yxat)

### BOSQICH 3 — Kanban ko'rinishi

**Frontend (faqat frontend, backend allaqachon status'larni qo'llab-quvvatlaydi):**
* `ManagerLeads.jsx`ga "Jadval / Kanban" almashtirish tugmasi qo'sh
* Kanban: har status uchun ustun (`new, contacted, trial, enrolled, frozen, archived, lost`),
  drag-and-drop bilan status o'zgartirish (`@dnd-kit/core` kutubxonasini qo'sh — yengil,
  ishonchli)
* Har kartochka: ism, telefon, manba, oxirgi aloqa sanasi

### BOSQICH 4 (ixtiyoriy, keyingi) — AI Insights

* Bosh sahifaga (Manager/Admin) "AI xulosalari" kartasi: mavjud statistika (`/admin/stats`,
  `/leads/stats`, `/finance/summary`) asosida, **haqiqiy ma'lumotdan**, oddiy qoidalar bilan
  (masalan "5 ta lead follow-up kutmoqda", "bu oy daromad o'tgan oyga nisbatan X% oshgan")
  — hech qanday raqamni **o'ylab topmaslik**, faqat mavjud API javoblaridan hisoblash

---

## 4. NIMA QILINMASLIGI KERAK (original promptdagi xato yo'nalishlar)

* Parent portali, Campaign/Marketing moduli, Payroll/Accounting qayta qurish — булар
  CRM talabiga aloqasi yo'q, alohida, kelajakdagi so'rov bo'lishi kerak
* Yangi logotip yoki fox xarakter yaratish — logotip allaqachon to'g'ri joylashtirilgan
  (`public/brand/logo-icon.png`), original prompt ham buni tasdiqlaydi, tegma
* Butun theme tizimini qayta yozish — `ThemeBuilder.jsx` allaqachon ishlaydi, faqat
  kerak bo'lsa kengaytirish mumkin
* Granular Permission/RolePermission, Audit Log — bular real, foydali, lekin **CRM**
  talabiga emas, **xavfsizlik/boshqaruv** talabiga tegishli — alohida loyiha sifatida
  ko'rib chiqilsin
* "10,000+ student, 100+ filial" performance optimizatsiyasi — hozirgi hajmda ustuvor
  emas, keyinroq real ehtiyoj paydo bo'lganda qilinsin

---

## 5. AVTONOM BAJARISH QOIDALARI (to'g'irlangan)

Original promptning "savol berma, hammasini o'zing hal qil" tamoyili **to'g'ri**, lekin
quyidagi cheklovlar bilan:

* Har bir bosqichdan keyin **build qilib** (`npm run build`) xatosiz ekanini tasdiqla
* Backend schema o'zgarishini **ikkala joyga** qo'sh: `prisma/schema.prisma` VA
  `bialogiya_beakent/src/config/db.js`dagi `runMigrations()` (loyihaning haqiqiy
  migratsiya mexanizmi shu)
* `render.yaml` fayliga **hech qachon** tegma (u qo'lda boshqariladi, maxfiy ma'lumotlar
  bilan bog'liq xatolar tarixi bor)
* Har bir bosqichni alohida commit qilib push qil — hammasini bitta ulkan commit'da
  qilma
* Mavjud rol-scope xavfsizligini (`getOwnBranchIds`, `getCenterId`) **buzma** — yangi
  har qanday endpoint shu naqshdan foydalansin

---

## 6. XULOSA

Abdora AI'ni "to'liq CRM" deb atash uchun kerak bo'lgan narsa — 67 bo'limli ERP+LMS+HR+
Marketing emas, balki **3 ta aniq, bajarilishi mumkin bosqich**: Lead aloqa tarixi,
follow-up vazifalari, va Kanban ko'rinishi. Bularning barchasi mavjud `Lead` modeli va
`ManagerLeads.jsx` ustiga qurilishi mumkin, hech narsani buzmasdan.
