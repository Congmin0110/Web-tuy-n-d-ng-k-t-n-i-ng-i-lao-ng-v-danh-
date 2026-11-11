/*
 * FILE: frontend/js/api.js
 * Hàm dùng chung: gọi API Render, gắn JWT, định dạng tiền và trạng thái.
 */

// === KHU VỰC 1: ĐỊA CHỈ BACKEND ===
// Khi chạy thử trên máy cá nhân, có thể đổi tạm dòng này thành http://localhost:3000
const API_BASE = "https://web-tuy-n-d-ng-k-t-n-i-ng-i-lao-ng-v-danh.onrender.com";

const JOB_CATEGORIES = [
  'Công nghệ thông tin',
  'Kinh doanh',
  'Kế toán',
  'Marketing',
  'Sản xuất',
  'Giáo dục',
  'Khác'
];

const JOB_STATUS_TEXT = {
  pending: 'Chờ duyệt',
  approved: 'Đang hiện',
  rejected: 'Đã ẩn'
};

const APP_STATUS_TEXT = {
  pending: 'Đã nộp',
  reviewed: 'Đã xem',
  interview: 'Mời phỏng vấn',
  accepted: 'Trúng tuyển',
  rejected: 'Từ chối'
};

// === KHU VỰC 2: LƯU PHIÊN ĐĂNG NHẬP ===
function getToken() {
  return localStorage.getItem('token') || '';
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch (error) {
    return null;
  }
}

function saveSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// === KHU VỰC 3: GỌI API KÈM JWT ===
async function apiRequest(path, options) {
  const config = options || {};
  const headers = { 'Content-Type': 'application/json' };

  if (config.headers) {
    Object.assign(headers, config.headers);
  }

  const token = getToken();
  if (token) {
    headers.Authorization = 'Bearer ' + token;
  }

  let response;
  try {
    response = await fetch(API_BASE + path, {
      method: config.method || 'GET',
      headers,
      body: config.body
    });
  } catch (error) {
    throw new Error('Không kết nối được máy chủ. Server Render có thể đang khởi động, hãy thử lại sau khoảng 30 giây.');
  }

  let data = {};
  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || 'Máy chủ trả về lỗi.');
  }

  return data;
}

// === KHU VỰC 4: CHẶN TRANG KHI SAI VAI TRÒ ===
function getBasePath() {
  const path = window.location.pathname;
  if (path.includes('/user/') || path.includes('/employer/') || path.includes('/admin/')) {
    return '../';
  }
  return '';
}

function requireRole(roles) {
  const user = getUser();
  if (!user || roles.indexOf(user.role) === -1) {
    window.location.href = getBasePath() + 'login.html';
    return null;
  }
  return user;
}

// === KHU VỰC 5: HÀM HIỂN THỊ DÙNG CHUNG ===
function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMultiline(value) {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

function formatSalary(min, max) {
  const fmt = (n) => Number(n).toLocaleString('vi-VN') + ' đ';
  if (!min && !max) return 'Thỏa thuận';
  if (min && max) return fmt(min) + ' - ' + fmt(max);
  if (min) return 'Từ ' + fmt(min);
  return 'Đến ' + fmt(max);
}

function formatDate(value) {
  if (!value) return 'Chưa có lịch';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa có lịch';
  return date.toLocaleString('vi-VN');
}

function toDatetimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
    + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
}

function statusText(kind, status) {
  const map = kind === 'job' ? JOB_STATUS_TEXT : APP_STATUS_TEXT;
  return map[status] || status || '';
}

function statusBadge(kind, status) {
  const text = escapeHtml(statusText(kind, status));
  const colors = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-rose-100 text-rose-700',
    reviewed: 'bg-sky-100 text-sky-800',
    interview: 'bg-indigo-100 text-indigo-800',
    accepted: 'bg-emerald-100 text-emerald-800'
  };
  const color = colors[status] || 'bg-slate-100 text-slate-700';
  return '<span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ' + color + '">' + text + '</span>';
}

function setAlert(elementId, message, type) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (!message) {
    el.className = 'hidden';
    el.textContent = '';
    return;
  }
  const color = type === 'error'
    ? 'border-rose-200 bg-rose-50 text-rose-700'
    : 'border-emerald-200 bg-emerald-50 text-emerald-800';
  el.className = 'rounded-xl border px-4 py-3 text-sm ' + color;
  el.textContent = message;
}

function fillCategorySelect(selectEl, includeAll) {
  selectEl.innerHTML = '';
  if (includeAll) {
    const all = document.createElement('option');
    all.value = '';
    all.textContent = 'Tất cả ngành nghề';
    selectEl.appendChild(all);
  }
  JOB_CATEGORIES.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    selectEl.appendChild(option);
  });
}

function safeHref(url) {
  return /^https?:\/\//i.test(url || '') ? url : '';
}
