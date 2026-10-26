AUTH.requireRole(['admin']);

const _namaAdmin = AUTH.current().nama || AUTH.current().username || 'Administrator';
const elNamaAdmin = document.getElementById('nama-admin');
const elAvatarAdmin = document.getElementById('avatar-admin');
const elHeroAdminName = document.getElementById('hero-admin-name');

if (elNamaAdmin) elNamaAdmin.textContent = _namaAdmin;
if (elAvatarAdmin) elAvatarAdmin.textContent = _namaAdmin.charAt(0).toUpperCase();
if (elHeroAdminName) elHeroAdminName.textContent = _namaAdmin;

// Inisialisasi Tanggal Lokal untuk Hero Banner
function initHeroDate() {
  const now = new Date();
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const elDay = document.getElementById('hero-date-day');
  const elFull = document.getElementById('hero-date-full');
  
  if (elDay) elDay.textContent = days[now.getDay()];
  if (elFull) elFull.textContent = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}
initHeroDate();

const BADGE_CLASS = {
  hadir: 'badge-hadir',
  telat: 'badge-telat',
  pulang_awal: 'badge-pulang',
  telat_dan_pulang_awal: 'badge-telat',
  sakit: 'badge-sakit',
  izin: 'badge-izin',
  kegiatan: 'badge-kegiatan'
};

async function muat() {
  try {
    const tanggal = tanggalLokal();
    const rows = await DB.riwayatHariIni(tanggal, 200);
    const izinHariIni = await DB.listIzin(tanggal, tanggal);

    const total = rows.length;
    const telat = rows.filter(r => (r.status || '').includes('telat')).length;
    const pulangAwal = rows.filter(r => (r.status || '').includes('pulang_awal')).length;

    const elStatTotal = document.getElementById('stat-total');
    const elStatTelat = document.getElementById('stat-telat');
    const elStatPulang = document.getElementById('stat-pulang-awal');
    const elStatIzin = document.getElementById('stat-izin');
    const elBadgeRiwayat = document.getElementById('badge-total-riwayat');

    if (elStatTotal) elStatTotal.textContent = total;
    if (elStatTelat) elStatTelat.textContent = telat;
    if (elStatPulang) elStatPulang.textContent = pulangAwal;
    if (elStatIzin) elStatIzin.textContent = izinHariIni.length;
    if (elBadgeRiwayat) elBadgeRiwayat.textContent = `${total} Guru Tercatat`;

    const tbody = document.getElementById('tbody-dashboard');
    if (!tbody) return;

    if (rows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="table-empty">
            <i class="bi bi-inbox"></i>
            <span>Belum ada data presensi guru yang tercatat hari ini.</span>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = rows.map(r => `
      <tr>
        <td style="font-weight: 600; color: var(--text);">${r.nama_guru || '-'}</td>
        <td>${r.jam_scan_masuk ? `<span style="font-family: monospace; font-weight: 600; color: #047857;">${r.jam_scan_masuk}</span>` : '<span style="color: var(--muted);">-</span>'}</td>
        <td>${r.jam_scan_pulang ? `<span style="font-family: monospace; font-weight: 600; color: #1d4ed8;">${r.jam_scan_pulang}</span>` : '<span style="color: var(--muted);">-</span>'}</td>
        <td>${r.status ? `<span class="badge ${BADGE_CLASS[r.status] || ''}">${r.status.replace(/_/g, ' ')}</span>` : '<span style="color: var(--muted);">-</span>'}</td>
      </tr>`).join('');
  } catch (err) {
    console.error('Gagal memuat dashboard:', err);
    const tbody = document.getElementById('tbody-dashboard');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="table-empty" style="color: var(--danger);">
            <i class="bi bi-exclamation-triangle"></i>
            <span>Gagal memuat data presensi: ${err.message || err}</span>
          </td>
        </tr>`;
    }
  }
}
muat();

// Sinyal Suara ke Kiosk
const btnMasuk = document.getElementById('btn-sinyal-masuk');
if (btnMasuk) {
  btnMasuk.addEventListener('click', async () => {
    try {
      await DB.kirimSinyalSuara('masuk');
      toast('Sinyal suara presensi masuk berhasil dikirim ke kiosk.');
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

const btnPulang = document.getElementById('btn-sinyal-pulang');
if (btnPulang) {
  btnPulang.addEventListener('click', async () => {
    try {
      await DB.kirimSinyalSuara('pulang');
      toast('Sinyal suara presensi pulang berhasil dikirim ke kiosk.');
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}