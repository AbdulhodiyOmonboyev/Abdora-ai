# Abdora Student — Flutter Mobil Ilovasi (Android & iOS)

Ushbu ilova **Abdora AI** ta'lim platformasining o'quvchilar uchun maxsus ishlab chiqilgan rasmiy mobil ilovasi hisoblanadi.

---

## 1. Ilova Xususiyatlari va Modullari

- **Asosiy Sahifa (Dashboard)**:
  - Kunlik seriya (Daily Streak) olovi
  - Daraja va XP progress ko'rsatkichi
  - Oltin tangalar (Coins) balansi
  - Tezkor statistika: O'rtacha o'zlashtirish balli, Davomat foizi, Topshirilishi kerak bo'lgan vazifalar
  - AI Tavsiyalari: O'quvchining zaif mavzulari bo'yicha tahlillar
  - Faol darslar ro'yxati

- **Darslar va 10 ta AI Moduli (LMS)**:
  - Dars materiallari va video qo'llanmalar
  - **10 ta interaktiv AI rejimi**:
    1. *Tushuntirish* — Sodda xalqona tilda AI tushuntirishi
    2. *Mnemotika* — Yodda saqlash va assotsiatsiya qoidalari
    3. *Hikoya* — Mavzu bo'yicha ilmiy hikoya rejimi
    4. *Misollar* — Hayotiy amaliy misollar
    5. *Xulosa* — Asosiy xulosalar va tushunchalar
    6. *Flashcardlar* — 3D aylanuvchi interaktiv kartalar
    7. *AI Quiz* — Mini-testlar va tushuntirishlar
    8. *Aql xaritasi* — Bog'liq tushunchalar tuzilmasi
    9. *AI Tyutor* — Dars bo'yicha savol-javob qiluvchi sun'iy intellekt

- **Topshiriqlar Markazi**:
  - **Imtihonlar & Testlar**:
    - Orqaga sanovchi taymer (Timer)
    - Savollar navigatori (katakchalar bo'yicha tezkor o'tish)
    - A, B, C, D variantli qulay tanlov kartalari
    - Yakuniy natija: Foiz, to'plangan ball va sarflangan vaqt
  - **Uy Vazifalari**:
    - Topshirilishi kutilayotgan va topshirilgan vazifalar
    - Vazifani yozma javob bilan topshirish modali
    - AI va o'qituvchi bahosi hamda fikr-mulohazalari (Feedback)

- **Do'kon & Peshqadamlar (Gamifikatsiya)**:
  - **Tangalar Do'koni**: O'quvchi yutib olgan tangalariga mahsulotlar (merch, kitoblar, chegirmalar) xarid qilish
  - **Peshqadamlar (Leaderboard)**: Top-3 podium (1-Oltin, 2-Kumush, 3-Bronza) va umumiy reyting

- **Mening Profilim**:
  - Shaxsiy ma'lumotlar, daraja va XP ko'rsatkichlari
  - Davomat tarixi (Qatnashdi, Kechikdi, Qatnashmadi)
  - Parolni o'zgartirish va xavfsizlik
  - Hisobdan chiqish

---

## 2. Platforma Moslashuvi (Android & iOS)

- **Paket nomi (Bundle ID)**: `uz.abdora.student`
- **Ilova nomi**: `Abdora Student`
- **Android moslashuvi**:
  - `AndroidManifest.xml` (Kamera, audio yozish, internet va tarmoq holati)
  - `build.gradle` (compileSdkVersion: 34, minSdkVersion: 21, targetSdkVersion: 34)
  - Shaffof status bar va tizim panellari (Edge-to-edge)
- **iOS moslashuvi**:
  - `Info.plist` (Kamera, mikrofon, fotogalereya ruxsatnomalari)
  - Safe Area insets (iPhone Notch, Dynamic Island, Home indicator chizig'i)
  - Bouncing scroll fizikasi

---

## 3. Loyihani Ishga Tushirish va APK Chiqarish

Flutter o'rnatilgan tizimda:

```bash
# 1. Mobil papkaga o'ting
cd abdora_mobile

# 2. Paketlarni o'rnating
flutter pub get

# 3. Ilovani ishga tushiring
flutter run

# 4. Android APK yig'ish
flutter build apk --release
```

Yig'ilgan fayl: `abdora_mobile/build/app/outputs/flutter-apk/app-release.apk`.
