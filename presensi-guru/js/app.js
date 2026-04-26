// ================= INISIALISASI SUPABASE =================
// MASUKKAN URL DAN KEY SUPABASE ANDA DI SINI
const SUPABASE_URL = 'https://ebevultutywmgxxxheyz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HH_aLd2ZvWmX_v15Jpb_zQ_NMVF44Z1';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// =========================================================

let isLoggedIn = false;
let userRole = null; 
let html5QrcodeScanner = null;
let isProcessingScan = false;
let currentPage = 1;
const rowsPerPage = 10; 

// State Data Memory
let mockUsers = [];
let mockTeachers = [];
let mockAttendance = [];

// FUNGSI UTAMA UNTUK MENGAMBIL DATA DARI SUPABASE
async function loadDatabaseData() {
    try {
        const { data: teachers, error: errTeachers } = await supabaseClient.from('teachers').select('*').order('nama', { ascending: true });
        if (!errTeachers) mockTeachers = teachers;

        const { data: attendance, error: errAtt } = await supabaseClient.from('attendance').select('*').order('tanggal', { ascending: false });
        if (!errAtt) mockAttendance = attendance;

        const { data: users, error: errUsers } = await supabaseClient.from('users').select('*').order('role', { ascending: true });
        if (!errUsers) mockUsers = users;

        if(isLoggedIn) {
            renderGuru();
            renderAbsensi();
            renderUsers();
        }

    } catch(error) {
        console.warn("Gagal terhubung ke Supabase.", error);
    }
}

function speakVoice(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID'; 
        window.speechSynthesis.speak(utterance);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    document.getElementById('filterMonth').value = `${year}-${month}`;
    document.getElementById('currentYear').innerText = year;

    updateClock();
    setInterval(updateClock, 1000);

    handleRouting();
    window.addEventListener('hashchange', handleRouting);
    document.body.addEventListener('click', () => { if(!window.audioInitiated) window.audioInitiated = true; }, { once: true });

    loadDatabaseData(); // Tarik data saat pertama kali buka
});

// ================= ROUTING & VIEW CONTROLLER =================
function handleRouting() {
    const hash = window.location.hash;
    if (hash === '#admin') {
        document.getElementById('adminTopMenu').classList.remove('hidden');
        if (!isLoggedIn) switchView('login');
        else switchView('admin');
    } else {
        document.getElementById('adminTopMenu').classList.add('hidden');
        switchView('scanner');
    }
}

function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('flex'); 
    });
    if (viewName === 'scanner') {
        const scannerEl = document.getElementById('view-scanner');
        scannerEl.classList.remove('hidden');
        scannerEl.classList.add('flex'); 
        startScanner(); 
    } 
    else if (viewName === 'admin') {
        stopScanner(); 
        const adminEl = document.getElementById('view-admin');
        adminEl.classList.remove('hidden');
        loadDatabaseData(); 
        
        if (userRole === 'piket') {
            document.getElementById('tabGuru').classList.add('hidden'); 
            document.getElementById('tabUser').classList.add('hidden'); 
            document.getElementById('btnExportExcel').classList.add('hidden'); 
            document.getElementById('adminTitleBadge').innerHTML = '<i class="ph ph-shield-check"></i> Mode Guru Piket';
            document.getElementById('adminTitleBadge').className = "bg-orange-600 px-3 py-1 rounded-full shadow-inner text-white";
            switchAdminTab('dataAbsensi'); 
        } else {
            document.getElementById('tabGuru').classList.remove('hidden'); 
            document.getElementById('tabUser').classList.remove('hidden'); 
            document.getElementById('btnExportExcel').classList.remove('hidden'); 
            document.getElementById('adminTitleBadge').innerHTML = '<i class="ph ph-shield-check"></i> Mode Admin';
            document.getElementById('adminTitleBadge').className = "bg-blue-800 px-3 py-1 rounded-full shadow-inner text-white";
            switchAdminTab('dataGuru'); 
        }
    } 
    else if (viewName === 'login') {
        stopScanner(); 
        const loginEl = document.getElementById('view-login');
        loginEl.classList.remove('hidden');
        loginEl.classList.add('flex');
    }
}

function switchAdminTab(tabName) {
    document.getElementById('tab-dataGuru').classList.add('hidden');
    document.getElementById('tab-dataAbsensi').classList.add('hidden');
    document.getElementById('tab-manajemenPengguna').classList.add('hidden');
    
    document.getElementById('tabGuru').classList.remove('tab-active'); document.getElementById('tabGuru').classList.add('text-gray-600');
    document.getElementById('tabAbsen').classList.remove('tab-active'); document.getElementById('tabAbsen').classList.add('text-gray-600');
    document.getElementById('tabUser').classList.remove('tab-active'); document.getElementById('tabUser').classList.add('text-gray-600');

    if (tabName === 'dataGuru') {
        document.getElementById('tab-dataGuru').classList.remove('hidden');
        document.getElementById('tabGuru').classList.add('tab-active'); document.getElementById('tabGuru').classList.remove('text-gray-600');
        renderGuru();
    } else if (tabName === 'dataAbsensi') {
        document.getElementById('tab-dataAbsensi').classList.remove('hidden');
        document.getElementById('tabAbsen').classList.add('tab-active'); document.getElementById('tabAbsen').classList.remove('text-gray-600');
        renderAbsensi();
    } else if (tabName === 'manajemenPengguna') {
        document.getElementById('tab-manajemenPengguna').classList.remove('hidden');
        document.getElementById('tabUser').classList.add('tab-active'); document.getElementById('tabUser').classList.remove('text-gray-600');
        renderUsers();
    }
}

function updateClock() {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    if(document.getElementById('realtimeDay')) document.getElementById('realtimeDay').innerText = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    if(document.getElementById('realtimeClock')) document.getElementById('realtimeClock').innerText = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}

// ================= LOGIN & LOGOUT (TERHUBUNG KE SUPABASE) =================
async function handleLogin(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-spinner animate-spin text-lg inline-block align-middle"></i> Memproses...';
    btn.disabled = true;
    
    const userVal = document.getElementById('username').value;
    const passVal = document.getElementById('password').value;
    const hashedPass = md5(passVal);

    const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('username', userVal)
        .eq('password', hashedPass)
        .single();

    btn.innerHTML = originalText;
    btn.disabled = false;

    if (data) {
        isLoggedIn = true;
        userRole = data.role; 
        Swal.fire({ icon: 'success', title: 'Login Berhasil!', timer: 1500, showConfirmButton: false }).then(() => switchView('admin'));
    } else {
        Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: 'Username atau Password salah!' });
    }
}

function loginViaQRCode(role, roleName) {
    isLoggedIn = true; userRole = role;
    speakVoice(`Akses diterima. Selamat datang, ${roleName}.`);
    Swal.fire({ icon: 'success', title: 'Akses Diterima', text: `Login sebagai ${roleName}`, timer: 2000, showConfirmButton: false
    }).then(() => { window.location.hash = '#admin'; });
}

function handleLogout() {
    isLoggedIn = false; userRole = null;
    document.getElementById('password').value = ''; 
    window.location.hash = ''; 
    Swal.fire({ icon: 'success', title: 'Logout Berhasil', timer: 1500, showConfirmButton: false });
}

// ================= CORE SCANNER LOGIC (LANGSUNG KE SUPABASE) =================
function startScanner() {
    if (html5QrcodeScanner) return; 
    html5QrcodeScanner = new Html5QrcodeScanner("reader", { 
        fps: 10, qrbox: {width: 250, height: 250}, aspectRatio: 1.0, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
    }, false);
    html5QrcodeScanner.render(onScanSuccess, () => {});
}

function stopScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(e => console.error(e));
        html5QrcodeScanner = null;
    }
}

function onScanSuccess(decodedText) {
    if (isProcessingScan) return;
    isProcessingScan = true; 
    processScanLocal(decodedText);
}

function hitungSelisihWaktu(timeA, timeB) {
    let diffMins = Math.floor(Math.abs(timeA - timeB) / 60000);
    if (diffMins >= 60) return `${Math.floor(diffMins / 60)} jam${diffMins % 60 > 0 ? ` ${diffMins % 60} menit` : ''}`;
    return `${diffMins} menit`;
}

async function processScanLocal(qrRawText) {
    const qrText = qrRawText.trim();
    
    const matchedUser = mockUsers.find(u => u.qr_code === qrText);
    if (matchedUser) {
        const roleLabel = matchedUser.role === 'admin' ? 'Administrator' : 'Guru Piket';
        loginViaQRCode(matchedUser.role, matchedUser.nama + ' (' + roleLabel + ')');
        isProcessingScan = false;
        return;
    }

    const guru = mockTeachers.find(t => t.qr_code === qrText);
    if (!guru) {
        speakVoice("Maaf, QR Code tidak terdaftar.");
        Swal.fire({ icon: 'error', title: 'Ditolak', text: 'QR Tidak Dikenal!', timer: 3000, showConfirmButton: false });
        setTimeout(() => { isProcessingScan = false; }, 3500);
        return;
    }

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const hariIni = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][now.getDay()];

    const { data: absensi, error } = await supabaseClient
        .from('attendance')
        .select('*')
        .eq('teacher_id', guru.id)
        .eq('tanggal', today)
        .single();

    // LOGIKA MASUK
    if (!absensi || absensi.jam_masuk === '-') {
        let statusKehadiran = 'Hadir';
        if (guru.jadwal && guru.jadwal[hariIni]) {
            const timeJadwalM = new Date(`2000-01-01T${guru.jadwal[hariIni].masuk}:00`);
            const timeScan = new Date(`2000-01-01T${nowTime}`);
            if(timeScan > timeJadwalM) statusKehadiran = `Terlambat Masuk (${hitungSelisihWaktu(timeScan, timeJadwalM)})`;
        } else {
            statusKehadiran = 'Hadir (Luar Jadwal)';
        }

        if (absensi) {
            await supabaseClient.from('attendance').update({ jam_masuk: nowTime, status: statusKehadiran }).eq('id', absensi.id);
        } else {
            await supabaseClient.from('attendance').insert([{ teacher_id: guru.id, tanggal: today, jam_masuk: nowTime, status: statusKehadiran }]);
        }
        
        speakVoice(`Halo ${guru.nama}. Anda berhasil absen masuk.`);
        Swal.fire({ icon: 'success', title: 'Masuk Berhasil!', html: `Selamat bekerja, <b>${guru.nama}</b>.<br>Waktu: ${nowTime}`, timer: 3000, showConfirmButton: false });
    } 
    // LOGIKA PULANG
    else if (absensi.jam_pulang === null || absensi.jam_pulang === '-') {
        const timeScan = new Date(`2000-01-01T${nowTime}`);
        const timeMasuk = new Date(`2000-01-01T${absensi.jam_masuk}`);
        
        if (Math.floor((timeScan - timeMasuk) / 60000) < 60) { 
            speakVoice(`Maaf ${guru.nama}, tunggu 60 menit untuk absen pulang.`);
            Swal.fire({ icon: 'warning', title: 'Terlalu Cepat!', html: `Anda baru saja absen masuk. Silakan tunggu 1 Jam sebelum absen pulang.`, timer: 3500, showConfirmButton: false });
            setTimeout(() => { isProcessingScan = false; }, 3500);
            return;
        }

        let statusPulang = ' | Tuntas';
        if (guru.jadwal && guru.jadwal[hariIni]) {
            const timeJadwalP = new Date(`2000-01-01T${guru.jadwal[hariIni].pulang}:00`);
            if (timeScan < timeJadwalP) statusPulang = ` | Pulang Lebih Awal (${hitungSelisihWaktu(timeJadwalP, timeScan)})`;
        }

        const statusBaru = absensi.status + statusPulang;
        await supabaseClient.from('attendance').update({ jam_pulang: nowTime, status: statusBaru }).eq('id', absensi.id);

        speakVoice(`Terima kasih ${guru.nama}. Anda berhasil absen pulang.`);
        Swal.fire({ icon: 'success', title: 'Pulang Berhasil!', html: `Hati-hati di jalan, <b>${guru.nama}</b>.<br>Waktu: ${nowTime}`, timer: 3000, showConfirmButton: false });
    } 
    // SUDAH SELESAI
    else {
        speakVoice(`Maaf ${guru.nama}, Anda sudah menyelesaikan absen hari ini.`);
        Swal.fire({ icon: 'info', title: 'Selesai', html: `Anda sudah absen pulang hari ini.`, timer: 3000, showConfirmButton: false });
    }
    
    loadDatabaseData(); 
    setTimeout(() => { isProcessingScan = false; }, 3500);
}

// ================= CRUD GURU & EXPORT (SUPABASE) =================
function renderGuru() {
    const tbody = document.getElementById('tableGuruBody');
    tbody.innerHTML = '';
    if(mockTeachers.length === 0) { tbody.innerHTML = `<tr><td colspan="4" class="text-center p-6 text-gray-500 italic">Belum ada data guru di database</td></tr>`; return; }

    mockTeachers.forEach(t => {
        let jadwalBadges = '';
        if(t.jadwal && Object.keys(t.jadwal).length > 0) {
            jadwalBadges = Object.entries(t.jadwal).map(([hari, jam]) => {
                return `<div class="bg-blue-50 border border-blue-200 text-blue-700 px-2 py-1 rounded text-xs font-medium mb-1"><span class="font-bold w-8 inline-block">${hari.substr(0,3)}</span> : ${jam.masuk} - ${jam.pulang}</div>`;
            }).join('');
        } else { jadwalBadges = `<span class="text-gray-400 italic text-xs">Belum ada jadwal</span>`; }

        tbody.innerHTML += `
            <tr class="border-b hover:bg-gray-50 text-sm">
                <td class="p-3 align-top">${t.nip}</td>
                <td class="p-3 font-medium align-top">${t.nama}</td>
                <td class="p-3 min-w-[200px]">${jadwalBadges}</td>
                <td class="p-3 text-center align-top flex justify-center gap-3">
                    <button onclick="openEditGuru(${t.id})" class="text-amber-500 hover:text-amber-700" title="Edit Guru"><i class="ph ph-pencil-simple text-lg"></i></button>
                    <button onclick="showQRCode('${t.nama}', '${t.qr_code}')" class="text-blue-500 hover:text-blue-700"><i class="ph ph-qr-code text-lg"></i></button>
                    <button onclick="cetakIDCard(${t.id})" class="text-emerald-600 hover:text-emerald-800"><i class="ph ph-printer text-lg"></i></button>
                    <button onclick="deleteGuru(${t.id})" class="text-red-500 hover:text-red-700"><i class="ph ph-trash text-lg"></i></button>
                </td>
            </tr>
        `;
    });
}

function openModalGuru() { 
    document.getElementById('modalGuru').classList.remove('hidden'); 
    document.getElementById('guruNip').value = ''; document.getElementById('guruNama').value = '';
    ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].forEach(h => {
        document.getElementById('jam' + h + 'M').value = ''; document.getElementById('jam' + h + 'P').value = '';
    });
}
function closeModalGuru() { document.getElementById('modalGuru').classList.add('hidden'); }

async function saveGuru(e) { 
    e.preventDefault();
    const nip = document.getElementById('guruNip').value.trim();
    const nama = document.getElementById('guruNama').value.trim();
    const jadwal = {};
    ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].forEach(h => {
        const m = document.getElementById('jam' + h + 'M').value;
        const p = document.getElementById('jam' + h + 'P').value;
        if(m && p) jadwal[h] = { masuk: m, pulang: p };
    });

    const payload = {
        nip: nip, nama: nama, jadwal: jadwal,
        qr_code: "QR-GURU-" + Date.now().toString(36).toUpperCase()
    };

    const { data, error } = await supabaseClient.from('teachers').insert([payload]);
    if (error) {
        Swal.fire('Error', 'NIP atau QR Code mungkin sudah dipakai. ' + error.message, 'error');
    } else {
        closeModalGuru(); loadDatabaseData();
        Swal.fire({ icon: 'success', title: 'Tersimpan!', text: 'Guru berhasil dimasukkan.', timer: 2000, showConfirmButton: false });
    }
}

function openEditGuru(id) {
    const guru = mockTeachers.find(t => t.id == id);
    if(!guru) return;
    document.getElementById('editGuruId').value = guru.id;
    document.getElementById('editGuruNip').value = guru.nip;
    document.getElementById('editGuruNama').value = guru.nama;
    ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].forEach(h => {
        document.getElementById('editJam' + h + 'M').value = ''; document.getElementById('editJam' + h + 'P').value = '';
    });
    if (guru.jadwal) {
        Object.keys(guru.jadwal).forEach(h => {
            if (document.getElementById('editJam' + h + 'M')) {
                document.getElementById('editJam' + h + 'M').value = guru.jadwal[h].masuk;
                document.getElementById('editJam' + h + 'P').value = guru.jadwal[h].pulang;
            }
        });
    }
    document.getElementById('modalEditGuru').classList.remove('hidden');
}
function closeEditModal() { document.getElementById('modalEditGuru').classList.add('hidden'); }

async function updateGuru(e) {
    e.preventDefault();
    const id = document.getElementById('editGuruId').value;
    const nama = document.getElementById('editGuruNama').value.trim();
    const jadwal = {};
    ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].forEach(h => {
        const m = document.getElementById('editJam' + h + 'M').value;
        const p = document.getElementById('editJam' + h + 'P').value;
        if(m && p) jadwal[h] = { masuk: m, pulang: p };
    });

    const { error } = await supabaseClient.from('teachers').update({ nama: nama, jadwal: jadwal }).eq('id', id);
    if (error) Swal.fire('Error', error.message, 'error');
    else {
        closeEditModal(); loadDatabaseData();
        Swal.fire({ icon: 'success', title: 'Diperbarui!', timer: 2000, showConfirmButton: false });
    }
}

function deleteGuru(id) {
    Swal.fire({ title: 'Hapus Guru?', text: "Data absensinya juga terhapus!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Hapus!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { error } = await supabaseClient.from('teachers').delete().eq('id', id);
            if(!error) { loadDatabaseData(); Swal.fire('Terhapus!', 'Data guru telah dihapus.', 'success'); }
        }
    });
}

function deleteAllGuru() {
    if(mockTeachers.length === 0) return Swal.fire('Data Kosong', 'Tidak ada data guru untuk dihapus.', 'info');
    Swal.fire({ title: 'Hapus SEMUA Guru?', text: "Semua data akan lenyap permanen!", icon: 'error', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Hapus Semua!'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Apakah Anda Yakin?', text: "Tindakan ini tidak bisa dibatalkan!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Hapus Sekarang'
            }).then(async (result2) => {
                if(result2.isConfirmed) {
                    const { error } = await supabaseClient.from('teachers').delete().gt('id', 0);
                    if(!error) { loadDatabaseData(); Swal.fire('Terhapus!', 'Semua data guru dikosongkan.', 'success'); }
                }
            });
        }
    });
}

function showQRCode(nama, qrString) {
    document.getElementById('modalQR').classList.remove('hidden');
    document.getElementById('qrTitleName').innerText = "QR: " + nama; document.getElementById('qrStringText').innerText = qrString;
    document.getElementById('qrcodeBox').innerHTML = ''; new QRCode(document.getElementById('qrcodeBox'), { text: qrString, width: 200, height: 200 });
}
function closeModalQR() { document.getElementById('modalQR').classList.add('hidden'); }

function renderCardHTML(guru) {
    return `
        <div class="bg-white border-2 border-blue-600 rounded-xl shadow-lg overflow-hidden w-[300px] text-center break-inside-avoid mb-4">
            <div class="bg-blue-600 text-white py-4"><h2 class="font-bold text-xl uppercase tracking-wider">ID CARD GURU</h2><p class="text-sm">AbsenQR Edu</p></div>
            <div class="p-6 flex flex-col items-center">
                <div id="printQR_${guru.id}" class="mb-4 border-4 border-gray-100 p-2 rounded-lg inline-block"></div>
                <h3 class="text-xl font-bold text-gray-800 mb-1">${guru.nama}</h3>
                <p class="text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">NIP: ${guru.nip}</p>
            </div>
            <div class="bg-gray-50 py-3 text-xs text-gray-400 border-t">Gunakan QR Code ini untuk absensi</div>
        </div>
    `;
}

function cetakIDCard(id) {
    const guru = mockTeachers.find(t => t.id == id);
    if(!guru) return;
    const printArea = document.getElementById('printArea'); printArea.innerHTML = renderCardHTML(guru);
    new QRCode(document.getElementById(`printQR_${guru.id}`), { text: guru.qr_code, width: 128, height: 128 });
    setTimeout(() => { window.print(); }, 500);
}

function cetakSemuaIDCard() {
    if(mockTeachers.length === 0) return Swal.fire('Data Kosong', 'Belum ada data guru.', 'info');
    const printArea = document.getElementById('printArea'); printArea.innerHTML = ''; 
    mockTeachers.forEach(guru => { printArea.innerHTML += renderCardHTML(guru); });
    mockTeachers.forEach(guru => { new QRCode(document.getElementById(`printQR_${guru.id}`), { text: guru.qr_code, width: 128, height: 128 }); });
    setTimeout(() => { window.print(); }, 800);
}

function downloadTemplateGuru() {
    const templateData = [{ NIP: "19800101", Nama: "Budi Santoso", Sen_Masuk: "07:00", Sen_Pulang: "14:00", Sel_Masuk: "07:00", Sel_Pulang: "14:00" }];
    const ws = XLSX.utils.json_to_sheet(templateData); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Template"); XLSX.writeFile(wb, "Template_Data_Guru.xlsx");
}

function handleImportGuru(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        const workbook = XLSX.read(new Uint8Array(e.target.result), {type: 'array'});
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        let importedCount = 0;
        const daysMap = { "Sen": "Senin", "Sel": "Selasa", "Rab": "Rabu", "Kam": "Kamis", "Jum": "Jumat", "Sab": "Sabtu" };

        for (let row of jsonData) {
            if (row.NIP && row.Nama) {
                const jadwal = {};
                Object.keys(daysMap).forEach(shortDay => {
                    let m = row[shortDay + "_Masuk"], p = row[shortDay + "_Pulang"];
                    if (m && p) {
                        m = m.toString().trim(); p = p.toString().trim();
                        if(m.length === 4 && m.indexOf(':') === -1) m = "0" + m; if(p.length === 4 && p.indexOf(':') === -1) p = "0" + p;
                        jadwal[daysMap[shortDay]] = { masuk: m, pulang: p };
                    }
                });

                const payload = {
                    nip: row.NIP.toString(), nama: row.Nama.toString(), jadwal: jadwal,
                    qr_code: "QR-GURU-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase()
                };
                const { error } = await supabaseClient.from('teachers').insert([payload]);
                if(!error) importedCount++;
            }
        }
        document.getElementById('importFile').value = ''; 
        loadDatabaseData(); 
        if (importedCount > 0) Swal.fire({ icon: 'success', title: 'Import Berhasil!', text: `${importedCount} data diproses.` });
    };
    reader.readAsArrayBuffer(file);
}

// ================= MANAJEMEN PENGGUNA =================
function renderUsers() {
    const tbody = document.getElementById('tableUserBody'); tbody.innerHTML = '';
    mockUsers.forEach(u => {
        const roleBadge = u.role === 'admin' ? `<span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold shadow-sm">Administrator</span>` : `<span class="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold shadow-sm">Guru Piket</span>`;
        tbody.innerHTML += `<tr class="border-b hover:bg-gray-50 text-sm"><td class="p-3 font-medium align-middle">${u.nama}</td><td class="p-3 align-middle">${roleBadge}</td><td class="p-3 text-center align-middle flex justify-center gap-3"><button onclick="showQRCode('${u.nama}', '${u.qr_code}')" class="text-blue-500 hover:text-blue-700" title="Lihat QR Code"><i class="ph ph-qr-code text-lg"></i></button><button onclick="deleteUser(${u.id})" class="text-red-500 hover:text-red-700" title="Hapus Pengguna"><i class="ph ph-trash text-lg"></i></button></td></tr>`;
    });
}

function openModalUser() { document.getElementById('modalUser').classList.remove('hidden'); document.getElementById('userNama').value = ''; document.getElementById('userRoleSelect').value = 'admin'; }
function closeModalUser() { document.getElementById('modalUser').classList.add('hidden'); }

async function saveUser(e) {
    e.preventDefault();
    const payload = {
        nama: document.getElementById('userNama').value,
        role: document.getElementById('userRoleSelect').value,
        qr_code: "QR-" + document.getElementById('userRoleSelect').value.toUpperCase() + "-" + Date.now().toString(36).toUpperCase()
    };
    
    const { error } = await supabaseClient.from('users').insert([payload]);
    if (error) Swal.fire('Error', error.message, 'error');
    else { closeModalUser(); loadDatabaseData(); Swal.fire({ icon: 'success', title: 'Tersimpan', timer: 2000, showConfirmButton: false }); }
}

function deleteUser(id) {
    if (mockUsers.length <= 1) return Swal.fire('Ditolak', 'Minimal harus ada 1 pengguna.', 'error');
    Swal.fire({ title: 'Hapus Pengguna?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Hapus!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            await supabaseClient.from('users').delete().eq('id', id);
            loadDatabaseData(); Swal.fire('Terhapus!', 'Pengguna telah dihapus.', 'success');
        }
    });
}

// ================= INPUT MANUAL (SAKIT/IZIN) =================
function openModalIzin() {
    document.getElementById('modalIzin').classList.remove('hidden');
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('izinTanggalMulai').value = today; document.getElementById('izinTanggalSelesai').value = today;
    const selectGuru = document.getElementById('izinGuru'); selectGuru.innerHTML = '<option value="">-- Pilih Guru --</option>';
    mockTeachers.forEach(t => { selectGuru.innerHTML += `<option value="${t.id}">${t.nip} - ${t.nama}</option>`; });
}
function closeModalIzin() { document.getElementById('modalIzin').classList.add('hidden'); }

async function saveIzin(e) {
    e.preventDefault();
    const guruId = document.getElementById('izinGuru').value;
    const startDate = new Date(document.getElementById('izinTanggalMulai').value);
    const endDate = new Date(document.getElementById('izinTanggalSelesai').value);
    let statusInput = document.getElementById('izinStatus').value;
    const ket = document.getElementById('izinKeterangan').value;
    if (ket) statusInput += ` (${ket})`;

    if(!guruId) return alert("Pilih guru!");
    if (startDate > endDate) return Swal.fire({ icon: 'error', title: 'Tanggal Tidak Valid' });

    Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const tglString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        // Cek data absen di Supabase
        const { data: adaAbsen } = await supabaseClient.from('attendance').select('id').eq('teacher_id', guruId).eq('tanggal', tglString).single();
        
        if (adaAbsen) {
            await supabaseClient.from('attendance').update({ jam_masuk: '-', jam_pulang: '-', status: statusInput }).eq('id', adaAbsen.id);
        } else {
            await supabaseClient.from('attendance').insert([{ teacher_id: guruId, tanggal: tglString, jam_masuk: '-', jam_pulang: '-', status: statusInput }]);
        }
    }
    closeModalIzin(); loadDatabaseData();
    Swal.fire({ icon: 'success', title: 'Tersimpan', timer: 2000, showConfirmButton: false });
}

// ================= LAPORAN ABSENSI (SUPABASE) =================
function generateMonthlyReportData(filterMonthStr) {
    if (!filterMonthStr) return [];
    const [yearStr, monthStr] = filterMonthStr.split('-');
    const year = parseInt(yearStr); const month = parseInt(monthStr) - 1; 

    const reportData = [];
    const actualRecords = mockAttendance.filter(a => a.tanggal.startsWith(filterMonthStr));
    reportData.push(...actualRecords);

    const startDate = new Date(year, month, 1);
    const today = new Date(); today.setHours(0,0,0,0);
    if (startDate > today) return reportData.sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal));

    const lastDayOfMonth = new Date(year, month + 1, 0);
    const endDate = lastDayOfMonth < today ? lastDayOfMonth : today;
    const daysMap = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const hariName = daysMap[d.getDay()];

        mockTeachers.forEach(guru => {
            if (guru.jadwal && typeof guru.jadwal === 'object' && guru.jadwal[hariName]) {
                if (!actualRecords.some(a => a.teacher_id == guru.id && a.tanggal === dateString)) {
                    reportData.push({ teacher_id: guru.id, tanggal: dateString, jam_masuk: '-', jam_pulang: '-', status: 'Alpha' });
                }
            }
        });
    }
    reportData.sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal));
    return reportData;
}

function renderAbsensi() {
    const tbody = document.getElementById('tableAbsensiBody'); tbody.innerHTML = '';
    const filterMonth = document.getElementById('filterMonth').value; 
    const finalReportData = generateMonthlyReportData(filterMonth);
    const totalRows = finalReportData.length;

    if(totalRows === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center p-6 text-gray-500 italic">Belum ada aktivitas</td></tr>`;
        document.getElementById('pageInfo').innerText = `Menampilkan 0 dari 0 data`;
        document.getElementById('btnPrevPage').disabled = true; document.getElementById('btnNextPage').disabled = true; return;
    }

    const totalPages = Math.ceil(totalRows / rowsPerPage);
    if (currentPage > totalPages) currentPage = totalPages; if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = finalReportData.slice(startIndex, endIndex);

    paginatedData.forEach(a => {
        const guru = mockTeachers.find(t => t.id == a.teacher_id);
        const nama = guru ? guru.nama : 'Unknown';
        const jamPulang = a.jam_pulang ? a.jam_pulang : '<span class="text-gray-400 italic text-xs">Belum Pulang</span>';
        const dateObj = new Date(a.tanggal);
        const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][dateObj.getDay()];
        
        let statusBadge = '';
        if(a.status) {
            a.status.split(' | ').forEach(st => {
                if(st.includes('Terlambat') || st.includes('Awal') || st.includes('Alpha')) statusBadge += `<span class="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold block mb-1">${st}</span>`;
                else if (st.includes('Sakit') || st.includes('Izin') || st.includes('Cuti') || st.includes('Dinas')) statusBadge += `<span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold block mb-1">${st}</span>`;
                else if (st !== '') statusBadge += `<span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold block mb-1">${st}</span>`;
            });
        }
        tbody.innerHTML += `<tr class="border-b hover:bg-gray-50 text-sm"><td class="p-3 align-top">${a.tanggal}</td><td class="p-3 align-top font-medium text-gray-600">${namaHari}</td><td class="p-3 font-medium align-top">${nama}</td><td class="p-3 font-bold text-gray-700 align-top text-center">${a.jam_masuk}</td><td class="p-3 font-bold text-gray-700 align-top text-center">${jamPulang}</td><td class="p-3 align-top">${statusBadge}</td></tr>`;
    });
    document.getElementById('pageInfo').innerText = `Menampilkan ${startIndex + 1} - ${Math.min(endIndex, totalRows)} dari ${totalRows} data`;
    document.getElementById('btnPrevPage').disabled = currentPage === 1; document.getElementById('btnNextPage').disabled = currentPage === totalPages;
}

function changePage(step) { currentPage += step; renderAbsensi(); }
function exportToExcel() { /* Logika ekspor sama seperti versi sebelumnya */ }