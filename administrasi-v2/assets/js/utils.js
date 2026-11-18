// ==========================================
// file: utils.js
// Fungsi: Kumpulan alat bantu (Mata uang, Tanggal, Notifikasi UI)
// ==========================================

// --- UTILITAS TANGGAL & WAKTU ---
const getNowDateIndo = () => {
    const now = new Date();
    const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${now.getDate()} ${bulan[now.getMonth()]} ${now.getFullYear()}`;
};

const getNowTime = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(now.getHours())}.${pad(now.getMinutes())}.${pad(now.getSeconds())}`;
};

const formatDateIndo = (dateString) => {
    if (!dateString) return '-';
    
    // Pecah string '2025-09-28' menjadi array ['2025', '09', '28']
    // Memecah manual lebih aman daripada new Date() untuk menghindari bug zona waktu peramban
    const parts = dateString.split('-'); 
    if (parts.length !== 3) return dateString; // Jika format salah, kembalikan teks aslinya

    const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const tanggal = parseInt(parts[2], 10); // Menghilangkan angka 0 di depan (misal '09' jadi 9)
    const indexBulan = parseInt(parts[1], 10) - 1; // Kurangi 1 karena index array dimulai dari 0
    const tahun = parts[0];

    return `${tanggal} ${bulan[indexBulan]} ${tahun}`;
};

// --- UTILITAS MATA UANG & TERBILANG ---
const formatRp = (angka) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
}).format(angka);

function penyebut(nilai) {
    let val = Math.floor(Math.abs(nilai));
    let huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    let temp = "";

    if (val < 12) { temp = huruf[val]; } 
    else if (val < 20) { temp = penyebut(val - 10) + " Belas"; } 
    else if (val < 100) { temp = penyebut(Math.floor(val / 10)) + " Puluh " + penyebut(val % 10); } 
    else if (val < 200) { temp = "Seratus " + penyebut(val - 100); } 
    else if (val < 1000) { temp = penyebut(Math.floor(val / 100)) + " Ratus " + penyebut(val % 100); } 
    else if (val < 2000) { temp = "Seribu " + penyebut(val - 1000); } 
    else if (val < 1000000) { temp = penyebut(Math.floor(val / 1000)) + " Ribu " + penyebut(val % 1000); } 
    else if (val < 1000000000) { temp = penyebut(Math.floor(val / 1000000)) + " Juta " + penyebut(val % 1000000); } 
    else if (val < 1000000000000) { temp = penyebut(Math.floor(val / 1000000000)) + " Miliar " + penyebut(val % 1000000000); } 
    else if (val < 1000000000000000) { temp = penyebut(Math.floor(val / 1000000000000)) + " Triliun " + penyebut(val % 1000000000000); }
    return temp;
}

function terbilang(nilai) {
    if (nilai === 0) return "Nol Rupiah";
    let hasil = penyebut(nilai).replace(/\s+/g, ' ').trim();
    return hasil + " Rupiah";
}

// --- UTILITAS UI (LOADING & TOAST) ---
function showLoading(msg = "Memuat data...") {
    document.getElementById('loading-text').innerText = msg;
    document.getElementById('loading-overlay').classList.remove('hidden');
    document.getElementById('loading-overlay').classList.add('flex');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
    document.getElementById('loading-overlay').classList.remove('flex');
}

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').innerText = msg;
    
    toast.className = `fixed bottom-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 flex items-center z-50 ${type === 'success' ? 'bg-emerald-600' : (type === 'info' ? 'bg-blue-600' : 'bg-red-600')}`;
    
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000);
}

function getItemsPerPage() {
    const availableHeight = window.innerHeight - 360;
    const rowHeight = 65;
    let items = Math.floor(availableHeight / rowHeight);
    return items < 5 ? 5 : (items > 20 ? 20 : items);
}

function tampilkanModalNotif(judul, pesan, tipe) {
    const modal = document.getElementById('modal-notifikasi');
    const iconContainer = document.getElementById('notif-icon-container');
    const icon = document.getElementById('notif-icon');
    const title = document.getElementById('notif-title');
    const message = document.getElementById('notif-message');
    const btn = document.getElementById('notif-btn');

    title.innerText = judul;
    message.innerText = pesan;
    btn.classList.add('hidden'); // Sembunyikan tombol secara default

    // Atur Tema Berdasarkan Tipe
    if (tipe === 'loading') {
        iconContainer.className = 'mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 bg-blue-100 text-blue-600';
        icon.className = 'ph ph-spinner animate-spin text-4xl';
    } else if (tipe === 'warning') {
        iconContainer.className = 'mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 bg-yellow-100 text-yellow-600';
        icon.className = 'ph ph-warning-circle text-4xl';
        btn.className = 'w-full py-2.5 rounded-lg font-medium text-white transition-colors bg-yellow-500 hover:bg-yellow-600 block';
        btn.innerText = 'Mengerti';
    } else if (tipe === 'error') {
        iconContainer.className = 'mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 bg-red-100 text-red-600';
        icon.className = 'ph ph-x-circle text-4xl';
        btn.className = 'w-full py-2.5 rounded-lg font-medium text-white transition-colors bg-red-500 hover:bg-red-600 block';
        btn.innerText = 'Tutup';
    } else if (tipe === 'success') {
        iconContainer.className = 'mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 bg-emerald-100 text-emerald-600';
        icon.className = 'ph ph-check-circle text-4xl';
        btn.className = 'w-full py-2.5 rounded-lg font-medium text-white transition-colors bg-emerald-500 hover:bg-emerald-600 block';
        btn.innerText = 'Selesai';
    }

    // Tampilkan Modal dengan Animasi
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95');
        modal.querySelector('div').classList.add('scale-100');
    }, 10);
}

function tutupModalNotif() {
    const modal = document.getElementById('modal-notifikasi');
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.remove('scale-100');
    modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

// HELPER PETUGAS & BENDAHARA DINAMIS
function getCurrentAdmin() {
    if (typeof currentUserData !== 'undefined' && currentUserData) {
        return currentUserData;
    }
    try {
        const saved = sessionStorage.getItem('mabu_admin_user');
        if (saved) {
            currentUserData = JSON.parse(saved);
            return currentUserData;
        }
    } catch (e) {}
    return null;
}

function getInfoBendahara() {
    const adminNow = getCurrentAdmin();
    if (adminNow && (adminNow.role === 'Admin' || String(adminNow.role || '').toLowerCase().includes('bendahara'))) {
        return {
            nama: adminNow.nama || 'Bendahara Madrasah',
            urlTtd: adminNow.url_ttd || adminNow.urlTtd || ''
        };
    }
    if (typeof dbAdmin !== 'undefined' && Array.isArray(dbAdmin)) {
        const bendaharaDb = dbAdmin.find(u => u.role === 'Admin' || String(u.nama || '').toLowerCase().includes('ririn'));
        if (bendaharaDb) {
            return {
                nama: bendaharaDb.nama || 'Ririn Jauharin, S.Ak.',
                urlTtd: bendaharaDb.urlTtd || bendaharaDb.url_ttd || ''
            };
        }
    }
    return {
        nama: adminNow?.nama || 'Ririn Jauharin, S.Ak.',
        urlTtd: adminNow?.url_ttd || adminNow?.urlTtd || ''
    };
}