<?php
require __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// if ($method === 'GET') {
//   $dari = $_GET['dari'] ?? date('Y-m-d', strtotime('-6 days'));
//   $sampai = $_GET['sampai'] ?? date('Y-m-d');

//   $stmt = $pdo->prepare(
//     "SELECT i.*, g.nama AS nama_guru FROM izin i
//      JOIN guru g ON g.id = i.guru_id
//      WHERE i.tanggal BETWEEN ? AND ?
//      ORDER BY i.tanggal DESC"
//   );
//   $stmt->execute([$dari, $sampai]);
//   respond(['data' => $stmt->fetchAll()]);
// }

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
  $stmt = $pdo->prepare(
    'INSERT INTO izin (guru_id, tanggal, jenis, keterangan, dicatat_oleh)
     VALUES (?,?,?,?,?)
     ON DUPLICATE KEY UPDATE jenis = VALUES(jenis), keterangan = VALUES(keterangan), dicatat_oleh = VALUES(dicatat_oleh)'
  );
  $stmt->execute([$guru_id, $tanggal, $jenis, trim($b['keterangan'] ?? ''), trim($b['dicatat_oleh'] ?? '')]);

  respond(['success' => true], 201);
}

if ($method === 'DELETE') {
  $id = $_GET['id'] ?? null;
  if (!$id) respond(['error' => 'id wajib diisi'], 400);
  $pdo->prepare('DELETE FROM izin WHERE id = ?')->execute([$id]);
  respond(['success' => true]);
}

respond(['error' => 'Method tidak didukung'], 405);