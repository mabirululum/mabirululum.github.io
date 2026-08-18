<?php
// Fungsi bersama, dipakai oleh presensi.php dan izin.php supaya logic
// jadwal-efektif (penyesuaian karena izin sebagian jam) selalu konsisten.

function cek_hari_kegiatan($pdo, $tanggal) {
  $stmt = $pdo->prepare('SELECT keterangan FROM hari_kegiatan WHERE tanggal = ?');
  $stmt->execute([$tanggal]);
  return $stmt->fetch();
}

function ambil_izin_guru($pdo, $guru_id, $tanggal) {
  $stmt = $pdo->prepare('SELECT * FROM izin WHERE guru_id = ? AND tanggal = ? ORDER BY jam_mulai ASC');
  $stmt->execute([$guru_id, $tanggal]);
  return $stmt->fetchAll();
}

function jadwal_efektif($jadwal, $daftarIzin) {
  $windows = array_values(array_filter($daftarIzin ?: [], function ($iz) {
    return $iz['jenis'] === 'Izin' && $iz['jam_mulai'] && $iz['jam_selesai'];
  }));
  if (!$windows) return $jadwal;

  $adaPenyesuaian = false;

  $lanjut = true;
  while ($lanjut) {
    $lanjut = false;
    foreach ($windows as $w) {
      if ($w['jam_mulai'] <= $jadwal['jam_masuk'] && $w['jam_selesai'] > $jadwal['jam_masuk']) {
        $jadwal['jam_masuk'] = $w['jam_selesai'];
        $adaPenyesuaian = true;
        $lanjut = true;
      }
    }
  }

  $lanjut = true;
  while ($lanjut) {
    $lanjut = false;
    foreach ($windows as $w) {
      if ($w['jam_selesai'] >= $jadwal['jam_pulang'] && $w['jam_mulai'] < $jadwal['jam_pulang']) {
        $jadwal['jam_pulang'] = $w['jam_mulai'];
        $adaPenyesuaian = true;
        $lanjut = true;
      }
    }
  }

  if ($adaPenyesuaian) $jadwal['_ada_izin_sebagian'] = true;
  return $jadwal;
}

// Hitung ulang status presensi (dipakai saat scan BARU maupun saat re-hitung karena izin ditambah belakangan)
function hitung_ulang_status_presensi($jadwalEfektif, $jam_scan_masuk, $jam_scan_pulang) {
  if ($jadwalEfektif['kategori'] === 'struktural' || $jadwalEfektif['kategori'] === 'mengaji') {
    return 'hadir';
  }

  $batas_telat = date('H:i:s', strtotime($jadwalEfektif['jam_masuk']) + $jadwalEfektif['toleransi_telat_menit'] * 60);
  $status = ($jam_scan_masuk > $batas_telat) ? 'telat' : 'hadir';

  if ($jam_scan_pulang) {
    $pulang_awal = $jam_scan_pulang < $jadwalEfektif['jam_pulang'];
    if ($pulang_awal) {
      $status = ($status === 'telat') ? 'telat_dan_pulang_awal' : 'pulang_awal';
    }
  }

  return $status;
}