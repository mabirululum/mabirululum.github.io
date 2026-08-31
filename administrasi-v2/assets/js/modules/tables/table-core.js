function handleSearch(type) {
	adminTableState[type].query = document.getElementById(`search-${type}`).value.toLowerCase();
	adminTableState[type].page = 1;
	changeAdminPage(type, 0);
}

function handleFilterKelas() {
	adminTableState.datasiswa.filterKelas = document.getElementById('filter-kelas').value;
	adminTableState.datasiswa.page = 1;
	loadAdminDataSiswaTable();
}

function changeAdminPage(type, delta) {
	adminTableState[type].page += delta;
	if (type === 'datasiswa') loadAdminDataSiswaTable();
	else if (type === 'pemasukan') loadAdminTable();
	else if (type === 'atribut') loadAdminAtributTable();
	else if (type === 'bantuan') loadAdminBantuanTable();
	else if (type === 'infaq') loadAdminInfaqTable();
	else if (type === 'pengeluaran') loadAdminPengeluaranTable();
	else if (type === 'pengeluaran-non') loadAdminPengeluaranNonTable();
	else if (type === 'tarif') loadAdminTarifTable();
	else if (type === 'master_atribut') loadAdminMasterAtributTable();
	else if (type === 'user') loadAdminUserTable();
	else if (type === 'restore') loadRestoreTable();
}

function updatePaginationUI(type, tItems, pDataLength) {
	const itemsPerPage = getItemsPerPage();
	const startIdx = (adminTableState[type].page - 1) * itemsPerPage;
	const infoEl = document.getElementById(`page-info-${type}`);
	if (infoEl) infoEl.innerText = tItems > 0 ? `Menampilkan ${startIdx + 1}-${startIdx + pDataLength} dari ${tItems} data` : `Tidak ada data`;
	const btnPrev = document.getElementById(`btn-prev-${type}`);
	const btnNext = document.getElementById(`btn-next-${type}`);
	const setBtnStyle = (btn, isDisabled) => {
		if (!btn) return;
		btn.disabled = isDisabled;
		btn.className = isDisabled ? "px-3 py-1 border rounded bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed transition-colors" : "px-3 py-1 border rounded bg-white text-blue-600 border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors";
	};
	setBtnStyle(btnPrev, adminTableState[type].page <= 1);
	setBtnStyle(btnNext, adminTableState[type].page >= Math.ceil(tItems / itemsPerPage));
}

function getPaginatedData(dataArray, type, filterFn) {
	const itemsPerPage = getItemsPerPage();
	let safeArray = Array.isArray(dataArray) ? dataArray : [];

	// 1. Filter data sesuai pencarian/tahun
	let filtered = [...safeArray].filter(filterFn);

	// 2. 🚀 SMART SORTING BERDASARKAN CREATED_AT
	if (type !== 'datasiswa') {
		filtered.sort((a, b) => {
			let idA = String(a.id || a.id_transaksi || '');
			let idB = String(b.id || b.id_transaksi || '');

			let isTempA = idA.includes('TEMP-');
			let isTempB = idB.includes('TEMP-');

			// Aturan 1: Jika ini data yang BARU SAJA diklik simpan oleh kasir (belum disinkron) -> Wajib paling atas!
			if (isTempA && !isTempB) return -1;
			if (!isTempA && isTempB) return 1;
			if (isTempA && isTempB) return parseInt(idB.split('-')[1]) - parseInt(idA.split('-')[1]);

			// Aturan 2: Gunakan Waktu Asli dari Supabase (created_at)
			// Ubah format timestamp ISO ke angka mili-detik agar mudah dibandingkan
			let timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
			let timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

			if (timeA !== timeB) {
				return timeB - timeA; // Descending: Waktu terbesar (paling baru) taruh di atas
			}

			// Fallback (Jaga-jaga): Jika created_at kosong/kembar, urutkan pakai ID numerik
			let numA = parseInt(idA);
			let numB = parseInt(idB);
			if (!isNaN(numA) && !isNaN(numB)) {
				return numB - numA;
			}

			return idA > idB ? -1 : (idA < idB ? 1 : 0);
		});
	}

	// 3. Lanjutkan ke sistem Pagination
	const tItems = filtered.length;
	const tPages = Math.ceil(tItems / itemsPerPage) || 1;
	if (adminTableState[type].page > tPages) adminTableState[type].page = tPages;
	if (adminTableState[type].page < 1) adminTableState[type].page = 1;
	const startIdx = (adminTableState[type].page - 1) * itemsPerPage;

	return {
		pData: filtered.slice(startIdx, startIdx + itemsPerPage),
		tItems,
		startIdx
	};
}

function buildTableRow(tbody, pData, type, htmlBuilderFn) {
	tbody.innerHTML = '';
	if (pData.length === 0) tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-gray-500">Data tidak ditemukan</td></tr>`;
	else pData.forEach(htmlBuilderFn);
}

function getActionClass(tabName) {
	if (currentUserRole === 'Kepala Sekolah') return 'hidden';
	if (currentUserRole === 'Admin' && tabName !== 'pemasukan') return 'hidden';
	return '';
}

function setupTableCoreEvents() {
	const filterKelas = document.getElementById('filter-kelas');
  const btnPagination = document.querySelectorAll('.btn-pagination');
	const searchData = document.querySelectorAll('.searchData');

	if (filterKelas) filterKelas.addEventListener('change', handleFilterKelas);
  
  btnPagination.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const tableName = this.getAttribute('data-table');
      const tablePage = parseInt(this.getAttribute('data-page'));

      changeAdminPage(tableName, tablePage);
    });
  });

	searchData.forEach(function(search) {
    search.addEventListener('input', function() {
			const searchType = this.getAttribute('data-search');

      handleSearch(searchType);
    });
  });
}