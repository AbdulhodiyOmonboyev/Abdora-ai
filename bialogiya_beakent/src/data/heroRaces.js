// Hayolot Olamidagi 110 ta Irq va Insoniyat Ensiklopediyasi
// Avtomatik shakllantirilgan va saralangan to'liq katalog (120 ta irq + Zamonaviy Kasblar)

const RACE_CATEGORIES = [
  {
    "id": "human_civilization",
    "range": [
      111,
      120
    ],
    "name": "Insoniyat va Real Kasblar (Humans)",
    "icon": "🧑‍🔬"
  },
  {
    "id": "classic_fantasy",
    "range": [
      1,
      12
    ],
    "name": "Klassik va Yuqori Fantastika",
    "icon": "🧝"
  },
  {
    "id": "orc_goblin",
    "range": [
      13,
      22
    ],
    "name": "Orkoidlar va Vahshiy Qabilalar",
    "icon": "👺"
  },
  {
    "id": "beastfolk",
    "range": [
      23,
      42
    ],
    "name": "Hayvon-odamlar (Beastfolk)",
    "icon": "🐺"
  },
  {
    "id": "dragon_reptile",
    "range": [
      43,
      52
    ],
    "name": "Ajdaho va Qadimgi Reptiliyalar",
    "icon": "🐲"
  },
  {
    "id": "elemental",
    "range": [
      53,
      64
    ],
    "name": "Elementallar va Planar Mavjudotlar",
    "icon": "⚡"
  },
  {
    "id": "ocean_depths",
    "range": [
      65,
      74
    ],
    "name": "Suv va Okean Osti Irqlari",
    "icon": "🧜"
  },
  {
    "id": "fey_spirits",
    "range": [
      75,
      84
    ],
    "name": "Fey va Tabiat Ruhlari",
    "icon": "🧚"
  },
  {
    "id": "giants_titans",
    "range": [
      85,
      94
    ],
    "name": "Gigantlar va Koloslar",
    "icon": "🗿"
  },
  {
    "id": "dark_psionic",
    "range": [
      95,
      104
    ],
    "name": "Qorong'ulik va Psionik Mavjudotlar",
    "icon": "🔮"
  },
  {
    "id": "cyber_scifi",
    "range": [
      105,
      110
    ],
    "name": "Kiber va Ilmiy-Fantastik Irqlar",
    "icon": "🤖"
  }
];

const HERO_RACES = [
  {
    "id": "race_111_inson_robotik_jarroh",
    "number": 111,
    "name": "Inson: Shifokor va Robotik Jarroh (Robotic Surgeon)",
    "primaryName": "Inson: Robotik Jarroh",
    "altName": "Robotic Surgeon",
    "category": "Insoniyat va Real Kasblar (Humans)",
    "categoryId": "human_civilization",
    "badge": "Tibbiyot & Hayot",
    "icon": "🧑‍⚕️",
    "world": "Zamonaviy Yuqori Texnologik Tibbiyot, da Vinci Xi.",
    "description": "Mikromillimetr darajasidagi robotik jarrohlik mahorati, inson anatomiyasini mukammal his qilish.",
    "abilities": "da Vinci Xi robot konsoli boshqaruvi, nozik mikromillimetr kesmalar, reanimatsion tezkorlik, inson hayotini asrash.",
    "careers": "Bosh jarroh, robotik jarroh, reanimatolog, harbiy jarroh.",
    "passiveBonus": "Anatomiya va fiziologiya darslarida +20% qo'shimcha XP",
    "baseStats": {
      "speed": 14,
      "focus": 19,
      "stamina": 110,
      "intelligence": 18
    },
    "defaultRoom": "medical_clinic"
  },
  {
    "id": "race_112_inson_genetik_biotexnolog",
    "number": 112,
    "name": "Inson: Genetik Muhandis va Biotexnolog (Geneticist)",
    "primaryName": "Inson: Genetik Muhandis",
    "altName": "Geneticist & Biotechnologist",
    "category": "Insoniyat va Real Kasblar (Humans)",
    "categoryId": "human_civilization",
    "badge": "Genom & Fan",
    "icon": "🧬",
    "world": "Biotexnologiya va Molekulyar Biologiya, CRISPR-Cas9.",
    "description": "DNK va genlarni o'qish, genomni tahrirlash, hujayraviy mutatsiyalarni tuzatish va yangi dori vositalari yaratish.",
    "abilities": "CRISPR-Cas9 tahrirlash, Illumina DNK sekvenatsiyasi, RT-PCR tahlili, hujayra klonlash.",
    "careers": "Genetik muhandis, biotexnolog, bioinformatik, vaksina ixtirochisi.",
    "passiveBonus": "Hujayra biologiyasi va genetikada 2x ko'proq xotira va mnemotika kuchi",
    "baseStats": {
      "speed": 12,
      "focus": 18,
      "stamina": 100,
      "intelligence": 20
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_113_inson_ai_dasturchi",
    "number": 113,
    "name": "Inson: Sun'iy Intellekt va Tizim Muhandisi (AI Engineer)",
    "primaryName": "Inson: AI & Tizim Muhandisi",
    "altName": "Software & AI Engineer",
    "category": "Insoniyat va Real Kasblar (Humans)",
    "categoryId": "human_civilization",
    "badge": "AI & Dasturlash",
    "icon": "👨‍💻",
    "world": "Axborot Texnologiyalari, GPU Klasterlar, LLM.",
    "description": "Murakkab matematik modellarni algoritmga aylantirish, sun'iy intellekt agentlari va global serverlar arxitekturasi.",
    "abilities": "Neyrotarmoqlar o'qitish, NVIDIA GPU tensor klasterlarini optimallashtirish, kiber-mantiqiy hisoblash.",
    "careers": "AI muhandis, Fullstack tizim arxitektori, katta ma'lumotlar olimi.",
    "passiveBonus": "Mantiqiy testlarni xatosiz topshirganda +25% ko'proq tanga (coins)",
    "baseStats": {
      "speed": 15,
      "focus": 20,
      "stamina": 95,
      "intelligence": 20
    },
    "defaultRoom": "cyber_lab"
  },
  {
    "id": "race_114_inson_kiberxavfsizlik_himoyachi",
    "number": 114,
    "name": "Inson: Kiberxavfsizlik va Axborot Himoyachisi (Cyber Defender)",
    "primaryName": "Inson: Kiber Himoyachi",
    "altName": "Ethical Hacker & Cyber Guard",
    "category": "Insoniyat va Real Kasblar (Humans)",
    "categoryId": "human_civilization",
    "badge": "Xavfsizlik & Shifr",
    "icon": "🕵️",
    "world": "Kiberxavfsizlik, Flipper Zero, Wireshark, Ethical Hacking.",
    "description": "Tizim zaifliklarini kashf etish, axborotni shifrlash, xakerlik hujumlarini bir zumda to'xtatish.",
    "abilities": "Pen-testing, tarmoq protokollari xavfsizligi, apparatli shifrlash, kriptografik mudofaa.",
    "careers": "Ethical hacker, kiber-xavfsizlik direktori, raqamli tergovchi.",
    "passiveBonus": "Xavfli xatolardan 2 marta himoyalovchi maxsus qalqon",
    "baseStats": {
      "speed": 16,
      "focus": 19,
      "stamina": 105,
      "intelligence": 17
    },
    "defaultRoom": "cyber_lab"
  },
  {
    "id": "race_115_inson_favqulodda_qutqaruvchi",
    "number": 115,
    "name": "Inson: Jasur Qutqaruvchi va Reanimatolog (Rescue Hero)",
    "primaryName": "Inson: Jasur Qutqaruvchi",
    "altName": "Search & Rescue Hero",
    "category": "Insoniyat va Real Kasblar (Humans)",
    "categoryId": "human_civilization",
    "badge": "Jasorat & Qutqaruv",
    "icon": "🚒",
    "world": "Favqulodda Vaziyatlar, Ekstremal Tibbiyot, FVV.",
    "description": "Zilzila, yong'in va ofatlarda hayotni saqlab qolish, og'ir vaziyatlarda birinchi tez tibbiy yordam ko'rsatish.",
    "abilities": "Gidravlik og'ir uskunalar boshqaruvi, seysmik akustik qidiruv, ekstremal chidamlilik va reanimatsiya.",
    "careers": "FVV qidiruv-qutqaruvchisi, favqulodda vrach, vertolyot paratibbiyotchisi.",
    "passiveBonus": "Har qanday murakkab darsda qo'shimcha urinish va yuqori chidamlilik",
    "baseStats": {
      "speed": 17,
      "focus": 16,
      "stamina": 150,
      "intelligence": 15
    },
    "defaultRoom": "medical_clinic"
  },
  {
    "id": "race_116_inson_smart_agronom",
    "number": 116,
    "name": "Inson: Smart-Agronom va Agro-Dron Operatori (Smart Agronomist)",
    "primaryName": "Inson: Smart-Agronom",
    "altName": "Smart Agro & Drone Operator",
    "category": "Insoniyat va Real Kasblar (Humans)",
    "categoryId": "human_civilization",
    "badge": "Agro & Tabiat",
    "icon": "🌾",
    "world": "Aqlli Qishloq Xo'jaligi, DJI Agras, Gidroponika.",
    "description": "Multispektral NDVI datchiklari orqali o'simliklar salomatligini aniqlash, tejamkor va hosildor aqlli dehqonchilik.",
    "abilities": "Agro-dronlarni avtopilot boshqarish, tuproq kimyoviy tahlili, vertikal gidroponika nazorati.",
    "careers": "Smart-agronom, agro-dron muhandisi, oziq-ovqat xavfsizligi tadqiqotchisi.",
    "passiveBonus": "Botanika va o'simliklar olamida +25% hosildorlik (XP bonusi)",
    "baseStats": {
      "speed": 13,
      "focus": 16,
      "stamina": 120,
      "intelligence": 16
    },
    "defaultRoom": "smart_farm"
  },
  {
    "id": "race_117_inson_aviyakosmik_muhandis",
    "number": 117,
    "name": "Inson: Aviakosmik va Astrobiolog (Space Explorer)",
    "primaryName": "Inson: Aviakosmik Muhandis",
    "altName": "Aerospace & Astrobiologist",
    "category": "Insoniyat va Real Kasblar (Humans)",
    "categoryId": "human_civilization",
    "badge": "Koinot & Aviatsiya",
    "icon": "👨‍🚀",
    "world": "Koinot Tadqiqotlari, Orbital Stansiyalar, Astrobiologiya.",
    "description": "Reaktiv raketalar yaratish, koinotdagi mikro-tortishishda tirik organizmlarning rivojlanishini o'rganish.",
    "abilities": "Sanoat 3D metall bosib chiqarish, aerodinamik simulyatsiya, fazoviy teleskop tahlili.",
    "careers": "Aviakosmik muhandis, astronavt-tadqiqotchi, astrobiolog.",
    "passiveBonus": "Astrobiologiya va fazoviy darslarda +20% qo'shimcha XP",
    "baseStats": {
      "speed": 15,
      "focus": 18,
      "stamina": 130,
      "intelligence": 17
    },
    "defaultRoom": "aerospace_hangar"
  },
  {
    "id": "race_118_inson_neyrobiolog_radiolog",
    "number": 118,
    "name": "Inson: Neyrobiolog va Radiolog (Neuroscientist)",
    "primaryName": "Inson: Neyrobiolog",
    "altName": "Neuroscientist & Radiologist",
    "category": "Insoniyat va Real Kasblar (Humans)",
    "categoryId": "human_civilization",
    "badge": "Miya & Neyro",
    "icon": "🧠",
    "world": "Neyrofan, 3-Tesla MRT, BCI Neyro-interfeyslar.",
    "description": "Inson miyasi, nerv tolalari impulslari va ong mexanizmlarini MRT hamda neyro-interfeyslar orqali tekshirish.",
    "abilities": "3D MRT tasvirlarini AI orqali o'qish, EEG elektrod tahlili, neyro-axborot interfeyslari.",
    "careers": "Neyrobiolog, MRT diagnostigi, kognitiv neyro-muhandis.",
    "passiveBonus": "Asab tizimi va xotira mavzularida 2x tezroq daraja (level up) ko'tarilish",
    "baseStats": {
      "speed": 12,
      "focus": 20,
      "stamina": 95,
      "intelligence": 20
    },
    "defaultRoom": "neuro_lab"
  },
  {
    "id": "race_119_inson_yashil_ekolog",
    "number": 119,
    "name": "Inson: Ekolog va Qayta Tiklanuvchi Energiya Muhandisi (Green Ecologist)",
    "primaryName": "Inson: Yashil Ekolog",
    "altName": "Green Energy & Ecologist",
    "category": "Insoniyat va Real Kasblar (Humans)",
    "categoryId": "human_civilization",
    "badge": "Yashil Energiya",
    "icon": "🌱",
    "world": "Ekologik Monitoring, Quyosh va Shamol Energetikasi.",
    "description": "Biosferani ifloslanishdan asrash, gaz-xromatograf tahlili, quyosh va shamol energiyasini samarali boshqarish.",
    "abilities": "Termovizor dronli tekshiruv, gaz-spektrometriya, suv tozalash texnologiyalari.",
    "careers": "Bosh ekolog, yashil energiya boshqaruvchisi, tabiiy biosfera kuratori.",
    "passiveBonus": "Ekologiya va global biologik muvozanatda +20% XP",
    "baseStats": {
      "speed": 14,
      "focus": 16,
      "stamina": 115,
      "intelligence": 17
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_120_inson_bionik_arxitektor",
    "number": 120,
    "name": "Inson: Bionik Arxitektor va Virtual Kinematograf (BIM & VFX Artist)",
    "primaryName": "Inson: Bionik Arxitektor",
    "altName": "BIM & VFX Artist",
    "category": "Insoniyat va Real Kasblar (Humans)",
    "categoryId": "human_civilization",
    "badge": "3D Dizayn & VFX",
    "icon": "🏛️",
    "world": "Virtual Production, BIM Arxitektura, Unreal Engine LED Volume.",
    "description": "Tabiatdagi bionik shakllardan ilhomlanib binolar loyihalash va ularning 3D raqamli egizaklarini Unreal Engine da yaratish.",
    "abilities": "3D lazer skanerlash, Apple Vision Pro fazoviy modellashtirish, virtual kinematografiya.",
    "careers": "Bionik arxitektor, virtual kinorejissyor, BIM me'mori.",
    "passiveBonus": "Vizual darslar va 3D modellarda +20% o'zlashtirish tezligi",
    "baseStats": {
      "speed": 13,
      "focus": 18,
      "stamina": 105,
      "intelligence": 18
    },
    "defaultRoom": "cyber_lab"
  },
  {
    "id": "race_1_oliy_elflar",
    "number": 1,
    "name": "Oliy Elflar (High Elves / Altmer)",
    "primaryName": "Oliy Elflar",
    "altName": "High Elves / Altmer",
    "category": "Klassik va Yuqori Fantastika",
    "categoryId": "classic_fantasy",
    "badge": "Klassik & Bilim",
    "icon": "🧝",
    "world": "Klassik fentezi, Tolkien, D&D.",
    "description": "Boqiylik/uzoq umr, o'tkir ko'rish, oliy sehrga (Arcana) tug'ma moyillik, ruhiy nazorat.",
    "abilities": "Boqiylik/uzoq umr, o'tkir ko'rish, oliy sehrga (Arcana) tug'ma moyillik, ruhiy nazorat.",
    "careers": "Archmage, sehrli olim, qirollik maslahatchisi, diplomat.",
    "passiveBonus": "Biologiya va ilmiy nazariyalarda +15% qo'shimcha XP",
    "baseStats": {
      "speed": 13,
      "focus": 16,
      "stamina": 95,
      "intelligence": 16
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_2_o_rmon_elflari",
    "number": 2,
    "name": "O'rmon Elflari (Wood Elves / Bosmer)",
    "primaryName": "O'rmon Elflari",
    "altName": "Wood Elves / Bosmer",
    "category": "Klassik va Yuqori Fantastika",
    "categoryId": "classic_fantasy",
    "badge": "Klassik & Bilim",
    "icon": "🧝",
    "world": "Qadimiy o'rmonlar, D&D, Elder Scrolls.",
    "description": "Yashirinish mahorati, tabiat bilan telepatik aloqa, o'ta tez yugurish, sezgirlik.",
    "abilities": "Yashirinish mahorati, tabiat bilan telepatik aloqa, o'ta tez yugurish, sezgirlik.",
    "careers": "Ranger (izquvar), kamonboz mergan, druid, o'rmon qo'riqchisi.",
    "passiveBonus": "Biologiya va ilmiy nazariyalarda +15% qo'shimcha XP",
    "baseStats": {
      "speed": 13,
      "focus": 16,
      "stamina": 95,
      "intelligence": 16
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_3_qorong_i_elflar",
    "number": 3,
    "name": "Qorong'i Elflar (Drow / Dark Elves)",
    "primaryName": "Qorong'i Elflar",
    "altName": "Drow / Dark Elves",
    "category": "Klassik va Yuqori Fantastika",
    "categoryId": "classic_fantasy",
    "badge": "Klassik & Bilim",
    "icon": "🧝",
    "world": "Yerosti g'orlari (Underdark), D&D.",
    "description": "Zif qorong'uda ko'rish, qorong'u zulmat sehri, zahar tayyorlash, tovushsiz qotillik.",
    "abilities": "Zif qorong'uda ko'rish, qorong'u zulmat sehri, zahar tayyorlash, tovushsiz qotillik.",
    "careers": "Soyalar qotili (Assassin), pichoqboz, o'rgimchak kohinasi, jangovar sehrgar.",
    "passiveBonus": "Biologiya va ilmiy nazariyalarda +15% qo'shimcha XP",
    "baseStats": {
      "speed": 13,
      "focus": 16,
      "stamina": 95,
      "intelligence": 16
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_4_quyosh_elflari",
    "number": 4,
    "name": "Quyosh Elflari (Sun Elves)",
    "primaryName": "Quyosh Elflari",
    "altName": "Sun Elves",
    "category": "Klassik va Yuqori Fantastika",
    "categoryId": "classic_fantasy",
    "badge": "Klassik & Bilim",
    "icon": "🧝",
    "world": "Faerun, Forgotten Realms.",
    "description": "Quyosh nuri energiyasini sehrga aylantirish, olovga chidamlilik, yuksak intellekt.",
    "abilities": "Quyosh nuri energiyasini sehrga aylantirish, olovga chidamlilik, yuksak intellekt.",
    "careers": "Quyosh ritsari, qadimiy matnlar tadqiqotchisi, imperiya me'mori.",
    "passiveBonus": "Biologiya va ilmiy nazariyalarda +15% qo'shimcha XP",
    "baseStats": {
      "speed": 13,
      "focus": 16,
      "stamina": 95,
      "intelligence": 16
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_5_oy_elflari",
    "number": 5,
    "name": "Oy Elflari (Moon Elves)",
    "primaryName": "Oy Elflari",
    "altName": "Moon Elves",
    "category": "Klassik va Yuqori Fantastika",
    "categoryId": "classic_fantasy",
    "badge": "Klassik & Bilim",
    "icon": "🧝",
    "world": "D&D fentezi olami.",
    "description": "Tungi vaqtda kuchayuvchi sezgilar, illyuziya sehri, xushchaqchaqlik va moslashuvchanlik.",
    "abilities": "Tungi vaqtda kuchayuvchi sezgilar, illyuziya sehri, xushchaqchaqlik va moslashuvchanlik.",
    "careers": "Bard (musiqachi-sehrgar), sayohatchi elchi, yulduzlar munajjimi.",
    "passiveBonus": "Biologiya va ilmiy nazariyalarda +15% qo'shimcha XP",
    "baseStats": {
      "speed": 13,
      "focus": 16,
      "stamina": 95,
      "intelligence": 16
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_6_tog_dvarflari",
    "number": 6,
    "name": "Tog' Dvarflari (Mountain Dwarves)",
    "primaryName": "Tog' Dvarflari",
    "altName": "Mountain Dwarves",
    "category": "Klassik va Yuqori Fantastika",
    "categoryId": "classic_fantasy",
    "badge": "Klassik & Bilim",
    "icon": "⛏️",
    "world": "Tolkien, D&D, Warhammer.",
    "description": "Ulkan jismoniy chidamlilik, tosh va ma'danlarni his qilish, zaharga tabiiy immunitet.",
    "abilities": "Ulkan jismoniy chidamlilik, tosh va ma'danlarni his qilish, zaharga tabiiy immunitet.",
    "careers": "Temirchi, og'ir qurollangan piyoda jangchi, tog' qal'asi qo'riqchisi.",
    "passiveBonus": "Biologiya va ilmiy nazariyalarda +15% qo'shimcha XP",
    "baseStats": {
      "speed": 13,
      "focus": 16,
      "stamina": 95,
      "intelligence": 16
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_7_tepalik_dvarflari",
    "number": 7,
    "name": "Tepalik Dvarflari (Hill Dwarves)",
    "primaryName": "Tepalik Dvarflari",
    "altName": "Hill Dwarves",
    "category": "Klassik va Yuqori Fantastika",
    "categoryId": "classic_fantasy",
    "badge": "Klassik & Bilim",
    "icon": "⛏️",
    "world": "D&D.",
    "description": "Qo'shimcha hayotiy energiya, chuqur donishmandlik, ruhiy bardosh.",
    "abilities": "Qo'shimcha hayotiy energiya, chuqur donishmandlik, ruhiy bardosh.",
    "careers": "Kohin (Cleric), pivo pishiruvchi usta, qabila oqsoqoli.",
    "passiveBonus": "Biologiya va ilmiy nazariyalarda +15% qo'shimcha XP",
    "baseStats": {
      "speed": 13,
      "focus": 16,
      "stamina": 95,
      "intelligence": 16
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_8_kulrang_dvarflar",
    "number": 8,
    "name": "Kulrang Dvarflar (Duergar)",
    "primaryName": "Kulrang Dvarflar",
    "altName": "Duergar",
    "category": "Klassik va Yuqori Fantastika",
    "categoryId": "classic_fantasy",
    "badge": "Klassik & Bilim",
    "icon": "⛏️",
    "world": "Yerosti saltanati, D&D.",
    "description": "Psionik ko'rinmaslik, o'z hajmini ikki barobar kattalashtirish (Enlarge), yorug'likka sezgirlik.",
    "abilities": "Psionik ko'rinmaslik, o'z hajmini ikki barobar kattalashtirish (Enlarge), yorug'likka sezgirlik.",
    "careers": "Qul savdogari, qora temirchi, yerosti tunnellar qazuvchisi.",
    "passiveBonus": "Biologiya va ilmiy nazariyalarda +15% qo'shimcha XP",
    "baseStats": {
      "speed": 13,
      "focus": 16,
      "stamina": 95,
      "intelligence": 16
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_9_ixtirochi_gnomlar",
    "number": 9,
    "name": "Ixtirochi Gnomlar (Rock / Tinker Gnomes)",
    "primaryName": "Ixtirochi Gnomlar",
    "altName": "Rock / Tinker Gnomes",
    "category": "Klassik va Yuqori Fantastika",
    "categoryId": "classic_fantasy",
    "badge": "Klassik & Bilim",
    "icon": "⚙️",
    "world": "D&D, Warcraft.",
    "description": "Mexanika va soatsozlik zakovati, kichik hajmli portlovchi moddalar yaratish.",
    "abilities": "Mexanika va soatsozlik zakovati, kichik hajmli portlovchi moddalar yaratish.",
    "careers": "Artificer (muhandis-sehrgar), soatsoz, qurolsoz, parashyut va mexanizm ixtirochisi.",
    "passiveBonus": "Biologiya va ilmiy nazariyalarda +15% qo'shimcha XP",
    "baseStats": {
      "speed": 13,
      "focus": 16,
      "stamina": 95,
      "intelligence": 16
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_10_o_rmon_gnomlari",
    "number": 10,
    "name": "O'rmon Gnomlari (Forest Gnomes)",
    "primaryName": "O'rmon Gnomlari",
    "altName": "Forest Gnomes",
    "category": "Klassik va Yuqori Fantastika",
    "categoryId": "classic_fantasy",
    "badge": "Klassik & Bilim",
    "icon": "⚙️",
    "world": "Tabiat qo'yni, D&D.",
    "description": "Mayda hayvonlar bilan gaplashish, mayda illyuziyalar yaratish, tezkor yashirinish.",
    "abilities": "Mayda hayvonlar bilan gaplashish, mayda illyuziyalar yaratish, tezkor yashirinish.",
    "careers": "O'rmon illyuziyachisi, dori-darmon yig'uvchi, qushlar boquvchisi.",
    "passiveBonus": "Biologiya va ilmiy nazariyalarda +15% qo'shimcha XP",
    "baseStats": {
      "speed": 13,
      "focus": 16,
      "stamina": 95,
      "intelligence": 16
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_11_xalflinglar_hobbit",
    "number": 11,
    "name": "Xalflinglar / Hobbitlar (Lightfoot Halflings)",
    "primaryName": "Xalflinglar / Hobbitlar",
    "altName": "Lightfoot Halflings",
    "category": "Klassik va Yuqori Fantastika",
    "categoryId": "classic_fantasy",
    "badge": "Klassik & Bilim",
    "icon": "🥧",
    "world": "O'rta Yer (Tolkien), D&D.",
    "description": "Tug'ma omad (Halfling Luck), katta gavdalar ortiga yashirinish, chaqqonlik.",
    "abilities": "Tug'ma omad (Halfling Luck), katta gavdalar ortiga yashirinish, chaqqonlik.",
    "careers": "Oshpaz, tinch fermer, o'g'ri (Rogue), xabarchi.",
    "passiveBonus": "Biologiya va ilmiy nazariyalarda +15% qo'shimcha XP",
    "baseStats": {
      "speed": 13,
      "focus": 16,
      "stamina": 95,
      "intelligence": 16
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_12_baquvvat_xalflinglar",
    "number": 12,
    "name": "Baquvvat Xalflinglar (Stout Halflings)",
    "primaryName": "Baquvvat Xalflinglar",
    "altName": "Stout Halflings",
    "category": "Klassik va Yuqori Fantastika",
    "categoryId": "classic_fantasy",
    "badge": "Klassik & Bilim",
    "icon": "🥧",
    "world": "D&D.",
    "description": "Dvarflar qoni aralashgan, zaharga chidamli, jismonan baquvvat.",
    "abilities": "Dvarflar qoni aralashgan, zaharga chidamli, jismonan baquvvat.",
    "careers": "Qishloq posboni, tegirmonchi, karvon soqchisi. II. Orkoidlar, Goblinoidlar va Vahshiy Qabilalar (13-22)",
    "passiveBonus": "Biologiya va ilmiy nazariyalarda +15% qo'shimcha XP",
    "baseStats": {
      "speed": 13,
      "focus": 16,
      "stamina": 95,
      "intelligence": 16
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_13_yovvoyi_orklar",
    "number": 13,
    "name": "Yovvoyi Orklar (Savage Orcs)",
    "primaryName": "Yovvoyi Orklar",
    "altName": "Savage Orcs",
    "category": "Orkoidlar va Vahshiy Qabilalar",
    "categoryId": "orc_goblin",
    "badge": "Orkoidlar & Bilim",
    "icon": "👹",
    "world": "Warhammer, Warcraft.",
    "description": "Ulkan mushak kuchi, g'azab holatida og'riqni his qilmaslik, jangovar bo'yoqlar himoyasi.",
    "abilities": "Ulkan mushak kuchi, g'azab holatida og'riqni his qilmaslik, jangovar bo'yoqlar himoyasi.",
    "careers": "Berserk, yirtqich ovchisi, jangovar pahlavon.",
    "passiveBonus": "Testlarni tez yechganda +20% ko'proq tanga (coins)",
    "baseStats": {
      "speed": 15,
      "focus": 10,
      "stamina": 120,
      "intelligence": 11
    },
    "defaultRoom": "cyber_lab"
  },
  {
    "id": "race_14_qora_orklar_va_uruk",
    "number": 14,
    "name": "Qora Orklar va Uruk-Xay (Black Orcs / Uruk-Hai)",
    "primaryName": "Qora Orklar va Uruk-Xay",
    "altName": "Black Orcs / Uruk-Hai",
    "category": "Orkoidlar va Vahshiy Qabilalar",
    "categoryId": "orc_goblin",
    "badge": "Orkoidlar & Bilim",
    "icon": "👹",
    "world": "Tolkien, Warhammer.",
    "description": "Quyosh nuri ostida kuchini yo'qotmaslik, harbiy intizom, po'latdek iroda.",
    "abilities": "Quyosh nuri ostida kuchini yo'qotmaslik, harbiy intizom, po'latdek iroda.",
    "careers": "Qamal muhandisi, armiya serjanti, og'ir qilichboz.",
    "passiveBonus": "Testlarni tez yechganda +20% ko'proq tanga (coins)",
    "baseStats": {
      "speed": 15,
      "focus": 10,
      "stamina": 120,
      "intelligence": 11
    },
    "defaultRoom": "cyber_lab"
  },
  {
    "id": "race_15_yarim_orklar",
    "number": 15,
    "name": "Yarim-Orklar (Half-Orcs)",
    "primaryName": "Yarim-Orklar",
    "altName": "Half-Orcs",
    "category": "Orkoidlar va Vahshiy Qabilalar",
    "categoryId": "orc_goblin",
    "badge": "Orkoidlar & Bilim",
    "icon": "👹",
    "world": "D&D, umumiy fentezi.",
    "description": "O'limli zarbadan so'ng qayta oyoqqa turish (Relentless Endurance), vahshiy zarba.",
    "abilities": "O'limli zarbadan so'ng qayta oyoqqa turish (Relentless Endurance), vahshiy zarba.",
    "careers": "Yollanma jangchi, gladiator, qo'riqchi, qasoskor ritsar.",
    "passiveBonus": "Testlarni tez yechganda +20% ko'proq tanga (coins)",
    "baseStats": {
      "speed": 15,
      "focus": 10,
      "stamina": 120,
      "intelligence": 11
    },
    "defaultRoom": "cyber_lab"
  },
  {
    "id": "race_16_goblinlar",
    "number": 16,
    "name": "Goblinlar (Goblins)",
    "primaryName": "Goblinlar",
    "altName": "Goblins",
    "category": "Orkoidlar va Vahshiy Qabilalar",
    "categoryId": "orc_goblin",
    "badge": "Orkoidlar & Bilim",
    "icon": "👺",
    "world": "D&D, Warcraft, Harry Potter.",
    "description": "Qorong'uda tez qochish, ayyorlik, tejamkorlik va qimmatbaho buyumlarni his qilish.",
    "abilities": "Qorong'uda tez qochish, ayyorlik, tejamkorlik va qimmatbaho buyumlarni his qilish.",
    "careers": "Bankir, tuzoqchi, porox savdogari, xufyona o'g'ri.",
    "passiveBonus": "Testlarni tez yechganda +20% ko'proq tanga (coins)",
    "baseStats": {
      "speed": 15,
      "focus": 10,
      "stamina": 120,
      "intelligence": 11
    },
    "defaultRoom": "cyber_lab"
  },
  {
    "id": "race_17_xobgoblinlar",
    "number": 17,
    "name": "Xobgoblinlar (Hobgoblins)",
    "primaryName": "Xobgoblinlar",
    "altName": "Hobgoblins",
    "category": "Orkoidlar va Vahshiy Qabilalar",
    "categoryId": "orc_goblin",
    "badge": "Orkoidlar & Bilim",
    "icon": "👺",
    "world": "D&D.",
    "description": "Safdoshlari bilan birga jang qilganda zarbasi kuchayishi (Martial Advantage), harbiy rejalashtirish.",
    "abilities": "Safdoshlari bilan birga jang qilganda zarbasi kuchayishi (Martial Advantage), harbiy rejalashtirish.",
    "careers": "Armiya generali, taktik qo'mondon, qal'a komendanti.",
    "passiveBonus": "Testlarni tez yechganda +20% ko'proq tanga (coins)",
    "baseStats": {
      "speed": 15,
      "focus": 10,
      "stamina": 120,
      "intelligence": 11
    },
    "defaultRoom": "cyber_lab"
  },
  {
    "id": "race_18_bugbearlar",
    "number": 18,
    "name": "Bugbearlar (Bugbears)",
    "primaryName": "Bugbearlar",
    "altName": "Bugbears",
    "category": "Orkoidlar va Vahshiy Qabilalar",
    "categoryId": "orc_goblin",
    "badge": "Orkoidlar & Bilim",
    "icon": "🐻",
    "world": "D&D.",
    "description": "Uzun qo'llar (uzoqdan zarba berish), pinhona harakatlanish, kutilmagan bosqin ustunligi.",
    "abilities": "Uzun qo'llar (uzoqdan zarba berish), pinhona harakatlanish, kutilmagan bosqin ustunligi.",
    "careers": "Qaroqchilar boshlig'i, o'rmon pistarmasi ustasi, xufyona og'ir jangchi.",
    "passiveBonus": "Testlarni tez yechganda +20% ko'proq tanga (coins)",
    "baseStats": {
      "speed": 15,
      "focus": 10,
      "stamina": 120,
      "intelligence": 11
    },
    "defaultRoom": "cyber_lab"
  },
  {
    "id": "race_19_koboldlar",
    "number": 19,
    "name": "Koboldlar (Kobolds)",
    "primaryName": "Koboldlar",
    "altName": "Kobolds",
    "category": "Orkoidlar va Vahshiy Qabilalar",
    "categoryId": "orc_goblin",
    "badge": "Orkoidlar & Bilim",
    "icon": "🦎",
    "world": "D&D.",
    "description": "To'da bo'lib hujum qilganda ustunlik (Pack Tactics), g'orlarda murakkab tuzoqlar qurish.",
    "abilities": "To'da bo'lib hujum qilganda ustunlik (Pack Tactics), g'orlarda murakkab tuzoqlar qurish.",
    "careers": "Qazuvchi, tuzoqchi muhandis, ajdaho xizmatkori.",
    "passiveBonus": "Testlarni tez yechganda +20% ko'proq tanga (coins)",
    "baseStats": {
      "speed": 15,
      "focus": 10,
      "stamina": 120,
      "intelligence": 11
    },
    "defaultRoom": "cyber_lab"
  },
  {
    "id": "race_20_gnollar",
    "number": 20,
    "name": "Gnollar (Gnolls)",
    "primaryName": "Gnollar",
    "altName": "Gnolls",
    "category": "Orkoidlar va Vahshiy Qabilalar",
    "categoryId": "orc_goblin",
    "badge": "Orkoidlar & Bilim",
    "icon": "👺",
    "world": "D&D, mifologiya.",
    "description": "Dushmanni o'ldirgan zahoti qo'shimcha hujum qilish (Rampage), shoqol tezligi.",
    "abilities": "Dushmanni o'ldirgan zahoti qo'shimcha hujum qilish (Rampage), shoqol tezligi.",
    "careers": "Bosqinchi ovchi, iblis shamani, vahshiy jangchi.",
    "passiveBonus": "Testlarni tez yechganda +20% ko'proq tanga (coins)",
    "baseStats": {
      "speed": 15,
      "focus": 10,
      "stamina": 120,
      "intelligence": 11
    },
    "defaultRoom": "cyber_lab"
  },
  {
    "id": "race_21_ogrlar",
    "number": 21,
    "name": "Ogrlar (Ogres)",
    "primaryName": "Ogrlar",
    "altName": "Ogres",
    "category": "Orkoidlar va Vahshiy Qabilalar",
    "categoryId": "orc_goblin",
    "badge": "Orkoidlar & Bilim",
    "icon": "👺",
    "world": "Klassik folklor, D&D.",
    "description": "Xarsangtoshdek jismoniy quvvat, qalin teri, qo'rqmaslik.",
    "abilities": "Xarsangtoshdek jismoniy quvvat, qalin teri, qo'rqmaslik.",
    "careers": "Dev-to'qmoqchi, og'ir yuk tashuvchi, darvoza buzuvchi.",
    "passiveBonus": "Testlarni tez yechganda +20% ko'proq tanga (coins)",
    "baseStats": {
      "speed": 15,
      "focus": 10,
      "stamina": 120,
      "intelligence": 11
    },
    "defaultRoom": "cyber_lab"
  },
  {
    "id": "race_22_trollar",
    "number": 22,
    "name": "Trollar (Trolls)",
    "primaryName": "Trollar",
    "altName": "Trolls",
    "category": "Orkoidlar va Vahshiy Qabilalar",
    "categoryId": "orc_goblin",
    "badge": "Orkoidlar & Bilim",
    "icon": "👺",
    "world": "Skandinaviya mifologiyasi, D&D, Warcraft.",
    "description": "O'ta tezkor jismoniy regeneratsiya (faqat olov va kislotadan qo'rqadi), qorong'uda ov qilish.",
    "abilities": "O'ta tezkor jismoniy regeneratsiya (faqat olov va kislotadan qo'rqadi), qorong'uda ov qilish.",
    "careers": "Ko'prik posboni, voodoo shamani, regeneratsiyali jangchi. III. Hayvon-odamlar va Terianthroplar (Beastfolk) (23-42)",
    "passiveBonus": "Testlarni tez yechganda +20% ko'proq tanga (coins)",
    "baseStats": {
      "speed": 15,
      "focus": 10,
      "stamina": 120,
      "intelligence": 11
    },
    "defaultRoom": "cyber_lab"
  },
  {
    "id": "race_23_tabaxi",
    "number": 23,
    "name": "Tabaxi (Mushuk-odamlar / Khajiit)",
    "primaryName": "Tabaxi",
    "altName": "Mushuk-odamlar / Khajiit",
    "category": "Hayvon-odamlar (Beastfolk)",
    "categoryId": "beastfolk",
    "badge": "Hayvon-odamlar & Bilim",
    "icon": "🐱",
    "world": "D&D, The Elder Scrolls.",
    "description": "Tezlikni ikki barobar oshirish (Feline Agility), devorlarga tirnoqlari bilan chiqish, qorong'uda ko'rish.",
    "abilities": "Tezlikni ikki barobar oshirish (Feline Agility), devorlarga tirnoqlari bilan chiqish, qorong'uda ko'rish.",
    "careers": "Qulfbuzar josus, ko'chmanchi savdogar, epchil akrobat.",
    "passiveBonus": "Zoologiya va tirik tabiat darslarida 1.5x ko'proq sezgirlik bonusi",
    "baseStats": {
      "speed": 18,
      "focus": 14,
      "stamina": 110,
      "intelligence": 12
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_24_leoninlar",
    "number": 24,
    "name": "Leoninlar (Sher-odamlar)",
    "primaryName": "Leoninlar",
    "altName": "Sher-odamlar",
    "category": "Hayvon-odamlar (Beastfolk)",
    "categoryId": "beastfolk",
    "badge": "Hayvon-odamlar & Bilim",
    "icon": "🦁",
    "world": "D&D (Theros), Magic: The Gathering.",
    "description": "Dushman yuragiga vahima soluvchi dahshatli na'ra, pahlavonlik, g'urur.",
    "abilities": "Dushman yuragiga vahima soluvchi dahshatli na'ra, pahlavonlik, g'urur.",
    "careers": "Qabila dohiysi, nayzaboz, sahro qo'riqchisi.",
    "passiveBonus": "Zoologiya va tirik tabiat darslarida 1.5x ko'proq sezgirlik bonusi",
    "baseStats": {
      "speed": 18,
      "focus": 14,
      "stamina": 110,
      "intelligence": 12
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_25_loxodonlar",
    "number": 25,
    "name": "Loxodonlar (Fil-odamlar)",
    "primaryName": "Loxodonlar",
    "altName": "Fil-odamlar",
    "category": "Hayvon-odamlar (Beastfolk)",
    "categoryId": "beastfolk",
    "badge": "Hayvon-odamlar & Bilim",
    "icon": "🐺",
    "world": "D&D (Ravnica).",
    "description": "Po'latdek tabiiy teri, xartum orqali narsalarni ushlash va his qilish, tinchliksevar donishmandlik.",
    "abilities": "Po'latdek tabiiy teri, xartum orqali narsalarni ushlash va his qilish, tinchliksevar donishmandlik.",
    "careers": "Tosh o'ymakori, me'mor, sobor ruhoniysi, qonun himoyachisi.",
    "passiveBonus": "Zoologiya va tirik tabiat darslarida 1.5x ko'proq sezgirlik bonusi",
    "baseStats": {
      "speed": 18,
      "focus": 14,
      "stamina": 110,
      "intelligence": 12
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_26_aarakocra",
    "number": 26,
    "name": "Aarakocra (Burgut-odamlar)",
    "primaryName": "Aarakocra",
    "altName": "Burgut-odamlar",
    "category": "Hayvon-odamlar (Beastfolk)",
    "categoryId": "beastfolk",
    "badge": "Hayvon-odamlar & Bilim",
    "icon": "🦅",
    "world": "D&D, havo elementar tekisligi.",
    "description": "Katta qanotlar orqali baland parvoz, havodan dushmanga zarba berish, shamol chaqirish.",
    "abilities": "Katta qanotlar orqali baland parvoz, havodan dushmanga zarba berish, shamol chaqirish.",
    "careers": "Havo razvedkachisi, tog' cho'qqilari posboni, shamol kamonchisi.",
    "passiveBonus": "Zoologiya va tirik tabiat darslarida 1.5x ko'proq sezgirlik bonusi",
    "baseStats": {
      "speed": 18,
      "focus": 14,
      "stamina": 110,
      "intelligence": 12
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_27_kenku",
    "number": 27,
    "name": "Kenku (Qarg'a-odamlar)",
    "primaryName": "Kenku",
    "altName": "Qarg'a-odamlar",
    "category": "Hayvon-odamlar (Beastfolk)",
    "categoryId": "beastfolk",
    "badge": "Hayvon-odamlar & Bilim",
    "icon": "🐺",
    "world": "D&D, yapon mifologiyasi.",
    "description": "Eshitgan har qanday tovush, so'z yoki ohangni 100% nusxalash (Mimicry), hujjatlarni soxtalashtirish mahorati.",
    "abilities": "Eshitgan har qanday tovush, so'z yoki ohangni 100% nusxalash (Mimicry), hujjatlarni soxtalashtirish mahorati.",
    "careers": "Xabarchi, josus, soxta hujjatlar ustasi, soyalar o'g'risi.",
    "passiveBonus": "Zoologiya va tirik tabiat darslarida 1.5x ko'proq sezgirlik bonusi",
    "baseStats": {
      "speed": 18,
      "focus": 14,
      "stamina": 110,
      "intelligence": 12
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_28_owlin",
    "number": 28,
    "name": "Owlin (Boyqush-odamlar)",
    "primaryName": "Owlin",
    "altName": "Boyqush-odamlar",
    "category": "Hayvon-odamlar (Beastfolk)",
    "categoryId": "beastfolk",
    "badge": "Hayvon-odamlar & Bilim",
    "icon": "🦅",
    "world": "D&D (Strixhaven).",
    "description": "Mutlaqo tovushsiz parvoz qilish, 360 darajali tungi ko'rish qobiliyati.",
    "abilities": "Mutlaqo tovushsiz parvoz qilish, 360 darajali tungi ko'rish qobiliyati.",
    "careers": "Sehr akademiyasi professori, tungi qorovul, astronom.",
    "passiveBonus": "Zoologiya va tirik tabiat darslarida 1.5x ko'proq sezgirlik bonusi",
    "baseStats": {
      "speed": 18,
      "focus": 14,
      "stamina": 110,
      "intelligence": 12
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_29_lizardfolk",
    "number": 29,
    "name": "Lizardfolk (Kaltakesak-odamlar)",
    "primaryName": "Lizardfolk",
    "altName": "Kaltakesak-odamlar",
    "category": "Hayvon-odamlar (Beastfolk)",
    "categoryId": "beastfolk",
    "badge": "Hayvon-odamlar & Bilim",
    "icon": "🐺",
    "world": "D&D, botqoqliklar.",
    "description": "Suv ostida 15 daqiqa nafasni ushlash, tabiiy tangacha sovut, suyaklardan qurol yasash.",
    "abilities": "Suv ostida 15 daqiqa nafasni ushlash, tabiiy tangacha sovut, suyaklardan qurol yasash.",
    "careers": "Botqoq izquvari, omon qolish bo'yicha yo'lboshchi, ibtidoiy shaman.",
    "passiveBonus": "Zoologiya va tirik tabiat darslarida 1.5x ko'proq sezgirlik bonusi",
    "baseStats": {
      "speed": 18,
      "focus": 14,
      "stamina": 110,
      "intelligence": 12
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_30_tortle",
    "number": 30,
    "name": "Tortle (Toshbaqa-odamlar)",
    "primaryName": "Tortle",
    "altName": "Toshbaqa-odamlar",
    "category": "Hayvon-odamlar (Beastfolk)",
    "categoryId": "beastfolk",
    "badge": "Hayvon-odamlar & Bilim",
    "icon": "🐺",
    "world": "D&D.",
    "description": "Qattiq toshbaqa kosasi (eng kuchli tabiiy sovut), o'z qobig'iga kirib olish, uzoq umr.",
    "abilities": "Qattiq toshbaqa kosasi (eng kuchli tabiiy sovut), o'z qobig'iga kirib olish, uzoq umr.",
    "careers": "Donishmand monax, qadimgi tarixchi, himoyachi paladin.",
    "passiveBonus": "Zoologiya va tirik tabiat darslarida 1.5x ko'proq sezgirlik bonusi",
    "baseStats": {
      "speed": 18,
      "focus": 14,
      "stamina": 110,
      "intelligence": 12
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_31_grung",
    "number": 31,
    "name": "Grung (Zaharli baqa-odamlar)",
    "primaryName": "Grung",
    "altName": "Zaharli baqa-odamlar",
    "category": "Hayvon-odamlar (Beastfolk)",
    "categoryId": "beastfolk",
    "badge": "Hayvon-odamlar & Bilim",
    "icon": "🐺",
    "world": "Tropik o'rmonlar, D&D.",
    "description": "Tanasidan o'tkir zahar ajratish, suvda yashash, balandlikka sakrash.",
    "abilities": "Tanasidan o'tkir zahar ajratish, suvda yashash, balandlikka sakrash.",
    "careers": "Zaharlovchi kamonboz, qabila ovchisi, botqoq dori-darmonchisi.",
    "passiveBonus": "Zoologiya va tirik tabiat darslarida 1.5x ko'proq sezgirlik bonusi",
    "baseStats": {
      "speed": 18,
      "focus": 14,
      "stamina": 110,
      "intelligence": 12
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_32_minotavrlar",
    "number": 32,
    "name": "Minotavrlar (Buqa-odamlar)",
    "primaryName": "Minotavrlar",
    "altName": "Buqa-odamlar",
    "category": "Hayvon-odamlar (Beastfolk)",
    "categoryId": "beastfolk",
    "badge": "Hayvon-odamlar & Bilim",
    "icon": "🐺",
    "world": "Yunon mifologiyasi, D&D.",
    "description": "Shoxlari bilan qudratli suzish, labirint va g'orlarda hech qachon yo'ldan adashmaslik.",
    "abilities": "Shoxlari bilan qudratli suzish, labirint va g'orlarda hech qachon yo'ldan adashmaslik.",
    "careers": "Qal'a buzuvchi zarbdor jangchi, dengiz qaroqchisi, labirint xo'jayini.",
    "passiveBonus": "Zoologiya va tirik tabiat darslarida 1.5x ko'proq sezgirlik bonusi",
    "baseStats": {
      "speed": 18,
      "focus": 14,
      "stamina": 110,
      "intelligence": 12
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_33_kentavrlar",
    "number": 33,
    "name": "Kentavrlar (Ot-odamlar)",
    "primaryName": "Kentavrlar",
    "altName": "Ot-odamlar",
    "category": "Hayvon-odamlar (Beastfolk)",
    "categoryId": "beastfolk",
    "badge": "Hayvon-odamlar & Bilim",
    "icon": "🌳",
    "world": "Yunon mifologiyasi, Narniya, D&D.",
    "description": "Otdan tez yugurish, tuyoqlar bilan zarba berish, yulduzlar harakatidan kelajakni o'qish.",
    "abilities": "Otdan tez yugurish, tuyoqlar bilan zarba berish, yulduzlar harakatidan kelajakni o'qish.",
    "careers": "Dasht kamonchisi, munajjim, o'rmon elchisi.",
    "passiveBonus": "Zoologiya va tirik tabiat darslarida 1.5x ko'proq sezgirlik bonusi",
    "baseStats": {
      "speed": 18,
      "focus": 14,
      "stamina": 110,
      "intelligence": 12
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_34_satyirlar_va_favnlar",
    "number": 34,
    "name": "Satyirlar va Favnlar (Echki-odamlar)",
    "primaryName": "Satyirlar va Favnlar",
    "altName": "Echki-odamlar",
    "category": "Hayvon-odamlar (Beastfolk)",
    "categoryId": "beastfolk",
    "badge": "Hayvon-odamlar & Bilim",
    "icon": "🐺",
    "world": "Yunon mifologiyasi, Fey olami.",
    "description": "Sehrli musiqalar orqali uxlatish yoki raqsga tushirish, sehrga qarshi tabiiy bardosh.",
    "abilities": "Sehrli musiqalar orqali uxlatish yoki raqsga tushirish, sehrga qarshi tabiiy bardosh.",
    "careers": "Musiqachi bard, bayramlar boshqaruvchisi, diplomat.",
    "passiveBonus": "Zoologiya va tirik tabiat darslarida 1.5x ko'proq sezgirlik bonusi",
    "baseStats": {
      "speed": 18,
      "focus": 14,
      "stamina": 110,
      "intelligence": 12
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_35_shifterlar",
    "number": 35,
    "name": "Shifterlar (Terianthrop avlodlari)",
    "primaryName": "Shifterlar",
    "altName": "Terianthrop avlodlari",
    "category": "Hayvon-odamlar (Beastfolk)",
    "categoryId": "beastfolk",
    "badge": "Hayvon-odamlar & Bilim",
    "icon": "🐺",
    "world": "Eberron (D&D).",
    "description": "Jang paytida yovvoyi yirtqich (bo'ri, ayiq, qoplon) xususiyatlariga kirish, tish va tirnoqlar o'stirish.",
    "abilities": "Jang paytida yovvoyi yirtqich (bo'ri, ayiq, qoplon) xususiyatlariga kirish, tish va tirnoqlar o'stirish.",
    "careers": "Yollanma ovchi, shahar xufyasi, yovvoyi jangchi.",
    "passiveBonus": "Zoologiya va tirik tabiat darslarida 1.5x ko'proq sezgirlik bonusi",
    "baseStats": {
      "speed": 18,
      "focus": 14,
      "stamina": 110,
      "intelligence": 12
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_36_hadozee",
    "number": 36,
    "name": "Hadozee (Qanotli maymun-odamlar)",
    "primaryName": "Hadozee",
    "altName": "Qanotli maymun-odamlar",
    "category": "Hayvon-odamlar (Beastfolk)",
    "categoryId": "beastfolk",
    "badge": "Hayvon-odamlar & Bilim",
    "icon": "🐺",
    "world": "Spelljammer (kosmik fentezi).",
    "description": "Qo'l va oyoqlari orasidagi teri pardasi orqali havoda suzish (glide), kemalarning ustunlarida epchillik.",
    "abilities": "Qo'l va oyoqlari orasidagi teri pardasi orqali havoda suzish (glide), kemalarning ustunlarida epchillik.",
    "careers": "Kosmik kema dengizchisi, kaskadyor, osmon razvedkachisi.",
    "passiveBonus": "Zoologiya va tirik tabiat darslarida 1.5x ko'proq sezgirlik bonusi",
    "baseStats": {
      "speed": 18,
      "focus": 14,
      "stamina": 110,
      "intelligence": 12
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_37_thri_kreen",
    "number": 37,
    "name": "Thri-kreen (Hasharot-odamlar / Mantis-folk)",
    "primaryName": "Thri-kreen",
    "altName": "Hasharot-odamlar / Mantis-folk",
    "category": "Hayvon-odamlar (Beastfolk)",
    "categoryId": "beastfolk",
    "badge": "Hayvon-odamlar & Bilim",
    "icon": "🐺",
    "world": "Dark Sun (D&D).",
    "description": "To'rtta qo'l bilan jang qilish, xitin sovut, psionik telepatiya, uyquga ehtiyoj yo'qligi.",
    "abilities": "To'rtta qo'l bilan jang qilish, xitin sovut, psionik telepatiya, uyquga ehtiyoj yo'qligi.",
    "careers": "Sahro jangchisi, psionik ovchi, to'rtta qilich ustasi.",
    "passiveBonus": "Zoologiya va tirik tabiat darslarida 1.5x ko'proq sezgirlik bonusi",
    "baseStats": {
      "speed": 18,
      "focus": 14,
      "stamina": 110,
      "intelligence": 12
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_38_kitsune",
    "number": 38,
    "name": "Kitsune (Tulki-odamlar)",
    "primaryName": "Kitsune",
    "altName": "Tulki-odamlar",
    "category": "Hayvon-odamlar (Beastfolk)",
    "categoryId": "beastfolk",
    "badge": "Hayvon-odamlar & Bilim",
    "icon": "🐬",
    "world": "Yapon mifologiyasi.",
    "description": "Odam qiyofasiga kirish, tulki olovi (Foxfire), ko'p dumli sehr kuchayishi.",
    "abilities": "Odam qiyofasiga kirish, tulki olovi (Foxfire), ko'p dumli sehr kuchayishi.",
    "careers": "Illyuziyachi josus, maftunkor sehrgar, shinto ruhoniysi.",
    "passiveBonus": "Zoologiya va tirik tabiat darslarida 1.5x ko'proq sezgirlik bonusi",
    "baseStats": {
      "speed": 18,
      "focus": 14,
      "stamina": 110,
      "intelligence": 12
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_39_tengu",
    "number": 39,
    "name": "Tengu (Qarg'a-ruh jangchilar)",
    "primaryName": "Tengu",
    "altName": "Qarg'a-ruh jangchilar",
    "category": "Hayvon-odamlar (Beastfolk)",
    "categoryId": "beastfolk",
    "badge": "Hayvon-odamlar & Bilim",
    "icon": "🐺",
    "world": "Yapon folklori.",
    "description": "Qilichbozlik sirlari, shamolni boshqarish, g'ayritabiiy epchillik.",
    "abilities": "Qilichbozlik sirlari, shamolni boshqarish, g'ayritabiiy epchillik.",
    "careers": "Qilichbozlik ustozi, tog' asketi (Yamabushi), samuray.",
    "passiveBonus": "Zoologiya va tirik tabiat darslarida 1.5x ko'proq sezgirlik bonusi",
    "baseStats": {
      "speed": 18,
      "focus": 14,
      "stamina": 110,
      "intelligence": 12
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_40_anubiatlar",
    "number": 40,
    "name": "Anubiatlar (Shoqol-odamlar / Xakallar)",
    "primaryName": "Anubiatlar",
    "altName": "Shoqol-odamlar / Xakallar",
    "category": "Hayvon-odamlar (Beastfolk)",
    "categoryId": "beastfolk",
    "badge": "Hayvon-odamlar & Bilim",
    "icon": "🐺",
    "world": "Qadimgi Misr mifologiyasi.",
    "description": "O'lim energiyasini his qilish, cho'l bo'ronlarida yo'l topish, mumiyolash san'ati.",
    "abilities": "O'lim energiyasini his qilish, cho'l bo'ronlarida yo'l topish, mumiyolash san'ati.",
    "careers": "Qabr qo'riqchisi, nekropol kohini, qora qurolsoz.",
    "passiveBonus": "Zoologiya va tirik tabiat darslarida 1.5x ko'proq sezgirlik bonusi",
    "baseStats": {
      "speed": 18,
      "focus": 14,
      "stamina": 110,
      "intelligence": 12
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_41_selkielar",
    "number": 41,
    "name": "Selkielar (Tyulen-odamlar)",
    "primaryName": "Selkielar",
    "altName": "Tyulen-odamlar",
    "category": "Hayvon-odamlar (Beastfolk)",
    "categoryId": "beastfolk",
    "badge": "Hayvon-odamlar & Bilim",
    "icon": "🐺",
    "world": "Shotlandiya va Irlandiya folklori.",
    "description": "Tyulen terisini kiyib okeanda cheksiz suzish, go'zal inson qiyofasiga kirish.",
    "abilities": "Tyulen terisini kiyib okeanda cheksiz suzish, go'zal inson qiyofasiga kirish.",
    "careers": "Dengiz yo'lboshchisi, baliqchilar homiysi, qirg'oq tabibi.",
    "passiveBonus": "Zoologiya va tirik tabiat darslarida 1.5x ko'proq sezgirlik bonusi",
    "baseStats": {
      "speed": 18,
      "focus": 14,
      "stamina": 110,
      "intelligence": 12
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_42_nezumi",
    "number": 42,
    "name": "Nezumi (Kalamush-odamlar / Skaven)",
    "primaryName": "Nezumi",
    "altName": "Kalamush-odamlar / Skaven",
    "category": "Hayvon-odamlar (Beastfolk)",
    "categoryId": "beastfolk",
    "badge": "Hayvon-odamlar & Bilim",
    "icon": "🐺",
    "world": "Sharq mifologiyasi, Warhammer.",
    "description": "Zaharga immunitet, yerosti laboratoriyalarida tajribalar o'tkazish, to'dali hujum.",
    "abilities": "Zaharga immunitet, yerosti laboratoriyalarida tajribalar o'tkazish, to'dali hujum.",
    "careers": "Zaharlovchi qotil, mutatsiya muhandisi, kanalizatsiya josusi. IV. Ajdaho, Surnaviy va Qadimgi Reptiliyalar (43-52)",
    "passiveBonus": "Zoologiya va tirik tabiat darslarida 1.5x ko'proq sezgirlik bonusi",
    "baseStats": {
      "speed": 18,
      "focus": 14,
      "stamina": 110,
      "intelligence": 12
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_43_xromatik_drakonidlar",
    "number": 43,
    "name": "Xromatik Drakonidlar (Qizil, Ko'k, Qora, Yashil, Oq Ajdaho qonlilar)",
    "primaryName": "Xromatik Drakonidlar",
    "altName": "Qizil, Ko'k, Qora, Yashil, Oq Ajdaho qonlilar",
    "category": "Ajdaho va Qadimgi Reptiliyalar",
    "categoryId": "dragon_reptile",
    "badge": "Ajdaho & Bilim",
    "icon": "🐲",
    "world": "D&D.",
    "description": "Mos elementar nafas (olov, chaqmoq, kislota, zahar, sovuq), po'latdek tangachalar.",
    "abilities": "Mos elementar nafas (olov, chaqmoq, kislota, zahar, sovuq), po'latdek tangachalar.",
    "careers": "Vahshiy jangchi, qonxo'r sarkarda, afsungar.",
    "passiveBonus": "Har 3 ta to'g'ri darsdan so'ng Ajdaho Himoyasi (xato qilish huquqi)",
    "baseStats": {
      "speed": 14,
      "focus": 15,
      "stamina": 140,
      "intelligence": 15
    },
    "defaultRoom": "medical_clinic"
  },
  {
    "id": "race_44_metallik_drakonidlar",
    "number": 44,
    "name": "Metallik Drakonidlar (Oltin, Kumush, Jez, Bronza, Mis)",
    "primaryName": "Metallik Drakonidlar",
    "altName": "Oltin, Kumush, Jez, Bronza, Mis",
    "category": "Ajdaho va Qadimgi Reptiliyalar",
    "categoryId": "dragon_reptile",
    "badge": "Ajdaho & Bilim",
    "icon": "🐲",
    "world": "D&D.",
    "description": "Paraliz qiluvchi yoki uxlatuvchi ikkinchi nafas, olijanoblik, yetakchilik aqli.",
    "abilities": "Paraliz qiluvchi yoki uxlatuvchi ikkinchi nafas, olijanoblik, yetakchilik aqli.",
    "careers": "Paladin, adolat sudyasi, armiya generali.",
    "passiveBonus": "Har 3 ta to'g'ri darsdan so'ng Ajdaho Himoyasi (xato qilish huquqi)",
    "baseStats": {
      "speed": 14,
      "focus": 15,
      "stamina": 140,
      "intelligence": 15
    },
    "defaultRoom": "medical_clinic"
  },
  {
    "id": "race_45_qimmatbaho_drakonidl",
    "number": 45,
    "name": "Qimmatbaho Drakonidlar (Gem Dragonborn - Ametist, Zumrad, Sapfir)",
    "primaryName": "Qimmatbaho Drakonidlar",
    "altName": "Gem Dragonborn - Ametist, Zumrad, Sapfir",
    "category": "Ajdaho va Qadimgi Reptiliyalar",
    "categoryId": "dragon_reptile",
    "badge": "Ajdaho & Bilim",
    "icon": "🐲",
    "world": "D&D.",
    "description": "Psionik gravitatsiya, aqliy zarba, qisqa muddatli qanotsiz parvoz.",
    "abilities": "Psionik gravitatsiya, aqliy zarba, qisqa muddatli qanotsiz parvoz.",
    "careers": "Psionik faylasuf, astra sayohatchisi, telepatik qo'riqchi.",
    "passiveBonus": "Har 3 ta to'g'ri darsdan so'ng Ajdaho Himoyasi (xato qilish huquqi)",
    "baseStats": {
      "speed": 14,
      "focus": 15,
      "stamina": 140,
      "intelligence": 15
    },
    "defaultRoom": "medical_clinic"
  },
  {
    "id": "race_46_yuan_ti_sofqonlar",
    "number": 46,
    "name": "Yuan-ti Sofqonlar (Yuan-ti Purebloods)",
    "primaryName": "Yuan-ti Sofqonlar",
    "altName": "Yuan-ti Purebloods",
    "category": "Ajdaho va Qadimgi Reptiliyalar",
    "categoryId": "dragon_reptile",
    "badge": "Ajdaho & Bilim",
    "icon": "🐲",
    "world": "D&D, qadimgi ilon imperiyalari.",
    "description": "Barcha zaharlarga to'liq immunitet, sehrga qarshi tabiiy qalqon, ilonlarni gipnoz qilish.",
    "abilities": "Barcha zaharlarga to'liq immunitet, sehrga qarshi tabiiy qalqon, ilonlarni gipnoz qilish.",
    "careers": "Saroy fitnachisi, zaharshunos, xufyona elchi.",
    "passiveBonus": "Har 3 ta to'g'ri darsdan so'ng Ajdaho Himoyasi (xato qilish huquqi)",
    "baseStats": {
      "speed": 14,
      "focus": 15,
      "stamina": 140,
      "intelligence": 15
    },
    "defaultRoom": "medical_clinic"
  },
  {
    "id": "race_47_yuan_ti_malisonlar",
    "number": 47,
    "name": "Yuan-ti Malisonlar (Yarim odam, yarim ilon)",
    "primaryName": "Yuan-ti Malisonlar",
    "altName": "Yarim odam, yarim ilon",
    "category": "Ajdaho va Qadimgi Reptiliyalar",
    "categoryId": "dragon_reptile",
    "badge": "Ajdaho & Bilim",
    "icon": "🐲",
    "world": "D&D.",
    "description": "Dushmanni tanasi bilan bo'g'ib o'ldirish, ilon chaqishi zahari.",
    "abilities": "Dushmanni tanasi bilan bo'g'ib o'ldirish, ilon chaqishi zahari.",
    "careers": "Qadimgi ibodatxona posboni, ilon kohini.",
    "passiveBonus": "Har 3 ta to'g'ri darsdan so'ng Ajdaho Himoyasi (xato qilish huquqi)",
    "baseStats": {
      "speed": 14,
      "focus": 15,
      "stamina": 140,
      "intelligence": 15
    },
    "defaultRoom": "medical_clinic"
  },
  {
    "id": "race_48_trogloditlar",
    "number": 48,
    "name": "Trogloditlar (Troglodytes)",
    "primaryName": "Trogloditlar",
    "altName": "Troglodytes",
    "category": "Ajdaho va Qadimgi Reptiliyalar",
    "categoryId": "dragon_reptile",
    "badge": "Ajdaho & Bilim",
    "icon": "🐲",
    "world": "Yerosti olami, D&D.",
    "description": "Dushmanlarni ko'nglini aynituvchi qo'lansa hid tarqatish, toshdek kamuflyaj.",
    "abilities": "Dushmanlarni ko'nglini aynituvchi qo'lansa hid tarqatish, toshdek kamuflyaj.",
    "careers": "G'or bosqinchisi, ibtidoiy ovchi.",
    "passiveBonus": "Har 3 ta to'g'ri darsdan so'ng Ajdaho Himoyasi (xato qilish huquqi)",
    "baseStats": {
      "speed": 14,
      "focus": 15,
      "stamina": 140,
      "intelligence": 15
    },
    "defaultRoom": "medical_clinic"
  },
  {
    "id": "race_49_nagalar",
    "number": 49,
    "name": "Nagalar (Nagas)",
    "primaryName": "Nagalar",
    "altName": "Nagas",
    "category": "Ajdaho va Qadimgi Reptiliyalar",
    "categoryId": "dragon_reptile",
    "badge": "Ajdaho & Bilim",
    "icon": "🐲",
    "world": "Hind mifologiyasi, Warcraft, D&D.",
    "description": "Suv va chaqmoq sehrlari, gipnotik nigoh, qayta tirilish qobiliyati.",
    "abilities": "Suv va chaqmoq sehrlari, gipnotik nigoh, qayta tirilish qobiliyati.",
    "careers": "Qadimiy xazinalar qo'riqchisi, oliy afsungar.",
    "passiveBonus": "Har 3 ta to'g'ri darsdan so'ng Ajdaho Himoyasi (xato qilish huquqi)",
    "baseStats": {
      "speed": 14,
      "focus": 15,
      "stamina": 140,
      "intelligence": 15
    },
    "defaultRoom": "medical_clinic"
  },
  {
    "id": "race_50_vishaplar",
    "number": 50,
    "name": "Vishaplar (Kavkaz ajdaho-odamlari)",
    "primaryName": "Vishaplar",
    "altName": "Kavkaz ajdaho-odamlari",
    "category": "Ajdaho va Qadimgi Reptiliyalar",
    "categoryId": "dragon_reptile",
    "badge": "Ajdaho & Bilim",
    "icon": "🐲",
    "world": "Arman va Kavkaz mifologiyasi.",
    "description": "Chashma va buloqlarni to'sib qo'yish, momaqaldiroq chaqirish.",
    "abilities": "Chashma va buloqlarni to'sib qo'yish, momaqaldiroq chaqirish.",
    "careers": "Tog' suvlari hukmdori, qadimgi tosh qo'riqchisi.",
    "passiveBonus": "Har 3 ta to'g'ri darsdan so'ng Ajdaho Himoyasi (xato qilish huquqi)",
    "baseStats": {
      "speed": 14,
      "focus": 15,
      "stamina": 140,
      "intelligence": 15
    },
    "defaultRoom": "medical_clinic"
  },
  {
    "id": "race_51_kokatriks_odamlar",
    "number": 51,
    "name": "Kokatriks-odamlar (Gipnozchi qush-reptiliyalar)",
    "primaryName": "Kokatriks-odamlar",
    "altName": "Gipnozchi qush-reptiliyalar",
    "category": "Ajdaho va Qadimgi Reptiliyalar",
    "categoryId": "dragon_reptile",
    "badge": "Ajdaho & Bilim",
    "icon": "🦅",
    "world": "O'rta asr Yevropa afsonalari.",
    "description": "Tegishi yoki chaqishi orqali tanani toshga aylantirish.",
    "abilities": "Tegishi yoki chaqishi orqali tanani toshga aylantirish.",
    "careers": "Zaharlovchi qotil, yerosti qo'riqchisi.",
    "passiveBonus": "Har 3 ta to'g'ri darsdan so'ng Ajdaho Himoyasi (xato qilish huquqi)",
    "baseStats": {
      "speed": 14,
      "focus": 15,
      "stamina": 140,
      "intelligence": 15
    },
    "defaultRoom": "medical_clinic"
  },
  {
    "id": "race_52_salamandralar",
    "number": 52,
    "name": "Salamandralar (Olov reptiliyalari)",
    "primaryName": "Salamandralar",
    "altName": "Olov reptiliyalari",
    "category": "Ajdaho va Qadimgi Reptiliyalar",
    "categoryId": "dragon_reptile",
    "badge": "Ajdaho & Bilim",
    "icon": "🔥",
    "world": "Alximiya afsonalari, D&D.",
    "description": "Olovda yashash, qizigan temirdek tana, olovli nayzalar bilan jang qilish.",
    "abilities": "Olovda yashash, qizigan temirdek tana, olovli nayzalar bilan jang qilish.",
    "careers": "Vulqon temirchisi, olov tekisligi askari. V. Elementallar va Planar Mavjudotlar (53-64)",
    "passiveBonus": "Har 3 ta to'g'ri darsdan so'ng Ajdaho Himoyasi (xato qilish huquqi)",
    "baseStats": {
      "speed": 14,
      "focus": 15,
      "stamina": 140,
      "intelligence": 15
    },
    "defaultRoom": "medical_clinic"
  },
  {
    "id": "race_53_olov_genasilari",
    "number": 53,
    "name": "Olov Genasilari (Fire Genasi)",
    "primaryName": "Olov Genasilari",
    "altName": "Fire Genasi",
    "category": "Elementallar va Planar Mavjudotlar",
    "categoryId": "elemental",
    "badge": "Elementallar & Bilim",
    "icon": "🔥",
    "world": "D&D planar olami.",
    "description": "Olovga immunitet, qorong'uda olovli sochlar bilan yorug'lik taratish, olov chaqirish.",
    "abilities": "Olovga immunitet, qorong'uda olovli sochlar bilan yorug'lik taratish, olov chaqirish.",
    "careers": "Piromant sehrgar, temirchi usta, chiroqchi.",
    "passiveBonus": "Kimyo va molekulyar biologiyada +15% quvvat bonusi",
    "baseStats": {
      "speed": 16,
      "focus": 16,
      "stamina": 105,
      "intelligence": 15
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_54_suv_genasilari",
    "number": 54,
    "name": "Suv Genasilari (Water Genasi)",
    "primaryName": "Suv Genasilari",
    "altName": "Water Genasi",
    "category": "Elementallar va Planar Mavjudotlar",
    "categoryId": "elemental",
    "badge": "Elementallar & Bilim",
    "icon": "🧜",
    "world": "D&D.",
    "description": "Suv ostida bemalol nafas olish, kislotaga qarshilik, suvni muzga aylantirish.",
    "abilities": "Suv ostida bemalol nafas olish, kislotaga qarshilik, suvni muzga aylantirish.",
    "careers": "G'avvos dengizchi, kema kapitani, suv tabibi.",
    "passiveBonus": "Kimyo va molekulyar biologiyada +15% quvvat bonusi",
    "baseStats": {
      "speed": 16,
      "focus": 16,
      "stamina": 105,
      "intelligence": 15
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_55_havo_genasilari",
    "number": 55,
    "name": "Havo Genasilari (Air Genasi)",
    "primaryName": "Havo Genasilari",
    "altName": "Air Genasi",
    "category": "Elementallar va Planar Mavjudotlar",
    "categoryId": "elemental",
    "badge": "Elementallar & Bilim",
    "icon": "🌪️",
    "world": "D&D.",
    "description": "Cheksiz nafasni ushlash (bo'g'ilmaslik), havoda yengil uchish, chaqmoq sehri.",
    "abilities": "Cheksiz nafasni ushlash (bo'g'ilmaslik), havoda yengil uchish, chaqmoq sehri.",
    "careers": "Tog' yo'l ko'rsatuvchisi, xabarchi, havo kamonchisi.",
    "passiveBonus": "Kimyo va molekulyar biologiyada +15% quvvat bonusi",
    "baseStats": {
      "speed": 16,
      "focus": 16,
      "stamina": 105,
      "intelligence": 15
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_56_yer_genasilari",
    "number": 56,
    "name": "Yer Genasilari (Earth Genasi)",
    "primaryName": "Yer Genasilari",
    "altName": "Earth Genasi",
    "category": "Elementallar va Planar Mavjudotlar",
    "categoryId": "elemental",
    "badge": "Elementallar & Bilim",
    "icon": "⚡",
    "world": "D&D.",
    "description": "Qattiq tosh orqali iz qoldirmay o'tish (Pass without Trace), po'latdek teri.",
    "abilities": "Qattiq tosh orqali iz qoldirmay o'tish (Pass without Trace), po'latdek teri.",
    "careers": "Konchi, me'mor, qal'a poydevori ustasi.",
    "passiveBonus": "Kimyo va molekulyar biologiyada +15% quvvat bonusi",
    "baseStats": {
      "speed": 16,
      "focus": 16,
      "stamina": 105,
      "intelligence": 15
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_57_ifritlar",
    "number": 57,
    "name": "Ifritlar (Efreeti)",
    "primaryName": "Ifritlar",
    "altName": "Efreeti",
    "category": "Elementallar va Planar Mavjudotlar",
    "categoryId": "elemental",
    "badge": "Elementallar & Bilim",
    "icon": "⚡",
    "world": "Arab mifologiyasi, D&D.",
    "description": "Tutun va olovdan yaratilgan, orzularni ayyorlik bilan amalga oshirish, olovli jazo.",
    "abilities": "Tutun va olovdan yaratilgan, orzularni ayyorlik bilan amalga oshirish, olovli jazo.",
    "careers": "Guruch shahri hukmdori, olov armiyasi lashkarboshisi.",
    "passiveBonus": "Kimyo va molekulyar biologiyada +15% quvvat bonusi",
    "baseStats": {
      "speed": 16,
      "focus": 16,
      "stamina": 105,
      "intelligence": 15
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_58_maridlar",
    "number": 58,
    "name": "Maridlar (Marid)",
    "primaryName": "Maridlar",
    "altName": "Marid",
    "category": "Elementallar va Planar Mavjudotlar",
    "categoryId": "elemental",
    "badge": "Elementallar & Bilim",
    "icon": "⚡",
    "world": "Sharq mifologiyasi.",
    "description": "Suv bo'ronlarini yaratish, shaklini o'zgartirish, okean qudrati.",
    "abilities": "Suv bo'ronlarini yaratish, shaklini o'zgartirish, okean qudrati.",
    "careers": "To'lqinlar podshosi, dengiz afsungari.",
    "passiveBonus": "Kimyo va molekulyar biologiyada +15% quvvat bonusi",
    "baseStats": {
      "speed": 16,
      "focus": 16,
      "stamina": 105,
      "intelligence": 15
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_59_dao",
    "number": 59,
    "name": "Dao (Dao)",
    "primaryName": "Dao",
    "altName": "Dao",
    "category": "Elementallar va Planar Mavjudotlar",
    "categoryId": "elemental",
    "badge": "Elementallar & Bilim",
    "icon": "⚡",
    "world": "Yer tekisligi jinlari.",
    "description": "Toshlarni olmosga aylantirish, yer qimirlatish.",
    "abilities": "Toshlarni olmosga aylantirish, yer qimirlatish.",
    "careers": "Yerosti qimmatbaho toshlar hukmdori.",
    "passiveBonus": "Kimyo va molekulyar biologiyada +15% quvvat bonusi",
    "baseStats": {
      "speed": 16,
      "focus": 16,
      "stamina": 105,
      "intelligence": 15
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_60_djinnlar",
    "number": 60,
    "name": "Djinnlar (Djinn)",
    "primaryName": "Djinnlar",
    "altName": "Djinn",
    "category": "Elementallar va Planar Mavjudotlar",
    "categoryId": "elemental",
    "badge": "Elementallar & Bilim",
    "icon": "⚡",
    "world": "Arab mifologiyasi.",
    "description": "Qudratli bo'ronlar va saroblar yaratish, samoviy parvoz.",
    "abilities": "Qudratli bo'ronlar va saroblar yaratish, samoviy parvoz.",
    "careers": "Shamollar amiri, havo saroyi me'mori.",
    "passiveBonus": "Kimyo va molekulyar biologiyada +15% quvvat bonusi",
    "baseStats": {
      "speed": 16,
      "focus": 16,
      "stamina": 105,
      "intelligence": 15
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_61_tieflinglar",
    "number": 61,
    "name": "Tieflinglar (Iblis qoni egalari)",
    "primaryName": "Tieflinglar",
    "altName": "Iblis qoni egalari",
    "category": "Elementallar va Planar Mavjudotlar",
    "categoryId": "elemental",
    "badge": "Elementallar & Bilim",
    "icon": "⚡",
    "world": "D&D.",
    "description": "Olovga qarshilik, jahannamiy qasos sehri (Hellish Rebuke), qorong'uda ko'rish, xarizma.",
    "abilities": "Olovga qarshilik, jahannamiy qasos sehri (Hellish Rebuke), qorong'uda ko'rish, xarizma.",
    "careers": "Warlock (bitimli sehrgar), diplomat, xufyona qotil.",
    "passiveBonus": "Kimyo va molekulyar biologiyada +15% quvvat bonusi",
    "baseStats": {
      "speed": 16,
      "focus": 16,
      "stamina": 105,
      "intelligence": 15
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_62_aasimarlar",
    "number": 62,
    "name": "Aasimarlar (Samoviy farishta nasli)",
    "primaryName": "Aasimarlar",
    "altName": "Samoviy farishta nasli",
    "category": "Elementallar va Planar Mavjudotlar",
    "categoryId": "elemental",
    "badge": "Elementallar & Bilim",
    "icon": "⚡",
    "world": "D&D.",
    "description": "Qo'l tegizib davolash (Healing Hands), samoviy nur qanotlari, yorug'lik chaqirish.",
    "abilities": "Qo'l tegizib davolash (Healing Hands), samoviy nur qanotlari, yorug'lik chaqirish.",
    "careers": "Davolovchi kohin, muqaddas ritsar, adolat kurashchisi.",
    "passiveBonus": "Kimyo va molekulyar biologiyada +15% quvvat bonusi",
    "baseStats": {
      "speed": 16,
      "focus": 16,
      "stamina": 105,
      "intelligence": 15
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_63_githyanki",
    "number": 63,
    "name": "Githyanki (Astra jangchilari)",
    "primaryName": "Githyanki",
    "altName": "Astra jangchilari",
    "category": "Elementallar va Planar Mavjudotlar",
    "categoryId": "elemental",
    "badge": "Elementallar & Bilim",
    "icon": "⚡",
    "world": "D&D (Astral Plane).",
    "description": "Psionik sakrash va telekinez, kumush qilichlar bilan astra rishtalarini kesish, qizil ajdaholarga minish.",
    "abilities": "Psionik sakrash va telekinez, kumush qilichlar bilan astra rishtalarini kesish, qizil ajdaholarga minish.",
    "careers": "Qilichboz jangchi, qaroqchi kema sardori.",
    "passiveBonus": "Kimyo va molekulyar biologiyada +15% quvvat bonusi",
    "baseStats": {
      "speed": 16,
      "focus": 16,
      "stamina": 105,
      "intelligence": 15
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_64_githzerai",
    "number": 64,
    "name": "Githzerai (Aql va osoyishtalik xalqi)",
    "primaryName": "Githzerai",
    "altName": "Aql va osoyishtalik xalqi",
    "category": "Elementallar va Planar Mavjudotlar",
    "categoryId": "elemental",
    "badge": "Elementallar & Bilim",
    "icon": "⚡",
    "world": "D&D (Limbo).",
    "description": "Tartibsiz xaos olamini o'z ong kuchi bilan qotirib qo'yish, psionik qalqon.",
    "abilities": "Tartibsiz xaos olamini o'z ong kuchi bilan qotirib qo'yish, psionik qalqon.",
    "careers": "Monax, aql ustozi, faylasuf. VI. Suv va Chuqur Okean Osti Irqlari (65-74)",
    "passiveBonus": "Kimyo va molekulyar biologiyada +15% quvvat bonusi",
    "baseStats": {
      "speed": 16,
      "focus": 16,
      "stamina": 105,
      "intelligence": 15
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_65_tritonlar",
    "number": 65,
    "name": "Tritonlar (Tritons)",
    "primaryName": "Tritonlar",
    "altName": "Tritons",
    "category": "Suv va Okean Osti Irqlari",
    "categoryId": "ocean_depths",
    "badge": "Suv & Bilim",
    "icon": "🧜",
    "world": "Yunon mifologiyasi, D&D.",
    "description": "Chuqur suv bosimiga va sovuqqa chidamlilik, dengiz jonzotlari bilan muloqot, suv devorlarini chaqirish.",
    "abilities": "Chuqur suv bosimiga va sovuqqa chidamlilik, dengiz jonzotlari bilan muloqot, suv devorlarini chaqirish.",
    "careers": "Okean tubi posboni, uch tishli nayzaboz, dengiz ritsari.",
    "passiveBonus": "Gidrologiya va suv ekologiyasida +20% XP",
    "baseStats": {
      "speed": 15,
      "focus": 15,
      "stamina": 110,
      "intelligence": 14
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_66_suv_elflari",
    "number": 66,
    "name": "Suv Elflari (Sea Elves)",
    "primaryName": "Suv Elflari",
    "altName": "Sea Elves",
    "category": "Suv va Okean Osti Irqlari",
    "categoryId": "ocean_depths",
    "badge": "Suv & Bilim",
    "icon": "🧝",
    "world": "D&D.",
    "description": "Suvda erkin nafas olish va tez suzish, riflar orasida yashirinish.",
    "abilities": "Suvda erkin nafas olish va tez suzish, riflar orasida yashirinish.",
    "careers": "Marjon riflari qo'riqchisi, suv osti kamonchisi.",
    "passiveBonus": "Gidrologiya va suv ekologiyasida +20% XP",
    "baseStats": {
      "speed": 15,
      "focus": 15,
      "stamina": 110,
      "intelligence": 14
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_67_merfolk_suv_parila",
    "number": 67,
    "name": "Merfolk / Suv Parilari (Merfolk)",
    "primaryName": "Merfolk / Suv Parilari",
    "altName": "Merfolk",
    "category": "Suv va Okean Osti Irqlari",
    "categoryId": "ocean_depths",
    "badge": "Suv & Bilim",
    "icon": "🧜",
    "world": "Jahon folklori.",
    "description": "Baliq dumi bilan suvda chaqqon harakatlanish, maftunkor sehrli qo'shiq.",
    "abilities": "Baliq dumi bilan suvda chaqqon harakatlanish, maftunkor sehrli qo'shiq.",
    "careers": "Suv osti shaharlari me'mori, marvarid yig'uvchi, dengiz bardi.",
    "passiveBonus": "Gidrologiya va suv ekologiyasida +20% XP",
    "baseStats": {
      "speed": 15,
      "focus": 15,
      "stamina": 110,
      "intelligence": 14
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_68_sahuagin",
    "number": 68,
    "name": "Sahuagin (Dengiz iblislari / Akula-odamlar)",
    "primaryName": "Sahuagin",
    "altName": "Dengiz iblislari / Akula-odamlar",
    "category": "Suv va Okean Osti Irqlari",
    "categoryId": "ocean_depths",
    "badge": "Suv & Bilim",
    "icon": "🦈",
    "world": "D&D.",
    "description": "Suvdagi bir tomchi qon hidini sezib aqldan ozish (Blood Frenzy), akulalar bilan telepatik aloqa.",
    "abilities": "Suvdagi bir tomchi qon hidini sezib aqldan ozish (Blood Frenzy), akulalar bilan telepatik aloqa.",
    "careers": "Cho'kkan kemalar bosqinchisi, akula chavandozi, dengiz qotili.",
    "passiveBonus": "Gidrologiya va suv ekologiyasida +20% XP",
    "baseStats": {
      "speed": 15,
      "focus": 15,
      "stamina": 110,
      "intelligence": 14
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_69_locathah",
    "number": 69,
    "name": "Locathah (Baliq-odamlar)",
    "primaryName": "Locathah",
    "altName": "Baliq-odamlar",
    "category": "Suv va Okean Osti Irqlari",
    "categoryId": "ocean_depths",
    "badge": "Suv & Bilim",
    "icon": "🧜",
    "world": "D&D.",
    "description": "Qalin tangachalar, jamoaviy birdamlik, zaharlarga qarshilik.",
    "abilities": "Qalin tangachalar, jamoaviy birdamlik, zaharlarga qarshilik.",
    "careers": "Baliqchi, suv osti karvoni haydovchisi.",
    "passiveBonus": "Gidrologiya va suv ekologiyasida +20% XP",
    "baseStats": {
      "speed": 15,
      "focus": 15,
      "stamina": 110,
      "intelligence": 14
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_70_kuo_toa",
    "number": 70,
    "name": "Kuo-Toa (Zulmat baliq-odamlari)",
    "primaryName": "Kuo-Toa",
    "altName": "Zulmat baliq-odamlari",
    "category": "Suv va Okean Osti Irqlari",
    "categoryId": "ocean_depths",
    "badge": "Suv & Bilim",
    "icon": "🧜",
    "world": "D&D (Underdark).",
    "description": "Ko'rinmas mavjudotlarni aniq ko'rish, o'z e'tiqodlari orqali yangi xudolarni yaratish.",
    "abilities": "Ko'rinmas mavjudotlarni aniq ko'rish, o'z e'tiqodlari orqali yangi xudolarni yaratish.",
    "careers": "Jinni kohin, yopishqoq qalqonli jangchi.",
    "passiveBonus": "Gidrologiya va suv ekologiyasida +20% XP",
    "baseStats": {
      "speed": 15,
      "focus": 15,
      "stamina": 110,
      "intelligence": 14
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_71_sirenlar",
    "number": 71,
    "name": "Sirenlar (Sirens)",
    "primaryName": "Sirenlar",
    "altName": "Sirens",
    "category": "Suv va Okean Osti Irqlari",
    "categoryId": "ocean_depths",
    "badge": "Suv & Bilim",
    "icon": "🧜",
    "world": "Yunon mifologiyasi.",
    "description": "Kemachilarni qoyalarga urilishga majbur qiluvchi sehrli qo'shiq.",
    "abilities": "Kemachilarni qoyalarga urilishga majbur qiluvchi sehrli qo'shiq.",
    "careers": "Dengiz afsungari, qoyalar posboni.",
    "passiveBonus": "Gidrologiya va suv ekologiyasida +20% XP",
    "baseStats": {
      "speed": 15,
      "focus": 15,
      "stamina": 110,
      "intelligence": 14
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_72_nixilar",
    "number": 72,
    "name": "Nixilar (Nixies)",
    "primaryName": "Nixilar",
    "altName": "Nixies",
    "category": "Suv va Okean Osti Irqlari",
    "categoryId": "ocean_depths",
    "badge": "Suv & Bilim",
    "icon": "🧜",
    "world": "Yevropa folklori.",
    "description": "Chuchuk suv parilari, odamlarni suv tubiga tortish sehri, shaffoflik.",
    "abilities": "Chuchuk suv parilari, odamlarni suv tubiga tortish sehri, shaffoflik.",
    "careers": "Daryo ruhi, chashma qo'riqchisi.",
    "passiveBonus": "Gidrologiya va suv ekologiyasida +20% XP",
    "baseStats": {
      "speed": 15,
      "focus": 15,
      "stamina": 110,
      "intelligence": 14
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_73_suv_maymunlari",
    "number": 73,
    "name": "Suv Maymunlari (Kappa)",
    "primaryName": "Suv Maymunlari",
    "altName": "Kappa",
    "category": "Suv va Okean Osti Irqlari",
    "categoryId": "ocean_depths",
    "badge": "Suv & Bilim",
    "icon": "🧜",
    "world": "Yapon mifologiyasi.",
    "description": "Boshidagi kosachada suv bor ekan yengilmaslik, dzyudo/sumo bo'yicha kuch.",
    "abilities": "Boshidagi kosachada suv bor ekan yengilmaslik, dzyudo/sumo bo'yicha kuch.",
    "careers": "Daryo kurashchisi, tabib-shifokor.",
    "passiveBonus": "Gidrologiya va suv ekologiyasida +20% XP",
    "baseStats": {
      "speed": 15,
      "focus": 15,
      "stamina": 110,
      "intelligence": 14
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_74_kraken_qonlilar",
    "number": 74,
    "name": "Kraken qonlilar (Kraken-kin)",
    "primaryName": "Kraken qonlilar",
    "altName": "Kraken-kin",
    "category": "Suv va Okean Osti Irqlari",
    "categoryId": "ocean_depths",
    "badge": "Suv & Bilim",
    "icon": "🧜",
    "world": "Chuqur dengiz afsonalari.",
    "description": "Siyoh purkash, paypaslagichlar bilan suzish, telepatik dahshat solish.",
    "abilities": "Siyoh purkash, paypaslagichlar bilan suzish, telepatik dahshat solish.",
    "careers": "Qorong'u okean kohini, kema cho'ktiruvchi. VII. Fey, O'rmon va Tabiat Ruhlari (75-84)",
    "passiveBonus": "Gidrologiya va suv ekologiyasida +20% XP",
    "baseStats": {
      "speed": 15,
      "focus": 15,
      "stamina": 110,
      "intelligence": 14
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_75_eladrin",
    "number": 75,
    "name": "Eladrin (Fasllar Elflari)",
    "primaryName": "Eladrin",
    "altName": "Fasllar Elflari",
    "category": "Fey va Tabiat Ruhlari",
    "categoryId": "fey_spirits",
    "badge": "Fey & Bilim",
    "icon": "🧝",
    "world": "Feywild (D&D).",
    "description": "Hissiyotlariga qarab to'rt faslga (Bahor, Yoz, Kuz, Qish) o'zgarish, fey sakrashi (Fey Step).",
    "abilities": "Hissiyotlariga qarab to'rt faslga (Bahor, Yoz, Kuz, Qish) o'zgarish, fey sakrashi (Fey Step).",
    "careers": "Hissiyotlar sehrgari, fey elchisi, shoir.",
    "passiveBonus": "Botanika va o'simliklar olamida +25% unumdorlik",
    "baseStats": {
      "speed": 17,
      "focus": 17,
      "stamina": 85,
      "intelligence": 16
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_76_piksilar_va_parilar",
    "number": 76,
    "name": "Piksilar va Parilar (Fairies / Pixies)",
    "primaryName": "Piksilar va Parilar",
    "altName": "Fairies / Pixies",
    "category": "Fey va Tabiat Ruhlari",
    "categoryId": "fey_spirits",
    "badge": "Fey & Bilim",
    "icon": "🧚",
    "world": "Folklor, D&D.",
    "description": "Qanotlar bilan uchish, sehrli chang orqali boshqalarni uchirish, ko'rinmas bo'lib olish.",
    "abilities": "Qanotlar bilan uchish, sehrli chang orqali boshqalarni uchirish, ko'rinmas bo'lib olish.",
    "careers": "Hazilkash sehrgar, o'simliklar o'stiruvchisi.",
    "passiveBonus": "Botanika va o'simliklar olamida +25% unumdorlik",
    "baseStats": {
      "speed": 17,
      "focus": 17,
      "stamina": 85,
      "intelligence": 16
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_77_driyadalar",
    "number": 77,
    "name": "Driyadalar (Draxt parilari)",
    "primaryName": "Driyadalar",
    "altName": "Draxt parilari",
    "category": "Fey va Tabiat Ruhlari",
    "categoryId": "fey_spirits",
    "badge": "Fey & Bilim",
    "icon": "🧚",
    "world": "Yunon mifologiyasi.",
    "description": "Bitta qadimiy daraxtga joni bog'langan bo'lish, daraxtdan daraxtga teleportatsiya qilish.",
    "abilities": "Bitta qadimiy daraxtga joni bog'langan bo'lish, daraxtdan daraxtga teleportatsiya qilish.",
    "careers": "Muqaddas o'rmon homiysi, o'simliklar tabibi.",
    "passiveBonus": "Botanika va o'simliklar olamida +25% unumdorlik",
    "baseStats": {
      "speed": 17,
      "focus": 17,
      "stamina": 85,
      "intelligence": 16
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_78_nayadalar",
    "number": 78,
    "name": "Nayadalar (Buloq parilari)",
    "primaryName": "Nayadalar",
    "altName": "Buloq parilari",
    "category": "Fey va Tabiat Ruhlari",
    "categoryId": "fey_spirits",
    "badge": "Fey & Bilim",
    "icon": "🧚",
    "world": "Mifologiya.",
    "description": "Suvni tozalash, shifobaxsh buloqlar yaratish.",
    "abilities": "Suvni tozalash, shifobaxsh buloqlar yaratish.",
    "careers": "Muqaddas suv qo'riqchisi, tabib.",
    "passiveBonus": "Botanika va o'simliklar olamida +25% unumdorlik",
    "baseStats": {
      "speed": 17,
      "focus": 17,
      "stamina": 85,
      "intelligence": 16
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_79_entlar_treantlar",
    "number": 79,
    "name": "Entlar / Treantlar (Yuruvchi ulkan daraxtlar)",
    "primaryName": "Entlar / Treantlar",
    "altName": "Yuruvchi ulkan daraxtlar",
    "category": "Fey va Tabiat Ruhlari",
    "categoryId": "fey_spirits",
    "badge": "Fey & Bilim",
    "icon": "🌳",
    "world": "Tolkien, D&D.",
    "description": "O'rmon daraxtlarini uyg'otish va jangga chorlash, toshlarni maydalovchi ulkan shoxlar.",
    "abilities": "O'rmon daraxtlarini uyg'otish va jangga chorlash, toshlarni maydalovchi ulkan shoxlar.",
    "careers": "O'rmon podshosi, tabiat himoyachisi.",
    "passiveBonus": "Botanika va o'simliklar olamida +25% unumdorlik",
    "baseStats": {
      "speed": 17,
      "focus": 17,
      "stamina": 85,
      "intelligence": 16
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_80_mikonidlar",
    "number": 80,
    "name": "Mikonidlar (Qo'ziqorin-odamlar)",
    "primaryName": "Mikonidlar",
    "altName": "Qo'ziqorin-odamlar",
    "category": "Fey va Tabiat Ruhlari",
    "categoryId": "fey_spirits",
    "badge": "Fey & Bilim",
    "icon": "🧚",
    "world": "D&D (Underdark).",
    "description": "Spora orqali telepatik aloqa (Raport Spores), o'liklarni zamburug' yordamida harakatlantirish.",
    "abilities": "Spora orqali telepatik aloqa (Raport Spores), o'liklarni zamburug' yordamida harakatlantirish.",
    "careers": "Jamoaviy ong a'zosi, yerosti fermeri.",
    "passiveBonus": "Botanika va o'simliklar olamida +25% unumdorlik",
    "baseStats": {
      "speed": 17,
      "focus": 17,
      "stamina": 85,
      "intelligence": 16
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_81_silflar",
    "number": 81,
    "name": "Silflar (Shamol parilari)",
    "primaryName": "Silflar",
    "altName": "Shamol parilari",
    "category": "Fey va Tabiat Ruhlari",
    "categoryId": "fey_spirits",
    "badge": "Fey & Bilim",
    "icon": "🌪️",
    "world": "Alximiya.",
    "description": "Havoda erib ketish, mayin shabada yoki kuchli to'fon keltirib chiqarish.",
    "abilities": "Havoda erib ketish, mayin shabada yoki kuchli to'fon keltirib chiqarish.",
    "careers": "Bulutlar cho'poni, havo xabarchisi.",
    "passiveBonus": "Botanika va o'simliklar olamida +25% unumdorlik",
    "baseStats": {
      "speed": 17,
      "focus": 17,
      "stamina": 85,
      "intelligence": 16
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_82_korredlar",
    "number": 82,
    "name": "Korredlar (Sochli yerosti feylari)",
    "primaryName": "Korredlar",
    "altName": "Sochli yerosti feylari",
    "category": "Fey va Tabiat Ruhlari",
    "categoryId": "fey_spirits",
    "badge": "Fey & Bilim",
    "icon": "🧚",
    "world": "D&D, Keltlar mifologiyasi.",
    "description": "Tirik va temirdek mustahkam sochlar orqali tuzoqlar yasash, toshlarni kesish.",
    "abilities": "Tirik va temirdek mustahkam sochlar orqali tuzoqlar yasash, toshlarni kesish.",
    "careers": "Tosh o'ymakori, er osti qo'riqchisi.",
    "passiveBonus": "Botanika va o'simliklar olamida +25% unumdorlik",
    "baseStats": {
      "speed": 17,
      "focus": 17,
      "stamina": 85,
      "intelligence": 16
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_83_leshiy",
    "number": 83,
    "name": "Leshiy (O'rmon ruhi)",
    "primaryName": "Leshiy",
    "altName": "O'rmon ruhi",
    "category": "Fey va Tabiat Ruhlari",
    "categoryId": "fey_spirits",
    "badge": "Fey & Bilim",
    "icon": "🧚",
    "world": "Slavyan mifologiyasi.",
    "description": "Bo'yini o'tdan past yoki daraxtdan baland qila olish, odamlarni o'rmonda adashtirish.",
    "abilities": "Bo'yini o'tdan past yoki daraxtdan baland qila olish, odamlarni o'rmonda adashtirish.",
    "careers": "O'rmon xo'jayini, yovvoyi hayvonlar yetakchisi.",
    "passiveBonus": "Botanika va o'simliklar olamida +25% unumdorlik",
    "baseStats": {
      "speed": 17,
      "focus": 17,
      "stamina": 85,
      "intelligence": 16
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_84_mandragoralar",
    "number": 84,
    "name": "Mandragoralar (Tirik ildiz-odamlar)",
    "primaryName": "Mandragoralar",
    "altName": "Tirik ildiz-odamlar",
    "category": "Fey va Tabiat Ruhlari",
    "categoryId": "fey_spirits",
    "badge": "Fey & Bilim",
    "icon": "🧚",
    "world": "Alximiya va o'rta asr afsonalari.",
    "description": "Yerdan sug'urib olinganda odamni o'ldiruvchi faryod solish, kuchli dori xususiyatlari.",
    "abilities": "Yerdan sug'urib olinganda odamni o'ldiruvchi faryod solish, kuchli dori xususiyatlari.",
    "careers": "Alximik mahsulot, tirik signalizatsiya. VIII. Gigantlar, Koloslar va Pahlavonlar (85-94)",
    "passiveBonus": "Botanika va o'simliklar olamida +25% unumdorlik",
    "baseStats": {
      "speed": 17,
      "focus": 17,
      "stamina": 85,
      "intelligence": 16
    },
    "defaultRoom": "botanical_garden"
  },
  {
    "id": "race_85_goliatlar",
    "number": 85,
    "name": "Goliatlar (Qoya pahlavonlari)",
    "primaryName": "Goliatlar",
    "altName": "Qoya pahlavonlari",
    "category": "Gigantlar va Koloslar",
    "categoryId": "giants_titans",
    "badge": "Gigantlar & Bilim",
    "icon": "🗿",
    "world": "D&D.",
    "description": "Zarba olganda toshdek qotib og'riqni kamaytirish (Stone's Endurance), baland tog' iqlimiga chidamlilik.",
    "abilities": "Zarba olganda toshdek qotib og'riqni kamaytirish (Stone's Endurance), baland tog' iqlimiga chidamlilik.",
    "careers": "Qoya ovchisi, tog' qabilasi chempioni, pahlavon.",
    "passiveBonus": "Anatomiya va gavda tuzilishida 2x mustahkamlik",
    "baseStats": {
      "speed": 8,
      "focus": 12,
      "stamina": 180,
      "intelligence": 12
    },
    "defaultRoom": "medical_clinic"
  },
  {
    "id": "race_86_bo_ron_devlari",
    "number": 86,
    "name": "Bo'ron Devlari (Storm Giants)",
    "primaryName": "Bo'ron Devlari",
    "altName": "Storm Giants",
    "category": "Gigantlar va Koloslar",
    "categoryId": "giants_titans",
    "badge": "Gigantlar & Bilim",
    "icon": "🗿",
    "world": "D&D, Skandinaviya mifologiyasi.",
    "description": "Chaqmoq va to'fonlarni boshqarish, suv ostida yashay olish, kelajakni yulduzlardan ko'rish.",
    "abilities": "Chaqmoq va to'fonlarni boshqarish, suv ostida yashay olish, kelajakni yulduzlardan ko'rish.",
    "careers": "Dengiz va osmon hukmdori, adolat sudyasi.",
    "passiveBonus": "Anatomiya va gavda tuzilishida 2x mustahkamlik",
    "baseStats": {
      "speed": 8,
      "focus": 12,
      "stamina": 180,
      "intelligence": 12
    },
    "defaultRoom": "medical_clinic"
  },
  {
    "id": "race_87_bulut_devlari",
    "number": 87,
    "name": "Bulut Devlari (Cloud Giants)",
    "primaryName": "Bulut Devlari",
    "altName": "Cloud Giants",
    "category": "Gigantlar va Koloslar",
    "categoryId": "giants_titans",
    "badge": "Gigantlar & Bilim",
    "icon": "🗿",
    "world": "D&D.",
    "description": "Bulutlar ustida muallaq saroylar qurish, tumanni boshqarish, ulkan sehr qudrati.",
    "abilities": "Bulutlar ustida muallaq saroylar qurish, tumanni boshqarish, ulkan sehr qudrati.",
    "careers": "Osmon zodagoni, saroy sehrgari.",
    "passiveBonus": "Anatomiya va gavda tuzilishida 2x mustahkamlik",
    "baseStats": {
      "speed": 8,
      "focus": 12,
      "stamina": 180,
      "intelligence": 12
    },
    "defaultRoom": "medical_clinic"
  },
  {
    "id": "race_88_olov_devlari",
    "number": 88,
    "name": "Olov Devlari (Fire Giants)",
    "primaryName": "Olov Devlari",
    "altName": "Fire Giants",
    "category": "Gigantlar va Koloslar",
    "categoryId": "giants_titans",
    "badge": "Gigantlar & Bilim",
    "icon": "🔥",
    "world": "D&D, Skandinaviya (Muspelxaym).",
    "description": "Qizigan lavaga immunitet, harbiy intizom, buyuk temirchilik mahorati.",
    "abilities": "Qizigan lavaga immunitet, harbiy intizom, buyuk temirchilik mahorati.",
    "careers": "General, qurolsoz usta, qamal dvigatellari muhandisi.",
    "passiveBonus": "Anatomiya va gavda tuzilishida 2x mustahkamlik",
    "baseStats": {
      "speed": 8,
      "focus": 12,
      "stamina": 180,
      "intelligence": 12
    },
    "defaultRoom": "medical_clinic"
  },
  {
    "id": "race_89_muz_ayoz_devlari",
    "number": 89,
    "name": "Muz/Ayoz Devlari (Frost Giants / Yotunlar)",
    "primaryName": "Muz/Ayoz Devlari",
    "altName": "Frost Giants / Yotunlar",
    "category": "Gigantlar va Koloslar",
    "categoryId": "giants_titans",
    "badge": "Gigantlar & Bilim",
    "icon": "❄️",
    "world": "Skandinaviya mifologiyasi, D&D.",
    "description": "Sovuqqa to'liq immunitet, ulkan jismoniy kuch, muz bo'ronlari yaratish.",
    "abilities": "Sovuqqa to'liq immunitet, ulkan jismoniy kuch, muz bo'ronlari yaratish.",
    "careers": "Shimol qaroqchisi, yirtqich hayvonlar (oq ayiqlar) yetakchisi.",
    "passiveBonus": "Anatomiya va gavda tuzilishida 2x mustahkamlik",
    "baseStats": {
      "speed": 8,
      "focus": 12,
      "stamina": 180,
      "intelligence": 12
    },
    "defaultRoom": "medical_clinic"
  },
  {
    "id": "race_90_tosh_devlari",
    "number": 90,
    "name": "Tosh Devlari (Stone Giants)",
    "primaryName": "Tosh Devlari",
    "altName": "Stone Giants",
    "category": "Gigantlar va Koloslar",
    "categoryId": "giants_titans",
    "badge": "Gigantlar & Bilim",
    "icon": "🗿",
    "world": "D&D.",
    "description": "Toshlarni loydek shakllantirish, ulkan xarsanglarni uzoqqa uloqtirish.",
    "abilities": "Toshlarni loydek shakllantirish, ulkan xarsanglarni uzoqqa uloqtirish.",
    "careers": "Badiiy haykaltarosh, g'orlar donishmandi.",
    "passiveBonus": "Anatomiya va gavda tuzilishida 2x mustahkamlik",
    "baseStats": {
      "speed": 8,
      "focus": 12,
      "stamina": 180,
      "intelligence": 12
    },
    "defaultRoom": "medical_clinic"
  },
  {
    "id": "race_91_tepalik_devlari",
    "number": 91,
    "name": "Tepalik Devlari (Hill Giants)",
    "primaryName": "Tepalik Devlari",
    "altName": "Hill Giants",
    "category": "Gigantlar va Koloslar",
    "categoryId": "giants_titans",
    "badge": "Gigantlar & Bilim",
    "icon": "🗿",
    "world": "D&D.",
    "description": "Yebto'ymas ishtaha, ulkan to'qmoqlar bilan shafqatsiz zarba berish.",
    "abilities": "Yebto'ymas ishtaha, ulkan to'qmoqlar bilan shafqatsiz zarba berish.",
    "careers": "Qishloq bosqinchisi, ibtidoiy kuch.",
    "passiveBonus": "Anatomiya va gavda tuzilishida 2x mustahkamlik",
    "baseStats": {
      "speed": 8,
      "focus": 12,
      "stamina": 180,
      "intelligence": 12
    },
    "defaultRoom": "medical_clinic"
  },
  {
    "id": "race_92_sikloplar",
    "number": 92,
    "name": "Sikloplar (Bir ko'zli bahaybatlar)",
    "primaryName": "Sikloplar",
    "altName": "Bir ko'zli bahaybatlar",
    "category": "Gigantlar va Koloslar",
    "categoryId": "giants_titans",
    "badge": "Gigantlar & Bilim",
    "icon": "🗿",
    "world": "Yunon mifologiyasi.",
    "description": "Zevs chaqmoqlarini yasash qudrati, ulkan jismoniy kuch.",
    "abilities": "Zevs chaqmoqlarini yasash qudrati, ulkan jismoniy kuch.",
    "careers": "Vulqon temirchisi, podachi bahaybat.",
    "passiveBonus": "Anatomiya va gavda tuzilishida 2x mustahkamlik",
    "baseStats": {
      "speed": 8,
      "focus": 12,
      "stamina": 180,
      "intelligence": 12
    },
    "defaultRoom": "medical_clinic"
  },
  {
    "id": "race_93_ettinlar",
    "number": 93,
    "name": "Ettinlar (Ikki boshli pahlavonlar)",
    "primaryName": "Ettinlar",
    "altName": "Ikki boshli pahlavonlar",
    "category": "Gigantlar va Koloslar",
    "categoryId": "giants_titans",
    "badge": "Gigantlar & Bilim",
    "icon": "🗿",
    "world": "D&D, Angliya folklori.",
    "description": "Ikki bosh sababli hech qachon to'liq uxlamaslik (biri uxlaganda ikkinchisi uyg'oq), pistarmalarni sezish.",
    "abilities": "Ikki bosh sababli hech qachon to'liq uxlamaslik (biri uxlaganda ikkinchisi uyg'oq), pistarmalarni sezish.",
    "careers": "Tungi qorovul, yo'l qaroqchisi.",
    "passiveBonus": "Anatomiya va gavda tuzilishida 2x mustahkamlik",
    "baseStats": {
      "speed": 8,
      "focus": 12,
      "stamina": 180,
      "intelligence": 12
    },
    "defaultRoom": "medical_clinic"
  },
  {
    "id": "race_94_fomorilar",
    "number": 94,
    "name": "Fomorilar (La'natlangan yerosti gigantlari)",
    "primaryName": "Fomorilar",
    "altName": "La'natlangan yerosti gigantlari",
    "category": "Gigantlar va Koloslar",
    "categoryId": "giants_titans",
    "badge": "Gigantlar & Bilim",
    "icon": "🗿",
    "world": "Keltlar mifologiyasi, D&D.",
    "description": "Yomon ko'z (Evil Eye) orqali boshqalarning tanasini deformatsiya qilish va og'riq berish.",
    "abilities": "Yomon ko'z (Evil Eye) orqali boshqalarning tanasini deformatsiya qilish va og'riq berish.",
    "careers": "Yerosti zolimi, qullar boshqaruvchisi. IX. Qorong'ulik, O'lmaslar va Psionik Mavjudotlar (95-104)",
    "passiveBonus": "Anatomiya va gavda tuzilishida 2x mustahkamlik",
    "baseStats": {
      "speed": 8,
      "focus": 12,
      "stamina": 180,
      "intelligence": 12
    },
    "defaultRoom": "medical_clinic"
  },
  {
    "id": "race_95_vampirlar_va_dampirl",
    "number": 95,
    "name": "Vampirlar va Dampirlar (Vampires & Dhampirs)",
    "primaryName": "Vampirlar va Dampirlar",
    "altName": "Vampires & Dhampirs",
    "category": "Qorong'ulik va Psionik Mavjudotlar",
    "categoryId": "dark_psionic",
    "badge": "Qorong'ulik & Bilim",
    "icon": "🧛",
    "world": "Slavyan folklori, Drakula, D&D.",
    "description": "O'lmaslik, gipnoz, ko'rshapalakka aylanish, qon orqali regeneratsiya, devorlarda yurish.",
    "abilities": "O'lmaslik, gipnoz, ko'rshapalakka aylanish, qon orqali regeneratsiya, devorlarda yurish.",
    "careers": "Zodagon graf, soyalar josusi, qon ritsari.",
    "passiveBonus": "Xotira va mnemotikada +20% xotiralash tezligi",
    "baseStats": {
      "speed": 14,
      "focus": 20,
      "stamina": 90,
      "intelligence": 18
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_96_lichlar",
    "number": 96,
    "name": "Lichlar (Liches)",
    "primaryName": "Lichlar",
    "altName": "Liches",
    "category": "Qorong'ulik va Psionik Mavjudotlar",
    "categoryId": "dark_psionic",
    "badge": "Qorong'ulik & Bilim",
    "icon": "💀",
    "world": "D&D, umumiy qorong'u fentezi.",
    "description": "Ruhini filakteriyaga yashirib mutlaq o'lmas bo'lish, 9-darajali oliy nekromantiya sehrlari.",
    "abilities": "Ruhini filakteriyaga yashirib mutlaq o'lmas bo'lish, 9-darajali oliy nekromantiya sehrlari.",
    "careers": "O'liklar armiyasi hukmdori, qadimiy taqiqlangan bilimlar egasi.",
    "passiveBonus": "Xotira va mnemotikada +20% xotiralash tezligi",
    "baseStats": {
      "speed": 14,
      "focus": 20,
      "stamina": 90,
      "intelligence": 18
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_97_gullar",
    "number": 97,
    "name": "Gullar (Ghouls / Ghouls)",
    "primaryName": "Gullar",
    "altName": "Ghouls / Ghouls",
    "category": "Qorong'ulik va Psionik Mavjudotlar",
    "categoryId": "dark_psionic",
    "badge": "Qorong'ulik & Bilim",
    "icon": "🔮",
    "world": "Arab mifologiyasi, Lovecraft, D&D.",
    "description": "Tirnoqlari bilan tirik odamni falaj qilib qo'yish, o'lik go'shti bilan oziqlanish.",
    "abilities": "Tirnoqlari bilan tirik odamni falaj qilib qo'yish, o'lik go'shti bilan oziqlanish.",
    "careers": "Qabr qazuvchi, qorong'u tunnel pistarmachisi.",
    "passiveBonus": "Xotira va mnemotikada +20% xotiralash tezligi",
    "baseStats": {
      "speed": 14,
      "focus": 20,
      "stamina": 90,
      "intelligence": 18
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_98_banshilar",
    "number": 98,
    "name": "Banshilar (Banshees)",
    "primaryName": "Banshilar",
    "altName": "Banshees",
    "category": "Qorong'ulik va Psionik Mavjudotlar",
    "categoryId": "dark_psionic",
    "badge": "Qorong'ulik & Bilim",
    "icon": "🔮",
    "world": "Keltlar mifologiyasi.",
    "description": "O'lim nolasini (Wail) chiqarib eshitgan odamning yuragini to'xtatish, devorlardan o'tish.",
    "abilities": "O'lim nolasini (Wail) chiqarib eshitgan odamning yuragini to'xtatish, devorlardan o'tish.",
    "careers": "Oila o'limidan xabar beruvchi sharpaviy posbon.",
    "passiveBonus": "Xotira va mnemotikada +20% xotiralash tezligi",
    "baseStats": {
      "speed": 14,
      "focus": 20,
      "stamina": 90,
      "intelligence": 18
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_99_revenantlar",
    "number": 99,
    "name": "Revenantlar (Qasoskor tirik murdalar)",
    "primaryName": "Revenantlar",
    "altName": "Qasoskor tirik murdalar",
    "category": "Qorong'ulik va Psionik Mavjudotlar",
    "categoryId": "dark_psionic",
    "badge": "Qorong'ulik & Bilim",
    "icon": "🔮",
    "world": "D&D, o'rta asr afsonalari.",
    "description": "Qotilidan qasos olmaguncha hech qanday qurol bilan o'lmaslik, qotilining joyini doim his qilish.",
    "abilities": "Qotilidan qasos olmaguncha hech qanday qurol bilan o'lmaslik, qotilining joyini doim his qilish.",
    "careers": "Qasoskor jangchi, to'xtamas qasos izquvari.",
    "passiveBonus": "Xotira va mnemotikada +20% xotiralash tezligi",
    "baseStats": {
      "speed": 14,
      "focus": 20,
      "stamina": 90,
      "intelligence": 18
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_100_changelinglar_dopl",
    "number": 100,
    "name": "Changelinglar / Doplgerlar (Shakl o'zgartiruvchilar)",
    "primaryName": "Changelinglar / Doplgerlar",
    "altName": "Shakl o'zgartiruvchilar",
    "category": "Qorong'ulik va Psionik Mavjudotlar",
    "categoryId": "dark_psionic",
    "badge": "Qorong'ulik & Bilim",
    "icon": "🔮",
    "world": "Eberron (D&D), Yevropa folklori.",
    "description": "Bir soniyada istalgan ko'rgan odamining qiyofasi, bo'yi va ovoziga to'liq o'tish.",
    "abilities": "Bir soniyada istalgan ko'rgan odamining qiyofasi, bo'yi va ovoziga to'liq o'tish.",
    "careers": "Saroy josusi, aktyor, xufyona qotil.",
    "passiveBonus": "Xotira va mnemotikada +20% xotiralash tezligi",
    "baseStats": {
      "speed": 14,
      "focus": 20,
      "stamina": 90,
      "intelligence": 18
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_101_illitidlar_mind_fl",
    "number": 101,
    "name": "Illitidlar / Mind Flayers (Miya o'g'rilari)",
    "primaryName": "Illitidlar / Mind Flayers",
    "altName": "Miya o'g'rilari",
    "category": "Qorong'ulik va Psionik Mavjudotlar",
    "categoryId": "dark_psionic",
    "badge": "Qorong'ulik & Bilim",
    "icon": "🔮",
    "world": "D&D, Lovecraft kosmik dahshati.",
    "description": "Psionik ong zarbasi (Mind Blast), miyani paypaslagichlar bilan so'rib olish, telepatik qullik.",
    "abilities": "Psionik ong zarbasi (Mind Blast), miyani paypaslagichlar bilan so'rib olish, telepatik qullik.",
    "careers": "Psionik imperator, aqliy tadqiqotchi, jamoaviy aql ustuni.",
    "passiveBonus": "Xotira va mnemotikada +20% xotiralash tezligi",
    "baseStats": {
      "speed": 14,
      "focus": 20,
      "stamina": 90,
      "intelligence": 18
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_102_abolethlar",
    "number": 102,
    "name": "Abolethlar (Qadimgi aql xo'jayinlari)",
    "primaryName": "Abolethlar",
    "altName": "Qadimgi aql xo'jayinlari",
    "category": "Qorong'ulik va Psionik Mavjudotlar",
    "categoryId": "dark_psionic",
    "badge": "Qorong'ulik & Bilim",
    "icon": "🔮",
    "world": "D&D.",
    "description": "O'tmishdagi barcha ota-bobolari xotirasiga ega bo'lish, suv orqali qullarga aylanuvchi shilliq purkash.",
    "abilities": "O'tmishdagi barcha ota-bobolari xotirasiga ega bo'lish, suv orqali qullarga aylanuvchi shilliq purkash.",
    "careers": "Tarixdan oldingi xudo, aqliy manipulyator.",
    "passiveBonus": "Xotira va mnemotikada +20% xotiralash tezligi",
    "baseStats": {
      "speed": 14,
      "focus": 20,
      "stamina": 90,
      "intelligence": 18
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_103_beholdirlar",
    "number": 103,
    "name": "Beholdirlar (Ko'z egalari / Ko'z sharlari)",
    "primaryName": "Beholdirlar",
    "altName": "Ko'z egalari / Ko'z sharlari",
    "category": "Qorong'ulik va Psionik Mavjudotlar",
    "categoryId": "dark_psionic",
    "badge": "Qorong'ulik & Bilim",
    "icon": "🔮",
    "world": "D&D.",
    "description": "Markaziy ko'zi barcha sehrni bekor qiladi (Antimagic Cone), 10 ta ko'z shoxchasidan o'lim, falaj, toshga aylantirish nurlari taraladi.",
    "abilities": "Markaziy ko'zi barcha sehrni bekor qiladi (Antimagic Cone), 10 ta ko'z shoxchasidan o'lim, falaj, toshga aylantirish nurlari taraladi.",
    "careers": "Yerosti zolimi, jinoyat sindikati rahbari.",
    "passiveBonus": "Xotira va mnemotikada +20% xotiralash tezligi",
    "baseStats": {
      "speed": 14,
      "focus": 20,
      "stamina": 90,
      "intelligence": 18
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_104_kalashtar",
    "number": 104,
    "name": "Kalashtar (Ruhiy bog'liqlik xalqi)",
    "primaryName": "Kalashtar",
    "altName": "Ruhiy bog'liqlik xalqi",
    "category": "Qorong'ulik va Psionik Mavjudotlar",
    "categoryId": "dark_psionic",
    "badge": "Qorong'ulik & Bilim",
    "icon": "🔮",
    "world": "Eberron (D&D).",
    "description": "Tushlar olami (Dal Quor) bilan bog'langan, ruhiy hujumlarga immunitet, tug'ma telepatiya.",
    "abilities": "Tushlar olami (Dal Quor) bilan bog'langan, ruhiy hujumlarga immunitet, tug'ma telepatiya.",
    "careers": "Psionik jangchi, aqliy tabib, rohib. X. Kiber, Mexanik va Ilmiy-Fantastik Irqlar (105-110)",
    "passiveBonus": "Xotira va mnemotikada +20% xotiralash tezligi",
    "baseStats": {
      "speed": 14,
      "focus": 20,
      "stamina": 90,
      "intelligence": 18
    },
    "defaultRoom": "bio_lab"
  },
  {
    "id": "race_105_warforged",
    "number": 105,
    "name": "Warforged (Tirik mexanik jangchilar)",
    "primaryName": "Warforged",
    "altName": "Tirik mexanik jangchilar",
    "category": "Kiber va Ilmiy-Fantastik Irqlar",
    "categoryId": "cyber_scifi",
    "badge": "Kiber & Bilim",
    "icon": "🤖",
    "world": "Eberron (D&D).",
    "description": "Po'lat va yog'ochdan yasalgan tirik tanaga ega, ovqat yemaydi, nafas olmaydi, uxlamaydi (harakatsiz turadi).",
    "abilities": "Po'lat va yog'ochdan yasalgan tirik tanaga ega, ovqat yemaydi, nafas olmaydi, uxlamaydi (harakatsiz turadi).",
    "careers": "Qo'riqchi ritsar, qamal pahlavoni, sobitqadam askar.",
    "passiveBonus": "Biotexnologiya va gen injeneriyasida +20% aniqlik bonusi",
    "baseStats": {
      "speed": 16,
      "focus": 18,
      "stamina": 130,
      "intelligence": 19
    },
    "defaultRoom": "cyber_lab"
  },
  {
    "id": "race_106_modronlar",
    "number": 106,
    "name": "Modronlar (Geometrik tartib mavjudotlari)",
    "primaryName": "Modronlar",
    "altName": "Geometrik tartib mavjudotlari",
    "category": "Kiber va Ilmiy-Fantastik Irqlar",
    "categoryId": "cyber_scifi",
    "badge": "Kiber & Bilim",
    "icon": "🤖",
    "world": "Mechanus tekisligi (D&D).",
    "description": "Absolyut qonun va mantiqqa bo'ysunish, emotsiyalar va aldovlarga berilmaslik, geometrik birikish.",
    "abilities": "Absolyut qonun va mantiqqa bo'ysunish, emotsiyalar va aldovlarga berilmaslik, geometrik birikish.",
    "careers": "Koinot qonunlari nazoratchisi, hisobchi, soat mexanizmlari posboni.",
    "passiveBonus": "Biotexnologiya va gen injeneriyasida +20% aniqlik bonusi",
    "baseStats": {
      "speed": 16,
      "focus": 18,
      "stamina": 130,
      "intelligence": 19
    },
    "defaultRoom": "cyber_lab"
  },
  {
    "id": "race_107_shardmindlar",
    "number": 107,
    "name": "Shardmindlar (Billur kristalli telepatlar)",
    "primaryName": "Shardmindlar",
    "altName": "Billur kristalli telepatlar",
    "category": "Kiber va Ilmiy-Fantastik Irqlar",
    "categoryId": "cyber_scifi",
    "badge": "Kiber & Bilim",
    "icon": "🤖",
    "world": "D&D (4e).",
    "description": "Tirik psionik billur parchalaridan iborat tana, bir lahzaga mayda kristallarga parchalanib teleportatsiya qilish.",
    "abilities": "Tirik psionik billur parchalaridan iborat tana, bir lahzaga mayda kristallarga parchalanib teleportatsiya qilish.",
    "careers": "Psionik qo'riqchi, kristall qurolsozi, astra tadqiqotchisi.",
    "passiveBonus": "Biotexnologiya va gen injeneriyasida +20% aniqlik bonusi",
    "baseStats": {
      "speed": 16,
      "focus": 18,
      "stamina": 130,
      "intelligence": 19
    },
    "defaultRoom": "cyber_lab"
  },
  {
    "id": "race_108_plazmoidlar",
    "number": 108,
    "name": "Plazmoidlar (Amorf suyuq mavjudotlar)",
    "primaryName": "Plazmoidlar",
    "altName": "Amorf suyuq mavjudotlar",
    "category": "Kiber va Ilmiy-Fantastik Irqlar",
    "categoryId": "cyber_scifi",
    "badge": "Kiber & Bilim",
    "icon": "🤖",
    "world": "Spelljammer (D&D).",
    "description": "Suyuq tanasi orqali 23 santimetrlik teshiklardan sizib o'tish, kislota va zahar ta'sir qilmasligi.",
    "abilities": "Suyuq tanasi orqali 23 santimetrlik teshiklardan sizib o'tish, kislota va zahar ta'sir qilmasligi.",
    "careers": "Qulfbuzar, kema mexanigi, kutilmagan bosqinchi.",
    "passiveBonus": "Biotexnologiya va gen injeneriyasida +20% aniqlik bonusi",
    "baseStats": {
      "speed": 16,
      "focus": 18,
      "stamina": 130,
      "intelligence": 19
    },
    "defaultRoom": "cyber_lab"
  },
  {
    "id": "race_109_sintetiklar_androi",
    "number": 109,
    "name": "Sintetiklar / Androidlar (Kiber-ong irqi)",
    "primaryName": "Sintetiklar / Androidlar",
    "altName": "Kiber-ong irqi",
    "category": "Kiber va Ilmiy-Fantastik Irqlar",
    "categoryId": "cyber_scifi",
    "badge": "Kiber & Bilim",
    "icon": "🤖",
    "world": "Sci-Fi (Asimov, Mass Effect, Detroit).",
    "description": "Sekundiga milliardlab hisob-kitoblar qilish, his-tuyg'usiz sovuqqon mantiq, kompyuter tarmoqlariga bevosita ulanish.",
    "abilities": "Sekundiga milliardlab hisob-kitoblar qilish, his-tuyg'usiz sovuqqon mantiq, kompyuter tarmoqlariga bevosita ulanish.",
    "careers": "Yulduzlararo kema uchuvchisi, neyrotarmoq me'mori, kiber-jangchi.",
    "passiveBonus": "Biotexnologiya va gen injeneriyasida +20% aniqlik bonusi",
    "baseStats": {
      "speed": 16,
      "focus": 18,
      "stamina": 130,
      "intelligence": 19
    },
    "defaultRoom": "cyber_lab"
  },
  {
    "id": "race_110_tiranidlar_zerg_us",
    "number": 110,
    "name": "Tiranidlar / Zerg-uslubidagi Bio-irqlar",
    "primaryName": "Tiranidlar / Zerg-uslubidagi Bio-irqlar",
    "altName": "",
    "category": "Kiber va Ilmiy-Fantastik Irqlar",
    "categoryId": "cyber_scifi",
    "badge": "Kiber & Bilim",
    "icon": "🤖",
    "world": "Warhammer 40,000, StarCraft.",
    "description": "O'ta tez biologik mutatsiya, xitinli po'lat sovut, dushman DNKsini yutib kuchayish, to'dali aql (Hive Mind).",
    "abilities": "O'ta tez biologik mutatsiya, xitinli po'lat sovut, dushman DNKsini yutib kuchayish, to'dali aql (Hive Mind).",
    "careers": "Bio-qurol, to'da jangchisi, evolyutsiya tashuvchisi.",
    "passiveBonus": "Biotexnologiya va gen injeneriyasida +20% aniqlik bonusi",
    "baseStats": {
      "speed": 16,
      "focus": 18,
      "stamina": 130,
      "intelligence": 19
    },
    "defaultRoom": "cyber_lab"
  }
];

const MODERN_CAREERS = [
  {
    "id": "robotic_surgeon",
    "title": "Robotik Jarroh & Shifokor",
    "icon": "🩺",
    "category": "Yuqori Texnologik Tibbiyot",
    "room": "medical_clinic",
    "roomTitle": "Robotik Jarrohlik Markazi",
    "equipment": [
      {
        "id": "davinci_xi",
        "name": "da Vinci Xi Robot Tizimi",
        "icon": "🤖",
        "desc": "4 ta harakatlanuvchi robot qo'l va 3D HD kamera"
      },
      {
        "id": "mri_3t",
        "name": "3-Tesla MRT Apparati",
        "icon": "🩻",
        "desc": "Ichki a'zolarni nurlar orqali 3D aniqlash"
      },
      {
        "id": "harmonic_scalpel",
        "name": "Ultratovushli Skalpel (Harmonic)",
        "icon": "🔪",
        "desc": "Nozik va qonsiz to'qimalarni kesish"
      },
      {
        "id": "ecmo_system",
        "name": "ECMO Qon Aylanish Tizimi",
        "icon": "❤️",
        "desc": "Yurak va o'pkani sun'iy ushlab turish"
      }
    ],
    "description": "Mikromillimetr darajasidagi o'ta nozik operatsiyalarni masofaviy konsol orqali bajarish."
  },
  {
    "id": "genetic_engineer",
    "title": "Genetik Muhandis & Biotexnolog",
    "icon": "🧬",
    "category": "Biotexnologiya",
    "room": "bio_lab",
    "roomTitle": "Genetika & DNK Laboratoriyasi",
    "equipment": [
      {
        "id": "crispr_cas9",
        "name": "CRISPR-Cas9 Fermentlari",
        "icon": "✂️",
        "desc": "DNK zanjirini nuqtali tahrirlash"
      },
      {
        "id": "dna_sequencer",
        "name": "Illumina Sekvenatori",
        "icon": "🧬",
        "desc": "To'liq genom kodlarini 1 kunda o'qish"
      },
      {
        "id": "pcr_cycler",
        "name": "RT-PCR Amplifikatori",
        "icon": "🧪",
        "desc": "Virus va genlarni ko'paytirib tekshirish"
      },
      {
        "id": "cryo_freezer",
        "name": "-80°C Kriogen Muzlatkich",
        "icon": "❄️",
        "desc": "Hujayra va namunalarni saqlash"
      }
    ],
    "description": "Genomni tahrirlash, noyob oqsillar va vaksina-dori vositalarini yaratish."
  },
  {
    "id": "ai_engineer",
    "title": "Sun'iy Intellekt & Dasturchi",
    "icon": "💻",
    "category": "Axborot Texnologiyalari",
    "room": "cyber_lab",
    "roomTitle": "Kiber & AI Texnoparki",
    "equipment": [
      {
        "id": "gpu_cluster",
        "name": "NVIDIA H100 Klasteri",
        "icon": "⚡",
        "desc": "Trillion parametrli modellarni o'qitish"
      },
      {
        "id": "workstation_128",
        "name": "128GB Ko'p Yadroli Stansiya",
        "icon": "🖥️",
        "desc": "Og'ir hisob-kitoblar va simulyatsiya"
      },
      {
        "id": "multi_screen",
        "name": "Uch tomonlama 4K Monitor",
        "icon": "📺",
        "desc": "Katta hajmdagi ma'lumotlar tahlili"
      },
      {
        "id": "neural_ide",
        "name": "AI IDE & Tizim Muhiti",
        "icon": "⌨️",
        "desc": "Avtomatlashgan neyro-dasturlash"
      }
    ],
    "description": "Global intellektual modellar, neyrotarmoqlar va aqlli tizimlarni yaratish."
  },
  {
    "id": "cyber_security",
    "title": "Kiberxavfsizlik Mutaxassisi (Ethical Hacker)",
    "icon": "🛡️",
    "category": "Kiber Xavfsizlik",
    "room": "cyber_lab",
    "roomTitle": "Kiberxavfsizlik Markazi",
    "equipment": [
      {
        "id": "flipper_zero",
        "name": "Flipper Zero Analizatori",
        "icon": "🐬",
        "desc": "Radio, RFID va NFC chastotalarini tekshirish"
      },
      {
        "id": "wireshark_sniffer",
        "name": "Wireshark Tarmoq Snifferi",
        "icon": "🦈",
        "desc": "Tarmoq paketlarini filtrlab tekshirish"
      },
      {
        "id": "yubikey_hardware",
        "name": "YubiKey Apparatli Kalit",
        "icon": "🔑",
        "desc": "Buzib bo'lmas ikki bosqichli autentifikatsiya"
      },
      {
        "id": "kali_workstation",
        "name": "Kali Linux Konsoli",
        "icon": "💻",
        "desc": "Pen-test va zaifliklarni bartaraf etish"
      }
    ],
    "description": "Kiberhujumlarni qaytarish, tizim zaifliklarini test qilish va axborotni himoyalash."
  },
  {
    "id": "aerospace_engineer",
    "title": "Aviakosmik & Astrobiolog",
    "icon": "🚀",
    "category": "Koinot & Aviatsiya",
    "room": "aerospace_hangar",
    "roomTitle": "Aviakosmik Angar & Observatoriya",
    "equipment": [
      {
        "id": "metal_3d_printer",
        "name": "Sanoat 3D Metall Printeri",
        "icon": "🖨️",
        "desc": "Titan va Inconel detallarini chiqarish"
      },
      {
        "id": "wind_tunnel",
        "name": "Aerodinamik Sinov Quvuri",
        "icon": "🌪️",
        "desc": "Raketa korpusini shamol ostida sinash"
      },
      {
        "id": "space_telescope",
        "name": "Koinot Teleskopi",
        "icon": "🔭",
        "desc": "Sayyoralardagi biologik belgilarni kuzatish"
      },
      {
        "id": "telemetry_system",
        "name": "Orbital Telemetriya",
        "icon": "📡",
        "desc": "Koinot stansiyalari bilan jonli aloqa"
      }
    ],
    "description": "Raketalar, orbital sun'iy yo'ldoshlar va fazoviy biologik tadqiqotlar."
  },
  {
    "id": "smart_agronomist",
    "title": "Smart-Agronom & Agro-Dron Uchuvchisi",
    "icon": "🌾",
    "category": "Aqlli Agrobiologiya",
    "room": "smart_farm",
    "roomTitle": "Aqlli Agrobiologik Issiqxona",
    "equipment": [
      {
        "id": "dji_agras",
        "name": "DJI Agras Purkagich Droni",
        "icon": "🛸",
        "desc": "Ekinlarni aniq va tejamkor sug'orish"
      },
      {
        "id": "ndvi_camera",
        "name": "Multispektral NDVI Kamera",
        "icon": "📷",
        "desc": "O'simliklarning xlorofill ko'rsatkichini o'lchash"
      },
      {
        "id": "smart_hydroponics",
        "name": "Avtomatlashgan Gidroponika",
        "icon": "🌱",
        "desc": "Tuproqsiz suvda ozuqa yetkazib berish"
      },
      {
        "id": "soil_sensors",
        "name": "NPK Tuproq Sensorlari",
        "icon": "🧪",
        "desc": "Mineral moddalar va namlikni o'lchash"
      }
    ],
    "description": "Hosildorlikni masofadan boshqarish, resurslarni tejash va aqlli ekinzorlar."
  },
  {
    "id": "neuroscientist",
    "title": "Neyromuhandis & Radiolog",
    "icon": "🧠",
    "category": "Neyrofan",
    "room": "neuro_lab",
    "roomTitle": "Neyro-interfeys Laboratoriyasi",
    "equipment": [
      {
        "id": "bci_headset",
        "name": "BCI Neyro-interfeys Garniturasi",
        "icon": "🎧",
        "desc": "Miyadagi elektr signallarini o'qish"
      },
      {
        "id": "eeg_sensors",
        "name": "EEG Yuqori Aniq Elektrodlar",
        "icon": "⚡",
        "desc": "Neyronlar faolligini millisekundda kuzatish"
      },
      {
        "id": "dicom_ai",
        "name": "DICOM AI Tahlil Monitori",
        "icon": "🖥️",
        "desc": "Miya o'smalari va asab xaritasini ko'rish"
      },
      {
        "id": "neural_stimulator",
        "name": "Neyrostimulyator",
        "icon": "🔮",
        "desc": "Xotira va kognitiv signallarni tiklash"
      }
    ],
    "description": "Inson miyasi, nerv tolalari va neyro-interfeyslarni chuqur o'rganish."
  },
  {
    "id": "green_ecologist",
    "title": "Yashil Energetika & Ekolog",
    "icon": "🌱",
    "category": "Ekologiya",
    "room": "botanical_garden",
    "roomTitle": "Biosfera & Tabiiy Issiqxona",
    "equipment": [
      {
        "id": "flir_drone",
        "name": "FLIR Termovizorli Dron",
        "icon": "🛸",
        "desc": "Quyosh panellaridagi nosozliklarni aniqlash"
      },
      {
        "id": "gc_ms_spec",
        "name": "Gaz Xromatograf (GC-MS)",
        "icon": "🔬",
        "desc": "Havodagi eng mayda zaharli moddalarni aniqlash"
      },
      {
        "id": "pyranometer",
        "name": "Piranometr Radiatsiya O'lchagich",
        "icon": "☀️",
        "desc": "Quyosh quvvati oqimini o'lchash"
      },
      {
        "id": "water_tester",
        "name": "Suvning Og'ir Metallar Testeri",
        "icon": "💧",
        "desc": "Tabiiy buloqlarni ekologik tekshirish"
      }
    ],
    "description": "Sayyoramiz tabiatini asrash, toza havo va qayta tiklanuvchi energiya nazorati."
  },
  {
    "id": "rescue_hero",
    "title": "Favqulodda Qutqaruvchi (FVV & EMT)",
    "icon": "🚒",
    "category": "Qutqaruv & Favqulodda Tibbiyot",
    "room": "medical_clinic",
    "roomTitle": "Favqulodda Qutqaruv Maskani",
    "equipment": [
      {
        "id": "hydraulic_cutter",
        "name": "50t Gidravlik Keskich",
        "icon": "🛠️",
        "desc": "Har qanday metall to'siqlarni kesib o'tish"
      },
      {
        "id": "seismic_mic",
        "name": "Seysmik Akustik Qidiruv",
        "icon": "🎙️",
        "desc": "Vayronalar ostidagi yurak urishini eshitish"
      },
      {
        "id": "thermal_search",
        "name": "Termovizorli Qidiruv Droni",
        "icon": "🛸",
        "desc": "Zulmat va tutunda insonlarni topish"
      },
      {
        "id": "scba_oxygen",
        "name": "SCBA Kislorod Apparati",
        "icon": "🤿",
        "desc": "Zaharli gazli hududlarda xavfsiz nafas olish"
      }
    ],
    "description": "Favqulodda vaziyatlarda hayotni saqlab qolish va shoshilinch tez yordam ko'rsatish."
  }
];

module.exports = {
  RACE_CATEGORIES,
  HERO_RACES,
  MODERN_CAREERS,
};
