function setLaporanTab(tabName) {
	const btnRekap = document.getElementById('tab-laporan-rekap');
	const btnSurat = document.getElementById('tab-laporan-surat');
	const btnOps = document.getElementById('tab-laporan-operasional');
	const btnNonOps = document.getElementById('tab-laporan-nonops');
	const btnBukuBesar = document.getElementById('tab-laporan-bukubesar');

	const contentRekap = document.getElementById('laporan-content-rekap');
	const contentSurat = document.getElementById('laporan-content-surat');
	const contentOps = document.getElementById('laporan-content-operasional');
	const contentNonOps = document.getElementById('laporan-content-nonops');
	const contentBukuBesar = document.getElementById('laporan-content-bukubesar');

	// Desain class untuk tombol Aktif dan Tidak Aktif
	const classAktif = "pb-3 text-sm font-bold border-b-2 border-emerald-600 text-emerald-600 transition-colors";
	const classNonAktif = "pb-3 text-sm font-bold border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors";

	// Set semua tombol jadi NonAktif dan semua konten jadi hidden dulu
	const allBtns = [btnRekap, btnSurat, btnOps, btnNonOps, btnBukuBesar];
	const allContents = [contentRekap, contentSurat, contentOps, contentNonOps, contentBukuBesar];

	allBtns.forEach(btn => btn && (btn.className = classNonAktif));
	allContents.forEach(content => {
		if (content) {
			content.classList.add('hidden');
			content.classList.remove('flex');
		}
	});

	// Aktifkan yang dipilih
	const activeBtn = document.getElementById(`tab-laporan-${tabName}`);
	const activeContent = document.getElementById(`laporan-content-${tabName}`);

	if (activeBtn) activeBtn.className = classAktif;
	if (activeContent) {
		activeContent.classList.remove('hidden');
		activeContent.classList.add('flex');
	}
}

function generateLaporanCetak() {
	const ta = document.getElementById('cetak-tahun').value;
	const kls = document.getElementById('cetak-kelas').value;
	if (!ta || !kls) {
		showToast('Pilih Tahun Ajaran dan Kelas dulu!', 'error');
		return;
	}

	document.getElementById('cetak-result-container').classList.remove('hidden');
	document.getElementById('cetak-result-container').classList.add('flex');
	document.getElementById('cap-subtitle').innerText = `KELAS: ${kls} | TAHUN AJARAN: ${ta}`;
	document.getElementById('cap-date').innerText = `Dicetak pada: ${getNowDateIndo()}`;

	let listSiswa = dbSiswa.filter(s => {
		let histClass = getHistoricalClass(s, ta).toUpperCase();
		return histClass === String(kls).toUpperCase();
	}).sort((a, b) => a.nama.localeCompare(b.nama));

	let applicableTarifsToClass = dbMasterTarif.filter(t => {
		if (t.isDeleted || t.tahun !== ta) return false;
		let dummyL = {
			nis: 'DUMMY',
			lp: 'L',
			tahunMasuk: ta,
			kelas1: kls
		};
		let dummyP = {
			nis: 'DUMMY',
			lp: 'P',
			tahunMasuk: ta,
			kelas1: kls
		};
		return isTarifTargetMatch(t.target, ta, dummyL) || isTarifTargetMatch(t.target, ta, dummyP) || String(t.target).includes('NIS');
	});

	let setTagihanUnik = new Set();
	applicableTarifsToClass.forEach(t => setTagihanUnik.add(t.jenis));
	let headerTagihan = Array.from(setTagihanUnik);

	if (listSiswa.length === 0) {
		document.getElementById('cap-table-container').innerHTML = `<p class="text-center text-red-500 py-10">Tidak ada data siswa aktif di kelas ${kls} pada tahun ajaran ${ta}.</p>`;
		return;
	}

	// --- FITUR BARU: TAMBAH HEADER KOLOM ATRIBUT ---
	let htmlTable = `<table class="table-rekap"><thead style="vertical-align: middle;"><tr><th>No</th><th>NIS</th><th>Nama Siswa</th>`;
	headerTagihan.forEach(th => htmlTable += `<th>${th}</th>`);
	htmlTable += `<th class="text-orange-600 bg-orange-50">Hutang Atribut</th><th class="text-red-600 bg-red-50">Tunggakan Th. Lalu</th><th>TOTAL KEKURANGAN</th></tr></thead><tbody>`;

	let riwayatThnIni = dbPembayaran.filter(p => !p.isDeleted && p.tahun === ta);

	listSiswa.forEach((siswa, idx) => {
		htmlTable += `<tr><td class="text-center">${idx + 1}</td><td class="text-center">${siswa.nis}</td><td>${siswa.nama}</td>`;
		let riwayatSiswa = riwayatThnIni.filter(p => String(p.nis).trim() === String(siswa.nis).trim());
		let totalTunggakSiswa = 0;

		// 1. Loop SPP / Tagihan Utama
		headerTagihan.forEach(tagihan => {
			let matchedTarifs = applicableTarifsToClass.filter(t => t.jenis === tagihan && isTarifTargetMatch(t.target, ta, siswa));
			let tarifItem = null;
			if (matchedTarifs.length > 0) tarifItem = matchedTarifs.find(t => String(t.target).toUpperCase().includes('NIS')) || matchedTarifs[0];

			if (!tarifItem) {
				htmlTable += `<td class="text-center text-gray-400">-</td>`;
			} else {
				let isSPP = String(tagihan).toUpperCase().includes('SPP');
				let skipSPP = false;
				if (isSPP) {
					const blnArr = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
					let thnMasukInt = parseInt(String(siswa.tahunMasuk).split('/')[0]) || 0;
					let thnTarifInt = parseInt(ta.split('/')[0]) || 0;
					let activeBulanMulai = 'Juli';
					if (thnTarifInt === thnMasukInt && siswa.bulanMulai) activeBulanMulai = siswa.bulanMulai;

					let startIndex = blnArr.findIndex(b => b.toLowerCase() === activeBulanMulai.toLowerCase());
					if (startIndex === -1) startIndex = 0;
					let monthOfSPP = blnArr.find(b => String(tagihan).toUpperCase().includes(b.toUpperCase()));
					if (monthOfSPP) {
						let sppIndex = blnArr.findIndex(b => b === monthOfSPP);
						if (sppIndex < startIndex) skipSPP = true;
					}
				}

				if (skipSPP) {
					htmlTable += `<td class="text-center text-gray-400">-</td>`;
				} else {
					let totalBayarItem = riwayatSiswa.filter(r => r.jenis === tagihan).reduce((sum, r) => sum + parseInt(r.nominal), 0);
					let sisa = parseInt(tarifItem.nominal) - totalBayarItem;
					if (sisa <= 0) {
						htmlTable += `<td class="bg-lunas">LUNAS</td>`;
					} else {
						totalTunggakSiswa += sisa;
						htmlTable += `<td class="text-center font-semibold text-red-600">${formatRp(sisa).replace('Rp', '')}</td>`;
					}
				}
			}
		});

		// ==========================================
		// --- FITUR BARU: KALKULATOR HUTANG ATRIBUT ---
		// ==========================================
		let hutangAtributSiswa = 0;

		// Cari semua transaksi atribut siswa ini
		const transaksiAtribut = typeof dbPemasukanAtribut !== 'undefined' ?
			dbPemasukanAtribut.filter(t => String(t.nis).trim() === String(siswa.nis).trim() && !t.isDeleted) :
			[];

		// Cari nota induk (baik tahun ini maupun tahun lalu, karena atribut dihitung total)
		const atributInduk = transaksiAtribut.filter(t => !t.idRef && !t.id_nota_referensi);

		atributInduk.forEach(induk => {
			let totalBayarAtribut = Number(induk.nominal) || 0;
			// Cari cicilan
			const cicilanAtribut = transaksiAtribut.filter(t => t.idRef === induk.id || t.id_nota_referensi === induk.id);
			cicilanAtribut.forEach(c => totalBayarAtribut += (Number(c.nominal) || 0));

			const hargaAsli = Number(induk.hargaKatalog) || Number(induk.harga_katalog) || 0;
			const sisaAtribut = hargaAsli - totalBayarAtribut;

			if (sisaAtribut > 0) {
				hutangAtributSiswa += sisaAtribut;
			}
		});

		// Cetak kolom atribut di tabel
		if (hutangAtributSiswa > 0) {
			htmlTable += `<td class="text-center font-bold text-orange-600 bg-orange-50">${formatRp(hutangAtributSiswa).replace('Rp', '')}</td>`;
		} else {
			htmlTable += `<td class="text-center text-gray-400">-</td>`;
		}
		// ==========================================

		// 3. Tunggakan Masa Lalu (SPP / Tagihan Lama)
		let thnTargetInt = parseInt(ta.split('/')[0]);
		let tunggakanLama = 0;
		let pastTarifs = dbMasterTarif.filter(t => !t.isDeleted && parseInt(t.tahun.split('/')[0]) < thnTargetInt && isTarifTargetMatch(t.target, t.tahun, siswa));
		let pastPayments = dbPembayaran.filter(p => !p.isDeleted && String(p.nis).trim() === String(siswa.nis).trim() && parseInt(p.tahun.split('/')[0]) < thnTargetInt);

		let uniquePastMap = {};
		pastTarifs.forEach(t => {
			let key = `${t.tahun}-${t.jenis}`;
			let isNisT = String(t.target).toUpperCase().includes('NIS');
			if (!uniquePastMap[key] || isNisT) uniquePastMap[key] = t;
		});

		Object.values(uniquePastMap).forEach(t => {
			let isSkip = false;
			if (String(t.jenis).toUpperCase().includes('SPP')) {
				let tMasuk = parseInt(String(siswa.tahunMasuk).split('/')[0]);
				let tTarif = parseInt(String(t.tahun).split('/')[0]);
				if (tTarif === tMasuk && siswa.bulanMulai) {
					const ba = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
					let si = ba.findIndex(b => b.toLowerCase() === siswa.bulanMulai.toLowerCase());
					if (si === -1) si = 0;
					let ms = ba.find(b => String(t.jenis).toUpperCase().includes(b.toUpperCase()));
					if (ms && ba.findIndex(b => b === ms) < si) isSkip = true;
				}
			}
			if (!isSkip) {
				let byr = pastPayments.filter(p => p.jenis === t.jenis && p.tahun === t.tahun).reduce((sum, p) => sum + parseInt(p.nominal), 0);
				let sisa = parseInt(t.nominal) - byr;
				if (sisa > 0) tunggakanLama += sisa;
			}
		});

		if (tunggakanLama > 0) htmlTable += `<td class="text-center font-bold text-red-600 bg-red-50">${formatRp(tunggakanLama).replace('Rp', '')}</td>`;
		else htmlTable += `<td class="text-center text-gray-400">-</td>`;

		// 4. Grand Total (Digabungkan dengan Hutang Atribut)
		let grandTotal = totalTunggakSiswa + tunggakanLama + hutangAtributSiswa;
		if (grandTotal === 0) htmlTable += `<td class="bg-lunas">LUNAS</td></tr>`;
		else htmlTable += `<td class="text-tunggak">${formatRp(grandTotal)}</td></tr>`;
	});

	htmlTable += `</tbody></table>`;
	document.getElementById('cap-table-container').innerHTML = htmlTable;
}

function downloadLaporanImage() {
	showToast('Memproses Gambar...', 'info');
	const targetDiv = document.getElementById("capture-area");

	if (typeof domtoimage === 'undefined') {
		showToast('Library gagal dimuat.', 'error');
		return;
	}

	const scale = 2;
	const width = targetDiv.scrollWidth;
	const height = targetDiv.scrollHeight;

	domtoimage.toPng(targetDiv, {
		bgcolor: '#ffffff',
		width: width * scale,
		height: height * scale,
		style: {
			transform: `scale(${scale})`,
			transformOrigin: 'top left',
			width: width + 'px',
			height: height + 'px'
		}
	}).then(function(dataUrl) {
		const now = new Date();
		const tanggal = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
		const jam = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0');
		const kelas = document.getElementById('cetak-kelas').value;
		const link = document.createElement("a");
		link.download = `${tanggal}_${jam}_REKAP_${kelas}.png`;
		link.href = dataUrl;
		link.click();
		showToast('Gambar WA siap!', 'success');
	}).catch(function(error) {
		console.error('Error dom-to-image!', error);
		showToast('Gagal memproses gambar.', 'error');
	});
}

function cetakKwitansi(idTransaksi) {
	const trx = dbPembayaran.find(t => String(t.id) === String(idTransaksi));
	if (!trx) return;
	const s = dbSiswa.find(siswa => String(siswa.nis).trim() === String(trx.nis).trim());
	document.getElementById('p-kwitansi').innerText = trx.id.includes('TEMP') ? 'Menunggu Server...' : trx.id;
	document.getElementById('p-nis').innerText = trx.nis;
	document.getElementById('p-nama').innerText = trx.nama || "-";
	document.getElementById('p-kelas').innerText = s ? s.kelas : "-";
	document.getElementById('p-waktu').innerText = trx.waktuInput;
	document.getElementById('p-tanggal').innerText = trx.tanggalInput;
	document.getElementById('p-jenis').innerText = trx.jenis;
	document.getElementById('p-kode').innerText = trx.acuanBayar;
	document.getElementById('p-keterangan').innerText = `Biaya Administrasi ${trx.jenis} Tahun Ajaran ${trx.tahun}`;
	document.getElementById('p-nominal').innerText = formatRp(trx.nominal);
	document.getElementById('p-grandtotal').innerText = formatRp(trx.nominal);
	document.getElementById('p-terbilang').innerText = terbilang(trx.nominal);
	document.getElementById('p-tgl-cetak').innerText = getNowDateIndo();
	window.print();
	resetPencarianPemasukan();
}

function setupLaporanCetakEvents() {
	const tabLaporan = document.querySelectorAll('.tabLaporan');
	const btnCetak = document.getElementById('generate-cetak');
	const btnImg = document.getElementById('generate-img');

	tabLaporan.forEach(function(tab) {
		tab.addEventListener('click', function() {
			const nameTab = this.getAttribute('tab-name');
			setLaporanTab(nameTab);
		});
	});

	if (btnCetak) btnCetak.addEventListener('click', generateLaporanCetak);
	if (btnImg) btnImg.addEventListener('click', downloadLaporanImage);
}