// HR Tendik Module - Batch 1

// DUMMY DATABASE GURU (Sementara)
dbMasterGuru = [{
		id: 'G01',
		kode: 'YM',
		nama: 'Yusuf Muzaidi, S.Pd.',
		jabatan: 'Kepala Madrasah',
		kategori: 'Tendik'
	},
	{
		id: 'G02',
		kode: 'MI',
		nama: 'H. Moh. Ikhwan, S.Pd.',
		jabatan: 'Wk. Kurikulum',
		kategori: 'Tendik'
	},
	{
		id: 'G03',
		kode: 'LF',
		nama: 'Lailil Farohah, S.S.',
		jabatan: 'Wk. Kesiswaan',
		kategori: 'Tendik'
	},
	{
		id: 'G04',
		kode: 'RF',
		nama: 'Ainur Rofiq, M.Pd.I.',
		jabatan: 'BK',
		kategori: 'Tendik'
	},
	{
		id: 'G05',
		kode: 'DA',
		nama: 'Dahlan Asy\'ari, S.Pd.',
		jabatan: 'TU Operator & Pembina Osis',
		kategori: 'Tendik'
	}
	// Saya buat 5 data dulu sebagai contoh agar tidak terlalu panjang. 
	// Nanti sistem akan otomatis mengikuti berapapun jumlah datanya!
];

function generateTabelHR() {
	const tbody = document.getElementById('table-body-hr');
	const bulan = document.getElementById('hr-filter-bulan').value;
	const tahun = document.getElementById('hr-filter-tahun').value;

	// Ambil data guru yang khusus kategori 'Tendik'
	const guruTendik = dbMasterGuru.filter(g => g.is_tendik === true && g.is_active !== false);

	const bobotJabatan = {
		'kepala madrasah': 1,
    'waka kurikulum': 2,
    'waka kesiswaan': 3,
    'waka sarpras': 4,
    'tu operator': 5,
    'kepala perpustakaan': 6,
    'wali kelas x e1': 7,
    'wali kelas x e2': 8,
    'wali kelas xi f1': 9,
    'wali kelas xi f2': 10,
    'wali kelas xii ipa': 11,
    'wali kelas xii ips': 12,
    'guru': 13,
    'tu keuangan': 14,
    'tu administrasi': 15,
  };

	guruTendik.sort((a, b) => {
		const jabatanA = (a.jabatan || 'guru').toLowerCase().trim();
		const jabatanB = (b.jabatan || 'guru').toLowerCase().trim();

		// Ambil angka kasta, jika jabatan tidak ada di list atas, beri angka 99 (paling bawah)
		const nilaiA = bobotJabatan[jabatanA] || 99;
		const nilaiB = bobotJabatan[jabatanB] || 99;

		// Jika kastanya beda, urutkan berdasarkan kasta
		if (nilaiA !== nilaiB) {
			return nilaiA - nilaiB;
		}

		// Jika jabatannya sama persis (misal sama-sama "guru"), urutkan berdasarkan Nama (A-Z)
		return (a.nama || '').localeCompare(b.nama || '');
	});

	if (guruTendik.length === 0) {
		tbody.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-red-500 font-medium">Data Master Guru Kosong!</td></tr>`;
		return;
	}
  
  // Persiapan untuk hitung otomatis Masa Kerja
  let tahunBerjalan = new Date().getFullYear(); 
  if (tahun) {
    const matchTahun = tahun.match(/\d{4}/);
    if (matchTahun) tahunBerjalan = parseInt(matchTahun[0]);
  }
	let html = '';
	guruTendik.forEach((guru, index) => {
    // Otomatisasi Perhitungan Masa Kerja
    let volMasaKerja = 0;
    if (guru.tahun_masuk && guru.tahun_masuk > 1900) {
      volMasaKerja = (tahunBerjalan - guru.tahun_masuk) + 1;
      
      // Jaga-jaga: Jika guru baru masuk tahun ini, MK-nya 0. 
      // (Bisa Anda ganti menjadi 1 jika aturan madrasah Anda menghitung tahun pertama sebagai 1)
      if (volMasaKerja < 0) volMasaKerja = 0; 
    }

		const tahunAjaranPayroll = document.getElementById('filter-tahun-ajaran')?.value || globalTahunAktif || tahun;
    const duitTunjangan = hitungTunjanganOtomatis(guru.jabatan, guru.tugas_tambahan, tahunAjaranPayroll);
    
    // (Jika sewaktu-waktu guru tidak punya tunjangan, pastikan minimal 0 bukan NaN)
    const nominalTunjanganAuto = duitTunjangan.total || 0;
		// Kita beri ID unik (data-id) pada setiap input agar besok di Batch 3 
		// JavaScript tahu input mana milik guru siapa saat menghitung otomatis.
		html += `
      <tr class="hover:bg-indigo-50 transition-colors group hr-row" data-guru-id="${guru.id}">
        <td class="p-3 border border-gray-200 text-center text-sm">${index + 1}</td>
        <td class="p-3 border border-gray-200 font-medium text-sm">
          <span class="text-xs font-bold bg-gray-200 px-1.5 py-0.5 rounded mr-1">${guru.kode_guru}</span> ${guru.nama}
        </td>
        <td class="p-3 border border-gray-200 text-xs">${ [guru.jabatan, guru.tugas_tambahan].filter(Boolean).join(' & ') || '-' }</td>
        
        <!-- Kolom 1: Input Vol MK (Sekarang terisi OTOMATIS dan dikunci / readonly) -->
        <td class="p-2 border border-gray-200 bg-white">
          <input type="number" min="0" class="input-vol-mk w-full text-center border border-gray-300 rounded bg-gray-50 p-1.5 text-sm text-gray-500" data-id="${guru.id}" value="${volMasaKerja}" readonly tabindex="-1">
        </td>
        
        <!-- Kolom 2: Hasil Uang MK (Readonly Text) -->
        <td class="p-3 border border-gray-200 text-right text-gray-500 text-sm">
          Rp <span id="hasil-mk-${guru.id}">0</span>
        </td>
        
        <!-- Kolom 3: Input Tunjangan Jabatan (Manual) -->
        <td class="p-2 border border-gray-200 bg-white relative">
          <!-- Input angka default terisi dari Master Tarif -->
          <input type="number" min="0" class="input-tunj-jabatan w-full text-right border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 p-1.5 text-sm font-semibold text-indigo-700 bg-indigo-50/30" data-id="${guru.id}" value="${nominalTunjanganAuto}" readonly>
          
          <!-- Tooltip (Opsional) untuk Kasir lihat Rincian -->
          <div class="hidden group-hover:block absolute z-10 bottom-full right-0 mb-1 bg-gray-800 text-white text-[10px] p-2 rounded whitespace-nowrap shadow-lg">
						Struktural: Rp ${duitTunjangan.struktural.toLocaleString('id-ID')}<br>
						Tambahan: Rp ${duitTunjangan.tambahan.toLocaleString('id-ID')}
          </div>
        </td>
        
        <!-- Kolom 4: Input Vol Jam Mengajar -->
        <td class="p-2 border border-gray-200 bg-white">
          <input type="number" min="0" class="input-vol-jam w-full text-center border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 p-1.5 text-sm" data-id="${guru.id}" placeholder="0">
        </td>
        
        <!-- Kolom 5: Hasil Uang Jam Mengajar (Readonly Text) -->
        <td class="p-3 border border-gray-200 text-right text-gray-500 text-sm">
          Rp <span id="hasil-jam-${guru.id}">0</span>
        </td>
        
        <!-- Kolom 6: TOTAL BARIS -->
        <td class="p-3 border border-gray-200 text-right font-bold text-indigo-700 bg-indigo-50/30">
          Rp <span id="total-baris-${guru.id}">0</span>
        </td>
    </tr>`;
	});

	// Suntikkan ke tabel
	tbody.innerHTML = html;

	// Buka kunci input Kehormatan & Tombol Simpan
	const inputKehormatan = document.getElementById('input-hr-kehormatan');
	const btnSimpan = document.getElementById('btn-hr-simpan');

	if (inputKehormatan) {
		inputKehormatan.disabled = false;
		inputKehormatan.classList.remove('bg-gray-100');
	}
	if (btnSimpan) {
		btnSimpan.disabled = false;
		btnSimpan.classList.remove('opacity-50');
	}

	// Ubah Status Badge menjadi "Draft"
	const badge = document.getElementById('hr-status-badge');
	if (badge) {
		badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-yellow-500 inline-block mr-1"></span> Draft Input: ${bulan} ${tahun}`;
		badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 flex items-center";
	}

	// Panggil ulang radar kalkulasi agar input yang baru ter-render langsung dimonitor
  if(typeof pasangRadarKalkulasiHR === 'function') {
    pasangRadarKalkulasiHR();
    
    // OPTIONAL: Paksa kalkulasi berjalan sekali di awal agar kolom hasil MK 
    // yang otomatis tadi langsung memunculkan nominal uangnya!
    const event = new Event('input');
    document.querySelectorAll('.input-vol-mk').forEach(input => input.dispatchEvent(event));
  }
}

function pasangRadarKalkulasiHR() {
	// Cari semua kotak input yang bisa mempengaruhi total
	const semuaInput = document.querySelectorAll('.input-vol-mk, .input-tunj-jabatan, .input-vol-jam, #input-hr-kehormatan, #hr-tarif-masakerja, #hr-tarif-jam');

	// Setiap kali kasir mengetik (event 'input'), jalankan kalkulator!
	semuaInput.forEach(inputan => {
		inputan.addEventListener('input', kalkulasiHRTendik);
	});
}

function kalkulasiHRTendik() {
	// 1. Ambil Nilai Tarif Global & Kehormatan
	const tarifMK = parseInt(document.getElementById('hr-tarif-masakerja').value) || 0;
	const tarifJam = parseInt(document.getElementById('hr-tarif-jam').value) || 0;
	const kehormatan = parseInt(document.getElementById('input-hr-kehormatan').value) || 0;

	// Siapkan wadah untuk Total Keseluruhan (Footer)
	let globalTotalMK = 0;
	let globalTotalJabatan = 0;
	let globalTotalJam = 0;
	let globalTotalAkhir = 0;

	// 2. Sapu semua baris guru yang ada di tabel
	const barisGuru = document.querySelectorAll('.hr-row');

	barisGuru.forEach(baris => {
		const idGuru = baris.getAttribute('data-guru-id');

		// Ambil inputan dari baris ini saja
		const volMK = parseInt(baris.querySelector('.input-vol-mk').value) || 0;
		const tunjJabatan = parseInt(baris.querySelector('.input-tunj-jabatan').value) || 0;
		const volJam = parseInt(baris.querySelector('.input-vol-jam').value) || 0;

		// MATEMATIKA PER BARIS
		const uangMK = volMK * tarifMK;
		const uangJam = volJam * tarifJam;
		const totalBaris = uangMK + tunjJabatan + uangJam;

		// Tampilkan hasil ke layar (Gunakan toLocaleString agar jadi format Rp otomatis)
		document.getElementById(`hasil-mk-${idGuru}`).innerText = uangMK.toLocaleString('id-ID');
		document.getElementById(`hasil-jam-${idGuru}`).innerText = uangJam.toLocaleString('id-ID');
		document.getElementById(`total-baris-${idGuru}`).innerText = totalBaris.toLocaleString('id-ID');

		// Tambahkan ke Total Global
		globalTotalMK += uangMK;
		globalTotalJabatan += tunjJabatan;
		globalTotalJam += uangJam;
		globalTotalAkhir += totalBaris;
	});

	// 3. Masukkan Kehormatan ke Total Akhir
	globalTotalAkhir += kehormatan;

	// 4. Cetak Total ke Footer Tabel
	document.getElementById('hr-total-mk').innerText = 'Rp ' + globalTotalMK.toLocaleString('id-ID');
	document.getElementById('hr-total-jabatan').innerText = 'Rp ' + globalTotalJabatan.toLocaleString('id-ID');
	document.getElementById('hr-total-jam').innerText = 'Rp ' + globalTotalJam.toLocaleString('id-ID');
	document.getElementById('hr-total-akhir').innerText = 'Rp ' + globalTotalAkhir.toLocaleString('id-ID');
}

function hitungTunjanganOtomatis(jabatan, tugasTambahan, tahunAjaran) {
	let nominalStruktural = 0;
	let nominalTambahan = 0;

	// 1. Cari Tarif Jabatan Struktural
	if (jabatan) {
		const tarifStruk = dbMasterTarifTunjangan.find(t =>
			t.namaTugas === jabatan &&
			t.kategori === 'Struktural' &&
			t.tahunAjaran === tahunAjaran &&
			!t.isDeleted
		);
		if (tarifStruk) nominalStruktural = tarifStruk.nominal;
	}

	// 2. Cari Tarif Tugas Tambahan
	if (tugasTambahan) {
		const tarifTamb = dbMasterTarifTunjangan.find(t =>
			t.namaTugas === tugasTambahan &&
			t.kategori === 'Tambahan' &&
			t.tahunAjaran === tahunAjaran &&
			!t.isDeleted
		);
		if (tarifTamb) nominalTambahan = tarifTamb.nominal;
	}

	// 3. Kembalikan rincian dan totalnya
	return {
		struktural: nominalStruktural,
		tambahan: nominalTambahan,
		total: nominalStruktural + nominalTambahan
	};
}

function salinBulanLaluHR() {
	const barisGuru = document.querySelectorAll('.hr-row');
	if (barisGuru.length === 0) {
		tampilkanModalNotif('Gagal!','Silakan Generate Tabel terlebih dahulu!','error');
    setTimeout(() => {
      tutupModalNotif()
    }, 3000);
		return;
	}

	// Simulasi penarikan data bulan lalu
	barisGuru.forEach(baris => {
		baris.querySelector('.input-vol-mk').value = 3; // Contoh: semua guru punya 3 tahun masa kerja
		baris.querySelector('.input-vol-jam').value = 24; // Contoh: semua guru mengajar 24 JTM

		// Contoh spesifik: Jika dia Kepala Madrasah, otomatis isi tunjangan jabatan 500.000
		const jabatan = baris.querySelector('td:nth-child(3)').innerText;
		if (jabatan.includes('Kepala')) {
			baris.querySelector('.input-tunj-jabatan').value = 500000;
		}
	});

	document.getElementById('input-hr-kehormatan').value = 1630000;

	// Paksa mesin kalkulator berjalan setelah data disalin!
	kalkulasiHRTendik();
}

function simpanTabelHR() {
	// 1. Kunci semua inputan agar tidak bisa diedit lagi
	const semuaInput = document.querySelectorAll('.input-vol-mk, .input-tunj-jabatan, .input-vol-jam, #input-hr-kehormatan, #hr-tarif-masakerja, #hr-tarif-jam');
	semuaInput.forEach(inputan => {
		inputan.readOnly = true;
		inputan.classList.add('bg-gray-100', 'cursor-not-allowed');
		inputan.classList.remove('bg-white');
	});

	// 2. Atur visibilitas tombol
	document.getElementById('btn-hr-simpan').classList.add('hidden');
	document.getElementById('btn-hr-salin').classList.add('hidden');
	document.getElementById('btn-hr-unlock').classList.remove('hidden');
	document.getElementById('btn-hr-print').classList.remove('hidden');

	// 3. Ubah Status Badge menjadi "Tersimpan"
	const badge = document.getElementById('hr-status-badge');
	const bulan = document.getElementById('hr-filter-bulan').value;
	const tahun = document.getElementById('hr-filter-tahun').value;

	badge.innerHTML = `<i class="ph ph-check-circle mr-1 text-lg"></i> Tersimpan: ${bulan} ${tahun}`;
	badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 flex items-center";

	// (Nanti di sini Anda bisa menambahkan kode untuk mengirim data ke database Supabase)
}

function bukaKunciHR() {
	// 1. Buka kembali semua inputan
	const semuaInput = document.querySelectorAll('.input-vol-mk, .input-tunj-jabatan, .input-vol-jam, #input-hr-kehormatan, #hr-tarif-masakerja, #hr-tarif-jam');
	semuaInput.forEach(inputan => {
		inputan.readOnly = false;
		inputan.classList.remove('bg-gray-100', 'cursor-not-allowed');
		inputan.classList.add('bg-white');
	});

	// 2. Kembalikan visibilitas tombol seperti semula
	document.getElementById('btn-hr-simpan').classList.remove('hidden');
	document.getElementById('btn-hr-salin').classList.remove('hidden');
	document.getElementById('btn-hr-edit').classList.add('hidden');
	document.getElementById('btn-hr-print').classList.add('hidden');

	// 3. Ubah Status Badge kembali ke "Draft"
	const badge = document.getElementById('hr-status-badge');
	const bulan = document.getElementById('hr-filter-bulan').value;
	const tahun = document.getElementById('hr-filter-tahun').value;

	badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-yellow-500 inline-block mr-1"></span> Mode Edit: ${bulan} ${tahun}`;
	badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 flex items-center";
}

function unduhPdfHR() {
	// 1. Ganti tulisan tombol sementara agar kasir tahu sistem sedang bekerja
	const btnPrint = document.getElementById('btn-hr-print');
	const teksAsli = btnPrint.innerHTML;
	btnPrint.innerHTML = '<i class="ph ph-spinner-gap animate-spin mr-1.5 text-lg"></i> Memproses PDF...';
	btnPrint.disabled = true;

	// 2. CLONE (Gandakan) area tabel secara gaib di memori agar UI asli tidak rusak
	const elemenAsli = document.getElementById('hr-area-umum');
	const elemenPrint = elemenAsli.cloneNode(true);

	// 3. Modifikasi elemen hasil Clone (Sembunyikan form atas dan tombol bawah)
	elemenPrint.querySelector('div:first-child').style.display = 'none'; // Sembunyikan form filter atas
	elemenPrint.querySelector('.bg-gray-50.border-t').style.display = 'none'; // Sembunyikan area tombol bawah

	// 4. Tambahkan Kop Surat Resmi di paling atas
	const bulan = document.getElementById('hr-filter-bulan').value.toUpperCase();
	const tahun = document.getElementById('hr-filter-tahun').value;
	const kopSurat = document.createElement('div');
	kopSurat.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px; font-family: 'Times New Roman', serif;">
            <h2 style="font-size: 16px; font-weight: bold; margin: 0;">DAFTAR HONORARIUM BULAN ${bulan}</h2>
            <h3 style="font-size: 16px; font-weight: bold; margin: 0;">TENAGA PENDIDIKAN DAN KEPENDIDIKAN MADRASAH ALIYAH BI'RUL ULUM</h3>
            <p style="font-size: 14px; margin: 0;">DI YAYASAN PENDIDIKAN ISLAM BI'RUL ULUM TA. ${tahun}</p>
        </div>
    `;
	elemenPrint.insertBefore(kopSurat, elemenPrint.firstChild);

	// 5. Ubah semua Input (Kotak ketik) menjadi Teks Biasa & Tambah Kolom Tanda Tangan
	const theadTr = elemenPrint.querySelector('thead tr');
	const thTtd = document.createElement('th');
	thTtd.className = 'p-3 border border-gray-700 w-32 text-center text-xs uppercase tracking-wider bg-gray-800 text-white';
	thTtd.innerText = 'Tanda Tangan';
	theadTr.appendChild(thTtd);

	const barisClone = elemenPrint.querySelectorAll('.hr-row');
	barisClone.forEach((baris, index) => {
		// Ubah input ke teks biasa (hilangkan kotaknya)
		const semuaInput = baris.querySelectorAll('input');
		semuaInput.forEach(inp => {
			const span = document.createElement('span');
			span.innerText = inp.value;
			inp.parentNode.replaceChild(span, inp);
		});

		// Tambah kolom Tanda Tangan Zig-zag
		const tdTtd = document.createElement('td');
		tdTtd.className = 'p-2 border border-gray-200 text-xs font-medium';
		if ((index + 1) % 2 !== 0) {
			tdTtd.innerHTML = `<div class="text-left pl-1">${index + 1}. ...................</div>`;
		} else {
			tdTtd.innerHTML = `<div class="text-center pl-8">${index + 1}. ...................</div>`;
		}
		baris.appendChild(tdTtd);
	});

	// 6. Konfigurasi Export PDF (A4 Landscape)
	const opt = {
		margin: [0.4, 0.4, 0.4, 0.4], // Margin (Inci)
		filename: `Honorarium_Tendik_${bulan}_${tahun.replace('/','-')}.pdf`,
		image: {
			type: 'jpeg',
			quality: 0.98
		},
		html2canvas: {
			scale: 2
		}, // Agar hasil render tidak pecah/buram
		jsPDF: {
			unit: 'in',
			format: 'a4',
			orientation: 'landscape'
		}
	};

	// 7. Eksekusi Download PDF
	html2pdf().set(opt).from(elemenPrint).save().then(() => {
		// Kembalikan tombol seperti semula setelah selesai download
		btnPrint.innerHTML = teksAsli;
		btnPrint.disabled = false;
	});
}

// ==========================================
// EXCEL HR TENDIK (PISAH KODE GURU & FORMAT TOTAL)
// ==========================================
// function unduhExcelHR() {
// 	const btnPrint = document.getElementById('hr-btn-print') || document.getElementById('btn-hr-print');
// 	const teksAsli = btnPrint.innerHTML;
// 	btnPrint.innerHTML = '<i class="ph ph-spinner-gap animate-spin mr-1.5 text-lg"></i> Menyusun Excel...';
// 	btnPrint.disabled = true;

// 	try {
// 		const bulan = (document.getElementById('hr-filter-bulan').value || 'Bulan');
// 		const tahun = document.getElementById('hr-filter-tahun').value || 'Tahun';

// 		const dataExcel = [];

// 		// 1. Kop Surat
// 		dataExcel.push([`DAFTAR HONORARIUM TENDIK - BULAN ${bulan.toUpperCase()}`]);
// 		dataExcel.push(["MADRASAH ALIYAH BI'RUL ULUM"]);
// 		dataExcel.push([`Tahun Ajaran: ${tahun}`]);
// 		dataExcel.push([]);

// 		// 2. Header (Sekarang ada 11 kolom karena tambah 'Kode')
// 		dataExcel.push([
// 			"No",
// 			"Kode",
// 			"Nama Guru",
// 			"Jabatan",
// 			"Vol. MK",
// 			"TMK",
// 			"Tunjangan",
// 			"Vol. Jam",
// 			"TJM",
// 			"Jumlah Diterima",
// 			"Tanda Tangan"
// 		]);

// 		let sumVolMK = 0,
// 			sumTMK = 0,
// 			sumTJ = 0,
// 			sumVolJam = 0,
// 			sumTJM = 0,
// 			sumJumlah = 0;

// 		// 3. Tarik Data Tabel
// 		const barisGuru = document.querySelectorAll('.hr-row');
// 		barisGuru.forEach((baris, index) => {
// 			const getVal = (selector) => {
// 				const td = baris.querySelector(selector);
// 				if (!td) return '0';
// 				const input = td.querySelector('input');
// 				if (input) return input.value;
// 				return td.innerText;
// 			};

// 			// Ambil Nama Mentah yang masih menempel dengan kodenya
// 			let namaMentah = '';
// 			const elNama = baris.querySelector('td:nth-child(2) div.font-medium, td:nth-child(2) .font-medium');
// 			if (elNama) {
// 				namaMentah = elNama.innerText.trim();
// 			} else {
// 				namaMentah = baris.querySelector('td:nth-child(2)').innerText.replace(/\n/g, ' ').trim();
// 			}

// 			// LOGIKA PEMISAH KODE GURU
// 			// Pecah nama berdasarkan spasi. Kata pertama adalah kode, sisanya adalah nama asli.
// 			let pecahan = namaMentah.split(' ');
// 			let kodeGuru = pecahan[0]; // Misal: "AF"
// 			let namaGuru = pecahan.slice(1).join(' '); // Misal: "Moh. Alfan, S.H."

// 			if (!namaGuru) { // Jaga-jaga jika ternyata hanya ada 1 kata
// 				namaGuru = kodeGuru;
// 				kodeGuru = "-";
// 			}

// 			const jabatan = baris.querySelector('td:nth-child(3)')?.innerText.trim() || '';

// 			const volMK = parseInt(getVal('td:nth-child(4)').replace(/[^0-9]/g, '')) || 0;
// 			const tmk = parseInt(getVal('td:nth-child(5)').replace(/[^0-9]/g, '')) || 0;
// 			const tj = parseInt(getVal('td:nth-child(6)').replace(/[^0-9]/g, '')) || 0;
// 			const volJam = parseInt(getVal('td:nth-child(7)').replace(/[^0-9]/g, '')) || 0;
// 			const tjm = parseInt(getVal('td:nth-child(8)').replace(/[^0-9]/g, '')) || 0;
// 			const jumlah = parseInt(getVal('td:nth-child(9)').replace(/[^0-9]/g, '')) || 0;

// 			sumVolMK += volMK;
// 			sumTMK += tmk;
// 			sumTJ += tj;
// 			sumVolJam += volJam;
// 			sumTJM += tjm;
// 			sumJumlah += jumlah;

// 			const ttdTeks = `${index + 1}`;

// 			dataExcel.push([
// 				index + 1, kodeGuru, namaGuru, jabatan, volMK, tmk, tj, volJam, tjm, jumlah, ttdTeks
// 			]);

// 		});
// 		const elKehormatan = document.getElementById('input-hr-kehormatan') || document.querySelector('input[name="kehormatan"]');
// 		const valKehormatan = elKehormatan ? parseInt((elKehormatan.value || elKehormatan.innerText).replace(/[^0-9]/g, '')) || 0 : 0;

// 		dataExcel.push([
// 			"KEHORMATAN", "", "", "", "", "", "", "", "", valKehormatan, ""
// 		]);
// 		const rowIndexKehormatan = dataExcel.length - 1;

// 		// 4. Baris Total (Kolom 0 sampai 3 akan di-merger untuk teks Total)
// 		dataExcel.push([
// 			"TOTAL KESELURUHAN", "", "", "",
// 			sumVolMK, sumTMK, sumTJ, sumVolJam, sumTJM, (sumJumlah + valKehormatan), ""
// 		]);

// 		const worksheet = XLSX.utils.aoa_to_sheet(dataExcel);
// 		const maxRowIndex = dataExcel.length - 1;

// 		// --- STYLING ---
// 		worksheet['!merges'] = [
// 			{ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }, // Kop
// 			{ s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
// 			{ s: { r: 2, c: 0 }, e: { r: 2, c: 10 } },
// 			{ s: { r: rowIndexKehormatan, c: 0 }, e: { r: rowIndexKehormatan, c: 8 } },
// 			{ s: { r: maxRowIndex, c: 0 }, e: { r: maxRowIndex, c: 3 } }, // Merger teks "TOTAL KESELURUHAN" (sampai kolom jabatan)
// 		];

// 		worksheet['!cols'] = [
// 			{ wch: 5 }, // 0: No
// 			{ wch: 8 }, // 1: Kode
// 			{ wch: 28 }, // 2: Nama
// 			{ wch: 20 }, // 3: Jabatan
// 			{ wch: 10 }, // 4: Vol MK
// 			{ wch: 15 }, // 5: TMK
// 			{ wch: 15 }, // 6: Tunjangan
// 			{ wch: 10 }, // 7: Vol Jam
// 			{ wch: 15 }, // 8: TJM
// 			{ wch: 18 }, // 9: Jumlah
// 			{ wch: 18 } // 10: Tanda Tangan
// 		];

// 		worksheet['!margins'] = {
//       top: 2.5 / 2.54,
//       bottom: 1.0 / 2.54,
//       left: 1.0 / 2.54,
//       right: 1.0 / 2.54,
//       header: 0.3,
//       footer: 0.3
//     };

// 		// --- ROW HEIGHTS (KOP NORMAL, DATA & TOTAL 30 PT) ---
//     const customRows = [];
//     for (let r = 0; r < dataExcel.length; r++) {
//       if (r <= 3) {
//         customRows.push(null); // Kop normal
//       } else if (r <= maxRowIndex) {
//         customRows.push({ hpt: 18 }); // Header tabel s/d Total = 30pt
//       } else {
//         customRows.push(null); // Tanda tangan normal
//       }
//     }
//     worksheet['!rows'] = customRows;

// 		const range = XLSX.utils.decode_range(worksheet['!ref']);

// 		for (let R = range.s.r; R <= range.e.r; ++R) {
// 			for (let C = range.s.c; C <= range.e.c; ++C) {
// 				const cellRef = XLSX.utils.encode_cell({
// 					r: R,
// 					c: C
// 				});
// 				let cell = worksheet[cellRef];

// 				if (!cell) {
// 					worksheet[cellRef] = {
// 						t: 's',
// 						v: ''
// 					};
// 					cell = worksheet[cellRef];
// 				}

// 				// Global Font
// 				cell.s = {
// 					font: {
// 						name: "Times New Roman",
// 						sz: 11
// 					},
// 					alignment: {
// 						vertical: "center"
// 					}
// 				};

// 				// Style Kop
// 				if (R <= 2) {
// 					cell.s.font.bold = true;
// 					cell.s.font.sz = 12;
// 					cell.s.alignment.horizontal = "center";
// 				}

// 				// Border Data
// 				if (R >= 4) {
// 					cell.s.border = {
// 						top: {
// 							style: "thin",
// 							color: {
// 								rgb: "000000"
// 							}
// 						},
// 						bottom: {
// 							style: "thin",
// 							color: {
// 								rgb: "000000"
// 							}
// 						},
// 						left: {
// 							style: "thin",
// 							color: {
// 								rgb: "000000"
// 							}
// 						},
// 						right: {
// 							style: "thin",
// 							color: {
// 								rgb: "000000"
// 							}
// 						}
// 					};
// 				}

// 				// Style Header
// 				if (R === 4) {
// 					cell.s.font.bold = true;
// 					cell.s.alignment.horizontal = "center";
// 					cell.s.fill = {
// 						fgColor: {
// 							rgb: "FFF2F2F2"
// 						}
// 					};
// 				}

// 				// Baris Isi Tabel
// 				if (R >= 5 && R < maxRowIndex) {
// 					// Center (No, Kode, Vol MK, Vol Jam)
// 					if (C === 0 || C === 1 || C === 4 || C === 7) cell.s.alignment.horizontal = "center";

// 					// Accounting "Rp" (TMK, Tunjangan, TJM, Jumlah)
// 					if ((C === 5 || C === 6 || C === 8 || C === 9) && cell.t === 'n') {
// 						cell.z = '_-"Rp"* #,##0_-;\\-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';
// 					}

// 					// TTD Zig-zag (C=10)
// 					if (C === 10) {
// 						const noUrut = R - 4;
// 						if (noUrut % 2 !== 0) {
// 							cell.s.alignment.horizontal = "left";
// 							cell.v = "  " + cell.v;
// 						} else {
// 							cell.s.alignment.horizontal = "center";
// 						}
// 					}
// 				}

// 				if (R === rowIndexKehormatan) {
// 					cell.s.font.bold = true;
// 					if (C === 0) cell.s.alignment.horizontal = "right"; // Teks rata kanan
// 					if (C === 9) {
// 						// Format Accounting Rp
// 						cell.z = '_-"Rp"* #,##0_-;\\-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';
// 					}
// 				}

// 				// Baris Paling Bawah (TOTAL)
// 				if (R === maxRowIndex) {
// 					cell.s.font.bold = true;
// 					cell.s.fill = {
// 						fgColor: {
// 							rgb: "FFDCE6F1"
// 						}
// 					};

// 					if (C === 0) cell.s.alignment.horizontal = "center";

// 					if (C >= 4 && C <= 9) {
// 						const colLetter = String.fromCharCode(65 + C);
// 						cell.f = `SUM(${colLetter}6:${colLetter}${maxRowIndex})`;

// 						// Perbedaan Style Total Uang vs Volume
// 						if (C === 4 || C === 7) {
// 							// VOL MK & VOL JAM cukup Center
// 							cell.s.alignment = {
// 								horizontal: "center",
// 								vertical: "center"
// 							};
// 						} else {
// 							// TMK, Tunjangan, TJM, Jumlah pakai Accounting Rp
// 							cell.z = '_-"Rp"* #,##0_-;\\-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';
// 						}
// 					}
// 				}
// 			}
// 		}

// 		const workbook = XLSX.utils.book_new();
// 		XLSX.utils.book_append_sheet(workbook, worksheet, "HR Tendik");
// 		XLSX.writeFile(workbook, `Honorarium_Tendik_${bulan}_${tahun.replace('/','-')}.xlsx`);

// 		btnPrint.innerHTML = teksAsli;
// 		btnPrint.disabled = false;
// 		if (typeof showToast === 'function') showToast('Berhasil mengunduh Excel!', 'success');

// 	} catch (error) {
// 		console.error("Gagal Excel:", error);
// 		btnPrint.innerHTML = teksAsli;
// 		btnPrint.disabled = false;
// 		if (typeof showToast === 'function') showToast('Gagal membuat file Excel', 'error');
// 	}
// }

function unduhExcelHR() {
  const btnPrint = document.getElementById('hr-btn-print') || document.getElementById('btn-hr-print');
  const teksAsli = btnPrint.innerHTML;
  btnPrint.innerHTML = '<i class="ph ph-spinner-gap animate-spin mr-1.5 text-lg"></i> Menyusun Excel...';
  btnPrint.disabled = true;

  try {
    const bulan = (document.getElementById('hr-filter-bulan').value || 'Bulan');
    const tahun = document.getElementById('hr-filter-tahun').value || 'Tahun';

    const dataExcel = [];

    // 1. Kop Surat
    dataExcel.push([`DAFTAR HONORARIUM TENDIK - BULAN ${bulan.toUpperCase()}`]);
    dataExcel.push(["MADRASAH ALIYAH BI'RUL ULUM"]);
    dataExcel.push([`Tahun Ajaran: ${tahun}`]);
    dataExcel.push([]);

    // 2. Header
    dataExcel.push([
      "No", "Kode", "Nama Guru", "Jabatan",
      "Vol. MK", "TMK", "Tunjangan", "Vol. Jam", "TJM",
      "Jumlah Diterima", "Tanda Tangan"
    ]);

    let sumVolMK = 0, sumTMK = 0, sumTJ = 0, sumVolJam = 0, sumTJM = 0, sumJumlah = 0;

    // 3. Tarik Data Tabel
    const barisGuru = document.querySelectorAll('.hr-row');
    barisGuru.forEach((baris, index) => {
      const getVal = (selector) => {
        const td = baris.querySelector(selector);
        if (!td) return '0';
        const input = td.querySelector('input');
        if (input) return input.value;
        return td.innerText;
      };

      let namaMentah = '';
      const elNama = baris.querySelector('td:nth-child(2) div.font-medium, td:nth-child(2) .font-medium');
      if (elNama) {
        namaMentah = elNama.innerText.trim();
      } else {
        namaMentah = baris.querySelector('td:nth-child(2)').innerText.replace(/\n/g, ' ').trim();
      }

      let pecahan = namaMentah.split(' ');
      let kodeGuru = pecahan[0];
      let namaGuru = pecahan.slice(1).join(' ');

      if (!namaGuru) {
        namaGuru = kodeGuru;
        kodeGuru = "-";
      }

      const jabatan = baris.querySelector('td:nth-child(3)')?.innerText.trim() || '';
      const volMK = parseInt(getVal('td:nth-child(4)').replace(/[^0-9]/g, '')) || 0;
      const tmk = parseInt(getVal('td:nth-child(5)').replace(/[^0-9]/g, '')) || 0;
      const tj = parseInt(getVal('td:nth-child(6)').replace(/[^0-9]/g, '')) || 0;
      const volJam = parseInt(getVal('td:nth-child(7)').replace(/[^0-9]/g, '')) || 0;
      const tjm = parseInt(getVal('td:nth-child(8)').replace(/[^0-9]/g, '')) || 0;
      const jumlah = parseInt(getVal('td:nth-child(9)').replace(/[^0-9]/g, '')) || 0;

      sumVolMK += volMK;
      sumTMK += tmk;
      sumTJ += tj;
      sumVolJam += volJam;
      sumTJM += tjm;
      sumJumlah += jumlah;

      dataExcel.push([
        index + 1, kodeGuru, namaGuru, jabatan, volMK, tmk, tj, volJam, tjm, jumlah, `${index + 1}`
      ]);
    });

    // Baris Kehormatan
    const elKehormatan = document.getElementById('input-hr-kehormatan') || document.querySelector('input[name="kehormatan"]');
    const valKehormatan = elKehormatan ? parseInt((elKehormatan.value || elKehormatan.innerText).replace(/[^0-9]/g, '')) || 0 : 0;

    dataExcel.push([
      "KEHORMATAN", "", "", "", "", "", "", "", "", valKehormatan, ""
    ]);
    const rowIndexKehormatan = dataExcel.length - 1;

    // 4. Baris Total Keseluruhan
    dataExcel.push([
      "TOTAL KESELURUHAN", "", "", "",
      sumVolMK, sumTMK, sumTJ, sumVolJam, sumTJM, (sumJumlah + valKehormatan), ""
    ]);
    const rowIndexTotal = dataExcel.length - 1; // Kunci indeks total sebelum TTD ditambahkan

    // 5. Area Tanda Tangan & Tanggal Otomatis
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

    const rowTtdAwal = dataExcel.length;
    dataExcel.push(["", "", "", "", "", "", "", "", teksTititiang, "", ""]);
    dataExcel.push(["", "", "Kepala MA Bi'rul Ulum", "", "", "", "", "", "TU Keuangan", "", ""]);
    dataExcel.push([]);
    dataExcel.push([]);
    dataExcel.push(["", "", "Yusuf Muzaidi, S.Pd", "", "", "", "", "", "Ririn Jauharin, S.Ak", "", ""]);

    const worksheet = XLSX.utils.aoa_to_sheet(dataExcel);

    // --- MERGER CELLS ---
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } },
      { s: { r: rowIndexKehormatan, c: 0 }, e: { r: rowIndexKehormatan, c: 8 } },
      { s: { r: rowIndexTotal, c: 0 }, e: { r: rowIndexTotal, c: 3 } }, // Merger TOTAL KESELURUHAN (A s/d D)

      // Merger Blok Kepala Madrasah (Kolom C s/d D)
      { s: { r: rowTtdAwal + 1, c: 2 }, e: { r: rowTtdAwal + 1, c: 3 } },
      { s: { r: rowTtdAwal + 4, c: 2 }, e: { r: rowTtdAwal + 4, c: 3 } },

      // Merger Blok TU Keuangan (Kolom I s/d K)
      { s: { r: rowTtdAwal,     c: 8 }, e: { r: rowTtdAwal,     c: 10 } },
      { s: { r: rowTtdAwal + 1, c: 8 }, e: { r: rowTtdAwal + 1, c: 10 } },
      // { s: { r: rowTtdAwal + 2, c: 8 }, e: { r: rowTtdAwal + 4, c: 10 } },
      { s: { r: rowTtdAwal + 4, c: 8 }, e: { r: rowTtdAwal + 4, c: 10 } }
    ];

    worksheet['!cols'] = [
      { wch: 5 },  // No
      { wch: 8 },  // Kode
      { wch: 28 }, // Nama
      { wch: 20 }, // Jabatan
      { wch: 10 }, // Vol MK
      { wch: 15 }, // TMK
      { wch: 15 }, // Tunjangan
      { wch: 10 }, // Vol Jam
      { wch: 15 }, // TJM
      { wch: 18 }, // Jumlah
      { wch: 18 }  // Tanda Tangan
    ];

    worksheet['!margins'] = {
      top: 2.5 / 2.54,
      bottom: 1.0 / 2.54,
      left: 1.0 / 2.54,
      right: 1.0 / 2.54,
      header: 0.3,
      footer: 0.3
    };

    // Tinggi Baris: Hanya tabel data sampai Total yang diset 18pt
    const customRows = [];
    for (let r = 0; r < dataExcel.length; r++) {
      if (r <= 3) {
        customRows.push(null);
      } else if (r <= rowIndexTotal) {
        customRows.push({ hpt: 18 });
      } else {
        customRows.push(null);
      }
    }
    worksheet['!rows'] = customRows;

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

        // Kop
        if (R <= 2) {
          cell.s.font.bold = true;
          cell.s.font.sz = 12;
          cell.s.alignment.horizontal = "center";
        }

        // Border: Hanya dari Header sampai Baris Total
        if (R >= 4 && R <= rowIndexTotal) {
          cell.s.border = {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          };
        }

        // Header
        if (R === 4) {
          cell.s.font.bold = true;
          cell.s.alignment.horizontal = "center";
          cell.s.fill = { fgColor: { rgb: "FFF2F2F2" } };
        }

        // Isi Data
        if (R >= 5 && R < rowIndexKehormatan) {
          if (C === 0 || C === 1 || C === 4 || C === 7) cell.s.alignment.horizontal = "center";

          if ((C === 5 || C === 6 || C === 8 || C === 9) && cell.t === 'n') {
            cell.z = '_-"Rp"* #,##0_-;\\-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';
          }

          if (C === 10) {
            const noUrut = R - 4;
            if (noUrut % 2 !== 0) {
              cell.s.alignment.horizontal = "left";
              cell.v = "  " + cell.v;
            } else {
              cell.s.alignment.horizontal = "center";
            }
          }
        }

        // Kehormatan
        if (R === rowIndexKehormatan) {
          cell.s.font.bold = true;
          if (C === 0) cell.s.alignment.horizontal = "right";
          if (C === 9) {
            cell.z = '_-"Rp"* #,##0_-;\\-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';
          }
        }

        // Total Keseluruhan
        if (R === rowIndexTotal) {
          cell.s.font.bold = true;
          cell.s.fill = { fgColor: { rgb: "FFDCE6F1" } };

          if (C === 0) cell.s.alignment.horizontal = "center";

          if (C >= 4 && C <= 9) {
            const colLetter = String.fromCharCode(65 + C);
            cell.f = `SUM(${colLetter}6:${colLetter}${rowIndexTotal})`;

            if (C === 4 || C === 7) {
              cell.s.alignment = { horizontal: "center", vertical: "center" };
            } else {
              cell.z = '_-"Rp"* #,##0_-;\\-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';
            }
          }
        }

        // Area Tanda Tangan
        if (R >= rowTtdAwal) {
          cell.s.alignment.horizontal = "center";
          if (R === rowTtdAwal + 4) {
            cell.s.font.bold = true;
            cell.s.font.underline = true;
          }
        }
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "HR Tendik");
    XLSX.writeFile(workbook, `Honorarium_Tendik_${bulan}_${tahun.replace('/', '-')}.xlsx`);

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

function resetTabelHRPadaGantiBulan() {
	const tbody = document.getElementById('table-body-hr');
	const bulan = document.getElementById('hr-filter-bulan').value;
	const tahun = document.getElementById('hr-filter-tahun').value;

	// Kosongkan tabel (kembali ke state awal)
	tbody.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-gray-500 italic">Data untuk <b>${bulan} ${tahun}</b> belum di-generate. Silakan klik "Generate Tabel" atau cari data yang tersimpan.</td></tr>`;

	// Kembalikan tombol ke kondisi Draft
	document.getElementById('btn-hr-simpan').classList.remove('hidden');
	document.getElementById('btn-hr-simpan').disabled = true;
	document.getElementById('btn-hr-simpan').classList.add('opacity-50');

	document.getElementById('btn-hr-salin').classList.remove('hidden');
	document.getElementById('btn-hr-edit').classList.add('hidden');
	document.getElementById('btn-hr-print').classList.add('hidden');

	// Reset Total Footer
	document.getElementById('hr-total-mk').innerText = 'Rp 0';
	document.getElementById('hr-total-jabatan').innerText = 'Rp 0';
	document.getElementById('hr-total-jam').innerText = 'Rp 0';
	document.getElementById('hr-total-akhir').innerText = 'Rp 0';

	const inputKehormatan = document.getElementById('input-hr-kehormatan');
	if (inputKehormatan) {
		inputKehormatan.value = '';
		inputKehormatan.disabled = true;
	}

	// Ubah Badge
	const badge = document.getElementById('hr-status-badge');
	if (badge) {
		badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-gray-400 inline-block mr-1"></span> Menunggu Generate`;
		badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600 flex items-center";
	}
}

async function simpanRekapHonorarium() {
	// 1. Ambil Periode Bulan dan Tahun
	const bulan = document.getElementById('hr-filter-bulan').value;
	const tahun = document.getElementById('hr-filter-tahun').value;

	if (!bulan || !tahun) {
		showToast('Bulan dan Tahun Ajaran harus dipilih!', 'error');
		return;
	}

	// 👈 1. TAMBAHKAN INI: Tangkap nilai input Uang Kehormatan
	const valKehormatan = document.getElementById('input-hr-kehormatan').value || 0;
	// 2. Siapkan Wadah untuk Menyedot Data
	const payloadGaji = [];

	// Cari semua baris guru di dalam tabel (menggunakan class 'hr-row' yang sudah kita buat)
	const semuaBaris = document.querySelectorAll('.hr-row');

	semuaBaris.forEach(row => {
		// Ambil ID Guru dari atribut data
		const guruId = row.getAttribute('data-guru-id');

		// Sedot nilai dari input-input di baris ini
		const volMk = row.querySelector('.input-vol-mk').value || 0;
		const tunjJabatan = row.querySelector('.input-tunj-jabatan').value || 0;
		const volJam = row.querySelector('.input-vol-jam').value || 0;

		// Sedot total akhir (Opsional, hapus format Rp dan titik/koma)
		const textTotal = document.getElementById(`total-baris-${guruId}`).innerText;
		const totalBersih = parseInt(textTotal.replace(/\D/g, '')) || 0;

		// Masukkan ke wadah payload
		payloadGaji.push({
			guru_id: guruId,
			bulan: bulan,
			tahun_ajaran: tahun,
			vol_masa_kerja: parseInt(volMk),
			tunjangan_jabatan: parseInt(tunjJabatan),
			vol_jam_mengajar: parseInt(volJam),
			total_terima: totalBersih,
			// (Tambahkan field lain jika ada di tabel database honorarium Anda)
			uang_kehormatan: parseInt(valKehormatan)
		});
	});

	if (payloadGaji.length === 0) {
		showToast('Tidak ada data guru untuk disimpan!', 'error');
		return;
	}

	// 3. Kirim Data Massal ke Supabase
	try {
		// Matikan tombol sementara agar tidak diklik 2x
		const btnSimpan = document.getElementById('btn-hr-simpan');
		if (btnSimpan) btnSimpan.disabled = true;

		showToast('Menyimpan rekap gaji...', 'info');

		// Gunakan UPSERT agar jika bulan ini sudah pernah disave, dia akan menimpa/update, bukan membuat ganda
		// Pastikan di database Supabase Anda punya tabel khusus penggajian (misal: 'transaksi_honorarium')
		const {
			error
		} = await supabaseClient
			.from('transaksi_honorarium') // UBAH INI sesuai nama tabel HR/Gaji di database Anda
			.upsert(payloadGaji, { onConflict: 'guru_id, bulan, tahun_ajaran' });

		if (error) throw error;

		showToast('Rekap Gaji berhasil disimpan!', 'success');

		// Ubah Status Badge menjadi "Tersimpan" warna hijau
		const badge = document.getElementById('hr-status-badge');
		if (badge) {
			badge.innerHTML = `<i class="ph ph-check-circle mr-1 text-lg"></i> Tersimpan: ${bulan} ${tahun}`;
			badge.className = "px-3 py-1.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 flex items-center";
		}

		// 👈 3. TAMBAHKAN INI: Otomatis gembok layar setelah berhasil Save!
		renderTabelTerkunci(payloadGaji); // Refresh UI jadi abu-abu
		aturStateHR('TERKUNCI');          // Ganti tombol & badge

	} catch (err) {
		console.error("Gagal simpan gaji:", err);
		showToast('Gagal menyimpan: ' + err.message, 'error');
	} finally {
		// Nyalakan tombol kembali
		const btnSimpan = document.getElementById('btn-hr-simpan');
		if (btnSimpan) btnSimpan.disabled = false;
	}
}

// ==========================================
// PENGENDALI STATE (KONDISI) FORM HONORARIUM
// ==========================================
function aturStateHR(state) {
	const btnGenerate = document.getElementById('btn-hr-generate');
	const btnSimpan = document.getElementById('btn-hr-simpan');
	const btnUnlock = document.getElementById('btn-hr-unlock');
	const btnPrint = document.getElementById('btn-hr-print');
	const btnSalin = document.getElementById('btn-hr-salin');
	const inputKehormatan = document.getElementById('input-hr-kehormatan');
	const badge = document.getElementById('hr-status-badge');
	const tbody = document.getElementById('table-body-hr');

	// 1. Reset / Sembunyikan tombol-tombol aksi utama sebagai dasar
	if (btnSimpan) btnSimpan.classList.add('hidden');
	if (btnUnlock) btnUnlock.classList.add('hidden');
	if (btnPrint) btnPrint.classList.add('hidden');

	// 2. Terapkan aturan berdasarkan STATE
	if (state === 'KOSONG') {
		// Mode Kosong: Hanya tombol Generate yang nyala
		if (btnGenerate) {
			btnGenerate.disabled = false;
			btnGenerate.classList.remove('opacity-50', 'cursor-not-allowed');
		}
		if (btnSalin) btnSalin.classList.remove('hidden');
		if (inputKehormatan) {
			inputKehormatan.disabled = true;
			inputKehormatan.value = '';
			inputKehormatan.classList.add('bg-gray-100');
		}
		if (badge) {
			badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-gray-500 inline-block mr-1"></span> Belum Dibuat`;
			badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800 flex items-center";
		}
		if (tbody) {
			tbody.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-gray-500 font-medium">Silakan klik tombol "Generate Tabel" untuk memulai pengisian bulan ini.</td></tr>`;
		}

	} else if (state === 'DRAFT') {
		// Mode Draft: Sedang diisi, tombol Generate mati, tombol Simpan muncul
		if (btnGenerate) {
			btnGenerate.disabled = true;
			btnGenerate.classList.add('opacity-50', 'cursor-not-allowed');
		}
		if (btnSalin) btnSalin.classList.remove('hidden');
		if (btnSimpan) btnSimpan.classList.remove('hidden');
		if (inputKehormatan) {
			inputKehormatan.disabled = false;
			inputKehormatan.classList.remove('bg-gray-100');
		}
		if (badge) {
			const bln = document.getElementById('hr-filter-bulan').value;
			const thn = document.getElementById('hr-filter-tahun').value;
			badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-yellow-500 inline-block mr-1"></span> Draft: ${bln} ${thn}`;
			badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 flex items-center";
		}

	} else if (state === 'TERKUNCI') {
		// Mode Terkunci: Data sudah di-save. Muncul tombol Unlock & Print
		if (btnGenerate) {
			btnGenerate.disabled = true;
			btnGenerate.classList.add('opacity-50', 'cursor-not-allowed');
		}
		if (btnUnlock) btnUnlock.classList.remove('hidden');
		if (btnPrint) btnPrint.classList.remove('hidden');
		if (btnSalin) btnSalin.classList.add('hidden');

		if (inputKehormatan) {
			inputKehormatan.disabled = true;
			inputKehormatan.classList.add('bg-gray-100');
		}
		if (badge) {
			const bln = document.getElementById('hr-filter-bulan').value;
			const thn = document.getElementById('hr-filter-tahun').value;
			badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1"></span> Tersimpan: ${bln} ${thn}`;
			badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 flex items-center";
		}
	}
}

// ==========================================
// FUNGSI CEK STATUS BULAN KE SUPABASE
// ==========================================
async function cekStatusBulanIni() {
	const bulan = document.getElementById('hr-filter-bulan').value;
	const tahun = document.getElementById('hr-filter-tahun').value;

	// Jika belum pilih bulan/tahun, kembalikan ke state KOSONG
	if (!bulan || !tahun) {
		aturStateHR('KOSONG');
		return;
	}

	// Tampilkan animasi loading di badge agar Kasir tahu sistem sedang bekerja
	const badge = document.getElementById('hr-status-badge');
	if (badge) {
		badge.innerHTML = `<span class="animate-pulse flex items-center"><span class="w-2 h-2 rounded-full bg-blue-500 inline-block mr-1"></span> Mengecek data...</span>`;
		badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 flex items-center";
	}

	try {
		// Cek riwayat ke database Supabase
		const {
			data: savedData,
			error
		} = await supabaseClient
			.from('transaksi_honorarium')
			.select('*')
			.eq('bulan', bulan)
			.eq('tahun_ajaran', tahun);

		if (error) throw error;

		if (savedData && savedData.length > 0) {
			// 🟢 DATA DITEMUKAN (Sudah pernah disimpan)
			renderTabelTerkunci(savedData); // <-- KITA AKTIFKAN NANTI DI LANGKAH 4

			aturStateHR('TERKUNCI');
			showToast(`Data riwayat gaji ${bulan} ${tahun} ditemukan!`, 'success');
		} else {
			// 🔴 DATA KOSONG (Belum pernah dibuat)
			aturStateHR('KOSONG');
		}
	} catch (err) {
		console.error("Gagal mengecek status bulan:", err);
		showToast('Gagal mengecek data: ' + err.message, 'error');
		aturStateHR('KOSONG');
	}
}

// ==========================================
// FUNGSI RENDER TABEL MODE TERKUNCI (READONLY)
// ==========================================
function renderTabelTerkunci(savedData) {
	const tbody = document.getElementById('table-body-hr');

	// 1. Ambil data guru Tendik & Urutkan (Sama persis dengan urutan generateTabelHR)
	const guruTendik = dbMasterGuru.filter(g => g.is_tendik === true && g.is_active !== false);
	const bobotJabatan = {
		'kepala madrasah': 1,
		'waka kurikulum': 2,
		'waka kesiswaan': 3,
		'waka sarpras': 4,
		'tu operator': 5,
		'kepala perpustakaan': 6,
		'wali kelas x e1': 7,
		'wali kelas x e2': 8,
		'wali kelas xi f1': 9,
		'wali kelas xi f2': 10,
		'wali kelas xii ipa': 11,
		'wali kelas xii ips': 12,
		'guru': 13,
		'tu keuangan': 14,
		'tu administrasi': 15,
	};

	guruTendik.sort((a, b) => {
		const jabatanA = (a.jabatan || 'guru').toLowerCase().trim();
		const jabatanB = (b.jabatan || 'guru').toLowerCase().trim();
		const nilaiA = bobotJabatan[jabatanA] || 99;
		const nilaiB = bobotJabatan[jabatanB] || 99;
		if (nilaiA !== nilaiB) return nilaiA - nilaiB;
		return (a.nama || '').localeCompare(b.nama || '');
	});

	if (guruTendik.length === 0) return;

	let html = '';
	guruTendik.forEach((guru, index) => {
		// 2. CARI DATA RIWAYAT GURU INI DARI DATABASE
		const rekam = savedData.find(r => String(r.guru_id) === String(guru.id));

		// Jika ketemu, pakai angka dari database. Jika tidak (mungkin guru baru), set 0
		const volMk = rekam ? rekam.vol_masa_kerja : 0;
		const tunjJabatan = rekam ? rekam.tunjangan_jabatan : 0;
		const volJam = rekam ? rekam.vol_jam_mengajar : 0;

		// 3. CETAK BARIS HTML DENGAN MODE TERKUNCI (Readonly, warna abu-abu)
		html += `
        <tr class="hover:bg-gray-50 transition-colors group hr-row" data-guru-id="${guru.id}">
            <td class="p-3 border border-gray-200 text-center text-sm text-gray-500">${index + 1}</td>
            <td class="p-3 border border-gray-200 font-medium text-sm text-gray-600">
                <span class="text-xs font-bold bg-gray-200 px-1.5 py-0.5 rounded mr-1">${guru.kode_guru}</span> ${guru.nama}
            </td>
            <td class="p-3 border border-gray-200 text-xs text-gray-500">${ [guru.jabatan, guru.tugas_tambahan].filter(Boolean).join(' & ') || '-' }</td>
            
            <!-- Kolom Input Terkunci -->
            <td class="p-2 border border-gray-200 bg-gray-100">
                <input type="number" class="input-vol-mk w-full text-center border border-gray-300 rounded bg-gray-200 p-1.5 text-sm text-gray-500 cursor-not-allowed outline-none" data-id="${guru.id}" value="${volMk}" readonly tabindex="-1">
            </td>
            <td class="p-3 border border-gray-200 text-right text-gray-400 text-sm">Rp <span id="hasil-mk-${guru.id}">0</span></td>
            
            <td class="p-2 border border-gray-200 bg-gray-100">
                <input type="number" class="input-tunj-jabatan w-full text-right border border-gray-300 rounded bg-gray-200 p-1.5 text-sm font-semibold text-gray-600 cursor-not-allowed outline-none" data-id="${guru.id}" value="${tunjJabatan}" readonly tabindex="-1">
            </td>
            
            <td class="p-2 border border-gray-200 bg-gray-100">
                <input type="number" class="input-vol-jam w-full text-center border border-gray-300 rounded bg-gray-200 p-1.5 text-sm text-gray-500 cursor-not-allowed outline-none" data-id="${guru.id}" value="${volJam}" readonly tabindex="-1">
            </td>
            <td class="p-3 border border-gray-200 text-right text-gray-400 text-sm">Rp <span id="hasil-jam-${guru.id}">0</span></td>
            
            <td class="p-3 border border-gray-200 text-right font-bold text-gray-600 bg-gray-200">
                Rp <span id="total-baris-${guru.id}">0</span>
            </td>
        </tr>`;
	});

	tbody.innerHTML = html;

	// 4. SET NILAI UANG KEHORMATAN DARI DATABASE (Cukup ambil dari baris pertama)
	const inputKehormatan = document.getElementById('input-hr-kehormatan');
	if (inputKehormatan && savedData.length > 0) {
		// Ambil nilai uang_kehormatan dari data index ke-0
		inputKehormatan.value = savedData[0].uang_kehormatan || 0;
	}

	// 5. TEMBAKKAN EVENT AGAR TOTALAN (Rp) DI KANAN TERKALKULASI OTOMATIS
	if (typeof pasangRadarKalkulasiHR === 'function') {
		pasangRadarKalkulasiHR();
		// Trik jitu: Paksa seolah ada ketikan di input agar JS menghitung total
		const event = new Event('input');
		document.querySelectorAll('.input-tunj-jabatan').forEach(input => input.dispatchEvent(event));
	}
}

// ==========================================
// TOMBOL BUKA KUNCI (UNLOCK)
// ==========================================
const btnUnlockHR = document.getElementById('btn-hr-unlock');
if (btnUnlockHR) {
	btnUnlockHR.addEventListener('click', async function(e) {
		e.preventDefault();

		const setuju = await tampilkanKonfirmasi(
			'Buka Kunci Data',
			'Apakah Anda yakin ingin membuka kunci dan mengedit data bulan ini?',
			'Ya, Buka Kunci',
			'bg-yellow-500 hover:bg-yellow-600' // Tombol warna kuning
		);

		if (setuju) {
			// 1. Ubah UI menjadi mode Draft (Tombol simpan muncul, tombol unlock hilang)
			aturStateHR('DRAFT');

			// 2. Buka gembok (readonly) semua input di tabel (KECUALI Masa Kerja karena itu otomatis)
			document.querySelectorAll('.hr-row input:not(.input-vol-mk):not(.input-tunj-jabatan)').forEach(input => {
				input.readOnly = false;
				input.min = 0;
				// Hilangkan efek abu-abu & kursor dilarang
				input.classList.remove('bg-gray-200', 'cursor-not-allowed', 'text-gray-500');
				// Kembalikan efek putih & hover biru
				input.classList.add('bg-white', 'focus:ring-2', 'focus:ring-indigo-500', 'text-gray-900');
			});

			// 3. (Opsional) Kembalikan warna background kolom tabel agar putih kembali
			document.querySelectorAll('.hr-row td.bg-gray-100').forEach(td => {
				td.classList.remove('bg-gray-100');
				td.classList.add('bg-white');
			});

			showToast('Kunci dibuka. Silakan edit data.', 'info');
		}
	});
}

// ==========================================
// BATCH 1: LOGIKA MUNDUR 1 BULAN
// ==========================================
function getBulanLalu(bulanSekarang) {
	const daftarBulan = [
		"Januari", "Februari", "Maret", "April", "Mei", "Juni",
		"Juli", "Agustus", "September", "Oktober", "November", "Desember"
	];

	// Rapikan teks untuk menghindari error huruf besar/kecil atau spasi
	const bulanBersih = (bulanSekarang || "").trim().toLowerCase();

	const indexSekarang = daftarBulan.findIndex(b => b.toLowerCase() === bulanBersih);

	// Jika sistem gagal mengenali bulan yang diinput
	if (indexSekarang === -1) {
		console.error("Nama bulan tidak valid:", bulanSekarang);
		return null;
	}

	// Jika bulan ini Januari (Index 0), maka kembalikan Desember (Index 11)
	if (indexSekarang === 0) {
		return "Desember";
	}

	// Selain Januari, cukup mundur 1 langkah di daftar bulan
	return daftarBulan[indexSekarang - 1];
}

// ==========================================
// BATCH 2: TARIK DATA DARI SUPABASE
// ==========================================
async function prosesSalinBulanLalu() {
	// 1. Ambil posisi bulan dan tahun saat ini dari dropdown
	const bulanSekarang = document.getElementById('hr-filter-bulan').value;
	const tahunAjaran = document.getElementById('hr-filter-tahun').value;

	if (!bulanSekarang || !tahunAjaran) {
		showToast('Silakan pilih Bulan dan Tahun Ajaran terlebih dahulu!', 'warning');
		return;
	}

	// 2. Dapatkan nama bulan lalu menggunakan fungsi Batch 1
	const bulanLalu = getBulanLalu(bulanSekarang);
	if (!bulanLalu) return;

	showToast(`Sedang mencari riwayat gaji bulan ${bulanLalu}...`, 'info');

	try {
		// 3. Ekstraksi data dari Supabase
		const {
			data: dataBulanLalu,
			error
		} = await supabaseClient
			.from('transaksi_honorarium')
			.select('*')
			.eq('bulan', bulanLalu)
			.eq('tahun_ajaran', tahunAjaran);

		if (error) throw error;

		// 4. Jika bulan lalu ternyata KOSONG
		if (!dataBulanLalu || dataBulanLalu.length === 0) {
			showToast(`Data gaji bulan ${bulanLalu} belum ada/kosong. Tidak ada yang bisa disalin.`, 'warning');
			return;
		}

		// 5. JIKA ADA DATA (Masuk ke Batch 3 nanti)
		console.log("Berhasil menarik data bulan lalu:", dataBulanLalu);

		// Di sinilah nanti kita akan memanggil Batch 3 (Suntik & Kalkulasi)
		injeksiDataKeTabel(dataBulanLalu); 

	} catch (err) {
		console.error("Gagal menarik data bulan lalu:", err);
		showToast('Gagal menyalin: ' + err.message, 'error');
	}
}

// ==========================================
// BATCH 3: SUNTIK & KALKULASI KE TABEL (DRAFT)
// ==========================================
function injeksiDataKeTabel(dataBulanLalu) {
	// 1. Pastikan tabel kerangka sudah dibuat (Mode Draft)
	const semuaBaris = document.querySelectorAll('.hr-row');
	if (semuaBaris.length === 0) {
		// Jika tabelnya belum ada (layar masih kosong), kita generate dulu
		generateTabelHR();
		aturStateHR('DRAFT');
	}

	// 2. Suntikkan Uang Kehormatan dari bulan lalu (jika ada)
	const inputKehormatan = document.getElementById('input-hr-kehormatan');
	if (inputKehormatan && dataBulanLalu.length > 0) {
		inputKehormatan.value = dataBulanLalu[0].uang_kehormatan || 0;
	}

	// 3. Loop setiap baris guru yang ada di tabel saat ini
	document.querySelectorAll('.hr-row').forEach(row => {
		const guruId = row.getAttribute('data-guru-id');

		// Cari data guru ini di riwayat bulan lalu
		const rekamBulanLalu = dataBulanLalu.find(r => String(r.guru_id) === String(guruId));

		if (rekamBulanLalu) {
			// Tangkap elemen input di baris ini
			const inputMk = row.querySelector('.input-vol-mk');
			const inputJabatan = row.querySelector('.input-tunj-jabatan');
			const inputJam = row.querySelector('.input-vol-jam');

			// Timpa angka otomatis dengan angka dari bulan lalu
			if (inputMk) inputMk.value = rekamBulanLalu.vol_masa_kerja || 0;
			if (inputJabatan) inputJabatan.value = rekamBulanLalu.tunjangan_jabatan || 0;
			if (inputJam) inputJam.value = rekamBulanLalu.vol_jam_mengajar || 0;
		}
	});

	// 4. TEMBAKKAN EVENT (Paksa kalkulator menjumlah ulang)
	if (typeof pasangRadarKalkulasiHR === 'function') {
		pasangRadarKalkulasiHR(); // Pastikan radar kalkulator aktif
	}

	// Trik jitu: Kita buat seolah-olah kasir baru saja mengetik di keyboard
	// Ini akan memancing fungsi kalkulasi otomatis Anda untuk mengubah "Rp. 0" menjadi total yang benar
	const event = new Event('input', {
		bubbles: true
	});
	document.querySelectorAll('.input-tunj-jabatan').forEach(input => {
		input.dispatchEvent(event);
	});

	// Ubah status tabel jadi Draft (karena ini belum disave, baru disalin ke layar)
	aturStateHR('DRAFT');
	showToast('Data bulan lalu berhasil disalin ke layar!', 'success');
}

// ==========================================
// BATCH 4: PENGAMAN UX & TOMBOL SALIN BULAN LALU
// ==========================================
// Pastikan ID ini sama dengan ID tombol di file HTML Anda
const btnSalinBulanLalu = document.getElementById('btn-hr-salin');

if (btnSalinBulanLalu) {
	btnSalinBulanLalu.addEventListener('click', async function(e) {
		e.preventDefault();

		// 1. Ambil bulan saat ini dan prediksi bulan lalunya
		const bulanSekarang = document.getElementById('hr-filter-bulan').value;
		const bulanLalu = getBulanLalu(bulanSekarang);

		// Jika bulan belum dipilih atau logika gagal, batalkan
		if (!bulanSekarang || !bulanLalu) {
			showToast('Silakan pilih bulan yang valid terlebih dahulu!', 'warning');
			return;
		}

		// 2. PENGAMAN UX (Konfirmasi)
		// Mencegah kasir tidak sengaja menekan tombol dan menimpa ketikannya sendiri
		const pesan = `Anda akan menyalin riwayat gaji bulan ${bulanLalu} ke form bulan ${bulanSekarang}.\n\nAngka yang ada di layar saat ini akan tertimpa. Lanjutkan?`;

		const setuju = await tampilkanKonfirmasi(
			'Salin Data',
			pesan,
			'Ya, Salin Data',
			'bg-indigo-500 hover:bg-indigo-600' // Tombol warna ungu/indigo
		);

		if (setuju) {
			prosesSalinBulanLalu();
		}
	});
}

// ==========================================
// FUNGSI MODAL KONFIRMASI UNIVERSAL
// ==========================================
function tampilkanKonfirmasi(judul, pesan, teksTombol, classWarna) {
	return new Promise((resolve) => {
		const modal = document.getElementById('hr-confirm-modal');
		const titleEl = document.getElementById('hr-modal-title');
		const msgEl = document.getElementById('hr-modal-message');
		const btnBatal = document.getElementById('btn-hr-modal-cancel');
		const btnConfirm = document.getElementById('btn-hr-modal-confirm');

		// 1. Set Teks
		titleEl.textContent = judul;
		msgEl.textContent = pesan;
		btnConfirm.textContent = teksTombol;

		// 2. Set Warna Tombol (Reset class lalu tambahkan class khusus)
		btnConfirm.className = `flex-1 py-2.5 text-white font-medium rounded-lg transition-colors ${classWarna}`;

		// 3. Tampilkan Modal
		modal.classList.remove('hidden');

		// 4. Handler ketika tombol diklik
		const aksiBatal = () => {
			tutupModal();
			resolve(false); // Kirim jawaban "TIDAK"
		};

		const aksiConfirm = () => {
			tutupModal();
			resolve(true); // Kirim jawaban "YA"
		};

		const tutupModal = () => {
			modal.classList.add('hidden');
			// Bersihkan event listener agar tidak bentrok jika dipanggil lagi
			btnBatal.removeEventListener('click', aksiBatal);
			btnConfirm.removeEventListener('click', aksiConfirm);
		};

		btnBatal.addEventListener('click', aksiBatal);
		btnConfirm.addEventListener('click', aksiConfirm);
	});
}

function setupHRTendikEvents() {
	// 1. Radar untuk navigasi Sub-Tab (Umum vs Potongan)
	const tabButtons = document.querySelectorAll('.btn-hr-tab');
	const areaUmum = document.getElementById('hr-area-umum');
	const areaPotongan = document.getElementById('hr-area-potongan');

	tabButtons.forEach(function(btn) {
		btn.addEventListener('click', function() {
			// Ambil target tab
			const target = this.getAttribute('data-hrtab');

			// Reset styling semua tombol
			tabButtons.forEach(b => {
				b.classList.remove('border-indigo-600', 'text-indigo-600');
				b.classList.add('border-transparent', 'text-gray-500');
			});

			// Aktifkan tombol yang diklik
			this.classList.remove('border-transparent', 'text-gray-500');
			this.classList.add('border-indigo-600', 'text-indigo-600');

			// Tampilkan area yang sesuai
			if (target === 'umum') {
				areaUmum.classList.remove('hidden');
				areaUmum.classList.add('flex');
				areaPotongan.classList.add('hidden');
			} else {
				areaUmum.classList.add('hidden');
				areaUmum.classList.remove('flex');
				areaPotongan.classList.remove('hidden');
				areaPotongan.classList.add('flex');
			}
		});
	});

	// 2. Radar untuk Tombol Generate Tabel
  const btnGenerate = document.getElementById('btn-hr-generate');
  if (btnGenerate) {
    btnGenerate.addEventListener('click', function() {
      // 1. Buat kerangka tabel dengan perhitungan otomatis dari Master Tarif
			generateTabelHR();
			
			// 2. Ubah State menjadi DRAFT (tombol Simpan muncul, input bisa diketik)
			aturStateHR('DRAFT');
    });
  }

  const btnSalin = document.getElementById('btn-hr-salin');
  if (btnSalin) {
    btnSalin.addEventListener('click', salinBulanLaluHR);
  }

  const btnSimpan = document.getElementById('btn-hr-simpan');
  const btnEdit = document.getElementById('btn-hr-edit');

  if (btnSimpan) btnSimpan.addEventListener('click', simpanTabelHR);
  if (btnEdit) btnEdit.addEventListener('click', bukaKunciHR);

  // 1. Radar untuk Unduh PDF (Ganti yang sebelumnya btn-hr-print)
  const btnPrint = document.getElementById('btn-hr-print');
  if (btnPrint) {
		btnPrint.replaceWith(btnPrint.cloneNode(true));
		const btnBaru = document.getElementById('btn-hr-print');

		// Ubah warna dan icon ke Excel (opsional)
		btnBaru.className = "hidden px-5 py-2 bg-green-600 text-white hover:bg-green-700 font-medium rounded-lg transition-colors flex items-center text-sm shadow-sm";
		btnBaru.innerHTML = `<i class="ph ph-microsoft-excel-logo mr-1.5 text-lg"></i> Unduh Excel`;

		btnBaru.addEventListener('click', unduhExcelHR);
	}

  // 2. Radar untuk pergantian Dropdown
  const filterBulan = document.getElementById('hr-filter-bulan');
  const filterTahun = document.getElementById('hr-filter-tahun');
  
  // if (filterBulan) filterBulan.addEventListener('change', resetTabelHRPadaGantiBulan);
  // if (filterTahun) filterTahun.addEventListener('change', resetTabelHRPadaGantiBulan);
	if (filterBulan) filterBulan.addEventListener('change', cekStatusBulanIni);
  if (filterTahun) filterTahun.addEventListener('change', cekStatusBulanIni);

	const btnSimpanGaji = document.getElementById('btn-hr-simpan');
	if (btnSimpanGaji) {
		btnSimpanGaji.addEventListener('click', async function(e) {
			e.preventDefault();

			const bulan = document.getElementById('hr-filter-bulan').value;
			const setuju = await tampilkanKonfirmasi(
				'Simpan Data',
				`Anda yakin ingin menyimpan rekapitulasi gaji untuk bulan ${bulan}?`,
				'Ya, Simpan',
				'bg-blue-600 hover:bg-blue-700' // Tombol warna biru
			);

			if (setuju) {
				simpanRekapHonorarium();
			}
		});
	}
}

// --- BAGIAN EKSTRA BBQS

// ==========================================
// BATCH 1: GENERATE & KALKULASI HR BBQS
// ==========================================

// function generateTabelBBQS() {
// 	const tbody = document.getElementById('table-body-bbqs');
// 	const bulan = document.getElementById('bbqs-filter-bulan').value;
// 	const tahun = document.getElementById('bbqs-filter-tahun').value;

// 	if (!bulan || !tahun) {
// 		tampilkanModalNotif('Gagal!','Pilih Tahun Ajaran dan Bulan terlebih dahulu!','error');
// 		setTimeout(() => {
//       tutupModalNotif()
//     }, 3000);
// 		return;
// 	}

// 	// 1. Ambil data guru yang tugasnya mengandung kata 'bbqs'
// 	const guruBBQS = dbMasterGuru.filter(g => g.is_bbqs === true && g.is_active !== false);

// 	// 2. Urutkan berdasarkan Abjad (Nama A-Z)
// 	guruBBQS.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));

// 	if (guruBBQS.length === 0) {
// 		tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-red-500 font-medium">Tidak ada data Guru dengan tugas BBQS!</td></tr>`;
// 		return;
// 	}

// 	let html = '';
// 	guruBBQS.forEach((guru, index) => {
// 		html += `
//         <tr class="hover:bg-indigo-50 transition-colors group bbqs-row" data-guru-id="${guru.id}">
//             <td class="p-3 border border-gray-200 text-center text-sm">${index + 1}</td>
//             <td class="p-3 border border-gray-200 text-center text-xs font-bold text-gray-600">${guru.kode_guru || '-'}</td>
//             <td class="p-3 border border-gray-200 font-medium text-sm text-gray-800">${guru.nama}</td>
//             <td class="p-3 border border-gray-200 text-xs text-gray-600 text-center">${guru.tugas || 'Guru BBQS'}</td>
            
//             <!-- Tampilan Tarif Satuan (Menyesuaikan input global) -->
//             <td class="p-3 border border-gray-200 text-center text-gray-500 text-sm">
//                 Rp <span id="bbqs-satuan-text-${guru.id}">0</span>
//             </td>
            
//             <!-- Input Volume BBQS -->
//             <td class="p-2 border border-gray-200 bg-white">
//                 <input type="number" min="0" class="input-vol-bbqs w-full text-center border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 p-1.5 text-sm" data-id="${guru.id}" placeholder="0">
//             </td>
            
//             <!-- TOTAL BARIS (Jumlah) -->
//             <td class="p-3 border border-gray-200 text-right font-bold text-indigo-700 bg-indigo-50/30">
//                 Rp <span id="total-baris-bbqs-${guru.id}">0</span>
//             </td>
            
//             <!-- Tanda Tangan (Hanya muncul saat di-print) -->
//             <td class="p-3 border border-gray-200 text-center text-gray-300 text-xs hidden print:table-cell">
//                 ${index + 1} ...................
//             </td>
//         </tr>`;
// 	});

// 	tbody.innerHTML = html;

// 	aturStateBBQS('DRAFT', bulan, tahun);

// 	// 5. Pasang Radar Kalkulasi 
// 	pasangRadarKalkulasiBBQS();

// 	// 6. Pancing kalkulasi pertama kali agar Tarif Satuan (Kolom ke-5) terisi angka
// 	kalkulasiBBQS();
// }

// function pasangRadarKalkulasiBBQS() {
// 	// Pantau perubahan pada semua input Volume dan input Tarif Satuan Global
// 	const semuaInputVol = document.querySelectorAll('.input-vol-bbqs');
// 	const inputTarifGlobal = document.getElementById('bbqs-tarif-satuan');

// 	semuaInputVol.forEach(inputan => {
// 		inputan.addEventListener('input', kalkulasiBBQS);
// 	});

// 	if (inputTarifGlobal) {
// 		inputTarifGlobal.addEventListener('input', kalkulasiBBQS);
// 	}
// }

// function kalkulasiBBQS() {
// 	// 1. Ambil Nilai Tarif Satuan Global
// 	const tarifSatuan = parseInt(document.getElementById('bbqs-tarif-satuan').value) || 0;
// 	let globalTotalAkhir = 0;

// 	// 2. Sapu semua baris guru di tabel BBQS
// 	const barisGuru = document.querySelectorAll('.bbqs-row');

// 	barisGuru.forEach(baris => {
// 		const idGuru = baris.getAttribute('data-guru-id');

// 		// Ambil input volume
// 		const vol = parseInt(baris.querySelector('.input-vol-bbqs').value) || 0;

// 		// MATEMATIKA
// 		const totalBaris = vol * tarifSatuan;

// 		// Tampilkan hasil ke layar
// 		const elmSatuan = document.getElementById(`bbqs-satuan-text-${idGuru}`);
// 		const elmTotal = document.getElementById(`total-baris-bbqs-${idGuru}`);

// 		if (elmSatuan) elmSatuan.innerText = tarifSatuan.toLocaleString('id-ID');
// 		if (elmTotal) elmTotal.innerText = totalBaris.toLocaleString('id-ID');

// 		// Tambahkan ke Global
// 		globalTotalAkhir += totalBaris;
// 	});

// 	// 3. Cetak Total ke Footer Tabel
// 	const footerTotal = document.getElementById('bbqs-total-akhir');
// 	if (footerTotal) {
// 		footerTotal.innerText = 'Rp ' + globalTotalAkhir.toLocaleString('id-ID');
// 	}
// }

// // ==========================================
// // BATCH 2: SIMPAN KE SUPABASE & BUKA KUNCI UI
// // ==========================================

// async function simpanRekapBBQS() {
// 	try {
// 		const barisGuru = document.querySelectorAll('.bbqs-row');
// 		const bulan = document.getElementById('bbqs-filter-bulan').value;
// 		const tahun = document.getElementById('bbqs-filter-tahun').value;
// 		const tarifSatuan = parseInt(document.getElementById('bbqs-tarif-satuan').value) || 0;

// 		if (!bulan || !tahun) {
// 			alert("Bulan dan Tahun Ajaran belum dipilih!");
// 			return;
// 		}

// 		// 1. Siapkan wadah untuk dikirim ke Supabase
// 		let dataPayload = [];

// 		barisGuru.forEach(baris => {
// 			const idGuru = baris.getAttribute('data-guru-id');
// 			const inputVol = baris.querySelector('.input-vol-bbqs');
// 			const vol = parseInt(inputVol.value) || 0;

// 			// Kita push semua baris ke payload agar DB dan UI selalu sinkron 100%.
// 			// (Termasuk jika Bendahara merevisi angka 5 menjadi 0, DB akan ikut jadi 0).
// 			dataPayload.push({
// 				guru_id: idGuru,
// 				bulan: bulan,
// 				tahun_ajaran: tahun,
// 				tarif_satuan: tarifSatuan,
// 				volume: vol,
// 				total_terima: vol * tarifSatuan
// 			});
// 		});

// 		// Tampilkan indikator loading pada tombol
// 		const btnSimpan = document.getElementById('btn-bbqs-simpan');
// 		const teksAsli = btnSimpan.innerHTML;
// 		btnSimpan.innerHTML = '<i class="ph ph-spinner animate-spin mr-1 text-lg"></i> Menyimpan...';
// 		btnSimpan.disabled = true;

// 		// ==========================================
// 		// 2. PROSES TEMBAK API SUPABASE (UPSERT)
// 		// ==========================================
// 		// Param 'onConflict' mencegah error data ganda & memicu Update otomatis
// 		const {
// 			error
// 		} = await supabaseClient
// 			.from('transaksi_hr_bbqs')
// 			.upsert(dataPayload, {
// 				onConflict: 'guru_id,bulan,tahun_ajaran'
// 			});

// 		if (error) throw error; // Jika gagal, lempar ke catch

// 		// ==========================================
// 		// 3. JIKA SUKSES: KUNCI UI (FORM)
// 		// ==========================================
// 		// barisGuru.forEach(baris => {
// 		// 	const inputVol = baris.querySelector('.input-vol-bbqs');
// 		// 	inputVol.disabled = true;
// 		// 	inputVol.classList.add('bg-gray-100', 'cursor-not-allowed');
// 		// });
// 		aturStateBBQS('LOCKED', bulan, tahun);

// 		// Kunci filter atas
// 		// document.getElementById('bbqs-tarif-satuan').disabled = true;
// 		// document.getElementById('bbqs-filter-bulan').disabled = true;
// 		// document.getElementById('bbqs-filter-tahun').disabled = true;
// 		// document.getElementById('btn-bbqs-generate').disabled = true;

// 		// // 4. Update Tombol Aksi
// 		// btnSimpan.classList.add('hidden');
// 		btnSimpan.innerHTML = teksAsli; // Kembalikan teks asli untuk nanti

// 		// document.getElementById('btn-bbqs-unlock').classList.remove('hidden');
// 		// document.getElementById('btn-bbqs-print').classList.remove('hidden');

// 		// // 5. Update Status Badge
// 		// const badge = document.getElementById('bbqs-status-badge');
// 		// if (badge) {
// 		// 	badge.innerHTML = `<i class="ph ph-check-circle mr-1 text-lg"></i> Tersimpan di Database: ${bulan} ${tahun}`;
// 		// 	badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 flex items-center shadow-sm";
// 		// }

// 		// Anda bisa tambahkan SweetAlert sukses di sini jika mau
// 		console.log(`HR BBQS ${bulan} ${tahun} berhasil di-upsert ke Supabase!`);

// 	} catch (err) {
// 		console.error('Error saat menyimpan HR BBQS:', err);
// 		alert('Gagal menyimpan data ke server: ' + err.message);

// 		// Kembalikan tombol simpan ke kondisi awal
// 		const btnSimpan = document.getElementById('btn-bbqs-simpan');
// 		if (btnSimpan) {
// 			btnSimpan.disabled = false;
// 			btnSimpan.innerHTML = 'Simpan Tabel';
// 		}
// 	}
// }

// function bukaKunciBBQS() {
// 	const bulan = document.getElementById('bbqs-filter-bulan').value;
// 	const tahun = document.getElementById('bbqs-filter-tahun').value;

// 	aturStateBBQS('DRAFT', bulan, tahun);
// }

// function setupHREkstraBBQSEvents() {
// 	// ==========================================
// 	// 1. RADAR UNTUK NAVIGASI SUB-TAB (BBQS vs EKSTRA)
// 	// ==========================================
// 	const tabButtons = document.querySelectorAll('.btn-eks-tab');
// 	const areaBbqs = document.getElementById('hr-area-bbqs');
// 	const areaEkstra = document.getElementById('hr-area-ekstra');

// 	tabButtons.forEach(function(btn) {
// 		btn.addEventListener('click', function() {
// 			// Ambil target tab
// 			const target = this.getAttribute('data-ekstab');

// 			// Reset styling semua tombol
// 			tabButtons.forEach(b => {
// 				b.classList.remove('border-indigo-600', 'text-indigo-600');
// 				b.classList.add('border-transparent', 'text-gray-500');
// 			});

// 			// Aktifkan tombol yang diklik
// 			this.classList.remove('border-transparent', 'text-gray-500');
// 			this.classList.add('border-indigo-600', 'text-indigo-600');

// 			if (target === 'ekstra') {
// 				areaEkstra.classList.remove('hidden');
// 				areaEkstra.classList.add('flex');
// 				areaBbqs.classList.add('hidden');
// 				areaBbqs.classList.remove('flex');
// 			} else {
// 				areaEkstra.classList.add('hidden');
// 				areaEkstra.classList.remove('flex');
// 				areaBbqs.classList.remove('hidden');
// 				areaBbqs.classList.add('flex');
// 			}
// 		});
// 	});

// 	// ==========================================
// 	// 2. RADAR EVENT UNTUK HR BBQS
// 	// ==========================================
// 	const btnGenerateBBQS = document.getElementById('btn-bbqs-generate');
// 	const btnSalinBBQS = document.getElementById('btn-bbqs-salin');
// 	const btnSimpanBBQS = document.getElementById('btn-bbqs-simpan');
// 	const btnEditBBQS = document.getElementById('btn-bbqs-unlock'); // Tombol Buka Kunci
// 	const filterBulanBBQS = document.getElementById('bbqs-filter-bulan');
// 	const filterTahunBBQS = document.getElementById('bbqs-filter-tahun');

// 	if (btnGenerateBBQS) {
// 		btnGenerateBBQS.addEventListener('click', function() {
// 			// Panggil fungsi render tabel BBQS (nanti Anda buat)
// 			generateTabelBBQS();
// 			aturStateBBQS('DRAFT');
// 			console.log("Generate BBQS diklik");
// 		});
// 	}

// 	if (btnSalinBBQS) {
// 		btnSalinBBQS.addEventListener('click', function() {
// 			salinBulanLaluBBQS();
// 			aturStateBBQS('DRAFT');
// 			console.log("Salin BBQS diklik");
// 		});
// 	}

// 	if (btnEditBBQS) {
// 		btnEditBBQS.addEventListener('click', function() {
// 			bukaKunciBBQS();
// 		});
// 	}

// 	if (filterBulanBBQS) filterBulanBBQS.addEventListener('change', cekStatusBulanIniBBQS);
// 	if (filterTahunBBQS) filterTahunBBQS.addEventListener('change', cekStatusBulanIniBBQS);

// 	if (btnSimpanBBQS) {
// 		btnSimpanBBQS.addEventListener('click', async function(e) {
// 			e.preventDefault();
// 			const bulan = document.getElementById('bbqs-filter-bulan').value;
// 			// Pastikan Anda memiliki fungsi tampilkanKonfirmasi di file Anda
// 			const setuju = await tampilkanKonfirmasi(
// 				'Simpan Data BBQS',
// 				`Anda yakin ingin menyimpan rekapitulasi HR BBQS untuk bulan ${bulan}?`,
// 				'Ya, Simpan',
// 				'bg-blue-600 hover:bg-blue-700'
// 			);
// 			if (setuju) {
// 				simpanRekapBBQS();
// 			}
// 		});
// 	}

// 	// ==========================================
// 	// 3. RADAR EVENT UNTUK HR EKSTRA
// 	// ==========================================
// 	const btnGenerateEks = document.getElementById('btn-eks-generate');
// 	const btnSalinEks = document.getElementById('btn-eks-salin');
// 	const btnSimpanEks = document.getElementById('btn-eks-simpan');
// 	const btnEditEks = document.getElementById('btn-eks-unlock');
// 	const filterBulanEks = document.getElementById('eks-filter-bulan');
// 	const filterTahunEks = document.getElementById('eks-filter-tahun');

// 	if (btnGenerateEks) {
// 		btnGenerateEks.addEventListener('click', function() {
// 			// generateTabelEkstra();
// 			// aturStateEkstra('DRAFT');
// 			console.log("Generate Ekstra diklik");
// 		});
// 	}

// 	if (btnSalinEks) {
// 		btnSalinEks.addEventListener('click', function() {
// 			// salinBulanLaluEkstra();
// 		});
// 	}

// 	if (btnEditEks) {
// 		btnEditEks.addEventListener('click', function() {
// 			// bukaKunciEkstra();
// 		});
// 	}

// 	// if (filterBulanEks) filterBulanEks.addEventListener('change', cekStatusBulanIniEkstra);
// 	// if (filterTahunEks) filterTahunEks.addEventListener('change', cekStatusBulanIniEkstra);

// 	if (btnSimpanEks) {
// 		btnSimpanEks.addEventListener('click', async function(e) {
// 			e.preventDefault();
// 			const bulan = document.getElementById('eks-filter-bulan').value;
// 			const setuju = await tampilkanKonfirmasi(
// 				'Simpan Data Ekstrakurikuler',
// 				`Anda yakin ingin menyimpan rekapitulasi HR Ekstrakurikuler untuk bulan ${bulan}?`,
// 				'Ya, Simpan',
// 				'bg-emerald-600 hover:bg-emerald-700'
// 			);
// 			if (setuju) {
// 				// simpanRekapEkstra();
// 			}
// 		});
// 	}

// 	// ==========================================
// 	// 4. RADAR UNTUK UNDUH / PRINT (BBQS & EKSTRA)
// 	// ==========================================
// 	const btnPrintBBQS = document.getElementById('btn-bbqs-print');
// 	if (btnPrintBBQS) {
// 		btnPrintBBQS.replaceWith(btnPrintBBQS.cloneNode(true));
// 		const btnBaruBBQS = document.getElementById('btn-bbqs-print');
// 		btnBaruBBQS.className = "hidden px-5 py-2 bg-green-600 text-white hover:bg-green-700 font-medium rounded-lg transition-colors flex items-center text-sm shadow-sm";
// 		btnBaruBBQS.innerHTML = `<i class="ph ph-microsoft-excel-logo mr-1.5 text-lg"></i> Unduh Excel`;
// 		btnBaruBBQS.addEventListener('click', function() {
// 			// unduhExcelBBQS();
// 		});
// 	}

// 	const btnPrintEks = document.getElementById('btn-eks-print');
// 	if (btnPrintEks) {
// 		btnPrintEks.replaceWith(btnPrintEks.cloneNode(true));
// 		const btnBaruEks = document.getElementById('btn-eks-print');
// 		btnBaruEks.className = "hidden px-5 py-2 bg-green-600 text-white hover:bg-green-700 font-medium rounded-lg transition-colors flex items-center text-sm shadow-sm";
// 		btnBaruEks.innerHTML = `<i class="ph ph-microsoft-excel-logo mr-1.5 text-lg"></i> Unduh Excel`;
// 		btnBaruEks.addEventListener('click', function() {
// 			// unduhExcelEkstra();
// 		});
// 	}
// }

// // ==========================================
// // BATCH 3: CEK STATUS, STATE UI, & SALIN DATA
// // ==========================================

// // 1. FUNGSI PENGENDALI TAMPILAN (UI STATE) YANG DISEMPURNAKAN
// function aturStateBBQS(state, bulan = '', tahun = '') {
// 	const btnSimpan = document.getElementById('btn-bbqs-simpan');
// 	const btnUnlock = document.getElementById('btn-bbqs-unlock');
// 	const btnPrint = document.getElementById('btn-bbqs-print');
// 	const btnGenerate = document.getElementById('btn-bbqs-generate');
// 	const btnSalin = document.getElementById('btn-bbqs-salin');

// 	// Filter Global
// 	const filterBulan = document.getElementById('bbqs-filter-bulan');
// 	const filterTahun = document.getElementById('bbqs-filter-tahun');
// 	const inputTarif = document.getElementById('bbqs-tarif-satuan');
// 	const badge = document.getElementById('bbqs-status-badge');
// 	const tbody = document.getElementById('table-body-bbqs');

// 	const semuaInputVol = document.querySelectorAll('.input-vol-bbqs');
// 	if (filterBulan) filterBulan.disabled = false;
//   if (filterTahun) filterTahun.disabled = false;

// 	if (state === 'KOSONG') {
// 		if (btnSimpan) {
// 			btnSimpan.classList.remove('hidden');
// 			btnSimpan.disabled = true;
// 		}
// 		if (btnUnlock) btnUnlock.classList.add('hidden');
// 		if (btnPrint) btnPrint.classList.add('hidden');

// 		if (btnSalin) btnSalin.classList.remove('hidden'); // Munculkan Salin
// 		if (btnGenerate) {
// 			btnGenerate.disabled = false; // Aktifkan Generate
// 			btnGenerate.classList.remove('opacity-50', 'cursor-not-allowed');
// 		}

// 		if (filterBulan) filterBulan.disabled = false;
// 		if (filterTahun) filterTahun.disabled = false;
// 		if (inputTarif) {
// 			inputTarif.disabled = false;
// 			inputTarif.classList.remove('opacity-50', 'cursor-not-allowed');
// 		}

// 		if (badge) {
// 			badge.innerHTML = 'Belum Disimpan';
// 			badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-gray-200 text-gray-600";
// 		}
// 		if (tbody) {
// 			tbody.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-gray-500 font-medium">Silakan klik tombol "Generate Tabel" untuk memulai pengisian bulan ini.</td></tr>`;
// 		}
// 	} else if (state === 'DRAFT') {
// 		if (btnSimpan) {
// 			btnSimpan.classList.remove('hidden');
// 			btnSimpan.disabled = false;
// 		}
// 		if (btnUnlock) btnUnlock.classList.add('hidden');
// 		if (btnPrint) btnPrint.classList.add('hidden');

// 		if (btnSalin) btnSalin.classList.remove('hidden'); // Munculkan Salin
// 		if (btnGenerate) {
// 			btnGenerate.disabled = false; // Aktifkan Generate
// 			btnGenerate.classList.remove('opacity-50', 'cursor-not-allowed');
// 		}

// 		if (filterBulan) filterBulan.disabled = false; // Kunci saat draft (harus clear/generate ulang jika mau ganti)
// 		if (filterTahun) filterTahun.disabled = false;
// 		if (inputTarif) inputTarif.disabled = false;

// 		semuaInputVol.forEach(input => {
// 			input.disabled = false;
// 			input.classList.remove('bg-gray-100', 'cursor-not-allowed');
// 		});

// 		if (badge) {
// 			badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-yellow-500 inline-block mr-1"></span> Mode Edit: ${bulan} ${tahun}`;
// 			badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 flex items-center shadow-sm";
// 		}
// 	} else if (state === 'LOCKED') {
// 		if (btnSimpan) btnSimpan.classList.add('hidden');
// 		if (btnUnlock) btnUnlock.classList.remove('hidden');
// 		if (btnPrint) btnPrint.classList.remove('hidden');

// 		// BUG FIX: Sembunyikan tombol Salin & Nonaktifkan Generate + Filter
// 		if (btnSalin) btnSalin.classList.add('hidden');
// 		if (btnGenerate) {
// 			btnGenerate.disabled = true;
// 			btnGenerate.classList.add('opacity-50', 'cursor-not-allowed');
// 		}

// 		if (inputTarif) {
// 			inputTarif.disabled = true;
// 			inputTarif.classList.add('opacity-50', 'cursor-not-allowed');
// 		}
		
// 		semuaInputVol.forEach(input => {
// 			input.disabled = true;
// 			input.classList.add('bg-gray-100', 'cursor-not-allowed');
// 		});

// 		if (badge) {
// 			badge.innerHTML = `<i class="ph ph-check-circle mr-1 text-lg"></i> Tersimpan: ${bulan} ${tahun}`;
// 			badge.className = "px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 flex items-center shadow-sm";
// 		}
// 	}
// }

// // 2. FUNGSI CEK DATA SUPABASE SAAT GANTI BULAN
// async function cekStatusBulanIniBBQS() {
// 	const bulan = document.getElementById('bbqs-filter-bulan').value;
// 	const tahun = document.getElementById('bbqs-filter-tahun').value;
// 	const tbody = document.getElementById('table-body-bbqs');

// 	if (!bulan || !tahun) {
// 		aturStateBBQS('KOSONG');
// 		return;
// 	}

// 	// Tampilkan loading di tabel
// 	tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-gray-500"><i class="ph ph-spinner animate-spin text-2xl mb-2"></i><br>Mengecek data ${bulan}...</td></tr>`;
// 	aturStateBBQS('KOSONG');

// 	try {
// 		const {
// 			data,
// 			error
// 		} = await supabaseClient
// 			.from('transaksi_hr_bbqs')
// 			.select('*')
// 			.eq('bulan', bulan)
// 			.eq('tahun_ajaran', tahun);

// 		if (error) throw error;

// 		if (data && data.length > 0) {
// 			// JIKA DATA ADA: Generate kerangka tabel dulu, lalu isi angkanya!
// 			generateTabelBBQS(); // (Fungsi Batch 1)

// 			// Set Tarif Global dari DB (ambil dari baris pertama)
// 			document.getElementById('bbqs-tarif-satuan').value = data[0].tarif_satuan || 15000;

// 			// Masukkan volume ke masing-masing guru
// 			data.forEach(row => {
// 				const input = document.querySelector(`.input-vol-bbqs[data-id="${row.guru_id}"]`);
// 				if (input) input.value = row.volume;
// 			});

// 			// Kalkulasi dan Kunci
// 			kalkulasiBBQS();
// 			showToast(`Data riwayat gaji BBQS ${bulan} ${tahun} ditemukan!`, 'success');
// 			aturStateBBQS('LOCKED', bulan, tahun);
// 		} else {
// 			// JIKA KOSONG: Bersihkan tabel dan suruh Generate manual
// 			tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-gray-500 italic">Belum ada data untuk ${bulan} ${tahun}. Silakan klik "Generate Tabel".</td></tr>`;
// 			aturStateBBQS('KOSONG');
// 		}
// 	} catch (err) {
// 		console.error("Error cek data BBQS:", err);
// 		tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-red-500">Gagal mengambil data dari server.</td></tr>`;
// 	}
// }

// // 3. FUNGSI SALIN DARI BULAN SEBELUMNYA
// async function salinBulanLaluBBQS() {
// 	const bulanSekarang = document.getElementById('bbqs-filter-bulan').value;
// 	const tahunSekarang = document.getElementById('bbqs-filter-tahun').value;

// 	if (!bulanSekarang || !tahunSekarang) {
// 		tampilkanModalNotif('Gagal!','Pilih Bulan dan Tahun Ajaran saat ini terlebih dahulu!','error');
// 		setTimeout(() => {
//       tutupModalNotif()
//     }, 3000);
// 		return;
// 	}

// 	const daftarBulan = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
// 	const indexBulanIni = daftarBulan.indexOf(bulanSekarang);

// 	if (indexBulanIni === -1) return;

// 	if (indexBulanIni === 0) {
// 		tampilkanModalNotif('Gagal!','Juli adalah awal tahun ajaran. Tidak bisa menyalin dari bulan sebelumnya.','error');
// 		setTimeout(() => {
//       tutupModalNotif()
//     }, 3000);
// 		return;
// 	}

// 	const bulanLalu = daftarBulan[indexBulanIni - 1];

// 	// Animasi Loading
// 	const btnSalin = document.getElementById('btn-bbqs-salin');
// 	const teksAsli = btnSalin.innerHTML;
// 	btnSalin.innerHTML = `<i class="ph ph-spinner animate-spin mr-1 text-lg"></i> Mencari...`;
// 	btnSalin.disabled = true;

// 	try {
// 		const {
// 			data,
// 			error
// 		} = await supabaseClient
// 			.from('transaksi_hr_bbqs')
// 			.select('guru_id, volume, tarif_satuan')
// 			.eq('bulan', bulanLalu)
// 			.eq('tahun_ajaran', tahunSekarang);

// 		if (error) throw error;

// 		if (data && data.length > 0) {
// 			// Jika tabel kosong, generate form-nya dulu
// 			const tbody = document.getElementById('table-body-bbqs');
// 			if (tbody.querySelectorAll('.bbqs-row').length === 0) {
// 				generateTabelBBQS();
// 			}

// 			// Timpa angka dari bulan lalu ke form sekarang
// 			let adaYangDisalin = false;
// 			document.getElementById('bbqs-tarif-satuan').value = data[0].tarif_satuan || 15000;

// 			data.forEach(row => {
// 				const input = document.querySelector(`.input-vol-bbqs[data-id="${row.guru_id}"]`);
// 				if (input) {
// 					input.value = row.volume;
// 					adaYangDisalin = true;
// 				}
// 			});

// 			if (adaYangDisalin) {
// 				kalkulasiBBQS();
// 				tampilkanModalNotif('Sukses!',`Sukses! Volume jam mengajar dari bulan ${bulanLalu} telah disalin. Silakan cek ulang dan klik Simpan.`,'success');
// 				setTimeout(() => {
// 					tutupModalNotif()
// 				}, 3000);
// 			}
// 		} else {
// 			tampilkanModalNotif('Gagal!',`Tidak ada data gaji BBQS yang tersimpan di bulan ${bulanLalu}.`,'error');
// 				setTimeout(() => {
// 				tutupModalNotif()
// 			}, 3000);
// 		}
// 	} catch (err) {
// 		console.error("Error salin data:", err);
// 		tampilkanModalNotif('Gagal!','Terjadi kesalahan saat menyalin data.','error');
// 		setTimeout(() => {
//       tutupModalNotif()
//     }, 3000);
// 	} finally {
// 		btnSalin.innerHTML = teksAsli;
// 		btnSalin.disabled = false;
// 	}
// }