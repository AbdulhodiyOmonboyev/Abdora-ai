const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { generateLessonAI, generateTestFromPDFText } = require('../services/ai/lessonAI.service');
const { saveFilesAsAttachments } = require('../utils/fileStorage');
const { getCenterId } = require('../utils/centerScope');

const findAccessibleLesson = (id, user) => prisma.lesson.findFirst({
  where: { id, ...(user.role !== 'admin' && user.centerId ? { OR: [{ centerId: user.centerId }, { centerId: null }] } : {}) },
  select: {
    id: true, aiContent: true, aiEnabled: true, title: true, content: true,
    groupId: true, teacherId: true, centerId: true, attachments: true,
    group: { select: { centerId: true } },
  },
});

const canAccessLesson = async (lesson, user) => {
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

const extractTextFromFile = async (file) => {
  const mime = file.mimetype;

  // Plain text
  if (mime === 'text/plain') {
    return file.buffer ? file.buffer.toString('utf8') : '';
  }

  // PDF — pdf-parse v2 exports a PDFParse class, not a callable default.
  if (mime === 'application/pdf') {
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse({ data: new Uint8Array(file.buffer) });
    try {
      const result = await parser.getText();
      // Join page texts instead of using result.text — the latter injects
      // "-- 1 of N --" page separators that pollute the AI prompt.
      return (result.pages || []).map(p => p.text).join('\n\n') || result.text || '';
    } finally {
      await parser.destroy().catch(() => {});
    }
  }

  // DOCX / DOC
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mime === 'application/msword') {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value || '';
  }

  // Images — use Gemini vision
  if (mime && mime.startsWith('image/')) {
    const { getModel } = require('../config/gemini');
    const model = getModel(false);
    const imagePart = { inlineData: { data: file.buffer.toString('base64'), mimeType: mime } };
    const result = await model.generateContent([
      'Bu rasmning barcha matnini va ta\'lim mazmunini batafsil yoz. Mavzu, tushunchalar, jadvallar va diagrammalardagi ma\'lumotlarni ham yoz.',
      imagePart,
    ]);
    return result.response.text();
  }

  throw new Error('Qo\'llab-quvvatlanmaydigan fayl turi');
};

const createLesson = async (req, res, next) => {
  try {
    const { title, content, groupId, subject, aiEnabled, language } = req.body;
    if (!title || !groupId) return error(res, 'Title and group required', 400);

    let centerId = req.user?.centerId || req.body?.centerId || getCenterId(req) || null;
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        ...(centerId && req.user?.role !== 'admin' ? { centerId } : {}),
      },
      select: { id: true, centerId: true },
    });
    if (!group) return error(res, 'Group not found', 404);

    if (!centerId && group.centerId) {
      centerId = group.centerId;
    }

    // Yuklangan fayllardan (PDF, DOCX, TXT, Rasm) matn ajratib olish
    let extractedResourceText = '';
    if (req.files && req.files.length > 0) {
      const extractedChunks = [];
      for (const file of req.files) {
        try {
          const txt = await extractTextFromFile(file);
          if (txt && txt.trim().length > 10) {
            extractedChunks.push(`[Resurs fayl: ${file.originalname}]:\n${txt.trim()}`);
          }
        } catch (fErr) {
          console.warn(`[Lesson] Fayldan matn ajratishda ogohlantirish (${file.originalname}):`, fErr.message);
        }
      }
      if (extractedChunks.length > 0) {
        extractedResourceText = extractedChunks.join('\n\n---\n\n');
        if (extractedResourceText.length > 50000) {
          extractedResourceText = extractedResourceText.slice(0, 50000) + '\n\n[... Qolgan qismi qisqartirildi ...]';
        }
      }
    }

    const attachments = await saveFilesAsAttachments(req.files);
    // multipart/form-data sends booleans as strings.
    const wantsAI = aiEnabled !== 'false' && aiEnabled !== false;

    const lesson = await prisma.lesson.create({
      data: {
        title, content, subject: subject || 'other', groupId,
        teacherId: req.user.userId, centerId, attachments, aiEnabled: wantsAI,
        aiContent: wantsAI ? { status: 'pending' } : { status: 'disabled' },
      },
      include: { group: { select: { id: true, name: true } }, teacher: { select: { id: true, name: true } } },
    });

    if (wantsAI) {
      // O'qituvchi konspekti va yuklangan PDF/resurs matnlarini birlashtirib AI ga uzatamiz:
      const fullContext = [
        content ? `O'qituvchi kiritgan dars matni/konspekti:\n${content}` : '',
        extractedResourceText ? `Yuklangan resurs/PDF darslikdan olingan asosiy ilmiy material:\n${extractedResourceText}` : ''
      ].filter(Boolean).join('\n\n====================\n\n');

      const lang = language || 'uz';
      setImmediate(() => generateLessonAI(lesson.id, title, fullContext || title, lang).catch(console.error));
    }

    // Guruhdagi talabalarga yangi dars bildirishnomasini yuborish
    try {
      const students = await prisma.user.findMany({
        where: { groupId, role: 'student', isActive: true },
        select: { id: true },
      });
      if (students.length > 0) {
        await prisma.notification.createMany({
          data: students.map((s) => ({
            userId: s.id,
            type: 'lesson',
            title: 'Yangi dars qo\'shildi!',
            message: `"${title}" mavzusidagi yangi dars o'tildi va materiallari yuklandi.`,
            link: `/student/lessons/${lesson.id}`,
            centerId,
          })),
        });
      }
    } catch (_) {}

    return success(res, lesson, 'Lesson created', 201);
  } catch (err) { next(err); }
};

const getLessons = async (req, res, next) => {
  try {
    const { groupId } = req.query;
    let where = { isActive: true };

    if (req.user.role === 'student') {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { groupId: true, centerId: true },
      });
      if (groupId) {
        where.groupId = groupId;
      } else if (user?.groupId) {
        where.groupId = user.groupId;
      } else if (user?.centerId || req.user.centerId) {
        const cId = user?.centerId || req.user.centerId;
        where.OR = [{ centerId: cId }, { centerId: null }];
      }
    } else if (req.user.role === 'teacher') {
      where.teacherId = req.user.userId;
      if (groupId) where.groupId = groupId;
      if (req.user.centerId) {
        where.OR = [{ centerId: req.user.centerId }, { centerId: null }];
      }
    } else if (req.user.role !== 'admin') {
      if (groupId) where.groupId = groupId;
      if (req.user.centerId) {
        where.OR = [{ centerId: req.user.centerId }, { centerId: null }];
      }
    } else {
      if (groupId) where.groupId = groupId;
    }

    let lessons = await prisma.lesson.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        teacher: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
      },
    });

    // Agar talabaning guruhida dars topilmasa, faqat o'z o'quv markazining umumiy (guruhsiz) darslarini ko'rsatamiz
    if (lessons.length === 0 && req.user.role === 'student') {
      const studentRecord = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { centerId: true },
      });
      const studentCenterId = studentRecord?.centerId || req.user.centerId || null;
      if (studentCenterId) {
        lessons = await prisma.lesson.findMany({
          where: { isActive: true, centerId: studentCenterId, groupId: null },
          orderBy: { order: 'asc' },
          include: {
            teacher: { select: { id: true, name: true } },
            group: { select: { id: true, name: true } },
          },
          take: 30,
        });
      }
    }

    return success(res, lessons);
  } catch (err) { next(err); }
};

const getLessonById = async (req, res, next) => {
  try {
    let effectiveCenterId = req.user.centerId || null;
    if (req.user.role !== 'admin' && !effectiveCenterId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { centerId: true },
      });
      effectiveCenterId = dbUser?.centerId || null;
    }

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: req.params.id,
        ...(req.user.role === 'admin'
          ? {}
          : effectiveCenterId
          ? { OR: [{ centerId: effectiveCenterId }, { centerId: null }] }
          : { centerId: null }),
      },
      include: { teacher: { select: { id: true, name: true } }, group: { select: { id: true, name: true } } },
    });
    if (!lesson) return error(res, 'Lesson not found', 404);

    if (req.user.role === 'student') {
      await prisma.lesson.update({ where: { id: lesson.id }, data: { views: { increment: 1 } } }).catch(() => {});

      // O'quvchi ushbu dars uchun bir kunda faqat bir marta XP olishi kerak (sahifa yangilanganda cheksiz XP/tanga olishini cheklash)
      try {
        const student = await prisma.user.findUnique({
          where: { id: req.user.userId },
          select: { achievements: true },
        });

        let achievementsObj = {};
        if (student?.achievements) {
          if (typeof student.achievements === 'object' && !Array.isArray(student.achievements)) {
            achievementsObj = { ...student.achievements };
          } else if (Array.isArray(student.achievements)) {
            achievementsObj = { badges: student.achievements };
          } else if (typeof student.achievements === 'string') {
            try {
              const parsed = JSON.parse(student.achievements);
              achievementsObj = typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : { badges: Array.isArray(parsed) ? parsed : [] };
            } catch (_) {}
          }
        }

        const viewedLessons = achievementsObj.viewedLessons && typeof achievementsObj.viewedLessons === 'object'
          ? { ...achievementsObj.viewedLessons }
          : {};

        const todayStr = new Date().toISOString().slice(0, 10);
        const lastViewDate = viewedLessons[lesson.id];

        if (lastViewDate !== todayStr) {
          viewedLessons[lesson.id] = todayStr;

          // Prune very old entries to prevent infinite growth
          const keys = Object.keys(viewedLessons);
          if (keys.length > 100) {
            const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
            for (const k of keys) {
              if (viewedLessons[k] < sixtyDaysAgo) {
                delete viewedLessons[k];
              }
            }
          }

          achievementsObj.viewedLessons = viewedLessons;

          await prisma.user.update({
            where: { id: req.user.userId },
            data: { achievements: achievementsObj },
          });

          const { awardXP } = require('../services/gamification.service');
          await awardXP(req.user.userId, 5, 'lesson_view');
        }
      } catch (_) {}
    }

    return success(res, lesson);
  } catch (err) { next(err); }
};

const updateLesson = async (req, res, next) => {
  try {
    const { title, content, subject, order, groupId, aiEnabled } = req.body;

    const existing = await prisma.lesson.findFirst({
      where: { id: req.params.id, ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}) },
      select: { attachments: true, aiEnabled: true },
    });
    if (!existing) return error(res, 'Lesson not found', 404);

    const newAttachments = await saveFilesAsAttachments(req.files);
    // Newly uploaded files are appended — an edit must never drop the files the
    // teacher attached earlier.
    const merged = [...(Array.isArray(existing.attachments) ? existing.attachments : []), ...newAttachments];

    const wantsAI = aiEnabled === undefined ? existing.aiEnabled : (aiEnabled !== 'false' && aiEnabled !== false);

    const updateData = {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(subject !== undefined && { subject }),
      ...(order !== undefined && { order: parseInt(order, 10) || 0 }),
      ...(groupId !== undefined && { groupId }),
      ...(newAttachments.length > 0 && { attachments: merged }),
      ...(aiEnabled !== undefined && { aiEnabled: wantsAI }),
    };

    const lesson = await prisma.lesson.update({
      where: { id: req.params.id },
      data: updateData,
    });
    return success(res, lesson);
  } catch (err) { next(err); }
};

// DELETE /lessons/:id/attachments/:attachmentId — remove one attachment.
const removeAttachment = async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findFirst({
      where: { id: req.params.id, ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}) },
      select: { attachments: true, teacherId: true },
    });
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (req.user.role === 'teacher' && lesson.teacherId !== req.user.userId) {
      return error(res, 'Not authorized for this lesson', 403);
    }

    const attachments = (Array.isArray(lesson.attachments) ? lesson.attachments : [])
      .filter(a => a.id !== req.params.attachmentId);

    const updated = await prisma.lesson.update({
      where: { id: req.params.id },
      data: { attachments },
    });
    return success(res, updated, 'Attachment removed');
  } catch (err) { next(err); }
};

const deleteLesson = async (req, res, next) => {
  try {
    await prisma.lesson.update({ where: { id: req.params.id }, data: { isActive: false } });
    return success(res, null, 'Lesson deleted');
  } catch (err) { next(err); }
};

const getAIContent = async (req, res, next) => {
  try {
    const lesson = await findAccessibleLesson(req.params.id, req.user);
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (!(await canAccessLesson(lesson, req.user))) return error(res, 'Forbidden', 403);
    return success(res, lesson.aiContent);
  } catch (err) { next(err); }
};

const regenerateAI = async (req, res, next) => {
  try {
    const lesson = await findAccessibleLesson(req.params.id, req.user);
    if (!lesson) return error(res, 'Not found', 404);
    if (!(await canAccessLesson(lesson, req.user))) return error(res, 'Forbidden', 403);
    if (!lesson.aiEnabled) return error(res, 'Bu dars uchun AI o\'chirilgan', 400);

    // Darsga biriktirilgan fayllardan matn ajratib olish
    let extractedAttachmentsText = '';
    const attachments = Array.isArray(lesson.attachments) ? lesson.attachments : [];
    const fileIds = attachments.map(a => a.id).filter(Boolean);
    if (fileIds.length > 0) {
      try {
        const files = await prisma.uploadedFile.findMany({
          where: { id: { in: fileIds } },
          select: { id: true, name: true, mimeType: true, data: true }
        });
        const chunks = [];
        for (const f of files) {
          try {
            if (f && f.data) {
              const txt = await extractTextFromFile({ buffer: f.data, mimetype: f.mimeType, originalname: f.name });
              if (txt && txt.trim().length > 10) {
                chunks.push(`[Resurs fayl: ${f.name}]:\n${txt.trim()}`);
              }
            }
          } catch (e) {}
        }
        if (chunks.length > 0) {
          extractedAttachmentsText = chunks.join('\n\n---\n\n');
          if (extractedAttachmentsText.length > 50000) {
            extractedAttachmentsText = extractedAttachmentsText.slice(0, 50000) + '\n\n[... Qolgan qismi qisqartirildi ...]';
          }
        }
      } catch (e) {}
    }

    const fullContext = [
      lesson.content ? `O'qituvchi kiritgan dars matni/konspekti:\n${lesson.content}` : '',
      extractedAttachmentsText ? `Yuklangan resurs/PDF darslikdan olingan asosiy ilmiy material:\n${extractedAttachmentsText}` : ''
    ].filter(Boolean).join('\n\n====================\n\n');

    const language = req.body?.language || 'uz';
    await prisma.lesson.update({ where: { id: lesson.id }, data: { aiContent: { status: 'generating' } } });
    setImmediate(() => generateLessonAI(lesson.id, lesson.title, fullContext || lesson.title, language).catch(console.error));
    return success(res, { status: 'generating' });
  } catch (err) { next(err); }
};

// Runs after the HTTP response has been sent — see `source`/`aiStatus` on Test.
const populateTestWithAI = async (testId, pdfText, groupId, teacherId, testTitle, language) => {
  try {
    const generated = await generateTestFromPDFText(pdfText, groupId, teacherId, testTitle, language);

    const questions = (generated.questions || []).map(q => ({
      text: q.text,
      type: 'mcq',
      options: q.options || [],
      difficulty: q.difficulty || 'medium',
      points: q.points || 1,
      explanation: q.studentExplanation || q.explanation || '',
    }));
    if (questions.length === 0) {
      await prisma.test.update({
        where: { id: testId },
        data: { aiStatus: 'error', aiError: 'AI bu fayldan savol yarata olmadi' },
      });
      return;
    }

    await prisma.question.createMany({ data: questions.map(q => ({ ...q, testId })) });
    await prisma.test.update({
      where: { id: testId },
      data: {
        title: generated.title || testTitle,
        totalPoints: questions.reduce((s, q) => s + q.points, 0),
        aiStatus: 'ready',
        aiError: null,
      },
    });
  } catch (err) {
    console.error('AI test generation error:', err.message);
    await prisma.test
      .update({ where: { id: testId }, data: { aiStatus: 'error', aiError: err.message } })
      .catch(() => {});
  }
};

const generateTestFromPDF = async (req, res, next) => {
  try {
    const { groupId, title, timeLimit, passingScore, language, useAI } = req.body;
    if (!groupId) return error(res, 'groupId required', 400);
    if (!req.file) return error(res, 'Fayl yuborilmadi', 400);

    // multipart/form-data sends booleans as strings.
    const aiEnabled = useAI !== 'false' && useAI !== false;

    let extractedText;
    try {
      extractedText = await extractTextFromFile(req.file);
    } catch (e) {
      return error(res, `Fayldan matn chiqarib bo'lmadi: ${e.message}`, 400);
    }

    const pdfText = extractedText?.trim() || '';
    if (pdfText.length < 30) {
      return error(res, 'Faylda yetarli matn topilmadi', 400);
    }

    const testTitle = title || `Test - ${new Date().toLocaleDateString('uz-UZ')}`;
    const baseData = {
      title: testTitle,
      type: 'topic',
      groupId,
      teacherId: req.user.userId,
      centerId: getCenterId(req) || null,
      timeLimit: parseInt(timeLimit, 10) || 30,
      passingScore: parseInt(passingScore, 10) || 60,
    };

    const group = await prisma.group.findFirst({
      where: { id: groupId, ...(req.user.role !== 'admin' ? { centerId: req.user.centerId, teacherId: req.user.userId } : {}) },
      select: { id: true, centerId: true },
    });
    if (!group) return error(res, 'Group not found', 404);
    baseData.centerId = group.centerId || baseData.centerId;

    // "AI aralashmasin" — import the questions exactly as the teacher wrote them.
    if (!aiEnabled) {
      const { parseTestFromText } = require('../utils/testParser');
      const { questions, warnings } = parseTestFromText(pdfText);

      if (questions.length === 0) {
        return error(
          res,
          "Fayldan savol topilmadi. Savollar '1. Savol matni' ko'rinishida, variantlar 'A) ...' ko'rinishida bo'lishi kerak. To'g'ri javobni '*B) ...' yoki 'Javob: B' bilan belgilang.",
          400,
        );
      }

      const test = await prisma.test.create({
        data: {
          ...baseData,
          source: 'file_import',
          aiStatus: 'ready',
          totalPoints: questions.reduce((s, q) => s + q.points, 0),
          questions: { create: questions },
        },
        include: { questions: true, group: { select: { id: true, name: true } } },
      });

      return success(res, { ...test, warnings }, `${questions.length} ta savol fayldan olindi`, 201);
    }

    // AI path: return as soon as the row exists, then fill it in the background.
    const test = await prisma.test.create({
      data: { ...baseData, source: 'ai_file', aiStatus: 'generating' },
      include: { questions: true, group: { select: { id: true, name: true } } },
    });

    setImmediate(() =>
      populateTestWithAI(test.id, pdfText, groupId, req.user.userId, testTitle, language || 'uz'),
    );

    return success(res, test, 'AI test tayyorlamoqda', 202);
  } catch (err) { next(err); }
};

const updateAIContent = async (req, res, next) => {
  try {
    const lesson = await findAccessibleLesson(req.params.id, req.user);
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (!(await canAccessLesson(lesson, req.user))) return error(res, 'Forbidden', 403);

    const existing = lesson.aiContent || {};
    const updatedAi = {
      ...existing,
      ...req.body,
      isVerifiedByTeacher: req.body.isVerifiedByTeacher !== undefined ? req.body.isVerifiedByTeacher : existing.isVerifiedByTeacher,
      lastEditedAt: new Date().toISOString(),
      lastEditedByTeacher: true,
    };

    const updated = await prisma.lesson.update({
      where: { id: lesson.id },
      data: { aiContent: updatedAi },
    });

    return success(res, updated.aiContent, 'AI kontent muvaffaqiyatli saqlandi');
  } catch (err) { next(err); }
};

const completeLesson = async (req, res, next) => {
  try {
    const lessonId = req.params.id;
    const studentId = req.user.userId;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) return error(res, 'Lesson not found', 404);

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        xp: true,
        coins: true,
        level: true,
        streakCurrent: true,
        streakLongest: true,
        streakLastDate: true,
        achievements: true,
      },
    });
    if (!student) return error(res, 'Foydalanuvchi topilmadi', 404);

    let achievementsObj = {};
    if (student.achievements) {
      if (typeof student.achievements === 'object' && !Array.isArray(student.achievements)) {
        achievementsObj = { ...student.achievements };
      } else if (Array.isArray(student.achievements)) {
        achievementsObj = { badges: student.achievements };
      } else if (typeof student.achievements === 'string') {
        try {
          const parsed = JSON.parse(student.achievements);
          achievementsObj = typeof parsed === 'object' && !Array.isArray(parsed)
            ? parsed
            : { badges: Array.isArray(parsed) ? parsed : [] };
        } catch (_) {}
      }
    }

    const completedLessons = Array.isArray(achievementsObj.completedLessons)
      ? [...achievementsObj.completedLessons]
      : [];

    let gamifyRes = null;
    let earnedXp = 0;

    const alreadyCompleted = completedLessons.includes(lessonId);
    if (!alreadyCompleted) {
      completedLessons.push(lessonId);
      achievementsObj.completedLessons = completedLessons;

      await prisma.user.update({
        where: { id: studentId },
        data: { achievements: achievementsObj },
      });

      // Talabaga standart +50 XP berish va bugungi streak'ini yangilash
      earnedXp = 50;
      const { awardXP } = require('../services/gamification.service');
      gamifyRes = await awardXP(studentId, earnedXp, 'lesson_complete');
    }

    // Yangilangan ko'rsatkichlarni olish
    const updatedUser = await prisma.user.findUnique({
      where: { id: studentId },
      select: { xp: true, coins: true, level: true, streakCurrent: true, streakLongest: true },
    });

    return success(res, {
      lessonId,
      completed: true,
      alreadyCompleted,
      completedLessonIds: completedLessons,
      completedCount: completedLessons.length,
      xpGained: gamifyRes?.xpGained ?? earnedXp,
      newXP: updatedUser?.xp ?? (student.xp + earnedXp),
      coins: updatedUser?.coins ?? student.coins,
      streakCurrent: updatedUser?.streakCurrent ?? student.streakCurrent,
      streakLongest: updatedUser?.streakLongest ?? student.streakLongest,
      level: updatedUser?.level ?? student.level,
    }, 'Dars muvaffaqiyatli yakunlandi');
  } catch (err) {
    next(err);
  }
};

const getStudentLessonProgress = async (req, res, next) => {
  try {
    const student = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        xp: true,
        coins: true,
        level: true,
        streakCurrent: true,
        streakLongest: true,
        achievements: true,
        groupId: true,
        group: {
          select: {
            id: true,
            name: true,
            level: true,
            totalLessons: true,
            subject: true,
          },
        },
        center: {
          select: {
            id: true,
            settings: true,
          },
        },
      },
    });
    if (!student) return error(res, 'Foydalanuvchi topilmadi', 404);

    let achievementsObj = {};
    if (student.achievements) {
      if (typeof student.achievements === 'object' && !Array.isArray(student.achievements)) {
        achievementsObj = { ...student.achievements };
      } else if (Array.isArray(student.achievements)) {
        achievementsObj = { badges: student.achievements };
      } else if (typeof student.achievements === 'string') {
        try {
          const parsed = JSON.parse(student.achievements);
          achievementsObj = typeof parsed === 'object' && !Array.isArray(parsed)
            ? parsed
            : { badges: Array.isArray(parsed) ? parsed : [] };
        } catch (_) {}
      }
    }

    const completedLessonIds = Array.isArray(achievementsObj.completedLessons)
      ? achievementsObj.completedLessons.map(item => (typeof item === 'object' && item?.id ? item.id : item))
      : [];

    const lessonMastery = achievementsObj.lessonMastery && typeof achievementsObj.lessonMastery === 'object'
      ? achievementsObj.lessonMastery
      : {};

    // Determine planned total lessons from group or center settings
    let plannedTotalLessons = student.group?.totalLessons || null;
    let stageLevelName = student.group?.level || "Boshlang'ich";

    if (!plannedTotalLessons && student.center?.settings) {
      try {
        const settings = typeof student.center.settings === 'string'
          ? JSON.parse(student.center.settings)
          : student.center.settings;
        const levels = settings.courseLevels || settings.levels || [];
        if (Array.isArray(levels) && levels.length > 0) {
          const found = levels.find(l => 
            (l.name && stageLevelName && l.name.toLowerCase() === stageLevelName.toLowerCase()) ||
            (l.id && stageLevelName && l.id === stageLevelName)
          );
          if (found && found.totalLessons) {
            plannedTotalLessons = Number(found.totalLessons);
          } else if (levels[0]?.totalLessons) {
            plannedTotalLessons = Number(levels[0].totalLessons);
          }
        }
      } catch (_) {}
    }

    // Default planned curriculum count: 12 lessons per unit/stage if not specified
    if (!plannedTotalLessons || plannedTotalLessons < 1) {
      plannedTotalLessons = 12;
    }

    const groupStageInfo = {
      level: stageLevelName,
      totalLessons: plannedTotalLessons,
      groupName: student.group?.name || null,
      subject: student.group?.subject || null,
    };

    return success(res, {
      completedLessonIds,
      completedCount: completedLessonIds.length,
      lessonMastery,
      xp: student.xp,
      coins: student.coins,
      level: student.level,
      streakCurrent: student.streakCurrent,
      streakLongest: student.streakLongest,
      groupStageInfo,
      totalPlannedLessons: plannedTotalLessons,
    });
  } catch (err) {
    next(err);
  }
};

const submitStepProgress = async (req, res, next) => {
  try {
    const lessonId = req.params.id;
    const studentId = req.user.userId;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, title: true },
    });
    if (!lesson) return error(res, 'Lesson not found', 404);

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        xp: true,
        coins: true,
        level: true,
        streakCurrent: true,
        streakLongest: true,
        achievements: true,
      },
    });
    if (!student) return error(res, 'Foydalanuvchi topilmadi', 404);

    const { stepId, stepType, isCorrect, userAnswer, timeSpent, stepIndex } = req.body;
    const isStepCorrect = isCorrect === true || isCorrect === 'true' || isCorrect === 1;

    let achievementsObj = {};
    if (student.achievements) {
      if (typeof student.achievements === 'object' && !Array.isArray(student.achievements)) {
        achievementsObj = { ...student.achievements };
      } else if (Array.isArray(student.achievements)) {
        achievementsObj = { badges: student.achievements };
      } else if (typeof student.achievements === 'string') {
        try {
          const parsed = JSON.parse(student.achievements);
          achievementsObj = typeof parsed === 'object' && !Array.isArray(parsed)
            ? parsed
            : { badges: Array.isArray(parsed) ? parsed : [] };
        } catch (_) {}
      }
    }

    const lessonProgress = achievementsObj.lessonProgress && typeof achievementsObj.lessonProgress === 'object'
      ? { ...achievementsObj.lessonProgress }
      : {};

    const currentLesson = lessonProgress[lessonId] && typeof lessonProgress[lessonId] === 'object'
      ? { ...lessonProgress[lessonId] }
      : {
          completedSteps: [],
          mistakes: [],
          lastStep: null,
          updatedAt: new Date().toISOString(),
        };

    const completedSteps = Array.isArray(currentLesson.completedSteps)
      ? [...currentLesson.completedSteps]
      : [];
    const mistakes = Array.isArray(currentLesson.mistakes)
      ? [...currentLesson.mistakes]
      : [];

    const effectiveStepId = (stepId !== undefined && stepId !== null)
      ? String(stepId)
      : (stepIndex !== undefined ? `step_${stepIndex}` : `step_${completedSteps.length + 1}`);

    let xpEarned = 0;
    if (isStepCorrect) {
      xpEarned = 5;
      if (!completedSteps.includes(effectiveStepId)) {
        completedSteps.push(effectiveStepId);
      }
    } else {
      mistakes.push({
        stepId: effectiveStepId,
        stepType: stepType || 'quiz',
        userAnswer: userAnswer !== undefined ? userAnswer : null,
        timeSpent: Number(timeSpent) || 0,
        timestamp: new Date().toISOString(),
      });
    }

    currentLesson.completedSteps = completedSteps;
    currentLesson.mistakes = mistakes;
    currentLesson.lastStep = effectiveStepId;
    currentLesson.updatedAt = new Date().toISOString();

    lessonProgress[lessonId] = currentLesson;
    achievementsObj.lessonProgress = lessonProgress;

    // Mirror to duolingoProgress
    if (!achievementsObj.duolingoProgress || typeof achievementsObj.duolingoProgress !== 'object') {
      achievementsObj.duolingoProgress = {};
    }
    achievementsObj.duolingoProgress[lessonId] = currentLesson;

    await prisma.user.update({
      where: { id: studentId },
      data: { achievements: achievementsObj },
    });

    if (xpEarned > 0) {
      const { awardXP } = require('../services/gamification.service');
      await awardXP(studentId, xpEarned, 'step_complete');
    }

    return success(res, {
      success: true,
      xpEarned,
      currentStep: effectiveStepId,
      mistakesCount: mistakes.length,
      totalStepsCompleted: completedSteps.length,
      lessonId,
      stepType: stepType || 'concept',
      isCorrect: isStepCorrect,
      timeSpent: Number(timeSpent) || 0,
      xpGained: xpEarned,
    });
  } catch (err) {
    next(err);
  }
};

const finishLessonQuiz = async (req, res, next) => {
  try {
    const lessonId = req.params.id;
    const studentId = req.user.userId;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, title: true },
    });
    if (!lesson) return error(res, 'Lesson not found', 404);

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        xp: true,
        coins: true,
        level: true,
        streakCurrent: true,
        streakLongest: true,
        achievements: true,
      },
    });
    if (!student) return error(res, 'Foydalanuvchi topilmadi', 404);

    const { score = 0, totalQuestions = 0, answers, mistakes, timeSpent = 0 } = req.body;
    const numericScore = typeof score === 'number' ? score : Number(score) || 0;
    const numericTotal = typeof totalQuestions === 'number' ? totalQuestions : Number(totalQuestions) || 0;

    const masteryPercent = numericTotal > 0 ? Math.round((numericScore / numericTotal) * 100) : 0;
    const isMastered = masteryPercent >= 70;

    let achievementsObj = {};
    if (student.achievements) {
      if (typeof student.achievements === 'object' && !Array.isArray(student.achievements)) {
        achievementsObj = { ...student.achievements };
      } else if (Array.isArray(student.achievements)) {
        achievementsObj = { badges: student.achievements };
      } else if (typeof student.achievements === 'string') {
        try {
          const parsed = JSON.parse(student.achievements);
          achievementsObj = typeof parsed === 'object' && !Array.isArray(parsed)
            ? parsed
            : { badges: Array.isArray(parsed) ? parsed : [] };
        } catch (_) {}
      }
    }

    const lessonProgress = achievementsObj.lessonProgress && typeof achievementsObj.lessonProgress === 'object'
      ? { ...achievementsObj.lessonProgress }
      : {};

    const currentLesson = lessonProgress[lessonId] && typeof lessonProgress[lessonId] === 'object'
      ? { ...lessonProgress[lessonId] }
      : {
          completedSteps: [],
          mistakes: [],
          lastStep: null,
          updatedAt: new Date().toISOString(),
        };

    const quizMistakes = Array.isArray(mistakes) ? mistakes : [];
    if (quizMistakes.length > 0) {
      const existingMistakes = Array.isArray(currentLesson.mistakes) ? currentLesson.mistakes : [];
      currentLesson.mistakes = [...existingMistakes, ...quizMistakes];
    }

    currentLesson.quizResult = {
      score: numericScore,
      totalQuestions: numericTotal,
      masteryPercent,
      isMastered,
      answers: answers || [],
      mistakes: quizMistakes,
      timeSpent: Number(timeSpent) || 0,
      completedAt: new Date().toISOString(),
    };
    currentLesson.masteryPercent = masteryPercent;
    currentLesson.isMastered = isMastered;
    currentLesson.updatedAt = new Date().toISOString();

    let xpEarned = 0;
    let coinsEarned = 0;

    if (isMastered) {
      xpEarned = 30;
      coinsEarned = 5;

      // Darsni completedLessons ga qo'shish
      const completedLessons = Array.isArray(achievementsObj.completedLessons)
        ? [...achievementsObj.completedLessons]
        : [];
      if (!completedLessons.includes(lessonId)) {
        completedLessons.push(lessonId);
        achievementsObj.completedLessons = completedLessons;
      }

      // Mastered lessons list
      const masteredLessons = Array.isArray(achievementsObj.masteredLessons)
        ? [...achievementsObj.masteredLessons]
        : [];
      if (!masteredLessons.includes(lessonId)) {
        masteredLessons.push(lessonId);
        achievementsObj.masteredLessons = masteredLessons;
      }
    }

    // Also update lessonMastery map for legacy/monitoring views
    const lessonMastery = achievementsObj.lessonMastery && typeof achievementsObj.lessonMastery === 'object'
      ? { ...achievementsObj.lessonMastery }
      : {};
    lessonMastery[lessonId] = {
      score: numericScore,
      totalQuestions: numericTotal,
      mastery: masteryPercent,
      isMastered,
      stars: masteryPercent >= 90 ? 3 : masteryPercent >= 60 ? 2 : masteryPercent > 0 ? 1 : 0,
      timeSpent: Number(timeSpent) || 0,
      completedAt: new Date().toISOString(),
    };
    achievementsObj.lessonMastery = lessonMastery;

    lessonProgress[lessonId] = currentLesson;
    achievementsObj.lessonProgress = lessonProgress;

    // Mirror to duolingoProgress
    if (!achievementsObj.duolingoProgress || typeof achievementsObj.duolingoProgress !== 'object') {
      achievementsObj.duolingoProgress = {};
    }
    achievementsObj.duolingoProgress[lessonId] = currentLesson;

    await prisma.user.update({
      where: { id: studentId },
      data: { achievements: achievementsObj },
    });

    let streakCurrent = student.streakCurrent;

    if (isMastered) {
      const { awardXP } = require('../services/gamification.service');
      const gamifyRes = await awardXP(studentId, xpEarned, 'quiz_finish');
      if (gamifyRes?.streakCurrent !== undefined) {
        streakCurrent = gamifyRes.streakCurrent;
      } else {
        const refreshedUser = await prisma.user.findUnique({
          where: { id: studentId },
          select: { streakCurrent: true },
        });
        streakCurrent = refreshedUser?.streakCurrent ?? student.streakCurrent;
      }
    } else {
      const refreshedUser = await prisma.user.findUnique({
        where: { id: studentId },
        select: { streakCurrent: true },
      });
      streakCurrent = refreshedUser?.streakCurrent ?? student.streakCurrent;
    }

    return success(res, {
      success: true,
      masteryPercent,
      isMastered,
      score: numericScore,
      xpEarned,
      coinsEarned,
      streakCurrent,
      lessonId,
      totalQuestions: numericTotal,
      mastery: masteryPercent,
      xpGained: xpEarned,
    }, isMastered ? 'Dars to\'liq o\'zlashtirildi!' : 'Test yakunlandi');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createLesson,
  getLessons,
  getLessonById,
  updateLesson,
  deleteLesson,
  removeAttachment,
  getAIContent,
  regenerateAI,
  generateTestFromPDF,
  updateAIContent,
  completeLesson,
  getStudentLessonProgress,
  submitStepProgress,
  submitLessonStep: submitStepProgress,
  finishLessonQuiz,
};

