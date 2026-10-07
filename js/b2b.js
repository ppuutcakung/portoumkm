/**
 * ============================================================
 * PortoUMKM - Mode B2C Ritel / B2B Grosir, popup Detail Produk,
 * harga grosir bertingkat, dan pengajuan RFQ B2B
 * ============================================================
 */
const MODE_STORAGE_KEY = 'portoumkm_mode';

// -------------------- MODE (Ritel / Grosir) --------------------
function modeAktif() { return AppState.mode === 'b2b' ? 'b2b' : 'b2c'; }
function isB2B() { return modeAktif() === 'b2b'; }

function simpanMode() {
    try { localStorage.setItem(MODE_STORAGE_KEY, modeAktif()); } catch (e) { /* aman diabaikan */ }
}
function initMode() {
    let m = 'b2c';
    try { if (localStorage.getItem(MODE_STORAGE_KEY) === 'b2b') m = 'b2b'; } catch (e) { /* aman diabaikan */ }
    AppState.mode = m;
    terapkanTemaMode();
}
/** Pasang warna tema + isi bar mode + status tombol toggle sesuai mode aktif. */
function terapkanTemaMode() {
    const b2b = isB2B();
    document.body.setAttribute('data-mode', b2b ? 'b2b' : 'b2c');
    // Tema warna dipasang di mode Grosir, dan di mode Ritel HANYA bila Admin mengatur warna Ritel sendiri
    document.body.classList.toggle('pu-recolor', b2b || document.body.classList.contains('pu-b2c-custom'));
    [['modeBtnB2c', !b2b], ['modeBtnB2b', b2b]].forEach(function(x) {
        const el = document.getElementById(x[0]);
        if (!el) return;
        el.classList.toggle('active', x[1]);
        el.setAttribute('aria-pressed', String(x[1]));
    });
    const pill = document.getElementById('puModePill');
    const teks = document.getElementById('puModeText');
    if (pill) pill.textContent = b2b ? 'MODE B2B GROSIR' : 'MODE B2C RITEL';
    if (teks) teks.textContent = b2b
        ? 'Harga grosir bertingkat, MOQ, dan pengajuan penawaran (RFQ) untuk kebutuhan perusahaan'
        : 'Belanja eceran langsung dari UMKM binaan CSR United Tractors';
}
function setMode(m) {
    m = m === 'b2b' ? 'b2b' : 'b2c';
    if (m === modeAktif()) return;
    AppState.mode = m;
    simpanMode();
    terapkanTemaMode();
    tutupDetailProduk();
    // Filter "Paket Promo" dan "Sering Dipesan" hanya ada di mode ritel
    if (m === 'b2b' && ['PromoB2B', 'SeringDipesan'].indexOf(AppState.katalogFilter.kategori) !== -1) {
        AppState.katalogFilter.kategori = 'Semua';
    }
    AppState.katalogFilter.page = 1;
    const hal = AppState.currentPage;
    // Keranjang tidak digambar ulang: isinya memuat item dari kedua mode sekaligus.
    if (hal !== 'keranjang' && PUBLIC_PAGES.indexOf(hal) !== -1 && hal !== 'adminLogin') navigateTo(hal);
}
// -------------------- TEMA WARNA (bisa diatur Admin) --------------------
function normalisasiHex(h) {
    let x = String(h == null ? '' : h).trim().toLowerCase();
    if (/^#[0-9a-f]{3}$/.test(x)) x = '#' + x[1] + x[1] + x[2] + x[2] + x[3] + x[3];
    return /^#[0-9a-f]{6}$/.test(x) ? x : '';
}
function hexKeRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbKeHex(r, g, b) {
    return '#' + [r, g, b].map(function(v) { return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'); }).join('');
}
/** Campur warna h ke arah target sebesar bagian (0..1). */
function campurWarna(h, target, bagian) {
    const a = hexKeRgb(h), b = hexKeRgb(target);
    return rgbKeHex(a[0] + (b[0] - a[0]) * bagian, a[1] + (b[1] - a[1]) * bagian, a[2] + (b[2] - a[2]) * bagian);
}
function luminansiWarna(h) {
    const c = hexKeRgb(h).map(function(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
/** Dari satu warna utama, turunkan warna sorot (gelap), latar muda, garis tepi, dan warna teks di atasnya. */
function turunkanPaletWarna(h) {
    return {
        main: h,
        dark: campurWarna(h, '#000000', 0.2),
        tint: campurWarna(h, '#ffffff', 0.92),
        border: campurWarna(h, '#ffffff', 0.72),
        on: luminansiWarna(h) > 0.4 ? '#111827' : '#ffffff'
    };
}
function cssPaletWarna(awalan, h) {
    const p = turunkanPaletWarna(h);
    return '--pu-' + awalan + '-main:' + p.main + ';--pu-' + awalan + '-dark:' + p.dark + ';--pu-' + awalan + '-tint:' + p.tint +
           ';--pu-' + awalan + '-border:' + p.border + ';--pu-' + awalan + '-on:' + p.on + ';';
}
/**
 * Pasang warna yang diatur Admin (app_config: warnaB2c, warnaB2b). Kosong = warna bawaan:
 * Ritel memakai warna asli aplikasi, Grosir memakai biru muda.
 */
function terapkanWarnaTema() {
    const c = AppState.config || {};
    const b2b = normalisasiHex(c.warnaB2b), b2c = normalisasiHex(c.warnaB2c);
    let el = document.getElementById('puThemeStyle');
    if (!el) { el = document.createElement('style'); el.id = 'puThemeStyle'; document.head.appendChild(el); }
    el.textContent = ':root{' + (b2b ? cssPaletWarna('b2b', b2b) : '') + (b2c ? cssPaletWarna('b2c', b2c) : '') + '}';
    document.body.classList.toggle('pu-b2c-custom', !!b2c);
    terapkanTemaMode();
}

// -------------------- ATURAN PESAN LANGSUNG / RFQ DI MODE GROSIR --------------------
/** Kuliner & Pertanian: harga sudah tetap, jadi boleh dipesan langsung di mode Grosir. */
const KATEGORI_PESAN_LANGSUNG = ['PortoRasa', 'PortoTani'];
function bolehPesanLangsungB2b(p) {
    return KATEGORI_PESAN_LANGSUNG.indexOf(p.kategori) !== -1;
}
/** Kerajinan selalu lewat RFQ; Kuliner/Pertanian mengikuti centang Admin (default tampil). */
function tampilkanRfq(p) {
    if (!bolehPesanLangsungB2b(p)) return true;
    return p.tampilkan_rfq !== false;
}

// -------------------- HARGA (ritel & grosir bertingkat) --------------------
function hargaRitelProduk(p) {
    const normal = Number(p.harga_normal) || 0;
    const promo = (p.harga_promo !== '' && p.harga_promo != null) ? Number(p.harga_promo) : null;
    return promo || normal;
}
/** Rapikan & urutkan tier harga grosir (qty_min naik); buang baris tidak valid. */
function urutkanTier(tiers) {
    return (Array.isArray(tiers) ? tiers : [])
        .map(function(t) { return { qty_min: Number(t.qty_min), harga: Number(t.harga), keterangan: t.keterangan || '' }; })
        .filter(function(t) { return t.qty_min >= 1 && t.harga > 0; })
        .sort(function(a, b) { return a.qty_min - b.qty_min; });
}
/** MOQ grosir = qty tier pertama; kalau belum ada tier, pakai kolom moq_grosir. */
function moqProduk(p, tiers) {
    const t = urutkanTier(tiers);
    if (t.length) return t[0].qty_min;
    return Number(p.moq_grosir) || 1;
}
/** Harga per satuan untuk jumlah tertentu pada mode grosir. */
function hitungHargaGrosir(p, tiers, qty) {
    const t = urutkanTier(tiers);
    qty = Math.max(1, Number(qty) || 1);
    const ritel = hargaRitelProduk(p);
    if (!t.length) return { harga: ritel, tier: null, adaTier: false, dibawahMoq: qty < moqProduk(p, t) };
    if (qty < t[0].qty_min) {
        return { harga: (p.tersedia_ritel && ritel > 0) ? ritel : t[0].harga, tier: null, adaTier: true, dibawahMoq: true };
    }
    let pilih = t[0];
    t.forEach(function(x) { if (x.qty_min <= qty) pilih = x; });
    return { harga: pilih.harga, tier: pilih, adaTier: true, dibawahMoq: false };
}
/** Label rentang kuantitas tier ke-i, mis. "10 - 49 Jar" atau "200 - Seterusnya Jar". */
function labelRentangTier(tiers, i, satuan) {
    const t = tiers[i], next = tiers[i + 1];
    if (!next) return t.qty_min + ' - Seterusnya ' + satuan;
    const atas = next.qty_min - 1;
    return (atas <= t.qty_min ? String(t.qty_min) : (t.qty_min + ' - ' + atas)) + ' ' + satuan;
}

// -------------------- SERTIFIKAT, WARNA, FOTO --------------------
function labelSertifikat(s) {
    if (!s) return '';
    if (typeof s === 'string') return s;
    return [s.nama, s.nomor].filter(Boolean).join(' ');
}
function daftarSertifikat(p) {
    return (Array.isArray(p.sertifikasi) ? p.sertifikasi : []).map(labelSertifikat).filter(Boolean);
}
/** Chip centang hijau. maks = batas tampil (sisanya diringkas "+N"); tanpa maks = tampil semua. */
function sertifikatChipsHtml(p, maks) {
    const list = daftarSertifikat(p);
    if (!list.length) return '';
    const tampil = maks ? list.slice(0, maks) : list;
    let html = tampil.map(function(l) {
        return '<span class="pu-cert"><i class="bi bi-check-circle-fill"></i> ' + escapeHtml(l) + '</span>';
    }).join('');
    if (maks && list.length > maks) html += '<span class="pu-cert pu-cert-more">+' + (list.length - maks) + '</span>';
    return html;
}
/**
 * Daftar pilihan model/tipe, diambil dari NOMOR foto produk. Hanya berlaku
 * kalau Admin menandai bahwa tiap foto menunjukkan model berbeda, dan fotonya
 * lebih dari satu. Tiap foto boleh diberi nama sendiri; kalau kosong, dipakai
 * "Gambar 1", "Gambar 2", dan seterusnya.
 */
function daftarModel(p) {
    if (!p || p.foto_beda_model !== true) return [];
    const g = Array.isArray(p.foto_galeri) ? p.foto_galeri.filter(function(x) { return x && x.url; }) : [];
    if (g.length < 2) return [];
    return g.map(function(f, i) {
        const nomor = 'Gambar ' + (i + 1);
        const nama = String((f && f.nama) || '').trim();
        return { idx: i, url: f.url, label: nama ? (nomor + ' - ' + nama) : nomor };
    });
}
function daftarWarna(p) {
    return (Array.isArray(p.warna_pilihan) ? p.warna_pilihan : []).map(function(w) { return String(w).trim(); }).filter(Boolean);
}
/** Daftar URL foto: dari galeri (maks 10); cadangan ke foto_url lama. */
function galeriProduk(p) {
    const g = (Array.isArray(p.foto_galeri) ? p.foto_galeri : []).map(function(x) { return x && x.url; }).filter(Boolean);
    if (g.length) return g;
    return p.foto_url ? [p.foto_url] : [];
}
const LABEL_KATEGORI_PENDEK = { PortoRasa: 'KULINER', PortoKriya: 'KERAJINAN', PortoTani: 'PERTANIAN' };

// -------------------- BANNER MODE B2B --------------------
function bannerB2bHtml() {
    return [
      '<div class="pu-b2b-banner">',
      '<div class="pu-b2b-banner-ico"><i class="bi bi-truck"></i></div>',
      '<div class="pu-b2b-banner-txt"><div class="pu-b2b-banner-title">MODE TRANSAKSI B2B GROSIR AKTIF</div>',
      '<div>Menampilkan Minimum Order Quantity (MOQ), skema harga grosir volume, serta pengajuan sampel &amp; penawaran resmi.</div></div>',
      '<button type="button" class="btn-primary" onclick="bukaRfqKustom()"><i class="bi bi-file-earmark-text"></i> Buat RFQ Kustom Baru</button>',
      '</div>'
    ].join('');
}

// ============================================================
// POPUP DETAIL PRODUK
// ============================================================
let puDetail = null;
let puDetailReq = 0;

function bukaDetailProduk(id) {
    const req = ++puDetailReq;
    openModal('detailProdukModal');
    document.getElementById('detailProdukBody').innerHTML = '<div class="pu-detail-pad"><div class="empty-state"><div class="spinner-brand" style="margin:0 auto;"></div><p class="mt-3">Memuat detail produk...</p></div></div>';
    dbRpc('get_produk_detail', { p_id: id }).then(function(res) {
        if (req !== puDetailReq) return; // pengguna sudah menutup / membuka produk lain
        if (!res.success || !res.data || !res.data.produk) {
            document.getElementById('detailProdukBody').innerHTML = '<div class="pu-detail-pad"><div class="empty-state"><i class="bi bi-exclamation-circle"></i>Produk tidak ditemukan atau sudah tidak tersedia.' + (res.success ? '' : '<br><span class="text-xs">' + escapeHtml(res.message) + '</span>') + '</div></div>';
            return;
        }
        const p = res.data.produk;
        const tiers = urutkanTier(res.data.tiers);
        const warna = daftarWarna(p);
        puDetail = {
            p: p, tiers: tiers, paket: res.data.paket || [], galeri: galeriProduk(p), fotoIdx: 0,
            mode: modeAktif(),
            qty: modeAktif() === 'b2b' ? moqProduk(p, tiers) : 1,
            warnaList: warna, warna: warna.length === 1 ? warna[0] : '',
            paketIdx: ((res.data.paket || []).length === 1) ? 0 : null,
            modelList: daftarModel(p), model: ''
        };
        renderDetailProduk();
    });
}
function tutupDetailProduk() {
    puDetailReq++;
    puDetail = null;
    closeModal('detailProdukModal');
}

function renderDetailProduk() {
    const d = puDetail;
    if (!d) return;
    const p = d.p, b2b = d.mode === 'b2b';
    const satuan = p.satuan || 'pcs';
    const tipe = p.tipe_pemesanan || 'Standar';
    const adaPaket = tipe === 'Paket' && d.paket.length > 0;

    // ---- kolom kiri: galeri + legalitas ----
    const utama = d.galeri[d.fotoIdx] || '';
    let kiri = '<div class="pu-gallery-main">' + (utama
        ? '<img id="puFotoUtama" src="' + escapeAttr(utama) + '" alt="' + escapeAttr(p.nama_produk) + '">'
        : '<div class="no-img"><i class="bi bi-image" style="font-size:48px;"></i></div>') + '</div>';
    if (d.galeri.length > 1) {
        kiri += '<div class="pu-thumbs">' + d.galeri.map(function(u, i) {
            return '<button type="button" class="pu-thumb' + (i === d.fotoIdx ? ' active' : '') + '" onclick="puGantiFoto(' + i + ')"><img src="' + escapeAttr(u) + '" alt=""></button>';
        }).join('') + '</div>';
    }
    const chipsLengkap = sertifikatChipsHtml(p, 0);
    if (chipsLengkap || p.ketahanan_simpan) {
        kiri += '<div class="pu-legal"><div class="pu-legal-title"><i class="bi bi-patch-check-fill"></i> LEGALITAS &amp; LISENSI UMKM</div>' +
            (chipsLengkap ? '<div class="pu-cert-wrap">' + chipsLengkap + '</div>' : '') +
            (p.ketahanan_simpan ? '<div class="pu-legal-sub"><i class="bi bi-calendar-check"></i> Ketahanan Simpan: <b>' + escapeHtml(p.ketahanan_simpan) + '</b></div>' : '') +
            '</div>';
    }

    // ---- blok harga ----
    let harga = '';
    if (b2b) {
        const moq = moqProduk(p, d.tiers);
        let baris = '';
        if (p.tersedia_ritel && moq > 1 && hargaRitelProduk(p) > 0) {
            baris += '<tr data-tier="r"><td>1 - ' + (moq - 1) + ' ' + escapeHtml(satuan) + ' (Ritel)</td><td class="pu-td-harga">' + formatRupiah(hargaRitelProduk(p)) + '</td><td class="pu-td-ket">Harga Standar Eceran</td></tr>';
        }
        d.tiers.forEach(function(t, i) {
            baris += '<tr data-tier="' + i + '"><td>' + escapeHtml(labelRentangTier(d.tiers, i, satuan)) + '</td><td class="pu-td-harga pu-td-grosir">' + formatRupiah(t.harga) + '</td><td class="pu-td-ket">' + escapeHtml(t.keterangan) + '</td></tr>';
        });
        if (!d.tiers.length) {
            baris = '<tr><td colspan="3" class="pu-td-ket" style="padding:10px 0;">' + (bolehPesanLangsungB2b(p)
                ? 'Belum ada skema harga bertingkat. Harga mengikuti harga satuan di bawah.'
                : 'Harga grosir ditentukan lewat penawaran resmi (RFQ).') + '</td></tr>';
        }
        harga = '<div class="pu-tier-box"><div class="pu-tier-head"><span><i class="bi bi-layers-fill"></i> SKEMA HARGA GROSIR BERTINGKAT (B2B)</span><span class="pu-moq-badge">Minimum MOQ: ' + moq + '</span></div>' +
            '<table class="pu-tier-table"><thead><tr><th>KUANTITAS ORDER</th><th>HARGA / SATUAN</th><th>KETERANGAN</th></tr></thead><tbody id="puTierBody">' + baris + '</tbody></table></div>';
    } else {
        const normal = Number(p.harga_normal) || 0;
        const promo = (p.harga_promo !== '' && p.harga_promo != null) ? Number(p.harga_promo) : null;
        const ritel = hargaRitelProduk(p);
        const hargaTeks = (tipe === 'Custom' && ritel === 0)
            ? '<span class="pu-price" style="font-size:18px;">Sesuai budget Anda</span>'
            : '<span class="pu-price">' + formatRupiah(ritel) + '</span><span class="pu-unit">/ ' + escapeHtml(satuan) + '</span>' + (promo ? '<span class="price-old">' + formatRupiah(normal) + '</span>' : '');
        harga = '<div class="pu-price-box"><div class="pu-price-row">' + hargaTeks + '</div>' +
            (p.minimal_order ? '<div class="pu-minorder"><i class="bi bi-info-circle"></i> Minimal Order: ' + escapeHtml(p.minimal_order) + '</div>' : '') + '</div>';
    }

    // ---- dropdown paket (tetap ada di mode Ritel maupun Grosir) ----
    let paketHtml = '';
    if (adaPaket) {
        paketHtml = '<div class="pu-paket" id="puPaketBox"><div class="pu-label">Pilih Paket <span class="pu-req">*</span></div>' +
            '<select class="form-select" id="puPaketSelect" onchange="puPilihPaketIdx(this.value)">' +
            '<option value="">-- Pilih salah satu paket --</option>' +
            d.paket.map(function(pk, i) {
                return '<option value="' + i + '"' + (d.paketIdx === i ? ' selected' : '') + '>' + escapeHtml(labelPaketLengkap(pk, d)) + '</option>';
            }).join('') + '</select>' +
            '<div class="pu-paket-menu" id="puPaketMenu"></div></div>';
    }

    // ---- pilihan model/tipe berdasarkan nomor foto ----
    let modelHtml = '';
    if (d.modelList.length) {
        modelHtml = '<div class="pu-model" id="puModelBox"><div class="pu-label">Pilih Model / Tipe <span class="pu-req">*</span></div>' +
            '<p class="pu-model-info">Setiap foto menunjukkan model yang berbeda. Pilih sesuai gambar yang Anda inginkan.</p>' +
            '<div class="pu-model-list">' +
            d.modelList.map(function(m, i) {
                return '<button type="button" class="pu-model-chip' + (d.model === m.label ? ' active' : '') + '" onclick="puPilihModel(' + i + ')">' +
                       '<img src="' + escapeAttr(m.url) + '" alt=""><span>' + escapeHtml(m.label) + '</span></button>';
            }).join('') + '</div></div>';
    }

    // ---- pilihan warna ----
    let warna = '';
    if (d.warnaList.length) {
        warna = '<div class="pu-warna" id="puWarnaBox"><div class="pu-label">Pilih Warna' + (b2b ? ' <span class="pu-opt">(opsional)</span>' : ' <span class="pu-req">*</span>') + '</div><div class="pu-warna-list">' +
            d.warnaList.map(function(w, i) {
                return '<button type="button" class="pu-warna-chip' + (d.warna === w ? ' active' : '') + '" onclick="puPilihWarna(' + i + ')">' + escapeHtml(w) + '</button>';
            }).join('') + '</div></div>';
    }

    // ---- kalkulator: ADA untuk semua produk, kecuali Custom di mode Ritel (harga mengikuti budget) ----
    let kalkulator = '';
    const adaKalkulator = b2b || tipe !== 'Custom';
    if (adaKalkulator) {
        kalkulator = '<div class="pu-calc"><div class="pu-calc-title"><i class="bi bi-calculator"></i> KALKULATOR PESANAN ' + (b2b ? 'GROSIR' : 'RITEL') + '</div>' +
            '<div class="pu-calc-row"><span class="pu-label" style="margin:0;">Jumlah:</span>' +
            '<div class="pu-qty"><button type="button" onclick="puUbahQty(-10)">-10</button><button type="button" onclick="puUbahQty(-1)">-1</button>' +
            '<input id="puQtyInput" type="number" min="1" inputmode="numeric" value="' + d.qty + '" oninput="puSetQty(this.value)">' +
            '<button type="button" onclick="puUbahQty(1)">+1</button><button type="button" onclick="puUbahQty(10)">+10</button></div>' +
            '<div class="pu-total-wrap"><div class="pu-total-label">Total Estimasi Harga:</div><div class="pu-total" id="puTotal"></div><div class="pu-total-sub" id="puTotalSub"></div></div></div>' +
            '<div class="pu-warn" id="puPeringatan"></div></div>';
    }

    // ---- tombol aksi ----
    const wa = waLinkHref(p.nama_produk, p.nama_umkm, hargaRitelProduk(p));
    const tombolWa = wa ? '<a class="btn-icon-sm pu-wa" href="' + escapeAttr(wa) + '" target="_blank" rel="noopener" title="Tanya Admin via WhatsApp"><i class="bi bi-whatsapp"></i></a>' : '';
    let aksi = '';
    if (b2b) {
        if (bolehPesanLangsungB2b(p)) {
            aksi += '<button type="button" class="btn-primary" onclick="puTambahKeranjang()"><i class="bi bi-cart-plus"></i> Pesan Langsung</button>';
        }
        if (tampilkanRfq(p)) {
            aksi += '<button type="button" class="' + (bolehPesanLangsungB2b(p) ? 'pu-btn-dark' : 'btn-primary') + '" onclick="puAjukanRfq()"><i class="bi bi-file-earmark-text"></i> Ajukan RFQ B2B</button>';
        }
        aksi += '<button type="button" class="btn-ghost" onclick="puMintaSampel()"><i class="bi bi-box-seam"></i> Minta Sampel</button>';
    } else if (tipe === 'Custom') {
        aksi = '<button type="button" class="btn-primary" onclick="puPesanCustom()"><i class="bi bi-pencil-square"></i> Pesan Custom</button>';
    } else {
        aksi = '<button type="button" class="btn-primary" onclick="puTambahKeranjang()"><i class="bi bi-cart-plus"></i> Tambah ke Keranjang</button>';
    }

    document.getElementById('detailProdukBody').innerHTML =
        '<div class="pu-detail">' +
        '<div class="pu-detail-left">' + kiri + '</div>' +
        '<div class="pu-detail-right">' +
        '<div class="pu-detail-meta"><span class="pu-pill-kat">' + escapeHtml(LABEL_KATEGORI_PENDEK[p.kategori] || p.kategori || '') + '</span>' + (p.sub_kategori ? '<span class="pu-sub">' + escapeHtml(p.sub_kategori) + '</span>' : '') + '</div>' +
        '<h2 class="pu-detail-title">' + escapeHtml(p.nama_produk) + '</h2>' +
        '<div class="pu-detail-by">Diproduksi oleh: <b>' + escapeHtml(p.nama_umkm) + '</b></div>' +
        (p.deskripsi ? '<p class="pu-detail-desc">' + escapeHtml(p.deskripsi) + '</p>' : '') +
        harga + paketHtml + modelHtml + warna + kalkulator +
        '<div class="pu-actions">' + tombolWa + aksi + '</div>' +
        '</div></div>';
    puGambarMenuPaket();
    puHitungUlang();
}
/** Harga satu paket: harga paket sendiri kalau diisi, kalau tidak ikut harga dasar. */
function hargaPaket(pk, d) {
    if (pk && pk.harga !== null && pk.harga !== undefined && pk.harga !== '') return Number(pk.harga);
    return hargaDasarTanpaPaket(d);
}
/** Harga dasar kalau paket tidak menentukan harganya sendiri. */
function hargaDasarTanpaPaket(d) {
    if (!d) return 0;
    if (d.mode === 'b2b') return hitungHargaGrosir(d.p, d.tiers, Math.max(1, Number(d.qty) || 1)).harga;
    return hargaRitelProduk(d.p);
}
/**
 * Teks satu pilihan di dropdown paket: nama, harga, dan RINCIAN MENU, supaya
 * customer bisa membaca isi tiap paket tanpa harus memilihnya satu per satu.
 */
function labelPaketLengkap(pk, d) {
    let t = pk.nama_paket + ' - ' + formatRupiah(hargaPaket(pk, d));
    if (pk.deskripsi_menu) t += ' (' + pk.deskripsi_menu + ')';
    return t;
}
/** Tampilkan isi menu paket yang sedang dipilih, di bawah dropdown. */
function puGambarMenuPaket() {
    const d = puDetail;
    const el = document.getElementById('puPaketMenu');
    if (!d || !el) return;
    const pk = (d.paketIdx !== null && d.paketIdx !== undefined) ? d.paket[d.paketIdx] : null;
    if (!pk) { el.innerHTML = ''; el.style.display = 'none'; return; }
    el.innerHTML = '<b>' + escapeHtml(pk.nama_paket) + '</b> &middot; ' + formatRupiah(hargaPaket(pk, d)) + ' / ' + escapeHtml(d.p.satuan || 'pcs') +
        (pk.deskripsi_menu ? ('<div style="margin-top:3px;"><i class="bi bi-list-ul"></i> ' + escapeHtml(pk.deskripsi_menu) + '</div>') : '');
    el.style.display = 'block';
}
function puPilihPaketIdx(v) {
    const d = puDetail;
    if (!d) return;
    d.paketIdx = (v === '' || v === null) ? null : Number(v);
    const box = document.getElementById('puPaketBox');
    if (box) box.classList.remove('pu-invalid');
    puGambarMenuPaket();
    puHitungUlang();
}
/**
 * Harga satuan yang berlaku sekarang. Kalau produk berpaket dan paket yang
 * dipilih punya harga sendiri, harga PAKET yang dipakai - berlaku di mode Ritel
 * maupun Grosir, karena tiap paket isinya berbeda sehingga harganya berbeda.
 * Kalau paket tidak menentukan harga, barulah harga dasar yang dipakai
 * (harga ritel, atau harga bertingkat pada mode Grosir).
 */
function puHargaSatuanAktif() {
    const d = puDetail;
    if (!d) return 0;
    const pk = (d.paketIdx !== null && d.paketIdx !== undefined) ? d.paket[d.paketIdx] : null;
    if (pk && pk.harga !== null && pk.harga !== undefined && pk.harga !== '') return Number(pk.harga);
    return hargaDasarTanpaPaket(d);
}

function puGantiFoto(i) {
    const d = puDetail;
    if (!d || !d.galeri[i]) return;
    d.fotoIdx = i;
    const img = document.getElementById('puFotoUtama');
    if (img) img.src = d.galeri[i];
    document.querySelectorAll('#detailProdukBody .pu-thumb').forEach(function(el, idx) { el.classList.toggle('active', idx === i); });
}
/** Pilih model: menandai pilihan sekaligus menampilkan fotonya di galeri atas. */
function puPilihModel(i) {
    const d = puDetail;
    if (!d || !d.modelList[i]) return;
    d.model = d.modelList[i].label;
    puGantiFoto(d.modelList[i].idx);
    document.querySelectorAll('#puModelBox .pu-model-chip').forEach(function(el, idx) { el.classList.toggle('active', idx === i); });
    const box = document.getElementById('puModelBox');
    if (box) box.classList.remove('pu-invalid');
}
/** Model wajib dipilih kalau produk memang punya beberapa model. */
function puPastikanModel() {
    const d = puDetail;
    if (!d || !d.modelList.length || d.model) return true;
    const box = document.getElementById('puModelBox');
    if (box) { box.classList.add('pu-invalid'); box.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    showToast('Pilih Model', 'Produk ini punya beberapa model. Pilih dulu sesuai gambar yang Anda inginkan.', 'warning');
    return false;
}
function puPilihWarna(i) {
    const d = puDetail;
    if (!d) return;
    d.warna = d.warnaList[i] || '';
    document.querySelectorAll('#puWarnaBox .pu-warna-chip').forEach(function(el, idx) { el.classList.toggle('active', idx === i); });
    const box = document.getElementById('puWarnaBox');
    if (box) box.classList.remove('pu-invalid');
}
function puUbahQty(delta) {
    const d = puDetail;
    if (!d) return;
    d.qty = Math.max(1, (Number(d.qty) || 1) + delta);
    const inp = document.getElementById('puQtyInput');
    if (inp) inp.value = d.qty;
    puHitungUlang();
}
function puSetQty(val) {
    const d = puDetail;
    if (!d) return;
    const n = parseInt(val, 10);
    d.qty = n >= 1 ? n : 1; // kolom isian tidak diubah selagi diketik; hanya perhitungan yang memakai minimal 1
    puHitungUlang();
}
/** Perbarui total, catatan tier, peringatan MOQ, dan sorot baris tier yang berlaku. */
function puHitungUlang() {
    const d = puDetail;
    if (!d) return;
    const p = d.p, qty = Math.max(1, Number(d.qty) || 1), satuan = p.satuan || 'pcs';
    const elTotal = document.getElementById('puTotal');
    const elSub = document.getElementById('puTotalSub');
    const elWarn = document.getElementById('puPeringatan');
    let warn = '', aktifIdx = null;
    const harga = puHargaSatuanAktif();
    if (d.mode === 'b2b') {
        const h = hitungHargaGrosir(p, d.tiers, qty);
        if (h.tier) aktifIdx = String(d.tiers.indexOf(h.tier));
        else if (h.dibawahMoq && p.tersedia_ritel && d.tiers.length) aktifIdx = 'r';
        const pkAktif = (d.paketIdx !== null && d.paketIdx !== undefined) ? d.paket[d.paketIdx] : null;
        const hargaDariPaket = pkAktif && pkAktif.harga !== null && pkAktif.harga !== undefined && pkAktif.harga !== '';
        if (hargaDariPaket) { warn = 'Harga mengikuti paket "' + pkAktif.nama_paket + '", bukan tabel harga bertingkat.'; aktifIdx = null; }
        else if (!h.adaTier && !bolehPesanLangsungB2b(p)) warn = 'Harga grosir ditentukan lewat penawaran resmi (RFQ). Angka di atas hanya acuan harga ritel.';
        else if (h.dibawahMoq) warn = 'Jumlah di bawah MOQ grosir (' + moqProduk(p, d.tiers) + ' ' + satuan + ').' + (bolehPesanLangsungB2b(p) ? ' Pesanan langsung minimal sebesar MOQ.' : ' Pengajuan RFQ minimal sebesar MOQ.');
    }
    if (elTotal) elTotal.textContent = formatRupiah(harga * qty);
    if (elSub) elSub.textContent = '(@ ' + formatRupiah(harga) + ' / ' + satuan + ')';
    if (elWarn) { elWarn.textContent = warn; elWarn.style.display = warn ? 'block' : 'none'; }
    document.querySelectorAll('#puTierBody tr[data-tier]').forEach(function(tr) {
        tr.classList.toggle('aktif', aktifIdx !== null && tr.getAttribute('data-tier') === aktifIdx);
    });
}
/** Warna wajib dipilih pada mode ritel kalau produk punya pilihan warna. */
function puPastikanWarna() {
    const d = puDetail;
    if (!d || !d.warnaList.length || d.warna) return true;
    const box = document.getElementById('puWarnaBox');
    if (box) { box.classList.add('pu-invalid'); box.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    showToast('Pilih Warna', 'Silakan pilih warna produk terlebih dahulu.', 'warning');
    return false;
}
/** Produk bertipe Paket wajib memilih salah satu paket sebelum dipesan. */
function puPastikanPaket() {
    const d = puDetail;
    if (!d || (d.p.tipe_pemesanan !== 'Paket') || !d.paket.length) return true;
    if (d.paketIdx !== null && d.paketIdx !== undefined) return true;
    const box = document.getElementById('puPaketBox');
    if (box) { box.classList.add('pu-invalid'); box.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    showToast('Pilih Paket', 'Silakan pilih salah satu paket terlebih dahulu.', 'warning');
    return false;
}
/** Di mode Grosir, pesanan langsung minimal sebesar MOQ. */
function puPastikanMoq() {
    const d = puDetail;
    if (!d || d.mode !== 'b2b') return true;
    const moq = moqProduk(d.p, d.tiers);
    if (Math.max(1, Number(d.qty) || 1) >= moq) return true;
    showToast('Jumlah kurang', 'Pesanan grosir minimal ' + moq + ' ' + (d.p.satuan || 'pcs') + '.', 'warning');
    const inp = document.getElementById('puQtyInput');
    if (inp) { inp.scrollIntoView({ block: 'center', behavior: 'smooth' }); inp.focus(); }
    return false;
}
function puTambahKeranjang() {
    const d = puDetail;
    if (!d || !puPastikanModel() || !puPastikanWarna() || !puPastikanPaket() || !puPastikanMoq()) return;
    const p = d.p;
    const pk = (d.paketIdx !== null && d.paketIdx !== undefined) ? d.paket[d.paketIdx] : null;
    const nama = pk ? (p.nama_produk + ' - ' + pk.nama_paket) : p.nama_produk;
    const catatan = pk ? (pk.deskripsi_menu || '') : '';
    addToCart(p.id, nama, puHargaSatuanAktif(), p.satuan || 'pcs', p.nama_umkm, d.qty, catatan, d.warna, d.mode, d.model);
    tutupDetailProduk();
}
function puPesanCustom() {
    const d = puDetail;
    if (!d || !puPastikanModel() || !puPastikanWarna()) return;
    const p = d.p, warna = d.warna, model = d.model;
    tutupDetailProduk();
    bukaPesananCustom({ id: p.id, nama: p.nama_produk, harga: hargaRitelProduk(p), satuan: p.satuan || 'pcs', umkm: p.nama_umkm, warna: warna, model: model });
}
function puAjukanRfq() {
    const d = puDetail;
    if (!d) return;
    const qty = Math.max(d.qty, moqProduk(d.p, d.tiers));
    const data = { jenis: 'RFQ', produk: d.p, tiers: d.tiers, qty: qty, warna: d.warna, model: d.model };
    tutupDetailProduk();
    bukaRfq(data);
}
function puMintaSampel() {
    const d = puDetail;
    if (!d) return;
    const data = { jenis: 'Sampel', produk: d.p, tiers: d.tiers, qty: 1, warna: d.warna, model: d.model };
    tutupDetailProduk();
    bukaRfq(data);
}

// ============================================================
// RFQ B2B  (Request for Quotation) & PERMINTAAN SAMPEL
// Disimpan ke database (tabel rfq) dan dikirim ke Admin lewat WhatsApp; Admin
// mengunduh dokumen PDF terstandar dari menu RFQ. Nama UMKM ikut disimpan
// supaya kelak bisa diarahkan langsung ke UMKM pemilik produk.
// ============================================================
const OPSI_PEMBAYARAN_RFQ = ['Cash in Advance / Lunas', 'DP', 'TOP 14 Hari', 'TOP 30 Hari'];
const OPSI_PEMBAYARAN_SAMPEL = ['Dibeli', 'Pinjam sementara'];
let rfqState = null;
let rfqModelTerpilih = '';   // pilihan model/tipe yang dibawa dari popup detail produk

/** "DP" + 30 -> "DP 30%"; opsi lain apa adanya. */
function teksPembayaran(opsi, dp) {
    if (opsi === 'DP' && dp != null && dp !== '') return 'DP ' + Number(dp) + '%';
    return opsi || '';
}
function labelOpsiBayar(o) { return o === 'DP' ? 'DP (uang muka)' : o; }

function bukaRfqKustom() { bukaRfq({ jenis: 'Kustom' }); }

/** Dipakai tombol "RFQ B2B" di kartu produk: ambil tier harga dulu, lalu buka form. */
function bukaRfqUntukProdukId(id, jenis) {
    document.getElementById('previewModalTitle').textContent = 'Pengajuan Penawaran B2B (RFQ)';
    document.getElementById('previewModalContent').innerHTML = '<div class="empty-state"><div class="spinner-brand" style="margin:0 auto;"></div></div>';
    openModal('previewModal');
    dbRpc('get_produk_detail', { p_id: id }).then(function(res) {
        if (!res.success || !res.data || !res.data.produk) {
            document.getElementById('previewModalContent').innerHTML = '<div class="empty-state"><i class="bi bi-exclamation-circle"></i>Produk tidak ditemukan.</div>';
            return;
        }
        const tiers = urutkanTier(res.data.tiers);
        bukaRfq({ jenis: jenis || 'RFQ', produk: res.data.produk, tiers: tiers, qty: jenis === 'Sampel' ? 1 : moqProduk(res.data.produk, tiers) });
    });
}

/**
 * @param {{jenis:'RFQ'|'Sampel'|'Kustom', produk?:object, tiers?:array, qty?:number, warna?:string}} opts
 */
function bukaRfq(opts) {
    const jenis = opts.jenis || 'RFQ';
    const p = opts.produk || null;
    const sampel = jenis === 'Sampel';
    rfqState = { jenis: jenis, produk: p, tiers: urutkanTier(opts.tiers) };
    const judul = sampel ? 'Permintaan Paket Sampel B2B' : (jenis === 'Kustom' ? 'Pengajuan Penawaran B2B Kustom (RFQ)' : 'Pengajuan Penawaran B2B (RFQ)');
    const satuan = p ? (p.satuan || 'pcs') : '';
    const qty = Math.max(1, Number(opts.qty) || 1);
    const spekAwal = [opts.model ? ('Model: ' + opts.model) : '', opts.warna ? ('Warna: ' + opts.warna) : ''].filter(Boolean).join(' | ');
    rfqModelTerpilih = opts.model || '';
    const opsiBayar = sampel ? OPSI_PEMBAYARAN_SAMPEL : OPSI_PEMBAYARAN_RFQ;
    document.getElementById('previewModalTitle').textContent = judul;
    document.getElementById('previewModalContent').innerHTML = [
      '<form id="rfqForm" class="text-left" onsubmit="submitRfq(event)">',
      '<p class="text-xs mb-3" style="color:var(--text-muted)">' + (sampel
          ? 'Ajukan paket sampel produk ini sebelum memesan dalam jumlah besar. Pengajuan diterima Admin PortoUMKM lalu diteruskan ke produsen UMKM.'
          : 'Request for Quotation. Pengajuan Anda diterima Admin PortoUMKM, lalu diteruskan ke produsen UMKM untuk penawaran resmi.') + '</p>',
      '<div class="form-group"><label class="form-label">Nama Perusahaan *</label><input class="form-input" id="rfqPerusahaan" required maxlength="200" placeholder="PT / CV / Toko / Instansi"></div>',
      '<div class="form-group"><label class="form-label">PIC / Pembeli *</label><input class="form-input" id="rfqPic" required maxlength="200" placeholder="Nama orang yang dihubungi"></div>',
      '<div class="form-group"><label class="form-label">Nomor WhatsApp / HP Aktif *</label><input class="form-input" id="rfqKontak" required maxlength="50" inputmode="tel" placeholder="08xxxxxxxxxx"></div>',
      '<div class="grid grid-cols-2 gap-3">',
      '<div class="form-group"><label class="form-label">' + (jenis === 'Kustom' ? 'Produk / Kebutuhan *' : (sampel ? 'Sampel Produk' : 'Produk Dipesan')) + '</label>',
      '<input class="form-input" id="rfqProduk" maxlength="300" ' + (p ? 'readonly value="' + escapeAttr(p.nama_produk) + '"' : 'required placeholder="Produk atau jenis kebutuhan Anda"') + '></div>',
      '<div class="form-group"><label class="form-label">' + (sampel ? 'Jumlah Sampel' : 'Target Jumlah' + (satuan ? ' (' + escapeHtml(satuan) + ')' : '')) + ' *</label>',
      '<input class="form-input" id="rfqJumlah" type="number" min="1" required value="' + qty + '" oninput="rfqHitungEstimasi()"></div>',
      '</div>',
      '<div class="form-group" id="rfqHargaWrap"><label class="form-label">Harga yang Diminta (Rp per ' + escapeHtml(satuan || 'satuan') + ') - opsional</label>',
      '<input class="form-input" id="rfqHarga" type="number" min="0" inputmode="numeric" placeholder="mis. 30000" oninput="rfqHitungEstimasi()">',
      '<p class="text-xs mt-1" style="color:var(--text-muted)">Diisi agar produsen UMKM langsung tahu harga yang Anda harapkan.</p></div>',
      '<div class="grid grid-cols-2 gap-3">',
      '<div class="form-group"><label class="form-label">' + (sampel ? 'Skema Sampel' : 'Opsi Pembayaran Yang Diajukan') + '</label><select class="form-select" id="rfqBayar" onchange="rfqBayarBerubah()">' +
          opsiBayar.map(function(o) { return '<option value="' + escapeAttr(o) + '">' + escapeHtml(labelOpsiBayar(o)) + '</option>'; }).join('') + '</select></div>',
      '<div class="form-group"><label class="form-label">Batas Waktu Pengiriman (Deadline)</label><input class="form-input" id="rfqDeadline" type="date"></div>',
      '</div>',
      '<div class="form-group" id="rfqDpWrap" style="display:none;"><label class="form-label">Persentase DP yang Diajukan (%) *</label>',
      '<input class="form-input" id="rfqDp" type="number" min="1" max="99" step="any" inputmode="decimal" placeholder="mis. 30"></div>',
      '<div class="form-group"><label class="form-label">Alamat Penerima *</label>',
      '<textarea class="form-textarea" id="rfqAlamat" required maxlength="500" placeholder="Alamat lengkap tujuan pengiriman"></textarea></div>',
      '<div class="form-group"><label class="form-label">Spesifikasi Khusus / Kebutuhan Kustom</label>',
      '<textarea class="form-textarea" id="rfqSpek" maxlength="2000" placeholder="Misal: kebutuhan cetak logo perusahaan di kemasan, standar kemasan vacuum, varian rasa khusus...">' + escapeHtml(spekAwal) + '</textarea></div>',
      '<div id="rfqEstimasi" class="pu-rfq-est"></div>',
      '<div id="rfqError" class="text-xs mt-1 mb-2" style="color:#dc2626;"></div>',
      '<div class="flex justify-end gap-2 mt-3">',
      '<button type="button" class="btn-ghost" onclick="closeModal(\'previewModal\')">Batal</button>',
      '<button type="submit" class="btn-primary" id="rfqBtnKirim"><i class="bi bi-send"></i> Kirim ' + (sampel ? 'Permintaan' : 'RFQ') + ' Sekarang</button>',
      '</div>',
      '</form>'
    ].join('');
    openModal('previewModal');
    rfqBayarBerubah();
}

/** Tampilkan kolom DP bila memilih DP; sembunyikan harga diminta bila sampel dipinjam (tidak ada transaksi harga). */
function rfqBayarBerubah() {
    const st = rfqState;
    const sel = document.getElementById('rfqBayar');
    if (!st || !sel) return;
    const dpWrap = document.getElementById('rfqDpWrap');
    const hargaWrap = document.getElementById('rfqHargaWrap');
    if (dpWrap) dpWrap.style.display = (st.jenis !== 'Sampel' && sel.value === 'DP') ? 'block' : 'none';
    if (hargaWrap) hargaWrap.style.display = (st.jenis === 'Sampel' && sel.value === 'Pinjam sementara') ? 'none' : 'block';
    rfqHitungEstimasi();
}
/** Ringkasan di bawah form: acuan harga skema grosir + total pada harga yang diminta. */
function rfqHitungEstimasi() {
    const el = document.getElementById('rfqEstimasi');
    if (!el || !rfqState) return;
    const p = rfqState.produk;
    const qty = Math.max(1, parseInt((document.getElementById('rfqJumlah') || {}).value, 10) || 1);
    const baris = [];
    if (p && rfqState.jenis === 'RFQ' && rfqState.tiers.length) {
        const h = hitungHargaGrosir(p, rfqState.tiers, qty);
        baris.push(h.dibawahMoq
            ? '<i class="bi bi-info-circle"></i> Jumlah di bawah MOQ grosir (' + moqProduk(p, rfqState.tiers) + ' ' + escapeHtml(p.satuan || '') + ').'
            : '<i class="bi bi-calculator"></i> Acuan harga grosir: <b>' + formatRupiah(h.harga) + '</b> / ' + escapeHtml(p.satuan || 'pcs') + ' &middot; total <b>' + formatRupiah(h.harga * qty) + '</b> <span class="text-xs">(harga final mengikuti penawaran resmi)</span>');
    }
    const hargaEl = document.getElementById('rfqHarga');
    const hargaWrap = document.getElementById('rfqHargaWrap');
    const diminta = hargaEl && hargaEl.value !== '' ? Number(hargaEl.value) : null;
    if (diminta !== null && diminta >= 0 && (!hargaWrap || hargaWrap.style.display !== 'none')) {
        baris.push('<i class="bi bi-tag"></i> Harga yang Anda minta: <b>' + formatRupiah(diminta) + '</b> / ' + escapeHtml((p && p.satuan) || 'satuan') + ' &middot; perkiraan total <b>' + formatRupiah(diminta * qty) + '</b>');
    }
    el.style.display = baris.length ? 'block' : 'none';
    el.innerHTML = baris.join('<br>');
}

function submitRfq(e) {
    e.preventDefault();
    const st = rfqState;
    if (!st) return;
    const el = function(id) { return document.getElementById(id); };
    const errEl = el('rfqError');
    errEl.textContent = '';
    const p = st.produk;
    const sampel = st.jenis === 'Sampel';
    const perusahaan = el('rfqPerusahaan').value.trim();
    const pic = el('rfqPic').value.trim();
    const kontak = el('rfqKontak').value.trim();
    const alamat = el('rfqAlamat').value.trim();
    const namaProduk = el('rfqProduk').value.trim();
    const jumlah = parseInt(el('rfqJumlah').value, 10);
    const bayar = el('rfqBayar').value;
    const deadline = el('rfqDeadline').value || null;
    const spek = el('rfqSpek').value.trim();
    if (!perusahaan || !pic || !kontak || !alamat || !namaProduk) { errEl.textContent = 'Lengkapi semua kolom bertanda *.'; return; }
    if (!(jumlah >= 1)) { errEl.textContent = 'Jumlah minimal 1.'; return; }
    if (st.jenis === 'RFQ' && p && st.tiers.length && jumlah < moqProduk(p, st.tiers)) {
        errEl.textContent = 'Jumlah pengajuan RFQ minimal sebesar MOQ grosir: ' + moqProduk(p, st.tiers) + ' ' + (p.satuan || '') + '.';
        return;
    }
    // harga yang diminta (opsional; tidak berlaku untuk sampel yang dipinjam)
    const hargaTersedia = !(sampel && bayar === 'Pinjam sementara');
    let hargaDiminta = null;
    if (hargaTersedia && el('rfqHarga').value !== '') {
        hargaDiminta = Number(el('rfqHarga').value);
        if (!(hargaDiminta >= 0)) { errEl.textContent = 'Harga yang diminta tidak valid.'; return; }
    }
    // persentase DP (hanya RFQ yang memilih DP)
    let dp = null;
    if (!sampel && bayar === 'DP') {
        dp = Number(el('rfqDp').value);
        if (el('rfqDp').value === '' || !(dp >= 1 && dp <= 99)) { errEl.textContent = 'Isi persentase DP antara 1 sampai 99.'; return; }
    }
    let hargaEstimasi = null;
    if (st.jenis === 'RFQ' && p && st.tiers.length) hargaEstimasi = hitungHargaGrosir(p, st.tiers, jumlah).harga;

    const btn = el('rfqBtnKirim');
    const asli = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-inline"></span> Mengirim...';
    btn.disabled = true;
    const data = {
        jenis: st.jenis, perusahaan: perusahaan, pic: pic, kontak: kontak, alamat: alamat, namaProduk: namaProduk,
        namaUmkm: p ? (p.nama_umkm || '') : '', model: rfqModelTerpilih, jumlah: jumlah, satuan: p ? (p.satuan || '') : '', hargaDiminta: hargaDiminta,
        bayar: bayar, dp: dp, deadline: deadline, spek: spek, hargaEstimasi: hargaEstimasi, nomor: ''
    };
    return dbRpc('submit_rfq', {
        p_jenis: data.jenis, p_nama_perusahaan: perusahaan, p_nama_pic: pic, p_kontak: kontak, p_alamat_penerima: alamat,
        p_produk_id: p ? p.id : null, p_nama_produk: namaProduk, p_nama_umkm: data.namaUmkm, p_target_jumlah: jumlah, p_satuan: data.satuan,
        p_harga_diminta: hargaDiminta, p_opsi_pembayaran: bayar, p_dp_persen: dp, p_batas_waktu: deadline,
        p_spesifikasi: spek, p_harga_estimasi: hargaEstimasi, p_model: rfqModelTerpilih
    }).then(function(res) {
        if (!res.success) {
            btn.innerHTML = asli;
            btn.disabled = false;
            errEl.textContent = 'Gagal mengirim: ' + res.message;
            return;
        }
        data.nomor = (res.data && res.data.nomor) || '';
        rfqSelesai(data);
    });
}
function pesanWaRfq(d) {
    const sampel = d.jenis === 'Sampel';
    let t = sampel
        ? 'Halo Admin PortoUMKM, saya ingin meminta *Paket Sampel B2B*:\n\n'
        : 'Halo Admin PortoUMKM, saya ingin mengajukan *RFQ B2B* (Request for Quotation):\n\n';
    if (d.nomor) t += '*No. Dokumen:* ' + d.nomor + '\n';
    t += '*Perusahaan:* ' + d.perusahaan + '\n';
    t += '*PIC/Pembeli:* ' + d.pic + '\n';
    t += '*WhatsApp/HP:* ' + d.kontak + '\n';
    t += '*Alamat Penerima:* ' + d.alamat + '\n';
    t += '*Produk:* ' + d.namaProduk + '\n';
    if (d.namaUmkm) t += '*UMKM:* ' + d.namaUmkm + '\n';
    if (d.model) t += '*Model/Tipe:* ' + d.model + '\n';
    t += '*' + (sampel ? 'Jumlah Sampel' : 'Target Jumlah') + ':* ' + d.jumlah + (d.satuan ? ' ' + d.satuan : '') + '\n';
    if (d.hargaDiminta != null) t += '*Harga yang Diminta:* ' + formatRupiah(d.hargaDiminta) + (d.satuan ? ' / ' + d.satuan : '') + '\n';
    if (d.hargaEstimasi) t += '*Acuan Harga Skema Grosir:* ' + formatRupiah(d.hargaEstimasi) + ' (final mengikuti penawaran resmi)\n';
    t += '*' + (sampel ? 'Skema Sampel' : 'Opsi Pembayaran') + ':* ' + teksPembayaran(d.bayar, d.dp) + '\n';
    if (d.deadline) t += '*Batas Waktu Pengiriman:* ' + d.deadline + '\n';
    if (d.spek) t += '*Spesifikasi/Kebutuhan:* ' + d.spek + '\n';
    return t;
}
function rfqSelesai(d) {
    const waNumber = String(AppState.config.waAdminNumber || '').replace(/[^0-9]/g, '');
    const url = waNumber ? ('https://wa.me/' + waNumber + '?text=' + encodeURIComponent(pesanWaRfq(d))) : '';
    document.getElementById('previewModalContent').innerHTML = [
      '<div class="text-center py-4">',
      '<i class="bi bi-check-circle-fill" style="font-size:44px; color:#16a34a;"></i>',
      '<h3 class="font-bold mt-3" style="color:var(--text-primary)">' + (d.jenis === 'Sampel' ? 'Permintaan Sampel Tersimpan!' : 'RFQ Tersimpan!') + '</h3>',
      d.nomor ? '<p class="text-sm mt-1" style="color:var(--text-body)">Nomor dokumen: <b>' + escapeHtml(d.nomor) + '</b></p>' : '',
      '<p class="text-sm mt-1 mb-5" style="color:var(--text-muted)">Klik tombol di bawah untuk mengirim rincian ke WhatsApp Admin supaya segera diproses.</p>',
      url ? ('<a href="' + escapeAttr(url) + '" target="_blank" rel="noopener" class="btn-wa w-full" style="height:48px; font-size:15px;"><i class="bi bi-whatsapp" style="font-size:20px;"></i> Kirim ke WhatsApp Admin</a>')
          : '<p style="color:#d97706;">Nomor WhatsApp Admin belum dikonfigurasi, tetapi pengajuan Anda sudah tersimpan.</p>',
      '<button type="button" class="btn-ghost w-full mt-3" onclick="closeModal(\'previewModal\')">Tutup</button>',
      '</div>'
    ].join('');
}
