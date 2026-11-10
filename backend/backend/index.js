const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Đã kết nối MongoDB!'))
  .catch(err => console.error('Lỗi kết nối DB:', err));

app.get('/api/test', async (req, res) => {
  try {
    const data = await mongoose.connection.db.collection('test').find({}).toArray();
    res.json({ status: 'OK', data: data });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server chạy tại port ${PORT}`));
