AUTH.requireRole(['admin', 'piket']);
const _nama = AUTH.current().nama || AUTH.current().username;
document.getElementById('nama-admin').textContent = _nama;
document.getElementById('avatar-admin').textContent = _nama.charAt(0).toUpperCase();

const form = document.getElementById('form-izin');
const selectGuru = document.getElementById('izin-guru');

const cbParsial = document.getElementById('izin-parsial');
const wrapJamParsial = document.getElementById('wrap-jam-parsial');
const wrapCbParsial = document.getElementById('wrap-cb-parsial');
const selectJenis = document.getElementById('izin-jenis');
const inputTanggalSampai = document.getElementById('izin-tanggal-sampai');

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
  const hari = new Date(tanggalStr + 'T00:00:00').getDay(); // 0=Minggu, 5=Jumat, 6=Sabtu
  if (hari === 5) return PRESET_JUMAT;
  if (hari === 6) return PRESET_SABTU;
  return PRESET_SENIN_KAMIS; // Senin-Kamis (dan default fallback untuk Minggu)
}

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
    <div style="width:100%; font-size:11px; color:var(--muted); margin-bottom:4px;">Jadwal hari ${namaHari}:</div>
    ${preset.map((p, i) => `
      <button type="button" class="btn btn-secondary btn-sm preset-jam-btn" data-index="${i}">
        ${p.label} <span style="opacity:.7;">(${p.mulai}–${p.selesai})</span>
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
  wrapJamParsial.style.display = cbParsial.checked ? 'flex' : 'none';
});

// Izin jam parsial cuma masuk akal untuk 1 hari — matikan opsi kalau rentang tanggal lebih dari 1 hari
inputTanggalSampai.addEventListener('change', () => {
  const dari = document.getElementById('izin-tanggal').value;
  const sampai = inputTanggalSampai.value;
  const multiHari = sampai && sampai !== dari;
  cbParsial.disabled = multiHari;
  if (multiHari) { cbParsial.checked = false; wrapJamParsial.style.display = 'none'; }
});

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
  const isAdmin = AUTH.current().role === 'admin';

  document.getElementById('tbody-izin').innerHTML = potong.map(r => `
    <tr>
      <td>${r.tanggal.split('-').reverse().join('/')}</td>
      <td>${r.nama_guru}</td>
      <td><span class="badge badge-warning">${r.jenis}</span></td>
      <td>${r.keterangan || '-'}</td>
      <td>
        ${isAdmin
          ? `<div class="table-actions"><button onclick="hapusIzin(${r.id})"><i class="bi bi-trash"></i> Hapus</button></div>`
          : `<span style="font-size:11px; color:var(--muted);">Hubungi admin untuk koreksi</span>`
        }
      </td>
    </tr>`).join('') || '<tr><td colspan="5">Belum ada data izin</td></tr>';

  document.getElementById('info-halaman').textContent = `Halaman ${halamanAktif} dari ${totalHalaman} (${semuaIzin.length} data)`;
  document.getElementById('btn-prev').disabled = halamanAktif <= 1;
  document.getElementById('btn-next').disabled = halamanAktif >= totalHalaman;
}

document.getElementById('btn-prev').addEventListener('click', () => { halamanAktif--; renderTabelIzin(); });
document.getElementById('btn-next').addEventListener('click', () => { halamanAktif++; renderTabelIzin(); });

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

  for (const tanggal of daftarTanggal) {
    try {
      await DB.addIzin({ ...payload, tanggal });
      berhasil++;
    } catch (err) {
      gagal.push(`${tanggal}: ${err.message}`);
    }
  }

  if (gagal.length) {
    toast(`${berhasil} hari tersimpan, ${gagal.length} gagal. Cek Console untuk detail.`, 'warn');
    console.error('Gagal simpan izin:', gagal);
  } else {
    toast(`Data izin tersimpan untuk ${berhasil} hari.`);
  }

  form.reset();
  document.getElementById('izin-tanggal').value = tanggalLokal(new Date());
  wrapJamParsial.style.display = 'none';
  cbParsial.disabled = false;
  muatRiwayat();
});

async function hapusIzin(id) {
  if (AUTH.current().role !== 'admin') {
    toast('Hanya admin yang bisa menghapus data izin.', 'error');
    return;
  }
  const ya = await konfirmasi('Hapus data izin ini?');
  if (!ya) return;
  await DB.deleteIzin(id);
  toast('Data izin dihapus.');
  muatRiwayat();
}

document.getElementById('izin-tanggal').addEventListener('change', renderPresetJamPelajaran);
document.getElementById('izin-tanggal').value = tanggalLokal(new Date());
renderPresetJamPelajaran();
isiDropdownGuru();
muatRiwayat();