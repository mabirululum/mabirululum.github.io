AUTH.requireRole(['admin']);
const _nama = AUTH.current().nama || AUTH.current().username;
document.getElementById('nama-admin').textContent = _nama;
document.getElementById('avatar-admin').textContent = _nama.charAt(0).toUpperCase();

async function resetDenganKonfirmasi(kataKunci, pesanAwal, fungsiReset, pesanSukses) {
  const konfirmasiAwal = await konfirmasi(pesanAwal);
  if (!konfirmasiAwal) return;

  const konfirmasiFinal = await konfirmasiKeras(
    `Konfirmasi terakhir - ketik persis kalimat di bawah untuk melanjutkan penghapusan permanen:`,
    kataKunci
  );
  if (!konfirmasiFinal) return;

  try {
    await fungsiReset();
    toast(pesanSukses);
  } catch (err) {
    toast(err.message, 'error');
  }
}

document.getElementById('btn-reset-izin').addEventListener('click', () => {
  resetDenganKonfirmasi(
    'HAPUS DATA IZIN',
    'Semua riwayat izin/sakit/kegiatan/cuti akan dihapus permanen. Lanjutkan?',
    () => DB.resetDataIzin(),
    'Data izin berhasil direset.'
  );
});

document.getElementById('btn-reset-libur').addEventListener('click', () => {
  resetDenganKonfirmasi(
    'HAPUS DATA LIBUR',
    'Semua data hari libur akan dihapus permanen. Lanjutkan?',
    () => DB.resetDataLibur(),
    'Data hari libur berhasil direset.'
  );
});

document.getElementById('btn-reset-kegiatan').addEventListener('click', () => {
  resetDenganKonfirmasi(
    'HAPUS DATA KEGIATAN',
    'Semua data kegiatan sekolah akan dihapus permanen. Lanjutkan?',
    () => DB.resetDataKegiatan(),
    'Data kegiatan sekolah berhasil direset.'
  );
});

document.getElementById('btn-reset-presensi').addEventListener('click', () => {
  resetDenganKonfirmasi(
    'HAPUS DATA PRESENSI',
    'Semua riwayat scan presensi masuk/pulang akan dihapus permanen. Lanjutkan?',
    () => DB.resetDataPresensi(),
    'Data presensi berhasil direset.'
  );
});

document.getElementById('btn-reset-guru').addEventListener('click', () => {
  resetDenganKonfirmasi(
    'HAPUS DATA GURU',
    'Seluruh data guru beserta jadwalnya akan dihapus permanen, termasuk barcode. Lanjutkan?',
    () => DB.resetDataGuru(),
    'Data guru berhasil direset.'
  );
});

document.getElementById('btn-reset-semua').addEventListener('click', () => {
  resetDenganKonfirmasi(
    'HAPUS SEMUA DATA',
    'Data Izin, Libur, Presensi, dan Data Guru SEKALIGUS akan dihapus permanen. Lanjutkan?',
    () => DB.resetDataSemua(),
    'Semua data berhasil direset.'
  );
});

function sesuaikanGridReset() {
  const grid = document.querySelector('main .admin-content > div[style*="grid-template-columns"]');
  if (!grid) return;
  grid.style.gridTemplateColumns = window.innerWidth <= 900 ? '1fr' : 'repeat(4, 1fr)';
}
window.addEventListener('resize', sesuaikanGridReset);
sesuaikanGridReset();