function submitBantuan(e) {
	e.preventDefault();
	const editId = document.getElementById('edit-id-bantuan').value;
	let data = {
		id: editId || `TEMP-${Date.now()}`,
		isEdit: !!editId,
		tglTransaksi: document.getElementById('bantuan-tgl-transaksi').value,
		keterangan: document.getElementById('bantuan-keterangan').value,
		jenis: document.getElementById('bantuan-jenis').value,
		tahun: document.getElementById('bantuan-tahun').value,
		nominal: parseInt(document.getElementById('bantuan-nominal').value)
	};
	if (data.isEdit) {
		data.tanggalInput = document.getElementById('edit-tgl-bantuan').value;
		data.waktuInput = document.getElementById('edit-waktu-bantuan').value;
	} else {
		data.tanggalInput = getNowDateIndo();
		data.waktuInput = getNowTime();
	}
	processOptimisticSave('bantuan', dbBantuan, data, loadAdminBantuanTable);
	document.getElementById('bantuan-tgl-transaksi').valueAsDate = new Date();
}

function submitInfaq(e) {
	e.preventDefault();
	const editId = document.getElementById('edit-id-infaq').value;
	let data = {
		id: editId || `TEMP-${Date.now()}`,
		isEdit: !!editId,
		tglTransaksi: document.getElementById('infaq-tgl-transaksi').value,
		jenis: document.getElementById('infaq-jenis').value,
		keterangan: document.getElementById('infaq-keterangan').value,
		nominal: parseInt(document.getElementById('infaq-nominal').value)
	};
	if (data.isEdit) {
		data.tanggalInput = document.getElementById('edit-tgl-infaq').value;
		data.waktuInput = document.getElementById('edit-waktu-infaq').value;
	} else {
		data.tanggalInput = getNowDateIndo();
		data.waktuInput = getNowTime();
	}
	processOptimisticSave('infaq', dbInfaq, data, loadAdminInfaqTable);
	document.getElementById('infaq-tgl-transaksi').valueAsDate = new Date();
}

function setupBantuanInfaqEvents() {
	const bantuan = document.getElementById('form-bantuan');
	const infaq = document.getElementById('form-infaq');

	if (bantuan) bantuan.addEventListener('submit', submitBantuan);
	if (infaq) infaq.addEventListener('submit', submitInfaq);
}