/**
 * ============================================================
 * PortoUMKM - Admin: Manajemen Produk
 * ============================================================
 */
let adminProdukCache = [];
let umkmListCache = [];
function renderAdminProdukPage() {
    const container = document.getElementById('app-container');
    container.innerHTML = adminPageShell('Manajemen Produk (CRUD)', '\n    <div class="flex items-center justify-between mb-3 flex-wrap gap-2">\n      <div class="search-box" style="width:280px;"><i class="bi bi-search"></i><input id="adminProdukSearch" placeholder="Cari produk..." oninput="filterAdminProduk()"></div>\n      <button class="btn-primary" onclick="openProdukForm()"><i class="bi bi-plus-lg"></i> Tambah Produk</button>\n    </div>\n    <div class="table-wrap">\n      <table class="data-table">\n        <thead><tr><th>Foto</th><th>Nama Produk</th><th>UMKM</th><th>Kategori</th><th>Harga</th><th>Status</th><th></th></tr></thead>\n        <tbody id="adminProdukTbody"><tr><td colspan="7" class="text-center py-4">Memuat...</td></tr></tbody>\n      </table>\n    </div>\n  ');
    loadUmkmListForDropdown();
    loadAdminProduk();
}

function loadUmkmListForDropdown() {
    apiGet('getAllData', { sheetName: 'UMKM' }).then(function(res) {
        umkmListCache = res.success ? res.data : [];
    });
}
function loadAdminProduk() {
    apiGet('getAllData', { sheetName: 'Produk' }).then(function(res) {
        adminProdukCache = res.success ? res.data : [];
        renderAdminProdukTable(adminProdukCache);
    });
}
function filterAdminProduk() {
    const q = document.getElementById('adminProdukSearch').value.toLowerCase();
    renderAdminProdukTable(adminProdukCache.filter(p => (p.NamaProduk || '').toLowerCase().includes(q) || (p.NamaUMKM || '').toLowerCase().includes(q)));
}

function renderAdminProdukTable(items) {
    const tbody = document.getElementById('adminProdukTbody');
    if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4" style="color:var(--text-muted)">Belum ada produk.</td></tr>';
        return;
    }
    tbody.innerHTML = items.map(p => ('\n    <tr>\n      <td>' + (p.FotoURL ? ('<img src="' + (p.FotoURL) + '" style="width:44px;height:44px;object-fit:cover;border-radius:6px;">') : '<div style="width:44px;height:44px;background:#f1f5f9;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#cbd5e1;"><i class="bi bi-image"></i></div>') + '</td>\n      <td class="font-semibold" style="color:var(--text-primary)">' + (escapeHtml(p.NamaProduk)) + '</td>\n      <td>' + (escapeHtml(p.NamaUMKM)) + '</td>\n      <td>' + (escapeHtml(p.Kategori)) + ' <span style="color:var(--text-muted)">/ ' + (escapeHtml(p.SubKategori)) + '</span></td>\n      <td>' + (formatRupiah(p.HargaPromo || p.HargaNormal)) + (p.HargaPromo ? ('<br><span class="price-old">' + (formatRupiah(p.HargaNormal)) + '</span>') : '') + '</td>\n      <td><span class="status-pill ' + (p.Status === 'Aktif' ? 'aktif' : 'nonaktif') + '">' + (escapeHtml(p.Status)) + '</span></td>\n      <td class="whitespace-nowrap">\n        <button class="btn-icon-sm" onclick=\'openProdukForm(' + (JSON.stringify(p)) + ')\' title="Edit"><i class="bi bi-pencil"></i></button>\n        <button class="btn-icon-sm" onclick="confirmDeleteRecord(\'Produk\',\'' + (p.ID) + '\', loadAdminProduk)" title="Hapus"><i class="bi bi-trash text-red-500"></i></button>\n      </td>\n    </tr>\n  ')).join('');
}

/**
 * Hapus foto produk (URL + FileId sekaligus) SEBELUM menyimpan, supaya
 * tidak tertimpa/konflik saat mengganti foto.
 */
function hapusFotoProduk(urlId, fileIdId, wrapId) {
    const urlInput = document.getElementById(urlId);
    if (urlInput) urlInput.value = '';
    const fileIdInput = document.getElementById(fileIdId);
    if (fileIdInput) fileIdInput.value = '';
    const wrap = document.getElementById(wrapId);
    if (wrap) wrap.remove();
    showToast('Info', 'Foto dihapus. Klik "Simpan" untuk menerapkan.', 'info');
}
/**
 * Dropdown UMKM yang bisa dicari dengan mengetik (searchable), supaya
 * kalau daftar UMKM sudah banyak, Admin tidak perlu scroll satu-satu -
 * tinggal ketik sebagian nama untuk memfilter.
 */
function renderUmkmDropdownOptions(filterText) {
    const panel = document.getElementById('pfUmkmDropdown');
    if (!panel) return;
    const q = (filterText || '').trim().toLowerCase();
    const list = (umkmListCache || []).filter(function(u) {
        return !q || (u.NamaUMKM || '').toLowerCase().includes(q);
    });
    if (!list.length) {
        panel.innerHTML = '<div class="umkm-dropdown-empty">Tidak ada UMKM yang cocok.</div>';
        return;
    }
    panel.innerHTML = list.map(function(u) {
        const nama = escapeHtml(u.NamaUMKM || '');
        return "<div class='umkm-dropdown-item' onclick='pilihUmkmDropdown(" + JSON.stringify(u.NamaUMKM || '') + ")'>" + nama + '</div>';
    }).join('');
}
function bukaDropdownUmkm() {
    const panel = document.getElementById('pfUmkmDropdown');
    if (!panel) return;
    renderUmkmDropdownOptions(document.getElementById('pfUmkmSearch').value);
    panel.classList.remove('hidden');
}
function filterDropdownUmkm(value) {
    document.getElementById('pfUmkm').value = ''; // ketikan bebas belum tentu = pilihan valid, dikosongkan dulu
    renderUmkmDropdownOptions(value);
    const panel = document.getElementById('pfUmkmDropdown');
    if (panel) panel.classList.remove('hidden');
}
function pilihUmkmDropdown(nama) {
    document.getElementById('pfUmkmSearch').value = nama;
    document.getElementById('pfUmkm').value = nama;
    closeDropdownUmkm();
}
function closeDropdownUmkm() {
    const panel = document.getElementById('pfUmkmDropdown');
    if (panel) panel.classList.add('hidden');
}
document.addEventListener('click', function(e) {
    if (!e.target.closest('#pfUmkmSearch') && !e.target.closest('#pfUmkmDropdown')) {
        closeDropdownUmkm();
    }
});
function openProdukForm(p) {
    p = p || {};
    const struk = AppState.kategoriStruktur || {};
    const kategoriOptions = Object.keys(struk).map(function(k) { return '<option value="' + k + '" ' + (p.Kategori === k ? 'selected' : '') + '>' + (struk[k].label || k) + '</option>'; }).join('');
    document.getElementById('previewModalTitle').textContent = p.ID ? 'Edit Produk' : 'Tambah Produk Baru';
    document.getElementById('previewModalContent').innerHTML = [
      '<form id="produkForm" class="text-left" onsubmit="submitProdukForm(event)">',
      '<input type="hidden" id="pfId" value="', p.ID || '', '">',
      '<div class="form-group"><label class="form-label">Nama Produk *</label><input class="form-input" id="pfNama" required value="', escapeHtml(p.NamaProduk || ''), '"></div>',
      '<div class="form-group" style="position:relative;">',
      '<label class="form-label">Nama UMKM Pemilik *</label>',
      '<input type="text" class="form-input" id="pfUmkmSearch" autocomplete="off" placeholder="Ketik untuk mencari UMKM..." value="', escapeHtml(p.NamaUMKM || ''), '" onfocus="bukaDropdownUmkm()" oninput="filterDropdownUmkm(this.value)">',
      '<input type="hidden" id="pfUmkm" value="', escapeHtml(p.NamaUMKM || ''), '">',
      '<div id="pfUmkmDropdown" class="umkm-dropdown-panel hidden"></div>',
      (!umkmListCache || !umkmListCache.length) ? '<p class="text-xs mt-1" style="color:#d97706;">Belum ada UMKM terdaftar. Tambahkan dulu di menu Data UMKM.</p>' : '',
      '</div>',
      '<div class="form-group"><label class="form-label">Deskripsi</label><textarea class="form-textarea" id="pfDeskripsi">', escapeHtml(p.Deskripsi || ''), '</textarea></div>',
      '<div class="grid grid-cols-2 gap-3">',
      '<div class="form-group"><label class="form-label">Harga Normal (Rp) *</label><input class="form-input" type="number" id="pfHargaNormal" required value="', p.HargaNormal || '', '"></div>',
      '<div class="form-group"><label class="form-label">Harga Coret/Promo (Rp)</label><input class="form-input" type="number" id="pfHargaPromo" value="', p.HargaPromo || '', '"></div>',
      '</div>',
      '<div class="grid grid-cols-2 gap-3">',
      '<div class="form-group"><label class="form-label">Satuan</label><input class="form-input" id="pfSatuan" value="', escapeHtml(p.Satuan || 'pcs'), '"></div>',
      '<div class="form-group"><label class="form-label">Minimal Order</label><input class="form-input" id="pfMinimalOrder" value="', escapeHtml(p.MinimalOrder || ''), '" placeholder="mis. 10 box, 5 pcs"></div>',
      '</div>',
      '<div class="grid grid-cols-2 gap-3">',
      '<div class="form-group"><label class="form-label">Status</label><select class="form-select" id="pfStatus"><option ', (p.Status === 'Aktif' ? 'selected' : ''), '>Aktif</option><option ', (p.Status === 'Nonaktif' ? 'selected' : ''), '>Nonaktif</option></select></div>',
      '<div></div>',
      '</div>',
      '<div class="grid grid-cols-2 gap-3">',
      '<div class="form-group"><label class="form-label">Kategori *</label><select class="form-select" id="pfKategori" required onchange="renderSubKategoriOptions(this.value)">', kategoriOptions, '</select></div>',
      '<div class="form-group"><label class="form-label">Sub-kategori</label><select class="form-select" id="pfSubKategori"></select></div>',
      '</div>',
      '<hr style="border-color:var(--border-color); margin:14px 0;">',
      '<p class="text-xs font-bold uppercase mb-2" style="color:var(--text-muted)">Badge &amp; Rating (opsional, tampil di Kartu Produk)</p>',
      '<div class="form-group"><label class="form-label">Badge/Label</label><input class="form-input" id="pfBadge" value="', escapeHtml(p.Badge || ''), '" placeholder="mis. Hemat B2B, Fresh Roast, Ready Stock"></div>',
      '<div class="grid grid-cols-2 gap-3">',
      '<div class="form-group"><label class="form-label">Rating (0-5)</label><input class="form-input" type="number" step="0.1" min="0" max="5" id="pfRating" value="', p.Rating || '', '"></div>',
      '<div class="form-group"><label class="form-label">Jumlah Ulasan</label><input class="form-input" type="number" min="0" id="pfJumlahUlasan" value="', p.JumlahUlasan || '', '"></div>',
      '</div>',
      '<div class="form-group">',
      '<label class="form-label">Foto 1 (Isi Produk)</label>',
      '<input class="form-input" type="file" id="pfFoto" accept="image/*">',
      p.FotoURL ? ('<div id="pfFotoURLPreviewWrap" style="display:flex; align-items:center; gap:8px; margin-top:6px;"><img src="' + p.FotoURL + '" style="height:56px;border-radius:6px;"><button type="button" class="btn-icon-sm" onclick="hapusFotoProduk(\'pfFotoURL\',\'pfFotoFileId\',\'pfFotoURLPreviewWrap\')" title="Hapus foto ini"><i class="bi bi-trash text-red-500"></i></button></div>') : '',
      '<input type="hidden" id="pfFotoURL" value="', p.FotoURL || '', '">',
      '<input type="hidden" id="pfFotoFileId" value="', p.FotoFileId || '', '">',
      '</div>',
      '<div class="form-group">',
      '<label class="form-label">Foto 2 (Kemasan) - opsional</label>',
      '<input class="form-input" type="file" id="pfFoto2" accept="image/*">',
      p.FotoURL2 ? ('<div id="pfFotoURL2PreviewWrap" style="display:flex; align-items:center; gap:8px; margin-top:6px;"><img src="' + p.FotoURL2 + '" style="height:56px;border-radius:6px;"><button type="button" class="btn-icon-sm" onclick="hapusFotoProduk(\'pfFotoURL2\',\'pfFotoFileId2\',\'pfFotoURL2PreviewWrap\')" title="Hapus foto ini"><i class="bi bi-trash text-red-500"></i></button></div>') : '',
      '<input type="hidden" id="pfFotoURL2" value="', p.FotoURL2 || '', '">',
      '<input type="hidden" id="pfFotoFileId2" value="', p.FotoFileId2 || '', '">',
      '</div>',
      '<button type="submit" class="btn-primary w-full" style="height:42px;"><i class="bi bi-check-lg"></i> Simpan Produk</button>',
      '</form>'
    ].join('');
    renderSubKategoriOptions(p.Kategori || Object.keys(struk)[0], p.SubKategori);
    openModal('previewModal');
}
function renderSubKategoriOptions(kategoriKey, selected) {
    const struk = AppState.kategoriStruktur || {};
    const el = document.getElementById('pfSubKategori');
    if (!el || !struk[kategoriKey])
        return;
    el.innerHTML = (struk[kategoriKey].sub || []).map(s => ('<option value="' + (s) + '" ' + (s === selected ? 'selected' : '') + '>' + (s) + '</option>')).join('');
}

function submitProdukForm(e) {
    e.preventDefault();
    if (!document.getElementById('pfUmkm').value.trim()) {
        showToast('Peringatan', 'Pilih Nama UMKM Pemilik dari daftar terlebih dahulu.', 'warning');
        document.getElementById('pfUmkmSearch').focus();
        return;
    }
    const record = {
        ID: document.getElementById('pfId').value || undefined,
        NamaProduk: document.getElementById('pfNama').value.trim(),
        NamaUMKM: document.getElementById('pfUmkm').value.trim(),
        Deskripsi: document.getElementById('pfDeskripsi').value.trim(),
        HargaNormal: Number(document.getElementById('pfHargaNormal').value) || 0,
        HargaPromo: document.getElementById('pfHargaPromo').value ? Number(document.getElementById('pfHargaPromo').value) : '',
        Satuan: document.getElementById('pfSatuan').value.trim() || 'pcs',
        MinimalOrder: document.getElementById('pfMinimalOrder').value.trim(),
        Kategori: document.getElementById('pfKategori').value,
        SubKategori: document.getElementById('pfSubKategori').value,
        FotoURL: document.getElementById('pfFotoURL').value,
        FotoFileId: document.getElementById('pfFotoFileId').value,
        FotoURL2: document.getElementById('pfFotoURL2').value,
        FotoFileId2: document.getElementById('pfFotoFileId2').value,
        Badge: document.getElementById('pfBadge').value.trim(),
        Rating: document.getElementById('pfRating').value ? Number(document.getElementById('pfRating').value) : '',
        JumlahUlasan: document.getElementById('pfJumlahUlasan').value ? Number(document.getElementById('pfJumlahUlasan').value) : '',
        Status: document.getElementById('pfStatus').value
    };
    const btn = e.target.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-inline"></span> Menyimpan...';
    btn.disabled = true;

    const finishSave = () => {
        const action = record.ID ? 'updateRecord' : 'addRecord';
        apiPost(action, { sheetName: 'Produk', record: record }).then(function(res) {
            btn.innerHTML = original;
            btn.disabled = false;
            if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }
            AppState.cache = {};
            showToast('Berhasil', res.message, 'success');
            closeModal('previewModal');
            loadAdminProduk();
        });
    };

    // Antre upload sampai 2 foto secara berurutan
    const uploadQueue = [
        { inputId: 'pfFoto', urlKey: 'FotoURL', fileIdKey: 'FotoFileId' },
        { inputId: 'pfFoto2', urlKey: 'FotoURL2', fileIdKey: 'FotoFileId2' }
    ].filter(function(item) {
        const input = document.getElementById(item.inputId);
        return input && input.files && input.files[0];
    });

    function processQueue(idx) {
        if (idx >= uploadQueue.length) { finishSave(); return; }
        const item = uploadQueue[idx];
        const file = document.getElementById(item.inputId).files[0];
        apiUploadFile(file, 'uploadFolderId').then(function(res) {
            if (res.success) {
                record[item.urlKey] = res.data.fileUrl;
                record[item.fileIdKey] = res.data.fileId;
                processQueue(idx + 1);
            } else {
                btn.innerHTML = original; btn.disabled = false;
                showToast('Error', res.message, 'danger');
            }
        });
    }

    processQueue(0);
}
