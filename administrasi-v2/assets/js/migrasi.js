// Konfigurasi Supabase
const supabaseUrl = 'https://dnmdzeidoonnvqbdltce.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRubWR6ZWlkb29ubnZxYmRsdGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMzcwNzMsImV4cCI6MjEwMjcxMzA3M30.bcCZ8Zon_QfZRTEWD7odKppk8mI9r-a5nY8XFezb-yU';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const useServer = true; // Biarkan true agar UI mendeteksi kita online
let currentUserRole = '';
let activeRestoreTab = 'pemasukan';

// State Pagination (Tidak Diubah)
const adminTableState = {
	datasiswa: { activeTab: 'aktif', query: '', filterKelas: 'All', page: 1 },
	pemasukan: { page: 1, query: '' },
	bantuan: { page: 1, query: '' },
	infaq: { page: 1, query: '' },
	pengeluaran: { page: 1, query: '' },
	'pengeluaran-non': { page: 1, query: '' },
	tarif: { page: 1, query: '' },
	restore: { page: 1, query: '' },
	user: { page: 1, query: '' },
};

// Database Lokal Kosong (Akan diisi otomatis oleh Supabase)
let dbMaster = { jenisPembayaran: [], jenisBantuan: [], jenisPengeluaran: [], jenisPengeluaranNon: [], tahunAjaran: [], jenisKelas: [] };
let dbSiswa = [], dbAdmin = [], dbPembayaran = [], dbBantuan = [], dbPengeluaran = [], dbPengeluaranNon = [], dbInfaq = [], dbMasterTarif = [];

// ==========================================
// 2. FUNGSI TARIK DATA DARI SUPABASE
// ==========================================
async function loadDataFromSupabase() {
    try {
        const [
            { data: adminData }, { data: siswaData }, { data: tarifData }, 
            { data: pemasukanData }, { data: bantuanData }, { data: pengeluaranData }, 
            { data: pengeluaranNonData }, { data: infaqData }, { data: masterData }
        ] = await Promise.all([
            supabase.from('admin_users').select('*'),
            supabase.from('data_siswa').select('*'),
            supabase.from('master_tarif').select('*'),
            supabase.from('pemasukan').select('*'),
            supabase.from('bantuan').select('*'),
            supabase.from('pengeluaran').select('*'),
            supabase.from('pengeluaran_nonops').select('*'),
            supabase.from('infaq').select('*'),
            supabase.from('master_data').select('*')
        ]);

        // Mapping Data SQL (snake_case) ke Format Javascript (camelCase)
        dbAdmin = (adminData || []).map(r => ({ id: r.id, username: r.username, password: r.password, nama: r.nama_admin, role: r.role }));
        dbSiswa = (siswaData || []).map(r => ({ nis: r.nis, nama: r.nama, lp: r.lp, tahunMasuk: r.tahun_masuk, kelas: r.kelas_status, bulanMulai: r.bulan_mulai_tagihan, kelas1: r.kelas_tahun1, kelas2: r.kelas_tahun2, kelas3: r.kelas_tahun3 }));
        dbMasterTarif = (tarifData || []).map(r => ({ id: r.id_tarif, tahun: r.tahun_ajaran, target: r.target_kelas, jenis: r.jenis_tagihan, nominal: r.nominal_tarif, isDeleted: r.is_deleted }));
        dbPembayaran = (pemasukanData || []).map(r => ({ id: r.id_transaksi, acuanBayar: r.acuan_bayar, tanggalInput: r.tanggal_input, waktuInput: r.waktu_input, nis: r.nis, nama: r.nama_lengkap, lp: r.lp, jenis: r.jenis_pembayaran, tahun: r.tahun_ajaran, nominal: r.nominal, isDeleted: r.is_deleted }));
        dbBantuan = (bantuanData || []).map(r => ({ id: r.id_transaksi, tanggalInput: r.tanggal_input, waktuInput: r.waktu_input, tglTransaksi: r.tanggal_transaksi, keterangan: r.keterangan, jenis: r.jenis_bantuan, tahun: r.tahun_ajaran, nominal: r.nominal, isDeleted: r.is_deleted }));
        dbPengeluaran = (pengeluaranData || []).map(r => ({ id: r.id_transaksi, tanggalInput: r.tanggal_input, waktuInput: r.waktu_input, tglTransaksi: r.tanggal_nota, keterangan: r.keterangan, jenis: r.jenis_pengeluaran, tahun: r.tahun_ajaran, nominal: r.nominal, isDeleted: r.is_deleted }));
        dbPengeluaranNon = (pengeluaranNonData || []).map(r => ({ id: r.id_transaksi, tanggalInput: r.tanggal_input, waktuInput: r.waktu_input, tglTransaksi: r.tanggal_nota, keterangan: r.keterangan, jenis: r.jenis_pengeluaran_nonops, tahun: r.tahun_ajaran, nominal: r.nominal, isDeleted: r.is_deleted }));
        dbInfaq = (infaqData || []).map(r => ({ id: r.id_transaksi, tanggalInput: r.tanggal_input, waktuInput: r.waktu_input, tglTransaksi: r.tanggal_transaksi, jenis: r.jenis_mutasi, keterangan: r.keterangan, nominal: r.nominal, isDeleted: r.is_deleted }));

        if (masterData) {
            dbMaster = {
                jenisPembayaran: masterData.filter(d => d.kategori === 'jenis_pembayaran').map(d => d.nilai),
                jenisBantuan: masterData.filter(d => d.kategori === 'jenis_bantuan').map(d => d.nilai),
                jenisPengeluaran: masterData.filter(d => d.kategori === 'jenis_pengeluaran').map(d => d.nilai),
                jenisPengeluaranNon: masterData.filter(d => d.kategori === 'jenis_pengeluaran_nonops').map(d => d.nilai),
                tahunAjaran: masterData.filter(d => d.kategori === 'tahun_ajaran').map(d => d.nilai),
                jenisKelas: masterData.filter(d => d.kategori === 'jenis_kelas').map(d => d.nilai)
            };
        }

        initDropdowns(); // Fungsi ini akan disalin dari admin.js
        return true;
    } catch (error) {
        console.error("Gagal menarik data:", error);
        return false;
    }
}

// ==========================================
// 3. FUNGSI LOGIN ADMIN & SISWA
// ==========================================
async function handleLoginAdmin(e) {
    e.preventDefault();
    const user = String(document.getElementById('login-username').value).trim();
    const pass = String(document.getElementById('login-password').value).trim();
    showLoading("Otentikasi & Memuat Database...");

    const isSuccess = await loadDataFromSupabase();
    
    hideLoading();
    if (!isSuccess) {
        showToast('Gagal Muat Database Supabase!', 'error');
        return;
    }

    const admin = dbAdmin.find(a => String(a.username).trim() === user && String(a.password).trim() === pass);
    
    if (admin) {
        renderAdminView(admin); // Fungsi ini disalin dari admin.js
        setupIdleTimer(); // Fungsi ini disalin dari admin.js
    } else {
        showToast('Username atau Password Salah!', 'error');
    }
}

async function handleLoginSiswa(e) {
    e.preventDefault();
    const nis = String(document.getElementById('login-nis').value).trim();
    showLoading("Memeriksa NIS...");

    const isSuccess = await loadDataFromSupabase();
    hideLoading();

    if (!isSuccess) {
        showToast('Gagal terhubung ke database', 'error');
        return;
    }

    const s = dbSiswa.find(s => String(s.nis).trim() === nis);
    if(s) { 
        let riwayat = dbPembayaran.filter(p => !p.isDeleted && String(p.nis).trim() === nis);
        let billing = calculateSiswaBilling(s, dbMasterTarif, riwayat); // Fungsi kalkulasi disalin dari admin.js
        renderSiswaView(s, billing); // Fungsi ini disalin dari admin.js
    } else {
        showToast('NIS tidak ditemukan!', 'error');
    }
}

// ==========================================
// 4. SUPABASE CRUD & OPTIMISTIC UI
// ==========================================

// Helper: Mencocokkan nama tipe dengan nama tabel di Supabase
function getTableName(tipe) {
    const map = {
        'pemasukan': 'pemasukan',
        'bantuan': 'bantuan',
        'pengeluaran': 'pengeluaran',
        'pengeluaran-non': 'pengeluaran_nonops',
        'infaq': 'infaq',
        'tarif': 'master_tarif',
        'user': 'admin_users'
    };
    return map[tipe];
}

// Helper: Menerjemahkan format Javascript (camelCase) ke SQL (snake_case)
function mapToSupabase(tipe, data) {
    let payload = {};
    if (tipe !== 'user') payload.is_deleted = false; // admin_users tidak punya is_deleted

    if (tipe === 'pemasukan') {
        payload.id_transaksi = data.id;
        payload.acuan_bayar = data.acuanBayar;
        payload.tanggal_input = data.tanggalInput;
        payload.waktu_input = data.waktuInput;
        payload.nis = data.nis;
        payload.nama_lengkap = data.nama;
        payload.lp = data.lp;
        payload.jenis_pembayaran = data.jenis;
        payload.tahun_ajaran = data.tahun;
        payload.nominal = data.nominal;
    } else if (tipe === 'bantuan') {
        payload.id_transaksi = data.id;
        payload.tanggal_input = data.tanggalInput;
        payload.waktu_input = data.waktuInput;
        payload.tanggal_transaksi = data.tglTransaksi;
        payload.keterangan = data.keterangan;
        payload.jenis_bantuan = data.jenis;
        payload.tahun_ajaran = data.tahun;
        payload.nominal = data.nominal;
    } else if (tipe === 'pengeluaran') {
        payload.id_transaksi = data.id;
        payload.tanggal_input = data.tanggalInput;
        payload.waktu_input = data.waktuInput;
        payload.tanggal_nota = data.tglTransaksi;
        payload.keterangan = data.keterangan;
        payload.jenis_pengeluaran = data.jenis;
        payload.tahun_ajaran = data.tahun;
        payload.nominal = data.nominal;
    } else if (tipe === 'pengeluaran-non') {
        payload.id_transaksi = data.id;
        payload.tanggal_input = data.tanggalInput;
        payload.waktu_input = data.waktuInput;
        payload.tanggal_nota = data.tglTransaksi;
        payload.keterangan = data.keterangan;
        payload.jenis_pengeluaran_nonops = data.jenis;
        payload.tahun_ajaran = data.tahun;
        payload.nominal = data.nominal;
    } else if (tipe === 'infaq') {
        payload.id_transaksi = data.id;
        payload.tanggal_input = data.tanggalInput;
        payload.waktu_input = data.waktuInput;
        payload.tanggal_transaksi = data.tglTransaksi;
        payload.jenis_mutasi = data.jenis;
        payload.keterangan = data.keterangan;
        payload.nominal = data.nominal;
    } else if (tipe === 'tarif') {
        payload.id_tarif = data.id;
        payload.tahun_ajaran = data.tahun;
        payload.target_kelas = data.target;
        payload.jenis_tagihan = data.jenis;
        payload.nominal_tarif = data.nominal;
    } else if (tipe === 'user') {
        if (!String(data.id).includes('TEMP')) payload.id = data.id; // Jika baru, biarkan Supabase buatkan UUID
        payload.username = data.username;
        payload.password = data.password;
        payload.nama_admin = data.nama;
        payload.role = data.role;
    }
    return payload;
}

// ==========================================
// ROMBAK FUNGSI SIMPAN
// ==========================================
async function processOptimisticSave(tipe, localDbArray, dataObject, renderFunction) {
    dataObject.isDeleted = false; 

    // 1. UPDATE UI SECARA INSTAN (Optimistic UI)
    if (dataObject.isEdit) {
        let matchId = dataObject.id || dataObject.oldUsername;
        let idx = localDbArray.findIndex(t => String(t.id || t.username) === String(matchId));
        if (idx !== -1) localDbArray[idx] = { ...localDbArray[idx], ...dataObject };
    } else {
        localDbArray.push(dataObject);
    }

    showToast('Menyimpan ke server...', 'info');
    cancelEdit(tipe); // Fungsi bawaan disalin dari admin.js
    adminTableState[tipe].page = 1;
    renderFunction();
    loadDashboardStats(); // Fungsi bawaan disalin dari admin.js

    // 2. KIRIM KE SUPABASE DI BACKGROUND
    try {
        const tableName = getTableName(tipe);
        const payload = mapToSupabase(tipe, dataObject);

        // Jika update Admin (User), kita gunakan update berdasar username lama
        if (tipe === 'user' && dataObject.isEdit) {
            const { error } = await supabase.from(tableName).update(payload).eq('username', dataObject.oldUsername);
            if (error) throw error;
        } else {
            // Upsert (Insert atau Update)
            const { data, error } = await supabase.from(tableName).upsert(payload).select();
            if (error) throw error;
            
            // Jika insert User baru, Supabase akan mengembalikan UUID asli, update UI lokal kita
            if (tipe === 'user' && !dataObject.isEdit && data && data.length > 0) {
                let idx = localDbArray.findIndex(t => String(t.username) === String(dataObject.username));
                if (idx !== -1) localDbArray[idx].id = data[0].id;
            }
        }
        
        // Hapus label "TEMP-" dari ID di UI karena sudah sukses sinkron
        if (dataObject.id && String(dataObject.id).includes('TEMP')) {
            let idx = localDbArray.findIndex(t => String(t.id) === String(dataObject.id));
            if (idx !== -1) {
                // Kita ubah ID TEMP- menjadi ID Permanen (Misal: dari TEMP-123 jadi TRX-123)
                let newId = dataObject.id.replace('TEMP-', 'TRX-'); 
                localDbArray[idx].id = newId;
            }
        }
        
        renderFunction(); // Refresh tabel untuk hilangkan ikon loading
        showToast('Data berhasil disinkronisasi!', 'success');
    } catch (error) {
        console.error(error);
        showToast('Gagal simpan: ' + error.message, 'error');
    }
}

// ==========================================
// ROMBAK FUNGSI HAPUS
// ==========================================
async function confirmDelete() {
    const { tipe, id } = deleteTarget;
    document.getElementById('delete-modal').classList.add('hidden'); // Fungsi bawaan

    let targetDb, renderFn;
    if (tipe === 'pemasukan') { targetDb = dbPembayaran; renderFn = loadAdminTable; } 
    else if (tipe === 'bantuan') { targetDb = dbBantuan; renderFn = loadAdminBantuanTable; } 
    else if (tipe === 'pengeluaran') { targetDb = dbPengeluaran; renderFn = loadAdminPengeluaranTable; } 
    else if (tipe === 'pengeluaran-non') { targetDb = dbPengeluaranNon; renderFn = loadAdminPengeluaranNonTable; } 
    else if (tipe === 'infaq') { targetDb = dbInfaq; renderFn = loadAdminInfaqTable; } 
    else if (tipe === 'user') { targetDb = dbAdmin; renderFn = loadAdminUserTable; } 
    else if (tipe === 'tarif') { targetDb = dbMasterTarif; renderFn = loadAdminTarifTable; }

    const idx = targetDb.findIndex(t => String(t.id) === String(id));
    if (idx === -1) return;

    // 1. OPTIMISTIC DELETE DI UI LOKAL
    if (tipe === 'user' || tipe === 'tarif') {
        backupDeletedData = targetDb[idx];
        backupDeletedIndex = idx;
        targetDb.splice(idx, 1); // Hard Delete Lokal
    } else {
        targetDb[idx].isDeleted = true; // Soft Delete Lokal
    }

    loadDashboardStats();
    renderFn();
    updateRestoreBadges(); // Fungsi bawaan
    if (currentUserRole === 'Super Admin' && !document.getElementById('admin-view-restore').classList.contains('hidden')) loadRestoreTable();
    showToast('Menghapus dari server...', 'info');

    // 2. KIRIM PERINTAH HAPUS KE SUPABASE
    try {
        const tableName = getTableName(tipe);
        
        if (tipe === 'user' || tipe === 'tarif') {
            // HARD DELETE DI DATABASE
            const pkColumn = tipe === 'user' ? 'id' : 'id_tarif';
            const { error } = await supabase.from(tableName).delete().eq(pkColumn, id);
            if (error) throw error;
        } else {
            // SOFT DELETE DI DATABASE
            const { error } = await supabase.from(tableName).update({ is_deleted: true }).eq('id_transaksi', id);
            if (error) throw error;
        }
        showToast('Berhasil dihapus!', 'success');
    } catch (error) {
        console.error(error);
        // ROLLBACK JIKA GAGAL
        if (tipe === 'user' || tipe === 'tarif') targetDb.splice(backupDeletedIndex, 0, backupDeletedData);
        else targetDb[idx].isDeleted = false;
        
        loadDashboardStats(); renderFn(); updateRestoreBadges();
        if (currentUserRole === 'Super Admin') loadRestoreTable();
        showToast('Gagal menghapus di server. Data dikembalikan.', 'error');
    }

    deleteTarget = { tipe: null, id: null };
}

// ==========================================
// ROMBAK FUNGSI PULIHKAN
// ==========================================
async function restoreData(tipe, id) {
    let targetDb, renderFn;
    if (tipe === 'pemasukan') { targetDb = dbPembayaran; renderFn = loadAdminTable; } 
    else if (tipe === 'bantuan') { targetDb = dbBantuan; renderFn = loadAdminBantuanTable; } 
    else if (tipe === 'pengeluaran') { targetDb = dbPengeluaran; renderFn = loadAdminPengeluaranTable; } 
    else if (tipe === 'pengeluaran-non') { targetDb = dbPengeluaranNon; renderFn = loadAdminPengeluaranNonTable; } 
    else if (tipe === 'infaq') { targetDb = dbInfaq; renderFn = loadAdminInfaqTable; }

    const idx = targetDb.findIndex(t => String(t.id) === String(id));
    if (idx === -1) return;

    // 1. OPTIMISTIC RESTORE DI UI
    targetDb[idx].isDeleted = false;
    loadDashboardStats();
    updateRestoreBadges();
    loadRestoreTable(); // Fungsi bawaan
    renderFn();
    showToast('Memulihkan data...', 'info');

    // 2. KIRIM PERINTAH UPDATE KE SUPABASE
    try {
        const tableName = getTableName(tipe);
        const { error } = await supabase.from(tableName).update({ is_deleted: false }).eq('id_transaksi', id);
        
        if (error) throw error;
        showToast('Data berhasil dipulihkan!', 'success');
    } catch (error) {
        console.error(error);
        // ROLLBACK JIKA GAGAL
        targetDb[idx].isDeleted = true;
        loadDashboardStats(); updateRestoreBadges(); loadRestoreTable(); renderFn();
        showToast('Gagal memulihkan di server.', 'error');
    }
}