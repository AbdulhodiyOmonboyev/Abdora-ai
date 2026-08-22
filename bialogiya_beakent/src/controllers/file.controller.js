const { prisma } = require('../config/db');
const { error } = require('../utils/apiResponse');

// GET /api/files/:id - streams a previously uploaded lesson/homework
// attachment or submission file. Any authenticated user can fetch by id
// (the id itself is unguessable and only ever handed out inside a
// lesson/homework payload the person is already allowed to see).
const getFile = async (req, res, next) => {
  try {
    const file = await prisma.uploadedFile.findUnique({ where: { id: req.params.id } });
    if (!file) return error(res, 'File not found', 404);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': file.data.length,
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.name)}"`,
      'Cache-Control': 'private, max-age=86400',
    });
    res.send(file.data);
  } catch (err) { next(err); }
};

module.exports = { getFile };
