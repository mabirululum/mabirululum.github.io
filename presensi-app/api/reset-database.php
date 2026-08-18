<?php
require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Method tidak didukung'], 405);

$body = input_json();
$target = $body['target'] ?? '';

$TABEL_PER_TARGET = [
  'izin' => ['izin'],
  'libur' => ['hari_libur'],
  'kegiatan' => ['hari_kegiatan'],
  'presensi' => ['presensi'],
  'guru' => ['guru_jadwal', 'guru'],
  'semua' => ['izin', 'hari_libur', 'hari_kegiatan', 'presensi', 'guru_jadwal', 'guru'],
];

if (!isset($TABEL_PER_TARGET[$target])) {
  respond(['error' => 'Target reset tidak valid'], 400);
}

try {
  $pdo->beginTransaction();
  foreach ($TABEL_PER_TARGET[$target] as $tabel) {
    $pdo->exec("DELETE FROM `$tabel`");
  }
  $pdo->commit();
  respond(['success' => true]);
} catch (Exception $e) {
  $pdo->rollBack();
  respond(['error' => 'Gagal reset data: ' . $e->getMessage()], 500);
}