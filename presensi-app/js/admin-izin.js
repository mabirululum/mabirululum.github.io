AUTH.requireRole(['admin', 'piket']);
const _nama = AUTH.current().nama || AUTH.current().username;
document.getElementById('nama-admin').textContent = _nama;
document.getElementById('avatar-admin').textContent = _nama.charAt(0).toUpperCase();

const form = document.getElementById('form-izin');
const selectGuru = document.getElementById('izin-guru');

async function isiDropdownGuru() {
  const guruList = await DB.listGuru();
  selectGuru.innerHTML = guruList.map(g => `<option value="${g.id}">${g.nama}</option>`).join('');
}

async function muatRiwayat() {
  const sampai = new Date().toISOString().slice(0, 10);
  const dari = new Date(Date.now() - 6*86400000).toISOString().slice(0, 10);
  const rows = await DB.listIzin(dari, sampai);

  document.getElementById('tbody-izin').innerHTML = rows.map(r => `
    <tr>
      <td>${new Date(r.tanggal).toLocaleDateString('id-ID')}</td>
      <td>${r.nama_guru}</td>
      <td><span class="badge badge-warning">${r.jenis}</span></td>
      <td>${r.keterangan || '-'}</td>
      <td><div class="table-actions"><button onclick="hapusIzin(${r.id})"><i class="bi bi-trash"></i> Hapus</button></div></td>
    </tr>`).join('') || '<tr><td colspan="5">Belum ada data izin</td></tr>';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await DB.addIzin({
      guru_id: Number(selectGuru.value),
      tanggal: document.getElementById('izin-tanggal').value,
      jenis: document.getElementById('izin-jenis').value,
      keterangan: document.getElementById('izin-keterangan').value.trim(),
      dicatat_oleh: _nama,
    });
    toast('Data izin berhasil disimpan.');
    form.reset();
    muatRiwayat();
  } catch (err) {
    toast(err.message, 'error');
  }
});

async function hapusIzin(id) {
  const ya = await konfirmasi('Hapus data izin ini?');
  if (!ya) return;
  await DB.deleteIzin(id);
  toast('Data izin dihapus.');
  muatRiwayat();
}

document.getElementById('izin-tanggal').value = tanggalLokal(new Date());
isiDropdownGuru();
muatRiwayat();