/**
 * ============================================================
 * PortoUMKM - Lapisan komunikasi ke Supabase
 * ============================================================
 * Menggantikan seluruh mekanisme JSONP/GAS sebelumnya. Supabase
 * memakai fetch() biasa secara internal dan SUDAH mendukung CORS
 * dengan benar untuk domain manapun - tidak perlu akal-akalan JSONP
 * lagi seperti saat masih pakai Google Apps Script.
 *
 * Semua fungsi di sini mengembalikan bentuk seragam:
 *   { success: boolean, data: any, message: string }
 * supaya kode di file lain (customer.js, admin-*.js, dst) tetap
 * memakai pola ".then(res => { if (res.success) ... })" yang sama
 * seperti sebelumnya - meminimalkan perubahan di tempat lain.
 */

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Baca data dari satu tabel, dengan filter/urutan/batas opsional.
 * @param {string} table
 * @param {object} [opts] - { select, eq:{kolom:nilai}, order, ascending, limit, single }
 */
async function dbSelect(table, opts) {
    opts = opts || {};
    try {
        let q = supabaseClient.from(table).select(opts.select || '*');
        if (opts.eq) Object.keys(opts.eq).forEach(function(k) { q = q.eq(k, opts.eq[k]); });
        if (opts.order) q = q.order(opts.order, { ascending: opts.ascending !== false });
        if (opts.limit) q = q.limit(opts.limit);
        const result = opts.single ? await q.single() : await q;
        if (result.error) return { success: false, data: null, message: result.error.message };
        return { success: true, data: result.data, message: 'OK' };
    } catch (err) {
        return { success: false, data: null, message: 'Gagal terhubung ke server: ' + err.message };
    }
}

/** Tambah 1 baris baru, kembalikan baris yang baru dibuat (termasuk ID-nya). */
async function dbInsert(table, record) {
    try {
        const { data, error } = await supabaseClient.from(table).insert(record).select().single();
        if (error) return { success: false, data: null, message: error.message };
        return { success: true, data: data, message: 'Data berhasil ditambahkan.' };
    } catch (err) {
        return { success: false, data: null, message: 'Gagal terhubung ke server: ' + err.message };
    }
}

/** Ubah 1 baris berdasarkan ID, kembalikan baris yang sudah diperbarui. */
async function dbUpdate(table, id, record) {
    try {
        const { data, error } = await supabaseClient.from(table).update(record).eq('id', id).select().single();
        if (error) return { success: false, data: null, message: error.message };
        return { success: true, data: data, message: 'Data berhasil diperbarui.' };
    } catch (err) {
        return { success: false, data: null, message: 'Gagal terhubung ke server: ' + err.message };
    }
}

/** Hapus 1 baris berdasarkan ID. */
async function dbDelete(table, id) {
    try {
        const { error } = await supabaseClient.from(table).delete().eq('id', id);
        if (error) return { success: false, data: null, message: error.message };
        return { success: true, data: null, message: 'Data berhasil dihapus.' };
    } catch (err) {
        return { success: false, data: null, message: 'Gagal terhubung ke server: ' + err.message };
    }
}

/**
 * Simpan banyak baris sekaligus (insert kalau belum ada, update kalau
 * sudah ada) dalam SATU permintaan - dipakai utamanya untuk menyimpan
 * seluruh Pengaturan Aplikasi (tabel app_config) sekaligus, bukan satu-
 * satu per key (gas-instant-ux prinsip #4: batch, bukan banyak panggilan
 * kecil terpisah).
 */
async function dbUpsertMany(table, records, conflictCol) {
    try {
        const { data, error } = await supabaseClient.from(table).upsert(records, { onConflict: conflictCol }).select();
        if (error) return { success: false, data: null, message: error.message };
        return { success: true, data: data, message: 'Data berhasil disimpan.' };
    } catch (err) {
        return { success: false, data: null, message: 'Gagal terhubung ke server: ' + err.message };
    }
}

/** Panggil fungsi RPC khusus di database (logika bisnis kompleks: skor produk, checkout, dashboard, dll). */
async function dbRpc(fnName, params) {
    try {
        const { data, error } = await supabaseClient.rpc(fnName, params || {});
        if (error) return { success: false, data: null, message: error.message };
        return { success: true, data: data, message: 'OK' };
    } catch (err) {
        return { success: false, data: null, message: 'Gagal terhubung ke server: ' + err.message };
    }
}

// -------------------- AUTENTIKASI ADMIN --------------------
async function authSignIn(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email: email, password: password });
        if (error) return { success: false, data: null, message: 'Email atau password salah.' };
        return { success: true, data: { session: data.session, user: data.user }, message: 'Login berhasil.' };
    } catch (err) {
        return { success: false, data: null, message: 'Gagal terhubung ke server: ' + err.message };
    }
}
async function authSignOut() {
    try { await supabaseClient.auth.signOut(); } catch (err) { /* aman diabaikan */ }
    return { success: true, data: null, message: 'OK' };
}
/** Ambil sesi yang sedang aktif (dipulihkan otomatis oleh supabase-js dari localStorage kalau ada). */
async function authGetSession() {
    try {
        const { data } = await supabaseClient.auth.getSession();
        return data.session;
    } catch (err) {
        return null;
    }
}
async function authUpdateUser(updates) {
    try {
        const { data, error } = await supabaseClient.auth.updateUser(updates);
        if (error) return { success: false, data: null, message: error.message };
        return { success: true, data: data.user, message: 'Kredensial berhasil diperbarui.' };
    } catch (err) {
        return { success: false, data: null, message: 'Gagal terhubung ke server: ' + err.message };
    }
}

// -------------------- UPLOAD/HAPUS FILE (lewat Edge Function -> Google Drive) --------------------
/**
 * @param {File} file
 * @param {string} folderKey - key di tabel app_config, mis. 'uploadFolderId'
 */
async function uploadFile(file, folderKey) {
    return new Promise(function(resolve) {
        const reader = new FileReader();
        reader.onload = async function() {
            try {
                const base64 = reader.result.split(',')[1];
                const session = await authGetSession();
                const res = await fetch(UPLOAD_FUNCTION_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + (session ? session.access_token : SUPABASE_ANON_KEY)
                    },
                    body: JSON.stringify({ fileData: base64, fileName: file.name, mimeType: file.type, folderKey: folderKey })
                });
                const json = await res.json();
                resolve(json);
            } catch (err) {
                resolve({ success: false, data: null, message: 'Gagal mengunggah file: ' + err.message });
            }
        };
        reader.onerror = function() {
            resolve({ success: false, data: null, message: 'Gagal membaca file di browser.' });
        };
        reader.readAsDataURL(file);
    });
}
/** @param {string} fileId - ID file Google Drive (bukan path/URL) */
async function deleteFile(fileId) {
    if (!fileId) return { success: true, data: null, message: 'OK' };
    try {
        const session = await authGetSession();
        const res = await fetch(UPLOAD_FUNCTION_URL, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (session ? session.access_token : SUPABASE_ANON_KEY)
            },
            body: JSON.stringify({ fileId: fileId })
        });
        return await res.json();
    } catch (err) {
        return { success: false, data: null, message: 'Gagal menghapus file: ' + err.message };
    }
}
