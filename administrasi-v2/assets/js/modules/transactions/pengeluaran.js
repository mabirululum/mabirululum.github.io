function submitPengeluaran(e) {
	e.preventDefault();
	const editId = document.getElementById('edit-id-pengeluaran').value;
	let data = {
		id: editId || `TEMP-${Date.now()}`,
		isEdit: !!editId,
		tglTransaksi: document.getElementById('out-tgl-transaksi').value,
		keterangan: document.getElementById('out-keterangan').value,
		jenis: document.getElementById('out-jenis').value,
		tahun: document.getElementById('out-tahun').value,
		nominal: parseInt(document.getElementById('out-nominal').value)
	};
	if (data.isEdit) {
		data.tanggalInput = document.getElementById('edit-tgl-pengeluaran').value;
		data.waktuInput = document.getElementById('edit-waktu-pengeluaran').value;
	} else {
		data.tanggalInput = getNowDateIndo();
		data.waktuInput = getNowTime();
	}
	processOptimisticSave('pengeluaran', dbPengeluaran, data, loadAdminPengeluaranTable);
	document.getElementById('out-tgl-transaksi').valueAsDate = new Date();
}

function submitPengeluaranNon(e) {
	e.preventDefault();
	const editId = document.getElementById('edit-id-pengeluaran-non').value;
	let data = {
		id: editId || `TEMP-${Date.now()}`,
		isEdit: !!editId,
		tglTransaksi: document.getElementById('out-non-tgl-transaksi').value,
		keterangan: document.getElementById('out-non-keterangan').value,
		jenis: document.getElementById('out-non-jenis').value,
		tahun: document.getElementById('out-non-tahun').value,
		nominal: parseInt(document.getElementById('out-non-nominal').value)
	};
	if (data.isEdit) {
		data.tanggalInput = document.getElementById('edit-tgl-pengeluaran-non').value;
		data.waktuInput = document.getElementById('edit-waktu-pengeluaran-non').value;
	} else {
		data.tanggalInput = getNowDateIndo();
		data.waktuInput = getNowTime();
	}
	processOptimisticSave('pengeluaran-non', dbPengeluaranNon, data, loadAdminPengeluaranNonTable);
	document.getElementById('out-non-tgl-transaksi').valueAsDate = new Date();
}

function setupPengeluaranEvents() {
	const pengeluaran = document.getElementById('form-pengeluaran');
	const pengeluaranNon = document.getElementById('form-pengeluaran-non');

	if (pengeluaran) pengeluaran.addEventListener('submit', submitPengeluaran);
	if (pengeluaranNon) pengeluaranNon.addEventListener('submit', submitPengeluaranNon);
}