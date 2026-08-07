<?php
require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') respond(['error' => 'Method tidak didukung'], 405);

$dari = $_GET['dari'] ?? date('Y-m-d', strtotime('-6 days'));
$sampai = $_GET['sampai'] ?? date('Y-m-d');
$guru_id = $_GET['guru_id'] ?? '';
$status = $_GET['status'] ?? '';

$HARI_MAP = ['Sunday'=>'Minggu','Monday'=>'Senin','Tuesday'=>'Selasa','Wednesday'=>'Rabu',
             'Thursday'=>'Kamis','Friday'=>'Jumat','Saturday'=>'Sabtu'];

function format_durasi($total_menit) {
  $jam = intdiv($total_menit, 60);
  $sisa_menit = $total_menit % 60;
  if ($jam > 0) return $sisa_menit > 0 ? "$jam Jam $sisa_menit Menit" : "$jam Jam";
  return "$total_menit Menit";
}

function cek_izin($pdo, $guru_id, $tanggal) {
  static $cache = [];
  $key = "$guru_id|$tanggal";
  if (!array_key_exists($key, $cache)) {
    $stmt = $pdo->prepare('SELECT jenis, keterangan FROM izin WHERE guru_id = ? AND tanggal = ?');
    $stmt->execute([$guru_id, $tanggal]);
    $cache[$key] = $stmt->fetch();
  }
  return $cache[$key];
}

function ket_masuk($jadwal, $jam_scan_masuk) {
  if (!$jam_scan_masuk) return ['label' => 'Alpha', 'tipe' => 'alpha'];
  if ($jam_scan_masuk <= $jadwal['jam_masuk']) return ['label' => 'Hadir Tepat Waktu', 'tipe' => 'hadir'];
  $menit = round((strtotime($jam_scan_masuk) - strtotime($jadwal['jam_masuk'])) / 60);
  return ['label' => 'Telat ' . format_durasi($menit), 'tipe' => 'telat'];
}

function ket_pulang($jadwal, $jam_scan_masuk, $jam_scan_pulang) {
  if (!$jam_scan_masuk) return ['label' => '-', 'tipe' => 'alpha'];
  if (!$jam_scan_pulang) return ['label' => 'Belum Scan Pulang', 'tipe' => 'warning'];
  if ($jam_scan_pulang >= $jadwal['jam_pulang']) return ['label' => 'Pulang Tepat Waktu', 'tipe' => 'hadir'];
  $menit = round((strtotime($jadwal['jam_pulang']) - strtotime($jam_scan_pulang)) / 60);
  return ['label' => 'Pulang Awal ' . format_durasi($menit), 'tipe' => 'pulang'];
}

$hasil = [];
$tgl = new DateTime($dari);
$akhir = new DateTime($sampai);

while ($tgl <= $akhir) {
  $tanggal = $tgl->format('Y-m-d');
  $hari = $HARI_MAP[$tgl->format('l')];

  $sql = "SELECT gj.jam_masuk, gj.jam_pulang, gj.toleransi_telat_menit,
                 g.id AS guru_id, g.nama AS nama_guru, p.jam_scan_masuk, p.jam_scan_pulang
          FROM guru_jadwal gj
          JOIN guru g ON g.id = gj.guru_id AND g.aktif = 1
          LEFT JOIN presensi p ON p.guru_id = gj.guru_id AND p.tanggal = ?
          WHERE gj.hari = ?";
  $params = [$tanggal, $hari];

  if ($guru_id !== '' && is_numeric($guru_id)) {
    $sql .= " AND g.id = ?";
    $params[] = $guru_id;
  }
  $sql .= " ORDER BY g.nama";

  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);

  foreach ($stmt->fetchAll() as $row) {
    $izin = cek_izin($pdo, $row['guru_id'], $tanggal);
    if ($izin && !$row['jam_scan_masuk']) {
      $km = ['label' => $izin['jenis'], 'tipe' => strtolower($izin['jenis'])];
    } else {
      $km = ket_masuk($row, $row['jam_scan_masuk']);
    }
    $kp = ket_pulang($row, $row['jam_scan_masuk'], $row['jam_scan_pulang']);

    $cocok_status = true;
    if ($status === 'telat') $cocok_status = $km['tipe'] === 'telat';
    elseif ($status === 'pulang_awal') $cocok_status = $kp['tipe'] === 'pulang';
    elseif ($status === 'alpha') $cocok_status = $km['tipe'] === 'alpha';
    elseif ($status === 'belum_pulang') $cocok_status = $kp['tipe'] === 'warning';
    elseif (in_array($status, ['sakit','izin','kegiatan'])) $cocok_status = $km['tipe'] === $status;

    if (!$cocok_status) continue;

    $hasil[] = [
      'tanggal' => $tanggal,
      'nama_guru' => $row['nama_guru'],
      'jam_scan_masuk' => $row['jam_scan_masuk'],
      'jam_scan_pulang' => $row['jam_scan_pulang'],
      'ket_masuk' => $km['label'], 'ket_masuk_tipe' => $km['tipe'],
      'ket_pulang' => $kp['label'], 'ket_pulang_tipe' => $kp['tipe'],
    ];
  }
  $tgl->modify('+1 day');
}

usort($hasil, fn($a, $b) => strcmp($b['tanggal'], $a['tanggal']));
respond(['data' => $hasil]);
