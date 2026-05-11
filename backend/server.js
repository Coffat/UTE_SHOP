const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware — SPA gửi cookie: origin phải khớp chính xác (kể cả localhost vs 127.0.0.1)
const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];
const extraOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  : [];
const allowOrigin = [...new Set([...defaultOrigins, ...extraOrigins])];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (allowOrigin.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin not allowed: ${origin}`));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json()); // Parse JSON payloads
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded payloads

// IMPORT ROUTES
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

// Basic test route
app.get('/', (req, res) => {
  res.send('UTESHOP API is running...');
});

// DEFINE ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});