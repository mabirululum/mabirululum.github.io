// =========================================================
// PIKET IZIN — Script khusus halaman piket/izin.html
// - Tanpa sidebar, UI bersih
// - Riwayat hanya menampilkan data yg dicatat oleh akun piket ini
// - Data tetap tersimpan di tabel yg sama (sinkron ke dashboard admin)
// =========================================================

// ---- Auth check ----
(function () {
  const raw = sessionStorage.getItem('admin_session');
  if (!raw) { window.location.href = 'login.html'; return; }
  const user = JSON.parse(raw);
  if (user.role !== 'piket') { window.location.href = 'login.html'; return; }
})();

function logoutPiket() {
  konfirmasi('Yakin ingin logout?').then((ya) => {
    if (!ya) return;
    sessionStorage.removeItem('admin_session');
    window.location.href = 'login.html';
  });
}

// ---- User info ----
const _session = JSON.parse(sessionStorage.getItem('admin_session'));
const _nama = _session.nama || _session.username;
document.getElementById('nama-piket').textContent = _nama;
document.getElementById('avatar-piket').textContent = _nama.charAt(0).toUpperCase();

// ---- Elemen form ----
const form = document.getElementById('form-izin');
const selectGuru = document.getElementById('izin-guru');
const cbParsial = document.getElementById('izin-parsial');
const wrapJamParsial = document.getElementById('wrap-jam-parsial');
const wrapCbParsial = document.getElementById('wrap-cb-parsial');
const selectJenis = document.getElementById('izin-jenis');
const inputTanggalSampai = document.getElementById('izin-tanggal-sampai');

// ---- Preset jam pelajaran ----
const PRESET_SENIN_KAMIS = [
  { label: 'Jam ke-2', mulai: '07:30', selesai: '08:10' },
  { label: 'Jam ke-3', mulai: '08:10', selesai: '08:50' },
  { label: 'Jam ke-4', mulai: '08:50', selesai: '09:30' },
  { label: 'Jam ke-5', mulai: '09:50', selesai: '10:25' },
  { label: 'Jam ke-6', mulai: '10:25', selesai: '11:00' },
  { label: 'Jam ke-7', mulai: '11:00', selesai: '11:35' },
  { label: 'Jam ke-8', mulai: '11:35', selesai: '12:10' },
  { label: 'Jam ke-9', mulai: '12:45', selesai: '13:20' },
  { label: 'Jam ke-10', mulai: '13:20', selesai: '13:55' },
  { label: 'Jam ke-11', mulai: '13:55', selesai: '14:30' },
];

const PRESET_JUMAT = [
  { label: 'Jam ke-2', mulai: '07:30', selesai: '08:05' },
  { label: 'Jam ke-3', mulai: '08:05', selesai: '08:40' },
  { label: 'Jam ke-4', mulai: '08:40', selesai: '09:15' },
  { label: 'Jam ke-5', mulai: '09:30', selesai: '10:05' },
  { label: 'Jam ke-6', mulai: '10:05', selesai: '10:35' },
  { label: 'Jam ke-7', mulai: '10:35', selesai: '11:00' },
];

const PRESET_SABTU = [
  { label: 'Jam ke-1', mulai: '07:00', selesai: '07:40' },
  { label: 'Jam ke-2', mulai: '07:40', selesai: '08:20' },
  { label: 'Jam ke-3', mulai: '08:20', selesai: '09:00' },
  { label: 'Jam ke-4', mulai: '09:00', selesai: '09:40' },
  { label: 'Jam ke-5', mulai: '09:40', selesai: '10:20' },
];

function ambilPresetSesuaiHari(tanggalStr) {
  const hari = new Date(tanggalStr + 'T00:00:00').getDay();
  if (hari === 5) return PRESET_JUMAT;
  if (hari === 6) return PRESET_SABTU;
  return PRESET_SENIN_KAMIS;
}

// ---- Toggle izin parsial ----
function toggleOpsiJamParsial() {
  const isIzin = selectJenis.value === 'Izin';
  wrapCbParsial.style.display = isIzin ? 'block' : 'none';
  if (!isIzin) {
    cbParsial.checked = false;
    wrapJamParsial.style.display = 'none';
  }
}
selectJenis.addEventListener('change', toggleOpsiJamParsial);
toggleOpsiJamParsial();

function renderPresetJamPelajaran() {
  const tanggal = document.getElementById('izin-tanggal').value || tanggalLokal(new Date());
  const preset = ambilPresetSesuaiHari(tanggal);
  const namaHari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][new Date(tanggal + 'T00:00:00').getDay()];

  const wrap = document.getElementById('preset-jam-pelajaran');
  wrap.innerHTML = `
    <div style="width:100%; font-size:13px; color:var(--muted); margin-bottom:6px;">Jadwal hari ${namaHari}:</div>
    ${preset.map((p, i) => `
      <button type="button" class="btn-piket-preset preset-jam-btn" data-index="${i}">
        ${p.label} <span style="opacity:.6;">(${p.mulai}–${p.selesai})</span>
      </button>
    `).join('')}
  `;

  wrap.querySelectorAll('.preset-jam-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dipilih = preset[Number(btn.dataset.index)];
      document.getElementById('izin-jam-mulai').value = dipilih.mulai;
      document.getElementById('izin-jam-selesai').value = dipilih.selesai;
    });
  });
}
renderPresetJamPelajaran();

cbParsial.addEventListener('change', () => {
  wrapJamParsial.style.display = cbParsial.checked ? 'block' : 'none';
});

inputTanggalSampai.addEventListener('change', () => {
  const dari = document.getElementById('izin-tanggal').value;
  const sampai = inputTanggalSampai.value;
  const multiHari = sampai && sampai !== dari;
  cbParsial.disabled = multiHari;
  if (multiHari) { cbParsial.checked = false; wrapJamParsial.style.display = 'none'; }
});

// ---- Dropdown guru ----
async function isiDropdownGuru() {
  const guruList = await DB.listGuru();
  selectGuru.innerHTML = guruList.map(g => `<option value="${g.id}">${g.nama}</option>`).join('');
}

// ---- Riwayat (filtered per akun piket yg login) ----
let semuaIzin = [];
let grupIzin = [];
let halamanAktif = 1;
const PER_HALAMAN = 10;

async function muatRiwayat() {
  const semuaData = await DB.listIzin();

  // FILTER: hanya tampilkan yang dicatat oleh akun piket ini
  semuaIzin = semuaData.filter(r => r.dicatat_oleh === _nama);

  grupIzin = kelompokkanIzin(semuaIzin);
  halamanAktif = 1;
  renderTabelIzin();
}

function kelompokkanIzin(rows) {
  const peta = {};
  rows.forEach(r => {
    const key = `${r.guru_id}|${r.tanggal}`;
    if (!peta[key]) {
      peta[key] = { guru_id: r.guru_id, tanggal: r.tanggal, nama_guru: r.nama_guru, items: [] };
    }
    peta[key].items.push(r);
  });
  return Object.values(peta).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

function labelChipIzin(item) {
  if (item.jam_mulai && item.jam_selesai) {
    return `${item.jenis} ${item.jam_mulai.slice(0,5)}–${item.jam_selesai.slice(0,5)}`;
  }
  return `${item.jenis} (1 Hari Penuh)`;
}

function renderTabelIzin() {
  const totalHalaman = Math.max(1, Math.ceil(grupIzin.length / PER_HALAMAN));
  if (halamanAktif > totalHalaman) halamanAktif = totalHalaman;

  const mulai = (halamanAktif - 1) * PER_HALAMAN;
  const potong = grupIzin.slice(mulai, mulai + PER_HALAMAN);

  const tbody = document.getElementById('tbody-izin');

  if (potong.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="4">
        <div class="empty-state">
          <i class="bi bi-inbox"></i>
          <p>Belum ada data izin yang Anda catat</p>
        </div>
      </td></tr>`;
  } else {
    tbody.innerHTML = potong.map(grup => `
      <tr>
        <td>${formatTanggalPanjang(grup.tanggal)}</td>
        <td><strong>${grup.nama_guru}</strong></td>
        <td>
          ${grup.items.map(item => `
            <span class="chip-izin-piket">
              ${labelChipIzin(item)}
              <span class="chip-hapus" onclick="hapusIzin(${item.id})" title="Hapus entri ini">&times;</span>
            </span>
          `).join('')}
        </td>
        <td>${grup.items.map(i => i.keterangan).filter(Boolean).join(', ') || '-'}</td>
      </tr>`).join('');
  }

  document.getElementById('info-halaman').textContent = `Halaman ${halamanAktif} dari ${totalHalaman} (${grupIzin.length} hari, ${semuaIzin.length} entri)`;
  document.getElementById('btn-prev').disabled = halamanAktif <= 1;
  document.getElementById('btn-next').disabled = halamanAktif >= totalHalaman;
}

document.getElementById('btn-prev').addEventListener('click', () => { halamanAktif--; renderTabelIzin(); });
document.getElementById('btn-next').addEventListener('click', () => { halamanAktif++; renderTabelIzin(); });

// ---- Helper tanggal rentang ----
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

// ---- Submit form ----
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const dari = document.getElementById('izin-tanggal').value;
  const sampai = document.getElementById('izin-tanggal-sampai').value;
  const daftarTanggal = daftarTanggalRentang(dari, sampai);

  if (daftarTanggal.length > 31) {
    const lanjut = await konfirmasi(`Rentang ini mencakup ${daftarTanggal.length} hari. Lanjutkan simpan sekaligus?`);
    if (!lanjut) return;
  }

  const pakaiJamParsial = cbParsial.checked && daftarTanggal.length === 1;
  const jamMulai = pakaiJamParsial ? document.getElementById('izin-jam-mulai').value : null;
  const jamSelesai = pakaiJamParsial ? document.getElementById('izin-jam-selesai').value : null;

  if (pakaiJamParsial && (!jamMulai || !jamSelesai)) {
    toast('Isi jam mulai dan jam selesai untuk izin sebagian jam.', 'warn');
    return;
  }

  const payload = {
    guru_id: Number(selectGuru.value),
    jenis: document.getElementById('izin-jenis').value,
    keterangan: document.getElementById('izin-keterangan').value.trim(),
    dicatat_oleh: _nama,
    jam_mulai: jamMulai,
    jam_selesai: jamSelesai,
  };

  let berhasil = 0;
  const gagal = [];
  let adaUpdateStatus = false;

  for (const tanggal of daftarTanggal) {
    try {
      const hasil = await DB.addIzin({ ...payload, tanggal });
      if (hasil && hasil.status_presensi_terupdate) adaUpdateStatus = true;
      berhasil++;
    } catch (err) {
      gagal.push(`${tanggal}: ${err.message}`);
    }
  }

  if (gagal.length) {
    toast(`${berhasil} hari tersimpan, ${gagal.length} gagal.`, 'warn');
    console.error('Gagal simpan izin:', gagal);
  } else if (adaUpdateStatus) {
    toast(`Data izin tersimpan. Status presensi otomatis diperbarui.`);
  } else {
    toast(`Data izin tersimpan untuk ${berhasil} hari.`);
  }

  form.reset();
  document.getElementById('izin-tanggal').value = tanggalLokal(new Date());
  wrapJamParsial.style.display = 'none';
  cbParsial.disabled = false;
  toggleOpsiJamParsial();
  muatRiwayat();
});

// ---- Hapus izin (piket bisa hapus data yang dia input sendiri) ----
async function hapusIzin(id) {
  const ya = await konfirmasi('Hapus data izin ini?');
  if (!ya) return;
  await DB.deleteIzin(id);
  toast('Data izin dihapus.');
  muatRiwayat();
}

// ---- Init ----
document.getElementById('izin-tanggal').addEventListener('change', renderPresetJamPelajaran);
document.getElementById('izin-tanggal').value = tanggalLokal(new Date());
renderPresetJamPelajaran();
isiDropdownGuru();
muatRiwayat();
