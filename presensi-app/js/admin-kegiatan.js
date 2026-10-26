AUTH.requireRole(['admin']);
const _nama = AUTH.current().nama || AUTH.current().username;
const elNamaAdmin = document.getElementById('nama-admin');
const elAvatarAdmin = document.getElementById('avatar-admin');
if (elNamaAdmin) elNamaAdmin.textContent = _nama;
if (elAvatarAdmin) elAvatarAdmin.textContent = _nama.charAt(0).toUpperCase();

const form = document.getElementById('form-kegiatan');
const inputId = document.getElementById('kegiatan-id');
const inputTanggal = document.getElementById('kegiatan-tanggal');
const inputKeterangan = document.getElementById('kegiatan-keterangan');
const btnBatalEdit = document.getElementById('btn-batal-edit-kegiatan');

const PER_HALAMAN_KEGIATAN = 10;
let halamanKegiatan = 1;
let dataKegiatanTerakhir = [];

async function muatData() {
  dataKegiatanTerakhir = await DB.listHariKegiatan();
  halamanKegiatan = 1;
  renderTabelKegiatan();
}

function renderTabelKegiatan() {
  const totalHalaman = Math.max(1, Math.ceil(dataKegiatanTerakhir.length / PER_HALAMAN_KEGIATAN));
  if (halamanKegiatan > totalHalaman) halamanKegiatan = totalHalaman;
  if (halamanKegiatan < 1) halamanKegiatan = 1;

  const mulai = (halamanKegiatan - 1) * PER_HALAMAN_KEGIATAN;
  const potong = dataKegiatanTerakhir.slice(mulai, mulai + PER_HALAMAN_KEGIATAN);

  const tbody = document.getElementById('tbody-kegiatan');
  if (tbody) {
    tbody.innerHTML = potong.map(k => `
      <tr>
        <td style="font-weight:600; color:var(--text);">${formatTanggalPanjang(k.tanggal)}</td>
        <td>${k.keterangan}</td>
        <td>
          <div class="table-actions">
            <button type="button" onclick="editKegiatan(${k.id})"><i class="bi bi-pencil"></i> Edit</button>
            <button type="button" onclick="hapusKegiatan(${k.id})"><i class="bi bi-trash"></i> Hapus</button>
          </div>
        </td>
      </tr>`).join('') || '<tr><td colspan="3">Belum ada data kegiatan sekolah</td></tr>';
  }

  const infoEl = document.getElementById('info-halaman-kegiatan');
  const btnPrev = document.getElementById('btn-prev-kegiatan');
  const btnNext = document.getElementById('btn-next-kegiatan');

  if (infoEl) infoEl.textContent = `Halaman ${halamanKegiatan} dari ${totalHalaman} (${dataKegiatanTerakhir.length} data)`;
  if (btnPrev) btnPrev.disabled = halamanKegiatan <= 1;
  if (btnNext) btnNext.disabled = halamanKegiatan >= totalHalaman;
}

const btnPrevKegiatan = document.getElementById('btn-prev-kegiatan');
if (btnPrevKegiatan) {
  btnPrevKegiatan.addEventListener('click', () => {
    if (halamanKegiatan > 1) {
      halamanKegiatan--;
      renderTabelKegiatan();
    }
  });
}

const btnNextKegiatan = document.getElementById('btn-next-kegiatan');
if (btnNextKegiatan) {
  btnNextKegiatan.addEventListener('click', () => {
    const totalHalaman = Math.max(1, Math.ceil(dataKegiatanTerakhir.length / PER_HALAMAN_KEGIATAN));
    if (halamanKegiatan < totalHalaman) {
      halamanKegiatan++;
      renderTabelKegiatan();
    }
  });
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