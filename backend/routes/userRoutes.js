/*
 * FILE: backend/routes/userRoutes.js
 * Người lao động tìm việc, nộp CV, xem trạng thái và lịch phỏng vấn.
 */

const express = require('express');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// === KHU VỰC 1: HÀM HỖ TRỢ TÌM KIẾM ===
function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function rutGonTin(job) {
  return {
    _id: job._id,
    title: job.title,
    companyName: job.companyName,
    description: job.description,
    requirements: job.requirements,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    location: job.location,
    category: job.category,
    createdAt: job.createdAt
  };
}

function laLinkHopLe(url) {
  return /^https?:\/\//i.test(url || '');
}

// === KHU VỰC 2: TÌM KIẾM VÀ LỌC VIỆC LÀM ===
// Query: q, location, category, salaryMin
// Chỉ trả tin đã được admin duyệt.
async function timKiemViecLam(req, res) {
  try {
    const filter = { status: 'approved' };

    if (req.query.q) {
      const regex = new RegExp(escapeRegex(req.query.q), 'i');
      filter.$or = [{ title: regex }, { description: regex }, { companyName: regex }];
    }

    if (req.query.location) {
      filter.location = new RegExp(escapeRegex(req.query.location), 'i');
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Lọc tin có mức lương khởi điểm lớn hơn hoặc bằng mức người dùng chọn.
    if (req.query.salaryMin) {
      const mucLuong = Number(req.query.salaryMin);
      if (Number.isFinite(mucLuong) && mucLuong > 0) {
        filter.salaryMin = { $gte: mucLuong };
      }
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 }).limit(50);
    return res.json({ jobs: jobs.map(rutGonTin) });
  } catch (error) {
    return res.status(500).json({ message: 'Không tải được danh sách việc làm.' });
  }
}

async function xemChiTietViec(req, res) {
  try {
    const job = await Job.findOne({ _id: req.params.id, status: 'approved' });
    if (!job) {
      return res.status(404).json({ message: 'Không tìm thấy tin tuyển dụng.' });
    }
    return res.json({ job: rutGonTin(job) });
  } catch (error) {
    return res.status(404).json({ message: 'Không tìm thấy tin tuyển dụng.' });
  }
}

// === KHU VỰC 3: HỒ SƠ CÁ NHÂN / DOANH NGHIỆP ===
function xemHoSo(req, res) {
  return res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
      address: req.user.address,
      companyName: req.user.companyName,
      cvLink: req.user.cvLink,
      skills: req.user.skills,
      bio: req.user.bio
    }
  });
}

async function capNhatHoSo(req, res) {
  try {
    const user = req.user;
    const name = (req.body.name || '').trim();

    if (!name) {
      return res.status(400).json({ message: 'Họ tên không được để trống.' });
    }

    user.name = name;
    // Chỉ đổi các ô được gửi lên, tránh form doanh nghiệp làm mất số điện thoại đã lưu.
    if (typeof req.body.phone === 'string') user.phone = req.body.phone.trim();
    if (typeof req.body.address === 'string') user.address = req.body.address.trim();

    if (user.role === 'user') {
      const cvLink = (req.body.cvLink || '').trim();
      if (cvLink && !laLinkHopLe(cvLink)) {
        return res.status(400).json({ message: 'Link CV phải bắt đầu bằng http:// hoặc https://' });
      }
      user.cvLink = cvLink;
      user.skills = (req.body.skills || '').trim();
      user.bio = (req.body.bio || '').trim();
    }

    if (user.role === 'employer') {
      const companyName = (req.body.companyName || '').trim();
      if (!companyName) {
        return res.status(400).json({ message: 'Tên doanh nghiệp không được để trống.' });
      }
      user.companyName = companyName;
    }

    await user.save();
    return res.json({
      message: 'Đã lưu hồ sơ.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        companyName: user.companyName,
        cvLink: user.cvLink,
        skills: user.skills,
        bio: user.bio
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Không lưu được hồ sơ.' });
  }
}

// === KHU VỰC 4: NỘP CV VÀ THEO DÕI ĐƠN ===
async function nopCV(req, res) {
  try {
    const cvLink = (req.body.cvLink || '').trim();
    const note = (req.body.note || '').trim();

    if (!req.body.jobId) {
      return res.status(400).json({ message: 'Thiếu mã tin tuyển dụng.' });
    }

    if (!laLinkHopLe(cvLink)) {
      return res.status(400).json({ message: 'Vui lòng dán link CV bắt đầu bằng http:// hoặc https://' });
    }

    const job = await Job.findOne({ _id: req.body.jobId, status: 'approved' });
    if (!job) {
      return res.status(404).json({ message: 'Tin tuyển dụng không còn nhận hồ sơ.' });
    }

    const daNop = await Application.findOne({ jobId: job._id, userId: req.user._id });
    if (daNop) {
      return res.status(400).json({ message: 'Bạn đã nộp CV cho tin này rồi.' });
    }

    const application = await Application.create({
      jobId: job._id,
      userId: req.user._id,
      cvLink,
      note,
      status: 'pending'
    });

    // Lưu lại link CV mới nhất vào hồ sơ để lần sau đỡ phải dán lại.
    if (req.user.cvLink !== cvLink) {
      req.user.cvLink = cvLink;
      await req.user.save();
    }

    return res.status(201).json({ message: 'Đã nộp CV.', application });
  } catch (error) {
    return res.status(500).json({ message: 'Không nộp được CV.' });
  }
}

async function xemDonCuaToi(req, res) {
  try {
    const applications = await Application.find({ userId: req.user._id })
      .populate('jobId', 'title companyName location category salaryMin salaryMax status')
      .sort({ createdAt: -1 });

    return res.json({ applications });
  } catch (error) {
    return res.status(500).json({ message: 'Không tải được danh sách đơn.' });
  }
}

router.get('/jobs', timKiemViecLam);
router.get('/jobs/:id', xemChiTietViec);
router.get('/profile', protect, requireRole('user', 'employer'), xemHoSo);
router.put('/profile', protect, requireRole('user', 'employer'), capNhatHoSo);
router.post('/applications', protect, requireRole('user'), nopCV);
router.get('/applications/me', protect, requireRole('user'), xemDonCuaToi);

module.exports = router;
