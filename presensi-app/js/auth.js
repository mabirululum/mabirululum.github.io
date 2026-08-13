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
      window.location.href = '../index.html';
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
      window.location.href = user.role === 'piket' ? 'izin.html' : 'dashboard.html';
    }
  },
};
