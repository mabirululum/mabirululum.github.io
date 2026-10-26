// =========================================================
// PIKET LOGIN — Script khusus halaman piket/login.html
// Hanya menerima role 'piket', redirect ke piket/izin.html
// =========================================================

// Jika sudah login sebagai piket, langsung ke izin
(function () {
  const raw = sessionStorage.getItem('admin_session');
  if (raw) {
    const user = JSON.parse(raw);
    if (user.role === 'piket') {
      window.location.href = 'izin.html';
      return;
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

    // Hanya terima role piket di portal ini
    if (user.role !== 'piket') {
      tampilkanError('Akun ini bukan akun Guru Piket. Silakan login melalui halaman Admin.');
      return;
    }

    // Simpan sesi (sama format dengan admin)
    sessionStorage.setItem('admin_session', JSON.stringify(user));
    window.location.href = 'izin.html';
  } catch (err) {
    tampilkanError(err.message);
  }
});
