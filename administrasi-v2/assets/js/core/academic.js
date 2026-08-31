function isTarifTargetMatch(targetString, taTarif, siswaProfile) {
	let target = String(targetString).toUpperCase().trim();
	let sNis = String(siswaProfile.nis).trim();
	let sLp = String(siswaProfile.lp).toUpperCase().trim();

	if (target === 'SEMUA KELAS') return true;
	if (target === `NIS ${sNis}`) return true;

	let sKelasHistoris = getHistoricalClass(siswaProfile, taTarif).toUpperCase();
	if (sKelasHistoris === "") return false;

	let sGrade = sKelasHistoris.split(' ')[0];
	let targetGender = null;
	let cleanTarget = target;

	if (target.includes('(L)')) {
		targetGender = 'L';
		cleanTarget = target.replace('(L)', '').trim();
	} else if (target.includes('(P)')) {
		targetGender = 'P';
		cleanTarget = target.replace('(P)', '').trim();
	} else if (target.endsWith(' L')) {
		targetGender = 'L';
		cleanTarget = target.replace(/ L$/, '').trim();
	} else if (target.endsWith(' P')) {
		targetGender = 'P';
		cleanTarget = target.replace(/ P$/, '').trim();
	}

	if (targetGender && targetGender !== sLp) return false;
	if (cleanTarget === sKelasHistoris) return true;
	if (cleanTarget === sGrade) return true;

	return false;
}

function getHistoricalClass(siswaProfile, taTarget) {
	let tMasuk = parseInt(String(siswaProfile.tahunMasuk).split('/')[0]) || 0;
	let tTarif = parseInt(String(taTarget).split('/')[0]) || 0;
	if (tTarif < tMasuk) return "";
	let diff = tTarif - tMasuk + 1;

	if (diff === 1) return String(siswaProfile.kelas1).trim();
	if (diff === 2) return String(siswaProfile.kelas2).trim();
	if (diff === 3) return String(siswaProfile.kelas3).trim();

	return String(siswaProfile.kelas).trim();
}

function calculateSiswaBilling(siswaProfile, tarifList, bayarList) {
	let thnMasukInt = parseInt(String(siswaProfile.tahunMasuk).split('/')[0]) || 0;
	let rawApplicableTarifs = tarifList.filter(t => !t.isDeleted && isTarifTargetMatch(t.target, t.tahun, siswaProfile));

	let uniqueTarifsMap = {};
	rawApplicableTarifs.forEach(t => {
		let key = `${t.tahun}-${t.jenis}`;
		let isNisTarget = String(t.target).toUpperCase().includes('NIS');
		if (!uniqueTarifsMap[key] || isNisTarget) uniqueTarifsMap[key] = t;
	});
	let applicableTarifs = Object.values(uniqueTarifsMap);

	const blnArr = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];

	let finalTarifs = [];
	applicableTarifs.forEach(t => {
		let thnTarifInt = parseInt(String(t.tahun).split('/')[0]) || 0;
		let isSPP = String(t.jenis).toUpperCase().includes('SPP');
		let activeBulanMulai = 'Juli';
		if (thnTarifInt === thnMasukInt && siswaProfile.bulanMulai) {
			activeBulanMulai = siswaProfile.bulanMulai;
		}

		if (isSPP) {
			let monthOfSPP = blnArr.find(b => String(t.jenis).toUpperCase().includes(b.toUpperCase()));
			if (monthOfSPP) {
				let startIndex = blnArr.findIndex(b => b.toLowerCase() === activeBulanMulai.toLowerCase());
				if (startIndex === -1) startIndex = 0;
				let sppIndex = blnArr.findIndex(b => b === monthOfSPP);
				if (sppIndex >= startIndex) finalTarifs.push(t);
			} else finalTarifs.push(t);
		} else finalTarifs.push(t);
	});

	let bulanan = [],
		lainnya = [],
		trueGlobalDebt = 0,
		rawSisaList = [];

	// 1. Kalkulasi Tagihan Master (SPP & Uang Gedung, dll)
	finalTarifs.forEach(t => {
		let bayarItem = bayarList.filter(b => !b.isDeleted && b.jenis === t.jenis && b.tahun === t.tahun).reduce((sum, b) => sum + parseInt(b.nominal || 0), 0);
		let sisa = parseInt(t.nominal || 0) - bayarItem;
		let status = sisa <= 0 ? 'LUNAS' : sisa;

		if (sisa > 0) {
			trueGlobalDebt += sisa;
			rawSisaList.push({
				jenis: t.jenis,
				sisa: sisa,
				tahun: t.tahun,
				nominalAwal: t.nominal
			});
		}

		if (String(t.jenis).toUpperCase().includes('SPP')) bulanan.push({
			jenis: t.jenis,
			tahun: t.tahun,
			sisa: status,
			nominalAwal: t.nominal
		});
		else lainnya.push({
			jenis: t.jenis,
			tahun: t.tahun,
			sisa: status,
			nominalAwal: t.nominal
		});
	});

	// ==========================================
	// 🛡️ FITUR BARU: INJEKSI HUTANG ATRIBUT
	// ==========================================
	if (typeof dbPemasukanAtribut !== 'undefined') {
		const transaksiAtribut = dbPemasukanAtribut.filter(t => String(t.nis).trim() === String(siswaProfile.nis).trim() && !t.isDeleted);
		const atributInduk = transaksiAtribut.filter(t => !t.idRef && !t.id_nota_referensi);

		atributInduk.forEach(induk => {
			let totalBayarAtribut = Number(induk.nominal) || 0;
			const cicilanAtribut = transaksiAtribut.filter(t => t.idRef === induk.id || t.id_nota_referensi === induk.id);
			cicilanAtribut.forEach(c => totalBayarAtribut += (Number(c.nominal) || 0));

			const hargaAsli = Number(induk.hargaKatalog) || Number(induk.harga_katalog) || 0;
			const sisaAtribut = hargaAsli - totalBayarAtribut;

			if (sisaAtribut > 0) {
				// Jika masih menunggak:
				trueGlobalDebt += sisaAtribut;
				rawSisaList.push({
					jenis: `Atribut: ${induk.jenis}`,
					sisa: sisaAtribut,
					tahun: induk.tahun,
					nominalAwal: hargaAsli
				});
				lainnya.push({
					jenis: `Atribut: ${induk.jenis}`,
					tahun: induk.tahun,
					sisa: sisaAtribut,
					nominalAwal: hargaAsli
				});
			} else {
				// Jika LUNAS, tetap tampilkan sebagai transparansi agar wali murid lega
				lainnya.push({
					jenis: `Atribut: ${induk.jenis}`,
					tahun: induk.tahun,
					sisa: 'LUNAS',
					nominalAwal: hargaAsli
				});
			}
		});
	}
	// ==========================================

	bulanan.sort((a, b) => {
		let mA = blnArr.findIndex(m => String(a.jenis).toUpperCase().includes(m.toUpperCase()));
		let mB = blnArr.findIndex(m => String(b.jenis).toUpperCase().includes(m.toUpperCase()));
		return mA - mB;
	});

	let currentMonth = new Date().getMonth();
	let examName = "",
		maxSppIndex = 0,
		excludeKeywords = [];

	if (currentMonth >= 6 && currentMonth <= 9) {
		examName = "PTS 1 (Semester Ganjil)";
		maxSppIndex = 3;
		excludeKeywords = ['PAS 1', 'PTS 2', 'PAS 2'];
	} else if (currentMonth >= 10 && currentMonth <= 11) {
		examName = "PAS 1 (Semester Ganjil)";
		maxSppIndex = 5;
		excludeKeywords = ['PTS 2', 'PAS 2'];
	} else if (currentMonth >= 0 && currentMonth <= 2) {
		examName = "PTS 2 (Semester Genap)";
		maxSppIndex = 8;
		excludeKeywords = ['PAS 2'];
	} else {
		examName = "PAS 2 / Kenaikan Kelas";
		maxSppIndex = 11;
		excludeKeywords = [];
	}

	let examReqAmount = 0;

	// Perbaikan: Gabungkan daftar tahun dari Tarif dan Atribut agar dropdown filter tahun tidak terlewat
	let allYearsMerged = [...finalTarifs.map(r => r.tahun), ...lainnya.map(l => l.tahun)];
	let thnAjaranArr = [...new Set(allYearsMerged)].sort().reverse();
	let activeThnAjaran = thnAjaranArr.length > 0 ? thnAjaranArr[0] : "2025/2026";

	rawSisaList.filter(r => r.tahun === activeThnAjaran).forEach(r => {
		let isSPP = String(r.jenis).toUpperCase().includes('SPP');
		if (isSPP) {
			let m = blnArr.find(b => String(r.jenis).toUpperCase().includes(b.toUpperCase()));
			let sppIndex = blnArr.findIndex(b => b === m);
			if (sppIndex <= maxSppIndex) examReqAmount += r.sisa;
		} else {
			let shouldInclude = true;
			excludeKeywords.forEach(kw => {
				if (String(r.jenis).toUpperCase().includes(kw)) shouldInclude = false;
			});
			if (shouldInclude) examReqAmount += r.sisa;
		}
	});

	return {
		bulanan: bulanan,
		lainnya: lainnya,
		totalTunggakan: trueGlobalDebt,
		examWidget: {
			name: examName,
			amount: examReqAmount,
			isLunas: examReqAmount === 0
		},
		riwayatTahun: thnAjaranArr,
		hutangLamaMurni: rawSisaList.filter(r => r.tahun !== activeThnAjaran).reduce((sum, r) => sum + r.sisa, 0)
	};
}

async function simpanTahunAjaranAktif(event) {
	// 1. Cegah form merefresh halaman
	if (event) event.preventDefault();

	// 2. Ambil nilai dari dropdown
	const tahunDipilih = document.getElementById('setting-tahun-ajaran').value;

	if (!tahunDipilih) {
		if (typeof tampilkanModalNotif === 'function') {
			tampilkanModalNotif('Peringatan', 'Silakan pilih Tahun Ajaran terlebih dahulu!', 'warning');
		} else {
			showToast('Silakan pilih Tahun Ajaran terlebih dahulu!');
		}
		return;
	}

	// 3. Efek Loading pada Tombol
	const btn = document.getElementById('btn-submit-pengaturan');
	const originalText = btn.innerHTML;
	btn.disabled = true;
	btn.innerHTML = `<i class="ph ph-spinner animate-spin mr-2 text-lg"></i> Menyimpan...`;

	try {
		// 4. Update data ke tabel 'pengaturan' di Supabase
		const {
			error
		} = await supabaseClient
			.from('pengaturan')
			.update({
				nilai: tahunDipilih,
				updated_at: new Date().toISOString()
			})
			.eq('kunci', 'tahun_ajaran_aktif');

		if (error) throw error;

		// 5. Update UI dan Variabel Global jika sukses
		globalTahunAktif = tahunDipilih;

		// Update label status di atas form
		const labelStatus = document.getElementById('label-tahun-aktif-sekarang');
		if (labelStatus) labelStatus.innerText = tahunDipilih;

		if (typeof tampilkanModalNotif === 'function') {
			tampilkanModalNotif('Berhasil!', `Sistem kini menggunakan Tahun Ajaran ${tahunDipilih} sebagai tahun aktif.`, 'success');
			setTimeout(() => tutupModalNotif(), 2000);
		} else {
			showToast(`Berhasil! Tahun ajaran aktif diubah ke ${tahunDipilih}`);
		}

		// 💡 OPSIONAL: Panggil fungsi untuk me-refresh data tabel yang sedang terbuka 
		// (Misal: loadTabelPemasukan() atau initDashboard() agar langsung memfilter data berdasarkan tahun baru)

	} catch (error) {
		console.error("Gagal menyimpan pengaturan:", error);
		if (typeof tampilkanModalNotif === 'function') {
			tampilkanModalNotif('Gagal', 'Terjadi kesalahan sistem saat menyimpan data.', 'error');
		} else {
			showToast('Gagal menyimpan pengaturan.');
		}
	} finally {
		// 6. Kembalikan kondisi tombol
		btn.disabled = false;
		btn.innerHTML = originalText;
	}
}

function setupAcademicEvents() {
  const tahunAjaran = document.getElementById('form-pengaturan');

  if (tahunAjaran) tahunAjaran.addEventListener('submit', simpanTahunAjaranAktif);
}