AUTH.requireRole(['admin','piket']);
const _namaAdmin = AUTH.current().nama || AUTH.current().username;
document.getElementById('nama-admin').textContent = _namaAdmin;
document.getElementById('avatar-admin').textContent = _namaAdmin.charAt(0).toUpperCase();

const BADGE_CLASS = { hadir:'badge-hadir', telat:'badge-telat', pulang_awal:'badge-pulang', telat_dan_pulang_awal:'badge-telat', sakit:'badge-sakit', izin:'badge-izin', kegiatan:'badge-kegiatan' };

async function muat() {
  // const tanggal = new Date().toISOString().slice(0, 10);
  const tanggal = tanggalLokal();
  const rows = await DB.riwayatHariIni(tanggal, 200);
  const izinHariIni = await DB.listIzin(tanggal, tanggal);
  document.getElementById('stat-izin').textContent = izinHariIni.length;

  const total = rows.length;
  const telat = rows.filter(r => (r.status || '').includes('telat')).length;
  const pulangAwal = rows.filter(r => (r.status || '').includes('pulang_awal')).length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-telat').textContent = telat;
  document.getElementById('stat-pulang-awal').textContent = pulangAwal;

  document.getElementById('tbody-dashboard').innerHTML = rows.map(r => `
    <tr>
      <td>${r.nama_guru}</td>
      <td>${r.jam_scan_masuk || '-'}</td>
      <td>${r.jam_scan_pulang || '-'}</td>
      <td>${r.status ? `<span class="badge ${BADGE_CLASS[r.status] || ''}">${r.status.replace(/_/g,' ')}</span>` : '-'}</td>
    </tr>`).join('') || '<tr><td colspan="4">Belum ada presensi hari ini</td></tr>';
}
muat();
