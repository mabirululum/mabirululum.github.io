<?php
date_default_timezone_set('Asia/Jakarta'); // WIB. Ganti 'Asia/Makassar' (WITA) / 'Asia/Jayapura' (WIT) jika perlu

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

ini_set('display_errors', '0');
error_reporting(E_ALL);

set_exception_handler(function ($e) {
  http_response_code(500);
  echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
  exit;
});

set_error_handler(function ($severity, $message, $file, $line) {
  http_response_code(500);
  echo json_encode(['error' => "PHP $severity: $message di $file baris $line"]);
  exit;
});

// ---- Sesuaikan kredensial berikut dengan setup XAMPP/Laragon Anda ----
$DB_HOST = 'localhost';
$DB_NAME = 'presensi_app_1';
$DB_USER = 'root';
$DB_PASS = '';
// -----------------------------------------------------------------------

try {
  $pdo = new PDO(
    "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
    $DB_USER,
    $DB_PASS,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
  );
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Koneksi database gagal: ' . $e->getMessage()]);
  exit;
}

function input_json() {
  $data = json_decode(file_get_contents('php://input'), true);
  return $data ?? [];
}

function respond($data, $code = 200) {
  http_response_code($code);
  echo json_encode($data);
  exit;
}
