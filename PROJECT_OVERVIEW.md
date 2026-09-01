<<<<<<< HEAD
# Abdora AI — Proyektni bir faylda tushunish uchun qo'llanma

## 1) Proyekt nima?

Bu loyiha — O'zbekistondagi ta'lim uchun yaratilgan full-stack LMS (Learning Management System) / online education platform. Asosiy maqsad:

- o'quvchilarni o'qitish va nazorat qilish;
- o'qituvchilar uchun dars, uy vazifalari, testlar va analytics;
- admin/manager/reception uchun filiallar va xodimlar boshqaruvi;
- AI yordamida dars materiallari, speaking practice, audio, test generation va boshqa intelligent funksiyalar.

Loyiha ikkita asosiy qismdan iborat:

- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express + Prisma + PostgreSQL

---

## 2) Loyihaning umumiy tuzilishi

```text
Abdora-ai-main/
├── README.md                        # umumiy loyiha haqida ma'lumot
├── package.json                     # root skriptlar
├── render.yaml                      # deployment config
├── PROJECT_OVERVIEW.md              # bu fayl (birinchi tushuncha)
├── bialogiya_frontend/             # React frontend
│   ├── src/
│   │   ├── App.jsx                 # barcha route va access control
│   │   ├── main.jsx                # app bootstrap
│   │   ├── pages/                  # sahifalar
│   │   ├── components/             # reusable UI componentlar
│   │   ├── store/                  # state management
│   │   ├── config/                 # axios, i18n, language config
│   │   └── utils/                  # yordamchi funksiyalar
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── bialogiya_beakent/              # Express backend
│   ├── src/
│   │   ├── controllers/            # request handlerlar
│   │   ├── routes/                 # API route'lar
│   │   ├── middleware/             # auth, error, upload
│   │   ├── services/               # AI logic va business logic
│   │   ├── config/                 # DB va AI config
│   │   ├── utils/                  # helper, seed, sanitization, cache
│   │   └── ...
│   ├── prisma/
│   │   └── schema.prisma           # PostgreSQL schema
│   ├── server.js                  # backend entry point
│   ├── package.json
│   └── .env                       # environment variables
└── ...
```

---

## 3) Backend qanday ishlaydi?

### 3.1 Entry point

Backendning asosiy boshlang'ich nuqtasi:

- [bialogiya_beakent/server.js](bialogiya_beakent/server.js)

U yerda:

- `dotenv` yuklanadi;
- Express app yaratiladi;
- CORS, Helmet, Morgan, compression, rate limiter o'rnatiladi;
- DB ulanadi;
- API route'lar `app.use('/api', require('./src/routes/index'))` orqali ulanadi;
- health check `/api/health` mavjud;
- global error handler ishlatiladi.

### 3.2 Route map

Asosiy router:

- [bialogiya_beakent/src/routes/index.js](bialogiya_beakent/src/routes/index.js)

Bu yerda route'lar quyidagicha guruhlangan:

- `/auth`
- `/users`
- `/groups`
- `/lessons`
- `/homework`
- `/tests`
- `/attendance`
- `/resources`
- `/files`
- `/analytics`
- `/admin`
- `/reception`
- `/payments`
- `/finance`
- `/leads`
- `/speaking`
- `/voice`
- `/applications`

Bu ko'rsatkich projectning kengligini ko'rsatadi: bu faqat student management emas, balki education + CRM + finance + operations platform.

### 3.3 Database schema

Prisma schema:

- [bialogiya_beakent/prisma/schema.prisma](bialogiya_beakent/prisma/schema.prisma)

Asosiy model'lar:

- `User` — foydalanuvchi (admin, manager, teacher, student, reception)
- `Group` — guruh / class / seminar group
- `Branch` — filial / campus / branch
- `Lesson` — dars
- `Homework` — uy vazifasi
- `Submission` — talabaning topshirishi
- `Test` — test / exam
- `Attendance` — davomat
- `Resource` — resurs/material
- `Payment` — to'lovlar
- `Lead` — lead / potential student management
- `AIChat` — AI chatlar
- `LessonMedia` — generated audio caching
- `Expense` — xarajatlar

Schema da foydalanuvchining roli (Role):

- `admin`
- `manager`
- `teacher`
- `student`
- `reception`

### 3.4 Database auto-migration / patching

- [bialogiya_beakent/src/config/db.js](bialogiya_beakent/src/config/db.js)

Bu faylda `prisma.$executeRawUnsafe` orqali PostgreSQL ustiga yangi ustunlar, constraintlar, tables qo'shiladi. Yani loyiha "prisma migrate dev" bilan cheklanmay, ba'zi ma'lumotlar bazasi patch'lari dinamik ravishda qo'shiladi. Bu uchun project production-ready bo'lishiga mos, lekin schema va DB state aniq nazorat qilinishi kerak.

---

## 4) Frontend qanday ishlaydi?

### 4.1 Bootstrap

- [bialogiya_frontend/src/main.jsx](bialogiya_frontend/src/main.jsx)

Bu yerda:

- React Query client yaratiladi;
- appga `Toaster` qo'shiladi;
- `useThemeStore` init qilinadi;
- `App` component render qilinadi.

### 4.2 Route system

- [bialogiya_frontend/src/App.jsx](bialogiya_frontend/src/App.jsx)

Bu yerda route'lar quyidagicha bo'linadi:

#### Public
- `/`
- `/login`

#### Student
- `/student/dashboard`
- `/student/lessons`
- `/student/homework`
- `/student/tests`
- `/student/results`
- `/student/resources`
- `/student/attendance`
- `/student/achievements`
- `/student/leaderboard`
- `/student/analytics`

#### Teacher
- `/teacher/dashboard`
- `/teacher/groups`
- `/teacher/students`
- `/teacher/lessons`
- `/teacher/homework`
- `/teacher/tests`
- `/teacher/attendance`
- `/teacher/resources`
- `/teacher/analytics`
- `/teacher/voice`

#### Manager / Admin / Reception
- `/manager/*`
- `/admin/*`
- `/reception/*`
- `/finance/*`
- `/leads`

#### Shared
- `/profile`
- `/users/:id`

### 4.3 Access control

`ProtectedRoute` logic:

- user autentifikatsiya qilinmagan bo'lsa, `/login` ga yo'naltiradi;
- ro'l bo'yicha access cheklanishi bor;
- har bir rol uchun redirect on default dashboard mavjud.

Masalan:

- student -> `/student/dashboard`
- teacher -> `/teacher/dashboard`
- reception -> `/reception/teachers`
- manager -> `/manager/dashboard`
- admin -> `/admin/dashboard`

---

## 5) Ro'li bo'yicha loyiha qanday ishlaydi?

### Student
Student uchun quyidagi imkoniyatlar mavjud:

- darslarni ko'rish;
- uy vazifalarini bajarish;
- testlar yechish;
- natijalar ko'rish;
- resurslar va attendance;
- leaderboard, achievements, analytics;
- AI bilan ishlash (speaking practice, lesson support).

### Teacher
Teacher uchun:

- guruh boshqarish;
- studentlar bilan ishlash;
- dars yaratish;
- homework qo'shish;
- test yaratish;
- submissionlarni baholash;
- attendance;
- resurslar;
- analytics;
- AI voice / lesson generation.

### Manager
Manager uchun:

- filiallar va reception boshqaruvi;
- staff va teacherlar ko'rinishi;
- finance va payroll;
- leads CRM;
- umumiy monitoring.

### Admin
Admin uchun:

- full system control;
- branches manager;
- managers/reception/teachers governance;
- global settings;
- aplikatsiyalar va user management;
- system-wide analytics.

### Reception
Reception uchun:

- student enrollment / qabul;
- groups bilan ishlash;
- payments;
- teacher/student monitoring;
- branch operational support.

---

## 6) AI qismi nima?

Projectda AI yo'nalishlari asosiy jihatlardan biri.

### Backend config

- [bialogiya_beakent/src/config/gemini.js](bialogiya_beakent/src/config/gemini.js)

Bu yerda Gemini API ishlatiladi:

- `gemini-2.5-flash` — umumiy AI tasks
- TTS uchun Gemini TTS model
- Live speaking practice uchun Gemini Live model

### AI funksiyalar

Loyihada AI quyidagilar bilan bog'liq:

- lesson generation;
- story narration;
- explainer video audio;
- speaking practice;
- AI-powered chat;
- homework/test generation;
- grading support.

### Env file

- [bialogiya_beakent/.env](bialogiya_beakent/.env)

Asosiy env variable'lar:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `GIMINI_AI_API_KEY`
- `GEMINI_TTS_MODEL`
- `GEMINI_TTS_VOICE`
- `GEMINI_LIVE_MODEL`
- `CLIENT_URL`
- `PORT`
- `UPLOAD_DIR`
- `MAX_FILE_SIZE_MB`

> Eslatma: `.env` faylida `GEMINI` kaliti asosiy AI ni ta'minlaydi. OpenAI optional bo'lib, faqat qo'shimcha yoki eskirgan path'larda ishlatiladi.

---

## 7) Asosiy backend script'lar

### Backend package

- [bialogiya_beakent/package.json](bialogiya_beakent/package.json)

Skriplar:

```bash
npm start
npm run dev
npm run seed
npm run db:push
npm run db:generate
```

### Root package

- [package.json](package.json)

Rootda umumiy kommandalar mavjud:

```bash
npm run install:all
npm run dev:frontend
npm run dev:backend
npm run build:frontend
npm run build:backend
```

---

## 8) Ishga tushirish tartibi

### 1. Dependencies o'rnatish

```bash
cd Abdora-ai-main
npm install
cd bialogiya_frontend && npm install
cd ../bialogiya_beakent && npm install
```

### 2. `.env` tayyorlash

Backend `.env` fayliga quyidagilar kerak:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `GIMINI_AI_API_KEY`
- `CLIENT_URL`
- `PORT`

### 3. Database tayyorlash

```bash
cd bialogiya_beakent
npx prisma generate
npx prisma db push
```

Agar kerak bo'lsa, seed ishlatilishi mumkin:

```bash
npm run seed
```

### 4. Backend ishga tushirish

```bash
cd bialogiya_beakent
npm start
```

### 5. Frontend ishga tushirish

```bash
cd bialogiya_frontend
npm run dev
```

### 6. Browser

```text
http://localhost:5173
```

Backend default port:

```text
http://localhost:5000
```

---

## 9) Loyiha qanday ishlash tamoyili

Project asosan quyidagi moddalarni birgalikda ishlatadi:

1. Frontend UI
   - React pages and routes
   - role-based navigation
   - Zustand / query-based state

2. Backend API
   - Express handlers
   - route-based module separation
   - JWT auth

3. Database
   - Prisma ORM
   - PostgreSQL DB

4. AI layer
   - Gemini models
   - generated lessons / narration / voice / speaking practice

5. File upload / docs processing
   - pdf, docx, excel, file upload support
   - audio/video material handling

6. Finance & operations
   - payments, salary, expenses, payroll, branches, leads

---

## 10) Bu loyiha nimaga o'xshaydi?

Bu loyiha quyidagi turdagi mahsulotlarga yaqin:

- LMS platform
- education management system
- academy CRM
- teacher-student portal
- branch-based learning network
- AI-enhanced learning app

Ya'ni: bu oddiy landing page emas; bu ko'p-rolli, ko'p-modulli, enterprise-ish academic platform.

---

## 11) Muhim eslatmalar

### 11.1 Frontend and backend alohida ishlaydi
- Frontend local port: 5173
- Backend local port: 5000
- API calllar backendga `CLIENT_URL` yoki CORS config orqali kiradi

### 11.2 Database ishlashi muhim
- Prisma schema + PostgreSQL `DATABASE_URL` kerak
- backend `db.js` da DB migrations-like patch ishlatiladi
- agar schema bilan DB mismatch bo'lsa, qisman xatoliklar paydo bo'lishi mumkin

### 11.3 AI config kritiklik darajasida
- `GIMINI_AI_API_KEY` mavjud bo'lishi shart
- TTS / speaking practice uchun Gemini Live/tts model'lari to'g'ri bo'lishi kerak

### 11.4 Security
- JWT ishlatiladi
- rate limiter ishlatiladi
- Helmet & CORS ishlatiladi
- file upload limits mavjud

---

## 12) Qisqacha xulosasi

Abdora AI loyiha — bu o'quvchi, o'qituvchi, manager, admin va reception uchun bir vaqtning o'zida ishlaydigan ta'lim boshqaruvi platformasi. Loyiha:

- frontend + backend + database + AI + finance + CRM + education ops;
- role-based architecture;
- PostgreSQL + Prisma;
- React + Vite + Express;
- Gemini AI integration;
- real business workflow for education center.

Agar bu faylni o'qisangiz, siz asosan loyihaning "nima, qayerda, qanaqa ishlayapti" konsepsiyasini tushunib olasiz.

---

## 13) Tez start (copy-paste)

```bash
cd Abdora-ai-main
npm install
cd bialogiya_frontend && npm install && cd ../bialogiya_beakent && npm install

# backend .env tayyorlang
# sonra:
cd bialogiya_beakent
npx prisma generate
npx prisma db push
npm start

# frontend boshqa terminalda:
cd bialogiya_frontend
npm run dev
```

---

Agar xohlasangiz, keyingi qadam sifatida men bu faylni yana:

1. "tez onboarding version" ga qisqartiraman;
2. "developer manual" ga aylantiraman;
3. yoki "admin / user / dev role guide" bo'lib alohida bo'limlarga ajrataman.
=======
# Abdora AI — Proyektni bir faylda tushunish uchun qo'llanma

## 1) Proyekt nima?

Bu loyiha — O'zbekistondagi ta'lim uchun yaratilgan full-stack LMS (Learning Management System) / online education platform. Asosiy maqsad:

- o'quvchilarni o'qitish va nazorat qilish;
- o'qituvchilar uchun dars, uy vazifalari, testlar va analytics;
- admin/manager/reception uchun filiallar va xodimlar boshqaruvi;
- AI yordamida dars materiallari, speaking practice, audio, test generation va boshqa intelligent funksiyalar.

Loyiha ikkita asosiy qismdan iborat:

- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express + Prisma + PostgreSQL

---

## 2) Loyihaning umumiy tuzilishi

```text
Abdora-ai-main/
├── README.md                        # umumiy loyiha haqida ma'lumot
├── package.json                     # root skriptlar
├── render.yaml                      # deployment config
├── PROJECT_OVERVIEW.md              # bu fayl (birinchi tushuncha)
├── bialogiya_frontend/             # React frontend
│   ├── src/
│   │   ├── App.jsx                 # barcha route va access control
│   │   ├── main.jsx                # app bootstrap
│   │   ├── pages/                  # sahifalar
│   │   ├── components/             # reusable UI componentlar
│   │   ├── store/                  # state management
│   │   ├── config/                 # axios, i18n, language config
│   │   └── utils/                  # yordamchi funksiyalar
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── bialogiya_beakent/              # Express backend
│   ├── src/
│   │   ├── controllers/            # request handlerlar
│   │   ├── routes/                 # API route'lar
│   │   ├── middleware/             # auth, error, upload
│   │   ├── services/               # AI logic va business logic
│   │   ├── config/                 # DB va AI config
│   │   ├── utils/                  # helper, seed, sanitization, cache
│   │   └── ...
│   ├── prisma/
│   │   └── schema.prisma           # PostgreSQL schema
│   ├── server.js                  # backend entry point
│   ├── package.json
│   └── .env                       # environment variables
└── ...
```

---

## 3) Backend qanday ishlaydi?

### 3.1 Entry point

Backendning asosiy boshlang'ich nuqtasi:

- [bialogiya_beakent/server.js](bialogiya_beakent/server.js)

U yerda:

- `dotenv` yuklanadi;
- Express app yaratiladi;
- CORS, Helmet, Morgan, compression, rate limiter o'rnatiladi;
- DB ulanadi;
- API route'lar `app.use('/api', require('./src/routes/index'))` orqali ulanadi;
- health check `/api/health` mavjud;
- global error handler ishlatiladi.

### 3.2 Route map

Asosiy router:

- [bialogiya_beakent/src/routes/index.js](bialogiya_beakent/src/routes/index.js)

Bu yerda route'lar quyidagicha guruhlangan:

- `/auth`
- `/users`
- `/groups`
- `/lessons`
- `/homework`
- `/tests`
- `/attendance`
- `/resources`
- `/files`
- `/analytics`
- `/admin`
- `/reception`
- `/payments`
- `/finance`
- `/leads`
- `/speaking`
- `/voice`
- `/applications`

Bu ko'rsatkich projectning kengligini ko'rsatadi: bu faqat student management emas, balki education + CRM + finance + operations platform.

### 3.3 Database schema

Prisma schema:

- [bialogiya_beakent/prisma/schema.prisma](bialogiya_beakent/prisma/schema.prisma)

Asosiy model'lar:

- `User` — foydalanuvchi (admin, manager, teacher, student, reception)
- `Group` — guruh / class / seminar group
- `Branch` — filial / campus / branch
- `Lesson` — dars
- `Homework` — uy vazifasi
- `Submission` — talabaning topshirishi
- `Test` — test / exam
- `Attendance` — davomat
- `Resource` — resurs/material
- `Payment` — to'lovlar
- `Lead` — lead / potential student management
- `AIChat` — AI chatlar
- `LessonMedia` — generated audio caching
- `Expense` — xarajatlar

Schema da foydalanuvchining roli (Role):

- `admin`
- `manager`
- `teacher`
- `student`
- `reception`

### 3.4 Database auto-migration / patching

- [bialogiya_beakent/src/config/db.js](bialogiya_beakent/src/config/db.js)

Bu faylda `prisma.$executeRawUnsafe` orqali PostgreSQL ustiga yangi ustunlar, constraintlar, tables qo'shiladi. Yani loyiha "prisma migrate dev" bilan cheklanmay, ba'zi ma'lumotlar bazasi patch'lari dinamik ravishda qo'shiladi. Bu uchun project production-ready bo'lishiga mos, lekin schema va DB state aniq nazorat qilinishi kerak.

---

## 4) Frontend qanday ishlaydi?

### 4.1 Bootstrap

- [bialogiya_frontend/src/main.jsx](bialogiya_frontend/src/main.jsx)

Bu yerda:

- React Query client yaratiladi;
- appga `Toaster` qo'shiladi;
- `useThemeStore` init qilinadi;
- `App` component render qilinadi.

### 4.2 Route system

- [bialogiya_frontend/src/App.jsx](bialogiya_frontend/src/App.jsx)

Bu yerda route'lar quyidagicha bo'linadi:

#### Public
- `/`
- `/login`

#### Student
- `/student/dashboard`
- `/student/lessons`
- `/student/homework`
- `/student/tests`
- `/student/results`
- `/student/resources`
- `/student/attendance`
- `/student/achievements`
- `/student/leaderboard`
- `/student/analytics`

#### Teacher
- `/teacher/dashboard`
- `/teacher/groups`
- `/teacher/students`
- `/teacher/lessons`
- `/teacher/homework`
- `/teacher/tests`
- `/teacher/attendance`
- `/teacher/resources`
- `/teacher/analytics`
- `/teacher/voice`

#### Manager / Admin / Reception
- `/manager/*`
- `/admin/*`
- `/reception/*`
- `/finance/*`
- `/leads`

#### Shared
- `/profile`
- `/users/:id`

### 4.3 Access control

`ProtectedRoute` logic:

- user autentifikatsiya qilinmagan bo'lsa, `/login` ga yo'naltiradi;
- ro'l bo'yicha access cheklanishi bor;
- har bir rol uchun redirect on default dashboard mavjud.

Masalan:

- student -> `/student/dashboard`
- teacher -> `/teacher/dashboard`
- reception -> `/reception/teachers`
- manager -> `/manager/dashboard`
- admin -> `/admin/dashboard`

---

## 5) Ro'li bo'yicha loyiha qanday ishlaydi?

### Student
Student uchun quyidagi imkoniyatlar mavjud:

- darslarni ko'rish;
- uy vazifalarini bajarish;
- testlar yechish;
- natijalar ko'rish;
- resurslar va attendance;
- leaderboard, achievements, analytics;
- AI bilan ishlash (speaking practice, lesson support).

### Teacher
Teacher uchun:

- guruh boshqarish;
- studentlar bilan ishlash;
- dars yaratish;
- homework qo'shish;
- test yaratish;
- submissionlarni baholash;
- attendance;
- resurslar;
- analytics;
- AI voice / lesson generation.

### Manager
Manager uchun:

- filiallar va reception boshqaruvi;
- staff va teacherlar ko'rinishi;
- finance va payroll;
- leads CRM;
- umumiy monitoring.

### Admin
Admin uchun:

- full system control;
- branches manager;
- managers/reception/teachers governance;
- global settings;
- aplikatsiyalar va user management;
- system-wide analytics.

### Reception
Reception uchun:

- student enrollment / qabul;
- groups bilan ishlash;
- payments;
- teacher/student monitoring;
- branch operational support.

---

## 6) AI qismi nima?

Projectda AI yo'nalishlari asosiy jihatlardan biri.

### Backend config

- [bialogiya_beakent/src/config/gemini.js](bialogiya_beakent/src/config/gemini.js)

Bu yerda Gemini API ishlatiladi:

- `gemini-2.5-flash` — umumiy AI tasks
- TTS uchun Gemini TTS model
- Live speaking practice uchun Gemini Live model

### AI funksiyalar

Loyihada AI quyidagilar bilan bog'liq:

- lesson generation;
- story narration;
- explainer video audio;
- speaking practice;
- AI-powered chat;
- homework/test generation;
- grading support.

### Env file

- [bialogiya_beakent/.env](bialogiya_beakent/.env)

Asosiy env variable'lar:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `GIMINI_AI_API_KEY`
- `GEMINI_TTS_MODEL`
- `GEMINI_TTS_VOICE`
- `GEMINI_LIVE_MODEL`
- `CLIENT_URL`
- `PORT`
- `UPLOAD_DIR`
- `MAX_FILE_SIZE_MB`

> Eslatma: `.env` faylida `GEMINI` kaliti asosiy AI ni ta'minlaydi. OpenAI optional bo'lib, faqat qo'shimcha yoki eskirgan path'larda ishlatiladi.

---

## 7) Asosiy backend script'lar

### Backend package

- [bialogiya_beakent/package.json](bialogiya_beakent/package.json)

Skriplar:

```bash
npm start
npm run dev
npm run seed
npm run db:push
npm run db:generate
```

### Root package

- [package.json](package.json)

Rootda umumiy kommandalar mavjud:

```bash
npm run install:all
npm run dev:frontend
npm run dev:backend
npm run build:frontend
npm run build:backend
```

---

## 8) Ishga tushirish tartibi

### 1. Dependencies o'rnatish

```bash
cd Abdora-ai-main
npm install
cd bialogiya_frontend && npm install
cd ../bialogiya_beakent && npm install
```

### 2. `.env` tayyorlash

Backend `.env` fayliga quyidagilar kerak:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `GIMINI_AI_API_KEY`
- `CLIENT_URL`
- `PORT`

### 3. Database tayyorlash

```bash
cd bialogiya_beakent
npx prisma generate
npx prisma db push
```

Agar kerak bo'lsa, seed ishlatilishi mumkin:

```bash
npm run seed
```

### 4. Backend ishga tushirish

```bash
cd bialogiya_beakent
npm start
```

### 5. Frontend ishga tushirish

```bash
cd bialogiya_frontend
npm run dev
```

### 6. Browser

```text
http://localhost:5173
```

Backend default port:

```text
http://localhost:5000
```

---

## 9) Loyiha qanday ishlash tamoyili

Project asosan quyidagi moddalarni birgalikda ishlatadi:

1. Frontend UI
   - React pages and routes
   - role-based navigation
   - Zustand / query-based state

2. Backend API
   - Express handlers
   - route-based module separation
   - JWT auth

3. Database
   - Prisma ORM
   - PostgreSQL DB

4. AI layer
   - Gemini models
   - generated lessons / narration / voice / speaking practice

5. File upload / docs processing
   - pdf, docx, excel, file upload support
   - audio/video material handling

6. Finance & operations
   - payments, salary, expenses, payroll, branches, leads

---

## 10) Bu loyiha nimaga o'xshaydi?

Bu loyiha quyidagi turdagi mahsulotlarga yaqin:

- LMS platform
- education management system
- academy CRM
- teacher-student portal
- branch-based learning network
- AI-enhanced learning app

Ya'ni: bu oddiy landing page emas; bu ko'p-rolli, ko'p-modulli, enterprise-ish academic platform.

---

## 11) Muhim eslatmalar

### 11.1 Frontend and backend alohida ishlaydi
- Frontend local port: 5173
- Backend local port: 5000
- API calllar backendga `CLIENT_URL` yoki CORS config orqali kiradi

### 11.2 Database ishlashi muhim
- Prisma schema + PostgreSQL `DATABASE_URL` kerak
- backend `db.js` da DB migrations-like patch ishlatiladi
- agar schema bilan DB mismatch bo'lsa, qisman xatoliklar paydo bo'lishi mumkin

### 11.3 AI config kritiklik darajasida
- `GIMINI_AI_API_KEY` mavjud bo'lishi shart
- TTS / speaking practice uchun Gemini Live/tts model'lari to'g'ri bo'lishi kerak

### 11.4 Security
- JWT ishlatiladi
- rate limiter ishlatiladi
- Helmet & CORS ishlatiladi
- file upload limits mavjud

---

## 12) Qisqacha xulosasi

Abdora AI loyiha — bu o'quvchi, o'qituvchi, manager, admin va reception uchun bir vaqtning o'zida ishlaydigan ta'lim boshqaruvi platformasi. Loyiha:

- frontend + backend + database + AI + finance + CRM + education ops;
- role-based architecture;
- PostgreSQL + Prisma;
- React + Vite + Express;
- Gemini AI integration;
- real business workflow for education center.

Agar bu faylni o'qisangiz, siz asosan loyihaning "nima, qayerda, qanaqa ishlayapti" konsepsiyasini tushunib olasiz.

---

## 13) Tez start (copy-paste)

```bash
cd Abdora-ai-main
npm install
cd bialogiya_frontend && npm install && cd ../bialogiya_beakent && npm install

# backend .env tayyorlang
# sonra:
cd bialogiya_beakent
npx prisma generate
npx prisma db push
npm start

# frontend boshqa terminalda:
cd bialogiya_frontend
npm run dev
```

---

Agar xohlasangiz, keyingi qadam sifatida men bu faylni yana:

1. "tez onboarding version" ga qisqartiraman;
2. "developer manual" ga aylantiraman;
3. yoki "admin / user / dev role guide" bo'lib alohida bo'limlarga ajrataman.
>>>>>>> main
