async function cekKapasitasDatabase() {
	try {
		// 1. Panggil fungsi jembatan (RPC) di Supabase
		const {
			data: ukuranBytes,
			error
		} = await supabaseClient.rpc('get_db_size');

		if (error) throw error;

		// 2. Konversi kalkulasi matematika
		// 1 MB = 1024 * 1024 Bytes
		const terpakaiMB = ukuranBytes / (1024 * 1024);
		const batasMaksimalMB = 500; // Batas gratis Supabase

		let persentase = (terpakaiMB / batasMaksimalMB) * 100;

		// Memastikan bar progres UI tetap logis (minimal 1% agar bar terlihat)
		if (persentase > 0 && persentase < 1) persentase = 1;
		if (persentase > 100) persentase = 100;

		// 3. --- UPDATE UI HTML ---
		// Mencari elemen HTML berdasarkan strukturnya
		const barContainer = document.getElementById('progress-bar-db');
		const textDetail = document.getElementById('teks-detail-db');
		const statusBadge = document.getElementById('badge-status-db');

		const sisaMB = (batasMaksimalMB - terpakaiMB).toFixed(2);

		if (barContainer) {
			barContainer.style.width = `${persentase.toFixed(1)}%`;

			// Animasi Perubahan Warna Bar (Hijau -> Kuning -> Merah)
			if (persentase > 90) {
				barContainer.className = "bg-red-500 h-full transition-all duration-1000";
			} else if (persentase > 75) {
				barContainer.className = "bg-amber-500 h-full transition-all duration-1000";
			} else {
				barContainer.className = "bg-emerald-500 h-full transition-all duration-1000";
			}
		}

		if (textDetail) {
			textDetail.innerHTML = `<span>Terpakai: <span class="font-bold text-gray-700">${terpakaiMB.toFixed(2)} MB (${persentase.toFixed(2)}%)</span></span><span>Sisa: ${sisaMB} MB</span>`;
		}

		if (statusBadge) {
			if (persentase > 90) {
				statusBadge.className = "text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-1 rounded-md";
				statusBadge.innerText = "Status: Kritis";

				// Buka Kunci Tombol Hard Reset
				const btnReset = document.getElementById('btn-hard-reset');
				if (btnReset) {
					btnReset.disabled = false;
					btnReset.className = "w-full bg-red-600 text-white font-medium py-2.5 rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors shadow-sm";
					btnReset.innerHTML = `<i class="ph ph-warning-circle mr-2 text-lg"></i> Eksekusi Hard Reset`;
				}
			} else {
				statusBadge.className = "text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md";
				statusBadge.innerText = "Status: Aman";
			}
		}

	} catch (error) {
		console.error("Gagal membaca ukuran database:", error);
		const textDetail = document.querySelector('.flex.justify-between.text-xs.text-gray-500');
		if (textDetail) textDetail.innerHTML = `<span class="text-red-500 font-medium">Gagal membaca ukuran server.</span>`;
	}
}

// ==========================================
// FITUR: BACKUP DATABASE (.SQL)
// ==========================================
async function backupDatabaseSQL() {
	// Sesuaikan daftar ini dengan seluruh nama tabel yang ada di Supabase Anda
	const semuaTabel = ['admin_users', 'bantuan', 'data_siswa', 'infaq', 'master_atribut', 'master_data', 'master_tarif', 'pemasukan', 'pemasukan_atribut', 'pengeluaran', 'pengeluaran_nonops'];

	// Tampilan Loading
	tampilkanModalNotif('Mencadangkan Data', 'Sedang merakit struktur SQL seluruh tabel. Mohon tunggu...', 'loading');

	try {
		let sqlContent = `-- ==========================================\n`;
		sqlContent += `-- BACKUP DATABASE MA BI'RUL ULUM\n`;
		sqlContent += `-- Tanggal Backup : ${new Date().toLocaleString('id-ID')}\n`;
		sqlContent += `-- ==========================================\n\n`;

		for (let tabel of semuaTabel) {
			// Tarik seluruh data dari tabel
			const {
				data,
				error
			} = await supabaseClient.from(tabel).select('*');
			if (error) throw error;

			if (data && data.length > 0) {
				sqlContent += `-- ------------------------------------------\n`;
				sqlContent += `-- DATA TABEL: ${tabel}\n`;
				sqlContent += `-- ------------------------------------------\n`;

				data.forEach(baris => {
					const kolom = Object.keys(baris).join(', ');

					const nilai = Object.values(baris).map(val => {
						if (val === null) return 'NULL';
						if (typeof val === 'string') {
							// Escape tanda kutip tunggal agar SQL tidak error (misal: Bi'rul -> Bi''rul)
							return `'${val.replace(/'/g, "''")}'`;
						}
						if (typeof val === 'object') {
							// Tangani tipe data array/JSON
							return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
						}
						return val;
					}).join(', ');

					sqlContent += `INSERT INTO ${tabel} (${kolom}) VALUES (${nilai});\n`;
				});
				sqlContent += `\n\n`;
			}
		}

		// --- PROSES DOWNLOAD FILE .SQL ---
		// Bungkus teks SQL menjadi sebuah file Blob
		const blob = new Blob([sqlContent], {
			type: "text/plain"
		});
		const url = URL.createObjectURL(blob);

		// Buat elemen link tersembunyi untuk memicu unduhan
		const link = document.createElement("a");
		link.href = url;

		// Format nama file: Backup_SQL_2026-08-25.sql
		const tglSekarang = new Date().toISOString().split('T')[0];
		link.download = `Backup_SQL_BirulUlum_${tglSekarang}.sql`;

		document.body.appendChild(link);
		link.click();

		// Bersihkan link
		document.body.removeChild(link);
		URL.revokeObjectURL(url);

		tampilkanModalNotif('Berhasil!', 'File SQL berhasil diunduh. Simpan file ini di tempat yang aman.', 'success');
		setTimeout(() => tutupModalNotif(), 3000);

	} catch (error) {
		console.error("Gagal melakukan backup SQL:", error);
		tampilkanModalNotif('Gagal', 'Terjadi kesalahan saat merakit file Backup SQL.', 'error');
	}
}

function setupDatabaseEvents() {
  const backupSql = document.getElementById('backup-sql');

  if (backupSql) backupSql.addEventListener('click', backupDatabaseSQL);
}