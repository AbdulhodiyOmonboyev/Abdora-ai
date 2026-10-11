const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { generateLessonAI, generateTestFromPDFText } = require('../services/ai/lessonAI.service');
const { saveFilesAsAttachments } = require('../utils/fileStorage');
const { getCenterId } = require('../utils/centerScope');

const findAccessibleLesson = (id, user) => prisma.lesson.findFirst({
  where: { id, ...(user.role !== 'admin' && user.centerId ? { OR: [{ centerId: user.centerId }, { centerId: null }] } : {}) },
  select: { id: true, aiContent: true, aiEnabled: true, title: true, content: true, groupId: true, teacherId: true, centerId: true, attachments: true },
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
    const centerId = getCenterId(req) || req.body.centerId || null;
    const group = await prisma.group.findFirst({ where: { id: groupId, ...(centerId ? { centerId } : {}) }, select: { id: true } });
    if (!group) return error(res, 'Group not found', 404);

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

    // Agar talabaga hech qanday dars topilmasa, mavjud barcha faol umumiy darslarni ko'rsatamiz
    if (lessons.length === 0 && req.user.role === 'student') {
      lessons = await prisma.lesson.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: {
          teacher: { select: { id: true, name: true } },
          group: { select: { id: true, name: true } },
        },
        take: 30,
      });
    }

    return success(res, lessons);
  } catch (err) { next(err); }
};

const getLessonById = async (req, res, next) => {
  try {
    let lesson = await prisma.lesson.findFirst({
      where: {
        id: req.params.id,
        ...(req.user.role === 'admin'
          ? {}
          : req.user.centerId
          ? { OR: [{ centerId: req.user.centerId }, { centerId: null }] }
          : {}),
      },
      include: { teacher: { select: { id: true, name: true } }, group: { select: { id: true, name: true } } },
    });
    if (!lesson) {
      lesson = await prisma.lesson.findFirst({
        where: { id: req.params.id },
        include: { teacher: { select: { id: true, name: true } }, group: { select: { id: true, name: true } } },
      });
    }
    if (!lesson) return error(res, 'Lesson not found', 404);

    if (req.user.role === 'student') {
      await prisma.lesson.update({ where: { id: lesson.id }, data: { views: { increment: 1 } } });
      // Award XP for viewing
      try {
        const { awardXP } = require('../services/gamification.service');
        await awardXP(req.user.userId, 5, 'lesson_view');
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
};

