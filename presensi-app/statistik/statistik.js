// =========================================================
// STATISTIK PRESENSI - halaman publik, tanpa login
// Menghitung ringkasan hari ini dari data yang sudah ada
// (guru, guru_jadwal, presensi, izin, hari_libur, hari_kegiatan)
// lewat DB adapter yang sama dipakai menu Laporan admin.
// =========================================================

function updateJam() {
  const now = new Date();
  const elJam = document.getElementById('jam-sekarang');
  const elTgl = document.getElementById('tanggal-sekarang');
  if (elJam) elJam.textContent = now.toLocaleTimeString('id-ID', { hour12: false });
  if (elTgl) {
    elTgl.textContent = now.toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }
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
    if (bannerBox) {
      const libur = (liburList || [])[0];
      const kegiatan = (kegiatanList || [])[0];
      if (libur) {
        bannerBox.innerHTML = `<div class="banner-khusus banner-libur"><i class="bi bi-calendar-x"></i> Hari ini libur: <strong>${libur.keterangan}</strong></div>`;
      } else if (kegiatan) {
        bannerBox.innerHTML = `<div class="banner-khusus banner-kegiatan"><i class="bi bi-calendar2-check"></i> Hari ini kegiatan sekolah: <strong>${kegiatan.keterangan}</strong></div>`;
      } else {
        bannerBox.innerHTML = '';
      }
    }

    // ---- Hitung ringkasan ----
    const total = rows.length;
    const hadir = rows.filter(r => ['hadir', 'telat'].includes(r.ket_masuk_tipe)).length;
    const telat = rows.filter(r => r.ket_masuk_tipe === 'telat').length;
    const alpha = rows.filter(r => r.ket_masuk_tipe === 'alpha').length;
    const izinDkk = rows.filter(r => ['izin', 'sakit', 'kegiatan', 'cuti'].includes(r.ket_masuk_tipe)).length;

    const elTotal = document.getElementById('stat-total');
    const elHadir = document.getElementById('stat-hadir');
    const elTelat = document.getElementById('stat-telat');
    const elAlpha = document.getElementById('stat-alpha');
    const elIzin = document.getElementById('stat-izin');

    if (elTotal) elTotal.textContent = total;
    if (elHadir) elHadir.textContent = hadir;
    if (elTelat) elTelat.textContent = telat;
    if (elAlpha) elAlpha.textContent = alpha;
    if (elIzin) elIzin.textContent = izinDkk;

    const persen = total > 0 ? Math.round((hadir / total) * 100) : 0;
    const elPersen = document.getElementById('progress-persen');
    const elBar = document.getElementById('progress-bar');
    if (elPersen) elPersen.textContent = `${persen}%`;
    if (elBar) elBar.style.width = `${persen}%`;

    // ---- Daftar guru belum presensi ----
    const daftarAlpha = rows.filter(r => r.ket_masuk_tipe === 'alpha');
    const badgeAlpha = document.getElementById('badge-count-alpha');
    if (badgeAlpha) badgeAlpha.textContent = `${daftarAlpha.length} Guru`;

    const elListAlpha = document.getElementById('daftar-alpha');
    if (elListAlpha) {
      elListAlpha.innerHTML = daftarAlpha.length
        ? daftarAlpha.map(r => {
            const inisial = (r.nama_guru || 'G').trim().charAt(0).toUpperCase();
            return `
              <div class="baris-guru-pantau">
                <div class="guru-info">
                  <div class="guru-avatar">${inisial}</div>
                  <span class="guru-nama">${r.nama_guru}</span>
                </div>
                <span class="chip-status chip-alpha"><i class="bi bi-x-circle"></i> Belum Presensi</span>
              </div>`;
          }).join('')
        : '<div class="kosong-pantau"><i class="bi bi-check-circle-fill" style="color:var(--accent); font-size:32px; display:block; margin-bottom:8px;"></i>Semua guru sudah presensi hari ini 🎉</div>';
    }

    // ---- Daftar guru telat ----
    const daftarTelat = rows.filter(r => r.ket_masuk_tipe === 'telat');
    const badgeTelat = document.getElementById('badge-count-telat');
    if (badgeTelat) badgeTelat.textContent = `${daftarTelat.length} Guru`;

    const elListTelat = document.getElementById('daftar-telat');
    if (elListTelat) {
      elListTelat.innerHTML = daftarTelat.length
        ? daftarTelat.map(r => {
            const inisial = (r.nama_guru || 'G').trim().charAt(0).toUpperCase();
            const jam = (r.jam_scan_masuk || '').slice(0,5);
            return `
              <div class="baris-guru-pantau">
                <div class="guru-info">
                  <div class="guru-avatar avatar-telat">${inisial}</div>
                  <span class="guru-nama">${r.nama_guru}</span>
                </div>
                <span class="chip-status chip-telat"><i class="bi bi-clock"></i> ${jam}</span>
              </div>`;
          }).join('')
        : '<div class="kosong-pantau"><i class="bi bi-emoji-smile" style="color:var(--warn); font-size:32px; display:block; margin-bottom:8px;"></i>Belum ada guru yang terlambat hari ini</div>';
    }

    const elFooter = document.getElementById('footer-update');
    if (elFooter) {
      elFooter.innerHTML = `<i class="bi bi-arrow-repeat"></i> Terakhir diperbarui: <strong>${new Date().toLocaleTimeString('id-ID', { hour12: false })}</strong> · Auto refresh tiap 60 detik`;
    }

  } catch (err) {
    const elFooter = document.getElementById('footer-update');
    if (elFooter) elFooter.textContent = 'Gagal memuat data: ' + err.message;
  }
}

muatStatistik();
setInterval(muatStatistik, 60000); // auto-refresh tiap 60 detik
