import multer, { FileFilterCallback, StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// ── Utility: create directory if it doesn't exist ─────────────────────────────
const ensureDir = (dir: string): void => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// ── Avatar storage ────────────────────────────────────────────────────────────
const avatarStorage: StorageEngine = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const dir = path.join(__dirname, '../uploads/avatars');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const userId = (req as any).user?._id ?? 'unknown';
    cb(null, `avatar-${userId}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// ── Company logo storage ──────────────────────────────────────────────────────
const logoStorage: StorageEngine = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const dir = path.join(__dirname, '../uploads/logos');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const userId = (req as any).user?._id ?? 'unknown';
    cb(null, `logo-${userId}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// ── Resume storage ────────────────────────────────────────────────────────────
const resumeStorage: StorageEngine = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const dir = path.join(__dirname, '../uploads/resumes');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const userId = (req as any).user?._id ?? 'unknown';
    cb(null, `resume-${userId}-${Date.now()}.pdf`);
  },
});

// ── File filters ──────────────────────────────────────────────────────────────
const imageFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, or WebP images are allowed.'));
  }
};

const resumeFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed for resumes.'));
  }
};

// ── Exported multer instances ─────────────────────────────────────────────────
export const uploadAvatar = multer({
  storage:    avatarStorage,
  fileFilter: imageFilter,
  limits:     { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

export const uploadCompanyLogo = multer({
  storage:    logoStorage,
  fileFilter: imageFilter,
  limits:     { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

export const uploadResume = multer({
  storage:    resumeStorage,
  fileFilter: resumeFilter,
  limits:     { fileSize: 10 * 1024 * 1024 }, // 10 MB
});