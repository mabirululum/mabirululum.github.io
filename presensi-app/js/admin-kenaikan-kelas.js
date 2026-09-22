AUTH.requireRole(['admin']);
const _namaAdminNaik = AUTH.current().nama || AUTH.current().username;
document.getElementById('nama-admin').textContent = _namaAdminNaik;
document.getElementById('avatar-admin').textContent = _namaAdminNaik.charAt(0).toUpperCase();

const selectKelasAsal = document.getElementById('filter-kelas-asal');
const cardTabel = document.getElementById('card-tabel-kenaikan');
const tbody = document.getElementById('tbody-kenaikan');
const cbPilihSemua = document.getElementById('cb-pilih-semua');
const selectBulkTarget = document.getElementById('bulk-target');

let semuaKelas = [];
let siswaKelasIni = [];

const TAHUN_SEKARANG = new Date().getFullYear();

async function isiDropdownKelasAsal() {
  semuaKelas = await DB.listKelas();
  selectKelasAsal.innerHTML = '<option value="">- Pilih Kelas -</option>' +
    semuaKelas.map(k => `<option value="${k.id}">${k.nama_kelas}</option>`).join('');
}

function opsiTujuan(kelasAsalId, selected = '') {
  const opsiKelas = semuaKelas
    .filter(k => k.id !== Number(kelasAsalId))
    .map(k => `<option value="kelas_${k.id}" ${selected === `kelas_${k.id}` ? 'selected' : ''}>${k.nama_kelas}</option>`)
    .join('');
  return `
    <option value="">- Pilih Tujuan -</option>
    <option value="tinggal" ${selected === 'tinggal' ? 'selected' : ''}>Tinggal Kelas (tetap di sini)</option>
    ${opsiKelas}
    <option value="lulus" ${selected === 'lulus' ? 'selected' : ''}>Lulus</option>
    <option value="pindah" ${selected === 'pindah' ? 'selected' : ''}>Pindah / Keluar</option>
  `;
}

async function muatSiswaKelasAsal() {
  const kelasAsalId = selectKelasAsal.value;
  if (!kelasAsalId) { cardTabel.style.display = 'none'; return; }

  const semuaSiswa = await DB.listSiswa();
  siswaKelasIni = semuaSiswa.filter(s => s.kelas_id === Number(kelasAsalId));

  if (!siswaKelasIni.length) {
    toast('Tidak ada siswa aktif di kelas ini.', 'warn');
    cardTabel.style.display = 'none';
    return;
  }

  selectBulkTarget.innerHTML = opsiTujuan(kelasAsalId);

  tbody.innerHTML = siswaKelasIni.map(s => `
    <tr data-siswa-id="${s.id}">
      <td><input type="checkbox" class="cb-siswa-naik"></td>
      <td>${s.nama}</td>
      <td>
        <select class="select-tujuan" data-siswa-id="${s.id}">
          ${opsiTujuan(kelasAsalId)}
        </select>
      </td>
      <td><input type="number" class="input-tahun" value="${TAHUN_SEKARANG}" style="width:80px; display:none;"></td>
      <td><input type="text" class="input-keterangan" placeholder="Alasan (opsional)" style="display:none;"></td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.select-tujuan').forEach(sel => {
    sel.addEventListener('change', () => {
      const row = sel.closest('tr');
      const inputTahun = row.querySelector('.input-tahun');
      const inputKet = row.querySelector('.input-keterangan');
      inputTahun.style.display = ['lulus', 'pindah'].includes(sel.value) ? 'inline-block' : 'none';
      inputKet.style.display = sel.value === 'pindah' ? 'inline-block' : 'none';
    });
  });

  cardTabel.style.display = 'block';
}
selectKelasAsal.addEventListener('change', muatSiswaKelasAsal);

cbPilihSemua.addEventListener('change', () => {
  tbody.querySelectorAll('.cb-siswa-naik').forEach(cb => cb.checked = cbPilihSemua.checked);
});

document.getElementById('btn-terapkan-bulk').addEventListener('click', () => {
  const target = selectBulkTarget.value;
  if (!target) { toast('Pilih tujuan bulk terlebih dahulu.', 'warn'); return; }

  tbody.querySelectorAll('tr').forEach(row => {
    const cb = row.querySelector('.cb-siswa-naik');
    if (!cb.checked) return;
    const sel = row.querySelector('.select-tujuan');
    sel.value = target;
    sel.dispatchEvent(new Event('change'));
  });
  toast('Tujuan diterapkan ke siswa yang dicentang.');
});

document.getElementById('btn-proses-kenaikan').addEventListener('click', async () => {
  const daftarPerubahan = [];
  const barisTanpaTujuan = [];

  tbody.querySelectorAll('tr').forEach(row => {
    const cb = row.querySelector('.cb-siswa-naik');
    if (!cb.checked) return;

    const siswaId = Number(row.dataset.siswaId);
    const tujuan = row.querySelector('.select-tujuan').value;
    const namaSiswa = siswaKelasIni.find(s => s.id === siswaId)?.nama || `ID ${siswaId}`;

    if (!tujuan) { barisTanpaTujuan.push(namaSiswa); return; }

    if (tujuan === 'tinggal') {
      daftarPerubahan.push({ siswa_id: siswaId, aksi: 'tinggal_kelas' });
    } else if (tujuan === 'lulus') {
      const tahun = Number(row.querySelector('.input-tahun').value) || TAHUN_SEKARANG;
      daftarPerubahan.push({ siswa_id: siswaId, aksi: 'lulus', tahun });
    } else if (tujuan === 'pindah') {
      const tahun = Number(row.querySelector('.input-tahun').value) || TAHUN_SEKARANG;
      const keterangan = row.querySelector('.input-keterangan').value.trim();
      daftarPerubahan.push({ siswa_id: siswaId, aksi: 'pindah', tahun, keterangan });
    } else if (tujuan.startsWith('kelas_')) {
      const kelasTujuanId = Number(tujuan.replace('kelas_', ''));
      daftarPerubahan.push({ siswa_id: siswaId, aksi: 'pindah_kelas', kelas_tujuan_id: kelasTujuanId });
    }
  });

  if (barisTanpaTujuan.length) {
    toast(`Lengkapi tujuan untuk: ${barisTanpaTujuan.join(', ')}`, 'warn');
    return;
  }
  if (!daftarPerubahan.length) {
    toast('Belum ada siswa yang dicentang untuk diproses.', 'warn');
    return;
  }

  const ya = await konfirmasi(`Proses perubahan untuk ${daftarPerubahan.length} siswa? Aksi ini akan langsung mengubah data.`);
  if (!ya) return;

  try {
    const hasil = await DB.prosesKenaikanKelas(daftarPerubahan);
    if (hasil.gagal?.length) {
      toast(`${hasil.berhasil} berhasil, ${hasil.gagal.length} gagal. Cek Console.`, 'warn');
      console.error('Gagal proses kenaikan kelas:', hasil.gagal);
    } else {
      toast(`${hasil.berhasil} siswa berhasil diproses.`);
    }
    muatSiswaKelasAsal(); // refresh tabel (siswa yang sudah diproses akan hilang karena kelas_id/status berubah)
  } catch (err) {
    toast(err.message, 'error');
  }
});

isiDropdownKelasAsal();