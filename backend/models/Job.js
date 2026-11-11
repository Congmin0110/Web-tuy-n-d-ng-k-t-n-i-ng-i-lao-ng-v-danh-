/*
 * FILE: backend/models/Job.js
 * Tin tuyển dụng do nhà tuyển dụng đăng, admin duyệt trước khi hiện ra trang chủ.
 */

const mongoose = require('mongoose');

// === KHU VỰC 1: CẤU TRÚC TIN TUYỂN DỤNG ===
const jobSchema = new mongoose.Schema(
  {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: { type: String, required: true, trim: true },
    companyName: { type: String, default: '' },
    description: { type: String, required: true },
    requirements: { type: String, default: '' },
    salaryMin: { type: Number, default: 0 },
    salaryMax: { type: Number, default: 0 },
    location: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    // pending: chờ duyệt | approved: đang hiện | rejected: đã ẩn (tin giả / không đạt)
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectReason: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);
