import './config/loadEnv.js';
import express, { Request, Response, NextFunction } from 'express';
import http from 'node:http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import connectDB from './config/db.js';
import v1Router from './routes/index.js';
import './modules/order/services/order.events.js';
import { generalLimiter } from './shared/middlewares/rateLimiter.js';
import { UPLOADS_DIR } from './shared/middlewares/uploadImage.js';
import { initializeChatSocket } from './modules/chat/socket/chat.socket.js';

// Connect to database
connectDB();

const app = express();
const httpServer = http.createServer(app);

// ─── Trust proxy (nếu deploy sau nginx/load balancer) ─────────────────────────
app.set('trust proxy', 1);

// ─── HTTP Security Headers (helmet) ───────────────────────────────────────────
app.use(helmet());

// ─── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
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

// ─── Static uploads ───────────────────────────────────────────────────────────
app.use('/uploads', express.static(UPLOADS_DIR));

// ─── Health check ──────────────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => res.json({ status: 'ok', message: 'UTESHOP API is running 🚀' }));

// ─── API v1 Routes ─────────────────────────────────────────────────────────────
app.use('/api/v1', v1Router);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => res.status(404).json({ success: false, message: 'Route not found.' }));

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
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
initializeChatSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(` UTESHOP API running on port ${PORT} [${process.env.NODE_ENV ?? 'development'}]`);
});
