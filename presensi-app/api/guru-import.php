<?php
require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Method tidak didukung'], 405);

function generate_barcode_guru($pdo) {
  do {
    $kode = 'GRU-' . date('Ymd') . '-' . str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);
    $stmt = $pdo->prepare('SELECT id FROM guru WHERE barcode_id = ?');
    $stmt->execute([$kode]);
  } while ($stmt->fetch());
  return $kode;
}

function parse_jadwal_cell($teks) {
  $teks = trim($teks);
  if ($teks === '') return null;
  $teks = str_replace('–', '-', $teks);

  $parts = array_map('trim', explode(',', $teks));
  $rentangJam = $parts[0];
  $kategoriMentah = strtolower($parts[1] ?? '');
  $kategori = 'pengajar';
  if (str_starts_with($kategoriMentah, 's')) $kategori = 'struktural';
  elseif (str_starts_with($kategoriMentah, 'm')) $kategori = 'mengaji';

  $bagian = array_map('trim', explode('-', $rentangJam));
  if (count($bagian) !== 2) return null;
  foreach ($bagian as $j) {
    if (!preg_match('/^\d{1,2}:\d{2}$/', $j)) return null;
  }
  return ['jam_masuk' => $bagian[0] . ':00', 'jam_pulang' => $bagian[1] . ':00', 'kategori' => $kategori];
}

$body = input_json();
$rows = $body['rows'] ?? [];

$HARI_KOLOM = ['senin'=>'Senin','selasa'=>'Selasa','rabu'=>'Rabu','kamis'=>'Kamis','jumat'=>'Jumat','sabtu'=>'Sabtu'];

$berhasil = 0;
$gagal = [];

foreach ($rows as $i => $r) {
  $baris_ke = $i + 2;
  $nama = trim($r['nama'] ?? '');
  if ($nama === '') { $gagal[] = "Baris $baris_ke: nama kosong"; continue; }
  $nama_panggilan = trim($r['nama_panggilan'] ?? '') ?: null;

  $toleransi = is_numeric($r['toleransi'] ?? '') ? (int)$r['toleransi'] : 15;
  $aktif = in_array(strtolower(trim($r['status'] ?? '')), ['aktif', 'active', '1']) ? 1 : 0;

  $jadwal = [];
  foreach ($HARI_KOLOM as $key => $namaHari) {
    $parsed = parse_jadwal_cell($r[$key] ?? '');
    if ($parsed) {
      $jadwal[] = [
        'hari' => $namaHari,
        'jam_masuk' => $parsed['jam_masuk'],
        'jam_pulang' => $parsed['jam_pulang'],
        'kategori' => $parsed['kategori'],
        'toleransi_telat_menit' => $parsed['kategori'] === 'struktural' ? 0 : $toleransi,
      ];
    }
  }
  if (!$jadwal) { $gagal[] = "Baris $baris_ke ($nama): tidak ada jadwal valid"; continue; }

  try {
    $pdo->beginTransaction();

    $kode = trim($r['kode'] ?? '');
    $guru_id = null;

    if ($kode !== '') {
      $stmt = $pdo->prepare('SELECT id FROM guru WHERE barcode_id = ?');
      $stmt->execute([$kode]);
      $existing = $stmt->fetch();
      if ($existing) $guru_id = $existing['id'];
    }

    if ($guru_id) {
      $stmt = $pdo->prepare('UPDATE guru SET nama = ?, nama_panggilan = ?, aktif = ? WHERE id = ?');
      $stmt->execute([$nama, $nama_panggilan, $aktif, $guru_id]);
    } else {
      $barcode = $kode !== '' ? $kode : generate_barcode_guru($pdo);
      $stmt = $pdo->prepare('INSERT INTO guru (nama, nama_panggilan, barcode_id, aktif) VALUES (?, ?, ?, ?)');
      $stmt->execute([$nama, $nama_panggilan, $barcode, $aktif]);
      $guru_id = $pdo->lastInsertId();
    }

    $pdo->prepare('DELETE FROM guru_jadwal WHERE guru_id = ?')->execute([$guru_id]);
    $stmtJ = $pdo->prepare('INSERT INTO guru_jadwal (guru_id, hari, jam_masuk, jam_pulang, kategori, toleransi_telat_menit) VALUES (?,?,?,?,?,?)');
    foreach ($jadwal as $j) {
      $stmtJ->execute([$guru_id, $j['hari'], $j['jam_masuk'], $j['jam_pulang'], $j['kategori'], $j['toleransi_telat_menit']]);
    }

    $pdo->commit();
    $berhasil++;
  } catch (Exception $e) {
    $pdo->rollBack();
    $gagal[] = "Baris $baris_ke ($nama): " . $e->getMessage();
  }
}

respond(['berhasil' => $berhasil, 'gagal' => $gagal]);
