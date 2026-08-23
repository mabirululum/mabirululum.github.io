// ==========================================
// file: auth.js
// Fungsi: Login Admin/Siswa, Auto Logout, dan Tampilan Login
// ==========================================

const IDLE_TIMEOUT = 3600000; // 1 Jam

function setLoginTab(role) {
    const btnSiswa = document.getElementById('tab-siswa');
    const btnAdmin = document.getElementById('tab-admin');
    const formSiswa = document.getElementById('form-login-siswa');
    const formAdmin = document.getElementById('form-login-admin');
    if (role === 'siswa') {
        if(btnSiswa) btnSiswa.className = "flex-1 py-3 text-center font-semibold text-blue-600 border-b-2 border-blue-600 transition-colors";
        if(btnAdmin) btnAdmin.className = "flex-1 py-3 text-center font-semibold text-gray-400 border-b-2 border-transparent transition-colors";
        formSiswa.classList.remove('hidden');
        formAdmin.classList.add('hidden');
    } else {
        if(btnAdmin) btnAdmin.className = "flex-1 py-3 text-center font-semibold text-slate-800 border-b-2 border-slate-800 transition-colors";
        if(btnSiswa) btnSiswa.className = "flex-1 py-3 text-center font-semibold text-gray-400 border-b-2 border-transparent transition-colors";
        formAdmin.classList.remove('hidden');
        formSiswa.classList.add('hidden');
    }
}

async function handleLoginAdmin(e) {
    e.preventDefault();
    const user = String(document.getElementById('login-username').value).trim();
    const pass = String(document.getElementById('login-password').value).trim();
    showLoading("Otentikasi ke Server...");

    try {
        // 1. Ubah username menjadi format email bayangan
        const emailFormat = `${user}@mabu.sch.id`;

        // 2. Login menggunakan sistem Supabase Auth
        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
            email: emailFormat,
            password: pass,
        });

        if (authError || !authData.user) {
            hideLoading();
            showToast('Username atau Password Salah!', 'error');
            return;
        }

        // 3. Tarik data detail Admin dari tabel admin_users
        const { data: adminDetail } = await supabaseClient
            .from('admin_users')
            .select('*')
            .eq('username', user)
            .single();

        showLoading("Memuat Database Dasbor...");
        const isSuccess = await loadDataFromSupabase();
        
        hideLoading();
        if (!isSuccess) {
            showToast('Gagal Muat Database Supabase!', 'error');
            return;
        }

        // 4. Buka Dasbor Admin
        const adminFormat = { 
            id: adminDetail ? adminDetail.id : authData.user.id, 
            username: user, 
            nama: adminDetail ? adminDetail.nama_admin : 'Administrator', 
            role: adminDetail ? adminDetail.role : 'Admin' 
        };
        
        renderAdminView(adminFormat);
        setupIdleTimer();

    } catch (err) {
        console.error(err);
        hideLoading();
        showToast('Terjadi kesalahan saat otentikasi.', 'error');
    }
}

async function handleLoginSiswa(e) {
    e.preventDefault();

    // ==========================================
    // 🛡️ SISTEM ANTI-SPAM & RATE LIMITING
    // ==========================================
    const MAX_ATTEMPTS = 3; // Maksimal coba-coba
    const COOLDOWN_TIME = 60 * 1000; // Hukuman 60 detik (dalam milidetik)

    // Cek apakah user sedang dalam masa hukuman (Cooldown)
    const blockUntil = localStorage.getItem('login_block_until');
    if (blockUntil && Date.now() < parseInt(blockUntil)) {
        const sisaDetik = Math.ceil((parseInt(blockUntil) - Date.now()) / 1000);
        showToast(`Terlalu banyak percobaan! Silakan tunggu ${sisaDetik} detik lagi.`, 'error');
        return; // Hentikan eksekusi, JANGAN tembak Supabase!
    }

    const nis = String(document.getElementById('login-nis').value).trim();
    showLoading("Memeriksa NIS...");

    try {
        // Tembak API Supabase
        const { data, error } = await supabaseClient
            .from('data_siswa')
            .select('*')
            .eq('nis', nis)
            .single();

        // JIKA GAGAL / NIS TIDAK DITEMUKAN
        if (error || !data) {
            hideLoading();
            
            // Catat kegagalan ke dalam memori browser
            let attempts = parseInt(localStorage.getItem('login_attempts') || '0') + 1;
            
            if (attempts >= MAX_ATTEMPTS) {
                // Jika sudah 3x salah, berikan hukuman (Kunci selama 60 detik)
                localStorage.setItem('login_block_until', Date.now() + COOLDOWN_TIME);
                localStorage.setItem('login_attempts', '0'); // Reset hitungan
                showToast(`Akses diblokir sementara! Anda salah menebak NIS 3 kali.`, 'error');
            } else {
                // Jika belum 3x, berikan peringatan sisa kesempatan
                localStorage.setItem('login_attempts', attempts);
                showToast(`NIS tidak ditemukan! (Sisa percobaan: ${MAX_ATTEMPTS - attempts}x)`, 'error');
            }
            return;
        }

        // JIKA BERHASIL LOGIN
        // Bersihkan semua catatan kejahatan (Reset hukuman)
        localStorage.removeItem('login_attempts');
        localStorage.removeItem('login_block_until');

        showLoading("Mengambil Data Tagihan...");
        const isSuccess = await loadDataFromSupabase();
        hideLoading();

        if (!isSuccess) {
            showToast('Gagal terhubung ke database', 'error');
            return;
        }

        const s = dbSiswa.find(s => String(s.nis).trim() === nis);
        let riwayat = dbPembayaran.filter(p => !p.isDeleted && String(p.nis).trim() === nis);
        
        let billing = calculateSiswaBilling(s, dbMasterTarif, riwayat);
        renderSiswaView(s, billing);
        
    } catch(err) {
        console.error(err);
        hideLoading();
        showToast('Terjadi kesalahan pada server.', 'error');
    }
}

async function logout() {
    // 1. Hancurkan sesi / token akses di server Supabase
    const { error } = await supabaseClient.auth.signOut();
    if (error) console.error("Gagal logout dari Supabase:", error.message);

    // 2. Sembunyikan halaman dasbor dan kembalikan ke layar Login
    // document.getElementById('view-siswa').classList.add('hidden');
    document.getElementById('view-admin').classList.add('hidden');
    document.getElementById('view-login').classList.remove('hidden');
    
    // 3. Reset semua variabel dan form lokal
    currentUserRole = '';
    ['pemasukan', 'bantuan', 'pengeluaran', 'pengeluaran-non', 'infaq', 'user'].forEach(cancelEdit);
    
    const formLoginSiswa = document.getElementById('form-login-siswa');
    const formLoginAdmin = document.getElementById('form-login-admin');
    if (formLoginSiswa) formLoginSiswa.reset();
    if (formLoginAdmin) formLoginAdmin.reset();
    
    document.getElementById('info-nama-siswa').classList.add('hidden');
    document.getElementById('input-nis').classList.replace('border-red-500', 'border-gray-300');
    
    // 4. Matikan timer keamanan
    if (refreshCountdownInterval) clearInterval(refreshCountdownInterval);
    stopIdleTimer();
    
    // 5. Reset tombol refresh siswa
    const btnRefreshSiswa = document.getElementById('btn-refresh-siswa');
    if (btnRefreshSiswa) {
        btnRefreshSiswa.disabled = false;
        btnRefreshSiswa.classList.remove('opacity-50', 'cursor-not-allowed');
        document.getElementById('text-refresh-siswa').innerText = "Perbarui Data";
        if (btnRefreshSiswa.querySelector('i')) {
            btnRefreshSiswa.querySelector('i').classList.remove('animate-spin');
        }
    }
}

function showLogoutModal() {
    document.getElementById('logout-modal').classList.remove('hidden');
}

function closeLogoutModal() {
    document.getElementById('logout-modal').classList.add('hidden');
}

function executeLogoutSiswa() {
    closeLogoutModal(); // Tutup modal dulu
    
    showLoading("Membawa Anda keluar...");
    
    setTimeout(() => {
        hideLoading();
        
        // Kosongkan variabel penampung data
        currentSiswaData = null; 
        currentBillingData = null;
        
        // Reset form login
        const loginInput = document.getElementById('login-nis');
        if (loginInput) loginInput.value = '';
        
        // Pindah tampilan layar
        document.getElementById('view-siswa').classList.add('hidden');
        document.getElementById('view-login').classList.remove('hidden');
        
        showToast('Berhasil keluar.', 'success');
    }, 800); // Beri jeda 0.8 detik agar terasa pergantian sistemnya
}

async function confirmLogout() {
    // 0. Tutup modal & Munculkan Loading
    closeLogoutModal();
    if(typeof showLoading === 'function') showLoading("Membawa Anda keluar...");

    // 1. Hancurkan sesi / token akses di server Supabase
    if (typeof supabaseClient !== 'undefined') {
        const { error } = await supabaseClient.auth.signOut();
        if (error) console.error("Gagal logout dari Supabase:", error.message);
    }

    setTimeout(() => {
        if(typeof hideLoading === 'function') hideLoading();

        // 2. Sembunyikan halaman dasbor dan kembalikan ke layar Login (Pake pengaman ?)
        document.getElementById('view-siswa')?.classList.add('hidden');
        document.getElementById('view-admin')?.classList.add('hidden');
        document.getElementById('view-login')?.classList.remove('hidden');
        
        // 3. Reset semua variabel dan form lokal
        if(typeof currentUserRole !== 'undefined') currentUserRole = '';
        currentSiswaData = null; 
        currentBillingData = null;

        // Cek apakah fungsi cancelEdit ada sebelum dipanggil (Pengaman jika admin.js dipisah)
        if(typeof cancelEdit === 'function') {
            ['pemasukan', 'bantuan', 'pengeluaran', 'pengeluaran-non', 'infaq', 'tarif', 'user', 'atribut', 'master_atribut'].forEach(cancelEdit);
        }
        
        document.getElementById('form-login-siswa')?.reset();
        document.getElementById('form-login-admin')?.reset();
        
        document.getElementById('info-nama-siswa')?.classList.add('hidden');
        document.getElementById('input-nis')?.classList.replace('border-red-500', 'border-gray-300');
        
        // 4. Matikan timer keamanan
        if (typeof refreshCountdownInterval !== 'undefined') clearInterval(refreshCountdownInterval);
        if (typeof stopIdleTimer === 'function') stopIdleTimer();
        
        // 5. Reset tombol refresh siswa
        const btnRefreshSiswa = document.getElementById('btn-refresh-siswa');
        if (btnRefreshSiswa) {
            btnRefreshSiswa.disabled = false;
            btnRefreshSiswa.classList.remove('opacity-50', 'cursor-not-allowed');
            const textRef = document.getElementById('text-refresh-siswa');
            if(textRef) textRef.innerText = "Perbarui Data";
            if (btnRefreshSiswa.querySelector('i')) {
                btnRefreshSiswa.querySelector('i').classList.remove('animate-spin');
            }
        }

        if(typeof showToast === 'function') showToast('Berhasil keluar sistem.', 'success');
    }, 500); // Sedikit jeda agar loading terlihat smooth
}

// --- IDLE TIMER (AUTO LOGOUT) ---
function logoutMatiAktivitas() {
    if (!document.getElementById('view-admin').classList.contains('hidden')) {
        logout();
        showToast('Sesi berakhir otomatis. Anda tidak beraktivitas.', 'error');
    }
}

function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(logoutMatiAktivitas, IDLE_TIMEOUT);
}

function setupIdleTimer() {
    window.onmousemove = resetIdleTimer;
    window.onmousedown = resetIdleTimer; 
    window.ontouchstart = resetIdleTimer; 
    window.onclick = resetIdleTimer;     
    window.onkeydown = resetIdleTimer;   
    window.addEventListener('scroll', resetIdleTimer, true);
    resetIdleTimer();
}

function stopIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    window.onmousemove = null; window.onmousedown = null; window.ontouchstart = null;
    window.onclick = null; window.onkeydown = null;
    window.removeEventListener('scroll', resetIdleTimer, true);
}