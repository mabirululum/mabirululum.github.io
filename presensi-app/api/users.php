<?php
require __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  $rows = $pdo->query('SELECT id, username, nama, role, barcode_id, aktif FROM users ORDER BY username ASC')->fetchAll();
  respond(['data' => $rows]);
}

if ($method === 'POST') {
  $b = input_json();
  $username = trim($b['username'] ?? '');
  $password = $b['password'] ?? '';
  if ($username === '' || $password === '') respond(['error' => 'Username & password wajib diisi'], 400);

  $hash = password_hash($password, PASSWORD_DEFAULT);
  $barcode = trim($b['barcode_id'] ?? '') ?: null;

  $stmt = $pdo->prepare('INSERT INTO users (username, password_hash, nama, role, barcode_id) VALUES (?, ?, ?, ?, ?)');
  $role = in_array($b['role'] ?? '', ['admin','piket']) ? $b['role'] : 'admin';
  $stmt->execute([$username, $hash, $b['nama'] ?? '', $role, $barcode]);

  respond(['id' => $pdo->lastInsertId()], 201);
}

if ($method === 'PUT') {
  $b = input_json();
  $id = $b['id'] ?? null;
  $role = in_array($b['role'] ?? '', ['admin','piket']) ? $b['role'] : 'admin';
  if (!$id) respond(['error' => 'id wajib diisi'], 400);

  if (!empty($b['password'])) {
    $hash = password_hash($b['password'], PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('UPDATE users SET nama=?, barcode_id=?, aktif=?, role=? WHERE id=?');
    $stmt->execute([$b['nama'] ?? '', $b['barcode_id'] ?? null, $b['aktif'] ?? 1, $role, $id]);
  } else {
    $stmt = $pdo->prepare('UPDATE users SET nama=?, barcode_id=?, aktif=?, role=? WHERE id=?');
    $stmt->execute([$b['nama'] ?? '', $b['barcode_id'] ?? null, $b['aktif'] ?? 1, $role, $id]);
  }

  respond(['success' => true]);
}

if ($method === 'DELETE') {
  $id = $_GET['id'] ?? null;
  if (!$id) respond(['error' => 'id wajib diisi'], 400);
  $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
  $stmt->execute([$id]);
  respond(['success' => true]);
}

respond(['error' => 'Method tidak didukung'], 405);
