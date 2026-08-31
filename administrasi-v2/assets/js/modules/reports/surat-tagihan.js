function setSuratMode(mode) {
	const btnIndv = document.getElementById('btn-mode-individu');
	const btnMassal = document.getElementById('btn-mode-massal');
	const formIndv = document.getElementById('form-surat-individu');
	const formMassal = document.getElementById('form-surat-massal');
	document.getElementById('surat-preview-container').classList.add('hidden');
	if (mode === 'individu') {
		btnIndv.className = "px-4 py-2 text-sm font-medium rounded-md bg-white text-blue-600 shadow-sm transition-all";
		btnMassal.className = "px-4 py-2 text-sm font-medium rounded-md text-gray-500 hover:text-gray-700 transition-all";
		formIndv.classList.remove('hidden');
		formIndv.classList.add('flex');
		formMassal.classList.add('hidden');
		formMassal.classList.remove('flex');
	} else {
		btnMassal.className = "px-4 py-2 text-sm font-medium rounded-md bg-white text-blue-600 shadow-sm transition-all";
		btnIndv.className = "px-4 py-2 text-sm font-medium rounded-md text-gray-500 hover:text-gray-700 transition-all";
		formMassal.classList.remove('hidden');
		formMassal.classList.add('flex');
		formIndv.classList.add('hidden');
		formIndv.classList.remove('flex');
	}
}

function getFilteredTunggakan(billingData, keperluan, siswa) {
	let maxSppIndex = 11,
		excludedLainnya = [];
	if (keperluan === 'Syarat Ujian PTS 1') {
		maxSppIndex = 3;
		excludedLainnya = ['PAS 1', 'PTS 2', 'PAS 2', 'KENAIKAN'];
	} else if (keperluan === 'Syarat Ujian PAS 1') {
		maxSppIndex = 5;
		excludedLainnya = ['PTS 2', 'PAS 2', 'KENAIKAN'];
	} else if (keperluan === 'Syarat Ujian PTS 2') {
		maxSppIndex = 8;
		excludedLainnya = ['PAS 2', 'KENAIKAN'];
	}

	const blnArr = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
	let activeThnAjaran = billingData.riwayatTahun[0] || "";
	let filteredList = [],
		totalHitung = 0;

	billingData.bulanan.forEach(b => {
		if (b.sisa !== 'LUNAS' && b.sisa > 0) {
			if (b.tahun === activeThnAjaran && keperluan !== 'Umum' && keperluan !== 'Syarat Ujian PAS 2 / Kenaikan Kelas') {
				let m = blnArr.find(bln => String(b.jenis).toUpperCase().includes(bln.toUpperCase()));
				let sppIndex = blnArr.findIndex(bln => bln === m);
				if (sppIndex <= maxSppIndex) {
					filteredList.push(b);
					totalHitung += b.sisa;
				}
			} else {
				filteredList.push(b);
				totalHitung += b.sisa;
			}
		}
	});

	billingData.lainnya.forEach(l => {
		if (l.sisa !== 'LUNAS' && l.sisa > 0) {
			if (l.tahun === activeThnAjaran && keperluan !== 'Umum' && keperluan !== 'Syarat Ujian PAS 2 / Kenaikan Kelas') {
				let isExcluded = excludedLainnya.some(kw => String(l.jenis).toUpperCase().includes(kw));
				if (!isExcluded) {
					filteredList.push(l);
					totalHitung += l.sisa;
				}
			} else {
				filteredList.push(l);
				totalHitung += l.sisa;
			}
		}
	});

	// ==========================================
	// --- FITUR BARU: INJEKSI HUTANG ATRIBUT ---
	// ==========================================
	if (siswa && typeof dbPemasukanAtribut !== 'undefined') {
		const transaksiAtribut = dbPemasukanAtribut.filter(t => String(t.nis).trim() === String(siswa.nis).trim() && !t.isDeleted);
		const atributInduk = transaksiAtribut.filter(t => !t.idRef && !t.id_nota_referensi);

		atributInduk.forEach(induk => {
			let totalBayarAtribut = Number(induk.nominal) || 0;
			const cicilanAtribut = transaksiAtribut.filter(t => t.idRef === induk.id || t.id_nota_referensi === induk.id);
			cicilanAtribut.forEach(c => totalBayarAtribut += (Number(c.nominal) || 0));

			const hargaAsli = Number(induk.hargaKatalog) || Number(induk.harga_katalog) || 0;
			const sisaAtribut = hargaAsli - totalBayarAtribut;

			if (sisaAtribut > 0) {
				// Masukkan ke dalam daftar tagihan surat dengan tambahan kata "Atribut: "
				filteredList.push({
					jenis: `Atribut: ${induk.jenis}`,
					tahun: induk.tahun,
					sisa: sisaAtribut
				});
				totalHitung += sisaAtribut;
			}
		});
	}
	// ==========================================

	return {
		items: filteredList,
		total: totalHitung
	};
}

// 2. FUNGSI buildSuratHTML (TIDAK ADA PERUBAHAN, SAYA SERTAKAN AGAR LENGKAP)
function buildSuratHTML(siswa, filteredSurat, keperluan, index, isLast = true) {
	let now = new Date();
	let romanMonth = getRomanMonth(now.getMonth());
	let year = now.getFullYear();
	let numSequence = String(index).padStart(3, '0');
	let noSurat = `TA / ${numSequence} / MA-BU / ${romanMonth} / ${year}`;
	let kalimatKeperluan = keperluan !== 'Umum' ? `sebagai salah satu syarat untuk mengikuti kegiatan <b>${keperluan}</b>` : `untuk kelancaran administrasi sekolah`;

	let groupedItems = [],
		sppGroups = {};
	filteredSurat.items.forEach(item => {
		let jenisUpper = String(item.jenis).toUpperCase();
		if (jenisUpper.includes('SPP')) {
			let month = item.jenis.replace(/SPP/i, '').trim();
			let key = `${item.tahun}_${item.nominalAwal}`;
			if (!sppGroups[key]) sppGroups[key] = {
				jenis: 'SPP',
				months: [],
				tahun: item.tahun,
				sisa: 0
			};
			sppGroups[key].months.push(month);
			sppGroups[key].sisa += item.sisa;
		} else {
			groupedItems.push({
				jenis: item.jenis,
				tahun: item.tahun,
				sisa: item.sisa
			});
		}
	});

	let finalItems = [];
	Object.values(sppGroups).forEach(g => {
		finalItems.push({
			jenis: `SPP (${g.months.join(', ')})`,
			tahun: g.tahun,
			sisa: g.sisa
		});
	});
	finalItems = finalItems.concat(groupedItems);

	let tableRows = '';
	finalItems.forEach((item, i) => {
		tableRows += `<tr><td style="text-align: center;">${i + 1}</td><td>${item.jenis} ${item.tahun ? `(${item.tahun})` : ''}</td><td style="text-align: right;">${formatRp(item.sisa)}</td></tr>`;
	});

	return `
    <div class="surat-font" style="position: relative; padding-top: ${index > 1 ? '15px' : '0'}; ${!isLast ? 'page-break-after: always;' : ''}">
      <img src="/administrasi/assets/img/kop-madrasah.jpg" style="width: 100%; height: auto; padding-bottom: 5px; margin-bottom: 10px;" alt="Kop Surat">
      <table style="width: 100%; margin-bottom: 15px;">
        <tr><td style="width: 70px;">Nomor</td><td style="width: 10px;">:</td><td>${noSurat}</td><td style="text-align: right;">Sidoarjo, ${getNowDateIndo()}</td></tr>
        <tr><td>Lampiran</td><td>:</td><td>-</td><td></td></tr>
        <tr><td>Perihal</td><td>:</td><td><b>Tagihan Administrasi</b></td><td></td></tr>
      </table>
      <p>Kepada Yth.<br><b>Bapak/Ibu Wali Murid dari:</b></p>
      <table style="margin-left: 20px; margin-bottom: 10px;">
        <tr><td style="width: 120px;">Nama</td><td style="width: 10px;">:</td><td><b>${siswa.nama}</b></td></tr>
        <tr><td>NIS</td><td>:</td><td>${siswa.nis}</td></tr>
        <tr><td>Kelas</td><td>:</td><td>${siswa.kelas}</td></tr>
      </table>
      <p><i>Assalamu'alaikum Wr. Wb.</i></p>
      <p style="text-align: justify; text-indent: 50px;">Alhamdulillah Wassholaatu Wassalaamu Alaa Rasulillah amma Ba’du. Salam silaturrahim kami sampaikan teriring doa semoga bapak ibu selalu dalam perlindungan Allah SWT dalam melaksanakan aktivitas kita sehari-hari. Amin Amin Ya Mujibassailin.</p>
      <p style="text-align: justify; text-indent: 50px;">Bersama surat ini, kami memberitahukan rincian tanggungan administrasi keuangan putra/putri Bapak/Ibu ${kalimatKeperluan}. Berikut adalah rincian tagihan yang belum terselesaikan:</p>
      <table class="surat-table">
        <thead><tr><th style="width: 50px;">No</th><th>Jenis Pembayaran</th><th style="width: 150px;">Kekurangan (Rp)</th></tr></thead>
        <tbody>
          ${tableRows}
          <tr><td colspan="2" style="text-align: right; font-weight: bold;">TOTAL KEKURANGAN:</td><td style="text-align: right; font-weight: bold;">${formatRp(filteredSurat.total)}</td></tr>
        </tbody>
      </table>
      <p style="text-align: justify; text-indent: 50px;">Kami mohon agar Bapak/Ibu dapat segera menyelesaikan administrasi tersebut. Bagi Bapak/Ibu yang berkenan melakukan pembayaran secara transfer, dapat melalui rekening <b>Bank Jatim Syariah No. 6202199559 a.n. MA Bi'rul Ulum</b>. Mohon konfirmasi dan kirimkan bukti transfer melalui WhatsApp ke nomor <b>0838-3313-3913 (Admin Madrasah)</b>.</p>
      <p style="text-align: justify; text-indent: 50px;"><i>Apabila Bapak/Ibu telah melakukan pembayaran sebelum surat ini diterima, mohon surat tagihan ini diabaikan.</i> Demikian surat pemberitahuan ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.</p>
      <p><i>Wassalamu'alaikum Wr. Wb.</i></p>
      <table style="width: 100%; margin-top: 15px; text-align: center; page-break-inside: avoid;">
        <tr>
          <td style="width: 50%;"><br>Bendahara Madrasah,<br><br><br><br><b><u>Ririn Jauharin, S.Ak.</u></b></td>
          <td style="width: 50%;">Mengetahui,<br>Kepala Madrasah,<br><br><br><br><b><u>Yusuf Muzaidi, S.Pd.</u></b></td>
        </tr>
      </table>
    </div>
    `;
}

// 3. UPDATE: Sertakan 'siswa' saat memanggil getFilteredTunggakan
function generateSuratIndividu() {
	const nis = document.getElementById('surat-nis').value.trim();
	const keperluan = document.getElementById('surat-keperluan-indv').value;
	const startNum = parseInt(document.getElementById('surat-mulai-indv').value) || 1;
	if (!nis) {
		showToast('Masukkan NIS terlebih dahulu!', 'error');
		return;
	}

	const siswa = dbSiswa.find(s => String(s.nis).trim() === nis);
	if (!siswa) {
		showToast('NIS tidak ditemukan!', 'error');
		return;
	}

	let riwayat = dbPembayaran.filter(p => !p.isDeleted && String(p.nis).trim() === nis);
	let billing = calculateSiswaBilling(siswa, dbMasterTarif, riwayat);

	// 👇 FITUR BARU: Tambahan parameter 'siswa'
	let filteredSurat = getFilteredTunggakan(billing, keperluan, siswa);

	if (filteredSurat.total <= 0) {
		showToast('Siswa ini LUNAS untuk keperluan tersebut.', 'info');
		return;
	}

	document.getElementById('surat-preview-container').classList.remove('hidden');
	document.getElementById('surat-result-info').innerText = `Preview Surat: ${siswa.nama} (Total: ${formatRp(filteredSurat.total)})`;
	document.getElementById('surat-print-area').innerHTML = buildSuratHTML(siswa, filteredSurat, keperluan, startNum, true);
	showToast('Surat berhasil dibuat!');
}

// 4. UPDATE: Sertakan 'siswa' saat memanggil getFilteredTunggakan
function generateSuratMassal() {
	const kelas = document.getElementById('surat-kelas-massal').value;
	const limit = parseInt(document.getElementById('surat-limit').value) || 0;
	const keperluan = document.getElementById('surat-keperluan-massal').value;
	const startNum = parseInt(document.getElementById('surat-mulai-massal').value) || 1;

	if (!kelas) {
		showToast('Pilih kelas terlebih dahulu!', 'error');
		return;
	}

	let listSiswa = dbSiswa.filter(s => s.kelas === kelas).sort((a, b) => a.nama.localeCompare(b.nama));
	if (listSiswa.length === 0) {
		showToast('Tidak ada siswa di kelas ini.', 'error');
		return;
	}

	let validSiswa = [];
	listSiswa.forEach((siswa) => {
		let riwayat = dbPembayaran.filter(p => !p.isDeleted && String(p.nis).trim() === String(siswa.nis).trim());
		let billing = calculateSiswaBilling(siswa, dbMasterTarif, riwayat);

		// 👇 FITUR BARU: Tambahan parameter 'siswa'
		let filteredSurat = getFilteredTunggakan(billing, keperluan, siswa);

		if (filteredSurat.total >= limit && filteredSurat.total > 0) validSiswa.push({
			siswa,
			filteredSurat
		});
	});

	let countSurat = validSiswa.length;
	if (countSurat === 0) {
		document.getElementById('surat-preview-container').classList.add('hidden');
		showToast(`Tidak ada tagihan mencapai limit Rp${limit.toLocaleString('id-ID')} untuk keperluan ini.`, 'info');
		return;
	}

	let htmlKumpulanSurat = '';
	validSiswa.forEach((data, i) => {
		let isLast = (i === countSurat - 1);
		htmlKumpulanSurat += buildSuratHTML(data.siswa, data.filteredSurat, keperluan, startNum + i, isLast);
	});

	document.getElementById('surat-preview-container').classList.remove('hidden');
	document.getElementById('surat-result-info').innerText = `Berhasil generate ${countSurat} surat untuk Kelas ${kelas}`;
	document.getElementById('surat-print-area').innerHTML = htmlKumpulanSurat;
	showToast(`Selesai! ${countSurat} surat siap dicetak.`);
}

function printSurat() {
	showToast('Menyiapkan print A4/Folio...', 'info');
	const printStyle = `
      @page { size: 210mm 330mm; margin: 5mm 10mm; }
      @media print {
        body * { visibility: visible !important; }
        #print-area, aside, header, #view-login, #view-siswa, #loading-overlay, #toast, #delete-modal, 
        #admin-view-datasiswa, #admin-view-tarif, #laporan-content-rekap,
        #admin-view-cetak > div:nth-child(1), #laporan-content-surat > div:nth-child(1), #surat-preview-container > div:first-child { display: none !important; }
        html, body, #view-admin, main, #admin-view-laporan, #laporan-content-surat, #surat-preview-container, #surat-print-wrapper, #surat-print-area {
          display: block !important; height: auto !important; min-height: 0 !important; overflow: visible !important; position: static !important;
          margin: 0 !important; padding: 0 !important; background: white !important; background-color: white !important;
          border: none !important; box-shadow: none !important; border-radius: 0 !important; outline: none !important;
        }
        #surat-print-area { width: 100% !important; max-width: none !important; box-shadow: none !important; border: none !important; }
      }
    `;
	document.getElementById('dynamic-print-style').innerHTML = printStyle;
	setTimeout(() => {
		window.print();
		setTimeout(() => {
			document.getElementById('dynamic-print-style').innerHTML = '';
		}, 1000);
	}, 500);
}

function setupSuratCetakEvents() {
  const btnSurat = document.querySelectorAll('.btnSurat');
  const btnIndividu = document.getElementById('surat-individu');
  const btnMassal = document.getElementById('surat-massal');
  const print = document.getElementById('print-surat');

  btnSurat.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const btnName = this.getAttribute('surat');

      setSuratMode(btnName);
    });
  });

  if (btnIndividu) btnIndividu.addEventListener('click', generateSuratIndividu);
  if (btnMassal) btnMassal.addEventListener('click', generateSuratMassal);
  if (print) print.addEventListener('click', printSurat);
}