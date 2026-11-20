const { getModel, getModelAsync } = require('../../config/gemini');
const { getGradingPrompt, getResultAnalysisPrompt, getTestInsightsPrompt } = require('./prompts');
const { safeJsonParse } = require('../../utils/sanitizeAiText');

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

module.exports = { gradeHomework, analyzeTestResults, analyzeTestForTeacher, safeJsonParse };
