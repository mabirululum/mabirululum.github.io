<?php
require __DIR__ . '/db.php';

if ($method === 'GET') {
  $status = $_GET['status'] ?? 'aktif';
  $tahun = $_GET['tahun'] ?? '';
  $kolomTahun = $_GET['kolom_tahun'] === 'tahun_masuk' ? 'tahun_masuk' : 'tahun_status';

  $sql = "SELECT s.*, k.nama_kelas FROM siswa s JOIN kelas k ON k.id = s.kelas_id WHERE 1=1";
  $params = [];

  if ($status !== 'semua') {
    $sql .= " AND s.status_siswa = ?";
    $params[] = $status;
  }
  if ($tahun !== '') {
    $sql .= " AND s.$kolomTahun = ?";
    $params[] = $tahun;
  }
  $sql .= " ORDER BY s.nama";

  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);
  respond(['data' => $stmt->fetchAll()]);
}