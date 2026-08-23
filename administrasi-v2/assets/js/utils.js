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