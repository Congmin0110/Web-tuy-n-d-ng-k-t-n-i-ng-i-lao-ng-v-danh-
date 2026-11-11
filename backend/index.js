/*
 * FILE: backend/index.js
 * Điểm vào của API. Render chạy lệnh: npm start -> node index.js
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const employerRoutes = require('./routes/employerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { seedIfEmpty } = require('./seed');

const app = express();

// === KHU VỰC 1: CẤU HÌNH CHUNG ===
app.use(cors());
app.use(express.json());

// === KHU VỰC 2: KẾT NỐI CSDL VÀ DỮ LIỆU MẪU ===
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Đã kết nối MongoDB!');
    try {
      const ketQua = await seedIfEmpty();
      console.log(ketQua.message);
    } catch (error) {
      console.error('Lỗi tạo dữ liệu mẫu:', error.message);
    }
  })
  .catch((err) => console.error('Lỗi kết nối DB:', err));

// === KHU VỰC 3: KIỂM TRA KẾT NỐI ===
app.get('/api/test', async (req, res) => {
  try {
    await mongoose.connection.db.admin().command({ ping: 1 });
    res.json({ status: 'OK', message: 'Kết nối CSDL thành công!' });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: 'Không kết nối được CSDL.' });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'API tuyển dụng đang chạy. Mở /api/test để kiểm tra CSDL.' });
});

// === KHU VỰC 4: GẮN CÁC NHÓM API ===
app.use('/api/auth', authRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', userRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Không tìm thấy API.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy tại port ${PORT}`));
