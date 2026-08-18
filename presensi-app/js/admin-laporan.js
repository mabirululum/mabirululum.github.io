AUTH.requireRole(['admin']);
const _namaAdmin3 = AUTH.current().nama || AUTH.current().username;
document.getElementById('nama-admin').textContent = _namaAdmin3;
document.getElementById('avatar-admin').textContent = _namaAdmin3.charAt(0).toUpperCase();

const TIPE_CLASS = {
	hadir: 'badge-hadir',
	telat: 'badge-telat',
	pulang: 'badge-pulang',
	warning: 'badge-warning',
	alpha: 'badge-alpha',
	sakit: 'badge-sakit',
	izin: 'badge-izin',
	kegiatan: 'badge-kegiatan',
  libur:'badge-libur',
};

function badge(label, tipe) {
	return `<span class="badge ${TIPE_CLASS[tipe] || ''}">${label}</span>`;
}

let dataTerakhir = [];

function tanggalLokal(dateObj = new Date()) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const t = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${t}`;
}

async function isiDropdownGuru() {
  const guruList = await DB.listGuru();
  const select = document.getElementById('filter-guru');
  guruList.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = g.nama;
    select.appendChild(opt);
  });
}

async function muat() {
  const dari = document.getElementById('filter-dari').value;
  const sampai = document.getElementById('filter-sampai').value;
  if (!dari || !sampai) {
    toast('Pilih Dari Tanggal dan Sampai Tanggal terlebih dahulu.', 'warn');
    return;
  }
  let guruId = document.getElementById('filter-guru').value;
  const status = document.getElementById('filter-status').value;
  if (guruId && !/^\d+$/.test(guruId)) guruId = '';

  document.getElementById('tbody-laporan').innerHTML = '<tr><td colspan="6">Memuat…</td></tr>';

  try {
    const rows = await DB.laporanRentang(dari, sampai, guruId, status);
    dataTerakhir = rows;

    document.getElementById('stat-total').textContent = rows.length;
    document.getElementById('stat-telat').textContent = rows.filter(r => r.ket_masuk_tipe === 'telat').length;
    document.getElementById('stat-pulang-awal').textContent = rows.filter(r => r.ket_pulang_tipe === 'pulang').length;
    document.getElementById('stat-alpha').textContent = rows.filter(r => r.ket_masuk_tipe === 'alpha').length;
    document.getElementById('stat-izin').textContent = rows.filter(r => ['sakit','izin','kegiatan'].includes(r.ket_masuk_tipe)).length;

    document.getElementById('tbody-laporan').innerHTML = rows.map(r => `
      <tr>
        <td>${formatTanggalPanjang(r.tanggal)}</td>
        <td>${r.nama_guru}</td>
        <td>${r.jam_scan_masuk || '-'}</td>
        <td>${badge(r.ket_masuk, r.ket_masuk_tipe)}</td>
        <td>${r.jam_scan_pulang || '-'}</td>
        <td>${badge(r.ket_pulang, r.ket_pulang_tipe)}</td>
      </tr>`).join('') || '<tr><td colspan="6">Tidak ada data untuk filter ini</td></tr>';
    
    document.getElementById('jumlah-baris-laporan').textContent = `(${rows.length} baris)`;
    if (rows.length > 20 && wrapTabel.style.display !== 'none') {
      toggleTabelLaporan();
    }
  } catch (err) {
    document.getElementById('tbody-laporan').innerHTML = `<tr><td colspan="6">${err.message}</td></tr>`;
    toast(err.message, 'error');
  }
}

function exportExcel() {
  if (!dataTerakhir.length) { toast('Tidak ada data untuk di-export. Klik "Tampilkan" dulu.', 'warn'); return; }

  const sheetData = dataTerakhir.map(r => ({
    'Tanggal': r.tanggal.split('-').reverse().join('/'),
    'Nama Guru': r.nama_guru,
    'Jam Masuk': r.jam_scan_masuk || '-',
    'Keterangan Masuk': r.ket_masuk,
    'Jam Pulang': r.jam_scan_pulang || '-',
    'Keterangan Pulang': r.ket_pulang,
  }));

  const ws = XLSX.utils.json_to_sheet(sheetData);
  ws['!cols'] = [{wch:12},{wch:22},{wch:10},{wch:20},{wch:10},{wch:20}];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Presensi');

  const dari = document.getElementById('filter-dari').value;
  const sampai = document.getElementById('filter-sampai').value;
  XLSX.writeFile(wb, `laporan-presensi_${dari}_${sampai}.xlsx`);
  toast('File Excel berhasil diunduh.');
}

document.getElementById('btn-tampilkan').addEventListener('click', muat);
document.getElementById('btn-export').addEventListener('click', exportExcel);

(async () => {
  const hariIni = tanggalLokal(new Date());
  document.getElementById('filter-dari').value = hariIni;
  document.getElementById('filter-sampai').value = hariIni;

  await isiDropdownGuru();
  await muat();
})();

const MENIT_PER_POTONGAN = 40;

function hitungRingkasan() {
  if (!dataTerakhir.length) {
    toast('Tidak ada data. Klik "Tampilkan" dulu sebelum lihat ringkasan.', 'warn');
    return;
  }

  const perGuru = {};
  dataTerakhir.forEach(r => {
    if (!perGuru[r.nama_guru]) {
      perGuru[r.nama_guru] = { totalMenitTelat: 0, totalMenitPulangAwal: 0, totalMenitIzin: 0, alpha: 0, sakit: 0 };
    }
    const g = perGuru[r.nama_guru];

    if (r.ket_masuk_tipe === 'telat') g.totalMenitTelat += Number(r.menit_telat || 0);
    else if (r.ket_masuk_tipe === 'alpha') g.alpha++;
    else if (r.ket_masuk_tipe === 'sakit') g.sakit++;

    // Izin dihitung independen dari ket_masuk_tipe -- bisa saja hari itu "telat"
    // TAPI tetap ada izin sebagian jam di jam lain hari yang sama
    g.totalMenitIzin += Number(r.menit_izin || 0);

    if (r.ket_pulang_tipe === 'pulang') g.totalMenitPulangAwal += Number(r.menit_pulang_awal || 0);
  });

  const daftar = Object.entries(perGuru)
    .map(([nama, g]) => ({
      nama,
      totalMenitTelat: g.totalMenitTelat,
      jumlahPotonganTelat: Math.floor(g.totalMenitTelat / MENIT_PER_POTONGAN),
      totalMenitPulangAwal: g.totalMenitPulangAwal,
      jumlahPotonganPulangAwal: Math.floor(g.totalMenitPulangAwal / MENIT_PER_POTONGAN),
      totalMenitIzin: g.totalMenitIzin,
      jumlahIzinJamPelajaran: Math.floor(g.totalMenitIzin / MENIT_PER_POTONGAN),
      alpha: g.alpha,
      sakit: g.sakit,
    }))
    .sort((a, b) => a.nama.localeCompare(b.nama));

  document.getElementById('tbody-ringkasan').innerHTML = daftar.map(g => `
    <tr>
      <td>${g.nama}</td>
      <td>${g.totalMenitTelat} menit</td>
      <td><b>${g.jumlahPotonganTelat}x</b></td>
      <td>${g.totalMenitPulangAwal} menit</td>
      <td><b>${g.jumlahPotonganPulangAwal}x</b></td>
      <td>${g.alpha}</td>
      <td><b>${g.jumlahIzinJamPelajaran}</b> <span style="color:var(--muted);font-size:11px;">(${g.totalMenitIzin} menit)</span></td>
      <td>${g.sakit}</td>
    </tr>`).join('');

  document.getElementById('card-ringkasan').style.display = 'block';
  document.getElementById('card-ringkasan').scrollIntoView({ behavior: 'smooth', block: 'start' });

  window._dataRingkasanTerakhir = daftar;
}

function exportRingkasanExcel() {
  const data = window._dataRingkasanTerakhir;
  if (!data || !data.length) { toast('Belum ada ringkasan untuk di-export.', 'warn'); return; }

  const sheetData = data.map(g => ({
    'Nama Guru': g.nama,
    'Total Menit Telat': g.totalMenitTelat,
    'Jumlah Potongan Telat': g.jumlahPotonganTelat,
    'Total Menit Pulang Awal': g.totalMenitPulangAwal,
    'Jumlah Potongan Pulang Awal': g.jumlahPotonganPulangAwal,
    'Alpha': g.alpha,
    'Izin (Jam Pelajaran)': g.jumlahIzinJamPelajaran,
    'Izin (Total Menit)': g.totalMenitIzin,
    'Sakit (Hari)': g.sakit,
  }));

  const ws = XLSX.utils.json_to_sheet(sheetData);
  ws['!cols'] = [{wch:24},{wch:16},{wch:14},{wch:20},{wch:16},{wch:8},{wch:18},{wch:16},{wch:10}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ringkasan');

  const dari = document.getElementById('filter-dari').value;
  const sampai = document.getElementById('filter-sampai').value;
  XLSX.writeFile(wb, `ringkasan-presensi_${dari}_${sampai}.xlsx`);
  toast('Ringkasan berhasil diunduh.');
}

document.getElementById('btn-ringkasan').addEventListener('click', hitungRingkasan);
document.getElementById('btn-export-ringkasan').addEventListener('click', exportRingkasanExcel);

const wrapTabel = document.getElementById('wrap-tabel-laporan');
const iconToggle = document.getElementById('icon-toggle-tabel');

function toggleTabelLaporan() {
  const tersembunyi = wrapTabel.style.display === 'none';
  wrapTabel.style.display = tersembunyi ? 'block' : 'none';
  iconToggle.className = tersembunyi ? 'bi bi-chevron-up' : 'bi bi-chevron-down';
}
document.getElementById('toggle-tabel-laporan').addEventListener('click', toggleTabelLaporan);