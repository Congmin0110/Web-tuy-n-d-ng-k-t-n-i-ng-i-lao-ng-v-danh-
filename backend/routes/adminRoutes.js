/*
 * FILE: backend/routes/adminRoutes.js
 * Quản trị viên duyệt tin, ẩn tin giả và khóa tài khoản vi phạm.
 */

const express = require('express');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { protect, requireRole } = require('../middleware/authMiddleware');
const { seedIfEmpty } = require('../seed');

const router = express.Router();

router.use(protect, requireRole('admin'));

// === KHU VỰC 1: THỐNG KÊ NHANH ===
async function thongKe(req, res) {
  try {
    const [users, employers, pending, approved, rejected, applications] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'employer' }),
      Job.countDocuments({ status: 'pending' }),
      Job.countDocuments({ status: 'approved' }),
      Job.countDocuments({ status: 'rejected' }),
      Application.countDocuments()
    ]);

    return res.json({
      stats: { users, employers, pending, approved, rejected, applications }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Không tải được thống kê.' });
  }
}

// === KHU VỰC 2: DUYỆT VÀ ẨN TIN TUYỂN DỤNG ===
async function danhSachTin(req, res) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const jobs = await Job.find(filter)
      .populate('employerId', 'name email companyName phone')
      .sort({ createdAt: -1 });

    return res.json({ jobs });
  } catch (error) {
    return res.status(500).json({ message: 'Không tải được danh sách tin.' });
  }
}

async function duyetTin(req, res) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Không tìm thấy tin.' });

    job.status = 'approved';
    job.rejectReason = '';
    await job.save();
    return res.json({ message: 'Đã duyệt tin. Tin sẽ hiện trên trang tìm việc.', job });
  } catch (error) {
    return res.status(500).json({ message: 'Không duyệt được tin.' });
  }
}

async function anTinGia(req, res) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Không tìm thấy tin.' });

    const reason = (req.body.reason || '').trim() || 'Nghi ngờ tin không trung thực hoặc có dấu hiệu lừa đảo.';
    job.status = 'rejected';
    job.rejectReason = reason;
    await job.save();
    return res.json({ message: 'Đã ẩn tin khỏi trang tìm việc.', job });
  } catch (error) {
    return res.status(500).json({ message: 'Không ẩn được tin.' });
  }
}

// === KHU VỰC 3: QUẢN LÝ NGƯỜI DÙNG VÀ DOANH NGHIỆP ===
async function danhSachNguoiDung(req, res) {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: 'Không tải được danh sách tài khoản.' });
  }
}

async function khoaTaiKhoan(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Không khóa tài khoản quản trị.' });
    }

    user.isBlocked = Boolean(req.body.isBlocked);
    await user.save();

    const message = user.isBlocked ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.';
    return res.json({ message, user: { id: user._id, isBlocked: user.isBlocked } });
  } catch (error) {
    return res.status(500).json({ message: 'Không cập nhật được tài khoản.' });
  }
}

// === KHU VỰC 4: SEED DỮ LIỆU MẪU ===
async function taoDuLieuMau(req, res) {
  try {
    const ketQua = await seedIfEmpty();
    return res.json(ketQua);
  } catch (error) {
    return res.status(500).json({ message: 'Không tạo được dữ liệu mẫu.' });
  }
}

router.get('/stats', thongKe);
router.get('/jobs', danhSachTin);
router.put('/jobs/:id/approve', duyetTin);
router.put('/jobs/:id/reject', anTinGia);
router.get('/users', danhSachNguoiDung);
router.put('/users/:id/block', khoaTaiKhoan);
router.post('/seed', taoDuLieuMau);

module.exports = router;
