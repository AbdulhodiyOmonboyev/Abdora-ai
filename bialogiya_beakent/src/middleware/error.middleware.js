const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: "Tekshiruv xatosi", errors: messages });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, message: `${field} allaqachon mavjud` });
  }

  if (err.code === 'P2002') {
    const fields = err.meta?.target || [];
    const field = fields.includes('email') ? 'email' : fields.join(', ') || 'field';
    return res.status(409).json({ success: false, message: `${field} allaqachon mavjud` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: "ID formati noto'g'ri" });
  }

  if (err.message && (err.message.includes("Fayl turiga ruxsat berilmagan") || err.message.includes("Qo'llab-quvvatlanmaydigan audio turi"))) {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: "Fayl hajmi ruxsat etilgan limitdan katta" });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server xatosi',
  });
};

module.exports = errorHandler;
