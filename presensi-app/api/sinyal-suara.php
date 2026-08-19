<?php
require __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
  $b = input_json();
  $jenis = $b['jenis'] ?? '';
  if (!in_array($jenis, ['masuk', 'pulang'])) respond(['error' => 'Jenis tidak valid'], 400);

  $pdo->exec('DELETE FROM sinyal_suara'); // bersihkan sinyal lama, cuma simpan yang terbaru
  $stmt = $pdo->prepare('INSERT INTO sinyal_suara (jenis, dikirim_oleh) VALUES (?, ?)');
  $stmt->execute([$jenis, trim($b['dikirim_oleh'] ?? '')]);
  respond(['success' => true], 201);
}

if ($method === 'GET') {
  $stmt = $pdo->query('SELECT * FROM sinyal_suara ORDER BY created_at DESC LIMIT 1');
  respond(['data' => $stmt->fetch() ?: null]);
}

respond(['error' => 'Method tidak didukung'], 405);