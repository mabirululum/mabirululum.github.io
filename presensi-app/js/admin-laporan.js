AUTH.requireRole(['admin']);
const _namaAdmin3 = AUTH.current().nama || AUTH.current().username;
document.getElementById('nama-admin').textContent = _namaAdmin3;
document.getElementById('avatar-admin').textContent = _namaAdmin3.charAt(0).toUpperCase();

const TIPE_CLASS = { hadir:'badge-hadir', telat:'badge-telat', pulang:'badge-pulang', warning:'badge-warning', alpha:'badge-alpha', sakit:'badge-sakit', izin:'badge-izin', kegiatan:'badge-kegiatan' };
function badge(label, tipe) { return `<span class="badge ${TIPE_CLASS[tipe] || ''}">${label}</span>`; }

let dataTerakhir = [];

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
        <td>${new Date(r.tanggal).toLocaleDateString('id-ID')}</td>
        <td>${r.nama_guru}</td>
        <td>${r.jam_scan_masuk || '-'}</td>
        <td>${badge(r.ket_masuk, r.ket_masuk_tipe)}</td>
        <td>${r.jam_scan_pulang || '-'}</td>
        <td>${badge(r.ket_pulang, r.ket_pulang_tipe)}</td>
      </tr>`).join('') || '<tr><td colspan="6">Tidak ada data untuk filter ini</td></tr>';
  } catch (err) {
    document.getElementById('tbody-laporan').innerHTML = `<tr><td colspan="6">${err.message}</td></tr>`;
    toast(err.message, 'error');
  }
}

function exportExcel() {
  if (!dataTerakhir.length) { toast('Tidak ada data untuk di-export. Klik "Tampilkan" dulu.', 'warn'); return; }

  const sheetData = dataTerakhir.map(r => ({
    'Tanggal': new Date(r.tanggal).toLocaleDateString('id-ID'),
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
  const skrg = new Date();
  const enamHariLalu = new Date(skrg); enamHariLalu.setDate(skrg.getDate() - 6);
  const dari = tanggalLokal().call(null) ?? ''; // lihat catatan di bawah
  document.getElementById('filter-dari').value = dari;
  document.getElementById('filter-sampai').value = enamHariLalu;

  await isiDropdownGuru();
  await muat();
})();
