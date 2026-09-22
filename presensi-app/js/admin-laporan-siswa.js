AUTH.requireRole(['admin']);
const _namaAdminLapSiswa = AUTH.current().nama || AUTH.current().username;
document.getElementById('nama-admin').textContent = _namaAdminLapSiswa;
document.getElementById('avatar-admin').textContent = _namaAdminLapSiswa.charAt(0).toUpperCase();

let dataLaporanSiswaTerakhir = [];

async function isiDropdownKelasFilter() {
  const kelasList = await DB.listKelas();
  const select = document.getElementById('filter-kelas-siswa');
  kelasList.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k.id;
    opt.textContent = k.nama_kelas;
    select.appendChild(opt);
  });
}

async function muatLaporanSiswa() {
  const dari = document.getElementById('filter-dari-siswa').value;
  const sampai = document.getElementById('filter-sampai-siswa').value;
  let kelasId = document.getElementById('filter-kelas-siswa').value;
  if (kelasId && !/^\d+$/.test(kelasId)) kelasId = '';

  document.getElementById('tbody-laporan-siswa').innerHTML = '<tr><td colspan="6">Memuat…</td></tr>';

  try {
    const rows = await DB.laporanSiswaRentang(dari, sampai, kelasId);
    dataLaporanSiswaTerakhir = rows;

    document.getElementById('tbody-laporan-siswa').innerHTML = rows.map(r => `
      <tr>
        <td>${r.nama}</td>
        <td>${r.kelas}</td>
        <td>${r.hadir}</td>
        <td>${r.telat}</td>
        <td>${r.alpha}</td>
        <td>${r.izin}</td>
      </tr>`).join('') || '<tr><td colspan="6">Tidak ada data untuk filter ini</td></tr>';
  } catch (err) {
    document.getElementById('tbody-laporan-siswa').innerHTML = `<tr><td colspan="6">${err.message}</td></tr>`;
    toast(err.message, 'error');
  }
}

function exportLaporanSiswaExcel() {
  if (!dataLaporanSiswaTerakhir.length) { toast('Tidak ada data untuk di-export. Klik "Tampilkan" dulu.', 'warn'); return; }

  const sheetData = dataLaporanSiswaTerakhir.map(r => ({
    'Nama Siswa': r.nama, 'Kelas': r.kelas, 'Hadir': r.hadir, 'Telat': r.telat, 'Alpha': r.alpha, 'Izin/Sakit': r.izin,
  }));
  const ws = XLSX.utils.json_to_sheet(sheetData);
  ws['!cols'] = [{wch:24},{wch:10},{wch:8},{wch:8},{wch:8},{wch:10}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Siswa');

  const dari = document.getElementById('filter-dari-siswa').value;
  const sampai = document.getElementById('filter-sampai-siswa').value;
  XLSX.writeFile(wb, `laporan-siswa_${dari}_${sampai}.xlsx`);
  toast('File Excel berhasil diunduh.');
}

document.getElementById('btn-tampilkan-siswa').addEventListener('click', muatLaporanSiswa);
document.getElementById('btn-export-siswa').addEventListener('click', exportLaporanSiswaExcel);

(async () => {
  const dari = tanggalLokal(new Date(Date.now() - 29*86400000)); // default 30 hari terakhir
  const sampai = tanggalLokal(new Date());
  document.getElementById('filter-dari-siswa').value = dari;
  document.getElementById('filter-sampai-siswa').value = sampai;

  await isiDropdownKelasFilter();
  await muatLaporanSiswa();
})();