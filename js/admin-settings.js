/**
 * ============================================================
 * PortoUMKM - Admin: Pengaturan WhatsApp & Sistem
 * ============================================================
 */
function renderAdminSettingsPage() {
    const container = document.getElementById('app-container');
    const c = AppState.config;
    function imgPreview(url, hiddenId) {
        if (!url) return '';
        const wrapId = hiddenId + 'PreviewWrap';
        return '<div id="' + wrapId + '" style="display:flex; align-items:center; gap:8px; margin-top:6px;">' +
               '<img src="' + url + '" style="height:60px;border-radius:6px;">' +
               '<button type="button" class="btn-icon-sm" onclick="hapusFilePengaturan(\'' + hiddenId + '\',\'' + wrapId + '\')" title="Hapus foto ini"><i class="bi bi-trash text-red-500"></i></button>' +
               '</div>';
    }
    container.innerHTML = adminPageShell('Pengaturan WhatsApp &amp; Sistem', [
      '<div class="card p-4 md:p-5" style="max-width:640px;">',
      '<form id="settingsForm" onsubmit="submitSettingsForm(event)">',
      '<div class="form-group"><label class="form-label">Nama Aplikasi</label><input class="form-input" id="sfAppName" value="', escapeHtml(c.appName || ''), '"></div>',
      '<hr style="border-color:var(--border-color); margin:18px 0;">',
      '<p class="text-xs font-bold uppercase mb-2" style="color:var(--text-muted)">Judul & Deskripsi Hero (Beranda)</p>',
      '<div class="form-group"><label class="form-label">Judul Bagian 1 (warna hitam)</label><input class="form-input" id="sfHeroTitle1" value="', escapeHtml(c.heroTitlePart1 || 'Etalase Produk UMKM Binaan'), '"></div>',
      '<div class="form-group"><label class="form-label">Judul Sorot (warna maroon, tetap konsisten)</label><input class="form-input" id="sfHeroHighlight" value="', escapeHtml(c.heroTitleHighlight || 'CSR United Tractors'), '"></div>',
      '<div class="form-group"><label class="form-label">Judul Baris ke-2 (warna hitam)</label><input class="form-input" id="sfHeroTitle2" value="', escapeHtml(c.heroTitlePart2 || 'Siap Melayani Kebutuhan Anda!'), '"></div>',
      '<p class="text-xs mt-1 mb-3" style="color:var(--text-muted)">Preview: <b>', escapeHtml(c.heroTitlePart1 || 'Etalase Produk UMKM Binaan'), '</b> <b style="color:var(--primary);">', escapeHtml(c.heroTitleHighlight || 'CSR United Tractors'), '</b><br><b>', escapeHtml(c.heroTitlePart2 || 'Siap Melayani Kebutuhan Anda!'), '</b></p>',
      '<div class="form-group"><label class="form-label">Deskripsi Singkat di Bawah Judul</label><textarea class="form-textarea" id="sfHeroSubtitle">', escapeHtml(c.heroSubtitle || 'Pusat pemesanan langsung produk pangan terstandarisasi, kerajinan kriya otentik, dan hasil pertanian segar dari UMKM binaan'), '</textarea></div>',

      '<div class="form-group">',
      '<label class="form-label">Nomor WhatsApp Admin (US-10a) *</label>',
      '<input class="form-input" id="sfWaNumber" required value="', escapeHtml(c.waAdminNumber || ''), '" placeholder="628xxxxxxxxxx">',
      '<p class="text-xs mt-1" style="color:var(--text-muted)">Format internasional tanpa tanda + atau spasi. Berlaku untuk keranjang/checkout &amp; ikon pop-up chat.</p>',
      '</div>',
      '<div class="form-group"><label class="form-label">Email Kontak</label><input class="form-input" id="sfEmail" value="', escapeHtml(c.emailKontak || ''), '"></div>',
      '<div class="form-group">',
      '<label class="form-label">Logo Perusahaan/Pembina UMKM</label>',
      '<input class="form-input" type="file" id="sfLogo" accept="image/*">',
      imgPreview(c.logoUrl, 'sfLogoUrl'),
      '<input type="hidden" id="sfLogoUrl" value="', c.logoUrl || '', '">',
      '</div>',
      '<hr style="border-color:var(--border-color); margin:18px 0;">',
      '<p class="text-xs font-bold uppercase mb-2" style="color:var(--text-muted)">3 Klaster Produk UMKM (tampil di Beranda)</p>',
      '<div class="card p-3 mb-3" style="border-color:var(--border-color);">',
      '<p class="text-xs font-bold mb-2" style="color:var(--primary);">PortoRasa (Kuliner)</p>',
      '<div class="form-group"><label class="form-label">Gambar</label><input class="form-input" type="file" id="sfImgRasa" accept="image/*">', imgPreview(c.sectorImgPortoRasa, 'sfImgRasaUrl'), '<input type="hidden" id="sfImgRasaUrl" value="', c.sectorImgPortoRasa || '', '"></div>',
      '<div class="form-group"><label class="form-label">Judul</label><input class="form-input" id="sfTitleRasa" value="', escapeHtml(c.sectorTitlePortoRasa || 'Kuliner & Katering Nusantara'), '"></div>',
      '<div class="form-group"><label class="form-label">Deskripsi</label><textarea class="form-textarea" id="sfDescRasa">', escapeHtml(c.sectorDescPortoRasa || 'Snack box rapat, nasi box tradisional, sambal, dan bumbu kopi khas Cakung.'), '</textarea></div>',
      '<div class="form-group"><label class="form-label">Tag (pisahkan dengan koma)</label><input class="form-input" id="sfTagsRasa" value="', escapeHtml(c.sectorTagsPortoRasa || 'Snack Rapat,Nasi Box,Frozen Food'), '"></div>',
      '</div>',
      '<div class="card p-3 mb-3" style="border-color:var(--border-color);">',
      '<p class="text-xs font-bold mb-2" style="color:var(--primary);">PortoKriya (Kerajinan)</p>',
      '<div class="form-group"><label class="form-label">Gambar</label><input class="form-input" type="file" id="sfImgKriya" accept="image/*">', imgPreview(c.sectorImgPortoKriya, 'sfImgKriyaUrl'), '<input type="hidden" id="sfImgKriyaUrl" value="', c.sectorImgPortoKriya || '', '"></div>',
      '<div class="form-group"><label class="form-label">Judul</label><input class="form-input" id="sfTitleKriya" value="', escapeHtml(c.sectorTitlePortoKriya || 'Kerajinan & Souvenir Custom'), '"></div>',
      '<div class="form-group"><label class="form-label">Deskripsi</label><textarea class="form-textarea" id="sfDescKriya">', escapeHtml(c.sectorDescPortoKriya || 'Tas anyaman ramah lingkungan, gantungan kunci akrilik, plakat, dan pouch tenun.'), '</textarea></div>',
      '<div class="form-group"><label class="form-label">Tag (pisahkan dengan koma)</label><input class="form-input" id="sfTagsKriya" value="', escapeHtml(c.sectorTagsPortoKriya || 'Hampers Event,Tas Anyaman,Merchandise'), '"></div>',
      '</div>',
      '<div class="card p-3 mb-3" style="border-color:var(--border-color);">',
      '<p class="text-xs font-bold mb-2" style="color:var(--primary);">PortoTani (Pertanian)</p>',
      '<div class="form-group"><label class="form-label">Gambar</label><input class="form-input" type="file" id="sfImgTani" accept="image/*">', imgPreview(c.sectorImgPortoTani, 'sfImgTaniUrl'), '<input type="hidden" id="sfImgTaniUrl" value="', c.sectorImgPortoTani || '', '"></div>',
      '<div class="form-group"><label class="form-label">Judul</label><input class="form-input" id="sfTitleTani" value="', escapeHtml(c.sectorTitlePortoTani || 'Urban Farming & Hasil Tani'), '"></div>',
      '<div class="form-group"><label class="form-label">Deskripsi</label><textarea class="form-textarea" id="sfDescTani">', escapeHtml(c.sectorDescPortoTani || 'Sayuran hidroponik bebas pestisida, madu murni, dan hasil kebun pekarangan.'), '</textarea></div>',
      '<div class="form-group"><label class="form-label">Tag (pisahkan dengan koma)</label><input class="form-input" id="sfTagsTani" value="', escapeHtml(c.sectorTagsPortoTani || 'Hidroponik Fresh,Madu Murni,Bibit Unggul'), '"></div>',
      '</div>',
      '<hr style="border-color:var(--border-color); margin:18px 0;">',
      '<p class="text-xs font-bold uppercase mb-2" style="color:var(--text-muted)">Brosur &amp; Tag Cepat</p>',
      '<div class="form-group">',
      '<label class="form-label">Brosur Katalog (PDF)</label>',
      '<input class="form-input" type="file" id="sfBrosur" accept="application/pdf">',
      c.brosurPdfUrl ? ('<div id="sfBrosurUrlPreviewWrap" style="display:flex; align-items:center; gap:8px; margin-top:6px;"><a href="' + c.brosurPdfUrl + '" target="_blank" class="text-xs" style="color:var(--primary);"><i class="bi bi-file-earmark-pdf"></i> Lihat brosur saat ini</a><button type="button" class="btn-icon-sm" onclick="hapusFilePengaturan(\'sfBrosurUrl\',\'sfBrosurUrlPreviewWrap\')" title="Hapus brosur ini"><i class="bi bi-trash text-red-500"></i></button></div>') : '',
      '<input type="hidden" id="sfBrosurUrl" value="', c.brosurPdfUrl || '', '">',
      '</div>',
      '<div class="form-group">',
      '<label class="form-label">Daftar Tag Cepat (pisahkan dengan koma)</label>',
      '<textarea class="form-textarea" id="sfTagCepat">', escapeHtml(c.tagCepatList || ''), '</textarea>',
      '<p class="text-xs mt-1" style="color:var(--text-muted)">Tampil di halaman Semua Produk sebagai kata kunci cepat.</p>',
      '</div>',
      '<div class="form-group">',
      '<label class="form-label">Kalimat Sambutan/Slogan Footer</label>',
      '<textarea class="form-textarea" id="sfFooterQuote">', escapeHtml(c.footerQuoteText || ''), '</textarea>',
      '<p class="text-xs mt-1" style="color:var(--text-muted)">Tampil di footer (dalam tanda kutip) khusus halaman Beranda, Semua Produk, dan Keranjang &amp; Pesanan.</p>',
      '</div>',
      '<button type="submit" class="btn-primary w-full" style="height:44px;"><i class="bi bi-check-lg"></i> Simpan Pengaturan</button>',
      '</form>',
      '</div>',

      '<div class="card p-4 md:p-5 mt-5" style="max-width:640px;">',
      '<h3 class="font-bold mb-1" style="color:var(--text-primary)"><i class="bi bi-key"></i> Ubah Username &amp; Password Admin</h3>',
      '<p class="text-xs mb-4" style="color:var(--text-muted)">Bisa diganti kapan saja secara berkala. Kosongkan kolom yang tidak ingin diubah.</p>',
      '<form id="credentialsForm" onsubmit="submitCredentialsForm(event)">',
      '<div class="form-group"><label class="form-label">Password Saat Ini *</label><input class="form-input" type="password" id="ccOldPassword" required autocomplete="current-password"></div>',
      '<div class="form-group"><label class="form-label">Username Baru (opsional)</label><input class="form-input" id="ccNewUsername" autocomplete="username" placeholder="Kosongkan kalau tidak diubah"></div>',
      '<div class="form-group"><label class="form-label">Password Baru (opsional)</label><input class="form-input" type="password" id="ccNewPassword" autocomplete="new-password" placeholder="Kosongkan kalau tidak diubah"></div>',
      '<div class="form-group"><label class="form-label">Ulangi Password Baru</label><input class="form-input" type="password" id="ccConfirmPassword" autocomplete="new-password"></div>',
      '<button type="submit" class="btn-primary w-full" style="height:44px;"><i class="bi bi-shield-lock"></i> Perbarui Kredensial</button>',
      '</form>',
      '</div>'
    ].join(''));
}
function submitCredentialsForm(e) {
    e.preventDefault();
    const oldPassword = document.getElementById('ccOldPassword').value;
    const newUsername = document.getElementById('ccNewUsername').value.trim();
    const newPassword = document.getElementById('ccNewPassword').value;
    const confirmPassword = document.getElementById('ccConfirmPassword').value;

    if (!newUsername && !newPassword) {
        showToast('Peringatan', 'Isi Username Baru atau Password Baru - minimal salah satu.', 'warning');
        return;
    }
    if (newPassword && newPassword !== confirmPassword) {
        showToast('Peringatan', 'Password Baru dan Ulangi Password Baru tidak sama.', 'warning');
        return;
    }
    const btn = e.target.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-inline"></span> Memperbarui...';
    btn.disabled = true;
    apiPost('changeCredentials', { oldPassword: oldPassword, newUsername: newUsername, newPassword: newPassword }).then(function(res) {
        btn.innerHTML = original;
        btn.disabled = false;
        if (!res.success) {
            showToast('Gagal', res.message, 'danger');
            return;
        }
        AppState.sessionToken = res.data.token; // sesi lama diganti otomatis oleh backend
        showToast('Berhasil', 'Username/password berhasil diperbarui.', 'success');
        document.getElementById('credentialsForm').reset();
    });
}
/**
 * Hapus foto/berkas yang sudah diupload SEBELUM menyimpan pengaturan baru,
 * supaya tidak tertimpa/konflik saat mengganti foto.
 */
function hapusFilePengaturan(hiddenId, wrapId) {
    const hiddenInput = document.getElementById(hiddenId);
    if (hiddenInput) hiddenInput.value = '';
    const wrap = document.getElementById(wrapId);
    if (wrap) wrap.remove();
    showToast('Info', 'Foto/berkas dihapus. Klik "Simpan Pengaturan" untuk menerapkan.', 'info');
}

function submitSettingsForm(e) {
    e.preventDefault();
    const payload = {
        appName: document.getElementById('sfAppName').value.trim(),
        waAdminNumber: document.getElementById('sfWaNumber').value.replace(/[^0-9]/g, ''),
        emailKontak: document.getElementById('sfEmail').value.trim(),
        logoUrl: document.getElementById('sfLogoUrl').value,
        sectorImgPortoRasa: document.getElementById('sfImgRasaUrl').value,
        sectorImgPortoKriya: document.getElementById('sfImgKriyaUrl').value,
        sectorImgPortoTani: document.getElementById('sfImgTaniUrl').value,
        sectorTitlePortoRasa: document.getElementById('sfTitleRasa').value.trim(),
        sectorDescPortoRasa: document.getElementById('sfDescRasa').value.trim(),
        sectorTagsPortoRasa: document.getElementById('sfTagsRasa').value.trim(),
        sectorTitlePortoKriya: document.getElementById('sfTitleKriya').value.trim(),
        sectorDescPortoKriya: document.getElementById('sfDescKriya').value.trim(),
        sectorTagsPortoKriya: document.getElementById('sfTagsKriya').value.trim(),
        sectorTitlePortoTani: document.getElementById('sfTitleTani').value.trim(),
        sectorDescPortoTani: document.getElementById('sfDescTani').value.trim(),
        sectorTagsPortoTani: document.getElementById('sfTagsTani').value.trim(),
        brosurPdfUrl: document.getElementById('sfBrosurUrl').value,
        tagCepatList: document.getElementById('sfTagCepat').value.trim(),
        footerQuoteText: document.getElementById('sfFooterQuote').value.trim(),
        heroTitlePart1: document.getElementById('sfHeroTitle1').value.trim(),
        heroTitleHighlight: document.getElementById('sfHeroHighlight').value.trim(),
        heroTitlePart2: document.getElementById('sfHeroTitle2').value.trim(),
        heroSubtitle: document.getElementById('sfHeroSubtitle').value.trim()
    };
    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = '<span class="spinner-inline"></span> Menyimpan...';
    btn.disabled = true;

    const uploadQueue = [
        { inputId: 'sfLogo', folderKey: 'logoFolderId', payloadKey: 'logoUrl' },
        { inputId: 'sfImgRasa', folderKey: 'uploadFolderId', payloadKey: 'sectorImgPortoRasa' },
        { inputId: 'sfImgKriya', folderKey: 'uploadFolderId', payloadKey: 'sectorImgPortoKriya' },
        { inputId: 'sfImgTani', folderKey: 'uploadFolderId', payloadKey: 'sectorImgPortoTani' },
        { inputId: 'sfBrosur', folderKey: 'brosurFolderId', payloadKey: 'brosurPdfUrl' }
    ].filter(function(item) {
        const input = document.getElementById(item.inputId);
        return input && input.files && input.files[0];
    });

    function finishSave() {
        apiPost('saveSettings', payload).then(function(res) {
            btn.disabled = false;
            if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }
            showToast('Berhasil', 'Pengaturan tersimpan.', 'success');
            applyConfig(Object.assign({}, AppState.config, payload));
            renderAdminSettingsPage();
        });
    }

    function processQueue(idx) {
        if (idx >= uploadQueue.length) { finishSave(); return; }
        const item = uploadQueue[idx];
        const file = document.getElementById(item.inputId).files[0];
        apiUploadFile(file, item.folderKey).then(function(res) {
            if (res.success) {
                payload[item.payloadKey] = (item.payloadKey === 'brosurPdfUrl')
                    ? ('https://drive.google.com/uc?export=download&id=' + res.data.fileId)
                    : res.data.fileUrl;
                processQueue(idx + 1);
            } else {
                btn.disabled = false;
                showToast('Error', res.message, 'danger');
            }
        });
    }

    processQueue(0);
}
