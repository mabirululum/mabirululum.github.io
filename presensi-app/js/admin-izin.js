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

let semuaIzin = [];
let halamanAktif = 1;
const PER_HALAMAN = 10;

async function muatRiwayat() {
  semuaIzin = await DB.listIzin(); // tanpa parameter = ambil semua
  halamanAktif = 1;
  renderTabelIzin();
}

function renderTabelIzin() {
  const totalHalaman = Math.max(1, Math.ceil(semuaIzin.length / PER_HALAMAN));
  if (halamanAktif > totalHalaman) halamanAktif = totalHalaman;

  const mulai = (halamanAktif - 1) * PER_HALAMAN;
  const potong = semuaIzin.slice(mulai, mulai + PER_HALAMAN);

  document.getElementById('tbody-izin').innerHTML = potong.map(r => `
    <tr>
      <td>${r.tanggal.split('-').reverse().join('/')}</td>
      <td>${r.nama_guru}</td>
      <td><span class="badge badge-warning">${r.jenis}</span></td>
      <td>${r.keterangan || '-'}</td>
      <td><div class="table-actions"><button onclick="hapusIzin(${r.id})"><i class="bi bi-trash"></i> Hapus</button></div></td>
    </tr>`).join('') || '<tr><td colspan="5">Belum ada data izin</td></tr>';

  document.getElementById('info-halaman').textContent = `Halaman ${halamanAktif} dari ${totalHalaman} (${semuaIzin.length} data)`;
  document.getElementById('btn-prev').disabled = halamanAktif <= 1;
  document.getElementById('btn-next').disabled = halamanAktif >= totalHalaman;
}

document.getElementById('btn-prev').addEventListener('click', () => { halamanAktif--; renderTabelIzin(); });
document.getElementById('btn-next').addEventListener('click', () => { halamanAktif++; renderTabelIzin(); });

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