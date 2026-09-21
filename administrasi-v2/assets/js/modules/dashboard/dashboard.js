// function switchAdminTab(tab) {
//   const views = ['dashboard', 'datasiswa', 'pemasukan', 'atribut', 'cetak', 'bantuan', 'infaq', 'pengeluaran', 'pengeluaran-non', 'hr-tendik', 'tarif', 'master_atribut', 'master_guru', 'restore', 'user', 'pengaturan'];
//   const titles = { 
//     'dashboard': 'Dashboard Utama', 
//     'datasiswa': 'Direktori Data Siswa', 
//     'pemasukan': 'Manajemen Pemasukan', 
//     'atribut': 'Pemasukan Atribut Siswa',
//     'cetak': 'Rekap dan Surat Tagihan', 
//     'bantuan': 'Manajemen Dana Bantuan', 
//     'pengeluaran': 'Pengeluaran Operasional', 
//     'pengeluaran-non': 'Pengeluaran Non Operasional',
// 		'hr-tendik': 'Daftar Honorarium Guru',
//     'infaq': 'Manajemen Kas Infaq', 
//     'tarif': 'Manajemen Tarif Siswa',
//     'master_atribut': 'Manajemen Tarif Atribut Siswa',
//     'master_guru': 'Manajemen Data Guru',
//     'restore': 'Pemulihan Data (Recycle Bin)', 
//     'user': 'Manajemen User & Akses',
//     'pengaturan': 'Manajemen Pengaturan dan Backup Sistem'
//   };
  
//   views.forEach(v => {
//     const viewEl = document.getElementById(`admin-view-${v}`); const navEl = document.getElementById(`nav-${v}`);
//     if (viewEl) { viewEl.classList.add('hidden'); viewEl.classList.remove('flex', 'block'); }
//     if (navEl) navEl.className = "w-full flex items-center px-4 py-3 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white transition-colors";
//   });
  
//   const currentView = document.getElementById(`admin-view-${tab}`);
// 	if (!currentView) {
//       console.warn(`Elemen admin-view-${tab} tidak ditemukan!`);
//       return; 
//   }
//   currentView.classList.remove('hidden'); 
// 	currentView.classList.add(tab === 'dashboard' ? 'block' : 'flex');

//   const warnaNav = ['bg-blue-500', 'bg-sky-500', 'bg-cyan-500','bg-violet-500', 'bg-green-500', 'bg-teal-500', 'bg-emerald-500', 'bg-orange-500', 'bg-amber-500', 'bg-indigo-500', 'bg-teal-500', 'bg-rose-500', 'bg-purple-600'];
//   const indexTab = views.indexOf(tab);
//   const btnColor = warnaNav[indexTab % warnaNav.length] || 'bg-gray-500';
  
//   document.getElementById(`nav-${tab}`).className = `w-full flex items-center px-4 py-3 rounded-lg ${btnColor} text-white transition-colors`;
//   document.getElementById('admin-page-title').innerText = titles[tab];

//   if (tab === 'restore') loadRestoreTable();
//   if (tab === 'pengaturan') cekKapasitasDatabase();
//   if (window.innerWidth < 768) { document.getElementById('admin-sidebar').classList.add('-translate-x-full'); document.getElementById('sidebar-overlay').classList.add('hidden'); }

//   if (tab === 'dashboard') {
//     const aktifSiswa = dbSiswa.filter(s => !String(s.kelas).toUpperCase().includes('LULUS') && !String(s.kelas).toUpperCase().includes('KELUAR'));
//     const lulusSiswa = dbSiswa.filter(s => String(s.kelas).toUpperCase().includes('LULUS'));
//     document.getElementById('dash-siswa-aktif').innerText = aktifSiswa.length + " Siswa-Siswi";
//     document.getElementById('dash-siswa-laki').innerText = aktifSiswa.filter(s => s.lp === 'L').length + " Siswa";
//     document.getElementById('dash-siswi-perempuan').innerText = aktifSiswa.filter(s => s.lp === 'P').length + " Siswi";
//     document.getElementById('dash-siswa-lulus').innerText = lulusSiswa.length + " Lulusan";
//   }
// }

// ==========================================
// 1. FUNGSI KLIK MANUAL ACCORDION (SINGLE-OPEN)
// ==========================================
function toggleSidebarAccordion(event, targetId, btnElement) {

	// 1. Kunci Utama: Cegah klik bocor ke background/sidebar overlay
	event.stopPropagation();
	event.preventDefault();

	const target = document.getElementById(targetId);
	const arrow = btnElement.querySelector('.acc-arrow');

	// Cek status laci yang diklik (apakah sedang tertutup sebelum kita reset?)
	const isCurrentlyHidden = target.classList.contains('hidden');

	// SAPU BERSIH: Tutup semua laci accordion & kembalikan panah ke posisi semula
	const allAccordions = document.querySelectorAll('.accordion-group > div[id^="acc-"]');
	const allArrows = document.querySelectorAll('.accordion-group .acc-arrow');

	allAccordions.forEach(acc => {
		acc.classList.add('hidden');
		acc.classList.remove('flex');
	});

	allArrows.forEach(arr => {
		arr.classList.remove('rotate-180');
	});

	// BUKA LACI TARGET (Hanya jika sebelumnya berstatus tertutup)
	if (isCurrentlyHidden) {
		target.classList.remove('hidden');
		target.classList.add('flex');
		if (arrow) arrow.classList.add('rotate-180');
	}
}

// ==========================================
// 2. FUNGSI PINDAH TAB / MENU & AUTO-OPEN
// ==========================================
function switchAdminTab(tab) {
	const views = ['dashboard', 'datasiswa', 'pemasukan', 'atribut', 'cetak', 'bantuan', 'infaq', 'pengeluaran', 'pengeluaran-non', 'hr-tendik', 'hr-ekstra-bbqs', 'tarif', 'master_atribut', 'master_guru', 'restore', 'user', 'pengaturan'];
	const titles = {
		'dashboard': 'Dashboard Utama',
		'datasiswa': 'Direktori Data Siswa',
		'pemasukan': 'Manajemen Pemasukan',
		'atribut': 'Pemasukan Atribut Siswa',
		'cetak': 'Rekap dan Surat Tagihan',
		'bantuan': 'Manajemen Dana Bantuan',
		'pengeluaran': 'Pengeluaran Operasional',
		'pengeluaran-non': 'Pengeluaran Non Operasional',
		'hr-tendik': 'Daftar Honorarium Guru',
		'hr-ekstra-bbqs': 'Daftar Honorarium Ekstra & BBQS',
		'infaq': 'Manajemen Kas Infaq',
		'tarif': 'Manajemen Tarif Siswa',
		'master_atribut': 'Manajemen Tarif Atribut Siswa',
		'master_guru': 'Manajemen Data Guru',
		'restore': 'Pemulihan Data (Recycle Bin)',
		'user': 'Manajemen User & Akses',
		'pengaturan': 'Manajemen Pengaturan dan Backup Sistem'
	};

	const warnaNav = ['bg-blue-500', 'bg-sky-500', 'bg-cyan-500', 'bg-violet-500', 'bg-green-500', 'bg-teal-500', 'bg-emerald-500', 'bg-orange-500', 'bg-amber-500', 'bg-indigo-500', 'bg-teal-500', 'bg-rose-500', 'bg-purple-600'];

	// 1. Reset semua tab (buang warna aktif)
	views.forEach(v => {
		const viewEl = document.getElementById(`admin-view-${v}`);
		const navEl = document.getElementById(`nav-${v}`);

		if (viewEl) {
			viewEl.classList.add('hidden');
			viewEl.classList.remove('flex', 'block');
		}

		if (navEl) {
			navEl.classList.remove('text-white', ...warnaNav);
			navEl.classList.add('text-gray-400', 'hover:bg-slate-800', 'hover:text-white');
		}
	});

	// 2. Tampilkan Konten (View) yang dipilih
	const currentView = document.getElementById(`admin-view-${tab}`);
	if (!currentView) return;

	currentView.classList.remove('hidden');
	currentView.classList.add(tab === 'dashboard' ? 'block' : 'flex');

	// 3. SAPU BERSIH SEMUA ACCORDION TERLEBIH DAHULU
	const allAccordions = document.querySelectorAll('.accordion-group > div[id^="acc-"]');
	const allArrows = document.querySelectorAll('.accordion-group .acc-arrow');

	allAccordions.forEach(acc => {
		acc.classList.add('hidden');
		acc.classList.remove('flex');
	});
	allArrows.forEach(arr => {
		arr.classList.remove('rotate-180');
	});

	// 4. Warnai Tab yang aktif & Buka Laci "Rumah" nya
	let indexTab = views.indexOf(tab);
	if (indexTab === -1) indexTab = 0;
	const btnColor = warnaNav[indexTab % warnaNav.length];
	const currentNav = document.getElementById(`nav-${tab}`);

	if (currentNav) {
		currentNav.classList.remove('text-gray-400', 'hover:bg-slate-800', 'hover:text-white');
		currentNav.classList.add('text-white', btnColor);

		// Cek apakah menu ini ada di dalam sebuah laci Accordion
		const parentAccordion = currentNav.closest('[id^="acc-"]');
		if (parentAccordion) {
			// Buka lacinya
			parentAccordion.classList.remove('hidden');
			parentAccordion.classList.add('flex');

			// Putar panah laci tersebut
			const prevBtn = parentAccordion.previousElementSibling;
			if (prevBtn) {
				const arrow = prevBtn.querySelector('.acc-arrow');
				if (arrow) arrow.classList.add('rotate-180');
			}
		}
	}

	// 5. Update Title, Eksekusi Fungsi Ekstra, & Auto-Close Sidebar HP
	const pageTitle = document.getElementById('admin-page-title');
	if (pageTitle) pageTitle.innerText = titles[tab] || 'Halaman Admin';

	if (tab === 'restore' && typeof loadRestoreTable === 'function') loadRestoreTable();
	if (tab === 'pengaturan' && typeof cekKapasitasDatabase === 'function') cekKapasitasDatabase();

	if (window.innerWidth < 768) {
		const sidebar = document.getElementById('admin-sidebar');
		const overlay = document.getElementById('sidebar-overlay');
		if (sidebar) sidebar.classList.add('-translate-x-full');
		if (overlay) overlay.classList.add('hidden');
	}

	// 6. Data Dinamis Khusus Dashboard
	if (tab === 'dashboard' && typeof dbSiswa !== 'undefined') {
		const aktifSiswa = dbSiswa.filter(s => !String(s.kelas).toUpperCase().includes('LULUS') && !String(s.kelas).toUpperCase().includes('KELUAR'));
		const lulusSiswa = dbSiswa.filter(s => String(s.kelas).toUpperCase().includes('LULUS'));

		const elAktif = document.getElementById('dash-siswa-aktif');
		const elLaki = document.getElementById('dash-siswa-laki');
		const elPerempuan = document.getElementById('dash-siswi-perempuan');
		const elLulus = document.getElementById('dash-siswa-lulus');

		if (elAktif) elAktif.innerText = aktifSiswa.length + " Siswa-Siswi";
		if (elLaki) elLaki.innerText = aktifSiswa.filter(s => s.lp === 'L').length + " Siswa";
		if (elPerempuan) elPerempuan.innerText = aktifSiswa.filter(s => s.lp === 'P').length + " Siswi";
		if (elLulus) elLulus.innerText = lulusSiswa.length + " Lulusan";
	}
}

function renderAdminView(admin) {
  currentUserRole = String(admin.role || '').trim();
  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('view-admin').classList.remove('hidden');
  document.getElementById('sidebar-nama-admin').innerText = admin.nama;
  document.getElementById('sidebar-role-admin').innerText = admin.role;

  let iconColorClass = currentUserRole === "Super Admin" ? "text-amber-300" : (currentUserRole === "Admin" ? "text-emerald-300" : "text-sky-300");
  document.getElementById('sidebar-role-admin').className = `text-xs font-medium ${iconColorClass}`;
  document.getElementById('sidebar-role-icon').className = `ph-fill ph-shield text-2xl ${iconColorClass}`;

  const isKepsek = currentUserRole === 'Kepala Madrasah';
  const isSuperAdmin = currentUserRole === 'Super Admin';
  const isAdmin = currentUserRole === 'Admin';

  if (isSuperAdmin) {
    document.getElementById('nav-user-container').classList.remove('hidden');
    document.getElementById('nav-restore-container').classList.remove('hidden');
    document.getElementById('nav-tarif-container').classList.remove('hidden');
    document.getElementById('nav-master_atribut-container').classList.remove('hidden');
    document.getElementById('nav-master_guru-container').classList.remove('hidden');
    document.getElementById('nav-pengaturan-container').classList.remove('hidden');
  } else {
    document.getElementById('nav-user-container').classList.add('hidden');
    document.getElementById('nav-restore-container').classList.add('hidden');
    document.getElementById('nav-tarif-container').classList.add('hidden');
    document.getElementById('nav-master_atribut-container').classList.add('hidden');
    document.getElementById('nav-master_guru-container').classList.add('hidden');
    document.getElementById('nav-pengaturan-container').classList.add('hidden');

		document.getElementById('group-master').classList.add('hidden');
		document.getElementById('group-sistem').classList.add('hidden');
  }

  document.querySelectorAll('.admin-input-form').forEach(el => el.classList.toggle('hidden', isKepsek));
  document.querySelectorAll('.admin-table-container').forEach(el => { el.classList.toggle('lg:w-2/3', !isKepsek); el.classList.toggle('w-full', isKepsek); });

  document.querySelectorAll('.admin-action-th').forEach(el => {
      if (isKepsek) el.classList.add('hidden');
      else if (isAdmin) { const isViewPemasukan = el.closest('#admin-view-pemasukan') !== null; isViewPemasukan ? el.classList.remove('hidden') : el.classList.add('hidden'); } 
      else el.classList.remove('hidden');
  });

  switchAdminTab('dashboard'); loadDashboardStats(); loadAdminDataSiswaTable(); loadAdminTable(); loadAdminAtributTable(); loadAdminBantuanTable(); loadAdminPengeluaranTable(); loadAdminPengeluaranNonTable(); loadAdminInfaqTable(); cekStatusBulanIni(); renderChangelog(); cekStatusBulanIniBBQS();
  if (isSuperAdmin) { loadAdminUserTable(); loadAdminTarifTable(); loadAdminMasterAtributTable(); loadAdminMasterGuruTable(); loadAdminTarifTunjanganTable(); updateRestoreBadges(); }
}

async function refreshAdminData() {
  showLoading("Memperbarui Data...");
  const isSuccess = await loadDataFromSupabase();
  hideLoading();
  if (isSuccess) {
    loadDashboardStats(); loadAdminDataSiswaTable(); loadAdminTable(); loadAdminAtributTable(); loadAdminBantuanTable(); loadAdminPengeluaranTable(); loadAdminPengeluaranNonTable(); loadAdminInfaqTable(); cekStatusBulanIni();
    if (currentUserRole === 'Super Admin') { loadAdminUserTable(); loadAdminTarifTable(); loadAdminMasterAtributTable(); loadAdminMasterGuruTable(); loadAdminTarifTunjanganTable(); updateRestoreBadges(); if (!document.getElementById('admin-view-restore').classList.contains('hidden')) loadRestoreTable(); }
    showToast('Data disinkronisasi!','success');
  } else {
    showToast('Gagal sinkronisasi data', 'error');
  }
}

function handleDashFilter() {
	loadDashboardStats();
}

function loadDashboardStats() {
	const eDash = document.getElementById('filter-dash-tahun');
	const filterTahun = eDash && eDash.value ? eDash.value : globalTahunAktif;
	let globalPemasukanSiswa = dbPembayaran.reduce((sum, trx) => !trx.isDeleted ? sum + parseInt(trx.nominal || 0) : sum, 0);
	let globalBantuan = dbBantuan.reduce((sum, trx) => !trx.isDeleted ? sum + parseInt(trx.nominal || 0) : sum, 0);
	let globalOps = dbPengeluaran.reduce((sum, trx) => !trx.isDeleted ? sum + parseInt(trx.nominal || 0) : sum, 0);
	let globalNonOps = dbPengeluaranNon.reduce((sum, trx) => !trx.isDeleted ? sum + parseInt(trx.nominal || 0) : sum, 0);
	let globalInfaq = dbInfaq.reduce((sum, trx) => !trx.isDeleted ? (trx.jenis === 'Pemasukan' ? sum + parseInt(trx.nominal || 0) : sum - parseInt(trx.nominal || 0)) : sum, 0);

	let globalMasuk = globalPemasukanSiswa + globalBantuan;
	let globalKeluar = globalOps + globalNonOps;
	let globalSaldoFisik = globalMasuk - globalKeluar + globalInfaq;

	let yearPemasukanSiswa = dbPembayaran.filter(t => filterTahun === 'All' || t.tahun === filterTahun).reduce((sum, t) => !t.isDeleted ? sum + parseInt(t.nominal || 0) : sum, 0);
	let yearBantuan = dbBantuan.filter(t => filterTahun === 'All' || t.tahun === filterTahun).reduce((sum, t) => !t.isDeleted ? sum + parseInt(t.nominal || 0) : sum, 0);
	let yearOps = dbPengeluaran.filter(t => filterTahun === 'All' || t.tahun === filterTahun).reduce((sum, t) => !t.isDeleted ? sum + parseInt(t.nominal || 0) : sum, 0);
	let yearNonOps = dbPengeluaranNon.filter(t => filterTahun === 'All' || t.tahun === filterTahun).reduce((sum, t) => !t.isDeleted ? sum + parseInt(t.nominal || 0) : sum, 0);

	let yearMasuk = yearPemasukanSiswa + yearBantuan;
	let yearKeluar = yearOps + yearNonOps;
	let yearSurplus = yearMasuk - yearKeluar;

	document.getElementById('dash-pemasukan-tahun').innerText = formatRp(yearMasuk);
	document.getElementById('dash-pengeluaran-tahun').innerText = formatRp(yearKeluar);
	let surplusEl = document.getElementById('dash-surplus-tahun');
	surplusEl.innerText = (yearSurplus >= 0 ? '+' : '') + formatRp(yearSurplus);
	surplusEl.className = yearSurplus < 0 ? "text-xl md:text-2xl font-bold text-red-700 truncate" : "text-xl md:text-2xl font-bold text-purple-800 truncate";
	document.getElementById('dash-infaq-global').innerText = formatRp(globalInfaq);
	document.getElementById('dash-saldo-global').innerText = formatRp(globalSaldoFisik);

	renderCharts(filterTahun);
}

function renderChartKelas() {
	if (typeof ChartDataLabels !== 'undefined') Chart.register(ChartDataLabels);
	const ctxKelas = document.getElementById('chart-kelas');
	if (!ctxKelas) return;

	let filteredSiswa = dbSiswa.filter(s => {
		let kls = String(s.kelas).toUpperCase();
		if (currentChartKelasTab === 'aktif') return !kls.includes('LULUS') && !kls.includes('KELUAR');
		if (currentChartKelasTab === 'lulus') return kls.includes('LULUS');
		if (currentChartKelasTab === 'keluar') return kls.includes('KELUAR');
		return true;
	});

	const statsPerKelas = {};
	filteredSiswa.forEach(s => {
		if (s.kelas) {
			if (!statsPerKelas[s.kelas]) statsPerKelas[s.kelas] = {
				L: 0,
				P: 0,
				Total: 0
			};
			if (s.lp === 'L') statsPerKelas[s.kelas].L++;
			if (s.lp === 'P') statsPerKelas[s.kelas].P++;
			statsPerKelas[s.kelas].Total++;
		}
	});

	let labelsKelas = Object.keys(statsPerKelas).sort();
	if (labelsKelas.length > 6) labelsKelas = labelsKelas.slice(-6);

	if (chartKelasInstance) chartKelasInstance.destroy();
	chartKelasInstance = new Chart(ctxKelas, {
		type: 'bar',
		data: {
			labels: labelsKelas,
			datasets: [{
				label: 'Laki-Laki',
				data: labelsKelas.map(k => statsPerKelas[k].L),
				backgroundColor: '#93c5fd',
				borderRadius: 4
			}, {
				label: 'Perempuan',
				data: labelsKelas.map(k => statsPerKelas[k].P),
				backgroundColor: '#fbcfe8',
				borderRadius: 4
			}, {
				label: 'Total',
				data: labelsKelas.map(k => statsPerKelas[k].Total),
				backgroundColor: '#fde047',
				borderRadius: 4
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				y: {
					beginAtZero: true,
					grid: {
						borderDash: [4, 4]
					},
					grace: '15%'
				},
				x: {
					grid: {
						display: false
					}
				}
			},
			plugins: {
				legend: {
					position: 'top'
				},
				datalabels: {
					anchor: 'end',
					align: 'top',
					color: '#475569',
					font: {
						weight: 'bold',
						size: 10
					},
					formatter: function(value) {
						return value > 0 ? value : '';
					}
				}
			}
		}
	});
}

function renderCharts(filterTahun = 'All') {
	renderChartKelas();
	const kasPerBulan = {};
	const getYearMonth = (dateString) => {
		if (!dateString) return null;
		const str = String(dateString);
		if (/^\d{4}-\d{2}/.test(str)) return str.substring(0, 7);
		const bulanArr = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
		const parts = str.split(' ');
		if (parts.length >= 3) {
			let mIdx = bulanArr.findIndex(b => b.toLowerCase() === parts[1].toLowerCase() || b.substring(0, 3).toLowerCase() === parts[1].toLowerCase());
			if (mIdx !== -1) return `${parts[2]}-${String(mIdx + 1).padStart(2, '0')}`;
		}
		return null;
	};

	dbPembayaran.filter(t => !t.isDeleted && (filterTahun === 'All' || t.tahun === filterTahun)).forEach(trx => {
		const ym = getYearMonth(trx.tanggalInput || trx.timestamp);
		if (ym) {
			if (!kasPerBulan[ym]) kasPerBulan[ym] = {
				masuk: 0,
				keluar: 0
			};
			kasPerBulan[ym].masuk += parseInt(trx.nominal || 0);
		}
	});
	dbBantuan.filter(t => !t.isDeleted && (filterTahun === 'All' || t.tahun === filterTahun)).forEach(trx => {
		const ym = getYearMonth(trx.tglTransaksi || trx.tanggalInput);
		if (ym) {
			if (!kasPerBulan[ym]) kasPerBulan[ym] = {
				masuk: 0,
				keluar: 0
			};
			kasPerBulan[ym].masuk += parseInt(trx.nominal || 0);
		}
	});
	[...dbPengeluaran.filter(t => !t.isDeleted && (filterTahun === 'All' || t.tahun === filterTahun)), ...dbPengeluaranNon.filter(t => !t.isDeleted && (filterTahun === 'All' || t.tahun === filterTahun))].forEach(trx => {
		const ym = getYearMonth(trx.tglTransaksi || trx.tanggalInput);
		if (ym) {
			if (!kasPerBulan[ym]) kasPerBulan[ym] = {
				masuk: 0,
				keluar: 0
			};
			kasPerBulan[ym].keluar += parseInt(trx.nominal || 0);
		}
	});

	const urutanBulan = Object.keys(kasPerBulan).sort();
	const namaBulanIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
	const labelsKeuangan = urutanBulan.map(ym => {
		const [y, m] = ym.split('-');
		return `${namaBulanIndo[parseInt(m) - 1]} ${y}`;
	});
	const dataKasMasuk = urutanBulan.map(ym => kasPerBulan[ym].masuk);
	const dataKasKeluar = urutanBulan.map(ym => kasPerBulan[ym].keluar);

	const ctxKeuangan = document.getElementById('chart-keuangan');
	if (chartKeuanganInstance) chartKeuanganInstance.destroy();
	chartKeuanganInstance = new Chart(ctxKeuangan, {
		type: 'line',
		data: {
			labels: labelsKeuangan,
			datasets: [{
				label: 'Pemasukan (Rp)',
				data: dataKasMasuk,
				borderColor: '#10b981',
				backgroundColor: 'rgba(16, 185, 129, 0.1)',
				borderWidth: 2,
				fill: true,
				tension: 0.3
			}, {
				label: 'Pengeluaran Total (Rp)',
				data: dataKasKeluar,
				borderColor: '#f97316',
				backgroundColor: 'rgba(249, 115, 22, 0.1)',
				borderWidth: 2,
				fill: true,
				tension: 0.3
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			interaction: {
				mode: 'index',
				intersect: false
			},
			plugins: {
				legend: {
					position: 'top',
					labels: {
						usePointStyle: true,
						boxWidth: 8
					}
				},
				tooltip: {
					callbacks: {
						label: function(c) {
							return (c.dataset.label || '') + ': ' + formatRp(c.parsed.y);
						}
					}
				},
				datalabels: {
					display: false
				}
			},
			scales: {
				y: {
					beginAtZero: true,
					ticks: {
						callback: function(value) {
							if (value >= 1000000) return 'Rp' + (value / 1000000) + ' Jt';
							if (value >= 1000) return 'Rp' + (value / 1000) + ' Rb';
							return 'Rp' + value;
						}
					}
				}
			}
		}
	});
}

let chartKelasInstance = null;
let chartKeuanganInstance = null;
let currentChartKelasTab = 'aktif';

function setChartSiswaTab(tab) {
	currentChartKelasTab = tab;
	const tabs = ['aktif', 'lulus', 'keluar'];
	tabs.forEach(t => {
		const btn = document.getElementById(`tab-chart-${t}`);
		if (btn) btn.className = (t === tab) ? "px-4 py-1.5 text-sm font-semibold rounded-md bg-blue-600 text-white shadow-sm transition-all" : "px-4 py-1.5 text-sm font-semibold rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-all";
	});
	renderChartKelas();
}

function setTabSiswa(tabName) {
	adminTableState.datasiswa.activeTab = tabName;
	const btnAktif = document.getElementById('tab-siswa-aktif');
	const btnNon = document.getElementById('tab-siswa-nonaktif');
	if (tabName === 'aktif') {
		btnAktif.className = "text-sm font-bold border-b-2 border-blue-600 text-blue-600 pb-2 transition-colors";
		btnNon.className = "text-sm font-bold border-b-2 border-transparent text-gray-500 hover:text-gray-700 pb-2 transition-colors";
	} else {
		btnNon.className = "text-sm font-bold border-b-2 border-blue-600 text-blue-600 pb-2 transition-colors";
		btnAktif.className = "text-sm font-bold border-b-2 border-transparent text-gray-500 hover:text-gray-700 pb-2 transition-colors";
	}
	adminTableState.datasiswa.filterKelas = 'All';
	initDropdowns();
	loadAdminDataSiswaTable();
}

// ==========================================
// FUNGSI SETUP EVENT ACCORDION SIDEBAR
// ==========================================
function setupSidebarAccordionEvents() {
	const accordionBtns = document.querySelectorAll('.btn-accordion');

	accordionBtns.forEach(btn => {
		// Mencegah penumpukan event listener jika fungsi dipanggil berulang
		const newBtn = btn.cloneNode(true);
		btn.parentNode.replaceChild(newBtn, btn);

		newBtn.addEventListener('click', function(event) {
			// 1. Kunci Utama: Cegah klik bocor ke fungsi penutup sidebar (Mobile)
			event.stopPropagation();
			event.preventDefault();

			// 2. Ambil ID target dari atribut data-target
			const targetId = this.getAttribute('data-target');
			const target = document.getElementById(targetId);
			const arrow = this.querySelector('.acc-arrow');

			if (!target) return;

			const isCurrentlyHidden = target.classList.contains('hidden');

			// 3. SAPU BERSIH: Tutup semua laci
			const allAccordions = document.querySelectorAll('.accordion-group > div[id^="acc-"]');
			const allArrows = document.querySelectorAll('.accordion-group .acc-arrow');

			allAccordions.forEach(acc => {
				acc.classList.add('hidden');
				acc.classList.remove('flex');
			});

			allArrows.forEach(arr => {
				arr.classList.remove('rotate-180');
			});

			// 4. BUKA LACI TARGET
			if (isCurrentlyHidden) {
				target.classList.remove('hidden');
				target.classList.add('flex');
				if (arrow) arrow.classList.add('rotate-180');
			}
		});
	});
}

function setupDashboardEvents() {
	const btnMenu = document.querySelectorAll('.btn-menu');
	const btnRefresh = document.getElementById('btn-refresh-admin');
	const btnDashTahun = document.getElementById('filter-dash-tahun');
	const btnSiswaChart = document.querySelectorAll('.btn-siswa-chart');
	const btnSiswaTab = document.querySelectorAll('.btn-siswa-tab');

	btnMenu.forEach(function(btn) {
		btn.addEventListener('click', function() {
			const btnName = this.getAttribute('data-tab');
			switchAdminTab(btnName);
		})
	});

	btnSiswaChart.forEach(function(btn) {
		btn.addEventListener('click', function() {
			const btnName = this.getAttribute('data-tab');
			setChartSiswaTab(btnName);
		})
	})

	btnSiswaTab.forEach(function(btn) {
		btn.addEventListener('click', function() {
			const btnName = this.getAttribute('data-tab');
			setTabSiswa(btnName);
		})
	})

	if (btnRefresh) btnRefresh.addEventListener('click', refreshAdminData);
	if (btnDashTahun) btnDashTahun.addEventListener('change', handleDashFilter);

	setupSidebarAccordionEvents();
}