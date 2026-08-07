// =========================================================
// UI HELPERS — dipakai di semua halaman admin
// =========================================================
function tanggalLokal(dateObj = new Date()) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const t = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${t}`;
}

function ensureToastWrap() {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  return wrap;
}

const TOAST_ICON = { info: 'bi-check-circle', error: 'bi-x-circle', warn: 'bi-exclamation-triangle' };

function toast(pesan, tipe = 'info', durasi = 3500) {
  const wrap = ensureToastWrap();
  const el = document.createElement('div');
  el.className = `toast ${tipe !== 'info' ? tipe : ''}`;
  el.innerHTML = `<i class="bi ${TOAST_ICON[tipe] || TOAST_ICON.info}"></i><span>${pesan}</span>`;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), durasi);
}

function konfirmasi(pesan, judul = 'Konfirmasi') {
  return new Promise((resolve) => {
    let overlay = document.querySelector('.modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-box">
          <i class="bi bi-exclamation-circle modal-icon"></i>
          <p id="modal-pesan"></p>
          <div class="modal-actions">
            <button class="modal-btn-cancel">Batal</button>
            <button class="modal-btn-confirm">Ya, Lanjutkan</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
    }
    overlay.querySelector('#modal-pesan').textContent = pesan;
    overlay.classList.add('show');

    const btnCancel = overlay.querySelector('.modal-btn-cancel');
    const btnConfirm = overlay.querySelector('.modal-btn-confirm');

    const tutup = (hasil) => {
      overlay.classList.remove('show');
      btnCancel.onclick = null;
      btnConfirm.onclick = null;
      resolve(hasil);
    };
    btnCancel.onclick = () => tutup(false);
    btnConfirm.onclick = () => tutup(true);
  });
}

function konfirmasiKeras(pesan, kataKunci) {
  return new Promise((resolve) => {
    let overlay = document.querySelector('.modal-overlay-keras');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'modal-overlay modal-overlay-keras';
      overlay.innerHTML = `
        <div class="modal-box">
          <i class="bi bi-exclamation-triangle-fill modal-icon"></i>
          <p></p>
          <input type="text" class="modal-input-keras" placeholder="Ketik: ${kataKunci}"
            style="width:100%; padding:9px 11px; border:1px solid var(--border); border-radius:8px; margin-bottom:16px; text-align:center;">
          <div class="modal-actions">
            <button class="modal-btn-cancel">Batal</button>
            <button class="modal-btn-confirm" disabled>Ya, Hapus Permanen</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
    }
    overlay.querySelector('p').textContent = pesan;
    overlay.classList.add('show');

    const input = overlay.querySelector('.modal-input-keras');
    const btnCancel = overlay.querySelector('.modal-btn-cancel');
    const btnConfirm = overlay.querySelector('.modal-btn-confirm');
    input.value = '';
    btnConfirm.disabled = true;

    input.oninput = () => { btnConfirm.disabled = input.value.trim() !== kataKunci; };

    const tutup = (hasil) => {
      overlay.classList.remove('show');
      input.oninput = null; btnCancel.onclick = null; btnConfirm.onclick = null;
      resolve(hasil);
    };
    btnCancel.onclick = () => tutup(false);
    btnConfirm.onclick = () => tutup(true);
  });
}

function initSidebarToggle() {
  const sidebar = document.querySelector('.sidebar');
  const btn = document.querySelector('.btn-hamburger');
  if (!sidebar || !btn) return;

  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
  }

  const tutupSidebar = () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); };
  btn.addEventListener('click', () => { sidebar.classList.add('open'); overlay.classList.add('show'); });
  overlay.addEventListener('click', tutupSidebar);
  sidebar.querySelectorAll('a').forEach(a => a.addEventListener('click', tutupSidebar));
}

function applySidebarVisibility() {
  const user = AUTH.current();
  if (!user) return;
  document.querySelectorAll('.sidebar-nav a[data-roles]').forEach(a => {
    const roles = a.dataset.roles.split(',');
    if (!roles.includes(user.role)) a.style.display = 'none';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initSidebarToggle();
  applySidebarVisibility();
});
