const { getModel, getModelAsync } = require('../../config/gemini');
const {
  getGradingPrompt,
  getResultAnalysisPrompt,
  getTestInsightsPrompt,
  getInteractiveHomeworkAnalysisPrompt,
  getGenerateAnswersPrompt,
  getValidateAnswersPrompt,
  getInteractiveGradingPrompt,
} = require('./prompts');
const { safeJsonParse } = require('../../utils/sanitizeAiText');

/**
 * Legacy gradeHomework for simple string submissions.
 */
const gradeHomework = async (homeworkTitle, description, studentAnswer, maxScore = 100, centerId = null) => {
  try {
    const prompt = `You are an expert teacher. Grade student work fairly and constructively. Always respond in valid JSON.\n\n${getGradingPrompt(homeworkTitle, description, studentAnswer, maxScore)}`;
    const model = await getModelAsync({ jsonMode: true, centerId });
    const result = await model.generateContent(prompt);
    const rawText = result?.response?.text ? result.response.text() : String(result || '');
    const parsed = safeJsonParse(rawText, null);

    if (parsed && typeof parsed === 'object') {
      const rawScore = Number(parsed.score);
      const validScore = Number.isFinite(rawScore) ? Math.min(Math.max(0, Math.round(rawScore)), maxScore) : 0;
      return {
        score: validScore,
        feedback: parsed.feedback || "Javob ko'rib chiqildi.",
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        keyMissingConcepts: Array.isArray(parsed.keyMissingConcepts) ? parsed.keyMissingConcepts : [],
      };
    }

    throw new Error('AI grading result could not be parsed as valid JSON');
  } catch (err) {
    console.error('Grading error:', err.message);
    return { score: 0, feedback: 'AI grading unavailable. Teacher will review manually.', suggestions: [] };
  }
};

/**
 * Fallback deterministic grading when AI API is unavailable.
 */
const calculateDeterministicGrade = ({
  interactiveFields = [],
  answerKey = {},
  studentAnswers = {},
  maxScore = 100,
}) => {
  const fields = Array.isArray(interactiveFields) ? interactiveFields : [];
  let totalAssignedPoints = 0;
  let earnedPoints = 0;

  const fieldGrades = fields.map((f, idx) => {
    const fId = f.id || `field_${idx + 1}`;
    const fieldMax = Number(f.points) || 10;
    totalAssignedPoints += fieldMax;

    const expected = String(answerKey[fId] || f.expectedAnswer || '').trim().toLowerCase();
    const actual = String(studentAnswers[fId] || '').trim().toLowerCase();

    let isCorrect = false;
    let earned = 0;
    let feedback = '';

    if (!actual) {
      feedback = "Javob berilmagan.";
    } else if (expected && actual === expected) {
      isCorrect = true;
      earned = fieldMax;
      feedback = "To'liq to'g'ri javob!";
    } else if (expected && (actual.includes(expected) || expected.includes(actual))) {
      isCorrect = true;
      earned = Math.round(fieldMax * 0.7);
      feedback = "Qisman to'g'ri.";
    } else if (f.type === 'voice_record') {
      earned = Math.round(fieldMax * 0.8);
      isCorrect = true;
      feedback = "Ovozli topshiriq muvaffaqiyatli topshirildi.";
    } else {
      feedback = "Kutilgan javob bilan mos kelmadi.";
    }

    earnedPoints += earned;

    return {
      fieldId: fId,
      score: earned,
      maxScore: fieldMax,
      isCorrect,
      feedback,
      studentAnswer: studentAnswers[fId] || '',
      expectedAnswer: answerKey[fId] || f.expectedAnswer || '',
    };
  });

  const finalScore = totalAssignedPoints > 0
    ? Math.min(maxScore, Math.round((earnedPoints / totalAssignedPoints) * maxScore))
    : Math.min(maxScore, earnedPoints);

  return {
    score: finalScore,
    feedback: "Topshiriq ko'rib chiqildi. Harakat va faolligingiz uchun rahmat!",
    fieldGrades,
    suggestions: ["Mavzuni mustahkamlash uchun qoidalarni yana bir bor takrorlang."],
  };
};

/**
 * Comprehensive interactive homework auto-grader.
 * Handles interactive input fields, answerKey, and audio recordings for reading/speaking.
 */
const gradeInteractiveHomework = async ({
  homeworkTitle,
  description = '',
  category = 'writing',
  readingPassage = '',
  interactiveFields = [],
  answerKey = {},
  rubric = null,
  studentAnswers = {},
  studentAnswerText = '',
  audioBuffer = null,
  audioMimeType = null,
  audioTranscript = '',
  maxScore = 100,
  centerId = null,
  language = 'uz',
}) => {
  try {
    const prompt = getInteractiveGradingPrompt({
      homeworkTitle,
      description,
      category,
      readingPassage,
      interactiveFields,
      answerKey,
      rubric,
      studentAnswers,
      studentAnswerText,
      audioTranscript,
      maxScore,
      language,
    });

    const model = await getModelAsync({ jsonMode: true, centerId });

    const contentParts = [
      `You are an expert interactive grader. Grade student submission accurately and constructively. Always respond in valid JSON.\n\n${prompt}`,
    ];

    // If audio buffer is supplied (reading/speaking audio recording), pass it to Gemini multimodal
    if (audioBuffer && audioBuffer.length > 0) {
      contentParts.push({
        inlineData: {
          data: audioBuffer.toString('base64'),
          mimeType: audioMimeType || 'audio/webm',
        },
      });
    }

    const result = await model.generateContent(contentParts);
    const rawText = result?.response?.text ? result.response.text() : String(result || '');
    const parsed = safeJsonParse(rawText, null);

    if (parsed && typeof parsed === 'object') {
      const rawScore = Number(parsed.score);
      const validScore = Number.isFinite(rawScore)
        ? Math.min(Math.max(0, Math.round(rawScore)), maxScore)
        : 0;

      return {
        score: validScore,
        feedback: parsed.feedback || "Topshiriq tahlil qilindi.",
        fieldGrades: Array.isArray(parsed.fieldGrades) ? parsed.fieldGrades : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        rubricScores: parsed.rubricScores || null,
      };
    }

    throw new Error('Interactive grading AI response could not be parsed');
  } catch (err) {
    console.warn('[gradeInteractiveHomework] AI failed or unconfigured, falling back to deterministic grading:', err.message);
    return calculateDeterministicGrade({
      interactiveFields,
      answerKey,
      studentAnswers,
      maxScore,
    });
  }
};

/**
 * Analyzes topic, text, or file content and generates interactive homework structure.
 */
const analyzeInteractiveHomeworkAI = async ({
  topic = '',
  content = '',
  category = 'auto',
  language = 'uz',
  centerId = null,
}) => {
  const prompt = getInteractiveHomeworkAnalysisPrompt({
    topic,
    content,
    category,
    language,
  });

  const model = await getModelAsync({ jsonMode: true, centerId });
  const result = await model.generateContent(prompt);
  const rawText = result?.response?.text ? result.response.text() : String(result || '');
  const parsed = safeJsonParse(rawText, null);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI tahlil natijasini JSON formatida qaytarmadi');
  }

  // Ensure required fields exist
  return {
    title: parsed.title || topic || 'Interaktiv Uy Vazifasi',
    category: parsed.category || (category !== 'auto' ? category : 'writing'),
    description: parsed.description || '',
    readingPassage: parsed.readingPassage || '',
    audioUrl: parsed.audioUrl || '',
    allowVoiceRecord: !!parsed.allowVoiceRecord,
    interactiveFields: Array.isArray(parsed.interactiveFields) ? parsed.interactiveFields : [],
    generatedAnswerKey: parsed.generatedAnswerKey || {},
    suggestedRubric: parsed.suggestedRubric || null,
  };
};

/**
 * Fills in answerKey and expected answers for interactive fields.
 */
const generateAnswersAI = async ({
  title = '',
  description = '',
  readingPassage = '',
  category = 'writing',
  interactiveFields = [],
  language = 'uz',
  centerId = null,
}) => {
  const prompt = getGenerateAnswersPrompt({
    title,
    description,
    readingPassage,
    category,
    interactiveFields,
    language,
  });

  const model = await getModelAsync({ jsonMode: true, centerId });
  const result = await model.generateContent(prompt);
  const rawText = result?.response?.text ? result.response.text() : String(result || '');
  const parsed = safeJsonParse(rawText, null);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI to\'g\'ri javoblarni shakllantira olmadi');
  }

  return {
    answerKey: parsed.answerKey || {},
    interactiveFields: Array.isArray(parsed.interactiveFields) ? parsed.interactiveFields : interactiveFields,
  };
};

/**
 * Validates teacher's answers and detects potential issues.
 */
const validateAnswersAI = async ({
  title = '',
  description = '',
  readingPassage = '',
  category = 'writing',
  interactiveFields = [],
  answerKey = {},
  language = 'uz',
  centerId = null,
}) => {
  const prompt = getValidateAnswersPrompt({
    title,
    description,
    readingPassage,
    category,
    interactiveFields,
    answerKey,
    language,
  });

  const model = await getModelAsync({ jsonMode: true, centerId });
  const result = await model.generateContent(prompt);
  const rawText = result?.response?.text ? result.response.text() : String(result || '');
  const parsed = safeJsonParse(rawText, null);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI javoblarni tekshira olmadi');
  }

  return {
    isValid: parsed.isValid !== false,
    feedback: parsed.feedback || "Javoblar tekshirildi.",
    issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
  };
};

const analyzeTestResults = async (testTitle, wrongQuestions, correctTopics, language = 'uz') => {
  try {
    const prompt = `You are an expert educational analyst. Always respond in valid JSON.\n\n${getResultAnalysisPrompt(testTitle, wrongQuestions, correctTopics, language)}`;
    const model = getModel(true);
    const result = await model.generateContent(prompt);
    const rawText = result?.response?.text ? result.response.text() : String(result || '');
    const parsed = safeJsonParse(rawText, null);
    if (parsed && typeof parsed === 'object') return parsed;
    return { weakTopics: [], strongTopics: correctTopics, studyRecommendations: ['Review all topics carefully'] };
  } catch (err) {
    console.error('Analysis error:', err.message);
    return { weakTopics: [], strongTopics: correctTopics, studyRecommendations: ['Review all topics carefully'] };
  }
};

const analyzeTestForTeacher = async (testTitle, questionStats, classAverage, language = 'uz') => {
  try {
    const prompt = getTestInsightsPrompt(testTitle, questionStats, classAverage, language);
    const model = getModel(true);
    const result = await model.generateContent(prompt);
    const rawText = result?.response?.text ? result.response.text() : String(result || '');
    return safeJsonParse(rawText, null);
  } catch (err) {
    console.error('Test insights error:', err.message);
    return null;
  }
};

module.exports = {
  gradeHomework,
  gradeInteractiveHomework,
  analyzeInteractiveHomeworkAI,
  generateAnswersAI,
  validateAnswersAI,
  calculateDeterministicGrade,
  analyzeTestResults,
  analyzeTestForTeacher,
  safeJsonParse,
};
