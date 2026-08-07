// =========================================================
// HALAMAN UTAMA (KIOSK) - jam real-time + scanner barcode
// Barcode admin otomatis membuka dashboard ("pintu ajaib"),
// barcode guru diproses sebagai presensi.
// =========================================================

const STATUS_LABEL = {
  hadir: 'Hadir',
  telat: 'Telat',
  pulang_awal: 'Pulang Lebih Awal',
  telat_dan_pulang_awal: 'Telat & Pulang Awal',
};

function formatDurasi(totalMenit) {
  const jam = Math.floor(totalMenit / 60);
  const sisaMenit = totalMenit % 60;
  if (jam > 0) return sisaMenit > 0 ? `${jam} Jam ${sisaMenit} Menit` : `${jam} Jam`;
  return `${totalMenit} Menit`;
}

function ucapkan(teks) {
  if (!('speechSynthesis' in window)) return; // browser lama tanpa dukungan TTS, diamkan saja
  const utter = new SpeechSynthesisUtterance(teks);
  utter.lang = 'id-ID';
  utter.rate = 1;
  speechSynthesis.cancel(); // hentikan antrian suara sebelumnya kalau ada scan beruntun
  speechSynthesis.speak(utter);
}

function updateClock() {
  const now = new Date();
  document.getElementById('clock-time').textContent = now.toLocaleTimeString('id-ID', { hour12: false });
  document.getElementById('clock-date').textContent = now.toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}
setInterval(updateClock, 1000);
updateClock();

const statusBox = document.getElementById('status-box');
const riwayatList = document.getElementById('riwayat-list');
let timerResetStatus = null;

function jadwalkanReset() {
  timerResetStatus = setTimeout(() => {
    statusBox.className = 'status-box';
    statusBox.innerHTML = `<strong>Menunggu scan…</strong>Arahkan barcode kartu ke kamera`;
  }, 5000);
}

function tampilkanStatus(hasil) {
  if (timerResetStatus) clearTimeout(timerResetStatus);

  if (hasil.error && hasil.jenis !== 'terlalu_cepat') {
    statusBox.className = 'status-box status-error';
    statusBox.innerHTML = `<strong>${hasil.error}</strong>`;
    jadwalkanReset();
    return;
  }

  const nama = hasil.nama || 'Data tidak lengkap';
  let label = STATUS_LABEL[hasil.status] || hasil.status || '-';
  if (hasil.status === 'telat' && hasil.menit_telat) {
    label = `Telat ${formatDurasi(hasil.menit_telat)}`;
  }

  let pesan;
  if (hasil.jenis === 'masuk') {
    pesan = `Presensi masuk pukul ${hasil.jam} — ${label}`;
    ucapkan(`Halo, ${nama}, selamat datang dan selamat mengajar`);
  } else if (hasil.jenis === 'pulang') {
    pesan = `Presensi pulang pukul ${hasil.jam} — ${label}`;
    ucapkan(`Terima kasih, ${nama}, selamat jalan dan hati-hati di jalan`);
  } else if (hasil.jenis === 'terlalu_cepat') {
    pesan = hasil.error;
    ucapkan(`Maaf, anda terlalu cepat melakukan presensi, mohon menunggu sesuai waktu yang ditentukan`);
  } else {
    pesan = `Sudah presensi lengkap hari ini (${label})`;
    ucapkan(`Maaf, ${nama}, sudah presensi lengkap hari ini`);
  }

  const statusClass = hasil.jenis === 'terlalu_cepat' ? 'telat' : (hasil.status || 'ok');
  statusBox.className = `status-box status-${statusClass}`;
  statusBox.innerHTML = `<strong>${nama}</strong>${pesan}`;

  muatRiwayat();
  jadwalkanReset();
}

async function muatRiwayat() {
  try {
    const tanggal = tanggalLokal();
    const rows = await DB.riwayatHariIni(tanggal, 5);
    riwayatList.innerHTML = rows.map(r => `
      <div class="list-row">
        <span>${r.nama_guru}</span>
        <span>${r.jam_scan_pulang || r.jam_scan_masuk} · ${r.jam_scan_pulang && r.jam_scan_masuk ? 'Lengkap' : 'Masuk'}</span>
      </div>`).join('') || '<div class="list-row"><span>Belum ada presensi hari ini</span></div>';
  } catch (e) {
    console.error(e);
  }
}
muatRiwayat();

// ---- Kamera scanner ----
let sedangProses = false;
let terakhirKode = null;
let terakhirWaktu = 0;

async function onScanSukses(kode) {
  const sekarang = Date.now();
  if (sedangProses || (kode === terakhirKode && sekarang - terakhirWaktu < 5000)) return;

  sedangProses = true;
  terakhirKode = kode;
  terakhirWaktu = sekarang;

  try {
    // Cek dulu: apakah ini barcode admin? Kalau ya, langsung buka dashboard ("pintu ajaib")
    const admin = await DB.cekAdminBarcode(kode);
    if (admin) {
      AUTH.save(admin);
      window.location.href = 'admin/dashboard.html';
      return;
    }

    const hasil = await DB.scan(kode);
    tampilkanStatus(hasil);
  } catch (e) {
    tampilkanStatus({ error: 'Gagal memproses presensi: ' + e.message });
  } finally {
    sedangProses = false;
  }
}

function isMobileDevice() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return /android|iphone|ipad|ipod|windows phone|mobile/i.test(ua);
}

function initScanner() {
  const scanner = new Html5Qrcode('camera-view');
  scanner.start(
    { facingMode: 'environment' },
    {
      fps: 10,
      qrbox: { width: 300, height: 300 },
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
    },
    (decodedText) => onScanSukses(decodedText),
    () => {}
  ).catch((err) => {
    statusBox.className = 'status-box status-error';
    statusBox.innerHTML = `<strong>Kamera tidak bisa diakses</strong>${err}`;
  });
}
// initScanner();
if (isMobileDevice()) {
  document.getElementById('camera-view').innerHTML = `
    <div style="display:flex; align-items:center; justify-content:center; height:100%; color:#fff; text-align:center; padding:20px; font-size:14px;">
      Presensi hanya dapat dilakukan dari komputer/PC di lokasi Madrasah Aliyah Bi'rul Ulum.
    </div>`;
  statusBox.className = 'status-box status-error';
  statusBox.innerHTML = `<strong>Akses dari perangkat mobile dinonaktifkan</strong>Gunakan komputer/PC untuk melakukan presensi.`;
} else {
  initScanner();
}
