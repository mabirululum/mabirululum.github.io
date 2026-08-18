<?php
require __DIR__ . '/db.php';
requier __DIR__ . '/helpers-jadwal.php'

if ($_SERVER['REQUEST_METHOD'] !== 'GET') respond(['error' => 'Method tidak didukung'], 405);

$dari = $_GET['dari'] ?? date('Y-m-d', strtotime('-6 days'));
$sampai = $_GET['sampai'] ?? date('Y-m-d');
$guru_id = $_GET['guru_id'] ?? '';
$status = $_GET['status'] ?? '';

$HARI_MAP = ['Sunday'=>'Minggu','Monday'=>'Senin','Tuesday'=>'Selasa','Wednesday'=>'Rabu',
             'Thursday'=>'Kamis','Friday'=>'Jumat','Saturday'=>'Sabtu'];

const MENIT_PER_JAM_PELAJARAN = 40;

function format_durasi($total_menit) {
  $jam = intdiv($total_menit, 60);
  $sisa_menit = $total_menit % 60;
  if ($jam > 0) return $sisa_menit > 0 ? "$jam Jam $sisa_menit Menit" : "$jam Jam";
  return "$total_menit Menit";
}

const MENIT_PER_JAM_PELAJARAN = 40;

function hitung_jam_pelajaran_izin($izin, $jadwal) {
  if ($izin['jam_mulai'] && $izin['jam_selesai']) {
    $menit = round((strtotime($izin['jam_selesai']) - strtotime($izin['jam_mulai'])) / 60);
  } else {
    // izin sehari penuh -> hitung dari durasi jadwal guru hari itu
    $menit = round((strtotime($jadwal['jam_pulang']) - strtotime($jadwal['jam_masuk'])) / 60);
  }
  $jp = max(1, round($menit / MENIT_PER_JAM_PELAJARAN));
  return ['menit' => $menit, 'jam_pelajaran' => $jp];
}

function cek_izin($pdo, $guru_id, $tanggal) {
  static $cache = [];
  $key = "$guru_id|$tanggal";
  if (!array_key_exists($key, $cache)) {
    $stmt = $pdo->prepare('SELECT jenis, jam_mulai, jam_selesai, keterangan FROM izin WHERE guru_id = ? AND tanggal = ? ORDER BY jam_mulai ASC');
    $stmt->execute([$guru_id, $tanggal]);
    $cache[$key] = $stmt->fetchAll(); // array
  }
  return $cache[$key];
}

function cek_libur($pdo, $tanggal) {
  static $cache = [];
  if (!array_key_exists($tanggal, $cache)) {
    $stmt = $pdo->prepare('SELECT keterangan FROM hari_libur WHERE tanggal = ?');
    $stmt->execute([$tanggal]);
    $cache[$tanggal] = $stmt->fetch();
  }
  return $cache[$tanggal];
}

function hitung_jam_pelajaran_izin($daftarIzin, $jadwal) {
  $izinParsial = array_values(array_filter($daftarIzin, fn($iz) => $iz['jenis'] === 'Izin' && $iz['jam_mulai'] && $iz['jam_selesai']));

  if ($izinParsial) {
    $totalMenit = 0;
    foreach ($izinParsial as $w) {
      $totalMenit += round((strtotime($w['jam_selesai']) - strtotime($w['jam_mulai'])) / 60);
    }
  } else {
    $totalMenit = round((strtotime($jadwal['jam_pulang']) - strtotime($jadwal['jam_masuk'])) / 60);
  }

  $jp = max(1, round($totalMenit / MENIT_PER_JAM_PELAJARAN));
  return ['menit' => $totalMenit, 'jam_pelajaran' => $jp];
}

function ket_masuk($jadwal, $jam_scan_masuk, $izin = []) {
  if (!$jam_scan_masuk) return ['label' => 'Alpha', 'tipe' => 'alpha', 'menit' => 0];
  if (in_array($jadwal['kategori'], ['struktural', 'mengaji'])) {
    return ['label' => 'Hadir jam ' . substr($jam_scan_masuk, 0, 5), 'tipe' => 'hadir', 'menit' => 0];
  }

  $jadwalEfektif = jadwal_efektif($jadwal, $izin);
  $suffix = !empty($jadwalEfektif['_ada_izin_sebagian']) ? ' (Izin sebagian jam)' : '';

  if ($jam_scan_masuk <= $jadwalEfektif['jam_masuk']) {
    return ['label' => 'Hadir Tepat Waktu' . $suffix, 'tipe' => 'hadir', 'menit' => 0];
  }
  $menit = round((strtotime($jam_scan_masuk) - strtotime($jadwalEfektif['jam_masuk'])) / 60);
  return ['label' => 'Telat ' . format_durasi($menit) . $suffix, 'tipe' => 'telat', 'menit' => $menit];
}

function ket_pulang($jadwal, $jam_scan_masuk, $jam_scan_pulang, $izin = []) {
  if (!$jam_scan_masuk) return ['label' => '-', 'tipe' => 'alpha', 'menit' => 0];
  if (in_array($jadwal['kategori'], ['struktural', 'mengaji'])) {
    return ['label' => 'Pulang jam ' . substr($jam_scan_pulang ?? '', 0, 5), 'tipe' => 'hadir', 'menit' => 0];
  }
  if (!$jam_scan_pulang) return ['label' => 'Belum Scan Pulang', 'tipe' => 'warning', 'menit' => 0];

  $jadwalEfektif = jadwal_efektif($jadwal, $izin);
  $suffix = !empty($jadwalEfektif['_ada_izin_sebagian']) ? ' (Izin sebagian jam)' : '';

  if ($jam_scan_pulang >= $jadwalEfektif['jam_pulang']) {
    return ['label' => 'Pulang Tepat Waktu' . $suffix, 'tipe' => 'hadir', 'menit' => 0];
  }
  $menit = round((strtotime($jadwalEfektif['jam_pulang']) - strtotime($jam_scan_pulang)) / 60);
  return ['label' => 'Pulang Awal ' . format_durasi($menit) . $suffix, 'tipe' => 'pulang', 'menit' => $menit];
}

$hasil = [];
$tgl = new DateTime($dari);
$akhir = new DateTime($sampai);

while ($tgl <= $akhir) {
  $tanggal = $tgl->format('Y-m-d');
  $hari = $HARI_MAP[$tgl->format('l')];
  $libur = cek_libur($pdo, $tanggal);
  $kegiatan = cek_hari_kegiatan($pdo, $tanggal);

  $sql = "SELECT gj.jam_masuk, gj.jam_pulang, gj.toleransi_telat_menit, gj.kategori,
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
    $izin = cek_izin($pdo, $row['guru_id'], $tanggal); // array, bisa banyak baris

    $menitIzin = 0;
    $jpIzin = 0;
    if (!empty($izin)) {
      $hitung = hitung_jam_pelajaran_izin($izin, $row);
      $menitIzin = $hitung['menit'];
      $jpIzin = $hitung['jam_pelajaran'];
    }
    $izinNonJam = !empty($izin) ? $izin[0] : null;

    if ($libur && !$row['jam_scan_masuk']) {
      $km = ['label' => 'Libur: ' . $libur['keterangan'], 'tipe' => 'libur', 'menit' => 0];
      $kp = ['label' => 'Libur: ' . $libur['keterangan'], 'tipe' => 'libur', 'menit' => 0];
    } elseif (!empty($izin) && !$row['jam_scan_masuk']) {
      if ($izinNonJam['jenis'] === 'Izin') {
        $km = ['label' => 'Izin ' . $jpIzin . ' Jam Pelajaran', 'tipe' => 'izin', 'menit' => 0];
      } else {
        $km = ['label' => $izinNonJam['jenis'], 'tipe' => strtolower($izinNonJam['jenis']), 'menit' => 0];
      }
      $kp = ket_pulang($row, $row['jam_scan_masuk'], $row['jam_scan_pulang']);
    } elseif ($kegiatan) {
      // Hari kegiatan sekolah: cukup "Hadir jam ..." / "Pulang jam ...", tanpa vonis telat/pulang awal
      $km = $row['jam_scan_masuk']
        ? ['label' => 'Hadir jam ' . substr($row['jam_scan_masuk'], 0, 5), 'tipe' => 'hadir', 'menit' => 0]
        : ['label' => 'Alpha', 'tipe' => 'alpha', 'menit' => 0];
      $kp = !$row['jam_scan_masuk']
        ? ['label' => '-', 'tipe' => 'alpha', 'menit' => 0]
        : (!$row['jam_scan_pulang']
            ? ['label' => 'Belum Scan Pulang', 'tipe' => 'warning', 'menit' => 0]
            : ['label' => 'Pulang jam ' . substr($row['jam_scan_pulang'], 0, 5), 'tipe' => 'hadir', 'menit' => 0]);
    } else {
      $km = ket_masuk($row, $row['jam_scan_masuk'], $izin);
      $kp = ket_pulang($row, $row['jam_scan_masuk'], $row['jam_scan_pulang'], $izin);
    }

    $cocok_status = true;
    if ($status === 'telat') $cocok_status = $km['tipe'] === 'telat';
    elseif ($status === 'pulang_awal') $cocok_status = $kp['tipe'] === 'pulang';
    elseif ($status === 'alpha') $cocok_status = $km['tipe'] === 'alpha';
    elseif ($status === 'belum_pulang') $cocok_status = $kp['tipe'] === 'warning';
    elseif ($status === 'libur') $cocok_status = $km['tipe'] === 'libur';
    elseif ($status === 'kegiatan_sekolah') $cocok_status = !empty($kegiatan);
    elseif (in_array($status, ['sakit','izin','kegiatan','cuti'])) $cocok_status = $km['tipe'] === $status;

    if (!$cocok_status) continue;

    $hasil[] = [
      'tanggal' => $tanggal,
      'nama_guru' => $row['nama_guru'],
      'jam_scan_masuk' => $row['jam_scan_masuk'],
      'jam_scan_pulang' => $row['jam_scan_pulang'],
      'ket_masuk' => $km['label'], 'ket_masuk_tipe' => $km['tipe'],
      'ket_pulang' => $kp['label'], 'ket_pulang_tipe' => $kp['tipe'],
      'menit_telat' => $km['menit'] ?? 0,
      'menit_pulang_awal' => $kp['menit'] ?? 0,
      'menit_izin' => $menitIzin,
    ];
  }
  $tgl->modify('+1 day');
}

usort($hasil, fn($a, $b) => strcmp($b['tanggal'], $a['tanggal']));
respond(['data' => $hasil]);
