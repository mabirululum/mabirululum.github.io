AUTH.requireRole(['admin']);
const _nama = AUTH.current().nama || AUTH.current().username;
const elNamaAdmin = document.getElementById('nama-admin');
const elAvatarAdmin = document.getElementById('avatar-admin');
if (elNamaAdmin) elNamaAdmin.textContent = _nama;
if (elAvatarAdmin) elAvatarAdmin.textContent = _nama.charAt(0).toUpperCase();

const form = document.getElementById('form-libur');
const inputId = document.getElementById('libur-id');
const inputTanggal = document.getElementById('libur-tanggal');
const inputKeterangan = document.getElementById('libur-keterangan');
const btnBatalEdit = document.getElementById('btn-batal-edit-libur');

const PER_HALAMAN_LIBUR = 10;
let halamanLibur = 1;
let dataLiburTerakhir = [];

async function muatData() {
  dataLiburTerakhir = await DB.listHariLibur();
  halamanLibur = 1;
  renderTabelLibur();
}

function renderTabelLibur() {
  const totalHalaman = Math.max(1, Math.ceil(dataLiburTerakhir.length / PER_HALAMAN_LIBUR));
  if (halamanLibur > totalHalaman) halamanLibur = totalHalaman;
  if (halamanLibur < 1) halamanLibur = 1;

  const mulai = (halamanLibur - 1) * PER_HALAMAN_LIBUR;
  const potong = dataLiburTerakhir.slice(mulai, mulai + PER_HALAMAN_LIBUR);

  const tbody = document.getElementById('tbody-libur');
  if (tbody) {
    tbody.innerHTML = potong.map(l => `
      <tr>
        <td style="font-weight:600; color:var(--text);">${formatTanggalPanjang(l.tanggal)}</td>
        <td>${l.keterangan}</td>
        <td>
          <div class="table-actions">
            <button type="button" onclick="editLibur(${l.id})"><i class="bi bi-pencil"></i> Edit</button>
            <button type="button" onclick="hapusLibur(${l.id})"><i class="bi bi-trash"></i> Hapus</button>
          </div>
        </td>
      </tr>`).join('') || '<tr><td colspan="3">Belum ada data hari libur</td></tr>';
  }

  const infoEl = document.getElementById('info-halaman-libur');
  const btnPrev = document.getElementById('btn-prev-libur');
  const btnNext = document.getElementById('btn-next-libur');

  if (infoEl) infoEl.textContent = `Halaman ${halamanLibur} dari ${totalHalaman} (${dataLiburTerakhir.length} data)`;
  if (btnPrev) btnPrev.disabled = halamanLibur <= 1;
  if (btnNext) btnNext.disabled = halamanLibur >= totalHalaman;
}

const btnPrevLibur = document.getElementById('btn-prev-libur');
if (btnPrevLibur) {
  btnPrevLibur.addEventListener('click', () => {
    if (halamanLibur > 1) {
      halamanLibur--;
      renderTabelLibur();
    }
  });
}

const btnNextLibur = document.getElementById('btn-next-libur');
if (btnNextLibur) {
  btnNextLibur.addEventListener('click', () => {
    const totalHalaman = Math.max(1, Math.ceil(dataLiburTerakhir.length / PER_HALAMAN_LIBUR));
    if (halamanLibur < totalHalaman) {
      halamanLibur++;
      renderTabelLibur();
    }
  });
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