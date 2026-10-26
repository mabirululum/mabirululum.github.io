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

// Palet warna per tingkat rombel kelas
// Kelas X  : Hijau (variatif antar kelas)
// Kelas XI : Kuning / Emas / Jingga (variatif antar kelas)
// Kelas XII: Pink / Rose / Magenta (variatif antar kelas)
const PALET_WARNA = {
  X: [
    {
      borderTop: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.06)',
      badgeBg: '#d1fae5',
      badgeColor: '#065f46',
      iconGradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
      numColor: '#047857',
      tagText: 'Kelas X'
    },
    {
      borderTop: '#14b8a6',
      bgGlow: 'rgba(20, 184, 166, 0.06)',
      badgeBg: '#ccfbf1',
      badgeColor: '#0f766e',
      iconGradient: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
      numColor: '#0f766e',
      tagText: 'Kelas X'
    },
    {
      borderTop: '#22c55e',
      bgGlow: 'rgba(34, 197, 94, 0.06)',
      badgeBg: '#dcfce7',
      badgeColor: '#15803d',
      iconGradient: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
      numColor: '#15803d',
      tagText: 'Kelas X'
    },
    {
      borderTop: '#059669',
      bgGlow: 'rgba(5, 150, 105, 0.06)',
      badgeBg: '#ecfdf5',
      badgeColor: '#047857',
      iconGradient: 'linear-gradient(135deg, #34d399 0%, #065f46 100%)',
      numColor: '#065f46',
      tagText: 'Kelas X'
    },
    {
      borderTop: '#65a30d',
      bgGlow: 'rgba(101, 163, 13, 0.06)',
      badgeBg: '#f7fee7',
      badgeColor: '#3f6212',
      iconGradient: 'linear-gradient(135deg, #84cc16 0%, #4d7c0f 100%)',
      numColor: '#4d7c0f',
      tagText: 'Kelas X'
    },
    {
      borderTop: '#2f6f4f',
      bgGlow: 'rgba(47, 111, 79, 0.06)',
      badgeBg: '#e6f3ec',
      badgeColor: '#1c4531',
      iconGradient: 'linear-gradient(135deg, #3d8c65 0%, #1c4531 100%)',
      numColor: '#1c4531',
      tagText: 'Kelas X'
    }
  ],
  XI: [
    {
      borderTop: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.06)',
      badgeBg: '#fef3c7',
      badgeColor: '#92400e',
      iconGradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
      numColor: '#b45309',
      tagText: 'Kelas XI'
    },
    {
      borderTop: '#eab308',
      bgGlow: 'rgba(234, 179, 8, 0.06)',
      badgeBg: '#fef9c3',
      badgeColor: '#854d0e',
      iconGradient: 'linear-gradient(135deg, #facc15 0%, #a16207 100%)',
      numColor: '#a16207',
      tagText: 'Kelas XI'
    },
    {
      borderTop: '#f97316',
      bgGlow: 'rgba(249, 115, 22, 0.06)',
      badgeBg: '#ffedd5',
      badgeColor: '#9a3412',
      iconGradient: 'linear-gradient(135deg, #fb923c 0%, #c2410c 100%)',
      numColor: '#c2410c',
      tagText: 'Kelas XI'
    },
    {
      borderTop: '#d97706',
      bgGlow: 'rgba(217, 119, 6, 0.06)',
      badgeBg: '#fffbeb',
      badgeColor: '#78350f',
      iconGradient: 'linear-gradient(135deg, #fbbf24 0%, #78350f 100%)',
      numColor: '#78350f',
      tagText: 'Kelas XI'
    },
    {
      borderTop: '#ca8a04',
      bgGlow: 'rgba(202, 138, 4, 0.06)',
      badgeBg: '#fefce8',
      badgeColor: '#713f12',
      iconGradient: 'linear-gradient(135deg, #fde047 0%, #854d0e 100%)',
      numColor: '#713f12',
      tagText: 'Kelas XI'
    },
    {
      borderTop: '#b45309',
      bgGlow: 'rgba(180, 83, 9, 0.06)',
      badgeBg: '#fef3c7',
      badgeColor: '#78350f',
      iconGradient: 'linear-gradient(135deg, #d97706 0%, #78350f 100%)',
      numColor: '#78350f',
      tagText: 'Kelas XI'
    }
  ],
  XII: [
    {
      borderTop: '#f43f5e',
      bgGlow: 'rgba(244, 63, 94, 0.06)',
      badgeBg: '#ffe4e6',
      badgeColor: '#9f1239',
      iconGradient: 'linear-gradient(135deg, #fb7185 0%, #be123c 100%)',
      numColor: '#be123c',
      tagText: 'Kelas XII'
    },
    {
      borderTop: '#d946ef',
      bgGlow: 'rgba(217, 70, 239, 0.06)',
      badgeBg: '#fae8ff',
      badgeColor: '#701a75',
      iconGradient: 'linear-gradient(135deg, #e879f9 0%, #86198f 100%)',
      numColor: '#86198f',
      tagText: 'Kelas XII'
    },
    {
      borderTop: '#ec4899',
      bgGlow: 'rgba(236, 72, 153, 0.06)',
      badgeBg: '#fce7f3',
      badgeColor: '#831843',
      iconGradient: 'linear-gradient(135deg, #f472b6 0%, #9d174d 100%)',
      numColor: '#9d174d',
      tagText: 'Kelas XII'
    },
    {
      borderTop: '#fb7185',
      bgGlow: 'rgba(251, 113, 133, 0.06)',
      badgeBg: '#fff1f2',
      badgeColor: '#881337',
      iconGradient: 'linear-gradient(135deg, #fda4af 0%, #9f1239 100%)',
      numColor: '#9f1239',
      tagText: 'Kelas XII'
    },
    {
      borderTop: '#e11d48',
      bgGlow: 'rgba(225, 29, 72, 0.06)',
      badgeBg: '#ffe4e6',
      badgeColor: '#4c0519',
      iconGradient: 'linear-gradient(135deg, #f43f5e 0%, #4c0519 100%)',
      numColor: '#881337',
      tagText: 'Kelas XII'
    },
    {
      borderTop: '#db2777',
      bgGlow: 'rgba(219, 39, 119, 0.06)',
      badgeBg: '#fdf2f8',
      badgeColor: '#701a75',
      iconGradient: 'linear-gradient(135deg, #fbcfe8 0%, #9d174d 100%)',
      numColor: '#9d174d',
      tagText: 'Kelas XII'
    }
  ],
  LAIN: [
    {
      borderTop: '#6366f1',
      bgGlow: 'rgba(99, 102, 241, 0.06)',
      badgeBg: '#e0e7ff',
      badgeColor: '#3730a3',
      iconGradient: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
      numColor: '#3730a3',
      tagText: 'Kelas'
    }
  ]
};

function deteksiTingkat(namaKelas) {
  const nama = String(namaKelas || '').trim().toUpperCase();
  if (/\bXII\b|^XII[\s\-_]/.test(nama) || /\b12\b|^12[\s\-_]/.test(nama) || nama.startsWith('XII')) return 'XII';
  if (/\bXI\b|^XI[\s\-_]/.test(nama) || /\b11\b|^11[\s\-_]/.test(nama) || nama.startsWith('XI')) return 'XI';
  if (/\bX\b|^X[\s\-_]/.test(nama) || /\b10\b|^10[\s\-_]/.test(nama) || nama.startsWith('X')) return 'X';
  return 'LAIN';
}

function renderKartuJumlahSiswa(kelasList, semuaSiswa) {
  const container = document.getElementById('kelas-stat-grid');
  if (!container) return;

  if (!kelasList || !kelasList.length) {
    container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:24px; color:var(--muted); font-size:13px;">Belum ada data rombongan belajar.</div>';
    const badgeTotal = document.getElementById('total-siswa-badge');
    if (badgeTotal) badgeTotal.textContent = 'Total: 0 Siswa';
    return;
  }

  const countPerKelas = {};
  (semuaSiswa || []).forEach(s => {
    if (s.kelas_id) {
      countPerKelas[s.kelas_id] = (countPerKelas[s.kelas_id] || 0) + 1;
    }
  });

  const totalSiswaSemua = (semuaSiswa || []).length;
  const badgeTotal = document.getElementById('total-siswa-badge');
  if (badgeTotal) badgeTotal.textContent = `Total: ${totalSiswaSemua} Siswa Aktif`;

  const counters = { X: 0, XI: 0, XII: 0, LAIN: 0 };

  const html = kelasList.map(k => {
    const tingkat = deteksiTingkat(k.nama_kelas);
    const paletTingkat = PALET_WARNA[tingkat] || PALET_WARNA.LAIN;
    const varianIndex = counters[tingkat] % paletTingkat.length;
    counters[tingkat]++;
    const palet = paletTingkat[varianIndex];

    const jumlahSiswa = countPerKelas[k.id] || 0;
    const waliText = k.nama_wali_kelas ? k.nama_wali_kelas : 'Belum ditentukan';

    return `
      <div class="kelas-stat-card" style="border-top: 4px solid ${palet.borderTop}; background: linear-gradient(180deg, #ffffff 65%, ${palet.bgGlow} 100%);">
        <div class="kelas-stat-header">
          <span class="kelas-stat-badge" style="background: ${palet.badgeBg}; color: ${palet.badgeColor};">
            ${palet.tagText}
          </span>
          <div class="kelas-stat-icon" style="background: ${palet.iconGradient}; box-shadow: 0 4px 12px ${palet.bgGlow.replace('0.06', '0.28')};">
            <i class="bi bi-mortarboard-fill"></i>
          </div>
        </div>
        <div>
          <div class="kelas-stat-name">${k.nama_kelas}</div>
          <div class="kelas-stat-count" style="color: ${palet.numColor};">
            ${jumlahSiswa} <small>Siswa</small>
          </div>
        </div>
        <div class="kelas-stat-wali" title="Wali Kelas: ${waliText}">
          <i class="bi bi-person-badge"></i>
          <span>${waliText}</span>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

async function muatData() {
  try {
    const [kelasList, semuaSiswa] = await Promise.all([
      DB.listKelas(),
      DB.listSiswa('aktif').catch(() => DB.listSiswa()).catch(() => [])
    ]);
    dataKelasTerakhir = await Promise.all(kelasList.map(async k => ({
      ...k, jadwal: await DB.listJadwalKelas(k.id),
    })));
    halamanKelas = 1;
    renderTabelKelas();
    renderKartuJumlahSiswa(dataKelasTerakhir, semuaSiswa);
  } catch (err) {
    console.error('Gagal memuat data kelas:', err);
    toast('Gagal memuat data kelas: ' + err.message, 'error');
  }
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