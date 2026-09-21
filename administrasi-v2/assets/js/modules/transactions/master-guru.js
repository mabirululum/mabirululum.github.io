// Fungsi ini dipanggil saat Form Master Guru di-submit
function submitMasterGuru(e) {
	e.preventDefault();

	const id = document.getElementById('edit-id-master_guru').value;
	const isTendik = document.getElementById('check-guru-tendik').checked;
	const isBbqs = document.getElementById('check-guru-bbqs').checked;
	const isEkstra = document.getElementById('check-guru-ekstra').checked;

	if (!isTendik && !isBbqs && !isEkstra) {
		alert("Peringatan: Pilih minimal 1 peran/kategori guru!");
		return;
	}

	// Susun Payload
	const payload = {
		id: id ? id : 'TEMP-' + Date.now(), // ID Sementara agar tabel langsung ter-update (Optimistic UI)
		isEdit: !!id,
		kode_guru: document.getElementById('master_guru-kode').value.trim().toUpperCase(),
		tahun_masuk: parseInt(document.getElementById('master_guru-tahun').value) || null,
		nama: document.getElementById('master_guru-nama').value.trim(),
		jabatan: document.getElementById('master_guru-jabatan').value.trim() || null,
		tugas_tambahan: document.getElementById('master_guru-tugas_tambahan').value || null,
		is_tendik: isTendik,
		is_bbqs: isBbqs,
		is_ekstra: isEkstra,
		is_active: true
	};

	// Lempar ke Mandor Utama
	processOptimisticSave('master_guru', dbMasterGuru, payload, loadAdminMasterGuruTable);

	// Reset form dan tombol
	if (typeof cancelEdit === 'function') {
		cancelEdit('master_guru');
	} else {
		document.getElementById('form-master_guru').reset();
		document.getElementById('edit-id-master_guru').value = '';
	}
}

async function submitTarifTunjangan(e) {
	e.preventDefault();
	const idInput = document.getElementById('edit-id-tarif_tunjangan').value;
	const isEdit = !!idInput;
	const id = isEdit ? idInput : 'TEMP_' + Date.now();

	const payload = {
		isEdit,
		id,
		tahunAjaran: document.getElementById('tarif_tunjangan-tahun').value,
		kategori: document.getElementById('tarif_tunjangan-kategori').value,
		namaTugas: document.getElementById('tarif_tunjangan-nama').value,
		nominal: parseInt(document.getElementById('tarif_tunjangan-nominal').value || 0),
		isDeleted: false
	};

	// Panggil Mandor Penyimpan
	// await processOptimisticSave('tarif_tunjangan', dataObject, dbMasterTarifTunjangan, loadAdminTarifTunjanganTable);
	processOptimisticSave('tarif_tunjangan', dbMasterTarifTunjangan, payload, loadAdminTarifTunjanganTable);

	// Reset Form setelah berhasil
	e.target.reset();
	document.getElementById('edit-id-tarif_tunjangan').value = '';

	// Opsional: Setel ulang default value dropdown kategori ke Struktural
	document.getElementById('tarif_tunjangan-kategori').value = 'Struktural';
}

function editMasterGuru(id) {
	// Cari data guru di array lokal
	const guru = dbMasterGuru.find(g => g.id === id);
	if (!guru) return;

	// Isi form dengan data lama
	document.getElementById('edit-id-master_guru').value = guru.id;
	document.getElementById('master_guru-kode').value = guru.kode_guru;
	document.getElementById('master_guru-tahun').value = guru.tahun_masuk;
	document.getElementById('master_guru-nama').value = guru.nama;
	document.getElementById('master_guru-jabatan').value = guru.jabatan || '';
	document.getElementById('master_guru-tugas_tambahan').value = trx.tugas_tambahan || '';

	// Centang kategori
	document.getElementById('check-guru-tendik').checked = guru.is_tendik;
	document.getElementById('check-guru-bbqs').checked = guru.is_bbqs;
	document.getElementById('check-guru-ekstra').checked = guru.is_ekstra;

	// Ubah tampilan form menjadi "Mode Edit"
	document.getElementById('btn-cancel-master_guru').classList.remove('hidden');
	const btnSubmit = document.getElementById('btn-submit-master_guru');
	btnSubmit.innerHTML = 'Update Data Guru';
	btnSubmit.classList.replace('bg-indigo-600', 'bg-amber-600');
	btnSubmit.classList.replace('hover:bg-indigo-700', 'hover:bg-amber-700');
}

async function hapusMasterGuru(id) {
	if (!confirm('Apakah Anda yakin ingin menghapus data guru ini? Data yang terhapus tidak bisa dikembalikan.')) return;

	try {
		const {
			error
		} = await supabase.from('master_guru').delete().eq('id', id);
		if (error) throw error;

		alert('Data berhasil dihapus!');
		fetchMasterGuru();
	} catch (error) {
		console.error('Error delete master guru:', error);
		alert('Gagal menghapus data dari database.');
	}
}

function resetFormMasterGuru() {
	document.getElementById('form-master_guru').reset();
	document.getElementById('edit-id-master_guru').value = '';

	// Kembalikan tombol ke mode awal
	document.getElementById('btn-cancel-master_guru').classList.add('hidden');
	const btnSubmit = document.getElementById('btn-submit-master_guru');
	btnSubmit.innerHTML = 'Simpan Data Guru';
	btnSubmit.classList.replace('bg-amber-600', 'bg-indigo-600');
	btnSubmit.classList.replace('hover:bg-amber-700', 'hover:bg-indigo-700');
}

function setGuruTab(clickedTab) {
	const allTabs = document.querySelectorAll('.tabMasterGuru');
	const guruContent = document.getElementById('guru-content-data_guru');
	const tarifContent = document.getElementById('guru-content-tarif_guru');

	// 1. Reset warna semua tab menjadi abu-abu (tidak aktif)
	allTabs.forEach(t => {
		t.classList.remove('border-indigo-600', 'text-indigo-600');
		t.classList.add('border-transparent', 'text-gray-500');
	});

	// 2. Sembunyikan semua area konten tab
	if (guruContent) {
		guruContent.classList.add('hidden');
		guruContent.classList.remove('flex');
	}
	if (tarifContent) {
		tarifContent.classList.add('hidden');
		tarifContent.classList.remove('flex');
	}

	// 3. Aktifkan warna tab yang diklik menjadi Indigo
	clickedTab.classList.remove('border-transparent', 'text-gray-500');
	clickedTab.classList.add('border-indigo-600', 'text-indigo-600');

	// 4. Tampilkan area konten yang sesuai
	const tabName = clickedTab.getAttribute('tab-name'); // Dapat "data_guru" atau "tarif_guru"
	const targetContent = document.getElementById(`guru-content-${tabName}`);

	if (targetContent) {
		targetContent.classList.remove('hidden');
		targetContent.classList.add('flex');
	}
}

function populateDropdownJabatanGuru() {
	const elJabatan = document.getElementById('master_guru-jabatan');
	const elTambahan = document.getElementById('master_guru-tugas_tambahan');

	if (!elJabatan || !elTambahan) return;

	// Filter data tarif yang aktif (tidak dihapus)
	const tarifAktif = dbMasterTarifTunjangan.filter(t => !t.isDeleted);

	// Kita gunakan Set agar nama jabatannya unik (tidak dobel walau ada beberapa tahun ajaran)
	const listStruktural = [...new Set(tarifAktif.filter(t => t.kategori === 'Struktural').map(t => t.namaTugas))];
	const listTambahan = [...new Set(tarifAktif.filter(t => t.kategori === 'Tambahan').map(t => t.namaTugas))];

	// 1. Render opsi Jabatan Struktural
	let htmlJabatan = `<option value="">-- Pilih Jabatan Struktural --</option>`;
	listStruktural.forEach(nama => {
		htmlJabatan += `<option value="${nama}">${nama}</option>`;
	});
	// Jaga-jaga jika di Master Tarif belum ada data "Guru" standar
	if (!listStruktural.includes('Guru')) htmlJabatan += `<option value="Guru">Guru</option>`;
	elJabatan.innerHTML = htmlJabatan;

	// 2. Render opsi Tugas Tambahan
	let htmlTambahan = `<option value="">-- Tidak Ada / Kosong --</option>`;
	listTambahan.forEach(nama => {
		htmlTambahan += `<option value="${nama}">${nama}</option>`;
	});
	elTambahan.innerHTML = htmlTambahan;
}

function setupMasterGuruEvents() {
  const form = document.getElementById('form-master_guru');
  const formTarif = document.getElementById('form-tarif_tunjangan');
  const btnCancel = document.getElementById('btn-cancel-master_guru');
  const searchInput = document.getElementById('search-master_guru');
	const tabMaster = document.querySelectorAll('.tabMasterGuru');

  if (form) form.addEventListener('submit', submitMasterGuru);
  if (formTarif) formTarif.addEventListener('submit', submitTarifTunjangan);
  if (btnCancel) btnCancel.addEventListener('click', resetFormMasterGuru);
  if (searchInput) searchInput.addEventListener('input', loadAdminMasterGuruTable);

	tabMaster.forEach(function(tab) {
		tab.addEventListener('click', function() {
			setGuruTab(this);
		});
	});
}