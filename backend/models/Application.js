/*
 * FILE: backend/models/Application.js
 * Hồ sơ ứng tuyển: nối một ứng viên với một tin và lưu lịch phỏng vấn.
 */

const mongoose = require('mongoose');

// === KHU VỰC 1: CẤU TRÚC ĐƠN ỨNG TUYỂN ===
const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    cvLink: { type: String, required: true },
    note: { type: String, default: '' },
    // pending: mới nộp | reviewed: đã xem | interview: có lịch | accepted / rejected: kết quả
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'interview', 'accepted', 'rejected'],
      default: 'pending'
    },
    interviewDate: { type: Date, default: null },
    interviewNote: { type: String, default: '' }
  },
  { timestamps: true }
);

// Mỗi ứng viên chỉ nộp một lần cho cùng một tin.
applicationSchema.index({ jobId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
