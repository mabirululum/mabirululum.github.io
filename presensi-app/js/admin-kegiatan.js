AUTH.requireRole(['admin']);
const _nama = AUTH.current().nama || AUTH.current().username;
document.getElementById('nama-admin').textContent = _nama;
document.getElementById('avatar-admin').textContent = _nama.charAt(0).toUpperCase();

const form = document.getElementById('form-kegiatan');
const inputId = document.getElementById('kegiatan-id');
const inputTanggal = document.getElementById('kegiatan-tanggal');
const inputKeterangan = document.getElementById('kegiatan-keterangan');
const btnBatalEdit = document.getElementById('btn-batal-edit-kegiatan');

let dataKegiatanTerakhir = [];

async function muatData() {
  dataKegiatanTerakhir = await DB.listHariKegiatan();
  document.getElementById('tbody-kegiatan').innerHTML = dataKegiatanTerakhir.map(k => `
    <tr>
      <td>${formatTanggalPanjang(k.tanggal)}</td>
      <td>${k.keterangan}</td>
      <td>
        <div class="table-actions">
          <button onclick="editKegiatan(${k.id})"><i class="bi bi-pencil"></i> Edit</button>
          <button onclick="hapusKegiatan(${k.id})"><i class="bi bi-trash"></i> Hapus</button>
        </div>
      </td>
    </tr>`).join('') || '<tr><td colspan="3">Belum ada data kegiatan sekolah</td></tr>';
}
muatData();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    if (inputId.value) {
      await DB.deleteHariKegiatan(Number(inputId.value));
      await DB.addHariKegiatan({ tanggal: inputTanggal.value, keterangan: inputKeterangan.value.trim() });
      toast('Data kegiatan sekolah berhasil diperbarui.');
    } else {
      await DB.addHariKegiatan({ tanggal: inputTanggal.value, keterangan: inputKeterangan.value.trim() });
      toast('Kegiatan sekolah berhasil disimpan.');
    }
    form.reset();
    inputId.value = '';
    btnBatalEdit.style.display = 'none';
    muatData();
  } catch (err) {
    toast(err.message, 'error');
  }
});

btnBatalEdit.addEventListener('click', () => {
  form.reset();
  inputId.value = '';
  btnBatalEdit.style.display = 'none';
});

function editKegiatan(id) {
  const k = dataKegiatanTerakhir.find(x => x.id === id);
  if (!k) return;
  inputId.value = k.id;
  inputTanggal.value = k.tanggal;
  inputKeterangan.value = k.keterangan;
  btnBatalEdit.style.display = 'inline-flex';
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function hapusKegiatan(id) {
  const ya = await konfirmasi('Hapus data kegiatan sekolah ini?');
  if (!ya) return;
  await DB.deleteHariKegiatan(id);
  toast('Data kegiatan sekolah dihapus.');
  muatData();
}