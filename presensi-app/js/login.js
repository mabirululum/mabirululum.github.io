// Redirect jika sudah login (misal admin buka lagi login.html)
if (AUTH.current()) window.location.href = 'dashboard.html';

const formEl = document.getElementById('form-login');
const errEl = document.getElementById('login-error');
const btnModeForm = document.getElementById('btn-mode-form');
const btnModeBarcode = document.getElementById('btn-mode-barcode');
const panelForm = document.getElementById('panel-form');
const panelBarcode = document.getElementById('panel-barcode');

let scannerBarcode = null;

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
    window.location.href = user.role === 'piket' ? 'izin.html' : 'dashboard.html';
  } catch (err) {
    tampilkanError(err.message);
  }
});

function switchMode(mode) {
  const isForm = mode === 'form';
  panelForm.style.display = isForm ? 'block' : 'none';
  panelBarcode.style.display = isForm ? 'none' : 'block';
  btnModeForm.classList.toggle('active', isForm);
  btnModeBarcode.classList.toggle('active', !isForm);

  if (!isForm && !scannerBarcode) {
    scannerBarcode = new Html5Qrcode('camera-login');
    scannerBarcode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 140 } },
      async (kode) => {
        try {
          const user = await DB.loginAdminBarcode(kode);
          AUTH.save(user);
          window.location.href = user.role === 'piket' ? 'izin.html' : 'dashboard.html';
        } catch (err) {
          tampilkanError(err.message);
        }
      },
      () => {}
    );
  } else if (isForm && scannerBarcode) {
    scannerBarcode.stop().catch(() => {});
    scannerBarcode = null;
  }
}

// btnModeForm.addEventListener('click', () => switchMode('form'));
// btnModeBarcode.addEventListener('click', () => switchMode('barcode'));
