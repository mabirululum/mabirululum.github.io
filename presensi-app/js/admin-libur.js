AUTH.requireRole(['admin']);
const _nama = AUTH.current().nama || AUTH.current().username;
document.getElementById('nama-admin').textContent = _nama;
document.getElementById('avatar-admin').textContent = _nama.charAt(0).toUpperCase();

const form = document.getElementById('form-libur');
const inputId = document.getElementById('libur-id');
const inputTanggal = document.getElementById('libur-tanggal');
const inputKeterangan = document.getElementById('libur-keterangan');
const btnBatalEdit = document.getElementById('btn-batal-edit-libur');

let dataLiburTerakhir = [];

async function muatData() {
  dataLiburTerakhir = await DB.listHariLibur();
  document.getElementById('tbody-libur').innerHTML = dataLiburTerakhir.map(l => `
    <tr>
      <td>${formatTanggalPanjang(l.tanggal)}</td>
      <td>${l.keterangan}</td>
      <td>
        <div class="table-actions">
          <button onclick="editLibur(${l.id})"><i class="bi bi-pencil"></i> Edit</button>
          <button onclick="hapusLibur(${l.id})"><i class="bi bi-trash"></i> Hapus</button>
        </div>
      </td>
    </tr>`).join('') || '<tr><td colspan="3">Belum ada data hari libur</td></tr>';
}
muatData();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    if (inputId.value) {
      // Mode edit: hapus data lama, simpan yang baru (tanggal mungkin berubah)
      await DB.deleteHariLibur(Number(inputId.value));
      await DB.addHariLibur({ tanggal: inputTanggal.value, keterangan: inputKeterangan.value.trim() });
      toast('Data hari libur berhasil diperbarui.');
    } else {
      await DB.addHariLibur({ tanggal: inputTanggal.value, keterangan: inputKeterangan.value.trim() });
      toast('Hari libur berhasil disimpan.');
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

function editLibur(id) {
  const l = dataLiburTerakhir.find(x => x.id === id);
  if (!l) return;
  inputId.value = l.id;
  inputTanggal.value = l.tanggal;
  inputKeterangan.value = l.keterangan;
  btnBatalEdit.style.display = 'inline-flex';
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function hapusLibur(id) {
  const ya = await konfirmasi('Hapus data hari libur ini?');
  if (!ya) return;
  await DB.deleteHariLibur(id);
  toast('Data hari libur dihapus.');
  muatData();
}