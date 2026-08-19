// =========================================================
// PENGUMUMAN SUARA OTOMATIS
// - Jam tepat: sekali per hari di jam yang ditentukan
// - Fallback gerakan: kalau ada gerakan di depan kamera dalam
//   rentang waktu tertentu dan belum diputar hari ini / sudah
//   lewat cooldown, putar juga (menjangkau yang datang telat)
// =========================================================

const JADWAL_PENGUMUMAN = [
  { jam: '06:00', jendelaSampai: '08:00', teks: 'Selamat pagi, selamat beraktivitas, jangan lupa lakukan presensi masuk hari ini', kunci: 'pengumuman_masuk' },
  { jam: '14:30', jendelaSampai: '16:00', teks: 'Jangan lupa lakukan presensi pulang hari ini, selamat jalan dan hati-hati di jalan', kunci: 'pengumuman_pulang' },
];

const COOLDOWN_GERAKAN_MENIT = 15; // jangan putar ulang dalam 15 menit walau ada gerakan terus-menerus

function sudahDiputarHariIni(kunci) {
  const tgl = tanggalLokal(new Date());
  return localStorage.getItem(kunci) === tgl;
}
function tandaiSudahDiputar(kunci) {
  localStorage.setItem(kunci, tanggalLokal(new Date()));
}
function terakhirDiputar(kunci) {
  return Number(localStorage.getItem(kunci + '_waktu') || 0);
}
function tandaiWaktuPutar(kunci) {
  localStorage.setItem(kunci + '_waktu', Date.now());
}

function putarPengumuman(item) {
  ucapkan(item.teks); // fungsi ucapkan() sudah ada di scanner.js
  tandaiSudahDiputar(item.kunci);
  tandaiWaktuPutar(item.kunci);
}

// ---- Cek jadwal jam tepat, dijalankan tiap 30 detik ----
function cekJadwalJamTepat() {
  const now = new Date();
  const jamMenit = now.toTimeString().slice(0, 5); // "06:30"

  JADWAL_PENGUMUMAN.forEach(item => {
    if (jamMenit === item.jam && !sudahDiputarHariIni(item.kunci)) {
      putarPengumuman(item);
    }
  });
}
setInterval(cekJadwalJamTepat, 30000);

// ---- Deteksi gerakan sebagai fallback untuk yang telat ----
let canvasGerak = null;
let ctxGerak = null;
let frameSebelumnya = null;

function dalamJendelaWaktu(item) {
  const now = new Date().toTimeString().slice(0, 5);
  return now >= item.jam && now <= item.jendelaSampai;
}

function hitungPerbedaanFrame(data1, data2) {
  let total = 0;
  for (let i = 0; i < data1.length; i += 4) { // loncat per pixel (RGBA)
    total += Math.abs(data1[i] - data2[i]);
  }
  return total / (data1.length / 4);
}

function cekGerakanKamera() {
  const video = document.querySelector('#camera-view video');
  if (!video || video.readyState < 2) return;

  if (!canvasGerak) {
    canvasGerak = document.createElement('canvas');
    canvasGerak.width = 80; canvasGerak.height = 60; // kecil saja, cukup untuk deteksi kasar
    ctxGerak = canvasGerak.getContext('2d');
  }

  ctxGerak.drawImage(video, 0, 0, canvasGerak.width, canvasGerak.height);
  const frameSekarang = ctxGerak.getImageData(0, 0, canvasGerak.width, canvasGerak.height).data;

  if (frameSebelumnya) {
    const beda = hitungPerbedaanFrame(frameSekarang, frameSebelumnya);

    if (beda > 18) { // ambang batas gerakan - sesuaikan kalau kurang/kelewat sensitif
      const itemAktif = JADWAL_PENGUMUMAN.find(item =>
        dalamJendelaWaktu(item) &&
        (Date.now() - terakhirDiputar(item.kunci)) > COOLDOWN_GERAKAN_MENIT * 60000
      );
      if (itemAktif) putarPengumuman(itemAktif);
    }
  }
  frameSebelumnya = frameSekarang;
}
setInterval(cekGerakanKamera, 3000); // cek tiap 3 detik, tidak perlu real-time

// Panggil resetPengumuman() di Console kapan saja untuk testing ulang tanpa nunggu besok
function resetPengumuman() {
  localStorage.removeItem('pengumuman_masuk');
  localStorage.removeItem('pengumuman_masuk_waktu');
  localStorage.removeItem('pengumuman_pulang');
  localStorage.removeItem('pengumuman_pulang_waktu');
  console.log('Penanda pengumuman direset.');
}

// ---- Tombol manual putar suara pengumuman ----
function initTombolPengumumanManual() {
  const btnMasuk = document.getElementById('btn-suara-masuk');
  const btnPulang = document.getElementById('btn-suara-pulang');

  if (btnMasuk) {
    btnMasuk.addEventListener('click', () => {
      ucapkan(JADWAL_PENGUMUMAN[0].teks); // pengumuman presensi masuk
    });
  }
  if (btnPulang) {
    btnPulang.addEventListener('click', () => {
      ucapkan(JADWAL_PENGUMUMAN[1].teks); // pengumuman presensi pulang
    });
  }
}
document.addEventListener('DOMContentLoaded', initTombolPengumumanManual);

// ---- Sinyal manual dari admin (dianggap "remote") ----
let sinyalTerakhirDilihat = new Date().toISOString(); // abaikan sinyal lama saat kiosk baru dibuka

async function cekSinyalSuaraManual() {
  try {
    const sinyal = await DB.ambilSinyalTerbaru();
    if (!sinyal) return;
    if (new Date(sinyal.created_at) <= new Date(sinyalTerakhirDilihat)) return;

    sinyalTerakhirDilihat = sinyal.created_at;
    const item = JADWAL_PENGUMUMAN.find(p => p.kunci === `pengumuman_${sinyal.jenis}`);
    if (item) ucapkan(item.teks);
  } catch (e) {
    console.error('Gagal cek sinyal suara:', e);
  }
}
setInterval(cekSinyalSuaraManual, 5000); // cek tiap 5 detik