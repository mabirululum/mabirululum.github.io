// =========================================================
// LAYAR SISWA — full screen, tanpa kamera.
// Presensi masuk lewat scanner USB (keyboard-emulation):
// alat "mengetik" barcode ke input tersembunyi lalu Enter.
// =========================================================

function updateClockSiswa() {
  const now = new Date();
  document.getElementById('clock-time').textContent = now.toLocaleTimeString('id-ID', { hour12: false });
  document.getElementById('clock-date').textContent = now.toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}
setInterval(updateClockSiswa, 1000);
updateClockSiswa();

const notifBox = document.getElementById('notif-box');
const imbauanBox = document.getElementById('imbauan-box');
let timerResetNotifSiswa = null;

function beepSiswa() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) { console.error('Gagal memutar beep:', e); }
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

async function muatStatistikSiswa() {
  try {
    const tanggal = tanggalLokal(new Date());
    const rows = await DB.riwayatSiswaHariIni(tanggal, 1000);

    // "Masuk" = sedang di sekolah (sudah presensi masuk, belum pulang)
    const sedangDiSekolah = rows.filter(r => r.jam_scan_masuk && !r.jam_scan_pulang).length;
    const sudahPulang = rows.filter(r => r.jam_scan_pulang).length;

    document.getElementById('stat-masuk').textContent = sedangDiSekolah;
    document.getElementById('stat-pulang').textContent = sudahPulang;
  } catch (e) {
    console.error('Gagal muat statistik siswa:', e);
  }
}
muatStatistikSiswa();
setInterval(muatStatistikSiswa, 30000); // refresh tiap 30 detik, jaga-jaga kalau ada scan dari sumber lain

const STATUS_LABEL_SISWA = {
  hadir: 'Hadir',
  telat: 'Telat',
  pulang_awal: 'Pulang Lebih Awal',
  telat_dan_pulang_awal: 'Telat & Pulang Awal',
};

function formatDurasiSiswa(totalMenit) {
  const jam = Math.floor(totalMenit / 60);
  const sisa = totalMenit % 60;
  if (jam > 0) return sisa > 0 ? `${jam} Jam ${sisa} Menit` : `${jam} Jam`;
  return `${totalMenit} Menit`;
}

function jadwalkanResetNotif() {
  timerResetNotifSiswa = setTimeout(() => {
    notifBox.className = 'siswa-notif';
    notifBox.innerHTML = `
      <div class="siswa-notif-judul">Menunggu Presensi…</div>
      <div class="siswa-notif-detail">Belum ada aktivitas</div>`;
  }, 3000);
}

function tampilkanNotifSiswa(hasil) {
  if (timerResetNotifSiswa) clearTimeout(timerResetNotifSiswa);

  if (hasil.error) {
    playErrorSound();
    notifBox.className = 'siswa-notif status-error';
    notifBox.innerHTML = `
      <div class="siswa-notif-judul">Gagal</div>
      <div class="siswa-notif-detail">${hasil.error}</div>`;
    jadwalkanResetNotif();
    return;
  }

  playSuccessSound();

  let label = STATUS_LABEL_SISWA[hasil.status] || hasil.status || '-';
  if (hasil.status === 'telat' && hasil.menit_telat) {
    label = `Telat ${formatDurasiSiswa(hasil.menit_telat)}`;
  }

  let detail;
  if (hasil.jenis === 'masuk') detail = `Presensi masuk pukul ${hasil.jam} — ${label}`;
  else if (hasil.jenis === 'pulang') detail = `Presensi pulang pukul ${hasil.jam} — ${label}`;
  else if (hasil.jenis === 'terlalu_cepat') detail = hasil.error;
  else detail = `Sudah presensi lengkap hari ini (${label})`;

  const statusClass = hasil.jenis === 'terlalu_cepat' ? 'telat' : (hasil.status || 'ok');
  notifBox.className = `siswa-notif status-${statusClass}`;
  notifBox.innerHTML = `
    <div class="siswa-notif-judul">${hasil.nama || 'Data tidak lengkap'}</div>
    <div class="siswa-notif-detail">${detail}</div>`;

  jadwalkanResetNotif();
  muatStatistikSiswa();
}

// ---- Input tersembunyi menangkap ketikan dari scanner USB ----
const inputScannerUsb = document.createElement('input');
inputScannerUsb.type = 'text';
inputScannerUsb.id = 'input-scanner-usb';
inputScannerUsb.autocomplete = 'off';
inputScannerUsb.style.cssText = 'position:fixed; top:-100px; left:-100px; opacity:0; pointer-events:none;';
document.body.appendChild(inputScannerUsb);

function fokuskanInputScannerUsb() {
  inputScannerUsb.focus();
}
fokuskanInputScannerUsb();
document.addEventListener('click', () => setTimeout(fokuskanInputScannerUsb, 50));
setInterval(fokuskanInputScannerUsb, 2000);

let sedangProsesUsb = false;

inputScannerUsb.addEventListener('keydown', async (e) => {
  if (e.key !== 'Enter') return;
  e.preventDefault();

  const kode = inputScannerUsb.value.trim();
  inputScannerUsb.value = '';
  if (!kode || sedangProsesUsb) return;

  sedangProsesUsb = true;
  imbauanBox.style.opacity = '0.4';
  try {
    const hasil = await DB.scanSiswa(kode);
    if (hasil) {
      tampilkanNotifSiswa(hasil);
    } else {
      tampilkanNotifSiswa({ error: 'Barcode tidak dikenali sebagai siswa' });
    }
  } catch (err) {
    tampilkanNotifSiswa({ error: 'Gagal memproses presensi: ' + err.message });
  } finally {
    sedangProsesUsb = false;
    imbauanBox.style.opacity = '1';
  }
});
