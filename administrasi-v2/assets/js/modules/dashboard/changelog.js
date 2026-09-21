// ==========================================
// DATA CHANGELOG (RIWAYAT PEMBARUAN)
// new: Fitur Baru, fix: Bug Fix, improve: Peningkatan, release: Peluncuran 
// ==========================================
const changelogData = [
  {
		version: "2.3.0",	date: "17 September 2026",
		items:
    [
      { type: "new", text: "Manajemen Honorarium Ekstra & BBQS" },
      { type: "new", text: "Rekapitulasi Siswa Bulanan" },
      { type: "improve", text: "Unduh Excel Honorarium Guru" },
      { type: "fix", text: "Modal Changelog" },
      { type: "fix", text: "Sub Tab HR Guru" },
		]
	},
  {
		version: "2.2.1",	date: "08 September 2026",
		items:
    [
      { type: "improve", text: "Sidebar accordion" },
      { type: "fix", text: "Sidebar accordion admin view" },
		]
	},
  {
		version: "2.2.0",	date: "05 September 2026",
		items:
    [
      { type: "new", text: "Manajemen Honorarium Guru" },
      { type: "new", text: "Master Data Guru" },
      { type: "improve", text: "Laporan Bulanan Operasional dan Non Operasional" },
      { type: "fix", text: "Tagihan Siswa Berdasarkan Jenis Kelamin" },
		]
	},
  {
		version: "2.1.0",	date: "01 September 2026",
		items:
    [
      { type: "new", text: "Pemasukan Atribut Siswa" },
      { type: "new", text: "Master Atribut Siswa" },
      { type: "new", text: "Laporan Operasional dan Non Operasional" },
      { type: "new", text: "Pengaturan dan Backup Database" },
      { type: "improve", text: "Pemasukan SPP Siswa" },
      { type: "improve", text: "Manajemen User" },
		]
	},
  {
		version: "2.0.0",	date: "23 Agustus 2026",
		items:
    [
      { type: "release", text: "Sistem Administrasi Madrasah Aliyah Bi'rul Ulum (Migration to Supabase)" },
      { type: "improve", text: "Render Script JS" },
		]
	},
  {
		version: "1.3.1",	date: "20 Mei 2026",
		items:
    [
      { type: "improve", text: "Assets Dom2Image dan Phosphor JS" },
      { type: "improve", text: "Download Image Rekap" },
		]
	},
  {
		version: "1.3.0",	date: "19 Mei 2026",
		items:
    [
      { type: "new", text: "Auto Logout Admin" },
      { type: "improve", text: "UI Chart dan Pagination" },
		]
	},
  {
		version: "1.2.3",	date: "16 Mei 2026",
		items:
    [
      { type: "improve", text: "Assets Img Kop Madrasah" },
		]
	},
  {
		version: "1.2.2",	date: "15 Mei 2026",
		items:
    [
      { type: "new", text: "Admin View Siswa" },
      { type: "improve", text: "Assets Img Offline" },
      { type: "improve", text: "Assets Icons Phosphor Offline" },
      { type: "improve", text: "Assets Chart dan Tailwind Offline" },
      { type: "improve", text: "Meta Tags" },
      { type: "fix", text: "View Mobile First" },
      { type: "fix", text: "Cleaning Code" },
		]
	},
  {
		version: "1.2.1",	date: "09 Mei 2026",
		items:
    [
      { type: "new", text: "Edit dan Delete Master Tarif Siswa" },
      { type: "improve", text: "Restore Master Tarif Siswa" },
		]
	},
  {
		version: "1.2.0",	date: "07 Mei 2026",
		items:
    [
      { type: "new", text: "Master Tarif Siswa" },
      { type: "new", text: "Cetak Laporan Siswa" },
      { type: "improve", text: "Data Siswa" },
		]
	},
  {
		version: "1.0.0",	date: "04 Mei 2026",
		items:
    [
      { type: "release", text: "Sistem Administrasi Madrasah Aliyah Bi'rul Ulum (Google Apps Script)" },
		]
	}
];

// ==========================================
// FUNGSI RENDER & KONTROL MODAL CHANGELOG
// ==========================================
function renderChangelog() {
	const container = document.getElementById('changelog-container');
	const btnBadge = document.getElementById('btn-changelog');
	if (!container) return;

	let html = '';

	// Update tulisan di tombol atas agar otomatis mengikuti versi terbaru di Array!
	if (changelogData.length > 0) {
      const versiTerbaru = changelogData[0].version;
      
      // 1. Update tombol di Header
      if (btnBadge) {
        btnBadge.innerHTML = `<i class="ph ph-sparkle-fill text-indigo-500"></i> v${versiTerbaru}`;
      }
      
      // 2. Update teks di Footer (Login/Dashboard)
      const semuaTeksVersi = document.querySelectorAll('.versi-footer');
      semuaTeksVersi.forEach(elemen => {
        elemen.innerText = `v${versiTerbaru}`;
      });
    }

	changelogData.forEach((log, index) => {
		// Logika warna: Versi terbaru (index 0) berwarna Indigo, versi lama berwarna Abu-abu
		const isLatest = index === 0;
		const colorTema = isLatest ? 'indigo' : 'gray';
		const bgDot = isLatest ? 'bg-indigo-500' : 'bg-gray-300';
		const borderLine = isLatest ? 'border-indigo-200' : 'border-gray-200';

		// Buat daftar (List) item-item pembaruan
		let itemsHtml = '';
		log.items.forEach(item => {
			let icon, label;
			if (item.type === 'new') {
				icon = '<i class="ph-fill ph-star text-yellow-500 mt-0.5 text-xs"></i>';
				label = '<b>Fitur Baru:</b>';
			} else if (item.type === 'improve') {
				icon = '<i class="ph-fill ph-lightning text-blue-500 mt-0.5 text-xs"></i>';
				label = '<b>Peningkatan:</b>';
			} else if (item.type === 'fix') {
				icon = '<i class="ph-fill ph-wrench text-red-500 mt-0.5 text-xs"></i>';
				label = '<b>Bug Fix:</b>';
			} else if (item.type === 'release') {
				icon = '<i class="ph-fill ph-check text-green-500 mt-0.5 text-xs"></i>';
				label = '<b>Launching:</b>';
			}

			itemsHtml += `
                <li class="flex items-start gap-2">
                    ${icon}
                    <span>${label} ${item.text}</span>
                </li>
            `;
		});

		// Gabungkan ke template blok versi
		html += `
            <div class="relative pl-4 border-l-2 ${index === changelogData.length - 1 ? 'border-transparent' : borderLine}">
                <div class="absolute -left-1.5 top-1 w-3 h-3 ${bgDot} rounded-full border-2 border-white"></div>
                <div class="flex items-baseline gap-2 mb-2">
                    <span class="font-bold text-${colorTema}-${isLatest ? '800' : '700'} text-md">Versi ${log.version}</span>
                    <span class="text-xs text-gray-${isLatest ? '500' : '400'} font-medium">${log.date}</span>
                </div>
                <ul class="space-y-2 text-sm text-gray-600">
                    ${itemsHtml}
                </ul>
            </div>
        `;
	});

	container.innerHTML = html;
}

// ==========================================
// FUNGSI SETUP EVENT CHANGELOG
// ==========================================
function setupChangelogEvents() {
  // 1. Render data array ke dalam HTML dan update versi tombol
  if (typeof renderChangelog === 'function') {
    renderChangelog();
  }

  const modal = document.getElementById('modal-changelog');
  if (!modal) return;

  // 2. Event Listener Buka Modal
  const btnChangelog = document.getElementById('btn-changelog');
  if (btnChangelog) {
    btnChangelog.replaceWith(btnChangelog.cloneNode(true));
    document.getElementById('btn-changelog').addEventListener('click', bukaModalChangelog);
  }

  // 3. Event Listener Tutup Modal (Overlay, tombol X, dan tombol Tutup bawah)
  const listBtnTutup = modal.querySelectorAll('.btn-tutup-changelog');
  listBtnTutup.forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
  });
  modal.querySelectorAll('.btn-tutup-changelog').forEach(btn => {
    btn.addEventListener('click', tutupModalChangelog);
  });

  // 4. Tutup dengan tombol keyboard ESC
  document.removeEventListener('keydown', handleEscChangelog);
  document.addEventListener('keydown', handleEscChangelog);
}

// Fungsi Kontrol Modal
function bukaModalChangelog() {
  const modal = document.getElementById('modal-changelog');
  if (modal) {
    modal.classList.remove('hidden');
    setTimeout(() => {
      modal.firstElementChild?.classList.add('opacity-100');
    }, 10);
  }
}

function tutupModalChangelog() {
  const modal = document.getElementById('modal-changelog');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function handleEscChangelog(e) {
  if (e.key === 'Escape') {
    const modal = document.getElementById('modal-changelog');
    if (modal && !modal.classList.contains('hidden')) {
      tutupModalChangelog();
    }
  }
}

// Tetap diekspos ke window sebagai fallback pengaman
window.tutupModalChangelog = tutupModalChangelog;
window.bukaModalChangelog = bukaModalChangelog;