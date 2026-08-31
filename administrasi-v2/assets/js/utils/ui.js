function showLoading(msg = "Memuat data...") {
	document.getElementById('loading-text').innerText = msg;
	document.getElementById('loading-overlay').classList.remove('hidden');
	document.getElementById('loading-overlay').classList.add('flex');
}

function hideLoading() {
	document.getElementById('loading-overlay').classList.add('hidden');
	document.getElementById('loading-overlay').classList.remove('flex');
}

function showToast(msg, type = 'success') {
	const toast = document.getElementById('toast');
	document.getElementById('toast-msg').innerText = msg;

	toast.className = `fixed bottom-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 flex items-center z-50 ${type === 'success' ? 'bg-emerald-600' : (type === 'info' ? 'bg-blue-600' : 'bg-red-600')}`;

	toast.classList.remove('translate-y-20', 'opacity-0');
	setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000);
}

function tampilkanModalNotif(judul, pesan, tipe) {
	const modal = document.getElementById('modal-notifikasi');
	const iconContainer = document.getElementById('notif-icon-container');
	const icon = document.getElementById('notif-icon');
	const title = document.getElementById('notif-title');
	const message = document.getElementById('notif-message');
	const btn = document.getElementById('notif-btn');

	title.innerText = judul;
	message.innerText = pesan;
	btn.classList.add('hidden'); // Sembunyikan tombol secara default

	// Atur Tema Berdasarkan Tipe
	if (tipe === 'loading') {
		iconContainer.className = 'mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 bg-blue-100 text-blue-600';
		icon.className = 'ph ph-spinner animate-spin text-4xl';
	} else if (tipe === 'warning') {
		iconContainer.className = 'mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 bg-yellow-100 text-yellow-600';
		icon.className = 'ph ph-warning-circle text-4xl';
		btn.className = 'w-full py-2.5 rounded-lg font-medium text-white transition-colors bg-yellow-500 hover:bg-yellow-600 block';
		btn.innerText = 'Mengerti';
	} else if (tipe === 'error') {
		iconContainer.className = 'mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 bg-red-100 text-red-600';
		icon.className = 'ph ph-x-circle text-4xl';
		btn.className = 'w-full py-2.5 rounded-lg font-medium text-white transition-colors bg-red-500 hover:bg-red-600 block';
		btn.innerText = 'Tutup';
	} else if (tipe === 'success') {
		iconContainer.className = 'mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 bg-emerald-100 text-emerald-600';
		icon.className = 'ph ph-check-circle text-4xl';
		btn.className = 'w-full py-2.5 rounded-lg font-medium text-white transition-colors bg-emerald-500 hover:bg-emerald-600 block';
		btn.innerText = 'Selesai';
	}

	// Tampilkan Modal dengan Animasi
	modal.classList.remove('hidden');
	modal.classList.add('flex');
	setTimeout(() => {
		modal.classList.remove('opacity-0');
		modal.querySelector('div').classList.remove('scale-95');
		modal.querySelector('div').classList.add('scale-100');
	}, 10);
}

function tutupModalNotif() {
	const modal = document.getElementById('modal-notifikasi');
	modal.classList.add('opacity-0');
	modal.querySelector('div').classList.remove('scale-100');
	modal.querySelector('div').classList.add('scale-95');
	setTimeout(() => {
		modal.classList.add('hidden');
		modal.classList.remove('flex');
	}, 300);
}

function toggleMobileForm(contentId, iconId) {
	if (window.innerWidth >= 768) return;
	const content = document.getElementById(contentId);
	const icon = document.getElementById(iconId);
	content.classList.toggle('hidden');
	if (content.classList.contains('hidden')) {
		if (icon) {
			icon.classList.remove('ph-caret-up');
			icon.classList.add('ph-caret-down');
		}
	} else {
		if (icon) {
			icon.classList.remove('ph-caret-down');
			icon.classList.add('ph-caret-up');
		}
	}
}

function toggleSidebar() {
	const sidebar = document.getElementById('admin-sidebar');
	const overlay = document.getElementById('sidebar-overlay');
	if (sidebar.classList.contains('-translate-x-full')) {
		sidebar.classList.remove('-translate-x-full');
		overlay.classList.remove('hidden');
	} else {
		sidebar.classList.add('-translate-x-full');
		overlay.classList.add('hidden');
	}
}

function initDropdowns() {
	if (!dbMaster) return;

	// ========================================================
	// 1. UPDATE TAHUN AKTIF (Pindah ke atas agar siap dipakai loop)
	// ========================================================
	const setTahunAktif = dbPengaturan.find(p => p.kunci === 'tahun_ajaran_aktif');
	if (setTahunAktif) {
		globalTahunAktif = setTahunAktif.nilai;
		// Perbarui label di layar jika elemennya ada
		const labelEl = document.getElementById('label-tahun-aktif-sekarang');
		if (labelEl) labelEl.innerText = globalTahunAktif;
	}

	const mapOpt = (arr) => arr ? arr.map(i => `<option value="${i}">${i}</option>`).join('') : '';

	// ========================================================
	// 2. PENERAPAN DRY (Daftar Semua Dropdown Standar)
	// ========================================================
	const daftarDropdown = [
		// Form Transaksi & Master
		{
			id: 'input-jenis',
			data: dbMaster.jenisPembayaran
		},
		{
			id: 'input-tahun',
			data: dbMaster.tahunAjaran
		},
		{
			id: 'input-tahun-atribut',
			data: dbMaster.tahunAjaran
		},
		{
			id: 'out-jenis',
			data: dbMaster.jenisPengeluaran
		},
		{
			id: 'out-tahun',
			data: dbMaster.tahunAjaran
		},
		{
			id: 'out-non-jenis',
			data: dbMaster.jenisPengeluaranNon
		},
		{
			id: 'out-non-tahun',
			data: dbMaster.tahunAjaran
		},
		{
			id: 'bantuan-jenis',
			data: dbMaster.jenisBantuan
		},
		{
			id: 'bantuan-tahun',
			data: dbMaster.tahunAjaran
		},
		{
			id: 'tarif-tahun',
			data: dbMaster.tahunAjaran
		},
		{
			id: 'master_atribut-tahun',
			data: dbMaster.tahunAjaran
		},

		// Filter Laporan & Buku Besar
		{
			id: 'filter-tahun-ajaran',
			data: dbMaster.tahunAjaran
		},
		{
			id: 'filter-jenis-nonops',
			data: dbMaster.jenisPengeluaranNon
		},
		{
			id: 'filter-tahun-nonops',
			data: dbMaster.tahunAjaran
		},
		{
			id: 'filter-tahun-bukubesar',
			data: dbMaster.tahunAjaran
		},

		// Dropdown dengan Imbuhan Text Default (Prefix)
		{
			id: 'cetak-tahun',
			data: dbMaster.tahunAjaran,
			prefix: '<option value="All">-- Pilih Tahun Ajaran</option>'
		},
		{
			id: 'filter-dash-tahun',
			data: dbMaster.tahunAjaran,
			prefix: '<option value="All">Semua Tahun Ajaran</option>'
		},
		{
			id: 'setting-tahun-ajaran',
			data: dbMaster.tahunAjaran,
			prefix: '<option value="">Pilih Tahun Ajaran...</option>'
		}
	];

	// Eksekusi semua dropdown dengan 1 loop!
	daftarDropdown.forEach(item => {
		const el = document.getElementById(item.id);
		if (el) {
			// Render HTML (Gabungkan prefix jika ada, lalu tambah option dari dbMaster)
			el.innerHTML = (item.prefix || '') + mapOpt(item.data);

			// 🚀 Otomatis Kunci ke Tahun Aktif (Soft Reset) jika ID-nya mengandung kata "tahun"
			if (item.id.includes('tahun') && globalTahunAktif) {
				el.value = globalTahunAktif;
			}
		}
	});

	// ========================================================
	// 3. LOGIKA CUSTOM (TIDAK BISA DI-DRY KARENA SPESIFIK)
	// ========================================================

	// A. Atribut (Penyaringan Nilai Unik)
	const eAtributJenis = document.getElementById('input-jenis-atribut');
	if (eAtributJenis) {
		const unikAtribut = [...new Set(dbMasterAtribut.filter(a => !a.isDeleted).map(a => a.jenis))];
		eAtributJenis.innerHTML = '<option value="">-- Pilih Atribut --</option>' + unikAtribut.map(i => `<option value="${i}">${i}</option>`).join('');
	}

	// B. Filter & Cetak Kelas (Pengelompokan Aktif / Lulus)
	const elFilterKelas = document.getElementById('filter-kelas');
	const elCetakKelas = document.getElementById('cetak-kelas');
	const elCetakSuratKelas = document.getElementById('surat-kelas-massal');

	if (typeof adminTableState !== 'undefined' && adminTableState.datasiswa) {
		let isAktif = adminTableState.datasiswa.activeTab === 'aktif';
		let filteredList = dbSiswa.filter(s => {
			let isNon = String(s.kelas).toUpperCase().includes('LULUS') || String(s.kelas).toUpperCase().includes('KELUAR');
			return isAktif ? !isNon : isNon;
		});

		let unikKelas = [...new Set(filteredList.map(s => s.kelas).filter(Boolean))].sort();
		if (elFilterKelas) elFilterKelas.innerHTML = `<option value="All">${isAktif ? 'Semua Kelas' : 'Semua Status'}</option>` + unikKelas.map(k => `<option value="${k}">${k}</option>`).join('');
	}

	let aktifOnly = [...new Set(dbSiswa.filter(s => !(String(s.kelas).toUpperCase().includes('LULUS') || String(s.kelas).toUpperCase().includes('KELUAR'))).map(s => s.kelas))].sort();
	if (elCetakKelas) elCetakKelas.innerHTML = aktifOnly.map(k => `<option value="${k}">${k}</option>`).join('');
	if (elCetakSuratKelas) elCetakSuratKelas.innerHTML = aktifOnly.map(k => `<option value="${k}">${k}</option>`).join('');
}

function getItemsPerPage() {
	const availableHeight = window.innerHeight - 360;
	const rowHeight = 65;
	let items = Math.floor(availableHeight / rowHeight);
	return items < 5 ? 5 : (items > 20 ? 20 : items);
}

function validasiDanTampilkanSiswa(nis, prefixForm = '') {
	// prefixForm berguna untuk membedakan ID HTML. 
	// SPP pakai prefix '', Atribut pakai prefix '-atribut'

	if (!nis) {
		nis = document.getElementById(`input-nis${prefixForm}`).value.trim();
	}

	const siswa = dbSiswa.find(s => String(s.nis).trim() === nis);
	const elNama = document.getElementById(`info-nama-siswa${prefixForm}`);
	const alertBox = document.getElementById(`alert-tunggakan${prefixForm}`);
	const btnSubmit = document.getElementById(`btn-submit${prefixForm}`);

	// Buka kunci form standar
	if (btnSubmit) {
		btnSubmit.disabled = false;
		btnSubmit.classList.remove('opacity-50');
	}

	// Kosongkan form referensi
	const refId = prefixForm === '' ? 'edit-id-nota-referensi-pemasukan' : 'edit-id-nota-referensi';
	document.getElementById(refId).value = "";

	if (siswa) {
		elNama.innerHTML = `<i class="ph ph-user-circle mr-1 text-lg"></i> ${siswa.nama} (${siswa.kelas})`;
		elNama.classList.remove('hidden', 'text-red-600');
		elNama.classList.add(prefixForm === '' ? 'text-cyan-600' : 'text-indigo-600');

		// Isi form tersembunyi
		document.getElementById(`edit-nama${prefixForm === '' ? '-pemasukan' : '-atribut'}`).value = siswa.nama;
		document.getElementById(`edit-lp${prefixForm === '' ? '-pemasukan' : '-atribut'}`).value = siswa.lp;
	} else {
		elNama.innerHTML = '<i class="ph ph-x-circle mr-1 text-lg"></i> Siswa tidak ditemukan';
		elNama.classList.remove('hidden', 'text-cyan-600', 'text-indigo-600');
		elNama.classList.add('text-red-600');
		if (alertBox) alertBox.classList.add('hidden');
	}

	return {
		siswa,
		nisFinal: nis
	}; // Kembalikan datanya untuk dipakai menghitung hutang
}

// Inisialisasi Script Tahun PPDB
const startYear = 2026;
const currentYear = new Date().getFullYear();
let formYear;
const month = new Date().getMonth();
if (month < 6) formYear = currentYear;
else formYear = currentYear + 1;
const endYear = currentYear + 1;
document.getElementById("tahun-ppdb").textContent = `${startYear}/${endYear}`;

function setupUIEvents() {
  const btnSidebar = document.querySelectorAll('.trigger-sidebar');
  const btnCaret = document.querySelectorAll('.trigger-caret');
	const modalNotif = document.getElementById('notif-btn');

  btnSidebar.forEach(function(elemen) {
    elemen.addEventListener('click', toggleSidebar);
  });

  btnCaret.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const content = this.getAttribute('data-content');
      const icon = this.getAttribute('data-icon');

      toggleMobileForm(content, icon);
    });
  });

	if (modalNotif) modalNotif.addEventListener('click', tutupModalNotif);
}