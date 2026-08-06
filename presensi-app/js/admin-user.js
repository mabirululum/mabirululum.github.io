AUTH.requireRole(['admin']);
const _namaAdmin2 = AUTH.current().nama || AUTH.current().username;
document.getElementById('nama-admin').textContent = _namaAdmin2;
document.getElementById('avatar-admin').textContent = _namaAdmin2.charAt(0).toUpperCase();

const tbody = document.getElementById('tbody-user');
const form = document.getElementById('form-user');
const btnBatalEdit = document.getElementById('btn-batal-edit-user');
const f = {
  id: document.getElementById('user-id'),
  username: document.getElementById('user-username'),
  nama: document.getElementById('user-nama'),
  password: document.getElementById('user-password'),
  barcode: document.getElementById('user-barcode'),
};

f.role = document.getElementById('user-role');

// let dataUserTerakhir = [];

// async function muatData() {
//   const data = await DB.listUsers();
//   dataUserTerakhir = data;
//   tbody.innerHTML = data.map(u => `
//     <tr>
//       <td>${u.username}</td>
//       <td>${u.nama || '-'}</td>
//       <td>${u.barcode_id || '-'}</td>
//       <td>${u.aktif ? 'Aktif' : 'Nonaktif'}</td>
//       <td>${u.role === 'piket' ? 'Guru Piket' : 'Admin'}</td>
//       <td>
//         <div class="table-actions">
//           <button onclick="editUser(${u.id})"><i class="bi bi-pencil"></i> Edit</button>
//           <button onclick="hapusUser(${u.id})"><i class="bi bi-trash"></i> Hapus</button>
//         </div>
//       </td>
//     </tr>`).join('') || '<tr><td colspan="5">Belum ada data user</td></tr>';
// }
// muatData();

let dataUserTerakhir = [];
let halamanUser = 1;
const PER_HALAMAN_USER = 10;

async function muatData() {
  dataUserTerakhir = await DB.listUsers();
  halamanUser = 1;
  renderTabelUser();
}

function renderTabelUser() {
  const totalHalaman = Math.max(1, Math.ceil(dataUserTerakhir.length / PER_HALAMAN_USER));
  if (halamanUser > totalHalaman) halamanUser = totalHalaman;

  const mulai = (halamanUser - 1) * PER_HALAMAN_USER;
  const potong = dataUserTerakhir.slice(mulai, mulai + PER_HALAMAN_USER);

  tbody.innerHTML = potong.map(u => `
    <tr>
      <td>${u.username}</td>
      <td>${u.nama || '-'}</td>
      <td>${u.barcode_id || '-'}</td>
      <td>${u.aktif ? 'Aktif' : 'Nonaktif'}</td>
      <td>${u.role === 'piket' ? 'Guru Piket' : 'Admin'}</td>
      <td>
        <div class="table-actions">
          <button onclick="editUser(${u.id})"><i class="bi bi-pencil"></i> Edit</button>
          <button onclick="hapusUser(${u.id})"><i class="bi bi-trash"></i> Hapus</button>
        </div>
      </td>
    </tr>`).join('') || '<tr><td colspan="5">Belum ada data user</td></tr>';

  document.getElementById('info-halaman-user').textContent = `Halaman ${halamanUser} dari ${totalHalaman} (${dataUserTerakhir.length} user)`;
  document.getElementById('btn-prev-user').disabled = halamanUser <= 1;
  document.getElementById('btn-next-user').disabled = halamanUser >= totalHalaman;
}

document.getElementById('btn-prev-user').addEventListener('click', () => { halamanUser--; renderTabelUser(); });
document.getElementById('btn-next-user').addEventListener('click', () => { halamanUser++; renderTabelUser(); });

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    username: f.username.value.trim(), 
    nama: f.nama.value.trim(),
    barcode_id: f.barcode.value.trim() || null, 
    password: f.password.value, 
    role: f.role.value
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
    muatData();
  } catch (err) {
    toast(err.message, 'error');
  }
});

btnBatalEdit.addEventListener('click', () => {
  form.reset();
  f.id.value = '';
  btnBatalEdit.style.display = 'none';
});

function editUser(id) {
  const u = dataUserTerakhir.find(x => x.id === id);
  if (!u) return;
  f.id.value = u.id;
  f.username.value = u.username;
  f.nama.value = u.nama || '';
  f.barcode.value = u.barcode_id || '';
  f.password.value = '';
  f.role.value = u.role || 'admin';
  btnBatalEdit.style.display = 'inline-flex';
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function hapusUser(id) {
  const ya = await konfirmasi('Hapus user ini? Akses login admin untuk user ini akan hilang.');
  if (!ya) return;
  try {
    await DB.deleteUser(id);
    toast('User dihapus.');
    muatData();
  } catch (err) {
    toast(err.message, 'error');
  }
}
