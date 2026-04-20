// --- KONFIGURASI API ---
const SPREADSHEET_API_URL = 'https://script.google.com/macros/s/AKfycbz9DRGWln9-uERCFOom2p0fZXmsIyiUsYqS_2HqBA6o55NsPOpnQ4uPDwf3JHvpVLZ6Rw/exec'; 

// Menyimpan data spreadsheet di memori setelah di-fetch pertama kali
let dataGlobal = [];
let isDataLoaded = false;

const AUTO_REFRESH_INTERVAL = 5000; // 5 detik
let autoRefreshTimer = null;

// Kunci kolom untuk Tabel Biodata (sesuai dataset)
const kolomBiodata = [
    "NIS", "Nama Lengkap", "L/P", "Kelas"
];

// Kunci kolom untuk Tabel Rekap (sesuai dataset)
const kolomRekap = [
    "Juli", "Agustus", "September", "Oktober", 
    "November", "Desember", "Januari", "Februari", "Maret", 
    "April", "Mei", "Juni", "Daftar Ulang", "Total Kekurangan"
];

// Kunci kolom untuk Tabel Tagihan (sesuai dataset)
const kolomTagihan = [
    "Tagihan PTS 1", 
    "Tagihan PAS 1", 
    "Tagihan PTS 2", 
    "Tagihan PAS 2"
];

/**
 * Mengambil data dari server.
 * Dipanggil saat user menekan tombol cari untuk pertama kalinya.
 */
async function fetchLaluCari() {
    const btnCari = document.getElementById('btnCari');
    // Nonaktifkan tombol sementara untuk mencegah SPAM KLIK (Melindungi Limit API)
    // btnCari.disabled = true; 
    // Tampilkan popup loading
    document.getElementById('loadingModal').style.display = 'flex';

    try {
        // UNTUK PRODUKSI (Hapus komennya jika URL sudah dimasukkan):
        // 1. Cache Busting: Menggunakan waktu saat ini (milidetik) agar URL selalu unik
        const timestamp = new Date().getTime(); 
        const fetchUrl = `${SPREADSHEET_API_URL}?t=${timestamp}`;
        
        // 2. Opsi cache: "no-store" memaksa browser TIDAK MENGGUNAKAN data simpanan lama
        const response = await fetch(fetchUrl, { 
            cache: "no-store",
            redirect: "follow"
        });
        const jsonResult = await response.json();
        dataGlobal = jsonResult.data;
        
        // Tutup popup loading dan jalankan pencarian
        document.getElementById('loadingModal').style.display = 'none';
        prosesPencarian();

    } catch (error) {
        console.error(error);
        document.getElementById('loadingModal').style.display = 'none';
        // btnCari.disabled = false;
        tampilkanModal("Gagal mengambil data dari server. Periksa koneksi atau URL API Anda.");
    }
}

/**
 * Fungsi yang dipicu saat tombol diklik
 */
function cariDataSiswa() {
    const noInduk = document.getElementById('inputNoInduk').value.trim();
    if (noInduk === "") {
        tampilkanModal("Silakan masukkan Nomor Induk terlebih dahulu.");
        return;
    }

    // Sembunyikan hasil lama
    document.getElementById('resultContainer').style.display = 'none';

    fetchLaluCari();
}

/**
 * Mencari dan merender data siswa ke dalam tabel HTML
 */
function prosesPencarian() {
    const noInduk = document.getElementById('inputNoInduk').value.trim();
    const siswa = dataGlobal.find(s => s["NIS"] === noInduk);

    if (siswa) {
        renderTabel(siswa, 'tabelRekapBiodata', kolomBiodata);
        renderTabel(siswa, 'tabelRekapBody', kolomRekap);
        renderTabel(siswa, 'tabelTagihanBody', kolomTagihan);
        
        // Tampilkan wadah hasil
        document.getElementById('resultContainer').style.display = 'block';
    } else {
        tampilkanModal(`Siswa dengan Nomor Induk "${noInduk}" tidak ditemukan.`);
    }
}

/**
 * Fungsi bantuan untuk membuat baris tabel vertikal (Property : Value)
 */
function renderTabel(dataSiswa, idTabelTarget, arrayKolom) {
    const tbody = document.getElementById(idTabelTarget);
    tbody.innerHTML = '';

    arrayKolom.forEach(kolom => {
        const tr = document.createElement('tr');
        let nilai = dataSiswa[kolom] || "-";
        
        // Format khusus untuk nominal uang atau status Lunas
        let tdContent = nilai;
        let nilaiCek = nilai.toString().toLowerCase().trim();

        // Beri badge hijau jika lunas/0, beri badge merah jika belum lunas/ada nominal
        if (nilaiCek === "lunas" || nilaiCek === "0" || nilaiCek === "rp 0" || nilaiCek === "-") {
            if (kolom.includes("Total") || kolom.includes("Tagihan")) {
                tdContent = `<span class="badge badge-lunas">LUNAS / Rp 0</span>`;
            } else {
                tdContent = `<span class="badge badge-lunas">LUNAS</span>`;
            }
        } else if (nilaiCek.includes("rp") || nilaiCek.includes("belum") || /^\(\d+(\.\d+)*\)$/.test(nilaiCek)) {
            tdContent = `<span class="badge badge-belum">${nilai}</span>`;
        }

        tr.innerHTML = `
            <th>${kolom}</th>
            <td>${tdContent}</td>
        `;
        tbody.appendChild(tr);
    });
}

// --- Event Listener & Pop-Up ---
function handleEnter(event) {
    if (event.key === "Enter") {
        cariDataSiswa();
    }
}

function tampilkanModal(pesan) {
    document.getElementById('modalMessage').innerText = pesan;
    document.getElementById('customModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('customModal').style.display = 'none';
}

// 👉 SET TAHUN OTOMATIS FOOTER
const startYear = 2026;
const currentYear = new Date().getFullYear();
document.getElementById("tahun").textContent =
startYear === currentYear ? startYear : `${startYear} - ${currentYear}`;
