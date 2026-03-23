const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

// ── Avatar ────────────────────────────────────────────────────────────────────
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/avatars');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `avatar-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const imageFilter = (req, file, cb) => {
  ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Only JPEG, PNG, or WebP images are allowed.'), false);
};

// ── Company logo ──────────────────────────────────────────────────────────────
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/logos');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `logo-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// ── Resume ────────────────────────────────────────────────────────────────────
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/resumes');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `resume-${req.user._id}-${Date.now()}.pdf`);
  },
});

const resumeFilter = (req, file, cb) => {
  file.mimetype === 'application/pdf'
    ? cb(null, true)
    : cb(new Error('Only PDF files are allowed for resumes.'), false);
};

module.exports = {
  uploadAvatar:      multer({ storage: avatarStorage, fileFilter: imageFilter, limits: { fileSize: 5  * 1024 * 1024 } }),
  uploadCompanyLogo: multer({ storage: logoStorage,   fileFilter: imageFilter, limits: { fileSize: 5  * 1024 * 1024 } }),
  uploadResume:      multer({ storage: resumeStorage, fileFilter: resumeFilter, limits: { fileSize: 10 * 1024 * 1024 } }),
};