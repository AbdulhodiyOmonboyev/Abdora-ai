# 🧬 Abdora AI — Smart EdTech, CRM & ERP Ecosystem
> **O'zbekistonda ta'lim markazlari uchun sun'iy intellekt va TUSHUN pedagogikasiga asoslangan yaxlit boshqaruv hamda o'qitish platformasi (CRM + ERP + LMS + Mobile)**

[![CI / CD Tests](https://img.shields.io/badge/tests-33%20passed%2C%200%20failed-brightgreen.svg?style=flat-square)](https://github.com/omonovdev/Abdora-ai)
[![Node.js Version](https://img.shields.io/badge/node-v18%2B-blue.svg?style=flat-square)](https://nodejs.org)
[![React Version](https://img.shields.io/badge/react-v18-61dafb.svg?style=flat-square)](https://react.dev)
[![Flutter Mobile](https://img.shields.io/badge/flutter-v3.x-02569B.svg?style=flat-square)](https://flutter.dev)
[![Prisma ORM](https://img.shields.io/badge/prisma-PostgreSQL-2D3748.svg?style=flat-square)](https://www.prisma.io)
[![Google Gemini AI](https://img.shields.io/badge/AI-Gemini%20Flash%20%7C%20Live-orange.svg?style=flat-square)](https://ai.google.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## 🌟 Abdora AI Nima?

**Abdora AI** — bu an'anaviy o'quv markazlari va maktablarni zamonaviy, avtomatlashtirilgan aqlli ta'lim dargohiga aylantiruvchi keng qamrovli raqamli platforma. Tizim markaz rahbaridan tortib, o'quvchi va ota-onagacha bo'lgan barcha qatlamlarning kundalik jarayonlarini birlashtiradi.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          ABDORA AI EKOTIZIMI                           │
├────────────────────┬────────────────────┬──────────────────────────────┤
│ 💻 Web Platform    │ ⚙️ Core Backend     │ 📱 Flutter Mobile            │
│ (React 18 + Vite)  │ (Node.js + Prisma) │ (Android / iOS)              │
│ - Admin & Filiallar│ - AI Orkestratsiya │ - O'quvchi portali           │
│ - CRM & Lidlar     │ - 5 xil Kassa      │ - Gamifikatsiya (XP/Tangalar)│
│ - Moliya & Kassa   │ - TUSHUN Generator │ - Test Runner & Offline      │
│ - O'qituvchi & LMS │ - Multi-tenancy    │ - Do'kon va Reyting          │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

---

## 🚀 Asosiy Imkoniyatlar va Modullar

### 🏢 1. Rahbariyat va Markaz Boshqaruvi (ERP & Multi-Branch)
- **Ko'p Filialli Tizim (Multi-Tenancy):** Har bir o'quv markazi o'zining filiallari, xonalari, dars jadvallari va xodimlarini mustaqil boshqaradi.
- **5 Kanalli Kassa Tizimi:** Naqd pul, Click, Payme, Bank o'tkazmasi va boshqa to'lovlar bo'yicha alohida qoldiq hisoboti.
- **Moliya & AI Maslahatchi:** Oylik daromad, o'qituvchilar maoshi (Payroll), ijara va marketing xarajatlari tahlili hamda sun'iy intellektdan moliyaviy tavsiyalar.
- **AI Token Monitoringi:** Sarflanayotgan AI tokenlar soni, kirish/chiqish narxlari va real vaqtdagi xarajatlar shaffofligi.

### 📋 2. Qabulxona va Sotuvlar (CRM & Reception)
- **Lidlar Voronkasi (Leads Pipeline):** Sayt, Telegram va telefon orqali kelgan arizalarni qabul qilish va sinov darslariga yozish.
- **1-Klikda O'quvchiga Aylantirish:** Lid sinov darsidan o'tgach, bir zumda guruhga biriktirilib, unga login/parol shakllantiriladi.
- **A5 & 80mm Kvitansiya (Receipt):** To'lov qabul qilingan zahoti QR-kod va unikal raqamga ega rasmiy to'lov cheki chop etishga tayyor bo'ladi.
- **Qarzdorlar Nazorati:** Guruh va markaz bo'yicha to'lov muddati o'tgan o'quvchilar ro'yxati va bir klikda Excel (`.xlsx`) eksport.

### 👨‍🏫 3. O'qituvchilar va Akademik Nazorat (LMS)
- **AI Dars Generatsiyasi:** Darslik kitobi (PDF yoki Word) yuklanganda 5 soniya ichida konspekt, sodda tushuntirish, mnemonikalar, aql xaritasi (MindMap) va fleshkartalar yaratiladi.
- **Tezkor Davomat & Idempotent Tangalar:** O'quvchilarga davomat belgilash, a'lo baho olganlarga tanga (coin) qo'shish va dars qoldirganlardan ayirish.
- **AI Homework Grading (Uyga vazifani tekshirish):** Talabaning yozma topshirig'ini tekshirib, tushirib qoldirilgan biologik tushunchalarni ko'rsatuvchi avtomatlashtirilgan baholash yordamchisi.
- **Test Tahlili va Insights:** Sinfning o'rtacha bali, eng ko'p xato qilingan qiyin savollar va sun'iy intellekt xulosalari.

### 🎒 4. O'quvchilar va Gamifikatsiya (Student Experience)
- **TUSHUN Do'sti (Emotsional AI Mentor):** O'quvchini eshituvchi, uning kayfiyatini his qiluvchi (Sher, Panda, Robot, Quyoncha) va xatolari uchun koyimaydigan do'stona murabbiy.
- **Test Runner (Stress-Free):** Tasodifiy topshirishdan himoyalovchi tasdiqlash oynasi va ikkilangan savollarni qayta ko'rish imkoniyati.
- **Gamifikatsiya Ekotizimi:** Darslarni o'zlashtirish orqali XP va tangalar yig'ish, peshqadamlar jadvali (Leaderboard) va markaz do'konidan haqiqiy sovg'alarga buyurtma berish.
- **Multimodal Ta'lim:** O'zbek tilidagi ovozli audio darslar, slaydli video dars va Gemini Live interaktiv suhbati.

---

## 🧠 TUSHUN Pedagogikasi Nima?

Abdora AI asosida bolalarni ta'limdan bezdirmaslik va xavfsiz psixologik muhit yaratishga qaratilgan **TUSHUN formulasi** yotadi:

* **T — Tingla:** O'quvchining savolini bo'lmasdan eshitish va his-tuyg'ularini tasdiqlash.
* **U — Yoshini hisobga ol:** Murakkab ilmiy iboralarsiz, bolaning yoshiga mos samimiy va do'stona til.
* **S — Sababini top:** Xatoni qoralamasdan, uning kelib chiqish sababini (charchoq, uyat, tushunmovchilik) aniqlash.
* **H — Hissiyotini nomla:** Emotsional qo'llab-quvvatlash (*"Bu mavzu boshida biroz murakkab tuyuladi, to'g'rimi? Birga o'rganamiz!"*).
* **U — Uddalaydigan vazifa ber:** Katta va qo'rqinchli tushunchalarni kichik, qiziqarli qadamlarga bo'lish.
* **N — Natijani nishonla:** Har qanday kichik urinish va yutuqni munosib olqishlash.

---

## 🛠 Texnologik Stek (Tech Stack)

| Qatlam | Texnologiyalar |
|---|---|
| **Frontend Web** | React 18, Vite 8, Tailwind CSS v4, TanStack Query v5, Framer Motion, Lucide Icons |
| **Backend API** | Node.js, Express, Prisma ORM, PostgreSQL (Neon / Supabase), JWT Authentication |
| **AI Integratsiya** | Google Gemini 2.5 Flash / Pro, Gemini TTS, Gemini Live, Banana AI Illustrations |
| **Mobil Ilova** | Flutter 3.x, Dart, Provider, Dio, Local Storage |
| **Moliya & Fayllar** | ExcelJS, Multer, Compression, Anti-Sleep Daemon |
| **Infratuzilma** | Docker, Render Cloud, GitHub Actions |

---

## 📁 Loyiha Kataloglar Tuzilishi

```
Abdora-ai/
├── bialogiya_frontend/          # React 18 + Vite SPA platformasi
│   ├── src/
│   │   ├── components/          # Reusable UI va AI komponentlar
│   │   ├── pages/
│   │   │   ├── admin/           # Superadmin va markaz boshqaruvi
│   │   │   ├── crm/ & manager/  # Sotuvlar, lidlar va guruhlar
│   │   │   ├── erp/ & finance/  # Kassa, kvitansiya va moliya
│   │   │   ├── teacher/         # Dars yaratish, davomat, baholash
│   │   │   └── student/         # Darslar, AI chat, testlar, do'kon
│   │   ├── config/              # Axios, xalqaro tillar va mavzular
│   │   └── utils/               # Formatlash, eksport va yordamchilar
│
├── bialogiya_beakent/           # Express + Prisma REST API
│   ├── src/
│   │   ├── controllers/         # Biznes mantiq (Admin, Lead, Test, Payment va h.k.)
│   │   ├── routes/              # API yo'llari va xavfsizlik cheklovlari
│   │   ├── middleware/          # JWT auth, role va ruxsatlar nazorati
│   │   ├── services/ai/         # Gemini, Prompts, Grading va TUSHUN xizmatlari
│   │   └── utils/               # Tokenlar, kassa, kesh va cron jarayonlar
│   ├── prisma/                  # schema.prisma va migratsiyalar
│   └── test/                    # 33 ta unit va integratsiya testlari
│
└── abdora_mobile/               # Flutter o'quvchi mobil ilovasi
    ├── lib/
    │   ├── core/                # API client, mavzular, xavfsiz saqlash
    │   ├── models/              # Talaba, dars, test va do'kon modellari
    │   ├── providers/           # Holat boshqaruvi (State Management)
    │   └── screens/student/     # Darslar, testlar, mini-o'yinlar va profil
```

---

## ⚡ Tezkor O'rnatish va Ishga Tushirish

### 1. Repozitoriyni klonlash
```bash
git clone https://github.com/omonovdev/Abdora-ai.git
cd Abdora-ai
```

### 2. Backendni sozlash va yurgizish
```bash
cd bialogiya_beakent
npm install
cp .env.example .env

# Ma'lumotlar bazasini sinxronlash
npx prisma generate
npx prisma db push

# Testlarni tekshirish (33 ta test)
node --test

# Serverni ishga tushirish (Port: 5000)
npm run dev
```

### 3. Frontendni sozlash va ishga tushirish
```bash
cd ../bialogiya_frontend
npm install

# Ishlab chiqish serveri (Port: 5173)
npm run dev

# Ishlab chiqarish (Production build)
npm run build
```

### 4. Mobil ilovani ishga tushirish
```bash
cd ../abdora_mobile
flutter pub get
flutter run
```

---

## 🧪 Sinovlar va Sifat Kafolati (Quality Assurance)

Loyiha qat'iy test madaniyati asosida ishlab chiqilgan bo'lib, har bir o'zgarish avtomatlashtirilgan testlar to'plami orqali tekshiriladi:
* **Jami testlar soni:** `33 ta`
* **Test natijasi:** `33 pass, 0 fail`
* **Qamrov:** Anti-sleep servisi, baholash qoidalari, markazlar multi-tenant izolyatsiyasi, to'liq qabulxona zanjiri (`test_reception_flow.js`) va o'quvchi hayotiy sikli simulyatsiyasi (`test_student_simulation.js`).

---

## 👥 Real Foydalanuvchilar va Mutaxassislar Bahosi

Platforma 10 ta turli xil real personaj (markaz egasi, repetitor, abituriyent, bosh hisobchi, ota-ona, UI/UX dizayner va CTO) tomonidan to'liq sinovdan o'tkazilib, **8.55 / 10** umumiy qoniqish reytingiga ega bo'ldi.

---

## 📄 Litsenziya

Ushbu loyiha [MIT Litsenziyasi](LICENSE) asosida ochiq manbali etib belgilangan.

---
⭐ **Loyihani qo'llab-quvvatlash uchun yulduzcha (Star) bosishni unutmang!**
