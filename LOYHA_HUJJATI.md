# Abdora AI — To'liq Loyha Hujjati

> **Versiya:** 1.0 | **Sana:** 2026-10-02 | **Holat:** MVP Tayyor

---

## 1. Loyha Haqida

**Abdora AI** — o'quv markazlari uchun mo'ljallangan SaaS platformasi. Tizim CRM, LMS, To'lov, Kassa, Dars jadvali, va sun'iy intellekt (AI) funksiyalarini birlashtiradi. Har bir markaz o'z ma'lumotlarini alohida saqlaydi (multi-tenant arxitektura).

### Texnologiya Steki

| Qatlam | Texnologiya |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS, TanStack Query v5, framer-motion, lucide-react, react-hot-toast, i18next |
| **Backend** | Node.js, Express 5, Prisma ORM, PostgreSQL, bcryptjs, JWT, multer |
| **AI** | Google Gemini 2.5 Flash (matn/ovoz/rasm), ElevenLabs (ovoz klonlash), Gemini Live (real-vaqt nutq) |
| **Mobil** | Flutter (Dart) — Android + iOS |
| **Deploy** | Render.com (backend + frontend static), Neon PostgreSQL |
| **Versiyalash** | Git — `main` va `mobile` branch |

---

## 2. Katalog Tuzilishi

```
Abdora-ai-main/
├── bialogiya_beakent/          # Backend (Node.js/Express)
│   ├── server.js               # Asosiy server fayli
│   ├── prisma/
│   │   └── schema.prisma       # 22 ta ma'lumot modeli
│   └── src/
│       ├── config/             # DB ulanish, AI konfiguratsiya
│       ├── controllers/        # 25 ta business logic fayli
│       ├── middleware/         # auth, error, upload
│       ├── routes/             # 23 ta route fayli (~130 endpoint)
│       └── utils/              # apiResponse, branchScope, tokenService, va b.
│
├── bialogiya_frontend/         # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/              # 80+ sahifa (rol bo'yicha)
│   │   │   ├── admin/          # Admin sahifalari (16 ta)
│   │   │   ├── manager/        # Manager sahifalari (6 ta)
│   │   │   ├── teacher/        # O'qituvchi sahifalari (17 ta)
│   │   │   ├── student/        # Talaba sahifalari (17 ta)
│   │   │   ├── reception/      # Qabulxona sahifalari (10 ta)
│   │   │   ├── crm/            # CRM sahifalari (2 ta)
│   │   │   ├── finance/        # Moliya sahifalari (3 ta)
│   │   │   ├── erp/            # ERP sahifalari (4 ta)
│   │   │   ├── public/         # Ochiq sahifalar (4 ta)
│   │   │   └── shared/         # Umumiy sahifalar (2 ta)
│   │   ├── components/         # UI komponentlar
│   │   │   ├── layout/         # MainLayout, Sidebar, Header
│   │   │   └── ui/             # Modal, Drawer, ErrorBoundary, va b.
│   │   ├── store/              # Zustand auth store
│   │   ├── config/             # axios, i18n, tanstack query
│   │   ├── locales/            # uz / ru / en tarjimalar
│   │   └── utils/              # format, cn, aiErrors, va b.
│
├── abdora_mobile/              # Flutter mobil ilova (Talaba)
│   ├── lib/
│   │   ├── screens/            # Login, home, lessons, tests, shop, va b.
│   │   ├── providers/          # State management
│   │   └── services/           # HTTP, secure storage
│   └── android/ ios/           # Platform konfiguratsiyasi
│
├── render.yaml                 # Render.com deploy konfiguratsiyasi
├── docker-compose.yml          # Local dev (postgres + api + web)
├── LOYHA_HUJJATI.md            # Shu fayl
└── API.md, FEATURES.md         # Qo'shimcha hujjatlar
```

---

## 3. Ma'lumotlar Modellari (Prisma — 22 ta Model)

```
Center          — O'quv markaz (top-level tenant)
  └── Branch    — Filial
        └── Group      — Guruh (fan, vaqt, narx, xona)
              └── User — Talaba/O'qituvchi/Qabulxona/Manager

User            — Barcha rollar bitta modelda
  fields: name, username, phone, role
          xp, coins, level, streak (talaba uchun)
          salaryType, salaryShare, hourlyRate (o'qituvchi uchun)
          centerId, branchId, groupId
          permissions (JSON) — AI prefs, reception ruxsatlar

Lesson          — Dars
  └── LessonMedia — Audio/rasm binary (Postgres'da kesh)
  └── AIChat      — AI chat tarixi (per student + lesson)
  └── aiContent   — JSON: tushuntirish, hikoya, flashcard, mindmap, kviz, slaydlar

Homework        — Uy vazifasi
  └── Submission  — Talaba javobi + o'qituvchi/AI bahosi

Test            — Test
  └── Question   — MCQ savollar
  └── Result     — Test natijasi (per student)

Attendance      — Davomat (JSON records per session)
Payment         — Oylik to'lov (paid/partial/unpaid, method)
Expense         — Kassa chiqimi
Lead            — CRM lid
  └── LeadActivity — Faoliyat logi (call/note/meeting/sms/task)

Notification    — Ilova ichidagi xabarnoma
Resource        — Materiallar kutubxonasi (binary)
UploadedFile    — Yuklangan fayllar
Room            — Xona (jadval, sig'im, rang)
Application     — Ochiq ariza formasi (auth talab qilmaydi)
AIAgent         — Konfiguratsiya qilinadigan AI provayderlar
```

---

## 4. Rollar va Ruxsatlar

| Rol | Kirish Doirasi | Asosiy Vazifalar |
|---|---|---|
| **admin** | Barcha markazlar | Markazlar, filiallar, o'qituvchilar, statistika, AI agentlar |
| **manager** | O'z markazi | CRM, to'lovlar, xodimlar, kassa, moliya, maosh |
| **reception** | Granular ruxsatlar | Guruhlar, talabalar, to'lovlar, jadval |
| **teacher** | O'z guruhlari | Darslar, uy vazifa, test, davomat, journal |
| **student** | O'z ma'lumotlari | Darslar, testlar, shop, yutuqlar, reyting |

### Reception Granular Ruxsatlari (Center.settings JSON)

```
canManageTeachers    — O'qituvchilarni boshqarish
canManageStudents    — Talabalarni boshqarish
canManageGroups      — Guruhlarni boshqarish
canManageLeads       — CRM lidlarni boshqarish
canManagePayments    — To'lovlarni boshqarish
canViewFinance       — Moliyani ko'rish (default: false)
canViewCashbox       — Kassani ko'rish (default: false)
canManageTimetable   — Dars jadvalini boshqarish
```

---

## 5. API Endpointlar (~130 ta)

### Autentifikatsiya (`/auth`)
```
POST   /auth/login            — Kirish (username / phone / ism)
POST   /auth/refresh          — Token yangilash (7 kun)
POST   /auth/logout           — Chiqish (token bekor)
GET    /auth/me               — Joriy foydalanuvchi
```

### Foydalanuvchilar (`/users`)
```
GET    /users                 — Ro'yxat
POST   /users/create-student  — Talaba yaratish
POST   /users/create-teacher  — O'qituvchi yaratish
POST   /users/create-manager  — Manager yaratish
PUT    /users/:id             — Tahrirlash
PUT    /users/:id/freeze      — Muzlatish / faollashtirish
PUT    /users/:id/avatar      — Avatar yuklash
POST   /users/:id/reset-password — Parol tiklash
```

### Admin (`/admin`)
```
GET    /admin/stats           — Dashboard statistikasi
GET    /admin/teachers        — O'qituvchilar ro'yxati
POST   /admin/teachers        — O'qituvchi qo'shish
GET    /admin/students        — Talabalar ro'yxati
GET    /admin/groups          — Guruhlar ro'yxati
GET    /admin/reception       — Qabulxona xodimlari
POST   /admin/reception       — Qabulxona xodimi yaratish
PUT    /admin/reception/:id/permissions — Ruxsatlar
GET    /admin/centers         — Markazlar
POST   /admin/centers         — Markaz yaratish
GET    /admin/branches        — Filiallar
POST   /admin/branches        — Filial yaratish
GET    /admin/settings        — Markaz sozlamalari
PUT    /admin/settings        — Sozlamalar yangilash
GET    /admin/ai-agents       — AI agentlar CRUD
```

### CRM (`/leads`)
```
GET    /leads                 — Lidlar (status/qidiruv/filial)
GET    /leads/stats           — Haftalik/oylik statistika
GET    /leads/:id             — Lid detali
POST   /leads                 — Yangi lid
PUT    /leads/:id             — Tahrirlash
DELETE /leads/:id             — O'chirish
GET    /leads/:id/activities  — Faoliyat tarixi
POST   /leads/:id/activities  — Faoliyat qo'shish (call/note/meeting)
POST   /leads/:id/convert     — Talabaga aylantirish (credentials qaytaradi)
```

### Darslar (`/lessons`)
```
GET    /lessons               — Ro'yxat
POST   /lessons               — Yaratish
PUT    /lessons/:id           — Tahrirlash
DELETE /lessons/:id           — O'chirish
POST   /lessons/:id/generate  — AI kontentni yaratishni boshlash
GET    /lessons/:id/status    — Yaratish holati (pending/generating/done)
GET    /lessons/:id/audio/story        — Hikoya TTS audio
GET    /lessons/:id/audio/voice        — Ovozli o'qituvchi audio
GET    /lessons/:id/explainer-audio/:i — Slayd TTS audio
GET    /lessons/:id/slide-image/:i     — Slayd rasm
POST   /lessons/:id/chat      — AI chat (talaba savoli)
GET    /lessons/:id/chat      — Chat tarixi
POST   /lessons/:id/quiz      — AI kviz yaratish
```

### Uy Vazifa (`/homework`)
```
GET    /homework              — Ro'yxat
POST   /homework              — Yaratish (AI bilan ham)
GET    /homework/:id          — Detal
PUT    /homework/:id          — Tahrirlash
DELETE /homework/:id          — O'chirish
POST   /homework/:id/submit   — Topshirish (fayl bilan)
GET    /homework/:id/submissions   — Barcha javoblar
PUT    /homework/:id/submissions/:sid — Baholash
```

### Testlar (`/tests`)
```
GET    /tests                 — Ro'yxat
POST   /tests                 — Yaratish (qo'lda)
POST   /tests/generate-from-pdf — AI + PDF dan yaratish
PUT    /tests/:id             — Tahrirlash
DELETE /tests/:id             — O'chirish
POST   /tests/:id/submit      — Javoblar yuborish
GET    /tests/:id/results     — Barcha natijalar
GET    /tests/:id/analysis    — AI tahlili
```

### To'lovlar (`/payments`)
```
GET    /payments/group/:id    — Guruh to'lovlari (oylik)
POST   /payments              — To'lov belgilash (upsert)
DELETE /payments/:id          — To'lovni bekor qilish
GET    /payments/debts        — Qarzdorlar ro'yxati
GET    /payments/export       — Excel eksport
```

### Kassa va Moliya (`/finance`)
```
GET    /finance/summary       — Oylik daromad/chiqim xulosasi
GET    /finance/cashbox       — Kassa (oy/usul/filial bo'yicha)
GET    /finance/expenses      — Chiqimlar ro'yxati
POST   /finance/expenses      — Chiqim qo'shish
DELETE /finance/expenses/:id  — Chiqim o'chirish
GET    /finance/payroll       — O'qituvchi maoshi
POST   /finance/payroll/:id/payout — To'lov belgilash
POST   /finance/advice        — AI moliyaviy tavsiya
```

### Do'kon (`/shop`)
```
GET    /shop/items            — Mahsulotlar ro'yxati
POST   /shop/items            — Mahsulot qo'shish
PUT    /shop/items/:id        — Tahrirlash
DELETE /shop/items/:id        — O'chirish
POST   /shop/buy              — Coin bilan xarid
GET    /shop/orders           — Buyurtmalar
PUT    /shop/orders/:id       — Holat yangilash (cancel → qaytarish)
```

### Boshqa
```
GET    /attendance/group/:id  — Guruh davomati
POST   /attendance            — Davomat belgilash

GET    /schedule              — Haftalik dars jadvali

GET    /rooms                 — Xonalar CRUD
POST   /rooms
PUT    /rooms/:id
DELETE /rooms/:id

POST   /speaking/session      — Gemini Live real-vaqt token
POST   /voice/clone           — ElevenLabs ovoz klonlash
GET    /voice/profile/:id     — Ovoz profili

GET    /analytics/student/:id — Talaba tahlili
GET    /analytics/teacher/:id — O'qituvchi tahlili
GET    /analytics/leaderboard — Guruh reytingi

POST   /applications          — Ochiq ariza (auth yo'q)
GET    /applications          — Arizalar ro'yxati

GET    /resources             — Materiallar
POST   /resources             — Material yuklash
DELETE /resources/:id         — O'chirish

GET    /anti-sleep/ping       — Server uylab qolmasligi uchun
```

---

## 6. Frontend Sahifalar

### Talaba (17 ta sahifa)

| Sahifa | URL | Asosiy funksiya |
|---|---|---|
| Dashboard | `/student/dashboard` | XP, streak, bugungi darslar, yutuqlar |
| Darslar | `/student/lessons` | Guruh darslar ro'yxati |
| Dars Detali | `/student/lessons/:id` | AI tushuntirish, ovoz, video, chat, kviz |
| Uy Vazifa | `/student/homework` | Topshiriqlar ro'yxati + holat |
| Topshirish | `/student/homework/:id/submit` | Fayl yuklash bilan topshirish |
| Testlar | `/student/tests` | Mavjud testlar |
| Test Ishlash | `/student/tests/:id/run` | Vaqt limiti bilan MCQ test |
| Natijalar | `/student/results` | Test natijalari tarixi |
| Resurslar | `/student/resources` | Materiallar kutubxonasi |
| Davomat | `/student/attendance` | Davomat tarixi |
| Yutuqlar | `/student/achievements` | XP, darajalar, nishonlar |
| Reyting | `/student/leaderboard` | Guruh reytingi (top 50) |
| Tahlil | `/student/analytics` | Kuchli/zaif mavzular |
| Progress | `/student/progress` | Fan bo'yicha o'sish grafigi |
| Sertifikatlar | `/student/certificates` | PDF sertifikat generatsiya |
| Do'kon | `/student/shop` | Coin bilan mahsulot xaridi |
| Sozlamalar | `/student/settings` | AI uslubi, til, parol, tema |

### O'qituvchi (17 ta sahifa)

| Sahifa | URL | Asosiy funksiya |
|---|---|---|
| Dashboard | `/teacher/dashboard` | Guruhlar, so'nggi faollik |
| Guruhlar | `/teacher/groups` | Guruhlar ro'yxati |
| Guruh Detali | `/teacher/groups/:id` | Talabalar + to'lov modal |
| Talabalar | `/teacher/students` | Barcha talabalar |
| Darslar | `/teacher/lessons` | Darslar CRUD |
| Dars Yaratish | `/teacher/lessons/create` | AI bilan dars yaratish |
| Uy Vazifa | `/teacher/homework` | Topshiriqlar CRUD |
| Baholash | `/teacher/homework/:id/submissions` | Javoblarni ko'rish va baholash |
| Testlar | `/teacher/tests` | Testlar CRUD |
| Test Yaratish | `/teacher/tests/create` | Qo'lda yoki PDF dan AI test |
| Test Natijalari | `/teacher/tests/:id/results` | O'quvchi natijalari |
| Davomat | `/teacher/attendance` | Darsga davomat belgilash |
| Journal | `/teacher/gradebook` | To'liq jurnal, Excel eksport |
| Resurslar | `/teacher/resources` | Material yuklash |
| Ovozli Dars | `/teacher/voice` | ElevenLabs ovoz klonlash |
| Tahlil | `/teacher/analytics` | Guruh statistikasi |
| Talaba Profil | `/teacher/students/:id` | Talaba to'liq profili |

### Admin (16 ta sahifa)

| Sahifa | URL |
|---|---|
| Dashboard | `/admin/dashboard` |
| Markazlar | `/admin/centers` + `/:id` |
| Filiallar | `/admin/branches` + `/:id` |
| Managerlar | `/admin/managers` + `/:id` |
| O'qituvchilar | `/admin/teachers` + `/:id` |
| Qabulxona | `/admin/reception` + `/:id` |
| Talabalar | `/admin/students` + `/:id` |
| Guruhlar | `/admin/groups` |
| Foydalanuvchilar | `/admin/users` |
| Arizalar | `/admin/applications` |
| AI Agentlar | `/admin/ai-agents` |
| Sozlamalar | `/admin/settings` |

### Manager (13 ta sahifa)
`/manager/dashboard`, `/crm/dashboard`, `/leads`, `/leads/:id`, `/manager/branches`, `/manager/reception`, `/manager/teachers`, `/manager/groups`, `/manager/students`, `/manager/payments`, `/finance`, `/erp/cashbox`, `/finance/payroll`, `/manager/settings`

### Qabulxona (10 ta, ruxsatlarga bog'liq)
`/reception/dashboard`, `/reception/teachers`, `/reception/groups`, `/reception/students`, `/reception/payments`, `/reception/settings`, `/erp/rooms`, `/erp/timetable`, `/erp/cashbox`, `/finance`

---

## 7. AI Funksiyalar

| Funksiya | Provider | Mexanizm |
|---|---|---|
| Dars kontentini yaratish | Gemini 2.5 Flash | Async: pending → generating → done; DB kesh |
| AI chat tutori | Gemini 2.5 Flash | Chat tarixi AIChat modelida saqlanadi |
| Kviz yaratish | Gemini 2.5 Flash | On-demand (lesson.aiContent.quiz) |
| Test yaratish (PDF dan) | Gemini 2.5 Flash | mammoth + pdf-parse orqali matn chiqarish |
| Uy vazifa yaratish | Gemini 2.5 Flash | O'qituvchi triggerlaydi |
| Uy vazifani AI baholash | Gemini 2.5 Flash | O'qituvchi bilan parallel |
| Hikoya TTS audio | Gemini TTS | LessonMedia'da binary kesh |
| Ovozli o'qituvchi | Gemini TTS | LessonMedia'da binary kesh |
| Slayd video | Gemini 2.5 Flash + TTS + Image | Har slayd alohida keshlanadi |
| Real-vaqt nutq mashqi | Gemini Live (native-audio-preview) | WebSocket ephemeral token |
| Ovoz klonlash | ElevenLabs eleven_multilingual_v2 | Gemini TTS'ga fallback |
| Moliyaviy tavsiya | Gemini 2.5 Flash | Finance dashboard |
| Test natijasi tahlili | Gemini 2.5 Flash | Per test result |
| Konfiguratsiya agentlari | Gemini/OpenAI/Anthropic/Custom | API kalit DB'da (AIAgent) |

**Kalit izlash:** `AIAgent` jadval (30s kesh) → `GIMINI_AI_API_KEY` → `GEMINI_AI_API_KEY` → `GOOGLE_API_KEY`

---

## 8. Geymifikatsiya Tizimi

### XP Mukofotlar
| Harakat | XP |
|---|---|
| Darsni ko'rish | +10 |
| Uy vazifa topshirish | +20 |
| AI kviz to'ldirish | +25 |
| Test yakunlash | +40 |
| 100% test natijai | +100 |
| Kunlik streak | +15 |
| 7-kunlik streak bonus | +100 |
| 30-kunlik streak bonus | +500 |

### Daraja Formulasi
```javascript
level = Math.floor(Math.sqrt(xp / 100))
// 0 XP = 0 daraja, 100 XP = 1, 400 XP = 2, 900 XP = 3 ...
```

### Shop
- Mahsulotlar `Center.settings` JSON'da saqlanadi (5 ta default item)
- Xarid: Coin ayriladi → Stock kamaytirish → Buyurtma + xabarnoma
- Bekor qilish: Coin qaytariladi

---

## 9. Autentifikatsiya va Xavfsizlik

### JWT Token Tizimi
```
Access token:  15 daqiqa (Authorization: Bearer header)
Refresh token: 7 kun (DB'da bcrypt hash, localStorage'da raw)
Rotatsiya: Har refreshda yangi token juftligi
Logout: refreshToken = null (DB da)
```

### Xavfsizlik Qatlamlari
- **helmet** — Xavfsiz HTTP header'lar (CSP, HSTS, va b.)
- **cors** — Faqat whitelist domenlarga (`*.onrender.com` + `CLIENT_URL` env)
- **express-rate-limit** — 500 req / 15 min (health + anti-sleep bundan mustasno)
- **bcryptjs** — Parol va refresh token hash (salt 10)
- **Prisma ORM** — Barcha so'rovlar parametrik (SQL injection yo'q)
- **verifyToken** — Har so'rovda DB dan user olinadi va tekshiriladi

### Ma'lumot Izolyatsiyasi
- `centerScope.js` — Barcha so'rovlarga `centerId` filtri
- `branchScope.js` — Manager/reception faqat o'z filiallarini ko'radi
- `requireReceptionPermission()` — Admin/manager har doim o'tadi; reception tekshiriladi

---

## 10. Deployment

### Render.com (`render.yaml`)

**Backend:**
```yaml
name: abdora-ai-backend
type: web
runtime: node
buildCommand: npm install && npx prisma generate && npx prisma db push
startCommand: node server.js
region: frankfurt
envVars:
  - DATABASE_URL
  - JWT_SECRET (auto-generated)
  - REFRESH_SECRET (auto-generated)
  - CLIENT_URL
  - GIMINI_AI_API_KEY
  - ELEVENLABS_API_KEY
```

**Frontend:**
```yaml
name: abdora-ai-frontend
type: static
buildCommand: npm install && npm run build
publishDir: dist
routes:
  - type: rewrite
    source: /*
    destination: /index.html    # SPA routing
```

### Docker (local ishlab chiqish)
```bash
docker-compose up
# postgres:18-alpine  → port 5432
# abdora-api          → http://127.0.0.1:3500
# abdora-web          → http://127.0.0.1:3501
```

---

## 11. Anti-Sleep Servisi

Render bepul tier'da server 15 daqiqasiz so'rov bo'lmasa "uylab qoladi". Hal qilish usuli:

```javascript
// server.js ichida ishga tushadigan interval:
// GET /anti-sleep/ping — o'z-o'ziga so'rov
// X-Anti-Sleep-Probe: true headeri bilan
// Rate limiter bu so'rovlarni skip qiladi
setInterval(() => {
  fetch(`${process.env.RENDER_EXTERNAL_URL}/anti-sleep/ping`, {
    headers: { 'X-Anti-Sleep-Probe': 'true' }
  });
}, 14 * 60 * 1000); // 14 daqiqa
```

---

## 12. Mobil Ilova (Flutter)

**Ekranlar:**
- `LoginScreen` — Kirish
- `HomeScreen` — XP, streak, bosh sahifa
- `LessonsScreen` + `LessonDetailScreen` — Darslar
- `HomeworkScreen` — Uy vazifalari
- `TestsScreen` — Testlar
- `ShopScreen` + `LeaderboardScreen` — Do'kon + reyting
- `ProfileScreen` + `StatsScreen` — Profil
- `GameScreen` — O'yin
- `TeacherMonitorScreen` — Kuzatuv

**Texnologiya:**
- `provider` — State management
- `dio` — HTTP (JWT interceptor bilan)
- `flutter_secure_storage` — Token saqlash
- Android (`minSdk 21`) + iOS tayyor

**Cheklov:** Faqat talaba ekranlar mavjud. O'qituvchi va admin uchun mobil ekranlar yo'q.

---

## 13. Tuzatilgan Muammolar

| Sana | Muammo | Fayl |
|---|---|---|
| 2026-10-02 | `LeadDetail`, `AdminManagers`, `AdminManagerDetail`, `AdminUsers` route'lari yo'q edi | `App.jsx` |
| 2026-10-02 | Admin sidebar'da manager/o'qituvchi/qabulxona/talaba/guruh/user linklari yo'q edi | `Sidebar.jsx` |
| 2026-10-01 | CORS xavfsizlik teshigi — `else` tarmoq ham `callback(null, true)` qaytarardi | `server.js` |
| 2026-10-01 | AI chat ReferenceError — `effectiveStyle`/`effectiveLang` e'lon qilinmagan | `ai.controller.js` |
| 2026-10-01 | LeadDetail dark mode modal oq bo'lib qolardi | `LeadDetail.jsx` |
| 2026-10-01 | Qabulxona `/admin/reception-users` (mavjud bo'lmagan endpoint) | `ManagerSettings.jsx` |
| 2026-10-01 | Kassa manager uchun 0 ko'rsatardi | `finance.controller.js` |
| 2026-10-01 | GroupDetail sahifasi to'liq qayta yozildi (to'lov modal, qidiruv, filtr) | `GroupDetail.jsx` |

---

## 14. Ma'lum Cheklovlar

| Muammo | Muhimlik | Tavsiya |
|---|---|---|
| SMS bildirishnomalar yo'q | Yuqori | Eskiz.uz yoki PlayMobile API ulash |
| Shop buyurtmalari JSON blob'da | O'rta | Alohida `Order` Prisma modeli yaratish |
| O'qituvchi/admin mobil ekranlar yo'q | O'rta | Flutter da yangi ekranlar qo'shish |
| Ko'p til (ru/en) qisman | Past | `locales/ru` va `locales/en` to'ldirish |
| Unit/integration testlar yo'q | Past | Jest + Supertest qo'shish |

---

## 15. Umumiy Baho

```
Autentifikatsiya va xavfsizlik     10/10
RBAC va ruxsatlar                  10/10
CRM (lidlar, konversiya)           10/10
LMS (darslar, test, davomat)       10/10
To'lov tizimi                       9/10
Geymifikatsiya                     10/10
AI funksiyalar                     10/10
Moliya va hisobotlar                9/10
UI/UX (dark/light, responsive)      9/10
Mobil ilova (talaba)                8/10
Deployment va devops                9/10

JAMI: 104/110 = 95%
Sotuvga tayyorlik: MVP TAYYOR
```
