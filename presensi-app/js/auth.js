// Sesi admin disimpan sederhana di sessionStorage (hilang saat tab ditutup).
// Cocok untuk penggunaan internal di jaringan sekolah/kantor yang terpercaya.

const AUTH = {
  save(user) {
    sessionStorage.setItem('admin_session', JSON.stringify(user));
  },
  current() {
    const raw = sessionStorage.getItem('admin_session');
    return raw ? JSON.parse(raw) : null;
  },
  logout() {
    konfirmasi('Yakin ingin logout dari dashboard admin?').then((ya) => {
      if (!ya) return;
      sessionStorage.removeItem('admin_session');
      sessionStorage.removeItem('admin_sidebar_scroll');
      // Deteksi apakah sedang di portal piket, wali-kelas, atau admin
      if (location.pathname.includes('/piket/')) {
        window.location.href = 'login.html';
      } else if (location.pathname.includes('/wali-kelas/')) {
        window.location.href = 'login.html';
      } else {
        window.location.href = 'login.html';
      }
    });
  },
  // Panggil di setiap halaman admin (kecuali login.html) untuk memastikan sudah login
  requireAdmin() {
    if (!this.current()) window.location.href = 'login.html';
  },
  requireRole(allowedRoles) {
    const user = this.current();
    if (!user) { window.location.href = 'login.html'; return; }
    if (!allowedRoles.includes(user.role)) {
      if (user.role === 'piket') window.location.href = '../piket/izin.html';
      else if (user.role === 'wali_kelas') window.location.href = '../wali-kelas/izin.html';
      else window.location.href = 'dashboard.html';
    }
  },
};

