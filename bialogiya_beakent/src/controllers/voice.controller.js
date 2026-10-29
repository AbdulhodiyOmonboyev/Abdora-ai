const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { cloneVoice, deleteVoice, synthesizeWithClonedVoice } = require('../services/ai/voiceClone.service');

// Helper to stream audio buffers to client with caching headers
const streamAudio = (res, buffer, mimeType = 'audio/mpeg') => {
  res.writeHead(200, {
    'Content-Type': mimeType,
    'Content-Length': buffer.length,
    'Cache-Control': 'no-cache',
    'Accept-Ranges': 'bytes',
  });
  return res.end(buffer);
};

// POST /api/voice/clone - upload an audio sample and create an instant voice clone
const uploadVoiceSample = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'Audio fayl yuborilmadi', 400);

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { name: true, clonedVoiceId: true, centerId: true },
    });

    if (!user) return error(res, 'Foydalanuvchi topilmadi', 404);

    // Replace any existing clone for this user rather than accumulating them
    if (user.clonedVoiceId) {
      await deleteVoice(user.clonedVoiceId, user.centerId);
    }

    const safeName = `${user.name || 'teacher'}-${req.user.userId.slice(-6)}`;
    const voiceId = await cloneVoice(
      safeName,
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      user.centerId
    );

    const voiceLabel = req.body?.label || user.name || 'Mening ovozim';

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { clonedVoiceId: voiceId, clonedVoiceName: voiceLabel },
    });

    // Safely clear old cached audio for this teacher's lessons so next playback regenerates with new clone
    try {
      const teacherLessons = await prisma.lesson.findMany({
        where: { teacherId: req.user.userId },
        select: { id: true },
      });
      const lessonIds = teacherLessons.map(l => l.id);
      if (lessonIds.length > 0) {
        await prisma.lessonMedia.deleteMany({
          where: { lessonId: { in: lessonIds } },
        });
      }
    } catch (cleanErr) {
      console.warn('Could not clear cached lesson media:', cleanErr.message);
    }

    return success(res, { voiceId, name: voiceLabel }, 'Ovoz muvaffaqiyatli klonlandi', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/voice/profile
const getVoiceProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { clonedVoiceId: true, clonedVoiceName: true },
    });
    return success(res, {
      hasClonedVoice: !!user?.clonedVoiceId,
      name: user?.clonedVoiceName || null,
      voiceId: user?.clonedVoiceId || null,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/voice/profile
const removeVoiceProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { clonedVoiceId: true, centerId: true },
    });

    if (user?.clonedVoiceId) {
      await deleteVoice(user.clonedVoiceId, user.centerId);
    }

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { clonedVoiceId: null, clonedVoiceName: null },
    });

    try {
      const teacherLessons = await prisma.lesson.findMany({
        where: { teacherId: req.user.userId },
        select: { id: true },
      });
      const lessonIds = teacherLessons.map(l => l.id);
      if (lessonIds.length > 0) {
        await prisma.lessonMedia.deleteMany({
          where: { lessonId: { in: lessonIds } },
        });
      }
    } catch (cleanErr) {
      console.warn('Could not clear cached lesson media:', cleanErr.message);
    }

    return success(res, null, "Ovoz profili o'chirildi");
  } catch (err) {
    next(err);
  }
};

// GET or POST /api/voice/test - test synthesis with the teacher's cloned voice
const testVoiceSample = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { name: true, clonedVoiceId: true, centerId: true },
    });

    if (!user?.clonedVoiceId) {
      return error(res, 'Klonlangan ovoz mavjud emas. Avval ovoz namunangizni yuklang.', 400);
    }

    const testText =
      req.body?.text ||
      req.query?.text ||
      `Assalomu alaykum! Men sizning sun'iy intellekt yordamchingizman. Darslarni sizning ovozingizda tushuntirib beraman.`;

    const audioBuffer = await synthesizeWithClonedVoice(testText, user.clonedVoiceId, user.centerId);
    return streamAudio(res, audioBuffer, 'audio/mpeg');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadVoiceSample,
  getVoiceProfile,
  removeVoiceProfile,
  testVoiceSample,
};
