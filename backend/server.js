import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import connectDB from './config/db.js';
import v1Router from './routes/index.js';
import { generalLimiter } from './shared/middlewares/rateLimiter.js';

// Load environment variables BEFORE anything else
dotenv.config();

// Connect to database
connectDB();

const app = express();

// ─── Trust proxy (nếu deploy sau nginx/load balancer) ─────────────────────────
app.set('trust proxy', 1);

// ─── HTTP Security Headers (helmet) ───────────────────────────────────────────
app.use(helmet());

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

// ─── Body Parser với giới hạn kích thước (chống DoS payload lớn) ──────────────
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── NoSQL Injection Sanitizer (loại bỏ $ và . trong req.body/params/query) ───
app.use(mongoSanitize());

// ─── Global Rate Limiter (10 req/phút mọi route) ─────────────────────────────
app.use('/api', generalLimiter);

// ─── Health check ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({ status: 'ok', message: 'UTESHOP API is running 🚀' }));

// ─── API v1 Routes ─────────────────────────────────────────────────────────────
app.use('/api/v1', v1Router);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// ─── Global Error Handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[UNHANDLED ERROR]', err);
  // Không lộ stack trace ra production
  const isDev = process.env.NODE_ENV === 'development';
  res.status(err.status ?? 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(isDev && { stack: err.stack }),
  });
});

// ─── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` UTESHOP API running on port ${PORT} [${process.env.NODE_ENV ?? 'development'}]`);
});