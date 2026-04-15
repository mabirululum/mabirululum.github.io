// ----------------------------------------------------------------------
// 1. DATA SEMI-DINAMIS (SIMULASI JSON)
// Dalam praktiknya, data ini bisa berada di file 'data.json' terpisah 
// dan dipanggil menggunakan fetch() API.
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// 2. FUNGSI LOGIKA TAMPILAN (SINGLE PAGE APPLICATION)
// ----------------------------------------------------------------------
let globalBerita = [];
let currentPageBerita = 1;
let globalGaleri = [];
let currentPageGaleri = 1;
let globalStatistik = null;
// Fungsi untuk mengganti halaman tanpa reload (menyembunyikan yang lain)
function gantiHalaman(idHalaman) {
    // Ambil semua elemen dengan class 'halaman-konten'
    const semuaHalaman = document.querySelectorAll('.halaman-konten');
    
    // Sembunyikan semuanya
    semuaHalaman.forEach(halaman => {
        halaman.classList.remove('block', 'fade-in');
        halaman.classList.add('hidden');
    });

    // Tampilkan halaman yang dituju
    const halamanTujuan = document.getElementById(idHalaman);
    halamanTujuan.classList.remove('hidden');
    // Sedikit delay agar animasi CSS berjalan ulang
    setTimeout(() => {
        halamanTujuan.classList.add('block', 'fade-in');
    }, 10);

    // Scroll otomatis ke paling atas setiap ganti halaman
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Mengatur status menu aktif di navigasi desktop
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        // Reset warna
        btn.classList.remove('bg-blue-50', 'text-sekolah-biru');
        btn.classList.add('text-slate-600');
    });

    // Cari tombol yang di-klik dan beri highlight (Warna Biru)
    // Note: Logika sederhana, mencocokkan fungsi onclick sebagai string
    const tombolAktif = Array.from(navBtns).find(btn => btn.getAttribute('onclick').includes(idHalaman));
    if(tombolAktif){
        tombolAktif.classList.remove('text-slate-600');
        tombolAktif.classList.add('bg-blue-50', 'text-sekolah-biru');
    }
}

// Fungsi untuk membuka/menutup menu mobile (Hamburger Menu)
function toggleMobileMenu() {
    const menu = document.getElementById('menu-mobile');
    const ikon = document.getElementById('ikon-menu');
    
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        ikon.classList.remove('fa-bars');
        ikon.classList.add('fa-xmark'); // Ubah ikon ke 'X'
    } else {
        menu.classList.add('hidden');
        ikon.classList.remove('fa-xmark');
        ikon.classList.add('fa-bars'); // Kembalikan ke ikon garis 3
    }
}

// Fungsi Membuka Modal Berita
function bukaModalBerita(index) {
    const modal = document.getElementById('modal-berita');
    const berita = globalBerita[index];

    // Isi data ke dalam elemen-elemen di dalam modal
    document.getElementById('modal-berita-gambar').src = berita.gambar;
    document.getElementById('modal-berita-tanggal').textContent = berita.tanggal;
    document.getElementById('modal-berita-judul').textContent = berita.judul;
    // Gunakan kontenLengkap jika ada, jika tidak ada gunakan ringkasan sebagai fallback
    document.getElementById('modal-berita-konten').innerHTML = berita.kontenLengkap || berita.ringkasan;

    // Reset status scroll dan indikator saat modal baru dibuka
    const scrollArea = document.getElementById('modal-body-scroll');
    const indikator = document.getElementById('indikator-scroll');
    if(scrollArea) scrollArea.scrollTop = 0; // Kembalikan ke atas
    if(indikator) indikator.classList.remove('opacity-0'); // Munculkan indikator kembali

    // Tampilkan modal (Hapus hidden, tambahkan flex agar ke tengah)
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Cegah scroll pada body belakang agar halaman tidak ikut bergeser
    document.body.style.overflow = 'hidden';
}

// Fungsi Menutup Modal Berita
function tutupModalBerita() {
    const modal = document.getElementById('modal-berita');
    
    // Sembunyikan modal
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    
    // Kembalikan kemampuan scroll pada body
    document.body.style.overflow = 'auto';
}

// Fungsi Mendeteksi Scroll di Dalam Modal
function cekScrollModal() {
    const scrollArea = document.getElementById('modal-body-scroll');
    const indikator = document.getElementById('indikator-scroll');

    // Cek apakah elemen ada, dan sembunyikan indikator jika user scroll lebih dari 10px
    if (scrollArea && indikator) {
        if (scrollArea.scrollTop > 10) {
            indikator.classList.add('opacity-0'); // Pudar & menghilang
        } else {
            indikator.classList.remove('opacity-0'); // Muncul kembali jika ditarik ke atas lagi
        }
    }
}

function scrollSlider(id, direction) {
    const container = document.getElementById(id);
    const scrollAmount = 300; // Jarak geser px
    if (direction === 'left') {
        container.scrollLeft -= scrollAmount;
    } else {
        container.scrollLeft += scrollAmount;
    }
}

// ----------------------------------------------------------------------
// 3. FUNGSI UNTUK MERENDER DATA DARI JSON KE HTML
// ----------------------------------------------------------------------
const itemsBerita = 6;
// A. Render Data Guru
function renderDataGuru(guruData) {
    const kontainer = document.getElementById('kontainer-guru');
    let html = '';
    
    guruData.forEach(guru => {
        html += `
            <div class="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 kartu-hover">
                <img src="${guru.foto}" loading="lazy" alt="${guru.nama}" class="w-full h-64 object-cover object-center">
                <div class="p-6 text-center">
                    <h4 class="text-base font-bold text-slate-800">${guru.nama}</h4>
                    <p class="text-sekolah-birumuda text-sm mt-1">${guru.mapel}</p>
                </div>
            </div>
        `;
    });
    kontainer.innerHTML = html;
}

// B. Render Data Berita
function renderDataBerita(page = 1) {
    currentPageBerita = page;
    const kontainer = document.getElementById('kontainer-berita');
    const paginationBerita = document.getElementById('pagination-berita');
            
    // CEK KEKOSONGAN DATA
    if (!globalBerita || globalBerita.length === 0) {
        // Menjadikan div agar menempati lebar penuh (col-span-full)
        kontainer.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <i class="fa-regular fa-folder-open text-6xl text-slate-300 mb-4"></i>
                <h3 class="text-2xl font-bold text-slate-600 mb-2">Belum Ada Data Berita</h3>
                <p class="text-slate-500 max-w-md mx-auto">Kami sedang mempersiapkan informasi dan berita terbaru untuk Anda. Silakan kunjungi kembali halaman ini nanti.</p>
            </div>`;
        paginationBerita.innerHTML = ''; // Kosongkan paginasi
        return;
    }

    const startIndex = (page - 1) * itemsBerita;
    const endIndex = startIndex + itemsBerita;
    const dataDitampilkan = globalBerita.slice(startIndex, endIndex);
    let html = '';

    dataDitampilkan.forEach((berita, index) => {
        const realIndex = startIndex + index; // Untuk dikirim ke modal
        html += `
            <div class="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 kartu-hover flex flex-col">
                <img src="${berita.gambar}" alt="Berita" class="w-full h-48 object-cover">
                <div class="p-6 flex-grow flex flex-col">
                    <div class="flex items-center text-xs text-slate-500 mb-3">
                        <i class="fa-regular fa-calendar mr-2"></i> ${berita.tanggal}
                    </div>
                    <h4 class="text-xl font-bold text-slate-800 mb-2 leading-tight">${berita.judul}</h4>
                    <p class="text-slate-600 text-sm mb-4 flex-grow">${berita.ringkasan}</p>
                    <a href="#" onclick="bukaModalBerita(${realIndex}); return false;" class="text-sekolah-birumuda font-semibold text-sm hover:text-sekolah-biru transition-colors mt-auto inline-flex items-center">Baca Selengkapnya <i class="fa-solid fa-arrow-right ml-1"></i></a>
                </div>
            </div>
        `;
    });
    kontainer.innerHTML = html;
    buatPaginasi('pagination-berita', globalBerita.length, itemsBerita, page, 'renderDataBerita');
}

// C. Render Data Galeri
const itemsGaleri = 8;
function renderDataGaleri(page = 1) {
    currentPageGaleri = page;
    const kontainer = document.getElementById('kontainer-galeri');
    const paginationGaleri = document.getElementById('pagination-galeri');

    // CEK KEKOSONGAN DATA
    if (!globalGaleri || globalGaleri.length === 0) {
        // Menjadikan div agar menempati lebar penuh (col-span-full)
        kontainer.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <i class="fa-regular fa-images text-6xl text-slate-300 mb-4"></i>
                <h3 class="text-2xl font-bold text-slate-600 mb-2">Belum Ada Data Galeri</h3>
                <p class="text-slate-500 max-w-md mx-auto">Album dokumentasi kegiatan sekolah belum tersedia. Harap periksa kembali nanti.</p>
            </div>`;
        paginationGaleri.innerHTML = ''; // Kosongkan paginasi
        return;
    }

    const startIndex = (page - 1) * itemsGaleri;
    const endIndex = startIndex + itemsGaleri;
    const dataDitampilkan = globalGaleri.slice(startIndex, endIndex);
    let html = '';

    dataDitampilkan.forEach(urlGambar => {
        html += `
            <div class="rounded-xl overflow-hidden h-40 md:h-56 group cursor-pointer">
                <img src="${urlGambar}" alt="Galeri Sekolah" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
            </div>
        `;
    });
    kontainer.innerHTML = html;
    buatPaginasi('pagination-galeri', globalGaleri.length, itemsGaleri, page, 'renderDataGaleri');
}

// D. Render Data Berita Beranda
function renderBerandaBerita(beritaData) {
    const container = document.getElementById('slider-beranda-berita');
    let html = '';
    // Ambil 6 berita paling atas (terbaru)
    const beritaTerbaru = beritaData.slice(0, 6);
    
    beritaTerbaru.forEach((berita, index) => {
        html += `
            <div class="min-w-[280px] max-w-[280px] sm:min-w-[320px] sm:max-w-[320px] snap-center bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 kartu-hover flex flex-col flex-shrink-0">
                <img src="${berita.gambar}" alt="Berita" class="w-full h-44 object-cover">
                <div class="p-5 flex-grow flex flex-col">
                    <span class="text-xs font-semibold text-blue-500 mb-2"><i class="fa-regular fa-calendar mr-1"></i> ${berita.tanggal}</span>
                    <h4 class="text-lg font-bold text-slate-800 mb-2 leading-tight line-clamp-2">${berita.judul}</h4>
                    <p class="text-slate-500 text-sm mb-4 line-clamp-2">${berita.ringkasan}</p>
                    <button onclick="bukaModalBerita(${index})" class="mt-auto text-sekolah-birumuda font-semibold text-sm hover:text-sekolah-biru transition-colors inline-flex items-center text-left">Baca Selengkapnya <i class="fa-solid fa-arrow-right ml-1"></i></button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// E. Render Data Alumni
function renderAlumniSlider(alumniData) {
    const track = document.getElementById('track-alumni');
    if(!track) return;
    
    let html = '';

    const buatKartu = (alumni) => {
        let bintangHtml = '';
        for(let i=0; i<5; i++) {
            bintangHtml += `<i class="fa-${i < alumni.bintang ? 'solid' : 'regular'} fa-star text-yellow-400"></i>`;
        }

        return `
            <div class="w-[300px] sm:w-[400px] bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 flex flex-col flex-shrink-0 cursor-pointer group hover:bg-white/20 transition-colors">
                <div class="flex items-center mb-6">
                    <img src="${alumni.foto}" alt="${alumni.nama}" class="w-16 h-16 rounded-full object-cover border-2 border-yellow-400 mr-4 transition-transform duration-300 group-hover:scale-110">
                    <div>
                        <h4 class="font-bold text-lg text-white">${alumni.nama}</h4>
                        <p class="text-blue-200 text-xs">${alumni.status}</p>
                    </div>
                </div>
                <div class="mb-4 text-sm">${bintangHtml}</div>
                <p class="text-blue-50 italic flex-grow">"${alumni.ulasan}"</p>
            </div>
        `;
    };

    // Render array 2x agar animasi infinity scroll menyambung mulus
    alumniData.forEach(alumni => { html += buatKartu(alumni); });
    alumniData.forEach(alumni => { html += buatKartu(alumni); });

    track.innerHTML = html;
}

// --- FUNGSI BARU: HITUNG MUNDUR (COUNTDOWN) ---
function jalankanHitungMundur(spmbData) {
    // Ambil target tanggal dari JSON
    // const tanggalTarget = new Date("2026-07-11T23:59:59").getTime();
    const tanggalTarget = new Date(spmbData).getTime();

    // Perbarui setiap 1 detik
    const interval = setInterval(function() {
        const sekarang = new Date().getTime();
        const selisih = tanggalTarget - sekarang;

        // Jika waktu sudah habis
        if (selisih < 0) {
            clearInterval(interval);
            document.getElementById("hitung-hari").innerHTML = "00";
            document.getElementById("hitung-jam").innerHTML = "00";
            document.getElementById("hitung-menit").innerHTML = "00";
            document.getElementById("hitung-detik").innerHTML = "00";
            return;
        }

        // Kalkulasi waktu
        const hari = Math.floor(selisih / (1000 * 60 * 60 * 24));
        const jam = Math.floor((selisih % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const menit = Math.floor((selisih % (1000 * 60 * 60)) / (1000 * 60));
        const detik = Math.floor((selisih % (1000 * 60)) / 1000);

        // Tambahkan angka 0 di depan jika di bawah 10 (contoh: 09, 08)
        document.getElementById("hitung-hari").innerHTML = hari < 10 ? "0" + hari : hari;
        document.getElementById("hitung-jam").innerHTML = jam < 10 ? "0" + jam : jam;
        document.getElementById("hitung-menit").innerHTML = menit < 10 ? "0" + menit : menit;
        document.getElementById("hitung-detik").innerHTML = detik < 10 ? "0" + detik : detik;
        
    }, 1000);
}

// --- FUNGSI BARU: STATISTIK ANGKA BERJALAN (COUNTER) ---
let counterSudahJalan = false; // Mencegah animasi berjalan berulang kali

function jalankanAnimasiAngka() {
    const counters = document.querySelectorAll('.counter-angka');
    const durasi = 2000; // Total durasi animasi (2 detik)

    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target'); // Ambil target dari HTML atribut
        const increment = target / (durasi / 16); // 16ms = ~60 frame per detik
        
        let nilaiSekarang = 0;

        const updateAngka = () => {
            nilaiSekarang += increment;
            
            if (nilaiSekarang < target) {
                counter.innerText = Math.ceil(nilaiSekarang);
                requestAnimationFrame(updateAngka); // Panggil frame berikutnya
            } else {
                counter.innerText = target; // Pastikan berakhir di angka yang pas
            }
        };

        updateAngka();
    });
}

// Fungsi pendeteksi scroll untuk memicu animasi angka
window.addEventListener('scroll', () => {
    const statistikData = {
        "statistik": {
            "siswa": 96,
            "guru": 22,
            "penghargaan": 15,
            "lulusan": 510
        }
    }
    const sectionStatistik = document.getElementById('section-statistik');
    if(!sectionStatistik) return;

    const posisiElement = sectionStatistik.getBoundingClientRect().top;
    const tinggiLayar = window.innerHeight;

    // Jika elemen statistik mulai terlihat di layar, dan belum pernah jalan
    if (posisiElement < tinggiLayar - 100 && !counterSudahJalan) {
        // Atur nilai target dari JSON ke atribut HTML sebelum animasi jalan
        const counters = document.querySelectorAll('.counter-angka');
        counters[0].setAttribute('data-target', statistikData.statistik.siswa);
        counters[1].setAttribute('data-target', statistikData.statistik.guru);
        counters[2].setAttribute('data-target', statistikData.statistik.penghargaan);
        counters[3].setAttribute('data-target', statistikData.statistik.lulusan);
        
        jalankanAnimasiAngka();
        counterSudahJalan = true;
    }
});

// --- FUNGSI BARU: PENGATURAN MUSIK BACKGROUND ---
let isMusicPlaying = false;

function toggleMusic() {
    const music = document.getElementById('bg-music');
    const ikon = document.getElementById('ikon-music');
    const indikator = document.getElementById('indikator-music');
    const btn = document.getElementById('btn-music');

    if (isMusicPlaying) {
        music.pause();
        ikon.classList.replace('fa-volume-high', 'fa-music');
        ikon.classList.remove('fa-beat');
        // Kembalikan dot merah saat dijeda
        indikator.classList.remove('hidden');
    } else {
        // Mencoba memutar musik (membutuhkan interaksi pengguna terlebih dahulu)
        music.play().then(() => {
            ikon.classList.replace('fa-music', 'fa-volume-high');
            ikon.classList.add('fa-beat'); // Efek detak pada ikon
            // Hilangkan dot merah setelah musik berhasil diputar
            indikator.classList.add('hidden');
        }).catch((error) => {
            console.log("Autoplay diblokir oleh browser sampai pengguna berinteraksi.");
        });
    }
    isMusicPlaying = !isMusicPlaying;
}

// --- FUNGSI BARU: SLIDER SARANA DAN PRASARANA ---
function renderSaranaSlider(saranaData) {
    const track = document.getElementById('track-sarana');
    if(!track) return;
    
    let html = '';

    const buatKartu = (item) => `
        <div class="w-[280px] sm:w-[320px] bg-white rounded-2xl overflow-hidden shadow-md border border-slate-100 flex flex-col flex-shrink-0 cursor-pointer group">
            <div class="h-48 overflow-hidden relative">
                <img src="${item.gambar}" alt="${item.nama}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div class="p-5 flex-grow">
                <h4 class="text-xl font-bold text-slate-800 mb-2">${item.nama}</h4>
                <p class="text-slate-500 text-sm leading-relaxed">${item.deskripsi}</p>
            </div>
        </div>
    `;

    // Render array 2x (didobel) agar animasi infinity scroll terlihat menyambung mulus
    saranaData.forEach(item => { html += buatKartu(item); });
    saranaData.forEach(item => { html += buatKartu(item); });

    track.innerHTML = html;
}

// --- FUNGSI BARU: RENDER PROGRAM UNGGULAN ---
function renderProgamUnggulan(programData) {
    const container = document.getElementById('program-unggulan');
    let html = '';
    programData.forEach((program) => {
        html +=
        `
        <div class="relative rounded-2xl overflow-hidden shadow-lg kartu-hover group h-80 flex flex-col justify-end border border-slate-200">
            <img src="${program.gambar}" alt="${program.nama}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
            <div class="relative p-6 z-10">
                <div class="w-12 h-12 bg-${program.warna}-500/30 backdrop-blur-md text-${program.warna}-200 rounded-xl flex items-center justify-center text-2xl mb-4 border border-${program.warna}-400/30">
                    <i class="fa-solid fa-${program.icon}"></i>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">${program.nama}</h3>
                <p class="text-slate-300 text-sm leading-relaxed">${program.ringkasan}</p>
            </div>
        </div>
        `
    });
    container.innerHTML = html;
}

// ----------------------------------------------------------------------
// 4. LOGIKA PAGINASI
// ----------------------------------------------------------------------

function buatPaginasi(idContainer, totalItems, limit, currentPage, namaFungsi) {
    const container = document.getElementById(idContainer);
    const totalPages = Math.ceil(totalItems / limit);
    
    if (totalPages <= 1) {
        container.innerHTML = ''; // Sembunyikan jika hanya 1 halaman
        return;
    }

    let html = '';
    
    // Tombol Previous
    const classPrev = currentPage === 1 ? 'text-slate-300 border-slate-200 cursor-not-allowed' : 'text-sekolah-biru border-slate-300 hover:bg-slate-50';
    html += `<button ${currentPage === 1 ? 'disabled' : `onclick="${namaFungsi}(${currentPage - 1})"`} class="w-10 h-10 flex items-center justify-center rounded-lg border ${classPrev} transition-colors"><i class="fa-solid fa-chevron-left"></i></button>`;
    
    // Tombol Angka Halaman
    for (let i = 1; i <= totalPages; i++) {
        const classNum = currentPage === i ? 'bg-sekolah-biru text-white border-sekolah-biru font-bold shadow-md' : 'text-slate-600 border-slate-300 hover:bg-slate-50';
        html += `<button onclick="${namaFungsi}(${i})" class="w-10 h-10 flex items-center justify-center rounded-lg border ${classNum} transition-colors">${i}</button>`;
    }
    
    // Tombol Next
    const classNext = currentPage === totalPages ? 'text-slate-300 border-slate-200 cursor-not-allowed' : 'text-sekolah-biru border-slate-300 hover:bg-slate-50';
    html += `<button ${currentPage === totalPages ? 'disabled' : `onclick="${namaFungsi}(${currentPage + 1})"`} class="w-10 h-10 flex items-center justify-center rounded-lg border ${classNext} transition-colors"><i class="fa-solid fa-chevron-right"></i></button>`;
    
    container.innerHTML = html;
}

// ----------------------------------------------------------------------
// 5. LOGIKA FORMULAR PPDB
// ----------------------------------------------------------------------

function prosesPPDB(event) {
    // Mencegah halaman di-reload saat form di-submit
    event.preventDefault(); 

    // Ambil data dari form
    const nama = document.getElementById('ppdb-nama').value;
    const asal = document.getElementById('ppdb-asal').value;
    const wa = document.getElementById('ppdb-wa').value;
    
    // Nomor WhatsApp Admin Sekolah (Ubah Sesuai Kebutuhan)
    const nomorAdmin = "6283833133913"; // Gunakan format 62...
    
    // Format Pesan Teks
    const textPesan = `Halo Admin MA Bi'rul Ulum,%0A%0ASaya ingin mendaftar SPMB. Berikut data singkat saya:%0A- *Nama Lengkap*: ${nama}%0A- *Asal Sekolah*: ${asal}%0A- *No. WA*: ${wa}%0A%0AMohon panduan untuk proses pendaftaran selanjutnya. Terima kasih.`;
    
    // URL WhatsApp API
    const linkWA = `https://wa.me/${nomorAdmin}?text=${textPesan}`;
    
    // Buka tab WhatsApp
    window.open(linkWA, '_blank');
    
    // Reset form
    document.getElementById('form-ppdb').reset();
}

// ----------------------------------------------------------------------
// 6. INISIALISASI SAAT HALAMAN DIMUAT (LOAD)
// ----------------------------------------------------------------------

window.onload = async function() {
    try {
        // 👉 SET TAHUN OTOMATIS FOOTER
        const startYear = 2026;
        const currentYear = new Date().getFullYear();
        document.getElementById("tahun").textContent =
        startYear === currentYear ? startYear : `${startYear} - ${currentYear}`;

        let formYear;
        const month = new Date().getMonth();
        // Januari - Juni → tetap tahun sekarang
        if (month < 6) {
            formYear = currentYear;
        } else {
            // Juli - Desember → naik ke tahun depan
            formYear = currentYear + 1;
        }
        const endYear = currentYear + 1

        document.getElementById("tahun-ppdb").textContent = `${startYear}/${endYear}`;

        const [guruRes, beritaRes, galeriRes, alumniRes, spmbRes, saranaRes, programRes] = await Promise.all([
            fetch('data/guru.json'),
            fetch('data/berita.json'),
            fetch('data/galeri.json'),
            fetch('data/alumni.json'),
            fetch('data/spmb.json'),
            fetch('data/sarana.json'),
            fetch('data/program.json')
        ]);

        // 🔴 VALIDASI RESPONSE
        if (!guruRes.ok || !beritaRes.ok || !galeriRes.ok || !alumniRes.ok || !spmbRes.ok || !saranaRes.ok || !programRes.ok) {
            throw new Error('Salah satu file JSON gagal dimuat');
        }

        const guru = await guruRes.json();
        const berita = await beritaRes.json();
        const galeri = await galeriRes.json();
        const alumni = await alumniRes.json();
        const spmb = await spmbRes.json();
        const sarana = await saranaRes.json();
        const program = await programRes.json();

        // 🔴 VALIDASI DATA (biar aman)
        if (!Array.isArray(guru) || !Array.isArray(berita) || !Array.isArray(galeri) || !Array.isArray(alumni) || !Array.isArray(sarana) || !Array.isArray(program)) {
            throw new Error('Format JSON harus berupa array');
        }

        // gabungkan seperti data.json lama
        const data = {
            guru: guru,
            berita: berita,
            galeri: galeri,
            alumni: alumni,
            spmb: spmb,
            sarana: sarana,
            program: program
        };

        // 🔴 SIMPAN GLOBAL (PENTING UNTUK MODAL)
        globalBerita = berita;
        globalGaleri = galeri;

        // kirim data ke masing-masing function
        jalankanHitungMundur(data.spmb);
        renderBerandaBerita(data.berita);
        renderAlumniSlider(data.alumni);
        renderSaranaSlider(data.sarana);
        renderDataGuru(data.guru);
        renderProgamUnggulan(data.program);
        renderDataBerita(1);
        renderDataGaleri(1);

        // Set halaman awal
        gantiHalaman('beranda');

    } catch (error) {
        console.error('Gagal load data:', error);
    }
};