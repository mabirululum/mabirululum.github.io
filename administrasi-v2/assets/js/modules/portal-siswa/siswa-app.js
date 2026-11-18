let currentSiswaData = null;
let currentBillingData = null;

// ========================================================
// FUNGSI KALKULASI SYARAT UJIAN (POKOK VS + NON-SPP)
// ========================================================
// function kalkulasiWidgetUjian() {
//   if (!currentBillingData) return;

//   const widgetUjian = document.getElementById('widget-ujian');
//   const widgetTitle = document.getElementById('widget-exam-title');
//   const widgetAmount = document.getElementById('widget-exam-amount');
//   const widgetDesc = document.getElementById('widget-exam-desc');
//   const toggleNonSpp = document.getElementById('widget-exam-toggle-nonspp');

//   const examName = currentBillingData.examWidget?.name || 'Ujian';
//   const includeNonSpp = toggleNonSpp ? toggleNonSpp.checked : false;

//   // 1. Tentukan Batas Bulan SPP Berdasarkan Nama Ujian
//   const blnArr = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
//   let maxBulanIndex = 3; // Default PTS 1: Oktober
//   let batasBulanTeks = 'Oktober';

//   const namaUpper = (examName || '').toUpperCase();

// 	// 1. PRIORITAS UTAMA: Cek Tengah Semester Ganjil (Batas: Oktober)
// 	if (namaUpper.includes('PTS 1') || namaUpper.includes('STS 1') || namaUpper.includes('PTS GANJIL') || namaUpper.includes('STS GANJIL') || namaUpper.includes('TENGAH SEMESTER 1')) {
// 		maxBulanIndex = 3;
// 		batasBulanTeks = 'Oktober';
// 	} 
// 	// 2. Cek Akhir Semester Ganjil (Batas: Desember)
// 	else if (namaUpper.includes('PAS 1') || namaUpper.includes('SAS 1') || namaUpper.includes('PAS GANJIL') || namaUpper.includes('SAS GANJIL') || namaUpper.includes('SEMESTER GANJIL')) {
// 		maxBulanIndex = 5;
// 		batasBulanTeks = 'Desember';
// 	} 
// 	// 3. Cek Tengah Semester Genap (Batas: Maret)
// 	else if (namaUpper.includes('PTS 2') || namaUpper.includes('STS 2') || namaUpper.includes('PTS GENAP') || namaUpper.includes('STS GENAP') || namaUpper.includes('TENGAH SEMESTER 2')) {
// 		maxBulanIndex = 8;
// 		batasBulanTeks = 'Maret';
// 	} 
// 	// 4. Cek Akhir Semester Genap / Akhir Tahun (Batas: Juni)
// 	else if (namaUpper.includes('PAS 2') || namaUpper.includes('SAS 2') || namaUpper.includes('SAT') || namaUpper.includes('PAT') || namaUpper.includes('SEMESTER GENAP') || namaUpper.includes('AKHIR')) {
// 		maxBulanIndex = 11;
// 		batasBulanTeks = 'Juni';
// 	} 
// 	// Default jika tidak ada nama spesifik
// 	else {
// 		maxBulanIndex = 3;
// 		batasBulanTeks = 'Oktober';
// 	}

//   // 2. Hitung Tagihan Pokok Wajib Ujian
//   let totalSppSyarat = 0;
//   if (currentBillingData.bulanan) {
//     currentBillingData.bulanan.forEach(item => {
//       let monthFound = blnArr.find(b => item.jenis.toUpperCase().includes(b.toUpperCase()));
//       if (monthFound) {
//         let idx = blnArr.findIndex(b => b.toLowerCase() === monthFound.toLowerCase());
//         if (idx <= maxBulanIndex && item.sisa > 0) {
//           totalSppSyarat += item.sisa;
//         }
//       }
//     });
//   }

//   let totalDaftarUlang = 0;
//   let totalNonSppLainnya = 0;

//   if (currentBillingData.lainnya) {
//     currentBillingData.lainnya.forEach(item => {
//       const jenis = item.jenis.toUpperCase();
//       if (jenis.includes('DAFTAR ULANG') || jenis.includes('REGISTRASI')) {
//         if (item.sisa > 0) totalDaftarUlang += item.sisa;
//       } else {
//         if (item.sisa > 0) totalNonSppLainnya += item.sisa;
//       }
//     });
//   }

//   const hutangLama = currentBillingData.hutangLamaMurni || 0;
//   let totalWajib = totalSppSyarat + totalDaftarUlang + hutangLama;
//   if (includeNonSpp) {
//     totalWajib += totalNonSppLainnya;
//   }

//   // 3. Render ke DOM dengan Pengaman (Aman dari null error)
//   if (widgetTitle) {
//     widgetTitle.innerText = `Syarat ${examName}`;
//   }

//   if (totalWajib <= 0) {
//     if (widgetUjian) widgetUjian.style.background = "linear-gradient(to right, #10b981, #14b8a6)";
//     if (widgetAmount) widgetAmount.innerText = "MEMENUHI SYARAT";
//     if (widgetDesc) widgetDesc.innerText = `Semua kewajiban s.d. ${batasBulanTeks} telah terpenuhi.`;
//   } else {
//     if (widgetUjian) widgetUjian.style.background = "linear-gradient(to right, #f59e0b, #f97316)";
//     if (widgetAmount) widgetAmount.innerText = formatRp(totalWajib);
//     if (widgetDesc) {
//       widgetDesc.innerText = includeNonSpp 
//         ? `Kewajiban: Daftar Ulang + SPP s.d. ${batasBulanTeks} + Kegiatan Non-SPP`
//         : `Kewajiban: Daftar Ulang + SPP s.d. ${batasBulanTeks}`;
//     }
//   }
// }

function kalkulasiWidgetUjian() {
  if (!currentBillingData) return;

  const widgetUjian = document.getElementById('widget-ujian');
  const widgetTitle = document.getElementById('widget-exam-title');
  const widgetAmount = document.getElementById('widget-exam-amount');
  const widgetDesc = document.getElementById('widget-exam-desc');
  const toggleNonSpp = document.getElementById('widget-exam-toggle-nonspp');
  const wrapperCheckbox = toggleNonSpp ? toggleNonSpp.closest('label') : null;

  const totalHutangKeseluruhan = (currentBillingData.totalTunggakan || 0);
  const hutangLama = (currentBillingData.hutangLamaMurni || 0);

  // ========================================================
  // KONDISI 1: SISWA SUDAH LUNAS SEMUA (100% BEBAS TANGGUNGAN)
  // ========================================================
  if (totalHutangKeseluruhan === 0 && hutangLama === 0) {
    if (widgetUjian) widgetUjian.style.background = "linear-gradient(to right, #059669, #0d9488)";
    if (widgetTitle) widgetTitle.innerText = "Administrasi Lunas Sepenuhnya";
    if (widgetDesc) {
      widgetDesc.innerText = "Seluruh kewajiban telah tuntas. Siswa berhak mengikuti seluruh rangkaian evaluasi dan bebas tanggungan administrasi.";
    }
    if (widgetAmount) widgetAmount.innerText = "BEBAS TANGGUNGAN";
    if (wrapperCheckbox) wrapperCheckbox.classList.add('hidden');
    return;
  }

  // ========================================================
  // KONDISI 2: SISWA SUDAH LULUS / ALUMNI TAPI MASIH ADA HUTANG
  // ========================================================
  const statusKelas = String(currentSiswaData?.kelas || '').toUpperCase();
  const isLulus = statusKelas.includes('LULUS') || statusKelas.includes('ALUMNI');

  if (isLulus) {
    if (widgetUjian) widgetUjian.style.background = "linear-gradient(to right, #e11d48, #be123c)"; // Rose/Crimson gelap
    if (widgetTitle) widgetTitle.innerText = "Tunggakan Administrasi Kelulusan";
    if (widgetDesc) {
      widgetDesc.innerText = "Siswa telah berstatus Lulus. Seluruh sisa kewajiban wajib diselesaikan untuk keperluan administrasi dan penyerahan ijazah.";
    }
    // Tampilkan total seluruh sisa tunggakan tanpa potongan periode bulan
    if (widgetAmount) widgetAmount.innerText = formatRp(totalHutangKeseluruhan);
    
    // Sembunyikan checkbox karena alumni wajib menyelesaikan semua tagihan
    if (wrapperCheckbox) wrapperCheckbox.classList.add('hidden');
    return;
  }

  // ========================================================
  // KONDISI 3: SISWA AKTIF REGULER (PERHITUNGAN SYARAT UJIAN)
  // ========================================================
  if (wrapperCheckbox) wrapperCheckbox.classList.remove('hidden');

  const examName = currentBillingData.examWidget?.name || 'Ujian';
  const includeNonSpp = toggleNonSpp ? toggleNonSpp.checked : false;

  // 1. Tentukan Batas Bulan SPP Berdasarkan Prioritas Ujian
  const blnArr = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
  let maxBulanIndex = 3;
  let batasBulanTeks = 'Oktober';

  const namaUpper = (examName || '').toUpperCase();

  if (namaUpper.includes('PTS 1') || namaUpper.includes('STS 1') || namaUpper.includes('PTS GANJIL') || namaUpper.includes('STS GANJIL') || namaUpper.includes('TENGAH SEMESTER 1')) {
    maxBulanIndex = 3;
    batasBulanTeks = 'Oktober';
  } else if (namaUpper.includes('PAS 1') || namaUpper.includes('SAS 1') || namaUpper.includes('PAS GANJIL') || namaUpper.includes('SAS GANJIL') || namaUpper.includes('SEMESTER GANJIL')) {
    maxBulanIndex = 5;
    batasBulanTeks = 'Desember';
  } else if (namaUpper.includes('PTS 2') || namaUpper.includes('STS 2') || namaUpper.includes('PTS GENAP') || namaUpper.includes('STS GENAP') || namaUpper.includes('TENGAH SEMESTER 2')) {
    maxBulanIndex = 8;
    batasBulanTeks = 'Maret';
  } else if (namaUpper.includes('PAS 2') || namaUpper.includes('SAS 2') || namaUpper.includes('SAT') || namaUpper.includes('PAT') || namaUpper.includes('SEMESTER GENAP') || namaUpper.includes('AKHIR')) {
    maxBulanIndex = 11;
    batasBulanTeks = 'Juni';
  } else {
    maxBulanIndex = 3;
    batasBulanTeks = 'Oktober';
  }

  // 2. Perhitungan Tagihan Wajib Siswa Aktif
  let totalSppSyarat = 0;
  if (currentBillingData.bulanan) {
    currentBillingData.bulanan.forEach(item => {
      let monthFound = blnArr.find(b => item.jenis.toUpperCase().includes(b.toUpperCase()));
      if (monthFound) {
        let idx = blnArr.findIndex(b => b.toLowerCase() === monthFound.toLowerCase());
        if (idx <= maxBulanIndex && item.sisa > 0) {
          totalSppSyarat += item.sisa;
        }
      }
    });
  }

  let totalDaftarUlang = 0;
  let totalNonSppLainnya = 0;

  if (currentBillingData.lainnya) {
    currentBillingData.lainnya.forEach(item => {
      const jenis = item.jenis.toUpperCase();
      if (jenis.includes('DAFTAR ULANG') || jenis.includes('REGISTRASI')) {
        if (item.sisa > 0) totalDaftarUlang += item.sisa;
      } else {
        if (item.sisa > 0) totalNonSppLainnya += item.sisa;
      }
    });
  }

  let totalWajib = totalSppSyarat + totalDaftarUlang + hutangLama;
  if (includeNonSpp) {
    totalWajib += totalNonSppLainnya;
  }

  // 3. Render Status Ujian Reguler
  if (widgetTitle) widgetTitle.innerText = `Syarat ${examName}`;

  if (totalWajib <= 0) {
    if (widgetUjian) widgetUjian.style.background = "linear-gradient(to right, #10b981, #14b8a6)";
    if (widgetAmount) widgetAmount.innerText = "MEMENUHI SYARAT";
    if (widgetDesc) widgetDesc.innerText = `Kewajiban berjalan s.d. ${batasBulanTeks} telah terpenuhi.`;
  } else {
    if (widgetUjian) widgetUjian.style.background = "linear-gradient(to right, #f59e0b, #f97316)";
    if (widgetAmount) widgetAmount.innerText = formatRp(totalWajib);
    if (widgetDesc) {
      widgetDesc.innerText = includeNonSpp 
        ? `Kewajiban: Daftar Ulang + SPP s.d. ${batasBulanTeks} + Kegiatan Non-SPP`
        : `Kewajiban: Daftar Ulang + SPP s.d. ${batasBulanTeks}`;
    }
  }
}

// function renderSiswaView(siswaProfile, billingData) {
// 	currentSiswaData = siswaProfile;
// 	currentBillingData = billingData;
// 	document.getElementById('view-login').classList.add('hidden');
// 	document.getElementById('view-siswa').classList.remove('hidden');
// 	document.getElementById('siswa-nama').innerText = siswaProfile.nama;
// 	document.getElementById('siswa-nis-text').innerText = siswaProfile.nis;

// 	const badgeContainer = document.getElementById('siswa-kelas-badge');
// 	let kls = String(siswaProfile.kelas).toUpperCase();
// 	let badgeClass = 'bg-gray-100 text-gray-700 border-gray-200';
// 	if (kls.includes('X ') || kls === 'X') badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
// 	else if (kls.includes('XI ') || kls === 'XI') badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
// 	else if (kls.includes('XII ') || kls === 'XII') badgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
// 	else if (kls.includes('LULUS') || kls.includes('KELUAR')) badgeClass = 'bg-slate-200 text-slate-700 border-slate-300';
// 	if (badgeContainer) badgeContainer.innerHTML = `<span class="${badgeClass} border px-2 py-0.5 rounded text-xs font-bold">Kelas: ${siswaProfile.kelas}</span>`;

// 	const boxKekurangan = document.getElementById('box-kekurangan');
// 	const titleKekurangan = document.getElementById('title-kekurangan');
// 	const valKekurangan = document.getElementById('siswa-total-kekurangan');
// 	const bannerLama = document.getElementById('siswa-banner-tunggakan');
// 	if (billingData.hutangLamaMurni > 0 && bannerLama) {
// 		bannerLama.classList.remove('hidden');
// 		document.getElementById('banner-amount').innerText = formatRp(billingData.hutangLamaMurni);
// 	} else if (bannerLama) bannerLama.classList.add('hidden');
// 	if (billingData.totalTunggakan === 0) {
// 		boxKekurangan.className = "bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center min-w-[200px] w-full";
// 		titleKekurangan.className = "text-sm text-emerald-600 font-medium mb-1";
// 		titleKekurangan.innerText = "Status Pembayaran";
// 		valKekurangan.className = "text-2xl font-bold text-emerald-700";
// 		valKekurangan.innerText = "LUNAS";
// 	} else {
// 		boxKekurangan.className = "bg-red-50 border border-red-100 rounded-lg p-4 text-center min-w-[200px] w-full";
// 		titleKekurangan.className = "text-sm text-red-600 font-medium mb-1";
// 		titleKekurangan.innerText = "Total Hutang Berjalan";
// 		valKekurangan.className = "text-2xl font-bold text-red-700";
// 		valKekurangan.innerText = formatRp(billingData.totalTunggakan);
// 	}

// 	const widgetUjian = document.getElementById('widget-ujian');
// 	const widgetTitle = document.getElementById('widget-exam-title');
// 	const widgetAmount = document.getElementById('widget-exam-amount');
// 	widgetUjian.classList.remove('hidden');
// 	widgetTitle.innerText = `Syarat ${billingData.examWidget.name}`;
// 	if (billingData.examWidget.isLunas) {
// 		widgetUjian.style.background = "linear-gradient(to right, #10b981, #14b8a6)";
// 		widgetUjian.className = "rounded-xl shadow-md p-6 mb-6 text-white flex flex-col md:flex-row items-center justify-between transform transition-all duration-500 hover:scale-[1.01]";
// 		widgetAmount.innerText = "MEMENUHI SYARAT";
// 	} else {
// 		widgetUjian.style.background = "linear-gradient(to right, #f59e0b, #f97316)";
// 		widgetUjian.className = "rounded-xl shadow-md p-6 mb-6 text-white flex flex-col md:flex-row items-center justify-between transform transition-all duration-500 hover:scale-[1.01]";
// 		widgetAmount.innerText = formatRp(billingData.examWidget.amount);
// 	}

// 	const selTahun = document.getElementById('siswa-tahun-filter');
// 	selTahun.innerHTML = '';
// 	if (billingData.riwayatTahun.length > 0) {
// 		billingData.riwayatTahun.forEach(t => selTahun.innerHTML += `<option value="${t}">${t}</option>`);
// 	} else {
// 		selTahun.innerHTML = `<option value="All">Belum Ada Tagihan</option>`;
// 	}

// 	renderSiswaTables(billingData.riwayatTahun[0] || 'All');
// }

function renderSiswaView(siswaProfile, billingData) {
  currentSiswaData = siswaProfile;
  currentBillingData = billingData;
  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('view-siswa').classList.remove('hidden');
  document.getElementById('siswa-nama').innerText = siswaProfile.nama;
  document.getElementById('siswa-nis-text').innerText = siswaProfile.nis;

  const badgeContainer = document.getElementById('siswa-kelas-badge');
  let kls = String(siswaProfile.kelas).toUpperCase();
  let badgeClass = 'bg-gray-100 text-gray-700 border-gray-200';
  if (kls.includes('X ') || kls === 'X') badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  else if (kls.includes('XI ') || kls === 'XI') badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
  else if (kls.includes('XII ') || kls === 'XII') badgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
  else if (kls.includes('LULUS') || kls.includes('KELUAR')) badgeClass = 'bg-slate-200 text-slate-700 border-slate-300';
  if (badgeContainer) badgeContainer.innerHTML = `<span class="${badgeClass} border px-2 py-0.5 rounded text-xs font-bold">Kelas: ${siswaProfile.kelas}</span>`;

  const boxKekurangan = document.getElementById('box-kekurangan');
  const titleKekurangan = document.getElementById('title-kekurangan');
  const valKekurangan = document.getElementById('siswa-total-kekurangan');
  const bannerLama = document.getElementById('siswa-banner-tunggakan');
  if (billingData.hutangLamaMurni > 0 && bannerLama) {
    bannerLama.classList.remove('hidden');
    document.getElementById('banner-amount').innerText = formatRp(billingData.hutangLamaMurni);
  } else if (bannerLama) bannerLama.classList.add('hidden');

  if (billingData.totalTunggakan === 0) {
    boxKekurangan.className = "bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center min-w-[200px] w-full";
    titleKekurangan.className = "text-sm text-emerald-600 font-medium mb-1";
    titleKekurangan.innerText = "Status Pembayaran";
    valKekurangan.className = "text-2xl font-bold text-emerald-700";
    valKekurangan.innerText = "LUNAS";
  } else {
    boxKekurangan.className = "bg-red-50 border border-red-100 rounded-lg p-4 text-center min-w-[200px] w-full";
    titleKekurangan.className = "text-sm text-red-600 font-medium mb-1";
    titleKekurangan.innerText = "Total Hutang Berjalan";
    valKekurangan.className = "text-2xl font-bold text-red-700";
    valKekurangan.innerText = formatRp(billingData.totalTunggakan);
  }

  // ==========================================
  // SETUP WIDGET UJIAN DENGAN CHECKBOX NON-SPP
  // ==========================================
  const widgetUjian = document.getElementById('widget-ujian');
  widgetUjian.classList.remove('hidden');

  const toggleNonSpp = document.getElementById('widget-exam-toggle-nonspp');
  if (toggleNonSpp) {
    const examNameUpper = (billingData.examWidget?.name || '').toUpperCase();
    
    // Otomatis tercentang jika masuk Semester Genap (PTS 2 / PAS 2 / SAT)
    const isSemesterGenap = examNameUpper.includes('PTS 2') || 
                            examNameUpper.includes('STS 2') || 
                            examNameUpper.includes('PAS 2') || 
                            examNameUpper.includes('SAT') || 
                            examNameUpper.includes('SAS 2') || 
                            examNameUpper.includes('PAT');

    toggleNonSpp.checked = isSemesterGenap;

    // Pasang listener saat checkbox diubah oleh siswa
    toggleNonSpp.onchange = () => {
      kalkulasiWidgetUjian();
    };
  }

  // Jalankan kalkulasi pertama kali
  kalkulasiWidgetUjian();

  // ==========================================
  const selTahun = document.getElementById('siswa-tahun-filter');
  selTahun.innerHTML = '';
  if (billingData.riwayatTahun.length > 0) {
    billingData.riwayatTahun.forEach(t => selTahun.innerHTML += `<option value="${t}">${t}</option>`);
  } else {
    selTahun.innerHTML = `<option value="All">Belum Ada Tagihan</option>`;
  }

  renderSiswaTables(billingData.riwayatTahun[0] || 'All');
}

function renderSiswaTables(targetTahun) {
	const formatCell = (val) => (val === 'LUNAS' || val === 0) ? `<span class="px-3 py-1 text-xs rounded-full font-bold bg-emerald-100 text-emerald-700 tracking-wide"><i class="ph ph-check mr-1"></i> LUNAS</span>` : `<span class="px-3 py-1 text-xs rounded-full font-bold bg-red-100 text-red-700">${formatRp(val)}</span>`;
	document.getElementById('lbl-thn-spp').innerText = `(${targetTahun})`;

	const tbodyBulan = document.getElementById('table-rekap-bulanan');
	tbodyBulan.innerHTML = '';
	let filteredBulanan = currentBillingData.bulanan.filter(b => b.tahun === targetTahun);
	if (filteredBulanan.length === 0) tbodyBulan.innerHTML = '<tr><td colspan="2" class="p-4 text-center text-gray-500">Bebas Tagihan SPP pada tahun ini</td></tr>';
	filteredBulanan.forEach(item => {
		tbodyBulan.innerHTML += `<tr class="hover:bg-gray-50"><td class="p-4 font-medium text-gray-700">${item.jenis}</td><td class="p-4 text-center">${formatCell(item.sisa)}</td></tr>`;
	});

	const tbodyTagihan = document.getElementById('table-rekap-tagihan');
	tbodyTagihan.innerHTML = '';
	let filteredLainnya = currentBillingData.lainnya.filter(l => l.tahun === targetTahun);
	if (filteredLainnya.length === 0) tbodyTagihan.innerHTML = '<tr><td colspan="2" class="p-4 text-center text-gray-500">Belum ada tagihan lainnya</td></tr>';
	filteredLainnya.forEach(item => {
		tbodyTagihan.innerHTML += `<tr class="hover:bg-gray-50"><td class="p-4 font-bold text-gray-700">${item.jenis}</td><td class="p-4 font-medium text-right">${formatCell(item.sisa)}</td></tr>`;
	});
}

function refreshDataSiswa(isFilter = false) {
	if (isFilter) {
		renderSiswaTables(document.getElementById('siswa-tahun-filter').value);
		return;
	}
	const rawText = document.getElementById('siswa-nis-kelas').innerText;
	const nis = rawText.split('|')[0].replace('NIS:', '').trim();
	if (!nis || nis === '-') return;
	showLoading("Sinkronisasi...");
	setTimeout(() => {
		hideLoading();
		const s = dbSiswa.find(s => String(s.nis).trim() === nis);
		if (s) {
			let riwayat = dbPembayaran.filter(p => !p.isDeleted && String(p.nis).trim() === nis);
			let billing = calculateSiswaBilling(s, dbMasterTarif, riwayat);
			renderSiswaView(s, billing);
			showToast('Data disinkronisasi (Preview)!');
		}
	}, 600);
}

function startStudentRefreshCooldown() {
	const btn = document.getElementById('btn-refresh-siswa');
	const textSpan = document.getElementById('text-refresh-siswa');
	const icon = btn.querySelector('i');
	btn.disabled = true;
	btn.classList.add('opacity-50', 'cursor-not-allowed');
	icon.classList.remove('animate-spin');
	let timeLeft = 300;
	refreshCountdownInterval = setInterval(() => {
		timeLeft--;
		if (timeLeft <= 0) {
			clearInterval(refreshCountdownInterval);
			btn.disabled = false;
			btn.classList.remove('opacity-50', 'cursor-not-allowed');
			textSpan.innerText = "Perbarui Data";
		} else {
			const m = Math.floor(timeLeft / 60);
			const s = timeLeft % 60;
			textSpan.innerText = `Tunggu (${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')})`;
		}
	}, 1000);
}

async function refreshButtonDataSiswa() {
	const rawText = document.getElementById('siswa-nis-text').innerText;
	const nis = rawText.includes('|') ? rawText.split('|')[0].replace('NIS:', '').trim() : rawText.trim();
	if (!nis || nis === '-') return;
	showLoading("Memperbarui data Anda...");
	document.getElementById('btn-refresh-siswa').querySelector('i').classList.add('animate-spin');
	const isSuccess = await loadDataFromSupabase();
	hideLoading();
	if (isSuccess) {
		const s = dbSiswa.find(s => String(s.nis).trim() === nis);
		if (s) {
			let riwayat = dbPembayaran.filter(p => !p.isDeleted && String(p.nis).trim() === nis);
			let billing = calculateSiswaBilling(s, dbMasterTarif, riwayat);
			renderSiswaView(s, billing);
			showToast('Data diperbarui!', 'success');
			startStudentRefreshCooldown();
		}
	} else {
		showToast('Gagal sinkron', 'error');
		document.getElementById('btn-refresh-siswa').querySelector('i').classList.remove('animate-spin');
	}
}

function setupSiswaEvents() {
	const tahun = document.getElementById('siswa-tahun-filter');
	const btnRefresh = document.getElementById('btn-refresh-siswa');

	if (tahun) {
		tahun.addEventListener('change', function() {
			refreshDataSiswa(true);
		});
  }
	if (btnRefresh) btnRefresh.addEventListener('click', refreshButtonDataSiswa);
}