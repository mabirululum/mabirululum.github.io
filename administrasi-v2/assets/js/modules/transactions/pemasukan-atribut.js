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
		if (typeof showToast === 'function') showToast('NIS tidak terdaftar!', 'error');
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
				if (typeof showToast === 'function') showToast(`Gagal! Nominal bayar (Rp ${formatRp(nominal)}) melebihi sisa hutang (Rp ${formatRp(sisaHutang)}).`, 'error');
				else alert(`Gagal! Nominal bayar melebihi sisa hutang.`);
				return; // STOP!
			}
		} else {
			// Skenario B: Beli Baru 
			if (nominal > hargaKatalog) {
				if (typeof showToast === 'function') showToast(`Gagal! Nominal bayar (Rp ${formatRp(nominal)}) melebihi harga katalog (Rp ${formatRp(hargaKatalog)}).`, 'error');
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
		// 🚀 AUTO-REBUILD ACUAN BAYAR (ATRIBUT)
    const oldAcuan = document.getElementById('edit-acuan-bayar-atribut').value;
    
    // Trik Regex: Mengambil buntut kode urutan B (contoh: "-B1-1" atau "-B2-3") di akhir teks
    const matchUrutan = oldAcuan.match(/-B\d+-\d+$/); 
    const suffixB = matchUrutan ? matchUrutan[0] : '-B1-1'; // Fallback aman jika format rusak
    
    // Rakit ulang dengan inputan terbaru, tempelkan buntut urutannya
    data.acuanBayar = `${nis}-${jenis.toUpperCase()}-${tahun}${suffixB}`;
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

function cekSiswaDanTunggakan(nis, skipKalkulasi = false) {
	// 1. Panggil Helper
	const {
		siswa,
		nisFinal
	} = validasiDanTampilkanSiswa(nis, '-atribut');
	if (!siswa) return; // Stop jika siswa tidak ditemukan

	document.getElementById('input-status-atribut').disabled = false;

	if (!skipKalkulasi && typeof kalkulasiHargaAtribut === "function") {
		kalkulasiHargaAtribut(true);
	}

	// 2. Deklarasikan HANYA elemen yang dibutuhkan untuk Tahap Bawah
	const alertBox = document.getElementById('alert-tunggakan-atribut');
	const listTunggakan = document.getElementById('list-tunggakan-atribut');
	const btnSubmit = document.getElementById('btn-submit-atribut');
	const inputNominal = document.getElementById('input-nominal-atribut');
	const jenisDipilih = document.getElementById('input-jenis-atribut').value;

	// --- DETEKTIF TUNGGAKAN ---
	const transaksiSiswa = dbPemasukanAtribut.filter(t => String(t.nis).trim() === nisFinal && !t.isDeleted);
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

function setupPemasukanAtributEvents() {
	const pembayaran = document.getElementById('form-atribut');
	const inputNis = document.getElementById('input-nis-atribut');
	const inputAtribut = document.querySelectorAll('.inputAtribut');

	if (pembayaran) pembayaran.addEventListener('submit', submitPembayaranAtribut);
	if (inputNis) {
		inputNis.addEventListener('input', function() {
			cekSiswaDanTunggakan(this.value);
		});
	}

	inputAtribut.forEach(function(input) {
		input.addEventListener('change', function() {
			kalkulasiHargaAtribut();
		});
	});
}