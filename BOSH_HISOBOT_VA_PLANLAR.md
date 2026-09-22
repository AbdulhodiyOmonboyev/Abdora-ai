# O'quv Markazi Boshqaruv Tizimi (CRM + ERP + LMS): Barcha Rejalar va Hisobotlar Majmuasi

Ushbu hujjat mazkur loyiha bosqichida amalga oshirilgan barcha texnik rejalar, arxitektura o'zgarishlari, yangi joriy etilgan modullar, tuzatilgan xatoliklar va to'liq hisobotlarni o'z ichiga oladi.

---

## Mundarija

1. [1-Bo'lim. Qabulxona (Reception) Huquqlari va 1-Bosishda Moliya/Kassani Boshqarish Tizimi](#1-qabulxona-reception-huquqlari-va-1-bosishda-moliyakassani-boshqarish-tizimi)
2. [2-Bo'lim. Qabulxona Xodimlarini Filial va Markaz Bo'yicha Bog'lash (Scoping Tuzatmasi)](#2-qabulxona-xodimlarini-filial-va-markaz-boyicha-boglash-scoping-tuzatmasi)
3. [3-Bo'lim. Qabulxona Modali Dark Mode va Ochilib-Yopiladigan Silliq Sidebar](#3-qabulxona-modali-dark-mode-va-ochilib-yopiladigan-silliq-sidebar)
4. [4-Bo'lim. O'quvchining To'liq Profili, To'lovlar, Davomat, Gamifikatsiya va Eslatmalar Paneli (CRM+LMS)](#4-oquvchining-toliq-profili-tolovlar-davomat-gamifikatsiya-va-eslatmalar-paneli-crmlms)
5. [5-Bo'lim. Qabulxona Bosh Sahifasida 7 Kunlik Interaktiv Dars Jadvali Vidjeti](#5-qabulxona-bosh-sahifasida-7-kunlik-interaktiv-dars-jadvali-vidjeti)
6. [6-Bo'lim. Guruh Yaratish va Tahrirlashda Xonani Tanlash (Select Dropdown)](#6-guruh-yaratish-va-tahrirlashda-xonani-tanlash-select-dropdown)
7. [7-Bo'lim. Kassa (Cashbox) Sahifasidagi Rendering va Ruxsat Muammolari Yechimi](#7-kassa-cashbox-sahifasidagi-rendering-va-ruxsat-muammolari-yechimi)
8. [8-Bo'lim. Guruh Yaratishda Xonani Tanlash va Erkin Kiritish (Dual-Mode)](#8-guruh-yaratishda-xonani-tanlash-va-erkin-kiritish-dual-mode)
9. [9-Bo'lim. Guruh Yaratish Modalining O'lchamini Ixchamlashtirish (Responsive 2-Ustunli Dizayn)](#9-guruh-yaratish-modalining-olchamini-ixchamlashtirish-responsive-2-ustunli-dizayn)
10. [10-Bo'lim. Dars Vaqtini Tanlashda Zamonaviy TimeRangePicker (UI/UX)](#10-dars-vaqtini-tanlashda-zamonaviy-timerangepicker-uiux)
11. [11-Bo'lim. Headerda Global Qidiruv, Filiallar Filtr/Almashtirgichi va "Live" Nishonlarini Tozalash](#11-headerda-global-qidiruv-filiallar-filtralmashtirgichi-va-live-nishonlarini-tozalash)
12. [12-Bo'lim. O'qituvchining To'liq Profili, Balansi, To'lovlar Tarixi va Maosh Tizimi (Payroll)](#12-oqituvchining-toliq-profili-balansi-tolovlar-tarixi-va-maosh-tizimi-payroll)
13. [13-Bo'lim. O'qituvchi Yaratishda va Tahrirlashda Maosh Shartlarini Kiritish](#13-oqituvchi-yaratishda-va-tahrirlashda-maosh-shartlarini-kiritish)
14. [14-Bo'lim. Barcha Rollar Uchun Alohida va Ixtisoslashgan Sozlamalar Bo'limi (Role-Based Settings)](#14-barcha-rollar-uchun-alohida-va-ixtisoslashgan-sozlamalar-bolimi-role-based-settings)
15. [15-Bo'lim. Mavzular (Themes) Bo'limini Sozlamalar Ichiga O'tkazish va Ranglar Palitrasi](#15-mavzular-themes-bolimini-sozlamalar-ichiga-otkazish-va-ranglar-palitrasi)
16. [16-Bo'lim. Profil Menyu Tashqi Bosish (Outside Click) va Moslashuvchan (Responsive) Dizayn Tuzatishlari](#16-profil-menyu-tashqi-bosish-outside-click-va-moslashuvchan-responsive-dizayn-tuzatishlari)
17. [17-Bo'lim. O'qituvchi Tomonidan AI Yaratgan Darslar, Testlar va Vazifalarni Ko'rish, Tekshirish va Tasdiqlash](#17-oqituvchi-tomonidan-ai-yaratgan-darslar-testlar-va-vazifalarni-korish-tekshirish-va-tasdiqlash)
18. [18-Bo'lim. Tizim Tekshiruvi, Build va Git Holati](#18-tizim-tekshiruvi-build-va-git-holati)

---

## 1. Qabulxona (Reception) Huquqlari va 1-Bosishda Moliya/Kassani Boshqarish Tizimi

### Maqsad va Reja:
Admin va Managerlarga Qabulxona (reception) xodimlarining huquqlarini to'liq nazorat qilish, ayniqsa nozik ma'lumotlar (Moliya va Kassa) xavfsizligini ta'minlash uchun **1 ta tugma orqali ruxsatlarni ochish yoki yopish** imkoniyatini yaratish.

### Texnik Amalga Oshirish:
1. **Backend Xavfsizlik Qatlami**:
   - `bialogiya_beakent/src/middleware/auth.middleware.js`:
     - `requireReceptionPermission(permissionKey)` middleware joriy etildi.
     - `admin` va `manager` rollari doimo cheklovlarsiz o'tadi.
     - `reception` roli uchun markaz sozlamalaridagi `settings.receptionPermissions` tekshiriladi.
     - `canViewFinance` va `canViewCashbox` sukut bo'yicha `false` qilindi (ruxsat berilmaguncha 403 Forbidden qaytadi).
   - Marshrutlar himoyasi:
     - `finance.routes.js`: `/summary`, `/by-group`, `/cash`, `/advice`, `/expenses` yo'nalishlariga `canViewFinance` ulandi.
     - `/cashbox`, `/cashbox/transaction` yo'nalishlariga `canViewCashbox` ulandi.
     - `payment.routes.js` va `lead.routes.js` ga tegishli ruxsatlar biriktirildi.
2. **Frontend Boshqaruv Paneli**:
   - `AdminReception.jsx` va `AdminSettings.jsx`:
     - Sahifa yuqorisida **1-bosish tezkor boshqaruv paneli**: "1 bosishda bloklash" (agar ochiq bo'lsa) va "Moliya va Kassaga ruxsat berish" (agar yopiq bo'lsa).
     - 8 ta alohida huquqlar o'chirgichlari (`ToggleSwitch`):
       - Moliya sahifasi va hisobotlari (`canViewFinance`)
       - Kassa va naqd tushumlar (`canViewCashbox`)
       - To'lovlarni qabul qilish (`canManagePayments`)
       - Lidlar (CRM) bilan ishlash (`canManageLeads`)
       - Dars jadvali va xonalar (`canManageTimetable`)
       - Guruhlar ro'yxati (`canManageGroups`)
       - O'quvchilar ro'yxati (`canManageStudents`)
       - O'qituvchilar ro'yxati (`canManageTeachers`)
3. **Marshrut va Menyu Himoyasi**:
   - `Sidebar.jsx` va `MobileBottomNav.jsx`: Ruxsati yo'q bo'limlar menyuda ko'rinmaydi.
   - `App.jsx`: `ProtectedRoute` qabulxona cheklangan URL ga qo'lda kirganda ham avtomatik ruxsat berilgan sahifaga yo'naltiradi.

---

## 2. Qabulxona Xodimlarini Filial va Markaz Bo'yicha Bog'lash (Scoping Tuzatmasi)

### Muammo:
Manager hisobida "Hali qabulxona hisoblari yo'q" deb ko'rinishi aniqlandi, chunki avvalgi so'rov faqat `branch.managerId === req.user.userId` shartini tekshirgan, xodimlar esa markazga to'g'ridan-to'g'ri biriktirilgan bo'lishi mumkin edi.

### Texnik Amalga Oshirish:
1. `bialogiya_beakent/src/controllers/admin.controller.js`:
   - `resolveSettingsCenter(req)` funksiyasi joriy qilinib, foydalanuvchining markazi (`centerId`) aniqlanadi.
   - `getReceptionUsers`: Markaz va unga tegishli barcha filiallardagi reception hisoblari to'liq yuklanishi ta'minlandi.
   - `createReceptionUser`: Yangi hisob ochilganda `centerId` avtomatik yoziladi va filial tanlansa, filialga `managerId` bog'lanadi.
   - `updateReceptionUser`: Filialni o'zgartirish va ma'lumotlarni tahrirlash to'liq sinxronlandi.
   - `deleteReceptionUser`: Xodim o'chirilganda filial bo'shatilib, hisob faolsizlantiriladi.
2. `AdminSettings.jsx` dagi hisob yaratish modali:
   - Yangi ochilgan qabulxona hisobining Login va Parolini darhol ko'rsatuvchi va buferga nusxalovchi qulay oyna qo'shildi.

---

## 3. Qabulxona Modali Dark Mode va Ochilib-Yopiladigan Silliq Sidebar

### Texnik Amalga Oshirish:
1. **Dark Mode Moslashuvi**:
   - `AdminReception.jsx` dagi qat'iy oq fon sinflari CSS o'zgaruvchilarga (`var(--card)`, `var(--border)`, `var(--text-primary)`) almashtirildi.
   - Xodimlar kartasida biriktirilgan filial nomi (`Chilonzor filiali` yoki `Filial biriktirilmagan`) aniq ko'rsatildi.
2. **Kengaytiriladigan va Yig'iladigan Sidebar**:
   - `Topbar.jsx`, `Sidebar.jsx`, `MainLayout.jsx`:
   - Menyuni ochish/yopish tugmasi desktop ekranlarida ham doimiy ko'rinadigan qilindi.
   - Sidebar kengligi `w-64` dan `w-0` ga silliq animatsiya bilan qisqaradi va butun sahifa ekranga kengayadi.
   - Holat `localStorage` da eslab qolinadi.

---

## 4. O'quvchining To'liq Profili, To'lovlar, Davomat, Gamifikatsiya va Eslatmalar Paneli (CRM+LMS)

### Maqsad va Reja:
Namuna (LC-UP o'quvchi kartochkasi) asosida o'quvchi haqidagi barcha akademik, moliyaviy, davomat va eslatmalar tarixini bitta zamonaviy profil sahifasida jamlash.

### Texnik Amalga Oshirish:
1. **Chap Karta (Shaxsiy & Moliyaviy Holat)**:
   - Ism-familiya, @login, roli, faollik/muzlatilganlik nishoni.
   - **Moliya**: Jami to'langan summa, qarzdorlik holati, guruh oylik to'lovi va holat nishoni (Qarzdor / To'langan).
   - **Gamifikatsiya**: To'plangan tangalar (Coins), umumiy XP, daraja (Level), uzluksiz qatnashish (Streak).
   - **Aloqa**: Telefon, email, yosh, jins, manzil, filial, ro'yxatdan o'tgan sana.
   - **Eslatmalar (Reminders)**: Xodimlar eslatma yozish bloki (masalan: *"21.09 to'lov qiladi"*), yozgan xodim nomi, sanasi va o'chirish.
   - **Tezkor Tugmalar**: To'lov qilish, Tanga berish/ayirish, Tahrirlash, Muzlatish/Faollashtirish.
2. **O'ng Blok (6 ta Bo'lim / Tabs)**:
   - **Guruhlar**: A'zo bo'lgan guruhlar, dars kunlari, soatlari, o'qituvchi, xona, filial, davomat foizi.
   - **To'lovlar**: Jami to'lovlar, qarzdorlik vidjeti, to'lov kiritish modali, to'lovlar jurnali (oy, summa, to'lov usuli, kvitansiya/chek).
   - **Davomat**: Jami darslar, kelgan, kelmagan, sababli darslar soni, foiz ko'rsatkichi, har bir dars sanasi.
   - **Tanga/Kristal Tarixi**: Harakatlar xronologiyasi (test topshirish, vazifa bajarish, admin bonusi/jarimasi, mas'ul xodim).
   - **Imtihonlar**: Topshirilgan testlar, ballar, progress bar, natija holati.
   - **Mashqlar**: Uy vazifalari jurnali, topshirilgan vaqt, o'qituvchi bahosi va izohi.
3. **Interaktiv Modallar**:
   - Tezkor to'lov kiritish (naqd/click/payme/bank).
   - Tanga va XP qo'shish yoki jarima yozish (sababi ko'rsatilgan holda).
   - Eslatma yaratish modali.

---

## 5. Qabulxona Bosh Sahifasida 7 Kunlik Interaktiv Dars Jadvali Vidjeti

### Maqsad va Reja:
Qabulxona bosh sahifasidagi umumiy chiziqli faollik grafigi o'rniga qabulxona xodimiga har kuni kerak bo'ladigan to'liq interaktiv **Haftalik dars jadvali vidjeti**ni joylashtirish.

### Texnik Amalga Oshirish:
1. `TimetableWidget.jsx` va `ReceptionDashboard.jsx`:
   - 7 kunlik haftalik taqvim (`Du, Se, Ch, Pa, Ju, Sha, Yak`) va 8:00 dan 21:00 gacha bo'lgan vaqt katakchalari.
   - Bugungi kun alohida sarlavha va rang bilan ajratilgan.
   - Xonalar bo'yicha va O'qituvchilar bo'yicha almashtirish filtri.
   - Bir vaqtga tushgan darslarni kenglik bo'yicha teng taqsimlash algoritmi (`computeDayLayout`).
   - To'qnashuvlarni aniqlash (bir vaqtda bitta xona yoki o'qituvchiga ikkita dars qo'yilsa, qizil ogohlantirish beriladi).
   - Dars katakchasiga bosilganda dars tafsilotlari popoveri ochiladi.
   - Yuqoridagi "To'liq" tugmasi orqali to'liq `/erp/timetable` sahifasiga tezkor o'tish imkoniyati.

---

## 6. Guruh Yaratish va Tahrirlashda Xonani Tanlash (Select Dropdown)

### Texnik Amalga Oshirish:
1. `ReceptionGroups.jsx`:
   - Qo'lda yoziladigan erkin matnli input o'rniga barcha xonalar ro'yxatini yuklovchi dinamik dropdown (`<select>`) o'rnatildi.
   - Birinchi variant: `"Xona tanlang"`.
   - Har bir xona yonida uning sig'imi ko'rsatiladi (masalan: `3-xona (20 kishi)`).
   - Tahrirlashda avvalgi tanlangan xona avtomatik belgilangan bo'lib ochiladi.
2. `group.controller.js`:
   - `createGroup` va `updateGroup` metodlariga `roomId` maydoni ulandi.
   - Xona id si (`roomId`) va uning nomi (`room: foundRoom.name`) ikkalasi ham bazaga sinxron saqlanadi.

---

## 7. Kassa (Cashbox) Sahifasidagi Rendering va Ruxsat Muammolari Yechimi

### Muammolar va Ularning Yechimi:
1. **React Rendering Crash (Objects are not valid as a React child)**:
   - `CashboxPage.jsx` da `{cfg.icon}` va `<option>{v.icon} {v.label}</option>` ko'rinishida React ob'yekti to'g'ridan-to'g'ri render qilingan edi.
   - Tuzatish: `<Icon size={18} />` komponentiga o'tkazildi, `<option>` ichidagi ob'yekt olib tashlandi.
2. **Super Admin menyusiga Kassa va Moliya qo'shilishi**:
   - `Sidebar.jsx` da `admin` roli uchun Kassa va Moliya menyulari ulandi.
3. **Backend Scoping Mustahkamlanishi**:
   - `finance.controller.js` dagi `getCashbox` so'rovida `centerId` va `branchId` filtrlari optimallashtirildi.

---

## 8. Guruh Yaratishda Xonani Tanlash va Erkin Kiritish (Dual-Mode)

### Maqsad:
Agar tizimda xonalar hali qo'shilmagan bo'lsa yoki yangi nomdagi xona kerak bo'lsa, foydalanuvchi to'xtab qolmasligi uchun ikkala usulni ham berish.

### Texnik Amalga Oshirish:
1. `ReceptionGroups.jsx`:
   - Foydalanuvchiga standart xonalar ro'yxati (`1-xona`, `2-xona`, `3-xona` ...) bilan birga **`+ Boshqa xona yozish`** / **`Ro'yxatdan tanlash`** tugmasi taqdim etildi.
2. `room.controller.js` & `group.controller.js`:
   - `getRooms` yangi o'quv markazlari uchun xonalar soni 0 ta bo'lsa, avtomatik `1-xona` .. `5-xona` larni yaratib beradi.
   - Agar guruh yaratishda yangi xona nomi yozilsa, backend ushbu xonani avtomatik ravishda markazning `Room` jadvaliga kiritadi va dars jadvaliga ulaydi.

---

## 9. Guruh Yaratish Modalining O'lchamini Ixchamlashtirish (Responsive 2-Ustunli Dizayn)

### Muammo:
Modal oynasi uzun vertikal qator tufayli 850px+ bo'lib, ekranning pastki qismidagi "Bekor" va "Yaratish" tugmalari kesilib qolayotgan edi.

### Texnik Amalga Oshirish:
1. `ReceptionGroups.jsx`:
   - Barcha maydonlar 2 ustunli ixcham gridga juftlandi:
     - 1-qator: Guruh nomi va O'qituvchi
     - 2-qator: Markaz/Filial va Oylik to'lov
     - 3-qator: Hafta kunlari (7 ta ixcham tugma)
     - 4-qator: Dars vaqti va Xona tanlash
     - 5-qator: Daraja va Jami darslar
   - Modal balandligi ~460px ga qisqardi (`max-h-[92vh] flex flex-col`).
   - Kontent qismi `overflow-y-auto`, pastki tugmalar esa `flex-shrink-0` bilan doimo ko'rinadigan qilindi.

---

## 10. Dars Vaqtini Tanlashda Zamonaviy TimeRangePicker (UI/UX)

### Texnik Amalga Oshirish:
1. `ReceptionGroups.jsx`:
   - Brauzerning standart oq rangli noqulay vaqt spinnery butunlay olib tashlandi.
   - Dark/Light mode ga 100% mos suzuvchi TimeRange popoveri o'rnatildi.
   - **6 ta Mashhur Presetlar (1-bosishda to'ldirish)**:
     - `08:30 — 10:00`, `10:00 — 11:30`, `14:00 — 15:30`, `15:30 — 17:00`, `17:00 — 18:30`, `18:30 — 20:00`.
   - Boshlanish va tugash soatlari va daqiqalari uchun dropdownlar.
   - **Davomiylik Kalkulyatori**: `1 soat`, `1.5 soat (90 min)`, `2 soat` tugmalari tugash vaqtini avtomatik hisoblaydi.

---

## 11. Headerda Global Qidiruv, Filiallar Filtr/Almashtirgichi va "Live" Nishonlarini Tozalash

### Texnik Amalga Oshirish:
1. **"• Live" va ortiqcha elementlar olib tashlandi**:
   - `AdminDashboard`, `ManagerDashboard`, `TeacherDashboard`, `StudentDashboard`, `ReceptionGroups` sahifalaridagi chalg'ituvchi "Live" yorliqlari tozalandi.
2. **Global Filial Almashtirgich (Branch Switcher)**:
   - `branchStore.js`: Global filial holati (`selectedBranchId`, `selectedBranchName`) `zustand` orqali saqlanadi.
   - `Topbar.jsx`: Yuqori paneldan filial almashtirish dropdowni (Barcha filiallar, filiallar ro'yxati, manzillari va 1-bosishda almashtirish).
   - Statistika kartalari va Dars jadvali tanlangan filialga qarab darhol filtrlanadi.
3. **Yuqori Paneldagi Universal Jonli Qidiruv (Universal Search)**:
   - `Topbar.jsx`: Qabulxona, menejer va admin uchun qidiruv maydoni faollashtirildi.
   - Qidiruv natijalari popoverida bir vaqtning o'zida Guruhlar, O'quvchilar, O'qituvchilar va Xodimlar ko'rinadi.
   - Natijaga bosilganda to'g'ridan-to'g'ri o'sha sahifaga o'tadi.
4. **Backend**:
   - `admin.routes.js`: `GET /admin/branches` ga qabulxona va menejer ruxsati berildi.
   - `admin.controller.js`: `getStats` da `branchId` filtrlash joriy etildi.

---

## 12. O'qituvchining To'liq Profili, Balansi, To'lovlar Tarixi va Maosh Tizimi (Payroll)

### Maqsad va Reja:
O'qituvchi bosilganda tor modal o'rniga, uning qachon qo'shilgani, hisobida qancha puli borligi, qachon to'lov qilingani va maosh hisob-kitoblarini ko'rsatuvchi alohida to'liq sahifa (`/reception/teachers/:id`, `/manager/teachers/:id`, `/admin/teachers/:id`) yaratish.

### Texnik Amalga Oshirish:
1. **Hero Profil Kartasi**:
   - Qachon qo'shilgan sana (`createdAt`) va nisbiy vaqt.
   - Biriktirilgan filial, holati (faol/nofaol), telefon (nusxalash tugmasi bilan), email.
   - Maosh sharti nishoni (`50% ulush`, `5 mln so'm/oy`, `100 000 so'm/soat`).
   - "To'lov qilish" va "Maosh shartlari" boshqaruv tugmalari.
2. **Moliyaviy KPI Vidjetlari**:
   - **Hisobdagi mablag' (Qoldiq balans)**: `totalEarned - totalPaid`.
   - **Jami hisoblangan maosh**: O'quvchilar to'lovlari va o'qituvchi ulushi asosidagi daromad.
   - **To'lab berilgan summa**: Markaz tomonidan hozirgacha to'langan pullar yig'indisi.
   - **Ushbu oygi hisob**: Joriy oyda hisoblangan yangi maosh.
3. **4 ta Bo'lim (Tabs)**:
   - **Moliya & To'lovlar jurnali**: O'qituvchiga berilgan to'lovlar (sana, summa, to'lov turi, oy, mas'ul xodim, izoh) hamda guruhlar kesimidagi tushumlar jadvali.
   - **Guruhlar**: O'qituvchining barcha guruhlari, dars kunlari, vaqtlari, xonalari, o'quvchilar soni.
   - **O'quvchilar**: O'qituvchining barcha o'quvchilari ro'yxati va ularning to'lov/davomat holati.
   - **Darslar**: O'tkazilgan va rejadagi darslar.
4. **Modallar va Kassa Integratsiyasi**:
   - O'qituvchiga to'lov qilish modali: summa, presetlar (`500 ming`, `1 mln`, `2 mln`, `Balansni to'liq to'lash`), to'lov usuli va izoh.
   - Ushbu to'lov avtomatik kassa xarajatlariga (`Expense: category='salary'`) yoziladi va kassa balansidan kamayadi.
5. **Backend**:
   - `GET /admin/teachers/:id/overview`: Barcha tahliliy ko'rsatkichlarni hisoblab beradi.
   - `POST /admin/teachers/:id/payout`: To'lov kiritish va kassa chiqimiga bog'lash.
   - `PUT /admin/teachers/:id/salary-terms`: Maosh shartlarini yangilash.

---

## 13. O'qituvchi Yaratishda va Tahrirlashda Maosh Shartlarini Kiritish

### Texnik Amalga Oshirish:
1. `AdminTeachers.jsx` dagi "O'qituvchi qo'shish" modali:
   - **Maosh hisoblash shartlari bloki**:
     - **Foiz (Ulush)**: O'quvchi to'lovidan o'qituvchi foizi (masalan `50%`), tezkor presetlar (`30%`, `40%`, `50%`, `60%`, `70%`).
     - **Qat'iy oylik (Fixed)**: Oylik summa (so'mda), presetlar (`3 mln`, `5 mln`, `7 mln`, `10 mln`).
     - **Soatbay (Hourly)**: 1 soat dars narxi, presetlar (`50 000`, `80 000`, `100 000`, `150 000`).
   - Jadvalda "Maosh sharti" ustuni va qatordagi qalamcha (`Edit`) orqali tezkor tahrirlash imkoniyati.
   - Yangi o'qituvchi yaratilgandan keyin ko'rsatiladigan hisobotda login/parol bilan birga maosh sharti ham aks etadi.
2. `admin.controller.js`:
   - `createTeacher` va `updateTeacher`: `salaryType`, `salaryShare`, `fixedSalary`, `hourlyRate` maydonlarini to'liq qo'llab-quvvatlaydi.

---

## 14. Barcha Rollar Uchun Alohida va Ixtisoslashgan Sozlamalar Bo'limi (Role-Based Settings)

### Maqsad va Reja:
Har bir foydalanuvchi roli (Reception, Manager, Admin) faqat o'z vakolatidagi ishlarni sozlashi mumkin bo'lgan alohida sozlamalar sahifalariga ega bo'lishi.

### Texnik Amalga Oshirish:
1. **Reception Sozlamalari (`/reception/settings` - [ReceptionSettings.jsx])**:
   - **Kassa & Chek sozlamalari**: Chek printer o'lchami (`80mm`, `58mm`, `A4`), avto-chop etish, buferga nusxalash, chek pastki matni, birlamchi to'lov turi.
   - **Mening huquqlarim**: 8 ta huquqning ochiq yoki yopiqlik holatini ko'rish (shaffoflik).
   - **Bildirishnomalar va Ovoz**: Lid kelganda ovozli signal, to'lov olinganda kassa ovozi (chime), ovozni joyida tekshirish (Web Audio API).
   - **Shaxsiy profil va Parol**: Ism, telefon va parolni yangilash.
   - **Mavzular**: Light/Dark mode va ranglar palitrasi.
2. **Manager Sozlamalari (`/manager/settings` - [ManagerSettings.jsx])**:
   - **Reception Boshqaruvi va Xavfsizlik**: 1-bosishda Moliya/Kassani yopish/ochish, 8 ta operatsion ruxsatlarni boshqarish, yangi reception hisobini ochish.
   - **Filial Ma'lumotlari**: Nomi, manzili, telefoni, ish vaqti, dars davomiyligi.
   - **To'lov Qoidalari**: Qabul qilinadigan to'lov usullari, to'lovning oxirgi sanasi, rassrochka.
   - **LMS Qoidalari**: Guruhdagi maksimal o'quvchilar, minimal davomat %, o'tish balli %.
   - **CRM Lid Bosqichlari**: Lid holatlari va qabul kanallari.
   - **SMS Xabarnomalar**: Darsga kelmaganda, to'lov qabul qilinganda, eslatma SMS lari.
3. **Admin Sozlamalari (`/admin/settings` - [AdminSettings.jsx])**:
   - Butun markaz nomi, logotipi, barcha filiallar tarmog'i, xodimlar huquqlari, to'liq moliya va audit loglari.

---

## 15. Mavzular (Themes) Bo'limini Sozlamalar Ichiga O'tkazish va Ranglar Palitrasi

### Texnik Amalga Oshirish:
1. Sidebar'dagi ortiqcha alohida "Mavzular" menyusi olib tashlandi.
2. Mavzular va ranglar tanlovi har bir roldagi Sozlamalar sahifasiga (`Settings -> Ko'rinish / Mavzular`) o'tkazildi.
3. **6 ta Premium Ranglar Palitrasi**:
   - **Binafsharang / Indigo** (`#7c3aed`, `#6366f1`)
   - **Zumrad Yashil / Emerald** (`#059669`, `#10b981`)
   - **Moviy Okean / Sky Blue** (`#0284c7`, `#06b6d4`)
   - **Quyoshli Amber / Amber** (`#d97706`, `#f59e0b`)
   - **Nafis Qizg'ish / Rose** (`#e11d48`, `#f43f5e`)
   - **To'q Karbon / Slate** (`#475569`, `#64748b`)
4. `themeStore.js`: Tanlangan mavzu va rejim (Light/Dark) `localStorage` da xavfsiz saqlanadi.

---

## 16. Profil Menyu Tashqi Bosish (Outside Click) va Moslashuvchan (Responsive) Dizayn Tuzatishlari

### Muammolar va Ularning Yechimi:
1. **Profil Menyu Yopilmasligi**:
   - React 19 dagi batching mexanizmi sababli `v => !v` almashtirgichi qayta bosganda doimiy ochiq qolayotgan edi.
   - `Topbar.jsx` da `profileRef`, `notifRef`, `langRef`, `branchRef`, `searchRef` nomli 5 ta xavfsiz ref yaratildi.
   - Tashqariga bosilganda (`handleClickOutside`) yoki klaviaturadan `Escape` bosilganda barcha ochiq menyular darhol yopiladi.
   - Sahifalar almashganda (`location.pathname`) menyular avtomatik yopiladi.
2. **Ekranga Moslashuvchan (Responsive) Relativ Dizayn**:
   - `LandingPage` CSS qoidalari boshqaruv panelidagi `.stats-grid` ga sizib chiqib (CSS leakage), kartalarni cho'zib yuborayotgan edi. Ular `.home-stats-grid` ga ajratildi.
   - Barcha panel elementlarida qat'iy piksellar o'rniga `clamp(1rem, 2vw, 1.5rem)`, `minmax(0, 1fr)` va foizli nisbatlar qo'llanildi.

---

## 17. O'qituvchi Tomonidan AI Yaratgan Darslar, Testlar va Vazifalarni Ko'rish, Tekshirish va Tasdiqlash

### Maqsad va Reja:
O'qituvchi AI generatsiya qilgan barcha o'quv materiallari (dars tushuntirishlari, viktorinalar, test savollari, uyga vazifalar va sun'iy intellekt qo'ygan baholar)ni bevosita ko'rib chiqishi, rostdan to'g'ri yoki xatoligini tekshirishi, xatolarni tahrirlashi va o'z nomidan tasdiqlashi uchun to'liq tekshiruv (Verification & Review) tizimini yaratish.

### Texnik Amalga Oshirish:

#### 1. Darslar va Viktorinalar ([LessonDetail.jsx]):
- **O'qituvchi AI Tasdiqlash Banneri**:
  - Dars tepasida sariq rangli "AI yaratgan dars — O'qituvchi tekshiruvi kutilmoqda" ogohlantirishi.
  - "Hammasini to'g'ri deb tasdiqlash" tugmasi: bosilganda dars `isVerifiedByTeacher: true` bo'lib, yashil qalqon bilan tasdiqlanadi.
- **Maxsus O'qituvchi Quizz Rejimi (`TeacherQuizReview`)**:
  - O'qituvchi o'quvchi kabi birma-bir savollarni yechib o'tirmaydi.
  - Barcha savollar, to'g'ri javob kaliti (yashil rang va belgi bilan ajratilgan), qiyinlik darajasi, balli va AI tushuntirishlari bir vaqtda ko'rinadi.
  - Har bir savol uchun **Joyida Tahrirlash (Inline Edit)**, to'g'ri javobni o'zgartirish, savolni o'chirish va yangi savol qo'shish imkoniyati.
- **AI Dars Matnlarini Tuzatish**:
  - `explain` (oddiy tushuntirish), `tricks` (mnemonik usullar), `story` (qiziqarli voqea) va `summary` (xulosa) bloklarida o'qituvchi uchun "Tahrirlash" va "Saqlash" vositasi o'rnatildi.
- **Backend**: `PUT /api/lessons/:id/ai` endpointi darsning barcha AI komponentlarini yangilaydi.

#### 2. AI Test Savollarini Ko'rish va Boshqarish ([ManageTests.jsx]):
- Test kartalariga ko'z belgisi bilan **"Savollarni ko'rish va tekshirish"** tugmasi qo'shildi.
- **`TestQuestionsModal`**:
  - Fayldan (PDF, Word, rasm) AI tuzgan barcha savollar to'liq ro'yxatda ochiladi.
  - To'g'ri javob varianti yashil rangda belgilanadi.
  - O'qituvchi noto'g'ri savolni o'chirishi, variantlarini tahrirlashi va yangi savol qo'shishi mumkin. Testning umumiy balli avtomatik qayta hisoblanadi.
- **Backend**:
  - `PUT /api/tests/:testId/questions/:questionId`
  - `DELETE /api/tests/:testId/questions/:questionId`
  - `POST /api/tests/:testId/questions`

#### 3. AI Bilan Uyga Vazifa Yaratish va Namunaviy Javoblarni Tekshirish ([CreateHomework.jsx]):
- **`AiHomeworkModal`**:
  - O'qituvchi guruh, mavzu va qiyinlikni tanlab AI ga topshiriq tuzdiradi.
  - AI topshiriqlar bilan birga ularning **Namunaviy To'g'ri Yechimlari (Sample Answers)** va **Baholash Mezonlari**ni o'qituvchiga oldindan ko'rsatadi.
  - O'qituvchi to'g'riligini tekshirib, bir bosishda formaga ko'chiradi.
- **Backend**: `POST /api/homework/generate-ai` va tizimli `getHomeworkGenerationPrompt`.

#### 4. O'quvchilar Topshirgan Vazifalarni AI Baholashini Tekshirish ([GradeSubmissions.jsx]):
- O'quvchi javobiga AI qo'ygan ball, fikr, yetishmayotgan tushunchalar (`keyMissingConcepts`) va tavsiyalar (`suggestions`) ko'rsatiladi.
- **"AI bahosini qabul qilish"** tugmasi orqali o'qituvchi AI balli va tahlilini bir bosishda qabul qiladi yoki o'zgartirib saqlaydi.
- Backenddagi `gradeHomework` parametrlar nomuvofiqligi xatosi tuzatildi.

---

## 18. Tizim Tekshiruvi, Build va Git Holati

### 1. Build va Kompilyatsiya Natijalari:
- **Frontend**: `cmd.exe /c npm run build` muvaffaqiyatli yakunlandi (`3242 ta modul transformatsiya qilindi, 0 ta xatolik, 12.33 soniya`).
- **Backend**: Barcha yangi marshrutlar, kontrollerlar va middleware'lar sintaksis tekshiruvidan muvaffaqiyatli o'tdi.

### 2. Git Sinxronizatsiyasi:
Barcha o'zgarishlar GitHub omboridagi **4 ta asosiy tarmoqqa** to'liq yuklangan:
1. `v2/crm-erp-lms` (Asosiy ishchi tarmoq)
2. `main` (Asosiy ishlab chiqarish tarmog'i)
3. `master` (Zaxira bosh tarmoq)
4. `feature/crm-erp-lms` (Funksional tarmoq)

---
*Loyiha hisoboti to'liq tayyorlandi.*
