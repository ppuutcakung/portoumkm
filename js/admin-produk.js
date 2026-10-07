/**
 * ============================================================
 * PortoUMKM - Admin: Manajemen Produk
 * ============================================================
 */
let adminProdukCache = [];
let umkmListCache = [];
const ADMIN_PRODUK_PER_HALAMAN = 25;
let adminProdukFilterKategori = 'Semua';
let adminProdukHalaman = 1;

function renderAdminProdukPage() {
    const container = document.getElementById('app-container');
    container.innerHTML = adminPageShell('Manajemen Produk (CRUD)', '\n    <div class="flex items-center justify-between mb-3 flex-wrap gap-2">\n      <div class="search-box" style="width:280px;"><i class="bi bi-search"></i><input id="adminProdukSearch" placeholder="Cari produk..." oninput="filterAdminProduk()"></div>\n      <button class="btn-primary" onclick="openProdukForm()"><i class="bi bi-plus-lg"></i> Tambah Produk</button>\n    </div>\n    <div class="flex flex-wrap gap-2 mb-3" id="adminProdukKategoriChips"></div>\n    <div class="table-wrap">\n      <table class="data-table">\n        <thead><tr><th>Foto</th><th>Nama Produk</th><th>UMKM</th><th>Kategori</th><th>Harga</th><th>Status</th><th></th></tr></thead>\n        <tbody id="adminProdukTbody"><tr><td colspan="7" class="text-center py-4">Memuat...</td></tr></tbody>\n      </table>\n    </div>\n    <div id="adminProdukPagination" class="pagination"></div>\n  ');
    adminProdukFilterKategori = 'Semua';
    adminProdukHalaman = 1;
    renderAdminProdukKategoriChips();
    loadAdminProduk();
}
function renderAdminProdukKategoriChips() {
    const chipsList = [
        { key: 'Semua', label: 'Semua Kategori' },
        { key: 'PortoRasa', label: 'Kuliner' },
        { key: 'PortoKriya', label: 'Kerajinan' },
        { key: 'PortoTani', label: 'Pertanian' }
    ];
    const wrap = document.getElementById('adminProdukKategoriChips');
    if (!wrap) return;
    wrap.innerHTML = chipsList.map(function(c) {
        return '<button class="chip chip-solid ' + (adminProdukFilterKategori === c.key ? 'active' : '') + '" onclick="setAdminProdukKategori(\'' + c.key + '\')">' + c.label + '</button>';
    }).join('');
}
function setAdminProdukKategori(kategori) {
    adminProdukFilterKategori = kategori;
    adminProdukHalaman = 1;
    renderAdminProdukKategoriChips();
    filterAdminProduk();
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
        filterAdminProduk();
    });
}
/** Gabungan filter kategori + pencarian teks, lalu render halaman saat ini (reset ke halaman 1 kalau filter berubah). */
function filterAdminProduk(resetHalaman) {
    if (resetHalaman !== false) adminProdukHalaman = 1;
    const q = (document.getElementById('adminProdukSearch').value || '').toLowerCase();
    const filtered = adminProdukCache.filter(function(p) {
        const cocokKategori = adminProdukFilterKategori === 'Semua' || p.kategori === adminProdukFilterKategori;
        const cocokCari = !q || (p.nama_produk || '').toLowerCase().includes(q) || (p.nama_umkm || '').toLowerCase().includes(q);
        return cocokKategori && cocokCari;
    });
    renderAdminProdukTable(filtered);
}
function gotoAdminProdukHalaman(h) {
    adminProdukHalaman = h;
    filterAdminProduk(false);
    window.scrollTo(0, 0);
}

function renderAdminProdukTable(items) {
    const tbody = document.getElementById('adminProdukTbody');
    if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4" style="color:var(--text-muted)">Belum ada produk.</td></tr>';
        document.getElementById('adminProdukPagination').innerHTML = '';
        return;
    }
    const totalHalaman = Math.max(Math.ceil(items.length / ADMIN_PRODUK_PER_HALAMAN), 1);
    if (adminProdukHalaman > totalHalaman) adminProdukHalaman = totalHalaman;
    const mulai = (adminProdukHalaman - 1) * ADMIN_PRODUK_PER_HALAMAN;
    const halamanIni = items.slice(mulai, mulai + ADMIN_PRODUK_PER_HALAMAN);

    // Tombol Edit/Hapus HANYA membawa ID produk. Sebelumnya seluruh data produk diselipkan ke atribut HTML,
    // sehingga produk yang namanya/deskripsinya memuat tanda kutip (') tombol Edit-nya mati.
    tbody.innerHTML = halamanIni.map(function(p) {
        const id = idAman(p.id);
        const foto = p.foto_url
            ? '<img src="' + escapeAttr(p.foto_url) + '" style="width:44px;height:44px;object-fit:cover;border-radius:6px;" alt="">'
            : '<div style="width:44px;height:44px;background:#f1f5f9;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#cbd5e1;"><i class="bi bi-image"></i></div>';
        const harga = Number(p.harga_promo || p.harga_normal) || 0;
        const modeBadge = (p.tersedia_ritel !== false ? '<span class="pf-badge-mode pf-badge-b2c">B2C</span>' : '') + (p.tersedia_grosir ? '<span class="pf-badge-mode pf-badge-b2b">B2B</span>' : '');
        return [
          '<tr>',
          '<td>' + foto + '</td>',
          '<td class="font-semibold" style="color:var(--text-primary)">' + escapeHtml(p.nama_produk) + '</td>',
          '<td>' + escapeHtml(p.nama_umkm) + '</td>',
          '<td>' + escapeHtml(p.kategori) + ' <span style="color:var(--text-muted)">/ ' + escapeHtml(p.sub_kategori) + '</span></td>',
          '<td>' + (harga ? formatRupiah(harga) : '<span style="color:var(--text-muted)">-</span>') + (p.harga_promo ? ('<br><span class="price-old">' + formatRupiah(p.harga_normal) + '</span>') : '') + '</td>',
          '<td><span class="status-pill ' + (p.status === 'Aktif' ? 'aktif' : 'nonaktif') + '">' + escapeHtml(p.status) + '</span><div style="margin-top:4px;">' + modeBadge + '</div></td>',
          '<td class="whitespace-nowrap">',
          '<button class="btn-icon-sm" onclick="editProdukById(\'' + id + '\')" title="Edit"><i class="bi bi-pencil"></i></button> ',
          '<button class="btn-icon-sm" onclick="hapusProdukById(\'' + id + '\')" title="Hapus"><i class="bi bi-trash text-red-500"></i></button>',
          '</td>',
          '</tr>'
        ].join('');
    }).join('');

    const pagEl = document.getElementById('adminProdukPagination');
    if (!pagEl) return;
    if (totalHalaman <= 1) { pagEl.innerHTML = ''; return; }
    let html = '<button class="page-btn" ' + (adminProdukHalaman <= 1 ? 'disabled' : '') + ' onclick="gotoAdminProdukHalaman(' + (adminProdukHalaman - 1) + ')"><i class="bi bi-chevron-left"></i></button>';
    for (let i = 1; i <= totalHalaman; i++) {
        if (i === 1 || i === totalHalaman || Math.abs(i - adminProdukHalaman) <= 1) {
            html += '<button class="page-btn ' + (i === adminProdukHalaman ? 'active' : '') + '" onclick="gotoAdminProdukHalaman(' + i + ')">' + i + '</button>';
        } else if (Math.abs(i - adminProdukHalaman) === 2) {
            html += '<span class="px-1">...</span>';
        }
    }
    html += '<button class="page-btn" ' + (adminProdukHalaman >= totalHalaman ? 'disabled' : '') + ' onclick="gotoAdminProdukHalaman(' + (adminProdukHalaman + 1) + ')"><i class="bi bi-chevron-right"></i></button>';
    pagEl.innerHTML = html;
}


function editProdukById(id) {
    const p = adminProdukCache.find(function(x) { return x.id === id; });
    if (!p) { showToast('Gagal', 'Data produk tidak ditemukan. Muat ulang halaman lalu coba lagi.', 'danger'); return; }
    openProdukForm(p);
}
function hapusProdukById(id) {
    const p = adminProdukCache.find(function(x) { return x.id === id; });
    if (!p) { showToast('Gagal', 'Data produk tidak ditemukan. Muat ulang halaman lalu coba lagi.', 'danger'); return; }
    confirmDeleteRecord('produk', id, loadAdminProduk, fileIdsProduk(p));
}

/** Foto produk sebagai [{url, path}] - dari galeri; cadangan ke kolom foto lama kalau galeri belum terisi. */
function galeriDariProduk(p) {
    const g = (Array.isArray(p.foto_galeri) ? p.foto_galeri : []).filter(function(x) { return x && x.url; }).map(function(x) { return { url: x.url, path: x.path || '' }; });
    if (g.length) return g;
    const lama = [];
    if (p.foto_url) lama.push({ url: p.foto_url, path: p.foto_path || '' });
    if (p.foto_url2) lama.push({ url: p.foto_url2, path: p.foto_path2 || '' });
    return lama;
}
/** Semua ID file Google Drive milik produk (galeri + kolom foto lama), tanpa duplikat. */
function fileIdsProduk(p) {
    const ids = [];
    galeriDariProduk(p).forEach(function(f) { if (f.path) ids.push(f.path); });
    [p.foto_path, p.foto_path2].forEach(function(x) { if (x) ids.push(x); });
    return Array.from(new Set(ids));
}

/**
 * Dropdown UMKM yang bisa dicari dengan mengetik (searchable). Pilihan memakai
 * NOMOR URUT (bukan nama UMKM di atribut HTML), supaya UMKM yang namanya
 * memuat tanda kutip tetap bisa dipilih.
 */
let umkmDropdownList = [];
function renderUmkmDropdownOptions(filterText) {
    const panel = document.getElementById('pfUmkmDropdown');
    if (!panel) return;
    const q = (filterText || '').trim().toLowerCase();
    umkmDropdownList = (umkmListCache || []).map(function(u) { return u.nama_umkm || ''; }).filter(function(n) {
        return !q || n.toLowerCase().includes(q);
    });
    if (!umkmDropdownList.length) {
        panel.innerHTML = '<div class="umkm-dropdown-empty">Tidak ada UMKM yang cocok.</div>';
        return;
    }
    panel.innerHTML = umkmDropdownList.map(function(nama, i) {
        return '<div class="umkm-dropdown-item" onclick="pilihUmkmIdx(' + i + ')">' + escapeHtml(nama) + '</div>';
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
function pilihUmkmIdx(i) {
    const nama = umkmDropdownList[i];
    if (nama === undefined) return;
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

// ============================================================
// FORM PRODUK: galeri foto (maks 10), mode B2C/B2B + tier harga,
// sertifikat, warna, ketahanan simpan
// ============================================================
const MAKS_FOTO_PRODUK = 10;
/** Pilihan ceklis sertifikat menurut kategori. "Sertifikat lain" tersedia untuk kebutuhan di luar daftar ini. */
const SERTIFIKASI_PILIHAN = {
    PortoRasa: ['Halal', 'P-IRT', 'BPOM', 'NIB'],
    PortoKriya: ['NIB', 'Batikmark', 'Merek Terdaftar', 'SNI'],
    PortoTani: ['Halal', 'P-IRT', 'Organik Indonesia', 'Fairtrade', 'NIB'],
    _umum: ['Halal', 'P-IRT', 'BPOM', 'NIB']
};
let pfFotoList = [];    // foto tersimpan [{url, path}] - urutan pertama = foto utama
let pfFotoBaru = [];    // foto yang baru dipilih, belum diunggah [{file, previewUrl}]
let pfFotoHapus = [];   // ID Drive foto lama yang dibuang; baru dihapus dari Drive SETELAH produk berhasil disimpan
let pfTierRows = [];    // [{qty_min, harga, keterangan}]
let pfSertifikasi = []; // [{nama, nomor}]
let pfFormToken = 0;    // mencegah hasil muat data form lama menimpa form yang baru dibuka

function openProdukForm(p) {
    p = p || {};
    const token = ++pfFormToken;
    const struk = AppState.kategoriStruktur || {};
    const kategoriAwal = p.kategori || Object.keys(struk)[0];
    const kategoriOptions = Object.keys(struk).map(function(k) {
        return '<option value="' + escapeAttr(k) + '" ' + (kategoriAwal === k ? 'selected' : '') + '>' + escapeHtml(struk[k].label || k) + '</option>';
    }).join('');
    pfFotoList = galeriDariProduk(p);
    pfFotoBaru = [];
    pfFotoHapus = [];
    pfSertifikasi = (Array.isArray(p.sertifikasi) ? p.sertifikasi : []).map(function(s) {
        return typeof s === 'string' ? { nama: s, nomor: '' } : { nama: s.nama || '', nomor: s.nomor || '' };
    });
    pfTierRows = [];
    pfPaketRows = [];
    const tipe = p.tipe_pemesanan || 'Standar';
    const ritel = p.tersedia_ritel !== false;
    const grosir = p.tersedia_grosir === true;
    const hargaNormalVal = (p.harga_normal === null || p.harga_normal === undefined) ? '' : p.harga_normal;
    document.getElementById('previewModalTitle').textContent = p.id ? 'Edit Produk' : 'Tambah Produk Baru';
    document.getElementById('previewModalContent').innerHTML = [
      '<form id="produkForm" class="text-left" onsubmit="submitProdukForm(event)">',
      '<input type="hidden" id="pfId" value="', escapeAttr(p.id || ''), '">',
      '<div class="form-group"><label class="form-label">Nama Produk *</label><input class="form-input" id="pfNama" required value="', escapeAttr(p.nama_produk || ''), '"></div>',
      '<div class="form-group" style="position:relative;">',
      '<label class="form-label">Nama UMKM Pemilik *</label>',
      '<input type="text" class="form-input" id="pfUmkmSearch" autocomplete="off" placeholder="Ketik untuk mencari UMKM..." value="', escapeAttr(p.nama_umkm || ''), '" onfocus="bukaDropdownUmkm()" oninput="filterDropdownUmkm(this.value)">',
      '<input type="hidden" id="pfUmkm" value="', escapeAttr(p.nama_umkm || ''), '">',
      '<div id="pfUmkmDropdown" class="umkm-dropdown-panel hidden"></div>',
      (!umkmListCache || !umkmListCache.length) ? '<p class="text-xs mt-1" style="color:#d97706;">Belum ada UMKM terdaftar. Tambahkan dulu di menu Data UMKM.</p>' : '',
      '</div>',
      '<div class="form-group"><label class="form-label">Deskripsi</label><textarea class="form-textarea" id="pfDeskripsi">', escapeHtml(p.deskripsi || ''), '</textarea></div>',
      '<div class="grid grid-cols-2 gap-3">',
      '<div class="form-group"><label class="form-label" id="pfHargaNormalLabel">Harga Normal (Rp) *</label><input class="form-input" type="number" min="0" id="pfHargaNormal" value="', escapeAttr(hargaNormalVal), '"></div>',
      '<div class="form-group"><label class="form-label">Harga Coret/Promo (Rp)</label><input class="form-input" type="number" min="0" id="pfHargaPromo" value="', escapeAttr(p.harga_promo || ''), '"></div>',
      '</div>',
      '<div class="grid grid-cols-2 gap-3">',
      '<div class="form-group"><label class="form-label">Satuan</label><input class="form-input" id="pfSatuan" value="', escapeAttr(p.satuan || 'pcs'), '"></div>',
      '<div class="form-group"><label class="form-label">Minimal Order</label><input class="form-input" id="pfMinimalOrder" value="', escapeAttr(p.minimal_order || ''), '" placeholder="mis. 10 box, 5 pcs"></div>',
      '</div>',
      '<div class="grid grid-cols-2 gap-3">',
      '<div class="form-group"><label class="form-label">Status</label><select class="form-select" id="pfStatus"><option ', (p.status === 'Aktif' ? 'selected' : ''), '>Aktif</option><option ', (p.status === 'Nonaktif' ? 'selected' : ''), '>Nonaktif</option></select></div>',
      '<div class="form-group"><label class="form-label">Ketahanan Simpan (opsional)</label><input class="form-input" id="pfKetahanan" value="', escapeAttr(p.ketahanan_simpan || ''), '" placeholder="mis. 12 Bulan (Suhu Ruang)"></div>',
      '</div>',
      '<div class="grid grid-cols-2 gap-3">',
      '<div class="form-group"><label class="form-label">Kategori *</label><select class="form-select" id="pfKategori" required onchange="gantiKategoriForm(this.value)">', kategoriOptions, '</select></div>',
      '<div class="form-group"><label class="form-label">Sub-kategori</label><select class="form-select" id="pfSubKategori" onchange="toggleSubLainnya()"></select></div>',
      '</div>',
      '<div class="form-group hidden" id="pfSubLainnyaWrap"><label class="form-label">Tulis Sub-kategori Sendiri *</label>',
      '<input class="form-input" id="pfSubLainnya" maxlength="60" placeholder="mis. Katering Harian">',
      '<p class="pf-foto-info">Teks ini otomatis muncul sebagai Tag Cepat di katalog publik.</p></div>',
      '<div class="form-group hidden" id="pfWarnaWrap"><label class="form-label">Pilihan Warna (pisahkan dengan koma)</label>',
      '<input class="form-input" id="pfWarna" value="', escapeAttr(daftarWarna(p).join(', ')), '" placeholder="mis. Merah, Biru, Hijau">',
      '<p class="pf-foto-info">Pelanggan wajib memilih salah satu warna saat memesan (mode Ritel). Warna yang dipilih ikut tercatat di keranjang, pesan WhatsApp, dan data pesanan.</p></div>',

      '<div class="pf-section">',
      '<div class="pf-section-title">Tampil di mode</div>',
      '<label class="pf-cek"><input type="checkbox" id="pfRitel" ', (ritel ? 'checked' : ''), ' onchange="perbaruiAturanForm()"> B2C Ritel (eceran, lewat keranjang)</label>',
      '<label class="pf-cek"><input type="checkbox" id="pfGrosir" ', (grosir ? 'checked' : ''), ' onchange="perbaruiAturanForm()"> B2B Grosir (harga bertingkat, pesanan lewat RFQ)</label>',
      '<div id="pfGrosirSection" class="hidden" style="margin-top:10px;">',
      '<div id="pfRfqWrap" class="hidden" style="margin-bottom:10px;">',
      '<label class="pf-cek"><input type="checkbox" id="pfTampilkanRfq" ', (p.tampilkan_rfq === false ? '' : 'checked'), ' onchange="perbaruiAturanForm()"> Tampilkan tombol "Ajukan RFQ B2B"</label>',
      '<p class="pf-foto-info">Produk Kuliner &amp; Pertanian bisa dipesan langsung karena harganya sudah tetap. Centang ini tetap menyediakan jalur pengajuan harga khusus (RFQ). Untuk Kerajinan, RFQ selalu tampil dan tidak bisa dimatikan.</p>',
      '</div>',
      '<div class="form-group"><label class="form-label">MOQ Grosir (jumlah minimal order)</label><input class="form-input" type="number" min="1" id="pfMoq" value="', escapeAttr(p.moq_grosir || ''), '" placeholder="mis. 10">',
      '<p class="pf-foto-info">Kalau Anda mengisi tier harga di bawah, MOQ otomatis mengikuti jumlah tier pertama.</p></div>',
      '<label class="form-label">Harga Grosir Bertingkat</label>',
      '<div id="pfTierRows"></div>',
      '<button type="button" class="btn-ghost w-full mb-1" onclick="tambahBarisTier()"><i class="bi bi-plus-lg"></i> Tambah Tier Harga</button>',
      '<p class="pf-foto-info">Tiap tier berlaku mulai jumlah yang diisi sampai sebelum tier berikutnya. Contoh: mulai 10 = Rp 32.000, mulai 50 = Rp 28.000, mulai 200 = Rp 24.000. Boleh dikosongkan; harga lalu dibahas lewat RFQ.</p>',
      '</div>',
      '</div>',

      '<div class="pf-section">',
      '<div class="pf-section-title">Cara pemesanan (mode Ritel)</div>',
      '<select class="form-select" id="pfTipePemesanan" onchange="perbaruiAturanForm()">',
      '<option value="Standar" ', (tipe === 'Standar' ? 'selected' : ''), '>Standar - langsung masuk keranjang</option>',
      '<option value="Paket" ', (tipe === 'Paket' ? 'selected' : ''), '>Paket - pelanggan pilih salah satu varian menu dulu</option>',
      '<option value="Custom" ', (tipe === 'Custom' ? 'selected' : ''), '>Custom - pelanggan isi budget &amp; menu sendiri</option>',
      '</select>',
      '<div id="pfPaketSection" class="hidden" style="margin-top:10px;">',
      '<label class="form-label">Daftar Paket</label>',
      '<div id="pfPaketRows"></div>',
      '<button type="button" class="btn-ghost w-full" onclick="tambahBarisPaket()"><i class="bi bi-plus-lg"></i> Tambah Paket</button>',
      '</div>',
      '</div>',

      '<div class="pf-section">',
      '<div class="pf-section-title">Sertifikat &amp; legalitas produk</div>',
      '<p class="pf-foto-info" style="margin:0 0 8px;">Yang dicentang tampil sebagai ceklis hijau di kartu produk. Nomor sertifikat boleh dikosongkan.</p>',
      '<div id="pfCertWrap"></div>',
      '</div>',

      '<p class="text-xs font-bold uppercase mb-2" style="color:var(--text-muted)">Badge &amp; Rating (opsional, tampil di Kartu Produk)</p>',
      '<div class="form-group"><label class="form-label">Badge/Label</label><input class="form-input" id="pfBadge" value="', escapeAttr(p.badge || ''), '" placeholder="mis. Hemat B2B, Fresh Roast, Ready Stock"></div>',
      '<div class="grid grid-cols-2 gap-3">',
      '<div class="form-group"><label class="form-label">Rating (0-5)</label><input class="form-input" type="number" step="0.1" min="0" max="5" id="pfRating" value="', escapeAttr(p.rating || ''), '"></div>',
      '<div class="form-group"><label class="form-label">Jumlah Ulasan</label><input class="form-input" type="number" min="0" id="pfJumlahUlasan" value="', escapeAttr(p.jumlah_ulasan || ''), '"></div>',
      '</div>',

      '<div class="form-group">',
      '<label class="form-label">Foto Produk (maksimal ' + MAKS_FOTO_PRODUK + ')</label>',
      '<input class="form-input" type="file" id="pfFotoInput" accept="image/*" multiple onchange="tambahFotoBaru(this)">',
      '<div id="pfFotoGrid" class="pf-foto-grid"></div>',
      '<div id="pfFotoInfo" class="pf-foto-info"></div>',
      '</div>',
      '<button type="submit" class="btn-primary w-full" style="height:42px;"><i class="bi bi-check-lg"></i> Simpan Produk</button>',
      '</form>'
    ].join('');

    renderSubKategoriOptions(kategoriAwal, p.sub_kategori);
    renderBagianSertifikat();
    renderFotoProduk();
    renderBarisTier();
    renderBarisPaket();
    perbaruiAturanForm();
    openModal('previewModal');

    if (p.id) {
        dbSelect('produk_harga_grosir', { eq: { produk_id: p.id }, order: 'qty_min' }).then(function(res) {
            if (token !== pfFormToken) return;
            pfTierRows = res.success ? res.data.map(function(t) { return { qty_min: t.qty_min, harga: t.harga, keterangan: t.keterangan || '' }; }) : [];
            renderBarisTier();
        });
        if (tipe === 'Paket') {
            dbSelect('produk_paket', { eq: { produk_id: p.id }, order: 'urutan' }).then(function(res) {
                if (token !== pfFormToken) return;
                pfPaketRows = res.success ? res.data.map(function(pk) { return { nama_paket: pk.nama_paket, deskripsi_menu: pk.deskripsi_menu || '', harga: pk.harga }; }) : [];
                renderBarisPaket();
            });
        }
    }
}

/** Satu pintu untuk semua aturan tampil/wajib-isi di form produk. */
function perbaruiAturanForm() {
    const el = function(id) { return document.getElementById(id); };
    if (!el('pfTipePemesanan')) return;
    const tipe = el('pfTipePemesanan').value;
    const ritel = el('pfRitel').checked;
    const grosir = el('pfGrosir').checked;
    el('pfPaketSection').classList.toggle('hidden', tipe !== 'Paket');
    if (tipe === 'Paket' && !pfPaketRows.length) tambahBarisPaket();
    el('pfGrosirSection').classList.toggle('hidden', !grosir);
    if (grosir && !pfTierRows.length && !el('pfMoq').value) tambahBarisTier();
    // Harga Normal tidak wajib untuk tipe Custom (harga mengikuti budget pelanggan) atau produk yang hanya tampil di B2B
    const hargaWajib = ritel && tipe !== 'Custom';
    el('pfHargaNormal').required = hargaWajib;
    el('pfHargaNormalLabel').textContent = hargaWajib ? 'Harga Normal (Rp) *' : 'Harga Normal (Rp) - opsional' + (tipe === 'Custom' ? ' untuk tipe Custom' : ' bila hanya tampil di B2B');
    el('pfWarnaWrap').classList.toggle('hidden', el('pfKategori').value !== 'PortoKriya');
    const bolehLangsung = KATEGORI_PESAN_LANGSUNG.indexOf(el('pfKategori').value) !== -1;
    el('pfRfqWrap').classList.toggle('hidden', !(grosir && bolehLangsung));
    toggleSubLainnya();
}
function gantiKategoriForm(kategori) {
    renderSubKategoriOptions(kategori);
    pfSertifikasi = bacaSertifikatDariForm();
    renderBagianSertifikat();
    perbaruiAturanForm();
}

// ---------- foto ----------
function renderFotoProduk() {
    const wrap = document.getElementById('pfFotoGrid');
    if (!wrap) return;
    let html = '';
    pfFotoList.forEach(function(f, i) {
        html += '<div class="pf-foto-item' + (i === 0 ? ' utama' : '') + '"><img src="' + escapeAttr(f.url) + '" alt="">' +
            '<button type="button" class="pf-foto-del" onclick="hapusFotoLama(' + i + ')" title="Hapus foto"><i class="bi bi-x-lg"></i></button>' +
            (i === 0 ? '<div class="pf-foto-tag">Utama</div>' : '<button type="button" class="pf-foto-tag" onclick="jadikanFotoUtama(' + i + ')">Jadikan utama</button>') + '</div>';
    });
    pfFotoBaru.forEach(function(f, i) {
        const utama = pfFotoList.length === 0 && i === 0;
        html += '<div class="pf-foto-item baru' + (utama ? ' utama' : '') + '"><img src="' + f.previewUrl + '" alt="">' +
            '<button type="button" class="pf-foto-del" onclick="hapusFotoBaru(' + i + ')" title="Batalkan foto ini"><i class="bi bi-x-lg"></i></button>' +
            '<div class="pf-foto-tag">' + (utama ? 'Utama (baru)' : 'Baru') + '</div></div>';
    });
    wrap.innerHTML = html || '<div class="pf-foto-info">Belum ada foto.</div>';
    const info = document.getElementById('pfFotoInfo');
    if (info) info.textContent = (pfFotoList.length + pfFotoBaru.length) + ' / ' + MAKS_FOTO_PRODUK + ' foto. Foto pertama = foto utama (tampil di kartu produk). Foto otomatis dikecilkan (maks. 1600 px) dan diubah ke WebP saat disimpan.';
}
function tambahFotoBaru(input) {
    const files = Array.from(input.files || []);
    input.value = ''; // supaya file yang sama bisa dipilih lagi
    const gambar = files.filter(function(f) { return /^image\//.test(f.type); });
    const sisa = MAKS_FOTO_PRODUK - (pfFotoList.length + pfFotoBaru.length);
    if (sisa <= 0) { showToast('Batas foto', 'Maksimal ' + MAKS_FOTO_PRODUK + ' foto per produk. Hapus salah satu dulu untuk menambah.', 'warning'); return; }
    const diterima = gambar.slice(0, sisa);
    if (files.length > diterima.length) showToast('Sebagian foto tidak ditambahkan', 'Hanya file gambar yang diterima, dan maksimal ' + MAKS_FOTO_PRODUK + ' foto per produk (' + diterima.length + ' foto ditambahkan).', 'warning');
    diterima.forEach(function(f) { pfFotoBaru.push({ file: f, previewUrl: URL.createObjectURL(f) }); });
    renderFotoProduk();
}
function hapusFotoLama(i) {
    const f = pfFotoList.splice(i, 1)[0];
    if (f && f.path) pfFotoHapus.push(f.path); // dihapus dari Drive setelah produk berhasil disimpan
    renderFotoProduk();
}
function hapusFotoBaru(i) {
    const f = pfFotoBaru.splice(i, 1)[0];
    if (f) URL.revokeObjectURL(f.previewUrl);
    renderFotoProduk();
}
function jadikanFotoUtama(i) {
    const f = pfFotoList.splice(i, 1)[0];
    if (f) pfFotoList.unshift(f);
    renderFotoProduk();
}

// ---------- tier harga grosir ----------
function tambahBarisTier() { pfTierRows.push({ qty_min: '', harga: '', keterangan: '' }); renderBarisTier(); }
function hapusBarisTier(i) { pfTierRows.splice(i, 1); renderBarisTier(); }
function ubahBarisTier(i, field, value) { if (pfTierRows[i]) pfTierRows[i][field] = value; }
function renderBarisTier() {
    const wrap = document.getElementById('pfTierRows');
    if (!wrap) return;
    wrap.innerHTML = pfTierRows.length
        ? '<div class="pf-tier-row" style="margin-bottom:2px;"><span class="pf-foto-info" style="margin:0;">Mulai dari</span><span class="pf-foto-info" style="margin:0;">Harga / satuan (Rp)</span><span class="pf-foto-info pf-tier-ket" style="margin:0;">Keterangan (opsional)</span><span></span></div>' +
          pfTierRows.map(function(r, i) {
            return '<div class="pf-tier-row">' +
              '<input class="form-input" type="number" min="1" value="' + escapeAttr(r.qty_min) + '" oninput="ubahBarisTier(' + i + ',\'qty_min\',this.value)" placeholder="10">' +
              '<input class="form-input" type="number" min="1" value="' + escapeAttr(r.harga) + '" oninput="ubahBarisTier(' + i + ',\'harga\',this.value)" placeholder="32000">' +
              '<input class="form-input pf-tier-ket" value="' + escapeAttr(r.keterangan) + '" oninput="ubahBarisTier(' + i + ',\'keterangan\',this.value)" placeholder="mis. Diskon Distributor">' +
              '<button type="button" class="btn-icon-sm" onclick="hapusBarisTier(' + i + ')" title="Hapus tier"><i class="bi bi-trash text-red-500"></i></button></div>';
          }).join('')
        : '<p class="pf-foto-info">Belum ada tier harga.</p>';
}
/** @returns {{error?:string, tiers?:array, moq?:number, peringatan?:string}} */
function validasiTierGrosir() {
    const baris = pfTierRows.filter(function(r) { return String(r.qty_min).trim() !== '' || String(r.harga).trim() !== ''; });
    const tiers = [];
    for (let i = 0; i < baris.length; i++) {
        const q = parseInt(baris[i].qty_min, 10), h = Number(baris[i].harga);
        if (!(q >= 1) || !(h > 0)) return { error: 'Tier harga grosir baris ke-' + (i + 1) + ' belum lengkap: isi "Mulai dari" (minimal 1) dan harga per satuan (lebih dari 0).' };
        tiers.push({ qty_min: q, harga: h, keterangan: String(baris[i].keterangan || '').trim() });
    }
    tiers.sort(function(a, b) { return a.qty_min - b.qty_min; });
    for (let i = 1; i < tiers.length; i++) {
        if (tiers[i].qty_min === tiers[i - 1].qty_min) return { error: 'Ada dua tier dengan jumlah mulai yang sama (' + tiers[i].qty_min + '). Setiap tier harus punya jumlah mulai yang berbeda.' };
    }
    let moq;
    if (tiers.length) {
        moq = tiers[0].qty_min;
    } else {
        moq = parseInt((document.getElementById('pfMoq') || {}).value, 10);
        if (!(moq >= 1)) return { error: 'Untuk B2B Grosir, isi MOQ grosir atau tambahkan minimal satu tier harga.' };
    }
    let peringatan = '';
    for (let i = 1; i < tiers.length; i++) {
        if (tiers[i].harga >= tiers[i - 1].harga) {
            peringatan = 'Harga pada jumlah ' + tiers[i].qty_min + ' (' + formatRupiah(tiers[i].harga) + ') tidak lebih murah dari tier sebelumnya (' + formatRupiah(tiers[i - 1].harga) + '). Biasanya harga grosir makin murah untuk jumlah lebih besar. Tetap simpan?';
            break;
        }
    }
    return { tiers: tiers, moq: moq, peringatan: peringatan };
}

// ---------- sertifikat & warna ----------
function renderBagianSertifikat() {
    const wrap = document.getElementById('pfCertWrap');
    if (!wrap) return;
    const kat = (document.getElementById('pfKategori') || {}).value;
    const opsi = SERTIFIKASI_PILIHAN[kat] || SERTIFIKASI_PILIHAN._umum;
    const terpilih = {};
    const lain = [];
    pfSertifikasi.forEach(function(s) {
        if (opsi.indexOf(s.nama) !== -1 && !(s.nama in terpilih)) terpilih[s.nama] = s.nomor || '';
        else lain.push([s.nama, s.nomor].filter(Boolean).join(' '));
    });
    wrap.innerHTML = opsi.map(function(nama) {
        const aktif = nama in terpilih;
        return '<div class="pf-cert-row"><label class="pf-cek" style="margin:0;"><input type="checkbox" class="pf-cert-cek" data-nama="' + escapeAttr(nama) + '"' + (aktif ? ' checked' : '') + '> ' + escapeHtml(nama) + '</label>' +
               '<input class="form-input pf-cert-nomor" data-nama="' + escapeAttr(nama) + '" value="' + escapeAttr(aktif ? terpilih[nama] : '') + '" placeholder="No. sertifikat (opsional)"></div>';
    }).join('') +
    '<div class="form-group" style="margin:8px 0 0;"><label class="form-label">Sertifikat lain (pisahkan dengan koma)</label><input class="form-input" id="pfCertLain" value="' + escapeAttr(lain.join(', ')) + '" placeholder="mis. SLHS, Sertifikat Organik 123"></div>';
}
/** Baca ceklis sertifikat dari form (kalau form belum tergambar, kembalikan data yang tersimpan). */
function bacaSertifikatDariForm() {
    const wrap = document.getElementById('pfCertWrap');
    if (!wrap || !wrap.querySelector('.pf-cert-cek')) return pfSertifikasi;
    const hasil = [];
    wrap.querySelectorAll('.pf-cert-cek').forEach(function(cek) {
        if (!cek.checked) return;
        const nama = cek.getAttribute('data-nama');
        let nomor = '';
        wrap.querySelectorAll('.pf-cert-nomor').forEach(function(inp) { if (inp.getAttribute('data-nama') === nama) nomor = inp.value.trim(); });
        hasil.push({ nama: nama, nomor: nomor });
    });
    const lain = document.getElementById('pfCertLain');
    if (lain) lain.value.split(',').map(function(x) { return x.trim(); }).filter(Boolean).forEach(function(n) { hasil.push({ nama: n.slice(0, 80), nomor: '' }); });
    return hasil;
}
/** "Merah, biru ; Hijau" -> ["Merah","biru","Hijau"] (tanpa duplikat, maks 30 warna). */
function parseDaftarWarna(teks) {
    const lihat = {};
    const hasil = [];
    String(teks || '').split(/[,;\n]/).map(function(x) { return x.trim().slice(0, 30); }).filter(Boolean).forEach(function(w) {
        const k = w.toLowerCase();
        if (!lihat[k] && hasil.length < 30) { lihat[k] = true; hasil.push(w); }
    });
    return hasil;
}

/**
 * Pengelolaan baris Daftar Paket (tipe_pemesanan = 'Paket') - dikelola
 * sebagai array di memori selagi form terbuka, baru disinkronkan ke tabel
 * produk_paket saat Simpan Produk diklik (lihat submitProdukForm).
 */
let pfPaketRows = [];
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
          '<div class="form-group" style="margin-bottom:8px;"><label class="form-label">Nama Paket</label><input class="form-input" value="' + escapeAttr(row.nama_paket) + '" oninput="ubahBarisPaket(' + idx + ',\'nama_paket\',this.value)" placeholder="mis. Paket A"></div>',
          '<div class="form-group" style="margin-bottom:8px;"><label class="form-label">Isi Menu</label><textarea class="form-textarea" oninput="ubahBarisPaket(' + idx + ',\'deskripsi_menu\',this.value)" placeholder="mis. Nasi kuning, ayam goreng, sambal, kerupuk">' + escapeHtml(row.deskripsi_menu) + '</textarea></div>',
          '<div class="form-group" style="margin-bottom:0;"><label class="form-label">Harga Khusus Paket Ini (Rp) - opsional</label><input class="form-input" type="number" value="' + (row.harga == null ? '' : row.harga) + '" oninput="ubahBarisPaket(' + idx + ',\'harga\',this.value)" placeholder="Kosongkan = pakai Harga Normal produk"></div>',
          '</div>'
        ].join('');
    }).join('') || '<p class="text-xs" style="color:var(--text-muted)">Belum ada paket. Klik "Tambah Paket" di bawah.</p>';
}
const SUB_LAINNYA = 'Lainnya';
/**
 * Daftar sub-kategori + pilihan "Lainnya" di urutan terakhir. Kalau produk yang
 * diedit memakai sub-kategori di luar daftar (ditulis sendiri sebelumnya),
 * "Lainnya" otomatis terpilih dan teksnya muncul di kolom tulis manual.
 */
function renderSubKategoriOptions(kategoriKey, selected) {
    const struk = AppState.kategoriStruktur || {};
    const el = document.getElementById('pfSubKategori');
    if (!el || !struk[kategoriKey]) return;
    const daftar = (struk[kategoriKey].sub || []).slice();
    const sel = selected || '';
    const diLuarDaftar = sel && daftar.indexOf(sel) === -1;
    const terpilih = diLuarDaftar ? SUB_LAINNYA : sel;
    el.innerHTML = daftar.concat([SUB_LAINNYA]).map(function(x) {
        return '<option value="' + escapeAttr(x) + '"' + (x === terpilih ? ' selected' : '') + '>' + escapeHtml(x) + '</option>';
    }).join('');
    const manual = document.getElementById('pfSubLainnya');
    if (manual) manual.value = diLuarDaftar ? sel : '';
    toggleSubLainnya();
}
/** Tampilkan kolom tulis manual hanya saat "Lainnya" dipilih. */
function toggleSubLainnya() {
    const sel = document.getElementById('pfSubKategori');
    const wrap = document.getElementById('pfSubLainnyaWrap');
    if (!sel || !wrap) return;
    wrap.classList.toggle('hidden', sel.value !== SUB_LAINNYA);
}
/** Nilai sub-kategori yang disimpan: isian manual kalau "Lainnya", selain itu pilihan dropdown. */
function nilaiSubKategori() {
    const sel = document.getElementById('pfSubKategori');
    if (!sel) return '';
    if (sel.value !== SUB_LAINNYA) return sel.value;
    const manual = document.getElementById('pfSubLainnya');
    return manual ? manual.value.trim().slice(0, 60) : '';
}

/** Sinkronkan tier harga grosir: hapus tier lama lalu tulis ulang sesuai isi form. */
function syncTierGrosir(produkId, tiers) {
    return dbDeleteWhere('produk_harga_grosir', 'produk_id', produkId).then(function(r) {
        if (!r.success) return r;
        const rows = tiers.map(function(t) { return { produk_id: produkId, qty_min: t.qty_min, harga: t.harga, keterangan: t.keterangan || '' }; });
        return dbInsertMany('produk_harga_grosir', rows);
    });
}
/** Sinkronkan daftar paket (tipe Paket): hapus lama, tulis ulang; baris tanpa nama dibuang. */
function syncPaketProduk(produkId, tipe) {
    return dbDeleteWhere('produk_paket', 'produk_id', produkId).then(function(r) {
        if (!r.success) return r;
        if (tipe !== 'Paket') return { success: true };
        const rows = pfPaketRows.filter(function(x) { return x.nama_paket.trim(); }).map(function(x) {
            return {
                produk_id: produkId, nama_paket: x.nama_paket.trim(), deskripsi_menu: (x.deskripsi_menu || '').trim(),
                harga: x.harga === '' || x.harga == null ? null : Number(x.harga), urutan: pfPaketRows.indexOf(x) + 1
            };
        });
        return dbInsertMany('produk_paket', rows);
    });
}

async function submitProdukForm(e) {
    e.preventDefault();
    const el = function(id) { return document.getElementById(id); };
    // Diperiksa lebih dulu supaya foto tidak terlanjur diunggah ke Drive padahal
    // penyimpanannya nanti ditolak karena sesi Admin sudah berakhir.
    const sesiAktif = await authGetSession();
    if (!sesiAktif) {
        AppState.session = null;
        showToast('Sesi berakhir', 'Sesi Admin sudah berakhir. Buka tab baru, login kembali, lalu simpan ulang perubahan ini. Jangan tutup jendela ini agar isian Anda tidak hilang.', 'danger');
        return;
    }
    if (!el('pfUmkm').value.trim()) {
        showToast('Peringatan', 'Pilih Nama UMKM Pemilik dari daftar terlebih dahulu.', 'warning');
        el('pfUmkmSearch').focus();
        return;
    }
    const ritel = el('pfRitel').checked, grosir = el('pfGrosir').checked;
    if (!ritel && !grosir) {
        showToast('Peringatan', 'Pilih minimal satu mode tampil: B2C Ritel atau B2B Grosir.', 'warning');
        return;
    }
    let tiers = [], moq = null;
    if (grosir) {
        const v = validasiTierGrosir();
        if (v.error) { showToast('Peringatan', v.error, 'warning'); return; }
        if (v.peringatan && !window.confirm(v.peringatan)) return;
        tiers = v.tiers; moq = v.moq;
    }
    const kategori = el('pfKategori').value;
    if (!nilaiSubKategori()) {
        showToast('Peringatan', 'Sub-kategori "Lainnya" dipilih: tulis dulu nama sub-kategorinya.', 'warning');
        el('pfSubLainnya').focus();
        return;
    }
    const record = {
        nama_produk: el('pfNama').value.trim(),
        nama_umkm: el('pfUmkm').value.trim(),
        deskripsi: el('pfDeskripsi').value.trim(),
        harga_normal: Number(el('pfHargaNormal').value) || 0,
        harga_promo: el('pfHargaPromo').value ? Number(el('pfHargaPromo').value) : null,
        satuan: el('pfSatuan').value.trim() || 'pcs',
        minimal_order: el('pfMinimalOrder').value.trim(),
        kategori: kategori,
        sub_kategori: nilaiSubKategori(),
        badge: el('pfBadge').value.trim(),
        rating: el('pfRating').value ? Number(el('pfRating').value) : 0,
        jumlah_ulasan: el('pfJumlahUlasan').value ? Number(el('pfJumlahUlasan').value) : 0,
        status: el('pfStatus').value,
        tipe_pemesanan: el('pfTipePemesanan').value,
        tersedia_ritel: ritel,
        tersedia_grosir: grosir,
        moq_grosir: grosir ? moq : null,
        tampilkan_rfq: (KATEGORI_PESAN_LANGSUNG.indexOf(kategori) === -1) ? true : el('pfTampilkanRfq').checked,
        sertifikasi: bacaSertifikatDariForm(),
        ketahanan_simpan: el('pfKetahanan').value.trim(),
        warna_pilihan: kategori === 'PortoKriya' ? parseDaftarWarna(el('pfWarna').value) : []
    };
    const btn = e.target.querySelector('button[type="submit"]');
    const asli = btn.innerHTML;
    btn.disabled = true;
    const sudahUpload = [];      // foto yang diunggah pada percobaan ini
    let tersimpan = false;
    const batalkanUpload = function() { sudahUpload.forEach(function(f) { if (f.path) deleteFile(f.path); }); };
    try {
        for (let i = 0; i < pfFotoBaru.length; i++) {
            btn.innerHTML = '<span class="spinner-inline"></span> Mengunggah foto ' + (i + 1) + '/' + pfFotoBaru.length + '...';
            const up = await uploadFile(pfFotoBaru[i].file, 'uploadFolderId', { maxSisi: 1600 });
            if (!up.success) {
                batalkanUpload();
                btn.innerHTML = asli; btn.disabled = false;
                showToast('Gagal mengunggah foto', up.message, 'danger');
                return;
            }
            sudahUpload.push({ url: up.data.url, path: up.data.fileId });
        }
        btn.innerHTML = '<span class="spinner-inline"></span> Menyimpan produk...';
        const galeri = pfFotoList.concat(sudahUpload);
        record.foto_galeri = galeri;
        record.foto_url = galeri.length ? galeri[0].url : '';
        record.foto_path = galeri.length ? (galeri[0].path || '') : '';
        record.foto_url2 = null;      // kolom foto lama tidak dipakai lagi (semua foto ada di galeri)
        record.foto_path2 = null;
        const produkId = el('pfId').value || null;
        const res = produkId ? await dbUpdate('produk', produkId, record) : await dbInsert('produk', record);
        if (!res.success) {
            batalkanUpload();
            btn.innerHTML = asli; btn.disabled = false;
            showToast('Gagal', res.message, 'danger');
            return;
        }
        tersimpan = true;
        const idFinal = produkId || res.data.id;
        el('pfId').value = idFinal; // kalau ada langkah berikutnya yang gagal, "Simpan" lagi memperbarui produk ini (bukan membuat produk ganda)
        pfFotoList = galeri;
        pfFotoBaru.forEach(function(f) { URL.revokeObjectURL(f.previewUrl); });
        pfFotoBaru = [];
        const buang = pfFotoHapus.slice();
        pfFotoHapus = [];
        for (const path of buang) await deleteFile(path); // produk sudah tersimpan tanpa foto ini, aman dihapus dari Drive
        const gagal = [];
        const rTier = await syncTierGrosir(idFinal, grosir ? tiers : []);
        if (!rTier.success) gagal.push('tier harga grosir (' + rTier.message + ')');
        const rPaket = await syncPaketProduk(idFinal, record.tipe_pemesanan);
        if (!rPaket.success) gagal.push('daftar paket (' + rPaket.message + ')');
        btn.innerHTML = asli; btn.disabled = false;
        AppState.cache = {};
        if (gagal.length) {
            showToast('Tersimpan sebagian', 'Produk tersimpan, tetapi gagal menyimpan ' + gagal.join(' dan ') + '. Klik Simpan Produk lagi untuk mencoba ulang.', 'warning');
            loadAdminProduk();
            return;
        }
        showToast('Berhasil', res.message, 'success');
        closeModal('previewModal');
        loadAdminProduk();
    } catch (err) {
        console.error('submitProdukForm gagal:', err);
        if (!tersimpan) batalkanUpload();
        btn.innerHTML = asli; btn.disabled = false;
        showToast('Gagal', 'Terjadi kesalahan: ' + (err && err.message ? err.message : err), 'danger');
    }
}
