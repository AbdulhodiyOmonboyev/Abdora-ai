const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { chatWithAI, generateFallbackChatReply } = require('../services/ai/chatAI.service');
const { generateQuiz } = require('../services/ai/lessonAI.service');
const { synthesizeSpeech, MIME_TYPE: TTS_MIME_TYPE } = require('../services/ai/geminiTts.service');
const { synthesizeWithClonedVoice } = require('../services/ai/voiceClone.service');
const { generateExplainerScript } = require('../services/ai/explainerVideoAI.service');
const { generateImage } = require('../services/ai/geminiImage.service');
const { trackAIUsage } = require('../utils/aiUsageTracker');

// Access check for lessons and lesson AI media
const assertLessonAccess = async (lesson, user) => {
  if (!lesson || !user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'manager' || user.role === 'reception') {
    return !user.centerId || !lesson.centerId || user.centerId === lesson.centerId;
  }
  if (user.role === 'teacher') {
    return lesson.teacherId === user.userId || !user.centerId || !lesson.centerId || user.centerId === lesson.centerId;
  }
  const student = await prisma.user.findUnique({ where: { id: user.userId }, select: { groupId: true, centerId: true } });
  if (!student) return false;
  if (lesson.groupId && student.groupId && lesson.groupId === student.groupId) return true;
  if (!user.centerId || !lesson.centerId || student.centerId === lesson.centerId || user.centerId === lesson.centerId) return true;
  return true;
};

const generateSlideSvg = (title = 'Slayd', slideIndex = 0) => {
  const safeTitle = (title || `Slayd ${slideIndex + 1}`).replace(/[<>&"']/g, '');
  const colors = [
    ['#4f46e5', '#7c3aed'],
    ['#0ea5e9', '#2563eb'],
    ['#10b981', '#059669'],
    ['#f59e0b', '#d97706'],
    ['#ec4899', '#be185d'],
  ];
  const [c1, c2] = colors[slideIndex % colors.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
  </defs>
  <rect width="800" height="450" rx="16" fill="url(#grad)" />
  <circle cx="400" cy="180" r="60" fill="white" fill-opacity="0.15" />
  <polygon points="385,155 425,180 385,205" fill="white" />
  <text x="400" y="290" text-anchor="middle" font-family="system-ui, sans-serif" font-size="28" font-weight="bold" fill="white">${safeTitle}</text>
  <text x="400" y="330" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="rgba(255,255,255,0.8)">Abdora AI Ta'lim Slaydi</text>
</svg>`;
};

const generateExplanationSvg = (title = 'Dars tushuntirishi', explanation = '') => {
  const safeTitle = (title || 'Dars tushuntirishi').replace(/[<>&"']/g, '').slice(0, 60);
  const rawText = (explanation || '').replace(/[<>&"']/g, ' ').replace(/\s+/g, ' ').trim();
  const p1 = (rawText.slice(0, 110) || 'Mavzuning asosiy g‘oyasi va mazmuni').trim();
  const p2 = (rawText.slice(110, 220) || 'Amaliy ko‘nikmalar va muhim formulalar').trim();
  const p3 = (rawText.slice(220, 330) || 'Xulosalar va eslab qolish qoidalari').trim();

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>
    <linearGradient id="cardGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.1" />
    </linearGradient>
    <linearGradient id="cardGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.1" />
    </linearGradient>
    <linearGradient id="cardGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#ec4899" stop-opacity="0.1" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="30" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="1200" height="675" fill="url(#bgGrad)" />
  <circle cx="200" cy="150" r="160" fill="#6366f1" fill-opacity="0.15" filter="url(#glow)" />
  <circle cx="1000" cy="500" r="180" fill="#06b6d4" fill-opacity="0.12" filter="url(#glow)" />

  <rect x="70" y="55" width="230" height="36" rx="18" fill="#1e293b" stroke="#38bdf8" stroke-width="1.2" />
  <text x="185" y="78" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" fill="#38bdf8">🍌 BANANA AI • ILUSTRATSIYA</text>

  <text x="70" y="140" font-family="system-ui, sans-serif" font-size="34" font-weight="800" fill="#ffffff">${safeTitle}</text>
  <text x="70" y="175" font-family="system-ui, sans-serif" font-size="16" fill="#94a3b8">Abdora AI tomonidan generatsiya qilingan ko‘rgazmali dars xaritasi</text>

  <rect x="70" y="220" width="330" height="380" rx="20" fill="url(#cardGrad1)" stroke="#6366f1" stroke-width="1.5" />
  <circle cx="120" cy="270" r="22" fill="#4f46e5" fill-opacity="0.4" />
  <text x="120" y="276" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="#a5b4fc">01</text>
  <text x="160" y="276" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="#ffffff">Asosiy Mazmun</text>
  <text x="100" y="340" font-family="system-ui, sans-serif" font-size="15" fill="#cbd5e1">
    <tspan x="100" dy="0">${p1.slice(0, 36)}</tspan>
    <tspan x="100" dy="26">${p1.slice(36, 72)}</tspan>
    <tspan x="100" dy="26">${p1.slice(72, 108)}</tspan>
  </text>

  <rect x="435" y="220" width="330" height="380" rx="20" fill="url(#cardGrad2)" stroke="#10b981" stroke-width="1.5" />
  <circle cx="485" cy="270" r="22" fill="#10b981" fill-opacity="0.4" />
  <text x="485" y="276" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="#6ee7b7">02</text>
  <text x="525" y="276" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="#ffffff">Mantiqiy Bog‘lanish</text>
  <text x="465" y="340" font-family="system-ui, sans-serif" font-size="15" fill="#cbd5e1">
    <tspan x="465" dy="0">${p2.slice(0, 36)}</tspan>
    <tspan x="465" dy="26">${p2.slice(36, 72)}</tspan>
    <tspan x="465" dy="26">${p2.slice(72, 108)}</tspan>
  </text>

  <rect x="800" y="220" width="330" height="380" rx="20" fill="url(#cardGrad3)" stroke="#f59e0b" stroke-width="1.5" />
  <circle cx="850" cy="270" r="22" fill="#f59e0b" fill-opacity="0.4" />
  <text x="850" y="276" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="#fde68a">03</text>
  <text x="890" y="276" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="#ffffff">Xulosa &amp; Formula</text>
  <text x="830" y="340" font-family="system-ui, sans-serif" font-size="15" fill="#cbd5e1">
    <tspan x="830" dy="0">${p3.slice(0, 36)}</tspan>
    <tspan x="830" dy="26">${p3.slice(36, 72)}</tspan>
    <tspan x="830" dy="26">${p3.slice(72, 108)}</tspan>
  </text>
</svg>`;
};

const generateMindmapSvg = (title = 'Aql xaritasi', mindMapData = null) => {
  const safeTitle = (title || 'Aql xaritasi').replace(/[<>&"']/g, '').slice(0, 50);
  const rawNodes = Array.isArray(mindMapData?.nodes) ? mindMapData.nodes : [];
  const nodeLabels = rawNodes
    .map(n => (n.label || '').replace(/[<>&"']/g, '').trim())
    .filter(Boolean)
    .slice(0, 6);

  const fallbackLabels = [
    'Asosiy tushunchalar',
    'Tarkibiy qismlar',
    'Qonuniyatlar',
    'Amaliy misollar',
    'Keng tarqalgan xatolar',
    'Sinov savollari'
  ];

  const labels = nodeLabels.length >= 3 ? nodeLabels : fallbackLabels;
  const cx = 600, cy = 360;
  const positions = [
    { x: 250, y: 220, color: '#38bdf8' },
    { x: 950, y: 220, color: '#a855f7' },
    { x: 190, y: 390, color: '#34d399' },
    { x: 1010, y: 390, color: '#f43f5e' },
    { x: 320, y: 540, color: '#fbbf24' },
    { x: 880, y: 540, color: '#6366f1' },
  ];

  const branchElements = positions.slice(0, labels.length).map((pos, idx) => {
    const lbl = labels[idx].slice(0, 24);
    return `
    <path d="M ${cx} ${cy} Q ${(cx + pos.x) / 2} ${(cy + pos.y) / 2 - 30} ${pos.x} ${pos.y}" fill="none" stroke="${pos.color}" stroke-width="2.5" stroke-dasharray="6,4" stroke-opacity="0.8" />
    <g transform="translate(${pos.x - 110}, ${pos.y - 30})">
      <rect width="220" height="60" rx="14" fill="#1e293b" stroke="${pos.color}" stroke-width="2" />
      <circle cx="28" cy="30" r="14" fill="${pos.color}" fill-opacity="0.2" />
      <text x="28" y="35" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="${pos.color}">${idx + 1}</text>
      <text x="52" y="35" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#ffffff">${lbl}</text>
    </g>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <radialGradient id="mmBg" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="60%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </radialGradient>
    <filter id="centerGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="24" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="1200" height="675" fill="url(#mmBg)" />

  <rect x="50" y="35" width="230" height="34" rx="17" fill="#0f172a" stroke="#a855f7" stroke-width="1.2" />
  <text x="165" y="57" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" fill="#c084fc">🍌 BANANA AI • AQL XARITASI</text>
  <text x="50" y="105" font-family="system-ui, sans-serif" font-size="24" font-weight="700" fill="#e2e8f0">${safeTitle}</text>

  ${branchElements}

  <circle cx="${cx}" cy="${cy}" r="110" fill="#6366f1" fill-opacity="0.2" filter="url(#centerGlow)" />
  <circle cx="${cx}" cy="${cy}" r="85" fill="#4338ca" stroke="#818cf8" stroke-width="3" />
  <text x="${cx}" y="${cy - 12}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#a5b4fc">MARKAZIY MAVZU</text>
  <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="800" fill="#ffffff">${safeTitle.slice(0, 20)}</text>
</svg>`;
};

const findAccessibleLesson = (lessonId, user, select) => prisma.lesson.findFirst({
  where: { id: lessonId, ...(user.role !== 'admin' ? { centerId: user.centerId } : {}) },
  select,
});

const streamAudioBuffer = (res, buffer, mimeType) => {
  res.set({
    'Content-Type': mimeType,
    'Content-Length': buffer.length,
    'Cache-Control': 'private, max-age=86400',
  });
  res.send(buffer);
};

const generateMinimalWav = () => {
  const sampleRate = 24000;
  const numSamples = Math.floor(sampleRate * 0.2);
  const pcmBuffer = Buffer.alloc(numSamples * 2);
  const byteRate = sampleRate * 2;
  const blockAlign = 2;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmBuffer.length, 40);
  return Buffer.concat([header, pcmBuffer]);
};

// Prefer the lesson's teacher's cloned voice (uploaded via /api/voice/clone)
// when one exists, otherwise fall back to the default Gemini voice or minimal fallback.
const synthesizeForLesson = async (teacherId, text, centerId = null) => {
  if (teacherId) {
    try {
      const teacher = await prisma.user.findUnique({
        where: { id: teacherId },
        select: { id: true, name: true, clonedVoiceId: true, centerId: true },
      });
      if (teacher?.clonedVoiceId) {
        try {
          const buffer = await synthesizeWithClonedVoice(text, teacher.clonedVoiceId, centerId || teacher.centerId);
          console.log(`[Voice] Successfully synthesized speech with cloned voice for teacher: ${teacher.name} (${teacher.id})`);
          return { buffer, mimeType: 'audio/mpeg' }; // ElevenLabs returns mp3
        } catch (err) {
          console.error(`[Voice] Cloned-voice synthesis failed for teacher ${teacher.name}:`, err.message, 'Falling back to Gemini TTS');
        }
      }
    } catch (dbErr) {
      console.warn('[Voice] Failed querying teacher cloned voice:', dbErr.message);
    }
  }

  try {
    const buffer = await synthesizeSpeech(text, { centerId });
    return { buffer, mimeType: TTS_MIME_TYPE }; // Gemini returns wav
  } catch (ttsErr) {
    console.warn('[Voice] Gemini synthesizeSpeech failed, using fallback minimal WAV:', ttsErr.message);
    return { buffer: generateMinimalWav(), mimeType: 'audio/wav' };
  }
};

// GET /api/lessons/:id/ai/story-audio - TTS narration of the AI-generated
// "storyMode" text, generated once and cached in LessonMedia after that.
const getStoryAudio = async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findFirst({
      where: { id: req.params.id, ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}) },
      include: { group: { select: { teacherId: true } } },
    });
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (!(await assertLessonAccess(lesson, req.user))) return error(res, 'Forbidden', 403);

    const storyText = lesson.aiContent?.storyMode;
    if (!storyText) return error(res, 'Story not generated yet for this lesson', 404);

    const forceRegenerate = req.query.regenerate === 'true';

    if (!forceRegenerate) {
      const cached = await prisma.lessonMedia.findUnique({
        where: { lessonId_kind_slideIndex: { lessonId: lesson.id, kind: 'story', slideIndex: -1 } },
      });
      if (cached) return streamAudioBuffer(res, cached.data, cached.mimeType);
    }

    const effectiveTeacherId = lesson.teacherId || lesson.group?.teacherId || null;
    const { buffer: audio, mimeType } = await synthesizeForLesson(effectiveTeacherId, storyText, lesson.centerId);

    const saved = await prisma.lessonMedia.upsert({
      where: { lessonId_kind_slideIndex: { lessonId: lesson.id, kind: 'story', slideIndex: -1 } },
      update: { data: audio, mimeType },
      create: { lessonId: lesson.id, kind: 'story', slideIndex: -1, data: audio, mimeType },
    });
    return streamAudioBuffer(res, saved.data, saved.mimeType);
  } catch (err) { next(err); }
};

// GET /api/lessons/:id/ai/voice-audio - TTS narration of the AI-generated
// "simpleExplanation" text, used by the "AI Voice Teacher" tab.
const getVoiceAudio = async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findFirst({
      where: { id: req.params.id, ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}) },
      include: { group: { select: { teacherId: true } } },
    });
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (!(await assertLessonAccess(lesson, req.user))) return error(res, 'Forbidden', 403);

    const explanationText = lesson.aiContent?.simpleExplanation || lesson.title;
    if (!explanationText) return error(res, 'No explanation available for this lesson', 404);

    const forceRegenerate = req.query.regenerate === 'true';

    if (!forceRegenerate) {
      const cached = await prisma.lessonMedia.findUnique({
        where: { lessonId_kind_slideIndex: { lessonId: lesson.id, kind: 'voice', slideIndex: -1 } },
      });
      if (cached) return streamAudioBuffer(res, cached.data, cached.mimeType);
    }

    const effectiveTeacherId = lesson.teacherId || lesson.group?.teacherId || null;
    const { buffer: audio, mimeType } = await synthesizeForLesson(effectiveTeacherId, explanationText, lesson.centerId);

    const saved = await prisma.lessonMedia.upsert({
      where: { lessonId_kind_slideIndex: { lessonId: lesson.id, kind: 'voice', slideIndex: -1 } },
      update: { data: audio, mimeType },
      create: { lessonId: lesson.id, kind: 'voice', slideIndex: -1, data: audio, mimeType },
    });
    return streamAudioBuffer(res, saved.data, saved.mimeType);
  } catch (err) { next(err); }
};

// POST /api/lessons/:id/ai/explainer-video - generate (or regenerate) the
// slide script for the concept/grammar explainer. Slide audio is generated
// lazily per-slide the first time it's played (see getExplainerSlideAudio).
const generateExplainerVideo = async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findFirst({ where: { id: req.params.id, ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}) } });
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (!(await assertLessonAccess(lesson, req.user))) return error(res, 'Forbidden', 403);

    const { language } = req.body || {};
    const script = await generateExplainerScript(lesson.title, lesson.content || '', language || 'uz');

    const aiContent = { ...(lesson.aiContent || {}), explainerVideo: script };
    await prisma.lesson.update({ where: { id: lesson.id }, data: { aiContent } });
    // Clear any stale cached slide audio from a previous script version
    await prisma.lessonMedia.deleteMany({ where: { lessonId: lesson.id, kind: 'explainer_slide' } });

    return success(res, script, 'Explainer video generated', 201);
  } catch (err) {
    console.error('generateExplainerVideo error:', err.message);
    return error(res, 'Video dars yaratishda xatolik: ' + err.message, 500);
  }
};

// GET /api/lessons/:id/ai/explainer-video - returns the cached slide script
const getExplainerVideo = async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findFirst({ where: { id: req.params.id, ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}) }, select: { groupId: true, aiContent: true } });
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (!(await assertLessonAccess(lesson, req.user))) return error(res, 'Forbidden', 403);

    const script = lesson.aiContent?.explainerVideo || null;
    return success(res, script);
  } catch (err) { next(err); }
};

// GET /api/lessons/:id/ai/explainer-video/audio/:slideIndex - lazy per-slide TTS
const getExplainerSlideAudio = async (req, res, next) => {
  try {
    const slideIndex = parseInt(req.params.slideIndex, 10);
    if (Number.isNaN(slideIndex)) return error(res, 'Invalid slide index', 400);

    const lesson = await prisma.lesson.findFirst({
      where: { id: req.params.id, ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}) },
      include: { group: { select: { teacherId: true } } },
    });
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (!(await assertLessonAccess(lesson, req.user))) return error(res, 'Forbidden', 403);

    const script = lesson.aiContent?.explainerVideo;
    const slide = script?.slides?.[slideIndex];
    if (!slide) return error(res, 'Slide not found', 404);

    const forceRegenerate = req.query.regenerate === 'true';

    if (!forceRegenerate) {
      const cached = await prisma.lessonMedia.findUnique({
        where: { lessonId_kind_slideIndex: { lessonId: lesson.id, kind: 'explainer_slide', slideIndex } },
      });
      if (cached) return streamAudioBuffer(res, cached.data, cached.mimeType);
    }

    const effectiveTeacherId = lesson.teacherId || lesson.group?.teacherId || null;
    const { buffer: audio, mimeType } = await synthesizeForLesson(effectiveTeacherId, slide.narration, lesson.centerId);

    const saved = await prisma.lessonMedia.upsert({
      where: { lessonId_kind_slideIndex: { lessonId: lesson.id, kind: 'explainer_slide', slideIndex } },
      update: { data: audio, mimeType },
      create: { lessonId: lesson.id, kind: 'explainer_slide', slideIndex, data: audio, mimeType },
    });
    return streamAudioBuffer(res, saved.data, saved.mimeType);
  } catch (err) { next(err); }
};
  } catch (err) { next(err); }
};

// GET /api/lessons/:id/ai/explainer-video/image/:slideIndex - lazy per-slide
// illustration, generated once and cached in LessonMedia after that.
const getExplainerSlideImage = async (req, res, next) => {
  try {
    const slideIndex = parseInt(req.params.slideIndex, 10);
    if (Number.isNaN(slideIndex)) return error(res, 'Invalid slide index', 400);

    const lesson = await prisma.lesson.findFirst({ where: { id: req.params.id, ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}) } });
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (!(await assertLessonAccess(lesson, req.user))) return error(res, 'Forbidden', 403);

    const script = lesson.aiContent?.explainerVideo;
    const slide = script?.slides?.[slideIndex];
    if (!slide) return error(res, 'Slide not found', 404);

    const cached = await prisma.lessonMedia.findUnique({
      where: { lessonId_kind_slideIndex: { lessonId: lesson.id, kind: 'explainer_slide_image', slideIndex } },
    });
    if (cached) return streamAudioBuffer(res, cached.data, cached.mimeType);

    try {
      const { buffer: image, mimeType } = await generateImage(slide.imagePrompt, lesson.centerId);
      const saved = await prisma.lessonMedia.create({
        data: { lessonId: lesson.id, kind: 'explainer_slide_image', slideIndex, data: image, mimeType },
      });
      return streamAudioBuffer(res, saved.data, saved.mimeType);
    } catch (imgErr) {
      console.warn('Explainer slide image generation failed, returning SVG fallback:', imgErr.message);
      const svg = generateSlideSvg(slide.title, slideIndex);
      return streamAudioBuffer(res, Buffer.from(svg, 'utf-8'), 'image/svg+xml');
    }
  } catch (err) { next(err); }
};

// GET /api/lessons/:id/ai/explanation-image - Banana AI illustration for the lesson explanation
const getExplanationImage = async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findFirst({
      where: { id: req.params.id, ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}) },
      select: { id: true, title: true, content: true, centerId: true, teacherId: true, groupId: true, aiContent: true },
    });
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (!(await assertLessonAccess(lesson, req.user))) return error(res, 'Forbidden', 403);

    const forceRegenerate = req.query.regenerate === 'true';

    if (!forceRegenerate) {
      const cached = await prisma.lessonMedia.findUnique({
        where: { lessonId_kind_slideIndex: { lessonId: lesson.id, kind: 'explanation_image', slideIndex: -1 } },
      });
      if (cached) return streamAudioBuffer(res, cached.data, cached.mimeType);
    }

    const explanationText = lesson.aiContent?.simpleExplanation || lesson.title;
    const prompt = `Educational visual diagram and conceptual poster for the topic "${lesson.title}". Concept summary: ${explanationText.slice(0, 350)}. Modern flat vector and 3D educational art style, clean infographics, vivid colors, crisp educational diagram, 16:9 aspect ratio.`;

    try {
      const { buffer: image, mimeType } = await generateImage(prompt, lesson.centerId);
      const saved = await prisma.lessonMedia.upsert({
        where: { lessonId_kind_slideIndex: { lessonId: lesson.id, kind: 'explanation_image', slideIndex: -1 } },
        update: { data: image, mimeType },
        create: { lessonId: lesson.id, kind: 'explanation_image', slideIndex: -1, data: image, mimeType },
      });
      return streamAudioBuffer(res, saved.data, saved.mimeType);
    } catch (imgErr) {
      console.warn('Banana AI explanation image generation failed, returning SVG fallback:', imgErr.message);
      const svg = generateExplanationSvg(lesson.title, explanationText);
      return streamAudioBuffer(res, Buffer.from(svg, 'utf-8'), 'image/svg+xml');
    }
  } catch (err) { next(err); }
};

// GET /api/lessons/:id/ai/mindmap-image - Banana AI visual concept map / mind map
const getMindmapImage = async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findFirst({
      where: { id: req.params.id, ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}) },
      select: { id: true, title: true, content: true, centerId: true, teacherId: true, groupId: true, aiContent: true },
    });
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (!(await assertLessonAccess(lesson, req.user))) return error(res, 'Forbidden', 403);

    const forceRegenerate = req.query.regenerate === 'true';

    if (!forceRegenerate) {
      const cached = await prisma.lessonMedia.findUnique({
        where: { lessonId_kind_slideIndex: { lessonId: lesson.id, kind: 'mindmap_image', slideIndex: -1 } },
      });
      if (cached) return streamAudioBuffer(res, cached.data, cached.mimeType);
    }

    const mindMapData = lesson.aiContent?.mindMapData;
    const nodeLabels = Array.isArray(mindMapData?.nodes)
      ? mindMapData.nodes.map(n => n.label).filter(Boolean).slice(0, 8).join(', ')
      : '';
    const prompt = `Educational mind map, knowledge graph, concept tree for "${lesson.title}". ${nodeLabels ? `Key concepts: ${nodeLabels}.` : ''} High-tech clean digital art, connected glowing nodes, visual mind map infographic, 16:9 aspect ratio.`;

    try {
      const { buffer: image, mimeType } = await generateImage(prompt, lesson.centerId);
      const saved = await prisma.lessonMedia.upsert({
        where: { lessonId_kind_slideIndex: { lessonId: lesson.id, kind: 'mindmap_image', slideIndex: -1 } },
        update: { data: image, mimeType },
        create: { lessonId: lesson.id, kind: 'mindmap_image', slideIndex: -1, data: image, mimeType },
      });
      return streamAudioBuffer(res, saved.data, saved.mimeType);
    } catch (imgErr) {
      console.warn('Banana AI mindmap image generation failed, returning SVG fallback:', imgErr.message);
      const svg = generateMindmapSvg(lesson.title, mindMapData);
      return streamAudioBuffer(res, Buffer.from(svg, 'utf-8'), 'image/svg+xml');
    }
  } catch (err) { next(err); }
};

const chatMessage = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { message, style, language, aiPreferences: bodyPreferences } = req.body;
    if (!message) return error(res, 'Message required', 400);

    const lesson = await findAccessibleLesson(lessonId, req.user, { id: true, title: true, content: true, groupId: true, teacherId: true, centerId: true });
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (!(await assertLessonAccess(lesson, req.user))) return error(res, 'Forbidden', 403);

    // Fetch user's aiPreferences from DB if not provided in body
    let aiPreferences = bodyPreferences;
    if (!aiPreferences) {
      const userRecord = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { permissions: true }
      });
      aiPreferences = userRecord?.permissions?.aiPreferences || {};
    }

    const effectiveStyle = style || aiPreferences?.style || 'friendly';
    const effectiveLang  = language || aiPreferences?.language || 'uz';

    let chat = await prisma.aIChat.findUnique({
      where: { lessonId_studentId: { lessonId, studentId: req.user.userId } },
    });

    const messages = chat ? (Array.isArray(chat.messages) ? chat.messages : []) : [];
    messages.push({ role: 'user', content: message, timestamp: new Date() });

    let aiReply;
    try {
      aiReply = await chatWithAI(lesson, messages, message, effectiveStyle, effectiveLang, aiPreferences);
    } catch (chatErr) {
      console.warn('chatWithAI error, using fallback:', chatErr.message);
      aiReply = generateFallbackChatReply(lesson, message, effectiveLang);
    }

    if (!aiReply || typeof aiReply !== 'string' || !aiReply.trim()) {
      aiReply = generateFallbackChatReply(lesson, message, effectiveLang);
    }
    messages.push({ role: 'assistant', content: aiReply, timestamp: new Date() });

    try {
      if (chat) {
        chat = await prisma.aIChat.update({ where: { id: chat.id }, data: { messages, style: effectiveStyle, language: effectiveLang } });
      } else {
        chat = await prisma.aIChat.create({ data: { lessonId, studentId: req.user.userId, centerId: lesson.centerId, messages, style: effectiveStyle, language: effectiveLang } });
      }
    } catch (dbErr) {
      console.warn('Could not persist chat history:', dbErr.message);
    }

    // AI Token sarfini hisoblash va log yozish
    const tokensIn = Math.ceil((message.length + (lesson.content || '').length) / 4);
    const tokensOut = Math.ceil((aiReply || '').length / 4);
    trackAIUsage({
      centerId: lesson.centerId || req.user.centerId,
      userId: req.user.userId,
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      useCase: 'chat',
      tokensIn,
      tokensOut
    }).catch(() => {});

    return success(res, {
      reply: aiReply,
      content: aiReply,
      message: aiReply,
      chatId: chat?.id || 'temp'
    });
  } catch (err) {
    console.error('chatMessage error:', err.message);
    return error(res, 'Xabar yuborishda xatolik yuz berdi: ' + err.message, 500);
  }
};

const clearChatHistory = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    await prisma.aIChat.deleteMany({
      where: { lessonId, studentId: req.user.userId },
    });
    return success(res, null, 'Chat tarixi tozalandi');
  } catch (err) { next(err); }
};

const getChatHistory = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const lesson = await findAccessibleLesson(lessonId, req.user, { groupId: true, teacherId: true, centerId: true });
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (!(await assertLessonAccess(lesson, req.user))) return error(res, 'Forbidden', 403);
    const chat = await prisma.aIChat.findUnique({
      where: { lessonId_studentId: { lessonId, studentId: req.user.userId } },
    });
    return success(res, chat || { messages: [] });
  } catch (err) { next(err); }
};

const generateQuizForLesson = async (req, res, next) => {
  try {
    const lesson = await findAccessibleLesson(req.params.lessonId, req.user, { id: true, title: true, content: true, groupId: true, teacherId: true, centerId: true });
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (!(await assertLessonAccess(lesson, req.user))) return error(res, 'Forbidden', 403);
    const { difficulty } = req.query;
    const quiz = await generateQuiz(lesson.title, lesson.content || '', difficulty || 'medium');
    return success(res, quiz);
  } catch (err) { next(err); }
};

const getNotifications = async (req, res, next) => {
  try {
    const notifs = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return success(res, notifs);
  } catch (err) { next(err); }
};

const markNotifRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user.userId }, data: { isRead: true, readAt: new Date() } });
    return success(res, null, 'Marked as read');
  } catch (err) { next(err); }
};

module.exports = {
  chatMessage, getChatHistory, clearChatHistory, generateQuizForLesson, getNotifications, markNotifRead,
  getStoryAudio, getVoiceAudio, generateExplainerVideo, getExplainerVideo, getExplainerSlideAudio, getExplainerSlideImage,
  getExplanationImage, getMindmapImage,
};
