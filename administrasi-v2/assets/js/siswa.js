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

// --- RENDER VIEW SISWA ---
let currentSiswaData = null;
let currentBillingData = null;

function renderSiswaView(siswaProfile, billingData) {
	currentSiswaData = siswaProfile;
	currentBillingData = billingData;
	document.getElementById('view-login').classList.add('hidden');
	document.getElementById('view-siswa').classList.remove('hidden');
	document.getElementById('siswa-nama').innerText = siswaProfile.nama;
	document.getElementById('siswa-nis-text').innerText = siswaProfile.nis;

	const badgeContainer = document.getElementById('siswa-kelas-badge');
	let kls = String(siswaProfile.kelas).toUpperCase();
	let badgeClass = 'bg-gray-100 text-gray-700 border-gray-200';

	if (kls.includes('X ') || kls === 'X') badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
	else if (kls.includes('XI ') || kls === 'XI') badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
	else if (kls.includes('XII ') || kls === 'XII') badgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
	else if (kls.includes('LULUS') || kls.includes('KELUAR')) badgeClass = 'bg-slate-200 text-slate-700 border-slate-300';
	if (badgeContainer) badgeContainer.innerHTML = `<span class="${badgeClass} border px-2 py-0.5 rounded text-xs font-bold">Kelas: ${siswaProfile.kelas}</span>`;

	const boxKekurangan = document.getElementById('box-kekurangan');
	const titleKekurangan = document.getElementById('title-kekurangan');
	const valKekurangan = document.getElementById('siswa-total-kekurangan');
	const bannerLama = document.getElementById('siswa-banner-tunggakan');

	if (billingData.hutangLamaMurni > 0 && bannerLama) {
		bannerLama.classList.remove('hidden');
		document.getElementById('banner-amount').innerText = formatRp(billingData.hutangLamaMurni);
	} else if (bannerLama) bannerLama.classList.add('hidden');

	if (billingData.totalTunggakan === 0) {
		boxKekurangan.className = "bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center min-w-[200px] w-full";
		titleKekurangan.className = "text-sm text-emerald-600 font-medium mb-1";
		titleKekurangan.innerText = "Status Pembayaran";
		valKekurangan.className = "text-2xl font-bold text-emerald-700";
		valKekurangan.innerText = "LUNAS";
	} else {
		boxKekurangan.className = "bg-red-50 border border-red-100 rounded-lg p-4 text-center min-w-[200px] w-full";
		titleKekurangan.className = "text-sm text-red-600 font-medium mb-1";
		titleKekurangan.innerText = "Total Hutang Berjalan";
		valKekurangan.className = "text-2xl font-bold text-red-700";
		valKekurangan.innerText = formatRp(billingData.totalTunggakan);
	}

	const widgetUjian = document.getElementById('widget-ujian');
	const widgetTitle = document.getElementById('widget-exam-title');
	const widgetAmount = document.getElementById('widget-exam-amount');
	widgetUjian.classList.remove('hidden');
	widgetTitle.innerText = `Syarat ${billingData.examWidget.name}`;
	if (billingData.examWidget.isLunas) {
		widgetUjian.style.background = "linear-gradient(to right, #10b981, #14b8a6)";
		widgetUjian.className = "rounded-xl shadow-md p-6 mb-6 text-white flex flex-col md:flex-row items-center justify-between transform transition-all duration-500 hover:scale-[1.01]";
		widgetAmount.innerText = "MEMENUHI SYARAT";
	} else {
		widgetUjian.style.background = "linear-gradient(to right, #f59e0b, #f97316)";
		widgetUjian.className = "rounded-xl shadow-md p-6 mb-6 text-white flex flex-col md:flex-row items-center justify-between transform transition-all duration-500 hover:scale-[1.01]";
		widgetAmount.innerText = formatRp(billingData.examWidget.amount);
	}

	const selTahun = document.getElementById('siswa-tahun-filter');
	selTahun.innerHTML = '';
	if (billingData.riwayatTahun.length > 0) {
		billingData.riwayatTahun.forEach(t => selTahun.innerHTML += `<option value="${t}">${t}</option>`);
	} else {
		selTahun.innerHTML = `<option value="All">Belum Ada Tagihan</option>`;
	}

	renderSiswaTables(billingData.riwayatTahun[0] || 'All');
}

function renderSiswaTables(targetTahun) {
	const formatCell = (val) => (val === 'LUNAS' || val === 0) ? `<span class="px-3 py-1 text-xs rounded-full font-bold bg-emerald-100 text-emerald-700 tracking-wide"><i class="ph ph-check mr-1"></i> LUNAS</span>` : `<span class="px-3 py-1 text-xs rounded-full font-bold bg-red-100 text-red-700">${formatRp(val)}</span>`;
	document.getElementById('lbl-thn-spp').innerText = `(${targetTahun})`;

	const tbodyBulan = document.getElementById('table-rekap-bulanan');
	tbodyBulan.innerHTML = '';
	let filteredBulanan = currentBillingData.bulanan.filter(b => b.tahun === targetTahun);
	if (filteredBulanan.length === 0) tbodyBulan.innerHTML = '<tr><td colspan="2" class="p-4 text-center text-gray-500">Bebas Tagihan SPP pada tahun ini</td></tr>';
	filteredBulanan.forEach(item => {
		tbodyBulan.innerHTML += `<tr class="hover:bg-gray-50"><td class="p-4 font-medium text-gray-700">${item.jenis}</td><td class="p-4 text-center">${formatCell(item.sisa)}</td></tr>`;
	});

	const tbodyTagihan = document.getElementById('table-rekap-tagihan');
	tbodyTagihan.innerHTML = '';
	let filteredLainnya = currentBillingData.lainnya.filter(l => l.tahun === targetTahun);
	if (filteredLainnya.length === 0) tbodyTagihan.innerHTML = '<tr><td colspan="2" class="p-4 text-center text-gray-500">Belum ada tagihan lainnya</td></tr>';
	filteredLainnya.forEach(item => {
		tbodyTagihan.innerHTML += `<tr class="hover:bg-gray-50"><td class="p-4 font-bold text-gray-700">${item.jenis}</td><td class="p-4 font-medium text-right">${formatCell(item.sisa)}</td></tr>`;
	});
}

function refreshDataSiswa(isFilter = false) {
	if (isFilter) {
		renderSiswaTables(document.getElementById('siswa-tahun-filter').value);
		return;
	}
	const rawText = document.getElementById('siswa-nis-kelas').innerText;
	const nis = rawText.split('|')[0].replace('NIS:', '').trim();
	if (!nis || nis === '-') return;
	showLoading("Sinkronisasi...");
	setTimeout(() => {
		hideLoading();
		const s = dbSiswa.find(s => String(s.nis).trim() === nis);
		if (s) {
			let riwayat = dbPembayaran.filter(p => !p.isDeleted && String(p.nis).trim() === nis);
			let billing = calculateSiswaBilling(s, dbMasterTarif, riwayat);
			renderSiswaView(s, billing);
			showToast('Data disinkronisasi (Preview)!');
		}
	}, 600);
}

function startStudentRefreshCooldown() {
	const btn = document.getElementById('btn-refresh-siswa');
	const textSpan = document.getElementById('text-refresh-siswa');
	const icon = btn.querySelector('i');
	btn.disabled = true;
	btn.classList.add('opacity-50', 'cursor-not-allowed');
	icon.classList.remove('animate-spin');
	let timeLeft = 300;
	refreshCountdownInterval = setInterval(() => {
		timeLeft--;
		if (timeLeft <= 0) {
			clearInterval(refreshCountdownInterval);
			btn.disabled = false;
			btn.classList.remove('opacity-50', 'cursor-not-allowed');
			textSpan.innerText = "Perbarui Data";
		} else {
			const m = Math.floor(timeLeft / 60);
			const s = timeLeft % 60;
			textSpan.innerText = `Tunggu (${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')})`;
		}
	}, 1000);
}

async function refreshButtonDataSiswa() {
	const rawText = document.getElementById('siswa-nis-text').innerText;
	const nis = rawText.includes('|') ? rawText.split('|')[0].replace('NIS:', '').trim() : rawText.trim();
	if (!nis || nis === '-') return;
	showLoading("Memperbarui data Anda...");
	document.getElementById('btn-refresh-siswa').querySelector('i').classList.add('animate-spin');
	const isSuccess = await loadDataFromSupabase();
	hideLoading();
	if (isSuccess) {
		const s = dbSiswa.find(s => String(s.nis).trim() === nis);
		if (s) {
			let riwayat = dbPembayaran.filter(p => !p.isDeleted && String(p.nis).trim() === nis);
			let billing = calculateSiswaBilling(s, dbMasterTarif, riwayat);
			renderSiswaView(s, billing);
			showToast('Data diperbarui!', 'success');
			startStudentRefreshCooldown();
		}
	} else {
		showToast('Gagal sinkron', 'error');
		document.getElementById('btn-refresh-siswa').querySelector('i').classList.remove('animate-spin');
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