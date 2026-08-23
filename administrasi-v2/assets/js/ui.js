// ==========================================
// file: ui.js
// Fungsi: Render Tabel, Tampilan Dasbor, Form Submit, dan Grafik
// ==========================================

// --- INISIALISASI UI & EVENT LISTENER ---
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (document.getElementById('view-admin').classList.contains('hidden')) return;
        loadAdminDataSiswaTable(); loadAdminTable(); loadAdminAtributTable(); loadAdminBantuanTable(); loadAdminPengeluaranTable(); loadAdminPengeluaranNonTable(); loadAdminInfaqTable();
        if (currentUserRole === 'Super Admin') { loadAdminTarifTable(); loadAdminMasterAtributTable(); loadRestoreTable(); loadAdminUserTable(); }
        if (window.innerWidth >= 768) {
            const forms = ['form-pembayaran-content', 'form-bantuan-content', 'form-infaq-content', 'form-pengeluaran-content', 'form-pengeluaran-non-content', 'form-tarif-content', 'form-user-content', 'form-rekap-content'];
            const icons = ['icon-pembayaran', 'icon-bantuan', 'icon-infaq', 'icon-pengeluaran', 'icon-pengeluaran-non', 'icon-tarif', 'icon-user', 'icon-rekap'];
            forms.forEach((id, index) => {
                const content = document.getElementById(id); const icon = document.getElementById(icons[index]);
                if (content && content.classList.contains('hidden')) {
                    content.classList.remove('hidden');
                    if (icon) { icon.classList.remove('ph-caret-down'); icon.classList.add('ph-caret-up'); }
                }
            });
        }
    }, 200);
});

function toggleMobileForm(contentId, iconId) {
    if (window.innerWidth >= 768) return;
    const content = document.getElementById(contentId);
    const icon = document.getElementById(iconId);
    content.classList.toggle('hidden');
    if (content.classList.contains('hidden')) { if(icon) { icon.classList.remove('ph-caret-up'); icon.classList.add('ph-caret-down'); } } 
    else { if(icon) { icon.classList.remove('ph-caret-down'); icon.classList.add('ph-caret-up'); } }
}

function toggleSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full'); overlay.classList.remove('hidden');
    } else {
        sidebar.classList.add('-translate-x-full'); overlay.classList.add('hidden');
    }
}

// --- RENDERING DROPDOWN & MENU ---
function initDropdowns() {
    if (!dbMaster) return;
    const mapOpt = (arr) => arr ? arr.map(i => `<option value="${i}">${i}</option>`).join('') : '';
    const e1 = document.getElementById('input-jenis'); if (e1) e1.innerHTML = mapOpt(dbMaster.jenisPembayaran);
    const e2 = document.getElementById('input-tahun'); if (e2) e2.innerHTML = mapOpt(dbMaster.tahunAjaran);
    const e3 = document.getElementById('out-jenis'); if (e3) e3.innerHTML = mapOpt(dbMaster.jenisPengeluaran);
    const e4 = document.getElementById('out-tahun'); if (e4) e4.innerHTML = mapOpt(dbMaster.tahunAjaran);
    const e5 = document.getElementById('out-non-jenis'); if (e5) e5.innerHTML = mapOpt(dbMaster.jenisPengeluaranNon);
    const e6 = document.getElementById('out-non-tahun'); if (e6) e6.innerHTML = mapOpt(dbMaster.tahunAjaran);
    const e7 = document.getElementById('bantuan-jenis'); if (e7) e7.innerHTML = mapOpt(dbMaster.jenisBantuan);
    const e8 = document.getElementById('bantuan-tahun'); if (e8) e8.innerHTML = mapOpt(dbMaster.tahunAjaran);
    const e9 = document.getElementById('tarif-tahun'); if (e9) e9.innerHTML = mapOpt(dbMaster.tahunAjaran);
    const e10 = document.getElementById('cetak-tahun'); if (e10) e10.innerHTML = mapOpt(dbMaster.tahunAjaran);
    // Tambahan untuk Dropdown Tahun Ajaran di Laporan Operasional
    const eLaporanTahun = document.getElementById('filter-tahun-ajaran'); 
    if (eLaporanTahun) eLaporanTahun.innerHTML = mapOpt(dbMaster.tahunAjaran);
    // Tambahan untuk Dropdown Laporan Non-Operasional
    const eLapNonJenis = document.getElementById('filter-jenis-nonops');
    if (eLapNonJenis) eLapNonJenis.innerHTML = mapOpt(dbMaster.jenisPengeluaranNon);
    const eLapNonTahun = document.getElementById('filter-tahun-nonops');
    if (eLapNonTahun) eLapNonTahun.innerHTML = mapOpt(dbMaster.tahunAjaran);
    const eAtributTahun = document.getElementById('input-tahun-atribut');
    if (eAtributTahun) eAtributTahun.innerHTML = mapOpt(dbMaster.tahunAjaran);

    const eAtributJenis = document.getElementById('input-jenis-atribut');
    if (eAtributJenis) {
        // Saring data unik yang belum dihapus
        const unikAtribut = [...new Set(dbMasterAtribut.filter(a => !a.isDeleted).map(a => a.jenis))];
        
        // Render ke HTML
        eAtributJenis.innerHTML = '<option value="">-- Pilih Atribut --</option>' + unikAtribut.map(i => `<option value="${i}">${i}</option>`).join('');
    }

    const eMasterAtributTahun = document.getElementById('master_atribut-tahun');
    if (eMasterAtributTahun) eMasterAtributTahun.innerHTML = mapOpt(dbMaster.tahunAjaran);

    const eDashTahun = document.getElementById('filter-dash-tahun');
    if(eDashTahun) eDashTahun.innerHTML = '<option value="All">Semua Tahun Ajaran</option>' + mapOpt(dbMaster.tahunAjaran);
    
    const elFilterKelas = document.getElementById('filter-kelas');
    const elCetakKelas = document.getElementById('cetak-kelas');
    const elCetakSuratKelas = document.getElementById('surat-kelas-massal');
    let isAktif = adminTableState.datasiswa.activeTab === 'aktif';

    let filteredList = dbSiswa.filter(s => {
        let isNon = String(s.kelas).toUpperCase().includes('LULUS') || String(s.kelas).toUpperCase().includes('KELUAR');
        return isAktif ? !isNon : isNon;
    });

    let unikKelas = [...new Set(filteredList.map(s => s.kelas).filter(Boolean))].sort();
    if (elFilterKelas) elFilterKelas.innerHTML = `<option value="All">${isAktif ? 'Semua Kelas' : 'Semua Status'}</option>` + unikKelas.map(k => `<option value="${k}">${k}</option>`).join('');

    let aktifOnly = [...new Set(dbSiswa.filter(s => !(String(s.kelas).toUpperCase().includes('LULUS') || String(s.kelas).toUpperCase().includes('KELUAR'))).map(s => s.kelas))].sort();
    if (elCetakKelas) elCetakKelas.innerHTML = aktifOnly.map(k => `<option value="${k}">${k}</option>`).join('');
    if (elCetakSuratKelas) elCetakSuratKelas.innerHTML = aktifOnly.map(k => `<option value="${k}">${k}</option>`).join('');
}

function switchAdminTab(tab) {
    const views = ['dashboard', 'datasiswa', 'pemasukan', 'atribut', 'cetak', 'bantuan', 'infaq', 'pengeluaran', 'pengeluaran-non', 'tarif', 'master_atribut', 'restore', 'user'];
    const titles = { 
        'dashboard': 'Dashboard Utama', 
        'datasiswa': 'Direktori Data Siswa', 
        'pemasukan': 'Manajemen Pemasukan', 
        'atribut': 'Pemasukan Atribut Siswa',
        'cetak': 'Rekap dan Surat Tagihan', 
        'bantuan': 'Manajemen Dana Bantuan', 
        'pengeluaran': 'Pengeluaran Operasional', 
        'pengeluaran-non': 'Pengeluaran Non Operasional', 
        'infaq': 'Manajemen Kas Infaq', 
        'tarif': 'Manajemen Tarif Siswa',
        'master_atribut': 'Manajemen Tarif Atribut Siswa',
        'restore': 'Pemulihan Data (Recycle Bin)', 
        'user': 'Manajemen User & Akses' 
    };
    
    views.forEach(v => {
        const viewEl = document.getElementById(`admin-view-${v}`); const navEl = document.getElementById(`nav-${v}`);
        if (viewEl) { viewEl.classList.add('hidden'); viewEl.classList.remove('flex', 'block'); }
        if (navEl) navEl.className = "w-full flex items-center px-4 py-3 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white transition-colors";
    });
    
    const currentView = document.getElementById(`admin-view-${tab}`);
    currentView.classList.remove('hidden'); currentView.classList.add(tab === 'dashboard' ? 'block' : 'flex');

    const warnaNav = ['bg-blue-500', 'bg-sky-500', 'bg-cyan-500','bg-violet-500', 'bg-green-500', 'bg-teal-500', 'bg-emerald-500', 'bg-orange-500', 'bg-amber-500', 'bg-indigo-500', 'bg-teal-500', 'bg-rose-500', 'bg-purple-600'];
    const indexTab = views.indexOf(tab);
    const btnColor = warnaNav[indexTab % warnaNav.length] || 'bg-gray-500';
    
    document.getElementById(`nav-${tab}`).className = `w-full flex items-center px-4 py-3 rounded-lg ${btnColor} text-white transition-colors`;
    document.getElementById('admin-page-title').innerText = titles[tab];

    if (tab === 'restore') loadRestoreTable();
    if (window.innerWidth < 768) { document.getElementById('admin-sidebar').classList.add('-translate-x-full'); document.getElementById('sidebar-overlay').classList.add('hidden'); }

    if (tab === 'dashboard') {
        const aktifSiswa = dbSiswa.filter(s => !String(s.kelas).toUpperCase().includes('LULUS') && !String(s.kelas).toUpperCase().includes('KELUAR'));
        const lulusSiswa = dbSiswa.filter(s => String(s.kelas).toUpperCase().includes('LULUS'));
        document.getElementById('dash-siswa-aktif').innerText = aktifSiswa.length + " Siswa-Siswi";
        document.getElementById('dash-siswa-laki').innerText = aktifSiswa.filter(s => s.lp === 'L').length + " Siswa";
        document.getElementById('dash-siswi-perempuan').innerText = aktifSiswa.filter(s => s.lp === 'P').length + " Siswi";
        document.getElementById('dash-siswa-lulus').innerText = lulusSiswa.length + " Lulusan";
    }
}

function updateRestoreBadges() {
    const counts = [
        { id: 'badge-res-pemasukan', count: dbPembayaran.filter(t => t.isDeleted).length },
        { id: 'badge-res-atribut', count: dbPemasukanAtribut.filter(t => t.isDeleted).length },
        { id: 'badge-res-bantuan', count: dbBantuan.filter(t => t.isDeleted).length },
        { id: 'badge-res-pengeluaran', count: dbPengeluaran.filter(t => t.isDeleted).length },
        { id: 'badge-res-pengeluaran-non', count: dbPengeluaranNon.filter(t => t.isDeleted).length },
        { id: 'badge-res-infaq', count: dbInfaq.filter(t => t.isDeleted).length }
    ];
    let totalDeleted = 0;
    counts.forEach(c => {
        totalDeleted += c.count;
        const el = document.getElementById(c.id);
        if(el) { el.innerText = c.count; el.classList.toggle('hidden', c.count === 0); }
    });
    const navBadge = document.getElementById('nav-badge-restore');
    if (navBadge) { navBadge.innerText = totalDeleted; navBadge.classList.toggle('hidden', totalDeleted === 0); }
}

function renderAdminView(admin) {
    currentUserRole = String(admin.role || '').trim();
    document.getElementById('view-login').classList.add('hidden');
    document.getElementById('view-admin').classList.remove('hidden');
    document.getElementById('sidebar-nama-admin').innerText = admin.nama;
    document.getElementById('sidebar-role-admin').innerText = admin.role;

    let iconColorClass = currentUserRole === "Super Admin" ? "text-amber-300" : (currentUserRole === "Admin" ? "text-emerald-300" : "text-sky-300");
    document.getElementById('sidebar-role-admin').className = `text-xs font-medium ${iconColorClass}`;
    document.getElementById('sidebar-role-icon').className = `ph-fill ph-shield text-2xl ${iconColorClass}`;

    const isKepsek = currentUserRole === 'Kepala Madrasah';
    const isSuperAdmin = currentUserRole === 'Super Admin';
    const isAdmin = currentUserRole === 'Admin';

    if (isSuperAdmin) {
        document.getElementById('nav-user-container').classList.remove('hidden');
        document.getElementById('nav-restore-container').classList.remove('hidden');
        document.getElementById('nav-tarif-container').classList.remove('hidden');
        document.getElementById('nav-master_atribut-container').classList.remove('hidden');
    } else {
        document.getElementById('nav-user-container').classList.add('hidden');
        document.getElementById('nav-restore-container').classList.add('hidden');
        document.getElementById('nav-tarif-container').classList.add('hidden');
        document.getElementById('nav-master_atribut-container').classList.add('hidden');
    }

    document.querySelectorAll('.admin-input-form').forEach(el => el.classList.toggle('hidden', isKepsek));
    document.querySelectorAll('.admin-table-container').forEach(el => { el.classList.toggle('lg:w-2/3', !isKepsek); el.classList.toggle('w-full', isKepsek); });

    document.querySelectorAll('.admin-action-th').forEach(el => {
        if (isKepsek) el.classList.add('hidden');
        else if (isAdmin) { const isViewPemasukan = el.closest('#admin-view-pemasukan') !== null; isViewPemasukan ? el.classList.remove('hidden') : el.classList.add('hidden'); } 
        else el.classList.remove('hidden');
    });

    switchAdminTab('dashboard'); loadDashboardStats(); loadAdminDataSiswaTable(); loadAdminTable(); loadAdminAtributTable(); loadAdminBantuanTable(); loadAdminPengeluaranTable(); loadAdminPengeluaranNonTable(); loadAdminInfaqTable();
    if (isSuperAdmin) { loadAdminUserTable(); loadAdminTarifTable(); loadAdminMasterAtributTable(); updateRestoreBadges(); }
}

async function refreshAdminData() {
    showLoading("Memperbarui Data...");
    const isSuccess = await loadDataFromSupabase();
    hideLoading();
    if (isSuccess) {
        loadDashboardStats(); loadAdminDataSiswaTable(); loadAdminTable(); loadAdminAtributTable(); loadAdminBantuanTable(); loadAdminPengeluaranTable(); loadAdminPengeluaranNonTable(); loadAdminInfaqTable();
        if (currentUserRole === 'Super Admin') { loadAdminUserTable(); loadAdminTarifTable(); loadAdminMasterAtributTable(); updateRestoreBadges(); if (!document.getElementById('admin-view-restore').classList.contains('hidden')) loadRestoreTable(); }
        showToast('Data disinkronisasi!');
    } else {
        showToast('Gagal sinkronisasi data', 'error');
    }
}

// --- FILTER & PAGINATION ---
function cekNamaSiswa(nis) {
    const infoEl = document.getElementById('info-nama-siswa');
    let strNis = String(nis).trim();
    if (!strNis || strNis === '') { infoEl.classList.add('hidden'); return; }
    const siswa = dbSiswa.find(s => String(s.nis).trim() === strNis);
    infoEl.classList.remove('hidden');
    if (siswa) {
        infoEl.className = "text-sm mt-1.5 font-medium text-blue-600 flex items-center";
        infoEl.innerHTML = `<i class="ph ph-check-circle text-lg mr-1.5"></i> ${siswa.nama} (${siswa.kelas})`;
        document.getElementById('input-nis').classList.replace('border-red-500', 'border-gray-300');
    } else {
        infoEl.className = "text-sm mt-1.5 font-medium text-red-500 flex items-center";
        infoEl.innerHTML = `<i class="ph ph-x-circle text-lg mr-1.5"></i> NIS tidak terdaftar`;
        document.getElementById('input-nis').classList.replace('border-gray-300', 'border-red-500');
    }
}

function getActionClass(tabName) {
    if (currentUserRole === 'Kepala Sekolah') return 'hidden';
    if (currentUserRole === 'Admin' && tabName !== 'pemasukan') return 'hidden';
    return '';
}

function handleSearch(type) { adminTableState[type].query = document.getElementById(`search-${type}`).value.toLowerCase(); adminTableState[type].page = 1; changeAdminPage(type, 0); }
function handleFilterKelas() { adminTableState.datasiswa.filterKelas = document.getElementById('filter-kelas').value; adminTableState.datasiswa.page = 1; loadAdminDataSiswaTable(); }

function changeAdminPage(type, delta) {
    adminTableState[type].page += delta;
    if (type === 'datasiswa') loadAdminDataSiswaTable(); else if (type === 'pemasukan') loadAdminTable(); else if (type === 'atribut') loadAdminAtributTable(); else if (type === 'bantuan') loadAdminBantuanTable(); else if (type === 'pengeluaran') loadAdminPengeluaranTable(); else if (type === 'pengeluaran-non') loadAdminPengeluaranNonTable(); else if (type === 'tarif') loadAdminTarifTable(); else if (type === 'infaq') loadAdminInfaqTable(); else if (type === 'user') loadAdminUserTable(); else if (type === 'restore') loadRestoreTable();
}

function updatePaginationUI(type, tItems, pDataLength) {
    const itemsPerPage = getItemsPerPage();
    const startIdx = (adminTableState[type].page - 1) * itemsPerPage;
    const infoEl = document.getElementById(`page-info-${type}`);
    if (infoEl) infoEl.innerText = tItems > 0 ? `Menampilkan ${startIdx + 1}-${startIdx + pDataLength} dari ${tItems} data` : `Tidak ada data`;
    const btnPrev = document.getElementById(`btn-prev-${type}`); const btnNext = document.getElementById(`btn-next-${type}`);
    const setBtnStyle = (btn, isDisabled) => {
        if (!btn) return; btn.disabled = isDisabled;
        btn.className = isDisabled ? "px-3 py-1 border rounded bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed transition-colors" : "px-3 py-1 border rounded bg-white text-blue-600 border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors";
    };
    setBtnStyle(btnPrev, adminTableState[type].page <= 1); setBtnStyle(btnNext, adminTableState[type].page >= Math.ceil(tItems / itemsPerPage));
}

function getPaginatedData(dataArray, type, filterFn) {
    const itemsPerPage = getItemsPerPage();
    let safeArray = Array.isArray(dataArray) ? dataArray : [];
    let filtered = [...safeArray].filter(filterFn);
    if (type !== 'datasiswa') filtered = filtered.reverse();
    const tItems = filtered.length;
    const tPages = Math.ceil(tItems / itemsPerPage) || 1;
    if (adminTableState[type].page > tPages) adminTableState[type].page = tPages;
    if (adminTableState[type].page < 1) adminTableState[type].page = 1;
    const startIdx = (adminTableState[type].page - 1) * itemsPerPage;
    return { pData: filtered.slice(startIdx, startIdx + itemsPerPage), tItems, startIdx };
}

function buildTableRow(tbody, pData, type, htmlBuilderFn) {
    tbody.innerHTML = '';
    if (pData.length === 0) tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-gray-500">Data tidak ditemukan</td></tr>`;
    else pData.forEach(htmlBuilderFn);
}

function setTabSiswa(tabName) {
    adminTableState.datasiswa.activeTab = tabName;
    const btnAktif = document.getElementById('tab-siswa-aktif'); const btnNon = document.getElementById('tab-siswa-nonaktif');
    if (tabName === 'aktif') { btnAktif.className = "text-sm font-bold border-b-2 border-blue-600 text-blue-600 pb-2 transition-colors"; btnNon.className = "text-sm font-bold border-b-2 border-transparent text-gray-500 hover:text-gray-700 pb-2 transition-colors"; } 
    else { btnNon.className = "text-sm font-bold border-b-2 border-blue-600 text-blue-600 pb-2 transition-colors"; btnAktif.className = "text-sm font-bold border-b-2 border-transparent text-gray-500 hover:text-gray-700 pb-2 transition-colors"; }
    adminTableState.datasiswa.filterKelas = 'All'; initDropdowns(); loadAdminDataSiswaTable();
}

// --- TABEL RENDER ---
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
        tbody.innerHTML += `<tr class="hover:bg-gray-50"><td class="p-4 font-medium text-gray-600 whitespace-nowrap">${s.nis}</td><td class="p-4 font-bold text-gray-800 whitespace-nowrap">${s.nama}</td><td class="p-4 text-center whitespace-nowrap">${lpBadge}</td><td class="p-4 text-center whitespace-nowrap">${tahunBadge}</td><td class="p-4 text-center whitespace-nowrap">${bulanBadge}</td><td class="p-4 text-center whitespace-nowrap">${kelasBadge}</td></tr>`; 
    });
    updatePaginationUI('datasiswa', tItems, pData.length);
}

function loadAdminTable() {
    const tbody = document.getElementById('table-admin-history'); const q = adminTableState.pemasukan.query;
    const { pData, tItems } = getPaginatedData(dbPembayaran, 'pemasukan', t => !t.isDeleted && (!q || String(t.nis).toLowerCase().includes(q) || String(t.jenis).toLowerCase().includes(q) || String(t.acuanBayar).toLowerCase().includes(q)));
    buildTableRow(tbody, pData, 'pemasukan', t => {
        let statusSync = String(t.id).includes('TEMP-') ? '<i class="ph ph-spinner-gap animate-spin text-orange-500 ml-1" title="Menyinkronkan..."></i>' : '';

        // ==========================================
        // Deteksi Badge Lunas / Cicilan di Tabel
        // ==========================================
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
        // ==========================================

        let btnCetak = `<button type="button" onclick="cetakKwitansi('${t.id}')" class="text-purple-600 hover:text-purple-800 mr-3"><i class="ph ph-printer text-xl"></i></button>`;
        let btnEdit = currentUserRole === 'Super Admin' ? `<button type="button" onclick="editData('pemasukan', '${t.id}')" class="text-blue-500 hover:text-blue-700 mr-2"><i class="ph ph-pencil-simple text-lg"></i></button>` : '';
        let btnDelete = currentUserRole === 'Super Admin' ? `<button type="button" onclick="deleteData('pemasukan', '${t.id}')" class="text-red-500 hover:text-red-700"><i class="ph ph-trash text-lg"></i></button>` : '';
        tbody.innerHTML += `<tr class="hover:bg-gray-50"><td class="p-4 text-xs"><div class="text-gray-800 font-medium flex items-center whitespace-nowrap">${t.tanggalInput} ${statusSync}</div><div class="text-gray-500 whitespace-nowrap">${t.waktuInput}</div></td><td class="p-4"><div class="font-bold text-blue-600 whitespace-nowrap">${t.nis}</div><div class="text-xs text-gray-600 whitespace-nowrap">${t.nama}</div></td><td class="p-4 text-gray-800"><div class="font-medium whitespace-nowrap">${t.jenis} <span class="text-xs font-normal text-gray-500">(TA: ${t.tahun})</span> ${badgeStatus}</div><div class="text-[11px] text-gray-400 mt-0.5 bg-gray-100 px-1 rounded w-max border whitespace-nowrap">${t.acuanBayar}</div></td><td class="p-4 font-bold text-right text-emerald-600 whitespace-nowrap">${formatRp(t.nominal)}</td><td class="p-4 text-center whitespace-nowrap ${getActionClass('pemasukan')}">${btnCetak}${btnEdit}${btnDelete}</td></tr>`;
    });
    updatePaginationUI('pemasukan', tItems, pData.length);
}

function loadAdminAtributTable() {
    const tbody = document.getElementById('table-admin-atribut-history'); const q = adminTableState.atribut.query;
    let saldoTotal = dbPemasukanAtribut.reduce((sum, trx) => !trx.isDeleted ? sum + parseInt(trx.nominal || 0) : sum, 0);
    document.getElementById('total-atribut').innerText = formatRp(saldoTotal);
    const { pData, tItems } = getPaginatedData(dbPemasukanAtribut, 'atribut', t => 
        !t.isDeleted && (!q || String(t.nis).toLowerCase().includes(q) || String(t.jenis).toLowerCase().includes(q) || String(t.acuanBayar).toLowerCase().includes(q))
    );
    
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

function loadAdminBantuanTable() {
    const tbody = document.getElementById('table-admin-bantuan'); const q = adminTableState.bantuan.query;
    const { pData, tItems } = getPaginatedData(dbBantuan, 'bantuan', t => !t.isDeleted && (!q || String(t.keterangan).toLowerCase().includes(q) || String(t.jenis).toLowerCase().includes(q) || String(t.tglTransaksi).toLowerCase().includes(q)));
    buildTableRow(tbody, pData, 'bantuan', t => {
        let statusSync = String(t.id).includes('TEMP-') ? '<i class="ph ph-spinner-gap animate-spin text-orange-500 ml-1"></i>' : '';
        let btnEdit = currentUserRole === 'Super Admin' ? `<button type="button" onclick="editData('bantuan', '${t.id}')" class="text-blue-500 hover:text-blue-700 mr-2"><i class="ph ph-pencil-simple text-lg"></i></button>` : '';
        let btnDelete = currentUserRole === 'Super Admin' ? `<button type="button" onclick="deleteData('bantuan', '${t.id}')" class="text-red-500 hover:text-red-700"><i class="ph ph-trash text-lg"></i></button>` : '';
        tbody.innerHTML += `<tr class="hover:bg-gray-50"><td class="p-4 text-xs"><div class="text-gray-800 font-medium flex items-center whitespace-nowrap">${t.tanggalInput} ${statusSync}</div><div class="text-gray-500 whitespace-nowrap">${t.waktuInput}</div></td><td class="p-4"><div class="text-gray-800 whitespace-nowrap">${t.tglTransaksi}</div><div class="text-xs text-gray-500 mt-1 whitespace-nowrap">${t.keterangan}</div></td><td class="p-4"><div class="font-medium text-blue-600 whitespace-nowrap">${t.jenis}</div><div class="text-xs text-gray-500 mt-1 whitespace-nowrap">TA: ${t.tahun}</div></td><td class="p-4 font-medium text-right text-emerald-600 whitespace-nowrap">+ ${formatRp(t.nominal)}</td><td class="p-4 text-center whitespace-nowrap ${getActionClass('bantuan')}">${btnEdit}${btnDelete}</td></tr>`;
    });
    updatePaginationUI('bantuan', tItems, pData.length);
}

function loadAdminPengeluaranTable() {
    const tbody = document.getElementById('table-admin-pengeluaran'); const q = adminTableState.pengeluaran.query;
    const { pData, tItems } = getPaginatedData(dbPengeluaran, 'pengeluaran', t => !t.isDeleted && (!q || String(t.keterangan).toLowerCase().includes(q) || String(t.jenis).toLowerCase().includes(q) || String(t.tglTransaksi).toLowerCase().includes(q)));
    buildTableRow(tbody, pData, 'pengeluaran', t => {
        let statusSync = String(t.id).includes('TEMP-') ? '<i class="ph ph-spinner-gap animate-spin text-orange-500 ml-1"></i>' : '';
        let btnEdit = currentUserRole === 'Super Admin' ? `<button type="button" onclick="editData('pengeluaran', '${t.id}')" class="text-blue-500 hover:text-blue-700 mr-2"><i class="ph ph-pencil-simple text-lg"></i></button>` : '';
        let btnDelete = currentUserRole === 'Super Admin' ? `<button type="button" onclick="deleteData('pengeluaran', '${t.id}')" class="text-red-500 hover:text-red-700"><i class="ph ph-trash text-lg"></i></button>` : '';
        tbody.innerHTML += `<tr class="hover:bg-gray-50"><td class="p-4 text-xs"><div class="text-gray-800 font-medium flex items-center whitespace-nowrap">${t.tanggalInput} ${statusSync}</div><div class="text-gray-500 whitespace-nowrap">${t.waktuInput}</div></td><td class="p-4"><div class="text-gray-800 whitespace-nowrap">${t.tglTransaksi}</div><div class="text-xs text-gray-500 mt-1 whitespace-nowrap">${t.keterangan}</div></td><td class="p-4"><div class="font-medium text-red-600 whitespace-nowrap">${t.jenis}</div><div class="text-xs text-gray-500 mt-1 whitespace-nowrap">TA: ${t.tahun}</div></td><td class="p-4 font-medium text-right text-red-600 whitespace-nowrap">- ${formatRp(t.nominal)}</td><td class="p-4 text-center whitespace-nowrap ${getActionClass('pengeluaran')}">${btnEdit}${btnDelete}</td></tr>`;
    });
    updatePaginationUI('pengeluaran', tItems, pData.length);
}

function loadAdminPengeluaranNonTable() {
    const tbody = document.getElementById('table-admin-pengeluaran-non'); const q = adminTableState['pengeluaran-non'].query;
    const { pData, tItems } = getPaginatedData(dbPengeluaranNon, 'pengeluaran-non', t => !t.isDeleted && (!q || String(t.keterangan).toLowerCase().includes(q) || String(t.jenis).toLowerCase().includes(q) || String(t.tglTransaksi).toLowerCase().includes(q)));
    buildTableRow(tbody, pData, 'pengeluaran-non', t => {
        let statusSync = String(t.id).includes('TEMP-') ? '<i class="ph ph-spinner-gap animate-spin text-orange-500 ml-1"></i>' : '';
        let btnEdit = currentUserRole === 'Super Admin' ? `<button type="button" onclick="editData('pengeluaran-non', '${t.id}')" class="text-blue-500 hover:text-blue-700 mr-2"><i class="ph ph-pencil-simple text-lg"></i></button>` : '';
        let btnDelete = currentUserRole === 'Super Admin' ? `<button type="button" onclick="deleteData('pengeluaran-non', '${t.id}')" class="text-red-500 hover:text-red-700"><i class="ph ph-trash text-lg"></i></button>` : '';
        tbody.innerHTML += `<tr class="hover:bg-gray-50"><td class="p-4 text-xs"><div class="text-gray-800 font-medium flex items-center whitespace-nowrap">${t.tanggalInput} ${statusSync}</div><div class="text-gray-500 whitespace-nowrap">${t.waktuInput}</div></td><td class="p-4"><div class="text-gray-800 whitespace-nowrap">${t.tglTransaksi}</div><div class="text-xs text-gray-500 mt-1 whitespace-nowrap">${t.keterangan}</div></td><td class="p-4"><div class="font-medium text-orange-600 whitespace-nowrap">${t.jenis}</div><div class="text-xs text-gray-500 mt-1 whitespace-nowrap">TA: ${t.tahun}</div></td><td class="p-4 font-medium text-right text-orange-600 whitespace-nowrap">- ${formatRp(t.nominal)}</td><td class="p-4 text-center whitespace-nowrap ${getActionClass('pengeluaran-non')}">${btnEdit}${btnDelete}</td></tr>`;
    });
    updatePaginationUI('pengeluaran-non', tItems, pData.length);
}

function loadAdminInfaqTable() {
    const tbody = document.getElementById('table-admin-infaq');
    let saldoTotal = dbInfaq.reduce((sum, trx) => !trx.isDeleted ? (trx.jenis === 'Pemasukan' ? sum + parseInt(trx.nominal || 0) : sum - parseInt(trx.nominal || 0)) : sum, 0);
    document.getElementById('infaq-total-saldo').innerText = formatRp(saldoTotal);
    const q = adminTableState.infaq.query;
    const { pData, tItems } = getPaginatedData(dbInfaq, 'infaq', t => !t.isDeleted && (!q || String(t.keterangan).toLowerCase().includes(q) || String(t.jenis).toLowerCase().includes(q) || String(t.tglTransaksi).toLowerCase().includes(q)));
    buildTableRow(tbody, pData, 'infaq', t => {
        let isM = t.jenis === 'Pemasukan';
        let iconM = isM ? `<span class="px-2 py-1 text-xs rounded-full font-medium bg-emerald-100 text-emerald-700">Masuk</span>` : `<span class="px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-700">Keluar</span>`;
        let statusSync = String(t.id).includes('TEMP-') ? '<i class="ph ph-spinner-gap animate-spin text-orange-500 ml-1"></i>' : '';
        let btnEdit = currentUserRole === 'Super Admin' ? `<button type="button" onclick="editData('infaq', '${t.id}')" class="text-blue-500 hover:text-blue-700 mr-2"><i class="ph ph-pencil-simple text-lg"></i></button>` : '';
        let btnDelete = currentUserRole === 'Super Admin' ? `<button type="button" onclick="deleteData('infaq', '${t.id}')" class="text-red-500 hover:text-red-700"><i class="ph ph-trash text-lg"></i></button>` : '';
        tbody.innerHTML += `<tr class="hover:bg-gray-50"><td class="p-4 text-xs"><div class="text-gray-800 font-medium flex items-center whitespace-nowrap">${t.tanggalInput} ${statusSync}</div><div class="text-gray-500 whitespace-nowrap">${t.waktuInput}</div></td><td class="p-4"><div class="text-gray-800 whitespace-nowrap">${t.tglTransaksi}</div><div class="text-xs text-gray-500 mt-1 whitespace-nowrap">${t.keterangan}</div></td><td class="p-4 text-center whitespace-nowrap">${iconM}</td><td class="p-4 font-medium text-right whitespace-nowrap ${isM ? 'text-emerald-600' : 'text-red-600'}">${isM ? '+ ' : '- '}${formatRp(t.nominal)}</td><td class="p-4 text-center whitespace-nowrap ${getActionClass('infaq')}">${btnEdit}${btnDelete}</td></tr>`;
    });
    updatePaginationUI('infaq', tItems, pData.length);
}

function loadAdminUserTable() {
    const tbody = document.getElementById('table-admin-user'); const q = adminTableState.user.query;
    const { pData, tItems } = getPaginatedData(dbAdmin, 'user', t => !t.isDeleted && (!q || String(t.username).toLowerCase().includes(q) || String(t.nama).toLowerCase().includes(q) || String(t.role).toLowerCase().includes(q)));
    buildTableRow(tbody, pData, 'user', t => {
        let rBadge = t.role === 'Super Admin' ? `<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">Super Admin</span>` : (t.role === 'Admin' ? `<span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">Admin</span>` : `<span class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">Kepala Madrasah</span>`);
        let statusSync = t.id && String(t.id).includes('TEMP-') ? '<i class="ph ph-spinner-gap animate-spin text-orange-500 ml-2"></i>' : '';
        let btnEdit = `<button type="button" onclick="editData('user', '${t.id}')" class="text-blue-500 hover:text-blue-700 mr-2"><i class="ph ph-pencil-simple text-lg"></i></button>`;
        let btnDelete = `<button type="button" onclick="deleteData('user', '${t.id}')" class="text-red-500 hover:text-red-700"><i class="ph ph-trash text-lg"></i></button>`;
        tbody.innerHTML += `<tr class="hover:bg-gray-50"><td class="p-4 text-gray-800 font-medium flex items-center whitespace-nowrap">${t.username} ${statusSync}</td><td class="p-4 text-gray-800 font-bold whitespace-nowrap">${t.nama}</td><td class="p-4 whitespace-nowrap">${rBadge}</td><td class="p-4 text-center whitespace-nowrap ${getActionClass('user')}">${btnEdit}${btnDelete}</td></tr>`;
    });
    updatePaginationUI('user', tItems, pData.length);
}

function loadAdminTarifTable() { 
    const tbody = document.getElementById('table-admin-tarif'); const q = adminTableState.tarif.query; 
    const { pData, tItems } = getPaginatedData(dbMasterTarif, 'tarif', t => !t.isDeleted && (!q || String(t.tahun).toLowerCase().includes(q) || String(t.target).toLowerCase().includes(q) || String(t.jenis).toLowerCase().includes(q))); 
    buildTableRow(tbody, pData, 'tarif', t => {
        let statusSync = t.id && String(t.id).includes('TEMP-') ? '<i class="ph ph-spinner-gap animate-spin text-orange-500 ml-2"></i>' : '';
        let btnEdit = `<button type="button" onclick="editData('tarif', '${t.id}')" class="text-blue-500 hover:text-blue-700 mr-2"><i class="ph ph-pencil-simple text-lg"></i></button>`;
        let btnDelete = `<button type="button" onclick="deleteData('tarif', '${t.id}')" class="text-red-500 hover:text-red-700"><i class="ph ph-trash text-lg"></i></button>`;
        tbody.innerHTML += `<tr class="hover:bg-gray-50"><td class="p-4 text-gray-800 font-medium flex items-center whitespace-nowrap">${t.tahun} ${statusSync}</td><td class="p-4 whitespace-nowrap"><span class="bg-purple-100 text-purple-800 px-2.5 py-1 rounded-md text-xs font-bold border border-purple-200 whitespace-nowrap">${t.target}</span></td><td class="p-4 text-gray-800 font-medium whitespace-nowrap">${t.jenis}</td><td class="p-4 font-bold text-right text-gray-800 whitespace-nowrap">${formatRp(t.nominal)}</td><td class="p-4 text-center whitespace-nowrap">${btnEdit}${btnDelete}</td></tr>`;
    });
    updatePaginationUI('tarif', tItems, pData.length); 
}

function loadAdminMasterAtributTable() { 
    const tbody = document.getElementById('table-admin-master_atribut'); const q = adminTableState.master_atribut.query; 
    const { pData, tItems } = getPaginatedData(dbMasterAtribut, 'master_atribut', t => !t.isDeleted && (!q || String(t.tahun).toLowerCase().includes(q) || String(t.jenis).toLowerCase().includes(q))); 
    buildTableRow(tbody, pData, 'master_atribut', t => {
        let statusSync = t.id && String(t.id).includes('TEMP-') ? '<i class="ph ph-spinner-gap animate-spin text-orange-500 ml-2"></i>' : '';
        let btnEdit = `<button type="button" onclick="editData('master_atribut', '${t.id}')" class="text-blue-500 hover:text-blue-700 mr-2"><i class="ph ph-pencil-simple text-lg"></i></button>`;
        let btnDelete = `<button type="button" onclick="deleteData('master_atribut', '${t.id}')" class="text-red-500 hover:text-red-700"><i class="ph ph-trash text-lg"></i></button>`;
        tbody.innerHTML += `<tr class="hover:bg-gray-50"><td class="p-4 text-gray-800 font-medium flex items-center whitespace-nowrap">${t.tahun} ${statusSync}</td><td class="p-4 text-indigo-700 font-bold whitespace-nowrap">${t.jenis}</td><td class="p-4 font-bold text-right text-emerald-600 whitespace-nowrap">${formatRp(t.nominal)}</td><td class="p-4 text-center whitespace-nowrap">${btnEdit}${btnDelete}</td></tr>`;
    });
    updatePaginationUI('master_atribut', tItems, pData.length); 
}

function switchRestoreTab(tab) {
    activeRestoreTab = tab;
    const tabs = ['pemasukan', 'atribut', 'bantuan', 'infaq', 'pengeluaran', 'pengeluaran-non'];
    tabs.forEach(t => {
        const el = document.getElementById(`rtab-${t}`);
        el.className = (t === tab) ? "flex-none px-6 py-3 text-sm font-semibold border-b-2 border-red-500 text-red-600 transition-colors flex items-center" : "flex-none px-6 py-3 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors flex items-center";
    });
    adminTableState.restore.page = 1; loadRestoreTable();
}

function loadRestoreTable() {
    const tbody = document.getElementById('table-admin-restore'); let dbArray = [];
    if (activeRestoreTab === 'pemasukan') dbArray = dbPembayaran; 
    else if (activeRestoreTab === 'atribut') dbArray = dbPemasukanAtribut; 
    else if (activeRestoreTab === 'bantuan') dbArray = dbBantuan; 
    else if (activeRestoreTab === 'infaq') dbArray = dbInfaq; 
    else if (activeRestoreTab === 'pengeluaran') dbArray = dbPengeluaran; 
    else if (activeRestoreTab === 'pengeluaran-non') dbArray = dbPengeluaranNon;
    const { pData, tItems } = getPaginatedData(dbArray, 'restore', t => t.isDeleted);
    buildTableRow(tbody, pData, 'restore', t => {
        let rincian = (activeRestoreTab === 'pemasukan' || activeRestoreTab === 'atribut') ? `<div class="font-bold text-gray-800">${t.nis} - ${t.nama}</div><div class="text-xs text-gray-500 mt-1">${t.jenis} (${t.tahun})</div>` : `<div class="font-medium text-gray-800">${t.keterangan || t.jenis}</div><div class="text-xs text-gray-500 mt-1">${t.tglTransaksi}</div>`;
        let statusSync = String(t.id).includes('TEMP-') ? '<i class="ph ph-spinner-gap animate-spin text-orange-500 ml-1"></i>' : '';
        let btnRestore = `<button type="button" onclick="restoreData('${activeRestoreTab}', '${t.id}')" class="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded text-sm font-bold transition-colors">Pulihkan</button>`;
        tbody.innerHTML += `<tr class="hover:bg-red-50 transition-colors"><td class="p-4 text-xs text-gray-500">${t.id} ${statusSync}<br/>${t.tanggalInput}</td><td class="p-4">${rincian}</td><td class="p-4 font-bold text-right text-gray-600">${formatRp(t.nominal)}</td><td class="p-4 text-center">${btnRestore}</td></tr>`;
    });
    updatePaginationUI('restore', tItems, pData.length);
}

// --- FORM HANDLING (EDIT & SUBMIT) ---
function setEditMode(tipe, mode) {
    const btnSubmit = document.getElementById(`btn-submit-${tipe}`); const btnCancel = document.getElementById(`btn-cancel-${tipe}`);
    if (mode) { btnSubmit.innerText = 'Update Data'; btnSubmit.classList.replace('w-full', 'w-2/3'); btnCancel.classList.remove('hidden'); } 
    else { btnSubmit.innerText = 'Simpan Data'; btnSubmit.classList.replace('w-2/3', 'w-full'); btnCancel.classList.add('hidden'); }
}

function cancelEdit(tipe) {
    const formId = tipe === 'pemasukan' ? 'form-pembayaran' : tipe === 'bantuan' ? 'form-bantuan' : tipe === 'pengeluaran-non' ? 'form-pengeluaran-non' : `form-${tipe}`;
    const form = document.getElementById(formId); if (form) form.reset();
    const idField = document.getElementById(`edit-id-${tipe}`); if (idField) idField.value = '';
    setEditMode(tipe, false);
    if (tipe === 'pemasukan') { document.getElementById('info-nama-siswa').classList.add('hidden'); document.getElementById('input-nis').classList.replace('border-red-500', 'border-gray-300'); }
    if (tipe === 'atribut') {
        document.getElementById('alert-tunggakan-atribut').classList.add('hidden');
        document.getElementById('info-nama-siswa-atribut').classList.add('hidden');
        document.getElementById('info-harga-katalog-teks').classList.add('hidden');
        document.getElementById('edit-id-nota-referensi').value = "";
        document.getElementById('edit-acuan-bayar-atribut').value = "";
        document.getElementById('input-status-atribut').disabled = false;
        
        const inputNominal = document.getElementById('input-nominal-atribut');
        if (inputNominal) {
            inputNominal.readOnly = true;
            inputNominal.classList.add('bg-gray-50');
        }
    }
}

function editData(tipe, id) {
    const strId = String(id);
    if (tipe === 'pemasukan') {
        const trx = dbPembayaran.find(t => String(t.id) === strId); if (!trx) return;
        document.getElementById('edit-id-pemasukan').value = trx.id; document.getElementById('edit-acuan-pemasukan').value = trx.acuanBayar; document.getElementById('edit-tgl-pemasukan').value = trx.tanggalInput; document.getElementById('edit-waktu-pemasukan').value = trx.waktuInput; document.getElementById('edit-nama-pemasukan').value = trx.nama; document.getElementById('edit-lp-pemasukan').value = trx.lp; document.getElementById('input-nis').value = trx.nis; cekNamaSiswa(trx.nis); document.getElementById('input-jenis').value = trx.jenis; document.getElementById('input-tahun').value = trx.tahun; document.getElementById('input-nominal').value = trx.nominal;
    } else if (tipe === 'bantuan') {
        const trx = dbBantuan.find(t => String(t.id) === strId); if (!trx) return;
        document.getElementById('edit-id-bantuan').value = trx.id; document.getElementById('bantuan-tgl-transaksi').value = trx.tglTransaksi; document.getElementById('edit-tgl-bantuan').value = trx.tanggalInput; document.getElementById('edit-waktu-bantuan').value = trx.waktuInput; document.getElementById('bantuan-keterangan').value = trx.keterangan; document.getElementById('bantuan-jenis').value = trx.jenis; document.getElementById('bantuan-tahun').value = trx.tahun; document.getElementById('bantuan-nominal').value = trx.nominal;
    } else if (tipe === 'pengeluaran') {
        const trx = dbPengeluaran.find(t => String(t.id) === strId); if (!trx) return;
        document.getElementById('edit-id-pengeluaran').value = trx.id; document.getElementById('out-tgl-transaksi').value = trx.tglTransaksi; document.getElementById('edit-tgl-pengeluaran').value = trx.tanggalInput; document.getElementById('edit-waktu-pengeluaran').value = trx.waktuInput; document.getElementById('out-keterangan').value = trx.keterangan; document.getElementById('out-jenis').value = trx.jenis; document.getElementById('out-tahun').value = trx.tahun; document.getElementById('out-nominal').value = trx.nominal;
    } else if (tipe === 'pengeluaran-non') {
        const trx = dbPengeluaranNon.find(t => String(t.id) === strId); if (!trx) return;
        document.getElementById('edit-id-pengeluaran-non').value = trx.id; document.getElementById('out-non-tgl-transaksi').value = trx.tglTransaksi; document.getElementById('edit-tgl-pengeluaran-non').value = trx.tanggalInput; document.getElementById('edit-waktu-pengeluaran-non').value = trx.waktuInput; document.getElementById('out-non-keterangan').value = trx.keterangan; document.getElementById('out-non-jenis').value = trx.jenis; document.getElementById('out-non-tahun').value = trx.tahun; document.getElementById('out-non-nominal').value = trx.nominal;
    } else if (tipe === 'infaq') {
        const trx = dbInfaq.find(t => String(t.id) === strId); if (!trx) return;
        document.getElementById('edit-id-infaq').value = trx.id; document.getElementById('infaq-tgl-transaksi').value = trx.tglTransaksi; document.getElementById('edit-tgl-infaq').value = trx.tanggalInput; document.getElementById('edit-waktu-infaq').value = trx.waktuInput; document.getElementById('infaq-jenis').value = trx.jenis; document.getElementById('infaq-keterangan').value = trx.keterangan; document.getElementById('infaq-nominal').value = trx.nominal;
    } else if (tipe === 'tarif') {
        const trx = dbMasterTarif.find(t => String(t.id) === strId); if(!trx) return;
        document.getElementById('edit-id-tarif').value = trx.id; document.getElementById('tarif-tahun').value = trx.tahun; document.getElementById('tarif-target').value = trx.target; document.getElementById('tarif-jenis').value = trx.jenis; document.getElementById('tarif-nominal').value = trx.nominal;
    } else if (tipe === 'master_atribut') {
        const trx = dbMasterAtribut.find(t => String(t.id) === strId); if(!trx) return;
        document.getElementById('edit-id-master_atribut').value = trx.id; document.getElementById('master_atribut-tahun').value = trx.tahun; document.getElementById('master_atribut-jenis').value = trx.jenis; document.getElementById('master_atribut-nominal').value = trx.nominal;
    } else if (tipe === 'user') {
        const trx = dbAdmin.find(t => String(t.id) === strId); if (!trx) return;
        document.getElementById('edit-id-user').value = trx.id; document.getElementById('edit-old-username').value = trx.username; document.getElementById('user-username').value = trx.username; document.getElementById('user-nama').value = trx.nama; document.getElementById('user-password').value = trx.password; document.getElementById('user-role').value = trx.role;
    } else if (tipe === 'atribut') {
        const trx = dbPemasukanAtribut.find(t => String(t.id) === strId); if (!trx) return;
        
        // Panggil deteksi siswa LEBIH DULU agar tidak menimpa data edit di bawahnya
        document.getElementById('input-nis-atribut').value = trx.nis; cekSiswaDanTunggakan(trx.nis); 
        
        // Isi semua field tersembunyi
        document.getElementById('edit-id-atribut').value = trx.id; document.getElementById('edit-id-nota-referensi').value = trx.idRef || ""; document.getElementById('edit-acuan-bayar-atribut').value = trx.acuanBayar; document.getElementById('edit-tgl-atribut').value = trx.tanggalInput || ""; document.getElementById('edit-waktu-atribut').value = trx.waktuInput || ""; document.getElementById('edit-nama-atribut').value = trx.nama; document.getElementById('edit-lp-atribut').value = trx.lp; document.getElementById('edit-harga-katalog-atribut').value = trx.hargaKatalog;
        
        // Isi input yang terlihat
        document.getElementById('input-tahun-atribut').value = trx.tahun; document.getElementById('input-jenis-atribut').value = trx.jenis; document.getElementById('input-status-atribut').value = (trx.nominal < trx.hargaKatalog || trx.idRef) ? 'Hutang' : 'Lunas';
        
        // Buka kunci input nominal agar bisa diedit
        const inputNominal = document.getElementById('input-nominal-atribut'); inputNominal.value = trx.nominal; inputNominal.readOnly = false; inputNominal.classList.remove('bg-gray-50');
    }
    setEditMode(tipe, true);
}

// --- MODAL HAPUS DATA ---
function deleteData(tipe, id) {
    deleteTarget = { tipe: tipe, id: id };
    document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
    deleteTarget = { tipe: null, id: null };
    document.getElementById('delete-modal').classList.add('hidden');
}

function submitPembayaran(e) {
    e.preventDefault();
    const editId = document.getElementById('edit-id-pemasukan').value; 
    const isEdit = !!editId;
    const nis = String(document.getElementById('input-nis').value).trim(); 
    const jenis = document.getElementById('input-jenis').value; 
    const tahun = document.getElementById('input-tahun').value; 
    const nominal = parseInt(document.getElementById('input-nominal').value);

    const idRefValue = document.getElementById('edit-id-nota-referensi-pemasukan').value;
    const hargaTarif = parseInt(document.getElementById('edit-harga-tarif-pemasukan').value) || 0;

    if (!dbSiswa.find(s => String(s.nis).trim() === nis)) { showToast('NIS tidak terdaftar!', 'error'); return; }

    // BLOK VALIDASI PENCEGAH OVERPAYMENT
    if (!isEdit && hargaTarif > 0) { 
        if (idRefValue) { // Skenario Bayar Sisa Hutang
            const totalTerbayar = dbPembayaran.filter(t => (t.id === idRefValue || t.id_ref === idRefValue || t.idRef === idRefValue) && !t.isDeleted).reduce((sum, t) => sum + parseInt(t.nominal), 0);
            const sisaHutang = hargaTarif - totalTerbayar;
            if (nominal > sisaHutang) { showToast(`Gagal! Nominal melebihi sisa hutang (Rp ${formatRp(sisaHutang)}).`, 'error'); return; }
        } else { // Skenario Transaksi Baru
            if (nominal > hargaTarif) { showToast(`Gagal! Nominal melebihi Tarif Ketetapan (Rp ${formatRp(hargaTarif)}).`, 'error'); return; }
        }
    }

    let data = { id: editId || `TEMP-${Date.now()}`, isEdit, nis, jenis, tahun, nominal, id_ref: idRefValue };
    
    if (isEdit) {
        data.acuanBayar = document.getElementById('edit-acuan-pemasukan').value; data.tanggalInput = document.getElementById('edit-tgl-pemasukan').value; data.waktuInput = document.getElementById('edit-waktu-pemasukan').value; data.nama = document.getElementById('edit-nama-pemasukan').value; data.lp = document.getElementById('edit-lp-pemasukan').value;
    } else {
        data.tanggalInput = getNowDateIndo(); data.waktuInput = getNowTime(); 
        let count = dbPembayaran.filter(t => String(t.nis).trim() === nis && t.jenis === jenis && t.tahun === tahun).length; 
        data.acuanBayar = `${nis}-${jenis.toUpperCase()}-${tahun}-${count + 1}`; 
        const s = dbSiswa.find(s => String(s.nis).trim() === nis); data.nama = s ? s.nama : '-'; data.lp = s ? s.lp : '-';
    }
    processOptimisticSave('pemasukan', dbPembayaran, data, loadAdminTable);
}

// function submitPembayaranAtribut(e) {
//     e.preventDefault();
//     // 1. Ambil Data
//     const editId = document.getElementById('edit-id-atribut').value; 
//     const isEdit = !!editId;
//     const idRef = document.getElementById('edit-id-nota-referensi').value; 
//     const nis = String(document.getElementById('input-nis-atribut').value).trim(); 
//     const jenis = document.getElementById('input-jenis-atribut').value; 
//     const tahun = document.getElementById('input-tahun-atribut').value; 
//     const nominal = parseInt(document.getElementById('input-nominal-atribut').value) || 0;
//     const hargaKatalog = parseInt(document.getElementById('edit-harga-katalog-atribut').value) || 0;

//     // 2. Validasi NIS
//     if (!dbSiswa.find(s => String(s.nis).trim() === nis)) { 
//         if(typeof showToast === 'function') showToast('NIS tidak terdaftar!', 'error'); 
//         else alert('NIS tidak terdaftar!');
//         return; 
//     }

//     // ==========================================
//     // 🛡️ 2. BLOK VALIDASI PENCEGAH OVERPAYMENT
//     // ==========================================
//     if (!isEdit) { // Hanya cek saat transaksi baru (bukan saat ngedit typo)
//         if (idRef) {
//             // Skenario A: Membayar Cicilan (Cari sisa hutangnya)
//             const totalTerbayar = dbPemasukanAtribut
//                 .filter(t => (t.id === idRef || t.idRef === idRef) && !t.isDeleted)
//                 .reduce((sum, t) => sum + parseInt(t.nominal), 0);
            
//             const sisaHutang = hargaKatalog - totalTerbayar;
            
//             if (nominal > sisaHutang) {
//                 showToast(`Gagal! Nominal bayar (Rp ${formatRp(nominal)}) melebihi sisa hutang siswa (Rp ${formatRp(sisaHutang)}).`, 'error');
//                 return; // STOP! Jangan lanjutkan penyimpanan
//             }
//         } else {
//             // Skenario B: Beli Baru (Nominal tidak boleh lebih dari harga aslinya)
//             if (nominal > hargaKatalog) {
//                 showToast(`Gagal! Nominal bayar (Rp ${formatRp(nominal)}) melebihi harga katalog (Rp ${formatRp(hargaKatalog)}).`,'error');
//                 return; // STOP!
//             }
//         }
//     }

//     // 3. Rakit Objek Data (Persis seperti format Anda)
//     let data = { 
//         id: editId || `TEMP-${Date.now()}`, 
//         isEdit: !!editId, 
//         idRef: idRef || null,
//         nis, 
//         jenis, 
//         tahun, 
//         nominal,
//         hargaKatalog
//     };

//     // 4. Logika Edit vs Data Baru
//     if (data.isEdit) {
//         data.acuanBayar = document.getElementById('edit-acuan-bayar-atribut').value; 
//         data.tanggalInput = document.getElementById('edit-tgl-atribut')?.value || getNowDateIndo(); 
//         data.waktuInput = document.getElementById('edit-waktu-atribut')?.value || getNowTime(); 
//         data.nama = document.getElementById('edit-nama-atribut').value; 
//         data.lp = document.getElementById('edit-lp-atribut').value;
//     } else {
//         data.tanggalInput = getNowDateIndo(); 
//         data.waktuInput = getNowTime(); 
        
//         let count = dbPemasukanAtribut.filter(t => String(t.nis).trim() === nis && t.jenis === jenis && t.tahun === tahun).length;
//         data.acuanBayar = `${nis}-${jenis.toUpperCase()}-${tahun}-${count + 1}`; 
        
//         const s = dbSiswa.find(s => String(s.nis).trim() === nis); 
//         data.nama = s ? s.nama : '-'; 
//         data.lp = s ? s.lp : '-';
//     }

//     // 5. Eksekusi Optimistic Save
//     processOptimisticSave('atribut', dbPemasukanAtribut, data, loadAdminAtributTable);

//     // 6. Reset Form & Antarmuka UI (Kembali ke Normal)
//     document.getElementById('form-atribut').reset();
//     document.getElementById('alert-tunggakan-atribut').classList.add('hidden');
//     document.getElementById('info-nama-siswa-atribut').classList.add('hidden');
//     document.getElementById('info-harga-katalog-teks').classList.add('hidden');
    
//     document.getElementById('edit-id-atribut').value = "";
//     document.getElementById('edit-id-nota-referensi').value = "";
//     document.getElementById('edit-acuan-bayar-atribut').value = "";
//     document.getElementById('input-status-atribut').disabled = false;
//     document.getElementById('input-nominal-atribut').readOnly = true;
//     document.getElementById('input-nominal-atribut').classList.add('bg-gray-50');
// }

function submitPembayaranAtribut(e) {
    e.preventDefault();
    // 1. Ambil Data
    const editId = document.getElementById('edit-id-atribut').value; 
    const isEdit = !!editId;
    const idRef = document.getElementById('edit-id-nota-referensi').value; 
    const nis = String(document.getElementById('input-nis-atribut').value).trim(); 
    const jenis = document.getElementById('input-jenis-atribut').value; 
    const tahun = document.getElementById('input-tahun-atribut').value; 
    const nominal = parseInt(document.getElementById('input-nominal-atribut').value) || 0;
    const hargaKatalog = parseInt(document.getElementById('edit-harga-katalog-atribut').value) || 0;

    // 2. Validasi NIS
    if (!dbSiswa.find(s => String(s.nis).trim() === nis)) { 
        if(typeof showToast === 'function') showToast('NIS tidak terdaftar!', 'error'); 
        else alert('NIS tidak terdaftar!');
        return; 
    }

    // ==========================================
    // 🛡️ 2. BLOK VALIDASI PENCEGAH OVERPAYMENT
    // ==========================================
    if (!isEdit) { 
        if (idRef) {
            // Skenario A: Membayar Cicilan
            const totalTerbayar = dbPemasukanAtribut
                .filter(t => (t.id === idRef || t.idRef === idRef) && !t.isDeleted)
                .reduce((sum, t) => sum + parseInt(t.nominal), 0);
            
            const sisaHutang = hargaKatalog - totalTerbayar;
            
            if (nominal > sisaHutang) {
                if(typeof showToast === 'function') showToast(`Gagal! Nominal bayar (Rp ${formatRp(nominal)}) melebihi sisa hutang (Rp ${formatRp(sisaHutang)}).`, 'error');
                else alert(`Gagal! Nominal bayar melebihi sisa hutang.`);
                return; // STOP!
            }
        } else {
            // Skenario B: Beli Baru 
            if (nominal > hargaKatalog) {
                if(typeof showToast === 'function') showToast(`Gagal! Nominal bayar (Rp ${formatRp(nominal)}) melebihi harga katalog (Rp ${formatRp(hargaKatalog)}).`,'error');
                else alert(`Gagal! Nominal bayar melebihi harga katalog.`);
                return; // STOP!
            }
        }
    }

    // 3. Rakit Objek Data 
    let data = { 
        id: editId || `TEMP-${Date.now()}`, 
        isEdit: !!editId, 
        idRef: idRef || null,
        nis, 
        jenis, 
        tahun, 
        nominal,
        hargaKatalog
    };

    // ==========================================
    // 🏷️ 4. LOGIKA PEMBUATAN ACUAN BAYAR (B1-1)
    // ==========================================
    if (data.isEdit) {
        data.acuanBayar = document.getElementById('edit-acuan-bayar-atribut').value; 
        data.tanggalInput = document.getElementById('edit-tgl-atribut')?.value || getNowDateIndo(); 
        data.waktuInput = document.getElementById('edit-waktu-atribut')?.value || getNowTime(); 
        data.nama = document.getElementById('edit-nama-atribut').value; 
        data.lp = document.getElementById('edit-lp-atribut').value;
    } else {
        data.tanggalInput = getNowDateIndo(); 
        data.waktuInput = getNowTime(); 
        
        let bIndex = 1; // Kode Pembelian ke-berapa (B)
        let cIndex = 1; // Kode Urutan Transaksi ke-berapa
        
        if (idRef) {
            // --- SKENARIO CICILAN ---
            // Cari data nota induknya untuk mencontek dia "B" ke berapa
            const induk = dbPemasukanAtribut.find(t => t.id === idRef || t.id_nota_referensi === idRef);
            
            if (induk) {
                // Trik Regex: Mencari pola "-B(angka)-" dari acuan_bayar induk (misal: ...-B1-1)
                const acuanInduk = induk.acuanBayar || induk.acuan_bayar || "";
                const matchB = acuanInduk.match(/-B(\d+)-/);
                bIndex = matchB ? parseInt(matchB[1]) : 1; 

                // Hitung ini adalah transaksi anak ke berapa
                const jumlahCicilan = dbPemasukanAtribut.filter(t => t.idRef === idRef || t.id_nota_referensi === idRef).length;
                
                // +1 untuk nota DP/Induk, +1 untuk transaksi baru ini
                cIndex = jumlahCicilan + 2; 
            }
        } else {
            // --- SKENARIO BELI BARU (INDUK) ---
            // Hitung ada berapa nota Induk (yang tidak punya id_referensi) di jenis & tahun ini
            const jumlahInduk = dbPemasukanAtribut.filter(t => 
                String(t.nis).trim() === nis && 
                t.jenis === jenis && 
                t.tahun === tahun && 
                !t.idRef && !t.id_nota_referensi
            ).length;
            
            bIndex = jumlahInduk + 1; // Jika ini pembelian pertama, maka B1. Jika kedua, B2.
            cIndex = 1; // Selalu 1 karena ini DP / Pelunasan pertama kali beli
        }

        // CETAK RESI FINAL: 1707-TOPI-2026/2027-B1-1
        data.acuanBayar = `${nis}-${jenis.toUpperCase()}-${tahun}-B${bIndex}-${cIndex}`; 
        
        const s = dbSiswa.find(s => String(s.nis).trim() === nis); 
        data.nama = s ? s.nama : '-'; 
        data.lp = s ? s.lp : '-';
    }

    // 5. Eksekusi Optimistic Save
    processOptimisticSave('atribut', dbPemasukanAtribut, data, loadAdminAtributTable);

    // 6. Reset Form & Antarmuka UI
    document.getElementById('form-atribut').reset();
    document.getElementById('alert-tunggakan-atribut').classList.add('hidden');
    document.getElementById('info-nama-siswa-atribut').classList.add('hidden');
    document.getElementById('info-harga-katalog-teks').classList.add('hidden');
    
    document.getElementById('edit-id-atribut').value = "";
    document.getElementById('edit-id-nota-referensi').value = "";
    document.getElementById('edit-acuan-bayar-atribut').value = "";
    document.getElementById('input-status-atribut').disabled = false;
    document.getElementById('input-nominal-atribut').readOnly = true;
    document.getElementById('input-nominal-atribut').classList.add('bg-gray-50');
}

function submitBantuan(e) {
    e.preventDefault();
    const editId = document.getElementById('edit-id-bantuan').value;
    let data = { id: editId || `TEMP-${Date.now()}`, isEdit: !!editId, tglTransaksi: document.getElementById('bantuan-tgl-transaksi').value, keterangan: document.getElementById('bantuan-keterangan').value, jenis: document.getElementById('bantuan-jenis').value, tahun: document.getElementById('bantuan-tahun').value, nominal: parseInt(document.getElementById('bantuan-nominal').value) };
    if (data.isEdit) { data.tanggalInput = document.getElementById('edit-tgl-bantuan').value; data.waktuInput = document.getElementById('edit-waktu-bantuan').value; } 
    else { data.tanggalInput = getNowDateIndo(); data.waktuInput = getNowTime(); }
    processOptimisticSave('bantuan', dbBantuan, data, loadAdminBantuanTable);
    document.getElementById('bantuan-tgl-transaksi').valueAsDate = new Date();
}

function submitPengeluaran(e) {
    e.preventDefault();
    const editId = document.getElementById('edit-id-pengeluaran').value;
    let data = { id: editId || `TEMP-${Date.now()}`, isEdit: !!editId, tglTransaksi: document.getElementById('out-tgl-transaksi').value, keterangan: document.getElementById('out-keterangan').value, jenis: document.getElementById('out-jenis').value, tahun: document.getElementById('out-tahun').value, nominal: parseInt(document.getElementById('out-nominal').value) };
    if (data.isEdit) { data.tanggalInput = document.getElementById('edit-tgl-pengeluaran').value; data.waktuInput = document.getElementById('edit-waktu-pengeluaran').value; } 
    else { data.tanggalInput = getNowDateIndo(); data.waktuInput = getNowTime(); }
    processOptimisticSave('pengeluaran', dbPengeluaran, data, loadAdminPengeluaranTable);
    document.getElementById('out-tgl-transaksi').valueAsDate = new Date();
}

function submitPengeluaranNon(e) {
    e.preventDefault();
    const editId = document.getElementById('edit-id-pengeluaran-non').value;
    let data = { id: editId || `TEMP-${Date.now()}`, isEdit: !!editId, tglTransaksi: document.getElementById('out-non-tgl-transaksi').value, keterangan: document.getElementById('out-non-keterangan').value, jenis: document.getElementById('out-non-jenis').value, tahun: document.getElementById('out-non-tahun').value, nominal: parseInt(document.getElementById('out-non-nominal').value) };
    if (data.isEdit) { data.tanggalInput = document.getElementById('edit-tgl-pengeluaran-non').value; data.waktuInput = document.getElementById('edit-waktu-pengeluaran-non').value; } 
    else { data.tanggalInput = getNowDateIndo(); data.waktuInput = getNowTime(); }
    processOptimisticSave('pengeluaran-non', dbPengeluaranNon, data, loadAdminPengeluaranNonTable);
    document.getElementById('out-non-tgl-transaksi').valueAsDate = new Date();
}

function submitInfaq(e) {
    e.preventDefault();
    const editId = document.getElementById('edit-id-infaq').value;
    let data = { id: editId || `TEMP-${Date.now()}`, isEdit: !!editId, tglTransaksi: document.getElementById('infaq-tgl-transaksi').value, jenis: document.getElementById('infaq-jenis').value, keterangan: document.getElementById('infaq-keterangan').value, nominal: parseInt(document.getElementById('infaq-nominal').value) };
    if (data.isEdit) { data.tanggalInput = document.getElementById('edit-tgl-infaq').value; data.waktuInput = document.getElementById('edit-waktu-infaq').value; } 
    else { data.tanggalInput = getNowDateIndo(); data.waktuInput = getNowTime(); }
    processOptimisticSave('infaq', dbInfaq, data, loadAdminInfaqTable);
    document.getElementById('infaq-tgl-transaksi').valueAsDate = new Date();
}

// function submitTarif(e) { 
//     e.preventDefault(); 
//     const editId = document.getElementById('edit-id-tarif').value;
//     let data = { id: editId || `TRF-${Date.now()}`, isEdit: !!editId, tahun: document.getElementById('tarif-tahun').value, target: document.getElementById('tarif-target').value.toUpperCase(), jenis: document.getElementById('tarif-jenis').value, nominal: parseInt(document.getElementById('tarif-nominal').value) }; 
//     processOptimisticSave('tarif', dbMasterTarif, data, loadAdminTarifTable);
// }

// function submitMasterAtribut(e) { 
//     e.preventDefault(); 
//     const editId = document.getElementById('edit-id-master_atribut').value;
//     let data = { id: editId || `TRF-ATB-${Date.now()}`, isEdit: !!editId, tahun: document.getElementById('master_atribut-tahun').value, jenis: document.getElementById('master_atribut-jenis').value, nominal: parseInt(document.getElementById('master_atribut-nominal').value) }; 
//     processOptimisticSave('master_atribut', dbMasterAtribut, data, loadAdminMasterAtributTable);
// }

// 1. Ubah ID sementara menjadi "TEMP-" agar terbaca oleh sistem Optimistic Save
function submitTarif(e) { 
    e.preventDefault(); 
    const editId = document.getElementById('edit-id-tarif').value;
    let data = { 
        id: editId || `TEMP-${Date.now()}`, 
        isEdit: !!editId, 
        tahun: document.getElementById('tarif-tahun').value, 
        target: document.getElementById('tarif-target').value.toUpperCase(), 
        jenis: document.getElementById('tarif-jenis').value, 
        nominal: parseInt(document.getElementById('tarif-nominal').value) 
    }; 
    processOptimisticSave('tarif', dbMasterTarif, data, loadAdminTarifTable);
}

// 2. Ubah ID sementara menjadi "TEMP-"
function submitMasterAtribut(e) { 
    e.preventDefault(); 
    const editId = document.getElementById('edit-id-master_atribut').value;
    let data = { 
        id: editId || `TEMP-${Date.now()}`, 
        isEdit: !!editId, 
        tahun: document.getElementById('master_atribut-tahun').value, 
        jenis: document.getElementById('master_atribut-jenis').value, 
        nominal: parseInt(document.getElementById('master_atribut-nominal').value) 
    }; 
    processOptimisticSave('master_atribut', dbMasterAtribut, data, loadAdminMasterAtributTable);
}

function submitUser(e) {
    e.preventDefault();
    const editId = document.getElementById('edit-id-user').value; 
    const username = document.getElementById('user-username').value.trim();

    // ==========================================
    // 🚧 PENJAGA GERBANG: BLOKIR JIKA INI DATA BARU
    // ==========================================
    if (!editId) { 
        // Jika editId kosong, berarti user sedang mencoba "Tambah Baru"
        showToast("PENAMBAHAN USER TERKUNCI Untuk keamanan\npenambahan user baru dialihkan melalui Dasbor Supabase (Menu Authentication).", "error");
        return; // Hentikan proses agar data tidak tersimpan
    }
    // ==========================================

    let data = { 
        id: editId || `TEMP-${Date.now()}`, 
        isEdit: !!editId, 
        oldUsername: document.getElementById('edit-old-username').value, 
        username: username, 
        nama: document.getElementById('user-nama').value.trim(), 
        password: document.getElementById('user-password').value, 
        role: document.getElementById('user-role').value 
    };

    if (!data.isEdit && dbAdmin.find(u => String(u.username).trim().toLowerCase() === String(username).trim().toLowerCase())) { 
        showToast('Username terpakai!', 'error'); 
        return; 
    }
    
    processOptimisticSave('user', dbAdmin, data, loadAdminUserTable);
}

// --- GRAFIK & DASHBOARD ---
let chartKelasInstance = null; let chartKeuanganInstance = null;
let currentChartKelasTab = 'aktif';
function setChartSiswaTab(tab) {
    currentChartKelasTab = tab;
    const tabs = ['aktif', 'lulus', 'keluar'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-chart-${t}`);
        if(btn) btn.className = (t === tab) ? "px-4 py-1.5 text-sm font-semibold rounded-md bg-blue-600 text-white shadow-sm transition-all" : "px-4 py-1.5 text-sm font-semibold rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-all";
    });
    renderChartKelas();
}

function handleDashFilter() { loadDashboardStats(); }

function loadDashboardStats() {
    const filterTahun = document.getElementById('filter-dash-tahun') ? document.getElementById('filter-dash-tahun').value : 'All';
    let globalPemasukanSiswa = dbPembayaran.reduce((sum, trx) => !trx.isDeleted ? sum + parseInt(trx.nominal || 0) : sum, 0);
    let globalBantuan = dbBantuan.reduce((sum, trx) => !trx.isDeleted ? sum + parseInt(trx.nominal || 0) : sum, 0);
    let globalOps = dbPengeluaran.reduce((sum, trx) => !trx.isDeleted ? sum + parseInt(trx.nominal || 0) : sum, 0);
    let globalNonOps = dbPengeluaranNon.reduce((sum, trx) => !trx.isDeleted ? sum + parseInt(trx.nominal || 0) : sum, 0);
    let globalInfaq = dbInfaq.reduce((sum, trx) => !trx.isDeleted ? (trx.jenis === 'Pemasukan' ? sum + parseInt(trx.nominal || 0) : sum - parseInt(trx.nominal || 0)) : sum, 0);

    let globalMasuk = globalPemasukanSiswa + globalBantuan; let globalKeluar = globalOps + globalNonOps; let globalSaldoFisik = globalMasuk - globalKeluar + globalInfaq;

    let yearPemasukanSiswa = dbPembayaran.filter(t => filterTahun === 'All' || t.tahun === filterTahun).reduce((sum, t) => !t.isDeleted ? sum + parseInt(t.nominal || 0) : sum, 0);
    let yearBantuan = dbBantuan.filter(t => filterTahun === 'All' || t.tahun === filterTahun).reduce((sum, t) => !t.isDeleted ? sum + parseInt(t.nominal || 0) : sum, 0);
    let yearOps = dbPengeluaran.filter(t => filterTahun === 'All' || t.tahun === filterTahun).reduce((sum, t) => !t.isDeleted ? sum + parseInt(t.nominal || 0) : sum, 0);
    let yearNonOps = dbPengeluaranNon.filter(t => filterTahun === 'All' || t.tahun === filterTahun).reduce((sum, t) => !t.isDeleted ? sum + parseInt(t.nominal || 0) : sum, 0);

    let yearMasuk = yearPemasukanSiswa + yearBantuan; let yearKeluar = yearOps + yearNonOps; let yearSurplus = yearMasuk - yearKeluar;

    document.getElementById('dash-pemasukan-tahun').innerText = formatRp(yearMasuk);
    document.getElementById('dash-pengeluaran-tahun').innerText = formatRp(yearKeluar);
    let surplusEl = document.getElementById('dash-surplus-tahun');
    surplusEl.innerText = (yearSurplus >= 0 ? '+' : '') + formatRp(yearSurplus);
    surplusEl.className = yearSurplus < 0 ? "text-xl md:text-2xl font-bold text-red-700 truncate" : "text-xl md:text-2xl font-bold text-purple-800 truncate";
    document.getElementById('dash-infaq-global').innerText = formatRp(globalInfaq);
    document.getElementById('dash-saldo-global').innerText = formatRp(globalSaldoFisik);

    renderCharts(filterTahun);
}

function renderChartKelas() {
    if (typeof ChartDataLabels !== 'undefined') Chart.register(ChartDataLabels);
    const ctxKelas = document.getElementById('chart-kelas');
    if (!ctxKelas) return;

    let filteredSiswa = dbSiswa.filter(s => {
        let kls = String(s.kelas).toUpperCase();
        if (currentChartKelasTab === 'aktif') return !kls.includes('LULUS') && !kls.includes('KELUAR');
        if (currentChartKelasTab === 'lulus') return kls.includes('LULUS');
        if (currentChartKelasTab === 'keluar') return kls.includes('KELUAR');
        return true;
    });

    const statsPerKelas = {};
    filteredSiswa.forEach(s => {
        if (s.kelas) {
            if (!statsPerKelas[s.kelas]) statsPerKelas[s.kelas] = { L: 0, P: 0, Total: 0 };
            if (s.lp === 'L') statsPerKelas[s.kelas].L++; if (s.lp === 'P') statsPerKelas[s.kelas].P++; statsPerKelas[s.kelas].Total++;
        }
    });

    let labelsKelas = Object.keys(statsPerKelas).sort();
    if (labelsKelas.length > 6) labelsKelas = labelsKelas.slice(-6);
    
    if (chartKelasInstance) chartKelasInstance.destroy();
    chartKelasInstance = new Chart(ctxKelas, {
        type: 'bar',
        data: { labels: labelsKelas, datasets: [{ label: 'Laki-Laki', data: labelsKelas.map(k => statsPerKelas[k].L), backgroundColor: '#93c5fd', borderRadius: 4 }, { label: 'Perempuan', data: labelsKelas.map(k => statsPerKelas[k].P), backgroundColor: '#fbcfe8', borderRadius: 4 }, { label: 'Total', data: labelsKelas.map(k => statsPerKelas[k].Total), backgroundColor: '#fde047', borderRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { borderDash: [4, 4] }, grace: '15%' }, x: { grid: { display: false } } }, plugins: { legend: { position: 'top' }, datalabels: { anchor: 'end', align: 'top', color: '#475569', font: { weight: 'bold', size: 10 }, formatter: function(value) { return value > 0 ? value : ''; } } } }
    });
}

function renderCharts(filterTahun = 'All') {
    renderChartKelas();
    const kasPerBulan = {};
    const getYearMonth = (dateString) => {
        if (!dateString) return null;
        const str = String(dateString);
        if (/^\d{4}-\d{2}/.test(str)) return str.substring(0, 7);
        const bulanArr = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const parts = str.split(' ');
        if (parts.length >= 3) { let mIdx = bulanArr.findIndex(b => b.toLowerCase() === parts[1].toLowerCase() || b.substring(0, 3).toLowerCase() === parts[1].toLowerCase()); if (mIdx !== -1) return `${parts[2]}-${String(mIdx + 1).padStart(2, '0')}`; }
        return null;
    };

    dbPembayaran.filter(t => !t.isDeleted && (filterTahun === 'All' || t.tahun === filterTahun)).forEach(trx => { const ym = getYearMonth(trx.tanggalInput || trx.timestamp); if (ym) { if (!kasPerBulan[ym]) kasPerBulan[ym] = { masuk: 0, keluar: 0 }; kasPerBulan[ym].masuk += parseInt(trx.nominal || 0); } });
    dbBantuan.filter(t => !t.isDeleted && (filterTahun === 'All' || t.tahun === filterTahun)).forEach(trx => { const ym = getYearMonth(trx.tglTransaksi || trx.tanggalInput); if (ym) { if (!kasPerBulan[ym]) kasPerBulan[ym] = { masuk: 0, keluar: 0 }; kasPerBulan[ym].masuk += parseInt(trx.nominal || 0); } });
    [...dbPengeluaran.filter(t => !t.isDeleted && (filterTahun === 'All' || t.tahun === filterTahun)), ...dbPengeluaranNon.filter(t => !t.isDeleted && (filterTahun === 'All' || t.tahun === filterTahun))].forEach(trx => { const ym = getYearMonth(trx.tglTransaksi || trx.tanggalInput); if (ym) { if (!kasPerBulan[ym]) kasPerBulan[ym] = { masuk: 0, keluar: 0 }; kasPerBulan[ym].keluar += parseInt(trx.nominal || 0); } });

    const urutanBulan = Object.keys(kasPerBulan).sort();
    const namaBulanIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const labelsKeuangan = urutanBulan.map(ym => { const [y, m] = ym.split('-'); return `${namaBulanIndo[parseInt(m) - 1]} ${y}`; });
    const dataKasMasuk = urutanBulan.map(ym => kasPerBulan[ym].masuk); const dataKasKeluar = urutanBulan.map(ym => kasPerBulan[ym].keluar);
    
    const ctxKeuangan = document.getElementById('chart-keuangan');
    if (chartKeuanganInstance) chartKeuanganInstance.destroy();
    chartKeuanganInstance = new Chart(ctxKeuangan, {
        type: 'line',
        data: { labels: labelsKeuangan, datasets: [{ label: 'Pemasukan (Rp)', data: dataKasMasuk, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 2, fill: true, tension: 0.3 }, { label: 'Pengeluaran Total (Rp)', data: dataKasKeluar, borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)', borderWidth: 2, fill: true, tension: 0.3 }] },
        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8 } }, tooltip: { callbacks: { label: function(c) { return (c.dataset.label || '') + ': ' + formatRp(c.parsed.y); } } }, datalabels: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: function(value) { if (value >= 1000000) return 'Rp' + (value / 1000000) + ' Jt'; if (value >= 1000) return 'Rp' + (value / 1000) + ' Rb'; return 'Rp' + value; } } } } }
    });
}

// --- RENDER VIEW SISWA ---
let currentSiswaData = null; let currentBillingData = null; 
function renderSiswaView(siswaProfile, billingData) {
    currentSiswaData = siswaProfile; currentBillingData = billingData;
    document.getElementById('view-login').classList.add('hidden');
    document.getElementById('view-siswa').classList.remove('hidden');
    document.getElementById('siswa-nama').innerText = siswaProfile.nama;
    document.getElementById('siswa-nis-text').innerText = siswaProfile.nis;
    
    const badgeContainer = document.getElementById('siswa-kelas-badge');
    let kls = String(siswaProfile.kelas).toUpperCase(); let badgeClass = 'bg-gray-100 text-gray-700 border-gray-200';
    if (kls.includes('X ') || kls === 'X') badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    else if (kls.includes('XI ') || kls === 'XI') badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
    else if (kls.includes('XII ') || kls === 'XII') badgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
    else if (kls.includes('LULUS') || kls.includes('KELUAR')) badgeClass = 'bg-slate-200 text-slate-700 border-slate-300';
    if(badgeContainer) badgeContainer.innerHTML = `<span class="${badgeClass} border px-2 py-0.5 rounded text-xs font-bold">Kelas: ${siswaProfile.kelas}</span>`;
    
    const boxKekurangan = document.getElementById('box-kekurangan'); const titleKekurangan = document.getElementById('title-kekurangan'); const valKekurangan = document.getElementById('siswa-total-kekurangan'); const bannerLama = document.getElementById('siswa-banner-tunggakan');
    if(billingData.hutangLamaMurni > 0 && bannerLama) { bannerLama.classList.remove('hidden'); document.getElementById('banner-amount').innerText = formatRp(billingData.hutangLamaMurni); } else if(bannerLama) bannerLama.classList.add('hidden');
    if (billingData.totalTunggakan === 0) { boxKekurangan.className = "bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center min-w-[200px] w-full"; titleKekurangan.className = "text-sm text-emerald-600 font-medium mb-1"; titleKekurangan.innerText = "Status Pembayaran"; valKekurangan.className = "text-2xl font-bold text-emerald-700"; valKekurangan.innerText = "LUNAS"; } 
    else { boxKekurangan.className = "bg-red-50 border border-red-100 rounded-lg p-4 text-center min-w-[200px] w-full"; titleKekurangan.className = "text-sm text-red-600 font-medium mb-1"; titleKekurangan.innerText = "Total Hutang Berjalan"; valKekurangan.className = "text-2xl font-bold text-red-700"; valKekurangan.innerText = formatRp(billingData.totalTunggakan); }

    const widgetUjian = document.getElementById('widget-ujian'); const widgetTitle = document.getElementById('widget-exam-title'); const widgetAmount = document.getElementById('widget-exam-amount');
    widgetUjian.classList.remove('hidden'); widgetTitle.innerText = `Syarat ${billingData.examWidget.name}`;
    if (billingData.examWidget.isLunas) { widgetUjian.style.background = "linear-gradient(to right, #10b981, #14b8a6)"; widgetUjian.className = "rounded-xl shadow-md p-6 mb-6 text-white flex flex-col md:flex-row items-center justify-between transform transition-all duration-500 hover:scale-[1.01]"; widgetAmount.innerText = "MEMENUHI SYARAT"; } 
    else { widgetUjian.style.background = "linear-gradient(to right, #f59e0b, #f97316)"; widgetUjian.className = "rounded-xl shadow-md p-6 mb-6 text-white flex flex-col md:flex-row items-center justify-between transform transition-all duration-500 hover:scale-[1.01]"; widgetAmount.innerText = formatRp(billingData.examWidget.amount); }

    const selTahun = document.getElementById('siswa-tahun-filter'); selTahun.innerHTML = '';
    if(billingData.riwayatTahun.length > 0) { billingData.riwayatTahun.forEach(t => selTahun.innerHTML += `<option value="${t}">${t}</option>`); } else { selTahun.innerHTML = `<option value="All">Belum Ada Tagihan</option>`; }

    renderSiswaTables(billingData.riwayatTahun[0] || 'All');
}

function renderSiswaTables(targetTahun) {
    const formatCell = (val) => (val === 'LUNAS' || val === 0) ? `<span class="px-3 py-1 text-xs rounded-full font-bold bg-emerald-100 text-emerald-700 tracking-wide"><i class="ph ph-check mr-1"></i> LUNAS</span>` : `<span class="px-3 py-1 text-xs rounded-full font-bold bg-red-100 text-red-700">${formatRp(val)}</span>`;
    document.getElementById('lbl-thn-spp').innerText = `(${targetTahun})`;

    const tbodyBulan = document.getElementById('table-rekap-bulanan'); tbodyBulan.innerHTML = '';
    let filteredBulanan = currentBillingData.bulanan.filter(b => b.tahun === targetTahun);
    if (filteredBulanan.length === 0) tbodyBulan.innerHTML = '<tr><td colspan="2" class="p-4 text-center text-gray-500">Bebas Tagihan SPP pada tahun ini</td></tr>';
    filteredBulanan.forEach(item => { tbodyBulan.innerHTML += `<tr class="hover:bg-gray-50"><td class="p-4 font-medium text-gray-700">${item.jenis}</td><td class="p-4 text-center">${formatCell(item.sisa)}</td></tr>`; });

    const tbodyTagihan = document.getElementById('table-rekap-tagihan'); tbodyTagihan.innerHTML = '';
    let filteredLainnya = currentBillingData.lainnya.filter(l => l.tahun === targetTahun);
    if (filteredLainnya.length === 0) tbodyTagihan.innerHTML = '<tr><td colspan="2" class="p-4 text-center text-gray-500">Belum ada tagihan lainnya</td></tr>';
    filteredLainnya.forEach(item => { tbodyTagihan.innerHTML += `<tr class="hover:bg-gray-50"><td class="p-4 font-bold text-gray-700">${item.jenis}</td><td class="p-4 font-medium text-right">${formatCell(item.sisa)}</td></tr>`; });
}

function refreshDataSiswa(isFilter = false) {
    if (isFilter) { renderSiswaTables(document.getElementById('siswa-tahun-filter').value); return; }
    const rawText = document.getElementById('siswa-nis-kelas').innerText; const nis = rawText.split('|')[0].replace('NIS:', '').trim(); if (!nis || nis === '-') return;
    showLoading("Sinkronisasi...");
    setTimeout(() => {
        hideLoading(); const s = dbSiswa.find(s => String(s.nis).trim() === nis);
        if (s) { let riwayat = dbPembayaran.filter(p => !p.isDeleted && String(p.nis).trim() === nis); let billing = calculateSiswaBilling(s, dbMasterTarif, riwayat); renderSiswaView(s, billing); showToast('Data disinkronisasi (Preview)!'); }
    }, 600);
}

function startStudentRefreshCooldown() {
    const btn = document.getElementById('btn-refresh-siswa'); const textSpan = document.getElementById('text-refresh-siswa'); const icon = btn.querySelector('i');
    btn.disabled = true; btn.classList.add('opacity-50', 'cursor-not-allowed'); icon.classList.remove('animate-spin');
    let timeLeft = 300;
    refreshCountdownInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) { clearInterval(refreshCountdownInterval); btn.disabled = false; btn.classList.remove('opacity-50', 'cursor-not-allowed'); textSpan.innerText = "Perbarui Data"; } 
        else { const m = Math.floor(timeLeft / 60); const s = timeLeft % 60; textSpan.innerText = `Tunggu (${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')})`; }
    }, 1000);
}

async function refreshButtonDataSiswa() {
    const rawText = document.getElementById('siswa-nis-text').innerText; const nis = rawText.includes('|') ? rawText.split('|')[0].replace('NIS:', '').trim() : rawText.trim(); if (!nis || nis === '-') return;
    showLoading("Memperbarui data Anda..."); document.getElementById('btn-refresh-siswa').querySelector('i').classList.add('animate-spin');
    const isSuccess = await loadDataFromSupabase();
    hideLoading();
    if (isSuccess) {
        const s = dbSiswa.find(s => String(s.nis).trim() === nis);
        if (s) { let riwayat = dbPembayaran.filter(p => !p.isDeleted && String(p.nis).trim() === nis); let billing = calculateSiswaBilling(s, dbMasterTarif, riwayat); renderSiswaView(s, billing); showToast('Data diperbarui!', 'success'); startStudentRefreshCooldown(); }
    } else {
        showToast('Gagal sinkron', 'error'); document.getElementById('btn-refresh-siswa').querySelector('i').classList.remove('animate-spin');
    }
}

// ==========================================
// LOGIKA FORM PEMASUKAN ATRIBUT
// ==========================================

// // 1. Fungsi Cek NIS dan Deteksi Tunggakan
// function cekSiswaDanTunggakan(nis) {
//     const siswa = dbSiswa.find(s => s.nis === nis);
//     const elNama = document.getElementById('info-nama-siswa-atribut');
//     const alertBox = document.getElementById('alert-tunggakan-atribut');
//     const listTunggakan = document.getElementById('list-tunggakan-atribut');

//     // Reset Form Tersembunyi saat NIS berubah
//     document.getElementById('edit-id-nota-referensi').value = "";
//     document.getElementById('input-status-atribut').disabled = false;
//     kalkulasiHargaAtribut(); // Reset nominal
    
//     if (siswa) {
//         elNama.innerHTML = `<i class="ph ph-user-circle mr-1 text-lg"></i> ${siswa.nama} (${siswa.kelas})`;
//         elNama.classList.remove('hidden', 'text-red-600');
//         elNama.classList.add('text-indigo-600');
        
//         // Simpan nama & LP ke hidden input untuk disubmit nanti
//         document.getElementById('edit-nama-atribut').value = siswa.nama;
//         document.getElementById('edit-lp-atribut').value = siswa.lp;
//     } else {
//         elNama.innerHTML = '<i class="ph ph-x-circle mr-1 text-lg"></i> Siswa tidak ditemukan';
//         elNama.classList.remove('hidden', 'text-indigo-600');
//         elNama.classList.add('text-red-600');
//         alertBox.classList.add('hidden');
//         return;
//     }

//     // --- DETEKTIF TUNGGAKAN ---
//     const transaksiSiswa = dbPemasukanAtribut.filter(t => t.nis === nis && !t.isDeleted);
//     let tunggakanHTML = '';

//     // Ambil transaksi pertama (induk) yang bukan pelunasan cicilan (idRef kosong)
//     const transaksiInduk = transaksiSiswa.filter(t => !t.idRef);

//     transaksiInduk.forEach(induk => {
//         let totalBayar = Number(induk.nominal) || 0;
        
//         // Cari semua uang cicilan yang menginduk ke transaksi ini
//         const cicilan = transaksiSiswa.filter(t => t.idRef === induk.id);
//         cicilan.forEach(c => totalBayar += (Number(c.nominal) || 0));

//         const sisaHutang = (Number(induk.hargaKatalog) || 0) - totalBayar;

//         if (sisaHutang > 0) {
//             tunggakanHTML += `
//             <div class="flex justify-between items-center bg-white p-2 rounded border border-yellow-200 mt-1.5 shadow-sm">
//                 <span class="font-medium text-gray-800">${induk.jenis} <span class="text-xs text-gray-500">(${induk.tahun})</span><br><span class="text-xs text-red-600 font-bold">Sisa: Rp ${sisaHutang.toLocaleString('id-ID')}</span></span>
//                 <button type="button" onclick="setBayarCicilan('${induk.id}', '${induk.jenis}', '${induk.tahun}', ${sisaHutang}, ${induk.hargaKatalog})" class="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1.5 rounded-md text-xs font-bold transition-colors">Lunasi / Cicil</button>
//             </div>`;
//         }
//     });

//     if (tunggakanHTML !== '') {
//         listTunggakan.innerHTML = tunggakanHTML;
//         alertBox.classList.remove('hidden');
//     } else {
//         alertBox.classList.add('hidden');
//         listTunggakan.innerHTML = '';
//     }
// }

// // 2. Fungsi Eksekusi Saat Tombol "Lunasi / Cicil" Diklik
// function setBayarCicilan(idInduk, jenis, tahun, sisa, hargaKatalog) {
//     document.getElementById('input-tahun-atribut').value = tahun;
//     document.getElementById('input-jenis-atribut').value = jenis;
//     document.getElementById('edit-id-nota-referensi').value = idInduk; // Kunci relasi
    
//     // Matikan dropdown status, karena ini mode cicilan
//     const statusEl = document.getElementById('input-status-atribut');
//     statusEl.value = 'Lunas'; 
//     statusEl.disabled = true; 

//     // Tampilkan info harga
//     const infoHarga = document.getElementById('info-harga-katalog-teks');
//     document.getElementById('edit-harga-katalog-atribut').value = hargaKatalog;
//     infoHarga.textContent = `Target Pelunasan: Rp ${hargaKatalog.toLocaleString('id-ID')} (Sisa: Rp ${sisa.toLocaleString('id-ID')})`;
//     infoHarga.classList.remove('hidden');
    
//     // Set nominal ke sisa hutang (tapi biarkan bisa diedit jika ternyata mau nyicil lagi, bukan lunas total)
//     const inputNominal = document.getElementById('input-nominal-atribut');
//     inputNominal.value = sisa;
//     inputNominal.readOnly = false;
//     inputNominal.classList.remove('bg-gray-50');
//     inputNominal.focus();
// }

// // 3. Fungsi Auto-Kalkulasi Saat Dropdown Atribut / Status Berubah
// function kalkulasiHargaAtribut() {
//     // Jika sedang mode bayar tunggakan, matikan fungsi auto ini
//     if (document.getElementById('edit-id-nota-referensi').value !== "") return;

//     const tahun = document.getElementById('input-tahun-atribut').value;
//     const jenis = document.getElementById('input-jenis-atribut').value;
//     const status = document.getElementById('input-status-atribut').value;
    
//     const inputNominal = document.getElementById('input-nominal-atribut');
//     const infoHarga = document.getElementById('info-harga-katalog-teks');

//     if (!tahun || !jenis) {
//         inputNominal.value = '';
//         infoHarga.classList.add('hidden');
//         return;
//     }

//     // Cari harga katalog dari database master
//     const master = dbMasterAtribut.find(m => m.tahun === tahun && m.jenis === jenis && !m.isDeleted);
//     const hargaAsli = master ? master.nominal : 0;

//     document.getElementById('edit-harga-katalog-atribut').value = hargaAsli;
//     infoHarga.textContent = `Harga Katalog: Rp ${hargaAsli.toLocaleString('id-ID')}`;
//     infoHarga.classList.remove('hidden');

//     if (status === 'Lunas') {
//         // Terkunci
//         inputNominal.value = hargaAsli;
//         inputNominal.readOnly = true;
//         inputNominal.classList.add('bg-gray-50');
//     } else {
//         // Mode Hutang (Bisa di-edit nominal awalnya)
//         inputNominal.value = '';
//         inputNominal.readOnly = false;
//         inputNominal.classList.remove('bg-gray-50');
//         inputNominal.focus();
//     }
// }

// ==========================================
// BATCH 2 & 3: SMART DEBT PICKER ATRIBUT
// ==========================================

// 1. Fungsi Cek NIS dan Deteksi Tunggakan
function cekSiswaDanTunggakan(nis, skipKalkulasi = false) {
    if (!nis) nis = document.getElementById('input-nis-atribut').value.trim();
    
    const siswa = dbSiswa.find(s => String(s.nis).trim() === nis);
    const elNama = document.getElementById('info-nama-siswa-atribut');
    const alertBox = document.getElementById('alert-tunggakan-atribut');
    const listTunggakan = document.getElementById('list-tunggakan-atribut');
    
    // Elemen tambahan untuk Smart Debt Picker
    const jenisDipilih = document.getElementById('input-jenis-atribut').value;
    const btnSubmit = document.getElementById('btn-submit-atribut');
    const inputNominal = document.getElementById('input-nominal-atribut');

    // Reset Form Tersembunyi saat pengecekan awal
    document.getElementById('edit-id-nota-referensi').value = "";
    document.getElementById('input-status-atribut').disabled = false;
    
    // Buka kunci form standar
    if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.classList.remove('opacity-50');
    }
    
    // Panggil kalkulasi nominal (kirim parameter true agar tidak looping bolak-balik)
    if (!skipKalkulasi && typeof kalkulasiHargaAtribut === "function") {
        kalkulasiHargaAtribut(true); 
    }
    
    if (siswa) {
        elNama.innerHTML = `<i class="ph ph-user-circle mr-1 text-lg"></i> ${siswa.nama} (${siswa.kelas})`;
        elNama.classList.remove('hidden', 'text-red-600');
        elNama.classList.add('text-indigo-600');
        
        // Simpan nama & LP ke hidden input
        document.getElementById('edit-nama-atribut').value = siswa.nama;
        document.getElementById('edit-lp-atribut').value = siswa.lp;
    } else {
        elNama.innerHTML = '<i class="ph ph-x-circle mr-1 text-lg"></i> Siswa tidak ditemukan';
        elNama.classList.remove('hidden', 'text-indigo-600');
        elNama.classList.add('text-red-600');
        alertBox.classList.add('hidden');
        return;
    }

    // --- DETEKTIF TUNGGAKAN ---
    const transaksiSiswa = dbPemasukanAtribut.filter(t => String(t.nis).trim() === nis && !t.isDeleted);
    let tunggakanHTML = '';
    let adaTunggakanItemSama = false; // Penanda untuk mengunci form

    // Ambil transaksi pertama (induk). Mendukung 'idRef' atau 'id_nota_referensi'
    const transaksiInduk = transaksiSiswa.filter(t => !t.idRef && !t.id_nota_referensi);

    transaksiInduk.forEach(induk => {
        let totalBayar = Number(induk.nominal) || 0;
        
        // Cari semua uang cicilan
        const cicilan = transaksiSiswa.filter(t => t.idRef === induk.id || t.id_nota_referensi === induk.id);
        cicilan.forEach(c => totalBayar += (Number(c.nominal) || 0));

        // Mendukung penulisan hargaKatalog atau harga_katalog di database
        const hargaAsli = Number(induk.hargaKatalog) || Number(induk.harga_katalog) || 0;
        const sisaHutang = hargaAsli - totalBayar;

        if (sisaHutang > 0) {
            // Cek apakah tunggakan ini SAMA dengan item yang sedang ingin dibeli kasir!
            if (jenisDipilih && induk.jenis === jenisDipilih) {
                adaTunggakanItemSama = true;
            }

            tunggakanHTML += `
            <div class="flex justify-between items-center bg-white p-2 rounded border border-yellow-200 mt-1.5 shadow-sm">
                <span class="font-medium text-gray-800">${induk.jenis} <span class="text-xs text-gray-500">(${induk.tahun})</span><br><span class="text-xs text-red-600 font-bold">Sisa: Rp ${sisaHutang.toLocaleString('id-ID')}</span></span>
                <button type="button" onclick="setBayarCicilan('${induk.id}', '${induk.jenis}', '${induk.tahun}', ${sisaHutang}, ${hargaAsli})" class="bg-yellow-100 hover:bg-yellow-300 text-yellow-800 px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm">Lunasi Ini</button>
            </div>`;
        }
    });

    if (tunggakanHTML !== '') {
        // --- LOGIKA SMART DEBT PICKER (PENGUNCI FORM) ---
        if (adaTunggakanItemSama) {
            // Kunci input nominal
            if (inputNominal) {
                inputNominal.value = '';
                inputNominal.readOnly = true;
                inputNominal.classList.add('bg-gray-200');
            }
            // Kunci tombol simpan
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.classList.add('opacity-50');
            }

            // Suntikkan tombol "+ Beli Baru"
            tunggakanHTML += `
            <div class="mt-3 pt-3 border-t border-yellow-300 w-full">
                <button type="button" onclick="pilihBeliBaruAtribut()" class="w-full bg-white border border-yellow-400 text-yellow-700 hover:bg-yellow-100 text-xs font-bold py-2 px-3 rounded shadow-sm transition-colors uppercase tracking-wider">
                    + Abaikan & Beli ${jenisDipilih} Baru
                </button>
            </div>`;
        }

        listTunggakan.innerHTML = tunggakanHTML;
        alertBox.classList.remove('hidden');
    } else {
        alertBox.classList.add('hidden');
        listTunggakan.innerHTML = '';
    }
}

// 2. Fungsi Eksekusi Saat Tombol "Lunasi Ini" Diklik
function setBayarCicilan(idInduk, jenis, tahun, sisa, hargaKatalog) {
    document.getElementById('input-tahun-atribut').value = tahun;
    document.getElementById('input-jenis-atribut').value = jenis;
    document.getElementById('edit-id-nota-referensi').value = idInduk; // Kunci relasi (Induk & Anak)
    
    // Matikan dropdown status
    const statusEl = document.getElementById('input-status-atribut');
    statusEl.value = 'Lunas'; 
    statusEl.disabled = true; 

    // Tampilkan info harga
    const infoHarga = document.getElementById('info-harga-katalog-teks');
    document.getElementById('edit-harga-katalog-atribut').value = hargaKatalog;
    infoHarga.textContent = `Target Pelunasan: Rp ${hargaKatalog.toLocaleString('id-ID')} (Sisa: Rp ${sisa.toLocaleString('id-ID')})`;
    infoHarga.classList.remove('hidden');
    
    // BUKA KUNCI Nominal & Tombol Simpan
    const inputNominal = document.getElementById('input-nominal-atribut');
    inputNominal.value = sisa;
    inputNominal.readOnly = false;
    inputNominal.classList.remove('bg-gray-50', 'bg-gray-200');
    inputNominal.focus();

    const btnSubmit = document.getElementById('btn-submit-atribut');
    if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.classList.remove('opacity-50');
    }

    // Sembunyikan Alert agar kasir fokus simpan
    document.getElementById('alert-tunggakan-atribut').classList.add('hidden');
}

// 3. Fungsi Auto-Kalkulasi Saat Dropdown Atribut / Status Berubah
function kalkulasiHargaAtribut(skipCekTunggakan = false) {
    // Jika sedang mode bayar tunggakan, matikan fungsi auto ini
    if (document.getElementById('edit-id-nota-referensi').value !== "") return;

    const tahun = document.getElementById('input-tahun-atribut').value;
    const jenis = document.getElementById('input-jenis-atribut').value;
    const status = document.getElementById('input-status-atribut').value;
    
    const inputNominal = document.getElementById('input-nominal-atribut');
    const infoHarga = document.getElementById('info-harga-katalog-teks');

    if (!tahun || !jenis) {
        inputNominal.value = '';
        infoHarga.classList.add('hidden');
        return;
    }

    // Cari harga katalog dari database master
    const master = dbMasterAtribut.find(m => m.tahun === tahun && m.jenis === jenis && !m.isDeleted);
    const hargaAsli = master ? Number(master.nominal) : 0;

    document.getElementById('edit-harga-katalog-atribut').value = hargaAsli;
    infoHarga.textContent = `Harga Katalog: Rp ${hargaAsli.toLocaleString('id-ID')}`;
    infoHarga.classList.remove('hidden');

    if (status === 'Lunas') {
        inputNominal.value = hargaAsli;
        inputNominal.readOnly = true;
        inputNominal.classList.add('bg-gray-50');
    } else {
        inputNominal.value = '';
        inputNominal.readOnly = false;
        inputNominal.classList.remove('bg-gray-50');
    }

    // MEMBUAT PENGUNCI FORM REAKTIF TERHADAP DROPDOWN JENIS
    if (!skipCekTunggakan) {
        const nis = document.getElementById('input-nis-atribut').value;
        if (nis) {
            cekSiswaDanTunggakan(nis, true); 
        }
    }
}

// 4. (BARU) Fungsi Eksekusi Saat Tombol "+ Beli Baru" Diklik
function pilihBeliBaruAtribut() {
    // 1. Kosongkan ID Referensi agar sistem membacanya sebagai Transaksi Induk Baru
    document.getElementById('edit-id-nota-referensi').value = "";
    
    // 2. Panggil kalkulasi untuk mengembalikan harga ke nominal normal
    kalkulasiHargaAtribut(true);
    
    // 3. Buka kunci form
    const inputNominal = document.getElementById('input-nominal-atribut');
    if (inputNominal) {
        inputNominal.readOnly = false;
        inputNominal.classList.remove('bg-gray-200');
        inputNominal.focus();
    }

    const btnSubmit = document.getElementById('btn-submit-atribut');
    if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.classList.remove('opacity-50');
    }

    // 4. Sembunyikan Alert
    document.getElementById('alert-tunggakan-atribut').classList.add('hidden');
}

// ==========================================
// PENDETEKSI TARIF & HUTANG SPP
// ==========================================
function cekTarifDanTunggakan() {
    const nis = document.getElementById('input-nis').value.trim();
    const jenis = document.getElementById('input-jenis').value;
    const tahun = document.getElementById('input-tahun').value;
    
    const alertBox = document.getElementById('alert-tunggakan-pemasukan');
    const infoTarifBox = document.getElementById('info-harga-tarif-teks');
    const btnSubmit = document.getElementById('btn-submit-pemasukan');
    const inputNominal = document.getElementById('input-nominal');
    const idRefField = document.getElementById('edit-id-nota-referensi-pemasukan');
    const tarifField = document.getElementById('edit-harga-tarif-pemasukan');

    // Reset Visual Awal
    alertBox.classList.add('hidden'); alertBox.className = 'hidden bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-lg text-sm mb-4';
    infoTarifBox.classList.add('hidden'); idRefField.value = ''; tarifField.value = 0;
    btnSubmit.disabled = false; btnSubmit.classList.remove('opacity-50');

    if (!nis || !jenis || !tahun) return;

    // 👇 INI BARIS YANG SEBELUMNYA HILANG
    const siswa = dbSiswa.find(s => String(s.nis).trim() === nis); 
    if (!siswa) return;
    
    // 1. Cari Tarif dari Master Tarif (Smart Prefix / Rumpun Kelas)
    const namaKelasSiswa = String(siswa.kelas).trim().toUpperCase(); // misal: "X E1"
    const jenisDipilih = String(jenis).trim().toUpperCase();

    // 1. Cari Tarif dari Master Tarif (Prioritas: NIS Khusus -> Kelas -> SEMUA KELAS)
    let tarifObj = dbMasterTarif.find(t => {
        // Harus tahun dan jenis yang sama
        if (t.tahun !== tahun) return false;
        if (String(t.jenis).trim().toUpperCase() !== jenisDipilih) return false;
        
        const targetVal = String(t.target).trim().toUpperCase();
        
        // Aturan 1: Berlaku untuk semua
        if (targetVal === 'SEMUA KELAS') return true;
        
        // Aturan 2: Berlaku untuk siswa tertentu
        if (targetVal === `NIS ${nis}`) return true;
        
        // Aturan 3: Kelas persis sama (misal: "X E1" == "X E1")
        if (targetVal === namaKelasSiswa) return true;
        
        // Aturan 4: Rumpun Kelas (Target "X" mencakup "X E1", tapi mengabaikan "XI")
        if (namaKelasSiswa.startsWith(targetVal + ' ')) return true;
        
        return false;
    });

    if (tarifObj) {
        const hargaTarif = parseInt(tarifObj.nominal) || 0;
        tarifField.value = hargaTarif;
        infoTarifBox.innerHTML = `Tarif: <b>Rp ${formatRp(hargaTarif)}</b>`;
        infoTarifBox.classList.remove('hidden');

        // 2. Cari apakah sudah pernah dicicil sebelumnya
        const riwayat = dbPembayaran.filter(t => String(t.nis).trim() === nis && t.jenis === jenis && t.tahun === tahun && !t.isDeleted);
        const totalTerbayar = riwayat.reduce((sum, t) => sum + parseInt(t.nominal), 0);

        if (totalTerbayar > 0) {
            const sisa = hargaTarif - totalTerbayar;
            if (sisa > 0) {
                alertBox.innerHTML = `Siswa ini memiliki sisa tunggakan <b>Rp ${formatRp(sisa)}</b> untuk ${jenis}.`;
                alertBox.classList.remove('hidden');
                idRefField.value = riwayat[0].id_ref || riwayat[0].idRef || riwayat[0].id; // Sambungkan ke nota awal
                inputNominal.value = sisa; // Rekomendasikan lunas sisa
            } else {
                alertBox.innerHTML = `Tagihan ${jenis} tahun ${tahun} <b>SUDAH LUNAS</b>.`;
                alertBox.className = 'bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-sm mb-4';
                inputNominal.value = 0;
                btnSubmit.disabled = true;
                btnSubmit.classList.add('opacity-50'); // Kunci tombol
            }
        } else {
            inputNominal.value = hargaTarif; // Default langsung lunas
        }
        evaluasiStatusPemasukan();
    }
}

function evaluasiStatusPemasukan() {
    const nominal = parseInt(document.getElementById('input-nominal').value) || 0;
    const hargaTarif = parseInt(document.getElementById('edit-harga-tarif-pemasukan').value) || 0;
    const isCicilan = !!document.getElementById('edit-id-nota-referensi-pemasukan').value;
    const statusDrop = document.getElementById('input-status-pemasukan');
    console.log("Nominal diketik:", nominal, "| Harga Tarif:", hargaTarif);
    
    if (hargaTarif > 0 && (nominal < hargaTarif || isCicilan)) {
        statusDrop.value = 'Hutang'; statusDrop.className = "w-full px-3 py-2 border border-orange-300 bg-orange-50 text-orange-700 rounded-lg font-bold";
    } else {
        statusDrop.value = 'Lunas'; statusDrop.className = "w-full px-3 py-2 border border-green-300 bg-green-50 text-green-700 rounded-lg font-bold";
    }
}

// Inisialisasi Script Tahun PPDB
const startYear = 2026;
const currentYear = new Date().getFullYear();
let formYear;
const month = new Date().getMonth();
if (month < 6) formYear = currentYear; else formYear = currentYear + 1;
const endYear = currentYear + 1;
document.getElementById("tahun-ppdb").textContent = `${startYear}/${endYear}`;