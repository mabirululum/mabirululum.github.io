<?php
require __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

function generate_barcode_guru($pdo) {
  do {
    $kode = 'GRU-' . date('Ymd') . '-' . str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);
    $stmt = $pdo->prepare('SELECT id FROM guru WHERE barcode_id = ?');
    $stmt->execute([$kode]);
  } while ($stmt->fetch());
  return $kode;
}

function simpan_jadwal($pdo, $guru_id, $jadwal) {
  $pdo->prepare('DELETE FROM guru_jadwal WHERE guru_id = ?')->execute([$guru_id]);
  $stmt = $pdo->prepare(
    'INSERT INTO guru_jadwal (guru_id, hari, jam_masuk, jam_pulang, kategori, toleransi_telat_menit) VALUES (?,?,?,?,?,?)'
  );
  foreach ($jadwal as $j) {
    $kategori = ($j['kategori'] ?? '') === 'struktural' ? 'struktural' : 'pengajar';
    $stmt->execute([
      $guru_id, $j['hari'], $j['jam_masuk'], $j['jam_pulang'], $kategori, $j['toleransi_telat_menit'] ?? 15,
    ]);
  }
}

if ($method === 'GET') {
  $guruList = $pdo->query('SELECT * FROM guru ORDER BY nama ASC')->fetchAll();
  $jadwalAll = $pdo->query(
    'SELECT * FROM guru_jadwal ORDER BY FIELD(hari,"Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu")'
  )->fetchAll();

  foreach ($guruList as &$g) {
    $g['jadwal'] = array_values(array_filter($jadwalAll, fn($j) => $j['guru_id'] == $g['id']));
  }
  respond(['data' => $guruList]);
}

if ($method === 'POST') {
  $b = input_json();
  $nama = trim($b['nama'] ?? '');
  if ($nama === '') respond(['error' => 'Nama wajib diisi'], 400);
  if (empty($b['jadwal'])) respond(['error' => 'Minimal 1 hari jadwal wajib diisi'], 400);

  $barcode = generate_barcode_guru($pdo);
  $stmt = $pdo->prepare('INSERT INTO guru (nama, nip, barcode_id) VALUES (?, ?, ?)');
  $stmt->execute([$nama, trim($b['nip'] ?? ''), $barcode]);
  $guru_id = $pdo->lastInsertId();

  simpan_jadwal($pdo, $guru_id, $b['jadwal']);

  respond(['id' => $guru_id, 'barcode_id' => $barcode], 201);
}

if ($method === 'PUT') {
  $b = input_json();
  $id = $b['id'] ?? null;
  if (!$id) respond(['error' => 'id wajib diisi'], 400);

  $stmt = $pdo->prepare('UPDATE guru SET nama = ?, nip = ?, aktif = ? WHERE id = ?');
  $stmt->execute([$b['nama'] ?? '', $b['nip'] ?? '', $b['aktif'] ?? 1, $id]);

  if (isset($b['jadwal'])) simpan_jadwal($pdo, $id, $b['jadwal']);

  respond(['success' => true]);
}

if ($method === 'DELETE') {
  $id = $_GET['id'] ?? null;
  if (!$id) respond(['error' => 'id wajib diisi'], 400);
  $pdo->prepare('DELETE FROM guru WHERE id = ?')->execute([$id]);
  respond(['success' => true]);
}

respond(['error' => 'Method tidak didukung'], 405);
