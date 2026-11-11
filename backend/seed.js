/*
 * FILE: backend/seed.js
 * Tạo dữ liệu mẫu khi database chưa có tài khoản nào.
 * Tài khoản demo (mật khẩu chung 123456):
 *   admin@demo.vn          — quản trị
 *   nhatuyendung@demo.vn   — doanh nghiệp
 *   ungvien@demo.vn        — người lao động
 */

const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Job = require('./models/Job');
const Application = require('./models/Application');

// === KHU VỰC 1: TẠO DỮ LIỆU MẪU NẾU DATABASE TRỐNG ===
async function seedIfEmpty() {
  const soTaiKhoan = await User.countDocuments();
  if (soTaiKhoan > 0) {
    return { seeded: false, message: 'Cơ sở dữ liệu đã có dữ liệu, không tạo thêm.' };
  }

  const password = await bcrypt.hash('123456', 10);

  const admin = await User.create({
    name: 'Nguyễn Quản Trị',
    email: 'admin@demo.vn',
    password,
    role: 'admin',
    phone: '0900000001'
  });

  const employer = await User.create({
    name: 'Trần Minh Anh',
    email: 'nhatuyendung@demo.vn',
    password,
    role: 'employer',
    phone: '0900000002',
    companyName: 'Công ty TNHH Minh Anh',
    address: 'Quận 1, TP. Hồ Chí Minh'
  });

  const candidate = await User.create({
    name: 'Lê Thu Hà',
    email: 'ungvien@demo.vn',
    password,
    role: 'user',
    phone: '0900000003',
    address: 'Hà Nội',
    skills: 'Giao tiếp, tin học văn phòng, chăm sóc khách hàng',
    bio: 'Mình mới ra trường, muốn tìm việc ổn định và được đào tạo thêm.',
    cvLink: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  });

  const jobs = await Job.insertMany([
    {
      employerId: employer._id,
      title: 'Nhân viên chăm sóc khách hàng',
      companyName: employer.companyName,
      description: 'Tiếp nhận cuộc gọi, trả lời thắc mắc của khách và ghi nhận yêu cầu hỗ trợ. Làm việc tại văn phòng, được đào tạo trong 2 tuần đầu.',
      requirements: 'Tốt nghiệp THPT trở lên. Nói năng rõ ràng. Có thể làm xoay ca.',
      salaryMin: 8000000,
      salaryMax: 12000000,
      location: 'Hà Nội',
      category: 'Kinh doanh',
      status: 'approved'
    },
    {
      employerId: employer._id,
      title: 'Lập trình viên Frontend',
      companyName: employer.companyName,
      description: 'Xây dựng giao diện website tuyển dụng bằng HTML, CSS và JavaScript. Làm việc cùng nhóm 4 người, có mentor kèm cặp.',
      requirements: 'Biết HTML, CSS, JavaScript. Có sản phẩm học tập để xem là một lợi thế.',
      salaryMin: 15000000,
      salaryMax: 25000000,
      location: 'TP. Hồ Chí Minh',
      category: 'Công nghệ thông tin',
      status: 'approved'
    },
    {
      employerId: employer._id,
      title: 'Kế toán viên tổng hợp',
      companyName: employer.companyName,
      description: 'Theo dõi hóa đơn, công nợ và hỗ trợ lập báo cáo tháng. Phần mềm đang dùng là Excel và một phần MISA.',
      requirements: 'Tốt nghiệp cao đẳng/đại học chuyên ngành kế toán. Cẩn thận với số liệu.',
      salaryMin: 12000000,
      salaryMax: 16000000,
      location: 'Đà Nẵng',
      category: 'Kế toán',
      status: 'approved'
    },
    {
      employerId: employer._id,
      title: 'Thực tập sinh Marketing',
      companyName: employer.companyName,
      description: 'Hỗ trợ viết bài giới thiệu việc làm và lên lịch đăng fanpage. Có cơ hội nhận việc chính thức sau 3 tháng.',
      requirements: 'Sinh viên năm 3 hoặc năm cuối. Có thể thực tập 4 buổi mỗi tuần.',
      salaryMin: 5000000,
      salaryMax: 8000000,
      location: 'Cần Thơ',
      category: 'Marketing',
      status: 'approved'
    },
    {
      employerId: employer._id,
      title: 'Việc nhẹ lương cao, nộp phí giữ chỗ',
      companyName: employer.companyName,
      description: 'Tin mẫu để giảng viên xem chức năng ẩn tin giả. Nội dung có dấu hiệu lừa đảo: yêu cầu ứng viên chuyển khoản phí trước khi phỏng vấn.',
      requirements: 'Không yêu cầu bằng cấp. Yêu cầu đóng phí 500.000 đồng.',
      salaryMin: 50000000,
      salaryMax: 80000000,
      location: 'Toàn quốc',
      category: 'Khác',
      status: 'pending'
    }
  ]);

  // 02:00 UTC = 09:00 giờ Việt Nam, để lịch mẫu không bị lệch khi server Render chạy múi giờ UTC.
  const lichPhongVan = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  lichPhongVan.setUTCHours(2, 0, 0, 0);

  await Application.create({
    jobId: jobs[0]._id,
    userId: candidate._id,
    cvLink: candidate.cvLink,
    note: 'Em có thể đi làm ngay trong tháng này.',
    status: 'interview',
    interviewDate: lichPhongVan,
    interviewNote: 'Phỏng vấn trực tiếp tại văn phòng Hà Nội.'
  });

  await Application.create({
    jobId: jobs[1]._id,
    userId: candidate._id,
    cvLink: candidate.cvLink,
    note: 'Em đã làm bài tập lớn bằng HTML và JavaScript.',
    status: 'pending'
  });

  console.log('Seed xong. admin@demo.vn / nhatuyendung@demo.vn / ungvien@demo.vn — mật khẩu 123456');
  console.log('Admin id mẫu:', String(admin._id));

  return { seeded: true, message: 'Đã tạo dữ liệu mẫu.' };
}

module.exports = { seedIfEmpty };
