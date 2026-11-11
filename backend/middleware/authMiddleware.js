/*
 * FILE: backend/middleware/authMiddleware.js
 * Kiểm tra JWT và chặn người không đúng vai trò.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Trên Render nên khai báo JWT_SECRET. Nếu quên, hệ thống vẫn chạy được khi bảo vệ đồ án.
const JWT_SECRET = process.env.JWT_SECRET || 'do-an-tuyen-dung-secret';

// === KHU VỰC 1: XÁC THỰC TOKEN ===
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';

    if (!token) {
      return res.status(401).json({ message: 'Bạn cần đăng nhập.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Tài khoản không còn tồn tại.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
}

// === KHU VỰC 2: KIỂM TRA ĐÚNG ROLE ===
// Dùng sau protect. Ví dụ: protect, requireRole('employer')
function requireRole(...roles) {
  return function kiemTraRole(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: 'Bạn cần đăng nhập.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này.' });
    }

    next();
  };
}

module.exports = { protect, requireRole, JWT_SECRET };
