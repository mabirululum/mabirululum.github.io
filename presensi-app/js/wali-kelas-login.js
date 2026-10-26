// =========================================================
// WALI KELAS LOGIN — Script khusus halaman wali-kelas/login.html
// Hanya menerima role 'wali_kelas', redirect ke wali-kelas/izin.html
// =========================================================

// Jika sudah login sebagai wali kelas, langsung masuk ke izin
(function () {
  const raw = sessionStorage.getItem('admin_session');
  if (raw) {
    try {
      const user = JSON.parse(raw);
      if (user.role === 'wali_kelas') {
        window.location.href = 'izin.html';
        return;
      }
    } catch (e) {
      sessionStorage.removeItem('admin_session');
    }
  }
})();

const formEl = document.getElementById('form-login');
const errEl = document.getElementById('login-error');

function tampilkanError(pesan) {
  errEl.textContent = pesan;
  errEl.style.display = 'block';
}

formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  errEl.style.display = 'none';
  const username = document.getElementById('input-username').value.trim();
  const password = document.getElementById('input-password').value;

  try {
    const user = await DB.loginAdmin(username, password);

    // Hanya terima role wali_kelas di portal ini
    if (user.role !== 'wali_kelas') {
      tampilkanError('Akun ini bukan akun Wali Kelas. Silakan login melalui halaman Admin atau Piket.');
      return;
    }

    // Simpan sesi (sama format dengan admin)
    sessionStorage.setItem('admin_session', JSON.stringify(user));
    window.location.href = 'izin.html';
  } catch (err) {
    tampilkanError(err.message || 'Gagal login, periksa kembali username dan password.');
  }
});
