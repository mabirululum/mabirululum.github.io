function submitTarif(e) {
	e.preventDefault();
	const editId = document.getElementById('edit-id-tarif').value;
	let data = {
		id: editId || `TEMP-${Date.now()}`,
		isEdit: !!editId,
		tahun: document.getElementById('tarif-tahun').value,
		target: document.getElementById('tarif-target').value.toUpperCase(),
		jenis: document.getElementById('tarif-jenis').value,
		nominal: parseInt(document.getElementById('tarif-nominal').value)
	};
	processOptimisticSave('tarif', dbMasterTarif, data, loadAdminTarifTable);
}

// 2. Ubah ID sementara menjadi "TEMP-"
function submitMasterAtribut(e) {
	e.preventDefault();
	const editId = document.getElementById('edit-id-master_atribut').value;
	let data = {
		id: editId || `TEMP-${Date.now()}`,
		isEdit: !!editId,
		tahun: document.getElementById('master_atribut-tahun').value,
		jenis: document.getElementById('master_atribut-jenis').value,
		nominal: parseInt(document.getElementById('master_atribut-nominal').value)
	};
	processOptimisticSave('master_atribut', dbMasterAtribut, data, loadAdminMasterAtributTable);
}

function submitUser(e) {
	e.preventDefault();
	const editId = document.getElementById('edit-id-user').value;
	const username = document.getElementById('user-username').value.trim();

	// ==========================================
	// 🚧 PENJAGA GERBANG: BLOKIR JIKA INI DATA BARU
	// ==========================================
	if (!editId) {
		// Jika editId kosong, berarti user sedang mencoba "Tambah Baru"
		showToast("PENAMBAHAN USER TERKUNCI Untuk keamanan\npenambahan user baru dialihkan melalui Dasbor Supabase (Menu Authentication).", "error");
		return; // Hentikan proses agar data tidak tersimpan
	}
	// ==========================================

	let data = {
		id: editId || `TEMP-${Date.now()}`,
		isEdit: !!editId,
		oldUsername: document.getElementById('edit-old-username').value,
		username: username,
		nama: document.getElementById('user-nama').value.trim(),
		password: document.getElementById('user-password').value,
		role: document.getElementById('user-role').value
	};

	if (!data.isEdit && dbAdmin.find(u => String(u.username).trim().toLowerCase() === String(username).trim().toLowerCase())) {
		showToast('Username terpakai!', 'error');
		return;
	}

	processOptimisticSave('user', dbAdmin, data, loadAdminUserTable);
}

function setupTarifEvents() {
  const masterTarif = document.getElementById('form-tarif');
	const MasterAtribut = document.getElementById('form-master_atribut');
  const user = document.getElementById('form-user');

	if (masterTarif) masterTarif.addEventListener('submit', submitTarif);
	if (MasterAtribut) MasterAtribut.addEventListener('submit', submitMasterAtribut);
	if (user) user.addEventListener('submit', submitUser);
}