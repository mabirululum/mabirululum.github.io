// ==========================================
// 1. MANDOR UI POTONGAN (STATE MANAGEMENT)
// ==========================================
function aturStatePotongan(state) {
	const btnSimpan = document.getElementById('btn-ptg-simpan');
	const btnUnlock = document.getElementById('btn-ptg-unlock');
	const btnPrint = document.getElementById('btn-ptg-print');
	const btnSalin = document.getElementById('btn-ptg-salin');
	const badge = document.getElementById('ptg-status-badge');
	const tfoot = document.getElementById('tfoot-potongan');

	// REVISI: Ambil 4 elemen form tarif di atas
	const tarifIzinTugas = document.getElementById('ptg-tarif-izin-tugas');
	const tarifIzinNontugas = document.getElementById('ptg-tarif-izin-nontugas');
	const tarifTelat = document.getElementById('ptg-tarif-telat');
	const tarifAlpa = document.getElementById('ptg-tarif-alpa');

	const kunciFormTarif = (dikunci) => {
		[tarifIzinTugas, tarifIzinNontugas, tarifTelat, tarifAlpa].forEach(input => {
			if (input) {
				input.readOnly = dikunci;
				if (dikunci) {
					input.classList.add('bg-gray-100', 'text-gray-500', 'cursor-not-allowed', 'border-transparent');
					input.classList.remove('bg-red-50', 'text-red-900', 'border-red-200');
				} else {
					input.classList.remove('bg-gray-100', 'text-gray-500', 'cursor-not-allowed', 'border-transparent');
					input.classList.add('bg-red-50', 'text-red-900', 'border-red-200');
				}
			}
		});
	};

	if (btnSimpan) btnSimpan.classList.add('hidden');
	if (btnUnlock) btnUnlock.classList.add('hidden');
	if (btnPrint) btnPrint.classList.add('hidden');
	if (btnSalin) btnSalin.classList.add('hidden');
	if (tfoot) tfoot.classList.add('hidden');

	if (state === 'KOSONG') {
		badge.innerHTML = `<i class="ph ph-info mr-1"></i> Data Belum Tersedia`;
		badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600 flex items-center";
		kunciFormTarif(true);

	} else if (state === 'DRAFT') {
		if (btnSimpan) btnSimpan.classList.remove('hidden');
		if (btnSalin) btnSalin.classList.remove('hidden');
		if (tfoot) tfoot.classList.remove('hidden');
		badge.innerHTML = `<i class="ph ph-pencil-simple mr-1"></i> Mode Edit (Draft)`;
		badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 flex items-center";
		kunciFormTarif(false);

	} else if (state === 'TERKUNCI') {
		if (btnUnlock) btnUnlock.classList.remove('hidden');
		if (btnPrint) btnPrint.classList.remove('hidden');
		if (tfoot) tfoot.classList.remove('hidden');
		badge.innerHTML = `<i class="ph ph-check-circle mr-1"></i> Data Tersimpan & Terkunci`;
		badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 flex items-center";
		kunciFormTarif(true);
	}
}


// ==========================================
// 2. OTAK AUTO-DETECT DATA
// ==========================================
async function cekStatusPotonganBulanIni() {
	const bulan = document.getElementById('ptg-filter-bulan').value;
	const tahun = document.getElementById('ptg-filter-tahun').value;
	const tbody = document.getElementById('table-body-potongan');

	if (!bulan || !tahun) {
		tbody.innerHTML = `<tr><td colspan="12" class="p-8 text-center text-gray-500 italic">Silakan pilih bulan untuk memuat data.</td></tr>`;
		aturStatePotongan('KOSONG');
		return;
	}

	try {
		tbody.innerHTML = `<tr><td colspan="12" class="p-8 text-center text-indigo-500 font-medium"><i class="ph ph-spinner animate-spin text-xl mr-2 inline-block"></i>Mengecek data bulan ${bulan}...</td></tr>`;

		const {
			data: dataMasterHR,
			error: errMaster
		} = await supabaseClient
			.from('transaksi_honorarium')
			.select(`guru_id, total_terima, master_guru ( nama, jabatan, tugas_tambahan )`)
			.eq('bulan', bulan)
			.eq('tahun_ajaran', tahun);

		if (errMaster) throw errMaster;

		if (!dataMasterHR || dataMasterHR.length === 0) {
			tbody.innerHTML = `<tr><td colspan="12" class="p-8 text-center text-red-500 font-medium bg-red-50 italic">Gaji Induk bulan ${bulan} belum dibuat. Silakan kerjakan menu HR Tendik terlebih dahulu.</td></tr>`;
			aturStatePotongan('KOSONG');
			showToast(`HR Tendik bulan ${bulan} belum ada!`, 'warning');
			return;
		}

		const {
			data: dataPotongan,
			error: errPotongan
		} = await supabaseClient
			.from('transaksi_potongan_tendik')
			.select('*')
			.eq('bulan', bulan)
			.eq('tahun_ajaran', tahun);

		if (errPotongan) throw errPotongan;

		if (dataPotongan && dataPotongan.length > 0) {
			// REVISI: Tarik 2 jenis tarif izin dari database
			const dataPertama = dataPotongan[0];
			const tarifIzinTugas = document.getElementById('ptg-tarif-izin-tugas');
			const tarifIzinNontugas = document.getElementById('ptg-tarif-izin-nontugas');
			const tarifTelat = document.getElementById('ptg-tarif-telat');
			const tarifAlpa = document.getElementById('ptg-tarif-alpa');

			if (tarifIzinTugas) tarifIzinTugas.value = dataPertama.tarif_izin_tugas || 0;
			if (tarifIzinNontugas) tarifIzinNontugas.value = dataPertama.tarif_izin_nontugas || 0;
			if (tarifTelat) tarifTelat.value = dataPertama.tarif_telat || 0;
			if (tarifAlpa) tarifAlpa.value = dataPertama.tarif_alpa || 0;

			renderTabelPotongan(dataMasterHR, dataPotongan, 'TERKUNCI');
			aturStatePotongan('TERKUNCI');
			showToast(`Data potongan bulan ${bulan} dimuat (Terkunci).`, 'success');
		} else {
			renderTabelPotongan(dataMasterHR, null, 'DRAFT');
			aturStatePotongan('DRAFT');
			showToast(`Form potongan bulan ${bulan} siap diisi.`, 'info');
		}

	} catch (error) {
		console.error("Gagal mengecek data potongan:", error);
		tbody.innerHTML = `<tr><td colspan="12" class="p-8 text-center text-red-500 italic">Terjadi kesalahan saat memuat data.</td></tr>`;
		showToast('Error sistem: ' + error.message, 'error');
	}
}


// ==========================================
// 3. RENDER TABEL & KALKULASI POTONGAN
// ==========================================
function renderTabelPotongan(dataMasterHR, dataPotongan, state) {
	const tbody = document.getElementById('table-body-potongan');
	tbody.innerHTML = '';

	const isLocked = (state === 'TERKUNCI');
	const inputClass = isLocked ?
		"w-full text-right p-1.5 border border-transparent bg-transparent text-gray-800 font-medium cursor-not-allowed outline-none" :
		"w-full text-right p-1.5 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-indigo-400 outline-none ptg-hitung-trigger";

	dataMasterHR.forEach((hr, index) => {
		let ptg = null;
		if (dataPotongan && dataPotongan.length > 0) {
			ptg = dataPotongan.find(p => String(p.guru_id) === String(hr.guru_id));
		}

		const vSertifikasi = ptg ? ptg.potongan_sertifikasi : 0;
		const vHutang = ptg ? ptg.potongan_hutang : 0;
		const vArisan = ptg ? ptg.potongan_arisan : 0;

		// REVISI: Pecah jadi 2 jenis izin
		const vIzinTugas = ptg ? ptg.vol_izin_tugas : 0;
		const vIzinNontugas = ptg ? ptg.vol_izin_nontugas : 0;
		const vTelat = ptg ? ptg.vol_telat : 0;
		const vAlpa = ptg ? ptg.vol_alpa : 0;

		const gajiUtuh = hr.total_terima || 0;
		const namaGuru = hr.master_guru ? hr.master_guru.nama : 'Tidak Diketahui';
		const guru = hr.master_guru || {};
		const tugasJabatan = [guru.jabatan, guru.tugas_tambahan].filter(Boolean).join(' & ') || '-';

		const tr = document.createElement('tr');
		tr.className = "hover:bg-gray-50 transition-colors ptg-row";
		tr.setAttribute('data-guru-id', hr.guru_id);
		tr.setAttribute('data-gaji-utuh', gajiUtuh);

		tr.innerHTML = `
            <td class="p-3 border border-gray-200 text-center align-middle">${index + 1}</td>
            <td class="p-3 border border-gray-200 align-middle">
                <div class="font-medium text-gray-800">${namaGuru}</div>
                <div class="text-xs text-gray-500">${tugasJabatan}</div>
            </td>
            <td class="p-3 border border-gray-200 text-right font-medium text-emerald-700 bg-emerald-50 align-middle">
                Rp ${gajiUtuh.toLocaleString('id-ID')}
            </td>
            
            <td class="p-2 border border-gray-200 align-middle">
                <input type="text" class="${inputClass} ptg-input-sertifikasi" value="${vSertifikasi.toLocaleString('id-ID')}" ${isLocked ? 'readonly' : ''}>
            </td>
            <td class="p-2 border border-gray-200 align-middle">
                <input type="text" class="${inputClass} ptg-input-hutang" value="${vHutang.toLocaleString('id-ID')}" ${isLocked ? 'readonly' : ''}>
            </td>
            <td class="p-2 border border-gray-200 align-middle">
                <input type="text" class="${inputClass} ptg-input-arisan" value="${vArisan.toLocaleString('id-ID')}" ${isLocked ? 'readonly' : ''}>
            </td>

            <!-- REVISI: Kolom Absensi menjadi 4 kolom -->
            <td class="p-2 border border-gray-200 align-middle">
                <input type="number" class="${inputClass} ptg-input-izin-tugas text-center" value="${vIzinTugas}" min="0" ${isLocked ? 'readonly' : ''}>
            </td>
            <td class="p-2 border border-gray-200 align-middle">
                <input type="number" class="${inputClass} ptg-input-izin-nontugas text-center" value="${vIzinNontugas}" min="0" ${isLocked ? 'readonly' : ''}>
            </td>
            <td class="p-2 border border-gray-200 align-middle">
                <input type="number" class="${inputClass} ptg-input-telat text-center" value="${vTelat}" min="0" ${isLocked ? 'readonly' : ''}>
            </td>
            <td class="p-2 border border-gray-200 align-middle">
                <input type="number" class="${inputClass} ptg-input-alpa text-center" value="${vAlpa}" min="0" ${isLocked ? 'readonly' : ''}>
            </td>

            <td class="p-3 border border-gray-200 text-right font-bold text-red-600 bg-red-50 align-middle ptg-row-total-potongan">Rp 0</td>
            <td class="p-3 border border-gray-200 text-right font-bold text-blue-700 bg-blue-50 align-middle ptg-row-gaji-bersih">Rp 0</td>
        `;
		tbody.appendChild(tr);
	});

	document.querySelectorAll('.ptg-hitung-trigger').forEach(input => {
		input.addEventListener('input', hitungTotalPotonganSemua);
	});

	hitungTotalPotonganSemua();
}

// ==========================================
// FUNGSI KALKULATOR (VERSI ANTI-ERROR)
// ==========================================
function hitungTotalPotonganSemua() {
	const tarifIzinTugas = parseInt(document.getElementById('ptg-tarif-izin-tugas')?.value) || 0;
	const tarifIzinNontugas = parseInt(document.getElementById('ptg-tarif-izin-nontugas')?.value) || 0;
	const tarifTelat = parseInt(document.getElementById('ptg-tarif-telat')?.value) || 0;
	const tarifAlpa = parseInt(document.getElementById('ptg-tarif-alpa')?.value) || 0;

	let grandTotalUtuh = 0,
		grandTotalSertifikasi = 0,
		grandTotalHutang = 0;
	let grandTotalArisan = 0,
		grandTotalPotongan = 0,
		grandTotalBersih = 0;

	document.querySelectorAll('.ptg-row').forEach(row => {
		const gajiUtuh = parseInt(row.getAttribute('data-gaji-utuh')) || 0;

		// PENGAMAN: Tambahkan ?. (opsional) agar tidak error jika kolom belum ada
		const vSertifikasi = parseInt((row.querySelector('.ptg-input-sertifikasi')?.value || '0').replace(/[^0-9]/g, '')) || 0;
		const vHutang = parseInt((row.querySelector('.ptg-input-hutang')?.value || '0').replace(/[^0-9]/g, '')) || 0;
		const vArisan = parseInt((row.querySelector('.ptg-input-arisan')?.value || '0').replace(/[^0-9]/g, '')) || 0;

		const vIzinTugas = parseInt(row.querySelector('.ptg-input-izin-tugas')?.value) || 0;
		const vIzinNontugas = parseInt(row.querySelector('.ptg-input-izin-nontugas')?.value) || 0;
		const vTelat = parseInt(row.querySelector('.ptg-input-telat')?.value) || 0;
		const vAlpa = parseInt(row.querySelector('.ptg-input-alpa')?.value) || 0;

		const dendaIzinTugas = vIzinTugas * tarifIzinTugas;
		const dendaIzinNontugas = vIzinNontugas * tarifIzinNontugas;
		const dendaTelat = vTelat * tarifTelat;
		const dendaAlpa = vAlpa * tarifAlpa;

		const totalPotonganBaris = vSertifikasi + vHutang + vArisan + dendaIzinTugas + dendaIzinNontugas + dendaTelat + dendaAlpa;
		const gajiBersihBaris = gajiUtuh - totalPotonganBaris;

		// PENGAMAN: Cek elemennya ada sebelum merapikan format
		const elSerti = row.querySelector('.ptg-input-sertifikasi');
		const elHutang = row.querySelector('.ptg-input-hutang');
		const elArisan = row.querySelector('.ptg-input-arisan');
		const elTotalPtg = row.querySelector('.ptg-row-total-potongan');
		const elTotalBersih = row.querySelector('.ptg-row-gaji-bersih');

		if (elSerti && document.activeElement !== elSerti) elSerti.value = vSertifikasi.toLocaleString('id-ID');
		if (elHutang && document.activeElement !== elHutang) elHutang.value = vHutang.toLocaleString('id-ID');
		if (elArisan && document.activeElement !== elArisan) elArisan.value = vArisan.toLocaleString('id-ID');

		if (elTotalPtg) elTotalPtg.innerText = 'Rp ' + totalPotonganBaris.toLocaleString('id-ID');
		if (elTotalBersih) elTotalBersih.innerText = 'Rp ' + gajiBersihBaris.toLocaleString('id-ID');

		grandTotalUtuh += gajiUtuh;
		grandTotalSertifikasi += vSertifikasi;
		grandTotalHutang += vHutang;
		grandTotalArisan += vArisan;
		grandTotalPotongan += totalPotonganBaris;
		grandTotalBersih += gajiBersihBaris;
	});

	const elUtuh = document.getElementById('ptg-total-utuh');
	const elSerti = document.getElementById('ptg-total-sertifikasi');
	const elHutang = document.getElementById('ptg-total-hutang');
	const elArisan = document.getElementById('ptg-total-arisan');
	const elTotalPtg = document.getElementById('ptg-total-semua-potongan');
	const elBersih = document.getElementById('ptg-total-bersih');

	if (elUtuh) elUtuh.innerText = 'Rp ' + grandTotalUtuh.toLocaleString('id-ID');
	if (elSerti) elSerti.innerText = 'Rp ' + grandTotalSertifikasi.toLocaleString('id-ID');
	if (elHutang) elHutang.innerText = 'Rp ' + grandTotalHutang.toLocaleString('id-ID');
	if (elArisan) elArisan.innerText = 'Rp ' + grandTotalArisan.toLocaleString('id-ID');
	if (elTotalPtg) elTotalPtg.innerText = 'Rp ' + grandTotalPotongan.toLocaleString('id-ID');
	if (elBersih) elBersih.innerText = 'Rp ' + grandTotalBersih.toLocaleString('id-ID');
}

// ==========================================
// 6. FITUR SALIN DATA BULAN LALU
// ==========================================
async function salinPotonganBulanLalu() {
	const bulanSekarang = document.getElementById('ptg-filter-bulan')?.value;
	const tahunSekarang = document.getElementById('ptg-filter-tahun')?.value;

	if (!bulanSekarang || !tahunSekarang) {
		if (typeof showToast === 'function') showToast('Pilih bulan dan tahun ajaran terlebih dahulu.', 'warning');
		return;
	}

	// Peta mundur bulan (Otomatis mendeteksi bulan sebelumnya)
	const prevMonthMap = {
		'Januari': 'Desember',
		'Februari': 'Januari',
		'Maret': 'Februari',
		'April': 'Maret',
		'Mei': 'April',
		'Juni': 'Mei',
		'Juli': 'Juni',
		'Agustus': 'Juli',
		'September': 'Agustus',
		'Oktober': 'September',
		'November': 'Oktober',
		'Desember': 'November'
	};

	const bulanLalu = prevMonthMap[bulanSekarang];
	let tahunLalu = tahunSekarang;

	// Jika sedang di bulan Juli (awal tahun ajaran), mundurkan tahun ajarannya (misal 2026/2027 -> 2025/2026)
	if (bulanSekarang === 'Juli') {
		const parts = tahunSekarang.split('/');
		if (parts.length === 2) {
			tahunLalu = `${parseInt(parts[0]) - 1}/${parseInt(parts[1]) - 1}`;
		}
	}

	// Tampilkan konfirmasi
	const setuju = await tampilkanKonfirmasi(
		'Salin Data Bulan Lalu',
		`Tarik data potongan bulan ${bulanLalu} (${tahunLalu}) ke bulan ${bulanSekarang}? Data yang sudah Anda ketik di layar akan tertimpa.`,
		'Ya, Salin Data',
		'bg-blue-600 hover:bg-blue-700'
	);

	if (!setuju) return;

	try {
		if (typeof showToast === 'function') showToast(`Mencari data potongan bulan ${bulanLalu}...`, 'info');

		// Tarik data dari Supabase
		const {
			data: dataLalu,
			error
		} = await supabaseClient
			.from('transaksi_potongan_tendik')
			.select('*')
			.eq('bulan', bulanLalu)
			.eq('tahun_ajaran', tahunLalu);

		if (error) throw error;

		if (!dataLalu || dataLalu.length === 0) {
			if (typeof showToast === 'function') showToast(`Gagal: Data potongan bulan ${bulanLalu} tidak ditemukan!`, 'warning');
			return;
		}

		// 1. Salin Tarif Denda (Ambil dari data orang pertama)
		const dataPertama = dataLalu[0];
		const tIzinTugas = document.getElementById('ptg-tarif-izin-tugas');
		const tIzinNon = document.getElementById('ptg-tarif-izin-nontugas');
		const tTelat = document.getElementById('ptg-tarif-telat');
		const tAlpa = document.getElementById('ptg-tarif-alpa');

		if (tIzinTugas) tIzinTugas.value = dataPertama.tarif_izin_tugas || 0;
		if (tIzinNon) tIzinNon.value = dataPertama.tarif_izin_nontugas || 0;
		if (tTelat) tTelat.value = dataPertama.tarif_telat || 0;
		if (tAlpa) tAlpa.value = dataPertama.tarif_alpa || 0;

		// 2. Salin Data Per Guru ke dalam Tabel
		document.querySelectorAll('.ptg-row').forEach(row => {
			const guru_id = row.getAttribute('data-guru-id');
			const pLalu = dataLalu.find(p => String(p.guru_id) === String(guru_id));

			if (pLalu) {
				const elSerti = row.querySelector('.ptg-input-sertifikasi');
				const elHutang = row.querySelector('.ptg-input-hutang');
				const elArisan = row.querySelector('.ptg-input-arisan');
				const elIzinTugas = row.querySelector('.ptg-input-izin-tugas');
				const elIzinNon = row.querySelector('.ptg-input-izin-nontugas');
				const elTelat = row.querySelector('.ptg-input-telat');
				const elAlpa = row.querySelector('.ptg-input-alpa');

				// Isi nilai ke input UI (dan format Rupiah)
				if (elSerti) elSerti.value = (pLalu.potongan_sertifikasi || 0).toLocaleString('id-ID');
				if (elHutang) elHutang.value = (pLalu.potongan_hutang || 0).toLocaleString('id-ID');
				if (elArisan) elArisan.value = (pLalu.potongan_arisan || 0).toLocaleString('id-ID');

				if (elIzinTugas) elIzinTugas.value = pLalu.vol_izin_tugas || 0;
				if (elIzinNon) elIzinNon.value = pLalu.vol_izin_nontugas || 0;
				if (elTelat) elTelat.value = pLalu.vol_telat || 0;
				if (elAlpa) elAlpa.value = pLalu.vol_alpa || 0;
			}
		});

		// 3. Picu fungsi kalkulator agar baris Total ikut berubah
		hitungTotalPotonganSemua();

		if (typeof showToast === 'function') showToast('Data bulan lalu berhasil disalin! Jangan lupa klik Simpan.', 'success');

	} catch (error) {
		console.error("Error salin data:", error);
		if (typeof showToast === 'function') showToast('Terjadi kesalahan saat menyalin data: ' + error.message, 'error');
	}
}

// ==========================================
// 4. SIMPAN DATA KE SUPABASE
// ==========================================
async function simpanPotonganTendik() {
	const bulan = document.getElementById('ptg-filter-bulan')?.value;
	const tahun = document.getElementById('ptg-filter-tahun')?.value;

	const tarifIzinTugas = parseInt(document.getElementById('ptg-tarif-izin-tugas')?.value) || 0;
	const tarifIzinNontugas = parseInt(document.getElementById('ptg-tarif-izin-nontugas')?.value) || 0;
	const tarifTelat = parseInt(document.getElementById('ptg-tarif-telat')?.value) || 0;
	const tarifAlpa = parseInt(document.getElementById('ptg-tarif-alpa')?.value) || 0; // Tambahan parseInt di sini

	const barisGuru = document.querySelectorAll('.ptg-row');
	if (barisGuru.length === 0) {
		showToast('Tabel kosong! Tidak ada data untuk disimpan.', 'warning');
		return;
	}

	const payloadData = [];

	barisGuru.forEach(row => {
		const guru_id = row.getAttribute('data-guru-id');

		const pSertifikasi = parseInt((row.querySelector('.ptg-input-sertifikasi')?.value || '0').replace(/[^0-9]/g, '')) || 0;
		const pHutang = parseInt((row.querySelector('.ptg-input-hutang')?.value || '0').replace(/[^0-9]/g, '')) || 0;
		const pArisan = parseInt((row.querySelector('.ptg-input-arisan')?.value || '0').replace(/[^0-9]/g, '')) || 0;

		const vIzinTugas = parseInt(row.querySelector('.ptg-input-izin-tugas')?.value) || 0;
		const vIzinNontugas = parseInt(row.querySelector('.ptg-input-izin-nontugas')?.value) || 0;
		const vTelat = parseInt(row.querySelector('.ptg-input-telat')?.value) || 0;
		const vAlpa = parseInt(row.querySelector('.ptg-input-alpa')?.value) || 0;

		const totalPtg = pSertifikasi + pHutang + pArisan + (vIzinTugas * tarifIzinTugas) + (vIzinNontugas * tarifIzinNontugas) + (vTelat * tarifTelat) + (vAlpa * tarifAlpa);

		payloadData.push({
			guru_id: guru_id,
			bulan: bulan,
			tahun_ajaran: tahun,
			tarif_izin_tugas: tarifIzinTugas,
			tarif_izin_nontugas: tarifIzinNontugas,
			tarif_telat: tarifTelat,
			tarif_alpa: tarifAlpa,
			potongan_sertifikasi: pSertifikasi,
			potongan_hutang: pHutang,
			potongan_arisan: pArisan,
			vol_izin_tugas: vIzinTugas,
			vol_izin_nontugas: vIzinNontugas,
			vol_telat: vTelat,
			vol_alpa: vAlpa,
			total_potongan: totalPtg
		});
	});

	try {
		showToast('Menyimpan data potongan...', 'info');

		const {
			error
		} = await supabaseClient
			.from('transaksi_potongan_tendik')
			.upsert(payloadData, {
				onConflict: 'guru_id, bulan, tahun_ajaran'
			});

		if (error) throw error;

		showToast(`Data Potongan bulan ${bulan} berhasil disimpan!`, 'success');
		cekStatusPotonganBulanIni();

	} catch (error) {
		console.error("Gagal simpan potongan:", error);
		showToast('Gagal menyimpan data: ' + error.message, 'error');
	}
}

// ==========================================
// BATCH 6: UNDUH EXCEL POTONGAN (FINAL ACCOUNTING STYLE)
// ==========================================
function unduhExcelPotongan() {
	const btnPrint = document.getElementById('btn-ptg-print');
	const teksAsli = btnPrint.innerHTML;
	btnPrint.innerHTML = '<i class="ph ph-spinner-gap animate-spin mr-1.5 text-lg"></i> Menyusun Excel...';
	btnPrint.disabled = true;

	try {
		const bulan = (document.getElementById('ptg-filter-bulan').value || 'Bulan');
		const tahun = document.getElementById('ptg-filter-tahun').value || 'Tahun';

		// 1. Siapkan Keranjang Data
		const dataExcel = [];

		// 2. Buat Kop Surat (Baris Index 0, 1, 2)
		dataExcel.push([`DAFTAR POTONGAN HONORARIUM TENDIK - BULAN ${bulan.toUpperCase()}`]);
		dataExcel.push(["MADRASAH ALIYAH BI'RUL ULUM"]);
		dataExcel.push([`Tahun Ajaran: ${tahun}`]);
		dataExcel.push([]); // Baris Index 3: Kosong

		// 3. Buat Header Kolom (Baris Index 4)
		dataExcel.push([
			"No",
			"Nama Guru",
			"Jabatan",
			"Gaji Utuh",
			"Ptg. Sertifikasi",
			"Ptg. Hutang",
			"Ptg. Arisan",
			"Total Potongan",
			"Gaji Bersih"
		]);

		// Variabel penampung untuk menghitung Total Sementara (sebelum masuk Excel)
		let sumUtuh = 0,
			sumSerti = 0,
			sumHutang = 0,
			sumArisan = 0,
			sumTotalPtg = 0,
			sumBersih = 0;

		// 4. Ambil Data dari Tabel
		const barisGuru = document.querySelectorAll('.ptg-row');
		barisGuru.forEach((baris, index) => {
			const nama = baris.querySelector('td:nth-child(2) div.font-medium').innerText;
			const jabatan = baris.querySelector('td:nth-child(2) div.text-xs').innerText;

			const gajiUtuh = parseInt(baris.getAttribute('data-gaji-utuh')) || 0;
			const pSertifikasi = parseInt((baris.querySelector('.ptg-input-sertifikasi')?.value || '0').replace(/[^0-9]/g, '')) || 0;
			const pHutang = parseInt((baris.querySelector('.ptg-input-hutang')?.value || '0').replace(/[^0-9]/g, '')) || 0;
			const pArisan = parseInt((baris.querySelector('.ptg-input-arisan')?.value || '0').replace(/[^0-9]/g, '')) || 0;
			const totalPtg = parseInt((baris.querySelector('.ptg-row-total-potongan').innerText).replace(/[^0-9]/g, '')) || 0;
			const gajiBersih = parseInt((baris.querySelector('.ptg-row-gaji-bersih').innerText).replace(/[^0-9]/g, '')) || 0;

			// Tambahkan ke total akumulasi
			sumUtuh += gajiUtuh;
			sumSerti += pSertifikasi;
			sumHutang += pHutang;
			sumArisan += pArisan;
			sumTotalPtg += totalPtg;
			sumBersih += gajiBersih;

			dataExcel.push([
				index + 1, nama, jabatan, gajiUtuh,
				pSertifikasi, pHutang, pArisan,
				totalPtg, gajiBersih
			]);
		});

		// 5. Tambahkan Baris Total di paling bawah
		dataExcel.push([
			"TOTAL KESELURUHAN", "", "", // Kolom 0, 1, 2 (Nanti di-merge)
			sumUtuh, sumSerti, sumHutang, sumArisan, sumTotalPtg, sumBersih
		]);

		// 6. Konversi Data ke SheetJS
		const worksheet = XLSX.utils.aoa_to_sheet(dataExcel);

		// --- MULAI PROSES STYLING ---
		const maxRowIndex = dataExcel.length - 1; // Index baris paling bawah (Total)

		// A. Merger Sel
		worksheet['!merges'] = [{
				s: {
					r: 0,
					c: 0
				},
				e: {
					r: 0,
					c: 8
				}
			}, // Kop 1
			{
				s: {
					r: 1,
					c: 0
				},
				e: {
					r: 1,
					c: 8
				}
			}, // Kop 2
			{
				s: {
					r: 2,
					c: 0
				},
				e: {
					r: 2,
					c: 8
				}
			}, // Kop 3
			{
				s: {
					r: maxRowIndex,
					c: 0
				},
				e: {
					r: maxRowIndex,
					c: 2
				}
			} // Merger tulisan "TOTAL KESELURUHAN"
		];

		// B. Lebar Kolom
		worksheet['!cols'] = [{
				wch: 5
			}, {
				wch: 28
			}, {
				wch: 22
			},
			{
				wch: 18
			}, {
				wch: 16
			}, {
				wch: 16
			}, {
				wch: 16
			},
			{
				wch: 18
			}, {
				wch: 18
			}
		];

		// C. Iterasi Pewarnaan, Border, dan Rumus
		const range = XLSX.utils.decode_range(worksheet['!ref']);

		for (let R = range.s.r; R <= range.e.r; ++R) {
			for (let C = range.s.c; C <= range.e.c; ++C) {
				const cellRef = XLSX.utils.encode_cell({
					r: R,
					c: C
				});
				let cell = worksheet[cellRef];

				// Mencegah sel "kosong" karena di-merge kehilangan efek border
				if (!cell) {
					worksheet[cellRef] = {
						t: 's',
						v: ''
					};
					cell = worksheet[cellRef];
				}

				// 1. FONT DEFAULT
				cell.s = {
					font: {
						name: "Times New Roman",
						sz: 11
					},
					alignment: {
						vertical: "center"
					}
				};

				// 2. KOP SURAT
				if (R <= 2) {
					cell.s.font.bold = true;
					cell.s.font.sz = 12;
					cell.s.alignment.horizontal = "center";
				}

				// 3. BERI BORDER (Mulai dari baris Header sampai ke bawah)
				if (R >= 4) {
					cell.s.border = {
						top: {
							style: "thin",
							color: {
								rgb: "000000"
							}
						},
						bottom: {
							style: "thin",
							color: {
								rgb: "000000"
							}
						},
						left: {
							style: "thin",
							color: {
								rgb: "000000"
							}
						},
						right: {
							style: "thin",
							color: {
								rgb: "000000"
							}
						}
					};
				}

				// 4. HEADER TABEL (Baris 4)
				if (R === 4) {
					cell.s.font.bold = true;
					cell.s.alignment.horizontal = "center";
					cell.s.fill = {
						fgColor: {
							rgb: "FFF2F2F2"
						}
					}; // Warna Abu-abu Terang
				}

				// 5. ISI TABEL (Nomor Tengah & Format Accounting)
				if (R >= 5) {
					if (C === 0) cell.s.alignment.horizontal = "center";

					// Kolom Uang (Kolom 3 s/d 8)
					if (C >= 3 && C <= 8 && cell.t === 'n') {
						// KODE SAKTI EXCEL: Membuat "Rp" rata kiri dan "Angka" rata kanan persis seperti di gambar
						cell.z = '_-"Rp"* #,##0_-;\\-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';
					}
				}

				// 6. FOOTER TABEL / BARIS TOTAL
				if (R === maxRowIndex) {
					cell.s.font.bold = true;
					cell.s.fill = {
						fgColor: {
							rgb: "FFDCE6F1"
						}
					}; // Warna Biru Lembut

					if (C === 0) {
						cell.s.alignment.horizontal = "right"; // Merapatkan teks "TOTAL KESELURUHAN" ke kanan
					}

					// Sisipkan Rumus =SUM(...) Otomatis
					if (C >= 3 && C <= 8) {
						const colLetter = String.fromCharCode(65 + C); // Mengubah index kolom ke Huruf (3=D, 4=E, dst)
						// Karena Excel dimulai dari baris 1 (bukan 0), maka data mulai di baris 6, dan berakhir di baris maxRowIndex
						cell.f = `SUM(${colLetter}6:${colLetter}${maxRowIndex})`;
					}
				}
			}
		}

		// 7. Unduh File
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Potongan Tendik");
		XLSX.writeFile(workbook, `Potongan_Tendik_${bulan}_${tahun.replace('/','-')}.xlsx`);

		btnPrint.innerHTML = teksAsli;
		btnPrint.disabled = false;
		if (typeof showToast === 'function') showToast('Berhasil mengunduh Excel!', 'success');

	} catch (error) {
		console.error("Gagal Excel:", error);
		btnPrint.innerHTML = teksAsli;
		btnPrint.disabled = false;
		if (typeof showToast === 'function') showToast('Gagal membuat file Excel', 'error');
	}
}

// ==========================================
// 5. PASANG SENSOR EVENT LISTENER
// ==========================================
function setupPotonganEvents() {
	const filterBulan = document.getElementById('ptg-filter-bulan');
	const filterTahun = document.getElementById('ptg-filter-tahun');

	const tarifIzinTugas = document.getElementById('ptg-tarif-izin-tugas');
	const tarifIzinNontugas = document.getElementById('ptg-tarif-izin-nontugas');
	const tarifTelat = document.getElementById('ptg-tarif-telat');
	const tarifAlpa = document.getElementById('ptg-tarif-alpa');

	if (filterBulan) filterBulan.addEventListener('change', cekStatusPotonganBulanIni);
	if (filterTahun) filterTahun.addEventListener('change', cekStatusPotonganBulanIni);

	if (tarifIzinTugas) tarifIzinTugas.addEventListener('input', hitungTotalPotonganSemua);
	if (tarifIzinNontugas) tarifIzinNontugas.addEventListener('input', hitungTotalPotonganSemua);
	if (tarifTelat) tarifTelat.addEventListener('input', hitungTotalPotonganSemua);
	if (tarifAlpa) tarifAlpa.addEventListener('input', hitungTotalPotonganSemua);

	const btnSimpan = document.getElementById('btn-ptg-simpan');
	if (btnSimpan) {
		btnSimpan.replaceWith(btnSimpan.cloneNode(true));
		document.getElementById('btn-ptg-simpan').addEventListener('click', async function(e) {
			e.preventDefault();
			const bulan = document.getElementById('ptg-filter-bulan').value || 'ini';

			const setuju = await tampilkanKonfirmasi(
				'Simpan Potongan',
				`Anda yakin ingin menyimpan potongan gaji untuk bulan ${bulan}?`,
				'Ya, Simpan',
				'bg-emerald-600 hover:bg-emerald-700'
			);

			if (setuju) simpanPotonganTendik();
		});
	}

	const btnUnlock = document.getElementById('btn-ptg-unlock');
	if (btnUnlock) {
		btnUnlock.replaceWith(btnUnlock.cloneNode(true));
		document.getElementById('btn-ptg-unlock').addEventListener('click', async function(e) {
			e.preventDefault();
			const setuju = await tampilkanKonfirmasi(
				'Buka Kunci Data',
				'Anda yakin ingin membuka gembok data ini? Pastikan Anda menyimpannya kembali setelah mengedit.',
				'Ya, Buka Kunci',
				'bg-yellow-500 hover:bg-yellow-600'
			);

			if (setuju) {
				aturStatePotongan('DRAFT');

				// --- PERBAIKAN BUG BUKA KUNCI DI SINI ---
				// Kita gunakan classList.remove dan add, bukan menimpa total className!
				document.querySelectorAll('.ptg-row input').forEach(input => {
					input.readOnly = false;

					// Hilangkan efek gembok
					input.classList.remove('border-transparent', 'bg-transparent', 'text-gray-800', 'cursor-not-allowed');

					// Kembalikan efek bisa diedit
					input.classList.add('border-gray-300', 'bg-white', 'focus:ring-2', 'focus:ring-indigo-400');

					// Pasang ulang sensor kalkulator jika hilang
					if (!input.classList.contains('ptg-hitung-trigger')) {
						input.classList.add('ptg-hitung-trigger');
						input.addEventListener('input', hitungTotalPotonganSemua);
					}
				});
				// ----------------------------------------

				showToast('Kunci terbuka. Mode edit diaktifkan.', 'info');
			}
		});
	}

	const btnPrint = document.getElementById('btn-ptg-print');
	if (btnPrint) {
		btnPrint.replaceWith(btnPrint.cloneNode(true));
		
		const btnBaru = document.getElementById('btn-ptg-print');
		// Ganti warna tombol jadi hijau khas Excel (opsional tapi bagus untuk UI)
		btnBaru.className = "hidden px-5 py-2 bg-green-600 text-white hover:bg-green-700 font-medium rounded-lg transition-colors flex items-center text-sm shadow-sm";
		btnBaru.innerHTML = `<i class="ph ph-microsoft-excel-logo mr-1.5 text-lg"></i> Unduh Excel`;
		
		btnBaru.addEventListener('click', unduhExcelPotongan);
	}

	const btnSalin = document.getElementById('btn-ptg-salin');
	if (btnSalin) {
		btnSalin.replaceWith(btnSalin.cloneNode(true));
		document.getElementById('btn-ptg-salin').addEventListener('click', function(e) {
			e.preventDefault();
			salinPotonganBulanLalu();
		});
	}
}