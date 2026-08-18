<?php
require __DIR__ . '/db.php';
require __DIR__ . '/helpers-jadwal.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  $dari = $_GET['dari'] ?? null;
  $sampai = $_GET['sampai'] ?? null;

  if ($dari && $sampai) {
    $stmt = $pdo->prepare(
      "SELECT i.*, g.nama AS nama_guru FROM izin i
       JOIN guru g ON g.id = i.guru_id
       WHERE i.tanggal BETWEEN ? AND ?
       ORDER BY i.tanggal DESC"
    );
    $stmt->execute([$dari, $sampai]);
  } else {
    $stmt = $pdo->query(
      "SELECT i.*, g.nama AS nama_guru FROM izin i
       JOIN guru g ON g.id = i.guru_id
       ORDER BY i.tanggal DESC"
    );
  }
  respond(['data' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
  $b = input_json();
  $guru_id = $b['guru_id'] ?? null;
  $tanggal = $b['tanggal'] ?? date('Y-m-d');
  $jenis = $b['jenis'] ?? '';
  if (!$guru_id || !in_array($jenis, ['Sakit','Izin','Kegiatan'])) {
    respond(['error' => 'Guru dan jenis izin wajib diisi'], 400);
  }

  // Kalau sudah ada izin di tanggal itu, timpa (misal salah input jenis)
  $jamMulai = $b['jam_mulai'] ?: null;
  $jamSelesai = $b['jam_selesai'] ?: null;

  $stmt = $pdo->prepare(
    'INSERT INTO izin (guru_id, tanggal, jenis, jam_mulai, jam_selesai, keterangan, dicatat_oleh) VALUES (?,?,?,?,?,?,?)'
  );
  $stmt->execute([$guru_id, $tanggal, $jenis, $jamMulai, $jamSelesai, trim($b['keterangan'] ?? ''), trim($b['dicatat_oleh'] ?? '')]);

  // --- Hitung ulang presensi kalau guru ini SUDAH scan di tanggal itu ---
  $stmtPresensi = $pdo->prepare('SELECT * FROM presensi WHERE guru_id = ? AND tanggal = ?');
  $stmtPresensi->execute([$guru_id, $tanggal]);
  $presensiExisting = $stmtPresensi->fetch();

  $statusTerupdate = null;
  if ($presensiExisting && $presensiExisting['jam_scan_masuk']) {
    $HARI_MAP = ['Sunday'=>'Minggu','Monday'=>'Senin','Tuesday'=>'Selasa','Wednesday'=>'Rabu',
                'Thursday'=>'Kamis','Friday'=>'Jumat','Saturday'=>'Sabtu'];
    $hariItu = $HARI_MAP[date('l', strtotime($tanggal))];

    $stmtJadwal = $pdo->prepare('SELECT * FROM guru_jadwal WHERE guru_id = ? AND hari = ?');
    $stmtJadwal->execute([$guru_id, $hariItu]);
    $jadwal = $stmtJadwal->fetch();

    if ($jadwal) {
      $semuaIzinHariItu = ambil_izin_guru($pdo, $guru_id, $tanggal); // sudah termasuk izin yang baru saja diinsert
      $jadwalEfektif = jadwal_efektif($jadwal, $semuaIzinHariItu);

      $statusBaru = hitung_ulang_status_presensi($jadwalEfektif, $presensiExisting['jam_scan_masuk'], $presensiExisting['jam_scan_pulang']);

      if ($statusBaru !== $presensiExisting['status']) {
        $pdo->prepare('UPDATE presensi SET status = ? WHERE id = ?')->execute([$statusBaru, $presensiExisting['id']]);
        $statusTerupdate = $statusBaru;
      }
    }
  }

  respond(['success' => true, 'status_presensi_terupdate' => $statusTerupdate], 201);
}

if ($method === 'DELETE') {
  $id = $_GET['id'] ?? null;
  if (!$id) respond(['error' => 'id wajib diisi'], 400);
  $pdo->prepare('DELETE FROM izin WHERE id = ?')->execute([$id]);
  respond(['success' => true]);
}

respond(['error' => 'Method tidak didukung'], 405);