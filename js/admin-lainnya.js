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
                '<button class="btn-icon-sm" onclick="editFlyerById(\'' + idAman(idSafe) + '\')" title="Edit"><i class="bi bi-pencil"></i></button>',
                '<button class="btn-icon-sm" onclick="hapusFlyerById(\'' + idAman(idSafe) + '\')" title="Hapus"><i class="bi bi-trash text-red-500"></i></button>',
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

function editFlyerById(id) {
    const f = adminFlyerCache.find(function(x) { return x.id === id; });
    if (!f) { showToast('Gagal', 'Data flyer tidak ditemukan. Muat ulang halaman lalu coba lagi.', 'danger'); return; }
    openFlyerForm(f);
}
function hapusFlyerById(id) {
    const f = adminFlyerCache.find(function(x) { return x.id === id; });
    if (!f) { showToast('Gagal', 'Data flyer tidak ditemukan. Muat ulang halaman lalu coba lagi.', 'danger'); return; }
    confirmDeleteRecord('flyer_promo', id, loadAdminFlyer, [f.gambar_path || '']);
}
function openFlyerForm(f) {
    f = f || {};
    document.getElementById('previewModalTitle').textContent = f.id ? 'Edit Flyer' : 'Unggah Flyer Baru';
    document.getElementById('previewModalContent').innerHTML = ('\n    <form id="flyerForm" class="text-left" onsubmit="submitFlyerForm(event)">\n      <input type="hidden" id="ffId" value="' + (f.id || '') + '">\n      <div class="form-group"><label class="form-label">Judul *</label><input class="form-input" id="ffJudul" required value="' + (escapeAttr(f.judul || '')) + '"></div>\n      <div class="form-group"><label class="form-label">Jenis</label>\n        <select class="form-select" id="ffJenis">\n          <option ' + (f.jenis === 'Event Besar' ? 'selected' : '') + '>Event Besar</option>\n          <option ' + (f.jenis === 'Promo' ? 'selected' : '') + '>Promo</option>\n          <option ' + (f.jenis === 'Umum' ? 'selected' : '') + '>Umum</option>\n        </select>\n      </div>\n      <div class="form-group"><label class="form-label">Status</label>\n        <select class="form-select" id="ffStatus"><option ' + (f.status === 'Aktif' ? 'selected' : '') + '>Aktif</option><option ' + (f.status === 'Nonaktif' ? 'selected' : '') + '>Nonaktif</option></select>\n      </div>\n      <div class="pf-section">\n        <div class="pf-section-title">Popup saat aplikasi dibuka</div>\n        <label class="pf-cek"><input type="checkbox" id="ffPopup" ' + (f.tampil_popup ? 'checked' : '') + '> Tampilkan flyer ini sebagai popup</label>\n        <p class="pf-foto-info">Maksimal 3 flyer. Kalau lebih dari satu, popupnya bergulir otomatis. Popup muncul sekali tiap kali customer membuka aplikasi, dan bisa ditutup.</p>\n        <div class="form-group" style="margin:8px 0 0;"><label class="form-label">Urutan Tampil</label><input class="form-input" type="number" min="1" id="ffUrutan" value="' + (f.urutan || 1) + '" style="width:110px;"></div>\n      </div>\n      <div class="form-group">\n        <label class="form-label">Gambar Flyer</label>\n        <input class="form-input" type="file" id="ffGambar" accept="image/*">\n        <p class="text-xs mt-1" style="color:var(--text-muted)">Ukuran disarankan: 1600 x 320 px (rasio 5:1, persegi panjang lebar).</p>\n        <p class="text-xs mt-1" style="color:#b45309;">Khusus flyer yang dicentang sebagai popup, pakai gambar PERSEGI (1:1), misalnya 1000 x 1000 px.</p>\n        <input type="hidden" id="ffGambarURL" value="' + (f.gambar_url || '') + '">\n        <input type="hidden" id="ffGambarPath" value="' + (f.gambar_path || '') + '">\n      </div>\n      <button type="submit" class="btn-primary w-full" style="height:42px;"><i class="bi bi-check-lg"></i> Simpan Flyer</button>\n    </form>\n  ');
    openModal('previewModal');
}
async function submitFlyerForm(e) {
    e.preventDefault();
    const record = {
        judul: document.getElementById('ffJudul').value.trim(),
        jenis: document.getElementById('ffJenis').value,
        status: document.getElementById('ffStatus').value,
        gambar_url: document.getElementById('ffGambarURL').value,
        gambar_path: document.getElementById('ffGambarPath').value,
        tampil_popup: document.getElementById('ffPopup').checked,
        urutan: Math.max(1, parseInt(document.getElementById('ffUrutan').value, 10) || 1)
    };
    const flyerId = document.getElementById('ffId').value || null;
    // Maksimal 3 flyer popup: dihitung dari data terbaru, bukan dari cache,
    // supaya tetap benar walau Admin membuka aplikasi di dua perangkat.
    if (record.tampil_popup && record.status === 'Aktif') {
        const cek = await dbSelect('flyer_promo', { eq: { status: 'Aktif', tampil_popup: true } });
        if (cek.success) {
            const lain = cek.data.filter(function(x) { return x.id !== flyerId; });
            if (lain.length >= 3) {
                showToast('Batas popup', 'Sudah ada 3 flyer popup aktif: ' + lain.map(function(x) { return x.judul; }).join(', ') + '. Hilangkan centang popup pada salah satunya dulu.', 'warning');
                return;
            }
        }
    }
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
let adminUmkmFilterKategori = 'Semua';

function renderAdminUmkmPage() {
    const container = document.getElementById('app-container');
    container.innerHTML = adminPageShell('Data UMKM Binaan', [
      '<div class="flex items-center justify-between mb-3 flex-wrap gap-2">',
      '<div class="search-box" style="width:300px;"><i class="bi bi-search"></i><input id="adminUmkmSearch" placeholder="Cari nama, kontak, keterangan..." oninput="filterAdminUmkm()"></div>',
      '<button class="btn-primary" onclick="openUmkmForm()"><i class="bi bi-plus-lg"></i> Tambah UMKM</button>',
      '</div>',
      '<div class="flex flex-wrap gap-2 mb-2" id="adminUmkmKategoriChips"></div>',
      '<div id="adminUmkmInfo" class="text-xs mb-3" style="color:var(--text-muted)"></div>',
      '<div class="table-wrap">',
      '<table class="data-table">',
      '<thead><tr><th>Nama UMKM</th><th>Kategori</th><th>Kontak</th><th>Keterangan</th><th></th></tr></thead>',
      '<tbody id="adminUmkmTbody"><tr><td colspan="5" class="text-center py-4">Memuat...</td></tr></tbody>',
      '</table>',
      '</div>'
    ].join(''));
    adminUmkmFilterKategori = 'Semua';
    loadAdminUmkm();
}
function loadAdminUmkm() {
    const cached = ambilDariCache('adminUmkmList');
    if (cached) { adminUmkmCache = cached; filterAdminUmkm(); return; }
    dbSelect('umkm', { order: 'created_at', ascending: false }).then(function(res) {
        adminUmkmCache = res.success ? res.data : [];
        simpanKeCache('adminUmkmList', adminUmkmCache);
        filterAdminUmkm();
    });
}
/** Chip filter kategori + jumlah UMKM per kategori (membantu Admin mengecek UMKM yang sudah masuk). */
function renderAdminUmkmKategoriChips() {
    const wrap = document.getElementById('adminUmkmKategoriChips');
    if (!wrap) return;
    const daftar = ['Semua', 'PortoRasa', 'PortoKriya', 'PortoTani'];
    wrap.innerHTML = daftar.map(function(k) {
        const jumlah = k === 'Semua' ? adminUmkmCache.length : adminUmkmCache.filter(function(u) { return u.kategori === k; }).length;
        return '<button class="chip chip-solid ' + (adminUmkmFilterKategori === k ? 'active' : '') + '" onclick="setAdminUmkmKategori(\'' + k + '\')">' + k + ' (' + jumlah + ')</button>';
    }).join('');
}
function setAdminUmkmKategori(k) {
    adminUmkmFilterKategori = k;
    filterAdminUmkm();
}
/** Gabungan filter kategori + pencarian teks (nama, kontak, keterangan). */
function filterAdminUmkm() {
    renderAdminUmkmKategoriChips();
    const q = (((document.getElementById('adminUmkmSearch') || {}).value) || '').trim().toLowerCase();
    const hasil = adminUmkmCache.filter(function(u) {
        const cocokKategori = adminUmkmFilterKategori === 'Semua' || u.kategori === adminUmkmFilterKategori;
        const cocokCari = !q || [u.nama_umkm, u.kontak, u.keterangan].some(function(v) { return String(v || '').toLowerCase().includes(q); });
        return cocokKategori && cocokCari;
    });
    renderAdminUmkmTable(hasil);
}
function renderAdminUmkmTable(items) {
    const tbody = document.getElementById('adminUmkmTbody');
    if (!tbody) return;
    const info = document.getElementById('adminUmkmInfo');
    if (info) info.textContent = 'Menampilkan ' + items.length + ' dari ' + adminUmkmCache.length + ' UMKM';
    if (!adminUmkmCache.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4" style="color:var(--text-muted)">Belum ada data UMKM.</td></tr>';
        return;
    }
    if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4" style="color:var(--text-muted)">Tidak ada UMKM yang cocok dengan filter/pencarian.</td></tr>';
        return;
    }
    // Tombol Edit/Hapus HANYA membawa ID UMKM (sebelumnya seluruh data UMKM diselipkan ke atribut HTML,
    // sehingga UMKM yang teksnya memuat tanda kutip (') tombol Edit-nya mati).
    tbody.innerHTML = items.map(function(u) {
        const id = idAman(u.id);
        return [
          '<tr>',
          '<td class="font-semibold" style="color:var(--text-primary)">' + escapeHtml(u.nama_umkm) + '</td>',
          '<td>' + escapeHtml(u.kategori) + '</td>',
          '<td>' + escapeHtml(u.kontak) + '</td>',
          '<td>' + escapeHtml(u.keterangan) + '</td>',
          '<td class="whitespace-nowrap">',
          '<button class="btn-icon-sm" onclick="editUmkmById(\'' + id + '\')" title="Edit"><i class="bi bi-pencil"></i></button> ',
          '<button class="btn-icon-sm" onclick="hapusUmkmBerantai(\'' + id + '\')" title="Hapus"><i class="bi bi-trash text-red-500"></i></button>',
          '</td>',
          '</tr>'
        ].join('');
    }).join('');
}

// -------------------- DETEKSI NAMA UMKM GANDA / MIRIP --------------------
/**
 * Normalisasi nama supaya perbandingan tidak terkecoh huruf besar/kecil,
 * spasi berlebih, tanda baca, atau aksen.
 */
function normalisasiNamaUmkm(nama) {
    return String(nama || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
/** Awalan badan usaha yang sering ditulis/tidak ditulis ("CV Maju" vs "Maju") - hanya ini yang dibuang, supaya "Toko X" dan "Warung X" tetap dianggap berbeda. */
const AWALAN_BADAN_USAHA = ['umkm', 'cv', 'pt', 'ud'];
function kunciNamaUmkm(nama) {
    let token = normalisasiNamaUmkm(nama).split(' ').filter(Boolean);
    while (token.length > 1 && AWALAN_BADAN_USAHA.indexOf(token[0]) !== -1) token.shift();
    return token.join('');
}
function jarakLevenshtein(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = [];
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
        const cur = [i];
        for (let j = 1; j <= n; j++) {
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
        prev = cur;
    }
    return prev[n];
}
/**
 * Cari UMKM di daftar yang namanya SAMA atau MIRIP dengan nama baru.
 * - 'persis': sama setelah huruf besar/kecil, spasi, dan tanda baca diabaikan
 *   ("Sari Rasa" = "sari  rasa" = "SariRasa")
 * - 'mirip' : sama setelah awalan badan usaha dibuang ("CV Sari Rasa" ~ "Sari Rasa"),
 *   ATAU selisih huruf sangat kecil (salah ketik, mis. "Sari Rasa" ~ "Sari Rasaa").
 *   Nama yang angkanya berbeda ("Kelompok Mawar 1" vs "Kelompok Mawar 2") dianggap BERBEDA.
 * @returns {{jenis:string, umkm:object}|null}
 */
function cariUmkmSerupa(namaBaru, daftar, abaikanId) {
    const polosBaru = normalisasiNamaUmkm(namaBaru).replace(/ /g, '');
    const kunciBaru = kunciNamaUmkm(namaBaru);
    if (!polosBaru) return null;
    let kandidatMirip = null;
    for (const u of daftar) {
        if (abaikanId && u.id === abaikanId) continue;
        const polosLama = normalisasiNamaUmkm(u.nama_umkm).replace(/ /g, '');
        if (polosLama === polosBaru) return { jenis: 'persis', umkm: u };
        const kunciLama = kunciNamaUmkm(u.nama_umkm);
        if (kunciLama && kunciLama === kunciBaru) { kandidatMirip = kandidatMirip || { jenis: 'mirip', umkm: u }; continue; }
        const angkaBaru = kunciBaru.replace(/[^0-9]/g, '');
        const angkaLama = kunciLama.replace(/[^0-9]/g, '');
        if (angkaBaru !== angkaLama) continue;
        const panjang = Math.max(kunciBaru.length, kunciLama.length);
        const batas = panjang <= 4 ? 0 : (panjang <= 11 ? 1 : 2);
        if (batas > 0 && jarakLevenshtein(kunciBaru, kunciLama) <= batas) {
            kandidatMirip = kandidatMirip || { jenis: 'mirip', umkm: u };
        }
    }
    return kandidatMirip;
}

function openUmkmForm(u) {
    u = u || {};
    const struk = AppState.kategoriStruktur || {};
    const opts = Object.keys(struk).map(k => ('<option value="' + (k) + '" ' + (u.kategori === k ? 'selected' : '') + '>' + (struk[k].label || k) + '</option>')).join('');
    document.getElementById('previewModalTitle').textContent = u.id ? 'Edit UMKM' : 'Tambah UMKM';
    document.getElementById('previewModalContent').innerHTML = ('\n    <form onsubmit="submitUmkmForm(event)" class="text-left">\n      <input type="hidden" id="ufId" value="' + (u.id || '') + '">\n      <div class="form-group"><label class="form-label">Nama UMKM *</label><input class="form-input" id="ufNama" required value="' + (escapeAttr(u.nama_umkm || '')) + '"><div id="ufNamaError" class="text-xs mt-1" style="color:#dc2626;"></div></div>\n      <div class="form-group"><label class="form-label">Kategori *</label><select class="form-select" id="ufKategori" required>' + (opts) + '</select></div>\n      <div class="form-group"><label class="form-label">Kontak</label><input class="form-input" id="ufKontak" value="' + (escapeAttr(u.kontak || '')) + '"></div>\n      <div class="form-group"><label class="form-label">Keterangan</label><textarea class="form-textarea" id="ufKeterangan">' + (escapeHtml(u.keterangan || '')) + '</textarea></div>\n      <button type="submit" class="btn-primary w-full" style="height:42px;"><i class="bi bi-check-lg"></i> Simpan</button>\n    </form>\n  ');
    openModal('previewModal');
}

/**
 * Hapus UMKM BESERTA semua Produk miliknya (otomatis, termasuk foto-foto
 * Produk itu di Drive) - supaya tidak ada Produk "yatim" yang nama UMKM-nya
 * sudah tidak ada. Produk dicari lewat kecocokan nama (nama_umkm), karena
 * desain data sejak awal memang begitu (bukan relasi ID formal).
 */
function editUmkmById(id) {
    const u = adminUmkmCache.find(function(x) { return x.id === id; });
    if (!u) { showToast('Gagal', 'Data UMKM tidak ditemukan. Muat ulang halaman lalu coba lagi.', 'danger'); return; }
    openUmkmForm(u);
}
function hapusUmkmBerantai(umkmId) {
    const u = adminUmkmCache.find(function(x) { return x.id === umkmId; });
    if (!u) { showToast('Gagal', 'Data UMKM tidak ditemukan. Muat ulang halaman lalu coba lagi.', 'danger'); return; }
    const namaUmkm = u.nama_umkm;
    dbSelect('produk', { eq: { nama_umkm: namaUmkm } }).then(function(res) {
        if (!res.success) {
            // Jangan lanjut kalau produk terkait tidak bisa diperiksa: bisa-bisa ada produk yang tertinggal tanpa pemilik.
            showToast('Gagal', 'Tidak bisa memeriksa produk milik UMKM ini: ' + res.message, 'danger');
            return;
        }
        const produkTerkait = res.data;
        const pesan = produkTerkait.length
            ? ('UMKM "' + namaUmkm + '" dipakai oleh ' + produkTerkait.length + ' produk. Menghapus UMKM ini akan IKUT MENGHAPUS SELURUH ' + produkTerkait.length + ' produk tersebut (termasuk semua fotonya). Lanjutkan?')
            : ('Hapus UMKM "' + namaUmkm + '"? Tidak ada produk yang terkait saat ini.');
        confirmDeleteRecord('umkm', umkmId, function() { loadAdminUmkm(); AppState.cache = {}; }, [], {
            pesanKonfirmasi: pesan,
            beforeDelete: async function() {
                for (const p of produkTerkait) {
                    for (const fid of fileIdsProduk(p)) await deleteFile(fid);
                }
                if (produkTerkait.length) await dbDeleteWhere('produk', 'nama_umkm', namaUmkm);
            }
        });
    });
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
    const errEl = document.getElementById('ufNamaError');
    if (errEl) errEl.textContent = '';
    const btn = e.target.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-inline"></span> Memeriksa & menyimpan...';
    btn.disabled = true;

    // Kalau sedang EDIT dan namanya tidak diubah, tidak perlu cek ulang nama
    // (supaya UMKM lama yang kebetulan sudah punya "kembaran" tetap bisa diedit kontak/keterangannya).
    const dataLama = umkmId ? adminUmkmCache.find(function(x) { return x.id === umkmId; }) : null;
    const namaTidakBerubah = dataLama && normalisasiNamaUmkm(dataLama.nama_umkm) === normalisasiNamaUmkm(record.nama_umkm);

    // Ambil daftar TERBARU langsung dari database (bukan cache) sebelum cek,
    // supaya UMKM yang baru ditambahkan Admin lain/di tab lain ikut terhitung.
    const ambilDaftar = namaTidakBerubah ? Promise.resolve(null) : dbSelect('umkm');
    ambilDaftar.then(function(listRes) {
        if (listRes) {
            const daftar = listRes.success ? listRes.data : adminUmkmCache;
            const serupa = cariUmkmSerupa(record.nama_umkm, daftar, umkmId);
            if (serupa) {
                btn.innerHTML = original;
                btn.disabled = false;
                const pesan = serupa.jenis === 'persis'
                    ? ('DITOLAK: UMKM "' + serupa.umkm.nama_umkm + '" sudah terdaftar dengan nama yang sama.')
                    : ('DITOLAK: nama ini terlalu mirip dengan UMKM yang sudah ada: "' + serupa.umkm.nama_umkm + '".');
                if (errEl) errEl.textContent = pesan + ' Gunakan UMKM yang sudah ada, atau beri nama yang benar-benar berbeda.';
                showToast('Ditolak', pesan, 'danger');
                return;
            }
        }
        const promise = umkmId ? dbUpdate('umkm', umkmId, record) : dbInsert('umkm', record);
        promise.then(function(res) {
            if (!res.success) {
                showToast('Gagal', res.message, 'danger');
                btn.innerHTML = original;
                btn.disabled = false;
                return;
            }
            AppState.cache = {};
            showToast('Berhasil', res.message, 'success');
            closeModal('previewModal');
            loadAdminUmkm();
        });
    });
}
