# Abdora AI — Flutter Mobil Ilovasi (Android & iOS)

Ushbu papka (`abdora_mobile`) Abdora AI platformasining to'laqonli, professional **Flutter (Dart)** mobil ilovasi hisoblanadi.

---

## 1. Ilova Arxitekturasi va Xususiyatlari

- **Arxitektura**: Clean MVC + Provider State Management
- **Tarmoq**: Dio API Client + JWT Bearer Token avtomatik inyeksiyasi
- **Dizayn**: Dark Theme (`#0B1120`, `#1E293B`, `#00BFA6` teal aksentlari bilan)
- **Qo'llab-quvvatlanadigan rollar**:
  - **O'quvchi (Student)**: Darslar ro'yxati, dars tafsilotlari, testlar, tangalar (coins) balansi, tangalar do'koni, profil.
  - **O'qituvchi (Teacher)**: Guruhlar ro'yxati, davomat belgilash, darslar jurnali.
  - **Menejer va Qabulxona (Manager / Reception)**: CRM Lidlar ro'yxati va yangi lid qo'shish, Kassa balansi va to'lovlar monitoringi.

---

## 2. Loyihani Ishga Tushirish (Run)

Flutter o'rnatilgan har qanday kompyuterda yoki VS Code/Android Studio'da:

```bash
# 1. Mobil ilova papkasiga o'ting
cd abdora_mobile

# 2. Kerakli kutubxonalarni yuklab oling
flutter pub get

# 3. Ilovani emulyator yoki telefonda ishga tushiring
flutter run
```

---

## 3. Tayyor Android APK Chiqarish (Build APK)

To'g'ridan-to'g'ri o'rnatiladigan `.apk` fayl yig'ish uchun:

```bash
flutter build apk --release
```

Yig'ilgan tayyor APK fayl quyidagi manzilda bo'ladi:
```
abdora_mobile/build/app/outputs/flutter-apk/app-release.apk
```
Ushbu faylni istalgan Android telefoniga tashlab o'rnatish mumkin.

---

## 4. API Server Manzili

Server manzili `lib/core/api/endpoints.dart` faylida ko'rsatilgan:
- Emulyator uchun: `http://10.0.2.2:5000/api`
- Haqiqiy qurilma / Jonli server uchun: o'z domeningiz yoki IP manzilingizni kiriting.
