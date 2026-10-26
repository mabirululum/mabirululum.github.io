// =========================================================
// WALI KELAS IZIN — Script khusus halaman wali-kelas/izin.html
// - Tanpa sidebar, UI bersih & tulisan besar
// - Riwayat HANYA menampilkan data siswa dari kelas wali kelas ini
// - Data tersimpan ke tabel Supabase izin_siswa (tersinkron ke dashboard admin)
// =========================================================

// ---- 1. Auth Guard ----
(function () {
  const raw = sessionStorage.getItem('admin_session');
  if (!raw) {
    window.location.href = 'login.html';
    return;
  }
  try {
    const user = JSON.parse(raw);
    if (user.role !== 'wali_kelas') {
      window.location.href = 'login.html';
    }
  } catch (e) {
    window.location.href = 'login.html';
  }
})();

function logoutWali() {
  konfirmasi('Yakin ingin logout dari portal Wali Kelas?').then((ya) => {
    if (!ya) return;
    sessionStorage.removeItem('admin_session');
    window.location.href = 'login.html';
  });
}

// ---- 2. User & Class State ----
const _session = JSON.parse(sessionStorage.getItem('admin_session') || '{}');
const _nama = _session.nama || _session.username || 'Wali Kelas';
const _kelasId = _session.kelas_id ? Number(_session.kelas_id) : null;

// Tampilkan info user di header
document.getElementById('nama-wali').textContent = _nama;
document.getElementById('avatar-wali').textContent = _nama.charAt(0).toUpperCase();

// Elements
const formIzin = document.getElementById('form-izin-siswa');
const selectSiswa = document.getElementById('izin-siswa');
const selectJenis = document.getElementById('izin-jenis');
const inputTanggal = document.getElementById('izin-tanggal');
const inputTanggalSampai = document.getElementById('izin-tanggal-sampai');
const inputKeterangan = document.getElementById('izin-keterangan');
const btnSubmit = document.getElementById('btn-submit-izin');
const inputCari = document.getElementById('input-cari-riwayat');
const badgeTopbarKelas = document.getElementById('badge-topbar-kelas');
const subtitleFormKelas = document.getElementById('subtitle-form-kelas');
const subtitleRiwayatKelas = document.getElementById('subtitle-riwayat-kelas');
const chipTotalData = document.getElementById('chip-total-data');
const alertTanpaKelas = document.getElementById('alert-tanpa-kelas');

let semuaSiswa = [];
let riwayatKelas = [];
let halamanAktif = 1;
const PER_HALAMAN = 10;
let namaKelasAktif = '';

// ---- 3. Muat Data Kelas & Info ----
async function inisialisasiKelas() {
  if (!_kelasId) {
    alertTanpaKelas.style.display = 'flex';
    badgeTopbarKelas.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Belum ada kelas';
    subtitleFormKelas.textContent = '(Belum Ditautkan ke Kelas)';
    subtitleRiwayatKelas.textContent = '(Belum Ditautkan ke Kelas)';
    selectSiswa.innerHTML = '<option value="">Akun belum memiliki kelas</option>';
    selectSiswa.disabled = true;
    btnSubmit.disabled = true;
    return false;
  }

  try {
    const listKelas = await DB.listKelas();
    const kelasSaya = (listKelas || []).find((k) => Number(k.id) === _kelasId);
    namaKelasAktif = kelasSaya ? kelasSaya.nama_kelas : `Kelas #${_kelasId}`;

    badgeTopbarKelas.innerHTML = `<i class="bi bi-collection"></i> Kelas ${namaKelasAktif}`;
    subtitleFormKelas.textContent = `(Kelas ${namaKelasAktif})`;
    subtitleRiwayatKelas.textContent = `(Hanya Kelas ${namaKelasAktif})`;
    return true;
  } catch (err) {
    console.error('Gagal memuat data kelas:', err);
    namaKelasAktif = `Kelas #${_kelasId}`;
    badgeTopbarKelas.innerHTML = `<i class="bi bi-collection"></i> Kelas ${namaKelasAktif}`;
    subtitleFormKelas.textContent = `(Kelas ${namaKelasAktif})`;
    subtitleRiwayatKelas.textContent = `(Hanya Kelas ${namaKelasAktif})`;
    return true;
  }
}

// ---- 4. Dropdown Siswa (Hanya Siswa di Kelas Ini) ----
async function isiDropdownSiswa() {
  if (!_kelasId) return;

  try {
    semuaSiswa = await DB.listSiswa('aktif');
    // Filter khusus kelas milik wali kelas ini
    const siswaKelas = semuaSiswa.filter((s) => Number(s.kelas_id) === _kelasId);

    if (siswaKelas.length === 0) {
      selectSiswa.innerHTML = '<option value="">Tidak ada siswa di kelas ini</option>';
      selectSiswa.disabled = true;
      btnSubmit.disabled = true;
      return;
    }

    selectSiswa.disabled = false;
    btnSubmit.disabled = false;
    selectSiswa.innerHTML =
      '<option value="">-- Pilih Siswa --</option>' +
      siswaKelas
        .map((s) => {
          const detailNis = s.nis ? ` (NIS: ${s.nis})` : '';
          return `<option value="${s.id}">${s.nama}${detailNis}</option>`;
        })
        .join('');
  } catch (err) {
    console.error('Gagal memuat siswa:', err);
    selectSiswa.innerHTML = '<option value="">Gagal memuat daftar siswa</option>';
  }
}

// ---- 5. Helper Rentang Tanggal ----
function daftarTanggalRentang(dari, sampai) {
  const hasil = [];
  const cursor = new Date(dari + 'T00:00:00');
  const akhir = new Date((sampai || dari) + 'T00:00:00');
  while (cursor <= akhir) {
    hasil.push(tanggalLokal(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return hasil;
}

// ---- 6. Riwayat Izin Siswa (Per Kelas Masing-Masing) ----
async function muatRiwayat() {
  const tbody = document.getElementById('tbody-izin-siswa');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px;">Memuat riwayat izin…</td></tr>';

  if (!_kelasId) {
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <i class="bi bi-exclamation-circle"></i>
          <p>Akun Anda belum memiliki penugasan kelas dari Administrator</p>
        </div>
      </td></tr>`;
    chipTotalData.textContent = '0 entri';
    document.getElementById('info-halaman').textContent = 'Halaman 0 dari 0';
    document.getElementById('btn-prev').disabled = true;
    document.getElementById('btn-next').disabled = true;
    return;
  }

  try {
    const semuaIzin = await DB.listIzinSiswa();

    // Pastikan list semuaSiswa sudah ada untuk filter kelas_id
    if (!semuaSiswa.length) {
      semuaSiswa = await DB.listSiswa('aktif');
    }

    // FILTER KRUSIAL: Hanya izin dari siswa yang berada di kelas wali kelas ini
    riwayatKelas = (semuaIzin || []).filter((r) => {
      const siswa = semuaSiswa.find((s) => Number(s.id) === Number(r.siswa_id));
      return siswa && Number(siswa.kelas_id) === _kelasId;
    });

    halamanAktif = 1;
    renderTabelRiwayat();
  } catch (err) {
    console.error('Gagal memuat riwayat:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger); text-align:center; padding:20px;">Gagal memuat riwayat: ${err.message}</td></tr>`;
  }
}

function ambilDataFilter() {
  const keyword = inputCari.value.trim().toLowerCase();
  if (!keyword) return riwayatKelas;

  return riwayatKelas.filter((r) => {
    const nama = (r.nama_siswa || '').toLowerCase();
    const ket = (r.keterangan || '').toLowerCase();
    const jenis = (r.jenis || '').toLowerCase();
    const tgl = (r.tanggal || '').toLowerCase();
    const dicatat = (r.dicatat_oleh || '').toLowerCase();
    return (
      nama.includes(keyword) ||
      ket.includes(keyword) ||
      jenis.includes(keyword) ||
      tgl.includes(keyword) ||
      dicatat.includes(keyword)
    );
  });
}

function renderBadgeJenis(jenis) {
  const j = (jenis || '').toLowerCase();
  if (j === 'sakit') {
    return '<span class="badge-jenis badge-sakit"><i class="bi bi-thermometer-half"></i> Sakit</span>';
  }
  if (j === 'izin') {
    return '<span class="badge-jenis badge-izin"><i class="bi bi-envelope-paper"></i> Izin</span>';
  }
  if (j === 'kegiatan') {
    return '<span class="badge-jenis badge-kegiatan"><i class="bi bi-flag"></i> Kegiatan</span>';
  }
  return `<span class="badge-jenis badge-cuti"><i class="bi bi-calendar4-week"></i> ${jenis || '-'}</span>`;
}

function renderTabelRiwayat() {
  const dataTampil = ambilDataFilter();
  const totalItem = dataTampil.length;
  chipTotalData.textContent = `${totalItem} entri`;

  const totalHalaman = Math.max(1, Math.ceil(totalItem / PER_HALAMAN));
  if (halamanAktif > totalHalaman) halamanAktif = totalHalaman;

  const mulai = (halamanAktif - 1) * PER_HALAMAN;
  const potong = dataTampil.slice(mulai, mulai + PER_HALAMAN);
  const tbody = document.getElementById('tbody-izin-siswa');

  if (potong.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <i class="bi bi-inbox"></i>
          <p>${inputCari.value.trim() ? 'Tidak ada data izin siswa yang cocok dengan pencarian' : 'Belum ada data izin siswa untuk kelas ' + (namaKelasAktif || 'ini')}</p>
        </div>
      </td></tr>`;
  } else {
    tbody.innerHTML = potong
      .map((r) => {
        const namaSiswa = r.nama_siswa || 'Siswa #' + r.siswa_id;
        const ket = r.keterangan ? r.keterangan : '<span style="color:var(--muted);">-</span>';
        const pencatat = r.dicatat_oleh || '-';

        return `
        <tr>
          <td><strong>${formatTanggalPanjang(r.tanggal)}</strong></td>
          <td>${namaSiswa}</td>
          <td>${renderBadgeJenis(r.jenis)}</td>
          <td>${ket}</td>
          <td>${pencatat}</td>
          <td>
            <button type="button" class="btn-hapus-izin" onclick="hapusIzinSiswa(${r.id})" title="Hapus catatan izin ini">
              <i class="bi bi-trash"></i> Hapus
            </button>
          </td>
        </tr>`;
      })
      .join('');
  }

  document.getElementById('info-halaman').textContent = `Halaman ${halamanAktif} dari ${totalHalaman} (${totalItem} total data)`;
  document.getElementById('btn-prev').disabled = halamanAktif <= 1;
  document.getElementById('btn-next').disabled = halamanAktif >= totalHalaman;
}

// Kontrol Pencarian & Pagination
inputCari.addEventListener('input', () => {
  halamanAktif = 1;
  renderTabelRiwayat();
});

document.getElementById('btn-prev').addEventListener('click', () => {
  if (halamanAktif > 1) {
    halamanAktif--;
    renderTabelRiwayat();
  }
});

document.getElementById('btn-next').addEventListener('click', () => {
  halamanAktif++;
  renderTabelRiwayat();
});

// ---- 7. Form Submit (Simpan Izin Siswa) ----
formIzin.addEventListener('submit', async (e) => {
  e.preventDefault();

  const siswaId = Number(selectSiswa.value);
  if (!siswaId) {
    toast('Silakan pilih siswa terlebih dahulu.', 'warn');
    return;
  }

  const dari = inputTanggal.value;
  const sampai = inputTanggalSampai.value;
  const daftarTanggal = daftarTanggalRentang(dari, sampai);

  if (daftarTanggal.length > 31) {
    const lanjut = await konfirmasi(`Rentang tanggal mencakup ${daftarTanggal.length} hari. Lanjutkan simpan sekaligus?`);
    if (!lanjut) return;
  }

  const jenis = selectJenis.value;
  const keterangan = inputKeterangan.value.trim();

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="bi bi-hourglass-split"></i> Menyimpan…';

  let berhasil = 0;
  const gagal = [];

  for (const tanggal of daftarTanggal) {
    try {
      await DB.addIzinSiswa({
        siswa_id: siswaId,
        tanggal,
        jenis,
        keterangan,
        dicatat_oleh: _nama,
      });
      berhasil++;
    } catch (err) {
      gagal.push(`${tanggal}: ${err.message}`);
    }
  }

  btnSubmit.disabled = false;
  btnSubmit.innerHTML = '<i class="bi bi-save"></i> Simpan Izin';

  if (gagal.length && berhasil === 0) {
    toast(`Gagal menyimpan: ${gagal.join(', ')}`, 'error');
  } else if (gagal.length) {
    toast(`${berhasil} hari tersimpan, ${gagal.length} hari gagal.`, 'warn');
    formIzin.reset();
    inputTanggal.value = tanggalLokal(new Date());
    await muatRiwayat();
  } else {
    toast(`Data izin siswa berhasil disimpan untuk ${berhasil} hari.`);
    formIzin.reset();
    inputTanggal.value = tanggalLokal(new Date());
    await muatRiwayat();
  }
});

// ---- 8. Hapus Izin Siswa ----
async function hapusIzinSiswa(id) {
  const ya = await konfirmasi('Hapus data izin siswa ini? Data presensi siswa pada tanggal tersebut akan kembali normal.');
  if (!ya) return;

  try {
    await DB.deleteIzinSiswa(id);
    toast('Data izin siswa berhasil dihapus.');
    await muatRiwayat();
  } catch (err) {
    toast(err.message || 'Gagal menghapus data izin', 'error');
  }
}

// Inisialisasi default tanggal hari ini
inputTanggal.value = tanggalLokal(new Date());

// Jalankan saat halaman dibuka
(async () => {
  const kelasSiap = await inisialisasiKelas();
  if (kelasSiap) {
    await isiDropdownSiswa();
    await muatRiwayat();
  }
})();
