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

function generateBukuBesarExcel(tahunAjaran, tglCetak, dataPemSiswa, dataPemBantuan, dataPengOps, dataPengNonOps) {
  const fontNormal = { name: "Times New Roman", sz: 11 };
  const fontBold = { name: "Times New Roman", sz: 11, bold: true };
  const formatUang = '_-[$Rp-id-ID]* #,##0_-;-[$Rp-id-ID]* #,##0_-;_-[$Rp-id-ID]* "-"_-;_-@_-'; 
  const borderAll = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
  const fillHijau = { fgColor: { rgb: "C6E0B4" } }; 

  const stJudul = { font: fontBold, alignment: { horizontal: "center", vertical: "center" } };
  const stSubJudul = { font: fontBold, alignment: { horizontal: "left", vertical: "center" } };
  const stHeader = { font: fontBold, alignment: { horizontal: "center", vertical: "center" }, border: borderAll, fill: fillHijau };
  const stTengah = { font: fontNormal, alignment: { horizontal: "center", vertical: "center" }, border: borderAll };
  const stKiri = { font: fontNormal, alignment: { vertical: "center" }, border: borderAll };
  const stUang = { font: fontNormal, alignment: { vertical: "center" }, border: borderAll, numFmt: formatUang };
  const stUangTebal = { font: fontBold, alignment: { vertical: "center" }, border: borderAll, numFmt: formatUang, fill: fillHijau };
  const stLabelTebal = { font: fontBold, alignment: { horizontal: "center", vertical: "center" }, border: borderAll, fill: fillHijau };

  // Kalkulasi Total
  const sumNominal = (arr) => arr.reduce((sum, item) => sum + (Number(item.nominal) || Number(item.jumlah) || 0), 0);
  const totPemSiswa = sumNominal(dataPemSiswa);
  const totPemBantuan = sumNominal(dataPemBantuan);
  const totPemOps = totPemSiswa + totPemBantuan;
  const totPengOps = sumNominal(dataPengOps);
  const totPengNonOps = sumNominal(dataPengNonOps);
  const saldoOps = totPemOps - totPengOps;
  const sisaKasBersih = saldoOps - totPengNonOps;

  const wb = XLSX.utils.book_new();

  // 🛡️ FITUR BARU: Fungsi Bantuan Pencetak Sheet (Anti-Error Merge)
  function createSheet(sheetName, colWidths, builderFn) {
    const excelData = [];
    const merges = [];
    let r = 0;

    const addRow = (rowData) => { excelData.push(rowData); r++; };
    const mergeRow = (startRow, endRow, startCol, endCol) => {
      merges.push({ s: { r: startRow, c: startCol }, e: { r: endRow, c: endCol } });
    };
    const getRow = () => r;

    // Jalankan perintah merakit isi dari masing-masing sheet
    builderFn(addRow, mergeRow, getRow);

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    ws['!merges'] = merges;
    ws['!cols'] = colWidths;
    ws['!pageSetup'] = { paperSize: 9, orientation: 'portrait', fitToWidth: 1, fitToHeight: 0, horizontalCentered: true };
    ws['!margins'] = { left: 2/2.54, right: 1/2.54, top: 1.5/2.54, bottom: 1.5/2.54, header: 0.3, footer: 0.3 };
    
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  // Fungsi Bantuan Pencetak Tanda Tangan (Tanpa Merge, Sejajar Kolom)
  // Fungsi Bantuan Pencetak Tanda Tangan (Dinamis & Sejajar Kolom)
  const cetakTTD = (addRow, colKepala, colBendahara) => {
    const maxCol = Math.max(colKepala, colBendahara) + 1;
    const emptyRow = () => new Array(maxCol).fill("");

    addRow(emptyRow());
    
    let rowTgl = emptyRow();
    rowTgl[colBendahara] = { v: `Gedangan, ${tglCetak}`, s: { font: fontNormal } };
    addRow(rowTgl);
    
    let rowJabatan = emptyRow();
    rowJabatan[colKepala] = { v: "Kepala MA Bi'rul Ulum", s: { font: fontNormal } };
    rowJabatan[colBendahara] = { v: "Bendahara MA Bi'rul Ulum", s: { font: fontNormal } };
    addRow(rowJabatan);
    
    addRow(emptyRow()); addRow(emptyRow()); addRow(emptyRow());
    
    let rowNama = emptyRow();
    rowNama[colKepala] = { v: "Yusuf Muzaidi, S.Pd.", s: { font: fontBold } };
    rowNama[colBendahara] = { v: "Ririn Jauharin, S.Ak.", s: { font: fontBold } };
    addRow(rowNama);
  };

  // Fungsi TTD khusus Sheet 2 & 3 (4 Kolom dengan Merge A-B dan C-D)
  const cetakTTD_4Col = (addRow, mergeRow, getRow) => {
    const stPinggirTTD = { font: fontNormal, alignment: { vertical: "center" } };
    const stPinggirTebalTTD = { font: fontBold, alignment: { vertical: "center" } };
    
    addRow(["", "", "", ""]);
    
    let currR = getRow();
    addRow(["", "", { v: `                                                                    Gedangan, ${tglCetak}`, s: stPinggirTTD }, ""]);
    mergeRow(currR, currR, 2, 3); // Merge Kolom C & D untuk Tanggal
    
    currR = getRow();
    addRow([{ v: "     Kepala MA Bi'rul Ulum", s: stPinggirTTD }, "", { v: "                                                                    Bendahara MA Bi'rul Ulum", s: stPinggirTTD }, ""]);
    mergeRow(currR, currR, 0, 1); // Merge Kolom A & B (Kepala Sekolah)
    mergeRow(currR, currR, 2, 3); // Merge Kolom C & D (Bendahara)
    
    addRow(["", "", "", ""]); addRow(["", "", "", ""]); addRow(["", "", "", ""]);
    
    currR = getRow();
    addRow([{ v: "     Yusuf Muzaidi, S.Pd.", s: stPinggirTebalTTD }, "", { v: "                                                                    Ririn Jauharin, S.Ak.", s: stPinggirTebalTTD }, ""]);
    mergeRow(currR, currR, 0, 1); // Merge Kolom A & B
    mergeRow(currR, currR, 2, 3); // Merge Kolom C & D
  };
  // ==========================================
  // SHEET 1: REKAPITULASI (COVER)
  // ==========================================
  const stKiriTebal = { font: fontBold, alignment: { vertical: "center" }, border: borderAll }; 
  
  createSheet("1_Rekapitulasi", [{ wch: 50 }, { wch: 37 }], (addRow, mergeRow, getRow) => {
      
    // Kop Surat (Merge Kolom A & B saja / index 0 & 1)
    addRow([{ v: "REKAPITULASI BUKU BESAR TAHUNAN", s: stJudul }, ""]); mergeRow(getRow()-1, getRow()-1, 0, 1);
    addRow([{ v: `MA BI'RUL ULUM TAHUN AJARAN ${tahunAjaran}`, s: stJudul }, ""]); mergeRow(getRow()-1, getRow()-1, 0, 1);
    addRow(["", ""]);

    // Kas Operasional
    addRow([{ v: "KAS OPERASIONAL", s: stSubJudul }, ""]); 
    addRow([{ v: "Total Pemasukan (Siswa + Bantuan)", s: stKiri }, { v: totPemOps, t: 'n', s: { font: fontNormal, border: borderAll, numFmt: formatUang } }]); 
    addRow([{ v: "Total Pengeluaran Operasional", s: stKiri }, { v: totPengOps, t: 'n', s: { font: fontNormal, border: borderAll, numFmt: formatUang } }]); 
    addRow([{ v: "Saldo Kas Operasional", s: stKiriTebal }, { v: saldoOps, t: 'n', s: { font: fontBold, border: borderAll, numFmt: formatUang } }]); 
    addRow(["", ""]);
    
    // Kas Non-Operasional
    addRow([{ v: "KAS NON-OPERASIONAL", s: stSubJudul }, ""]); 
    addRow([{ v: "Total Pengeluaran Khusus/Non-Ops", s: stKiri }, { v: totPengNonOps, t: 'n', s: { font: fontNormal, border: borderAll, numFmt: formatUang } }]); 
    addRow(["", ""]);
    
    // Sisa Kas Keseluruhan
    addRow([{ v: "SISA SALDO TAHUNAN", s: stSubJudul }, { v: sisaKasBersih, t: 'n', s: { font: fontBold, border: borderAll, numFmt: formatUang, fill: fillHijau } }]); 
    
    // Panggil TTD (Kepala di Kolom A index 0, Bendahara di Kolom B index 1)
    cetakTTD(addRow, 0, 1);
  });

  // ==========================================
  // SHEET 2: KAS OPERASIONAL
  // ==========================================
  createSheet("2_Operasional", [{ wch: 5 }, { wch: 18 }, { wch: 43 }, { wch: 20 }], (addRow, mergeRow, getRow) => {
    addRow([{ v: "BUKU KAS OPERASIONAL TAHUNAN", s: stJudul }, "", "", ""]); mergeRow(getRow()-1, getRow()-1, 0, 3);
    addRow([{ v: `TAHUN AJARAN ${tahunAjaran}`, s: stJudul }, "", "", ""]); mergeRow(getRow()-1, getRow()-1, 0, 3);
    addRow(["", "", "", ""]);
    
    // Pemasukan Ops
    addRow([{ v: "A. PEMASUKAN", s: stSubJudul }, "", "", ""]); mergeRow(getRow()-1, getRow()-1, 0, 3);
    addRow([{ v: "No", s: stHeader }, { v: "Tanggal Update", s: stHeader }, { v: "Uraian", s: stHeader }, { v: "Jumlah", s: stHeader }]);
    addRow([{ v: 1, s: stTengah }, { v: tglCetak, s: stTengah }, { v: `Pemasukan Siswa Tahun Ajaran ${tahunAjaran}`, s: stKiri }, { v: totPemSiswa, t: 'n', s: stUang }]);
    addRow([{ v: 2, s: stTengah }, { v: tglCetak, s: stTengah }, { v: `Penerimaan Bantuan Tahun Ajaran ${tahunAjaran}`, s: stKiri }, { v: totPemBantuan, t: 'n', s: stUang }]);
    // addRow([{ v: "Jumlah Pemasukan", s: stLabelTebal }, "", "", { v: totPemOps, t: 'n', s: stUangTebal }]); mergeRow(getRow()-1, getRow()-1, 0, 2);
    // (Ganti baris Jumlah Pemasukan ini)
    addRow([{ v: "Jumlah Pemasukan", s: stLabelTebal }, { v: "", s: stLabelTebal }, { v: "", s: stLabelTebal }, { v: totPemOps, t: 'n', s: stUangTebal }]); mergeRow(getRow()-1, getRow()-1, 0, 2);
    addRow(["", "", "", ""]);
    
    // Pengeluaran Ops
    addRow([{ v: "B. PENGELUARAN", s: stSubJudul }, "", "", ""]); mergeRow(getRow()-1, getRow()-1, 0, 3);
    addRow([{ v: "No", s: stHeader }, { v: "Tanggal Nota", s: stHeader }, { v: "Uraian", s: stHeader }, { v: "Nominal", s: stHeader }]);
    
    if(dataPengOps.length > 0) {
      dataPengOps.sort((a, b) => new Date(a.tanggal_nota) - new Date(b.tanggal_nota));
      dataPengOps.forEach((item, i) => {
        let tgl = item.tanggal_nota ? new Date(item.tanggal_nota).toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'}) : '-';
        let jenisRapi = (item.jenis_pengeluaran || item.jenis || '').toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
        let ket = item.keterangan || item.uraian || '-';
        addRow([{ v: i+1, s: stTengah }, { v: tgl, s: stTengah }, { v: `(${jenisRapi}) ${ket}`, s: stKiri }, { v: Number(item.nominal) || 0, t: 'n', s: stUang }]);
      });
    } else {
      addRow([{ v: "-", s: stTengah }, { v: "-", s: stTengah }, { v: "Nihil", s: stKiri }, { v: 0, t: 'n', s: stUang }]);
    }
    // addRow([{ v: "Jumlah Pengeluaran", s: stLabelTebal }, "", "", { v: totPengOps, t: 'n', s: stUangTebal }]); mergeRow(getRow()-1, getRow()-1, 0, 2);
    // (Ganti baris Jumlah Pengeluaran ini)
    addRow([{ v: "Jumlah Pengeluaran", s: stLabelTebal }, { v: "", s: stLabelTebal }, { v: "", s: stLabelTebal }, { v: totPengOps, t: 'n', s: stUangTebal }]); mergeRow(getRow()-1, getRow()-1, 0, 2);
    
    cetakTTD_4Col(addRow, mergeRow, getRow);
  });

  // ==========================================
  // SHEET 3: KAS NON-OPERASIONAL
  // ==========================================
  createSheet("3_Non_Operasional", [{ wch: 5 }, { wch: 18 }, { wch: 43 }, { wch: 20 }], (addRow, mergeRow, getRow) => {
    addRow([{ v: "BUKU KAS NON-OPERASIONAL TAHUNAN", s: stJudul }, "", "", ""]); mergeRow(getRow()-1, getRow()-1, 0, 3);
    addRow([{ v: `TAHUN AJARAN ${tahunAjaran}`, s: stJudul }, "", "", ""]); mergeRow(getRow()-1, getRow()-1, 0, 3);
    addRow(["", "", "", ""]);
    
    addRow([{ v: "RINCIAN PENGELUARAN", s: stSubJudul }, "", "", ""]); mergeRow(getRow()-1, getRow()-1, 0, 3);
    addRow([{ v: "No", s: stHeader }, { v: "Tanggal Nota", s: stHeader }, { v: "Uraian Kategori", s: stHeader }, { v: "Nominal", s: stHeader }]);
    
    if(dataPengNonOps.length > 0) {
      dataPengNonOps.sort((a, b) => new Date(a.tanggal_nota) - new Date(b.tanggal_nota));
      dataPengNonOps.forEach((item, i) => {
        let tgl = item.tanggal_nota ? new Date(item.tanggal_nota).toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'}) : '-';
        let jenisRapi = (item.jenis_pengeluaran_nonops || item.jenis_pengeluaran || '').toUpperCase().replace(/\b\w/g, s => s.toUpperCase());
        let ket = item.keterangan || item.uraian || '-';
        addRow([{ v: i+1, s: stTengah }, { v: tgl, s: stTengah }, { v: `(${jenisRapi}) ${ket}`, s: stKiri }, { v: Number(item.nominal) || Number(item.jumlah) || 0, t: 'n', s: stUang }]);
      });
    } else {
      addRow([{ v: "-", s: stTengah }, { v: "-", s: stTengah }, { v: "Nihil", s: stKiri }, { v: 0, t: 'n', s: stUang }]);
    }
    // addRow([{ v: "Jumlah Pengeluaran Non-Ops", s: stLabelTebal }, "", "", { v: totPengNonOps, t: 'n', s: stUangTebal }]); mergeRow(getRow()-1, getRow()-1, 0, 2);
    // (Ganti baris Jumlah Pengeluaran Non-Ops ini)
    addRow([{ v: "Jumlah Pengeluaran Non-Ops", s: stLabelTebal }, { v: "", s: stLabelTebal }, { v: "", s: stLabelTebal }, { v: totPengNonOps, t: 'n', s: stUangTebal }]); mergeRow(getRow()-1, getRow()-1, 0, 2);
    
    cetakTTD_4Col(addRow, mergeRow, getRow);
  });

  // ==========================================
  // EXPORT FILE
  // ==========================================
  try {
    const safeTahun = tahunAjaran.replace('/', '-');
    XLSX.writeFile(wb, `Buku_Besar_Tahunan_${safeTahun}.xlsx`);
  } catch (err) {
    console.error(err); alert("Gagal menyimpan Excel.");
  }
}

// ==========================================
// FUNGSI 2: TARIK DATA DARI SUPABASE (1 TAHUN PENUH)
// ==========================================
async function unduhBukuBesarExcel() {
  const tahunAjaran = document.getElementById('filter-tahun-bukubesar').value;
  const tglCetakInput = document.getElementById('filter-tgl-cetak-bukubesar').value; 

  if (!tahunAjaran || !tglCetakInput) {
    tampilkanModalNotif('Data Belum Lengkap', 'Pilih Tahun Ajaran dan Tanggal Cetak!', 'warning');
    return;
  }

  const btn = document.getElementById('btn-unduh-bukubesar');
  const iconBtn = document.getElementById('icon-unduh-bukubesar');
  const textBtn = document.getElementById('text-unduh-bukubesar');
  
  btn.disabled = true;
  iconBtn.className = "ph ph-spinner animate-spin mr-2 text-lg";
  textBtn.innerText = "Merakit 3 Sheet...";
  tampilkanModalNotif('Tutup Buku Tahunan', `Menarik seluruh riwayat transaksi Tahun Ajaran ${tahunAjaran}...`, 'loading');

  try {
    // Tentukan Rentang 1 Tahun (1 Juli s/d 30 Juni)
    const tahunSplit = tahunAjaran.split('/');
    const startDate = new Date(parseInt(tahunSplit[0]), 6, 1);  // 1 Juli
    const endDate = new Date(parseInt(tahunSplit[1]), 5, 30);   // 30 Juni
    
    // Format Tgl Cetak
    const [y, m, d] = tglCetakInput.split('-');
    const namaBulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const tglCetak = `${parseInt(d)} ${namaBulanIndo[parseInt(m) - 1]} ${y}`;

    // Download semua data 4 Tabel secara paralel (Biar Cepat)
    const [resPem, resBan, resPengOps, resPengNon] = await Promise.all([
      supabaseClient.from('pemasukan').select('*'),
      supabaseClient.from('bantuan').select('*'),
      supabaseClient.from('pengeluaran').select('*'),
      supabaseClient.from('pengeluaran_nonops').select('*') // Sesuaikan nama tabel Non-Ops Anda
    ]);

    if (resPem.error || resBan.error || resPengOps.error || resPengNon.error) throw new Error("Gagal tarik data");

    // Fungsi parsing tanggal dari kode lama Anda (wajib dimasukkan ke blok ini agar terbaca)
    const parseDateSuper = (str) => {
      if (!str) return null;
      const s = String(str).toLowerCase().trim();
      const parts = s.split(' ');
      if (parts.length >= 3) {
          const bMap = { 'januari':0, 'februari':1, 'maret':2, 'april':3, 'mei':4, 'juni':5, 'juli':6, 'agustus':7, 'september':8, 'oktober':9, 'november':10, 'desember':11 };
          const dt = parseInt(parts[0]), mo = bMap[parts[1]], yr = parseInt(parts[2]);
          if (!isNaN(dt) && mo !== undefined && !isNaN(yr)) return new Date(yr, mo, dt);
      }
      const std = new Date(str);
      if (!isNaN(std.getTime())) return std;
      return null;
    };

    // Filter Universal (Pastikan di antara 1 Juli - 30 Juni)
    const filterTahunan = (arr, dateColumn) => arr.filter(item => {
      if (item.is_deleted === true || String(item.is_deleted) === 'true' || item.is_deleted === 1) return false;
      let d = parseDateSuper(item[dateColumn] || item.tanggal);
      if (!d) return false;
      d.setHours(0,0,0,0);
      return d >= startDate && d <= endDate;
    });

    const finalPemSiswa = filterTahunan(resPem.data, 'tanggal_input');
    const finalPemBantuan = filterTahunan(resBan.data, 'tanggal_transaksi');
    const finalPengOps = filterTahunan(resPengOps.data, 'tanggal_nota');
    const finalPengNon = filterTahunan(resPengNon.data, 'tanggal_nota');

    // Rakit Excel!
    generateBukuBesarExcel(tahunAjaran, tglCetak, finalPemSiswa, finalPemBantuan, finalPengOps, finalPengNon);

    tampilkanModalNotif('Sukses!', 'Buku Besar 3 Sheet berhasil diunduh.', 'success');
    setTimeout(() => tutupModalNotif(), 2000);

  } catch (error) {
    console.error(error);
    tampilkanModalNotif('Gagal Laporan', 'Terjadi kesalahan sistem', 'error');
    setTimeout(() => tutupModalNotif(), 2000);
  } finally {
    btn.disabled = false;
    iconBtn.className = "ph ph-file-xls mr-2 text-lg";
    textBtn.innerText = "Unduh Buku Besar";
  }
}

function setupExcelEvents() {
  const btnOps = document.getElementById('btn-unduh-laporan');
  const btnNonOps = document.getElementById('btn-unduh-laporan-non');
  const btnRekap = document.getElementById('btn-unduh-bukubesar');

  if (btnOps) btnOps.addEventListener('click', unduhLaporanExcel);
  if (btnNonOps) btnNonOps.addEventListener('click', unduhLaporanNonOpsExcel);
  if (btnRekap) btnRekap.addEventListener('click', unduhBukuBesarExcel);
}