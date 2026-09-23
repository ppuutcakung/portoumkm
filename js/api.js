/**
 * ============================================================
 * PortoUMKM - Lapisan komunikasi ke backend (GAS REST API)
 * ============================================================
 * PENTING: memakai teknik JSONP (tag <script> dinamis), BUKAN fetch()
 * biasa, untuk SEMUA aksi (baca maupun tulis) kecuali upload file.
 *
 * Alasannya: Google Apps Script Web App yang diakses lintas-domain
 * (mis. dari GitHub Pages) sering gagal dipanggil lewat fetch() karena
 * redirect internal Google (script.google.com -> script.googleusercontent.
 * com/macros/echo) bermasalah dengan CORS di banyak kasus - ini
 * keterbatasan yang sudah lama dikenal di komunitas developer Apps
 * Script, bukan bug di kode ini. Tag <script>, di sisi lain, SAMA SEKALI
 * tidak tunduk pada aturan CORS, sehingga jadi solusi yang jauh lebih
 * andal untuk kasus ini.
 *
 * SEMUA pemanggilan backend di seluruh file JS lain WAJIB lewat
 * apiGet/apiPost/apiUploadFile di file ini - jangan panggil fetch()
 * atau bikin <script> sendiri di tempat lain.
 */

let __jsonpCounter = 0;

/**
 * Inti mekanisme JSONP: injeksi tag <script> yang memuat URL backend,
 * backend membungkus balasannya sebagai pemanggilan fungsi JS
 * (namaCallback({...})), lalu fungsi itu otomatis terpanggil begitu
 * script selesai dimuat browser.
 * @returns {Promise<{success:boolean, data:*, message:string}>}
 */
function jsonpRequest(qsObj) {
    return new Promise(function(resolve) {
        const callbackName = 'portoumkm_cb_' + (__jsonpCounter++) + '_' + Date.now();
        const fullQsObj = Object.assign({}, qsObj, { callback: callbackName });
        if (AppState.sessionToken) fullQsObj.token = AppState.sessionToken;
        const qs = Object.keys(fullQsObj).map(function(k) {
            return encodeURIComponent(k) + '=' + encodeURIComponent(fullQsObj[k]);
        }).join('&');

        let selesai = false;
        const timeoutId = setTimeout(function() {
            if (selesai) return;
            selesai = true;
            bersihkan();
            resolve({ success: false, data: null, message: 'Waktu tunggu server habis. Cek koneksi internet Anda dan coba lagi.' });
        }, 15000);

        function bersihkan() {
            clearTimeout(timeoutId);
            delete window[callbackName];
            if (script.parentNode) script.parentNode.removeChild(script);
        }

        window[callbackName] = function(result) {
            if (selesai) return;
            selesai = true;
            bersihkan();
            resolve(result);
        };

        const script = document.createElement('script');
        script.src = GAS_API_URL + '?' + qs;
        script.onerror = function() {
            if (selesai) return;
            selesai = true;
            bersihkan();
            resolve({ success: false, data: null, message: 'Gagal terhubung ke server. Cek koneksi internet Anda.' });
        };
        document.head.appendChild(script);
    });
}

/**
 * Panggil aksi BACA (read-only) ke backend.
 * @param {string} action - nama action, misal 'getProdukList'
 * @param {object} [params] - parameter tambahan
 * @returns {Promise<{success:boolean, data:*, message:string}>}
 */
function apiGet(action, params) {
    params = params || {};
    const qsObj = { action: action };
    Object.keys(params).forEach(function(k) {
        if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
            qsObj[k] = String(params[k]);
        }
    });
    return jsonpRequest(qsObj);
}

/**
 * Panggil aksi TULIS (create/update/delete/login/checkout) ke backend.
 * Payload dikirim lewat parameter 'data' (JSON di-encode ke URL) - tetap
 * lewat mekanisme JSONP yang sama supaya konsisten kebal CORS.
 * (Pengecualian: 'uploadFileToDrive' punya jalur sendiri - lihat
 * apiUploadFile - karena data base64 foto terlalu besar untuk muat di URL.)
 * @param {string} action - nama action, misal 'addRecord'
 * @param {object} [data] - payload data
 * @returns {Promise<{success:boolean, data:*, message:string}>}
 */
function apiPost(action, data) {
    return jsonpRequest({ action: action, data: JSON.stringify(data || {}) });
}

/**
 * Upload 1 file (foto/PDF) ke Google Drive lewat backend. Berbeda dari
 * aksi lain, ini WAJIB pakai POST (fetch) biasa karena data base64 foto
 * bisa jauh lebih besar dari batas panjang URL yang dibutuhkan JSONP.
 * @param {File} file
 * @param {string} folderKey - key folder Drive tujuan di AppConfig, mis. 'uploadFolderId'
 * @returns {Promise<{success:boolean, data:{fileId,fileUrl,fileName}, message:string}>}
 */
function apiUploadFile(file, folderKey) {
    return new Promise(function(resolve) {
        const reader = new FileReader();
        reader.onload = function() {
            const base64 = reader.result.split(',')[1];
            const body = JSON.stringify({ action: 'uploadFileToDrive', token: AppState.sessionToken || '', data: { fileData: base64, fileName: file.name, mimeType: file.type, folderKey: folderKey } });
            fetch(GAS_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: body
            })
                .then(function(res) { return res.json(); })
                .then(resolve)
                .catch(function(err) {
                    console.error('[apiUploadFile] gagal:', err);
                    resolve({ success: false, data: null, message: 'Gagal mengunggah file. Kalau masalah ini berlanjut, kabari pengembang - upload file mungkin butuh penyesuaian tambahan pada koneksi lintas-domain.' });
                });
        };
        reader.onerror = function() {
            resolve({ success: false, data: null, message: 'Gagal membaca file di browser.' });
        };
        reader.readAsDataURL(file);
    });
}
