// ==========================================
// file: config.js
// Fungsi: Menyimpan konfigurasi Supabase dan Variabel Global
// ==========================================

// 1. KONFIGURASI SUPABASE
const supabaseUrl = 'https://dnmdzeidoonnvqbdltce.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRubWR6ZWlkb29ubnZxYmRsdGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMzcwNzMsImV4cCI6MjEwMjcxMzA3M30.bcCZ8Zon_QfZRTEWD7odKppk8mI9r-a5nY8XFezb-yU';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const useServer = true; // Flag untuk mendeteksi mode online

// 2. VARIABEL STATE APLIKASI
let currentUserRole = '';
let activeRestoreTab = 'pemasukan';
let idleTimer; // Untuk auto-logout
let refreshCountdownInterval = null; // Untuk cooldown tombol refresh siswa
let resizeTimer;
let deleteTarget = { tipe: null, id: null };
let backupDeletedData = null;
let backupDeletedIndex = -1;

// 3. STATE PAGINATION TABEL
const adminTableState = {
    datasiswa: { activeTab: 'aktif', query: '', filterKelas: 'All', page: 1 },
    pemasukan: { page: 1, query: '' },
    atribut: { page: 1, query: '' },
    bantuan: { page: 1, query: '' },
    infaq: { page: 1, query: '' },
    pengeluaran: { page: 1, query: '' },
    'pengeluaran-non': { page: 1, query: '' },
    tarif: { page: 1, query: '' },
    master_atribut: { page: 1, query: '' },
    restore: { page: 1, query: '' },
    user: { page: 1, query: '' },
};

// 4. DATABASE LOKAL (Akan diisi oleh Supabase nanti)
let dbMaster = {
    jenisPembayaran: [],
    jenisAtribut: [],
    jenisBantuan: [],
    jenisPengeluaran: [],
    jenisPengeluaranNon: [],
    tahunAjaran: [],
    jenisKelas: []
};
let dbSiswa = [],
    dbAdmin = [],
    dbPembayaran = [],
    dbMasterAtribut = [],
    dbPemasukanAtribut = [],
    dbBantuan = [],
    dbPengeluaran = [],
    dbPengeluaranNon = [],
    dbInfaq = [],
    dbMasterTarif = [];