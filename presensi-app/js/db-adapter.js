// =========================================================
// DB ADAPTER
// Semua halaman (scanner.js, admin-*.js) memanggil fungsi di
// objek DB ini. Adapter yang memutuskan apakah request pergi
// ke Supabase (online) atau ke api/*.php (offline).
// =========================================================

const DB = (() => {
  const isOnline = CONFIG.MODE === 'online';
  const sb = isOnline && window.supabase
    ? window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)
    : null;

  async function callPhp(file, { method = 'GET', body, query = '' } = {}) {
    const res = await fetch(`${CONFIG.API_BASE}/${file}${query}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan');
    return data;
  }

  const HARI_MAP = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

  function toSeconds(t) { const [h,m,s] = t.split(':').map(Number); return h*3600+m*60+(s||0); }
  function addMinutes(timeStr, mins) {
    const [h, m, s] = timeStr.split(':').map(Number);
    const d = new Date(2000, 0, 1, h, m, s);
    d.setMinutes(d.getMinutes() + mins);
    return d.toTimeString().slice(0, 8);
  }

  // ---------- helper laporan (dipakai versi online, meniru logic laporan.php) ----------
  function formatDurasiLaporan(totalMenit) {
    const jam = Math.floor(totalMenit / 60);
    const sisa = totalMenit % 60;
    if (jam > 0) return sisa > 0 ? `${jam} Jam ${sisa} Menit` : `${jam} Jam`;
    return `${totalMenit} Menit`;
  }

  function ketMasukJS(jadwal, jamScanMasuk) {
    if (!jamScanMasuk) return { label: 'Alpha', tipe: 'alpha' };
    if (jamScanMasuk <= jadwal.jam_masuk) return { label: 'Hadir Tepat Waktu', tipe: 'hadir' };
    const menit = Math.round((toSeconds(jamScanMasuk) - toSeconds(jadwal.jam_masuk)) / 60);
    return { label: 'Telat ' + formatDurasiLaporan(menit), tipe: 'telat' };
  }

  function ketPulangJS(jadwal, jamScanMasuk, jamScanPulang) {
    if (!jamScanMasuk) return { label: '-', tipe: 'alpha' };
    if (!jamScanPulang) return { label: 'Belum Scan Pulang', tipe: 'warning' };
    if (jamScanPulang >= jadwal.jam_pulang) return { label: 'Pulang Tepat Waktu', tipe: 'hadir' };
    const menit = Math.round((toSeconds(jadwal.jam_pulang) - toSeconds(jamScanPulang)) / 60);
    return { label: 'Pulang Awal ' + formatDurasiLaporan(menit), tipe: 'pulang' };
  }

  // ---------- laporan (online) ----------
  async function laporanOnline(dari, sampai, guruId, status) {
    let q = sb.from('guru').select('id, nama, guru_jadwal(*)').eq('aktif', true);
    if (guruId) q = q.eq('id', guruId);
    const { data: guruList } = await q;

    /*
    DUGAAN ERROR TIDAK TAMPIL LAPORAN
    - Input jadwal guru rabu tapi tampil di laporan presensi jadi hari selasa menyebabkan hasil alpha
    - Failed to load resource: the server responded with a status of 400 () 
      supabase_url/presensi/select=*&tanggal=gte.2026-08-05&tanggal=lte
    
    - Hasil Filter aneh, saat pilih rentang tgl 1-31 agustus 2026 hasil sesuai presensi di tanggal hari ini, tapi tampilan tabel dari tanggal 31/7/2026, 02/08/2026-30/08/2026
    - tapi saat filter rentang di tanggal hari ini saja yg muncul data hari kemarin hasilnya alpha, dan saat filter tanggal besoknya hasil keluar tanggal sekarang tapi hasil alpha

    contoh filter dari tanggal 6 - 8 output tabelnya tanggal 5,6,7 jadinya tidak sesuai form filter
    contoh filter dari tanggal 6 - 6 output tabelnya tanggal 5 tapi hasil alpha, padahal sudah presensi hadir
    */
    const { data: presensiRows } = await sb.from('presensi')
      .select('*').gte('tanggal', dari).lte('tanggal', sampai);

    const { data: izinRows } = await sb.from('izin')          // <-- BARU
      .select('*').gte('tanggal', dari).lte('tanggal', sampai);

    const hasil = [];
    const cursor = new Date(dari + 'T00:00:00');
    const akhir = new Date(sampai + 'T00:00:00');

    while (cursor <= akhir) {
      const tanggalStr = cursor.toISOString().slice(0, 10);
      const hariIni = HARI_MAP[cursor.getDay()];

      (guruList || []).forEach(g => {
        const jadwalHari = (g.guru_jadwal || []).find(j => j.hari === hariIni);
        if (!jadwalHari) return;

        const p = (presensiRows || []).find(pr => pr.guru_id === g.id && pr.tanggal === tanggalStr);
        const izin = (izinRows || []).find(iz => iz.guru_id === g.id && iz.tanggal === tanggalStr);
        
        let km;
        if (izin && !p?.jam_scan_masuk) {                      // <-- BARU
          km = { label: izin.jenis, tipe: izin.jenis.toLowerCase() };
        } else {
          km = ketMasukJS(jadwalHari, p?.jam_scan_masuk);
        }
        // const km = ketMasukJS(jadwalHari, p?.jam_scan_masuk);
        const kp = ketPulangJS(jadwalHari, p?.jam_scan_masuk, p?.jam_scan_pulang);

        let cocok = true;
        if (status === 'telat') cocok = km.tipe === 'telat';
        else if (status === 'pulang_awal') cocok = kp.tipe === 'pulang';
        else if (status === 'alpha') cocok = km.tipe === 'alpha';
        else if (status === 'belum_pulang') cocok = kp.tipe === 'warning';
        // else if (status === 'izin') cocok = km.tipe === 'izin';
        else if (['sakit','izin','kegiatan'].includes(status)) cocok = km.tipe === status;

        if (!cocok) return;

        hasil.push({
          tanggal: tanggalStr, nama_guru: g.nama,
          jam_scan_masuk: p?.jam_scan_masuk || null,
          jam_scan_pulang: p?.jam_scan_pulang || null,
          ket_masuk: km.label, ket_masuk_tipe: km.tipe,
          ket_pulang: kp.label, ket_pulang_tipe: kp.tipe,
        });
      });
      cursor.setDate(cursor.getDate());
    }

    hasil.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    return hasil;
  }

  // ---------- import Excel (online) ----------
  function parseJadwalCellJS(teks) {
    teks = (teks || '').trim().replace('–', '-');
    if (!teks) return null;
    const bagian = teks.split('-').map(s => s.trim());
    if (bagian.length !== 2) return null;
    for (const j of bagian) if (!/^\d{1,2}:\d{2}$/.test(j)) return null;
    return [bagian[0] + ':00', bagian[1] + ':00'];
  }

  async function importGuruOnline(rows) {
    const HARI_KOLOM = { senin:'Senin', selasa:'Selasa', rabu:'Rabu', kamis:'Kamis', jumat:'Jumat', sabtu:'Sabtu' };
    let berhasil = 0;
    const gagal = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const barisKe = i + 2;
      const nama = (r.nama || '').trim();
      if (!nama) { gagal.push(`Baris ${barisKe}: nama kosong`); continue; }

      const toleransi = Number(r.toleransi) || 15;
      const aktif = ['aktif', 'active', '1'].includes(String(r.status || '').toLowerCase());

      const jadwal = [];
      Object.entries(HARI_KOLOM).forEach(([key, hari]) => {
        const parsed = parseJadwalCellJS(r[key]);
        if (parsed) jadwal.push({ hari, jam_masuk: parsed[0], jam_pulang: parsed[1], toleransi_telat_menit: toleransi });
      });
      if (!jadwal.length) { gagal.push(`Baris ${barisKe} (${nama}): tidak ada jadwal valid`); continue; }

      try {
        const kode = (r.kode || '').trim();
        let guruId = null;

        if (kode) {
          const { data: existing } = await sb.from('guru').select('id').eq('barcode_id', kode).maybeSingle();
          if (existing) guruId = existing.id;
        }

        if (guruId) {
          await sb.from('guru').update({ nama, aktif }).eq('id', guruId);
        } else {
          const barcode = kode || generateBarcodeGuru();
          const { data: inserted, error } = await sb.from('guru').insert({ nama, barcode_id: barcode, aktif }).select().single();
          if (error) throw new Error(error.message);
          guruId = inserted.id;
        }

        await sb.from('guru_jadwal').delete().eq('guru_id', guruId);
        const jadwalRows = jadwal.map(j => ({ ...j, guru_id: guruId }));
        const { error: errJ } = await sb.from('guru_jadwal').insert(jadwalRows);
        if (errJ) throw new Error(errJ.message);

        berhasil++;
      } catch (e) {
        gagal.push(`Baris ${barisKe} (${nama}): ${e.message}`);
      }
    }

    return { berhasil, gagal };
  }

  async function scanOnline(barcode) {
    const { data: guru } = await sb.from('guru').select('*').eq('barcode_id', barcode).eq('aktif', true).maybeSingle();
    if (!guru) return { error: 'Barcode tidak dikenali' };

    const hariIni = HARI_MAP[new Date().getDay()];
    const { data: jadwal } = await sb.from('guru_jadwal')
      .select('*').eq('guru_id', guru.id).eq('hari', hariIni).maybeSingle();
    if (!jadwal) return { error: `${guru.nama} tidak memiliki jadwal masuk pada hari ${hariIni}` };

    const tanggal = new Date().toISOString().slice(0, 10);
    const jamSekarang = new Date().toTimeString().slice(0, 8);

    const { data: existing } = await sb.from('presensi')
      .select('*').eq('guru_id', guru.id).eq('tanggal', tanggal).maybeSingle();

    if (!existing) {
      const batasTelat = addMinutes(jadwal.jam_masuk, jadwal.toleransi_telat_menit);
      const menitTelat = Math.max(0, Math.round((toSeconds(jamSekarang) - toSeconds(jadwal.jam_masuk)) / 60));
      const status = jamSekarang > batasTelat ? 'telat' : 'hadir';
      await sb.from('presensi').insert({ guru_id: guru.id, tanggal, jam_scan_masuk: jamSekarang, status });
      return { jenis: 'masuk', nama: guru.nama, jam: jamSekarang, status, menit_telat: status === 'telat' ? menitTelat : 0 };
    }

    if (!existing.jam_scan_pulang) {
      const durasiSesiMenit = (toSeconds(jadwal.jam_pulang) - toSeconds(jadwal.jam_masuk)) / 60;
      const minMenitPulang = Math.max(0, Math.min(60, durasiSesiMenit));
      const menitSejakMasuk = (toSeconds(jamSekarang) - toSeconds(existing.jam_scan_masuk)) / 60;

      if (menitSejakMasuk < minMenitPulang) {
        return {
          jenis: 'terlalu_cepat', nama: guru.nama,
          error: `Belum bisa presensi pulang. Minimal ${Math.ceil(minMenitPulang)} menit setelah masuk (${Math.ceil(minMenitPulang - menitSejakMasuk)} menit lagi).`,
        };
      }

      const pulangAwal = jamSekarang < jadwal.jam_pulang;
      let statusBaru = existing.status;
      if (pulangAwal) statusBaru = existing.status === 'telat' ? 'telat_dan_pulang_awal' : 'pulang_awal';
      await sb.from('presensi').update({ jam_scan_pulang: jamSekarang, status: statusBaru }).eq('id', existing.id);
      return { jenis: 'pulang', nama: guru.nama, jam: jamSekarang, status: statusBaru };
    }

    return { jenis: 'sudah_lengkap', nama: guru.nama, status: existing.status };
  }

  function generateBarcodeGuru() {
    const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `GRU-${ymd}-${rand}`;
  }

  return {
    // ---- PRESENSI (kiosk) ----
    async scan(barcode) {
      if (isOnline) return scanOnline(barcode);
      return callPhp('presensi.php', { method: 'POST', body: { barcode } });
    },
    async riwayatHariIni(tanggal, limit = 5) {
      if (isOnline) {
        const { data } = await sb.from('presensi')
          .select('*, guru(nama)').eq('tanggal', tanggal)
          .order('created_at', { ascending: false }).limit(limit);
        return (data || []).map(r => ({ ...r, nama_guru: r.guru?.nama }));
      }
      const res = await callPhp('presensi.php', { query: `?dari=${tanggal}&sampai=${tanggal}&limit=${limit}` });
      return res.data;
    },

    // ---- CEK ADMIN (dipakai kiosk, tidak pernah melempar error) ----
    async cekAdminBarcode(barcode) {
      if (isOnline) {
        const { data } = await sb.rpc('login_admin_barcode', { p_barcode: barcode });
        return data && data.length ? data[0] : null;
      }
      const res = await callPhp('auth.php', { method: 'POST', body: { action: 'cek_barcode_admin', barcode } });
      return res.user;
    },

    // ---- GURU ----
    async listGuru() {
      if (isOnline) {
        const { data: guruList } = await sb.from('guru').select('*').order('nama');
        const { data: jadwalAll } = await sb.from('guru_jadwal').select('*');
        return (guruList || []).map(g => ({ ...g, jadwal: (jadwalAll || []).filter(j => j.guru_id === g.id) }));
      }
      return (await callPhp('guru.php')).data;
    },
    async addGuru(guru) {
      if (isOnline) {
        const barcode_id = generateBarcodeGuru();
        const { data, error } = await sb.from('guru').insert({ nama: guru.nama, nip: guru.nip, barcode_id }).select().single();
        if (error) throw new Error(error.message);
        const jadwalRows = (guru.jadwal || []).map(j => ({ ...j, guru_id: data.id }));
        if (jadwalRows.length) await sb.from('guru_jadwal').insert(jadwalRows);
        return { barcode_id };
      }
      return callPhp('guru.php', { method: 'POST', body: guru });
    },
    async updateGuru(guru) {
      if (isOnline) {
        await sb.from('guru').update({ nama: guru.nama, nip: guru.nip, aktif: guru.aktif }).eq('id', guru.id);
        if (guru.jadwal) {
          await sb.from('guru_jadwal').delete().eq('guru_id', guru.id);
          const jadwalRows = guru.jadwal.map(j => ({ ...j, guru_id: guru.id }));
          if (jadwalRows.length) await sb.from('guru_jadwal').insert(jadwalRows);
        }
        return;
      }
      return callPhp('guru.php', { method: 'PUT', body: guru });
    },
    async deleteGuru(id) {
      if (isOnline) { await sb.from('guru').delete().eq('id', id); return; }
      return callPhp('guru.php', { method: 'DELETE', query: `?id=${id}` });
    },
    async importGuru(rows) {
      if (isOnline) return importGuruOnline(rows);
      return callPhp('guru-import.php', { method: 'POST', body: { rows } });
    },

    // ---- LAPORAN ----
    async laporanRentang(dari, sampai, guruId = '', status = '') {
      if (isOnline) return laporanOnline(dari, sampai, guruId ? Number(guruId) : null, status);
      const q = new URLSearchParams({ dari, sampai });
      if (guruId) q.set('guru_id', guruId);
      if (status) q.set('status', status);
      const res = await callPhp('laporan.php', { query: `?${q.toString()}` });
      return res.data;
    },

    // ---- USERS (admin) ----
    async listUsers() {
      if (isOnline) {
        const { data, error } = await sb.rpc('list_admin_users');
        if (error) throw new Error(error.message);
        return data;
      }
      return (await callPhp('users.php')).data;
    },
    async addUser(user) {
      if (isOnline) {
        const { error } = await sb.rpc('create_admin_user', {
          p_username: user.username, p_password: user.password,
          p_nama: user.nama, p_role: user.role || 'admin', p_barcode: user.barcode_id || '',
        });
        if (error) throw new Error(error.message);
        return;
      }
      return callPhp('users.php', { method: 'POST', body: user });
    },
    async updateUser(user) {
      if (isOnline) {
        const { error } = await sb.rpc('update_admin_user', {
          p_id: user.id, p_nama: user.nama, p_role: user.role || 'admin',
          p_barcode: user.barcode_id || '', p_aktif: user.aktif !== 0, p_new_password: user.password || '',
        });
        if (error) throw new Error(error.message);
        return;
      }
      return callPhp('users.php', { method: 'PUT', body: user });
    },
    async deleteUser(id) {
      if (isOnline) {
        const { error } = await sb.rpc('delete_admin_user', { p_id: id });
        if (error) throw new Error(error.message);
        return;
      }
      return callPhp('users.php', { method: 'DELETE', query: `?id=${id}` });
    },

    // GURU PIKET
    async listIzin(dari, sampai) {
      if (isOnline) {
        const { data, error } = await sb.from('izin')
          .select('*, guru(nama)')
          .gte('tanggal', dari).lte('tanggal', sampai)
          .order('tanggal', { ascending: false });
        if (error) throw new Error(error.message);
        return (data || []).map(r => ({ ...r, nama_guru: r.guru?.nama }));
      }
      const res = await callPhp('izin.php', { query: `?dari=${dari}&sampai=${sampai}` });
      return res.data;
    },

    async addIzin(data) {
      if (isOnline) {
        // "upsert" meniru ON DUPLICATE KEY UPDATE di versi MySQL -
        // kalau guru yang sama sudah punya izin di tanggal itu, akan ditimpa
        const { error } = await sb.from('izin').upsert({
          guru_id: data.guru_id,
          tanggal: data.tanggal,
          jenis: data.jenis,
          keterangan: data.keterangan || null,
          dicatat_oleh: data.dicatat_oleh || null,
        }, { onConflict: 'guru_id,tanggal' });
        if (error) throw new Error(error.message);
        return;
      }
      return callPhp('izin.php', { method: 'POST', body: data });
    },

    async deleteIzin(id) {
      if (isOnline) {
        const { error } = await sb.from('izin').delete().eq('id', id);
        if (error) throw new Error(error.message);
        return;
      }
      return callPhp('izin.php', { method: 'DELETE', query: `?id=${id}` });
    },

    // ---- AUTH ADMIN ----
    async loginAdmin(username, password) {
      if (isOnline) {
        const { data, error } = await sb.rpc('login_admin', { p_username: username, p_password: password });
        if (error || !data || !data.length) throw new Error('Username atau password salah');
        return data[0];
      }
      return (await callPhp('auth.php', { method: 'POST', body: { action: 'login', username, password } })).user;
    },
    async loginAdminBarcode(barcode) {
      if (isOnline) {
        const { data, error } = await sb.rpc('login_admin_barcode', { p_barcode: barcode });
        if (error || !data || !data.length) throw new Error('Barcode tidak terdaftar sebagai admin');
        return data[0];
      }
      return (await callPhp('auth.php', { method: 'POST', body: { action: 'login_barcode', barcode } })).user;
    },
  };
})();
