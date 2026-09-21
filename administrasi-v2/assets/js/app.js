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

function loadScripts(index) {
    if (index >= appScripts.length) {
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
        return; // Semua script selesai dimuat
    }
    
    let script = document.createElement('script');
    script.src = appScripts[index];
    
    // Tunggu script ini selesai di-load, baru lanjut ke script berikutnya
    script.onload = function() {
        loadScripts(index + 1);
    };
    
    script.onerror = function() {
        console.error("❌ Gagal memuat: " + appScripts[index]);
    };
    
    document.body.appendChild(script);
}

// Mulai eksekusi dari urutan ke-0
loadScripts(0);