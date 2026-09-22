AUTH.requireRole(['admin']);
const _namaAdminSiswa = AUTH.current().nama || AUTH.current().username;
document.getElementById('nama-admin').textContent = _namaAdminSiswa;
document.getElementById('avatar-admin').textContent = _namaAdminSiswa.charAt(0).toUpperCase();

const formWrapSiswa = document.getElementById('form-siswa-wrap');
const btnToggleFormSiswa = document.getElementById('btn-toggle-form-siswa');
const form = document.getElementById('form-siswa');
const inputId = document.getElementById('siswa-id');
const inputNama = document.getElementById('siswa-nama');
const inputNis = document.getElementById('siswa-nis');
const selectKelas = document.getElementById('siswa-kelas');
const btnBatalEdit = document.getElementById('btn-batal-edit-siswa');

let dataSiswaTerakhir = [];
let halamanSiswa = 1;
const PER_HALAMAN_SISWA = 10;

function bukaFormSiswa() {
  formWrapSiswa.style.display = 'block';
  btnToggleFormSiswa.innerHTML = '<i class="bi bi-dash-lg"></i> Tutup Form';
}
function tutupFormSiswa() {
  formWrapSiswa.style.display = 'none';
  btnToggleFormSiswa.innerHTML = '<i class="bi bi-plus-lg"></i> Tambah Siswa';
}
btnToggleFormSiswa.addEventListener('click', () => {
  formWrapSiswa.style.display === 'none' ? bukaFormSiswa() : tutupFormSiswa();
});

async function isiDropdownKelas() {
  const kelasList = await DB.listKelas();
  selectKelas.innerHTML = kelasList.map(k => `<option value="${k.id}">${k.nama_kelas}</option>`).join('');
}

// async function muatData() {
//   dataSiswaTerakhir = await DB.listSiswa();
//   halamanSiswa = 1;
//   renderTabelSiswa();
// }

const selectFilterStatus = document.getElementById('filter-status-siswa');
const selectFilterTahun = document.getElementById('filter-tahun-siswa');
const theadSiswa = document.getElementById('thead-siswa');

async function muatData() {
  const status = selectFilterStatus.value;
  const tahun = selectFilterTahun.value;
  dataSiswaTerakhir = await DB.listSiswa(status, tahun);
  halamanSiswa = 1;
  renderHeaderTabel(status);
  renderTabelSiswa(status);
}

function renderHeaderTabel(status) {
  if (status === 'aktif') {
    theadSiswa.innerHTML = '<tr><th>NIS</th><th>Nama</th><th>Kelas</th><th>Tahun Masuk</th><th>Barcode</th><th>Status</th><th>Aksi</th></tr>';
  } else if (status === 'lulus') {
    theadSiswa.innerHTML = '<tr><th>NIS</th><th>Nama</th><th>Kelas Terakhir</th><th>Tahun Lulus</th><th>Barcode</th></tr>';
  } else {
    theadSiswa.innerHTML = '<tr><th>NIS</th><th>Nama</th><th>Kelas Terakhir</th><th>Tahun</th><th>Keterangan</th><th>Barcode</th></tr>';
  }
}

async function isiDropdownTahun() {
  const semuaLulusPindah = await DB.listSiswa('lulus');
  const semuaPindah = await DB.listSiswa('pindah');
  const tahunSet = new Set([...semuaLulusPindah, ...semuaPindah].map(s => s.tahun_status).filter(Boolean));
  const tahunList = [...tahunSet].sort((a, b) => b - a);
  selectFilterTahun.innerHTML = '<option value="">Semua Tahun</option>' +
    tahunList.map(t => `<option value="${t}">${t}</option>`).join('');
}

selectFilterStatus.addEventListener('change', muatData);
selectFilterTahun.addEventListener('change', muatData);

// function renderTabelSiswa() {
//   const totalHalaman = Math.max(1, Math.ceil(dataSiswaTerakhir.length / PER_HALAMAN_SISWA));
//   if (halamanSiswa > totalHalaman) halamanSiswa = totalHalaman;
//   const mulai = (halamanSiswa - 1) * PER_HALAMAN_SISWA;
//   const potong = dataSiswaTerakhir.slice(mulai, mulai + PER_HALAMAN_SISWA);

//   document.getElementById('tbody-siswa').innerHTML = potong.map(s => `
//     <tr>
//       <td>${s.nama}</td>
//       <td>${s.nis || '-'}</td>
//       <td>${s.nama_kelas}</td>
//       <td><code>${s.barcode_id}</code></td>
//       <td>${s.aktif ? 'Aktif' : 'Nonaktif'}</td>
//       <td>
//         <div class="table-actions">
//           <button onclick="cetakBarcodeSiswa('${s.barcode_id}', '${s.nama.replace(/'/g, "\\'")}')"><i class="bi bi-upc-scan"></i> Cetak</button>
//           <button onclick="editSiswa(${s.id})"><i class="bi bi-pencil"></i> Edit</button>
//           <button onclick="hapusSiswa(${s.id})"><i class="bi bi-trash"></i> Hapus</button>
//         </div>
//       </td>
//     </tr>`).join('') || '<tr><td colspan="6">Belum ada data siswa</td></tr>';

//   document.getElementById('info-halaman-siswa').textContent = `Halaman ${halamanSiswa} dari ${totalHalaman} (${dataSiswaTerakhir.length} siswa)`;
//   document.getElementById('btn-prev-siswa').disabled = halamanSiswa <= 1;
//   document.getElementById('btn-next-siswa').disabled = halamanSiswa >= totalHalaman;
// }

function renderTabelSiswa(status) {
  const totalHalaman = Math.max(1, Math.ceil(dataSiswaTerakhir.length / PER_HALAMAN_SISWA));
  if (halamanSiswa > totalHalaman) halamanSiswa = totalHalaman;
  const mulai = (halamanSiswa - 1) * PER_HALAMAN_SISWA;
  const potong = dataSiswaTerakhir.slice(mulai, mulai + PER_HALAMAN_SISWA);

  let html;
  if (status === 'aktif') {
    html = potong.map(s => `
      <tr>
        <td>${s.nis || '-'}</td>
        <td>${s.nama}</td>
        <td>${s.nama_kelas}</td>
        <td>${s.tahun_masuk || '-'}</td>
        <td><code>${s.barcode_id}</code></td>
        <td>${s.aktif ? 'Aktif' : 'Nonaktif'}</td>
        <td>
          <div class="table-actions">
            <button onclick="cetakBarcodeSiswa('${s.barcode_id}', '${s.nama.replace(/'/g, "\\'")}')"><i class="bi bi-upc-scan"></i> Cetak</button>
            <button onclick="editSiswa(${s.id})"><i class="bi bi-pencil"></i> Edit</button>
            <button onclick="hapusSiswa(${s.id})"><i class="bi bi-trash"></i> Hapus</button>
          </div>
        </td>
      </tr>`).join('') || '<tr><td colspan="6">Belum ada data siswa</td></tr>';
  } else if (status === 'lulus') {
    html = potong.map(s => `
      <tr>
        <td>${s.nis || '-'}</td>
        <td>${s.nama}</td>
        <td>${s.nama_kelas}</td>
        <td>${s.tahun_status || '-'}</td>
        <td><code>${s.barcode_id}</code></td>
      </tr>`).join('') || '<tr><td colspan="5">Belum ada siswa lulus untuk filter ini</td></tr>';
  } else {
    html = potong.map(s => `
      <tr>
        <td>${s.nis || '-'}</td>
        <td>${s.nama}</td>
        <td>${s.nama_kelas}</td>
        <td>${s.tahun_status || '-'}</td>
        <td>${s.keterangan_status || '-'}</td>
        <td><code>${s.barcode_id}</code></td>
      </tr>`).join('') || '<tr><td colspan="7">Belum ada siswa pindah untuk filter ini</td></tr>';
  }
  document.getElementById('tbody-siswa').innerHTML = html;

  document.getElementById('info-halaman-siswa').textContent = `Halaman ${halamanSiswa} dari ${totalHalaman} (${dataSiswaTerakhir.length} siswa)`;
  document.getElementById('btn-prev-siswa').disabled = halamanSiswa <= 1;
  document.getElementById('btn-next-siswa').disabled = halamanSiswa >= totalHalaman;
}

// document.getElementById('btn-prev-siswa').addEventListener('click', () => { halamanSiswa--; renderTabelSiswa(); });
// document.getElementById('btn-next-siswa').addEventListener('click', () => { halamanSiswa++; renderTabelSiswa(); });
document.getElementById('btn-prev-siswa').addEventListener('click', () => { halamanSiswa--; renderTabelSiswa(selectFilterStatus.value); });
document.getElementById('btn-next-siswa').addEventListener('click', () => { halamanSiswa++; renderTabelSiswa(selectFilterStatus.value); });

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = { nama: inputNama.value.trim(), nis: inputNis.value.trim(), kelas_id: Number(selectKelas.value) };

  try {
    if (inputId.value) {
      await DB.updateSiswa({ id: Number(inputId.value), ...payload, aktif: 1 });
      toast('Data siswa berhasil diperbarui.');
    } else {
      const hasil = await DB.addSiswa(payload);
      toast(`Siswa ditambahkan. Barcode: ${hasil.barcode_id}`);
    }
    form.reset();
    inputId.value = '';
    btnBatalEdit.style.display = 'none';
    tutupFormSiswa();
    muatData();
  } catch (err) {
    toast(err.message, 'error');
  }
});

btnBatalEdit.addEventListener('click', () => {
  form.reset();
  inputId.value = '';
  btnBatalEdit.style.display = 'none';
  tutupFormSiswa();
});

function editSiswa(id) {
  const s = dataSiswaTerakhir.find(x => x.id === id);
  if (!s) return;
  bukaFormSiswa();
  inputId.value = s.id;
  inputNama.value = s.nama;
  inputNis.value = s.nis || '';
  selectKelas.value = s.kelas_id;
  btnBatalEdit.style.display = 'inline-flex';
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function hapusSiswa(id) {
  const ya = await konfirmasi('Hapus data siswa ini? Riwayat presensinya juga akan terhapus.');
  if (!ya) return;
  try {
    await DB.deleteSiswa(id);
    toast('Data siswa dihapus.');
    muatData();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function cetakBarcodeSiswa(kode, nama) {
  const win = window.open('', '_blank', 'width=400,height=320');
  if (!win) { toast('Popup diblokir browser. Izinkan popup untuk situs ini.', 'error'); return; }

  win.document.write(`
    <html><head><title>Barcode - ${nama}</title></head>
    <body style="text-align:center;font-family:sans-serif;">
      <h3>${nama}</h3>
      <svg id="bc"></svg>
      <p style="font-size:12px;color:#888;">Memuat barcode...</p>
    </body></html>`);
  win.document.close();

  const script = win.document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/JsBarcode/3.11.5/JsBarcode.all.min.js';
  script.onload = () => {
    win.JsBarcode(win.document.getElementById('bc'), kode, { format: 'CODE128', displayValue: true });
    win.document.querySelector('p').remove();
    win.print();
  };
  script.onerror = () => {
    win.document.querySelector('p').textContent = 'Gagal memuat library barcode. Cek koneksi internet.';
  };
  win.document.body.appendChild(script);
}

document.getElementById('input-import-excel-siswa').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const hasilBox = document.getElementById('import-hasil-siswa');
  hasilBox.textContent = 'Membaca file...';

  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const rows = json.map(r => {
      const cari = (label) => {
        const key = Object.keys(r).find(k => k.trim().toLowerCase() === label);
        return key ? String(r[key]).trim() : '';
      };
      return {
        nama: cari('nama'),
        nis: cari('nis'),
        kelas: cari('kelas'),
        kode: cari('kode'),
        tahun_masuk: cari('tahun_masuk') || cari('tahun masuk'),
      };
    }).filter(r => r.nama);

    if (!rows.length) { hasilBox.textContent = 'Tidak ada baris valid ditemukan di file.'; return; }

    hasilBox.textContent = `Mengimpor ${rows.length} siswa...`;
    const hasil = await DB.importSiswa(rows);

    hasilBox.innerHTML = `<b>${hasil.berhasil} siswa berhasil diimpor.</b>` +
      (hasil.gagal?.length ? `<br>Gagal: ${hasil.gagal.length} baris<ul>${hasil.gagal.map(g => `<li>${g}</li>`).join('')}</ul>` : '');

    toast(`${hasil.berhasil} siswa berhasil diimpor.`);
    e.target.value = '';
    isiDropdownKelas();
    muatData();
  } catch (err) {
    hasilBox.textContent = 'Gagal membaca file: ' + err.message;
    toast('Gagal import Excel: ' + err.message, 'error');
  }
});

isiDropdownKelas();
isiDropdownTahun();
muatData();