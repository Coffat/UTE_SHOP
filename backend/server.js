import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import v1Router from './routes/index.js';

// Load environment variables BEFORE anything else
dotenv.config();

// Connect to database
connectDB();

const app = express();

// ─── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
    : []),
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // Postman / curl
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin not allowed – ${origin}`));
    },
    credentials: true,
  })
);

// ─── Global Middlewares ────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health check ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({ status: 'ok', message: 'UTESHOP API is running 🚀' }));

// ─── API v1 Routes ─────────────────────────────────────────────────────────────
app.use('/api/v1', v1Router);

// ─── Global Error Handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[UNHANDLED ERROR]', err);
  res.status(err.status ?? 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ─── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 UTESHOP API running on port ${PORT}`);
  console.log(`   Docs: http://localhost:${PORT}/api/v1`);
});