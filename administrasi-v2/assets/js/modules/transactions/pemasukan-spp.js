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

	if (!dbSiswa.find(s => String(s.nis).trim() === nis)) {
		showToast('NIS tidak terdaftar!', 'error');
		return;
	}

	// BLOK VALIDASI PENCEGAH OVERPAYMENT
	if (!isEdit && hargaTarif > 0) {
		if (idRefValue) { // Skenario Bayar Sisa Hutang
			const totalTerbayar = dbPembayaran.filter(t => (t.id === idRefValue || t.id_ref === idRefValue || t.idRef === idRefValue) && !t.isDeleted).reduce((sum, t) => sum + parseInt(t.nominal), 0);
			const sisaHutang = hargaTarif - totalTerbayar;
			if (nominal > sisaHutang) {
				showToast(`Gagal! Nominal melebihi sisa hutang (Rp ${formatRp(sisaHutang)}).`, 'error');
				return;
			}
		} else { // Skenario Transaksi Baru
			if (nominal > hargaTarif) {
				showToast(`Gagal! Nominal melebihi Tarif Ketetapan (Rp ${formatRp(hargaTarif)}).`, 'error');
				return;
			}
		}
	}

	let data = {
		id: editId || `TEMP-${Date.now()}`,
		isEdit,
		nis,
		jenis,
		tahun,
		nominal,
		id_ref: idRefValue
	};

	if (isEdit) {
		// 🚀 AUTO-REBUILD ACUAN BAYAR (SPP)
    const oldAcuan = document.getElementById('edit-acuan-pemasukan').value;
    const parts = oldAcuan.split('-'); // Pecah teks berdasarkan strip
    const urutanNota = parts[parts.length - 1]; // Ambil angka paling belakang (contoh: "1")
    
    // Rakit ulang dengan inputan terbaru, tapi pertahankan nomor urut aslinya
    data.acuanBayar = `${nis}-${jenis.toUpperCase()}-${tahun}-${urutanNota}`;
		data.tanggalInput = document.getElementById('edit-tgl-pemasukan').value;
		data.waktuInput = document.getElementById('edit-waktu-pemasukan').value;
		data.nama = document.getElementById('edit-nama-pemasukan').value;
		data.lp = document.getElementById('edit-lp-pemasukan').value;
	} else {
		data.tanggalInput = getNowDateIndo();
		data.waktuInput = getNowTime();
		let count = dbPembayaran.filter(t => String(t.nis).trim() === nis && t.jenis === jenis && t.tahun === tahun).length;
		data.acuanBayar = `${nis}-${jenis.toUpperCase()}-${tahun}-${count + 1}`;
		const s = dbSiswa.find(s => String(s.nis).trim() === nis);
		data.nama = s ? s.nama : '-';
		data.lp = s ? s.lp : '-';
	}

	const searchBox = document.getElementById('search-pemasukan');
	if (searchBox) {
		searchBox.value = nis;
		if (typeof handleSearch === 'function') handleSearch('pemasukan');
	}

	processOptimisticSave('pemasukan', dbPembayaran, data, loadAdminTable);

	// ==========================================
	// 🚀 BLOK BARU: RESET FORM & BERSIHKAN UI
	// ==========================================
	document.getElementById('form-pembayaran').reset();
	document.getElementById('info-nama-siswa').classList.add('hidden');
	document.getElementById('info-harga-tarif-teks').classList.add('hidden'); // Menyembunyikan teks target pelunasan
	document.getElementById('alert-tunggakan-pemasukan').classList.add('hidden'); // Menyembunyikan alert orange

	// Kosongkan memori variabel tersembunyi
	document.getElementById('edit-id-nota-referensi-pemasukan').value = "";
	document.getElementById('edit-harga-tarif-pemasukan').value = 0;

	// Kembalikan form nominal ke keadaan normal (tidak terkunci)
	const inputNominal = document.getElementById('input-nominal');
	if (inputNominal) {
		inputNominal.readOnly = false;
		inputNominal.classList.remove('bg-gray-200');
	}
}

function cekNamaSiswa(nis, skipKalkulasi = false) {
	resetPencarianPemasukan();

	// 1. Panggil Helper
	const {
		siswa,
		nisFinal
	} = validasiDanTampilkanSiswa(nis, '');
	if (!siswa) return; // Stop jika siswa tidak ditemukan

	if (!skipKalkulasi && typeof cekTarifDanTunggakan === "function") {
		cekTarifDanTunggakan(true);
	}

	// 2. Deklarasikan HANYA elemen yang dibutuhkan untuk Tahap Bawah (Smart Debt Picker)
	const alertBox = document.getElementById('alert-tunggakan-pemasukan');
	const btnSubmit = document.getElementById('btn-submit-pemasukan');
	const inputNominal = document.getElementById('input-nominal');
	const jenisDipilih = document.getElementById('input-jenis').value;
	const tahunDipilih = document.getElementById('input-tahun').value;

	const transaksiSiswa = dbPembayaran.filter(t => String(t.nis).trim() === nisFinal && !t.isDeleted);
	let tunggakanHTML = '';
	let adaTunggakanItemSama = false;

	// ========================================================
	// 🚀 TAHAP 1: KUMPULKAN SEMUA "KEWAJIBAN" DARI MASTER TARIF
	// ========================================================
	let kewajibanSiswa = [];

	// Cari semua kombinasi unik (Tahun + Jenis) dari Master Tarif
	let combinations = [...new Set(dbMasterTarif.filter(t => !t.isDeleted).map(t => `${t.tahun}###${t.jenis}`))];

	combinations.forEach(combo => {
		let [tTahun, tJenis] = combo.split('###');

		// 1. Cek Kelas Sejarah (Mesin Waktu)
		let hClass = "";
		try {
			if (typeof getHistoricalClass === 'function') {
				hClass = String(getHistoricalClass(siswa, tTahun)).trim().toUpperCase();
			}
		} catch (e) {}

		if (!hClass) return; // Jika kosong, berarti tahun tsb siswa belum masuk / sudah keluar

		// 2. Cari Tarif yang paling cocok untuk kelasnya di tahun tersebut (Prioritas)
		let matchingTarifs = dbMasterTarif.filter(t => !t.isDeleted && t.tahun === tTahun && t.jenis === tJenis);
		let selectedTarif = null;
		let highestPriority = -1;

		// Ambil jenis kelamin siswa (Sesuaikan dengan nama properti database Anda, misal: jk atau jenisKelamin)
    let jkSiswaRaw = String(siswa.lp || siswa.jenisKelamin || siswa.jenis_kelamin || siswa.gender || '').trim().toUpperCase();
    let jkChar = jkSiswaRaw.charAt(0);

		matchingTarifs.forEach(t => {
			let target = String(t.target).trim().toUpperCase();

			// LOGIKA PEMISAH KELAS DAN GENDER
      let parts = target.split(' ');
      let targetGender = null;
      let targetClass = target;

			// Jika kata terakhir dari target adalah 'L' atau 'P' (Contoh: "X L" atau "XI IPA P")
      if (parts.length > 1 && (parts[parts.length - 1] === 'L' || parts[parts.length - 1] === 'P')) {
				targetGender = parts.pop(); // Ambil 'L' atau 'P'
				targetClass = parts.join(' '); // Sisanya adalah kelas (Contoh: "X")
      }

      // BATALKAN jika target mewajibkan gender tertentu, tapi gender siswa tidak cocok!
      if (targetGender && targetGender !== jkChar) return;

      // Beri skor prioritas tambahan jika tarif ini spesifik gender 
      // (Agar "X L" menang melawan "X" biasa)
      let bonusPriority = targetGender ? 0.5 : 0;

			if (target === `NIS ${nisFinal}` && highestPriority < 5) {
        selectedTarif = t;
        highestPriority = 5;
      } else if (targetClass === hClass && highestPriority < (3 + bonusPriority)) {
        selectedTarif = t;
        highestPriority = 3 + bonusPriority;
      } else if (hClass.startsWith(targetClass + ' ') && highestPriority < (2 + bonusPriority)) {
        selectedTarif = t;
        highestPriority = 2 + bonusPriority;
      } else if (target === 'SEMUA KELAS' && highestPriority < 1) {
        selectedTarif = t;
        highestPriority = 1;
      }
		});

		if (selectedTarif) {
			kewajibanSiswa.push({
				tahun: tTahun,
				jenis: tJenis,
				nominal: parseInt(selectedTarif.nominal) || 0
			});
		}
	});

	// ========================================================
	// 🚀 TAHAP 2: BANDINGKAN KEWAJIBAN vs RIWAYAT PEMBAYARAN
	// ========================================================
	kewajibanSiswa.forEach(kewajiban => {
		// Pengecualian SPP sebelum bulan masuk (Fitur Siswa Pindahan)
		if (String(kewajiban.jenis).toUpperCase().includes('SPP')) {
			let tMasuk = parseInt(String(siswa.tahunMasuk).split('/')[0]) || 0;
			let tTarif = parseInt(String(kewajiban.tahun).split('/')[0]) || 0;
			if (tTarif === tMasuk && siswa.bulanMulai) {
				const blnArr = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
				let startIndex = blnArr.findIndex(b => b.toLowerCase() === siswa.bulanMulai.toLowerCase());
				if (startIndex === -1) startIndex = 0;
				let monthOfSPP = blnArr.find(b => String(kewajiban.jenis).toUpperCase().includes(b.toUpperCase()));
				if (monthOfSPP) {
					let sppIndex = blnArr.findIndex(b => b === monthOfSPP);
					if (sppIndex < startIndex) return; // Skip bulan ini!
				}
			}
		}

		// Hitung total bayar untuk jenis & tahun ini
		const riwayatItem = transaksiSiswa.filter(t => t.jenis === kewajiban.jenis && t.tahun === kewajiban.tahun);
		let totalBayar = riwayatItem.reduce((sum, t) => sum + (parseInt(t.nominal) || 0), 0);
		let sisaHutang = kewajiban.nominal - totalBayar;

		// 🛡️ PEMBATASAN TAHUN AKTIF
		let isTahunLalu = kewajiban.tahun !== globalTahunAktif;
		let isCicilanTahunIni = (kewajiban.tahun === globalTahunAktif && totalBayar > 0);

		// 🚀 Tampilkan di Alert Tunggakan HANYA JIKA:
		// 1. Tagihan Tahun Lalu (baik kosong maupun kurang bayar)
		// 2. ATAU Tagihan Tahun Ini yang berstatus Cicilan (Sudah ada DP/uang masuk)
		if (sisaHutang > 0 && (isTahunLalu || isCicilanTahunIni)) {

			// Kunci input jika item yang dipilih di dropdown sama persis dengan yang nunggak
			if (jenisDipilih === kewajiban.jenis && tahunDipilih === kewajiban.tahun) {
				adaTunggakanItemSama = true;
			}

			// Cari ID Induk (Jika belum pernah bayar sama sekali, ID kosong. Jika pernah bayar sebagian, ambil ID nota pertama)
			let idInduk = "";
			if (riwayatItem.length > 0) {
				let induk = riwayatItem.find(r => !r.id_ref && !r.idRef);
				idInduk = induk ? induk.id : riwayatItem[0].id;
			}

			tunggakanHTML += `
				<div class="flex justify-between items-center bg-white p-2 rounded border border-orange-200 mt-1.5 shadow-sm">
					<span class="font-medium text-gray-800">${kewajiban.jenis} <span class="text-xs text-gray-500">(${kewajiban.tahun})</span><br><span class="text-xs text-red-600 font-bold">Kekurangan: Rp ${formatRp(sisaHutang)}</span></span>
					<button type="button" onclick="setBayarCicilanPemasukan('${idInduk}', '${kewajiban.jenis}', '${kewajiban.tahun}', ${sisaHutang}, ${kewajiban.nominal})" class="bg-orange-100 hover:bg-orange-300 text-orange-800 px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm">Lunasi Ini</button>
				</div>`;
		}
	});

	// ========================================================
	// 🚀 TAHAP 3: TAMPILKAN KE LAYAR
	// ========================================================
	if (tunggakanHTML !== '') {
		if (adaTunggakanItemSama) {
			if (inputNominal) {
				inputNominal.value = '';
				inputNominal.readOnly = true;
				inputNominal.classList.add('bg-gray-200');
			}
			if (btnSubmit) {
				btnSubmit.disabled = true;
				btnSubmit.classList.add('opacity-50');
			}
		}

		alertBox.innerHTML = `
			<div class="flex items-start">
				<i class="ph ph-warning-circle text-orange-600 mt-0.5 mr-2 text-lg"></i>
				<div class="w-full">
					<p class="font-bold mb-1 text-orange-900">Perhatian: Ditemukan Tunggakan!</p>
					<p class="text-[11px] text-orange-700 mb-2">Klik <b>Lunasi Ini</b> untuk memproses tagihan yang tertinggal.</p>
					<div class="space-y-2 w-full max-h-64 overflow-y-auto pr-1 custom-scrollbar">${tunggakanHTML}</div>
				</div>
			</div>`;
		alertBox.classList.remove('hidden');
		alertBox.className = 'bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-lg text-sm mb-4 transition-all block';
	} else {
		if (!alertBox.innerHTML.includes("SUDAH LUNAS")) {
			alertBox.classList.add('hidden');
		}
	}
}

function cekTarifDanTunggakan(skipCekTunggakan = false) {
	if (document.getElementById('edit-id-nota-referensi-pemasukan').value !== "") return;

	const nis = document.getElementById('input-nis').value.trim();
	const jenis = document.getElementById('input-jenis').value;
	const tahun = document.getElementById('input-tahun').value;

	const infoTarifBox = document.getElementById('info-harga-tarif-teks');
	const inputNominal = document.getElementById('input-nominal');
	const tarifField = document.getElementById('edit-harga-tarif-pemasukan');
	const alertBox = document.getElementById('alert-tunggakan-pemasukan');
	const btnSubmit = document.getElementById('btn-submit-pemasukan');

	infoTarifBox.classList.add('hidden');
	tarifField.value = 0;

	if (!nis || !jenis || !tahun) return;

	const siswa = dbSiswa.find(s => String(s.nis).trim() === nis);
	if (!siswa) return;

	// 🚀 MESIN WAKTU JUGA BEKERJA DI SINI
	// Ambil kelas siswa pada tahun ajaran yang dipilih di dropdown!
	const namaKelasSiswaHistoris = getHistoricalClass(siswa, tahun).toUpperCase();
	const jenisDipilih = String(jenis).trim().toUpperCase();

	let jkSiswaRaw = String(siswa.lp || siswa.jenisKelamin || siswa.jenis_kelamin || siswa.gender || '').trim().toUpperCase();
  let jkChar = jkSiswaRaw.charAt(0);

	let matchingTarifs = dbMasterTarif.filter(t => !t.isDeleted && t.tahun === tahun && String(t.jenis).trim().toUpperCase() === jenisDipilih);

	// let tarifObj = dbMasterTarif.find(t => {
	// 	if (t.tahun !== tahun) return false;
	// 	if (String(t.jenis).trim().toUpperCase() !== jenisDipilih) return false;

	// 	let target = String(t.target).trim().toUpperCase();
    
  //   // LOGIKA PEMISAH KELAS DAN GENDER (Sama seperti di atas)
  //   let parts = target.split(' ');
  //   let targetGender = null;
  //   let targetClass = target;
    
  //   if (parts.length > 1 && (parts[parts.length - 1] === 'L' || parts[parts.length - 1] === 'P')) {
	// 		targetGender = parts.pop();
	// 		targetClass = parts.join(' ');
  //   }

	// 	// Jika gender tidak cocok, berarti tarif ini bukan untuk dia
  //   if (targetGender && targetGender !== jkSiswa) return false;

  //   // Evaluasi kecocokan Kelasnya
  //   if (targetClass === 'SEMUA KELAS') return true;
  //   if (targetClass === `NIS ${nis}`) return true;
  //   if (targetClass === namaKelasSiswaHistoris) return true;
  //   if (namaKelasSiswaHistoris.startsWith(targetClass + ' ')) return true;
    
  //   return false;
	// });

	let tarifObj = null;
  let highestPriority = -1;

  matchingTarifs.forEach(t => {
    let target = String(t.target).trim().toUpperCase();
    
    let parts = target.split(' ');
    let targetGender = null;
    let targetClass = target;
    
    if (parts.length > 1 && (parts[parts.length - 1] === 'L' || parts[parts.length - 1] === 'P')) {
			targetGender = parts.pop();
			targetClass = parts.join(' ');
    }

    if (targetGender && targetGender !== jkChar) return;

    let bonusPriority = targetGender ? 0.5 : 0;

    if (target === `NIS ${nis}` && highestPriority < 5) {
      tarifObj = t;
      highestPriority = 5;
    } else if (targetClass === namaKelasSiswaHistoris && highestPriority < (3 + bonusPriority)) {
      tarifObj = t;
      highestPriority = 3 + bonusPriority;
    } else if (namaKelasSiswaHistoris.startsWith(targetClass + ' ') && highestPriority < (2 + bonusPriority)) {
      tarifObj = t;
      highestPriority = 2 + bonusPriority;
    } else if (target === 'SEMUA KELAS' && highestPriority < 1) {
      tarifObj = t;
      highestPriority = 1;
    }
  });

	if (tarifObj) {
		const hargaTarif = parseInt(tarifObj.nominal) || 0;
		tarifField.value = hargaTarif;
		infoTarifBox.innerHTML = `Tarif Ketetapan: <b>Rp ${formatRp(hargaTarif)}</b>`;
		infoTarifBox.classList.remove('hidden');

		const riwayat = dbPembayaran.filter(t => String(t.nis).trim() === nis && t.jenis === jenis && t.tahun === tahun && !t.isDeleted);
		const totalTerbayar = riwayat.reduce((sum, t) => sum + parseInt(t.nominal), 0);

		if (totalTerbayar >= hargaTarif) {
			alertBox.innerHTML = `Tagihan ${jenis} tahun ${tahun} <b>SUDAH LUNAS</b>.`;
			alertBox.className = 'bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-sm mb-4 block';
			inputNominal.value = 0;
			inputNominal.readOnly = true;
			inputNominal.classList.add('bg-gray-200');
			if (btnSubmit) {
				btnSubmit.disabled = true;
				btnSubmit.classList.add('opacity-50');
			}
		} else {
			inputNominal.value = hargaTarif;
			inputNominal.readOnly = false;
			inputNominal.classList.remove('bg-gray-200');
			// 🚀 PENAMBAHAN: Pastikan tombol terbuka jika statusnya tidak lunas
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.classList.remove('opacity-50');
      }
		}
		evaluasiStatusPemasukan();
	}

	if (!skipCekTunggakan) {
		cekNamaSiswa(nis, true);
	}
}

function setBayarCicilanPemasukan(idInduk, jenis, tahun, sisa, hargaTarif) {
	document.getElementById('input-tahun').value = tahun;
	document.getElementById('input-jenis').value = jenis;
	document.getElementById('edit-id-nota-referensi-pemasukan').value = idInduk;

	// Tampilkan info tarif
	const infoTarif = document.getElementById('info-harga-tarif-teks');
	document.getElementById('edit-harga-tarif-pemasukan').value = hargaTarif;
	infoTarif.innerHTML = `Target Pelunasan: <b>${formatRp(hargaTarif)}</b> (Sisa: <b class="text-red-500">${formatRp(sisa)}</b>)`;
	infoTarif.classList.remove('hidden');

	// Buka kunci Form
	const inputNominal = document.getElementById('input-nominal');
	inputNominal.value = sisa;
	inputNominal.readOnly = false;
	inputNominal.classList.remove('bg-gray-200');
	inputNominal.focus();

	const btnSubmit = document.getElementById('btn-submit-pemasukan');
	if (btnSubmit) {
		btnSubmit.disabled = false;
		btnSubmit.classList.remove('opacity-50');
	}

	// Update badge status menjadi Hutang/Cicilan
	evaluasiStatusPemasukan();

	// Sembunyikan alert agar kasir fokus simpan
	document.getElementById('alert-tunggakan-pemasukan').classList.add('hidden');
}

function evaluasiStatusPemasukan() {
	const nominal = parseInt(document.getElementById('input-nominal').value) || 0;
	const hargaTarif = parseInt(document.getElementById('edit-harga-tarif-pemasukan').value) || 0;
	const isCicilan = !!document.getElementById('edit-id-nota-referensi-pemasukan').value;
	const statusDrop = document.getElementById('input-status-pemasukan');

	if (hargaTarif > 0 && (nominal < hargaTarif || isCicilan)) {
		statusDrop.value = 'Hutang';
		statusDrop.className = "w-full px-3 py-2 border border-orange-300 bg-orange-50 text-orange-700 rounded-lg font-bold";
	} else {
		statusDrop.value = 'Lunas';
		statusDrop.className = "w-full px-3 py-2 border border-green-300 bg-green-50 text-green-700 rounded-lg font-bold";
	}
}

function resetPencarianPemasukan() {
	const searchBox = document.getElementById('search-pemasukan');
	if (searchBox && searchBox.value !== '') {
		searchBox.value = ''; // Kosongkan kotak pencarian
		if (typeof handleSearch === 'function') {
			handleSearch('pemasukan'); // Segarkan tabel kembali ke tahun aktif
		}
	}
}

function setupPemasukanSppEvents() {
	const pembayaran = document.getElementById('form-pembayaran');
	const inputNis = document.getElementById('input-nis');
	const cekTarif = document.querySelectorAll('.cekTarif');
	const cekStatusPemasukan = document.getElementById('input-nominal');

	if (pembayaran) pembayaran.addEventListener('submit', submitPembayaran);
	if (inputNis) {
		inputNis.addEventListener('input', function() {
			cekNamaSiswa(this.value);
		});
	}

	cekTarif.forEach(function(tarif) {
		tarif.addEventListener('change', function() {
			cekTarifDanTunggakan();
		});
	});

	if (cekStatusPemasukan) cekStatusPemasukan.addEventListener('input', evaluasiStatusPemasukan);
}