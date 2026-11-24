const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { saveFilesAsAttachments } = require('../utils/fileStorage');
const { getCenterId } = require('../utils/centerScope');
const { assertGroupAccess } = require('../utils/branchScope');
const { extractTextFromFile } = require('../utils/fileExtract');
const {
  gradeInteractiveHomework,
  analyzeInteractiveHomeworkAI,
  generateAnswersAI,
  validateAnswersAI,
} = require('../services/ai/gradingAI.service');

const safeParseJson = (val, defaultVal = null) => {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'object') return val;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch (_) {
      return defaultVal;
    }
  }
  return defaultVal;
};

/**
 * Sanitizes interactive homework attachments for students by removing expected answers.
 */
const sanitizeAttachmentsForStudent = (attachments) => {
  if (!attachments || typeof attachments !== 'object' || Array.isArray(attachments)) {
    return attachments;
  }
  const cloned = { ...attachments };
  delete cloned.answerKey;
  if (Array.isArray(cloned.interactiveFields)) {
    cloned.interactiveFields = cloned.interactiveFields.map(field => {
      if (!field || typeof field !== 'object') return field;
      const { expectedAnswer, ...rest } = field;
      return rest;
    });
  }
  return cloned;
};

const createHomework = async (req, res, next) => {
  try {
    const {
      title,
      description,
      groupId,
      lessonId,
      dueDate,
      maxScore,
      category,
      interactiveFields,
      answerKey,
      readingPassage,
      audioUrl,
      allowVoiceRecord,
      suggestedRubric,
      rubric,
    } = req.body;

    if (!title || !groupId || !dueDate) {
      return error(res, 'Title, group and due date required', 400);
    }

    const centerId = getCenterId(req) || null;
    const groupAccess = await assertGroupAccess(groupId, req.user, prisma);
    if (groupAccess.error) return error(res, groupAccess.error, groupAccess.status);

    const savedFiles = await saveFilesAsAttachments(req.files);

    // Parse interactive homework metadata
    const parsedInteractiveFields = safeParseJson(interactiveFields, []);
    const parsedAnswerKey = safeParseJson(answerKey, {});
    const parsedRubric = safeParseJson(suggestedRubric || rubric, null);

    // Structure attachments JSON object
    const attachments = {
      files: savedFiles,
      category: category || 'writing',
      interactiveFields: Array.isArray(parsedInteractiveFields) ? parsedInteractiveFields : [],
      answerKey: parsedAnswerKey || {},
      readingPassage: readingPassage || '',
      audioUrl: audioUrl || '',
      allowVoiceRecord: allowVoiceRecord === true || allowVoiceRecord === 'true',
      suggestedRubric: parsedRubric,
    };

    // Normalize and validate maxScore (Prisma expects an Int)
    let parsedMaxScore = 100;
    if (maxScore !== undefined && maxScore !== null && maxScore !== '') {
      const n = parseInt(maxScore, 10);
      if (Number.isNaN(n)) return error(res, 'Invalid maxScore value; must be a number', 400);
      parsedMaxScore = n;
    }

    const hw = await prisma.homework.create({
      data: {
        title,
        description,
        groupId,
        lessonId: lessonId || null,
        teacherId: req.user.userId,
        centerId,
        dueDate: new Date(dueDate),
        maxScore: parsedMaxScore,
        attachments,
      },
      include: {
        group: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
    });

    // Guruhdagi talabalarga bildirishnoma yuborish
    try {
      const students = await prisma.user.findMany({
        where: { groupId, role: 'student', isActive: true },
        select: { id: true },
      });
      if (students.length > 0) {
        await prisma.notification.createMany({
          data: students.map((s) => ({
            userId: s.id,
            type: 'homework',
            title: 'Yangi uyga vazifa!',
            message: `"${title}" mavzusida yangi topshiriq yuklandi.`,
            link: '/student/homework',
            centerId,
          })),
        });
      }
    } catch (_) {}

    return success(res, hw, 'Homework created', 201);
  } catch (err) {
    next(err);
  }
};

const getHomeworkByGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const groupAccess = await assertGroupAccess(groupId, req.user, prisma);
    if (groupAccess.error) return error(res, groupAccess.error, groupAccess.status);

    const hwList = await prisma.homework.findMany({
      where: {
        groupId,
        isActive: true,
        ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}),
      },
      orderBy: { dueDate: 'asc' },
      include: {
        lesson: { select: { id: true, title: true } },
        _count: { select: { submissions: true } },
      },
    });

    const isStudent = req.user.role === 'student';
    const result = isStudent
      ? hwList.map(h => ({ ...h, attachments: sanitizeAttachmentsForStudent(h.attachments) }))
      : hwList;

    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getTeacherHomework = async (req, res, next) => {
  try {
    const hw = await prisma.homework.findMany({
      where: {
        teacherId: req.user.userId,
        isActive: true,
        ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        group: { select: { id: true, name: true } },
        _count: { select: { submissions: true } },
      },
    });
    return success(res, hw);
  } catch (err) {
    next(err);
  }
};

const getMyHomework = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { groupId: true },
    });
    if (!user?.groupId) return success(res, []);

    const hwList = await prisma.homework.findMany({
      where: {
        groupId: user.groupId,
        isActive: true,
        ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}),
      },
      orderBy: { dueDate: 'asc' },
      include: {
        lesson: { select: { id: true, title: true } },
        submissions: {
          where: { studentId: req.user.userId },
          select: { id: true, status: true, finalScore: true, aiGrade: true, createdAt: true },
        },
      },
    });

    const sanitized = hwList.map(h => ({
      ...h,
      attachments: sanitizeAttachmentsForStudent(h.attachments),
    }));

    return success(res, sanitized);
  } catch (err) {
    next(err);
  }
};

const getHomeworkById = async (req, res, next) => {
  try {
    const hw = await prisma.homework.findFirst({
      where: {
        id: req.params.id,
        ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}),
      },
      include: {
        group: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
    });
    if (!hw) return error(res, 'Homework not found', 404);

    const groupAccess = await assertGroupAccess(hw.groupId, req.user, prisma);
    if (groupAccess.error) return error(res, groupAccess.error, groupAccess.status);

    const isStudent = req.user.role === 'student';
    const payload = isStudent
      ? { ...hw, attachments: sanitizeAttachmentsForStudent(hw.attachments) }
      : hw;

    return success(res, payload);
  } catch (err) {
    next(err);
  }
};

const submitHomework = async (req, res, next) => {
  try {
    const { homeworkId } = req.params;
    const { answerText, interactiveAnswers, audioUrl, audioRecording } = req.body;

    const hw = await prisma.homework.findFirst({
      where: {
        id: homeworkId,
        ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}),
      },
    });
    if (!hw) return error(res, 'Homework not found', 404);

    const groupAccess = await assertGroupAccess(hw.groupId, req.user, prisma);
    if (groupAccess.error) return error(res, groupAccess.error, groupAccess.status);

    const filePaths = await saveFilesAsAttachments(req.files);
    const submittedAt = new Date();
    const isLate = submittedAt > new Date(hw.dueDate);

    // Check for uploaded audio recording among files
    const audioFile = filePaths.find(
      (f) => f.type?.startsWith('audio/') || f.name?.match(/\.(webm|mp3|wav|ogg|m4a|aac)$/i)
    );
    const effectiveAudioUrl =
      audioUrl || audioRecording || (audioFile ? `/api/files/${audioFile.id}` : null);

    const parsedInteractiveAnswers = safeParseJson(interactiveAnswers, {});

    let effectiveAnswerText = answerText || '';
    if (!effectiveAnswerText && Object.keys(parsedInteractiveAnswers).length > 0) {
      effectiveAnswerText = Object.entries(parsedInteractiveAnswers)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
    }

    const contentPayload = JSON.stringify({
      interactiveAnswers: parsedInteractiveAnswers,
      audioUrl: effectiveAudioUrl,
      audioFileId: audioFile?.id || null,
    });

    const existing = await prisma.submission.findUnique({
      where: { homeworkId_studentId: { homeworkId, studentId: req.user.userId } },
    });

    let submission;
    if (existing) {
      submission = await prisma.submission.update({
        where: { id: existing.id },
        data: {
          answerText: effectiveAnswerText,
          filePaths,
          content: contentPayload,
          isLate,
          submittedAt,
          status: 'submitted',
        },
      });
    } else {
      submission = await prisma.submission.create({
        data: {
          homeworkId,
          studentId: req.user.userId,
          centerId: hw.centerId,
          answerText: effectiveAnswerText,
          filePaths,
          content: contentPayload,
          isLate,
          submittedAt,
          status: 'submitted',
        },
      });

      // Award XP
      try {
        const { awardXP } = require('../services/gamification.service');
        await awardXP(req.user.userId, 20, 'homework_submit');
      } catch (_) {}
    }

    // Trigger Async AI Grading
    setImmediate(async () => {
      try {
        const attachments =
          hw.attachments && typeof hw.attachments === 'object' && !Array.isArray(hw.attachments)
            ? hw.attachments
            : {};

        const category = attachments.category || 'writing';
        const readingPassage = attachments.readingPassage || '';
        const interactiveFields = attachments.interactiveFields || [];
        const answerKey = attachments.answerKey || {};
        const rubric = attachments.suggestedRubric || null;

        let audioBuffer = null;
        let audioMimeType = null;

        if (audioFile?.id) {
          try {
            const uploadedRow = await prisma.uploadedFile.findUnique({
              where: { id: audioFile.id },
              select: { data: true, mimeType: true },
            });
            if (uploadedRow?.data) {
              audioBuffer = uploadedRow.data;
              audioMimeType = uploadedRow.mimeType;
            }
          } catch (e) {
            console.warn('[AI Grading] Could not load audio file buffer:', e.message);
          }
        }

        const aiGrade = await gradeInteractiveHomework({
          homeworkTitle: hw.title,
          description: hw.description || '',
          category,
          readingPassage,
          interactiveFields,
          answerKey,
          rubric,
          studentAnswers: parsedInteractiveAnswers,
          studentAnswerText: effectiveAnswerText,
          audioBuffer,
          audioMimeType,
          maxScore: hw.maxScore || 100,
          centerId: hw.centerId || req.user.centerId || null,
        });

        await prisma.submission.update({
          where: { id: submission.id },
          data: {
            aiGrade,
            status: 'ai_graded',
          },
        });
      } catch (gradeErr) {
        console.error('[Async AI Grading Error]:', gradeErr.message);
      }
    });

    return success(res, submission, 'Submitted');
  } catch (err) {
    next(err);
  }
};

const getSubmissions = async (req, res, next) => {
  try {
    const { homeworkId } = req.params;
    const hw = await prisma.homework.findFirst({
      where: {
        id: homeworkId,
        ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}),
      },
      select: { groupId: true, teacherId: true, attachments: true },
    });
    if (!hw) return error(res, 'Homework not found', 404);
    if (req.user.role === 'teacher' && hw.teacherId !== req.user.userId) {
      return error(res, 'Forbidden', 403);
    }

    const subs = await prisma.submission.findMany({
      where: {
        homeworkId,
        ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}),
      },
      include: {
        student: { select: { id: true, name: true, username: true } },
        homework: { select: { id: true, title: true, dueDate: true, maxScore: true, attachments: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const formatted = subs.map((s) => {
      const parsedContent = safeParseJson(s.content, {});
      return {
        ...s,
        interactiveAnswers: parsedContent.interactiveAnswers || {},
        audioUrl: parsedContent.audioUrl || null,
      };
    });

    return success(res, formatted);
  } catch (err) {
    next(err);
  }
};

const gradeSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { score, feedback } = req.body;

    const existing = await prisma.submission.findFirst({
      where: {
        id,
        ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}),
      },
      include: { homework: { select: { teacherId: true, title: true } } },
    });
    if (!existing) return error(res, 'Submission not found', 404);
    if (req.user.role === 'teacher' && existing.homework.teacherId !== req.user.userId) {
      return error(res, 'Forbidden', 403);
    }

    const sub = await prisma.submission.update({
      where: { id },
      data: { finalScore: score, teacherGrade: { score, feedback }, status: 'graded' },
      include: {
        student: { select: { id: true, name: true } },
        homework: { select: { id: true, title: true } },
      },
    });

    // O'quvchiga bildirishnoma yuborish
    try {
      await prisma.notification.create({
        data: {
          userId: existing.studentId,
          type: 'homework',
          title: 'Uyga vazifangiz baholandi',
          message: `"${existing.homework?.title || 'Uyga vazifa'}" bo'yicha baholandingiz: ${score} ball.${feedback ? " O'qituvchi izohi: " + feedback : ''}`,
          link: '/student/homework',
          centerId: existing.centerId || req.user.centerId || null,
        },
      });
    } catch (_) {}

    return success(res, sub, 'Graded');
  } catch (err) {
    next(err);
  }
};

const updateHomework = async (req, res, next) => {
  try {
    const {
      title,
      description,
      dueDate,
      maxScore,
      category,
      interactiveFields,
      answerKey,
      readingPassage,
      audioUrl,
      allowVoiceRecord,
      suggestedRubric,
    } = req.body;

    const existing = await prisma.homework.findFirst({
      where: {
        id: req.params.id,
        ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}),
      },
      select: { teacherId: true, attachments: true },
    });
    if (!existing) return error(res, 'Homework not found', 404);
    if (req.user.role === 'teacher' && existing.teacherId !== req.user.userId) {
      return error(res, 'Forbidden', 403);
    }

    const existingAtt =
      existing.attachments && typeof existing.attachments === 'object' && !Array.isArray(existing.attachments)
        ? existing.attachments
        : { files: Array.isArray(existing.attachments) ? existing.attachments : [] };

    const updatedAttachments = {
      ...existingAtt,
      ...(category !== undefined && { category }),
      ...(interactiveFields !== undefined && {
        interactiveFields: Array.isArray(safeParseJson(interactiveFields))
          ? safeParseJson(interactiveFields)
          : existingAtt.interactiveFields,
      }),
      ...(answerKey !== undefined && { answerKey: safeParseJson(answerKey, {}) }),
      ...(readingPassage !== undefined && { readingPassage }),
      ...(audioUrl !== undefined && { audioUrl }),
      ...(allowVoiceRecord !== undefined && {
        allowVoiceRecord: allowVoiceRecord === true || allowVoiceRecord === 'true',
      }),
      ...(suggestedRubric !== undefined && { suggestedRubric: safeParseJson(suggestedRubric, null) }),
    };

    const hw = await prisma.homework.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(maxScore && { maxScore: parseInt(maxScore, 10) }),
        attachments: updatedAttachments,
      },
      include: { group: { select: { id: true, name: true } } },
    });

    return success(res, hw, 'Homework updated');
  } catch (err) {
    next(err);
  }
};

const deleteHomework = async (req, res, next) => {
  try {
    const existing = await prisma.homework.findFirst({
      where: {
        id: req.params.id,
        ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}),
      },
      select: { teacherId: true },
    });
    if (!existing) return error(res, 'Homework not found', 404);
    if (req.user.role === 'teacher' && existing.teacherId !== req.user.userId) {
      return error(res, 'Forbidden', 403);
    }
    await prisma.homework.update({ where: { id: req.params.id }, data: { isActive: false } });
    return success(res, null, 'Homework deleted');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /homework/analyze-interactive
 * Analyzes topic, text, description, or uploaded file to generate category,
 * interactive fields (fill-in-the-blank, short answer, multiple choice, voice record),
 * reading passage, answer key, and evaluation rubric.
 */
const analyzeInteractiveHomework = async (req, res, next) => {
  try {
    const { topic, content, text, description, category, language } = req.body;

    let fileText = '';
    if (req.files && req.files.length > 0) {
      const texts = [];
      for (const file of req.files) {
        try {
          const txt = await extractTextFromFile(file);
          if (txt?.trim()) {
            texts.push(`[Fayl: ${file.originalname}]:\n${txt.trim()}`);
          }
        } catch (fErr) {
          console.warn(`[analyzeInteractive] Fayldan matn ajratishda ogohlantirish: ${fErr.message}`);
        }
      }
      fileText = texts.join('\n\n---\n\n');
    }

    const combinedContent = [
      content || text || description || '',
      fileText,
    ].filter(Boolean).join('\n\n====================\n\n');

    if (!topic && !combinedContent) {
      return error(res, 'Mavzu, matn yoki resurs fayli kiritilishi shart', 400);
    }

    const centerId = getCenterId(req) || null;
    const result = await analyzeInteractiveHomeworkAI({
      topic: topic || '',
      content: combinedContent,
      category: category || 'auto',
      language: language || 'uz',
      centerId,
    });

    return success(res, result, 'Interaktiv vazifa muvaffaqiyatli tahlil qilindi');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /homework/generate-answers
 * Automatically solves/generates model answers for all interactive fields.
 */
const generateAnswers = async (req, res, next) => {
  try {
    const { title, description, readingPassage, category, interactiveFields, language } = req.body;
    const parsedFields = safeParseJson(interactiveFields, []);

    if (!Array.isArray(parsedFields) || parsedFields.length === 0) {
      return error(res, 'Kamida bitta interaktiv savol (interactiveFields) kiritilishi shart', 400);
    }

    const centerId = getCenterId(req) || null;
    const result = await generateAnswersAI({
      title: title || '',
      description: description || '',
      readingPassage: readingPassage || '',
      category: category || 'writing',
      interactiveFields: parsedFields,
      language: language || 'uz',
      centerId,
    });

    return success(res, result, "To'g'ri javoblar muvaffaqiyatli shakllantirildi");
  } catch (err) {
    next(err);
  }
};

/**
 * POST /homework/validate-answers
 * Checks teacher-supplied answers for correctness, ambiguities, or contradictions.
 */
const validateAnswers = async (req, res, next) => {
  try {
    const { title, description, readingPassage, category, interactiveFields, answerKey, language } = req.body;

    const parsedFields = safeParseJson(interactiveFields, []);
    const parsedKey = safeParseJson(answerKey, {});

    const centerId = getCenterId(req) || null;
    const result = await validateAnswersAI({
      title: title || '',
      description: description || '',
      readingPassage: readingPassage || '',
      category: category || 'writing',
      interactiveFields: Array.isArray(parsedFields) ? parsedFields : [],
      answerKey: parsedKey || {},
      language: language || 'uz',
      centerId,
    });

    return success(res, result, 'Javoblar tekshirildi va tahlil qilindi');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /homework/generate-ai (Legacy format support)
 */
const generateHomeworkAI = async (req, res, next) => {
  try {
    const { topic, lessonId, taskCount, difficulty, language, homeworkFormat } = req.body;
    let effectiveTopic = topic;
    let lessonContent = '';

    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { title: true, content: true },
      });
      if (lesson) {
        if (!effectiveTopic) effectiveTopic = lesson.title;
        lessonContent = lesson.content || '';
      }
    }

    if (!effectiveTopic) {
      return error(res, 'Mavzu (topic) yoki dars (lessonId) kiritilishi shart', 400);
    }

    const { getModel } = require('../config/gemini');
    const { getHomeworkGenerationPrompt } = require('../services/ai/prompts');

    const prompt = getHomeworkGenerationPrompt(
      effectiveTopic,
      lessonContent,
      parseInt(taskCount, 10) || 3,
      difficulty || 'medium',
      language || 'uz',
      homeworkFormat || 'standard'
    );

    const model = getModel(true);
    const result = await model.generateContent(prompt);
    let cleaned = (result?.response?.text ? result.response.text() : '').trim();
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    return success(res, parsed, 'AI vazifa taklifini muvaffaqiyatli shakllantirdi');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createHomework,
  getHomeworkByGroup,
  getTeacherHomework,
  getMyHomework,
  getHomeworkById,
  submitHomework,
  getSubmissions,
  gradeSubmission,
  updateHomework,
  deleteHomework,
  analyzeInteractiveHomework,
  generateAnswers,
  validateAnswers,
  generateHomeworkAI,
};
