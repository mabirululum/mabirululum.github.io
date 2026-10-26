AUTH.requireRole(['admin']);
const _userIzinSiswa = AUTH.current();
const elNamaAdmin = document.getElementById('nama-admin');
const elAvatarAdmin = document.getElementById('avatar-admin');
if (elNamaAdmin) elNamaAdmin.textContent = _userIzinSiswa.nama || _userIzinSiswa.username;
if (elAvatarAdmin) elAvatarAdmin.textContent = (_userIzinSiswa.nama || _userIzinSiswa.username).charAt(0).toUpperCase();

const isWaliKelas = _userIzinSiswa.role === 'wali_kelas';
const selectSiswa = document.getElementById('izin-siswa-pilih');
const form = document.getElementById('form-izin-siswa');

const PER_HALAMAN_IZIN_SISWA = 10;
let halamanIzinSiswa = 1;
let semuaSiswa = [];
let dataIzinSiswaTerakhir = [];

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
  dataIzinSiswaTerakhir = isWaliKelas
    ? semuaIzin.filter(r => {
        const s = semuaSiswa.find(x => x.id === r.siswa_id);
        return s && s.kelas_id === _userIzinSiswa.kelas_id;
      })
    : semuaIzin;

  halamanIzinSiswa = 1;
  renderTabelIzinSiswa();
}

function renderTabelIzinSiswa() {
  const totalHalaman = Math.max(1, Math.ceil(dataIzinSiswaTerakhir.length / PER_HALAMAN_IZIN_SISWA));
  if (halamanIzinSiswa > totalHalaman) halamanIzinSiswa = totalHalaman;
  if (halamanIzinSiswa < 1) halamanIzinSiswa = 1;

  const mulai = (halamanIzinSiswa - 1) * PER_HALAMAN_IZIN_SISWA;
  const potong = dataIzinSiswaTerakhir.slice(mulai, mulai + PER_HALAMAN_IZIN_SISWA);

  const tbody = document.getElementById('tbody-izin-siswa');
  if (tbody) {
    tbody.innerHTML = potong.map(r => {
      const s = semuaSiswa.find(x => x.id === r.siswa_id);
      return `
        <tr>
          <td style="font-weight:600; color:var(--text);">${formatTanggalPanjang(r.tanggal)}</td>
          <td>${r.nama_siswa}</td>
          <td>${s?.nama_kelas || '-'}</td>
          <td><span class="badge badge-warning">${r.jenis}</span></td>
          <td>${r.keterangan || '-'}</td>
          <td>${r.dicatat_oleh || '-'}</td>
          <td>
            <div class="table-actions">
              <button type="button" onclick="hapusIzinSiswa(${r.id})"><i class="bi bi-trash"></i> Hapus</button>
            </div>
          </td>
        </tr>`;
    }).join('') || '<tr><td colspan="7">Belum ada data izin siswa</td></tr>';
  }

  const infoEl = document.getElementById('info-halaman-izin-siswa');
  const btnPrev = document.getElementById('btn-prev-izin-siswa');
  const btnNext = document.getElementById('btn-next-izin-siswa');

  if (infoEl) infoEl.textContent = `Halaman ${halamanIzinSiswa} dari ${totalHalaman} (${dataIzinSiswaTerakhir.length} data)`;
  if (btnPrev) btnPrev.disabled = halamanIzinSiswa <= 1;
  if (btnNext) btnNext.disabled = halamanIzinSiswa >= totalHalaman;
}

const btnPrevIzinSiswa = document.getElementById('btn-prev-izin-siswa');
if (btnPrevIzinSiswa) {
  btnPrevIzinSiswa.addEventListener('click', () => {
    if (halamanIzinSiswa > 1) {
      halamanIzinSiswa--;
      renderTabelIzinSiswa();
    }
  });
}

const btnNextIzinSiswa = document.getElementById('btn-next-izin-siswa');
if (btnNextIzinSiswa) {
  btnNextIzinSiswa.addEventListener('click', () => {
    const totalHalaman = Math.max(1, Math.ceil(dataIzinSiswaTerakhir.length / PER_HALAMAN_IZIN_SISWA));
    if (halamanIzinSiswa < totalHalaman) {
      halamanIzinSiswa++;
      renderTabelIzinSiswa();
    }
  });
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