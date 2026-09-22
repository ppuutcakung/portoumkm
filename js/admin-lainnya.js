/**
 * ============================================================
 * PortoUMKM - Admin: Galeri Hero, Banner Promo, Mitra
 * Pemasaran, Data UMKM
 * ============================================================
 */

// -------------------- GALERI HERO (maks 5 foto) --------------------
let adminHeroCache = [];
function renderAdminHeroPage() {
    const container = document.getElementById('app-container');
    container.innerHTML = adminPageShell('Galeri Hero (Maks. 5 Foto)', [
      '<p class="text-sm mb-3" style="color:var(--text-muted)">Foto ini tampil bergulir di sisi kanan Hero Section Beranda. Maksimal 5 foto aktif.</p>',
      '<div class="flex justify-end mb-3">',
      '<button class="btn-primary" id="addHeroBtn" onclick="openHeroForm()"><i class="bi bi-plus-lg"></i> Tambah Foto Hero</button>',
      '</div>',
      '<div id="heroGrid" class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));"></div>'
    ].join(''));
    loadAdminHero();
}

function loadAdminHero() {
    apiGet('getAllData', { sheetName: 'HeroCarousel' }).then(function(res) {
        adminHeroCache = res.success ? res.data : [];
        adminHeroCache.sort(function(a, b) { return (Number(a.Urutan) || 0) - (Number(b.Urutan) || 0); });
        renderAdminHeroGrid();
        const btn = document.getElementById('addHeroBtn');
        if (btn) btn.disabled = adminHeroCache.length >= 5;
    });
}
function renderAdminHeroGrid() {
    const el = document.getElementById('heroGrid');
    if (!el) return;
    if (!adminHeroCache.length) { el.innerHTML = '<div class="empty-state col-span-full"><i class="bi bi-images"></i>Belum ada foto hero.</div>'; return; }
    el.innerHTML = adminHeroCache.map(function(h) {
        return [
          '<div class="card overflow-hidden">',
          h.FotoURL ? ('<img src="' + h.FotoURL + '" style="width:100%; aspect-ratio:4/3; object-fit:cover;">') : '<div style="width:100%;aspect-ratio:4/3;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#cbd5e1;"><i class="bi bi-image" style="font-size:28px;"></i></div>',
          '<div class="p-3 flex items-center justify-between">',
          '<span class="text-xs font-semibold" style="color:var(--text-muted)">Urutan: ', (h.Urutan || '-'), '</span>',
          '<button class="btn-icon-sm" onclick="confirmDeleteRecord(\'HeroCarousel\',\'' + h.ID + '\', loadAdminHero)"><i class="bi bi-trash text-red-500"></i></button>',
          '</div>',
          '</div>'
        ].join('');
    }).join('');
}

function openHeroForm() {
    if (adminHeroCache.length >= 5) { showToast('Info', 'Maksimal 5 foto hero aktif.', 'warning'); return; }
    document.getElementById('previewModalTitle').textContent = 'Tambah Foto Hero';
    document.getElementById('previewModalContent').innerHTML = [
      '<form onsubmit="submitHeroForm(event)" class="text-left">',
      '<div class="form-group"><label class="form-label">Urutan Tampil</label><input class="form-input" type="number" id="hfUrutan" value="', (adminHeroCache.length + 1), '"></div>',
      '<div class="form-group"><label class="form-label">Foto *</label><input class="form-input" type="file" id="hfFoto" accept="image/*" required></div>',
      '<button type="submit" class="btn-primary w-full" style="height:42px;"><i class="bi bi-check-lg"></i> Unggah</button>',
      '</form>'
    ].join('');
    openModal('previewModal');
}
function submitHeroForm(e) {
    e.preventDefault();
    const fileInput = document.getElementById('hfFoto');
    if (!fileInput.files || !fileInput.files[0]) { showToast('Peringatan', 'Pilih foto terlebih dahulu.', 'warning'); return; }
    const urutan = Number(document.getElementById('hfUrutan').value) || 1;
    const file = fileInput.files[0];
    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = '<span class="spinner-inline"></span> Mengunggah...'; btn.disabled = true;
    apiUploadFile(file, 'heroFolderId').then(function(res) {
        if (!res.success) { showToast('Gagal', res.message, 'danger'); btn.disabled = false; return; }
        apiPost('addRecord', { sheetName: 'HeroCarousel', record: { FotoURL: res.data.fileUrl, FotoFileId: res.data.fileId, Urutan: urutan } }).then(function(res2) {
            if (!res2.success) { showToast('Gagal', res2.message, 'danger'); btn.disabled = false; return; }
            AppState.cache = {};
            showToast('Berhasil', 'Foto hero ditambahkan.', 'success');
            closeModal('previewModal');
            loadAdminHero();
        });
    });
}

// -------------------- BANNER PROMO (FLYER) --------------------
let adminFlyerCache = [];
function renderAdminFlyerPage() {
    const container = document.getElementById('app-container');
    container.innerHTML = adminPageShell('Manajemen Flyer &amp; Banner Promo', '\n    <div class="flex items-center justify-between mb-3 flex-wrap gap-2">\n      <div id="flyerFilterTabs" class="admin-tabbar"></div>\n      <button class="btn-primary" onclick="openFlyerForm()"><i class="bi bi-plus-lg"></i> Unggah Flyer Baru</button>\n    </div>\n    <div id="flyerGrid" class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr));"></div>\n  ');
    loadAdminFlyer();
}
function loadAdminFlyer() {
    apiGet('getAllData', { sheetName: 'FlyerPromo' }).then(function(res) {
        adminFlyerCache = res.success ? res.data : [];
        renderFlyerFilterTabs('Semua');
    });
}

function renderFlyerFilterTabs(active) {
    const counts = { Semua: adminFlyerCache.length,
        Aktif: adminFlyerCache.filter(f => f.Status === 'Aktif').length,
        Nonaktif: adminFlyerCache.filter(f => f.Status !== 'Aktif').length };
    document.getElementById('flyerFilterTabs').innerHTML = ['Semua', 'Aktif', 'Nonaktif'].map(t => ('\n    <button class="chip chip-solid ' + (t === active ? 'active' : '') + '" onclick="renderFlyerFilterTabs(\'' + (t) + '\')">' + (t) + ' (' + (counts[t]) + ')</button>\n  ')).join('');
    let items = adminFlyerCache;
    if (active === 'Aktif')
        items = adminFlyerCache.filter(f => f.Status === 'Aktif');
    if (active === 'Nonaktif')
        items = adminFlyerCache.filter(f => f.Status !== 'Aktif');
    renderFlyerGrid(items);
}

function renderFlyerGrid(items) {
    const el = document.getElementById('flyerGrid');
    if (!items || !items.length) {
        el.innerHTML = '<div class="empty-state col-span-full"><i class="bi bi-images"></i>Belum ada flyer.</div>';
        return;
    }
    const cardsHtml = [];
    items.forEach(function(f) {
        try {
            const statusVal = (f && f.Status) || 'Nonaktif';
            const judulSafe = escapeHtml((f && f.Judul) || '(Tanpa judul)');
            const jenisSafe = escapeHtml((f && f.Jenis) || 'Promo');
            const gambarUrl = (f && f.GambarURL) || '';
            const idSafe = (f && f.ID) || '';
            cardsHtml.push([
                '<div class="card overflow-hidden">',
                gambarUrl ? ('<img src="' + gambarUrl + '" style="width:100%;aspect-ratio:16/9;object-fit:cover;">') : '<div style="width:100%;aspect-ratio:16/9;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#cbd5e1;"><i class="bi bi-image" style="font-size:28px;"></i></div>',
                '<div class="p-3">',
                '<span class="badge-category" style="position:static;">' + jenisSafe + '</span>',
                '<div class="font-bold text-sm mt-1" style="color:var(--text-primary)">' + judulSafe + '</div>',
                '<div class="flex items-center justify-between mt-3">',
                '<span class="status-pill ' + (statusVal === 'Aktif' ? 'aktif' : 'nonaktif') + '">' + (statusVal === 'Aktif' ? 'Live' : 'Nonaktif') + '</span>',
                '<div>',
                '<button class="btn-icon-sm" onclick=\'openFlyerForm(' + JSON.stringify(f || {}) + ')\'><i class="bi bi-pencil"></i></button>',
                '<button class="btn-icon-sm" onclick="confirmDeleteRecord(\'FlyerPromo\',\'' + idSafe + '\', loadAdminFlyer)"><i class="bi bi-trash text-red-500"></i></button>',
                '</div>',
                '</div>',
                '</div>',
                '</div>'
            ].join(''));
        } catch (err) {
            console.error('Gagal render 1 kartu flyer:', err, f);
        }
    });
    el.innerHTML = cardsHtml.length ? cardsHtml.join('') : '<div class="empty-state col-span-full"><i class="bi bi-exclamation-triangle"></i>Data flyer ada tapi gagal ditampilkan. Cek Console (F12).</div>';
}

function openFlyerForm(f) {
    f = f || {};
    document.getElementById('previewModalTitle').textContent = f.ID ? 'Edit Flyer' : 'Unggah Flyer Baru';
    document.getElementById('previewModalContent').innerHTML = ('\n    <form id="flyerForm" class="text-left" onsubmit="submitFlyerForm(event)">\n      <input type="hidden" id="ffId" value="' + (f.ID || '') + '">\n      <div class="form-group"><label class="form-label">Judul *</label><input class="form-input" id="ffJudul" required value="' + (escapeHtml(f.Judul || '')) + '"></div>\n      <div class="form-group"><label class="form-label">Jenis</label>\n        <select class="form-select" id="ffJenis">\n          <option ' + (f.Jenis === 'Event Besar' ? 'selected' : '') + '>Event Besar</option>\n          <option ' + (f.Jenis === 'Promo' ? 'selected' : '') + '>Promo</option>\n          <option ' + (f.Jenis === 'Umum' ? 'selected' : '') + '>Umum</option>\n        </select>\n      </div>\n      <div class="form-group"><label class="form-label">Status</label>\n        <select class="form-select" id="ffStatus"><option ' + (f.Status === 'Aktif' ? 'selected' : '') + '>Aktif</option><option ' + (f.Status === 'Nonaktif' ? 'selected' : '') + '>Nonaktif</option></select>\n      </div>\n      <div class="form-group">\n        <label class="form-label">Gambar Flyer</label>\n        <input class="form-input" type="file" id="ffGambar" accept="image/*">\n        <p class="text-xs mt-1" style="color:var(--text-muted)">Ukuran disarankan: 1600 x 320 px (rasio 5:1, persegi panjang lebar).</p>\n        <input type="hidden" id="ffGambarURL" value="' + (f.GambarURL || '') + '">\n        <input type="hidden" id="ffGambarFileId" value="' + (f.GambarFileId || '') + '">\n      </div>\n      <button type="submit" class="btn-primary w-full" style="height:42px;"><i class="bi bi-check-lg"></i> Simpan Flyer</button>\n    </form>\n  ');
    openModal('previewModal');
}
function submitFlyerForm(e) {
    e.preventDefault();
    const record = {
        ID: document.getElementById('ffId').value || undefined,
        Judul: document.getElementById('ffJudul').value.trim(),
        Jenis: document.getElementById('ffJenis').value,
        Status: document.getElementById('ffStatus').value,
        GambarURL: document.getElementById('ffGambarURL').value,
        GambarFileId: document.getElementById('ffGambarFileId').value
    };
    const fileInput = document.getElementById('ffGambar');
    const btn = e.target.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-inline"></span> Menyimpan...';
    btn.disabled = true;
    const finishSave = () => {
        const action = record.ID ? 'updateRecord' : 'addRecord';
        apiPost(action, { sheetName: 'FlyerPromo', record: record }).then(function(res) {
            btn.innerHTML = original;
            btn.disabled = false;
            if (!res.success) {
                showToast('Gagal', res.message, 'danger');
                return;
            }
            AppState.cache = {};
            showToast('Berhasil', res.message, 'success');
            closeModal('previewModal');
            loadAdminFlyer();
        });
    };
    if (fileInput.files && fileInput.files[0]) {
        apiUploadFile(fileInput.files[0], 'flyerFolderId').then(function(res) {
            if (res.success) {
                record.GambarURL = res.data.fileUrl;
                record.GambarFileId = res.data.fileId;
                finishSave();
            } else {
                btn.innerHTML = original; btn.disabled = false;
                showToast('Error', res.message, 'danger');
            }
        });
    }
    else {
        finishSave();
    }
}

// -------------------- MITRA PEMASARAN (ADMIN) --------------------
let adminMitraCache = [];
function renderAdminMitraPage() {
    const container = document.getElementById('app-container');
    container.innerHTML = adminPageShell('Mitra Pemasaran', [
      '<div class="flex justify-end mb-3">',
      '<button class="btn-primary" onclick="openMitraForm()"><i class="bi bi-plus-lg"></i> Tambah Mitra</button>',
      '</div>',
      '<div id="mitraAdminGrid" class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));"></div>'
    ].join(''));
    loadAdminMitra();
}
function loadAdminMitra() {
    apiGet('getAllData', { sheetName: 'MitraPemasaran' }).then(function(res) {
        adminMitraCache = res.success ? res.data : [];
        renderAdminMitraGrid();
    });
}
function renderAdminMitraGrid() {
    const el = document.getElementById('mitraAdminGrid');
    if (!el) return;
    if (!adminMitraCache.length) { el.innerHTML = '<div class="empty-state col-span-full"><i class="bi bi-building"></i>Belum ada mitra.</div>'; return; }
    el.innerHTML = adminMitraCache.map(function(m) {
        return [
          '<div class="card p-4 flex flex-col items-center gap-2">',
          m.LogoURL ? ('<img src="' + m.LogoURL + '" style="max-height:56px; max-width:100%; object-fit:contain;">') : '<i class="bi bi-building" style="font-size:32px; color:var(--border-color);"></i>',
          '<div class="text-xs font-semibold text-center">' + escapeHtml(m.NamaPerusahaan || '') + '</div>',
          "<button class='btn-icon-sm' onclick='confirmDeleteRecord(" + JSON.stringify('MitraPemasaran') + "," + JSON.stringify(m.ID) + ", loadAdminMitra)'><i class='bi bi-trash text-red-500'></i></button>",
          '</div>'
        ].join('');
    }).join('');
}

function openMitraForm() {
    document.getElementById('previewModalTitle').textContent = 'Tambah Mitra Pemasaran';
    document.getElementById('previewModalContent').innerHTML = [
      '<form onsubmit="submitMitraForm(event)" class="text-left">',
      '<div class="form-group"><label class="form-label">Nama Perusahaan</label><input class="form-input" id="mfNama"></div>',
      '<div class="form-group"><label class="form-label">Logo *</label><input class="form-input" type="file" id="mfLogo" accept="image/*" required></div>',
      '<button type="submit" class="btn-primary w-full" style="height:42px;"><i class="bi bi-check-lg"></i> Simpan</button>',
      '</form>'
    ].join('');
    openModal('previewModal');
}

function submitMitraForm(e) {
    e.preventDefault();
    const fileInput = document.getElementById('mfLogo');
    if (!fileInput.files || !fileInput.files[0]) { showToast('Peringatan', 'Pilih logo terlebih dahulu.', 'warning'); return; }
    const nama = document.getElementById('mfNama').value.trim();
    const file = fileInput.files[0];
    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = '<span class="spinner-inline"></span> Menyimpan...'; btn.disabled = true;
    apiUploadFile(file, 'mitraFolderId').then(function(res) {
        if (!res.success) { showToast('Gagal', res.message, 'danger'); btn.disabled = false; return; }
        apiPost('addRecord', { sheetName: 'MitraPemasaran', record: { NamaPerusahaan: nama, LogoURL: res.data.fileUrl, LogoFileId: res.data.fileId } }).then(function(res2) {
            if (!res2.success) { showToast('Gagal', res2.message, 'danger'); btn.disabled = false; return; }
            AppState.cache = {};
            showToast('Berhasil', 'Mitra ditambahkan.', 'success');
            closeModal('previewModal');
            loadAdminMitra();
        });
    });
}

// -------------------- DATA UMKM --------------------
let adminUmkmCache = [];
function renderAdminUmkmPage() {
    const container = document.getElementById('app-container');
    container.innerHTML = adminPageShell('Data UMKM Binaan', '\n    <div class="flex justify-end mb-3">\n      <button class="btn-primary" onclick="openUmkmForm()"><i class="bi bi-plus-lg"></i> Tambah UMKM</button>\n    </div>\n    <div class="table-wrap">\n      <table class="data-table">\n        <thead><tr><th>Nama UMKM</th><th>Kategori</th><th>Kontak</th><th>Keterangan</th><th></th></tr></thead>\n        <tbody id="adminUmkmTbody"><tr><td colspan="5" class="text-center py-4">Memuat...</td></tr></tbody>\n      </table>\n    </div>\n  ');
    loadAdminUmkm();
}
function loadAdminUmkm() {
    apiGet('getAllData', { sheetName: 'UMKM' }).then(function(res) {
        adminUmkmCache = res.success ? res.data : [];
        renderAdminUmkmTable();
    });
}
function renderAdminUmkmTable() {
    const tbody = document.getElementById('adminUmkmTbody');
    if (!adminUmkmCache.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4" style="color:var(--text-muted)">Belum ada data UMKM.</td></tr>';
        return;
    }
    tbody.innerHTML = adminUmkmCache.map(u => ('\n    <tr>\n      <td class="font-semibold" style="color:var(--text-primary)">' + (escapeHtml(u.NamaUMKM)) + '</td>\n      <td>' + (escapeHtml(u.Kategori)) + '</td>\n      <td>' + (escapeHtml(u.Kontak)) + '</td>\n      <td>' + (escapeHtml(u.Keterangan)) + '</td>\n      <td class="whitespace-nowrap">\n        <button class="btn-icon-sm" onclick=\'openUmkmForm(' + (JSON.stringify(u)) + ')\'><i class="bi bi-pencil"></i></button>\n        <button class="btn-icon-sm" onclick="confirmDeleteRecord(\'UMKM\',\'' + (u.ID) + '\', loadAdminUmkm)"><i class="bi bi-trash text-red-500"></i></button>\n      </td>\n    </tr>\n  ')).join('');
}

function openUmkmForm(u) {
    u = u || {};
    const struk = AppState.kategoriStruktur || {};
    const opts = Object.keys(struk).map(k => ('<option value="' + (k) + '" ' + (u.Kategori === k ? 'selected' : '') + '>' + (struk[k].label || k) + '</option>')).join('');
    document.getElementById('previewModalTitle').textContent = u.ID ? 'Edit UMKM' : 'Tambah UMKM';
    document.getElementById('previewModalContent').innerHTML = ('\n    <form onsubmit="submitUmkmForm(event)" class="text-left">\n      <input type="hidden" id="ufId" value="' + (u.ID || '') + '">\n      <div class="form-group"><label class="form-label">Nama UMKM *</label><input class="form-input" id="ufNama" required value="' + (escapeHtml(u.NamaUMKM || '')) + '"></div>\n      <div class="form-group"><label class="form-label">Kategori *</label><select class="form-select" id="ufKategori" required>' + (opts) + '</select></div>\n      <div class="form-group"><label class="form-label">Kontak</label><input class="form-input" id="ufKontak" value="' + (escapeHtml(u.Kontak || '')) + '"></div>\n      <div class="form-group"><label class="form-label">Keterangan</label><textarea class="form-textarea" id="ufKeterangan">' + (escapeHtml(u.Keterangan || '')) + '</textarea></div>\n      <button type="submit" class="btn-primary w-full" style="height:42px;"><i class="bi bi-check-lg"></i> Simpan</button>\n    </form>\n  ');
    openModal('previewModal');
}

function submitUmkmForm(e) {
    e.preventDefault();
    const record = {
        ID: document.getElementById('ufId').value || undefined,
        NamaUMKM: document.getElementById('ufNama').value.trim(),
        Kategori: document.getElementById('ufKategori').value,
        Kontak: document.getElementById('ufKontak').value.trim(),
        Keterangan: document.getElementById('ufKeterangan').value.trim()
    };
    const action = record.ID ? 'updateRecord' : 'addRecord';
    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = '<span class="spinner-inline"></span> Menyimpan...';
    btn.disabled = true;
    apiPost(action, { sheetName: 'UMKM', record: record }).then(function(res) {
        if (!res.success) {
            showToast('Gagal', res.message, 'danger');
            btn.disabled = false;
            return;
        }
        AppState.cache = {};
        showToast('Berhasil', res.message, 'success');
        closeModal('previewModal');
        loadAdminUmkm();
    });
}
