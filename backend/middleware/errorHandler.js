// ── Global Error Handler ──────────────────────────────────────────────────────
// Mounted LAST in server.js as app.use(errorHandler)
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err.message);

  // Multer file errors
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }

  // Custom file-filter errors from upload.js
  if (err.message?.includes('Only')) {
    return res.status(400).json({ message: err.message });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join('. ') });
  }

  // Mongoose duplicate key (e.g. unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ message: `${field} is already in use.` });
  }

  // Mongoose cast error (bad ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal server error.',
  });
};

module.exports = errorHandler;