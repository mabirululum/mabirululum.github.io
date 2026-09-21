function aturStateBBQS(state, bulan = '', tahun = '') {
	const btnSimpan = document.getElementById('btn-bbqs-simpan');
	const btnUnlock = document.getElementById('btn-bbqs-unlock');
	const btnPrint = document.getElementById('btn-bbqs-print');
	const btnGenerate = document.getElementById('btn-bbqs-generate');
	const btnSalin = document.getElementById('btn-bbqs-salin');

	// Filter Global
	const filterBulan = document.getElementById('bbqs-filter-bulan');
	const filterTahun = document.getElementById('bbqs-filter-tahun');
	const inputTarif = document.getElementById('bbqs-tarif-satuan');
	const badge = document.getElementById('bbqs-status-badge');
	const tbody = document.getElementById('table-body-bbqs');

	const semuaInputVol = document.querySelectorAll('.input-vol-bbqs');
	if (filterBulan) filterBulan.disabled = false;
  if (filterTahun) filterTahun.disabled = false;

	if (state === 'KOSONG') {
		if (btnSimpan) {
			btnSimpan.classList.remove('hidden');
			btnSimpan.disabled = true;
		}
		if (btnUnlock) btnUnlock.classList.add('hidden');
		if (btnPrint) btnPrint.classList.add('hidden');

		if (btnSalin) btnSalin.classList.remove('hidden'); // Munculkan Salin
		if (btnGenerate) {
			btnGenerate.disabled = false; // Aktifkan Generate
			btnGenerate.classList.remove('opacity-50', 'cursor-not-allowed');
		}

		if (filterBulan) filterBulan.disabled = false;
		if (filterTahun) filterTahun.disabled = false;
		if (inputTarif) {
			inputTarif.disabled = false;
			inputTarif.classList.remove('opacity-50', 'cursor-not-allowed');
		}

		if (badge) {
			badge.innerHTML = 'Belum Disimpan';
			badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-gray-200 text-gray-600";
		}
	} else if (state === 'DRAFT') {
		if (btnSimpan) {
			btnSimpan.classList.remove('hidden');
			btnSimpan.disabled = false;
		}
		if (btnUnlock) btnUnlock.classList.add('hidden');
		if (btnPrint) btnPrint.classList.add('hidden');

		if (btnSalin) btnSalin.classList.remove('hidden'); // Munculkan Salin
		if (btnGenerate) {
			btnGenerate.disabled = false; // Aktifkan Generate
			btnGenerate.classList.remove('opacity-50', 'cursor-not-allowed');
		}

		if (filterBulan) filterBulan.disabled = false; // Kunci saat draft (harus clear/generate ulang jika mau ganti)
		if (filterTahun) filterTahun.disabled = false;
		if (inputTarif) inputTarif.disabled = false;

		semuaInputVol.forEach(input => {
			input.disabled = false;
			input.classList.remove('bg-gray-100', 'cursor-not-allowed');
		});

		if (badge) {
			badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-yellow-500 inline-block mr-1"></span> Mode Edit: ${bulan} ${tahun}`;
			badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 flex items-center shadow-sm";
		}
	} else if (state === 'LOCKED') {
		if (btnSimpan) btnSimpan.classList.add('hidden');
		if (btnUnlock) btnUnlock.classList.remove('hidden');
		if (btnPrint) btnPrint.classList.remove('hidden');

		// BUG FIX: Sembunyikan tombol Salin & Nonaktifkan Generate + Filter
		if (btnSalin) btnSalin.classList.add('hidden');
		if (btnGenerate) {
			btnGenerate.disabled = true;
			btnGenerate.classList.add('opacity-50', 'cursor-not-allowed');
		}

		if (inputTarif) {
			inputTarif.disabled = true;
			inputTarif.classList.add('opacity-50', 'cursor-not-allowed');
		}
		
		semuaInputVol.forEach(input => {
			input.disabled = true;
			input.classList.add('bg-gray-100', 'cursor-not-allowed');
		});

		if (badge) {
			badge.innerHTML = `<i class="ph ph-check-circle mr-1 text-lg"></i> Tersimpan: ${bulan} ${tahun}`;
			badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 flex items-center shadow-sm";
		}
	}
}

function generateTabelBBQS() {
	const tbody = document.getElementById('table-body-bbqs');
	const bulan = document.getElementById('bbqs-filter-bulan').value;
	const tahun = document.getElementById('bbqs-filter-tahun').value;

	if (!bulan || !tahun) {
		tampilkanModalNotif('Gagal!','Pilih Tahun Ajaran dan Bulan terlebih dahulu!','error');
		setTimeout(() => {
      tutupModalNotif()
    }, 3000);
		return;
	}

	// 1. Ambil data guru yang tugasnya mengandung kata 'bbqs'
	const guruBBQS = dbMasterGuru.filter(g => g.is_bbqs === true && g.is_active !== false);

	// 2. Urutkan berdasarkan Abjad (Nama A-Z)
	guruBBQS.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));

	if (guruBBQS.length === 0) {
		tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-red-500 font-medium">Tidak ada data Guru dengan tugas BBQS!</td></tr>`;
		return;
	}

	let html = '';
	guruBBQS.forEach((guru, index) => {
		html += `
      <tr class="hover:bg-indigo-50 transition-colors group bbqs-row" data-guru-id="${guru.id}">
        <td class="p-3 border border-gray-200 text-center text-sm">${index + 1}</td>
        <td class="p-3 border border-gray-200 text-center text-xs font-bold text-gray-600">${guru.kode_guru || '-'}</td>
        <td class="p-3 border border-gray-200 font-medium text-sm text-gray-800">${guru.nama}</td>
        <td class="p-3 border border-gray-200 text-xs text-gray-600 text-center">${guru.tugas || 'Guru BBQS'}</td>
        
        <!-- Tampilan Tarif Satuan (Menyesuaikan input global) -->
        <td class="p-3 border border-gray-200 text-center text-gray-500 text-sm">
          Rp <span id="bbqs-satuan-text-${guru.id}">0</span>
        </td>
        
        <!-- Input Volume BBQS -->
        <td class="p-2 border border-gray-200 bg-white">
          <input type="number" min="0" class="input-vol-bbqs w-full text-center border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 p-1.5 text-sm" data-id="${guru.id}" placeholder="0">
        </td>
        
        <!-- TOTAL BARIS (Jumlah) -->
        <td class="p-3 border border-gray-200 text-right font-bold text-indigo-700 bg-indigo-50/30">
          Rp <span id="total-baris-bbqs-${guru.id}">0</span>
        </td>
        
        <!-- Tanda Tangan (Hanya muncul saat di-print) -->
        <td class="p-3 border border-gray-200 text-center text-gray-300 text-xs hidden print:table-cell">
          ${index + 1} ...................
        </td>
      </tr>`;
	});

	tbody.innerHTML = html;

	aturStateBBQS('DRAFT', bulan, tahun);

	// 5. Pasang Radar Kalkulasi 
	pasangRadarKalkulasiBBQS();

	// 6. Pancing kalkulasi pertama kali agar Tarif Satuan (Kolom ke-5) terisi angka
	kalkulasiBBQS();
}

function pasangRadarKalkulasiBBQS() {
	// Pantau perubahan pada semua input Volume dan input Tarif Satuan Global
	const semuaInputVol = document.querySelectorAll('.input-vol-bbqs');
	const inputTarifGlobal = document.getElementById('bbqs-tarif-satuan');

	semuaInputVol.forEach(inputan => {
		inputan.addEventListener('input', kalkulasiBBQS);
	});

	if (inputTarifGlobal) {
		inputTarifGlobal.addEventListener('input', kalkulasiBBQS);
	}
}

function kalkulasiBBQS() {
	// 1. Ambil Nilai Tarif Satuan Global
	const tarifSatuan = parseInt(document.getElementById('bbqs-tarif-satuan').value) || 0;
	let globalTotalAkhir = 0;

	// 2. Sapu semua baris guru di tabel BBQS
	const barisGuru = document.querySelectorAll('.bbqs-row');

	barisGuru.forEach(baris => {
		const idGuru = baris.getAttribute('data-guru-id');

		// Ambil input volume
		const vol = parseInt(baris.querySelector('.input-vol-bbqs').value) || 0;

		// MATEMATIKA
		const totalBaris = vol * tarifSatuan;

		// Tampilkan hasil ke layar
		const elmSatuan = document.getElementById(`bbqs-satuan-text-${idGuru}`);
		const elmTotal = document.getElementById(`total-baris-bbqs-${idGuru}`);

		if (elmSatuan) elmSatuan.innerText = tarifSatuan.toLocaleString('id-ID');
		if (elmTotal) elmTotal.innerText = totalBaris.toLocaleString('id-ID');

		// Tambahkan ke Global
		globalTotalAkhir += totalBaris;
	});

	// 3. Cetak Total ke Footer Tabel
	const footerTotal = document.getElementById('bbqs-total-akhir');
	if (footerTotal) {
		footerTotal.innerText = 'Rp ' + globalTotalAkhir.toLocaleString('id-ID');
	}
}

function bukaKunciBBQS() {
	const bulan = document.getElementById('bbqs-filter-bulan').value;
	const tahun = document.getElementById('bbqs-filter-tahun').value;

	aturStateBBQS('DRAFT', bulan, tahun);
}

function unduhExcelBBQS() {
  const btnPrint = document.getElementById('btn-bbqs-print');
  const teksAsli = btnPrint.innerHTML;
  btnPrint.innerHTML = '<i class="ph ph-spinner-gap animate-spin mr-1.5 text-lg"></i> Menyusun Excel...';
  btnPrint.disabled = true;

  try {
    const bulan = (document.getElementById('bbqs-filter-bulan').value || 'Bulan');
    const tahun = document.getElementById('bbqs-filter-tahun').value || 'Tahun';
    const tarifSatuanGlobal = parseInt(document.getElementById('bbqs-tarif-satuan').value) || 0;

    const dataExcel = [];

    // 1. Kop Surat (Sesuai format cetak)
    dataExcel.push([`DAFTAR HONORARIUM BULAN ${bulan.toUpperCase()}`]);
    dataExcel.push(["GURU BBQS MADRASAH ALIYAH BI'RUL ULUM"]);
    dataExcel.push([`DI YAYASAN PENDIDIKAN ISLAM BI'RUL ULUM TA. ${tahun.toUpperCase()}`]);
    dataExcel.push([]); // Baris Kosong

    // 2. Header Kolom
    dataExcel.push([
      "No",
      "Kode",
      "Nama Guru BBQS",
      "Tugas",
      "Satuan",
      "Vol",
      "Jumlah",
      "Tanda Tangan"
    ]);

    let sumVol = 0;
    let sumJumlah = 0;

    // 3. Tarik Data dari Tabel HTML
    const barisGuru = document.querySelectorAll('.bbqs-row');
    barisGuru.forEach((baris, index) => {
      const kodeGuru = baris.querySelector('td:nth-child(2)')?.innerText.trim() || '-';
      const namaGuru = baris.querySelector('td:nth-child(3)')?.innerText.trim() || '';
      const tugas = baris.querySelector('td:nth-child(4)')?.innerText.trim() || 'Guru BBQS';
      
      const inputVol = baris.querySelector('.input-vol-bbqs');
      const vol = inputVol ? (parseInt(inputVol.value) || 0) : 0;
      const jumlah = vol * tarifSatuanGlobal;

      sumVol += vol;
      sumJumlah += jumlah;

      const ttdTeks = `${index + 1}`;

      dataExcel.push([
        index + 1,
        kodeGuru,
        namaGuru,
        tugas,
        tarifSatuanGlobal,
        vol,
        jumlah,
        ttdTeks
      ]);
    });

    // 4. Baris Total (JUMLAH)
    dataExcel.push([
      "JUMLAH", "", "", "",
      tarifSatuanGlobal, 
      sumVol, 
      sumJumlah, 
      ""
    ]);
    const maxRowIndex = dataExcel.length - 1;

    // 5. Area Tanda Tangan Bawah
    dataExcel.push([]); // Baris kosong pemisah
    dataExcel.push([]); 

    // 1. Kamus nomor bulan
    const daftarBulan = {
      'januari': 1, 'februari': 2, 'maret': 3, 'april': 4,
      'mei': 5, 'juni': 6, 'juli': 7, 'agustus': 8,
      'september': 9, 'oktober': 10, 'november': 11, 'desember': 12
    };

    const namaBulanKecil = (bulan || '').toLowerCase().trim();
    const nomorBulan = daftarBulan[namaBulanKecil] || new Date().getMonth() + 1;

    // 2. Tentukan tahun berjalan berdasarkan semester
    const pecahanTahun = tahun.split('/');
    let tahunKalender = parseInt(pecahanTahun[0]) || new Date().getFullYear();

    // Jika bulan Januari - Juni dan ada tahun kedua (contoh 2024/2025), gunakan tahun 2025
    if (nomorBulan <= 6 && pecahanTahun[1]) {
      tahunKalender = parseInt(pecahanTahun[1].length === 2 ? '20' + pecahanTahun[1] : pecahanTahun[1]);
    }

    // 3. Cari tanggal terakhir di bulan tersebut
    const tanggalAkhir = new Date(tahunKalender, nomorBulan, 0).getDate();
    const teksTititiang = `Gedangan, ${tanggalAkhir} ${bulan} ${tahunKalender}`;
    
    const rowTtdAwal = dataExcel.length;
    dataExcel.push(["", "", "", "", "", teksTititiang, "", ""]);
    dataExcel.push(["", "", "Kepala MA Bi'rul Ulum", "", "", "TU Keuangan", "", ""]);
    dataExcel.push([]); // Spasi TTD
    dataExcel.push([]);
    dataExcel.push([]);
    dataExcel.push(["", "", "Yusuf Muzaidi, S.Pd", "", "", "Ririn Jauharin, S.Ak", "", ""]);

    const worksheet = XLSX.utils.aoa_to_sheet(dataExcel);

    // --- MERGER CELLS ---
    worksheet['!merges'] = [
      // Kop Judul (Merger kolom A sampai H)
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
      
      // Baris Total (Merger kolom No s/d Tugas: A sampai D)
      { s: { r: maxRowIndex, c: 0 }, e: { r: maxRowIndex, c: 3 } },

      { s: { r: rowTtdAwal,     c: 5 }, e: { r: rowTtdAwal,     c: 7 } }, // 1. Tanggal
      { s: { r: rowTtdAwal + 1, c: 5 }, e: { r: rowTtdAwal + 1, c: 7 } }, // 2. Jabatan TU Keuangan
      // { s: { r: rowTtdAwal + 2, c: 5 }, e: { r: rowTtdAwal + 4, c: 7 } }, // 3. Ruang TTD (spasi kosong)
      { s: { r: rowTtdAwal + 5, c: 5 }, e: { r: rowTtdAwal + 5, c: 7 } }  // 4. Nama TU Keuangan
    ];

    // --- LEBAR KOLOM (Column Width) ---
    worksheet['!cols'] = [
      { wch: 6 },  // 0: No
      { wch: 10 }, // 1: Kode
      { wch: 30 }, // 2: Nama Guru BBQS
      { wch: 18 }, // 3: Tugas
      { wch: 16 }, // 4: Satuan
      { wch: 10 }, // 5: Vol
      { wch: 18 }, // 6: Jumlah
      { wch: 18 }  // 7: Tanda Tangan
    ];

    // --- PAGE SETUP (LANDSCAPE & A4) ---
    worksheet['!pageSetup'] = {
      orientation: 'landscape',
      paperSize: 9
    };

    // --- MARGINS (TOP 2.5 CM, OTHERS 1 CM) ---
    worksheet['!margins'] = {
      top: 2.5 / 2.54,
      bottom: 1.0 / 2.54,
      left: 1.0 / 2.54,
      right: 1.0 / 2.54,
      header: 0.3,
      footer: 0.3
    };

    // --- ROW HEIGHTS (KOP NORMAL, DATA & TOTAL 30 PT) ---
    const customRows = [];
    for (let r = 0; r < dataExcel.length; r++) {
      if (r <= 3) {
        customRows.push(null); // Kop normal
      } else if (r <= maxRowIndex) {
        customRows.push({ hpt: 30 }); // Header tabel s/d Total = 30pt
      } else {
        customRows.push(null); // Tanda tangan normal
      }
    }
    worksheet['!rows'] = customRows;

    // --- STYLING & FORMAT CELL ---
    const range = XLSX.utils.decode_range(worksheet['!ref']);

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        let cell = worksheet[cellRef];

        if (!cell) {
          worksheet[cellRef] = { t: 's', v: '' };
          cell = worksheet[cellRef];
        }

        // Global Font
        cell.s = {
          font: { name: "Times New Roman", sz: 11 },
          alignment: { vertical: "center" }
        };

        // Styling Kop Surat
        if (R <= 2) {
          cell.s.font.bold = true;
          cell.s.font.sz = 12;
          cell.s.alignment.horizontal = "center";
        }

        // Border Khusus Tabel Data Saja (Tidak mengenai Kop & Tanda Tangan)
        if (R >= 4 && R <= maxRowIndex) {
          cell.s.border = {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          };
        }

        // Styling Header Tabel (Baris ke-5 / Index 4)
        if (R === 4) {
          cell.s.font.bold = true;
          cell.s.alignment.horizontal = "center";
          cell.s.fill = { fgColor: { rgb: "FFF2F2F2" } }; // Warna header abu rapi
        }

        // Styling Isi Data
        if (R >= 5 && R < maxRowIndex) {
          // Center Kolom (No, Kode, Tugas, Vol)
          if (C === 0 || C === 1 || C === 3 || C === 5) {
            cell.s.alignment.horizontal = "center";
          }

          // Accounting Format (Satuan & Jumlah)
          if ((C === 4 || C === 6) && cell.t === 'n') {
            cell.z = '_-"Rp"* #,##0_-;\\-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';
          }

          // TTD Zig-zag
          if (C === 7) {
            const noUrut = R - 4;
            if (noUrut % 2 !== 0) {
              cell.s.alignment.horizontal = "left";
              cell.v = "  " + cell.v;
            } else {
              cell.s.alignment.horizontal = "center";
            }
          }
        }

        // Styling Baris Total
        if (R === maxRowIndex) {
          cell.s.font.bold = true;
          cell.s.fill = { fgColor: { rgb: "FFDCE6F1" } }; // Biru lembut

          if (C === 0) cell.s.alignment.horizontal = "center";

          // Rumus SUM Otomatis
          if (C === 5) {
            cell.f = `SUM(F6:F${maxRowIndex})`;
            cell.s.alignment.horizontal = "center";
          }
          if (C === 6) {
            cell.f = `SUM(G6:G${maxRowIndex})`;
            cell.z = '_-"Rp"* #,##0_-;\\-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';
          }
          if (C === 4) {
            cell.z = '_-"Rp"* #,##0_-;\\-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';
          }
        }

        // Styling Area Tanda Tangan Bawah
        if (R >= rowTtdAwal) {
            cell.s.alignment.horizontal = "center";
            if (R === rowTtdAwal + 5) {
              cell.s.font.bold = true;
              cell.s.font.underline = true; // Garis bawah nama pejabat
            }
        }
      }
    }

    // Simpan & Download File
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "HR BBQS");
    XLSX.writeFile(workbook, `Honorarium_BBQS_${bulan}_${tahun.replace('/', '-')}.xlsx`);

    btnPrint.innerHTML = teksAsli;
    btnPrint.disabled = false;
    if (typeof showToast === 'function') showToast('Berhasil mengunduh Excel BBQS!', 'success');

  } catch (error) {
    console.error("Gagal Excel BBQS:", error);
    btnPrint.innerHTML = teksAsli;
    btnPrint.disabled = false;
    if (typeof showToast === 'function') showToast('Gagal membuat file Excel BBQS', 'error');
  }
}

async function simpanRekapBBQS() {
	try {
		const barisGuru = document.querySelectorAll('.bbqs-row');
		const bulan = document.getElementById('bbqs-filter-bulan').value;
		const tahun = document.getElementById('bbqs-filter-tahun').value;
		const tarifSatuan = parseInt(document.getElementById('bbqs-tarif-satuan').value) || 0;

		if (!bulan || !tahun) {
			tampilkanModalNotif('Gagal!','Bulan dan Tahun Ajaran belum dipilih!','error');
      setTimeout(() => {
        tutupModalNotif()
      }, 3000);
			return;
		}

		// 1. Siapkan wadah untuk dikirim ke Supabase
		let dataPayload = [];

		barisGuru.forEach(baris => {
			const idGuru = baris.getAttribute('data-guru-id');
			const inputVol = baris.querySelector('.input-vol-bbqs');
			const vol = parseInt(inputVol.value) || 0;

			// Kita push semua baris ke payload agar DB dan UI selalu sinkron 100%.
			// (Termasuk jika Bendahara merevisi angka 5 menjadi 0, DB akan ikut jadi 0).
			dataPayload.push({
				guru_id: idGuru,
				bulan: bulan,
				tahun_ajaran: tahun,
				tarif_satuan: tarifSatuan,
				volume: vol,
				total_terima: vol * tarifSatuan
			});
		});

		// Tampilkan indikator loading pada tombol
		const btnSimpan = document.getElementById('btn-bbqs-simpan');
		const teksAsli = btnSimpan.innerHTML;
		btnSimpan.innerHTML = '<i class="ph ph-spinner animate-spin mr-1 text-lg"></i> Menyimpan...';
		btnSimpan.disabled = true;

		// ==========================================
		// 2. PROSES TEMBAK API SUPABASE (UPSERT)
		// ==========================================
		// Param 'onConflict' mencegah error data ganda & memicu Update otomatis
		const {
			error
		} = await supabaseClient
			.from('transaksi_hr_bbqs')
			.upsert(dataPayload, {
				onConflict: 'guru_id,bulan,tahun_ajaran'
			});

		if (error) throw error; // Jika gagal, lempar ke catch

		aturStateBBQS('LOCKED', bulan, tahun);

		btnSimpan.innerHTML = teksAsli; // Kembalikan teks asli untuk nanti
	} catch (err) {
		console.error('Error saat menyimpan HR BBQS:', err);
		tampilkanModalNotif('Gagal!','Gagal menyimpan data ke server: ' + err.message, 'error');
		setTimeout(() => {
			tutupModalNotif()
		}, 3000);

		// Kembalikan tombol simpan ke kondisi awal
		const btnSimpan = document.getElementById('btn-bbqs-simpan');
		if (btnSimpan) {
			btnSimpan.disabled = false;
			btnSimpan.innerHTML = 'Simpan Tabel';
		}
	}
}

async function cekStatusBulanIniBBQS() {
	const bulan = document.getElementById('bbqs-filter-bulan').value;
	const tahun = document.getElementById('bbqs-filter-tahun').value;
	const tbody = document.getElementById('table-body-bbqs');

	if (!bulan || !tahun) {
		aturStateBBQS('KOSONG');
		return;
	}

	// Tampilkan loading di tabel
	tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-gray-500"><i class="ph ph-spinner animate-spin text-2xl mb-2"></i><br>Mengecek data ${bulan}...</td></tr>`;
	aturStateBBQS('KOSONG');

	try {
		const {
			data,
			error
		} = await supabaseClient
			.from('transaksi_hr_bbqs')
			.select('*')
			.eq('bulan', bulan)
			.eq('tahun_ajaran', tahun);

		if (error) throw error;

		if (data && data.length > 0) {
			// JIKA DATA ADA: Generate kerangka tabel dulu, lalu isi angkanya!
			generateTabelBBQS(); // (Fungsi Batch 1)

			// Set Tarif Global dari DB (ambil dari baris pertama)
			document.getElementById('bbqs-tarif-satuan').value = data[0].tarif_satuan || 15000;

			// Masukkan volume ke masing-masing guru
			data.forEach(row => {
				const input = document.querySelector(`.input-vol-bbqs[data-id="${row.guru_id}"]`);
				if (input) input.value = row.volume;
			});

			// Kalkulasi dan Kunci
			kalkulasiBBQS();
			showToast(`Data riwayat gaji BBQS ${bulan} ${tahun} ditemukan!`, 'success');
			aturStateBBQS('LOCKED', bulan, tahun);
		} else {
			// JIKA KOSONG: Bersihkan tabel dan suruh Generate manual
			tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-gray-500 italic">Belum ada data untuk ${bulan} ${tahun}. Silakan klik "Generate Tabel".</td></tr>`;
			aturStateBBQS('KOSONG');
		}
	} catch (err) {
		console.error("Error cek data BBQS:", err);
		tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-red-500">Gagal mengambil data dari server.</td></tr>`;
	}
}

async function salinBulanLaluBBQS() {
	const bulanSekarang = document.getElementById('bbqs-filter-bulan').value;
	const tahunSekarang = document.getElementById('bbqs-filter-tahun').value;

	if (!bulanSekarang || !tahunSekarang) {
		showToast('Pilih Bulan dan Tahun Ajaran saat ini terlebih dahulu!','error');
		return;
	}

	const daftarBulan = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
	const indexBulanIni = daftarBulan.indexOf(bulanSekarang);

	if (indexBulanIni === -1) return;

	if (indexBulanIni === 0) {
		showToast('Juli adalah awal tahun ajaran. Tidak bisa menyalin dari bulan sebelumnya.','error');
		return;
	}

	const bulanLalu = daftarBulan[indexBulanIni - 1];

	// Animasi Loading
	const btnSalin = document.getElementById('btn-bbqs-salin');
	const teksAsli = btnSalin.innerHTML;
	btnSalin.innerHTML = `<i class="ph ph-spinner animate-spin mr-1 text-lg"></i> Mencari...`;
	btnSalin.disabled = true;

	try {
		const {
			data,
			error
		} = await supabaseClient
			.from('transaksi_hr_bbqs')
			.select('guru_id, volume, tarif_satuan')
			.eq('bulan', bulanLalu)
			.eq('tahun_ajaran', tahunSekarang);

		if (error) throw error;

		if (data && data.length > 0) {
			// Jika tabel kosong, generate form-nya dulu
			const tbody = document.getElementById('table-body-bbqs');
			if (tbody.querySelectorAll('.bbqs-row').length === 0) {
				generateTabelBBQS();
			}

			// Timpa angka dari bulan lalu ke form sekarang
			let adaYangDisalin = false;
			document.getElementById('bbqs-tarif-satuan').value = data[0].tarif_satuan || 15000;

			data.forEach(row => {
				const input = document.querySelector(`.input-vol-bbqs[data-id="${row.guru_id}"]`);
				if (input) {
					input.value = row.volume;
					adaYangDisalin = true;
				}
			});

			if (adaYangDisalin) {
				kalkulasiBBQS();
				showToast(`Sukses! Volume jam mengajar dari bulan ${bulanLalu} telah disalin. Silakan cek ulang dan klik Simpan.`,'success');
			}
		} else {
			showToast(`Tidak ada data gaji BBQS yang tersimpan di bulan ${bulanLalu}.`,'error');
		}
	} catch (err) {
		console.error("Error salin data:", err);
		showToast('Terjadi kesalahan saat menyalin data.','error');
	} finally {
		btnSalin.innerHTML = teksAsli;
		btnSalin.disabled = false;
	}
}

function aturStateEkstra(state, bulan = '', tahun = '') {
	const btnSimpan = document.getElementById('btn-ekstra-simpan');
	const btnUnlock = document.getElementById('btn-ekstra-unlock');
	const btnPrint = document.getElementById('btn-ekstra-print');
	const btnGenerate = document.getElementById('btn-ekstra-generate');
	const btnSalin = document.getElementById('btn-ekstra-salin');

	const filterBulan = document.getElementById('ekstra-filter-bulan');
	const filterTahun = document.getElementById('ekstra-filter-tahun');
	const inputTarif = document.getElementById('ekstra-tarif-satuan');
	const badge = document.getElementById('ekstra-status-badge');

	const semuaInputVol = document.querySelectorAll('.input-vol-ekstra');
	const semuaInputNama = document.querySelectorAll('.input-nama-ekstra');

	// Filter bulan dan tahun tetap aktif agar navigasi riwayat tidak terkunci
	if (filterBulan) filterBulan.disabled = false;
	if (filterTahun) filterTahun.disabled = false;

	if (state === 'KOSONG') {
		if (btnSimpan) {
			btnSimpan.classList.remove('hidden');
			btnSimpan.disabled = true;
		}
		if (btnUnlock) btnUnlock.classList.add('hidden');
		if (btnPrint) btnPrint.classList.add('hidden');

		if (btnSalin) btnSalin.classList.remove('hidden');
		if (btnGenerate) {
			btnGenerate.disabled = false;
			btnGenerate.classList.remove('opacity-50', 'cursor-not-allowed');
		}

		if (inputTarif) inputTarif.disabled = false;

		if (badge) {
			badge.innerHTML = 'Belum Disimpan';
			badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-gray-200 text-gray-600";
		}
	} else if (state === 'DRAFT') {
		if (btnSimpan) {
			btnSimpan.classList.remove('hidden');
			btnSimpan.disabled = false;
		}
		if (btnUnlock) btnUnlock.classList.add('hidden');
		if (btnPrint) btnPrint.classList.add('hidden');

		if (btnSalin) btnSalin.classList.remove('hidden');
		if (btnGenerate) {
			btnGenerate.disabled = false;
			btnGenerate.classList.remove('opacity-50', 'cursor-not-allowed');
		}

		if (inputTarif) inputTarif.disabled = false;

		// Buka form volume dan nama ekskul
		semuaInputVol.forEach(input => {
			input.disabled = false;
			input.classList.remove('bg-gray-100', 'cursor-not-allowed');
		});
		semuaInputNama.forEach(input => {
			input.disabled = false;
			input.classList.remove('bg-gray-100', 'cursor-not-allowed');
		});

		if (badge) {
			badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-yellow-500 inline-block mr-1"></span> Mode Edit: ${bulan} ${tahun}`;
			badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 flex items-center shadow-sm";
		}
	} else if (state === 'LOCKED') {
		if (btnSimpan) btnSimpan.classList.add('hidden');
		if (btnUnlock) btnUnlock.classList.remove('hidden');
		if (btnPrint) btnPrint.classList.remove('hidden');

		if (btnSalin) btnSalin.classList.add('hidden');
		if (btnGenerate) {
			btnGenerate.disabled = true;
			btnGenerate.classList.add('opacity-50', 'cursor-not-allowed');
		}

		if (inputTarif) inputTarif.disabled = true;

		// Kunci input volume dan nama ekskul
		semuaInputVol.forEach(input => {
			input.disabled = true;
			input.classList.add('bg-gray-100', 'cursor-not-allowed');
		});
		semuaInputNama.forEach(input => {
			input.disabled = true;
			input.classList.add('bg-gray-100', 'cursor-not-allowed');
		});

		if (badge) {
			badge.innerHTML = `<i class="ph ph-check-circle mr-1 text-lg"></i> Tersimpan: ${bulan} ${tahun}`;
			badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 flex items-center shadow-sm";
		}
	}
}

function generateTabelEkstra() {
	const tbody = document.getElementById('table-body-ekstra');
	const bulan = document.getElementById('ekstra-filter-bulan').value;
	const tahun = document.getElementById('ekstra-filter-tahun').value;

	if (!bulan || !tahun) {
		tampilkanModalNotif("Gagal!","Pilih Tahun Ajaran dan Bulan terlebih dahulu!","error");
		setTimeout(() => {
			tutupModalNotif()
		}, 3000);
		return;
	}

	// 1. Filter guru khusus pembina ekstrakurikuler
	const guruEkstra = dbMasterGuru.filter(g => g.is_ekstra === true && g.is_active !== false);

	// 2. Urutkan berdasarkan Nama A-Z
	guruEkstra.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));

	if (guruEkstra.length === 0) {
		tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-red-500 font-medium">Tidak ada data Pembina dengan status Ekstrakurikuler aktif!</td></tr>`;
		return;
	}

	let html = '';
	guruEkstra.forEach((guru, index) => {
		// Ambil nama ekstra dari database guru, jika tidak ada fallback ke tugas
		const namaEkstra = guru.nama_ekstra || guru.tugas || 'Ekstrakurikuler';

		html += `
        <tr class="hover:bg-indigo-50 transition-colors group ekstra-row" 
            data-guru-id="${guru.id}" 
            data-nama-ekstra="${namaEkstra}">
            <td class="p-3 border border-gray-200 text-center text-sm">${index + 1}</td>
            <td class="p-3 border border-gray-200 text-center text-xs font-bold text-gray-600">${guru.kode_guru || '-'}</td>
            <td class="p-3 border border-gray-200 font-medium text-sm text-gray-800">${guru.nama}</td>
            <td class="p-2 border border-gray-200 bg-white">
							<input type="text" 
								class="input-nama-ekstra w-full text-center border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 p-1.5 text-xs font-medium text-gray-700" 
								data-id="${guru.id}" 
								placeholder="Nama Ekskul (mis: Pramuka)"
								value="${guru.tugas && guru.tugas.toLowerCase().includes('ekstra') ? '' : (guru.tugas || '')}">
						</td>
            
            <!-- Tarif Satuan -->
            <td class="p-3 border border-gray-200 text-center text-gray-500 text-sm">
                Rp <span id="ekstra-satuan-text-${guru.id}">0</span>
            </td>
            
            <!-- Input Volume Jam / Pertemuan -->
            <td class="p-2 border border-gray-200 bg-white">
                <input type="number" min="0" 
                       class="input-vol-ekstra w-full text-center border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 p-1.5 text-sm" 
                       data-id="${guru.id}" placeholder="0">
            </td>
            
            <!-- Total Baris -->
            <td class="p-3 border border-gray-200 text-right font-bold text-indigo-700 bg-indigo-50/30">
                Rp <span id="total-baris-ekstra-${guru.id}">0</span>
            </td>
            
            <!-- Kolom Tanda Tangan Cetak -->
            <td class="p-3 border border-gray-200 text-center text-gray-300 text-xs hidden print:table-cell">
                ${index + 1} ...................
            </td>
        </tr>`;
	});

	tbody.innerHTML = html;

	// Pasang listener input & jalankan kalkulasi perdana
	pasangRadarKalkulasiEkstra();
	kalkulasiEkstra();
}

function pasangRadarKalkulasiEkstra() {
	const semuaInputVol = document.querySelectorAll('.input-vol-ekstra');
	semuaInputVol.forEach(input => {
		input.removeEventListener('input', kalkulasiEkstra);
		input.addEventListener('input', kalkulasiEkstra);
	});

	// Radar jika tarif satuan diubah
	const inputTarif = document.getElementById('ekstra-tarif-satuan');
	if (inputTarif) {
		inputTarif.removeEventListener('input', kalkulasiEkstra);
		inputTarif.addEventListener('input', kalkulasiEkstra);
	}
}

function kalkulasiEkstra() {
	const tarifSatuan = parseInt(document.getElementById('ekstra-tarif-satuan')?.value) || 0;
	const barisGuru = document.querySelectorAll('.ekstra-row');

	let totalVolSemua = 0;
	let grandTotalSemua = 0;

	barisGuru.forEach(baris => {
		const idGuru = baris.getAttribute('data-guru-id');
		const inputVol = baris.querySelector('.input-vol-ekstra');
		const vol = parseInt(inputVol?.value) || 0;

		const totalBaris = vol * tarifSatuan;
		totalVolSemua += vol;
		grandTotalSemua += totalBaris;

		// Update teks satuan per baris
		const textSatuan = document.getElementById(`ekstra-satuan-text-${idGuru}`);
		if (textSatuan) textSatuan.innerText = tarifSatuan.toLocaleString('id-ID');

		// Update total baris
		const textTotalBaris = document.getElementById(`total-baris-ekstra-${idGuru}`);
		if (textTotalBaris) textTotalBaris.innerText = totalBaris.toLocaleString('id-ID');
	});

	// Update baris tfoot / total bawah
	const elTotalVol = document.getElementById('ekstra-total-vol');
	if (elTotalVol) elTotalVol.innerText = totalVolSemua;

	const elGrandTotal = document.getElementById('ekstra-total-jumlah');
	if (elGrandTotal) elGrandTotal.innerText = `Rp ${grandTotalSemua.toLocaleString('id-ID')}`;
}

function bukaKunciEkstra() {
	const bulan = document.getElementById('ekstra-filter-bulan').value;
	const tahun = document.getElementById('ekstra-filter-tahun').value;

	aturStateEkstra('DRAFT', bulan, tahun);
}

function unduhExcelEkstra() {
	const btnPrint = document.getElementById('btn-ekstra-print');
	const teksAsli = btnPrint ? btnPrint.innerHTML : 'Unduh Excel';
	if (btnPrint) {
		btnPrint.innerHTML = '<i class="ph ph-spinner-gap animate-spin mr-1.5 text-lg"></i> Menyusun Excel...';
		btnPrint.disabled = true;
	}

	try {
		const bulan = (document.getElementById('ekstra-filter-bulan')?.value || 'Bulan');
		const tahun = document.getElementById('ekstra-filter-tahun')?.value || 'Tahun';
		const tarifSatuanGlobal = parseInt(document.getElementById('ekstra-tarif-satuan')?.value) || 0;

		const dataExcel = [];

		// 1. Kop Surat
		dataExcel.push([`DAFTAR HONORARIUM BULAN ${bulan.toUpperCase()}`]);
		dataExcel.push(["PEMBINA EKSTRAKURIKULER MADRASAH ALIYAH BI'RUL ULUM"]);
		dataExcel.push([`DI YAYASAN PENDIDIKAN ISLAM BI'RUL ULUM TA. ${tahun.toUpperCase()}`]);
		dataExcel.push([]); // Baris kosong spasi (Index 3)

		// 2. Header Kolom (Index 4)
		dataExcel.push([
			"No",
			"Kode",
			"Nama Pembina",
			"Ekstrakurikuler",
			"Satuan",
			"Vol",
			"Jumlah",
			"Tanda Tangan"
		]);

		let sumVol = 0;
		let sumJumlah = 0;

		// 3. Tarik Data dari Tabel HTML
		const barisGuru = document.querySelectorAll('.ekstra-row');
		barisGuru.forEach((baris, index) => {
			const kodeGuru = baris.querySelector('td:nth-child(2)')?.innerText.trim() || '-';
			const namaGuru = baris.querySelector('td:nth-child(3)')?.innerText.trim() || '';
			
			// Ambil nama ekstra dari input atau atribut
			const inputNama = baris.querySelector('.input-nama-ekstra');
			const namaEkstra = inputNama ? inputNama.value.trim() : (baris.getAttribute('data-nama-ekstra') || 'Ekstrakurikuler');

			const inputVol = baris.querySelector('.input-vol-ekstra');
			const vol = inputVol ? (parseInt(inputVol.value) || 0) : 0;
			const jumlah = vol * tarifSatuanGlobal;

			sumVol += vol;
			sumJumlah += jumlah;

			dataExcel.push([
				index + 1,
				kodeGuru,
				namaGuru,
				namaEkstra,
				tarifSatuanGlobal,
				vol,
				jumlah,
				`${index + 1}`
			]);
		});

		// 4. Baris Total (Kunci index sebelum TTD)
		dataExcel.push([
			"JUMLAH", "", "", "",
			tarifSatuanGlobal,
			sumVol,
			sumJumlah,
			""
		]);
		const maxRowIndex = dataExcel.length - 1;

		// 5. Area Tanda Tangan & Tanggal Otomatis Akhir Bulan
		const daftarBulan = {
			'januari': 1, 'februari': 2, 'maret': 3, 'april': 4,
			'mei': 5, 'juni': 6, 'juli': 7, 'agustus': 8,
			'september': 9, 'oktober': 10, 'november': 11, 'desember': 12
		};
		const namaBulanKecil = (bulan || '').toLowerCase().trim();
		const nomorBulan = daftarBulan[namaBulanKecil] || new Date().getMonth() + 1;

		const pecahanTahun = tahun.split('/');
		let tahunKalender = parseInt(pecahanTahun[0]) || new Date().getFullYear();
		if (nomorBulan <= 6 && pecahanTahun[1]) {
			tahunKalender = parseInt(pecahanTahun[1].length === 2 ? '20' + pecahanTahun[1] : pecahanTahun[1]);
		}

		const tanggalAkhir = new Date(tahunKalender, nomorBulan, 0).getDate();
		const teksTititiang = `Gedangan, ${tanggalAkhir} ${bulan} ${tahunKalender}`;

		dataExcel.push([]);
		dataExcel.push([]);

		const rowTtdAwal = dataExcel.length;
		dataExcel.push(["", "", "Kepala MA Bi'rul Ulum", "", "", teksTititiang, "", ""]);
		dataExcel.push(["", "", "", "", "", "TU Keuangan", "", ""]);
		dataExcel.push([]);
		dataExcel.push([]);
		dataExcel.push([]);
		dataExcel.push(["", "", "Yusuf Muzaidi, S.Pd", "", "", "Ririn Jauharin, S.Ak", "", ""]);

		const worksheet = XLSX.utils.aoa_to_sheet(dataExcel);

		// --- MERGER CELLS ---
		worksheet['!merges'] = [
			// Kop Judul
			{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
			{ s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
			{ s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },

			// Baris Total (Merger kolom A sampai D)
			{ s: { r: maxRowIndex, c: 0 }, e: { r: maxRowIndex, c: 3 } },

			// Merger Area TU Keuangan (Kolom 5 s/d 7: F, G, H)
			{ s: { r: rowTtdAwal,     c: 5 }, e: { r: rowTtdAwal,     c: 7 } },
			{ s: { r: rowTtdAwal + 1, c: 5 }, e: { r: rowTtdAwal + 1, c: 7 } },
			{ s: { r: rowTtdAwal + 5, c: 5 }, e: { r: rowTtdAwal + 5, c: 7 } }
		];

		// --- LEBAR KOLOM ---
		worksheet['!cols'] = [
			{ wch: 6 },  // No
			{ wch: 10 }, // Kode
			{ wch: 30 }, // Nama Pembina
			{ wch: 22 }, // Ekstrakurikuler
			{ wch: 16 }, // Satuan
			{ wch: 10 }, // Vol
			{ wch: 18 }, // Jumlah
			{ wch: 18 }  // Tanda Tangan
		];

		// --- PAGE SETUP (LANDSCAPE & A4) ---
		worksheet['!pageSetup'] = {
			orientation: 'landscape',
			paperSize: 9
		};

		// --- MARGINS (TOP 2.5 CM, OTHERS 1 CM) ---
		worksheet['!margins'] = {
			top: 2.5 / 2.54,
			bottom: 1.0 / 2.54,
			left: 1.0 / 2.54,
			right: 1.0 / 2.54,
			header: 0.3,
			footer: 0.3
		};

		// --- ROW HEIGHTS (KOP NORMAL, DATA & TOTAL 30 PT) ---
		const customRows = [];
		for (let r = 0; r < dataExcel.length; r++) {
			if (r <= 3) {
				customRows.push(null);
			} else if (r <= maxRowIndex) {
				customRows.push({ hpt: 30 });
			} else {
				customRows.push(null);
			}
		}
		worksheet['!rows'] = customRows;

		// --- STYLING ISI CELL ---
		const range = XLSX.utils.decode_range(worksheet['!ref']);

		for (let R = range.s.r; R <= range.e.r; ++R) {
			for (let C = range.s.c; C <= range.e.c; ++C) {
				const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
				let cell = worksheet[cellRef];

				if (!cell) {
					worksheet[cellRef] = { t: 's', v: '' };
					cell = worksheet[cellRef];
				}

				cell.s = {
					font: { name: "Times New Roman", sz: 11 },
					alignment: { vertical: "center" }
				};

				// Style Kop
				if (R <= 2) {
					cell.s.font.bold = true;
					cell.s.font.sz = 12;
					cell.s.alignment.horizontal = "center";
				}

				// Border Tabel Data
				if (R >= 4 && R <= maxRowIndex) {
					cell.s.border = {
						top: { style: "thin", color: { rgb: "000000" } },
						bottom: { style: "thin", color: { rgb: "000000" } },
						left: { style: "thin", color: { rgb: "000000" } },
						right: { style: "thin", color: { rgb: "000000" } }
					};
				}

				// Header Tabel
				if (R === 4) {
						cell.s.font.bold = true;
						cell.s.alignment.horizontal = "center";
						cell.s.fill = { fgColor: { rgb: "FFF2F2F2" } };
				}

				// Baris Isi Data
				if (R >= 5 && R < maxRowIndex) {
					if (C === 0 || C === 1 || C === 3 || C === 5) {
						cell.s.alignment.horizontal = "center";
					}

					if ((C === 4 || C === 6) && cell.t === 'n') {
						cell.z = '_-"Rp"* #,##0_-;\\-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';
					}

					if (C === 7) {
						const noUrut = R - 4;
						if (noUrut % 2 !== 0) {
							cell.s.alignment.horizontal = "left";
							cell.v = "  " + cell.v;
						} else {
							cell.s.alignment.horizontal = "center";
						}
					}
				}

				// Baris Total
				if (R === maxRowIndex) {
					cell.s.font.bold = true;
					cell.s.fill = { fgColor: { rgb: "FFDCE6F1" } };

					if (C === 0) cell.s.alignment.horizontal = "center";

					if (C === 5) {
						cell.f = `SUM(F6:F${maxRowIndex})`;
						cell.s.alignment.horizontal = "center";
					}
					if (C === 6) {
						cell.f = `SUM(G6:G${maxRowIndex})`;
						cell.z = '_-"Rp"* #,##0_-;\\-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';
					}
					if (C === 4) {
						cell.z = '_-"Rp"* #,##0_-;\\-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';
					}
				}

				// Area Tanda Tangan
				if (R >= rowTtdAwal) {
					cell.s.alignment.horizontal = "center";
					if (R === rowTtdAwal + 5) {
						cell.s.font.bold = true;
						cell.s.font.underline = true;
					}
				}
			}
		}

		// Export File
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "HR Ekstra");
		XLSX.writeFile(workbook, `Honorarium_Ekstra_${bulan}_${tahun.replace('/', '-')}.xlsx`);

		if (btnPrint) {
			btnPrint.innerHTML = teksAsli;
			btnPrint.disabled = false;
		}
		if (typeof showToast === 'function') showToast('Berhasil mengunduh Excel HR Ekstrakurikuler!', 'success');

	} catch (error) {
			console.error("Gagal Excel Ekstra:", error);
			if (btnPrint) {
					btnPrint.innerHTML = teksAsli;
					btnPrint.disabled = false;
			}
			if (typeof showToast === 'function') showToast('Gagal membuat file Excel Ekstrakurikuler', 'error');
	}
}

async function simpanRekapEkstra() {
	const btnSimpan = document.getElementById('btn-ekstra-simpan');
	const teksAsli = btnSimpan ? btnSimpan.innerHTML : 'Simpan Tabel';

	try {
		const barisGuru = document.querySelectorAll('.ekstra-row');
		const bulan = document.getElementById('ekstra-filter-bulan').value;
		const tahun = document.getElementById('ekstra-filter-tahun').value;
		const tarifSatuan = parseInt(document.getElementById('ekstra-tarif-satuan').value) || 0;

		if (!bulan || !tahun) {
			tampilkanModalNotif("Gagal!","Bulan dan Tahun Ajaran belum dipilih!","error");
			setTimeout(() => {
				tutupModalNotif()
			}, 3000);
			return;
		}

		let dataPayload = [];

		barisGuru.forEach(baris => {
			const idGuru = baris.getAttribute('data-guru-id');
			const inputVol = baris.querySelector('.input-vol-ekstra');
			const inputNama = baris.querySelector('.input-nama-ekstra');

			const vol = parseInt(inputVol?.value) || 0;
			const namaEkstra = inputNama ? inputNama.value.trim() : 'Ekstrakurikuler';

			dataPayload.push({
				guru_id: idGuru,
				bulan: bulan,
				tahun_ajaran: tahun,
				nama_ekstra: namaEkstra,
				tarif_satuan: tarifSatuan,
				volume: vol,
				total_terima: vol * tarifSatuan
			});
		});

		if (btnSimpan) {
			btnSimpan.innerHTML = '<i class="ph ph-spinner animate-spin mr-1 text-lg"></i> Menyimpan...';
			btnSimpan.disabled = true;
		}

		// Simpan / update ke database Supabase
		const {
			error
		} = await supabaseClient
			.from('transaksi_hr_ekstra')
			.upsert(dataPayload, {
				onConflict: 'guru_id,bulan,tahun_ajaran'
			});

		if (error) throw error;

		// Kunci tampilan form
		aturStateEkstra('LOCKED', bulan, tahun);

		if (btnSimpan) btnSimpan.innerHTML = teksAsli;
		if (typeof showToast === 'function') showToast('Data HR Ekstrakurikuler berhasil disimpan!', 'success');

	} catch (err) {
		console.error('Error simpan HR Ekstra:', err);
		tampilkanModalNotif('Gagal!','Gagal menyimpan data ke server: ' + err.message, 'error');
		setTimeout(() => {
			tutupModalNotif()
		}, 3000);

		if (btnSimpan) {
			btnSimpan.disabled = false;
			btnSimpan.innerHTML = teksAsli;
		}
	}
}

async function cekStatusBulanIniEkstra() {
	const bulan = document.getElementById('ekstra-filter-bulan')?.value;
	const tahun = document.getElementById('ekstra-filter-tahun')?.value;
	const tbody = document.getElementById('table-body-ekstra');

	if (!bulan || !tahun || !tbody) return;

	// Tampilkan indikator loading di tabel
	tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-gray-500"><i class="ph ph-spinner animate-spin text-2xl mb-2"></i><br>Mengecek data Ekstrakurikuler ${bulan}...</td></tr>`;
	aturStateEkstra('KOSONG');

	try {
		const {
			data,
			error
		} = await supabaseClient
			.from('transaksi_hr_ekstra')
			.select('*')
			.eq('bulan', bulan)
			.eq('tahun_ajaran', tahun);

		if (error) throw error;

		if (data && data.length > 0) {
			// Render kerangka tabel guru
			generateTabelEkstra();

			// Pasang nilai tarif satuan dari data tersimpan
			const inputTarif = document.getElementById('ekstra-tarif-satuan');
			if (inputTarif) inputTarif.value = data[0].tarif_satuan || 0;

			// Masukkan volume dan nama ekstra ke input masing-masing guru
			data.forEach(row => {
				const inputVol = document.querySelector(`.input-vol-ekstra[data-id="${row.guru_id}"]`);
				const inputNama = document.querySelector(`.input-nama-ekstra[data-id="${row.guru_id}"]`);

				if (inputVol) inputVol.value = row.volume;
				if (inputNama && row.nama_ekstra) inputNama.value = row.nama_ekstra;
			});

			// Jalankan kalkulasi angka dan kunci UI
			kalkulasiEkstra();
			showToast(`Data riwayat gaji Ekstra ${bulan} ${tahun} ditemukan!`, 'success');
			aturStateEkstra('LOCKED', bulan, tahun);
		} else {
			// Jika belum ada data
			tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-gray-500 italic">Belum ada data untuk ${bulan} ${tahun}. Silakan klik "Generate Tabel".</td></tr>`;
			aturStateEkstra('KOSONG');
		}
	} catch (err) {
		console.error("Error cek data HR Ekstra:", err);
		tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-red-500">Gagal mengambil data dari server.</td></tr>`;
	}
}

async function salinBulanLaluEkstra() {
	const bulanSekarang = document.getElementById('ekstra-filter-bulan')?.value;
	const tahunSekarang = document.getElementById('ekstra-filter-tahun')?.value;

	if (!bulanSekarang || !tahunSekarang) {
		showToast('Pilih Bulan dan Tahun Ajaran saat ini terlebih dahulu!','error');
		return;
	}

	const daftarBulan = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
	const indexBulanIni = daftarBulan.indexOf(bulanSekarang);

	if (indexBulanIni === -1) return;

	if (indexBulanIni === 0) {
		showToast('Juli adalah awal tahun ajaran. Tidak bisa menyalin dari bulan sebelumnya.','error');
		return;
	}

	const bulanLalu = daftarBulan[indexBulanIni - 1];

	const btnSalin = document.getElementById('btn-ekstra-salin');
	const teksAsli = btnSalin ? btnSalin.innerHTML : 'Salin Bulan Lalu';
	if (btnSalin) {
		btnSalin.innerHTML = `<i class="ph ph-spinner animate-spin mr-1 text-lg"></i> Menyalin...`;
		btnSalin.disabled = true;
	}

	try {
		const {
			data,
			error
		} = await supabaseClient
			.from('transaksi_hr_ekstra')
			.select('guru_id, volume, nama_ekstra, tarif_satuan')
			.eq('bulan', bulanLalu)
			.eq('tahun_ajaran', tahunSekarang);

		if (error) throw error;

		if (data && data.length > 0) {
			const tbody = document.getElementById('table-body-ekstra');
			if (tbody && tbody.querySelectorAll('.ekstra-row').length === 0) {
				generateTabelEkstra();
			}

			// Set tarif dari bulan lalu jika ada
			const inputTarif = document.getElementById('ekstra-tarif-satuan');
			if (inputTarif) inputTarif.value = data[0].tarif_satuan || 0;

			let adaYangDisalin = false;

			data.forEach(row => {
				const inputVol = document.querySelector(`.input-vol-ekstra[data-id="${row.guru_id}"]`);
				const inputNama = document.querySelector(`.input-nama-ekstra[data-id="${row.guru_id}"]`);

				if (inputVol) {
					inputVol.value = row.volume;
					adaYangDisalin = true;
				}
				if (inputNama && row.nama_ekstra) {
					inputNama.value = row.nama_ekstra;
				}
			});

			if (adaYangDisalin) {
				kalkulasiEkstra();
				if (typeof showToast === 'function') {
					showToast(`Data volume & nama ekskul dari bulan ${bulanLalu} berhasil disalin!`, 'success');
				} else {
					showToast(`Sukses menyalin data dari bulan ${bulanLalu}. Silakan cek ulang lalu klik Simpan.`, 'success');
				}
			}
		} else {
			showToast(`Tidak ada data HR Ekstra yang tersimpan di bulan ${bulanLalu}.`,'error');
		}
	} catch (err) {
		console.error("Error salin data HR Ekstra:", err);
		showToast("Terjadi kesalahan saat menyalin data.","error");
	} finally {
		if (btnSalin) {
			btnSalin.innerHTML = teksAsli;
			btnSalin.disabled = false;
		}
	}
}

function setupHREkstraBBQSEvents() {
	// ==========================================
	// 1. RADAR UNTUK NAVIGASI SUB-TAB (BBQS vs EKSTRA)
	// ==========================================
	const tabButtons = document.querySelectorAll('.btn-eks-tab');
	const areaBbqs = document.getElementById('hr-area-bbqs');
	const areaEkstra = document.getElementById('hr-area-ekstra');

	tabButtons.forEach(function(btn) {
		btn.addEventListener('click', function() {
			// Ambil target tab
			const target = this.getAttribute('data-ekstab');

			// Reset styling semua tombol
			tabButtons.forEach(b => {
				b.classList.remove('border-indigo-600', 'text-indigo-600');
				b.classList.add('border-transparent', 'text-gray-500');
			});

			// Aktifkan tombol yang diklik
			this.classList.remove('border-transparent', 'text-gray-500');
			this.classList.add('border-indigo-600', 'text-indigo-600');

			if (target === 'ekstra') {
				areaEkstra.classList.remove('hidden');
				areaEkstra.classList.add('flex');
				areaBbqs.classList.add('hidden');
				areaBbqs.classList.remove('flex');
			} else {
				areaEkstra.classList.add('hidden');
				areaEkstra.classList.remove('flex');
				areaBbqs.classList.remove('hidden');
				areaBbqs.classList.add('flex');
			}
		});
	});

	// ==========================================
	// 2. RADAR EVENT UNTUK HR BBQS
	// ==========================================
	const btnGenerateBBQS = document.getElementById('btn-bbqs-generate');
	const btnSalinBBQS = document.getElementById('btn-bbqs-salin');
	const btnSimpanBBQS = document.getElementById('btn-bbqs-simpan');
	const btnEditBBQS = document.getElementById('btn-bbqs-unlock'); // Tombol Buka Kunci
	const filterBulanBBQS = document.getElementById('bbqs-filter-bulan');
	const filterTahunBBQS = document.getElementById('bbqs-filter-tahun');

	if (btnGenerateBBQS) {
		btnGenerateBBQS.addEventListener('click', function() {
			// Panggil fungsi render tabel BBQS (nanti Anda buat)
			generateTabelBBQS();
			aturStateBBQS('DRAFT');
		});
	}

	if (btnSalinBBQS) {
		btnSalinBBQS.addEventListener('click', function() {
			salinBulanLaluBBQS();
			aturStateBBQS('DRAFT');
		});
	}

	if (btnEditBBQS) {
		btnEditBBQS.addEventListener('click', function() {
			bukaKunciBBQS();
		});
	}

	if (filterBulanBBQS) filterBulanBBQS.addEventListener('change', cekStatusBulanIniBBQS);
	if (filterTahunBBQS) filterTahunBBQS.addEventListener('change', cekStatusBulanIniBBQS);

	if (btnSimpanBBQS) {
		btnSimpanBBQS.addEventListener('click', async function(e) {
			e.preventDefault();
			const bulan = document.getElementById('bbqs-filter-bulan').value;
			// Pastikan Anda memiliki fungsi tampilkanKonfirmasi di file Anda
			const setuju = await tampilkanKonfirmasi(
				'Simpan Data BBQS',
				`Anda yakin ingin menyimpan rekapitulasi HR BBQS untuk bulan ${bulan}?`,
				'Ya, Simpan',
				'bg-blue-600 hover:bg-blue-700'
			);
			if (setuju) {
				simpanRekapBBQS();
			}
		});
	}

	// ==========================================
	// 3. RADAR EVENT UNTUK HR EKSTRA
	// ==========================================
	const btnGenerateEks = document.getElementById('btn-ekstra-generate');
	const btnSalinEks = document.getElementById('btn-ekstra-salin');
	const btnSimpanEks = document.getElementById('btn-ekstra-simpan');
	const btnEditEks = document.getElementById('btn-ekstra-unlock');
	const filterBulanEks = document.getElementById('ekstra-filter-bulan');
	const filterTahunEks = document.getElementById('ekstra-filter-tahun');

	if (btnGenerateEks) {
		btnGenerateEks.addEventListener('click', function() {
			generateTabelEkstra();
			aturStateEkstra('DRAFT');
			console.log("Generate Ekstra diklik");
		});
	}

	if (btnSalinEks) {
		btnSalinEks.addEventListener('click', function() {
			salinBulanLaluEkstra();
		});
	}

	if (btnEditEks) {
		btnEditEks.addEventListener('click', function() {
			bukaKunciEkstra();
		});
	}

	if (filterBulanEks) filterBulanEks.addEventListener('change', cekStatusBulanIniEkstra);
	if (filterTahunEks) filterTahunEks.addEventListener('change', cekStatusBulanIniEkstra);

	if (btnSimpanEks) {
		btnSimpanEks.addEventListener('click', async function(e) {
			e.preventDefault();
			const bulan = document.getElementById('ekstra-filter-bulan').value;
			const setuju = await tampilkanKonfirmasi(
				'Simpan Data Ekstrakurikuler',
				`Anda yakin ingin menyimpan rekapitulasi HR Ekstrakurikuler untuk bulan ${bulan}?`,
				'Ya, Simpan',
				'bg-emerald-600 hover:bg-emerald-700'
			);
			if (setuju) {
				simpanRekapEkstra();
			}
		});
	}

	// ==========================================
	// 4. RADAR UNTUK UNDUH / PRINT (BBQS & EKSTRA)
	// ==========================================
	const btnPrintBBQS = document.getElementById('btn-bbqs-print');
	if (btnPrintBBQS) {
		btnPrintBBQS.replaceWith(btnPrintBBQS.cloneNode(true));
		const btnBaruBBQS = document.getElementById('btn-bbqs-print');
		btnBaruBBQS.className = "hidden px-5 py-2 bg-green-600 text-white hover:bg-green-700 font-medium rounded-lg transition-colors flex items-center text-sm shadow-sm";
		btnBaruBBQS.innerHTML = `<i class="ph ph-microsoft-excel-logo mr-1.5 text-lg"></i> Unduh Excel`;
		btnBaruBBQS.addEventListener('click', function() {
			unduhExcelBBQS();
		});
	}

	const btnPrintEks = document.getElementById('btn-ekstra-print');
	if (btnPrintEks) {
		btnPrintEks.replaceWith(btnPrintEks.cloneNode(true));
		const btnBaruEks = document.getElementById('btn-ekstra-print');
		btnBaruEks.className = "hidden px-5 py-2 bg-green-600 text-white hover:bg-green-700 font-medium rounded-lg transition-colors flex items-center text-sm shadow-sm";
		btnBaruEks.innerHTML = `<i class="ph ph-microsoft-excel-logo mr-1.5 text-lg"></i> Unduh Excel`;
		btnBaruEks.addEventListener('click', function() {
			unduhExcelEkstra();
		});
	}
}