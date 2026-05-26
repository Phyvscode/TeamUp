import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';

import connectDB    from './config/db';
import errorHandler from './middleware/errorHandler';

import authRoutes         from './routes/authRoutes';
import profileRoutes      from './routes/profileRoutes';
import applicationRoutes  from './routes/applicationRoutes';
import interviewRoutes    from './routes/interviewRoutes';
import messageRoutes      from './routes/messageRoutes';
import notificationRoutes from './routes/notificationRoutes';
import userRoutes         from './routes/userRoutes';
import taskRoutes         from './routes/taskRoutes';
import recruiterRoutes    from './routes/recruiterRoutes';

const app: Application = express();
const PORT = process.env.PORT || 5000;

// ── CORS ──────────────────────────────────────────────────────────────────────
const corsOptions: cors.CorsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8080',
  ],
  credentials: true,
};

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static files — CORS headers + correct Content-Type for PDFs ───────────────
app.use(
  '/uploads',
  (req: Request, res: Response, next: express.NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    if (req.path.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
    }

    next();
  },
  express.static(path.join(__dirname, 'uploads'))
);

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/profile',       profileRoutes);
app.use('/api/applications',  applicationRoutes);
app.use('/api/interviews',    interviewRoutes);
app.use('/api/messages',      messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/tasks',         taskRoutes);
app.use('/api/recruiter',     recruiterRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status:    'ok',
    uptime:    process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
});

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const start = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) {
    console.error('❌  MONGODB_URI is not set. Copy .env.example → .env and fill it in.');
    process.exit(1);
  }

  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n🚀  Server running  →  http://localhost:${PORT}`);
    console.log(`📡  API base        →  http://localhost:${PORT}/api\n`);
  });
};

start();