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
    loadAdminProduk();
}

/**
 * Satu permintaan gabungan (daftar UMKM untuk dropdown pencarian + daftar
 * Produk untuk tabel) lewat RPC get_admin_produk_page_data. Cache
 * sisi-klien dipakai supaya bolak-balik ke halaman ini cepat.
 */
function loadAdminProduk() {
    const cached = ambilDariCache('adminProdukPage');
    if (cached) {
        umkmListCache = cached.umkm_list || [];
        adminProdukCache = cached.produk_list || [];
        renderAdminProdukTable(adminProdukCache);
        return;
    }
    dbRpc('get_admin_produk_page_data').then(function(res) {
        const data = res.success ? res.data : { umkm_list: [], produk_list: [] };
        if (!res.success) showToast('Error', res.message, 'danger');
        simpanKeCache('adminProdukPage', data);
        umkmListCache = data.umkm_list || [];
        adminProdukCache = data.produk_list || [];
        renderAdminProdukTable(adminProdukCache);
    });
}
function filterAdminProduk() {
    const q = document.getElementById('adminProdukSearch').value.toLowerCase();
    renderAdminProdukTable(adminProdukCache.filter(p => (p.nama_produk || '').toLowerCase().includes(q) || (p.nama_umkm || '').toLowerCase().includes(q)));
}

function renderAdminProdukTable(items) {
    const tbody = document.getElementById('adminProdukTbody');
    if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4" style="color:var(--text-muted)">Belum ada produk.</td></tr>';
        return;
    }
    tbody.innerHTML = items.map(p => ('\n    <tr>\n      <td>' + (p.foto_url ? ('<img src="' + (p.foto_url) + '" style="width:44px;height:44px;object-fit:cover;border-radius:6px;">') : '<div style="width:44px;height:44px;background:#f1f5f9;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#cbd5e1;"><i class="bi bi-image"></i></div>') + '</td>\n      <td class="font-semibold" style="color:var(--text-primary)">' + (escapeHtml(p.nama_produk)) + '</td>\n      <td>' + (escapeHtml(p.nama_umkm)) + '</td>\n      <td>' + (escapeHtml(p.kategori)) + ' <span style="color:var(--text-muted)">/ ' + (escapeHtml(p.sub_kategori)) + '</span></td>\n      <td>' + (formatRupiah(p.harga_promo || p.harga_normal)) + (p.harga_promo ? ('<br><span class="price-old">' + (formatRupiah(p.harga_normal)) + '</span>') : '') + '</td>\n      <td><span class="status-pill ' + (p.status === 'Aktif' ? 'aktif' : 'nonaktif') + '">' + (escapeHtml(p.status)) + '</span></td>\n      <td class="whitespace-nowrap">\n        <button class="btn-icon-sm" onclick=\'openProdukForm(' + (JSON.stringify(p)) + ')\' title="Edit"><i class="bi bi-pencil"></i></button>\n        <button class="btn-icon-sm" onclick=\'confirmDeleteRecord(' + JSON.stringify('produk') + ',' + JSON.stringify(p.id) + ', loadAdminProduk, [' + JSON.stringify(p.foto_path || '') + ',' + JSON.stringify(p.foto_path2 || '') + '])\' title="Hapus"><i class="bi bi-trash text-red-500"></i></button>\n      </td>\n    </tr>\n  ')).join('');
}

/**
 * Hapus foto produk (URL + FileId sekaligus) SEBELUM menyimpan, supaya
 * tidak tertimpa/konflik saat mengganti foto. File LAMA-nya langsung
 * dihapus dari Drive saat ini juga (bukan ditunda sampai form disimpan).
 */
function hapusFotoProduk(urlId, pathId, wrapId) {
    const fileId = document.getElementById(pathId).value;
    if (fileId) deleteFile(fileId);
    const urlInput = document.getElementById(urlId);
    if (urlInput) urlInput.value = '';
    const pathInput = document.getElementById(pathId);
    if (pathInput) pathInput.value = '';
    const wrap = document.getElementById(wrapId);
    if (wrap) wrap.remove();
    showToast('Info', 'Foto dihapus.', 'info');
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
        return !q || (u.nama_umkm || '').toLowerCase().includes(q);
    });
    if (!list.length) {
        panel.innerHTML = '<div class="umkm-dropdown-empty">Tidak ada UMKM yang cocok.</div>';
        return;
    }
    panel.innerHTML = list.map(function(u) {
        const nama = escapeHtml(u.nama_umkm || '');
        return "<div class='umkm-dropdown-item' onclick='pilihUmkmDropdown(" + JSON.stringify(u.nama_umkm || '') + ")'>" + nama + '</div>';
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
    const kategoriOptions = Object.keys(struk).map(function(k) { return '<option value="' + k + '" ' + (p.kategori === k ? 'selected' : '') + '>' + (struk[k].label || k) + '</option>'; }).join('');
    document.getElementById('previewModalTitle').textContent = p.id ? 'Edit Produk' : 'Tambah Produk Baru';
    document.getElementById('previewModalContent').innerHTML = [
      '<form id="produkForm" class="text-left" onsubmit="submitProdukForm(event)">',
      '<input type="hidden" id="pfId" value="', p.id || '', '">',
      '<div class="form-group"><label class="form-label">Nama Produk *</label><input class="form-input" id="pfNama" required value="', escapeHtml(p.nama_produk || ''), '"></div>',
      '<div class="form-group" style="position:relative;">',
      '<label class="form-label">Nama UMKM Pemilik *</label>',
      '<input type="text" class="form-input" id="pfUmkmSearch" autocomplete="off" placeholder="Ketik untuk mencari UMKM..." value="', escapeHtml(p.nama_umkm || ''), '" onfocus="bukaDropdownUmkm()" oninput="filterDropdownUmkm(this.value)">',
      '<input type="hidden" id="pfUmkm" value="', escapeHtml(p.nama_umkm || ''), '">',
      '<div id="pfUmkmDropdown" class="umkm-dropdown-panel hidden"></div>',
      (!umkmListCache || !umkmListCache.length) ? '<p class="text-xs mt-1" style="color:#d97706;">Belum ada UMKM terdaftar. Tambahkan dulu di menu Data UMKM.</p>' : '',
      '</div>',
      '<div class="form-group"><label class="form-label">Deskripsi</label><textarea class="form-textarea" id="pfDeskripsi">', escapeHtml(p.deskripsi || ''), '</textarea></div>',
      '<div class="grid grid-cols-2 gap-3">',
      '<div class="form-group"><label class="form-label">Harga Normal (Rp) *</label><input class="form-input" type="number" id="pfHargaNormal" required value="', p.harga_normal || '', '"></div>',
      '<div class="form-group"><label class="form-label">Harga Coret/Promo (Rp)</label><input class="form-input" type="number" id="pfHargaPromo" value="', p.harga_promo || '', '"></div>',
      '</div>',
      '<div class="grid grid-cols-2 gap-3">',
      '<div class="form-group"><label class="form-label">Satuan</label><input class="form-input" id="pfSatuan" value="', escapeHtml(p.satuan || 'pcs'), '"></div>',
      '<div class="form-group"><label class="form-label">Minimal Order</label><input class="form-input" id="pfMinimalOrder" value="', escapeHtml(p.minimal_order || ''), '" placeholder="mis. 10 box, 5 pcs"></div>',
      '</div>',
      '<div class="grid grid-cols-2 gap-3">',
      '<div class="form-group"><label class="form-label">Status</label><select class="form-select" id="pfStatus"><option ', (p.status === 'Aktif' ? 'selected' : ''), '>Aktif</option><option ', (p.status === 'Nonaktif' ? 'selected' : ''), '>Nonaktif</option></select></div>',
      '<div></div>',
      '</div>',
      '<div class="grid grid-cols-2 gap-3">',
      '<div class="form-group"><label class="form-label">Kategori *</label><select class="form-select" id="pfKategori" required onchange="renderSubKategoriOptions(this.value)">', kategoriOptions, '</select></div>',
      '<div class="form-group"><label class="form-label">Sub-kategori</label><select class="form-select" id="pfSubKategori"></select></div>',
      '</div>',
      '<hr style="border-color:var(--border-color); margin:14px 0;">',
      '<p class="text-xs font-bold uppercase mb-2" style="color:var(--text-muted)">Cara Pemesanan</p>',
      '<div class="form-group">',
      '<label class="form-label">Tipe Pemesanan</label>',
      '<select class="form-select" id="pfTipePemesanan" onchange="toggleBagianPaket(this.value)">',
      '<option value="Standar" ', (p.tipe_pemesanan === 'Standar' || !p.tipe_pemesanan ? 'selected' : ''), '>Standar - langsung masuk keranjang</option>',
      '<option value="Paket" ', (p.tipe_pemesanan === 'Paket' ? 'selected' : ''), '>Paket - customer pilih salah satu varian menu dulu</option>',
      '<option value="Custom" ', (p.tipe_pemesanan === 'Custom' ? 'selected' : ''), '>Custom - customer isi budget &amp; menu sendiri</option>',
      '</select>',
      '</div>',
      '<div id="pfPaketSection" class="', (p.tipe_pemesanan === 'Paket' ? '' : 'hidden'), '">',
      '<label class="form-label">Daftar Paket</label>',
      '<div id="pfPaketRows"></div>',
      '<button type="button" class="btn-ghost w-full mb-3" onclick="tambahBarisPaket()"><i class="bi bi-plus-lg"></i> Tambah Paket</button>',
      '</div>',
      '<hr style="border-color:var(--border-color); margin:14px 0;">',
      '<p class="text-xs font-bold uppercase mb-2" style="color:var(--text-muted)">Badge &amp; Rating (opsional, tampil di Kartu Produk)</p>',
      '<div class="form-group"><label class="form-label">Badge/Label</label><input class="form-input" id="pfBadge" value="', escapeHtml(p.badge || ''), '" placeholder="mis. Hemat B2B, Fresh Roast, Ready Stock"></div>',
      '<div class="grid grid-cols-2 gap-3">',
      '<div class="form-group"><label class="form-label">Rating (0-5)</label><input class="form-input" type="number" step="0.1" min="0" max="5" id="pfRating" value="', p.rating || '', '"></div>',
      '<div class="form-group"><label class="form-label">Jumlah Ulasan</label><input class="form-input" type="number" min="0" id="pfJumlahUlasan" value="', p.jumlah_ulasan || '', '"></div>',
      '</div>',
      '<div class="form-group">',
      '<label class="form-label">Foto 1 (Isi Produk)</label>',
      '<input class="form-input" type="file" id="pfFoto" accept="image/*">',
      p.foto_url ? ('<div id="pfFotoURLPreviewWrap" style="display:flex; align-items:center; gap:8px; margin-top:6px;"><img src="' + p.foto_url + '" style="height:56px;border-radius:6px;"><button type="button" class="btn-icon-sm" onclick="hapusFotoProduk(\'pfFotoURL\',\'pfFotoPath\',\'pfFotoURLPreviewWrap\')" title="Hapus foto ini"><i class="bi bi-trash text-red-500"></i></button></div>') : '',
      '<input type="hidden" id="pfFotoURL" value="', p.foto_url || '', '">',
      '<input type="hidden" id="pfFotoPath" value="', p.foto_path || '', '">',
      '</div>',
      '<div class="form-group">',
      '<label class="form-label">Foto 2 (Kemasan) - opsional</label>',
      '<input class="form-input" type="file" id="pfFoto2" accept="image/*">',
      p.foto_url2 ? ('<div id="pfFotoURL2PreviewWrap" style="display:flex; align-items:center; gap:8px; margin-top:6px;"><img src="' + p.foto_url2 + '" style="height:56px;border-radius:6px;"><button type="button" class="btn-icon-sm" onclick="hapusFotoProduk(\'pfFotoURL2\',\'pfFotoPath2\',\'pfFotoURL2PreviewWrap\')" title="Hapus foto ini"><i class="bi bi-trash text-red-500"></i></button></div>') : '',
      '<input type="hidden" id="pfFotoURL2" value="', p.foto_url2 || '', '">',
      '<input type="hidden" id="pfFotoPath2" value="', p.foto_path2 || '', '">',
      '</div>',
      '<button type="submit" class="btn-primary w-full" style="height:42px;"><i class="bi bi-check-lg"></i> Simpan Produk</button>',
      '</form>'
    ].join('');
    renderSubKategoriOptions(p.kategori || Object.keys(struk)[0], p.sub_kategori);
    pfPaketRows = [];
    if (p.id && p.tipe_pemesanan === 'Paket') {
        dbSelect('produk_paket', { eq: { produk_id: p.id }, order: 'urutan' }).then(function(res) {
            pfPaketRows = res.success ? res.data.map(function(pk) { return { nama_paket: pk.nama_paket, deskripsi_menu: pk.deskripsi_menu || '', harga: pk.harga }; }) : [];
            renderBarisPaket();
        });
    } else {
        renderBarisPaket();
    }
    openModal('previewModal');
}
/**
 * Pengelolaan baris Daftar Paket (tipe_pemesanan = 'Paket') - dikelola
 * sebagai array di memori selagi form terbuka, baru disinkronkan ke tabel
 * produk_paket saat Simpan Produk diklik (lihat submitProdukForm).
 */
let pfPaketRows = [];
function toggleBagianPaket(tipe) {
    const section = document.getElementById('pfPaketSection');
    if (!section) return;
    section.classList.toggle('hidden', tipe !== 'Paket');
    if (tipe === 'Paket' && !pfPaketRows.length) tambahBarisPaket();
}
function tambahBarisPaket() {
    pfPaketRows.push({ nama_paket: '', deskripsi_menu: '', harga: '' });
    renderBarisPaket();
}
function hapusBarisPaket(idx) {
    pfPaketRows.splice(idx, 1);
    renderBarisPaket();
}
function ubahBarisPaket(idx, field, value) {
    pfPaketRows[idx][field] = value;
}
function renderBarisPaket() {
    const wrap = document.getElementById('pfPaketRows');
    if (!wrap) return;
    wrap.innerHTML = pfPaketRows.map(function(row, idx) {
        return [
          '<div class="card p-3 mb-2" style="position:relative;">',
          '<button type="button" class="btn-icon-sm" style="position:absolute; top:6px; right:6px;" onclick="hapusBarisPaket(' + idx + ')" title="Hapus paket ini"><i class="bi bi-trash text-red-500"></i></button>',
          '<div class="form-group" style="margin-bottom:8px;"><label class="form-label">Nama Paket</label><input class="form-input" value="' + escapeHtml(row.nama_paket) + '" oninput="ubahBarisPaket(' + idx + ',\'nama_paket\',this.value)" placeholder="mis. Paket A"></div>',
          '<div class="form-group" style="margin-bottom:8px;"><label class="form-label">Isi Menu</label><textarea class="form-textarea" oninput="ubahBarisPaket(' + idx + ',\'deskripsi_menu\',this.value)" placeholder="mis. Nasi kuning, ayam goreng, sambal, kerupuk">' + escapeHtml(row.deskripsi_menu) + '</textarea></div>',
          '<div class="form-group" style="margin-bottom:0;"><label class="form-label">Harga Khusus Paket Ini (Rp) - opsional</label><input class="form-input" type="number" value="' + (row.harga == null ? '' : row.harga) + '" oninput="ubahBarisPaket(' + idx + ',\'harga\',this.value)" placeholder="Kosongkan = pakai Harga Normal produk"></div>',
          '</div>'
        ].join('');
    }).join('') || '<p class="text-xs" style="color:var(--text-muted)">Belum ada paket. Klik "Tambah Paket" di bawah.</p>';
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
        nama_produk: document.getElementById('pfNama').value.trim(),
        nama_umkm: document.getElementById('pfUmkm').value.trim(),
        deskripsi: document.getElementById('pfDeskripsi').value.trim(),
        harga_normal: Number(document.getElementById('pfHargaNormal').value) || 0,
        harga_promo: document.getElementById('pfHargaPromo').value ? Number(document.getElementById('pfHargaPromo').value) : null,
        satuan: document.getElementById('pfSatuan').value.trim() || 'pcs',
        minimal_order: document.getElementById('pfMinimalOrder').value.trim(),
        kategori: document.getElementById('pfKategori').value,
        sub_kategori: document.getElementById('pfSubKategori').value,
        foto_url: document.getElementById('pfFotoURL').value,
        foto_path: document.getElementById('pfFotoPath').value,
        foto_url2: document.getElementById('pfFotoURL2').value,
        foto_path2: document.getElementById('pfFotoPath2').value,
        badge: document.getElementById('pfBadge').value.trim(),
        rating: document.getElementById('pfRating').value ? Number(document.getElementById('pfRating').value) : 0,
        jumlah_ulasan: document.getElementById('pfJumlahUlasan').value ? Number(document.getElementById('pfJumlahUlasan').value) : 0,
        status: document.getElementById('pfStatus').value,
        tipe_pemesanan: document.getElementById('pfTipePemesanan').value
    };
    const produkId = document.getElementById('pfId').value || null;
    const btn = e.target.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-inline"></span> Menyimpan...';
    btn.disabled = true;

    /** Sinkronkan daftar paket (tabel produk_paket) setelah produk induk tersimpan. */
    const syncPaket = (finalProdukId) => {
        return dbDeleteWhere('produk_paket', 'produk_id', finalProdukId).then(function() {
            if (record.tipe_pemesanan !== 'Paket') return { success: true };
            const rows = pfPaketRows
                .filter(function(r) { return r.nama_paket.trim(); })
                .map(function(r) {
                    return {
                        produk_id: finalProdukId, nama_paket: r.nama_paket.trim(),
                        deskripsi_menu: (r.deskripsi_menu || '').trim(),
                        harga: r.harga === '' || r.harga == null ? null : Number(r.harga),
                        urutan: pfPaketRows.indexOf(r) + 1
                    };
                });
            return dbInsertMany('produk_paket', rows);
        });
    };

    const finishSave = () => {
        const promise = produkId ? dbUpdate('produk', produkId, record) : dbInsert('produk', record);
        promise.then(function(res) {
            if (!res.success) {
                btn.innerHTML = original;
                btn.disabled = false;
                showToast('Gagal', res.message, 'danger');
                return;
            }
            const finalProdukId = produkId || res.data.id;
            syncPaket(finalProdukId).then(function() {
                btn.innerHTML = original;
                btn.disabled = false;
                AppState.cache = {};
                showToast('Berhasil', res.message, 'success');
                closeModal('previewModal');
                loadAdminProduk();
            });
        });
    };

    // Antre upload sampai 2 foto secara berurutan. Kalau ada foto LAMA yang
    // digantikan foto baru, foto lama dihapus dari Drive setelah upload
    // yang baru berhasil (supaya tidak ada jeda tanpa foto kalau upload gagal).
    const uploadQueue = [
        { inputId: 'pfFoto', urlKey: 'foto_url', pathKey: 'foto_path' },
        { inputId: 'pfFoto2', urlKey: 'foto_url2', pathKey: 'foto_path2' }
    ].filter(function(item) {
        const input = document.getElementById(item.inputId);
        return input && input.files && input.files[0];
    });

    function processQueue(idx) {
        if (idx >= uploadQueue.length) { finishSave(); return; }
        const item = uploadQueue[idx];
        const file = document.getElementById(item.inputId).files[0];
        const oldFileId = record[item.pathKey];
        uploadFile(file, 'uploadFolderId').then(function(res) {
            if (res.success) {
                record[item.urlKey] = res.data.url;
                record[item.pathKey] = res.data.fileId;
                if (oldFileId && oldFileId !== res.data.fileId) deleteFile(oldFileId);
                processQueue(idx + 1);
            } else {
                btn.innerHTML = original; btn.disabled = false;
                showToast('Error', res.message, 'danger');
            }
        });
    }

    processQueue(0);
}
