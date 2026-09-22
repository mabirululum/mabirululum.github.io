// =========================================================
// HALAMAN UTAMA (KIOSK) - jam real-time + scanner barcode
// Deteksi otomatis: barcode admin -> buka dashboard,
// barcode siswa -> proses presensi siswa,
// selain itu dianggap barcode guru.
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

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 1. Suara Sukses (Nada naik 'ting-ting', gelombang 'sine' yang bersih)
function playSuccessSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';

    // Nada pertama (587.33 Hz / D5), lalu melompat ke nada kedua (880 Hz / A5)
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.setValueAtTime(880, now + 0.1);

    // Volume amplop: nada pertama memudar tipis, nada kedua memudar habis
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.09);
    gain.gain.setValueAtTime(0.6, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {
    console.error('Gagal memutar suara sukses:', e);
  }
}

// 2. Suara Gagal (Buzzer 'tet-tot' menurun, gelombang 'sawtooth' yang tegas)
function playErrorSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // 'sawtooth' memberikan efek dengungan tajam/kasar
    osc.type = 'sawtooth';

    // Nada pertama (220 Hz / A3), turun ke nada kedua (140 Hz)
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(140, now + 0.12);

    // Jeda volume mikro di tengah untuk memberi jeda antar ketukan "tet - tot"
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    gain.gain.setValueAtTime(0.5, now + 0.13);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {
    console.error('Gagal memutar suara gagal:', e);
  }
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
const riwayatSiswaList = document.getElementById('riwayat-siswa-list');
const riwayatGuruList = document.getElementById('riwayat-guru-list');
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
  const isSiswa = hasil.tipe === 'siswa';

  if (hasil.jenis === 'masuk') {
    pesan = `Presensi masuk pukul ${hasil.jam} — ${label}`;
    if (isSiswa) {
      playSuccessSound();
    } else {
      ucapkan(`Halo, ${hasil.nama_panggilan || nama}, selamat datang dan selamat mengajar`);
    }
  } else if (hasil.jenis === 'pulang') {
    pesan = `Presensi pulang pukul ${hasil.jam} — ${label}`;
    if (isSiswa) {
      playSuccessSound();
    } else {
      ucapkan(`Terima kasih, ${hasil.nama_panggilan || nama}, selamat jalan dan hati-hati di jalan`);
    }
  } else if (hasil.jenis === 'terlalu_cepat') {
    pesan = hasil.error;
    if (isSiswa) {
      playErrorSound();
    } else {
      ucapkan(`Maaf, anda terlalu cepat melakukan presensi, mohon menunggu sesuai waktu yang ditentukan`);
    }
  } else {
    pesan = `Sudah presensi lengkap hari ini (${label})`;
    ucapkan(`Maaf, ${hasil.nama_panggilan || nama}, sudah presensi lengkap hari ini`);
  }

  const statusClass = hasil.jenis === 'terlalu_cepat' ? 'telat' : (hasil.status || 'ok');
  statusBox.className = `status-box status-${statusClass}`;
  statusBox.innerHTML = `<strong>${nama}</strong>${pesan}`;

  if (hasil.tipe === 'siswa') muatRiwayatSiswa();
  else muatRiwayatGuru();

  jadwalkanReset();
}

async function muatRiwayatGuru() {
  try {
    const tanggal = tanggalLokal(new Date());
    const rows = await DB.riwayatHariIni(tanggal, 30);
    riwayatGuruList.innerHTML = rows.map(r => `
      <div class="list-row">
        <span>${r.nama_guru}</span>
        <span>${r.jam_scan_pulang || r.jam_scan_masuk} · ${r.jam_scan_pulang && r.jam_scan_masuk ? 'Lengkap' : 'Masuk'}</span>
      </div>`).join('') || '<div class="list-row"><span>Belum ada presensi hari ini</span></div>';
  } catch (e) {
    console.error(e);
  }
}

async function muatRiwayatSiswa() {
  try {
    const tanggal = tanggalLokal(new Date());
    const rows = await DB.riwayatSiswaHariIni(tanggal, 96);
    riwayatSiswaList.innerHTML = rows.map(r => `
      <div class="list-row">
        <span>${r.nama_siswa}${r.nama_kelas ? ` (${r.nama_kelas})` : ''}</span>
        <span>${r.jam_scan_pulang || r.jam_scan_masuk} · ${r.jam_scan_pulang && r.jam_scan_masuk ? 'Lengkap' : 'Masuk'}</span>
      </div>`).join('') || '<div class="list-row"><span>Belum ada presensi hari ini</span></div>';
  } catch (e) {
    console.error(e);
  }
}

muatRiwayatGuru();
muatRiwayatSiswa();

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
    // 1. Cek dulu: apakah ini barcode admin/piket/wali kelas? ("pintu ajaib")
    const admin = await DB.cekAdminBarcode(kode);
    if (admin) {
      AUTH.save(admin);
      if (admin.role === 'piket') window.location.href = 'admin/izin.html';
      else if (admin.role === 'wali_kelas') window.location.href = 'admin/izin-siswa.html';
      else window.location.href = 'admin/dashboard.html';
      return;
    }

    // 2. Cek apakah ini barcode siswa
    const hasilSiswa = await DB.scanSiswa(kode);
    if (hasilSiswa) {
      tampilkanStatus(hasilSiswa);
      return;
    }

    // 3. Selain itu, anggap barcode guru
    const hasilGuru = await DB.scan(kode);
    tampilkanStatus(hasilGuru);
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