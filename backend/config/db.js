const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (typeof uri !== 'string' || !uri.trim()) {
    console.error(
      'Missing MONGO_URI. Tạo file backend/.env (xem .env.example) và set MONGO_URI=mongodb://...'
    );
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
