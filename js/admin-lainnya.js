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
    const cached = ambilDariCache('adminHeroList');
    if (cached) {
        adminHeroCache = cached;
        renderAdminHeroGrid();
        const btn0 = document.getElementById('addHeroBtn');
        if (btn0) btn0.disabled = adminHeroCache.length >= 5;
        return;
    }
    dbSelect('hero_carousel', { order: 'urutan' }).then(function(res) {
        adminHeroCache = res.success ? res.data : [];
        simpanKeCache('adminHeroList', adminHeroCache);
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
          h.foto_url ? ('<img src="' + h.foto_url + '" style="width:100%; aspect-ratio:4/3; object-fit:cover;">') : '<div style="width:100%;aspect-ratio:4/3;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#cbd5e1;"><i class="bi bi-image" style="font-size:28px;"></i></div>',
          '<div class="p-3 flex items-center justify-between">',
          '<span class="text-xs font-semibold" style="color:var(--text-muted)">Urutan: ', (h.urutan || '-'), '</span>',
          "<button class='btn-icon-sm' onclick='confirmDeleteRecord(" + JSON.stringify('hero_carousel') + ',' + JSON.stringify(h.id) + ', loadAdminHero, [' + JSON.stringify(h.foto_path || '') + "])'><i class='bi bi-trash text-red-500'></i></button>",
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
    uploadFile(file, 'heroFolderId').then(function(res) {
        if (!res.success) { showToast('Gagal', res.message, 'danger'); btn.disabled = false; return; }
        dbInsert('hero_carousel', { foto_url: res.data.url, foto_path: res.data.fileId, urutan: urutan }).then(function(res2) {
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
    const cached = ambilDariCache('adminFlyerList');
    if (cached) { adminFlyerCache = cached; renderFlyerFilterTabs('Semua'); return; }
    dbSelect('flyer_promo').then(function(res) {
        adminFlyerCache = res.success ? res.data : [];
        simpanKeCache('adminFlyerList', adminFlyerCache);
        renderFlyerFilterTabs('Semua');
    });
}

function renderFlyerFilterTabs(active) {
    const counts = { Semua: adminFlyerCache.length,
        Aktif: adminFlyerCache.filter(f => f.status === 'Aktif').length,
        Nonaktif: adminFlyerCache.filter(f => f.status !== 'Aktif').length };
    document.getElementById('flyerFilterTabs').innerHTML = ['Semua', 'Aktif', 'Nonaktif'].map(t => ('\n    <button class="chip chip-solid ' + (t === active ? 'active' : '') + '" onclick="renderFlyerFilterTabs(\'' + (t) + '\')">' + (t) + ' (' + (counts[t]) + ')</button>\n  ')).join('');
    let items = adminFlyerCache;
    if (active === 'Aktif')
        items = adminFlyerCache.filter(f => f.status === 'Aktif');
    if (active === 'Nonaktif')
        items = adminFlyerCache.filter(f => f.status !== 'Aktif');
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
            const statusVal = (f && f.status) || 'Nonaktif';
            const judulSafe = escapeHtml((f && f.judul) || '(Tanpa judul)');
            const jenisSafe = escapeHtml((f && f.jenis) || 'Promo');
            const gambarUrl = (f && f.gambar_url) || '';
            const idSafe = (f && f.id) || '';
            const pathSafe = (f && f.gambar_path) || '';
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
                "<button class='btn-icon-sm' onclick='confirmDeleteRecord(" + JSON.stringify('flyer_promo') + ',' + JSON.stringify(idSafe) + ', loadAdminFlyer, [' + JSON.stringify(pathSafe) + "])'><i class='bi bi-trash text-red-500'></i></button>",
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
    document.getElementById('previewModalTitle').textContent = f.id ? 'Edit Flyer' : 'Unggah Flyer Baru';
    document.getElementById('previewModalContent').innerHTML = ('\n    <form id="flyerForm" class="text-left" onsubmit="submitFlyerForm(event)">\n      <input type="hidden" id="ffId" value="' + (f.id || '') + '">\n      <div class="form-group"><label class="form-label">Judul *</label><input class="form-input" id="ffJudul" required value="' + (escapeHtml(f.judul || '')) + '"></div>\n      <div class="form-group"><label class="form-label">Jenis</label>\n        <select class="form-select" id="ffJenis">\n          <option ' + (f.jenis === 'Event Besar' ? 'selected' : '') + '>Event Besar</option>\n          <option ' + (f.jenis === 'Promo' ? 'selected' : '') + '>Promo</option>\n          <option ' + (f.jenis === 'Umum' ? 'selected' : '') + '>Umum</option>\n        </select>\n      </div>\n      <div class="form-group"><label class="form-label">Status</label>\n        <select class="form-select" id="ffStatus"><option ' + (f.status === 'Aktif' ? 'selected' : '') + '>Aktif</option><option ' + (f.status === 'Nonaktif' ? 'selected' : '') + '>Nonaktif</option></select>\n      </div>\n      <div class="form-group">\n        <label class="form-label">Gambar Flyer</label>\n        <input class="form-input" type="file" id="ffGambar" accept="image/*">\n        <p class="text-xs mt-1" style="color:var(--text-muted)">Ukuran disarankan: 1600 x 320 px (rasio 5:1, persegi panjang lebar).</p>\n        <input type="hidden" id="ffGambarURL" value="' + (f.gambar_url || '') + '">\n        <input type="hidden" id="ffGambarPath" value="' + (f.gambar_path || '') + '">\n      </div>\n      <button type="submit" class="btn-primary w-full" style="height:42px;"><i class="bi bi-check-lg"></i> Simpan Flyer</button>\n    </form>\n  ');
    openModal('previewModal');
}
function submitFlyerForm(e) {
    e.preventDefault();
    const record = {
        judul: document.getElementById('ffJudul').value.trim(),
        jenis: document.getElementById('ffJenis').value,
        status: document.getElementById('ffStatus').value,
        gambar_url: document.getElementById('ffGambarURL').value,
        gambar_path: document.getElementById('ffGambarPath').value
    };
    const flyerId = document.getElementById('ffId').value || null;
    const fileInput = document.getElementById('ffGambar');
    const btn = e.target.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-inline"></span> Menyimpan...';
    btn.disabled = true;
    const finishSave = () => {
        const promise = flyerId ? dbUpdate('flyer_promo', flyerId, record) : dbInsert('flyer_promo', record);
        promise.then(function(res) {
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
        const oldFileId = record.gambar_path;
        uploadFile(fileInput.files[0], 'flyerFolderId').then(function(res) {
            if (res.success) {
                record.gambar_url = res.data.url;
                record.gambar_path = res.data.fileId;
                if (oldFileId && oldFileId !== res.data.fileId) deleteFile(oldFileId);
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
    const cached = ambilDariCache('adminMitraList');
    if (cached) { adminMitraCache = cached; renderAdminMitraGrid(); return; }
    dbSelect('mitra_pemasaran').then(function(res) {
        adminMitraCache = res.success ? res.data : [];
        simpanKeCache('adminMitraList', adminMitraCache);
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
          m.logo_url ? ('<img src="' + m.logo_url + '" style="max-height:56px; max-width:100%; object-fit:contain;">') : '<i class="bi bi-building" style="font-size:32px; color:var(--border-color);"></i>',
          '<div class="text-xs font-semibold text-center">' + escapeHtml(m.nama_perusahaan || '') + '</div>',
          "<button class='btn-icon-sm' onclick='confirmDeleteRecord(" + JSON.stringify('mitra_pemasaran') + "," + JSON.stringify(m.id) + ", loadAdminMitra, [" + JSON.stringify(m.logo_path || '') + "])'><i class='bi bi-trash text-red-500'></i></button>",
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
    uploadFile(file, 'mitraFolderId').then(function(res) {
        if (!res.success) { showToast('Gagal', res.message, 'danger'); btn.disabled = false; return; }
        dbInsert('mitra_pemasaran', { nama_perusahaan: nama, logo_url: res.data.url, logo_path: res.data.fileId }).then(function(res2) {
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
    const cached = ambilDariCache('adminUmkmList');
    if (cached) { adminUmkmCache = cached; renderAdminUmkmTable(); return; }
    dbSelect('umkm').then(function(res) {
        adminUmkmCache = res.success ? res.data : [];
        simpanKeCache('adminUmkmList', adminUmkmCache);
        renderAdminUmkmTable();
    });
}
function renderAdminUmkmTable() {
    const tbody = document.getElementById('adminUmkmTbody');
    if (!adminUmkmCache.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4" style="color:var(--text-muted)">Belum ada data UMKM.</td></tr>';
        return;
    }
    tbody.innerHTML = adminUmkmCache.map(u => ('\n    <tr>\n      <td class="font-semibold" style="color:var(--text-primary)">' + (escapeHtml(u.nama_umkm)) + '</td>\n      <td>' + (escapeHtml(u.kategori)) + '</td>\n      <td>' + (escapeHtml(u.kontak)) + '</td>\n      <td>' + (escapeHtml(u.keterangan)) + '</td>\n      <td class="whitespace-nowrap">\n        <button class="btn-icon-sm" onclick=\'openUmkmForm(' + (JSON.stringify(u)) + ')\'><i class="bi bi-pencil"></i></button>\n        <button class="btn-icon-sm" onclick="confirmDeleteRecord(\'umkm\',\'' + (u.id) + '\', loadAdminUmkm)"><i class="bi bi-trash text-red-500"></i></button>\n      </td>\n    </tr>\n  ')).join('');
}

function openUmkmForm(u) {
    u = u || {};
    const struk = AppState.kategoriStruktur || {};
    const opts = Object.keys(struk).map(k => ('<option value="' + (k) + '" ' + (u.kategori === k ? 'selected' : '') + '>' + (struk[k].label || k) + '</option>')).join('');
    document.getElementById('previewModalTitle').textContent = u.id ? 'Edit UMKM' : 'Tambah UMKM';
    document.getElementById('previewModalContent').innerHTML = ('\n    <form onsubmit="submitUmkmForm(event)" class="text-left">\n      <input type="hidden" id="ufId" value="' + (u.id || '') + '">\n      <div class="form-group"><label class="form-label">Nama UMKM *</label><input class="form-input" id="ufNama" required value="' + (escapeHtml(u.nama_umkm || '')) + '"></div>\n      <div class="form-group"><label class="form-label">Kategori *</label><select class="form-select" id="ufKategori" required>' + (opts) + '</select></div>\n      <div class="form-group"><label class="form-label">Kontak</label><input class="form-input" id="ufKontak" value="' + (escapeHtml(u.kontak || '')) + '"></div>\n      <div class="form-group"><label class="form-label">Keterangan</label><textarea class="form-textarea" id="ufKeterangan">' + (escapeHtml(u.keterangan || '')) + '</textarea></div>\n      <button type="submit" class="btn-primary w-full" style="height:42px;"><i class="bi bi-check-lg"></i> Simpan</button>\n    </form>\n  ');
    openModal('previewModal');
}

function submitUmkmForm(e) {
    e.preventDefault();
    const record = {
        nama_umkm: document.getElementById('ufNama').value.trim(),
        kategori: document.getElementById('ufKategori').value,
        kontak: document.getElementById('ufKontak').value.trim(),
        keterangan: document.getElementById('ufKeterangan').value.trim()
    };
    const umkmId = document.getElementById('ufId').value || null;
    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = '<span class="spinner-inline"></span> Menyimpan...';
    btn.disabled = true;
    const promise = umkmId ? dbUpdate('umkm', umkmId, record) : dbInsert('umkm', record);
    promise.then(function(res) {
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
