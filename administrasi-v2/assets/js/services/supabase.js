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
            { data: masterAtributData }, { data: pemasukanAtributData }, {data: pengaturanData},
            { data: masterGuruData }, { data: tarifTunjanganData }
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
            supabaseClient.from('master_guru').select('*'),
            supabaseClient.from('master_tarif_tunjangan').select('*'),
        ]);

        // Mapping Data SQL ke Format Javascript
        dbAdmin = (adminData || []).map(r => ({
        	id: r.id,
        	username: r.username,
        	password: r.password,
        	nama: r.nama_admin,
        	role: r.role
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
        }));
        dbMasterGuru = (masterGuruData || []).map(r => ({
            id: r.id,
            kode_guru: r.kode_guru,
            nama: r.nama,
            jabatan: r.jabatan,
            tugas_tambahan: r.tugas_tambahan,
            tahun_masuk: r.tahun_masuk,
            is_tendik: r.is_tendik,
            is_bbqs: r.is_bbqs,
            is_ekstra: r.is_ekstra,
            is_active: r.is_active
        }));
        dbMasterTarifTunjangan = (tarifTunjanganData || []).map(r => ({
            id: r.id,
            tahunAjaran: r.tahun_ajaran,
            kategori: r.kategori,
            namaTugas: r.nama_tugas,
            nominal: r.nominal,
            isDeleted: r.is_deleted
        }));

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
        'master_guru': 'master_guru',
        'tarif_tunjangan': 'master_tarif_tunjangan',
        'user': 'admin_users',
        'pengaturan': 'pengaturan'
    };
    return map[tipe];
}

function mapToSupabase(tipe, data) {
    let payload = {};
    if (tipe !== 'user' && tipe !== 'master_guru') payload.is_deleted = false;

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
    } else if (tipe === 'master_guru') {
        if (!String(data.id).includes('TEMP')) payload.id = data.id; // Hanya kirim ID jika bukan TEMP
        payload.kode_guru = data.kode_guru;
        payload.nama = data.nama;
        payload.jabatan = data.jabatan;
        payload.tugas_tambahan = data.tugas_tambahan || null;
        payload.tahun_masuk = data.tahun_masuk;
        payload.is_tendik = data.is_tendik;
        payload.is_bbqs = data.is_bbqs;
        payload.is_ekstra = data.is_ekstra;
        payload.is_active = data.is_active !== undefined ? data.is_active : true;
    } else if (tipe === 'tarif_tunjangan') {
        if (!String(data.id).includes('TEMP')) payload.id = data.id;
        payload.tahun_ajaran = data.tahunAjaran;
        payload.kategori = data.kategori;
        payload.nama_tugas = data.namaTugas;
        payload.nominal = data.nominal;
    } else if (tipe === 'pengaturan') {
        payload.id = data.id;
        payload.kunci = data.kunci;
        payload.nilai = data.nilai;
    }
    return payload;
}

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
            
            if ((tipe === 'user' || tipe === 'master_guru' || tipe === 'tarif_tunjangan') && !dataObject.isEdit && data && data.length > 0) {
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