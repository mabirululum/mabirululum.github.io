AUTH.requireRole(['admin']);
const _namaAdmin1 = AUTH.current().nama || AUTH.current().username;
document.getElementById('nama-admin').textContent = _namaAdmin1;
document.getElementById('avatar-admin').textContent = _namaAdmin1.charAt(0).toUpperCase();

const HARI_LIST = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];

const tbody = document.getElementById('tbody-guru');
const form = document.getElementById('form-guru');
const inputId = document.getElementById('guru-id');
const inputNama = document.getElementById('guru-nama');
const inputNip = document.getElementById('guru-nip');
const tbodyJadwal = document.getElementById('tbody-jadwal-input');
const btnBatalEdit = document.getElementById('btn-batal-edit');

let dataGuruTerakhir = [];

// ---------- Form jadwal per hari ----------
function renderBarisJadwalInput() {
  tbodyJadwal.innerHTML = HARI_LIST.map(hari => `
    <tr>
      <td><input type="checkbox" class="cb-hari" data-hari="${hari}"></td>
      <td>${hari}</td>
      <td><input type="time" class="in-masuk" data-hari="${hari}" value="07:00" disabled></td>
      <td><input type="time" class="in-pulang" data-hari="${hari}" value="14:00" disabled></td>
      <td><input type="number" class="in-toleransi" data-hari="${hari}" value="15" min="0" style="width:70px;" disabled></td>
    </tr>`).join('');

  tbodyJadwal.querySelectorAll('.cb-hari').forEach(cb => {
    cb.addEventListener('change', () => {
      const hari = cb.dataset.hari;
      tbodyJadwal.querySelectorAll(`[data-hari="${hari}"]:not(.cb-hari)`)
        .forEach(el => el.disabled = !cb.checked);
    });
  });
}
renderBarisJadwalInput();

function ambilJadwalDariForm() {
  const jadwal = [];
  tbodyJadwal.querySelectorAll('.cb-hari:checked').forEach(cb => {
    const hari = cb.dataset.hari;
    jadwal.push({
      hari,
      jam_masuk: tbodyJadwal.querySelector(`.in-masuk[data-hari="${hari}"]`).value,
      jam_pulang: tbodyJadwal.querySelector(`.in-pulang[data-hari="${hari}"]`).value,
      toleransi_telat_menit: Number(tbodyJadwal.querySelector(`.in-toleransi[data-hari="${hari}"]`).value || 15),
    });
  });
  return jadwal;
}

function isiFormJadwal(jadwalGuru) {
  renderBarisJadwalInput();
  (jadwalGuru || []).forEach(j => {
    const cb = tbodyJadwal.querySelector(`.cb-hari[data-hari="${j.hari}"]`);
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));
    tbodyJadwal.querySelector(`.in-masuk[data-hari="${j.hari}"]`).value = j.jam_masuk.slice(0,5);
    tbodyJadwal.querySelector(`.in-pulang[data-hari="${j.hari}"]`).value = j.jam_pulang.slice(0,5);
    tbodyJadwal.querySelector(`.in-toleransi[data-hari="${j.hari}"]`).value = j.toleransi_telat_menit;
  });
}

function formatJadwalTampil(jadwalGuru) {
  if (!jadwalGuru || !jadwalGuru.length) return '<span style="color:var(--muted);">Belum ada jadwal</span>';
  return jadwalGuru.map(j =>
    `<span class="chip-hari">${j.hari}: ${j.jam_masuk.slice(0,5)}–${j.jam_pulang.slice(0,5)}</span>`
  ).join('');
}

// ---------- Tabel daftar guru ----------
// async function muatData() {
//   const data = await DB.listGuru();
//   dataGuruTerakhir = data;
//   tbody.innerHTML = data.map(g => `
//     <tr>
//       <td>${g.nama}</td>
//       <td>${g.nip || '-'}</td>
//       <td><code>${g.barcode_id}</code></td>
//       <td>${formatJadwalTampil(g.jadwal)}</td>
//       <td>${g.aktif ? 'Aktif' : 'Nonaktif'}</td>
//       <td>
//         <div class="table-actions">
//           <button onclick="cetakBarcode('${g.barcode_id}', '${g.nama.replace(/'/g, "\\'")}')"><i class="bi bi-qr-code-scan"></i> Cetak</button>
//           <button onclick="editGuru(${g.id})"><i class="bi bi-pencil"></i> Edit</button>
//           <button onclick="hapusGuru(${g.id})"><i class="bi bi-trash"></i> Hapus</button>
//         </div>
//       </td>
//     </tr>`).join('') || '<tr><td colspan="6">Belum ada data guru</td></tr>';
// }
// muatData();

// let dataGuruTerakhir = [];
let halamanGuru = 1;
const PER_HALAMAN_GURU = 10;

async function muatData() {
  dataGuruTerakhir = await DB.listGuru();
  halamanGuru = 1;
  renderTabelGuru();
}

function renderTabelGuru() {
  const totalHalaman = Math.max(1, Math.ceil(dataGuruTerakhir.length / PER_HALAMAN_GURU));
  if (halamanGuru > totalHalaman) halamanGuru = totalHalaman;

  const mulai = (halamanGuru - 1) * PER_HALAMAN_GURU;
  const potong = dataGuruTerakhir.slice(mulai, mulai + PER_HALAMAN_GURU);

  tbody.innerHTML = potong.map(g => `
    <tr>
      <td>${g.nama}</td>
      <td>${g.nip || '-'}</td>
      <td><code>${g.barcode_id}</code></td>
      <td>${formatJadwalTampil(g.jadwal)}</td>
      <td>${g.aktif ? 'Aktif' : 'Nonaktif'}</td>
      <td>
        <div class="table-actions">
          <button onclick="cetakBarcode('${g.barcode_id}', '${g.nama.replace(/'/g, "\\'")}')"><i class="bi bi-upc-scan"></i> Cetak</button>
          <button onclick="editGuru(${g.id})"><i class="bi bi-pencil"></i> Edit</button>
          <button onclick="hapusGuru(${g.id})"><i class="bi bi-trash"></i> Hapus</button>
        </div>
      </td>
    </tr>`).join('') || '<tr><td colspan="6">Belum ada data guru</td></tr>';

  document.getElementById('info-halaman-guru').textContent = `Halaman ${halamanGuru} dari ${totalHalaman} (${dataGuruTerakhir.length} guru)`;
  document.getElementById('btn-prev-guru').disabled = halamanGuru <= 1;
  document.getElementById('btn-next-guru').disabled = halamanGuru >= totalHalaman;
}

document.getElementById('btn-prev-guru').addEventListener('click', () => { halamanGuru--; renderTabelGuru(); });
document.getElementById('btn-next-guru').addEventListener('click', () => { halamanGuru++; renderTabelGuru(); });

muatData();

// ---------- Form submit ----------
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const jadwal = ambilJadwalDariForm();
  if (!jadwal.length) { toast('Pilih minimal 1 hari jadwal masuk', 'warn'); return; }

  const payload = { nama: inputNama.value.trim(), nip: inputNip.value.trim(), jadwal };

  try {
    if (inputId.value) {
      await DB.updateGuru({ id: Number(inputId.value), ...payload, aktif: 1 });
      toast('Data guru berhasil diperbarui.');
    } else {
      const hasil = await DB.addGuru(payload);
      toast(`Guru ditambahkan. Barcode: ${hasil.barcode_id}`);
    }
    form.reset();
    inputId.value = '';
    btnBatalEdit.style.display = 'none';
    renderBarisJadwalInput();
    muatData();
  } catch (err) {
    toast(err.message, 'error');
  }
});

btnBatalEdit.addEventListener('click', () => {
  form.reset();
  inputId.value = '';
  btnBatalEdit.style.display = 'none';
  renderBarisJadwalInput();
});

function editGuru(id) {
  const g = dataGuruTerakhir.find(x => x.id === id);
  if (!g) return;
  inputId.value = g.id;
  inputNama.value = g.nama;
  inputNip.value = g.nip || '';
  isiFormJadwal(g.jadwal);
  btnBatalEdit.style.display = 'inline-flex';
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function hapusGuru(id) {
  const ya = await konfirmasi('Hapus data guru ini? Riwayat presensinya juga akan terhapus.');
  if (!ya) return;
  try {
    await DB.deleteGuru(id);
    toast('Data guru dihapus.');
    muatData();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function cetakBarcode(kode, nama) {
  const win = window.open('', '_blank', 'width=340,height=380');
  if (!win) { toast('Popup diblokir browser. Izinkan popup untuk situs ini.', 'error'); return; }

  win.document.write(`
    <html><head><title>QR Code - ${nama}</title></head>
    <body style="text-align:center;font-family:sans-serif;">
      <h3>${nama}</h3>
      <div id="qr" style="display:inline-block;"></div>
      <p style="font-size:12px;">${kode}</p>
      <p id="loading-msg" style="font-size:12px;color:#888;">Memuat QR code...</p>
    </body></html>`);
  win.document.close();

  const script = win.document.createElement('script');
  script.src = new URL('../js/vendor/qrcode.min.js', window.location.href).href;
  script.onload = () => {
    new win.QRCode(win.document.getElementById('qr'), { text: kode, width: 200, height: 200 });
    win.document.getElementById('loading-msg').remove();
    win.print();
  };
  script.onerror = () => {
    win.document.getElementById('loading-msg').textContent =
      'File js/vendor/qrcode.min.js tidak ditemukan.';
  };
  win.document.body.appendChild(script);
}

// ---------- Import Excel ----------
document.getElementById('input-import-excel').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const hasilBox = document.getElementById('import-hasil');
  hasilBox.textContent = 'Membaca file...';

  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const rows = json.map(r => normalisasiBaris(r)).filter(r => r.nama);
    if (!rows.length) { hasilBox.textContent = 'Tidak ada baris valid ditemukan di file.'; return; }

    hasilBox.textContent = `Mengimpor ${rows.length} guru...`;
    const hasil = await DB.importGuru(rows);

    hasilBox.innerHTML = `<b>${hasil.berhasil} guru berhasil diimpor.</b>` +
      (hasil.gagal?.length ? `<br>Gagal: ${hasil.gagal.length} baris<ul>${hasil.gagal.map(g => `<li>${g}</li>`).join('')}</ul>` : '');

    toast(`${hasil.berhasil} guru berhasil diimpor.`);
    e.target.value = '';
    muatData();
  } catch (err) {
    hasilBox.textContent = 'Gagal membaca file: ' + err.message;
    toast('Gagal import Excel: ' + err.message, 'error');
  }
});

function normalisasiBaris(row) {
  const cari = (label) => {
    const key = Object.keys(row).find(k => k.trim().toLowerCase() === label);
    return key ? String(row[key]).trim() : '';
  };
  return {
    nama: cari('nama'),
    kode: cari('kode'),
    senin: cari('jadwal senin'),
    selasa: cari('jadwal selasa'),
    rabu: cari('jadwal rabu'),
    kamis: cari('jadwal kamis'),
    jumat: cari("jadwal jum'at") || cari('jadwal jumat'),
    sabtu: cari('jadwal sabtu'),
    toleransi: cari('toleransi'),
    status: cari('status'),
  };
}
