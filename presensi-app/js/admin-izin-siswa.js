AUTH.requireRole(['admin', 'wali_kelas']);
const _userIzinSiswa = AUTH.current();
document.getElementById('nama-admin').textContent = _userIzinSiswa.nama || _userIzinSiswa.username;
document.getElementById('avatar-admin').textContent = (_userIzinSiswa.nama || _userIzinSiswa.username).charAt(0).toUpperCase();

const isWaliKelas = _userIzinSiswa.role === 'wali_kelas';
const selectSiswa = document.getElementById('izin-siswa-pilih');
const form = document.getElementById('form-izin-siswa');

let semuaSiswa = [];

async function isiDropdownSiswa() {
  semuaSiswa = await DB.listSiswa();
  // Wali kelas cuma boleh lihat siswa di kelasnya sendiri
  const daftar = isWaliKelas
    ? semuaSiswa.filter(s => s.kelas_id === _userIzinSiswa.kelas_id)
    : semuaSiswa;

  selectSiswa.innerHTML = daftar.map(s => `<option value="${s.id}">${s.nama} (${s.nama_kelas})</option>`).join('')
    || '<option value="">Tidak ada siswa</option>';
}

async function muatRiwayat() {
  const semuaIzin = await DB.listIzinSiswa();
  // Wali kelas cuma lihat riwayat siswa di kelasnya sendiri
  const filtered = isWaliKelas
    ? semuaIzin.filter(r => {
        const s = semuaSiswa.find(x => x.id === r.siswa_id);
        return s && s.kelas_id === _userIzinSiswa.kelas_id;
      })
    : semuaIzin;

  document.getElementById('tbody-izin-siswa').innerHTML = filtered.map(r => {
    const s = semuaSiswa.find(x => x.id === r.siswa_id);
    return `
      <tr>
        <td>${formatTanggalPanjang(r.tanggal)}</td>
        <td>${r.nama_siswa}</td>
        <td>${s?.nama_kelas || '-'}</td>
        <td><span class="badge badge-warning">${r.jenis}</span></td>
        <td>${r.keterangan || '-'}</td>
        <td>${r.dicatat_oleh || '-'}</td>
        <td><div class="table-actions"><button onclick="hapusIzinSiswa(${r.id})"><i class="bi bi-trash"></i> Hapus</button></div></td>
      </tr>`;
  }).join('') || '<tr><td colspan="7">Belum ada data izin siswa</td></tr>';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await DB.addIzinSiswa({
      siswa_id: Number(selectSiswa.value),
      tanggal: document.getElementById('izin-siswa-tanggal').value,
      jenis: document.getElementById('izin-siswa-jenis').value,
      keterangan: document.getElementById('izin-siswa-keterangan').value.trim(),
      dicatat_oleh: _userIzinSiswa.nama || _userIzinSiswa.username,
    });
    toast('Data izin siswa berhasil disimpan.');
    form.reset();
    document.getElementById('izin-siswa-tanggal').value = tanggalLokal(new Date());
    muatRiwayat();
  } catch (err) {
    toast(err.message, 'error');
  }
});

async function hapusIzinSiswa(id) {
  const ya = await konfirmasi('Hapus data izin siswa ini?');
  if (!ya) return;
  await DB.deleteIzinSiswa(id);
  toast('Data izin siswa dihapus.');
  muatRiwayat();
}

document.getElementById('izin-siswa-tanggal').value = tanggalLokal(new Date());

(async () => {
  await isiDropdownSiswa();
  await muatRiwayat();
})();