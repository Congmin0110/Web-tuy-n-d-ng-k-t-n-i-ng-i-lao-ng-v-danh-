/*
 * FILE: backend/routes/employerRoutes.js
 * Nhà tuyển dụng đăng tin, xem CV và đặt lịch phỏng vấn.
 */

const express = require('express');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, requireRole('employer'));

// === KHU VỰC 1: HÀM ĐỌC DỮ LIỆU TIN ===
function docSoTien(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

function docNoiDungTin(body) {
  return {
    title: (body.title || '').trim(),
    description: (body.description || '').trim(),
    requirements: (body.requirements || '').trim(),
    location: (body.location || '').trim(),
    category: (body.category || '').trim(),
    salaryMin: docSoTien(body.salaryMin),
    salaryMax: docSoTien(body.salaryMax)
  };
}

function kiemTraNoiDungTin(tin) {
  if (tin.title.length < 5) return 'Tiêu đề cần ít nhất 5 ký tự.';
  if (tin.description.length < 10) return 'Mô tả công việc cần ít nhất 10 ký tự.';
  if (!tin.location) return 'Vui lòng nhập địa điểm.';
  if (!tin.category) return 'Vui lòng chọn ngành nghề.';
  if (tin.salaryMin && tin.salaryMax && tin.salaryMax < tin.salaryMin) {
    return 'Mức lương cao nhất phải lớn hơn hoặc bằng mức lương khởi điểm.';
  }
  return '';
}

// === KHU VỰC 2: ĐĂNG, SỬA, XÓA TIN ===
async function danhSachTinCuaToi(req, res) {
  try {
    const jobs = await Job.find({ employerId: req.user._id }).sort({ createdAt: -1 });
    return res.json({ jobs });
  } catch (error) {
    return res.status(500).json({ message: 'Không tải được tin của bạn.' });
  }
}

async function dangTin(req, res) {
  try {
    const tin = docNoiDungTin(req.body);
    const loi = kiemTraNoiDungTin(tin);
    if (loi) return res.status(400).json({ message: loi });

    const job = await Job.create({
      ...tin,
      employerId: req.user._id,
      companyName: req.user.companyName || req.user.name,
      status: 'pending',
      rejectReason: ''
    });

    return res.status(201).json({
      message: 'Đã gửi tin. Tin sẽ hiện công khai sau khi quản trị viên duyệt.',
      job
    });
  } catch (error) {
    return res.status(500).json({ message: 'Không đăng được tin.' });
  }
}

async function suaTin(req, res) {
  try {
    const job = await Job.findOne({ _id: req.params.id, employerId: req.user._id });
    if (!job) return res.status(404).json({ message: 'Không tìm thấy tin của bạn.' });

    const tin = docNoiDungTin(req.body);
    const loi = kiemTraNoiDungTin(tin);
    if (loi) return res.status(400).json({ message: loi });

    job.title = tin.title;
    job.description = tin.description;
    job.requirements = tin.requirements;
    job.location = tin.location;
    job.category = tin.category;
    job.salaryMin = tin.salaryMin;
    job.salaryMax = tin.salaryMax;
    job.companyName = req.user.companyName || req.user.name;
    // Sửa nội dung thì phải duyệt lại, tránh sửa một tin đã duyệt thành tin giả.
    job.status = 'pending';
    job.rejectReason = '';
    await job.save();

    return res.json({ message: 'Đã lưu. Tin chuyển về trạng thái chờ duyệt.', job });
  } catch (error) {
    return res.status(500).json({ message: 'Không sửa được tin.' });
  }
}

async function xoaTin(req, res) {
  try {
    const job = await Job.findOne({ _id: req.params.id, employerId: req.user._id });
    if (!job) return res.status(404).json({ message: 'Không tìm thấy tin của bạn.' });

    await Application.deleteMany({ jobId: job._id });
    await job.deleteOne();
    return res.json({ message: 'Đã xóa tin và các hồ sơ nộp kèm.' });
  } catch (error) {
    return res.status(500).json({ message: 'Không xóa được tin.' });
  }
}

// === KHU VỰC 3: XEM, LỌC CV VÀ ĐẶT LỊCH PHỎNG VẤN ===
async function xemDanhSachCV(req, res) {
  try {
    const tinCuaToi = await Job.find({ employerId: req.user._id }).select('_id');
    const idTin = tinCuaToi.map((job) => String(job._id));
    const filter = { jobId: { $in: tinCuaToi.map((job) => job._id) } };

    if (req.query.jobId) {
      if (!idTin.includes(String(req.query.jobId))) {
        return res.status(403).json({ message: 'Bạn không quản lý tin này.' });
      }
      filter.jobId = req.query.jobId;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const applications = await Application.find(filter)
      .populate('userId', 'name email phone skills bio')
      .populate('jobId', 'title location category')
      .sort({ createdAt: -1 });

    return res.json({ applications });
  } catch (error) {
    return res.status(500).json({ message: 'Không tải được danh sách ứng viên.' });
  }
}

async function datLichPhongVan(req, res) {
  try {
    const application = await Application.findById(req.params.id).populate('jobId');
    if (!application || !application.jobId) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });
    }

    if (String(application.jobId.employerId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Bạn không quản lý hồ sơ này.' });
    }

    const trangThaiHopLe = ['pending', 'reviewed', 'interview', 'accepted', 'rejected'];
    if (req.body.status && !trangThaiHopLe.includes(req.body.status)) {
      return res.status(400).json({ message: 'Trạng thái hồ sơ không hợp lệ.' });
    }

    if (req.body.status) application.status = req.body.status;
    application.interviewNote = (req.body.interviewNote || '').trim();

    if (req.body.interviewDate) {
      const lich = new Date(req.body.interviewDate);
      if (Number.isNaN(lich.getTime())) {
        return res.status(400).json({ message: 'Thời gian phỏng vấn không hợp lệ.' });
      }
      application.interviewDate = lich;
      // Nếu form không gửi trạng thái mà đã có giờ hẹn thì coi là mời phỏng vấn.
      if (!req.body.status) application.status = 'interview';
    } else if (req.body.interviewDate === '') {
      application.interviewDate = null;
    }

    await application.save();
    return res.json({ message: 'Đã cập nhật hồ sơ ứng viên.', application });
  } catch (error) {
    return res.status(500).json({ message: 'Không cập nhật được hồ sơ.' });
  }
}

router.get('/jobs', danhSachTinCuaToi);
router.post('/jobs', dangTin);
router.put('/jobs/:id', suaTin);
router.delete('/jobs/:id', xoaTin);
router.get('/applications', xemDanhSachCV);
router.put('/applications/:id', datLichPhongVan);

module.exports = router;
