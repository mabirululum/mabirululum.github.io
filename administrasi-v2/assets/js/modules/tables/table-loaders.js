function loadAdminDataSiswaTable() {
    const tbody = document.getElementById('table-admin-datasiswa');
    let isAktif = adminTableState.datasiswa.activeTab === 'aktif'; 
    const { pData, tItems } = getPaginatedData(dbSiswa, 'datasiswa', s => { 
        const q = adminTableState.datasiswa.query; const fKelas = adminTableState.datasiswa.filterKelas; 
        let isMatchQuery = (!q || String(s.nis).toLowerCase().includes(q) || String(s.nama).toLowerCase().includes(q)); 
        let isMatchKelas = (fKelas === 'All' || s.kelas === fKelas); 
        let sKls = String(s.kelas).toUpperCase(); let isNon = sKls.includes('LULUS') || sKls.includes('KELUAR'); 
        return isMatchQuery && isMatchKelas && (isAktif ? !isNon : isNon); 
    });

    const warnaBulan = { Juli: 'bg-red-100 text-red-700', Agustus: 'bg-orange-100 text-orange-700', September: 'bg-amber-100 text-amber-700', Oktober: 'bg-yellow-100 text-yellow-700', November: 'bg-lime-100 text-lime-700', Desember: 'bg-green-100 text-green-700', Januari: 'bg-emerald-100 text-emerald-700', Februari: 'bg-teal-100 text-teal-700', Maret: 'bg-cyan-100 text-cyan-700', April: 'bg-sky-100 text-sky-700', Mei: 'bg-blue-100 text-blue-700', Juni: 'bg-indigo-100 text-indigo-700' };
    const colorNames = ['red','orange','amber','yellow','lime','green','emerald','teal','cyan','sky','blue','indigo','purple'];
    const uniqueTahun = [...new Set(pData.map(s => s.tahunMasuk))];
    const warnaTahun = {};
    uniqueTahun.forEach(tahun => {
        const startYear = parseInt(String(tahun).split('/')[0]); let colorIndex = 0;
        if (!isNaN(startYear)) { let selisih = startYear - 2014; if (selisih < 0) selisih = 0; colorIndex = selisih % colorNames.length; }
        const color = colorNames[colorIndex]; warnaTahun[tahun] = `bg-${color}-100 text-${color}-700 border-${color}-200`;
    });

    buildTableRow(tbody, pData, 'datasiswa', s => {
        let lpBadge = s.lp === 'L' ? `<span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">L</span>` : `<span class="bg-pink-100 text-pink-700 px-2 py-0.5 rounded text-xs font-bold">P</span>`;
        let warna = warnaBulan[s.bulanMulai] || 'bg-gray-100 text-gray-700';
        let bulanBadge = s.bulanMulai === null ? `<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">Juli</span>` : `<span class="${warna} px-2 py-0.5 rounded text-xs font-bold">${s.bulanMulai}</span>`;
        let warnaKelasBadge = '';
        if (['X E1', 'X IPA'].includes(s.kelas)) warnaKelasBadge = 'bg-green-100 text-green-700 border-green-200'; 
        else if (['X E2', 'X IPS'].includes(s.kelas)) warnaKelasBadge = 'bg-emerald-100 text-emerald-700 border-emerald-200';
        else if (['XI F1', 'XI IPA'].includes(s.kelas)) warnaKelasBadge = 'bg-amber-100 text-amber-700 border-amber-200';
        else if (['XI F2', 'XI IPS'].includes(s.kelas)) warnaKelasBadge = 'bg-yellow-100 text-yellow-700 border-yellow-200';
        else if (['XII IPA'].includes(s.kelas)) warnaKelasBadge = 'bg-red-100 text-red-700 border-red-200';
        else if (['XII IPS'].includes(s.kelas)) warnaKelasBadge = 'bg-rose-100 text-rose-700 border-rose-200';
        else warnaKelasBadge = 'bg-gray-100 text-gray-700 border-gray-200';
        let kelasBadge = `<span class="${warnaKelasBadge} border px-2.5 py-1 rounded-md text-xs font-bold">${s.kelas}</span>`;
        let tahunClass = warnaTahun[s.tahunMasuk] || 'bg-gray-100 text-gray-700 border-gray-200'; let tahunBadge = `<span class="${tahunClass} border px-2 py-1 rounded-md text-xs font-bold">${s.tahunMasuk}</span>`;
        tbody.innerHTML += `
        <tr class="hover:bg-gray-50">
            <td class="p-4 font-medium text-gray-600 whitespace-nowrap">${s.nis}</td>
            <td class="p-4 font-bold text-gray-800 whitespace-nowrap">${s.nama}</td>
            <td class="p-4 text-center whitespace-nowrap">${lpBadge}</td>
            <td class="p-4 text-center whitespace-nowrap">${tahunBadge}</td>
            <td class="p-4 text-center whitespace-nowrap">${bulanBadge}</td>
            <td class="p-4 text-center whitespace-nowrap">${kelasBadge}</td>
        </tr>`; 
    });
    updatePaginationUI('datasiswa', tItems, pData.length);
}

// TABEL RENDER DATA PEMASUKAN
function loadAdminTable() {
    const tbody = document.getElementById('table-admin-history'); 
    const q = adminTableState.pemasukan.query;

    const { pData, tItems } = getPaginatedData(dbPembayaran, 'pemasukan', t => {
        if (t.isDeleted) return false;
        
        // TERAPKAN SOFT RESET DI SINI
        if (!q && t.tahun !== globalTahunAktif) {
            return false; 
        }

        // ... (Logika pencarian berdasarkan teks/query dari kode Anda yang lama) ...
        if (q && !(
            String(t.nis).toLowerCase().includes(q) ||
            String(t.jenis).toLowerCase().includes(q) ||
            String(t.acuanBayar).toLowerCase().includes(q) ||
            String(t.tahun).toLowerCase().includes(q)
        )) {
            return false;
        }
        return true;
    });

    buildTableRow(tbody, pData, 'pemasukan', t => {
        let statusSync = String(t.id).includes('TEMP-') ? '<i class="ph ph-spinner-gap animate-spin text-orange-500 ml-1" title="Menyinkronkan..."></i>' : '';

        // Deteksi Badge Lunas / Cicilan di Tabel
        let badgeStatus = '';
        let idReferensi = t.idRef || t.id_ref; 

        if (idReferensi) {
            // Skenario A: Angsuran (Pelunasan)
            badgeStatus = `<span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200 ml-2">Pelunasan Cicilan</span>`;
        } else {
            // Cek apakah ada transaksi cicilan yang menginduk ke ID ini
            const hasCicilan = dbPembayaran.some(anak => (anak.idRef === t.id || anak.id_ref === t.id) && !anak.isDeleted);
            
            if (hasCicilan) {
                // Skenario B: DP (dan sudah ada yang mengangsur setelahnya)
                badgeStatus = `<span class="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold border border-orange-200 ml-2">DP (Ada Angsuran)</span>`;
            } else {
                // Skenario C: Transaksi Tunggal (Belum ada angsuran). Lunas atau masih Hutang?
                // Kita harus cari tahu berapa tarif aslinya
                let expectedTarif = 0;
                const mSiswa = dbSiswa.find(s => String(s.nis).trim() === String(t.nis).trim());
                if (mSiswa) {
                    const kls = String(mSiswa.kelas).trim().toUpperCase();
                    const jns = String(t.jenis).trim().toUpperCase();
                    let tObj = dbMasterTarif.find(mt => 
                        mt.tahun === t.tahun && String(mt.jenis).trim().toUpperCase() === jns && 
                        (String(mt.target).trim().toUpperCase() === 'SEMUA KELAS' ||
                         String(mt.target).trim().toUpperCase() === `NIS ${t.nis}` ||
                         String(mt.target).trim().toUpperCase() === kls ||
                         kls.startsWith(String(mt.target).trim().toUpperCase() + ' '))
                    );
                    if (tObj) expectedTarif = parseInt(tObj.nominal) || 0;
                }

                // Bandingkan nominal bayar dengan tarif aslinya
                if (expectedTarif > 0 && parseInt(t.nominal) < expectedTarif) {
                    // Kalau bayarnya kurang dari tarif, berarti Hutang/DP!
                    badgeStatus = `<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold border border-red-200 ml-2">Hutang / DP</span>`;
                } else {
                    // Kalau bayarnya pas/lebih, baru Lunas
                    badgeStatus = `<span class="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold border border-green-200 ml-2">Lunas</span>`;
                }
            }
        }

        let btnCetak = `<button type="button" onclick="cetakKwitansi('${t.id}')" class="text-purple-600 hover:text-purple-800 mr-3"><i class="ph ph-printer text-xl"></i></button>`;
        let btnEdit = currentUserRole === 'Super Admin' ? `<button type="button" onclick="editData('pemasukan', '${t.id}')" class="text-blue-500 hover:text-blue-700 mr-2"><i class="ph ph-pencil-simple text-lg"></i></button>` : '';
        let btnDelete = currentUserRole === 'Super Admin' ? `<button type="button" onclick="deleteData('pemasukan', '${t.id}')" class="text-red-500 hover:text-red-700"><i class="ph ph-trash text-lg"></i></button>` : '';
        
        tbody.innerHTML += `
        <tr class="hover:bg-gray-50">
            <td class="p-4 text-xs">
                <div class="text-gray-800 font-medium flex items-center whitespace-nowrap">${t.tanggalInput} ${statusSync}</div><div class="text-gray-500 whitespace-nowrap">${t.waktuInput}</div>
            </td>
            <td class="p-4">
                <div class="font-bold text-blue-600 whitespace-nowrap">${t.nis}</div>
                <div class="text-xs text-gray-600 whitespace-nowrap">${t.nama}</div>
            </td>
            <td class="p-4 text-gray-800">
                <div class="font-medium whitespace-nowrap">${t.jenis} <span class="text-xs font-normal text-gray-500">(TA: ${t.tahun})</span> ${badgeStatus}</div>
                <div class="text-[11px] text-gray-400 mt-0.5 bg-gray-100 px-1 rounded w-max border whitespace-nowrap">${t.acuanBayar}</div>
            </td>
            <td class="p-4 font-bold text-right text-emerald-600 whitespace-nowrap">${formatRp(t.nominal)}</td>
            <td class="p-4 text-center whitespace-nowrap ${getActionClass('pemasukan')}">${btnCetak}${btnEdit}${btnDelete}</td>
        </tr>`;
    });
    updatePaginationUI('pemasukan', tItems, pData.length);
}

// TABEL RENDER DATA PEMASUKAN ATRIBUT
function loadAdminAtributTable() {
    const tbody = document.getElementById('table-admin-atribut-history');
    const q = adminTableState.atribut.query;

    let saldoTotal = dbPemasukanAtribut.reduce((sum, trx) => !trx.isDeleted ? sum + parseInt(trx.nominal || 0) : sum, 0);
    document.getElementById('total-atribut').innerText = formatRp(saldoTotal);

    const { pData, tItems } = getPaginatedData(dbPemasukanAtribut, 'atribut', t => {
        if (t.isDeleted) return false;
        
        // TERAPKAN SOFT RESET DI SINI
        if (!q && t.tahun !== globalTahunAktif) {
            return false; 
        }

        // ... (Logika pencarian berdasarkan teks/query dari kode Anda yang lama) ...
        if (q && !(
            String(t.nis).toLowerCase().includes(q) ||
            String(t.jenis).toLowerCase().includes(q) ||
            String(t.acuanBayar).toLowerCase().includes(q) ||
            String(t.tahun).toLowerCase().includes(q)
        )) {
            return false;
        }
        return true;
    });
    
    buildTableRow(tbody, pData, 'atribut', t => {
        let statusSync = String(t.id).includes('TEMP-') ? '<i class="ph ph-spinner-gap animate-spin text-orange-500 ml-1" title="Menyinkronkan..."></i>' : '';
        
        let btnEdit = currentUserRole === 'Super Admin' ? `<button type="button" onclick="editData('atribut', '${t.id}')" class="text-blue-500 hover:text-blue-700 mr-2"><i class="ph ph-pencil-simple text-lg"></i></button>` : '';
        let btnDelete = currentUserRole === 'Super Admin' ? `<button type="button" onclick="deleteData('atribut', '${t.id}')" class="text-red-500 hover:text-red-700"><i class="ph ph-trash text-lg"></i></button>` : '';
        
        // ==========================================
        // Label Status Atribut (4 Kondisi)
        // ==========================================
        let labelCicilan = '';
        let nominalBayar = parseInt(t.nominal) || 0;
        let idRefAtribut = t.idRef || t.id_ref;
        
        // Cek apakah ini DP dan ada transaksi lain yang menginduk (nyicil) ke transaksi ini
        const adaAnakCicilan = dbPemasukanAtribut.some(anak => (anak.idRef === t.id || anak.id_ref === t.id) && !anak.isDeleted);
        
        // Ambil harga asli atribut (Sesuaikan jika nama variabel/kolom Anda berbeda)
        let hargaAsli = parseInt(t.hargaKatalog) || parseInt(t.harga) || 0; 

        if (idRefAtribut) {
            // 4. Cicil selanjutnya (Biru)
            labelCicilan = `<span class="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 ml-1 font-bold">Pelunasan Cicilan</span>`;
        } else {
            if (nominalBayar === 0) {
                // 2. Hutang nominal 0 (Merah)
                labelCicilan = `<span class="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200 ml-1 font-bold">Hutang</span>`;
            } else if (adaAnakCicilan || (hargaAsli > 0 && nominalBayar < hargaAsli)) {
                // 3. Cicil awal nominal > 0 (Kuning)
                labelCicilan = `<span class="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-200 ml-1 font-bold">Cicilan Awal</span>`;
            } else {
                // 1. Langsung Lunas (Hijau)
                labelCicilan = `<span class="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200 ml-1 font-bold">Lunas</span>`;
            }
        }
        
        // Fungsi formatRp (pastikan Anda punya fungsi ini, atau ganti dengan kode format standar)
        let nominalTampil = formatRp ? formatRp(t.nominal) : `Rp ${Number(t.nominal).toLocaleString('id-ID')}`;

        tbody.innerHTML += `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="p-4 text-xs">
                <div class="text-gray-800 font-medium flex items-center whitespace-nowrap">${t.tanggalInput} ${statusSync}</div>
                <div class="text-gray-500 whitespace-nowrap">${t.waktuInput}</div>
            </td>
            <td class="p-4">
                <div class="font-bold text-indigo-600 whitespace-nowrap">${t.nis}</div>
                <div class="text-xs text-gray-600 whitespace-nowrap">${t.nama}</div>
            </td>
            <td class="p-4 text-gray-800">
                <div class="font-medium whitespace-nowrap">${t.jenis} <span class="text-xs font-normal text-gray-500">(TA: ${t.tahun})</span></div>
                <div class="text-[11px] text-gray-400 mt-0.5 flex items-center whitespace-nowrap">
                    <span class="bg-gray-100 px-1 rounded border">${t.acuanBayar}</span> ${labelCicilan}
                </div>
            </td>
            <td class="p-4 font-bold text-right text-emerald-600 whitespace-nowrap">${nominalTampil}</td>
            <td class="p-4 text-center whitespace-nowrap ${typeof getActionClass === 'function' ? getActionClass('atribut') : ''}">${btnEdit}${btnDelete}</td>
        </tr>`;
    });
    
    updatePaginationUI('atribut', tItems, pData.length);
}

// TABEL RENDER DATA BANTUAN
function loadAdminBantuanTable() {
    const tbody = document.getElementById('table-admin-bantuan');
    const q = adminTableState.bantuan.query;

    const { pData, tItems } = getPaginatedData(dbBantuan, 'bantuan', t => !t.isDeleted && (!q || String(t.keterangan).toLowerCase().includes(q) || String(t.jenis).toLowerCase().includes(q) || String(t.tglTransaksi).toLowerCase().includes(q)));

    buildTableRow(tbody, pData, 'bantuan', t => {
        let statusSync = String(t.id).includes('TEMP-') ? '<i class="ph ph-spinner-gap animate-spin text-orange-500 ml-1"></i>' : '';
        let btnEdit = currentUserRole === 'Super Admin' ? `<button type="button" onclick="editData('bantuan', '${t.id}')" class="text-blue-500 hover:text-blue-700 mr-2"><i class="ph ph-pencil-simple text-lg"></i></button>` : '';
        let btnDelete = currentUserRole === 'Super Admin' ? `<button type="button" onclick="deleteData('bantuan', '${t.id}')" class="text-red-500 hover:text-red-700"><i class="ph ph-trash text-lg"></i></button>` : '';
        
        tbody.innerHTML += `
        <tr class="hover:bg-gray-50">
            <td class="p-4 text-xs">
                <div class="text-gray-800 font-medium flex items-center whitespace-nowrap">${t.tanggalInput} ${statusSync}</div>
                <div class="text-gray-500 whitespace-nowrap">${t.waktuInput}</div>
            </td>
            <td class="p-4">
                <div class="font-medium text-emerald-600 whitespace-nowrap">${formatDateIndo(t.tglTransaksi)}</div>
                <div class="text-xs text-gray-500 mt-1 whitespace-nowrap">${t.keterangan}</div>
            </td>
            <td class="p-4">
                <div class="font-medium text-blue-600 whitespace-nowrap">${t.jenis}</div>
                <div class="text-xs text-gray-500 mt-1 whitespace-nowrap">TA: ${t.tahun}</div>
            </td>
            <td class="p-4 font-medium text-right text-emerald-600 whitespace-nowrap">+ ${formatRp(t.nominal)}</td>
            <td class="p-4 text-center whitespace-nowrap ${getActionClass('bantuan')}">${btnEdit}${btnDelete}</td>
        </tr>`;
    });
    updatePaginationUI('bantuan', tItems, pData.length);
}

// TABEL RENDER DATA INFAQ
function loadAdminInfaqTable() {
    const tbody = document.getElementById('table-admin-infaq');
    const q = adminTableState.infaq.query;
    let saldoTotal = dbInfaq.reduce((sum, trx) => !trx.isDeleted ? (trx.jenis === 'Pemasukan' ? sum + parseInt(trx.nominal || 0) : sum - parseInt(trx.nominal || 0)) : sum, 0);
    document.getElementById('infaq-total-saldo').innerText = formatRp(saldoTotal);
    const { pData, tItems } = getPaginatedData(dbInfaq, 'infaq', t => !t.isDeleted && (!q || String(t.keterangan).toLowerCase().includes(q) || String(t.jenis).toLowerCase().includes(q) || String(t.tglTransaksi).toLowerCase().includes(q)));
    buildTableRow(tbody, pData, 'infaq', t => {
        let isM = t.jenis === 'Pemasukan';
        let iconM = isM ? `<span class="px-2 py-1 text-xs rounded-full font-medium bg-emerald-100 text-emerald-700">Masuk</span>` : `<span class="px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-700">Keluar</span>`;
        let statusSync = String(t.id).includes('TEMP-') ? '<i class="ph ph-spinner-gap animate-spin text-orange-500 ml-1"></i>' : '';
        let btnEdit = currentUserRole === 'Super Admin' ? `<button type="button" onclick="editData('infaq', '${t.id}')" class="text-blue-500 hover:text-blue-700 mr-2"><i class="ph ph-pencil-simple text-lg"></i></button>` : '';
        let btnDelete = currentUserRole === 'Super Admin' ? `<button type="button" onclick="deleteData('infaq', '${t.id}')" class="text-red-500 hover:text-red-700"><i class="ph ph-trash text-lg"></i></button>` : '';
        tbody.innerHTML += `
        <tr class="hover:bg-gray-50">
            <td class="p-4 text-xs">
                <div class="text-gray-800 font-medium flex items-center whitespace-nowrap">${t.tanggalInput} ${statusSync}</div>
                <div class="text-gray-500 whitespace-nowrap">${t.waktuInput}</div>
            </td>
            <td class="p-4">
                <div class="font-medium text-gray-800 whitespace-nowrap">${formatDateIndo(t.tglTransaksi)}</div>
                <div class="text-xs text-gray-500 mt-1 whitespace-nowrap">${t.keterangan}</div>
            </td>
            <td class="p-4 text-center whitespace-nowrap">${iconM}</td>
            <td class="p-4 font-medium text-right whitespace-nowrap ${isM ? 'text-emerald-600' : 'text-red-600'}">${isM ? '+ ' : '- '}${formatRp(t.nominal)}</td>
            <td class="p-4 text-center whitespace-nowrap ${getActionClass('infaq')}">${btnEdit}${btnDelete}</td>
        </tr>`;
    });
    updatePaginationUI('infaq', tItems, pData.length);
}

// TABEL RENDER DATA PENGELUARAN OPERASIONAL
function loadAdminPengeluaranTable() {
    const tbody = document.getElementById('table-admin-pengeluaran');
    const q = adminTableState.pengeluaran.query;

    const { pData, tItems } = getPaginatedData(dbPengeluaran, 'pengeluaran', t => {
        if (t.isDeleted) return false;
        
        // TERAPKAN SOFT RESET DI SINI
        if (!q && t.tahun !== globalTahunAktif) {
            return false; 
        }

        // ... (Logika pencarian berdasarkan teks/query dari kode Anda yang lama) ...
        if (q && !(
            String(t.keterangan).toLowerCase().includes(q) ||
            String(t.jenis).toLowerCase().includes(q) ||
            String(t.tglTransaksi).toLowerCase().includes(q) ||
            String(t.tahun).toLowerCase().includes(q)
        )) {
            return false;
        }
        return true;
    });

    buildTableRow(tbody, pData, 'pengeluaran', t => {
        let statusSync = String(t.id).includes('TEMP-') ? '<i class="ph ph-spinner-gap animate-spin text-orange-500 ml-1"></i>' : '';
        let btnEdit = currentUserRole === 'Super Admin' ? `<button type="button" onclick="editData('pengeluaran', '${t.id}')" class="text-blue-500 hover:text-blue-700 mr-2"><i class="ph ph-pencil-simple text-lg"></i></button>` : '';
        let btnDelete = currentUserRole === 'Super Admin' ? `<button type="button" onclick="deleteData('pengeluaran', '${t.id}')" class="text-red-500 hover:text-red-700"><i class="ph ph-trash text-lg"></i></button>` : '';
        
        tbody.innerHTML += `
        <tr class="hover:bg-gray-50">
            <td class="p-4 text-xs">
                <div class="text-gray-800 font-medium flex items-center whitespace-nowrap">${t.tanggalInput} ${statusSync}</div>
                <div class="text-gray-500 whitespace-nowrap">${t.waktuInput}</div>
            </td>
            <td class="p-4">
                <div class="font-medium text-red-600 whitespace-nowrap">${formatDateIndo(t.tglTransaksi)}</div>
                <div class="text-xs text-gray-500 mt-1 whitespace-nowrap">${t.keterangan}</div>
            </td>
            <td class="p-4">
                <div class="font-medium text-red-600 whitespace-nowrap">${t.jenis}</div>
                <div class="text-xs text-gray-500 mt-1 whitespace-nowrap">TA: ${t.tahun}</div>
            </td>
            <td class="p-4 font-medium text-right text-red-600 whitespace-nowrap">- ${formatRp(t.nominal)}</td>
            <td class="p-4 text-center whitespace-nowrap ${getActionClass('pengeluaran')}">${btnEdit}${btnDelete}</td>
        </tr>`;
    });
    updatePaginationUI('pengeluaran', tItems, pData.length);
}

// TABEL RENDER DATA PENGELUARAN NON OPERASIONAL
function loadAdminPengeluaranNonTable() {
    const tbody = document.getElementById('table-admin-pengeluaran-non');
    const q = adminTableState['pengeluaran-non'].query;

    const { pData, tItems } = getPaginatedData(dbPengeluaranNon, 'pengeluaran-non', t => {
        if (t.isDeleted) return false;
        
        // TERAPKAN SOFT RESET DI SINI
        if (!q && t.tahun !== globalTahunAktif) {
            return false; 
        }

        // ... (Logika pencarian berdasarkan teks/query dari kode Anda yang lama) ...
        if (q && !(
            String(t.keterangan).toLowerCase().includes(q) ||
            String(t.jenis).toLowerCase().includes(q) ||
            String(t.tglTransaksi).toLowerCase().includes(q) ||
            String(t.tahun).toLowerCase().includes(q)
        )) {
            return false;
        }
        return true;
    });

    buildTableRow(tbody, pData, 'pengeluaran-non', t => {
        let statusSync = String(t.id).includes('TEMP-') ? '<i class="ph ph-spinner-gap animate-spin text-orange-500 ml-1"></i>' : '';
        let btnEdit = currentUserRole === 'Super Admin' ? `<button type="button" onclick="editData('pengeluaran-non', '${t.id}')" class="text-blue-500 hover:text-blue-700 mr-2"><i class="ph ph-pencil-simple text-lg"></i></button>` : '';
        let btnDelete = currentUserRole === 'Super Admin' ? `<button type="button" onclick="deleteData('pengeluaran-non', '${t.id}')" class="text-red-500 hover:text-red-700"><i class="ph ph-trash text-lg"></i></button>` : '';
        
        tbody.innerHTML += `
        <tr class="hover:bg-gray-50">
            <td class="p-4 text-xs">
                <div class="text-gray-800 font-medium flex items-center whitespace-nowrap">${t.tanggalInput} ${statusSync}</div>
                <div class="text-gray-500 whitespace-nowrap">${t.waktuInput}</div>
            </td>
            <td class="p-4">
                <div class="font-medium text-orange-600 whitespace-nowrap">${formatDateIndo(t.tglTransaksi)}</div>
                <div class="text-xs text-gray-500 mt-1 whitespace-nowrap">${t.keterangan}</div>
            </td>
            <td class="p-4">
                <div class="font-medium text-orange-600 whitespace-nowrap">${t.jenis}</div>
                <div class="text-xs text-gray-500 mt-1 whitespace-nowrap">TA: ${t.tahun}</div>
            </td>
            <td class="p-4 font-medium text-right text-orange-600 whitespace-nowrap">- ${formatRp(t.nominal)}</td>
            <td class="p-4 text-center whitespace-nowrap ${getActionClass('pengeluaran-non')}">${btnEdit}${btnDelete}</td>
        </tr>`;
    });
    updatePaginationUI('pengeluaran-non', tItems, pData.length);
}

// TABEL RENDER DATA MASTER TARIF
function loadAdminTarifTable() { 
    const tbody = document.getElementById('table-admin-tarif'); const q = adminTableState.tarif.query; 
    const { pData, tItems } = getPaginatedData(dbMasterTarif, 'tarif', t => !t.isDeleted && (!q || String(t.tahun).toLowerCase().includes(q) || String(t.target).toLowerCase().includes(q) || String(t.jenis).toLowerCase().includes(q))); 
    buildTableRow(tbody, pData, 'tarif', t => {
        let statusSync = t.id && String(t.id).includes('TEMP-') ? '<i class="ph ph-spinner-gap animate-spin text-orange-500 ml-2"></i>' : '';
        let btnEdit = `<button type="button" onclick="editData('tarif', '${t.id}')" class="text-blue-500 hover:text-blue-700 mr-2"><i class="ph ph-pencil-simple text-lg"></i></button>`;
        let btnDelete = `<button type="button" onclick="deleteData('tarif', '${t.id}')" class="text-red-500 hover:text-red-700"><i class="ph ph-trash text-lg"></i></button>`;
        tbody.innerHTML += `
        <tr class="hover:bg-gray-50">
            <td class="p-4 text-gray-800 font-medium flex items-center whitespace-nowrap">${t.tahun} ${statusSync}</td>
            <td class="p-4 whitespace-nowrap"><span class="bg-purple-100 text-purple-800 px-2.5 py-1 rounded-md text-xs font-bold border border-purple-200 whitespace-nowrap">${t.target}</span></td>
            <td class="p-4 text-gray-800 font-medium whitespace-nowrap">${t.jenis}</td>
            <td class="p-4 font-bold text-right text-gray-800 whitespace-nowrap">${formatRp(t.nominal)}</td>
            <td class="p-4 text-center whitespace-nowrap">${btnEdit}${btnDelete}</td>
        </tr>`;
    });
    updatePaginationUI('tarif', tItems, pData.length); 
}

// TABEL RENDER DATA MASTER ATRIBUT
function loadAdminMasterAtributTable() { 
    const tbody = document.getElementById('table-admin-master_atribut');
    const q = adminTableState.master_atribut.query; 
    const { pData, tItems } = getPaginatedData(dbMasterAtribut, 'master_atribut', t => !t.isDeleted && (!q || String(t.tahun).toLowerCase().includes(q) || String(t.jenis).toLowerCase().includes(q)));
    
    buildTableRow(tbody, pData, 'master_atribut', t => {
        let statusSync = t.id && String(t.id).includes('TEMP-') ? '<i class="ph ph-spinner-gap animate-spin text-orange-500 ml-2"></i>' : '';
        let btnEdit = `<button type="button" onclick="editData('master_atribut', '${t.id}')" class="text-blue-500 hover:text-blue-700 mr-2"><i class="ph ph-pencil-simple text-lg"></i></button>`;
        let btnDelete = `<button type="button" onclick="deleteData('master_atribut', '${t.id}')" class="text-red-500 hover:text-red-700"><i class="ph ph-trash text-lg"></i></button>`;
        tbody.innerHTML += `
        <tr class="hover:bg-gray-50">
            <td class="p-4 text-gray-800 font-medium flex items-center whitespace-nowrap">${t.tahun} ${statusSync}</td>
            <td class="p-4 text-indigo-700 font-bold whitespace-nowrap">${t.jenis}</td>
            <td class="p-4 font-bold text-right text-emerald-600 whitespace-nowrap">${formatRp(t.nominal)}</td>
            <td class="p-4 text-center whitespace-nowrap">${btnEdit}${btnDelete}</td>
        </tr>`;
    });
    updatePaginationUI('master_atribut', tItems, pData.length); 
}

// TABEL RENDER RESTORE
function loadRestoreTable() {
	const tbody = document.getElementById('table-admin-restore');
	let dbArray = [];
	if (activeRestoreTab === 'pemasukan') dbArray = dbPembayaran;
	else if (activeRestoreTab === 'atribut') dbArray = dbPemasukanAtribut;
	else if (activeRestoreTab === 'bantuan') dbArray = dbBantuan;
	else if (activeRestoreTab === 'infaq') dbArray = dbInfaq;
	else if (activeRestoreTab === 'pengeluaran') dbArray = dbPengeluaran;
	else if (activeRestoreTab === 'pengeluaran-non') dbArray = dbPengeluaranNon;
	const {
		pData,
		tItems
	} = getPaginatedData(dbArray, 'restore', t => t.isDeleted);
	buildTableRow(tbody, pData, 'restore', t => {
		let rincian = (activeRestoreTab === 'pemasukan' || activeRestoreTab === 'atribut') ? `<div class="font-bold text-gray-800">${t.nis} - ${t.nama}</div><div class="text-xs text-gray-500 mt-1">${t.jenis} (${t.tahun})</div>` : `<div class="font-medium text-gray-800">${t.keterangan || t.jenis}</div><div class="text-xs text-gray-500 mt-1">${t.tglTransaksi}</div>`;
		let statusSync = String(t.id).includes('TEMP-') ? '<i class="ph ph-spinner-gap animate-spin text-orange-500 ml-1"></i>' : '';
		let btnRestore = `<button type="button" onclick="restoreData('${activeRestoreTab}', '${t.id}')" class="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded text-sm font-bold transition-colors">Pulihkan</button>`;
		tbody.innerHTML += `<tr class="hover:bg-red-50 transition-colors"><td class="p-4 text-xs text-gray-500">${t.id} ${statusSync}<br/>${t.tanggalInput}</td><td class="p-4">${rincian}</td><td class="p-4 font-bold text-right text-gray-600">${formatRp(t.nominal)}</td><td class="p-4 text-center">${btnRestore}</td></tr>`;
	});
	updatePaginationUI('restore', tItems, pData.length);
}

// TABEL RENDER DATA USER
function loadAdminUserTable() {
    const tbody = document.getElementById('table-admin-user');
    const q = adminTableState.user.query;
    const { pData, tItems } = getPaginatedData(dbAdmin, 'user', t => !t.isDeleted && (!q || String(t.username).toLowerCase().includes(q) || String(t.nama).toLowerCase().includes(q) || String(t.role).toLowerCase().includes(q)));
    buildTableRow(tbody, pData, 'user', t => {
        let rBadge = t.role === 'Super Admin' ? `<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">Super Admin</span>` : (t.role === 'Admin' ? `<span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">Admin</span>` : `<span class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">Kepala Madrasah</span>`);
        let statusSync = t.id && String(t.id).includes('TEMP-') ? '<i class="ph ph-spinner-gap animate-spin text-orange-500 ml-2"></i>' : '';
        let btnEdit = `<button type="button" onclick="editData('user', '${t.id}')" class="text-blue-500 hover:text-blue-700 mr-2"><i class="ph ph-pencil-simple text-lg"></i></button>`;
        let btnDelete = `<button type="button" onclick="deleteData('user', '${t.id}')" class="text-red-500 hover:text-red-700"><i class="ph ph-trash text-lg"></i></button>`;
        tbody.innerHTML += `
        <tr class="hover:bg-gray-50">
            <td class="p-4 text-gray-800 font-medium flex items-center whitespace-nowrap">${t.username} ${statusSync}</td>
            <td class="p-4 text-gray-800 font-bold whitespace-nowrap">${t.nama}</td>
            <td class="p-4 whitespace-nowrap">${rBadge}</td>
            <td class="p-4 text-center whitespace-nowrap ${getActionClass('user')}">${btnEdit}${btnDelete}</td>
        </tr>`;
    });
    updatePaginationUI('user', tItems, pData.length);
}