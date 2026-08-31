// HELPER MATA UANG
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

// HELPER ROMAWI
function getRomanMonth(monthIndex) {
	const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
	return roman[monthIndex];
}

// TANGGAL INDONESIA
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