const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { chatWithAI } = require('../services/ai/chatAI.service');
const { generateQuiz } = require('../services/ai/lessonAI.service');
const { synthesizeSpeech, MIME_TYPE: TTS_MIME_TYPE } = require('../services/ai/geminiTts.service');
const { synthesizeWithClonedVoice } = require('../services/ai/voiceClone.service');
const { generateExplainerScript } = require('../services/ai/explainerVideoAI.service');
const { generateImage } = require('../services/ai/geminiImage.service');

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
const synthesizeForLesson = async (teacherId, text) => {
  const teacher = await prisma.user.findUnique({ where: { id: teacherId }, select: { clonedVoiceId: true } });
  if (teacher?.clonedVoiceId) {
    try {
      const buffer = await synthesizeWithClonedVoice(text, teacher.clonedVoiceId);
      return { buffer, mimeType: 'audio/mpeg' }; // ElevenLabs returns mp3
    } catch (err) {
      console.error('Cloned-voice synthesis failed, falling back to default Gemini voice:', err.message);
    }
  }
  try {
    const buffer = await synthesizeSpeech(text);
    return { buffer, mimeType: TTS_MIME_TYPE }; // Gemini returns wav
  } catch (ttsErr) {
    console.warn('synthesizeSpeech failed, using fallback minimal WAV:', ttsErr.message);
    return { buffer: generateMinimalWav(), mimeType: 'audio/wav' };
  }
};

// GET /api/lessons/:id/ai/story-audio - TTS narration of the AI-generated
// "storyMode" text, generated once and cached in LessonMedia after that.
const getStoryAudio = async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findFirst({ where: { id: req.params.id, ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}) } });
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (!(await assertLessonAccess(lesson, req.user))) return error(res, 'Forbidden', 403);

    const storyText = lesson.aiContent?.storyMode;
    if (!storyText) return error(res, 'Story not generated yet for this lesson', 404);

    const cached = await prisma.lessonMedia.findUnique({
      where: { lessonId_kind_slideIndex: { lessonId: lesson.id, kind: 'story', slideIndex: -1 } },
    });
    if (cached) return streamAudioBuffer(res, cached.data, cached.mimeType);

    const { buffer: audio, mimeType } = await synthesizeForLesson(lesson.teacherId, storyText);
    const saved = await prisma.lessonMedia.create({
      data: { lessonId: lesson.id, kind: 'story', slideIndex: -1, data: audio, mimeType },
    });
    return streamAudioBuffer(res, saved.data, saved.mimeType);
  } catch (err) { next(err); }
};

// GET /api/lessons/:id/ai/voice-audio - TTS narration of the AI-generated
// "simpleExplanation" text, used by the "AI Voice Teacher" tab. Always uses
// the fixed Gemini voice (no browser speechSynthesis, no voice picker) so
// the Uzbek pronunciation is consistent and good quality.
const getVoiceAudio = async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findFirst({ where: { id: req.params.id, ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}) } });
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (!(await assertLessonAccess(lesson, req.user))) return error(res, 'Forbidden', 403);

    const explanationText = lesson.aiContent?.simpleExplanation || lesson.title;
    if (!explanationText) return error(res, 'No explanation available for this lesson', 404);

    const cached = await prisma.lessonMedia.findUnique({
      where: { lessonId_kind_slideIndex: { lessonId: lesson.id, kind: 'voice', slideIndex: -1 } },
    });
    if (cached) return streamAudioBuffer(res, cached.data, cached.mimeType);

    const { buffer: audio, mimeType } = await synthesizeForLesson(lesson.teacherId, explanationText);
    const saved = await prisma.lessonMedia.create({
      data: { lessonId: lesson.id, kind: 'voice', slideIndex: -1, data: audio, mimeType },
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

    const lesson = await prisma.lesson.findFirst({ where: { id: req.params.id, ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}) } });
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (!(await assertLessonAccess(lesson, req.user))) return error(res, 'Forbidden', 403);

    const script = lesson.aiContent?.explainerVideo;
    const slide = script?.slides?.[slideIndex];
    if (!slide) return error(res, 'Slide not found', 404);

    const cached = await prisma.lessonMedia.findUnique({
      where: { lessonId_kind_slideIndex: { lessonId: lesson.id, kind: 'explainer_slide', slideIndex } },
    });
    if (cached) return streamAudioBuffer(res, cached.data, cached.mimeType);

    const { buffer: audio, mimeType } = await synthesizeForLesson(lesson.teacherId, slide.narration);
    const saved = await prisma.lessonMedia.create({
      data: { lessonId: lesson.id, kind: 'explainer_slide', slideIndex, data: audio, mimeType },
    });
    return streamAudioBuffer(res, saved.data, saved.mimeType);
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
      const { buffer: image, mimeType } = await generateImage(slide.imagePrompt);
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
      aiReply = `Assalomu alaykum! "${lesson.title}" mavzusi bo'yicha savolingiz qabul qilindi. Mavzu yuzasidan qo'shimcha savollaringiz bo'lsa, marhamat so'rashingiz mumkin.`;
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

    return success(res, { reply: aiReply, chatId: chat?.id || 'temp' });
  } catch (err) {
    console.error('chatMessage error:', err.message);
    return error(res, 'Xabar yuborishda xatolik yuz berdi: ' + err.message, 500);
  }
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
  chatMessage, getChatHistory, generateQuizForLesson, getNotifications, markNotifRead,
  getStoryAudio, getVoiceAudio, generateExplainerVideo, getExplainerVideo, getExplainerSlideAudio, getExplainerSlideImage,
};
