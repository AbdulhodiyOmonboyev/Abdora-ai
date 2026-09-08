# ABDORA AI — FRONTEND SEO / GOOGLE SEARCH OPTIMIZATSIYASI

Sen senior **Frontend Engineer + SEO Specialist** sifatida ishlaysan.

Men senga mavjud **Abdora AI** loyihasining frontend source code'ini berdim (`bialogiya_frontend`, React + Vite + React Router). Vazifang — mavjud funksionallikni buzmasdan, saytni Google qidiruv tizimida to'g'ri va yuqori sifatda ko'rinadigan qilib optimallashtirish.

---

## 1. ENG MUHIM QOIDA

**MAVJUD FUNKSIONALLIKNI BUZMA.**

Quyidagilarni o'zgartirma:

* React komponentlar logikasi
* Routing (React Router) tuzilishi
* API chaqiruvlari
* Authentication va role-based access
* Mavjud UI dizayn (faqat SEO uchun zarur bo'lsa, semantik HTML teglarini to'g'irlash mumkin)

SEO — faqat qo'shimcha qatlam. Sahifalar qanday ishlayotgan bo'lsa, xuddi shunday ishlab turishi kerak.

---

## 2. LOYIHA KONTEKSTI (avval buni tushun)

* Frontend: React 19 + Vite + React Router, **Client-Side Rendered (CSR) SPA** — server tomonda render qilinmaydi.
* Public (login talab qilinmaydigan) sahifalar: `/` (Landing), `/xizmatlar` (Services), `/hujjatlar` (Documents), `/aloqa` (Contact), `/login`.
* Qolgan barcha sahifalar (`/admin/*`, `/manager/*`, `/reception/*`, `/teacher/*`, `/student/*`, `/finance/*`) — **autentifikatsiya talab qiladi**, bular hech qachon Google indeksida ko'rinmasligi kerak.
* Hozirgi holat:
  * `index.html`da bitta statik, umumiy `<title>` va `<meta description>` bor — barcha sahifalar uchun bir xil.
  * `public/robots.txt` va `public/sitemap.xml` fayllari **mavjud, lekin bo'sh**.
  * `<html lang="en">` deb yozilgan, lekin butun sayt kontenti **o'zbek tilida** — bu noto'g'ri.
  * Open Graph (`og:*`) va Twitter Card meta teglari yo'q — ijtimoiy tarmoqlarda (Telegram, Facebook) havola ulashilganda chiroyli preview chiqmaydi.
  * Structured data (JSON-LD, schema.org) umuman yo'q.
  * Sahifalar orasida bundle juda katta (~1.9 MB, build paytida ogohlantirish chiqadi) — bu Core Web Vitals va Google ranking'ga salbiy ta'sir qiladi.

Kod yozishdan oldin: `bialogiya_frontend/src/App.jsx` (barcha route'lar), `bialogiya_frontend/index.html`, `bialogiya_frontend/public/` papkasini albatta ko'rib chiq.

---

## 3. DINAMIK META TEGLAR (HAR BIR SAHIFA UCHUN ALOHIDA)

Hozir har qanday sahifada bir xil `<title>` ko'rinadi — bu SEO uchun katta kamchilik.

`react-helmet-async` kutubxonasini o'rnat va har bir **public** sahifaga o'ziga xos meta teglar qo'sh:

```text
/               → "Abdora AI — Sun'iy intellekt bilan zamonaviy ta'lim"
/xizmatlar      → "Xizmatlar — Abdora AI"
/hujjatlar      → "Foydalanuvchi qo'llanmalari — Abdora AI"
/aloqa          → "Biz bilan bog'laning — Abdora AI"
/login          → "Kirish — Abdora AI"
```

Har bir sahifa uchun:

* Noyob `<title>` (50–60 belgi atrofida)
* Noyob `<meta name="description">` (150–160 belgi atrofida, chaqiruvchi, kalit so'zlar bilan)
* `<link rel="canonical" href="...">`
* Ichki (login talab qiladigan) sahifalarga **hech qanday** SEO meta tegi qo'shma — ular baribir indekslanmasligi kerak.

`App.jsx`dagi mavjud route strukturasini o'zgartirma — faqat har bir public sahifa komponentining boshiga `<Helmet>` blokini qo'sh.

---

## 4. ROBOTS.TXT

`public/robots.txt` faylini to'ldir:

```text
User-agent: *
Allow: /
Allow: /xizmatlar
Allow: /hujjatlar
Allow: /aloqa
Allow: /login

Disallow: /admin
Disallow: /manager
Disallow: /reception
Disallow: /teacher
Disallow: /student
Disallow: /finance
Disallow: /leads

Sitemap: https://[HAQIQIY-DOMEN]/sitemap.xml
```

`[HAQIQIY-DOMEN]` o'rniga loyihaning haqiqiy production domenini qo'y (masalan `abdora-ai-frontend.onrender.com` yoki custom domen bo'lsa o'sha).

---

## 5. SITEMAP.XML

`public/sitemap.xml` faylini to'ldir — **faqat public sahifalarni** qo'sh (login talab qiladigan sahifalarni EMAS):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://[HAQIQIY-DOMEN]/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://[HAQIQIY-DOMEN]/xizmatlar</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://[HAQIQIY-DOMEN]/hujjatlar</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://[HAQIQIY-DOMEN]/aloqa</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
```

---

## 6. OPEN GRAPH VA TWITTER CARD

Har bir public sahifa uchun (Helmet orqali) quyidagilarni qo'sh, shunda Telegram/Facebook/Twitter'da havola ulashilganda chiroyli kartochka chiqadi:

```html
<meta property="og:type" content="website" />
<meta property="og:title" content="[sahifa nomi]" />
<meta property="og:description" content="[sahifa tavsifi]" />
<meta property="og:image" content="https://[DOMEN]/brand/og-image.png" />
<meta property="og:url" content="https://[DOMEN][sahifa yo'li]" />
<meta property="og:site_name" content="Abdora AI" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="[sahifa nomi]" />
<meta name="twitter:description" content="[sahifa tavsifi]" />
<meta name="twitter:image" content="https://[DOMEN]/brand/og-image.png" />
```

`og:image` uchun 1200×630 o'lchamdagi brendlangan rasm kerak (`public/brand/` papkasida mavjud logotipdan foydalanib yarat, agar hali bo'lmasa).

---

## 7. STRUCTURED DATA (JSON-LD)

Bosh sahifaga (`/`) `Organization` yoki `EducationalOrganization` schema.org JSON-LD qo'sh:

```json
{
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "Abdora AI",
  "url": "https://[DOMEN]",
  "logo": "https://[DOMEN]/brand/logo-icon.png",
  "description": "Sun'iy intellekt yordamida o'quv markazlarini boshqarish va ta'lim platformasi",
  "sameAs": []
}
```

Bu Google'ga saytning nima ekanini aniqroq tushuntiradi va "rich results" ko'rinishida chiqish ehtimolini oshiradi.

---

## 8. HTML TILI VA ASOSIY FAYL

`index.html`da:

* `<html lang="en">` ni `<html lang="uz">` ga o'zgartir (kontent o'zbek tilida bo'lgani uchun).
* Statik `<title>`/`<meta description>` qoldirilsin (fallback sifatida — Helmet ishlamagan holatlar uchun), lekin har bir sahifa o'z Helmet bloki orqali buni qayta yozadi.
* `<meta name="robots" content="index, follow">` public sahifalar uchun, ichki sahifalar uchun esa `noindex, nofollow` (Helmet orqali dinamik).

---

## 9. SEMANTIK HTML VA ACCESSIBILITY

Google sahifa mazmunini semantik teglar orqali yaxshiroq tushunadi:

* Har bir sahifada **faqat bitta** `<h1>` bo'lsin (hozir tekshirib chiq — ba'zi joylarda noto'g'ri ishlatilgan bo'lishi mumkin).
* `<h1>` → `<h2>` → `<h3>` ierarxiyasi mantiqiy ketma-ketlikda bo'lsin, sakrab ketmasin.
* Barcha `<img>` teglarida mazmunli `alt` atributi bo'lsin (logotiplar uchun allaqachon qo'shilgan, qolganlarini tekshir).
* Navigatsiya uchun `<nav>`, asosiy kontent uchun `<main>`, sarlavha uchun `<header>`, pastki qism uchun `<footer>` semantik teglaridan foydalanilganini tasdiqla (PublicLayout.jsx allaqachon buni qisman qiladi).

---

## 10. PERFORMANCE (CORE WEB VITALS)

Google ranking'da sahifa tezligi muhim omil. Build paytida quyidagi ogohlantirish chiqadi:

```text
Some chunks are larger than 500 kB after minification
```

Buni hal qilish uchun:

* React Router'da **lazy loading** qo'lla — `React.lazy()` + `Suspense` orqali har bir katta sahifa (ayniqsa dashboard sahifalari) alohida chunk'ga bo'linsin, public sahifalar tezroq yuklansin.
* `vite.config.js`da `build.rollupOptions.output.manualChunks` orqali kutubxonalarni (recharts, framer-motion, xlsx va h.k.) alohida chunk'larga ajrat.
* Rasmlarni (agar katta bo'lsa) WebP formatga o'tkazish yoki siqishni ko'rib chiq.
* Public sahifalarni birinchi navbatda optimallashtir (ular Google tomonidan ko'proq ko'riladi), dashboard sahifalarini keyinroq.

**Diqqat:** lazy loading qo'shishda mavjud route strukturasi va foydalanuvchi tajribasi (masalan loading holatlari) buzilmasligi kerak — har bir `React.lazy()` uchun mos `<Suspense fallback={...}>` albatta bo'lsin.

---

## 11. GOOGLE SEARCH CONSOLE (MUHIM TUZATISH)

Loyihada mavjud `GOOGLE_SEARCH_CONSOLE.md` fayli **noto'g'ri maqsadga** yo'naltirilgan — u GitHub repository sahifasini (`github.com/.../Abdora-ai`) Google Search Console'da ro'yxatdan o'tkazishni tushuntiradi. Bu **noto'g'ri**: GitHub repo — bu kodning o'zi, foydalanuvchilar ko'radigan sayt emas.

To'g'ri yondashuv:

1. Google Search Console'da property sifatida loyihaning **haqiqiy production domeni**ni qo'sh (masalan `https://abdora-ai-frontend.onrender.com` yoki custom domen).
2. Tasdiqlash uchun `<meta name="google-site-verification" content="[kod]">` ni `index.html`ning `<head>` qismiga qo'sh (bu eng oson usul, chunki domen allaqachon HTML'ni to'liq nazorat qiladi).
3. Tasdiqlangandan so'ng, Search Console'ga yuqorida yaratilgan `sitemap.xml` havolasini yubor.
4. `GOOGLE_SEARCH_CONSOLE.md` faylini shu to'g'ri jarayon bilan yangila.

---

## 12. SIFAT TEKSHIRUVI (ISH TUGAGANDAN KEYIN)

* [ ] Har bir public sahifada noyob `<title>` va `<meta description>` bormi?
* [ ] `robots.txt` va `sitemap.xml` to'g'ri to'ldirilganmi?
* [ ] `<html lang="uz">` to'g'irlanganmi?
* [ ] Ichki (login talab qiladigan) sahifalar `noindex` bilan belgilanganmi va `robots.txt`da `Disallow` qilinganmi?
* [ ] Open Graph rasm (1200×630) yaratilganmi va barcha public sahifalarda ko'rinadimi?
* [ ] JSON-LD structured data validator'dan (https://search.google.com/test/rich-results) xatosiz o'tadimi?
* [ ] `npm run build` xatosiz ishlaydimi, mavjud funksionallik (login, dashboard, barcha rollar) buzilmaganmi?
* [ ] Lighthouse (Chrome DevTools) orqali SEO va Performance ballari oldin/keyin solishtirilganmi?

---

## 13. FINAL NATIJA

Men xohlayotgan natija: **Abdora AI Google qidiruvida to'g'ri, chiroyli va professional ko'rinishda chiqishi** — sarlavha, tavsif va (agar mumkin bo'lsa) rich snippet bilan; ijtimoiy tarmoqlarda ulashilganda chiroyli preview kartochkasi bilan; va bularning barchasi mavjud funksionallikni buzmasdan amalga oshirilishi kerak.

Avval mavjud kodni tahlil qil, keyin bosqichma-bosqich amalga oshir, har bir o'zgarishdan keyin build va asosiy funksiyalarni tekshirib chiq.
