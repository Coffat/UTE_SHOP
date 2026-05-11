const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please add a full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    is_active: {
      type: Boolean,
      default: false,
    },
    otp_code: {
      type: String,
      default: null,
    },
    otp_expires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically creates 'createdAt' and 'updatedAt' fields
  }
);

module.exports = mongoose.model('User', userSchema);
