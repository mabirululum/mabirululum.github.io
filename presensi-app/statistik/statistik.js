// =========================================================
// STATISTIK PRESENSI - halaman publik, tanpa login
// Menghitung ringkasan hari ini dari data yang sudah ada
// (guru, guru_jadwal, presensi, izin, hari_libur, hari_kegiatan)
// lewat DB adapter yang sama dipakai menu Laporan admin.
// =========================================================

function updateJam() {
  const now = new Date();
  document.getElementById('jam-sekarang').textContent = now.toLocaleTimeString('id-ID', { hour12: false });
  document.getElementById('tanggal-sekarang').textContent = now.toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}
setInterval(updateJam, 1000);
updateJam();

async function muatStatistik() {
  const hariIni = tanggalLokal(new Date());

  try {
    const [rows, liburList, kegiatanList] = await Promise.all([
      DB.laporanRentang(hariIni, hariIni),
      DB.listHariLibur(hariIni, hariIni),
      DB.listHariKegiatan(hariIni, hariIni),
    ]);

    // ---- Banner hari libur / kegiatan ----
    const bannerBox = document.getElementById('banner-khusus');
    const libur = (liburList || [])[0];
    const kegiatan = (kegiatanList || [])[0];
    if (libur) {
      bannerBox.innerHTML = `<div class="banner-khusus banner-libur"><i class="bi bi-calendar-x"></i> Hari ini libur: ${libur.keterangan}</div>`;
    } else if (kegiatan) {
      bannerBox.innerHTML = `<div class="banner-khusus banner-kegiatan"><i class="bi bi-calendar2-check"></i> Hari ini kegiatan sekolah: ${kegiatan.keterangan}</div>`;
    } else {
      bannerBox.innerHTML = '';
    }

    // ---- Hitung ringkasan ----
    const total = rows.length;
    const hadir = rows.filter(r => ['hadir', 'telat'].includes(r.ket_masuk_tipe)).length;
    const telat = rows.filter(r => r.ket_masuk_tipe === 'telat').length;
    const alpha = rows.filter(r => r.ket_masuk_tipe === 'alpha').length;
    const izinDkk = rows.filter(r => ['izin', 'sakit', 'kegiatan', 'cuti'].includes(r.ket_masuk_tipe)).length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-hadir').textContent = hadir;
    document.getElementById('stat-telat').textContent = telat;
    document.getElementById('stat-alpha').textContent = alpha;
    document.getElementById('stat-izin').textContent = izinDkk;

    const persen = total > 0 ? Math.round((hadir / total) * 100) : 0;
    document.getElementById('progress-persen').textContent = `${persen}%`;
    document.getElementById('progress-bar').style.width = `${persen}%`;

    // ---- Daftar guru belum presensi ----
    const daftarAlpha = rows.filter(r => r.ket_masuk_tipe === 'alpha');
    document.getElementById('daftar-alpha').innerHTML = daftarAlpha.length
      ? daftarAlpha.map(r => `<div class="baris-guru-pantau"><span>${r.nama_guru}</span></div>`).join('')
      : '<div class="kosong-pantau">Semua guru sudah presensi 🎉</div>';

    // ---- Daftar guru telat ----
    const daftarTelat = rows.filter(r => r.ket_masuk_tipe === 'telat');
    document.getElementById('daftar-telat').innerHTML = daftarTelat.length
      ? daftarTelat.map(r => `<div class="baris-guru-pantau"><span>${r.nama_guru}</span><span class="jam">${(r.jam_scan_masuk || '').slice(0,5)}</span></div>`).join('')
      : '<div class="kosong-pantau">Belum ada yang telat hari ini</div>';

    document.getElementById('footer-update').textContent =
      `Terakhir diperbarui: ${new Date().toLocaleTimeString('id-ID', { hour12: false })} · Otomatis refresh tiap 60 detik`;

  } catch (err) {
    document.getElementById('footer-update').textContent = 'Gagal memuat data: ' + err.message;
  }
}

muatStatistik();
setInterval(muatStatistik, 60000); // auto-refresh tiap 60 detik
