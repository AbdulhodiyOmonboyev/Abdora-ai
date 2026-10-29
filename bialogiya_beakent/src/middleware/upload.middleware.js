const multer = require('multer');

const allowedMimes = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'video/mp4', 'video/webm',
  'text/plain',
];

// Memory storage for lesson/homework attachments and submissions - same
// reasoning as resourceUpload below: Render's disk is ephemeral, so files
// must end up as DB bytes (via UploadedFile), never written to disk.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Fayl turiga ruxsat berilmagan: ${file.mimetype}`), false);
  }
};

const maxSize = parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024;

const upload = multer({ storage, fileFilter, limits: { fileSize: maxSize } });

// Memory storage for AI file processing (PDF, DOCX, TXT, images)
const aiFileMimes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
];

const fileUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (aiFileMimes.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`Qo'llab-quvvatlanmaydigan fayl turi: ${file.mimetype}`), false);
  },
  limits: { fileSize: maxSize },
});

// Memory storage for Resources — Render's free web service disk is ephemeral
// (wiped on every restart/deploy), so uploaded files are stored as DB bytes instead.
const resourceUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: maxSize },
});

// Memory storage for voice-clone sample uploads (short audio recordings)
const audioMimes = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave',
  'audio/webm', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/ogg',
  'audio/aac', 'audio/x-aac', 'audio/flac', 'audio/x-flac', 'video/webm'
];
const voiceSampleUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const rawMime = (file.mimetype || '').toLowerCase();
    const cleanMime = rawMime.split(';')[0].trim();
    const ext = (file.originalname || '').split('.').pop().toLowerCase();
    const allowedExts = ['mp3', 'wav', 'm4a', 'webm', 'ogg', 'aac', 'flac', 'mp4'];

    if (
      cleanMime.startsWith('audio/') ||
      audioMimes.includes(cleanMime) ||
      rawMime.includes('webm') ||
      rawMime.includes('ogg') ||
      allowedExts.includes(ext)
    ) {
      cb(null, true);
    } else {
      const err = new Error(`Qo'llab-quvvatlanmaydigan audio turi: ${file.mimetype || ext}. MP3, WAV, M4A yoki WEBM formatidagi audio yuklang.`);
      err.statusCode = 400;
      cb(err, false);
    }
  },
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

module.exports = upload;
module.exports.pdfUpload = fileUpload;
module.exports.fileUpload = fileUpload;
module.exports.resourceUpload = resourceUpload;
module.exports.voiceSampleUpload = voiceSampleUpload;
