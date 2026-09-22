AUTH.requireRole(['admin']);
const _namaAdminKelas = AUTH.current().nama || AUTH.current().username;
document.getElementById('nama-admin').textContent = _namaAdminKelas;
document.getElementById('avatar-admin').textContent = _namaAdminKelas.charAt(0).toUpperCase();

const HARI_LIST_KELAS = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];

const formWrapKelas = document.getElementById('form-kelas-wrap');
const btnToggleFormKelas = document.getElementById('btn-toggle-form-kelas');
const form = document.getElementById('form-kelas');
const inputId = document.getElementById('kelas-id');
const inputNama = document.getElementById('kelas-nama');
const selectWali = document.getElementById('kelas-wali');
const tbodyJadwalKelas = document.getElementById('tbody-jadwal-kelas-input');
const btnBatalEdit = document.getElementById('btn-batal-edit-kelas');

let dataKelasTerakhir = [];
let halamanKelas = 1;
const PER_HALAMAN_KELAS = 10;

function bukaFormKelas() {
  formWrapKelas.style.display = 'block';
  btnToggleFormKelas.innerHTML = '<i class="bi bi-dash-lg"></i> Tutup Form';
}
function tutupFormKelas() {
  formWrapKelas.style.display = 'none';
  btnToggleFormKelas.innerHTML = '<i class="bi bi-plus-lg"></i> Tambah Kelas';
}
btnToggleFormKelas.addEventListener('click', () => {
  formWrapKelas.style.display === 'none' ? bukaFormKelas() : tutupFormKelas();
});

function renderBarisJadwalKelas() {
  tbodyJadwalKelas.innerHTML = HARI_LIST_KELAS.map(hari => `
    <tr>
      <td><input type="checkbox" class="cb-hari-kelas" data-hari="${hari}"></td>
      <td>${hari}</td>
      <td><input type="time" class="in-masuk-kelas" data-hari="${hari}" value="07:00" disabled></td>
      <td><input type="time" class="in-pulang-kelas" data-hari="${hari}" value="14:00" disabled></td>
      <td><input type="number" class="in-toleransi-kelas" data-hari="${hari}" value="15" min="0" style="width:70px;" disabled></td>
    </tr>`).join('');

  tbodyJadwalKelas.querySelectorAll('.cb-hari-kelas').forEach(cb => {
    cb.addEventListener('change', () => {
      const hari = cb.dataset.hari;
      tbodyJadwalKelas.querySelectorAll(`[data-hari="${hari}"]:not(.cb-hari-kelas)`)
        .forEach(el => el.disabled = !cb.checked);
    });
  });
}
renderBarisJadwalKelas();

function ambilJadwalKelasDariForm() {
  const jadwal = [];
  tbodyJadwalKelas.querySelectorAll('.cb-hari-kelas:checked').forEach(cb => {
    const hari = cb.dataset.hari;
    jadwal.push({
      hari,
      jam_masuk: tbodyJadwalKelas.querySelector(`.in-masuk-kelas[data-hari="${hari}"]`).value,
      jam_pulang: tbodyJadwalKelas.querySelector(`.in-pulang-kelas[data-hari="${hari}"]`).value,
      toleransi_telat_menit: Number(tbodyJadwalKelas.querySelector(`.in-toleransi-kelas[data-hari="${hari}"]`).value || 15),
    });
  });
  return jadwal;
}

function isiFormJadwalKelas(jadwalKelas) {
  renderBarisJadwalKelas();
  (jadwalKelas || []).forEach(j => {
    const cb = tbodyJadwalKelas.querySelector(`.cb-hari-kelas[data-hari="${j.hari}"]`);
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));
    tbodyJadwalKelas.querySelector(`.in-masuk-kelas[data-hari="${j.hari}"]`).value = j.jam_masuk.slice(0,5);
    tbodyJadwalKelas.querySelector(`.in-pulang-kelas[data-hari="${j.hari}"]`).value = j.jam_pulang.slice(0,5);
    tbodyJadwalKelas.querySelector(`.in-toleransi-kelas[data-hari="${j.hari}"]`).value = j.toleransi_telat_menit;
  });
}

function formatJadwalKelasTampil(jadwal) {
  if (!jadwal || !jadwal.length) return '<span style="color:var(--muted);">Belum ada jadwal</span>';
  return jadwal.map(j => `<span class="chip-hari">${j.hari}: ${j.jam_masuk.slice(0,5)}–${j.jam_pulang.slice(0,5)}</span>`).join('');
}

async function isiDropdownWali() {
  const guruList = await DB.listGuru();
  selectWali.innerHTML = '<option value="">- Tidak ada -</option>' +
    guruList.map(g => `<option value="${g.id}">${g.nama}</option>`).join('');
}

async function muatData() {
  const kelasList = await DB.listKelas();
  dataKelasTerakhir = await Promise.all(kelasList.map(async k => ({
    ...k, jadwal: await DB.listJadwalKelas(k.id),
  })));
  halamanKelas = 1;
  renderTabelKelas();
}

function renderTabelKelas() {
  const totalHalaman = Math.max(1, Math.ceil(dataKelasTerakhir.length / PER_HALAMAN_KELAS));
  if (halamanKelas > totalHalaman) halamanKelas = totalHalaman;
  const mulai = (halamanKelas - 1) * PER_HALAMAN_KELAS;
  const potong = dataKelasTerakhir.slice(mulai, mulai + PER_HALAMAN_KELAS);

  document.getElementById('tbody-kelas').innerHTML = potong.map(k => `
    <tr>
      <td>${k.nama_kelas}</td>
      <td>${k.nama_wali_kelas || '-'}</td>
      <td>${formatJadwalKelasTampil(k.jadwal)}</td>
      <td>${k.aktif ? 'Aktif' : 'Nonaktif'}</td>
      <td>
        <div class="table-actions">
          <button onclick="editKelas(${k.id})"><i class="bi bi-pencil"></i> Edit</button>
          <button onclick="hapusKelas(${k.id})"><i class="bi bi-trash"></i> Hapus</button>
        </div>
      </td>
    </tr>`).join('') || '<tr><td colspan="5">Belum ada data kelas</td></tr>';

  document.getElementById('info-halaman-kelas').textContent = `Halaman ${halamanKelas} dari ${totalHalaman} (${dataKelasTerakhir.length} kelas)`;
  document.getElementById('btn-prev-kelas').disabled = halamanKelas <= 1;
  document.getElementById('btn-next-kelas').disabled = halamanKelas >= totalHalaman;
}
document.getElementById('btn-prev-kelas').addEventListener('click', () => { halamanKelas--; renderTabelKelas(); });
document.getElementById('btn-next-kelas').addEventListener('click', () => { halamanKelas++; renderTabelKelas(); });

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const jadwal = ambilJadwalKelasDariForm();
  if (!jadwal.length) { toast('Pilih minimal 1 hari jadwal untuk kelas ini', 'warn'); return; }

  try {
    let kelasId;
    if (inputId.value) {
      kelasId = Number(inputId.value);
      await DB.updateKelas({ id: kelasId, nama_kelas: inputNama.value.trim(), wali_kelas_id: selectWali.value || null, aktif: 1 });
      toast('Data kelas berhasil diperbarui.');
    } else {
      await DB.addKelas({ nama_kelas: inputNama.value.trim(), wali_kelas_id: selectWali.value || null });
      const listTerbaru = await DB.listKelas();
      const kelasBaru = listTerbaru.find(k => k.nama_kelas === inputNama.value.trim());
      kelasId = kelasBaru?.id;
      toast('Kelas baru berhasil ditambahkan.');
    }
    if (kelasId) await DB.simpanJadwalKelas(kelasId, jadwal);

    form.reset();
    inputId.value = '';
    btnBatalEdit.style.display = 'none';
    renderBarisJadwalKelas();
    tutupFormKelas();
    muatData();
  } catch (err) {
    toast(err.message, 'error');
  }
});

btnBatalEdit.addEventListener('click', () => {
  form.reset();
  inputId.value = '';
  btnBatalEdit.style.display = 'none';
  renderBarisJadwalKelas();
  tutupFormKelas();
});

function editKelas(id) {
  const k = dataKelasTerakhir.find(x => x.id === id);
  if (!k) return;
  bukaFormKelas();
  inputId.value = k.id;
  inputNama.value = k.nama_kelas;
  selectWali.value = k.wali_kelas_id || '';
  isiFormJadwalKelas(k.jadwal);
  btnBatalEdit.style.display = 'inline-flex';
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function hapusKelas(id) {
  const ya = await konfirmasi('Hapus kelas ini? Semua siswa di dalamnya juga akan terhapus.');
  if (!ya) return;
  try {
    await DB.deleteKelas(id);
    toast('Kelas dihapus.');
    muatData();
  } catch (err) {
    toast(err.message, 'error');
  }
}

isiDropdownWali();
muatData();