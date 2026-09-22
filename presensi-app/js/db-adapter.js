// =========================================================
// DB ADAPTER
// Semua halaman (scanner.js, admin-*.js) memanggil fungsi di
// objek DB ini. Adapter yang memutuskan apakah request pergi
// ke Supabase (online) atau ke api/*.php (offline).
// =========================================================

const DB = (() => {
	const isOnline = CONFIG.MODE === 'online';
	const sb = isOnline && window.supabase ?
		window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY) :
		null;

	async function callPhp(file, {
		method = 'GET',
		body,
		query = ''
	} = {}) {
		const res = await fetch(`${CONFIG.API_BASE}/${file}${query}`, {
			method,
			headers: {
				'Content-Type': 'application/json'
			},
			body: body ? JSON.stringify(body) : undefined,
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan');
		return data;
	}

	const HARI_MAP = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

	function toSeconds(t) {
		const [h, m, s] = t.split(':').map(Number);
		return h * 3600 + m * 60 + (s || 0);
	}

	function addMinutes(timeStr, mins) {
		const [h, m, s] = timeStr.split(':').map(Number);
		const d = new Date(2000, 0, 1, h, m, s);
		d.setMinutes(d.getMinutes() + mins);
		return d.toTimeString().slice(0, 8);
	}

  function jadwalEfektifJS(jadwal, daftarIzin) {
    const windows = (daftarIzin || []).filter(iz => iz.jenis === 'Izin' && iz.jam_mulai && iz.jam_selesai);
    if (!windows.length) return jadwal;

    let hasil = { ...jadwal };
    let adaPenyesuaian = false;

    let lanjut = true;
    while (lanjut) {
      lanjut = false;
      for (const w of windows) {
        if (w.jam_mulai <= hasil.jam_masuk && w.jam_selesai > hasil.jam_masuk) {
          hasil.jam_masuk = w.jam_selesai;
          adaPenyesuaian = true;
          lanjut = true;
        }
      }
    }

    lanjut = true;
    while (lanjut) {
      lanjut = false;
      for (const w of windows) {
        if (w.jam_selesai >= hasil.jam_pulang && w.jam_mulai < hasil.jam_pulang) {
          hasil.jam_pulang = w.jam_mulai;
          adaPenyesuaian = true;
          lanjut = true;
        }
      }
    }

    hasil._adaIzinSebagian = adaPenyesuaian;
    return hasil;
  }

	// ---------- helper laporan (dipakai versi online, meniru logic laporan.php) ----------
	function formatDurasiLaporan(totalMenit) {
		const jam = Math.floor(totalMenit / 60);
		const sisa = totalMenit % 60;
		if (jam > 0) return sisa > 0 ? `${jam} Jam ${sisa} Menit` : `${jam} Jam`;
		return `${totalMenit} Menit`;
	}

  const MENIT_PER_JAM_PELAJARAN = 40;

  function hitungJamPelajaranIzin(daftarIzin, jadwal) {
    const izinParsial = daftarIzin.filter(iz => iz.jenis === 'Izin' && iz.jam_mulai && iz.jam_selesai);
    let totalMenit;
    if (izinParsial.length) {
      totalMenit = izinParsial.reduce((sum, w) => sum + Math.round((toSeconds(w.jam_selesai) - toSeconds(w.jam_mulai)) / 60), 0);
    } else {
      totalMenit = Math.round((toSeconds(jadwal.jam_pulang) - toSeconds(jadwal.jam_masuk)) / 60);
    }
    const jp = Math.max(1, Math.round(totalMenit / MENIT_PER_JAM_PELAJARAN));
    return { menit: totalMenit, jamPelajaran: jp };
  }

  function ketMasukJSDenganIzin(jadwal, jamScanMasuk, izin) {
    if (!jamScanMasuk) return { label: 'Alpha', tipe: 'alpha', menit: 0 };

    const jadwalEfektif = jadwalEfektifJS(jadwal, izin);
    const suffix = jadwalEfektif._adaIzinSebagian ? ' (Izin sebagian jam)' : '';

    if (jamScanMasuk <= jadwalEfektif.jam_masuk) {
      return { label: 'Hadir Tepat Waktu' + suffix, tipe: 'hadir', menit: 0 };
    }
    const menit = Math.round((toSeconds(jamScanMasuk) - toSeconds(jadwalEfektif.jam_masuk)) / 60);
    return { label: 'Telat ' + formatDurasiLaporan(menit) + suffix, tipe: 'telat', menit };
  }

	function ketMasukJS(jadwal, jamScanMasuk) {
		if (!jamScanMasuk) return {
			label: 'Alpha',
			tipe: 'alpha',
      menit: 0
		};
		if (jamScanMasuk <= jadwal.jam_masuk) return {
			label: 'Hadir Tepat Waktu',
			tipe: 'hadir',
      menit: 0
		};
		const menit = Math.round((toSeconds(jamScanMasuk) - toSeconds(jadwal.jam_masuk)) / 60);
		return {
			label: 'Telat ' + formatDurasiLaporan(menit),
			tipe: 'telat',
      menit
		};
	}

  function ketPulangJS(jadwal, jamScanMasuk, jamScanPulang, izin = []) {
  	if (!jamScanMasuk) return {
  		label: '-',
  		tipe: 'alpha',
  		menit: 0
  	};
  	if (!jamScanPulang) return {
  		label: 'Belum Scan Pulang',
  		tipe: 'warning',
  		menit: 0
  	};

  	const jadwalEfektif = jadwalEfektifJS(jadwal, izin);
  	const suffix = jadwalEfektif._adaIzinSebagian ? ' (Izin sebagian jam)' : '';

  	if (jamScanPulang >= jadwalEfektif.jam_pulang) return {
  		label: 'Pulang Tepat Waktu' + suffix,
  		tipe: 'hadir',
  		menit: 0
  	};
  	const menit = Math.round((toSeconds(jadwalEfektif.jam_pulang) - toSeconds(jamScanPulang)) / 60);
  	return {
  		label: 'Pulang Awal ' + formatDurasiLaporan(menit) + suffix,
  		tipe: 'pulang',
  		menit
  	};
  }

	// ---------- laporan (online) ----------
  async function laporanOnline(dari, sampai, guruId, status) {
  	if (!dari || !sampai) {
  		throw new Error('Tanggal filter belum lengkap. Pilih Dari Tanggal dan Sampai Tanggal.');
  	}

  	let q = sb.from('guru').select('id, nama, guru_jadwal(*)').eq('aktif', true);
  	if (guruId) q = q.eq('id', guruId);
  	const {
  		data: guruList
  	} = await q;

  	const {
  		data: presensiRows
  	} = await sb.from('presensi')
  		.select('*').gte('tanggal', dari).lte('tanggal', sampai);
  	const {
  		data: izinRows
  	} = await sb.from('izin')
  		.select('*').gte('tanggal', dari).lte('tanggal', sampai);
  	const {
  		data: liburRows
  	} = await sb.from('hari_libur')
  		.select('*').gte('tanggal', dari).lte('tanggal', sampai);
		const { 
			data: kegiatanRows
		} = await sb.from('hari_kegiatan')
			.select('*').gte('tanggal', dari).lte('tanggal', sampai);
  	const hasil = [];
  	const cursor = new Date(dari + 'T00:00:00');
  	const akhir = new Date(sampai + 'T00:00:00');

  	while (cursor <= akhir) {
  		const tanggalStr = tanggalLokal(cursor);
  		const hariIni = HARI_MAP[cursor.getDay()];
  		const libur = (liburRows || []).find(l => l.tanggal === tanggalStr);
			const kegiatan = (kegiatanRows || []).find(k => k.tanggal === tanggalStr);

  		(guruList || []).forEach(g => {
  			const jadwalHari = (g.guru_jadwal || []).find(j => j.hari === hariIni);
  			if (!jadwalHari) return;

  			const p = (presensiRows || []).find(pr => pr.guru_id === g.id && pr.tanggal === tanggalStr);
  			const izin = (izinRows || []).filter(iz => iz.guru_id === g.id && iz.tanggal === tanggalStr);

  			let menitIzin = 0,
  				jpIzin = 0;
  			if (izin.length) {
  				const hitung = hitungJamPelajaranIzin(izin, jadwalHari);
  				menitIzin = hitung.menit;
  				jpIzin = hitung.jamPelajaran;
  			}
  			const izinNonJam = izin.length ? izin[0] : null;

  			let km, kp;
  			if (libur && !p?.jam_scan_masuk) {
  				km = {
  					label: 'Libur: ' + libur.keterangan,
  					tipe: 'libur'
  				};
  				kp = {
  					label: 'Libur: ' + libur.keterangan,
  					tipe: 'libur'
  				};
  			} else if (izin.length && !p?.jam_scan_masuk) {
  				if (izinNonJam.jenis === 'Izin') {
  					km = {
  						label: `Izin ${jpIzin} Jam Pelajaran`,
  						tipe: 'izin'
  					};
  				} else {
  					km = {
  						label: izinNonJam.jenis,
  						tipe: izinNonJam.jenis.toLowerCase()
  					};
  				}
  				kp = ketPulangJS(jadwalHari, p?.jam_scan_masuk, p?.jam_scan_pulang);
  			} else if (kegiatan) {
					km = p?.jam_scan_masuk ?
						{
							label: 'Hadir jam ' + p.jam_scan_masuk.slice(0, 5),
							tipe: 'hadir'
						} :
						{
							label: 'Alpha',
							tipe: 'alpha'
						};
					kp = !p?.jam_scan_masuk ? {
							label: '-',
							tipe: 'alpha'
						} :
						!p?.jam_scan_pulang ? {
							label: 'Belum Scan Pulang',
							tipe: 'warning'
						} :
						{
							label: 'Pulang jam ' + p.jam_scan_pulang.slice(0, 5),
							tipe: 'hadir'
						};
				} else if (jadwalHari.kategori === 'struktural' || jadwalHari.kategori === 'mengaji') {
  				km = p?.jam_scan_masuk ?
  					{
  						label: 'Hadir jam ' + p.jam_scan_masuk.slice(0, 5),
  						tipe: 'hadir'
  					} :
  					{
  						label: 'Alpha',
  						tipe: 'alpha'
  					};
  				kp = !p?.jam_scan_masuk ? {
  						label: '-',
  						tipe: 'alpha'
  					} :
  					!p?.jam_scan_pulang ? {
  						label: 'Belum Scan Pulang',
  						tipe: 'warning'
  					} :
  					{
  						label: 'Pulang jam ' + p.jam_scan_pulang.slice(0, 5),
  						tipe: 'hadir'
  					};
  			} else {
  				km = ketMasukJSDenganIzin(jadwalHari, p?.jam_scan_masuk, izin);
  				kp = ketPulangJS(jadwalHari, p?.jam_scan_masuk, p?.jam_scan_pulang, izin);
  			}

  			let cocok = true;
  			if (status === 'telat') cocok = km.tipe === 'telat';
  			else if (status === 'pulang_awal') cocok = kp.tipe === 'pulang';
  			else if (status === 'alpha') cocok = km.tipe === 'alpha';
  			else if (status === 'belum_pulang') cocok = kp.tipe === 'warning';
  			else if (status === 'libur') cocok = km.tipe === 'libur';
				else if (status === 'kegiatan_sekolah') cocok = !!kegiatan;
  			else if (['sakit', 'izin', 'kegiatan', 'cuti'].includes(status)) cocok = km.tipe === status;
  			if (!cocok) return;

  			hasil.push({
  				tanggal: tanggalStr,
  				nama_guru: g.nama,
  				jam_scan_masuk: p?.jam_scan_masuk || null,
  				jam_scan_pulang: p?.jam_scan_pulang || null,
  				ket_masuk: km.label,
  				ket_masuk_tipe: km.tipe,
  				ket_pulang: kp.label,
  				ket_pulang_tipe: kp.tipe,
  				menit_telat: km.menit || 0,
  				menit_pulang_awal: kp.menit || 0,
  				menit_izin: menitIzin,
  			});
  		});
  		cursor.setDate(cursor.getDate() + 1);
  	}

  	hasil.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  	return hasil;
  }

	async function laporanSiswaOnline(dari, sampai, kelasId) {
		if (!dari || !sampai) throw new Error('Tanggal filter belum lengkap.');

		let q = sb.from('siswa').select('id, nama, kelas_id, kelas(nama_kelas)').eq('aktif', true);
		if (kelasId) q = q.eq('kelas_id', kelasId);
		const { data: siswaList } = await q;

		const kelasIds = [...new Set((siswaList || []).map(s => s.kelas_id))];
		const { data: jadwalRows } = await sb.from('jadwal_kelas').select('*').in('kelas_id', kelasIds.length ? kelasIds : [0]);
		const { data: presensiRows } = await sb.from('presensi_siswa').select('*').gte('tanggal', dari).lte('tanggal', sampai);
		const { data: izinRows } = await sb.from('izin_siswa').select('*').gte('tanggal', dari).lte('tanggal', sampai);
		const { data: liburRows } = await sb.from('hari_libur').select('*').gte('tanggal', dari).lte('tanggal', sampai);

		const rekap = {}; // siswa_id -> { nama, kelas, hadir, telat, alpha, izin }
		(siswaList || []).forEach(s => {
			rekap[s.id] = { nama: s.nama, kelas: s.kelas?.nama_kelas || '-', hadir: 0, telat: 0, alpha: 0, izin: 0 };
		});

		const cursor = new Date(dari + 'T00:00:00');
		const akhir = new Date(sampai + 'T00:00:00');

		while (cursor <= akhir) {
			const tanggalStr = tanggalLokal(cursor);
			const hariIni = HARI_MAP[cursor.getDay()];
			const libur = (liburRows || []).find(l => l.tanggal === tanggalStr);

			if (!libur) {
				(siswaList || []).forEach(s => {
					const jadwal = (jadwalRows || []).find(j => j.kelas_id === s.kelas_id && j.hari === hariIni);
					if (!jadwal) return; // kelas ini tidak ada jadwal hari itu

					const p = (presensiRows || []).find(pr => pr.siswa_id === s.id && pr.tanggal === tanggalStr);
					const izin = (izinRows || []).find(iz => iz.siswa_id === s.id && iz.tanggal === tanggalStr);

					if (izin && !p?.jam_scan_masuk) {
						rekap[s.id].izin++;
					} else if (p?.jam_scan_masuk) {
						rekap[s.id].hadir++;
						if (p.status === 'telat' || p.status === 'telat_dan_pulang_awal') rekap[s.id].telat++;
					} else {
						rekap[s.id].alpha++;
					}
				});
			}
			cursor.setDate(cursor.getDate() + 1);
		}

		return Object.values(rekap).sort((a, b) => a.nama.localeCompare(b.nama));
	}

	// ---------- import Excel (online) ----------
	function parseJadwalCellJS(teks) {
		teks = (teks || '').trim().replace('–', '-');
		if (!teks) return null;

		const parts = teks.split(',').map(s => s.trim());
		const rentangJam = parts[0];
		const kategoriMentah = (parts[1] || '').toLowerCase();
		let kategori = 'pengajar';
		if (kategoriMentah.startsWith('s')) kategori = 'struktural';
		else if (kategoriMentah.startsWith('m')) kategori = 'mengaji';

		const bagian = rentangJam.split('-').map(s => s.trim());
		if (bagian.length !== 2) return null;
		for (const j of bagian)
			if (!/^\d{1,2}:\d{2}$/.test(j)) return null;
		return {
			jam_masuk: bagian[0] + ':00',
			jam_pulang: bagian[1] + ':00',
			kategori
		};
	}

	async function importGuruOnline(rows) {
		const HARI_KOLOM = {
			senin: 'Senin',
			selasa: 'Selasa',
			rabu: 'Rabu',
			kamis: 'Kamis',
			jumat: 'Jumat',
			sabtu: 'Sabtu'
		};
		let berhasil = 0;
		const gagal = [];

		for (let i = 0; i < rows.length; i++) {
			const r = rows[i];
			const barisKe = i + 2;
			const nama = (r.nama || '').trim();
			if (!nama) {
				gagal.push(`Baris ${barisKe}: nama kosong`);
				continue;
			}
			const namaPanggilan = (r.nama_panggilan || '').trim() || null;

			const toleransi = Number(r.toleransi) || 15;
			const aktif = ['aktif', 'active', '1'].includes(String(r.status || '').toLowerCase());

			const jadwal = [];
			Object.entries(HARI_KOLOM).forEach(([key, hari]) => {
				const parsed = parseJadwalCellJS(r[key]);
				if (parsed) {
					jadwal.push({
						hari,
						jam_masuk: parsed.jam_masuk,
						jam_pulang: parsed.jam_pulang,
						kategori: parsed.kategori,
						toleransi_telat_menit: parsed.kategori === 'pengajar' ? toleransi : 0,
					});
				}
			});
			if (!jadwal.length) {
				gagal.push(`Baris ${barisKe} (${nama}): tidak ada jadwal valid`);
				continue;
			}

			try {
				const kode = (r.kode || '').trim();
				let guruId = null;

				if (kode) {
					const {
						data: existing
					} = await sb.from('guru').select('id').eq('barcode_id', kode).maybeSingle();
					if (existing) guruId = existing.id;
				}

				if (guruId) {
					await sb.from('guru').update({
						nama,
						nama_panggilan: namaPanggilan,
						aktif
					}).eq('id', guruId);
				} else {
					const barcode = kode || generateBarcodeGuru();
					const {
						data: inserted,
						error
					} = await sb.from('guru').insert({
						nama,
						nama_panggilan: namaPanggilan,
						barcode_id: barcode,
						aktif
					}).select().single();
					if (error) throw new Error(error.message);
					guruId = inserted.id;
				}

				await sb.from('guru_jadwal').delete().eq('guru_id', guruId);
				const jadwalRows = jadwal.map(j => ({
					...j,
					guru_id: guruId
				}));
				const {
					error: errJ
				} = await sb.from('guru_jadwal').insert(jadwalRows);
				if (errJ) throw new Error(errJ.message);

				berhasil++;
			} catch (e) {
				gagal.push(`Baris ${barisKe} (${nama}): ${e.message}`);
			}
		}

		return {
			berhasil,
			gagal
		};
	}

  async function scanOnline(barcode) {
  	const {
  		data: guru
  	} = await sb.from('guru').select('*').eq('barcode_id', barcode).eq('aktif', true).maybeSingle();
  	if (!guru) return {
  		error: 'Barcode tidak dikenali'
  	};

  	const hariIni = HARI_MAP[new Date().getDay()];
  	const {
  		data: jadwal
  	} = await sb.from('guru_jadwal')
  		.select('*').eq('guru_id', guru.id).eq('hari', hariIni).maybeSingle();
  	if (!jadwal) return {
  		error: `${guru.nama} tidak memiliki jadwal masuk pada hari ${hariIni}`
  	};

  	const tanggal = tanggalLokal(new Date());
  	const jamSekarang = new Date().toTimeString().slice(0, 8);

  	const {
  		data: existing
  	} = await sb.from('presensi')
  		.select('*').eq('guru_id', guru.id).eq('tanggal', tanggal).maybeSingle();

  	const {
  		data: izinHariIni
  	} = await sb.from('izin').select('*').eq('guru_id', guru.id).eq('tanggal', tanggal);
  	const jadwalEfektif = jadwalEfektifJS(jadwal, izinHariIni || []);
		const { data: kegiatanHariIni } = await sb.from('hari_kegiatan').select('*').eq('tanggal', tanggal).maybeSingle();

  	if (!existing) {
  		let status, menitTelat = 0;
  		if (jadwalEfektif.kategori === 'mengaji') {
  			await sb.from('presensi').insert({
  				guru_id: guru.id,
  				tanggal,
  				jam_scan_masuk: jamSekarang,
  				jam_scan_pulang: jamSekarang,
  				status: 'hadir'
  			});
  			return {
  				jenis: 'masuk',
  				nama: guru.nama,
  				nama_panggilan: guru.nama_panggilan || guru.nama,
  				jam: jamSekarang,
  				status: 'hadir',
  				menit_telat: 0
  			};
  		}
  		if (kegiatanHariIni || jadwalEfektif.kategori === 'struktural') {
  			status = 'hadir';
  		} else {
  			const batasTelat = addMinutes(jadwalEfektif.jam_masuk, jadwalEfektif.toleransi_telat_menit);
  			menitTelat = Math.max(0, Math.round((toSeconds(jamSekarang) - toSeconds(jadwalEfektif.jam_masuk)) / 60));
  			status = jamSekarang > batasTelat ? 'telat' : 'hadir';
  		}
  		await sb.from('presensi').insert({
  			guru_id: guru.id,
  			tanggal,
  			jam_scan_masuk: jamSekarang,
  			status
  		});
  		return {
  			jenis: 'masuk',
  			nama: guru.nama,
  			nama_panggilan: guru.nama_panggilan || guru.nama,
  			jam: jamSekarang,
  			status,
  			menit_telat: status === 'telat' ? menitTelat : 0
  		};
  	}

  	if (!existing.jam_scan_pulang) {
  		const durasiSesiMenit = (toSeconds(jadwalEfektif.jam_pulang) - toSeconds(jadwalEfektif.jam_masuk)) / 60;
  		const minMenitPulang = Math.max(0, Math.min(60, durasiSesiMenit));
  		const menitSejakMasuk = (toSeconds(jamSekarang) - toSeconds(existing.jam_scan_masuk)) / 60;

  		if (menitSejakMasuk < minMenitPulang) {
  			return {
  				jenis: 'terlalu_cepat',
  				nama: guru.nama,
  				error: `Belum bisa presensi pulang. Minimal ${Math.ceil(minMenitPulang)} menit setelah masuk (${Math.ceil(minMenitPulang - menitSejakMasuk)} menit lagi).`,
  			};
  		}

  		let statusBaru;
  		if (kegiatanHariIni || 	jadwalEfektif.kategori === 'struktural') {
  			statusBaru = 'hadir';
  		} else {
  			const pulangAwal = jamSekarang < jadwalEfektif.jam_pulang;
  			statusBaru = existing.status;
  			if (pulangAwal) statusBaru = existing.status === 'telat' ? 'telat_dan_pulang_awal' : 'pulang_awal';
  		}

  		const {
  			data: updated,
  			error: errUpdate
  		} = await sb.from('presensi')
  			.update({
  				jam_scan_pulang: jamSekarang,
  				status: statusBaru
  			}).eq('id', existing.id).select();
  		if (errUpdate) throw new Error('Gagal menyimpan presensi pulang: ' + errUpdate.message);
  		if (!updated || !updated.length) throw new Error('Presensi pulang tidak tersimpan.');

  		return {
  			jenis: 'pulang',
  			nama: guru.nama,
  			nama_panggilan: guru.nama_panggilan || guru.nama,
  			jam: jamSekarang,
  			status: statusBaru
  		};
  	}

  	return {
  		jenis: 'sudah_lengkap',
  		nama: guru.nama,
  		nama_panggilan: guru.nama_panggilan || guru.nama,
  		status: existing.status
  	};
  }

	function generateBarcodeGuru() {
		const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
		const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
		return `GRU-${ymd}-${rand}`;
	}

	// SCAN SISWA
	async function scanSiswaOnline(barcode) {
		const { data: siswa } = await sb.from('siswa').select('*, kelas(nama_kelas)').eq('barcode_id', barcode).eq('aktif', true).maybeSingle();
		if (!siswa) return null; // bukan barcode siswa, biar scanner.js coba jalur lain

		const hariIni = HARI_MAP[new Date().getDay()];
		const { data: jadwal } = await sb.from('jadwal_kelas')
			.select('*').eq('kelas_id', siswa.kelas_id).eq('hari', hariIni).maybeSingle();
		if (!jadwal) return { error: `Kelas ${siswa.kelas?.nama_kelas || ''} tidak memiliki jadwal pada hari ${hariIni}` };

		const tanggal = tanggalLokal(new Date());
		const jamSekarang = new Date().toTimeString().slice(0, 8);

		const { data: existing } = await sb.from('presensi_siswa')
			.select('*').eq('siswa_id', siswa.id).eq('tanggal', tanggal).maybeSingle();

		if (!existing) {
			const batasTelat = addMinutes(jadwal.jam_masuk, jadwal.toleransi_telat_menit);
			const menitTelat = Math.max(0, Math.round((toSeconds(jamSekarang) - toSeconds(jadwal.jam_masuk)) / 60));
			const status = jamSekarang > batasTelat ? 'telat' : 'hadir';

			await sb.from('presensi_siswa').insert({
				siswa_id: siswa.id, 
				tanggal, 
				jam_scan_masuk: jamSekarang, 
				status,
				kelas_id: siswa.kelas_id,
    		nama_kelas_saat_itu: siswa.kelas?.nama_kelas || null,
			});
			return { tipe: 'siswa', jenis: 'masuk', nama: siswa.nama, jam: jamSekarang, status, menit_telat: status === 'telat' ? menitTelat : 0 };
		}

		if (!existing.jam_scan_pulang) {
			const durasiSesiMenit = (toSeconds(jadwal.jam_pulang) - toSeconds(jadwal.jam_masuk)) / 60;
			const minMenitPulang = Math.max(0, Math.min(60, durasiSesiMenit));
			const menitSejakMasuk = (toSeconds(jamSekarang) - toSeconds(existing.jam_scan_masuk)) / 60;

			if (menitSejakMasuk < minMenitPulang) {
				return {
					tipe: 'siswa', jenis: 'terlalu_cepat', nama: siswa.nama,
					error: `Belum bisa presensi pulang. Minimal ${Math.ceil(minMenitPulang)} menit setelah masuk (${Math.ceil(minMenitPulang - menitSejakMasuk)} menit lagi).`,
				};
			}

			const pulangAwal = jamSekarang < jadwal.jam_pulang;
			let statusBaru = existing.status;
			if (pulangAwal) statusBaru = existing.status === 'telat' ? 'telat_dan_pulang_awal' : 'pulang_awal';

			const { data: updated, error: errUpdate } = await sb.from('presensi_siswa')
				.update({ jam_scan_pulang: jamSekarang, status: statusBaru }).eq('id', existing.id).select();
			if (errUpdate) throw new Error('Gagal menyimpan presensi pulang: ' + errUpdate.message);
			if (!updated || !updated.length) throw new Error('Presensi pulang tidak tersimpan.');

			return { tipe: 'siswa', jenis: 'pulang', nama: siswa.nama, jam: jamSekarang, status: statusBaru };
		}

		return { tipe: 'siswa', jenis: 'sudah_lengkap', nama: siswa.nama, status: existing.status };
	}

	function generateBarcodeSiswa() {
		const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
		const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
		return `SIS-${ymd}-${rand}`;
	}

	async function prosesKenaikanKelasOnline(daftarPerubahan) {
		let berhasil = 0;
		const gagal = [];
		const tahunSekarang = new Date().getFullYear();

		for (const item of daftarPerubahan) {
			try {
				if (item.aksi === 'pindah_kelas') {
					const { error } = await sb.from('siswa').update({ kelas_id: item.kelas_tujuan_id }).eq('id', item.siswa_id);
					if (error) throw new Error(error.message);
				} else if (item.aksi === 'lulus') {
					const { error } = await sb.from('siswa').update({
						status_siswa: 'lulus',
						tahun_status: item.tahun || tahunSekarang,
						aktif: false,
					}).eq('id', item.siswa_id);
					if (error) throw new Error(error.message);
				} else if (item.aksi === 'pindah') {
					const { error } = await sb.from('siswa').update({
						status_siswa: 'pindah',
						tahun_status: item.tahun || tahunSekarang,
						keterangan_status: item.keterangan || null,
						aktif: false,
					}).eq('id', item.siswa_id);
					if (error) throw new Error(error.message);
				}
				// aksi === 'tinggal_kelas' -> tidak ada perubahan, dilewati saja
				berhasil++;
			} catch (e) {
				gagal.push(`Siswa ID ${item.siswa_id}: ${e.message}`);
			}
		}

		return { berhasil, gagal };
	}

	return {
		// ---- PRESENSI (kiosk) ----
		async scan(barcode) {
			if (isOnline) return scanOnline(barcode);
			return callPhp('presensi.php', {
				method: 'POST',
				body: {
					barcode
				}
			});
		},
		async riwayatHariIni(tanggal, limit = 5) {
			if (isOnline) {
				const {
					data
				} = await sb.from('presensi')
					.select('*, guru(nama)').eq('tanggal', tanggal)
					.order('created_at', {
						ascending: false
					}).limit(limit);
				return (data || []).map(r => ({
					...r,
					nama_guru: r.guru?.nama
				}));
			}
			const res = await callPhp('presensi.php', {
				query: `?dari=${tanggal}&sampai=${tanggal}&limit=${limit}`
			});
			return res.data;
		},

		// ---- CEK ADMIN (dipakai kiosk, tidak pernah melempar error) ----
		async cekAdminBarcode(barcode) {
			if (isOnline) {
				const {
					data
				} = await sb.rpc('login_admin_barcode', {
					p_barcode: barcode
				});
				return data && data.length ? data[0] : null;
			}
			const res = await callPhp('auth.php', {
				method: 'POST',
				body: {
					action: 'cek_barcode_admin',
					barcode
				}
			});
			return res.user;
		},

		// ---- GURU ----
		async listGuru() {
			if (isOnline) {
				const {
					data: guruList
				} = await sb.from('guru').select('*').order('nama');
				const {
					data: jadwalAll
				} = await sb.from('guru_jadwal').select('*');
				return (guruList || []).map(g => ({
					...g,
					jadwal: (jadwalAll || []).filter(j => j.guru_id === g.id)
				}));
			}
			return (await callPhp('guru.php')).data;
		},
		async addGuru(guru) {
			if (isOnline) {
				const barcode_id = generateBarcodeGuru();
				const {
					data,
					error
				} = await sb.from('guru').insert({
					nama: guru.nama,
					nip: guru.nip,
					nama_panggilan: guru.nama_panggilan || null,
					barcode_id
				}).select().single();
				if (error) throw new Error(error.message);
				const jadwalRows = (guru.jadwal || []).map(j => ({
					...j,
					guru_id: data.id
				}));
				if (jadwalRows.length) await sb.from('guru_jadwal').insert(jadwalRows);
				return {
					barcode_id
				};
			}
			return callPhp('guru.php', {
				method: 'POST',
				body: guru
			});
		},
		async updateGuru(guru) {
			if (isOnline) {
				await sb.from('guru').update({
					nama: guru.nama,
					nip: guru.nip,
					nama_panggilan: guru.nama_panggilan || null,
					aktif: guru.aktif
				}).eq('id', guru.id);
				if (guru.jadwal) {
					await sb.from('guru_jadwal').delete().eq('guru_id', guru.id);
					const jadwalRows = guru.jadwal.map(j => ({
						...j,
						guru_id: guru.id
					}));
					if (jadwalRows.length) await sb.from('guru_jadwal').insert(jadwalRows);
				}
				return;
			}
			return callPhp('guru.php', {
				method: 'PUT',
				body: guru
			});
		},
		async deleteGuru(id) {
			if (isOnline) {
				await sb.from('guru').delete().eq('id', id);
				return;
			}
			return callPhp('guru.php', {
				method: 'DELETE',
				query: `?id=${id}`
			});
		},
		async importGuru(rows) {
			if (isOnline) return importGuruOnline(rows);
			return callPhp('guru-import.php', {
				method: 'POST',
				body: {
					rows
				}
			});
		},

		// ---- LAPORAN ----
		async laporanRentang(dari, sampai, guruId = '', status = '') {
			if (isOnline) return laporanOnline(dari, sampai, guruId ? Number(guruId) : null, status);
			const q = new URLSearchParams({
				dari,
				sampai
			});
			if (guruId) q.set('guru_id', guruId);
			if (status) q.set('status', status);
			const res = await callPhp('laporan.php', {
				query: `?${q.toString()}`
			});
			return res.data;
		},

		// ---- USERS (admin) ----
		async listUsers() {
			if (isOnline) {
				const {
					data,
					error
				} = await sb.rpc('list_admin_users');
				if (error) throw new Error(error.message);
				return data;
			}
			return (await callPhp('users.php')).data;
		},
		async addUser(user) {
			if (isOnline) {
				const {
					error
				} = await sb.rpc('create_admin_user', {
					p_username: user.username,
					p_password: user.password,
					p_nama: user.nama,
					p_role: user.role || 'admin',
					p_barcode: user.barcode_id || '',
					p_kelas_id: user.kelas_id || null,
				});
				if (error) throw new Error(error.message);
				return;
			}
			return callPhp('users.php', {
				method: 'POST',
				body: user
			});
		},
		async updateUser(user) {
			if (isOnline) {
				const {
					error
				} = await sb.rpc('update_admin_user', {
					p_id: user.id,
					p_nama: user.nama,
					p_role: user.role || 'admin',
					p_barcode: user.barcode_id || '',
					p_aktif: user.aktif !== 0,
					p_new_password: user.password || '',
					p_kelas_id: user.kelas_id || null,
				});
				if (error) throw new Error(error.message);
				return;
			}
			return callPhp('users.php', {
				method: 'PUT',
				body: user
			});
		},
		async deleteUser(id) {
			if (isOnline) {
				const {
					error
				} = await sb.rpc('delete_admin_user', {
					p_id: id
				});
				if (error) throw new Error(error.message);
				return;
			}
			return callPhp('users.php', {
				method: 'DELETE',
				query: `?id=${id}`
			});
		},

		async listIzin(dari = null, sampai = null) {
			if (isOnline) {
				let q = sb.from('izin').select('*, guru(nama)').order('tanggal', {
					ascending: false
				});
				if (dari && sampai) q = q.gte('tanggal', dari).lte('tanggal', sampai);
				const {
					data,
					error
				} = await q;
				if (error) throw new Error(error.message);
				return (data || []).map(r => ({
					...r,
					nama_guru: r.guru?.nama
				}));
			}
			const query = (dari && sampai) ? `?dari=${dari}&sampai=${sampai}` : '';
			const res = await callPhp('izin.php', {
				query
			});
			return res.data;
		},

    async addIzin(data) {
      if (isOnline) {
        const { error } = await sb.from('izin').insert({
          guru_id: data.guru_id,
          tanggal: data.tanggal,
          jenis: data.jenis,
          jam_mulai: data.jam_mulai || null,
          jam_selesai: data.jam_selesai || null,
          keterangan: data.keterangan || null,
          dicatat_oleh: data.dicatat_oleh || null,
        });
        if (error) throw new Error(error.message);

        // --- Hitung ulang presensi kalau guru ini SUDAH scan di tanggal itu ---
        const { data: presensiExisting } = await sb.from('presensi')
          .select('*').eq('guru_id', data.guru_id).eq('tanggal', data.tanggal).maybeSingle();

        let statusTerupdate = null;
        if (presensiExisting && presensiExisting.jam_scan_masuk) {
          const hariItu = HARI_MAP[new Date(data.tanggal + 'T00:00:00').getDay()];
          const { data: jadwal } = await sb.from('guru_jadwal')
            .select('*').eq('guru_id', data.guru_id).eq('hari', hariItu).maybeSingle();

          if (jadwal) {
            const { data: semuaIzinHariItu } = await sb.from('izin')
              .select('*').eq('guru_id', data.guru_id).eq('tanggal', data.tanggal);
            const jadwalEfektif = jadwalEfektifJS(jadwal, semuaIzinHariItu || []);

            let statusBaru;
            if (jadwalEfektif.kategori === 'struktural' || jadwalEfektif.kategori === 'mengaji') {
              statusBaru = 'hadir';
            } else {
              const batasTelat = addMinutes(jadwalEfektif.jam_masuk, jadwalEfektif.toleransi_telat_menit);
              statusBaru = presensiExisting.jam_scan_masuk > batasTelat ? 'telat' : 'hadir';
              if (presensiExisting.jam_scan_pulang) {
                const pulangAwal = presensiExisting.jam_scan_pulang < jadwalEfektif.jam_pulang;
                if (pulangAwal) statusBaru = statusBaru === 'telat' ? 'telat_dan_pulang_awal' : 'pulang_awal';
              }
            }

            if (statusBaru !== presensiExisting.status) {
              await sb.from('presensi').update({ status: statusBaru }).eq('id', presensiExisting.id);
              statusTerupdate = statusBaru;
            }
          }
        }

        return { status_presensi_terupdate: statusTerupdate };
      }
      return callPhp('izin.php', { method: 'POST', body: data });
    },

		async deleteIzin(id) {
			if (isOnline) {
				const {
					error
				} = await sb.from('izin').delete().eq('id', id);
				if (error) throw new Error(error.message);
				return;
			}
			return callPhp('izin.php', {
				method: 'DELETE',
				query: `?id=${id}`
			});
		},

		// ---- LIBUR ----
		async listHariLibur(dari, sampai) {
			if (isOnline) {
				let q = sb.from('hari_libur').select('*').order('tanggal');
				if (dari && sampai) q = q.gte('tanggal', dari).lte('tanggal', sampai);
				const {
					data,
					error
				} = await q;
				if (error) throw new Error(error.message);
				return data;
			}
			const query = (dari && sampai) ? `?dari=${dari}&sampai=${sampai}` : '';
			return (await callPhp('hari-libur.php', {
				query
			})).data;
		},
		async addHariLibur(data) {
			if (isOnline) {
				const {
					error
				} = await sb.from('hari_libur').upsert(data, {
					onConflict: 'tanggal'
				});
				if (error) throw new Error(error.message);
				return;
			}
			return callPhp('hari-libur.php', {
				method: 'POST',
				body: data
			});
		},
		async deleteHariLibur(id) {
			if (isOnline) {
				const {
					error
				} = await sb.from('hari_libur').delete().eq('id', id);
				if (error) throw new Error(error.message);
				return;
			}
			return callPhp('hari-libur.php', {
				method: 'DELETE',
				query: `?id=${id}`
			});
		},

		// ---- KEGIATAN SEKOLAH ----
		async listHariKegiatan(dari, sampai) {
			if (isOnline) {
				let q = sb.from('hari_kegiatan').select('*').order('tanggal');
				if (dari && sampai) q = q.gte('tanggal', dari).lte('tanggal', sampai);
				const { data, error } = await q;
				if (error) throw new Error(error.message);
				return data;
			}
			const query = (dari && sampai) ? `?dari=${dari}&sampai=${sampai}` : '';
			return (await callPhp('hari-kegiatan.php', { query })).data;
		},
		async addHariKegiatan(data) {
			if (isOnline) {
				const { error } = await sb.from('hari_kegiatan').upsert(data, { onConflict: 'tanggal' });
				if (error) throw new Error(error.message);
				return;
			}
			return callPhp('hari-kegiatan.php', { method: 'POST', body: data });
		},
		async deleteHariKegiatan(id) {
			if (isOnline) {
				const { error } = await sb.from('hari_kegiatan').delete().eq('id', id);
				if (error) throw new Error(error.message);
				return;
			}
			return callPhp('hari-kegiatan.php', { method: 'DELETE', query: `?id=${id}` });
		},

		// ---- AUTH ADMIN ----
		async loginAdmin(username, password) {
			if (isOnline) {
				const {
					data,
					error
				} = await sb.rpc('login_admin', {
					p_username: username,
					p_password: password
				});
				if (error || !data || !data.length) throw new Error('Username atau password salah');
				return data[0];
			}
			return (await callPhp('auth.php', {
				method: 'POST',
				body: {
					action: 'login',
					username,
					password
				}
			})).user;
		},
		async loginAdminBarcode(barcode) {
			if (isOnline) {
				const {
					data,
					error
				} = await sb.rpc('login_admin_barcode', {
					p_barcode: barcode
				});
				if (error || !data || !data.length) throw new Error('Barcode tidak terdaftar sebagai admin');
				return data[0];
			}
			return (await callPhp('auth.php', {
				method: 'POST',
				body: {
					action: 'login_barcode',
					barcode
				}
			})).user;
		},
		async resetDatabase() {
			if (isOnline) {
				const {
					error: e1
				} = await sb.from('presensi').delete().neq('id', 0);
				const {
					error: e2
				} = await sb.from('izin').delete().neq('id', 0);
				const {
					error: e3
				} = await sb.from('guru_jadwal').delete().neq('id', 0);
				const {
					error: e4
				} = await sb.from('guru').delete().neq('id', 0);
				const err = e1 || e2 || e3 || e4;
				if (err) throw new Error(err.message);
				return;
			}
			return callPhp('reset-database.php', {
				method: 'POST',
				body: {
					konfirmasi: 'HAPUS SEMUA DATA'
				}
			});
		},
		async resetDataPresensi() {
			if (isOnline) {
				const { data, error } = await sb.from('presensi').delete().neq('id', 0).select();
				if (error) throw new Error(error.message);
				if (!data || !data.length) throw new Error('Tidak ada data presensi yang terhapus. Kemungkinan diblokir oleh aturan akses database (RLS).');
				return;
			}
			return callPhp('reset-database.php', { method: 'POST', body: { target: 'presensi' } });
		},
		async resetDataIzin() {
			if (isOnline) {
				const { error } = await sb.from('izin').delete().neq('id', 0);
				if (error) throw new Error(error.message);
				return;
			}
			return callPhp('reset-database.php', { method: 'POST', body: { target: 'izin' } });
		},
		async resetDataLibur() {
			if (isOnline) {
				const { error } = await sb.from('hari_libur').delete().neq('id', 0);
				if (error) throw new Error(error.message);
				return;
			}
			return callPhp('reset-database.php', { method: 'POST', body: { target: 'libur' } });
		},
		async resetDataKegiatan() {
			if (isOnline) {
				const { error } = await sb.from('hari_kegiatan').delete().neq('id', 0);
				if (error) throw new Error(error.message);
				return;
			}
			return callPhp('reset-database.php', { method: 'POST', body: { target: 'kegiatan' } });
		},
		async resetDataGuru() {
			if (isOnline) {
				const { error: e1 } = await sb.from('guru_jadwal').delete().neq('id', 0);
				const { error: e2 } = await sb.from('guru').delete().neq('id', 0);
				const err = e1 || e2;
				if (err) throw new Error(err.message);
				return;
			}
			return callPhp('reset-database.php', { method: 'POST', body: { target: 'guru' } });
		},
		async resetDataSemua() {
			if (isOnline) {
				const { error: e1 } = await sb.from('izin').delete().neq('id', 0);
				const { error: e2 } = await sb.from('hari_libur').delete().neq('id', 0);
				const { error: e3 } = await sb.from('hari_kegiatan').delete().neq('id', 0);
				const { error: e4 } = await sb.from('presensi').delete().neq('id', 0);
				const { error: e5 } = await sb.from('guru_jadwal').delete().neq('id', 0);
				const { error: e6 } = await sb.from('guru').delete().neq('id', 0);
				const err = e1 || e2 || e3 || e4 || e5 || e6;
				if (err) throw new Error(err.message);
				return;
			}
			return callPhp('reset-database.php', { method: 'POST', body: { target: 'semua' } });
		},

		async kirimSinyalSuara(jenis) {
			const dikirimOleh = AUTH.current()?.nama || AUTH.current()?.username || '';
			if (isOnline) {
				await sb.from('sinyal_suara').delete().neq('id', 0); // bersihkan sinyal lama, cuma simpan yang terbaru
				const { error } = await sb.from('sinyal_suara').insert({ jenis, dikirim_oleh: dikirimOleh });
				if (error) throw new Error(error.message);
				return;
			}
			return callPhp('sinyal-suara.php', { method: 'POST', body: { jenis, dikirim_oleh: dikirimOleh } });
		},
		async ambilSinyalTerbaru() {
			if (isOnline) {
				const { data } = await sb.from('sinyal_suara').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
				return data || null;
			}
			const res = await callPhp('sinyal-suara.php');
			return res.data;
		},

		// ---- SCAN SISWA (kiosk) ----
		async scanSiswa(barcode) {
			if (isOnline) return scanSiswaOnline(barcode);
			return callPhp('presensi-siswa.php', { method: 'POST', body: { barcode } });
		},
		async riwayatSiswaHariIni(tanggal, limit = 5) {
			if (isOnline) {
				const { data } = await sb.from('presensi_siswa')
					.select('*, siswa(nama, kelas(nama_kelas))').eq('tanggal', tanggal)
					.order('created_at', { ascending: false }).limit(limit);
				return (data || []).map(r => ({ ...r, nama_siswa: r.siswa?.nama, nama_kelas: r.siswa?.kelas?.nama_kelas || '', }));
			}
			const res = await callPhp('presensi-siswa.php', { query: `?dari=${tanggal}&sampai=${tanggal}&limit=${limit}` });
			return res.data;
		},

		// ---- KELAS ----
		async listKelas() {
			if (isOnline) {
				const { data, error } = await sb.from('kelas').select('*, guru(nama)').order('nama_kelas');
				if (error) throw new Error(error.message);
				return (data || []).map(k => ({ ...k, nama_wali_kelas: k.guru?.nama || null }));
			}
			return (await callPhp('kelas.php')).data;
		},
		async addKelas(data) {
			if (isOnline) {
				const { error } = await sb.from('kelas').insert({ nama_kelas: data.nama_kelas, wali_kelas_id: data.wali_kelas_id || null });
				if (error) throw new Error(error.message);
				return;
			}
			return callPhp('kelas.php', { method: 'POST', body: data });
		},
		async updateKelas(data) {
			if (isOnline) {
				const { error } = await sb.from('kelas').update({ nama_kelas: data.nama_kelas, wali_kelas_id: data.wali_kelas_id || null, aktif: data.aktif }).eq('id', data.id);
				if (error) throw new Error(error.message);
				return;
			}
			return callPhp('kelas.php', { method: 'PUT', body: data });
		},
		async deleteKelas(id) {
			if (isOnline) {
				const { error } = await sb.from('kelas').delete().eq('id', id);
				if (error) throw new Error(error.message);
				return;
			}
			return callPhp('kelas.php', { method: 'DELETE', query: `?id=${id}` });
		},

		// ---- JADWAL KELAS ----
		async listJadwalKelas(kelasId) {
			if (isOnline) {
				const { data, error } = await sb.from('jadwal_kelas').select('*').eq('kelas_id', kelasId);
				if (error) throw new Error(error.message);
				return data;
			}
			return (await callPhp('jadwal-kelas.php', { query: `?kelas_id=${kelasId}` })).data;
		},
		async simpanJadwalKelas(kelasId, jadwal) {
			if (isOnline) {
				await sb.from('jadwal_kelas').delete().eq('kelas_id', kelasId);
				if (jadwal.length) {
					const rows = jadwal.map(j => ({ ...j, kelas_id: kelasId }));
					const { error } = await sb.from('jadwal_kelas').insert(rows);
					if (error) throw new Error(error.message);
				}
				return;
			}
			return callPhp('jadwal-kelas.php', { method: 'POST', body: { kelas_id: kelasId, jadwal } });
		},

		// ---- SISWA ----
		// async listSiswa() {
		// 	if (isOnline) {
		// 		const { data, error } = await sb.from('siswa').select('*, kelas(nama_kelas)').eq('status_siswa', 'aktif').order('nama');
		// 		if (error) throw new Error(error.message);
		// 		return (data || []).map(s => ({ ...s, nama_kelas: s.kelas?.nama_kelas || '-' }));
		// 	}
		// 	return (await callPhp('siswa.php')).data;
		// },
		async listSiswa(status = 'aktif', tahun = '') {
			if (isOnline) {
				let q = sb.from('siswa').select('*, kelas(nama_kelas)').order('nama');
				q = status === 'semua' ? q : q.eq('status_siswa', status);
				if (tahun) q = q.eq('tahun_status', Number(tahun));
				const { data, error } = await q;
				if (error) throw new Error(error.message);
				return (data || []).map(s => ({ ...s, nama_kelas: s.kelas?.nama_kelas || '-' }));
			}
			const q = new URLSearchParams({ status });
			if (tahun) q.set('tahun', tahun);
			return (await callPhp('siswa.php', { query: `?${q.toString()}` })).data;
		},
		async addSiswa(data) {
			if (isOnline) {
				const barcode_id = generateBarcodeSiswa();
				const { error } = await sb.from('siswa').insert({ nama: data.nama, nis: data.nis || null, kelas_id: data.kelas_id, barcode_id });
				if (error) throw new Error(error.message);
				return { barcode_id };
			}
			return callPhp('siswa.php', { method: 'POST', body: data });
		},
		async updateSiswa(data) {
			if (isOnline) {
				const { error } = await sb.from('siswa').update({ nama: data.nama, nis: data.nis || null, kelas_id: data.kelas_id, aktif: data.aktif }).eq('id', data.id);
				if (error) throw new Error(error.message);
				return;
			}
			return callPhp('siswa.php', { method: 'PUT', body: data });
		},
		async deleteSiswa(id) {
			if (isOnline) {
				const { error } = await sb.from('siswa').delete().eq('id', id);
				if (error) throw new Error(error.message);
				return;
			}
			return callPhp('siswa.php', { method: 'DELETE', query: `?id=${id}` });
		},
		// async importSiswa(rows) {
		// 	// rows: [{ nama, nis, kelas }] -- kelas dicocokkan by nama_kelas, dibuat otomatis kalau belum ada
		// 	if (!isOnline) return callPhp('siswa-import.php', { method: 'POST', body: { rows } });

		// 	let berhasil = 0;
		// 	const gagal = [];

		// 	for (let i = 0; i < rows.length; i++) {
		// 		const r = rows[i];
		// 		const barisKe = i + 2;
		// 		const nama = (r.nama || '').trim();
		// 		const namaKelas = (r.kelas || '').trim();
		// 		if (!nama || !namaKelas) { gagal.push(`Baris ${barisKe}: nama/kelas kosong`); continue; }

		// 		try {
		// 			let { data: kelas } = await sb.from('kelas').select('id').eq('nama_kelas', namaKelas).maybeSingle();
		// 			let kelasId = kelas?.id;
		// 			if (!kelasId) {
		// 				const { data: kelasBaru, error: errKelas } = await sb.from('kelas').insert({ nama_kelas: namaKelas }).select().single();
		// 				if (errKelas) throw new Error(errKelas.message);
		// 				kelasId = kelasBaru.id;
		// 			}

		// 			const barcode_id = generateBarcodeSiswa();
		// 			const { error: errSiswa } = await sb.from('siswa').insert({ nama, nis: (r.nis || '').trim() || null, kelas_id: kelasId, barcode_id });
		// 			if (errSiswa) throw new Error(errSiswa.message);

		// 			berhasil++;
		// 		} catch (e) {
		// 			gagal.push(`Baris ${barisKe} (${nama}): ${e.message}`);
		// 		}
		// 	}
		// 	return { berhasil, gagal };
		// },

		async importSiswa(rows) {
			// rows: [{ nama, nis, kelas, kode, tahun_masuk }]
			if (!isOnline) return callPhp('siswa-import.php', { method: 'POST', body: { rows } });

			let berhasil = 0;
			const gagal = [];

			for (let i = 0; i < rows.length; i++) {
				const r = rows[i];
				const barisKe = i + 2;
				const nama = (r.nama || '').trim();
				const namaKelas = (r.kelas || '').trim();
				if (!nama || !namaKelas) { gagal.push(`Baris ${barisKe}: nama/kelas kosong`); continue; }

				const nis = (r.nis || '').trim() || null;
				const kode = (r.kode || '').trim();
				const tahunMasuk = r.tahun_masuk && !isNaN(Number(r.tahun_masuk)) ? Number(r.tahun_masuk) : null;

				try {
					let { data: kelas } = await sb.from('kelas').select('id').eq('nama_kelas', namaKelas).maybeSingle();
					let kelasId = kelas?.id;
					if (!kelasId) {
						const { data: kelasBaru, error: errKelas } = await sb.from('kelas').insert({ nama_kelas: namaKelas }).select().single();
						if (errKelas) throw new Error(errKelas.message);
						kelasId = kelasBaru.id;
					}

					let siswaId = null;
					if (kode) {
						const { data: existing } = await sb.from('siswa').select('id').eq('barcode_id', kode).maybeSingle();
						if (existing) siswaId = existing.id;
					}

					if (siswaId) {
						// Siswa sudah ada -> update data, barcode TIDAK berubah
						const updatePayload = { nama, nis, kelas_id: kelasId };
						if (tahunMasuk) updatePayload.tahun_masuk = tahunMasuk;
						const { error: errUpdate } = await sb.from('siswa').update(updatePayload).eq('id', siswaId);
						if (errUpdate) throw new Error(errUpdate.message);
					} else {
						// Siswa baru -> barcode dari kolom kode kalau diisi, atau dibuat otomatis
						const barcode_id = kode || generateBarcodeSiswa();
						const { error: errSiswa } = await sb.from('siswa').insert({
							nama, nis, kelas_id: kelasId, barcode_id, tahun_masuk: tahunMasuk,
						});
						if (errSiswa) throw new Error(errSiswa.message);
					}

					berhasil++;
				} catch (e) {
					gagal.push(`Baris ${barisKe} (${nama}): ${e.message}`);
				}
			}
			return { berhasil, gagal };
		},

		// ---- IZIN SISWA ----
		async listIzinSiswa() {
			if (isOnline) {
				const { data, error } = await sb.from('izin_siswa').select('*, siswa(nama)').order('tanggal', { ascending: false });
				if (error) throw new Error(error.message);
				return (data || []).map(r => ({ ...r, nama_siswa: r.siswa?.nama }));
			}
			return (await callPhp('izin-siswa.php')).data;
		},

		async addIzinSiswa(data) {
			if (isOnline) {
				const { error } = await sb.from('izin_siswa').insert({
					siswa_id: data.siswa_id, tanggal: data.tanggal, jenis: data.jenis,
					keterangan: data.keterangan || null, dicatat_oleh: data.dicatat_oleh || null,
				});
				if (error) throw new Error(error.message);
				return;
			}
			return callPhp('izin-siswa.php', { method: 'POST', body: data });
		},

		async deleteIzinSiswa(id) {
			if (isOnline) {
				const { error } = await sb.from('izin_siswa').delete().eq('id', id);
				if (error) throw new Error(error.message);
				return;
			}
			return callPhp('izin-siswa.php', { method: 'DELETE', query: `?id=${id}` });
		},

		async laporanSiswaRentang(dari, sampai, kelasId = '') {
			if (isOnline) return laporanSiswaOnline(dari, sampai, kelasId ? Number(kelasId) : null);
			const q = new URLSearchParams({ dari, sampai });
			if (kelasId) q.set('kelas_id', kelasId);
			const res = await callPhp('laporan-siswa.php', { query: `?${q.toString()}` });
			return res.data;
		},

		async prosesKenaikanKelas(daftarPerubahan) {
			if (isOnline) return prosesKenaikanKelasOnline(daftarPerubahan);
			return callPhp('kenaikan-kelas.php', { method: 'POST', body: { perubahan: daftarPerubahan } });
		},
	};
})();