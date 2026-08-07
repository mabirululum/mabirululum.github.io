<?php
require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Method tidak didukung'], 405);

$body = input_json();
if (($body['konfirmasi'] ?? '') !== 'HAPUS SEMUA DATA') {
  respond(['error' => 'Kode konfirmasi tidak valid'], 400);
}

try {
  $pdo->beginTransaction();
  $pdo->exec('DELETE FROM presensi');
  $pdo->exec('DELETE FROM izin');
  $pdo->exec('DELETE FROM guru_jadwal');
  $pdo->exec('DELETE FROM guru');
  // Tabel users (akun admin/piket) SENGAJA tidak disentuh
  $pdo->commit();
  respond(['success' => true]);
} catch (Exception $e) {
  $pdo->rollBack();
  respond(['error' => 'Gagal reset database: ' . $e->getMessage()], 500);
}