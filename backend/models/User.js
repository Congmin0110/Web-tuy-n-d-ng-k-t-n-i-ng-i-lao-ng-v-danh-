/*
 * FILE: backend/models/User.js
 * Tài khoản dùng chung cho ứng viên, nhà tuyển dụng và quản trị.
 */

const mongoose = require('mongoose');

// === KHU VỰC 1: CẤU TRÚC TÀI KHOẢN ===
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['user', 'employer', 'admin'],
      default: 'user'
    },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    // Nhà tuyển dụng điền tên công ty. Ứng viên có thể để trống.
    companyName: { type: String, default: '' },
    // Ứng viên lưu link CV để nộp nhanh cho nhiều tin.
    cvLink: { type: String, default: '' },
    skills: { type: String, default: '' },
    bio: { type: String, default: '' },
    // Admin khóa tài khoản vi phạm. Tài khoản khóa không đăng nhập được.
    isBlocked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
