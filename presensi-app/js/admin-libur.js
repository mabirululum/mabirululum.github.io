AUTH.requireRole(['admin']);
const _nama = AUTH.current().nama || AUTH.current().username;
document.getElementById('nama-admin').textContent = _nama;
document.getElementById('avatar-admin').textContent = _nama.charAt(0).toUpperCase();

const form = document.getElementById('form-libur');

async function muatData() {
  const data = await DB.listHariLibur();
  document.getElementById('tbody-libur').innerHTML = data.map(l => `
    <tr>
      <td>${l.tanggal.split('-').reverse().join('/')}</td>
      <td>${l.keterangan}</td>
      <td><div class="table-actions"><button onclick="hapusLibur(${l.id})"><i class="bi bi-trash"></i> Hapus</button></div></td>
    </tr>`).join('') || '<tr><td colspan="3">Belum ada data hari libur</td></tr>';
}
muatData();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await DB.addHariLibur({
      tanggal: document.getElementById('libur-tanggal').value,
      keterangan: document.getElementById('libur-keterangan').value.trim(),
    });
    toast('Hari libur berhasil disimpan.');
    form.reset();
    muatData();
  } catch (err) {
    toast(err.message, 'error');
  }
});

async function hapusLibur(id) {
  const ya = await konfirmasi('Hapus data hari libur ini?');
  if (!ya) return;
  await DB.deleteHariLibur(id);
  toast('Data hari libur dihapus.');
  muatData();
}