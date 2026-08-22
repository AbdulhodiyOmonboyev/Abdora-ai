const { prisma } = require('../config/db');

// Saves each multer memory-storage file as an UploadedFile row and returns
// the attachment metadata shape used in Lesson.attachments/Homework.attachments
// JSON fields: {name, id, type} - 'id' points at /api/files/:id to fetch it.
const saveFilesAsAttachments = async (files) => {
  const list = files || [];
  const saved = [];
  for (const f of list) {
    const row = await prisma.uploadedFile.create({
      data: { name: f.originalname, mimeType: f.mimetype, data: f.buffer },
    });
    saved.push({ name: f.originalname, id: row.id, type: f.mimetype });
  }
  return saved;
};

module.exports = { saveFilesAsAttachments };
