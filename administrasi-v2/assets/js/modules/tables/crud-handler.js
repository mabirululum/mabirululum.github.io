function setEditMode(tipe, mode) {
	const btnSubmit = document.getElementById(`btn-submit-${tipe}`);
	const btnCancel = document.getElementById(`btn-cancel-${tipe}`);
	if (mode) {
		btnSubmit.innerText = 'Update Data';
		btnSubmit.classList.replace('w-full', 'w-2/3');
		btnCancel.classList.remove('hidden');
	} else {
		btnSubmit.innerText = 'Simpan Data';
		btnSubmit.classList.replace('w-2/3', 'w-full');
		btnCancel.classList.add('hidden');
	}
}

function cancelEdit(tipe) {
	const formId = tipe === 'pemasukan' ? 'form-pembayaran' : tipe === 'bantuan' ? 'form-bantuan' : tipe === 'pengeluaran-non' ? 'form-pengeluaran-non' : `form-${tipe}`;
	const form = document.getElementById(formId);
	if (form) form.reset();
	const idField = document.getElementById(`edit-id-${tipe}`);
	if (idField) idField.value = '';
	setEditMode(tipe, false);
	if (tipe === 'pemasukan') {
		document.getElementById('info-nama-siswa').classList.add('hidden');
		document.getElementById('input-nis').classList.replace('border-red-500', 'border-gray-300');
	}
	if (tipe === 'atribut') {
		document.getElementById('alert-tunggakan-atribut').classList.add('hidden');
		document.getElementById('info-nama-siswa-atribut').classList.add('hidden');
		document.getElementById('info-harga-katalog-teks').classList.add('hidden');
		document.getElementById('edit-id-nota-referensi').value = "";
		document.getElementById('edit-acuan-bayar-atribut').value = "";
		document.getElementById('input-status-atribut').disabled = false;

		const inputNominal = document.getElementById('input-nominal-atribut');
		if (inputNominal) {
			inputNominal.readOnly = true;
			inputNominal.classList.add('bg-gray-50');
		}
	}
}

function editData(tipe, id) {
	const strId = String(id);
	if (tipe === 'pemasukan') {
		const trx = dbPembayaran.find(t => String(t.id) === strId);
		if (!trx) return;
		document.getElementById('edit-id-pemasukan').value = trx.id;
		document.getElementById('edit-acuan-pemasukan').value = trx.acuanBayar;
		document.getElementById('edit-tgl-pemasukan').value = trx.tanggalInput;
		document.getElementById('edit-waktu-pemasukan').value = trx.waktuInput;
		document.getElementById('edit-nama-pemasukan').value = trx.nama;
		document.getElementById('edit-lp-pemasukan').value = trx.lp;
		document.getElementById('input-nis').value = trx.nis;
		cekNamaSiswa(trx.nis);
		document.getElementById('input-jenis').value = trx.jenis;
		document.getElementById('input-tahun').value = trx.tahun;
		document.getElementById('input-nominal').value = trx.nominal;
	} else if (tipe === 'bantuan') {
		const trx = dbBantuan.find(t => String(t.id) === strId);
		if (!trx) return;
		document.getElementById('edit-id-bantuan').value = trx.id;
		document.getElementById('bantuan-tgl-transaksi').value = trx.tglTransaksi;
		document.getElementById('edit-tgl-bantuan').value = trx.tanggalInput;
		document.getElementById('edit-waktu-bantuan').value = trx.waktuInput;
		document.getElementById('bantuan-keterangan').value = trx.keterangan;
		document.getElementById('bantuan-jenis').value = trx.jenis;
		document.getElementById('bantuan-tahun').value = trx.tahun;
		document.getElementById('bantuan-nominal').value = trx.nominal;
	} else if (tipe === 'pengeluaran') {
		const trx = dbPengeluaran.find(t => String(t.id) === strId);
		if (!trx) return;
		document.getElementById('edit-id-pengeluaran').value = trx.id;
		document.getElementById('out-tgl-transaksi').value = trx.tglTransaksi;
		document.getElementById('edit-tgl-pengeluaran').value = trx.tanggalInput;
		document.getElementById('edit-waktu-pengeluaran').value = trx.waktuInput;
		document.getElementById('out-keterangan').value = trx.keterangan;
		document.getElementById('out-jenis').value = trx.jenis;
		document.getElementById('out-tahun').value = trx.tahun;
		document.getElementById('out-nominal').value = trx.nominal;
	} else if (tipe === 'pengeluaran-non') {
		const trx = dbPengeluaranNon.find(t => String(t.id) === strId);
		if (!trx) return;
		document.getElementById('edit-id-pengeluaran-non').value = trx.id;
		document.getElementById('out-non-tgl-transaksi').value = trx.tglTransaksi;
		document.getElementById('edit-tgl-pengeluaran-non').value = trx.tanggalInput;
		document.getElementById('edit-waktu-pengeluaran-non').value = trx.waktuInput;
		document.getElementById('out-non-keterangan').value = trx.keterangan;
		document.getElementById('out-non-jenis').value = trx.jenis;
		document.getElementById('out-non-tahun').value = trx.tahun;
		document.getElementById('out-non-nominal').value = trx.nominal;
	} else if (tipe === 'infaq') {
		const trx = dbInfaq.find(t => String(t.id) === strId);
		if (!trx) return;
		document.getElementById('edit-id-infaq').value = trx.id;
		document.getElementById('infaq-tgl-transaksi').value = trx.tglTransaksi;
		document.getElementById('edit-tgl-infaq').value = trx.tanggalInput;
		document.getElementById('edit-waktu-infaq').value = trx.waktuInput;
		document.getElementById('infaq-jenis').value = trx.jenis;
		document.getElementById('infaq-keterangan').value = trx.keterangan;
		document.getElementById('infaq-nominal').value = trx.nominal;
	} else if (tipe === 'tarif') {
		const trx = dbMasterTarif.find(t => String(t.id) === strId);
		if (!trx) return;
		document.getElementById('edit-id-tarif').value = trx.id;
		document.getElementById('tarif-tahun').value = trx.tahun;
		document.getElementById('tarif-target').value = trx.target;
		document.getElementById('tarif-jenis').value = trx.jenis;
		document.getElementById('tarif-nominal').value = trx.nominal;
	} else if (tipe === 'master_atribut') {
		const trx = dbMasterAtribut.find(t => String(t.id) === strId);
		if (!trx) return;
		document.getElementById('edit-id-master_atribut').value = trx.id;
		document.getElementById('master_atribut-tahun').value = trx.tahun;
		document.getElementById('master_atribut-jenis').value = trx.jenis;
		document.getElementById('master_atribut-nominal').value = trx.nominal;
	} else if (tipe === 'master_guru') {
		const trx = dbMasterGuru.find(t => String(t.id) === strId);
		if (!trx) return;
		
		// Isi form input teks/angka
		document.getElementById('edit-id-master_guru').value = trx.id;
		document.getElementById('master_guru-kode').value = trx.kode_guru || '';
		document.getElementById('master_guru-tahun').value = trx.tahun_masuk || '';
		document.getElementById('master_guru-nama').value = trx.nama || '';
		document.getElementById('master_guru-jabatan').value = trx.jabatan || '';
		
		// Isi form checkbox peran (menggunakan .checked)
		document.getElementById('check-guru-tendik').checked = trx.is_tendik || false;
		document.getElementById('check-guru-bbqs').checked = trx.is_bbqs || false;
		document.getElementById('check-guru-ekstra').checked = trx.is_ekstra || false;
  } else if (tipe === 'tarif_tunjangan') {
		const trx = dbMasterTarifTunjangan.find(t => String(t.id) === strId);
		if (!trx) return;
		
		document.getElementById('edit-id-tarif_tunjangan').value = trx.id;
		document.getElementById('tarif_tunjangan-tahun').value = trx.tahunAjaran || '';
		document.getElementById('tarif_tunjangan-kategori').value = trx.kategori || 'Struktural';
		document.getElementById('tarif_tunjangan-nama').value = trx.namaTugas || '';
		document.getElementById('tarif_tunjangan-nominal').value = trx.nominal || 0;
  } else if (tipe === 'user') {
		const trx = dbAdmin.find(t => String(t.id) === strId);
		if (!trx) return;
		document.getElementById('edit-id-user').value = trx.id;
		document.getElementById('edit-old-username').value = trx.username;
		document.getElementById('user-username').value = trx.username;
		document.getElementById('user-nama').value = trx.nama;
		document.getElementById('user-password').value = trx.password;
		document.getElementById('user-role').value = trx.role;
	} else if (tipe === 'atribut') {
		const trx = dbPemasukanAtribut.find(t => String(t.id) === strId);
		if (!trx) return;

		// Panggil deteksi siswa LEBIH DULU agar tidak menimpa data edit di bawahnya
		document.getElementById('input-nis-atribut').value = trx.nis;
		cekSiswaDanTunggakan(trx.nis);

		// Isi semua field tersembunyi
		document.getElementById('edit-id-atribut').value = trx.id;
		document.getElementById('edit-id-nota-referensi').value = trx.idRef || "";
		document.getElementById('edit-acuan-bayar-atribut').value = trx.acuanBayar;
		document.getElementById('edit-tgl-atribut').value = trx.tanggalInput || "";
		document.getElementById('edit-waktu-atribut').value = trx.waktuInput || "";
		document.getElementById('edit-nama-atribut').value = trx.nama;
		document.getElementById('edit-lp-atribut').value = trx.lp;
		document.getElementById('edit-harga-katalog-atribut').value = trx.hargaKatalog;

		// Isi input yang terlihat
		document.getElementById('input-tahun-atribut').value = trx.tahun;
		document.getElementById('input-jenis-atribut').value = trx.jenis;
		document.getElementById('input-status-atribut').value = (trx.nominal < trx.hargaKatalog || trx.idRef) ? 'Hutang' : 'Lunas';

		// Buka kunci input nominal agar bisa diedit
		const inputNominal = document.getElementById('input-nominal-atribut');
		inputNominal.value = trx.nominal;
		inputNominal.readOnly = false;
		inputNominal.classList.remove('bg-gray-50');
	}
	setEditMode(tipe, true);
}

// --- MODAL HAPUS DATA ---
function deleteData(tipe, id) {
	deleteTarget = {
		tipe: tipe,
		id: id
	};
	document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
	deleteTarget = {
		tipe: null,
		id: null
	};
	document.getElementById('delete-modal').classList.add('hidden');
}

async function confirmDelete() {
	const {
		tipe,
		id
	} = deleteTarget;
	document.getElementById('delete-modal').classList.add('hidden');

	let targetDb, renderFn;
	if (tipe === 'pemasukan') {
		targetDb = dbPembayaran;
		renderFn = loadAdminTable;
	} else if (tipe === 'atribut') {
		targetDb = dbPemasukanAtribut;
		renderFn = loadAdminAtributTable;
	} else if (tipe === 'bantuan') {
		targetDb = dbBantuan;
		renderFn = loadAdminBantuanTable;
	} else if (tipe === 'pengeluaran') {
		targetDb = dbPengeluaran;
		renderFn = loadAdminPengeluaranTable;
	} else if (tipe === 'pengeluaran-non') {
		targetDb = dbPengeluaranNon;
		renderFn = loadAdminPengeluaranNonTable;
	} else if (tipe === 'infaq') {
		targetDb = dbInfaq;
		renderFn = loadAdminInfaqTable;
	} else if (tipe === 'user') {
		targetDb = dbAdmin;
		renderFn = loadAdminUserTable;
	} else if (tipe === 'tarif') {
		targetDb = dbMasterTarif;
		renderFn = loadAdminTarifTable;
	} else if (tipe === 'master_atribut') {
		targetDb = dbMasterAtribut;
		renderFn = loadAdminMasterAtributTable;
	} else if (tipe === 'master_guru') {
		targetDb = dbMasterGuru;
		renderFn = loadAdminMasterGuruTable;
	} else if (tipe === 'tarif_tunjangan') {
		targetDb = dbMasterTarifTunjangan;
		renderFn = loadAdminMasterTarifTunjanganTable;
	}

	const idx = targetDb.findIndex(t => String(t.id) === String(id));
	if (idx === -1) return;

	if (tipe === 'user' || tipe === 'tarif') {
		backupDeletedData = targetDb[idx];
		backupDeletedIndex = idx;
		targetDb.splice(idx, 1);
	} else {
		targetDb[idx].isDeleted = true;
	}

	loadDashboardStats();
	renderFn();
	updateRestoreBadges();
	if (currentUserRole === 'Super Admin' && !document.getElementById('admin-view-restore').classList.contains('hidden')) loadRestoreTable();
	showToast('Menghapus dari server...', 'info');

	try {
		const tableName = getTableName(tipe);
		if (tipe === 'user' || tipe === 'tarif' || tipe === 'master_atribut' || tipe === 'master_guru') {
			const pkColumn = tipe === 'user' || tipe === 'master_atribut' || tipe === 'master_guru' ? 'id' : 'id_transaksi';
			const {
				error
			} = await supabaseClient.from(tableName).delete().eq(pkColumn, id);
			if (error) throw error;
		} else {
			const {
				error
			} = await supabaseClient.from(tableName).update({
				is_deleted: true,
				deleted_at: new Date().toISOString()
			}).eq('id_transaksi', id);
			if (error) throw error;
		}
		showToast('Berhasil dihapus!', 'success');
	} catch (error) {
		console.error(error);
		if (tipe === 'user' || tipe === 'tarif') targetDb.splice(backupDeletedIndex, 0, backupDeletedData);
		else targetDb[idx].isDeleted = false;

		loadDashboardStats();
		renderFn();
		updateRestoreBadges();
		if (currentUserRole === 'Super Admin') loadRestoreTable();
		showToast('Gagal menghapus di server. Data dikembalikan.', 'error');
	}
	deleteTarget = {
		tipe: null,
		id: null
	};
}

async function restoreData(tipe, id) {
	let targetDb, renderFn;
	if (tipe === 'pemasukan') {
		targetDb = dbPembayaran;
		renderFn = loadAdminTable;
	} else if (tipe === 'atribut') {
		targetDb = dbPemasukanAtribut;
		renderFn = loadAdminAtributTable;
	} else if (tipe === 'bantuan') {
		targetDb = dbBantuan;
		renderFn = loadAdminBantuanTable;
	} else if (tipe === 'pengeluaran') {
		targetDb = dbPengeluaran;
		renderFn = loadAdminPengeluaranTable;
	} else if (tipe === 'pengeluaran-non') {
		targetDb = dbPengeluaranNon;
		renderFn = loadAdminPengeluaranNonTable;
	} else if (tipe === 'infaq') {
		targetDb = dbInfaq;
		renderFn = loadAdminInfaqTable;
	}

	const idx = targetDb.findIndex(t => String(t.id) === String(id));
	if (idx === -1) return;

	targetDb[idx].isDeleted = false;
	loadDashboardStats();
	updateRestoreBadges();
	loadRestoreTable();
	renderFn();
	showToast('Memulihkan data...', 'info');

	try {
		const tableName = getTableName(tipe);
		const {
			error
		} = await supabaseClient.from(tableName).update({
			is_deleted: false,
			deleted_at: null
		}).eq('id_transaksi', id);
		if (error) throw error;
		showToast('Data berhasil dipulihkan!', 'success');
	} catch (error) {
		console.error(error);
		targetDb[idx].isDeleted = true;
		loadDashboardStats();
		updateRestoreBadges();
		loadRestoreTable();
		renderFn();
		showToast('Gagal memulihkan di server.', 'error');
	}
}

function switchRestoreTab(tab) {
	activeRestoreTab = tab;
	const tabs = ['pemasukan', 'atribut', 'bantuan', 'infaq', 'pengeluaran', 'pengeluaran-non'];
	tabs.forEach(t => {
		const el = document.getElementById(`rtab-${t}`);
		el.className = (t === tab) ? "flex-none px-6 py-3 text-sm font-semibold border-b-2 border-red-500 text-red-600 transition-colors flex items-center" : "flex-none px-6 py-3 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors flex items-center";
	});
	adminTableState.restore.page = 1;
	loadRestoreTable();
}

function updateRestoreBadges() {
	const counts = [{
			id: 'badge-res-pemasukan',
			count: dbPembayaran.filter(t => t.isDeleted).length
		},
		{
			id: 'badge-res-atribut',
			count: dbPemasukanAtribut.filter(t => t.isDeleted).length
		},
		{
			id: 'badge-res-bantuan',
			count: dbBantuan.filter(t => t.isDeleted).length
		},
		{
			id: 'badge-res-pengeluaran',
			count: dbPengeluaran.filter(t => t.isDeleted).length
		},
		{
			id: 'badge-res-pengeluaran-non',
			count: dbPengeluaranNon.filter(t => t.isDeleted).length
		},
		{
			id: 'badge-res-infaq',
			count: dbInfaq.filter(t => t.isDeleted).length
		}
	];
	let totalDeleted = 0;
	counts.forEach(c => {
		totalDeleted += c.count;
		const el = document.getElementById(c.id);
		if (el) {
			el.innerText = c.count;
			el.classList.toggle('hidden', c.count === 0);
		}
	});
	const navBadge = document.getElementById('nav-badge-restore');
	if (navBadge) {
		navBadge.innerText = totalDeleted;
		navBadge.classList.toggle('hidden', totalDeleted === 0);
	}
}

function setupCrudEvents() {
	const btnCancel = document.querySelectorAll('.btnCancel');
	const tabRestore = document.querySelectorAll('.tabRestore');
	const deleteCancel = document.getElementById('btn-delete-cancel');
	const deleteConfirm = document.getElementById('btn-delete-confirm');

	btnCancel.forEach(function(btn) {
		btn.addEventListener('click', function() {
			const nameBtn = this.getAttribute('data-btn');
			cancelEdit(nameBtn);
		});
	});

	tabRestore.forEach(function(tab) {
		tab.addEventListener('click', function() {
			const nameTab = this.getAttribute('id');
			switchRestoreTab(nameTab);
		});
	});

	if (deleteCancel) deleteCancel.addEventListener('click', closeDeleteModal)
	if (deleteConfirm) deleteConfirm.addEventListener('click', confirmDelete)
}