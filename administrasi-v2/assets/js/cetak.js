// ==========================================
// file: cetak.js
// Fungsi: Kalkulasi Tagihan, Cetak Surat, Rekap, dan Kwitansi
// ==========================================

// --- MESIN KALKULASI TAGIHAN ---
function isTarifTargetMatch(targetString, taTarif, siswaProfile) {
    let target = String(targetString).toUpperCase().trim();
    let sNis = String(siswaProfile.nis).trim();
    let sLp = String(siswaProfile.lp).toUpperCase().trim();

    if (target === 'SEMUA KELAS') return true;
    if (target === `NIS ${sNis}`) return true;

    let sKelasHistoris = getHistoricalClass(siswaProfile, taTarif).toUpperCase();
    if(sKelasHistoris === "") return false;

    let sGrade = sKelasHistoris.split(' ')[0];
    let targetGender = null;
    let cleanTarget = target;
    
    if (target.includes('(L)')) { targetGender = 'L'; cleanTarget = target.replace('(L)', '').trim(); }
    else if (target.includes('(P)')) { targetGender = 'P'; cleanTarget = target.replace('(P)', '').trim(); }
    else if (target.endsWith(' L')) { targetGender = 'L'; cleanTarget = target.replace(/ L$/, '').trim(); }
    else if (target.endsWith(' P')) { targetGender = 'P'; cleanTarget = target.replace(/ P$/, '').trim(); }

    if (targetGender && targetGender !== sLp) return false;
    if (cleanTarget === sKelasHistoris) return true;
    if (cleanTarget === sGrade) return true;

    return false;
}

function getHistoricalClass(siswaProfile, taTarget) {
    let tMasuk = parseInt(String(siswaProfile.tahunMasuk).split('/')[0]) || 0;
    let tTarif = parseInt(String(taTarget).split('/')[0]) || 0;
    if (tTarif < tMasuk) return "";
    let diff = tTarif - tMasuk + 1;
    
    if(diff === 1) return String(siswaProfile.kelas1).trim();
    if(diff === 2) return String(siswaProfile.kelas2).trim();
    if(diff === 3) return String(siswaProfile.kelas3).trim();
    
    return String(siswaProfile.kelas).trim(); 
}

// function calculateSiswaBilling(siswaProfile, tarifList, bayarList) {
//     let thnMasukInt = parseInt(String(siswaProfile.tahunMasuk).split('/')[0]) || 0;
//     let rawApplicableTarifs = tarifList.filter(t => !t.isDeleted && isTarifTargetMatch(t.target, t.tahun, siswaProfile));

//     let uniqueTarifsMap = {};
//     rawApplicableTarifs.forEach(t => {
//         let key = `${t.tahun}-${t.jenis}`;
//         let isNisTarget = String(t.target).toUpperCase().includes('NIS');
//         if (!uniqueTarifsMap[key] || isNisTarget) uniqueTarifsMap[key] = t;
//     });
//     let applicableTarifs = Object.values(uniqueTarifsMap);

//     const blnArr = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];

//     let finalTarifs = [];
//     applicableTarifs.forEach(t => {
//         let thnTarifInt = parseInt(String(t.tahun).split('/')[0]) || 0;
//         let isSPP = String(t.jenis).toUpperCase().includes('SPP');
//         let activeBulanMulai = 'Juli';
//         if (thnTarifInt === thnMasukInt && siswaProfile.bulanMulai) {
//             activeBulanMulai = siswaProfile.bulanMulai;
//         }

//         if (isSPP) {
//             let monthOfSPP = blnArr.find(b => String(t.jenis).toUpperCase().includes(b.toUpperCase()));
//             if (monthOfSPP) {
//                 let startIndex = blnArr.findIndex(b => b.toLowerCase() === activeBulanMulai.toLowerCase());
//                 if (startIndex === -1) startIndex = 0;
//                 let sppIndex = blnArr.findIndex(b => b === monthOfSPP);
//                 if (sppIndex >= startIndex) finalTarifs.push(t);
//             } else finalTarifs.push(t);
//         } else finalTarifs.push(t);
//     });

//     let bulanan = [], lainnya = [], trueGlobalDebt = 0, rawSisaList = [];

//     finalTarifs.forEach(t => {
//         let bayarItem = bayarList.filter(b => !b.isDeleted && b.jenis === t.jenis && b.tahun === t.tahun).reduce((sum, b) => sum + parseInt(b.nominal || 0), 0);
//         let sisa = parseInt(t.nominal || 0) - bayarItem;
//         let status = sisa <= 0 ? 'LUNAS' : sisa;

//         if (sisa > 0) {
//             trueGlobalDebt += sisa;
//             rawSisaList.push({ jenis: t.jenis, sisa: sisa, tahun: t.tahun, nominalAwal: t.nominal });
//         }

//         if (String(t.jenis).toUpperCase().includes('SPP')) bulanan.push({ jenis: t.jenis, tahun: t.tahun, sisa: status, nominalAwal: t.nominal });
//         else lainnya.push({ jenis: t.jenis, tahun: t.tahun, sisa: status, nominalAwal: t.nominal });
//     });

//     bulanan.sort((a, b) => {
//         let mA = blnArr.findIndex(m => String(a.jenis).toUpperCase().includes(m.toUpperCase()));
//         let mB = blnArr.findIndex(m => String(b.jenis).toUpperCase().includes(m.toUpperCase()));
//         return mA - mB;
//     });

//     let currentMonth = new Date().getMonth();
//     let examName = "", maxSppIndex = 0, excludeKeywords = [];

//     if (currentMonth >= 6 && currentMonth <= 9) { examName = "PTS 1 (Semester Ganjil)"; maxSppIndex = 3; excludeKeywords = ['PAS 1', 'PTS 2', 'PAS 2']; } 
//     else if (currentMonth >= 10 && currentMonth <= 11) { examName = "PAS 1 (Semester Ganjil)"; maxSppIndex = 5; excludeKeywords = ['PTS 2', 'PAS 2']; } 
//     else if (currentMonth >= 0 && currentMonth <= 2) { examName = "PTS 2 (Semester Genap)"; maxSppIndex = 8; excludeKeywords = ['PAS 2']; } 
//     else { examName = "PAS 2 / Kenaikan Kelas"; maxSppIndex = 11; excludeKeywords = []; }

//     let examReqAmount = 0;
//     let thnAjaranArr = [...new Set(finalTarifs.map(r => r.tahun))].sort().reverse();
//     let activeThnAjaran = thnAjaranArr.length > 0 ? thnAjaranArr[0] : "2025/2026";

//     rawSisaList.filter(r => r.tahun === activeThnAjaran).forEach(r => {
//         let isSPP = String(r.jenis).toUpperCase().includes('SPP');
//         if (isSPP) {
//             let m = blnArr.find(b => String(r.jenis).toUpperCase().includes(b.toUpperCase()));
//             let sppIndex = blnArr.findIndex(b => b === m);
//             if (sppIndex <= maxSppIndex) examReqAmount += r.sisa;
//         } else {
//             let shouldInclude = true;
//             excludeKeywords.forEach(kw => { if (String(r.jenis).toUpperCase().includes(kw)) shouldInclude = false; });
//             if (shouldInclude) examReqAmount += r.sisa;
//         }
//     });

//     return {
//         bulanan: bulanan,
//         lainnya: lainnya,
//         totalTunggakan: trueGlobalDebt,
//         examWidget: { name: examName, amount: examReqAmount, isLunas: examReqAmount === 0 },
//         riwayatTahun: thnAjaranArr,
//         hutangLamaMurni: rawSisaList.filter(r => r.tahun !== activeThnAjaran).reduce((sum, r) => sum + r.sisa, 0)
//     };
// }

// ==========================================
// BATCH 1: DASHBOARD SISWA (KALKULATOR ATRIBUT)
// ==========================================

function calculateSiswaBilling(siswaProfile, tarifList, bayarList) {
    let thnMasukInt = parseInt(String(siswaProfile.tahunMasuk).split('/')[0]) || 0;
    let rawApplicableTarifs = tarifList.filter(t => !t.isDeleted && isTarifTargetMatch(t.target, t.tahun, siswaProfile));

    let uniqueTarifsMap = {};
    rawApplicableTarifs.forEach(t => {
        let key = `${t.tahun}-${t.jenis}`;
        let isNisTarget = String(t.target).toUpperCase().includes('NIS');
        if (!uniqueTarifsMap[key] || isNisTarget) uniqueTarifsMap[key] = t;
    });
    let applicableTarifs = Object.values(uniqueTarifsMap);

    const blnArr = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];

    let finalTarifs = [];
    applicableTarifs.forEach(t => {
        let thnTarifInt = parseInt(String(t.tahun).split('/')[0]) || 0;
        let isSPP = String(t.jenis).toUpperCase().includes('SPP');
        let activeBulanMulai = 'Juli';
        if (thnTarifInt === thnMasukInt && siswaProfile.bulanMulai) {
            activeBulanMulai = siswaProfile.bulanMulai;
        }

        if (isSPP) {
            let monthOfSPP = blnArr.find(b => String(t.jenis).toUpperCase().includes(b.toUpperCase()));
            if (monthOfSPP) {
                let startIndex = blnArr.findIndex(b => b.toLowerCase() === activeBulanMulai.toLowerCase());
                if (startIndex === -1) startIndex = 0;
                let sppIndex = blnArr.findIndex(b => b === monthOfSPP);
                if (sppIndex >= startIndex) finalTarifs.push(t);
            } else finalTarifs.push(t);
        } else finalTarifs.push(t);
    });

    let bulanan = [], lainnya = [], trueGlobalDebt = 0, rawSisaList = [];

    // 1. Kalkulasi Tagihan Master (SPP & Uang Gedung, dll)
    finalTarifs.forEach(t => {
        let bayarItem = bayarList.filter(b => !b.isDeleted && b.jenis === t.jenis && b.tahun === t.tahun).reduce((sum, b) => sum + parseInt(b.nominal || 0), 0);
        let sisa = parseInt(t.nominal || 0) - bayarItem;
        let status = sisa <= 0 ? 'LUNAS' : sisa;

        if (sisa > 0) {
            trueGlobalDebt += sisa;
            rawSisaList.push({ jenis: t.jenis, sisa: sisa, tahun: t.tahun, nominalAwal: t.nominal });
        }

        if (String(t.jenis).toUpperCase().includes('SPP')) bulanan.push({ jenis: t.jenis, tahun: t.tahun, sisa: status, nominalAwal: t.nominal });
        else lainnya.push({ jenis: t.jenis, tahun: t.tahun, sisa: status, nominalAwal: t.nominal });
    });

    // ==========================================
    // 🛡️ FITUR BARU: INJEKSI HUTANG ATRIBUT
    // ==========================================
    if (typeof dbPemasukanAtribut !== 'undefined') {
        const transaksiAtribut = dbPemasukanAtribut.filter(t => String(t.nis).trim() === String(siswaProfile.nis).trim() && !t.isDeleted);
        const atributInduk = transaksiAtribut.filter(t => !t.idRef && !t.id_nota_referensi);

        atributInduk.forEach(induk => {
            let totalBayarAtribut = Number(induk.nominal) || 0;
            const cicilanAtribut = transaksiAtribut.filter(t => t.idRef === induk.id || t.id_nota_referensi === induk.id);
            cicilanAtribut.forEach(c => totalBayarAtribut += (Number(c.nominal) || 0));

            const hargaAsli = Number(induk.hargaKatalog) || Number(induk.harga_katalog) || 0;
            const sisaAtribut = hargaAsli - totalBayarAtribut;

            if (sisaAtribut > 0) {
                // Jika masih menunggak:
                trueGlobalDebt += sisaAtribut;
                rawSisaList.push({ jenis: `Atribut: ${induk.jenis}`, sisa: sisaAtribut, tahun: induk.tahun, nominalAwal: hargaAsli });
                lainnya.push({ jenis: `Atribut: ${induk.jenis}`, tahun: induk.tahun, sisa: sisaAtribut, nominalAwal: hargaAsli });
            } else {
                // Jika LUNAS, tetap tampilkan sebagai transparansi agar wali murid lega
                lainnya.push({ jenis: `Atribut: ${induk.jenis}`, tahun: induk.tahun, sisa: 'LUNAS', nominalAwal: hargaAsli });
            }
        });
    }
    // ==========================================

    bulanan.sort((a, b) => {
        let mA = blnArr.findIndex(m => String(a.jenis).toUpperCase().includes(m.toUpperCase()));
        let mB = blnArr.findIndex(m => String(b.jenis).toUpperCase().includes(m.toUpperCase()));
        return mA - mB;
    });

    let currentMonth = new Date().getMonth();
    let examName = "", maxSppIndex = 0, excludeKeywords = [];

    if (currentMonth >= 6 && currentMonth <= 9) { examName = "PTS 1 (Semester Ganjil)"; maxSppIndex = 3; excludeKeywords = ['PAS 1', 'PTS 2', 'PAS 2']; } 
    else if (currentMonth >= 10 && currentMonth <= 11) { examName = "PAS 1 (Semester Ganjil)"; maxSppIndex = 5; excludeKeywords = ['PTS 2', 'PAS 2']; } 
    else if (currentMonth >= 0 && currentMonth <= 2) { examName = "PTS 2 (Semester Genap)"; maxSppIndex = 8; excludeKeywords = ['PAS 2']; } 
    else { examName = "PAS 2 / Kenaikan Kelas"; maxSppIndex = 11; excludeKeywords = []; }

    let examReqAmount = 0;
    
    // Perbaikan: Gabungkan daftar tahun dari Tarif dan Atribut agar dropdown filter tahun tidak terlewat
    let allYearsMerged = [...finalTarifs.map(r => r.tahun), ...lainnya.map(l => l.tahun)];
    let thnAjaranArr = [...new Set(allYearsMerged)].sort().reverse();
    let activeThnAjaran = thnAjaranArr.length > 0 ? thnAjaranArr[0] : "2025/2026";

    rawSisaList.filter(r => r.tahun === activeThnAjaran).forEach(r => {
        let isSPP = String(r.jenis).toUpperCase().includes('SPP');
        if (isSPP) {
            let m = blnArr.find(b => String(r.jenis).toUpperCase().includes(b.toUpperCase()));
            let sppIndex = blnArr.findIndex(b => b === m);
            if (sppIndex <= maxSppIndex) examReqAmount += r.sisa;
        } else {
            let shouldInclude = true;
            excludeKeywords.forEach(kw => { if (String(r.jenis).toUpperCase().includes(kw)) shouldInclude = false; });
            if (shouldInclude) examReqAmount += r.sisa;
        }
    });

    return {
        bulanan: bulanan,
        lainnya: lainnya,
        totalTunggakan: trueGlobalDebt,
        examWidget: { name: examName, amount: examReqAmount, isLunas: examReqAmount === 0 },
        riwayatTahun: thnAjaranArr,
        hutangLamaMurni: rawSisaList.filter(r => r.tahun !== activeThnAjaran).reduce((sum, r) => sum + r.sisa, 0)
    };
}

// --- FUNGSI CETAK LAPORAN REKAP, SURAT, & OPERASIONAL ---
function setLaporanTab(tabName) {
    const btnRekap = document.getElementById('tab-laporan-rekap');
    const btnSurat = document.getElementById('tab-laporan-surat');
    const btnOps = document.getElementById('tab-laporan-operasional');
    const btnNonOps = document.getElementById('tab-laporan-nonops');

    const contentRekap = document.getElementById('laporan-content-rekap');
    const contentSurat = document.getElementById('laporan-content-surat');
    const contentOps = document.getElementById('laporan-content-operasional');
    const contentNonOps = document.getElementById('laporan-content-nonops');

    // Desain class untuk tombol Aktif dan Tidak Aktif
    const classAktif = "pb-3 text-sm font-bold border-b-2 border-emerald-600 text-emerald-600 transition-colors";
    const classNonAktif = "pb-3 text-sm font-bold border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors";

    if(tabName === 'rekap') {
        btnRekap.className = classAktif;
        btnSurat.className = classNonAktif;
        btnOps.className = classNonAktif;
        btnNonOps.className = classNonAktif;

        contentRekap.classList.remove('hidden'); contentRekap.classList.add('flex');
        contentSurat.classList.add('hidden'); contentSurat.classList.remove('flex');
        contentOps.classList.add('hidden'); contentOps.classList.remove('flex');
        contentNonOps.classList.add('hidden'); contentOps.classList.remove('flex');
    } 
    else if(tabName === 'surat') {
        btnSurat.className = classAktif;
        btnRekap.className = classNonAktif;
        btnOps.className = classNonAktif;
        btnNonOps.className = classNonAktif;

        contentSurat.classList.remove('hidden'); contentSurat.classList.add('flex');
        contentRekap.classList.add('hidden'); contentRekap.classList.remove('flex');
        contentOps.classList.add('hidden'); contentOps.classList.remove('flex');
        contentNonOps.classList.add('hidden'); contentOps.classList.remove('flex');
    } 
    else if(tabName === 'operasional') {
        btnOps.className = classAktif;
        btnRekap.className = classNonAktif;
        btnSurat.className = classNonAktif;
        btnNonOps.className = classNonAktif;

        contentOps.classList.remove('hidden'); contentOps.classList.add('flex');
        contentRekap.classList.add('hidden'); contentRekap.classList.remove('flex');
        contentSurat.classList.add('hidden'); contentSurat.classList.remove('flex');
        contentNonOps.classList.add('hidden'); contentOps.classList.remove('flex');
    }
    else if(tabName === 'nonops') {
        btnNonOps.className = classAktif;
        btnOps.className = classNonAktif;
        btnRekap.className = classNonAktif;
        btnSurat.className = classNonAktif;

        contentNonOps.classList.remove('hidden'); contentOps.classList.remove('flex');
        contentOps.classList.add('hidden'); contentOps.classList.add('flex');
        contentRekap.classList.add('hidden'); contentRekap.classList.remove('flex');
        contentSurat.classList.add('hidden'); contentSurat.classList.remove('flex');
    }
}

// function generateLaporanCetak() {
//     const ta = document.getElementById('cetak-tahun').value;
//     const kls = document.getElementById('cetak-kelas').value;
//     if (!ta || !kls) { showToast('Pilih Tahun Ajaran dan Kelas dulu!', 'error'); return; }
    
//     document.getElementById('cetak-result-container').classList.remove('hidden');
//     document.getElementById('cetak-result-container').classList.add('flex');
//     document.getElementById('cap-subtitle').innerText = `KELAS: ${kls} | TAHUN AJARAN: ${ta}`;
//     document.getElementById('cap-date').innerText = `Dicetak pada: ${getNowDateIndo()}`;

//     let listSiswa = dbSiswa.filter(s => {
//         let histClass = getHistoricalClass(s, ta).toUpperCase();
//         return histClass === String(kls).toUpperCase();
//     }).sort((a,b) => a.nama.localeCompare(b.nama));

//     let applicableTarifsToClass = dbMasterTarif.filter(t => {
//         if (t.isDeleted || t.tahun !== ta) return false;
//         let dummyL = { nis: 'DUMMY', lp: 'L', tahunMasuk: ta, kelas1: kls };
//         let dummyP = { nis: 'DUMMY', lp: 'P', tahunMasuk: ta, kelas1: kls };
//         return isTarifTargetMatch(t.target, ta, dummyL) || isTarifTargetMatch(t.target, ta, dummyP) || String(t.target).includes('NIS');
//     });

//     let setTagihanUnik = new Set(); 
//     applicableTarifsToClass.forEach(t => setTagihanUnik.add(t.jenis)); 
//     let headerTagihan = Array.from(setTagihanUnik);
    
//     if (listSiswa.length === 0) {
//         document.getElementById('cap-table-container').innerHTML = `<p class="text-center text-red-500 py-10">Tidak ada data siswa aktif di kelas ${kls} pada tahun ajaran ${ta}.</p>`;
//         return;
//     }

//     let htmlTable = `<table class="table-rekap"><thead style="vertical-align: middle;"><tr><th>No</th><th>NIS</th><th>Nama Siswa</th>`;
//     headerTagihan.forEach(th => htmlTable += `<th>${th}</th>`);
//     htmlTable += `<th class="text-red-600 bg-red-50">Tunggakan Th. Lalu</th><th>TOTAL KEKURANGAN</th></tr></thead><tbody>`;
//     let riwayatThnIni = dbPembayaran.filter(p => !p.isDeleted && p.tahun === ta);

//     listSiswa.forEach((siswa, idx) => {
//         htmlTable += `<tr><td class="text-center">${idx + 1}</td><td class="text-center">${siswa.nis}</td><td>${siswa.nama}</td>`;
//         let riwayatSiswa = riwayatThnIni.filter(p => String(p.nis).trim() === String(siswa.nis).trim());
//         let totalTunggakSiswa = 0;

//         headerTagihan.forEach(tagihan => {
//             let matchedTarifs = applicableTarifsToClass.filter(t => t.jenis === tagihan && isTarifTargetMatch(t.target, ta, siswa));
//             let tarifItem = null;
//             if (matchedTarifs.length > 0) tarifItem = matchedTarifs.find(t => String(t.target).toUpperCase().includes('NIS')) || matchedTarifs[0];
            
//             if (!tarifItem) { htmlTable += `<td class="text-center text-gray-400">-</td>`; } 
//             else {
//                 let isSPP = String(tagihan).toUpperCase().includes('SPP');
//                 let skipSPP = false;
//                 if (isSPP) {
//                     const blnArr = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
//                     let thnMasukInt = parseInt(String(siswa.tahunMasuk).split('/')[0]) || 0;
//                     let thnTarifInt = parseInt(ta.split('/')[0]) || 0;
//                     let activeBulanMulai = 'Juli';
//                     if (thnTarifInt === thnMasukInt && siswa.bulanMulai) activeBulanMulai = siswa.bulanMulai;

//                     let startIndex = blnArr.findIndex(b => b.toLowerCase() === activeBulanMulai.toLowerCase());
//                     if (startIndex === -1) startIndex = 0;
//                     let monthOfSPP = blnArr.find(b => String(tagihan).toUpperCase().includes(b.toUpperCase()));
//                     if (monthOfSPP) {
//                         let sppIndex = blnArr.findIndex(b => b === monthOfSPP);
//                         if (sppIndex < startIndex) skipSPP = true;
//                     }
//                 }

//                 if (skipSPP) { htmlTable += `<td class="text-center text-gray-400">-</td>`; } 
//                 else {
//                     let totalBayarItem = riwayatSiswa.filter(r => r.jenis === tagihan).reduce((sum, r) => sum + parseInt(r.nominal), 0);
//                     let sisa = parseInt(tarifItem.nominal) - totalBayarItem;
//                     if (sisa <= 0) { htmlTable += `<td class="bg-lunas">LUNAS</td>`; } 
//                     else {
//                         totalTunggakSiswa += sisa;
//                         htmlTable += `<td class="text-center font-semibold text-red-600">${formatRp(sisa).replace('Rp', '')}</td>`;
//                     }
//                 }
//             }
//         });

//         // Tunggakan Masa Lalu
//         let thnTargetInt = parseInt(ta.split('/')[0]);
//         let tunggakanLama = 0;
//         let pastTarifs = dbMasterTarif.filter(t => !t.isDeleted && parseInt(t.tahun.split('/')[0]) < thnTargetInt && isTarifTargetMatch(t.target, t.tahun, siswa));
//         let pastPayments = dbPembayaran.filter(p => !p.isDeleted && String(p.nis).trim() === String(siswa.nis).trim() && parseInt(p.tahun.split('/')[0]) < thnTargetInt);
        
//         let uniquePastMap = {};
//         pastTarifs.forEach(t => { let key = `${t.tahun}-${t.jenis}`; let isNisT = String(t.target).toUpperCase().includes('NIS'); if (!uniquePastMap[key] || isNisT) uniquePastMap[key] = t; });
        
//         Object.values(uniquePastMap).forEach(t => {
//             let isSkip = false;
//             if(String(t.jenis).toUpperCase().includes('SPP')) {
//                 let tMasuk = parseInt(String(siswa.tahunMasuk).split('/')[0]); let tTarif = parseInt(String(t.tahun).split('/')[0]);
//                 if(tTarif === tMasuk && siswa.bulanMulai) {
//                     const ba = ['Juli','Agustus','September','Oktober','November','Desember','Januari','Februari','Maret','April','Mei','Juni'];
//                     let si = ba.findIndex(b => b.toLowerCase() === siswa.bulanMulai.toLowerCase()); if(si===-1) si=0;
//                     let ms = ba.find(b => String(t.jenis).toUpperCase().includes(b.toUpperCase()));
//                     if(ms && ba.findIndex(b => b === ms) < si) isSkip = true;
//                 }
//             }
//             if(!isSkip) {
//                 let byr = pastPayments.filter(p => p.jenis === t.jenis && p.tahun === t.tahun).reduce((sum, p) => sum + parseInt(p.nominal), 0);
//                 let sisa = parseInt(t.nominal) - byr;
//                 if(sisa > 0) tunggakanLama += sisa;
//             }
//         });

//         if(tunggakanLama > 0) htmlTable += `<td class="text-center font-bold text-red-600 bg-red-50">${formatRp(tunggakanLama).replace('Rp', '')}</td>`;
//         else htmlTable += `<td class="text-center text-gray-400">-</td>`;

//         let grandTotal = totalTunggakSiswa + tunggakanLama;
//         if(grandTotal === 0) htmlTable += `<td class="bg-lunas">LUNAS</td></tr>`; 
//         else htmlTable += `<td class="text-tunggak">${formatRp(grandTotal)}</td></tr>`;
//     });
//     htmlTable += `</tbody></table>`;
//     document.getElementById('cap-table-container').innerHTML = htmlTable;
// }

function generateLaporanCetak() {
    const ta = document.getElementById('cetak-tahun').value;
    const kls = document.getElementById('cetak-kelas').value;
    if (!ta || !kls) { showToast('Pilih Tahun Ajaran dan Kelas dulu!', 'error'); return; }
    
    document.getElementById('cetak-result-container').classList.remove('hidden');
    document.getElementById('cetak-result-container').classList.add('flex');
    document.getElementById('cap-subtitle').innerText = `KELAS: ${kls} | TAHUN AJARAN: ${ta}`;
    document.getElementById('cap-date').innerText = `Dicetak pada: ${getNowDateIndo()}`;

    let listSiswa = dbSiswa.filter(s => {
        let histClass = getHistoricalClass(s, ta).toUpperCase();
        return histClass === String(kls).toUpperCase();
    }).sort((a,b) => a.nama.localeCompare(b.nama));

    let applicableTarifsToClass = dbMasterTarif.filter(t => {
        if (t.isDeleted || t.tahun !== ta) return false;
        let dummyL = { nis: 'DUMMY', lp: 'L', tahunMasuk: ta, kelas1: kls };
        let dummyP = { nis: 'DUMMY', lp: 'P', tahunMasuk: ta, kelas1: kls };
        return isTarifTargetMatch(t.target, ta, dummyL) || isTarifTargetMatch(t.target, ta, dummyP) || String(t.target).includes('NIS');
    });

    let setTagihanUnik = new Set(); 
    applicableTarifsToClass.forEach(t => setTagihanUnik.add(t.jenis)); 
    let headerTagihan = Array.from(setTagihanUnik);
    
    if (listSiswa.length === 0) {
        document.getElementById('cap-table-container').innerHTML = `<p class="text-center text-red-500 py-10">Tidak ada data siswa aktif di kelas ${kls} pada tahun ajaran ${ta}.</p>`;
        return;
    }

    // --- FITUR BARU: TAMBAH HEADER KOLOM ATRIBUT ---
    let htmlTable = `<table class="table-rekap"><thead style="vertical-align: middle;"><tr><th>No</th><th>NIS</th><th>Nama Siswa</th>`;
    headerTagihan.forEach(th => htmlTable += `<th>${th}</th>`);
    htmlTable += `<th class="text-orange-600 bg-orange-50">Hutang Atribut</th><th class="text-red-600 bg-red-50">Tunggakan Th. Lalu</th><th>TOTAL KEKURANGAN</th></tr></thead><tbody>`;
    
    let riwayatThnIni = dbPembayaran.filter(p => !p.isDeleted && p.tahun === ta);

    listSiswa.forEach((siswa, idx) => {
        htmlTable += `<tr><td class="text-center">${idx + 1}</td><td class="text-center">${siswa.nis}</td><td>${siswa.nama}</td>`;
        let riwayatSiswa = riwayatThnIni.filter(p => String(p.nis).trim() === String(siswa.nis).trim());
        let totalTunggakSiswa = 0;

        // 1. Loop SPP / Tagihan Utama
        headerTagihan.forEach(tagihan => {
            let matchedTarifs = applicableTarifsToClass.filter(t => t.jenis === tagihan && isTarifTargetMatch(t.target, ta, siswa));
            let tarifItem = null;
            if (matchedTarifs.length > 0) tarifItem = matchedTarifs.find(t => String(t.target).toUpperCase().includes('NIS')) || matchedTarifs[0];
            
            if (!tarifItem) { htmlTable += `<td class="text-center text-gray-400">-</td>`; } 
            else {
                let isSPP = String(tagihan).toUpperCase().includes('SPP');
                let skipSPP = false;
                if (isSPP) {
                    const blnArr = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
                    let thnMasukInt = parseInt(String(siswa.tahunMasuk).split('/')[0]) || 0;
                    let thnTarifInt = parseInt(ta.split('/')[0]) || 0;
                    let activeBulanMulai = 'Juli';
                    if (thnTarifInt === thnMasukInt && siswa.bulanMulai) activeBulanMulai = siswa.bulanMulai;

                    let startIndex = blnArr.findIndex(b => b.toLowerCase() === activeBulanMulai.toLowerCase());
                    if (startIndex === -1) startIndex = 0;
                    let monthOfSPP = blnArr.find(b => String(tagihan).toUpperCase().includes(b.toUpperCase()));
                    if (monthOfSPP) {
                        let sppIndex = blnArr.findIndex(b => b === monthOfSPP);
                        if (sppIndex < startIndex) skipSPP = true;
                    }
                }

                if (skipSPP) { htmlTable += `<td class="text-center text-gray-400">-</td>`; } 
                else {
                    let totalBayarItem = riwayatSiswa.filter(r => r.jenis === tagihan).reduce((sum, r) => sum + parseInt(r.nominal), 0);
                    let sisa = parseInt(tarifItem.nominal) - totalBayarItem;
                    if (sisa <= 0) { htmlTable += `<td class="bg-lunas">LUNAS</td>`; } 
                    else {
                        totalTunggakSiswa += sisa;
                        htmlTable += `<td class="text-center font-semibold text-red-600">${formatRp(sisa).replace('Rp', '')}</td>`;
                    }
                }
            }
        });

        // ==========================================
        // --- FITUR BARU: KALKULATOR HUTANG ATRIBUT ---
        // ==========================================
        let hutangAtributSiswa = 0;
        
        // Cari semua transaksi atribut siswa ini
        const transaksiAtribut = typeof dbPemasukanAtribut !== 'undefined' 
            ? dbPemasukanAtribut.filter(t => String(t.nis).trim() === String(siswa.nis).trim() && !t.isDeleted) 
            : [];
            
        // Cari nota induk (baik tahun ini maupun tahun lalu, karena atribut dihitung total)
        const atributInduk = transaksiAtribut.filter(t => !t.idRef && !t.id_nota_referensi);

        atributInduk.forEach(induk => {
            let totalBayarAtribut = Number(induk.nominal) || 0;
            // Cari cicilan
            const cicilanAtribut = transaksiAtribut.filter(t => t.idRef === induk.id || t.id_nota_referensi === induk.id);
            cicilanAtribut.forEach(c => totalBayarAtribut += (Number(c.nominal) || 0));

            const hargaAsli = Number(induk.hargaKatalog) || Number(induk.harga_katalog) || 0;
            const sisaAtribut = hargaAsli - totalBayarAtribut;

            if (sisaAtribut > 0) {
                hutangAtributSiswa += sisaAtribut;
            }
        });

        // Cetak kolom atribut di tabel
        if (hutangAtributSiswa > 0) {
            htmlTable += `<td class="text-center font-bold text-orange-600 bg-orange-50">${formatRp(hutangAtributSiswa).replace('Rp', '')}</td>`;
        } else {
            htmlTable += `<td class="text-center text-gray-400">-</td>`;
        }
        // ==========================================

        // 3. Tunggakan Masa Lalu (SPP / Tagihan Lama)
        let thnTargetInt = parseInt(ta.split('/')[0]);
        let tunggakanLama = 0;
        let pastTarifs = dbMasterTarif.filter(t => !t.isDeleted && parseInt(t.tahun.split('/')[0]) < thnTargetInt && isTarifTargetMatch(t.target, t.tahun, siswa));
        let pastPayments = dbPembayaran.filter(p => !p.isDeleted && String(p.nis).trim() === String(siswa.nis).trim() && parseInt(p.tahun.split('/')[0]) < thnTargetInt);
        
        let uniquePastMap = {};
        pastTarifs.forEach(t => { let key = `${t.tahun}-${t.jenis}`; let isNisT = String(t.target).toUpperCase().includes('NIS'); if (!uniquePastMap[key] || isNisT) uniquePastMap[key] = t; });
        
        Object.values(uniquePastMap).forEach(t => {
            let isSkip = false;
            if(String(t.jenis).toUpperCase().includes('SPP')) {
                let tMasuk = parseInt(String(siswa.tahunMasuk).split('/')[0]); let tTarif = parseInt(String(t.tahun).split('/')[0]);
                if(tTarif === tMasuk && siswa.bulanMulai) {
                    const ba = ['Juli','Agustus','September','Oktober','November','Desember','Januari','Februari','Maret','April','Mei','Juni'];
                    let si = ba.findIndex(b => b.toLowerCase() === siswa.bulanMulai.toLowerCase()); if(si===-1) si=0;
                    let ms = ba.find(b => String(t.jenis).toUpperCase().includes(b.toUpperCase()));
                    if(ms && ba.findIndex(b => b === ms) < si) isSkip = true;
                }
            }
            if(!isSkip) {
                let byr = pastPayments.filter(p => p.jenis === t.jenis && p.tahun === t.tahun).reduce((sum, p) => sum + parseInt(p.nominal), 0);
                let sisa = parseInt(t.nominal) - byr;
                if(sisa > 0) tunggakanLama += sisa;
            }
        });

        if(tunggakanLama > 0) htmlTable += `<td class="text-center font-bold text-red-600 bg-red-50">${formatRp(tunggakanLama).replace('Rp', '')}</td>`;
        else htmlTable += `<td class="text-center text-gray-400">-</td>`;

        // 4. Grand Total (Digabungkan dengan Hutang Atribut)
        let grandTotal = totalTunggakSiswa + tunggakanLama + hutangAtributSiswa;
        if(grandTotal === 0) htmlTable += `<td class="bg-lunas">LUNAS</td></tr>`; 
        else htmlTable += `<td class="text-tunggak">${formatRp(grandTotal)}</td></tr>`;
    });
    
    htmlTable += `</tbody></table>`;
    document.getElementById('cap-table-container').innerHTML = htmlTable;
}

function downloadLaporanImage() {
    showToast('Memproses Gambar...', 'info');
    const targetDiv = document.getElementById("capture-area");

    if (typeof domtoimage === 'undefined') { showToast('Library gagal dimuat.', 'error'); return; }

    const scale = 2;
    const width = targetDiv.scrollWidth;
    const height = targetDiv.scrollHeight;

    domtoimage.toPng(targetDiv, { 
        bgcolor: '#ffffff', width: width * scale, height: height * scale,
        style: { transform: `scale(${scale})`, transformOrigin: 'top left', width: width + 'px', height: height + 'px' }
    }).then(function (dataUrl) {
        const now = new Date();
        const tanggal = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
        const jam = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0');
        const kelas = document.getElementById('cetak-kelas').value;
        const link = document.createElement("a");
        link.download = `${tanggal}_${jam}_REKAP_${kelas}.png`; link.href = dataUrl; link.click();
        showToast('Gambar WA siap!', 'success');
    }).catch(function (error) {
        console.error('Error dom-to-image!', error);
        showToast('Gagal memproses gambar.', 'error');
    });
}

// --- FUNGSI SURAT TAGIHAN ---
function setSuratMode(mode) {
    const btnIndv = document.getElementById('btn-mode-individu'); const btnMassal = document.getElementById('btn-mode-massal');
    const formIndv = document.getElementById('form-surat-individu'); const formMassal = document.getElementById('form-surat-massal');
    document.getElementById('surat-preview-container').classList.add('hidden');
    if(mode === 'individu') {
        btnIndv.className = "px-4 py-2 text-sm font-medium rounded-md bg-white text-blue-600 shadow-sm transition-all";
        btnMassal.className = "px-4 py-2 text-sm font-medium rounded-md text-gray-500 hover:text-gray-700 transition-all";
        formIndv.classList.remove('hidden'); formIndv.classList.add('flex'); formMassal.classList.add('hidden'); formMassal.classList.remove('flex');
    } else {
        btnMassal.className = "px-4 py-2 text-sm font-medium rounded-md bg-white text-blue-600 shadow-sm transition-all";
        btnIndv.className = "px-4 py-2 text-sm font-medium rounded-md text-gray-500 hover:text-gray-700 transition-all";
        formMassal.classList.remove('hidden'); formMassal.classList.add('flex'); formIndv.classList.add('hidden'); formIndv.classList.remove('flex');
    }
}

function getRomanMonth(monthIndex) { const roman = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']; return roman[monthIndex]; }

// function getFilteredTunggakan(billingData, keperluan) {
//     let maxSppIndex = 11, excludedLainnya = [];
//     if (keperluan === 'Syarat Ujian PTS 1') { maxSppIndex = 3; excludedLainnya = ['PAS 1', 'PTS 2', 'PAS 2', 'KENAIKAN']; } 
//     else if (keperluan === 'Syarat Ujian PAS 1') { maxSppIndex = 5; excludedLainnya = ['PTS 2', 'PAS 2', 'KENAIKAN']; } 
//     else if (keperluan === 'Syarat Ujian PTS 2') { maxSppIndex = 8; excludedLainnya = ['PAS 2', 'KENAIKAN']; }

//     const blnArr = ['Juli','Agustus','September','Oktober','November','Desember','Januari','Februari','Maret','April','Mei','Juni'];
//     let activeThnAjaran = billingData.riwayatTahun[0] || ""; 
//     let filteredList = [], totalHitung = 0;

//     billingData.bulanan.forEach(b => {
//         if(b.sisa !== 'LUNAS' && b.sisa > 0) {
//             if (b.tahun === activeThnAjaran && keperluan !== 'Umum' && keperluan !== 'Syarat Ujian PAS 2 / Kenaikan Kelas') {
//                 let m = blnArr.find(bln => String(b.jenis).toUpperCase().includes(bln.toUpperCase()));
//                 let sppIndex = blnArr.findIndex(bln => bln === m);
//                 if (sppIndex <= maxSppIndex) { filteredList.push(b); totalHitung += b.sisa; }
//             } else { filteredList.push(b); totalHitung += b.sisa; }
//         }
//     });

//     billingData.lainnya.forEach(l => {
//         if(l.sisa !== 'LUNAS' && l.sisa > 0) {
//             if (l.tahun === activeThnAjaran && keperluan !== 'Umum' && keperluan !== 'Syarat Ujian PAS 2 / Kenaikan Kelas') {
//                 let isExcluded = excludedLainnya.some(kw => String(l.jenis).toUpperCase().includes(kw));
//                 if (!isExcluded) { filteredList.push(l); totalHitung += l.sisa; }
//             } else { filteredList.push(l); totalHitung += l.sisa; }
//         }
//     });

//     return { items: filteredList, total: totalHitung };
// }

// function buildSuratHTML(siswa, filteredSurat, keperluan, index, isLast = true) {
//     let now = new Date();
//     let romanMonth = getRomanMonth(now.getMonth());
//     let year = now.getFullYear();
//     let numSequence = String(index).padStart(3, '0');
//     let noSurat = `TA / ${numSequence} / MA-BU / ${romanMonth} / ${year}`;
//     let kalimatKeperluan = keperluan !== 'Umum' ? `sebagai salah satu syarat untuk mengikuti kegiatan <b>${keperluan}</b>` : `untuk kelancaran administrasi sekolah`;

//     let groupedItems = [], sppGroups = {};
//     filteredSurat.items.forEach(item => {
//         let jenisUpper = String(item.jenis).toUpperCase();
//         if (jenisUpper.includes('SPP')) {
//             let month = item.jenis.replace(/SPP/i, '').trim();
//             let key = `${item.tahun}_${item.nominalAwal}`;
//             if (!sppGroups[key]) sppGroups[key] = { jenis: 'SPP', months: [], tahun: item.tahun, sisa: 0 };
//             sppGroups[key].months.push(month);
//             sppGroups[key].sisa += item.sisa;
//         } else {
//             groupedItems.push({ jenis: item.jenis, tahun: item.tahun, sisa: item.sisa });
//         }
//     });

//     let finalItems = [];
//     Object.values(sppGroups).forEach(g => { finalItems.push({ jenis: `SPP (${g.months.join(', ')})`, tahun: g.tahun, sisa: g.sisa }); });
//     finalItems = finalItems.concat(groupedItems);

//     let tableRows = '';
//     finalItems.forEach((item, i) => {
//         tableRows += `<tr><td style="text-align: center;">${i + 1}</td><td>${item.jenis} ${item.tahun ? `(${item.tahun})` : ''}</td><td style="text-align: right;">${formatRp(item.sisa)}</td></tr>`;
//     });

//     return `
//     <div class="surat-font" style="position: relative; padding-top: ${index > 1 ? '15px' : '0'}; ${!isLast ? 'page-break-after: always;' : ''}">
//         <img src="/administrasi/assets/img/kop-madrasah.jpg" style="width: 100%; height: auto; padding-bottom: 5px; margin-bottom: 10px;" alt="Kop Surat">
//         <table style="width: 100%; margin-bottom: 15px;">
//             <tr><td style="width: 70px;">Nomor</td><td style="width: 10px;">:</td><td>${noSurat}</td><td style="text-align: right;">Sidoarjo, ${getNowDateIndo()}</td></tr>
//             <tr><td>Lampiran</td><td>:</td><td>-</td><td></td></tr>
//             <tr><td>Perihal</td><td>:</td><td><b>Tagihan Administrasi</b></td><td></td></tr>
//         </table>
//         <p>Kepada Yth.<br><b>Bapak/Ibu Wali Murid dari:</b></p>
//         <table style="margin-left: 20px; margin-bottom: 10px;">
//             <tr><td style="width: 120px;">Nama</td><td style="width: 10px;">:</td><td><b>${siswa.nama}</b></td></tr>
//             <tr><td>NIS</td><td>:</td><td>${siswa.nis}</td></tr>
//             <tr><td>Kelas</td><td>:</td><td>${siswa.kelas}</td></tr>
//         </table>
//         <p><i>Assalamu'alaikum Wr. Wb.</i></p>
//         <p style="text-align: justify; text-indent: 50px;">Alhamdulillah Wassholaatu Wassalaamu Alaa Rasulillah amma Ba’du. Salam silaturrahim kami sampaikan teriring doa semoga bapak ibu selalu dalam perlindungan Allah SWT dalam melaksanakan aktivitas kita sehari-hari. Amin Amin Ya Mujibassailin.</p>
//         <p style="text-align: justify; text-indent: 50px;">Bersama surat ini, kami memberitahukan rincian tanggungan administrasi keuangan putra/putri Bapak/Ibu ${kalimatKeperluan}. Berikut adalah rincian tagihan yang belum terselesaikan:</p>
//         <table class="surat-table">
//             <thead><tr><th style="width: 50px;">No</th><th>Jenis Pembayaran</th><th style="width: 150px;">Kekurangan (Rp)</th></tr></thead>
//             <tbody>
//                 ${tableRows}
//                 <tr><td colspan="2" style="text-align: right; font-weight: bold;">TOTAL KEKURANGAN:</td><td style="text-align: right; font-weight: bold;">${formatRp(filteredSurat.total)}</td></tr>
//             </tbody>
//         </table>
//         <p style="text-align: justify; text-indent: 50px;">Kami mohon agar Bapak/Ibu dapat segera menyelesaikan administrasi tersebut. Bagi Bapak/Ibu yang berkenan melakukan pembayaran secara transfer, dapat melalui rekening <b>Bank Jatim Syariah No. 6202199559 a.n. MA Bi'rul Ulum</b>. Mohon konfirmasi dan kirimkan bukti transfer melalui WhatsApp ke nomor <b>0838-3313-3913 (Admin Madrasah)</b>.</p>
//         <p style="text-align: justify; text-indent: 50px;"><i>Apabila Bapak/Ibu telah melakukan pembayaran sebelum surat ini diterima, mohon surat tagihan ini diabaikan.</i> Demikian surat pemberitahuan ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.</p>
//         <p><i>Wassalamu'alaikum Wr. Wb.</i></p>
//         <table style="width: 100%; margin-top: 15px; text-align: center; page-break-inside: avoid;">
//             <tr>
//                 <td style="width: 50%;"><br>Bendahara Madrasah,<br><br><br><br><b><u>Ririn Jauharin, S.Ak.</u></b></td>
//                 <td style="width: 50%;">Mengetahui,<br>Kepala Madrasah,<br><br><br><br><b><u>Yusuf Muzaidi, S.Pd.</u></b></td>
//             </tr>
//         </table>
//     </div>
//     `;
// }

// function generateSuratIndividu() {
//     const nis = document.getElementById('surat-nis').value.trim();
//     const keperluan = document.getElementById('surat-keperluan-indv').value;
//     const startNum = parseInt(document.getElementById('surat-mulai-indv').value) || 1;
//     if(!nis) { showToast('Masukkan NIS terlebih dahulu!', 'error'); return; }

//     const siswa = dbSiswa.find(s => String(s.nis).trim() === nis);
//     if(!siswa) { showToast('NIS tidak ditemukan!', 'error'); return; }

//     let riwayat = dbPembayaran.filter(p => !p.isDeleted && String(p.nis).trim() === nis);
//     let billing = calculateSiswaBilling(siswa, dbMasterTarif, riwayat);
//     let filteredSurat = getFilteredTunggakan(billing, keperluan);

//     if(filteredSurat.total <= 0) { showToast('Siswa ini LUNAS untuk keperluan tersebut.', 'info'); return; }

//     document.getElementById('surat-preview-container').classList.remove('hidden');
//     document.getElementById('surat-result-info').innerText = `Preview Surat: ${siswa.nama} (Total: ${formatRp(filteredSurat.total)})`;
//     document.getElementById('surat-print-area').innerHTML = buildSuratHTML(siswa, filteredSurat, keperluan, startNum, true);
//     showToast('Surat berhasil dibuat!');
// }

// function generateSuratMassal() {
//     const kelas = document.getElementById('surat-kelas-massal').value;
//     const limit = parseInt(document.getElementById('surat-limit').value) || 0;
//     const keperluan = document.getElementById('surat-keperluan-massal').value;
//     const startNum = parseInt(document.getElementById('surat-mulai-massal').value) || 1;
    
//     if(!kelas) { showToast('Pilih kelas terlebih dahulu!', 'error'); return; }

//     let listSiswa = dbSiswa.filter(s => s.kelas === kelas).sort((a,b) => a.nama.localeCompare(b.nama));
//     if(listSiswa.length === 0) { showToast('Tidak ada siswa di kelas ini.', 'error'); return; }

//     let validSiswa = [];
//     listSiswa.forEach((siswa) => {
//         let riwayat = dbPembayaran.filter(p => !p.isDeleted && String(p.nis).trim() === String(siswa.nis).trim());
//         let billing = calculateSiswaBilling(siswa, dbMasterTarif, riwayat);
//         let filteredSurat = getFilteredTunggakan(billing, keperluan);
//         if(filteredSurat.total >= limit && filteredSurat.total > 0) validSiswa.push({ siswa, filteredSurat });
//     });

//     let countSurat = validSiswa.length;
//     if(countSurat === 0) {
//         document.getElementById('surat-preview-container').classList.add('hidden');
//         showToast(`Tidak ada tagihan mencapai limit Rp${limit.toLocaleString('id-ID')} untuk keperluan ini.`, 'info');
//         return;
//     }

//     let htmlKumpulanSurat = '';
//     validSiswa.forEach((data, i) => {
//         let isLast = (i === countSurat - 1);
//         htmlKumpulanSurat += buildSuratHTML(data.siswa, data.filteredSurat, keperluan, startNum + i, isLast);
//     });

//     document.getElementById('surat-preview-container').classList.remove('hidden');
//     document.getElementById('surat-result-info').innerText = `Berhasil generate ${countSurat} surat untuk Kelas ${kelas}`;
//     document.getElementById('surat-print-area').innerHTML = htmlKumpulanSurat;
//     showToast(`Selesai! ${countSurat} surat siap dicetak.`);
// }


// 1. UPDATE: Tambahkan parameter "siswa" di dalam fungsi ini
function getFilteredTunggakan(billingData, keperluan, siswa) {
    let maxSppIndex = 11, excludedLainnya = [];
    if (keperluan === 'Syarat Ujian PTS 1') { maxSppIndex = 3; excludedLainnya = ['PAS 1', 'PTS 2', 'PAS 2', 'KENAIKAN']; } 
    else if (keperluan === 'Syarat Ujian PAS 1') { maxSppIndex = 5; excludedLainnya = ['PTS 2', 'PAS 2', 'KENAIKAN']; } 
    else if (keperluan === 'Syarat Ujian PTS 2') { maxSppIndex = 8; excludedLainnya = ['PAS 2', 'KENAIKAN']; }

    const blnArr = ['Juli','Agustus','September','Oktober','November','Desember','Januari','Februari','Maret','April','Mei','Juni'];
    let activeThnAjaran = billingData.riwayatTahun[0] || ""; 
    let filteredList = [], totalHitung = 0;

    billingData.bulanan.forEach(b => {
        if(b.sisa !== 'LUNAS' && b.sisa > 0) {
            if (b.tahun === activeThnAjaran && keperluan !== 'Umum' && keperluan !== 'Syarat Ujian PAS 2 / Kenaikan Kelas') {
                let m = blnArr.find(bln => String(b.jenis).toUpperCase().includes(bln.toUpperCase()));
                let sppIndex = blnArr.findIndex(bln => bln === m);
                if (sppIndex <= maxSppIndex) { filteredList.push(b); totalHitung += b.sisa; }
            } else { filteredList.push(b); totalHitung += b.sisa; }
        }
    });

    billingData.lainnya.forEach(l => {
        if(l.sisa !== 'LUNAS' && l.sisa > 0) {
            if (l.tahun === activeThnAjaran && keperluan !== 'Umum' && keperluan !== 'Syarat Ujian PAS 2 / Kenaikan Kelas') {
                let isExcluded = excludedLainnya.some(kw => String(l.jenis).toUpperCase().includes(kw));
                if (!isExcluded) { filteredList.push(l); totalHitung += l.sisa; }
            } else { filteredList.push(l); totalHitung += l.sisa; }
        }
    });

    // ==========================================
    // --- FITUR BARU: INJEKSI HUTANG ATRIBUT ---
    // ==========================================
    if (siswa && typeof dbPemasukanAtribut !== 'undefined') {
        const transaksiAtribut = dbPemasukanAtribut.filter(t => String(t.nis).trim() === String(siswa.nis).trim() && !t.isDeleted);
        const atributInduk = transaksiAtribut.filter(t => !t.idRef && !t.id_nota_referensi);

        atributInduk.forEach(induk => {
            let totalBayarAtribut = Number(induk.nominal) || 0;
            const cicilanAtribut = transaksiAtribut.filter(t => t.idRef === induk.id || t.id_nota_referensi === induk.id);
            cicilanAtribut.forEach(c => totalBayarAtribut += (Number(c.nominal) || 0));

            const hargaAsli = Number(induk.hargaKatalog) || Number(induk.harga_katalog) || 0;
            const sisaAtribut = hargaAsli - totalBayarAtribut;

            if (sisaAtribut > 0) {
                // Masukkan ke dalam daftar tagihan surat dengan tambahan kata "Atribut: "
                filteredList.push({
                    jenis: `Atribut: ${induk.jenis}`,
                    tahun: induk.tahun,
                    sisa: sisaAtribut
                });
                totalHitung += sisaAtribut;
            }
        });
    }
    // ==========================================

    return { items: filteredList, total: totalHitung };
}

// 2. FUNGSI buildSuratHTML (TIDAK ADA PERUBAHAN, SAYA SERTAKAN AGAR LENGKAP)
function buildSuratHTML(siswa, filteredSurat, keperluan, index, isLast = true) {
    let now = new Date();
    let romanMonth = getRomanMonth(now.getMonth());
    let year = now.getFullYear();
    let numSequence = String(index).padStart(3, '0');
    let noSurat = `TA / ${numSequence} / MA-BU / ${romanMonth} / ${year}`;
    let kalimatKeperluan = keperluan !== 'Umum' ? `sebagai salah satu syarat untuk mengikuti kegiatan <b>${keperluan}</b>` : `untuk kelancaran administrasi sekolah`;

    let groupedItems = [], sppGroups = {};
    filteredSurat.items.forEach(item => {
        let jenisUpper = String(item.jenis).toUpperCase();
        if (jenisUpper.includes('SPP')) {
            let month = item.jenis.replace(/SPP/i, '').trim();
            let key = `${item.tahun}_${item.nominalAwal}`;
            if (!sppGroups[key]) sppGroups[key] = { jenis: 'SPP', months: [], tahun: item.tahun, sisa: 0 };
            sppGroups[key].months.push(month);
            sppGroups[key].sisa += item.sisa;
        } else {
            groupedItems.push({ jenis: item.jenis, tahun: item.tahun, sisa: item.sisa });
        }
    });

    let finalItems = [];
    Object.values(sppGroups).forEach(g => { finalItems.push({ jenis: `SPP (${g.months.join(', ')})`, tahun: g.tahun, sisa: g.sisa }); });
    finalItems = finalItems.concat(groupedItems);

    let tableRows = '';
    finalItems.forEach((item, i) => {
        tableRows += `<tr><td style="text-align: center;">${i + 1}</td><td>${item.jenis} ${item.tahun ? `(${item.tahun})` : ''}</td><td style="text-align: right;">${formatRp(item.sisa)}</td></tr>`;
    });

    return `
    <div class="surat-font" style="position: relative; padding-top: ${index > 1 ? '15px' : '0'}; ${!isLast ? 'page-break-after: always;' : ''}">
        <img src="/administrasi/assets/img/kop-madrasah.jpg" style="width: 100%; height: auto; padding-bottom: 5px; margin-bottom: 10px;" alt="Kop Surat">
        <table style="width: 100%; margin-bottom: 15px;">
            <tr><td style="width: 70px;">Nomor</td><td style="width: 10px;">:</td><td>${noSurat}</td><td style="text-align: right;">Sidoarjo, ${getNowDateIndo()}</td></tr>
            <tr><td>Lampiran</td><td>:</td><td>-</td><td></td></tr>
            <tr><td>Perihal</td><td>:</td><td><b>Tagihan Administrasi</b></td><td></td></tr>
        </table>
        <p>Kepada Yth.<br><b>Bapak/Ibu Wali Murid dari:</b></p>
        <table style="margin-left: 20px; margin-bottom: 10px;">
            <tr><td style="width: 120px;">Nama</td><td style="width: 10px;">:</td><td><b>${siswa.nama}</b></td></tr>
            <tr><td>NIS</td><td>:</td><td>${siswa.nis}</td></tr>
            <tr><td>Kelas</td><td>:</td><td>${siswa.kelas}</td></tr>
        </table>
        <p><i>Assalamu'alaikum Wr. Wb.</i></p>
        <p style="text-align: justify; text-indent: 50px;">Alhamdulillah Wassholaatu Wassalaamu Alaa Rasulillah amma Ba’du. Salam silaturrahim kami sampaikan teriring doa semoga bapak ibu selalu dalam perlindungan Allah SWT dalam melaksanakan aktivitas kita sehari-hari. Amin Amin Ya Mujibassailin.</p>
        <p style="text-align: justify; text-indent: 50px;">Bersama surat ini, kami memberitahukan rincian tanggungan administrasi keuangan putra/putri Bapak/Ibu ${kalimatKeperluan}. Berikut adalah rincian tagihan yang belum terselesaikan:</p>
        <table class="surat-table">
            <thead><tr><th style="width: 50px;">No</th><th>Jenis Pembayaran</th><th style="width: 150px;">Kekurangan (Rp)</th></tr></thead>
            <tbody>
                ${tableRows}
                <tr><td colspan="2" style="text-align: right; font-weight: bold;">TOTAL KEKURANGAN:</td><td style="text-align: right; font-weight: bold;">${formatRp(filteredSurat.total)}</td></tr>
            </tbody>
        </table>
        <p style="text-align: justify; text-indent: 50px;">Kami mohon agar Bapak/Ibu dapat segera menyelesaikan administrasi tersebut. Bagi Bapak/Ibu yang berkenan melakukan pembayaran secara transfer, dapat melalui rekening <b>Bank Jatim Syariah No. 6202199559 a.n. MA Bi'rul Ulum</b>. Mohon konfirmasi dan kirimkan bukti transfer melalui WhatsApp ke nomor <b>0838-3313-3913 (Admin Madrasah)</b>.</p>
        <p style="text-align: justify; text-indent: 50px;"><i>Apabila Bapak/Ibu telah melakukan pembayaran sebelum surat ini diterima, mohon surat tagihan ini diabaikan.</i> Demikian surat pemberitahuan ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.</p>
        <p><i>Wassalamu'alaikum Wr. Wb.</i></p>
        <table style="width: 100%; margin-top: 15px; text-align: center; page-break-inside: avoid;">
            <tr>
                <td style="width: 50%;"><br>Bendahara Madrasah,<br><br><br><br><b><u>Ririn Jauharin, S.Ak.</u></b></td>
                <td style="width: 50%;">Mengetahui,<br>Kepala Madrasah,<br><br><br><br><b><u>Yusuf Muzaidi, S.Pd.</u></b></td>
            </tr>
        </table>
    </div>
    `;
}

// 3. UPDATE: Sertakan 'siswa' saat memanggil getFilteredTunggakan
function generateSuratIndividu() {
    const nis = document.getElementById('surat-nis').value.trim();
    const keperluan = document.getElementById('surat-keperluan-indv').value;
    const startNum = parseInt(document.getElementById('surat-mulai-indv').value) || 1;
    if(!nis) { showToast('Masukkan NIS terlebih dahulu!', 'error'); return; }

    const siswa = dbSiswa.find(s => String(s.nis).trim() === nis);
    if(!siswa) { showToast('NIS tidak ditemukan!', 'error'); return; }

    let riwayat = dbPembayaran.filter(p => !p.isDeleted && String(p.nis).trim() === nis);
    let billing = calculateSiswaBilling(siswa, dbMasterTarif, riwayat);
    
    // 👇 FITUR BARU: Tambahan parameter 'siswa'
    let filteredSurat = getFilteredTunggakan(billing, keperluan, siswa); 

    if(filteredSurat.total <= 0) { showToast('Siswa ini LUNAS untuk keperluan tersebut.', 'info'); return; }

    document.getElementById('surat-preview-container').classList.remove('hidden');
    document.getElementById('surat-result-info').innerText = `Preview Surat: ${siswa.nama} (Total: ${formatRp(filteredSurat.total)})`;
    document.getElementById('surat-print-area').innerHTML = buildSuratHTML(siswa, filteredSurat, keperluan, startNum, true);
    showToast('Surat berhasil dibuat!');
}

// 4. UPDATE: Sertakan 'siswa' saat memanggil getFilteredTunggakan
function generateSuratMassal() {
    const kelas = document.getElementById('surat-kelas-massal').value;
    const limit = parseInt(document.getElementById('surat-limit').value) || 0;
    const keperluan = document.getElementById('surat-keperluan-massal').value;
    const startNum = parseInt(document.getElementById('surat-mulai-massal').value) || 1;
    
    if(!kelas) { showToast('Pilih kelas terlebih dahulu!', 'error'); return; }

    let listSiswa = dbSiswa.filter(s => s.kelas === kelas).sort((a,b) => a.nama.localeCompare(b.nama));
    if(listSiswa.length === 0) { showToast('Tidak ada siswa di kelas ini.', 'error'); return; }

    let validSiswa = [];
    listSiswa.forEach((siswa) => {
        let riwayat = dbPembayaran.filter(p => !p.isDeleted && String(p.nis).trim() === String(siswa.nis).trim());
        let billing = calculateSiswaBilling(siswa, dbMasterTarif, riwayat);
        
        // 👇 FITUR BARU: Tambahan parameter 'siswa'
        let filteredSurat = getFilteredTunggakan(billing, keperluan, siswa); 
        
        if(filteredSurat.total >= limit && filteredSurat.total > 0) validSiswa.push({ siswa, filteredSurat });
    });

    let countSurat = validSiswa.length;
    if(countSurat === 0) {
        document.getElementById('surat-preview-container').classList.add('hidden');
        showToast(`Tidak ada tagihan mencapai limit Rp${limit.toLocaleString('id-ID')} untuk keperluan ini.`, 'info');
        return;
    }

    let htmlKumpulanSurat = '';
    validSiswa.forEach((data, i) => {
        let isLast = (i === countSurat - 1);
        htmlKumpulanSurat += buildSuratHTML(data.siswa, data.filteredSurat, keperluan, startNum + i, isLast);
    });

    document.getElementById('surat-preview-container').classList.remove('hidden');
    document.getElementById('surat-result-info').innerText = `Berhasil generate ${countSurat} surat untuk Kelas ${kelas}`;
    document.getElementById('surat-print-area').innerHTML = htmlKumpulanSurat;
    showToast(`Selesai! ${countSurat} surat siap dicetak.`);
}

function printSurat() {
    showToast('Menyiapkan print A4/Folio...', 'info');
    const printStyle = `
        @page { size: 210mm 330mm; margin: 5mm 10mm; }
        @media print {
            body * { visibility: visible !important; }
            #print-area, aside, header, #view-login, #view-siswa, #loading-overlay, #toast, #delete-modal, 
            #admin-view-datasiswa, #admin-view-tarif, #laporan-content-rekap,
            #admin-view-cetak > div:nth-child(1), #laporan-content-surat > div:nth-child(1), #surat-preview-container > div:first-child { display: none !important; }
            html, body, #view-admin, main, #admin-view-laporan, #laporan-content-surat, #surat-preview-container, #surat-print-wrapper, #surat-print-area {
                display: block !important; height: auto !important; min-height: 0 !important; overflow: visible !important; position: static !important;
                margin: 0 !important; padding: 0 !important; background: white !important; background-color: white !important;
                border: none !important; box-shadow: none !important; border-radius: 0 !important; outline: none !important;
            }
            #surat-print-area { width: 100% !important; max-width: none !important; box-shadow: none !important; border: none !important; }
        }
    `;
    document.getElementById('dynamic-print-style').innerHTML = printStyle;
    setTimeout(() => {
        window.print();
        setTimeout(() => { document.getElementById('dynamic-print-style').innerHTML = ''; }, 1000);
    }, 500);
}

function cetakKwitansi(idTransaksi) {
    const trx = dbPembayaran.find(t => String(t.id) === String(idTransaksi));
    if (!trx) return;
    const s = dbSiswa.find(siswa => String(siswa.nis).trim() === String(trx.nis).trim());
    document.getElementById('p-kwitansi').innerText = trx.id.includes('TEMP') ? 'Menunggu Server...' : trx.id;
    document.getElementById('p-nis').innerText = trx.nis;
    document.getElementById('p-nama').innerText = trx.nama || "-";
    document.getElementById('p-kelas').innerText = s ? s.kelas : "-";
    document.getElementById('p-waktu').innerText = trx.waktuInput;
    document.getElementById('p-tanggal').innerText = trx.tanggalInput;
    document.getElementById('p-jenis').innerText = trx.jenis;
    document.getElementById('p-kode').innerText = trx.acuanBayar;
    document.getElementById('p-keterangan').innerText = `Biaya Administrasi ${trx.jenis} Tahun Ajaran ${trx.tahun}`;
    document.getElementById('p-nominal').innerText = formatRp(trx.nominal);
    document.getElementById('p-grandtotal').innerText = formatRp(trx.nominal);
    document.getElementById('p-terbilang').innerText = terbilang(trx.nominal);
    document.getElementById('p-tgl-cetak').innerText = getNowDateIndo();
    window.print();
}

// ==========================================
// FUNGSI BATCH 3: EXPORT KE EXCEL (RENTANG BULAN / RANGE)
// ==========================================
function generateFileExcel(labelPeriode, tahunAjaran, tglCetak, totalPem, totalPeng, saldo, pemSiswa, pemBantuan, dataPengeluaran) {
    const excelData = [];
    const merges = [];
    let r = 0; 

    function addRow(rowData) {
        excelData.push(rowData);
        r++;
    }
    function mergeRow(startRow, endRow, startCol, endCol) {
        merges.push({ s: { r: startRow, c: startCol }, e: { r: endRow, c: endCol } });
    }

    // 1. GAYA TULISAN & WARNA (Tetap sama seperti sebelumnya)
    const fontNormal = { name: "Times New Roman", sz: 11 };
    const fontBold = { name: "Times New Roman", sz: 11, bold: true };
    const fontTitle = { name: "Times New Roman", sz: 11, bold: true };
    const formatAccountingExcel = '_-[$Rp-id-ID]* #,##0_-;-[$Rp-id-ID]* #,##0_-;_-[$Rp-id-ID]* "-"_-;_-@_-'; 
    const borderAll = {
        top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } }
    };
    const lightGreenFill = { fgColor: { rgb: "C6E0B4" } }; 

    const styleJudul = { font: fontTitle, alignment: { horizontal: "center", vertical: "center" } };
    const styleSubJudul = { font: fontBold, alignment: { horizontal: "left", vertical: "center" } };
    const styleHeaderTabel = { font: fontBold, alignment: { horizontal: "center", vertical: "center" }, border: borderAll, fill: lightGreenFill };
    const styleSelBiasa = { font: fontNormal, alignment: { vertical: "center" }, border: borderAll };
    const styleSelTengah = { font: fontNormal, alignment: { horizontal: "center", vertical: "center" }, border: borderAll };
    const styleUangTabel = { font: fontNormal, alignment: { vertical: "center" }, border: borderAll, numFmt: formatAccountingExcel };
    const styleUangKesimpulan = { font: fontBold, alignment: { vertical: "center" }, numFmt: formatAccountingExcel };
    const styleJumlahTeks = { font: fontBold, alignment: { horizontal: "center", vertical: "center" }, border: borderAll, fill: lightGreenFill };
    const styleJumlahUang = { font: fontBold, alignment: { vertical: "center" }, border: borderAll, numFmt: formatAccountingExcel, fill: lightGreenFill };
    const styleTTDNormal = { font: fontNormal, alignment: { horizontal: "center", vertical: "center" } };
    const styleTTDBold = { font: fontBold, alignment: { horizontal: "center", vertical: "center" } };

    // 2. MEMBANGUN DATA EXCEL DINAMIS
    addRow([{ v: "LAPORAN KEUANGAN OPERASIONAL", s: styleJudul }, "", "", ""]);
    addRow([{ v: `MA BI'RUL ULUM TAHUN AJARAN ${tahunAjaran}`, s: styleJudul }, "", "", ""]);
    addRow([{ v: `PERIODE ${labelPeriode.toUpperCase()}`, s: styleJudul }, "", "", ""]); // Berubah jadi Periode
    mergeRow(r-3, r-3, 0, 3);
    mergeRow(r-2, r-2, 0, 3);
    mergeRow(r-1, r-1, 0, 3);
    addRow(["", "", "", ""]); 

    // --- A. KESIMPULAN ---
    addRow([{ v: "A. KESIMPULAN", s: styleSubJudul }, "", "", ""]);
    mergeRow(r-1, r-1, 0, 3);
    const styleLabelNormal = { font: fontNormal };
    addRow(["", { v: "Pemasukan", s: styleLabelNormal }, "", { v: Number(totalPem) || 0, t: 'n', s: styleUangKesimpulan }]);
    mergeRow(r-1, r-1, 1, 2);
    addRow(["", { v: "Pengeluaran", s: styleLabelNormal }, "", { v: Number(totalPeng) || 0, t: 'n', s: styleUangKesimpulan }]);
    mergeRow(r-1, r-1, 1, 2);
    addRow(["", { v: `Sisa Saldo Periode ${labelPeriode}`, s: styleLabelNormal }, "", { v: Number(saldo) || 0, t: 'n', s: styleUangKesimpulan }]);
    mergeRow(r-1, r-1, 1, 2);
    addRow(["", "", "", ""]); 

    // --- B. PEMASUKAN ---
    addRow([{ v: "B. PEMASUKAN", s: styleSubJudul }, "", "", ""]);
    mergeRow(r-1, r-1, 0, 3);
    addRow([{ v: "No", s: styleHeaderTabel }, { v: "Tanggal Update", s: styleHeaderTabel }, { v: "Uraian", s: styleHeaderTabel }, { v: "Jumlah", s: styleHeaderTabel }]);
    addRow([{ v: 1, s: styleSelTengah }, { v: tglCetak, s: styleSelTengah }, { v: `Pemasukan Siswa Periode ${labelPeriode}`, s: styleSelBiasa }, { v: Number(pemSiswa) || 0, t: 'n', s: styleUangTabel }]);
    addRow([{ v: 2, s: styleSelTengah }, { v: tglCetak, s: styleSelTengah }, { v: `Penerimaan Bantuan Periode ${labelPeriode}`, s: styleSelBiasa }, { v: Number(pemBantuan) || 0, t: 'n', s: styleUangTabel }]);
    addRow([{ v: "Jumlah", s: styleJumlahTeks }, { v: "", s: styleJumlahTeks }, { v: "", s: styleJumlahTeks }, { v: Number(totalPem) || 0, t: 'n', s: styleJumlahUang }]);
    mergeRow(r-1, r-1, 0, 2); 
    addRow(["", "", "", ""]); 

    // --- C. PENGELUARAN ---
    addRow([{ v: "C. PENGELUARAN", s: styleSubJudul }, "", "", ""]);
    mergeRow(r-1, r-1, 0, 3);
    addRow([{ v: "No", s: styleHeaderTabel }, { v: "Tanggal Nota", s: styleHeaderTabel }, { v: "Uraian", s: styleHeaderTabel }, { v: "Nominal", s: styleHeaderTabel }]);

    if (dataPengeluaran && dataPengeluaran.length > 0) {
        dataPengeluaran.sort((a, b) => new Date(a.tanggal_nota) - new Date(b.tanggal_nota));
        dataPengeluaran.forEach((item, index) => {
            let tglFormat = "-";
            if(item.tanggal_nota) {
                const d = new Date(item.tanggal_nota);
                const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
                tglFormat = `${d.getDate().toString().padStart(2, '0')} ${namaBulan[d.getMonth()]} ${d.getFullYear()}`;
            }

            // ==========================================
            // 🛡️ FITUR BARU: PREFIX JENIS PADA URAIAN
            // ==========================================
            let deskripsiAsli = item.keterangan || item.uraian || '-';
            let jenisExp = item.jenis_pengeluaran || item.jenis || '';
            
            // Rapikan kapitalisasi teks (Misal kasir ngetik "PENGELUARAN JULI" otomatis jadi "Pengeluaran Juli")
            let jenisRapi = jenisExp.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
            
            // Gabungkan prefix dan deskripsi
            let teksUraian = jenisRapi ? `(${jenisRapi}) ${deskripsiAsli}` : deskripsiAsli;

            addRow([
                { v: index + 1, s: styleSelTengah },
                { v: tglFormat, s: styleSelTengah },
                { v: teksUraian, s: styleSelBiasa }, // <-- Memasukkan uraian yang sudah ditambah prefix
                { v: Number(item.nominal) || 0, t: 'n', s: styleUangTabel }
            ]);
        });
    } else {
        addRow([{ v: "-", s: styleSelTengah }, { v: "-", s: styleSelTengah }, { v: "Tidak ada pengeluaran di periode ini", s: styleSelBiasa }, { v: 0, t: 'n', s: styleUangTabel }]);
    }
    addRow([{ v: "Jumlah", s: styleJumlahTeks }, { v: "", s: styleJumlahTeks }, { v: "", s: styleJumlahTeks }, { v: Number(totalPeng) || 0, t: 'n', s: styleJumlahUang }]);
    mergeRow(r-1, r-1, 0, 2); 
    
    // --- D. BAGIAN TANDA TANGAN ---
    addRow(["", "", "", ""]); 
    
    // TTD Tanggal (Merge kolom C dan D agar lega)
    addRow(["", "", { v: `                                                  Gedangan, ${tglCetak}`, s: styleTTDNormal }, ""]);
    mergeRow(r-1, r-1, 2, 3);
    
    // Jabatan (Merge kolom A-B untuk Kepala, C-D untuk Bendahara)
    addRow([
        { v: "       Kepala MA Bi'rul Ulum", s: styleTTDNormal }, "", 
        { v: "                                                  Bendahara MA Bi'rul Ulum", s: styleTTDNormal }, ""
    ]);
    mergeRow(r-1, r-1, 0, 1);
    mergeRow(r-1, r-1, 2, 3);
    
    addRow(["", "", "", ""]);
    addRow(["", "", "", ""]);
    addRow(["", "", "", ""]);
    
    // Nama Terang (Merge kolom A-B untuk Kepala, C-D untuk Bendahara)
    addRow([
        { v: "       Yusuf Muzaidi, S.Pd.", s: styleTTDBold }, "", 
        { v: "                                                  Ririn Jauharin, S.Ak.", s: styleTTDBold }, ""
    ]);
    mergeRow(r-1, r-1, 0, 1);
    mergeRow(r-1, r-1, 2, 3);

    // 3. CETAK EXCEL DENGAN PAGE LAYOUT
    try {
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        ws['!merges'] = merges;
        ws['!cols'] = [ { wch: 5 }, { wch: 18 }, { wch: 45 }, { wch: 20 } ];
        ws['!pageSetup'] = { paperSize: 9, orientation: 'portrait', fitToWidth: 1, fitToHeight: 0, horizontalCentered: true };
        ws['!margins'] = { left: 2 / 2.54, right: 1 / 2.54, top: 1.5 / 2.54, bottom: 1.5 / 2.54, header: 0.3, footer: 0.3 };

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Laporan`);
        // Format penamaan file otomatis menyesuaikan (cth: Laporan_Operasional_Juli-Juni_2025-2026)
        const safeName = labelPeriode.replace(/\s/g, ''); 
        const safeTahun = tahunAjaran.replace('/', '-');
        XLSX.writeFile(wb, `Laporan_Operasional_${safeName}_${safeTahun}.xlsx`);
    } catch (err) {
        console.error("Gagal membuat file Excel:", err);
        alert("Terjadi kesalahan saat merakit file Excel.");
    }
}

// ==========================================
// FUNGSI UNDUH (PENYARINGAN RENTANG WAKTU / RANGE)
// ==========================================
async function unduhLaporanExcel() {
    const bulanAwal = document.getElementById('filter-bulan-awal').value;
    const bulanAkhir = document.getElementById('filter-bulan-akhir').value;
    const tahunAjaran = document.getElementById('filter-tahun-ajaran').value; 

    if (!bulanAwal || !bulanAkhir || !tahunAjaran) {
        tampilkanModalNotif('Silakan pilih rentang bulan dan tahun ajaran terlebih dahulu!');
        return;
    }

    // 🛡️ FITUR BARU: UBAH TOMBOL JADI SPINNER LOADING
    const btn = document.getElementById('btn-unduh-laporan');
    const iconBtn = document.getElementById('icon-unduh-laporan');
    const textBtn = document.getElementById('text-unduh-laporan');
    
    btn.disabled = true;
    iconBtn.className = "ph ph-spinner animate-spin mr-2 text-lg";
    textBtn.innerText = "Memproses Laporan...";

    const labelPeriode = (bulanAwal === bulanAkhir) ? bulanAwal : `${bulanAwal} - ${bulanAkhir}`;
    tampilkanModalNotif('Memproses Laporan', `Sedang mengunduh data laporan periode ${labelPeriode}...`, 'loading');

    try {
        // 1. MENGHITUNG TANGGAL MULAI DAN TANGGAL AKHIR
        const tahunSplit = tahunAjaran.split('/');
        const tahunAwalNum = parseInt(tahunSplit[0]); 
        const tahunAkhirNum = parseInt(tahunSplit[1]); 

        const bulanMap = { 'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11, 'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5 };
        const namaBulanIndo = ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"];
        
        const getTahun = (namaBulan) => (bulanMap[namaBulan] >= 6) ? tahunAwalNum : tahunAkhirNum;

        const startDate = new Date(getTahun(bulanAwal), bulanMap[bulanAwal], 1);
        const endDate = new Date(getTahun(bulanAkhir), bulanMap[bulanAkhir] + 1, 0); 
        
        const tglCetak = `${endDate.getDate()} ${bulanAkhir} ${getTahun(bulanAkhir)}`;

        // Tarik data mentah dari Supabase
        const { data: rawPengeluaran, error: errPengeluaran } = await supabaseClient.from('pengeluaran').select('*'); 
        const { data: dataPemasukan, error: errPem } = await supabaseClient.from('pemasukan').select('*');
        const { data: dataBantuan, error: errBan } = await supabaseClient.from('bantuan').select('*');
        
        if (errPengeluaran || errPem || errBan) throw new Error("Gagal menarik data dari server");

        // 2. FUNGSI PARSING TANGGAL (Mendukung Varchar "19 Agustus" & Date "2026-08-19")
        const parseDateSuper = (str) => {
            if (!str) return null;
            const s = String(str).toLowerCase().trim();
            
            const parts = s.split(' ');
            if (parts.length >= 3) {
                const bMap = { 'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5, 'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11 };
                const d = parseInt(parts[0]);
                const m = bMap[parts[1]];
                const y = parseInt(parts[2]);
                if (!isNaN(d) && m !== undefined && !isNaN(y)) return new Date(y, m, d);
            }
            
            const standardDate = new Date(str);
            if (!isNaN(standardDate.getTime())) return standardDate;

            return null;
        };

        // 3. FILTER PEMASUKAN KHUSUS (Pakai tanggal_input / Varchar)
        const pemasukanBulanIni = dataPemasukan.filter(item => {
            if (item.is_deleted === true || item.is_deleted === 'true' || item.is_deleted === 1) return false;
            let d = parseDateSuper(item.tanggal_input || item.tanggal);
            if (!d) return false;
            d.setHours(0,0,0,0);
            return d >= startDate && d <= endDate;
        });

        // 4. FILTER BANTUAN KHUSUS (Pakai tanggal_transaksi / Date YYYY-MM-DD)
        const bantuanBulanIni = dataBantuan.filter(item => {
            if (item.is_deleted === true || item.is_deleted === 'true' || item.is_deleted === 1) return false;
            // 💡 Fokus eksklusif membaca kolom tanggal_transaksi
            let d = parseDateSuper(item.tanggal_transaksi || item.tanggal);
            if (!d) return false;
            d.setHours(0,0,0,0);
            return d >= startDate && d <= endDate;
        });

        // 5. PERSIAPKAN DAFTAR SOP KASIR PENGELUARAN
        let validJenisPengeluaran = [];
        let currDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        while(currDate <= endDate) {
            validJenisPengeluaran.push(`pengeluaran ${namaBulanIndo[currDate.getMonth()]}`);
            currDate.setMonth(currDate.getMonth() + 1);
        }

        // 6. FILTER PENGELUARAN
        const dataPengeluaran = rawPengeluaran.filter(item => {
            if (item.is_deleted === true || item.is_deleted === 'true' || item.is_deleted === 1) return false;
            if (!item.tanggal_nota) return false;
            
            const d = new Date(item.tanggal_nota);
            d.setHours(0,0,0,0);
            if (d < startDate || d > endDate) return false;

            const jenisItem = String(item.jenis_pengeluaran || item.jenis || "").toLowerCase();
            return validJenisPengeluaran.some(validStr => jenisItem.includes(validStr));
        });

        // 7. REKAPITULASI TOTAL UANG
        let totalPemasukanSiswa = pemasukanBulanIni.reduce((sum, item) => sum + (Number(item.nominal) || Number(item.jumlah) || 0), 0);
        let totalBantuan = bantuanBulanIni.reduce((sum, item) => sum + (Number(item.nominal) || Number(item.jumlah) || 0), 0);
        let totalPengeluaran = dataPengeluaran.reduce((sum, item) => sum + (Number(item.nominal) || Number(item.jumlah) || 0), 0);
        
        let totalPemasukanGlobal = totalPemasukanSiswa + totalBantuan;
        let sisaSaldo = totalPemasukanGlobal - totalPengeluaran;

        // 8. CETAK KE EXCEL
        generateFileExcel(
            labelPeriode, tahunAjaran, tglCetak,
            totalPemasukanGlobal, totalPengeluaran, sisaSaldo, 
            totalPemasukanSiswa, totalBantuan, 
            dataPengeluaran
        );

        tampilkanModalNotif('Berhasil!', 'Laporan Excel berhasil diunduh.', 'success');
        setTimeout(() => tutupModalNotif(), 2000);

    } catch (error) {
        console.error("Error Laporan:", error);
        tampilkanModalNotif('Gagal memproses laporan. Silakan cek koneksi atau hubungi admin.');
    } finally {
        btn.disabled = false;
        iconBtn.className = "ph ph-file-xls mr-2 text-lg";
        textBtn.innerText = "Unduh Laporan Operasional";
    }
}

// ==========================================
// 1. FUNGSI TARIK DATA NON-OPERASIONAL
// ==========================================
// async function unduhLaporanNonOpsExcel() {
//     const jenis = document.getElementById('filter-jenis-nonops').value;
//     const tahunAjaran = document.getElementById('filter-tahun-nonops').value;

//     if (!jenis || !tahunAjaran) {
//         alert('Silakan pilih jenis pengeluaran dan tahun ajaran!');
//         return;
//     }

//     try {
//         // Tarik data dari tabel pengeluaran_nonops
//         const { data: rawData, error } = await supabaseClient
//             .from('pengeluaran_nonops') // Sesuaikan jika nama tabel Anda berbeda!
//             .select('*')
//             .eq('jenis_pengeluaran_nonops', jenis);

//         if (error) throw error;

//         // Filter data yang dihapus
//         const dataBersih = rawData.filter(item => item.is_deleted !== true && item.is_deleted !== 'true' && item.is_deleted !== 1);

//         // Hitung total pengeluaran
//         let totalPengeluaran = dataBersih.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);

//         // Lanjut ke cetak Excel
//         generateFileNonOpsExcel(jenis, tahunAjaran, totalPengeluaran, dataBersih);

//     } catch (err) {
//         console.error("Error Laporan Non-Ops:", err);
//         alert('Gagal memproses laporan Non-Operasional.');
//     }
// }

// ==========================================
// 2. FUNGSI RENDER EXCEL NON-OPERASIONAL
// ==========================================
// function generateFileNonOpsExcel(jenis, tahunAjaran, totalPengeluaran, dataPengeluaran) {
//     const formatRupiahExcel = '"Rp" #,##0;[Red]"Rp" -#,##0'; 
//     const styleJudul = { font: { bold: true, sz: 12 }, alignment: { horizontal: "center", vertical: "center" } };
//     const styleSubJudul = { font: { bold: true, sz: 11 }, alignment: { horizontal: "center", vertical: "center" } };
//     const borderAll = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
    
//     const styleHeaderTabel = { font: { bold: true }, alignment: { horizontal: "center", vertical: "center" }, border: borderAll };
//     const styleSelBiasa = { border: borderAll };
//     const styleSelTengah = { alignment: { horizontal: "center" }, border: borderAll };
    
//     const styleUangTabel = { alignment: { horizontal: "right" }, border: borderAll, numFmt: formatRupiahExcel };
//     const styleUangKesimpulan = { alignment: { horizontal: "right" }, numFmt: formatRupiahExcel, font: { bold: true } };

//     const excelData = [];
    
//     // 1. KOP SURAT
//     excelData.push([{ v: "LAPORAN PENGELUARAN NON-OPERASIONAL", s: styleJudul }, "", "", ""]);
//     excelData.push([{ v: `MA BI'RUL ULUM TAHUN AJARAN ${tahunAjaran}`, s: styleJudul }, "", "", ""]);
//     excelData.push([{ v: `KATEGORI: ${jenis.toUpperCase()}`, s: styleJudul }, "", "", ""]);
//     excelData.push(["", "", "", ""]); 

//     // 2. A. KESIMPULAN
//     excelData.push([{ v: "A. KESIMPULAN", s: styleSubJudul }, "", "", ""]);
//     excelData.push(["", "Total Pengeluaran", "", { v: Number(totalPengeluaran) || 0, t: 'n', s: styleUangKesimpulan }]);
//     excelData.push(["", "", "", ""]); 

//     // 3. B. RINCIAN PENGELUARAN
//     excelData.push([{ v: "B. RINCIAN PENGELUARAN", s: styleSubJudul }, "", "", ""]);
//     excelData.push([
//         { v: "No", s: styleHeaderTabel }, 
//         { v: "Tanggal", s: styleHeaderTabel }, 
//         { v: "Uraian", s: styleHeaderTabel }, 
//         { v: "Nominal", s: styleHeaderTabel }
//     ]);

//     // Looping Data
//     if (dataPengeluaran && dataPengeluaran.length > 0) {
//         dataPengeluaran.sort((a, b) => new Date(a.tanggal || a.tanggal_input) - new Date(b.tanggal || b.tanggal_input));
        
//         dataPengeluaran.forEach((item, index) => {
//             let tglFormat = item.tanggal || item.tanggal_input || "-";
//             if(tglFormat !== "-") {
//                 const d = new Date(tglFormat);
//                 tglFormat = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`; // Format DD/MM/YYYY
//             }

//             excelData.push([
//                 { v: index + 1, s: styleSelTengah },
//                 { v: tglFormat, s: styleSelBiasa },
//                 { v: item.uraian || item.keterangan || '-', s: styleSelBiasa },
//                 { v: Number(item.nominal) || 0, t: 'n', s: styleUangTabel }
//             ]);
//         });
//     } else {
//         excelData.push([
//             { v: "-", s: styleSelTengah },
//             { v: "-", s: styleSelBiasa },
//             { v: "Tidak ada pengeluaran untuk kategori ini", s: styleSelBiasa },
//             { v: 0, t: 'n', s: styleUangTabel }
//         ]);
//     }

//     try {
//         const ws = XLSX.utils.aoa_to_sheet(excelData);

//         // MERGE CENTER
//         ws['!merges'] = [
//             { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, 
//             { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, 
//             { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, 
//             { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } }, // Merge A. Kesimpulan
//             { s: { r: 7, c: 0 }, e: { r: 7, c: 3 } }  // Merge B. Rincian
//         ];

//         // LEBAR KOLOM
//         ws['!cols'] = [ { wch: 5 }, { wch: 15 }, { wch: 50 }, { wch: 20 } ];

//         const wb = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(wb, ws, `NonOps`);
        
//         // Buat nama file rapi tanpa spasi
//         const namaFileJenis = jenis.replace(/[^a-zA-Z0-9]/g, '_');
//         XLSX.writeFile(wb, `Laporan_NonOps_${namaFileJenis}_${tahunAjaran.replace('/','-')}.xlsx`);
        
//     } catch (err) {
//         console.error("Gagal membuat file Excel:", err);
//         alert("Terjadi kesalahan saat merakit file Excel Non-Operasional.");
//     }
// }

// ==========================================
// FUNGSI EXCEL 4: LAPORAN NON OPERASIONAL (5 KOLOM & RUMUS OTOMATIS)
// ==========================================
function generateFileNonOpsExcel(kategori, tahunAjaran, tglCetak, dataPengeluaran) {
    const excelData = [];
    const merges = [];
    let r = 0; 

    function addRow(rowData) {
        excelData.push(rowData);
        r++;
    }
    function mergeRow(startRow, endRow, startCol, endCol) {
        merges.push({ s: { r: startRow, c: startCol }, e: { r: endRow, c: endCol } });
    }

    // 1. GAYA TULISAN & WARNA (Times New Roman 11, 5 Kolom)
    const fontNormal = { name: "Times New Roman", sz: 11 };
    const fontBold = { name: "Times New Roman", sz: 11, bold: true };
    const formatAccountingExcel = '_-[$Rp-id-ID]* #,##0_-;-[$Rp-id-ID]* #,##0_-;_-[$Rp-id-ID]* "-"_-;_-@_-'; 
    const borderAll = {
        top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } }
    };
    const lightGreenFill = { fgColor: { rgb: "C6E0B4" } }; 

    const styleJudul = { font: fontBold, alignment: { horizontal: "center", vertical: "center" } };
    const styleSubJudul = { font: fontBold, alignment: { horizontal: "left", vertical: "center" } };
    const styleHeaderTabel = { font: fontBold, alignment: { horizontal: "center", vertical: "center" }, border: borderAll, fill: lightGreenFill };
    const styleSelBiasa = { font: fontNormal, alignment: { vertical: "center" }, border: borderAll };
    const styleSelTengah = { font: fontNormal, alignment: { horizontal: "center", vertical: "center" }, border: borderAll };
    const styleVol = { font: fontNormal, alignment: { horizontal: "center", vertical: "center" }, border: borderAll, numFmt: '#,##0' };
    const styleUangTabel = { font: fontNormal, alignment: { vertical: "center" }, border: borderAll, numFmt: formatAccountingExcel };
    
    const styleJumlahTeks = { font: fontBold, alignment: { horizontal: "center", vertical: "center" }, border: borderAll, fill: lightGreenFill };
    const styleJumlahUang = { font: fontBold, alignment: { vertical: "center" }, border: borderAll, numFmt: formatAccountingExcel, fill: lightGreenFill };
    const styleTTDNormal = { font: fontNormal, alignment: { horizontal: "center", vertical: "center" } };
    const styleTTDBold = { font: fontBold, alignment: { horizontal: "center", vertical: "center" } };

    // 🛡️ FITUR BARU: Style Khusus Kesimpulan (Tanpa Border)
    const styleLabelNoBorder = { font: fontNormal, alignment: { vertical: "center" } };
    const styleUangNoBorder = { font: fontBold, alignment: { vertical: "center" }, numFmt: formatAccountingExcel };

    // --- KALKULASI BARIS OTOMATIS UNTUK RUMUS ---
    const PENG_COUNT = Math.max(1, dataPengeluaran.length);
    const BARIS_TOTAL_PEMASUKAN = 18; // Pasti di Excel Baris ke-18
    const BARIS_TOTAL_PENGELUARAN = 21 + PENG_COUNT + 1; // 21 Header + Data + 1

    // 2. MEMBANGUN DATA EXCEL (5 KOLOM: A, B, C, D, E)
    // --- KOP SURAT ---
    addRow([{ v: "LAPORAN KEUANGAN NON OPERASIONAL", s: styleJudul }, "", "", "", ""]);
    addRow([{ v: `MA BI'RUL ULUM TAHUN AJARAN ${tahunAjaran}`, s: styleJudul }, "", "", "", ""]);
    addRow([{ v: `KATEGORI: ${kategori.toUpperCase()}`, s: styleJudul }, "", "", "", ""]);
    mergeRow(r-3, r-3, 0, 4);
    mergeRow(r-2, r-2, 0, 4);
    mergeRow(r-1, r-1, 0, 4);
    addRow(["", "", "", "", ""]); // Baris 4 Kosong

    // --- A. KESIMPULAN ---
    // Menyuntikkan style ke seluruh sel (5 kolom) agar garis A, B, C penuh
    addRow([{ v: "A. KESIMPULAN", s: styleSubJudul }, { v: "", s: styleSubJudul }, { v: "", s: styleSubJudul }, { v: "", s: styleSubJudul }, { v: "", s: styleSubJudul }]);
    mergeRow(r-1, r-1, 0, 4); 
    
    // Kesimpulan Tanpa Border
    addRow(["", { v: "Pemasukan", s: styleLabelNoBorder }, "", "", { t: 'n', f: `E${BARIS_TOTAL_PEMASUKAN}`, s: styleUangNoBorder }]);
    mergeRow(r-1, r-1, 1, 3);
    
    addRow(["", { v: "Pengeluaran", s: styleLabelNoBorder }, "", "", { t: 'n', f: `E${BARIS_TOTAL_PENGELUARAN}`, s: styleUangNoBorder }]);
    mergeRow(r-1, r-1, 1, 3);
    
    addRow(["", { v: `Sisa Saldo ${kategori}`, s: styleLabelNoBorder }, "", "", { t: 'n', f: "E6-E7", s: styleUangNoBorder }]);
    mergeRow(r-1, r-1, 1, 3);
    
    addRow(["", "", "", "", ""]); 

    // --- B. PEMASUKAN ---
    addRow([{ v: "B. PEMASUKAN", s: styleSubJudul }, { v: "", s: styleSubJudul }, { v: "", s: styleSubJudul }, { v: "", s: styleSubJudul }, { v: "", s: styleSubJudul }]);
    mergeRow(r-1, r-1, 0, 4);

    addRow([
        { v: "No", s: styleHeaderTabel }, 
        { v: "Kelas", s: styleHeaderTabel }, 
        { v: "Vol", s: styleHeaderTabel }, 
        { v: "Satuan", s: styleHeaderTabel }, 
        { v: "Jumlah", s: styleHeaderTabel }
    ]);

    const kelasList = ["X E1", "X E2", "XI F1", "XI F2", "XII IPA", "XII IPS"];
    kelasList.forEach((kls, index) => {
        let currentExcelRow = r + 1;
        addRow([
            { v: index + 1, s: styleSelTengah },
            { v: kls, s: styleSelTengah },
            { v: 0, t: 'n', s: styleVol }, 
            { v: 0, t: 'n', s: styleUangTabel }, 
            { t: 'n', f: `C${currentExcelRow}*D${currentExcelRow}`, s: styleUangTabel } 
        ]);
    });

    // Sel Kosong diberi styleJumlahTeks agar border kolom C dan D tidak bolong
    addRow([
        { v: "Jumlah", s: styleJumlahTeks }, 
        { v: "", s: styleJumlahTeks }, 
        { v: "", s: styleJumlahTeks }, 
        { v: "", s: styleJumlahTeks }, 
        { t: 'n', f: "SUM(E12:E17)", s: styleJumlahUang }
    ]);
    mergeRow(r-1, r-1, 0, 3); 
    addRow(["", "", "", "", ""]); 

    // --- C. PENGELUARAN ---
    addRow([{ v: "C. PENGELUARAN", s: styleSubJudul }, { v: "", s: styleSubJudul }, { v: "", s: styleSubJudul }, { v: "", s: styleSubJudul }, { v: "", s: styleSubJudul }]);
    mergeRow(r-1, r-1, 0, 4);

    // Header dengan isi sel kosong ber-style agar Uraian (C&D) full border
    addRow([
        { v: "No", s: styleHeaderTabel }, 
        { v: "Tanggal Nota", s: styleHeaderTabel }, 
        { v: "Uraian", s: styleHeaderTabel }, 
        { v: "", s: styleHeaderTabel }, 
        { v: "Nominal", s: styleHeaderTabel }
    ]);
    mergeRow(r-1, r-1, 2, 3); 

    let totalPengeluaran = 0;

    if (dataPengeluaran && dataPengeluaran.length > 0) {
        dataPengeluaran.sort((a, b) => new Date(a.tanggal_nota) - new Date(b.tanggal_nota));
        dataPengeluaran.forEach((item, index) => {
            totalPengeluaran += (Number(item.nominal) || Number(item.jumlah) || 0);
            
            let tglFormat = "-";
            if(item.tanggal_nota) {
                const d = new Date(item.tanggal_nota);
                const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
                tglFormat = `${d.getDate().toString().padStart(2, '0')} ${namaBulan[d.getMonth()]} ${d.getFullYear()}`;
            }

            let deskripsiAsli = item.keterangan || item.uraian || '-';
            let jenisRapi = kategori.toUpperCase().replace(/\b\w/g, s => s.toUpperCase());
            let teksUraian = `(Pengeluaran ${jenisRapi}) ${deskripsiAsli}`;

            addRow([
                { v: index + 1, s: styleSelTengah },
                { v: tglFormat, s: styleSelTengah },
                { v: teksUraian, s: styleSelBiasa }, 
                { v: "", s: styleSelBiasa }, // Menyuntik style ke area merge
                { v: Number(item.nominal) || Number(item.jumlah) || 0, t: 'n', s: styleUangTabel }
            ]);
            mergeRow(r-1, r-1, 2, 3); 
        });
    } else {
        addRow([
            { v: "-", s: styleSelTengah }, 
            { v: "-", s: styleSelTengah }, 
            { v: "Tidak ada pengeluaran", s: styleSelBiasa }, 
            { v: "", s: styleSelBiasa }, 
            { v: 0, t: 'n', s: styleUangTabel }
        ]);
        mergeRow(r-1, r-1, 2, 3);
    }

    addRow([
        { v: "Jumlah", s: styleJumlahTeks }, 
        { v: "", s: styleJumlahTeks }, 
        { v: "", s: styleJumlahTeks }, 
        { v: "", s: styleJumlahTeks }, 
        { v: totalPengeluaran, t: 'n', s: styleJumlahUang } 
    ]);
    mergeRow(r-1, r-1, 0, 3);
    
    // --- D. BAGIAN TANDA TANGAN ---
    addRow(["", "", "", "", ""]); 
    addRow(["", "", "", { v: `                                             Gedangan, ${tglCetak}`, s: styleTTDNormal }, ""]);
    mergeRow(r-1, r-1, 3, 4); // Tanggal Merge D-E
    
    addRow([
        { v: "Kepala MA Bi'rul Ulum", s: styleTTDNormal }, "", "", 
        { v: "                                             Bendahara MA Bi'rul Ulum", s: styleTTDNormal }, ""
    ]);
    mergeRow(r-1, r-1, 0, 1); // Kepala Merge A-B
    mergeRow(r-1, r-1, 3, 4); // Bendahara Merge D-E
    
    addRow(["", "", "", "", ""]);
    addRow(["", "", "", "", ""]);
    addRow(["", "", "", "", ""]);
    
    addRow([
        { v: "Yusuf Muzaidi, S.Pd.", s: styleTTDBold }, "", "", 
        { v: "                                              Ririn Jauharin, S.Ak.", s: styleTTDBold }, ""
    ]);
    mergeRow(r-1, r-1, 0, 1);
    mergeRow(r-1, r-1, 3, 4);

    // 3. CETAK EXCEL DENGAN PAGE LAYOUT
    try {
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        ws['!merges'] = merges;
        
        // Lebar 5 Kolom: A(5), B(16), C(9:Vol), D(22:Satuan), E(20:Jumlah/Nominal)
        // (Gabungan kolom C+D akan menghasilkan lebar area Uraian sebesar 31)
        ws['!cols'] = [ { wch: 5 }, { wch: 16 }, { wch: 14 }, { wch: 26 }, { wch: 24 } ];
        
        ws['!pageSetup'] = { paperSize: 9, orientation: 'portrait', fitToWidth: 1, fitToHeight: 0, horizontalCentered: true };
        ws['!margins'] = { left: 2 / 2.54, right: 1 / 2.54, top: 1.5 / 2.54, bottom: 1.5 / 2.54, header: 0.3, footer: 0.3 };

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Lap_${kategori}`);
        
        const safeName = kategori.replace(/\s/g, ''); 
        const safeTahun = tahunAjaran.replace('/', '-');
        XLSX.writeFile(wb, `Laporan_Non_Ops_${safeName}_${safeTahun}.xlsx`);
    } catch (err) {
        console.error("Gagal membuat file Excel:", err);
        alert("Terjadi kesalahan saat merakit file Excel.");
    }
}

// ==========================================
// FUNGSI UNDUH NON OPERASIONAL (FILTER KATEGORI & TAHUN AJARAN)
// ==========================================
async function unduhLaporanNonOpsExcel() {
    const kategori = document.getElementById('filter-jenis-nonops').value;
    const tahunAjaran = document.getElementById('filter-tahun-nonops').value; 
    const tglCetakInput = document.getElementById('filter-tgl-cetak-nonops').value;

    if (!kategori || !tahunAjaran || !tglCetakInput) {
        tampilkanModalNotif('Data Belum Lengkap', 'Silakan pilih Kategori, Tahun Ajaran, dan Tanggal Cetak TTD terlebih dahulu!', 'warning');
        return;
    }

    const btn = document.querySelector('#laporan-content-nonops button');
    const originalBtnHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="ph ph-spinner animate-spin mr-2 text-lg"></i> Memproses Laporan...`;

    tampilkanModalNotif('Memproses Laporan', `Sedang menarik data Pengeluaran ${kategori}...`, 'loading');

    try {
        // Rentang Tahun Ajaran (Juli Tahun 1 s/d Juni Tahun 2)
        const tahunSplit = tahunAjaran.split('/');
        const tahunAwalNum = parseInt(tahunSplit[0]); 
        const tahunAkhirNum = parseInt(tahunSplit[1]); 
        
        const startDate = new Date(tahunAwalNum, 6, 1); // 1 Juli
        const endDate = new Date(tahunAkhirNum, 5, 30); // 30 Juni
        
        // Tanggal TTD otomatis (Hari ini, atau akhir periode jika sudah lewat)
        // let now = new Date();
        const [y, m, d] = tglCetakInput.split('-');
        // let printDate = (now > startDate && now < endDate) ? now : endDate;
        const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        // const tglCetak = `${printDate.getDate()} ${namaBulan[printDate.getMonth()]} ${printDate.getFullYear()}`;
        const tglCetak = `${parseInt(d)} ${namaBulan[parseInt(m) - 1]} ${y}`; // Contoh hasil: 15 Agustus 2026

        const { data: rawPengeluaran, error } = await supabaseClient.from('pengeluaran_nonops').select('*'); 
        
        if (error) throw new Error("Gagal menarik data dari server");

        // Filter berdasarkan Tanggal Nota (Tahun Ajaran) dan Kategori Dropdown
        const expectedKategori = String(kategori).toLowerCase().trim();
        
        const dataPengeluaran = rawPengeluaran.filter(item => {
            if (item.is_deleted === true || item.is_deleted === 'true' || item.is_deleted === 1) return false;
            if (!item.tanggal_nota) return false;
            
            const d = new Date(item.tanggal_nota);
            d.setHours(0,0,0,0);
            if (d < startDate || d > endDate) return false;

            const jenisItem = String(item.jenis_pengeluaran_nonops || item.jenis || "").toLowerCase().trim();
            return jenisItem === expectedKategori;
        });

        generateFileNonOpsExcel(kategori, tahunAjaran, tglCetak, dataPengeluaran);

        tampilkanModalNotif('Berhasil!', 'Laporan Non Operasional siap dicetak.', 'success');
        setTimeout(() => tutupModalNotif(), 2000); 

    } catch (error) {
        console.error("Error Laporan Non Ops:", error);
        tampilkanModalNotif('Gagal Unduh', 'Terjadi kesalahan. Pastikan nama tabel Supabase sudah benar.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalBtnHtml;
    }
}

// ==========================================
// KENDALI MODAL NOTIFIKASI
// ==========================================
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