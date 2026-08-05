<?php
require __DIR__ . '/db.php';

$body = input_json();
$action = $body['action'] ?? '';

if ($action === 'login') {
  $username = trim($body['username'] ?? '');
  $password = $body['password'] ?? '';

  $stmt = $pdo->prepare('SELECT id, username, password_hash, nama, role FROM users WHERE username = ? AND aktif = 1');
  $stmt->execute([$username]);
  $user = $stmt->fetch();

  if (!$user || !password_verify($password, $user['password_hash'])) {
    respond(['error' => 'Username atau password salah'], 401);
  }
  unset($user['password_hash']);
  respond(['user' => $user]);
}

if ($action === 'login_barcode') {
  // Dipakai HANYA di halaman login admin -> boleh 401 kalau salah
  $barcode = trim($body['barcode'] ?? '');
  $stmt = $pdo->prepare('SELECT id, username, nama, role FROM users WHERE barcode_id = ? AND aktif = 1');
  $stmt->execute([$barcode]);
  $user = $stmt->fetch();

  if (!$user) respond(['error' => 'Barcode tidak terdaftar sebagai admin'], 401);
  respond(['user' => $user]);
}

if ($action === 'cek_barcode_admin') {
  // Dipakai scanner.js untuk cek diam-diam tiap scan -> SELALU balas 200
  $barcode = trim($body['barcode'] ?? '');
  $stmt = $pdo->prepare('SELECT id, username, nama, role FROM users WHERE barcode_id = ? AND aktif = 1');
  $stmt->execute([$barcode]);
  $user = $stmt->fetch();
  respond(['user' => $user ?: null]);
}

respond(['error' => 'Aksi tidak dikenali'], 400);
