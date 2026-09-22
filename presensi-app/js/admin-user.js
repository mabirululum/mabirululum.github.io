AUTH.requireRole(['admin']);
const _namaAdminUser = AUTH.current().nama || AUTH.current().username;
document.getElementById('nama-admin').textContent = _namaAdminUser;
document.getElementById('avatar-admin').textContent = _namaAdminUser.charAt(0).toUpperCase();

const tbody = document.getElementById('tbody-user');
const form = document.getElementById('form-user');
const btnBatalEdit = document.getElementById('btn-batal-edit-user');
const selectRole = document.getElementById('user-role');
const wrapWaliKelas = document.getElementById('wrap-wali-kelas');
const selectKelas = document.getElementById('user-kelas');

const f = {
  id: document.getElementById('user-id'),
  username: document.getElementById('user-username'),
  nama: document.getElementById('user-nama'),
  password: document.getElementById('user-password'),
  barcode: document.getElementById('user-barcode'),
};

let dataUserTerakhir = [];
let dataKelasUntukDropdown = [];

const ROLE_LABEL = { admin: 'Admin', piket: 'Guru Piket', wali_kelas: 'Wali Kelas' };

function toggleWrapKelas() {
  wrapWaliKelas.style.display = selectRole.value === 'wali_kelas' ? 'block' : 'none';
}
selectRole.addEventListener('change', toggleWrapKelas);

async function isiDropdownKelasUser() {
  dataKelasUntukDropdown = await DB.listKelas();
  selectKelas.innerHTML = dataKelasUntukDropdown.map(k => `<option value="${k.id}">${k.nama_kelas}</option>`).join('');
}

async function muatData() {
  dataUserTerakhir = await DB.listUsers();
  tbody.innerHTML = dataUserTerakhir.map(u => {
    const namaKelas = u.kelas_id ? (dataKelasUntukDropdown.find(k => k.id === u.kelas_id)?.nama_kelas || '-') : '-';
    return `
    <tr>
      <td>${u.username}</td>
      <td>${u.nama || '-'}</td>
      <td>${ROLE_LABEL[u.role] || u.role}</td>
      <td>${namaKelas}</td>
      <td>${u.barcode_id || '-'}</td>
      <td>${u.aktif ? 'Aktif' : 'Nonaktif'}</td>
      <td>
        <div class="table-actions">
          <button onclick="editUser(${u.id})"><i class="bi bi-pencil"></i> Edit</button>
          <button onclick="hapusUser(${u.id})"><i class="bi bi-trash"></i> Hapus</button>
        </div>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="7">Belum ada data user</td></tr>';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    username: f.username.value.trim(),
    nama: f.nama.value.trim(),
    barcode_id: f.barcode.value.trim() || null,
    password: f.password.value,
    role: selectRole.value,
    kelas_id: selectRole.value === 'wali_kelas' ? Number(selectKelas.value) : null,
  };

  try {
    if (f.id.value) {
      await DB.updateUser({ id: Number(f.id.value), ...payload, aktif: 1 });
      toast('Data user berhasil diperbarui.');
    } else {
      if (!payload.password) { toast('Password wajib diisi untuk user baru', 'warn'); return; }
      await DB.addUser(payload);
      toast('User baru berhasil ditambahkan.');
    }
    form.reset();
    f.id.value = '';
    btnBatalEdit.style.display = 'none';
    toggleWrapKelas();
    muatData();
  } catch (err) {
    toast(err.message, 'error');
  }
});

btnBatalEdit.addEventListener('click', () => {
  form.reset();
  f.id.value = '';
  btnBatalEdit.style.display = 'none';
  toggleWrapKelas();
});

function editUser(id) {
  const u = dataUserTerakhir.find(x => x.id === id);
  if (!u) return;
  f.id.value = u.id;
  f.username.value = u.username;
  f.nama.value = u.nama || '';
  f.barcode.value = u.barcode_id || '';
  f.password.value = '';
  selectRole.value = u.role || 'admin';
  if (u.kelas_id) selectKelas.value = u.kelas_id;
  toggleWrapKelas();
  btnBatalEdit.style.display = 'inline-flex';
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function hapusUser(id) {
  const ya = await konfirmasi('Hapus user ini? Akses login untuk user ini akan hilang.');
  if (!ya) return;
  try {
    await DB.deleteUser(id);
    toast('User dihapus.');
    muatData();
  } catch (err) {
    toast(err.message, 'error');
  }
}

(async () => {
  await isiDropdownKelasUser();
  await muatData();
})();