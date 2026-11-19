const appScripts = [
  "/administrasi-v2/assets/js/config/config.js",
  "/administrasi-v2/assets/js/utils/helpers.js",
  "/administrasi-v2/assets/js/utils/ui.js",
  "/administrasi-v2/assets/js/services/supabase.js",
  "/administrasi-v2/assets/js/services/database-ops.js",
  "/administrasi-v2/assets/js/core/academic.js",
  "/administrasi-v2/assets/js/auth/session.js",
  "/administrasi-v2/assets/js/modules/tables/table-core.js",
  "/administrasi-v2/assets/js/modules/tables/table-loaders.js",
  "/administrasi-v2/assets/js/modules/tables/crud-handler.js",
  "/administrasi-v2/assets/js/modules/transactions/pemasukan-spp.js",
  "/administrasi-v2/assets/js/modules/transactions/pemasukan-atribut.js",
  "/administrasi-v2/assets/js/modules/transactions/pengeluaran.js",
  "/administrasi-v2/assets/js/modules/transactions/lainnya.js",
  "/administrasi-v2/assets/js/modules/transactions/master-data.js",
  "/administrasi-v2/assets/js/modules/transactions/master-guru.js",
  "/administrasi-v2/assets/js/modules/transactions/hr-tendik.js",
  "/administrasi-v2/assets/js/modules/transactions/hr-ekstra-bbqs.js",
  "/administrasi-v2/assets/js/modules/transactions/potongan-tendik.js",
  "/administrasi-v2/assets/js/modules/reports/export-excel.js",
  "/administrasi-v2/assets/js/modules/reports/laporan-cetak.js",
  "/administrasi-v2/assets/js/modules/reports/surat-tagihan.js",
  "/administrasi-v2/assets/js/modules/dashboard/dashboard.js",
  "/administrasi-v2/assets/js/modules/portal-siswa/siswa-app.js",
  "/administrasi-v2/assets/js/modules/dashboard/changelog.js",
];

function initAllEvents() {
    console.log("⏳ Memulai pemasangan radar event...");

    // 🚀 DAFTARKAN SEMUA NAMA FUNGSI DI SINI (Berupa teks String)
    const allSetupFunctions = [
        "setupAuthEvents", "setupUIEvents", "setupDashboardEvents",
        "setupTableCoreEvents", "setupPemasukanSppEvents", 
        "setupPemasukanAtributEvents", "setupBantuanInfaqEvents", 
        "setupPengeluaranEvents", "setupTarifEvents", "setupCrudEvents", 
        "setupAcademicEvents", "setupLaporanCetakEvents", 
        "setupSuratCetakEvents", "setupExcelEvents", "setupSiswaEvents",
        "setupHRTendikEvents", "setupMasterGuruEvents", "setupPotonganEvents",
        "setupChangelogEvents", "setupHREkstraBBQSEvents"
    ];

    // 🚀 PUTAR (LOOPING) DAN JALANKAN DENGAN AMAN
    allSetupFunctions.forEach(function(namaFungsi) {
        // Cek apakah fungsinya benar-benar ada di memori Windows (Browser)
        if (typeof window[namaFungsi] === 'function') {
            window[namaFungsi](); // Jalankan fungsinya
        } else {
            // Beri peringatan kuning (bukan error merah) agar aplikasi tidak macet
            console.warn(`⚠️ Radar terlewat: Fungsi ${namaFungsi}() tidak ditemukan atau belum dibuat.`);
        }
    });

    console.log("✅ Semua modul sistem berhasil dimuat!");
    dismissSplashScreen();
}

// 🚀 FUNGSI TUTUP SPLASH SCREEN SECARA HALUS
function dismissSplashScreen() {
    const splash = document.getElementById('app-splash-screen');
    if (!splash || splash.dataset.dismissed) return;
    splash.dataset.dismissed = "true";

    const statusText = document.getElementById('splash-status-text');
    if (statusText) statusText.innerText = "Sistem siap!";

    // Jeda 250ms agar animasi "Sistem siap!" terbaca, lalu fade-out lembut
    setTimeout(function() {
        splash.style.opacity = '0';
        splash.style.pointerEvents = 'none';
        setTimeout(function() {
            if (splash.parentNode) splash.parentNode.removeChild(splash);
        }, 500);
    }, 250);
}

// Pengaman otomatis: Splash screen akan tetap tertutup jika ada kendala jaringan eksternal
setTimeout(dismissSplashScreen, 7000);

// 🚀 PEMUATAN PARALEL TERATUR (High-Performance Parallel Loader)
// Mengunduh seluruh modul bersamaan di jaringan (paralel), namun dieksekusi teratur sesuai urutan array
function loadScriptsParallel() {
    let loadedCount = 0;
    const total = appScripts.length;

    for (let i = 0; i < total; i++) {
        const script = document.createElement('script');
        script.src = appScripts[i];
        script.async = false; // Memaksa browser mengeksekusi sesuai urutan append tanpa menahan unduhan paralel
        
        script.onload = function() {
            loadedCount++;
            if (loadedCount === total) {
                initAllEvents();
            }
        };
        
        script.onerror = function() {
            console.error("❌ Gagal memuat: " + appScripts[i]);
            loadedCount++;
            if (loadedCount === total) {
                initAllEvents();
            }
        };
        
        document.body.appendChild(script);
    }
}

// Mulai pemuatan paralel teratur
loadScriptsParallel();