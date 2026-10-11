const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

async function createDeck() {
  const pptx = new pptxgen();

  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Abdulhodiy Omonboyev';
  pptx.company = 'Abdora AI';
  pptx.title = 'Abdora AI — Pitch Deck (Hackathon Presentation)';
  pptx.subject = 'EdTech & Multi-Agent AI Platform for Schools and Learning Centers';

  // Palette Constants
  const BG_COLOR = 'F8FAFC';
  const CARD_BG = 'FFFFFF';
  const BORDER_COLOR = 'E2E8F0';
  const ORANGE = 'F06413';
  const ORANGE_LIGHT = 'FFF7ED';
  const INDIGO = '4F46E5';
  const INDIGO_LIGHT = 'EEF2FF';
  const TEXT_MAIN = '0F172A';
  const TEXT_MUTED = '64748B';
  const GREEN = '10B981';
  const GREEN_LIGHT = 'ECFDF5';
  const ROSE = 'EF4444';
  const ROSE_LIGHT = 'FEF2F2';

  const dashboardImgPath = path.resolve(__dirname, 'abdora_dashboard_mockup_1791102444114.jpg');
  const tutorImgPath = path.resolve(__dirname, 'abdora_ai_tutor_mockup_1791102458102.jpg');

  // Helper for Top Badge and Header
  function addHeader(slide, kicker, title, subtitle) {
    slide.background = { color: BG_COLOR };

    // Kicker badge
    slide.addText(kicker.toUpperCase(), {
      x: 0.8, y: 0.45, w: 5.0, h: 0.35,
      fontSize: 10, bold: true, color: ORANGE,
      fontFace: 'Arial'
    });

    // Main Title
    slide.addText(title, {
      x: 0.8, y: 0.8, w: 11.5, h: 0.7,
      fontSize: 24, bold: true, color: TEXT_MAIN,
      fontFace: 'Arial'
    });

    // Subtitle
    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.8, y: 1.5, w: 11.5, h: 0.4,
        fontSize: 12, color: TEXT_MUTED,
        fontFace: 'Arial'
      });
    }

    // Top logo / tag
    slide.addText('ABDORA AI', {
      x: 10.8, y: 0.45, w: 2.0, h: 0.35,
      fontSize: 11, bold: true, color: INDIGO, align: 'right',
      fontFace: 'Arial'
    });
  }

  // Helper for Slide Number Footer
  function addFooter(slide, num) {
    slide.addText(`Abdora AI • Pitch Deck 2026 | Slayd ${num} / 7`, {
      x: 0.8, y: 7.0, w: 11.5, h: 0.3,
      fontSize: 9, color: '94A3B8',
      fontFace: 'Arial'
    });
  }

  // ════════════════════════════════════════════════════════════════════
  // SLIDE 1: TITUL VA VISSIYA (Title & Vision)
  // ════════════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG_COLOR };

    // Badge
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 1.0, w: 3.6, h: 0.4,
      fill: { color: ORANGE_LIGHT }, line: { color: 'FDBA74', width: 1 },
      rectRadius: 0.2
    });
    slide.addText('EDTECH & SUN\'IY INTELLEKT', {
      x: 0.8, y: 1.0, w: 3.6, h: 0.4,
      fontSize: 10, bold: true, color: ORANGE, align: 'center',
      fontFace: 'Arial'
    });

    // Hero Title
    slide.addText('Maktablar va O\'quv Markazlari uchun\nYagona Aqlli Boshqaruv Ekotizimi', {
      x: 0.8, y: 1.6, w: 11.5, h: 1.6,
      fontSize: 34, bold: true, color: TEXT_MAIN,
      fontFace: 'Arial', lineSpacing: 42
    });

    // Lead paragraph
    slide.addText(
      'Abdora AI — barcha darsliklar, testlar, qabulxona, moliyaviy hisob-kitoblar va o\'qituvchi ishini yagona ko\'p-agentli sun\'iy intellektga birlashtiruvchi All-in-One SaaS platformasi.',
      {
        x: 0.8, y: 3.4, w: 9.5, h: 0.8,
        fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial', lineSpacing: 22
      }
    );

    // 3 Value Proposition Cards
    const cards = [
      { num: '70%', title: 'Vaqt va Xarajat Tejalishi', desc: 'O\'qituvchilarning ortiqcha qog\'ozbozlik va test tuzish yuki qisqaradi', color: ORANGE },
      { num: 'Multi-AI', title: 'Mustaqil AI Dvigatellari', desc: 'Google Gemini 3.8 Flash, GPT-4o va Claude 3.7 orqali maxsus o\'qitish', color: INDIGO },
      { num: '16,000+', title: 'Muassasalarga Mos', desc: 'Davlat maktablari, litseylar va barcha o\'quv markazlariga 100% integratsiya', color: GREEN }
    ];

    cards.forEach((c, idx) => {
      const x = 0.8 + idx * 4.0;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: x, y: 4.5, w: 3.7, h: 2.1,
        fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1.5 },
        rectRadius: 0.2
      });

      slide.addText(c.num, {
        x: x + 0.3, y: 4.7, w: 3.1, h: 0.6,
        fontSize: 26, bold: true, color: c.color, fontFace: 'Arial'
      });

      slide.addText(c.title, {
        x: x + 0.3, y: 5.3, w: 3.1, h: 0.4,
        fontSize: 12, bold: true, color: TEXT_MAIN, fontFace: 'Arial'
      });

      slide.addText(c.desc, {
        x: x + 0.3, y: 5.7, w: 3.1, h: 0.7,
        fontSize: 10, color: TEXT_MUTED, fontFace: 'Arial'
      });
    });

    addFooter(slide, 1);

    slide.addNotes(
      "1-SLAYD (0:00 - 0:40):\nAssalomu alaykum hurmatli hakamlar hay'ati! Bizning loyihamiz — Abdora AI. O'zbekistonda 16 mingdan ortiq maktab va o'quv markazlari bor. Ammo ularning 85 foizi hanuzgacha darslarni qog'ozda, testlarni qo'lda va boshqaruvni tarqoq Excel fayllarida olib boryapti. Biz buni bitta aqlli AI ekotizimga birlashtirdik!"
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // SLIDE 2: MUAMMO (Problem Statement - 4 Pain Points)
  // ════════════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    addHeader(
      slide,
      'Bozordagi Haqiqiy Muammo',
      'Bugungi Maktab va O\'quv Markazlari Nega Qiynalmoqda?',
      'Ta\'lim muassasalari har kuni duch keladigan 4 ta asosiy og\'riqli nuqta:'
    );

    const problems = [
      {
        num: '01',
        title: 'O\'qituvchilarning Qog\'ozbozlik Yuki',
        desc: 'O\'qituvchi haftasiga 15-20 soat vaqtini dars konspekti yozish, test tuzish va daftarlarni qo\'lda tekshirishga sarflaydi. O\'quvchi bilan jonli ishlashga kuch qolmaydi.',
        color: ROSE, bg: ROSE_LIGHT
      },
      {
        num: '02',
        title: 'Tarqoq va Qimmat Dasturlar Xaosi',
        desc: 'Lidlar uchun bitta dastur, kassa va to\'lovga Excel, davomatga daftar, testga alohida sayt. Xodimlar chalkashadi, oylik obuna xarajatlari esa oshib ketadi.',
        color: 'D97706', bg: 'FFFBEB'
      },
      {
        num: '03',
        title: 'Individual Repetitorsiz Sifat Pastligi',
        desc: '35 kishilik sinfda bitta o\'qituvchi har bir o\'quvchiga alohida yondasha olmaydi. Qoloq o\'quvchi orqada qolib ketaveradi, chunki uning shaxsiy repetitori yo\'q.',
        color: INDIGO, bg: INDIGO_LIGHT
      },
      {
        num: '04',
        title: 'Shaffof Monitoring Yetishmasligi',
        desc: 'Direktor yoki rahbar har bir filial, o\'qituvchi va sinfning real bilim darajasi hamda moliyaviy dinamikasini real-vaqt rejimida to\'liq ko\'ra olmaydi.',
        color: '9333EA', bg: 'FAF5FF'
      }
    ];

    problems.forEach((p, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.8 + col * 5.9;
      const y = 2.1 + row * 2.3;

      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: x, y: y, w: 5.6, h: 2.1,
        fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1 },
        rectRadius: 0.15
      });

      // Number badge
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: x + 0.3, y: y + 0.3, w: 0.7, h: 0.6,
        fill: { color: p.bg }, line: { color: p.color, width: 1 },
        rectRadius: 0.1
      });
      slide.addText(p.num, {
        x: x + 0.3, y: y + 0.3, w: 0.7, h: 0.6,
        fontSize: 12, bold: true, color: p.color, align: 'center', fontFace: 'Arial'
      });

      // Title
      slide.addText(p.title, {
        x: x + 1.2, y: y + 0.3, w: 4.1, h: 0.6,
        fontSize: 14, bold: true, color: TEXT_MAIN, fontFace: 'Arial'
      });

      // Description
      slide.addText(p.desc, {
        x: x + 0.3, y: y + 1.0, w: 5.0, h: 0.9,
        fontSize: 11, color: TEXT_MUTED, fontFace: 'Arial', lineSpacing: 16
      });
    });

    addFooter(slide, 2);

    slide.addNotes(
      "2-SLAYD (0:40 - 1:20):\nBozorda 4 ta katta og'riq bor: Birinchidan, o'qituvchi haftasiga 15 soatini keraksiz qog'ozbozlik va test tuzishga sarflaydi. Ikkinchidan, maktablar CRM, kassa va LMS uchun 4 ta alohida dasturga ortiqcha pul to'laydi. Uchinchidan, sinfda 35 ta bola bo'lsa, o'qituvchi har biriga alohida repetitor bo'lolmaydi. Va to'rtinchidan, direktorlarda dars sifatining aniq analitikasi yo'q."
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // SLIDE 3: YECHIM (Solution - All-in-One Multi-Agent Platform)
  // ════════════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    addHeader(
      slide,
      'Mukammal Yechim',
      'Abdora AI: Yagona Integratsiyalashgan Ekotizim',
      'Barcha jarayonlarni 4 ta asosiy ustun orqali 100% raqamlashtirish:'
    );

    const pillars = [
      {
        icon: 'AI',
        title: 'Ko\'p-Agentli AI Dvigateli',
        points: ['Dars konspektlari generatsiyasi', '4 xil variantda avto-testlar', 'Uy vazifasini AI baholash', 'Jonli ovozli speaking amaliyoti'],
        tag: 'Gemini 3.8 / GPT-4o / Claude',
        color: ORANGE
      },
      {
        icon: 'LMS',
        title: 'Smart LMS & O\'quv Tizimi',
        points: ['Interaktiv kartochkalar & slaydlar', 'Elektron davomat jurnali', 'Xonalar va haftalik dars jadvali', 'Avtomatik bitiruv sertifikatlari'],
        tag: 'To\'liq Avtomatlashtirilgan',
        color: INDIGO
      },
      {
        icon: 'ERP',
        title: 'Moliya & Kassa Tizimi',
        points: ['Click va Payme qabuli', 'Printer uchun avto-kvitansiya', 'Filial xarajatlari va qoldiqlar', 'O\'qituvchilar oyligi (Payroll)'],
        tag: '100% Shaffof Buxgalteriya',
        color: GREEN
      },
      {
        icon: 'XP',
        title: 'Gamifikatsiya & Do\'kon',
        points: ['Faollik uchun tangalar (Coins)', 'Tajriba ochkolari (XP) & darajalar', 'Umumiy maktab reytingi', 'Sovg\'alar almashish do\'koni'],
        tag: '2x Faolroq O\'quvchilar',
        color: 'D97706'
      }
    ];

    pillars.forEach((p, idx) => {
      const x = 0.8 + idx * 2.95;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: x, y: 2.1, w: 2.75, h: 4.5,
        fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1.5 },
        rectRadius: 0.15
      });

      // Top Icon Badge
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: x + 0.3, y: 2.3, w: 0.9, h: 0.45,
        fill: { color: p.color }, line: { color: p.color, width: 1 },
        rectRadius: 0.1
      });
      slide.addText(p.icon, {
        x: x + 0.3, y: 2.3, w: 0.9, h: 0.45,
        fontSize: 10, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Arial'
      });

      // Title
      slide.addText(p.title, {
        x: x + 0.3, y: 2.85, w: 2.2, h: 0.6,
        fontSize: 13, bold: true, color: TEXT_MAIN, fontFace: 'Arial'
      });

      // Bullet points
      const bulletText = p.points.map(pt => ({ text: `• ${pt}\n`, options: { fontSize: 10, color: TEXT_MUTED } }));
      slide.addText(bulletText, {
        x: x + 0.3, y: 3.5, w: 2.2, h: 2.2,
        fontFace: 'Arial', lineSpacing: 18
      });

      // Bottom tag
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: x + 0.2, y: 5.9, w: 2.35, h: 0.4,
        fill: { color: BG_COLOR }, line: { color: BORDER_COLOR, width: 1 },
        rectRadius: 0.1
      });
      slide.addText(p.tag, {
        x: x + 0.2, y: 5.9, w: 2.35, h: 0.4,
        fontSize: 8.5, bold: true, color: p.color, align: 'center', fontFace: 'Arial'
      });
    });

    addFooter(slide, 3);

    slide.addNotes(
      "3-SLAYD (1:20 - 2:05):\nBizning yechimimiz — Abdora AI. Bu All-in-One platforma. Birinchisi — Ko'p agentli AI: test tuzadi, dars rejasi yozadi, ovozli speaking amaliyotini o'tkazadi. Ikkinchisi — LMS darsliklar va davomat. Uchinchisi — To'liq kassa va oylik maoshlar hisob-kitobi. Va to'rtinchisi — O'quvchilarni rag'batlantiruvchi Gamifikatsiya tangalari."
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // SLIDE 4: JONLI MAHSULOT & UI/UX (Screenshots & Mockups)
  // ════════════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    addHeader(
      slide,
      'Tayyor Ishlayotgan Mahsulot',
      'Zamonaviy Light Mode UI/UX va Real Ekranlar',
      'Nazariya emas, to\'liq backend va AI modellariga ulangan jonli platforma:'
    );

    // Left Mockup Box: Dashboard
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 2.1, w: 5.6, h: 4.4,
      fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1.5 },
      rectRadius: 0.15
    });

    slide.addText('Super Admin & Markaz Dashboardi', {
      x: 1.0, y: 2.25, w: 4.0, h: 0.35,
      fontSize: 12, bold: true, color: TEXT_MAIN, fontFace: 'Arial'
    });
    slide.addText('Google Gemini 3.8 Ulangan', {
      x: 4.2, y: 2.25, w: 2.0, h: 0.35,
      fontSize: 9, bold: true, color: ORANGE, align: 'right', fontFace: 'Arial'
    });

    if (fs.existsSync(dashboardImgPath)) {
      slide.addImage({
        path: dashboardImgPath,
        x: 1.0, y: 2.7, w: 5.2, h: 3.1
      });
    }

    slide.addText('✓ Barcha filiallar, managerlar va AI agentlar monitoringi', {
      x: 1.0, y: 5.95, w: 5.2, h: 0.35,
      fontSize: 9.5, color: TEXT_MUTED, fontFace: 'Arial'
    });

    // Right Mockup Box: AI Tutor
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 6.7, y: 2.1, w: 5.6, h: 4.4,
      fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1.5 },
      rectRadius: 0.15
    });

    slide.addText('AI Dars Generatori & Speaking Repetitor', {
      x: 6.9, y: 2.25, w: 4.0, h: 0.35,
      fontSize: 12, bold: true, color: TEXT_MAIN, fontFace: 'Arial'
    });
    slide.addText('94% Baholash Aniqligi', {
      x: 10.1, y: 2.25, w: 2.0, h: 0.35,
      fontSize: 9, bold: true, color: GREEN, align: 'right', fontFace: 'Arial'
    });

    if (fs.existsSync(tutorImgPath)) {
      slide.addImage({
        path: tutorImgPath,
        x: 6.9, y: 2.7, w: 5.2, h: 3.1
      });
    }

    slide.addText('✓ Real-vaqt ovozli gaplashuv va interaktiv kartochkalar', {
      x: 6.9, y: 5.95, w: 5.2, h: 0.35,
      fontSize: 9.5, color: TEXT_MUTED, fontFace: 'Arial'
    });

    addFooter(slide, 4);

    slide.addNotes(
      "4-SLAYD (2:05 - 2:50):\nBiz shunchaki g'oya emas, to'liq ishlayotgan mahsulot qildik. Mana ko'rib turganingizdek: Super Admin paneli, markazlarning shaxsiy AI modellari (Gemini 3.8 Flash, Claude, GPT-4o) va jonli speaking mashqi. Har bir o'quv markazi o'zining shaxsiy API kalitini ulab, o'z brendi ostida ishlatishi mumkin."
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // SLIDE 5: MAKTABLARGA HAM TO'G'RI KELADIMI? (School Fit Analysis)
  // ════════════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    addHeader(
      slide,
      'Hakamlarning Asosiy Savoliga Javob',
      'Bu Tizim Umumta\'lim va Xususiy Maktablarga Ham To\'g\'ri Keladimi?',
      'JAVOB: HA, 100% MOS KELADI VA KUNDALIK.COM (E-MAKTAB) BILAN RAQOBAT EMAS, BALKI UNI TO\'LDIRADI!'
    );

    const schoolPoints = [
      {
        num: '01',
        title: 'e-Maktab (Kundalik) bilan Farqi nima?',
        desc: 'e-Maktab faqat elektron jurnal (davomat va rasmiy baho) hisoblanadi. Unda o\'qitish va tayyorlash vositasi yo\'q! Abdora AI esa dars jarayonining o\'ziga kiradi: konspekt tayyorlaydi, mavzuni tushuntiradi va test tuzadi.',
        color: INDIGO
      },
      {
        num: '02',
        title: 'Maktab O\'qituvchisi uchun "AI Metodist"',
        desc: 'Davlat ta\'lim standartlari (DTS) bo\'yicha dars rejalari, 4 xil variantdagi BSB (Choraklik) va CHSB testlarini 10 soniyada PDF formatda chiqaradi. O\'qituvchining haftalik 15 soat vaqti tejaladi.',
        color: ORANGE
      },
      {
        num: '03',
        title: 'Har bir O\'quvchiga 24/7 Shaxsiy Repetitor',
        desc: 'Maktabdan uyga borgan bola qimmat repetitorga borolmasa ham, telefonida Abdora AI bilan biologiya, kimyo, ingliz tili yoki matematikadan tushunmagan joyini cheksiz so\'rab o\'rgana oladi.',
        color: GREEN
      },
      {
        num: '04',
        title: 'Maktab Rahbariyati (Direktor/Zavuch) Analitikasi',
        desc: 'Direktor oylik tekshiruvni kutmasdan, aynan qaysi sinf yoki o\'quvchi qaysi mavzularda orqada qolayotganini real vaqtli grafiklar orqali ko\'rib, ta\'lim sifatini darhol nazorat qiladi.',
        color: '2563EB'
      }
    ];

    schoolPoints.forEach((p, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.8 + col * 5.9;
      const y = 2.1 + row * 2.3;

      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: x, y: y, w: 5.6, h: 2.1,
        fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1 },
        rectRadius: 0.15
      });

      slide.addText(p.num, {
        x: x + 0.3, y: y + 0.25, w: 0.6, h: 0.4,
        fontSize: 16, bold: true, color: p.color, fontFace: 'Arial'
      });

      slide.addText(p.title, {
        x: x + 1.0, y: y + 0.25, w: 4.3, h: 0.45,
        fontSize: 13, bold: true, color: TEXT_MAIN, fontFace: 'Arial'
      });

      slide.addText(p.desc, {
        x: x + 0.3, y: y + 0.75, w: 5.0, h: 1.2,
        fontSize: 10.5, color: TEXT_MUTED, fontFace: 'Arial', lineSpacing: 16
      });
    });

    addFooter(slide, 5);

    slide.addNotes(
      "5-SLAYD (2:50 - 3:45) [ENG MUHIM]:\nKo'pchilik so'raydi: Bu tizim maktablarga ham to'g'ri keladimi? Javob: Ha, aynan maktablarga eng katta foyda beradi! e-Maktab faqat elektron jurnal xolos. Abdora AI esa o'qituvchiga 'AI Metodist' bo'lib, DTS standartidagi BSB/CHSB testlarini 10 soniyada chiqarib beradi. O'quvchiga esa kechqurun uyda 24/7 repetitor bo'lib xizmat qiladi!"
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // SLIDE 6: BOZOR VA BIZNES MODEL (Market Size & Monetization)
  // ════════════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    addHeader(
      slide,
      'Monetizatsiya va Kengayish',
      'Katta Bozor va Barqaror Biznes Model',
      'B2B SaaS va B2C Freemium orqali kafolatlangan daromad oqimi:'
    );

    // Box 1: Market Size
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 2.1, w: 3.7, h: 4.5,
      fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1.5 },
      rectRadius: 0.15
    });
    slide.addText('O\'zbekiston Bozori', {
      x: 1.1, y: 2.3, w: 3.1, h: 0.3,
      fontSize: 11, bold: true, color: TEXT_MUTED, fontFace: 'Arial'
    });
    slide.addText('16,000+', {
      x: 1.1, y: 2.65, w: 3.1, h: 0.7,
      fontSize: 32, bold: true, color: TEXT_MAIN, fontFace: 'Arial'
    });
    slide.addText('10,200 ta davlat maktabi, 600+ xususiy maktab va 5,500+ o\'quv markazi', {
      x: 1.1, y: 3.35, w: 3.1, h: 0.6,
      fontSize: 10.5, color: TEXT_MUTED, fontFace: 'Arial'
    });

    slide.addText('Auditoriya Hajmi', {
      x: 1.1, y: 4.2, w: 3.1, h: 0.3,
      fontSize: 11, bold: true, color: TEXT_MUTED, fontFace: 'Arial'
    });
    slide.addText('7.5 Million+', {
      x: 1.1, y: 4.5, w: 3.1, h: 0.6,
      fontSize: 26, bold: true, color: ORANGE, fontFace: 'Arial'
    });
    slide.addText('Maktab o\'quvchilari va o\'quv markaz talabalari armiyasi', {
      x: 1.1, y: 5.15, w: 3.1, h: 0.5,
      fontSize: 10.5, color: TEXT_MUTED, fontFace: 'Arial'
    });

    // Box 2: Monetization Streams
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 4.8, y: 2.1, w: 3.7, h: 4.5,
      fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1.5 },
      rectRadius: 0.15
    });
    slide.addText('Daromad Manbalari', {
      x: 5.1, y: 2.3, w: 3.1, h: 0.3,
      fontSize: 11, bold: true, color: TEXT_MUTED, fontFace: 'Arial'
    });

    const streams = [
      { title: '1. B2B Oylik SaaS Obuna', desc: '500,000 - 2,500,000 so\'m/oy (maktab va markazlar uchun)', color: ORANGE, bg: ORANGE_LIGHT },
      { title: '2. AI Token / Model Paketlari', desc: 'Qo\'shimcha AI test generatsiyasi va audio speaking soatlari', color: INDIGO, bg: INDIGO_LIGHT },
      { title: '3. B2C O\'quvchi Obunasi', desc: 'Shaxsiy 24/7 AI repetitor uchun oylik mikro-obuna (Freemium)', color: GREEN, bg: GREEN_LIGHT }
    ];

    streams.forEach((s, i) => {
      const sy = 2.8 + i * 1.15;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 5.1, y: sy, w: 3.1, h: 1.0,
        fill: { color: s.bg }, line: { color: s.color, width: 1 },
        rectRadius: 0.1
      });
      slide.addText(s.title, {
        x: 5.2, y: sy + 0.1, w: 2.9, h: 0.35,
        fontSize: 10.5, bold: true, color: s.color, fontFace: 'Arial'
      });
      slide.addText(s.desc, {
        x: 5.2, y: sy + 0.45, w: 2.9, h: 0.5,
        fontSize: 9, color: TEXT_MAIN, fontFace: 'Arial'
      });
    });

    // Box 3: Competitive Advantage
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 8.8, y: 2.1, w: 3.7, h: 4.5,
      fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1.5 },
      rectRadius: 0.15
    });
    slide.addText('Nega Aynan Abdora AI?', {
      x: 9.1, y: 2.3, w: 3.1, h: 0.3,
      fontSize: 11, bold: true, color: TEXT_MUTED, fontFace: 'Arial'
    });

    const advantages = [
      'All-in-One: CRM, LMS va AI bitta joyda, 3 ta dastur kerak emas.',
      'Mustaqil AI: Har bir markaz o\'z API kaliti va modelini tanlaydi.',
      'O\'zbek tili: Darsliklar va atamalar o\'zbek tiliga to\'la moslashtirilgan.',
      '70% Tejamkor: Alohida xizmatlardan 3 barobar arzon tushadi.'
    ];

    advantages.forEach((adv, i) => {
      slide.addText(`✓ ${adv}`, {
        x: 9.1, y: 2.8 + i * 0.9, w: 3.1, h: 0.8,
        fontSize: 10, color: TEXT_MAIN, fontFace: 'Arial', lineSpacing: 15
      });
    });

    addFooter(slide, 6);

    slide.addNotes(
      "6-SLAYD (3:45 - 4:25):\nBiznes modelimiz juda oddiy: B2B SaaS oylik obuna — har bir maktab yoki o'quv markazidan 500 mingdan 2.5 million so'mgacha. Shuningdek o'quvchilar uchun shaxsiy AI repetitor B2C mikro-obunasi. O'zbekistonning o'zida bozor hajmi 7.5 million o'quvchini tashkil qiladi!"
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // SLIDE 7: XULOSA VA CHAQIRIQ (Roadmap, Team & Call to Action)
  // ════════════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    addHeader(
      slide,
      'Kelajak Rejalari va Jamoa',
      'Ta\'lim Kelajagini Bugun Abdora AI Bilan Birga Quramiz!',
      '3 bosqichli kengayish rejasi va jamoamiz chaqirig\'i:'
    );

    // Roadmap Steps
    const steps = [
      { phase: '1-BOSQICH (Hozir)', title: 'MVP & Pilot Sinov', desc: '10+ o\'quv markazlari va 500+ o\'quvchi sinovidan o\'tgan to\'liq tayyor platforma.', color: ORANGE },
      { phase: '2-BOSQICH (3 Oy)', title: '100 ta Maktab & Markaz', desc: 'Maktab darsliklari bazasi va mobil ilovani to\'liq tarqatish, e-Maktab metodikasi integratsiyasi.', color: INDIGO },
      { phase: '3-BOSQICH (1 Yil)', title: 'Markaziy Osiyo Bozoriga', desc: 'Qozog\'iston va Qirg\'iziston ta\'lim tizimlari uchun lokalizatsiya va eksport.', color: GREEN }
    ];

    steps.forEach((st, idx) => {
      const x = 0.8 + idx * 3.95;
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: x, y: 2.1, w: 3.7, h: 2.1,
        fill: { color: CARD_BG }, line: { color: BORDER_COLOR, width: 1.5 },
        rectRadius: 0.15
      });

      slide.addText(st.phase, {
        x: x + 0.3, y: 2.3, w: 3.1, h: 0.35,
        fontSize: 10, bold: true, color: st.color, fontFace: 'Arial'
      });

      slide.addText(st.title, {
        x: x + 0.3, y: 2.65, w: 3.1, h: 0.45,
        fontSize: 13, bold: true, color: TEXT_MAIN, fontFace: 'Arial'
      });

      slide.addText(st.desc, {
        x: x + 0.3, y: 3.15, w: 3.1, h: 0.85,
        fontSize: 10, color: TEXT_MUTED, fontFace: 'Arial', lineSpacing: 15
      });
    });

    // Call to Action Banner
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 4.5, w: 11.5, h: 2.1,
      fill: { color: ORANGE }, line: { color: ORANGE, width: 1 },
      rectRadius: 0.2
    });

    slide.addText('Savollar va Hamkorlik uchun Tayyormiz!', {
      x: 1.2, y: 4.75, w: 10.7, h: 0.6,
      fontSize: 22, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Arial'
    });

    slide.addText('"Biz o\'qituvchini almashtirmaymiz — biz unga sun\'iy intellekt qanotlarini beramiz!"', {
      x: 1.2, y: 5.3, w: 10.7, h: 0.45,
      fontSize: 13, italic: true, color: 'FFFFFF', align: 'center', fontFace: 'Arial'
    });

    slide.addText('📧 info@abdora.ai   •   🌐 abdora.ai   •   📱 +998 90 000 00 00', {
      x: 1.2, y: 5.85, w: 10.7, h: 0.4,
      fontSize: 11, bold: true, color: 'FEF08A', align: 'center', fontFace: 'Arial'
    });

    addFooter(slide, 7);

    slide.addNotes(
      "7-SLAYD (4:25 - 5:00):\nXulosa qilib aytganda, biz o'qituvchining o'rnini bosmoqchi emasmiz. Biz o'qituvchiga sun'iy intellekt qanotlarini beramiz, toki u dars sifatini 2 barobar oshirsin. E'tiboringiz uchun rahmat, savollaringizga mamnuniyat bilan javob beramiz!"
    );
  }

  const outputPath = path.resolve(__dirname, 'Abdora_AI_Pitch_Deck.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log(`SUCCESS: PowerPoint created at ${outputPath}`);
}

createDeck().catch(err => {
  console.error('ERROR creating PowerPoint:', err);
  process.exit(1);
});
