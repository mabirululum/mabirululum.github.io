// ==========================================
// file: api.js
// Fungsi: Tarik, Simpan, Hapus, dan Pulihkan data ke Supabase
// ==========================================

// async function loadDataFromSupabase() {
//     try {
//         const [
//             { data: adminData }, { data: siswaData }, { data: tarifData }, 
//             { data: pemasukanData }, { data: bantuanData }, { data: pengeluaranData }, 
//             { data: pengeluaranNonData }, { data: infaqData }, { data: masterData },
//             { data: masterAtributData }, { data: pemasukanAtributData }, {data: pengaturanData}
//         ] = await Promise.all([
//             supabaseClient.from('admin_users').select('*'),
//             supabaseClient.from('data_siswa').select('*'),
//             supabaseClient.from('master_tarif').select('*'),
//             supabaseClient.from('pemasukan').select('*'),
//             supabaseClient.from('bantuan').select('*'),
//             supabaseClient.from('pengeluaran').select('*'),
//             supabaseClient.from('pengeluaran_nonops').select('*'),
//             supabaseClient.from('infaq').select('*'),
//             supabaseClient.from('master_data').select('*'),
//             supabaseClient.from('master_atribut').select('*'),
//             supabaseClient.from('pemasukan_atribut').select('*'),
//             supabaseClient.from('pengaturan').select('*'),
//         ]);

//         // Mapping Data SQL ke Format Javascript
//         dbAdmin = (adminData || []).map(r => ({
//         	id: r.id,
//         	username: r.username,
//         	password: r.password,
//         	nama: r.nama_admin,
//         	role: r.role
//         }));
//         dbSiswa = (siswaData || []).map(r => ({
//         	nis: r.nis,
//         	nama: r.nama,
//         	lp: r.lp,
//         	tahunMasuk: r.tahun_masuk,
//         	kelas: r.kelas_status,
//         	bulanMulai: r.bulan_mulai_tagihan,
//         	kelas1: r.kelas_tahun1,
//         	kelas2: r.kelas_tahun2,
//         	kelas3: r.kelas_tahun3
//         }));
//         dbMasterTarif = (tarifData || []).map(r => ({
//         	id: r.id_transaksi,
//         	tahun: r.tahun_ajaran,
//         	target: r.target_kelas,
//         	jenis: r.jenis_tagihan,
//         	nominal: r.nominal_tarif,
//         	isDeleted: r.is_deleted
//         }));
//         dbPembayaran = (pemasukanData || []).map(r => ({
//         	id: r.id_transaksi,
//         	acuanBayar: r.acuan_bayar,
//         	tanggalInput: r.tanggal_input,
//         	waktuInput: r.waktu_input,
//         	nis: r.nis,
//         	nama: r.nama_lengkap,
//         	lp: r.lp,
//         	jenis: r.jenis_pembayaran,
//         	tahun: r.tahun_ajaran,
//         	nominal: r.nominal,
//         	isDeleted: r.is_deleted,
//         	idRef: r.id_ref
//         }));
//         dbBantuan = (bantuanData || []).map(r => ({
//         	id: r.id_transaksi,
//         	tanggalInput: r.tanggal_input,
//         	waktuInput: r.waktu_input,
//         	tglTransaksi: r.tanggal_transaksi,
//         	keterangan: r.keterangan,
//         	jenis: r.jenis_bantuan,
//         	tahun: r.tahun_ajaran,
//         	nominal: r.nominal,
//         	isDeleted: r.is_deleted
//         }));
//         dbPengeluaran = (pengeluaranData || []).map(r => ({
//         	id: r.id_transaksi,
//         	tanggalInput: r.tanggal_input,
//         	waktuInput: r.waktu_input,
//         	tglTransaksi: r.tanggal_nota,
//         	keterangan: r.keterangan,
//         	jenis: r.jenis_pengeluaran,
//         	tahun: r.tahun_ajaran,
//         	nominal: r.nominal,
//         	isDeleted: r.is_deleted
//         }));
//         dbPengeluaranNon = (pengeluaranNonData || []).map(r => ({
//         	id: r.id_transaksi,
//         	tanggalInput: r.tanggal_input,
//         	waktuInput: r.waktu_input,
//         	tglTransaksi: r.tanggal_nota,
//         	keterangan: r.keterangan,
//         	jenis: r.jenis_pengeluaran_nonops,
//         	tahun: r.tahun_ajaran,
//         	nominal: r.nominal,
//         	isDeleted: r.is_deleted
//         }));
//         dbInfaq = (infaqData || []).map(r => ({
//         	id: r.id_transaksi,
//         	tanggalInput: r.tanggal_input,
//         	waktuInput: r.waktu_input,
//         	tglTransaksi: r.tanggal_transaksi,
//         	jenis: r.jenis_mutasi,
//         	keterangan: r.keterangan,
//         	nominal: r.nominal,
//         	isDeleted: r.is_deleted
//         }));
//         dbMasterAtribut = (masterAtributData || []).map(r => ({
//         	id: r.id,
//         	tahun: r.tahun_ajaran,
//         	jenis: r.jenis_atribut,
//         	nominal: r.nominal,
//         	isDeleted: r.is_deleted
//         }));
//         dbPemasukanAtribut = (pemasukanAtributData || []).map(r => ({
//         	id: r.id_transaksi,
//         	idRef: r.id_nota_referensi,
//         	acuanBayar: r.acuan_bayar,
//         	tanggalInput: r.tanggal_input,
//         	waktuInput: r.waktu_input,
//         	nis: r.nis,
//         	nama: r.nama_lengkap,
//         	lp: r.lp,
//         	jenis: r.jenis_atribut,
//         	tahun: r.tahun_ajaran,
//         	hargaKatalog: r.harga_katalog,
//         	nominal: r.nominal,
//         	isDeleted: r.is_deleted
//         }));
//         dbPengaturan = (pengaturanData || []).map(r => ({
//             id: r.id,
//             kunci: r.kunci,
//             nilai: r.nilai
//         }))

//         if (masterData) {
//             dbMaster = {
//                 jenisPembayaran: masterData.filter(d => d.kategori === 'jenis_pembayaran').map(d => d.nilai),
//                 jenisBantuan: masterData.filter(d => d.kategori === 'jenis_bantuan').map(d => d.nilai),
//                 jenisPengeluaran: masterData.filter(d => d.kategori === 'jenis_pengeluaran').map(d => d.nilai),
//                 jenisPengeluaranNon: masterData.filter(d => d.kategori === 'jenis_pengeluaran_nonops').map(d => d.nilai),
//                 tahunAjaran: masterData.filter(d => d.kategori === 'tahun_ajaran').map(d => d.nilai),
//                 jenisKelas: masterData.filter(d => d.kategori === 'jenis_kelas').map(d => d.nilai)
//             };
//         }

//         initDropdowns(); // Di ui.js nanti
//         return true;
//     } catch (error) {
//         console.error("Gagal menarik data:", error);
//         return false;
//     }
// }

async function loadDataFromSupabase(konteks = 'admin', filterNis = null) {
    try {
        // 1. Siapkan struktur Query Dinamis
        let qPemasukan = supabaseClient.from('pemasukan').select('*');
        let qPemasukanAtribut = supabaseClient.from('pemasukan_atribut').select('*');
        let qBantuan = supabaseClient.from('bantuan').select('*');
        let qPengeluaran = supabaseClient.from('pengeluaran').select('*');
        let qPengeluaranNon = supabaseClient.from('pengeluaran_nonops').select('*');
        let qInfaq = supabaseClient.from('infaq').select('*');

        // 2. Logika Pemisahan Konteks (Admin vs Siswa)
        if (konteks === 'admin') {
            // Mode Admin: Tarik SEMUA siswa, tapi batasi hanya TAHUN AKTIF (Soft Reset)
        } 
        else if (konteks === 'siswa' && filterNis) {
            // Mode Siswa: Tarik SEMUA tahun ajaran, tapi batasi HANYA UNTUK NIS INI (Cek Tunggakan)
            qPemasukan = qPemasukan.eq('nis', filterNis);
            qPemasukanAtribut = qPemasukanAtribut.eq('nis', filterNis);
            
            // Penghematan Kuota Server: Siswa tidak perlu load data pengeluaran sekolah!
            qBantuan = qBantuan.limit(0);
            qPengeluaran = qPengeluaran.limit(0);
            qPengeluaranNon = qPengeluaranNon.limit(0);
            qInfaq = qInfaq.limit(0);
        }

        // 3. Eksekusi Promise.all (Jauh lebih cepat dan hemat memori)
        const [
            { data: adminData }, { data: siswaData }, { data: tarifData }, 
            { data: pemasukanData }, { data: bantuanData }, { data: pengeluaranData }, 
            { data: pengeluaranNonData }, { data: infaqData }, { data: masterData },
            { data: masterAtributData }, { data: pemasukanAtributData }, {data: pengaturanData}
        ] = await Promise.all([
            supabaseClient.from('admin_users').select('*'),
            supabaseClient.from('data_siswa').select('*'),
            supabaseClient.from('master_tarif').select('*'),
            qPemasukan,          // Dinamis
            qBantuan,            // Dinamis
            qPengeluaran,        // Dinamis
            qPengeluaranNon,     // Dinamis
            qInfaq,              // Dinamis
            supabaseClient.from('master_data').select('*'),
            supabaseClient.from('master_atribut').select('*'),
            qPemasukanAtribut,   // Dinamis
            supabaseClient.from('pengaturan').select('*'),
        ]);

        // Mapping Data SQL ke Format Javascript
        dbAdmin = (adminData || []).map(r => ({
        	id: r.id,
        	username: r.username,
        	password: r.password,
        	nama: r.nama_admin,
        	role: r.role,
        	urlTtd: r.url_ttd || ''
        }));
        dbSiswa = (siswaData || []).map(r => ({
        	nis: r.nis,
        	nama: r.nama,
        	lp: r.lp,
        	tahunMasuk: r.tahun_masuk,
        	kelas: r.kelas_status,
        	bulanMulai: r.bulan_mulai_tagihan,
        	kelas1: r.kelas_tahun1,
        	kelas2: r.kelas_tahun2,
        	kelas3: r.kelas_tahun3
        }));
        dbMasterTarif = (tarifData || []).map(r => ({
        	id: r.id_transaksi,
        	tahun: r.tahun_ajaran,
        	target: r.target_kelas,
        	jenis: r.jenis_tagihan,
        	nominal: r.nominal_tarif,
        	isDeleted: r.is_deleted
        }));
        dbPembayaran = (pemasukanData || []).map(r => ({
        	id: r.id_transaksi,
        	acuanBayar: r.acuan_bayar,
        	tanggalInput: r.tanggal_input,
        	waktuInput: r.waktu_input,
        	nis: r.nis,
        	nama: r.nama_lengkap,
        	lp: r.lp,
        	jenis: r.jenis_pembayaran,
        	tahun: r.tahun_ajaran,
        	nominal: r.nominal,
        	isDeleted: r.is_deleted,
        	idRef: r.id_ref,
            createdAt: r.created_at,
        }));
        dbBantuan = (bantuanData || []).map(r => ({
        	id: r.id_transaksi,
        	tanggalInput: r.tanggal_input,
        	waktuInput: r.waktu_input,
        	tglTransaksi: r.tanggal_transaksi,
        	keterangan: r.keterangan,
        	jenis: r.jenis_bantuan,
        	tahun: r.tahun_ajaran,
        	nominal: r.nominal,
        	isDeleted: r.is_deleted
        }));
        dbPengeluaran = (pengeluaranData || []).map(r => ({
        	id: r.id_transaksi,
        	tanggalInput: r.tanggal_input,
        	waktuInput: r.waktu_input,
        	tglTransaksi: r.tanggal_nota,
        	keterangan: r.keterangan,
        	jenis: r.jenis_pengeluaran,
        	tahun: r.tahun_ajaran,
        	nominal: r.nominal,
        	isDeleted: r.is_deleted
        }));
        dbPengeluaranNon = (pengeluaranNonData || []).map(r => ({
        	id: r.id_transaksi,
        	tanggalInput: r.tanggal_input,
        	waktuInput: r.waktu_input,
        	tglTransaksi: r.tanggal_nota,
        	keterangan: r.keterangan,
        	jenis: r.jenis_pengeluaran_nonops,
        	tahun: r.tahun_ajaran,
        	nominal: r.nominal,
        	isDeleted: r.is_deleted
        }));
        dbInfaq = (infaqData || []).map(r => ({
        	id: r.id_transaksi,
        	tanggalInput: r.tanggal_input,
        	waktuInput: r.waktu_input,
        	tglTransaksi: r.tanggal_transaksi,
        	jenis: r.jenis_mutasi,
        	keterangan: r.keterangan,
        	nominal: r.nominal,
        	isDeleted: r.is_deleted
        }));
        dbMasterAtribut = (masterAtributData || []).map(r => ({
        	id: r.id,
        	tahun: r.tahun_ajaran,
        	jenis: r.jenis_atribut,
        	nominal: r.nominal,
        	isDeleted: r.is_deleted
        }));
        dbPemasukanAtribut = (pemasukanAtributData || []).map(r => ({
        	id: r.id_transaksi,
        	idRef: r.id_nota_referensi,
        	acuanBayar: r.acuan_bayar,
        	tanggalInput: r.tanggal_input,
        	waktuInput: r.waktu_input,
        	nis: r.nis,
        	nama: r.nama_lengkap,
        	lp: r.lp,
        	jenis: r.jenis_atribut,
        	tahun: r.tahun_ajaran,
        	hargaKatalog: r.harga_katalog,
        	nominal: r.nominal,
        	isDeleted: r.is_deleted
        }));
        dbPengaturan = (pengaturanData || []).map(r => ({
            id: r.id,
            kunci: r.kunci,
            nilai: r.nilai
        }))

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

        initDropdowns(); // Di ui.js nanti
        return true;
    } catch (error) {
        console.error("Gagal menarik data:", error);
        return false;
    }
}

function getTableName(tipe) {
    const map = {
        'pemasukan': 'pemasukan',
        'atribut': 'pemasukan_atribut',
        'bantuan': 'bantuan',
        'pengeluaran': 'pengeluaran',
        'pengeluaran-non': 'pengeluaran_nonops',
        'infaq': 'infaq',
        'tarif': 'master_tarif',
        'master_atribut': 'master_atribut',
        'user': 'admin_users',
        'pengaturan': 'pengaturan'
    };
    return map[tipe];
}

function mapToSupabase(tipe, data) {
    let payload = {};
    if (tipe !== 'user') payload.is_deleted = false; 

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
        payload.id_ref = data.id_ref || null;
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
        payload.id_transaksi = data.id;
        payload.tahun_ajaran = data.tahun;
        payload.target_kelas = data.target;
        payload.jenis_tagihan = data.jenis;
        payload.nominal_tarif = data.nominal;
    } else if (tipe === 'user') {
        if (!String(data.id).includes('TEMP')) payload.id = data.id;
        payload.username = data.username;
        payload.password = data.password;
        payload.nama_admin = data.nama;
        payload.role = data.role;
        payload.url_ttd = data.urlTtd || null;
    } else if (tipe === 'atribut') {
        payload.id_transaksi = data.id; 
        payload.id_nota_referensi = data.idRef || null; 
        payload.acuan_bayar = data.acuanBayar; 
        payload.tanggal_input = data.tanggalInput; 
        payload.waktu_input = data.waktuInput; 
        payload.nis = data.nis; 
        payload.nama_lengkap = data.nama; 
        payload.lp = data.lp; 
        payload.jenis_atribut = data.jenis; 
        payload.tahun_ajaran = data.tahun; 
        payload.harga_katalog = data.hargaKatalog; 
        payload.nominal = data.nominal;
    } else if (tipe === 'master_atribut') {
        payload.id = data.id; 
        payload.tahun_ajaran = data.tahun; 
        payload.jenis_atribut = data.jenis; 
        payload.nominal = data.nominal;
    } else if (tipe === 'pengaturan') {
        payload.id = data.id;
        payload.kunci = data.kunci;
        payload.nilai = data.nilai;
    }
    return payload;
}

// async function processOptimisticSave(tipe, localDbArray, dataObject, renderFunction) {
//     dataObject.isDeleted = false; 

//     // 1. UPDATE UI SECARA INSTAN (Tampilkan data dengan ID "TEMP-")
//     if (dataObject.isEdit) {
//         let matchId = dataObject.id || dataObject.oldUsername;
//         let idx = localDbArray.findIndex(t => String(t.id || t.username) === String(matchId));
//         if (idx !== -1) localDbArray[idx] = { ...localDbArray[idx], ...dataObject };
//     } else {
//         localDbArray.push(dataObject);
//     }

//     showToast('Menyimpan ke server...', 'info');
//     cancelEdit(tipe); 
//     adminTableState[tipe].page = 1;
    
//     // Render pertama: Memunculkan baris data baru beserta animasi loading spinner oranye
//     renderFunction();
//     loadDashboardStats(); 

//     // ==========================================
//     // 2. UBAH ID MENJADI PERMANEN SEBELUM DIKIRIM
//     // ==========================================
//     if (dataObject.id && String(dataObject.id).includes('TEMP')) {
//         let prefix = '';
//         let idColumn = 'id_transaksi'; // Default nama kolom ID di database
//         const tableName = getTableName(tipe);

//         // Tentukan awalan (prefix) berdasarkan jenis data
//         if (tipe === 'pemasukan') prefix = 'MABU-';
//         else if (tipe === 'atribut') prefix = 'ATB-';
//         else if (tipe === 'bantuan') prefix = 'BAN-';
//         else if (tipe === 'pengeluaran') prefix = 'OPS-';
//         else if (tipe === 'pengeluaran-non') prefix = 'NON-';
//         else if (tipe === 'infaq') prefix = 'INF-';

//         if (prefix !== '') {
//             try {
//                 // Cari ID terakhir di Supabase yang memiliki prefix ini
//                 const { data: lastRecord } = await supabaseClient
//                     .from(tableName)
//                     .select(idColumn)
//                     .ilike(idColumn, `${prefix}%`)
//                     .order(idColumn, { ascending: false })
//                     .limit(1);

//                 let nextNum = 1;

//                 if (lastRecord && lastRecord.length > 0) {
//                     // Ambil angka dari ID terakhir (misal: "MABU-0015" -> "0015" -> 15)
//                     const lastId = lastRecord[0][idColumn];
//                     const lastNum = parseInt(lastId.replace(prefix, ''), 10);
                    
//                     if (!isNaN(lastNum)) {
//                         nextNum = lastNum + 1;
//                     }
//                 }

//                 // Gabungkan prefix dengan angka baru (padStart 4 membuat format 0001, 0002, dst.)
//                 dataObject.id = prefix + String(nextNum).padStart(4, '0');

//             } catch (err) {
//                 console.error("Gagal men-generate Auto-Increment ID:", err);
//                 // Jika gagal cek ID (karena koneksi), fallback pakai timestamp agar data tetap aman
//                 dataObject.id = prefix + Date.now(); 
//             }
//         }
//     }

//     // 3. KIRIM KE SUPABASE
//     try {
//         const tableName = getTableName(tipe);
        
//         // Karena dataObject.id sudah berubah, payload akan membawa ID "TRX-" ke Supabase
//         const payload = mapToSupabase(tipe, dataObject);

//         if (tipe === 'user' && dataObject.isEdit) {
//             const { error } = await supabaseClient.from(tableName).update(payload).eq('username', dataObject.oldUsername);
//             if (error) throw error;
//         } else {
//             const { data, error } = await supabaseClient.from(tableName).upsert(payload).select();
//             if (error) throw error;
            
//             // Khusus untuk User baru (karena ID asli di-generate oleh Supabase Auth)
//             if (tipe === 'user' && !dataObject.isEdit && data && data.length > 0) {
//                 dataObject.id = data[0].id;
//             }
//         }
        
//         // Render kedua: Karena ID sudah berubah jadi TRX-, animasi loading hilang otomatis
//         renderFunction(); 
//         showToast('Data berhasil disinkronisasi!', 'success');
//     } catch (error) {
//         console.error(error);
//         showToast('Gagal simpan: ' + error.message, 'error');
//     }
// }

async function processOptimisticSave(tipe, localDbArray, dataObject, renderFunction) {
    dataObject.isDeleted = false; 

    // 1. UPDATE UI SECARA INSTAN
    if (dataObject.isEdit) {
        let matchId = dataObject.id || dataObject.oldUsername;
        let idx = localDbArray.findIndex(t => String(t.id || t.username) === String(matchId));
        if (idx !== -1) localDbArray[idx] = { ...localDbArray[idx], ...dataObject };
    } else {
        localDbArray.push(dataObject);
    }

    showToast('Menyimpan ke server...', 'info');
    if(typeof cancelEdit === 'function') cancelEdit(tipe); 
    if(adminTableState && adminTableState[tipe]) adminTableState[tipe].page = 1;
    
    // Render pertama
    renderFunction();
    if(typeof loadDashboardStats === 'function') loadDashboardStats(); 

    // ==========================================
    // 2. UBAH ID MENJADI PERMANEN SEBELUM DIKIRIM
    // ==========================================
    if (dataObject.id && String(dataObject.id).includes('TEMP')) {
        let prefix = '';
        let idColumn = 'id'; // Pastikan ini sesuai dengan nama kolom primary key di Supabase Anda, jika 'id_transaksi' ganti kembali
        if (tipe === 'pemasukan' || tipe === 'bantuan' || tipe === 'pengeluaran' || tipe === 'pengeluaran-non' || tipe === 'infaq' || tipe === 'atribut' || tipe === 'tarif') {
            idColumn = 'id_transaksi'; // Sesuai kode Anda sebelumnya
        }
        
        const tableName = getTableName(tipe);

        // 👇 PERBAIKAN: Tambahan prefix untuk tarif dan master_atribut
        if (tipe === 'pemasukan') prefix = 'MABU-';
        else if (tipe === 'atribut') prefix = 'ATB-';
        else if (tipe === 'bantuan') prefix = 'BAN-';
        else if (tipe === 'pengeluaran') prefix = 'OPS-';
        else if (tipe === 'pengeluaran-non') prefix = 'NON-';
        else if (tipe === 'infaq') prefix = 'INF-';
        else if (tipe === 'tarif') prefix = 'TRF-'; 
        else if (tipe === 'master_atribut') prefix = 'TRF-ATB-'; 

        if (prefix !== '') {
            try {
                const { data: lastRecord } = await supabaseClient
                    .from(tableName)
                    .select(idColumn)
                    .ilike(idColumn, `${prefix}%`)
                    .order(idColumn, { ascending: false })
                    .limit(1);

                let nextNum = 1;

                if (lastRecord && lastRecord.length > 0) {
                    const lastId = lastRecord[0][idColumn];
                    const lastNum = parseInt(lastId.replace(prefix, ''), 10);
                    
                    if (!isNaN(lastNum)) {
                        nextNum = lastNum + 1;
                    }
                }

                dataObject.id = prefix + String(nextNum).padStart(4, '0');

            } catch (err) {
                console.error("Gagal men-generate Auto-Increment ID:", err);
                dataObject.id = prefix + Date.now(); 
            }
        }
    }

    // 3. KIRIM KE SUPABASE
    try {
        const tableName = getTableName(tipe);
        const payload = mapToSupabase(tipe, dataObject);

        if (tipe === 'user' && dataObject.isEdit) {
            const { error } = await supabaseClient.from(tableName).update(payload).eq('username', dataObject.oldUsername);
            if (error) throw error;
        } else {
            const { data, error } = await supabaseClient.from(tableName).upsert(payload).select();
            if (error) throw error;
            
            if (tipe === 'user' && !dataObject.isEdit && data && data.length > 0) {
                dataObject.id = data[0].id;
            }
        }
        
        // Render kedua
        renderFunction(); 
        showToast('Data berhasil disinkronisasi!', 'success');
    } catch (error) {
        console.error(error);
        showToast('Gagal simpan: ' + error.message, 'error');
    }
}

async function confirmDelete() {
    const { tipe, id } = deleteTarget;
    document.getElementById('delete-modal').classList.add('hidden');

    let targetDb, renderFn;
    if (tipe === 'pemasukan') { targetDb = dbPembayaran; renderFn = loadAdminTable; } 
    else if (tipe === 'atribut') { targetDb = dbPemasukanAtribut; renderFn = loadAdminAtributTable; } 
    else if (tipe === 'bantuan') { targetDb = dbBantuan; renderFn = loadAdminBantuanTable; } 
    else if (tipe === 'pengeluaran') { targetDb = dbPengeluaran; renderFn = loadAdminPengeluaranTable; } 
    else if (tipe === 'pengeluaran-non') { targetDb = dbPengeluaranNon; renderFn = loadAdminPengeluaranNonTable; } 
    else if (tipe === 'infaq') { targetDb = dbInfaq; renderFn = loadAdminInfaqTable; } 
    else if (tipe === 'user') { targetDb = dbAdmin; renderFn = loadAdminUserTable; } 
    else if (tipe === 'tarif') { targetDb = dbMasterTarif; renderFn = loadAdminTarifTable; }
    else if (tipe === 'master_atribut') { targetDb = dbMasterAtribut; renderFn = loadAdminMasterAtributTable; }

    const idx = targetDb.findIndex(t => String(t.id) === String(id));
    if (idx === -1) return;

    if (tipe === 'user' || tipe === 'tarif') {
        backupDeletedData = targetDb[idx]; backupDeletedIndex = idx; targetDb.splice(idx, 1);
    } else {
        targetDb[idx].isDeleted = true;
    }

    loadDashboardStats(); renderFn(); updateRestoreBadges(); 
    if (currentUserRole === 'Super Admin' && !document.getElementById('admin-view-restore').classList.contains('hidden')) loadRestoreTable();
    showToast('Menghapus dari server...', 'info');

    try {
        const tableName = getTableName(tipe);
        if (tipe === 'user' || tipe === 'tarif' || tipe === 'master_atribut') {
            const pkColumn = tipe === 'user' || tipe === 'master_atribut' ? 'id' : 'id_transaksi';
            const { error } = await supabaseClient.from(tableName).delete().eq(pkColumn, id);
            if (error) throw error;
        } else {
            const { error } = await supabaseClient.from(tableName).update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id_transaksi', id);
            if (error) throw error;
        }
        showToast('Berhasil dihapus!', 'success');
    } catch (error) {
        console.error(error);
        if (tipe === 'user' || tipe === 'tarif') targetDb.splice(backupDeletedIndex, 0, backupDeletedData);
        else targetDb[idx].isDeleted = false;
        
        loadDashboardStats(); renderFn(); updateRestoreBadges();
        if (currentUserRole === 'Super Admin') loadRestoreTable();
        showToast('Gagal menghapus di server. Data dikembalikan.', 'error');
    }
    deleteTarget = { tipe: null, id: null };
}

async function restoreData(tipe, id) {
    let targetDb, renderFn;
    if (tipe === 'pemasukan') { targetDb = dbPembayaran; renderFn = loadAdminTable; } 
    else if (tipe === 'atribut') { targetDb = dbPemasukanAtribut; renderFn = loadAdminAtributTable; }
    else if (tipe === 'bantuan') { targetDb = dbBantuan; renderFn = loadAdminBantuanTable; } 
    else if (tipe === 'pengeluaran') { targetDb = dbPengeluaran; renderFn = loadAdminPengeluaranTable; } 
    else if (tipe === 'pengeluaran-non') { targetDb = dbPengeluaranNon; renderFn = loadAdminPengeluaranNonTable; } 
    else if (tipe === 'infaq') { targetDb = dbInfaq; renderFn = loadAdminInfaqTable; }

    const idx = targetDb.findIndex(t => String(t.id) === String(id));
    if (idx === -1) return;

    targetDb[idx].isDeleted = false;
    loadDashboardStats(); updateRestoreBadges(); loadRestoreTable(); renderFn();
    showToast('Memulihkan data...', 'info');

    try {
        const tableName = getTableName(tipe);
        const { error } = await supabaseClient.from(tableName).update({ is_deleted: false, deleted_at: null }).eq('id_transaksi', id);
        if (error) throw error;
        showToast('Data berhasil dipulihkan!', 'success');
    } catch (error) {
        console.error(error);
        targetDb[idx].isDeleted = true;
        loadDashboardStats(); updateRestoreBadges(); loadRestoreTable(); renderFn();
        showToast('Gagal memulihkan di server.', 'error');
    }
}

// ==========================================
// FITUR: INDIKATOR KAPASITAS DATABASE (AKURAT)
// ==========================================
async function cekKapasitasDatabase() {
    try {
        // 1. Panggil fungsi jembatan (RPC) di Supabase
        const { data: ukuranBytes, error } = await supabaseClient.rpc('get_db_size');
        
        if (error) throw error;

        // 2. Konversi kalkulasi matematika
        // 1 MB = 1024 * 1024 Bytes
        const terpakaiMB = ukuranBytes / (1024 * 1024);
        const batasMaksimalMB = 500; // Batas gratis Supabase
        
        let persentase = (terpakaiMB / batasMaksimalMB) * 100;
        
        // Memastikan bar progres UI tetap logis (minimal 1% agar bar terlihat)
        if (persentase > 0 && persentase < 1) persentase = 1; 
        if (persentase > 100) persentase = 100;

        // 3. --- UPDATE UI HTML ---
        // Mencari elemen HTML berdasarkan strukturnya
        const barContainer = document.getElementById('progress-bar-db');
        const textDetail = document.getElementById('teks-detail-db');
        const statusBadge = document.getElementById('badge-status-db');

        const sisaMB = (batasMaksimalMB - terpakaiMB).toFixed(2);

        if (barContainer) {
            barContainer.style.width = `${persentase.toFixed(1)}%`;
            
            // Animasi Perubahan Warna Bar (Hijau -> Kuning -> Merah)
            if(persentase > 90) {
                barContainer.className = "bg-red-500 h-full transition-all duration-1000";
            } else if (persentase > 75) {
                barContainer.className = "bg-amber-500 h-full transition-all duration-1000";
            } else {
                barContainer.className = "bg-emerald-500 h-full transition-all duration-1000";
            }
        }
        
        if (textDetail) {
            textDetail.innerHTML = `<span>Terpakai: <span class="font-bold text-gray-700">${terpakaiMB.toFixed(2)} MB (${persentase.toFixed(2)}%)</span></span><span>Sisa: ${sisaMB} MB</span>`;
        }

        if (statusBadge) {
            if (persentase > 90) {
                statusBadge.className = "text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-1 rounded-md";
                statusBadge.innerText = "Status: Kritis";
                
                // Buka Kunci Tombol Hard Reset
                const btnReset = document.getElementById('btn-hard-reset');
                if(btnReset) {
                    btnReset.disabled = false;
                    btnReset.className = "w-full bg-red-600 text-white font-medium py-2.5 rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors shadow-sm";
                    btnReset.innerHTML = `<i class="ph ph-warning-circle mr-2 text-lg"></i> Eksekusi Hard Reset`;
                }
            } else {
                statusBadge.className = "text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md";
                statusBadge.innerText = "Status: Aman";
            }
        }

    } catch (error) {
        console.error("Gagal membaca ukuran database:", error);
        const textDetail = document.querySelector('.flex.justify-between.text-xs.text-gray-500');
        if (textDetail) textDetail.innerHTML = `<span class="text-red-500 font-medium">Gagal membaca ukuran server.</span>`;
    }
}

// ==========================================
// FITUR: BACKUP DATABASE (.SQL)
// ==========================================
async function backupDatabaseSQL() {
    // Sesuaikan daftar ini dengan seluruh nama tabel yang ada di Supabase Anda
    const semuaTabel = ['admin_users', 'bantuan', 'data_siswa', 'infaq', 'master_atribut', 'master_data', 'master_tarif', 'pemasukan', 'pemasukan_atribut', 'pengeluaran', 'pengeluaran_nonops'];
    
    // Tampilan Loading
    tampilkanModalNotif('Mencadangkan Data', 'Sedang merakit struktur SQL seluruh tabel. Mohon tunggu...', 'loading');
    
    try {
        let sqlContent = `-- ==========================================\n`;
        sqlContent += `-- BACKUP DATABASE MA BI'RUL ULUM\n`;
        sqlContent += `-- Tanggal Backup : ${new Date().toLocaleString('id-ID')}\n`;
        sqlContent += `-- ==========================================\n\n`;

        for (let tabel of semuaTabel) {
            // Tarik seluruh data dari tabel
            const { data, error } = await supabaseClient.from(tabel).select('*');
            if (error) throw error;

            if (data && data.length > 0) {
                sqlContent += `-- ------------------------------------------\n`;
                sqlContent += `-- DATA TABEL: ${tabel}\n`;
                sqlContent += `-- ------------------------------------------\n`;
                
                data.forEach(baris => {
                    const kolom = Object.keys(baris).join(', ');
                    
                    const nilai = Object.values(baris).map(val => {
                        if (val === null) return 'NULL';
                        if (typeof val === 'string') {
                            // Escape tanda kutip tunggal agar SQL tidak error (misal: Bi'rul -> Bi''rul)
                            return `'${val.replace(/'/g, "''")}'`;
                        }
                        if (typeof val === 'object') {
                            // Tangani tipe data array/JSON
                            return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                        }
                        return val;
                    }).join(', ');

                    sqlContent += `INSERT INTO ${tabel} (${kolom}) VALUES (${nilai});\n`;
                });
                sqlContent += `\n\n`;
            }
        }

        // --- PROSES DOWNLOAD FILE .SQL ---
        // Bungkus teks SQL menjadi sebuah file Blob
        const blob = new Blob([sqlContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        
        // Buat elemen link tersembunyi untuk memicu unduhan
        const link = document.createElement("a");
        link.href = url;
        
        // Format nama file: Backup_SQL_2026-08-25.sql
        const tglSekarang = new Date().toISOString().split('T')[0];
        link.download = `Backup_SQL_BirulUlum_${tglSekarang}.sql`;
        
        document.body.appendChild(link);
        link.click();
        
        // Bersihkan link
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        tampilkanModalNotif('Berhasil!', 'File SQL berhasil diunduh. Simpan file ini di tempat yang aman.', 'success');
        setTimeout(() => tutupModalNotif(), 3000);

    } catch (error) {
        console.error("Gagal melakukan backup SQL:", error);
        tampilkanModalNotif('Gagal', 'Terjadi kesalahan saat merakit file Backup SQL.', 'error');
    }
}