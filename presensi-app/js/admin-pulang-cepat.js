AUTH.requireRole(['admin']);
const _namaAdminPulang = AUTH.current().nama || AUTH.current().username;
document.getElementById('nama-admin').textContent = _namaAdminPulang;
document.getElementById('avatar-admin').textContent = _namaAdminPulang.charAt(0).toUpperCase();

const HARI_MAP_PULANG = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

let semuaKelasPulang = [];
let aktivasiHariIni = [];
let jadwalHariIniPerKelas = {}; // { kelas_id: '14:30:00' }

async function muatSemua() {
  [semuaKelasPulang, aktivasiHariIni] = await Promise.all([
    DB.listKelas(),
    DB.listAktivasiPulangHariIni(),
  ]);

  const hariIni = HARI_MAP_PULANG[new Date().getDay()];
  jadwalHariIniPerKelas = {};
  await Promise.all(semuaKelasPulang.map(async (k) => {
    const jadwal = await DB.listJadwalKelas(k.id);
    const jadwalHariIni = jadwal.find(j => j.hari === hariIni);
    jadwalHariIniPerKelas[k.id] = jadwalHariIni ? jadwalHariIni.jam_pulang.slice(0, 5) : null;
  }));

  renderGlobal();
  renderPerKelas();
}

function renderGlobal() {
  const globalAktif = aktivasiHariIni.find(a => !a.kelas_id);
  const wrap = document.getElementById('wrap-global');

  if (globalAktif) {
    wrap.innerHTML = `
      <span class="badge badge-hadir" style="font-size:13px; padding:6px 12px;">
        <i class="bi bi-check-circle"></i> Aktif sejak ${new Date(globalAktif.created_at).toLocaleTimeString('id-ID',{hour12:false})}
        (oleh ${globalAktif.diaktifkan_oleh || '-'})
      </span>
      <button type="button" class="btn btn-secondary btn-sm" style="margin-left:10px;" onclick="batalkan(${globalAktif.id})">
        <i class="bi bi-x-circle"></i> Batalkan
      </button>`;
  } else {
    wrap.innerHTML = `
      <button type="button" class="btn btn-danger" onclick="aktifkanGlobal()">
        <i class="bi bi-unlock"></i> Aktifkan untuk Semua Kelas
      </button>`;
  }
}

function renderPerKelas() {
  document.getElementById('tbody-per-kelas').innerHTML = semuaKelasPulang.map(k => {
    const aktif = aktivasiHariIni.find(a => a.kelas_id === k.id);
    const jamPulangHariIni = jadwalHariIniPerKelas[k.id];
    return `
      <tr>
        <td>${k.nama_kelas}</td>
        <td>${jamPulangHariIni ? jamPulangHariIni : '<span style="color:var(--muted);">Tidak ada jadwal hari ini</span>'}</td>
        <td>${aktif
          ? `<span class="badge badge-hadir">Aktif sejak ${new Date(aktif.created_at).toLocaleTimeString('id-ID',{hour12:false})}</span>`
          : '<span class="badge badge-warning">Belum aktif</span>'}
        </td>
        <td>
          ${aktif
            ? `<button type="button" class="btn btn-secondary btn-sm" onclick="batalkan(${aktif.id})"><i class="bi bi-x-circle"></i> Batalkan</button>`
            : `<button type="button" class="btn btn-sm" onclick="aktifkanKelas(${k.id})" ${!jamPulangHariIni ? 'disabled title="Kelas ini tidak ada jadwal hari ini"' : ''}><i class="bi bi-unlock"></i> Aktifkan</button>`}
        </td>
      </tr>`;
  }).join('') || '<tr><td colspan="4">Belum ada data kelas</td></tr>';
}

async function aktifkanGlobal() {
  const ya = await konfirmasi('Aktifkan presensi pulang cepat untuk SEMUA kelas hari ini?');
  if (!ya) return;
  try {
    await DB.aktifkanPulangCepat(null);
    toast('Presensi pulang cepat diaktifkan untuk semua kelas.');
    muatSemua();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function aktifkanKelas(kelasId) {
  const namaKelas = semuaKelasPulang.find(k => k.id === kelasId)?.nama_kelas || '';
  const ya = await konfirmasi(`Aktifkan presensi pulang cepat untuk kelas ${namaKelas} hari ini?`);
  if (!ya) return;
  try {
    await DB.aktifkanPulangCepat(kelasId);
    toast(`Presensi pulang cepat diaktifkan untuk kelas ${namaKelas}.`);
    muatSemua();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function batalkan(id) {
  const ya = await konfirmasi('Batalkan aktivasi ini?');
  if (!ya) return;
  try {
    await DB.batalkanPulangCepat(id);
    toast('Aktivasi dibatalkan.');
    muatSemua();
  } catch (err) {
    toast(err.message, 'error');
  }
}

muatSemua();