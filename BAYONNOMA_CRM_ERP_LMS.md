# O'quv Markazi Axborot Tizimi (CRM + ERP + LMS): Rasmiy Texnik Bayonnoma

**Hujjat turi:** Tizim muvofiqligi, arxitekturasi va bajarilgan ishlar bayonnomasi  
**Sana:** 2026-yil 24-sentabr  
**Loyiha:** Abdora AI / Neyron CRM-ERP-LMS Platformasi  
**Holat:** Ishlab chiqilgan, to'liq testdan o'tgan, sinxronlashtirilgan  

---

## 1. Kirish va Tizimning Umumiy Tavsifi

Mazkur platforma zamonaviy o'quv markazlari, akademiyalar va xususiy maktablarning barcha biznes jarayonlarini yagona ekotizimda boshqarish uchun ishlab chiqilgan kompleks dasturiy ta'minotdir. Tizim quyidagi uchta asosiy ustunni to'liq qamrab oladi:

1. **CRM (Customer Relationship Management)** — Mijozlar, yangi lidlar, o'quvchilar bilan muloqot va konversiya jarayonlarini boshqarish.
2. **ERP (Enterprise Resource Planning)** — Markazning ichki resurslari: moliya, kassa, filiallar, dars jadvali, xonalar va xodimlar maoshi (payroll) hisob-kitobi.
3. **LMS (Learning Management System)** — O'quv jarayoni: guruhlar, darslar, davomat, testlar, uyga vazifalar, baholash, gamifikatsiya va Sun'iy Intellekt (AI) vositalari.

---

## 2. CRM Talablariga To'liq Javob Berishi

Tizim o'quv markaziga yangi mijozlar jalb qilishdan to ularning to'lov qiluvchi o'quvchiga aylanishigacha bo'lgan to'liq tsiklni avtomatlashtiradi:

### 2.1. Lidlar va Savdo Voronkasi (Leads Pipeline)
- **Vizual Kanban va Jadval rejimlari**: Yangi lidlar bosqichlar bo'yicha saralanadi (`Yangi`, `Bog'lanildi`, `Sinov darsi belgilandi`, `Sinov darsiga keldi`, `To'lov kutilmoqda`, `Guruhga qo'shildi`, `Yo'qotildi`).
- **Kelib chiqish manbalari tahlili**: Telegram, Instagram, Veb-sayt, Do'st tavsiyasi, Banner va boshqa manbalar kesimida hisobot.
- **Tezkor muloqot vositalari**: Telefon orqali 1-bosishda qo'ng'iroq qilish, SMS yuborish, statusni o'zgartirish.

### 2.2. O'quvchining 360-darajali CRM Profili
- **LC-UP uslubidagi kompleks kartochka**:
  - Shaxsiy va aloqa ma'lumotlari, filiali, qachon qo'shilganligi.
  - **Moliyaviy status**: Jami to'langan summa, joriy qarzdorlik, oylik to'lov summasi, status nishoni (Qarzdor / To'langan).
  - **Xodimlar eslatmalari (Reminders)**: Har bir xodim o'quvchi profilida eslatma qoldirishi mumkin (masalan: *"25-sanada ota-onasi bilan gaplashish kerak"*).
  - **Gamifikatsiya ko'rsatkichlari**: To'plangan tangalar, umumiy XP, faollik darajasi (Level), uzluksiz darsga qatnashish (Streak).

### 2.3. Avtomatlashtirilgan Xabarnomalar
- Darsga kelmaganda ota-onaga avtomatik SMS xabarnoma.
- To'lov qabul qilinganda elektron chek va tasdiq SMS xabari.
- To'lov muddati yaqinlashganda eslatuvchi xabarlar.

---

## 3. ERP Talablariga To'liq Javob Berishi

Platforma o'quv markazining barcha moliyaviy va operatsion resurslarini qat'iy nazorat ostida ushlab turadi:

### 3.1. Kassa va Moliya Boshqaruvi (Cashbox & Finance)
- **Jonli Kassa (Cashbox)**: Naqd pul, Click, Payme va Bank o'tkazmalari kesimida aniq balans va operatsiyalar jurnali.
- **Kirim va Chiqimlar**: O'quvchilar to'lovlari kassa kirimi sifatida, o'qituvchilar maoshi va boshqa operatsion xarajatlar chiqim sifatida hisobga olinadi.
- **1-bosishda Moliya/Kassa Xavfsizligi**: Manager yoki Admin 1 ta tugma orqali Qabulxona (Reception) xodimlarining Moliya va Kassa ma'lumotlarini ko'rish huquqini bir lahzada bloklashi yoki ochishi mumkin.

### 3.2. O'qituvchilar Maoshi va Payroll Tizimi
- **3 xil hisoblash mexanizmi**:
  1. *Foiz ulushi (Revenue Share)* — O'quvchilar to'lovidan belgilangan foiz (masalan, 40%, 50%, 60%).
  2. *Qat'iy oylik (Fixed)* — Har oy uchun belgilangan oylik maosh (masalan, 5 000 000 so'm).
  3. *Soatbay stavka (Hourly)* — O'tilgan dars soatlari bo'yicha to'lov.
- **O'qituvchining Shaxsiy Balansi**: Jami hisoblangan mablag', to'langan summa va joriy qoldiq balans.
- **To'lov qilish va Kassa integratsiyasi**: O'qituvchiga to'lov kiritilganda, ushbu chiqim avtomatik ravishda markazning Kassa xarajatlariga (`Expense: category='salary'`) biriktiriladi.

### 3.3. Filiallar va Xonalar Boshqaruvi
- **Ko'p filialli boshqaruv (Multi-Branch)**: Yuqori paneldagi Filial almashtirgich (Branch Switcher) orqali butun markaz yoki alohida filiallar bo'yicha filtrlash.
- **Xonalar boshqaruvi**: Xona nomi, sig'imi, darslarga biriktirilishi va yangi o'quv markazi uchun avtomatik standart xonalar generatsiyasi.

### 3.4. 7 Kunlik Interaktiv Dars Jadvali (Timetable)
- Qabulxona bosh sahifasida haftaning 7 kuni bo'yicha to'liq interaktiv dars jadvali.
- Xonalar va O'qituvchilar bo'yicha tezkor filtrlar.
- To'qnashuvlarni aniqlash (bir vaqtda bitta xona yoki o'qituvchiga ikkita dars qo'yilsa, qizil ogohlantirish).

### 3.5. Chek Printer Sozlamalari
- 80mm va 58mm termal printerlar hamda A4 formatidagi kvitansiyalar uchun to'liq moslashuv.
- To'lovdan so'ng avtomatik chop etish va chek raqamini nusxalash imkoniyati.

---

## 4. LMS Talablariga To'liq Javob Berishi

O'quv jarayonini rejalashtirish, o'tkazish va Sun'iy Intellekt bilan boyitish:

### 4.1. Guruhlar va Darslar Boshqaruvi
- Dars kunlari (toq, juft, haftalik kunlar), dars vaqti oralig'i (zamonaviy TimeRangePicker va 6 ta tezkor presetlar).
- Har bir guruhga o'qituvchi, xona, filial va oylik to'lov narxi biriktirilishi.

### 4.2. Davomat Tizimi
- O'quvchilar davomati (Kelgan, Kelmagan, Sababli, Kech qolgan).
- Guruh va o'quvchi darajasida davomat foiz ko'rsatkichlari.

### 4.3. Sun'iy Intellekt (AI) bilan Integratsiya va O'qituvchi Tekshiruvi
- **AI Dars Generatsiyasi**: Mavzu bo'yicha tushuntirish, mnemonik qoidalar, qiziqarli hikoya va xulosalar.
- **O'qituvchi Tekshiruv Rejimi (Teacher Review Mode)**:
  - Dars tepasida o'qituvchi tasdiqlash banneri ("O'qituvchi tomonidan tasdiqlangan" vs "Tekshiruv kutilmoqda").
  - Viktorina savollari va to'g'ri javoblarni bir vaqtda ko'rish, joyida tahrirlash (Inline Edit) va noto'g'ri savollarni o'chirish.
- **AI Testlar Boshqaruvi**: PDF, Word yoki rasm fayllaridan generatsiya qilingan savollarni to'liq ro'yxatda ko'rish, to'g'ri javoblarni tekshirish va tahrirlash.
- **AI Uyga Vazifalar va Baholash**:
  - Vazifa tuzishda o'qituvchiga **Namunaviy to'g'ri yechimlar (Sample Solutions)** va **Baholash mezonlari** oldindan ko'rsatiladi.
  - O'quvchi topshirgan vazifalarga AI bergan ball, izoh va kamchiliklarni ko'rish hamda 1-bosishda "AI bahosini qabul qilish".

### 4.4. Gamifikatsiya va Rag'batlantirish
- Testlar, uy vazifalari va darslardagi faollik uchun Tangalar (Coins) va Tajriba ballari (XP).
- Darajalar (Levels), PesHQadamlar jadvali (Leaderboard) va Tangalar harakati tarixi.

---

## 5. Yangi Tuzatilgan Muammolar va Bajarilgan Ishlar Ro'yxati

Mazkur murojaat asosida quyidagi 4 ta asosiy talab to'liq bajarildi:

### 1-Vazifa: Backend Sintaksis Auditi
- **Bajarildi:** `bialogiya_beakent/src` ichidagi barcha 6 ta modul (`controllers/`, `routes/`, `services/`, `middleware/`, `config/`, `utils/`) va `server.js` Node.js `node --check` orqali to'liq sintaksis tekshiruvidan o'tkazildi.
- **Natija:** Barcha fayllar 0 ta xatolik bilan muvaffaqiyatli tekshirildi. Prisma sxemasi `npx prisma validate` bilan to'liq tasdiqlandi.

### 2-Vazifa: Sozlamalar Izolyatsiyasi (Cross-Account Leakage Fix)
- **Muammo:** Admin sozlamalarni o'zgartirsa, Manager sozlamalarida ham o'sha o'zgarishlar paydo bo'lib qolayotgan edi, chunki ikkala rol ham bazadagi bitta umumiy `Center.settings` JSON maydoniga yozardi.
- **Yechim ([admin.controller.js](file:///c:/Users/abdul/OneDrive/Desktop/Abdora-ai-main/bialogiya_beakent/src/controllers/admin.controller.js)):**
  - `center.settings` ichida **Role-Scoped Namespaces** arxitekturasi joriy etildi:
    - `adminPrefs` — faqat Admin yozadi va faqat Adminga beriladi.
    - `managerPrefs` — faqat Manager yozadi va faqat Managerga beriladi.
    - `receptionPrefs` — faqat Reception yozadi va faqat Receptionga beriladi.
  - Markazning umumiy ma'lumotlari (`centerName`, `centerAddress`, `centerPhone`, `centerEmail`, `centerWebsite`) barcha rollar uchun markaziy darajada sinxron saqlanadi. Markaz nomini o'zgartirish faqat Adminga ruxsat etiladi.
  - Qabulxona huquqlari (`receptionPermissions`) faqat Admin va Manager tomonidan boshqariladi.
  - Frontendda ([Topbar.jsx](file:///c:/Users/abdul/OneDrive/Desktop/Abdora-ai-main/bialogiya_frontend/src/components/layout/Topbar.jsx) va [Sidebar.jsx](file:///c:/Users/abdul/OneDrive/Desktop/Abdora-ai-main/bialogiya_frontend/src/components/layout/Sidebar.jsx)) foydalanuvchi hisobdan chiqqanida (`logout`) `qc.clear()` chaqirilib, xotira keshidagi avvalgi akkaunt ma'lumotlari to'liq tozalanadigan qilindi.

### 3-Vazifa: Backendni Sinovdan O'tkazish va Kodni Tozalash
- **Bajarildi:** Yangi avtomatlashtirilgan [settings-isolation.test.js](file:///c:/Users/abdul/OneDrive/Desktop/Abdora-ai-main/bialogiya_beakent/test/settings-isolation.test.js) testi yaratildi.
- **Natija:** `node --test test/*.test.js` buyrug'i orqali barcha 4 ta test to'liq muvaffaqiyatli o'tdi (0 fail):
  - Markazlararo kirish huquqi testi (pass)
  - O'qituvchining o'z guruhiga kirish huquqi testi (pass)
  - Begona guruh o'quvchisini cheklash testi (pass)
  - Sozlamalarning rollararo izolyatsiyasi testi (pass)
- `admin.controller.js` dagi takroriy izohlar va keraksiz qoldiq kodlar tozalandi.

### 4-Vazifa: Frontend Build va Texnik Bayonnoma
- **Bajarildi:** `cmd.exe /c npm run build` orqali frontend to'liq yig'ildi (19.46s, 0 ta xatolik).
- **Hujjatlashtirildi:** Ushbu rasmiy Texnik Bayonnoma tuzildi va loyihaning asosiy katalogiga [BAYONNOMA_CRM_ERP_LMS.md](file:///c:/Users/abdul/OneDrive/Desktop/Abdora-ai-main/BAYONNOMA_CRM_ERP_LMS.md) fayli sifatida saqlab qo'yildi.

---

## 6. O'zgartirilgan Asosiy Fayllar Mundarijasi

| Fayl | O'zgarish Mazmuni |
|---|---|
| `bialogiya_beakent/src/controllers/admin.controller.js` | Role-scoped sozlamalar namespaces (`adminPrefs`, `managerPrefs`, `receptionPrefs`) va tozalash |
| `bialogiya_beakent/test/settings-isolation.test.js` | Sozlamalar izolyatsiyasini avtomatlashtirilgan tekshirish testi |
| `bialogiya_frontend/src/components/layout/Topbar.jsx` | Chiqishda (logout) keshni tozalash (`qc.clear()`) |
| `bialogiya_frontend/src/components/layout/Sidebar.jsx` | Chiqishda (logout) keshni tozalash (`qc.clear()`) |
| `bialogiya_frontend/src/pages/admin/AdminSettings.jsx` | Admin sozlamalar interfeysi va boshqaruvi |
| `bialogiya_frontend/src/pages/manager/ManagerSettings.jsx` | Manager sozlamalar interfeysi va filial nazorati |
| `bialogiya_frontend/src/pages/reception/ReceptionSettings.jsx` | Reception sozlamalar interfeysi va chek printer nazorati |
| `BAYONNOMA_CRM_ERP_LMS.md` | Tizimning CRM+ERP+LMS ga to'liq javob berishi haqidagi rasmiy bayonnoma |

---
*Hujjat to'liq tasdiqlandi va foydalanishga tayyor.*
