require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const morgan       = require('morgan');
const path         = require('path');
const connectDB    = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes         = require('./routes/authRoutes');
const profileRoutes      = require('./routes/profileRoutes');
const applicationRoutes  = require('./routes/applicationRoutes');
const interviewRoutes    = require('./routes/interviewRoutes');
const messageRoutes      = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const usersRoutes        = require('./routes/userRoutes');
const taskRoutes         = require('./routes/taskRoutes');        // ← NEW

const app  = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8080',
  ],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static files — apply CORS + correct Content-Type for PDFs ────────────────
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.path.endsWith('.pdf')) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
  }

  next();
}, express.static(path.join(__dirname, 'uploads')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/profile',       profileRoutes);
app.use('/api/applications',  applicationRoutes);
app.use('/api/interviews',    interviewRoutes);
app.use('/api/messages',      messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users',         usersRoutes);
app.use('/api/tasks',         taskRoutes);                        // ← NEW

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

const start = async () => {
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