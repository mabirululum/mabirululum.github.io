// =========================================================
// SISTEM OTENTIKASI & KEAMANAN
// Portal: Admin, Guru Piket, Wali Kelas
// 1. Sesi disimpan di sessionStorage
// 2. Proteksi refresh: Website di-refresh otomatis logout
// 3. Proteksi standby: Tidak ada aktivitas 10 menit otomatis logout
// =========================================================

const TIMEOUT_STANDBY_MS = 10 * 60 * 1000; // 10 menit

const AUTH = {
  save(user) {
    sessionStorage.setItem('admin_session', JSON.stringify(user));
    sessionStorage.setItem('auth_last_activity', Date.now().toString());
    sessionStorage.removeItem('admin_sidebar_scroll');
  },
  current() {
    const raw = sessionStorage.getItem('admin_session');
    return raw ? JSON.parse(raw) : null;
  },
  clearSession() {
    sessionStorage.removeItem('admin_session');
    sessionStorage.removeItem('admin_sidebar_scroll');
    sessionStorage.removeItem('auth_last_activity');
  },
  logout() {
    konfirmasi('Yakin ingin logout dari portal?').then((ya) => {
      if (!ya) return;
      this.clearSession();
      if (location.pathname.includes('/piket/')) {
        window.location.href = 'login.html';
      } else if (location.pathname.includes('/wali-kelas/')) {
        window.location.href = 'login.html';
      } else {
        window.location.href = 'login.html';
      }
    });
  },
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

// Cek apakah halaman saat ini adalah login.html
function isHalamanLogin() {
  const p = location.pathname.toLowerCase();
  return p.endsWith('/login.html') || p.endsWith('/login') || p.endsWith('\\login.html');
}

// 1. Pengamanan: Otomatis Logout saat Halaman di-Refresh
(function proteksiRefresh() {
  if (isHalamanLogin()) return;

  // Hanya proses jika ada sesi aktif
  if (!sessionStorage.getItem('admin_session')) return;

  let isReload = false;
  try {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries && navEntries.length > 0) {
      isReload = navEntries[0].type === 'reload';
    } else if (window.performance && window.performance.navigation) {
      isReload = window.performance.navigation.type === 1; // TYPE_RELOAD
    }
  } catch (e) {
    console.error('Deteksi reload error:', e);
  }

  if (isReload) {
    AUTH.clearSession();
    window.location.replace('login.html');
  }
})();

// 2. Pengamanan: Otomatis Logout saat Standby / Inaktivitas 10 Menit
(function proteksiStandby() {
  if (isHalamanLogin()) return;

  const user = AUTH.current();
  if (!user) return; // Jika belum login, abaikan

  const now = Date.now();
  const lastActive = Number(sessionStorage.getItem('auth_last_activity') || now);

  // Jika saat halaman dibuka kembali waktu standby sudah lewat 10 menit
  if (now - lastActive > TIMEOUT_STANDBY_MS) {
    AUTH.clearSession();
    window.location.replace('login.html');
    return;
  }

  // Set timestamp aktivitas saat ini
  sessionStorage.setItem('auth_last_activity', now.toString());

  // Throttled event listener aktivitas user
  let throttleTimer = null;
  function rekamAktivitas() {
    if (throttleTimer) return;
    throttleTimer = setTimeout(() => {
      throttleTimer = null;
      sessionStorage.setItem('auth_last_activity', Date.now().toString());
    }, 4000);
  }

  ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'].forEach(evt => {
    window.addEventListener(evt, rekamAktivitas, { passive: true });
  });

  // Interval check tiap 10 detik
  setInterval(() => {
    const curNow = Date.now();
    const curLast = Number(sessionStorage.getItem('auth_last_activity') || curNow);
    if (curNow - curLast > TIMEOUT_STANDBY_MS) {
      AUTH.clearSession();
      window.location.replace('login.html');
    }
  }, 10000);

  // Check saat tab aktif kembali (dari minimize / lock screen ponsel)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const curNow = Date.now();
      const curLast = Number(sessionStorage.getItem('auth_last_activity') || curNow);
      if (curNow - curLast > TIMEOUT_STANDBY_MS) {
        AUTH.clearSession();
        window.location.replace('login.html');
      } else {
        sessionStorage.setItem('auth_last_activity', curNow.toString());
      }
    }
  });
})();
