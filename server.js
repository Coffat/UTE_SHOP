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

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json()); // Parse JSON payloads
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded payloads

// IMPORT ROUTES 
const authRoutes = require('./routes/auth.routes'); 

// Basic test route
app.get('/', (req, res) => {
  res.send('UTESHOP API is running...');
});

// DEFINE ROUTES 
app.use('/api/auth', authRoutes); 

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});