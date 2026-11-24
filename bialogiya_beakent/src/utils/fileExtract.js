const { safeJsonParse } = require('./sanitizeAiText');

/**
 * Extracts text content from uploaded files (PDF, DOCX, TXT, images).
 * @param {Object} file - Multer file object with buffer, mimetype, originalname
 * @returns {Promise<string>} Extracted text
 */
const extractTextFromFile = async (file) => {
  if (!file || !file.buffer) return '';
  const mime = file.mimetype || '';

  // Plain text / Markdown
  if (mime === 'text/plain' || mime === 'text/markdown' || mime === 'application/json' || file.originalname?.match(/\.(txt|md|json)$/i)) {
    return file.buffer.toString('utf8');
  }

  // PDF — pdf-parse v2
  if (mime === 'application/pdf' || file.originalname?.match(/\.pdf$/i)) {
    try {
      const { PDFParse } = require('pdf-parse');
      const parser = new PDFParse({ data: new Uint8Array(file.buffer) });
      try {
        const result = await parser.getText();
        return (result.pages || []).map(p => p.text).join('\n\n') || result.text || '';
      } finally {
        await parser.destroy().catch(() => {});
      }
    } catch (pdfErr) {
      console.warn('[fileExtract] PDF extraction error:', pdfErr.message);
      return '';
    }
  }

  // DOCX / DOC
  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/msword' ||
    file.originalname?.match(/\.(docx|doc)$/i)
  ) {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value || '';
    } catch (docErr) {
      console.warn('[fileExtract] DOCX extraction error:', docErr.message);
      return '';
    }
  }

  // Images — Gemini vision
  if (mime.startsWith('image/')) {
    try {
      const { getModel } = require('../config/gemini');
      const model = getModel(false);
      const imagePart = { inlineData: { data: file.buffer.toString('base64'), mimeType: mime } };
      const result = await model.generateContent([
        'Ushbu rasmning barcha matnini, topshiriqlarini va ta\'limiy mazmunini aniq chiqarib ber.',
        imagePart,
      ]);
      return result?.response?.text ? result.response.text() : '';
    } catch (imgErr) {
      console.warn('[fileExtract] Image text extraction error:', imgErr.message);
      return '';
    }
  }

  return '';
};

module.exports = { extractTextFromFile };
