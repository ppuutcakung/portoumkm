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
      '<div class="form-group"><label class="form-label">Deskripsi Singkat di Bawah Judul</label><textarea class="form-textarea" id="sfHeroSubtitle">', escapeHtml(c.heroSubtitle || 'Pusat pemesanan langsung produk pangan terstandarisasi, kerajinan kriya otentik, dan hasil pertanian segar dari UMKM binaan'), '</textarea></div>',

      '<div class="form-group">',
      '<label class="form-label">Nomor WhatsApp Admin *</label>',
      '<input class="form-input" id="sfWaNumber" required value="', escapeHtml(c.waAdminNumber || ''), '" placeholder="628xxxxxxxxxx">',
      '<p class="text-xs mt-1" style="color:var(--text-muted)">Format internasional tanpa tanda + atau spasi.</p>',
      '</div>',
      '<div class="form-group"><label class="form-label">Email Kontak</label><input class="form-input" id="sfEmail" value="', escapeHtml(c.emailKontak || ''), '"></div>',
      '<div class="form-group">',
      '<label class="form-label">Logo Perusahaan/Pembina UMKM</label>',
      '<input class="form-input" type="file" id="sfLogo" accept="image/*">',
      imgPreview(c.logoUrl, 'sfLogoUrl'),
      '<input type="hidden" id="sfLogoUrl" value="', c.logoUrl || '', '">',
      '<input type="hidden" id="sfLogoPath" value="', c.logoPath || '', '">',
      '</div>',
      '<hr style="border-color:var(--border-color); margin:18px 0;">',
      '<p class="text-xs font-bold uppercase mb-2" style="color:var(--text-muted)">3 Klaster Produk UMKM (tampil di Beranda)</p>',
      '<div class="card p-3 mb-3" style="border-color:var(--border-color);">',
      '<p class="text-xs font-bold mb-2" style="color:var(--primary);">PortoRasa (Kuliner)</p>',
      '<div class="form-group"><label class="form-label">Gambar</label><input class="form-input" type="file" id="sfImgRasa" accept="image/*">', imgPreview(c.sectorImgPortoRasa, 'sfImgRasaUrl'), '<input type="hidden" id="sfImgRasaUrl" value="', c.sectorImgPortoRasa || '', '"><input type="hidden" id="sfImgRasaPath" value="', c.sectorImgPortoRasaPath || '', '"></div>',
      '<div class="form-group"><label class="form-label">Judul</label><input class="form-input" id="sfTitleRasa" value="', escapeHtml(c.sectorTitlePortoRasa || 'Kuliner & Katering Nusantara'), '"></div>',
      '<div class="form-group"><label class="form-label">Deskripsi</label><textarea class="form-textarea" id="sfDescRasa">', escapeHtml(c.sectorDescPortoRasa || 'Snack box rapat, nasi box tradisional, sambal, dan bumbu kopi khas Cakung.'), '</textarea></div>',
      '<div class="form-group"><label class="form-label">Tag (pisahkan dengan koma)</label><input class="form-input" id="sfTagsRasa" value="', escapeHtml(c.sectorTagsPortoRasa || 'Snack Rapat,Nasi Box,Frozen Food'), '"></div>',
      '</div>',
      '<div class="card p-3 mb-3" style="border-color:var(--border-color);">',
      '<p class="text-xs font-bold mb-2" style="color:var(--primary);">PortoKriya (Kerajinan)</p>',
      '<div class="form-group"><label class="form-label">Gambar</label><input class="form-input" type="file" id="sfImgKriya" accept="image/*">', imgPreview(c.sectorImgPortoKriya, 'sfImgKriyaUrl'), '<input type="hidden" id="sfImgKriyaUrl" value="', c.sectorImgPortoKriya || '', '"><input type="hidden" id="sfImgKriyaPath" value="', c.sectorImgPortoKriyaPath || '', '"></div>',
      '<div class="form-group"><label class="form-label">Judul</label><input class="form-input" id="sfTitleKriya" value="', escapeHtml(c.sectorTitlePortoKriya || 'Kerajinan & Souvenir Custom'), '"></div>',
      '<div class="form-group"><label class="form-label">Deskripsi</label><textarea class="form-textarea" id="sfDescKriya">', escapeHtml(c.sectorDescPortoKriya || 'Tas anyaman ramah lingkungan, gantungan kunci akrilik, plakat, dan pouch tenun.'), '</textarea></div>',
      '<div class="form-group"><label class="form-label">Tag (pisahkan dengan koma)</label><input class="form-input" id="sfTagsKriya" value="', escapeHtml(c.sectorTagsPortoKriya || 'Hampers Event,Tas Anyaman,Merchandise'), '"></div>',
      '</div>',
      '<div class="card p-3 mb-3" style="border-color:var(--border-color);">',
      '<p class="text-xs font-bold mb-2" style="color:var(--primary);">PortoTani (Pertanian)</p>',
      '<div class="form-group"><label class="form-label">Gambar</label><input class="form-input" type="file" id="sfImgTani" accept="image/*">', imgPreview(c.sectorImgPortoTani, 'sfImgTaniUrl'), '<input type="hidden" id="sfImgTaniUrl" value="', c.sectorImgPortoTani || '', '"><input type="hidden" id="sfImgTaniPath" value="', c.sectorImgPortoTaniPath || '', '"></div>',
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
      '<input type="hidden" id="sfBrosurPath" value="', c.brosurPdfPath || '', '">',
      '</div>',
      '<div class="form-group">',
      '<label class="form-label">Daftar Tag Cepat (pisahkan dengan koma)</label>',
      '<textarea class="form-textarea" id="sfTagCepat">', escapeHtml(c.tagCepatList || ''), '</textarea>',
      '</div>',
      '<div class="form-group">',
      '<label class="form-label">Kalimat Sambutan/Slogan Footer</label>',
      '<textarea class="form-textarea" id="sfFooterQuote">', escapeHtml(c.footerQuoteText || ''), '</textarea>',
      '</div>',
      '<button type="submit" class="btn-primary w-full" style="height:44px;"><i class="bi bi-check-lg"></i> Simpan Pengaturan</button>',
      '</form>',
      '</div>',

      '<div class="card p-4 md:p-5 mt-5" style="max-width:640px;">',
      '<h3 class="font-bold mb-1" style="color:var(--text-primary)"><i class="bi bi-key"></i> Ubah Password Admin</h3>',
      '<p class="text-xs mb-4" style="color:var(--text-muted)">Bisa diganti kapan saja secara berkala.</p>',
      '<form id="credentialsForm" onsubmit="submitCredentialsForm(event)">',
      '<div class="form-group"><label class="form-label">Password Baru *</label><input class="form-input" type="password" id="ccNewPassword" required autocomplete="new-password" minlength="6"></div>',
      '<div class="form-group"><label class="form-label">Ulangi Password Baru *</label><input class="form-input" type="password" id="ccConfirmPassword" required autocomplete="new-password"></div>',
      '<button type="submit" class="btn-primary w-full" style="height:44px;"><i class="bi bi-shield-lock"></i> Perbarui Password</button>',
      '</form>',
      '</div>',

      '<div class="card p-4 md:p-5 mt-5" style="max-width:640px;">',
      '<h3 class="font-bold mb-1" style="color:var(--text-primary)"><i class="bi bi-file-earmark-image"></i> Konversi Foto Lama ke WebP</h3>',
      '<p class="text-xs mb-4" style="color:var(--text-muted)">Foto yang diunggah BARU sudah otomatis jadi WebP. Klik ini SEKALI untuk mengonversi foto-foto LAMA yang masih format lain (JPG/PNG), supaya loading lebih cepat. Proses berjalan satu-satu, bisa makan waktu beberapa menit kalau foto cukup banyak - jangan tutup tab selama proses berjalan.</p>',
      '<button type="button" class="btn-primary w-full" style="height:44px;" id="btnKonversiWebp" onclick="konversiSemuaFotoLama()"><i class="bi bi-arrow-repeat"></i> Mulai Konversi</button>',
      '<div id="konversiWebpProgress" class="text-xs mt-2" style="color:var(--text-muted)"></div>',
      '</div>'
    ].join(''));
}

/**
 * Konversi SEKALI JALAN semua foto lama (Produk, Hero, Flyer, Mitra, Logo,
 * Gambar Sektor) yang belum berformat WebP. Untuk tiap foto: diunduh,
 * dikonversi lewat Canvas, diunggah ulang sebagai .webp, record di database
 * diperbarui ke URL baru, lalu file LAMA dihapus dari Drive.
 */
async function konversiSemuaFotoLama() {
    const btn = document.getElementById('btnKonversiWebp');
    const progressEl = document.getElementById('konversiWebpProgress');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-inline"></span> Memproses...';

    function log(msg) { progressEl.innerHTML += (progressEl.innerHTML ? '<br>' : '') + msg; }

    /** @returns {Promise<{berhasil:boolean, urlBaru?:string, fileIdBaru?:string}>} */
    async function konversiSatuGambar(url, folderKey) {
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            if (blob.type === 'image/webp') return { berhasil: false, sudahWebp: true };
            const webpFile = await convertToWebP(blob, 'foto.jpg');
            if (webpFile.type !== 'image/webp') return { berhasil: false }; // konversi gagal, fallback ke file asli (bukan webp)
            const uploadRes = await uploadFile(webpFile, folderKey);
            if (!uploadRes.success) return { berhasil: false };
            return { berhasil: true, urlBaru: uploadRes.data.url, fileIdBaru: uploadRes.data.fileId };
        } catch (err) {
            return { berhasil: false };
        }
    }

    let totalDiproses = 0, totalBerhasil = 0, totalDilewati = 0;

    // --- Produk (semua foto di galeri; foto_url/foto_path = cerminan foto utama) ---
    const produkRes = await dbSelect('produk');
    const produkList = produkRes.success ? produkRes.data : [];
    for (const p of produkList) {
        const galeri = galeriDariProduk(p);
        if (!galeri.length) continue;
        const galeriBaru = [];
        const hapusNanti = [];
        let konversiBerhasil = 0;
        for (const f of galeri) {
            totalDiproses++;
            const hasil = await konversiSatuGambar(f.url, 'uploadFolderId');
            if (hasil.sudahWebp) { totalDilewati++; galeriBaru.push(f); continue; }
            if (hasil.berhasil) {
                galeriBaru.push({ url: hasil.urlBaru, path: hasil.fileIdBaru });
                if (f.path) hapusNanti.push(f.path);
                konversiBerhasil++;
            } else {
                galeriBaru.push(f);
            }
        }
        if (!konversiBerhasil) continue;
        // Simpan ke database DULU; file lama baru dihapus dari Drive setelah database berhasil diperbarui.
        const upd = await dbUpdate('produk', p.id, {
            foto_galeri: galeriBaru, foto_url: galeriBaru[0].url, foto_path: galeriBaru[0].path || '', foto_url2: null, foto_path2: null
        });
        if (upd.success) {
            for (const id of hapusNanti) await deleteFile(id);
            totalBerhasil += konversiBerhasil;
            log('✓ Produk: ' + escapeHtml(p.nama_produk) + ' (' + konversiBerhasil + ' foto)');
        } else {
            for (const f of galeriBaru) { if (f.path && !galeri.some(function(x) { return x.path === f.path; })) await deleteFile(f.path); } // buang file baru yang batal dipakai
            log('✗ Gagal menyimpan: ' + escapeHtml(p.nama_produk));
        }
    }

    // --- Hero Carousel ---
    const heroRes = await dbSelect('hero_carousel');
    for (const h of (heroRes.success ? heroRes.data : [])) {
        if (!h.foto_url) continue;
        totalDiproses++;
        const hasil = await konversiSatuGambar(h.foto_url, 'heroFolderId');
        if (hasil.sudahWebp) { totalDilewati++; continue; }
        if (hasil.berhasil) {
            const fileIdLama = h.foto_path;
            await dbUpdate('hero_carousel', h.id, { foto_url: hasil.urlBaru, foto_path: hasil.fileIdBaru });
            if (fileIdLama) await deleteFile(fileIdLama);
            totalBerhasil++;
            log('✓ Hero Carousel');
        }
    }

    // --- Flyer Promo ---
    const flyerRes = await dbSelect('flyer_promo');
    for (const f of (flyerRes.success ? flyerRes.data : [])) {
        if (!f.gambar_url) continue;
        totalDiproses++;
        const hasil = await konversiSatuGambar(f.gambar_url, 'flyerFolderId');
        if (hasil.sudahWebp) { totalDilewati++; continue; }
        if (hasil.berhasil) {
            const fileIdLama = f.gambar_path;
            await dbUpdate('flyer_promo', f.id, { gambar_url: hasil.urlBaru, gambar_path: hasil.fileIdBaru });
            if (fileIdLama) await deleteFile(fileIdLama);
            totalBerhasil++;
            log('✓ Flyer: ' + escapeHtml(f.judul));
        }
    }

    // --- Mitra Pemasaran ---
    const mitraRes = await dbSelect('mitra_pemasaran');
    for (const m of (mitraRes.success ? mitraRes.data : [])) {
        if (!m.logo_url) continue;
        totalDiproses++;
        const hasil = await konversiSatuGambar(m.logo_url, 'mitraFolderId');
        if (hasil.sudahWebp) { totalDilewati++; continue; }
        if (hasil.berhasil) {
            const fileIdLama = m.logo_path;
            await dbUpdate('mitra_pemasaran', m.id, { logo_url: hasil.urlBaru, logo_path: hasil.fileIdBaru });
            if (fileIdLama) await deleteFile(fileIdLama);
            totalBerhasil++;
            log('✓ Mitra: ' + escapeHtml(m.nama_perusahaan));
        }
    }

    // --- Logo & Gambar Sektor (tersimpan di app_config) ---
    const cfg = AppState.config;
    const configImagePairs = [
        ['logoUrl', 'logoPath', 'logoFolderId'],
        ['sectorImgPortoRasa', 'sectorImgPortoRasaPath', 'uploadFolderId'],
        ['sectorImgPortoKriya', 'sectorImgPortoKriyaPath', 'uploadFolderId'],
        ['sectorImgPortoTani', 'sectorImgPortoTaniPath', 'uploadFolderId']
    ];
    const configUpdates = {};
    for (const [urlKey, pathKey, folderKey] of configImagePairs) {
        if (!cfg[urlKey]) continue;
        totalDiproses++;
        const hasil = await konversiSatuGambar(cfg[urlKey], folderKey);
        if (hasil.sudahWebp) { totalDilewati++; continue; }
        if (hasil.berhasil) {
            const fileIdLama = cfg[pathKey];
            configUpdates[urlKey] = hasil.urlBaru;
            configUpdates[pathKey] = hasil.fileIdBaru;
            if (fileIdLama) await deleteFile(fileIdLama);
            totalBerhasil++;
            log('✓ Pengaturan: ' + urlKey);
        }
    }
    if (Object.keys(configUpdates).length) {
        const records = Object.keys(configUpdates).map(function(key) { return { key: key, value: String(configUpdates[key]) }; });
        await dbUpsertMany('app_config', records, 'key');
        Object.assign(AppState.config, configUpdates);
    }

    AppState.cache = {};
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Mulai Konversi';
    log('<b>Selesai.</b> Diproses: ' + totalDiproses + ', berhasil dikonversi: ' + totalBerhasil + ', sudah WebP sebelumnya (dilewati): ' + totalDilewati + '.');
    showToast('Selesai', totalBerhasil + ' foto berhasil dikonversi ke WebP.', 'success');
}
/**
 * Hapus foto/berkas yang sudah diupload SEBELUM menyimpan pengaturan baru.
 * File LAMA langsung dihapus dari Drive saat ini juga.
 */
function hapusFilePengaturan(hiddenId, wrapId) {
    const pathInput = document.getElementById(hiddenId.replace('Url', 'Path'));
    if (pathInput && pathInput.value) deleteFile(pathInput.value);
    const hiddenInput = document.getElementById(hiddenId);
    if (hiddenInput) hiddenInput.value = '';
    if (pathInput) pathInput.value = '';
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
        logoPath: document.getElementById('sfLogoPath').value,
        sectorImgPortoRasa: document.getElementById('sfImgRasaUrl').value,
        sectorImgPortoRasaPath: document.getElementById('sfImgRasaPath').value,
        sectorImgPortoKriya: document.getElementById('sfImgKriyaUrl').value,
        sectorImgPortoKriyaPath: document.getElementById('sfImgKriyaPath').value,
        sectorImgPortoTani: document.getElementById('sfImgTaniUrl').value,
        sectorImgPortoTaniPath: document.getElementById('sfImgTaniPath').value,
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
        brosurPdfPath: document.getElementById('sfBrosurPath').value,
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
        { inputId: 'sfLogo', folderKey: 'logoFolderId', urlKey: 'logoUrl', pathKey: 'logoPath' },
        { inputId: 'sfImgRasa', folderKey: 'uploadFolderId', urlKey: 'sectorImgPortoRasa', pathKey: 'sectorImgPortoRasaPath' },
        { inputId: 'sfImgKriya', folderKey: 'uploadFolderId', urlKey: 'sectorImgPortoKriya', pathKey: 'sectorImgPortoKriyaPath' },
        { inputId: 'sfImgTani', folderKey: 'uploadFolderId', urlKey: 'sectorImgPortoTani', pathKey: 'sectorImgPortoTaniPath' },
        { inputId: 'sfBrosur', folderKey: 'brosurFolderId', urlKey: 'brosurPdfUrl', pathKey: 'brosurPdfPath' }
    ].filter(function(item) {
        const input = document.getElementById(item.inputId);
        return input && input.files && input.files[0];
    });

    function finishSave() {
        const records = Object.keys(payload).map(function(key) { return { key: key, value: String(payload[key]) }; });
        dbUpsertMany('app_config', records, 'key').then(function(res) {
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
        const oldFileId = payload[item.pathKey];
        uploadFile(file, item.folderKey).then(function(res) {
            if (res.success) {
                payload[item.urlKey] = res.data.url;
                payload[item.pathKey] = res.data.fileId;
                if (oldFileId && oldFileId !== res.data.fileId) deleteFile(oldFileId);
                processQueue(idx + 1);
            } else {
                btn.disabled = false;
                showToast('Error', res.message, 'danger');
            }
        });
    }

    processQueue(0);
}

function submitCredentialsForm(e) {
    e.preventDefault();
    const newPassword = document.getElementById('ccNewPassword').value;
    const confirmPassword = document.getElementById('ccConfirmPassword').value;
    if (newPassword !== confirmPassword) {
        showToast('Peringatan', 'Password Baru dan Ulangi Password Baru tidak sama.', 'warning');
        return;
    }
    const btn = e.target.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-inline"></span> Memperbarui...';
    btn.disabled = true;
    authUpdateUser({ password: newPassword }).then(function(res) {
        btn.innerHTML = original;
        btn.disabled = false;
        if (!res.success) {
            showToast('Gagal', res.message, 'danger');
            return;
        }
        showToast('Berhasil', 'Password berhasil diperbarui.', 'success');
        document.getElementById('credentialsForm').reset();
    });
}
