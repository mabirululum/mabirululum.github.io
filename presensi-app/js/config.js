// =========================================================
// KONFIGURASI APLIKASI
// Ganti MODE sesuai kebutuhan: 'online' (Supabase + GitHub Pages)
// atau 'offline' (PHP + MySQL/phpMyAdmin di PC kantor)
// =========================================================

const CONFIG = {
  MODE: 'online', // 'online' | 'offline'

  // --- Mode offline: path ke folder api/ otomatis menyesuaikan
  // apakah halaman dibuka dari root (index.html) atau dari admin/*.html ---
  API_BASE: location.pathname.includes('/admin/') ? '../api' : 'api',

  // --- Mode online: isi dari Supabase Dashboard > Project Settings > API ---
  SUPABASE_URL: 'https://stepbzuboymcwihwpyft.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXBienVib3ltY3dpaHdweWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MzY2MTAsImV4cCI6MjEwMTUxMjYxMH0.yBUBBw31xV7joA4g8dGks_M-78VsjLJjorC2Wq67R7U',
};
