/*
 * FILE: frontend/js/nav.js
 * Thanh menu dùng chung. Mỗi trang gọi renderHeader() sau khi đã nhúng api.js.
 */

// === KHU VỰC 1: DỰNG THANH ĐIỀU HƯỚNG THEO VAI TRÒ ===
function renderHeader() {
  const base = getBasePath();
  const user = getUser();
  const file = decodeURIComponent(window.location.pathname.split('/').pop() || 'index.html');
  const header = document.getElementById('site-header');
  if (!header) return;

  const link = (href, label, active) => {
    const cls = active
      ? 'font-semibold text-emerald-700'
      : 'text-slate-600 hover:text-emerald-700';
    return '<a class="' + cls + '" href="' + href + '">' + label + '</a>';
  };

  let links = link(base + 'index.html', 'Tìm việc', file === 'index.html');

  if (user && user.role === 'user') {
    links += link(base + 'user/profile.html', 'Hồ sơ của tôi', file === 'profile.html');
    links += link(base + 'user/my-applications.html', 'Đơn đã nộp', file === 'my-applications.html');
  }

  if (user && user.role === 'employer') {
    links += link(base + 'employer/dashboard.html', 'Tin tuyển dụng', file === 'dashboard.html' && window.location.pathname.includes('/employer/'));
    links += link(base + 'employer/candidates.html', 'Ứng viên', file === 'candidates.html');
  }

  if (user && user.role === 'admin') {
    links += link(base + 'admin/dashboard.html', 'Kiểm duyệt', file === 'dashboard.html' && window.location.pathname.includes('/admin/'));
  }

  let account = '<a class="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700" href="'
    + base + 'login.html">Đăng nhập</a>';

  if (user) {
    account = '<span class="text-sm text-slate-500">Xin chào, <b class="text-slate-800">'
      + escapeHtml(user.name) + '</b></span>'
      + '<button id="btn-logout" type="button" class="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Đăng xuất</button>';
  }

  header.innerHTML = ''
    + '<header class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">'
    + '  <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">'
    + '    <a href="' + base + 'index.html" class="text-lg font-bold text-emerald-800">Kết Nối Việc</a>'
    + '    <nav class="flex flex-wrap items-center gap-4 text-sm">' + links + '</nav>'
    + '    <div class="flex items-center gap-3">' + account + '</div>'
    + '  </div>'
    + '</header>';

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      clearSession();
      window.location.href = base + 'index.html';
    });
  }
}
