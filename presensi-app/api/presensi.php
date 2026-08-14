<?php
require __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

$HARI_MAP = ['Sunday'=>'Minggu','Monday'=>'Senin','Tuesday'=>'Selasa','Wednesday'=>'Rabu',
             'Thursday'=>'Kamis','Friday'=>'Jumat','Saturday'=>'Sabtu'];

if ($method === 'GET') {
  $dari = $_GET['dari'] ?? date('Y-m-d');
  $sampai = $_GET['sampai'] ?? $dari;
  $limit = (int)($_GET['limit'] ?? 200);

  $stmt = $pdo->prepare(
    "SELECT p.*, g.nama AS nama_guru FROM presensi p
     JOIN guru g ON g.id = p.guru_id
     WHERE p.tanggal BETWEEN ? AND ?
     ORDER BY p.created_at DESC LIMIT $limit"
  );
  $stmt->execute([$dari, $sampai]);
  respond(['data' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
  $b = input_json();
  $barcode = trim($b['barcode'] ?? '');
  if ($barcode === '') respond(['error' => 'Barcode kosong'], 400);

  $stmtGuru = $pdo->prepare('SELECT * FROM guru WHERE barcode_id = ? AND aktif = 1');
  $stmtGuru->execute([$barcode]);
  $guru = $stmtGuru->fetch();
  if (!$guru) respond(['error' => 'Barcode tidak dikenali', 'status' => 'unknown'], 404);

  $tanggal = date('Y-m-d');
  $jam_sekarang = date('H:i:s');
  $hari_ini = $HARI_MAP[date('l')];

  $stmtJadwal = $pdo->prepare('SELECT * FROM guru_jadwal WHERE guru_id = ? AND hari = ?');
  $stmtJadwal->execute([$guru['id'], $hari_ini]);
  $jadwal = $stmtJadwal->fetch();

  if (!$jadwal) {
    respond(['error' => $guru['nama'] . ' tidak memiliki jadwal masuk pada hari ' . $hari_ini], 400);
  }

  $stmtCek = $pdo->prepare('SELECT * FROM presensi WHERE guru_id = ? AND tanggal = ?');
  $stmtCek->execute([$guru['id'], $tanggal]);
  $existing = $stmtCek->fetch();

  if (!$existing) {
    // ---- Guru Mengaji: cukup 1x scan, langsung Hadir & selesai ----
    if ($jadwal['kategori'] === 'mengaji') {
      $stmt = $pdo->prepare(
        'INSERT INTO presensi (guru_id, tanggal, jam_scan_masuk, jam_scan_pulang, status) VALUES (?, ?, ?, ?, ?)'
      );
      $stmt->execute([$guru['id'], $tanggal, $jam_sekarang, $jam_sekarang, 'hadir']);

      respond([
        'jenis' => 'masuk',
        'nama' => $guru['nama'],
        'nama_panggilan' => $guru['nama_panggilan'] ?: $guru['nama'],
        'jam' => $jam_sekarang,
        'status' => 'hadir',
        'menit_telat' => 0,
      ]);
    }
    
    // ---- SCAN PERTAMA HARI INI = JAM MASUK ----
    if ($jadwal['kategori'] === 'struktural') {
      $status = 'hadir';
      $menit_telat = 0;
    } else {
      $batas_telat = date('H:i:s', strtotime($jadwal['jam_masuk']) + $jadwal['toleransi_telat_menit'] * 60);
      $menit_telat = max(0, round((strtotime($jam_sekarang) - strtotime($jadwal['jam_masuk'])) / 60));
      $status = ($jam_sekarang > $batas_telat) ? 'telat' : 'hadir';
    }

    $stmt = $pdo->prepare(
      'INSERT INTO presensi (guru_id, tanggal, jam_scan_masuk, status) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$guru['id'], $tanggal, $jam_sekarang, $status]);

    respond([
      'jenis' => 'pulang',
      'nama' => $guru['nama'],
      'nama_panggilan' => $guru['nama_panggilan'] ?: $guru['nama'],
      'jam' => $jam_sekarang,
      'status' => $status_baru,
    ]);
  }

  if (!$existing['jam_scan_pulang']) {
    // --- COOLDOWN menyesuaikan durasi sesi guru (maksimal 60 menit) ---
    $durasi_sesi_menit = (strtotime($jadwal['jam_pulang']) - strtotime($jadwal['jam_masuk'])) / 60;
    $MIN_MENIT_PULANG = max(0, min(60, $durasi_sesi_menit));
    $menit_sejak_masuk = (strtotime($jam_sekarang) - strtotime($existing['jam_scan_masuk'])) / 60;

    if ($menit_sejak_masuk < $MIN_MENIT_PULANG) {
      respond([
        'jenis' => 'terlalu_cepat',
        'nama'  => $guru['nama'],
        'nama_panggilan' => $guru['nama_panggilan'] ?: $guru['nama'],
        'error' => 'Belum bisa presensi pulang. Minimal ' . ceil($MIN_MENIT_PULANG) .
                   ' menit setelah masuk (' . ceil($MIN_MENIT_PULANG - $menit_sejak_masuk) . ' menit lagi).',
      ]);
    }

    // ---- SCAN KEDUA HARI INI = JAM PULANG ----
    if ($jadwal['kategori'] === 'struktural') {
      $status_baru = 'hadir';
    } else {
      $pulang_awal = $jam_sekarang < $jadwal['jam_pulang'];
      $status_baru = $existing['status'];
      if ($pulang_awal) {
        $status_baru = ($existing['status'] === 'telat') ? 'telat_dan_pulang_awal' : 'pulang_awal';
      }
    }

    $stmt = $pdo->prepare('UPDATE presensi SET jam_scan_pulang = ?, status = ? WHERE id = ?');
    $stmt->execute([$jam_sekarang, $status_baru, $existing['id']]);

    respond([
      'jenis' => 'pulang',
      'nama' => $guru['nama'],
      'nama_panggilan' => $guru['nama_panggilan'] ?: $guru['nama'],
      'jam' => $jam_sekarang,
      'status' => $status_baru,
    ]);
  }

  respond([
    'jenis'  => 'sudah_lengkap',
    'nama'   => $guru['nama'],
    'status' => $existing['status'],
  ]);
}

respond(['error' => 'Method tidak didukung'], 405);
