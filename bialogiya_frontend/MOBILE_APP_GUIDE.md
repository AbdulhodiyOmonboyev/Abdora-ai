# Abdora AI — Mobil Ilova (Android & iOS) Qo'llanmasi

Ushbu loyiha zamonaviy **Capacitor Native Framework** asosida Android va iOS mobil ilovalariga to'liq moslashtirilgan.

---

## 1. Asosiy Buyruqlar

Barcha mobil buyruqlar `bialogiya_frontend` papkasida bajariladi:

```bash
# 1. Frontend kodini yig'ish va Android loyihasiga sinxronizatsiya qilish
npm run mobile:build

# 2. Android Studio dasturida ochish (APK chiqarish yoki telefonda yurgizish uchun)
npm run mobile:open

# 3. Faqat sinxronizatsiya (agar web qismi allaqachon build bo'lgan bo'lsa)
npm run mobile:sync
```

---

## 2. Android APK Chiqarish (Build APK)

Android Studio orqali o'rnatiladigan `.apk` faylni olish:

1. `npm run mobile:open` buyrug'ini tering. Android Studio avtomatik ravishda ochiladi.
2. Android Studio'da loyiha indeksatsiyasi tugagach:
   - Yuqori menyudan **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)** ni tanlang.
3. Bir necha daqiqada tayyor `.apk` fayli quyidagi manzilda paydo bo'ladi:
   `bialogiya_frontend/android/app/build/outputs/apk/debug/app-debug.apk`
4. Ushbu `.apk` faylni istalgan Android telefonga yuklab, o'rnatib ishlatish mumkin.

---

## 3. O'rnatilgan Native Mobil Xususiyatlari

- **Hardware Back Button**: Android telefonidagi "Orqaga" tugmasi bosilganda sahifalar bo'ylab orqaga qaytadi. Asosiy sahifada bo'lsa, xatolik bilan chiqib ketmaslik uchun ikki marta bosishni so'raydi.
- **Status Bar**: Telefonning yuqori paneli (soat va batareya qismi) platforma mavzusiga mos qorong'u fonda ko'rinadi.
- **Splash Screen**: Ilova ochilayotganda chiroyli kutib olish start ekrani.
- **Offline / Network Detection**: Internet aloqasi uzilsa yoki tiklansa, foydalanuvchiga darhol xabarnoma ko'rsatiladi.
- **Haptics**: Tugmalar va amallarda native tebranish signali beriladi.
- **Mobile Bottom Navigation**: Telefon ekranlarida pastki qulay navigatsiya paneli (o'quvchi, o'qituvchi, manager uchun).
- **PWA (Progressive Web App)**: Google Chrome yoki Safari orqali kirilganda ham "Ilovani o'rnatish" (Add to Home screen) taklif etiladi.

---

## 4. Konfiguratsiya

- **Paket identifikatori (App ID)**: `uz.abdora.app`
- **Ilova nomi**: `Abdora AI`
- **Konfiguratsiya fayli**: `bialogiya_frontend/capacitor.config.json`
