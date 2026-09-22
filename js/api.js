/**
 * ============================================================
 * PortoUMKM - Lapisan komunikasi ke backend (GAS REST API)
 * Menggantikan google.script.run sepenuhnya. SEMUA pemanggilan
 * backend di seluruh file JS lain WAJIB lewat apiGet/apiPost/apiUploadFile
 * di file ini - jangan panggil fetch() langsung di tempat lain.
 * ============================================================
 */

/**
 * Panggil aksi BACA (read-only) ke backend lewat GET.
 * @param {string} action - nama action, misal 'getProdukList'
 * @param {object} [params] - parameter tambahan, otomatis jadi query string
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
    if (AppState.sessionToken) qsObj.token = AppState.sessionToken;
    const qs = Object.keys(qsObj).map(function(k) { return encodeURIComponent(k) + '=' + encodeURIComponent(qsObj[k]); }).join('&');
    return fetch(GAS_API_URL + '?' + qs)
        .then(function(res) { return res.json(); })
        .catch(function(err) {
            console.error('[apiGet] ' + action + ' gagal:', err);
            return { success: false, data: null, message: 'Gagal terhubung ke server. Cek koneksi internet Anda.' };
        });
}

/**
 * Panggil aksi TULIS (create/update/delete/login/checkout) ke backend
 * lewat POST. PENTING: Content-Type dipaksa 'text/plain;charset=utf-8'
 * (BUKAN application/json) - supaya browser TIDAK mengirim request
 * preflight OPTIONS, karena Google Apps Script Web App tidak menangani
 * preflight (lihat skill gas-pro-api).
 * @param {string} action - nama action, misal 'addRecord'
 * @param {object} [data] - payload data (dikirim sebagai body.data)
 * @returns {Promise<{success:boolean, data:*, message:string}>}
 */
function apiPost(action, data) {
    const body = JSON.stringify({ action: action, token: AppState.sessionToken || '', data: data || {} });
    return fetch(GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: body
    })
        .then(function(res) { return res.json(); })
        .catch(function(err) {
            console.error('[apiPost] ' + action + ' gagal:', err);
            return { success: false, data: null, message: 'Gagal terhubung ke server. Cek koneksi internet Anda.' };
        });
}

/**
 * Upload 1 file (foto/PDF) ke Google Drive lewat backend. Membungkus pola
 * FileReader->base64->apiPost('uploadFileToDrive', ...) yang dipakai
 * berulang-ulang di banyak form Admin (Produk, Hero, Flyer, Mitra, Settings).
 * @param {File} file
 * @param {string} folderKey - key folder Drive tujuan di AppConfig, mis. 'uploadFolderId'
 * @returns {Promise<{success:boolean, data:{fileId,fileUrl,fileName}, message:string}>}
 */
function apiUploadFile(file, folderKey) {
    return new Promise(function(resolve) {
        const reader = new FileReader();
        reader.onload = function() {
            const base64 = reader.result.split(',')[1];
            apiPost('uploadFileToDrive', { fileData: base64, fileName: file.name, mimeType: file.type, folderKey: folderKey }).then(resolve);
        };
        reader.onerror = function() {
            resolve({ success: false, data: null, message: 'Gagal membaca file di browser.' });
        };
        reader.readAsDataURL(file);
    });
}
