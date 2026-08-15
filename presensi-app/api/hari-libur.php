<?php
require __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  $dari = $_GET['dari'] ?? date('Y-m-01');
  $sampai = $_GET['sampai'] ?? date('Y-12-31');
  $stmt = $pdo->prepare('SELECT * FROM hari_libur WHERE tanggal BETWEEN ? AND ? ORDER BY tanggal ASC');
  $stmt->execute([$dari, $sampai]);
  respond(['data' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
  $b = input_json();
  $tanggal = $b['tanggal'] ?? '';
  $keterangan = trim($b['keterangan'] ?? '');
  if (!$tanggal || !$keterangan) respond(['error' => 'Tanggal dan keterangan wajib diisi'], 400);

  $stmt = $pdo->prepare('INSERT INTO hari_libur (tanggal, keterangan) VALUES (?, ?) ON DUPLICATE KEY UPDATE keterangan = VALUES(keterangan)');
  $stmt->execute([$tanggal, $keterangan]);
  respond(['success' => true], 201);
}

if ($method === 'DELETE') {
  $id = $_GET['id'] ?? null;
  if (!$id) respond(['error' => 'id wajib diisi'], 400);
  $pdo->prepare('DELETE FROM hari_libur WHERE id = ?')->execute([$id]);
  respond(['success' => true]);
}

respond(['error' => 'Method tidak didukung'], 405);