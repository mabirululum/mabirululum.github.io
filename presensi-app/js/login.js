// =========================================================
// ADMIN LOGIN — Script halaman admin/login.html
// Mendukung redirect otomatis untuk role piket, wali_kelas, dan admin
// =========================================================

// Redirect jika sudah login (misal admin buka lagi login.html)
if (AUTH.current()) {
  const user = AUTH.current();
  if (user.role === 'piket') window.location.href = '../piket/izin.html';
  else if (user.role === 'wali_kelas') window.location.href = '../wali-kelas/izin.html';
  else window.location.href = 'dashboard.html';
}

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
    AUTH.save(user);
    if (user.role === 'piket') window.location.href = '../piket/izin.html';
    else if (user.role === 'wali_kelas') window.location.href = '../wali-kelas/izin.html';
    else window.location.href = 'dashboard.html';
  } catch (err) {
    tampilkanError(err.message || 'Username atau password salah');
  }
});
