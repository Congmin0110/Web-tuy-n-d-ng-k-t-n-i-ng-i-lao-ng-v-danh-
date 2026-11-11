/*
 * FILE: backend/routes/authRoutes.js
 * Đăng ký, đăng nhập và lấy thông tin người đang đăng nhập.
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, JWT_SECRET } = require('../middleware/authMiddleware');

const router = express.Router();

// === KHU VỰC 1: HÀM DÙNG CHUNG ===
function taoToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function thongTinCongKhai(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    companyName: user.companyName || '',
    cvLink: user.cvLink || ''
  };
}

// === KHU VỰC 2: ĐĂNG KÝ ===
async function dangKy(req, res) {
  try {
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    const phone = (req.body.phone || '').trim();
    const companyName = (req.body.companyName || '').trim();
    const role = req.body.role === 'employer' ? 'employer' : 'user';

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập họ tên, email và mật khẩu.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu cần ít nhất 6 ký tự.' });
    }

    if (role === 'employer' && !companyName) {
      return res.status(400).json({ message: 'Nhà tuyển dụng cần nhập tên doanh nghiệp.' });
    }

    const daTonTai = await User.findOne({ email });
    if (daTonTai) {
      return res.status(400).json({ message: 'Email này đã được đăng ký.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: passwordHash,
      role,
      phone,
      companyName: role === 'employer' ? companyName : ''
    });

    return res.status(201).json({
      message: 'Đăng ký thành công.',
      token: taoToken(user),
      user: thongTinCongKhai(user)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Không đăng ký được. Vui lòng thử lại.' });
  }
}

// === KHU VỰC 3: ĐĂNG NHẬP ===
async function dangNhap(req, res) {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu chưa đúng.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa. Liên hệ quản trị viên.' });
    }

    const khopMatKhau = await bcrypt.compare(password, user.password);
    if (!khopMatKhau) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu chưa đúng.' });
    }

    return res.json({
      message: 'Đăng nhập thành công.',
      token: taoToken(user),
      user: thongTinCongKhai(user)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Không đăng nhập được. Vui lòng thử lại.' });
  }
}

// === KHU VỰC 4: THÔNG TIN TÀI KHOẢN HIỆN TẠI ===
function thongTinCuaToi(req, res) {
  return res.json({ user: thongTinCongKhai(req.user) });
}

router.post('/register', dangKy);
router.post('/login', dangNhap);
router.get('/me', protect, thongTinCuaToi);

module.exports = router;
