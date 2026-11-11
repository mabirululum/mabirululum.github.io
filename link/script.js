/**
 * Microsite Kumpulan Link - MA Bi'rul Ulum Gedangan
 * Pengelolaan link, pemuatan data JSON, dan sistem hitung mundur 3 Gelombang PPDB
 */

let countdownInterval = null;

// Data default sebagai fallback jika dibuka via file:// tanpa web server
const DEFAULT_MICROSITE_DATA = {
    profile: {
        name: "MA Bi'rul Ulum Gedangan",
        status: "Madrasah Aliyah Terakreditasi",
        description: "Pusat informasi resmi, layanan administrasi, dan pendaftaran peserta didik baru (PPDB) MA Bi'rul Ulum Gedangan, Sidoarjo.",
        avatar: "https://res.cloudinary.com/dkfcuwuas/image/upload/q_auto,f_auto/icon-mabu_yuwogg.png",
        website: "../index.html",
        websiteLabel: "Kunjungi Website Resmi"
    },
    ppdbConfig: {
        active: true,
        currentAcademicYear: "2027/2028",
        waves: [
            {
                id: "inden",
                name: "Gelombang Inden",
                badgeText: "GELOMBANG INDEN",
                deadline: "2026-11-20T23:59:59",
                label: "Batas Waktu Pendaftaran Inden",
                description: "Daftar lebih awal untuk kuota prioritas dan kemudahan administrasi khusus siswa inden."
            },
            {
                id: "gelombang-1",
                name: "Gelombang 1",
                badgeText: "GELOMBANG 1",
                deadline: "2026-12-31T23:59:59",
                label: "Batas Waktu Pendaftaran Gelombang 1",
                description: "Pendaftaran gelombang reguler tahap 1. Amankan kursi Anda sebelum kuota terpenuhi."
            },
            {
                id: "gelombang-2",
                name: "Gelombang 2",
                badgeText: "GELOMBANG 2",
                deadline: "2027-07-11T23:59:59",
                label: "Batas Waktu Pendaftaran Gelombang 2",
                description: "Gelombang terakhir penerimaan peserta didik baru tahun ajaran ini."
            }
        ],
        closedState: {
            badgeText: "PENDAFTARAN DITUTUP",
            title: "Pendaftaran PPDB Gelombang 2 Telah Berakhir",
            description: "Pendaftaran reguler resmi ditutup. Untuk informasi pengumuman hasil seleksi, daftar ulang, atau konfirmasi kuota tambahan/susulan, silakan langsung menghubungi Panitia PPDB.",
            contactUrl: "https://wa.me/6283832515321?text=Halo%20Panitia%20PPDB%20MA%20Bi%27rul%20Ulum%2C%20apakah%20masih%20tersedia%20informasi%20sisa%20kuota%20atau%20pendaftaran%20susulan%3F",
            btnText: "Hubungi Panitia (Cek Info Kuota)"
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initMicrosite();
});

async function initMicrosite() {
    try {
        const response = await fetch('../link/links.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        renderMicrosite(data);
    } catch (err) {
        console.warn('Menggunakan fallback data bawaan (CORS / file protocol):', err);
        renderMicrosite(DEFAULT_MICROSITE_DATA);
    }
}

/**
 * Render seluruh data dinamis ke dalam DOM
 */
function renderMicrosite(data) {
    if (!data) return;

    // 1. Profil Sekolah
    if (data.profile) {
        const schoolNameEl = document.getElementById('school-name');
        const schoolDescEl = document.getElementById('school-desc');
        const schoolAvatarEl = document.getElementById('school-avatar');
        const btnWebsiteEl = document.getElementById('btn-website');

        if (schoolNameEl && data.profile.name) schoolNameEl.textContent = data.profile.name;
        if (schoolDescEl && data.profile.description) schoolDescEl.textContent = data.profile.description;
        if (schoolAvatarEl && data.profile.avatar) schoolAvatarEl.src = data.profile.avatar;
        if (btnWebsiteEl && data.profile.website) {
            btnWebsiteEl.href = data.profile.website;
            if (data.profile.websiteLabel) {
                btnWebsiteEl.innerHTML = `<i class="fa-solid fa-globe"></i> ${data.profile.websiteLabel}`;
            }
        }
    }

    // 2. Sistem Hitung Mundur 3 Gelombang PPDB
    if (data.ppdbConfig && data.ppdbConfig.active) {
        jalankanHitungMundur3Gelombang(data.ppdbConfig);
    } else {
        const bannerSection = document.getElementById('ppdb-banner-section');
        if (bannerSection) bannerSection.style.display = 'none';
    }

    // 3. Render Link Cards dari JSON (Jika ada)
    if (Array.isArray(data.links) && data.links.length > 0) {
        const linksContainer = document.getElementById('links-container');
        if (linksContainer) {
            linksContainer.innerHTML = '';
            data.links.forEach(item => {
                const card = createLinkCardElement(item);
                linksContainer.appendChild(card);
            });
        }
    }

    // 4. Render Google Maps
    if (data.map) {
        const mapTitleEl = document.getElementById('map-title');
        const mapAddressEl = document.getElementById('map-address');
        const mapFrameEl = document.getElementById('map-iframe');
        const mapBtnEl = document.getElementById('map-btn');

        if (mapTitleEl && data.map.title) mapTitleEl.textContent = data.map.title;
        if (mapAddressEl && data.map.address) mapAddressEl.textContent = data.map.address;
        if (mapFrameEl && data.map.embedUrl) mapFrameEl.src = data.map.embedUrl;
        if (mapBtnEl && data.map.mapsUrl) mapBtnEl.href = data.map.mapsUrl;
    }

    // 5. Render Media Sosial
    if (Array.isArray(data.socials) && data.socials.length > 0) {
        const socialsContainer = document.getElementById('socials-container');
        if (socialsContainer) {
            socialsContainer.innerHTML = '';
            data.socials.forEach(soc => {
                const a = document.createElement('a');
                a.href = soc.url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.className = 'social-btn';
                a.setAttribute('aria-label', soc.name);
                a.title = soc.name;
                a.innerHTML = `<i class="${soc.icon}"></i>`;
                socialsContainer.appendChild(a);
            });
        }
    }
}

/**
 * Logika Hitung Mundur 3 Gelombang (Inden -> Gelombang 1 -> Gelombang 2 -> Ditutup)
 */
function jalankanHitungMundur3Gelombang(config) {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    const waves = config.waves || [];
    const closedState = config.closedState || {};

    const activeContent = document.getElementById('countdown-active-content');
    const closedContent = document.getElementById('countdown-closed-content');
    const waveBadge = document.getElementById('wave-badge');
    const waveYearTag = document.getElementById('wave-year-tag');
    const waveTitle = document.getElementById('wave-title');
    const waveDeadlineDate = document.getElementById('wave-deadline-date');

    const daysEl = document.getElementById('timer-days');
    const hoursEl = document.getElementById('timer-hours');
    const minutesEl = document.getElementById('timer-minutes');
    const secondsEl = document.getElementById('timer-seconds');

    if (waveYearTag && config.currentAcademicYear) {
        waveYearTag.textContent = `TA ${config.currentAcademicYear}`;
    }

    function perbaruiWaktu() {
        const sekarang = new Date().getTime();
        let targetWave = null;
        let activeIndex = -1;

        // Cari gelombang pertama yang deadlinenya masih di masa depan
        for (let i = 0; i < waves.length; i++) {
            const deadlineTime = new Date(waves[i].deadline).getTime();
            if (deadlineTime > sekarang) {
                targetWave = waves[i];
                activeIndex = i;
                break;
            }
        }

        // KASUS 1: Masih ada gelombang yang buka (Inden / Gelombang 1 / Gelombang 2)
        if (targetWave) {
            if (activeContent) activeContent.style.display = 'block';
            if (closedContent) closedContent.style.display = 'none';

            if (waveBadge) waveBadge.textContent = targetWave.badgeText || targetWave.name.toUpperCase();
            if (waveTitle) waveTitle.textContent = targetWave.label || `Batas Pendaftaran ${targetWave.name}`;
            if (waveDeadlineDate) waveDeadlineDate.textContent = formatTanggalIndonesia(targetWave.deadline);

            const selisih = new Date(targetWave.deadline).getTime() - sekarang;

            const hari = Math.floor(selisih / (1000 * 60 * 60 * 24));
            const jam = Math.floor((selisih % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const menit = Math.floor((selisih % (1000 * 60 * 60)) / (1000 * 60));
            const detik = Math.floor((selisih % (1000 * 60)) / 1000);

            if (daysEl) daysEl.textContent = padZero(hari);
            if (hoursEl) hoursEl.textContent = padZero(jam);
            if (minutesEl) minutesEl.textContent = padZero(menit);
            if (secondsEl) secondsEl.textContent = padZero(detik);

            // Perbarui Indikator Visual Stepper 3 Tahap
            updateStepper(activeIndex);

        } else {
            // KASUS 2: MELEWATI GELOMBANG 2 (PENDAFTARAN DITUTUP)
            // Tampilkan pesan elegan & solusi kontak panitia
            clearInterval(countdownInterval);

            if (activeContent) activeContent.style.display = 'none';
            if (closedContent) closedContent.style.display = 'block';

            if (waveBadge) {
                waveBadge.textContent = closedState.badgeText || "PENDAFTARAN DITUTUP";
                waveBadge.style.background = "#ef4444";
                waveBadge.style.color = "#ffffff";
            }

            const closedTitle = document.getElementById('closed-title');
            const closedDesc = document.getElementById('closed-desc');
            const closedBtn = document.getElementById('closed-cta-btn');

            if (closedTitle && closedState.title) closedTitle.textContent = closedState.title;
            if (closedDesc && closedState.description) closedDesc.textContent = closedState.description;
            if (closedBtn) {
                if (closedState.contactUrl) closedBtn.href = closedState.contactUrl;
                if (closedState.btnText) {
                    closedBtn.innerHTML = `<i class="fa-brands fa-whatsapp"></i> ${escapeHtml(closedState.btnText)}`;
                }
            }

            // Tandai seluruh stepper sebagai selesai
            updateStepper(waves.length);
        }
    }

    perbaruiWaktu();
    countdownInterval = setInterval(perbaruiWaktu, 1000);
}

/**
 * Perbarui tampilan visual 3 tahapan (Inden, Gel. 1, Gel. 2)
 */
function updateStepper(activeIndex) {
    const stepIds = ['step-inden', 'step-gelombang-1', 'step-gelombang-2'];

    stepIds.forEach((id, index) => {
        const stepEl = document.getElementById(id);
        if (!stepEl) return;

        const circleEl = stepEl.querySelector('.step-circle');

        if (index < activeIndex) {
            // Sudah lewat (Passed)
            stepEl.className = 'wave-step passed';
            if (circleEl) circleEl.innerHTML = '<i class="fa-solid fa-check"></i>';
        } else if (index === activeIndex) {
            // Sedang aktif sekarang (Active)
            stepEl.className = 'wave-step active';
            if (circleEl) circleEl.textContent = (index + 1);
        } else {
            // Belum dimulai (Upcoming)
            stepEl.className = 'wave-step';
            if (circleEl) circleEl.textContent = (index + 1);
        }
    });
}

/**
 * Format string tanggal ISO ke format bahasa Indonesia
 * Contoh: 2026-11-20T23:59:59 -> 20 November 2026
 */
function formatTanggalIndonesia(isoString) {
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString;

        const bulan = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];

        const tgl = date.getDate();
        const bln = bulan[date.getMonth()];
        const thn = date.getFullYear();

        return `${tgl} ${bln} ${thn}`;
    } catch (e) {
        return isoString;
    }
}

/**
 * Tambahkan angka 0 di depan jika < 10
 */
function padZero(num) {
    return num < 10 ? '0' + Math.max(0, num) : String(num);
}

/**
 * Membuat elemen kartu link
 */
function createLinkCardElement(item) {
    const a = document.createElement('a');
    a.href = item.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = `link-card kartu-hover ${item.featured ? 'link-card-featured' : ''}`;

    let iconClass = 'icon-blue';
    let badgeClass = 'badge-blue';

    if (item.id === 'gform-ppdb' || item.featured) {
        iconClass = 'icon-blue';
        badgeClass = 'badge-populer';
    } else if (item.id === 'drive-brosur') {
        iconClass = 'icon-drive';
        badgeClass = 'badge-drive';
    } else if (item.id === 'wa-admin') {
        iconClass = 'icon-wa-admin';
        badgeClass = 'badge-wa';
    } else if (item.id === 'wa-panitia') {
        iconClass = 'icon-wa-panitia';
        badgeClass = 'badge-blue';
    } else if (item.id === 'wa-grup') {
        iconClass = 'icon-wa-grup';
        badgeClass = 'badge-drive';
    }

    a.innerHTML = `
        <div class="link-icon-box ${iconClass}">
            <i class="${item.icon}"></i>
        </div>
        <div class="link-content">
            <div class="link-header">
                <span class="link-title">${escapeHtml(item.title)}</span>
                ${item.badge ? `<span class="link-badge ${badgeClass}">${escapeHtml(item.badge)}</span>` : ''}
            </div>
            <p class="link-desc">${escapeHtml(item.subtitle || item.description || '')}</p>
        </div>
        <div class="link-arrow">
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </div>
    `;

    return a;
}

/**
 * Salin Tautan / Bagikan Halaman
 */
function bagikanHalaman() {
    const url = window.location.href;
    const shareData = {
        title: "Kumpulan Link Resmi MA Bi'rul Ulum Gedangan",
        text: "Portal Tautan Resmi & Layanan Informasi PPDB MA Bi'rul Ulum Gedangan, Sidoarjo.",
        url: url
    };

    if (navigator.share) {
        navigator.share(shareData).catch(() => {
            salinKeClipboard(url);
        });
    } else {
        salinKeClipboard(url);
    }
}

/**
 * Salin ke Clipboard dan tampilkan Toast
 */
function salinKeClipboard(teks) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(teks).then(() => {
            tampilkanToast("Tautan berhasil disalin ke clipboard!");
        }).catch(() => {
            fallbackSalin(teks);
        });
    } else {
        fallbackSalin(teks);
    }
}

function fallbackSalin(teks) {
    const input = document.createElement('input');
    input.value = teks;
    document.body.appendChild(input);
    input.select();
    try {
        document.execCommand('copy');
        tampilkanToast("Tautan berhasil disalin ke clipboard!");
    } catch (err) {
        tampilkanToast("Gagal menyalin tautan.");
    }
    document.body.removeChild(input);
}

/**
 * Tampilkan pesan toast melayang
 */
function tampilkanToast(pesan) {
    const toast = document.getElementById('toast-notice');
    const toastText = document.getElementById('toast-text');
    if (!toast) return;

    if (toastText) toastText.textContent = pesan;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
}

/**
 * Utility escape HTML
 */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
