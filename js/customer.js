/**
 * ============================================================
 * PortoUMKM - Halaman Customer: Beranda, Semua Produk,
 * Detail Produk, Mitra Pemasaran
 * ============================================================
 */

// -------------------- BERANDA --------------------
function renderHomePage() {
    const container = document.getElementById('app-container');
    container.innerHTML = [
      '<section class="page-wrap" style="padding-top:16px; padding-bottom:0;">',
      '<span class="hero-badge">',
      '<i class="bi bi-patch-check-fill"></i> UMKM Binaan United Tractors - YDBA',
      '</span>',
      '</section>',

      '<section class="page-wrap" style="padding-top:8px;">',
      '<div id="promoBannerSlider" class="promo-banner-slider"></div>',
      '</section>',

      '<section class="hero-section"><div class="page-wrap" style="display:grid; gap:32px; grid-template-columns:1fr; align-items:center;">',
      '<div>',
      '<h1 class="hero-title" style="text-align:center;">' + escapeHtml(AppState.config.heroTitlePart1 || 'Etalase Produk UMKM Binaan') + ' <span style="color:var(--primary)">' + escapeHtml(AppState.config.heroTitleHighlight || 'CSR United Tractors') + '</span><br>' + escapeHtml(AppState.config.heroTitlePart2 || 'Siap Melayani Kebutuhan Anda!') + '</h1>',
      '<p class="mt-3" style="color:var(--text-body); max-width:640px; text-align:center; margin-left:auto; margin-right:auto; font-size:11px;">' + escapeHtml(AppState.config.heroSubtitle || 'Pusat pemesanan langsung produk pangan terstandarisasi, kerajinan kriya otentik, dan hasil pertanian segar dari UMKM binaan') + '</p>',
      '<div class="flex flex-wrap gap-2 mt-4" style="justify-content:center;">',
      '<span class="pill-feature"><i class="bi bi-patch-check text-[var(--primary)]"></i> 100% Halal &amp; P-IRT</span>',
      '<span class="pill-feature"><i class="bi bi-people text-[var(--primary)]"></i> Spesialis Porsi Rapat &amp; B2B</span>',
      '<span class="pill-feature"><i class="bi bi-lightning-charge text-[var(--primary)]"></i> Order Instan Tanpa Registrasi</span>',
      '</div>',
      '<div class="flex flex-wrap gap-3 mt-5">',
      '<button class="btn-primary" style="height:44px; padding:0 22px;" onclick="navigateTo(\'katalog\')"><i class="bi bi-grid"></i> Jelajahi Katalog Produk</button>',
      '<button class="btn-ghost" id="brosurPdfBtn" style="height:44px; padding:0 22px; display:none;" onclick="downloadBrosurPdf()"><i class="bi bi-download"></i> Unduh Brosur Katalog (PDF)</button>',
      '</div>',
      '</div>',
      '<div id="heroCarousel" class="hero-carousel"></div>',
      '</div></section>',

      '<section class="page-wrap">',
      '<div class="widget-row" id="widgetRow">',
      '<div class="widget-item widget-maroon"><i class="bi bi-people-fill"></i> Pemberdayaan UMKM</div>',
      '<div class="widget-item widget-green"><i class="bi bi-whatsapp"></i> Order WA Otomatis</div>',
      '<div class="widget-item widget-blue"><i class="bi bi-receipt"></i> Invoice Resmi Bercap</div>',
      '<div class="widget-item widget-yellow"><i class="bi bi-patch-check-fill"></i> Higienis &amp; Terkurasi</div>',
      '</div>',
      '</section>',

      '<section class="page-wrap" id="homeProdukSection">',
      '<div id="b2bBannerWrap"></div>',
      '<div id="homeProductGridRasa" class="product-grid mb-4"></div>',
      '<div id="homeProductGridTani" class="product-grid mb-4"></div>',
      '<div id="homeProductGridKriya" class="product-grid mb-4"></div>',
      '<div class="text-center mt-2"><button class="btn-ghost" onclick="navigateTo(\'katalog\')">Lihat Semua Produk <i class="bi bi-arrow-right"></i></button></div>',
      '</section>'
    ].join('');

    const bw = document.getElementById('b2bBannerWrap');
    if (bw && isB2B()) bw.innerHTML = bannerB2bHtml();
    loadHomePageDataGabungan();
    const brosurBtn = document.getElementById('brosurPdfBtn');
    if (brosurBtn && AppState.config.brosurPdfUrl) brosurBtn.style.display = 'inline-flex';
}

let heroCarouselItems = [];
let heroCarouselIndex = 0;

function renderHeroCarousel() {
    const el = document.getElementById('heroCarousel');
    if (!el) return;
    if (heroCarouselIndex >= heroCarouselItems.length) heroCarouselIndex = 0;
    const p = heroCarouselItems[heroCarouselIndex];
    const src = p.foto_url || ('https://placehold.co/640x480/0284c7/ffffff?text=' + encodeURIComponent('PortoUMKM'));
    const dots = heroCarouselItems.map(function(_, i) {
        return '<span class="' + (i === heroCarouselIndex ? 'active' : '') + '" onclick="event.stopPropagation(); goToHeroCarousel(' + i + ')"></span>';
    }).join('');
    el.innerHTML = [
      '<img src="' + src + '" alt="PortoUMKM"' + (heroCarouselItems.length > 1 ? ' onclick="heroCarouselStep(1)"' : '') + '>',
      heroCarouselItems.length > 1 ? '<button class="hero-carousel-nav prev" onclick="event.stopPropagation(); heroCarouselStep(-1)"><i class="bi bi-chevron-left"></i></button>' : '',
      heroCarouselItems.length > 1 ? '<button class="hero-carousel-nav next" onclick="event.stopPropagation(); heroCarouselStep(1)"><i class="bi bi-chevron-right"></i></button>' : '',
      '<div class="hero-carousel-dots">' + dots + '</div>'
    ].join('');
}
function heroCarouselStep(dir) {
    heroCarouselIndex = (heroCarouselIndex + dir + heroCarouselItems.length) % heroCarouselItems.length;
    renderHeroCarousel();
}
function goToHeroCarousel(i) { heroCarouselIndex = i; renderHeroCarousel(); }

let promoBannerData = [];
let promoBannerIndex = 0;
let promoBannerTimer = null;

function renderPromoBannerSlider() {
    const el = document.getElementById('promoBannerSlider');
    if (!el) return;
    if (!promoBannerData.length) {
        el.innerHTML = '<img class="promo-banner-slide" src="https://placehold.co/1600x320/0ea5e9/ffffff?text=Promo+PortoUMKM" alt="Promo">';
        return;
    }
    clearInterval(promoBannerTimer);
    promoBannerIndex = 0;
    const renderSlide = function() {
        const f = promoBannerData[promoBannerIndex];
        const src = f.gambar_url || ('https://placehold.co/1600x320/0ea5e9/ffffff?text=' + encodeURIComponent(f.judul || 'Promo'));
        const dots = promoBannerData.map(function(_, i) {
            return '<span class="' + (i === promoBannerIndex ? 'active' : '') + '" onclick="event.stopPropagation(); goToPromoBanner(' + i + ')"></span>';
        }).join('');
        el.innerHTML = [
          '<img class="promo-banner-slide" src="' + escapeAttr(src) + '" alt="' + escapeAttr(f.judul) + '" onclick="previewPromoBanner(' + promoBannerIndex + ')">',
          '<div class="promo-banner-caption">',
          '<div class="text-[10px] font-bold uppercase tracking-wide opacity-80">' + escapeHtml(f.jenis || 'Promo') + '</div>',
          '<div class="font-bold text-sm md:text-base">' + escapeHtml(f.judul) + '</div>',
          '</div>',
          promoBannerData.length > 1 ? ('<div class="promo-banner-dots">' + dots + '</div>') : ''
        ].join('');
    };
    renderSlide();
    if (promoBannerData.length > 1) {
        promoBannerTimer = setInterval(function() {
            promoBannerIndex = (promoBannerIndex + 1) % promoBannerData.length;
            renderSlide();
        }, 4500);
    }
}
function goToPromoBanner(i) { promoBannerIndex = i; renderPromoBannerSlider(); }
/** Klik banner membuka gambar besar; hanya membawa nomor urut (bukan teks judul) di atribut HTML. */
function previewPromoBanner(i) {
    const f = promoBannerData[i];
    if (f) previewImage(f.gambar_url, f.judul);
}

/**
 * Muat data Beranda (hero, banner promo, produk unggulan per kategori) lewat
 * 3 permintaan PARALEL. Produk unggulan mengikuti mode aktif (Ritel/Grosir);
 * cache produk dipisah per mode supaya tidak tertukar saat customer berpindah mode.
 */
function loadHomePageDataGabungan() {
    const mode = modeAktif();
    const kunciProduk = 'homeProdukKategori:' + mode;
    const cachedHero = ambilDariCache('heroCarousel');
    const cachedPromo = ambilDariCache('promoBanner');
    const cachedProduk = ambilDariCache(kunciProduk);
    if (cachedHero && cachedPromo && cachedProduk) {
        heroCarouselItems = cachedHero;
        renderHeroCarousel();
        promoBannerData = cachedPromo;
        renderPromoBannerSlider();
        renderProdukBeranda(cachedProduk);
        return;
    }
    Promise.all([
        dbSelect('hero_carousel', { order: 'urutan', limit: 5 }),
        dbSelect('flyer_promo', { eq: { status: 'Aktif' }, limit: 3 }),
        dbRpc('get_produk_unggulan_per_kategori', { per_kategori: 4, p_mode: mode })
    ]).then(function(results) {
        const heroRes = results[0], flyerRes = results[1], produkRes = results[2];

        const heroItems = (heroRes.success ? heroRes.data : []).filter(function(p) { return p.foto_url; });
        heroCarouselItems = heroItems.length ? heroItems : [{ foto_url: '', nama_produk: 'PortoUMKM', id: '' }];
        simpanKeCache('heroCarousel', heroCarouselItems);
        renderHeroCarousel();

        promoBannerData = flyerRes.success ? flyerRes.data : [];
        simpanKeCache('promoBanner', promoBannerData);
        renderPromoBannerSlider();

        const d = produkRes.success ? (produkRes.data || {}) : {};
        simpanKeCache(kunciProduk, d);
        if (mode === modeAktif()) renderProdukBeranda(d); // abaikan kalau customer sudah pindah mode selagi memuat

        if (!heroRes.success) showToast('Error', 'Gagal memuat hero: ' + heroRes.message, 'danger');
        if (!flyerRes.success) showToast('Error', 'Gagal memuat promo: ' + flyerRes.message, 'danger');
        if (!produkRes.success) showToast('Error', 'Gagal memuat produk: ' + produkRes.message, 'danger');
    });
}
/** Urutan baris produk di Beranda: Kuliner -> Pertanian -> Kerajinan. Baris kosong disembunyikan. */
function renderProdukBeranda(d) {
    const grup = [['homeProductGridRasa', d.PortoRasa], ['homeProductGridTani', d.PortoTani], ['homeProductGridKriya', d.PortoKriya]];
    const adaIsi = grup.some(function(g) { return g[1] && g[1].length; });
    grup.forEach(function(g, i) {
        const el = document.getElementById(g[0]);
        if (!el) return;
        const items = g[1] || [];
        if (items.length) { el.style.display = ''; renderProductGrid(g[0], items); }
        else if (!adaIsi && i === 0) { el.style.display = ''; el.innerHTML = pesanKosongProduk(); }
        else { el.style.display = 'none'; el.innerHTML = ''; }
    });
}
function pesanKosongProduk() {
    return isB2B()
        ? '<div class="empty-state col-span-full"><i class="bi bi-boxes"></i>Belum ada produk grosir yang ditampilkan.<br><span class="text-xs">Anda tetap bisa menyampaikan kebutuhan lewat tombol "Buat RFQ Kustom Baru".</span></div>'
        : '<div class="empty-state col-span-full"><i class="bi bi-inbox"></i>Belum ada produk untuk ditampilkan.</div>';
}

function downloadBrosurPdf() {
    if (!AppState.config.brosurPdfUrl) return;
    const a = document.createElement('a');
    a.href = AppState.config.brosurPdfUrl; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
}

/** Ambil hanya karakter aman untuk ID di atribut HTML (UUID). */
function idAman(id) { return String(id == null ? '' : id).replace(/[^0-9a-zA-Z_-]/g, ''); }

function renderProductGrid(containerId, items) {
    const el = document.getElementById(containerId);
    if (!el)
        return;
    if (!items || !items.length) {
        el.innerHTML = pesanKosongProduk();
        return;
    }
    const cardsHtml = [];
    items.forEach(function(p) {
        try {
            AppState.produkIndex[String(p.id)] = p;
            cardsHtml.push(productCardHtml(p));
        } catch (err) {
            console.error('Gagal render 1 kartu produk:', err, p);
        }
    });
    el.innerHTML = cardsHtml.length ? cardsHtml.join('') : '<div class="empty-state col-span-full"><i class="bi bi-exclamation-triangle"></i>Data produk ada tapi gagal ditampilkan. Cek Console (F12).</div>';
}

/** Kotak harga untuk kartu mode Grosir: rentang harga bertingkat + MOQ. */
function hargaGrosirKartuHtml(p) {
    const satuan = String(p.satuan || 'pcs');
    const moq = Number(p.moq_grosir) || 1;
    const min = p.grosir_min != null ? Number(p.grosir_min) : null;
    const max = p.grosir_max != null ? Number(p.grosir_max) : null;
    const baris1 = min != null
        ? '<span class="pu-b2b-lbl">Harga Grosir Mula:</span><span class="pu-b2b-price">' + (max != null && max !== min ? formatRupiah(min) + ' - ' + formatRupiah(max) : formatRupiah(min)) + '</span>'
        : '<span class="pu-b2b-lbl">Harga Grosir:</span><span class="pu-b2b-price pu-b2b-rfq">Via penawaran (RFQ)</span>';
    const baris2 = '<span class="pu-b2b-lbl">MOQ Grosir:</span><b>' + moq + ' ' + escapeHtml(satuan) + '</b>' + (min != null ? '<span class="pu-tiered-tag">Tiered Price</span>' : '');
    return '<div class="pu-b2b-box"><div class="pu-b2b-row">' + baris1 + '</div><div class="pu-b2b-row">' + baris2 + '</div></div>';
}
function labelAksiKartu(p) {
    if (isB2B()) return '<i class="bi bi-file-earmark-text"></i> RFQ B2B';
    if (daftarWarna(p).length) return '<i class="bi bi-palette"></i> Pilih Warna';
    if (p.tipe_pemesanan === 'Paket') return '<i class="bi bi-list-check"></i> Pilih Paket';
    if (p.tipe_pemesanan === 'Custom') return '<i class="bi bi-pencil-square"></i> Pesan Custom';
    return '<i class="bi bi-cart-plus"></i> Keranjang';
}
/**
 * Kartu produk. SEMUA tombol hanya membawa ID produk (bukan nama/deskripsi),
 * sehingga teks bebas yang memuat tanda kutip tidak bisa merusak tombolnya.
 */
function productCardHtml(p) {
    const b2b = isB2B();
    const id = idAman(p.id);
    const namaProduk = String(p.nama_produk || '');
    const namaUMKM = String(p.nama_umkm || '');
    const kategori = String(p.kategori || '');
    const satuan = String(p.satuan || 'pcs');
    const deskripsi = String(p.deskripsi || '');
    const tipe = p.tipe_pemesanan || 'Standar';
    const ratingNum = Number(p.rating);
    const ratingVal = isFinite(ratingNum) ? ratingNum : 0;
    const img = p.foto_url ? ('<img src="' + escapeAttr(p.foto_url) + '" alt="' + escapeAttr(namaProduk) + '" loading="lazy">') : '<div class="no-img"><i class="bi bi-image"></i></div>';
    let badgeText = p.badge ? escapeHtml(String(p.badge)) : '';
    let hargaHtml;
    if (b2b) {
        hargaHtml = hargaGrosirKartuHtml(p);
    } else {
        const normal = Number(p.harga_normal) || 0;
        const promo = (p.harga_promo !== '' && p.harga_promo != null) ? Number(p.harga_promo) : null;
        const tampil = hargaRitelProduk(p);
        const diskon = (promo && normal > 0) ? Math.round((1 - promo / normal) * 100) : 0;
        if (!badgeText && diskon > 0) badgeText = '-' + diskon + '%';
        hargaHtml = (tipe === 'Custom' && tampil === 0)
            ? '<div class="product-price-row"><span class="price-now" style="font-size:14px;">Sesuai budget Anda</span></div>'
            : '<div class="product-price-row"><span class="price-now">' + formatRupiah(tampil) + '</span><span class="price-unit">/ ' + escapeHtml(satuan) + '</span></div>' + (promo ? '<span class="price-old">' + formatRupiah(normal) + '</span>' : '');
    }
    const cert = sertifikatChipsHtml(p, 3);
    return [
      '<div class="product-card pu-card' + (b2b ? ' pu-card-b2b' : '') + '" onclick="bukaDetailProduk(\'' + id + '\')">',
      '<div class="product-card-img-wrap">',
      img,
      badgeText ? ('<span class="badge-discount">' + badgeText + '</span>') : '',
      ratingVal > 0 ? ('<span class="badge-rating"><i class="bi bi-star-fill"></i> ' + ratingVal.toFixed(1) + (p.jumlah_ulasan ? (' (' + p.jumlah_ulasan + ')') : '') + '</span>') : '',
      '</div>',
      '<div class="product-card-body">',
      '<div class="product-umkm-row"><span class="badge-category" style="position:static;">' + escapeHtml(kategori) + '</span></div>',
      '<div class="product-umkm"><i class="bi bi-shop"></i> ' + escapeHtml(namaUMKM) + '</div>',
      '<div class="product-title">' + escapeHtml(namaProduk) + '</div>',
      (!b2b && deskripsi) ? ('<div class="product-desc">' + escapeHtml(deskripsi) + '</div>') : '',
      hargaHtml,
      cert ? ('<div class="pu-cert-wrap pu-cert-card">' + cert + '</div>') : '',
      '</div>',
      '<div class="product-card-footer pu-card-actions" onclick="event.stopPropagation()">',
      '<button type="button" class="btn-ghost" onclick="bukaDetailProduk(\'' + id + '\')"><i class="bi bi-eye"></i> Detail</button>',
      '<button type="button" class="btn-primary" onclick="aksiUtamaKartu(\'' + id + '\')">' + labelAksiKartu(p) + '</button>',
      '</div>',
      '</div>'
    ].join('');
}
/** Tombol utama di kartu: perilaku bergantung pada mode dan jenis produk. */
function aksiUtamaKartu(id) {
    const p = AppState.produkIndex[id];
    if (!p) return;
    if (isB2B()) { bukaRfqUntukProdukId(id, 'RFQ'); return; }
    if (daftarWarna(p).length) { bukaDetailProduk(id); return; } // warna wajib dipilih dulu di popup detail
    if (p.tipe_pemesanan === 'Paket') { bukaPilihPaket(id, ''); return; }
    if (p.tipe_pemesanan === 'Custom') {
        bukaPesananCustom({ id: p.id, nama: p.nama_produk, harga: hargaRitelProduk(p), satuan: p.satuan || 'pcs', umkm: p.nama_umkm, warna: '' });
        return;
    }
    addToCart(p.id, p.nama_produk, hargaRitelProduk(p), p.satuan || 'pcs', p.nama_umkm);
}

// -------------------- POPUP PILIH PAKET --------------------
let paketAktif = null;
function bukaPilihPaket(produkId, warna) {
    document.getElementById('previewModalTitle').textContent = 'Pilih Paket';
    document.getElementById('previewModalContent').innerHTML = '<div class="empty-state"><div class="spinner-brand" style="margin:0 auto;"></div></div>';
    openModal('previewModal');
    dbRpc('get_produk_detail', { p_id: produkId }).then(function(res) {
        if (!res.success || !res.data || !res.data.produk) {
            document.getElementById('previewModalContent').innerHTML = '<p class="text-sm" style="color:var(--text-muted)">Gagal memuat data paket' + (res.success ? '.' : ': ' + escapeHtml(res.message)) + '</p>';
            return;
        }
        tampilkanPilihPaket(res.data.produk, res.data.paket || [], warna || '');
    });
}
function tampilkanPilihPaket(p, pakets, warna) {
    document.getElementById('previewModalTitle').textContent = 'Pilih Paket';
    openModal('previewModal');
    if (!pakets.length) {
        document.getElementById('previewModalContent').innerHTML = '<p class="text-sm" style="color:var(--text-muted)">Belum ada paket tersedia untuk produk ini. Silakan hubungi Admin.</p>';
        return;
    }
    paketAktif = { p: p, pakets: pakets, warna: warna || '' };
    const hargaDasar = hargaRitelProduk(p);
    document.getElementById('previewModalContent').innerHTML = '<div class="text-left">' +
        '<p class="font-bold mb-2" style="color:var(--text-primary)">' + escapeHtml(p.nama_produk) + '</p>' +
        (warna ? '<p class="text-xs mb-2" style="color:var(--text-muted)">Warna dipilih: <b>' + escapeHtml(warna) + '</b></p>' : '') +
        pakets.map(function(pk, i) {
            const harga = (pk.harga !== null && pk.harga !== undefined && pk.harga !== '') ? Number(pk.harga) : hargaDasar;
            return [
              '<div class="card p-3 mb-2" style="cursor:pointer;" onclick="pilihPaketIdx(' + i + ')">',
              '<div class="font-bold" style="color:var(--text-primary)">' + escapeHtml(pk.nama_paket) + '</div>',
              pk.deskripsi_menu ? ('<div class="text-xs mt-1" style="color:var(--text-muted)">' + escapeHtml(pk.deskripsi_menu) + '</div>') : '',
              '<div class="font-bold mt-2" style="color:var(--primary)">' + formatRupiah(harga) + ' <span class="text-xs font-normal" style="color:var(--text-muted)">/ ' + escapeHtml(p.satuan || 'pcs') + '</span></div>',
              '</div>'
            ].join('');
        }).join('') + '</div>';
}
function pilihPaketIdx(i) {
    const a = paketAktif;
    if (!a || !a.pakets[i]) return;
    const p = a.p, pk = a.pakets[i];
    const harga = (pk.harga !== null && pk.harga !== undefined && pk.harga !== '') ? Number(pk.harga) : hargaRitelProduk(p);
    addToCart(p.id, p.nama_produk + ' - ' + pk.nama_paket, harga, p.satuan || 'pcs', p.nama_umkm, 1, pk.deskripsi_menu || '', a.warna);
    closeModal('previewModal');
}

// -------------------- POPUP PESANAN CUSTOM --------------------
let customAktif = null;
/** @param {{id:string, nama:string, harga:number, satuan:string, umkm:string, warna:string}} info */
function bukaPesananCustom(info) {
    customAktif = info;
    document.getElementById('previewModalTitle').textContent = 'Pesanan Custom';
    document.getElementById('previewModalContent').innerHTML = [
      '<form onsubmit="submitPesananCustom(event)" class="text-left">',
      '<p class="font-bold mb-1" style="color:var(--text-primary)">' + escapeHtml(info.nama) + '</p>',
      info.warna ? ('<p class="text-xs mb-1" style="color:var(--text-muted)">Warna dipilih: <b>' + escapeHtml(info.warna) + '</b></p>') : '',
      '<p class="text-xs mb-3" style="color:var(--text-muted)">Kosongkan kalau tidak ada permintaan khusus - bisa didiskusikan langsung lewat WhatsApp setelah pesanan dikirim.</p>',
      '<div class="form-group"><label class="form-label">Budget per ' + escapeHtml(info.satuan) + ' (Rp) - opsional</label><input class="form-input" type="number" id="cuBudget" placeholder="mis. 25000"></div>',
      '<div class="form-group"><label class="form-label">Menu yang Diinginkan - opsional</label><textarea class="form-textarea" id="cuMenu" placeholder="mis. nasi goreng seafood, tanpa pedas"></textarea></div>',
      '<button type="submit" class="btn-primary w-full" style="height:42px;"><i class="bi bi-cart-plus"></i> Tambahkan ke Keranjang</button>',
      '</form>'
    ].join('');
    openModal('previewModal');
}
function submitPesananCustom(e) {
    e.preventDefault();
    const c = customAktif;
    if (!c) return;
    const budget = document.getElementById('cuBudget').value;
    const menu = document.getElementById('cuMenu').value.trim();
    const harga = budget ? Number(budget) : (Number(c.harga) || 0);
    let catatan = '';
    if (budget) catatan += 'Budget: ' + formatRupiah(Number(budget)) + '/' + c.satuan;
    if (menu) catatan += (catatan ? ' | ' : '') + 'Menu: ' + menu;
    addToCart(c.id, c.nama, harga, c.satuan, c.umkm, 1, catatan, c.warna || '');
    closeModal('previewModal');
}

function previewImage(url, title) {
    if (!url)
        return;
    document.getElementById('previewModalTitle').textContent = title || 'Pratinjau';
    document.getElementById('previewModalContent').innerHTML = ('<img src="' + (url) + '" class="w-full rounded-lg" alt="' + (escapeHtml(title)) + '">');
    openModal('previewModal');
}

// -------------------- SEMUA PRODUK (KATALOG) --------------------
function renderKatalogPage() {
    const f = AppState.katalogFilter;
    const b2b = isB2B();
    const container = document.getElementById('app-container');
    container.innerHTML = [
      '<div class="page-wrap">',
      '<h1 class="text-xl md:text-2xl font-extrabold mb-1" style="color:var(--text-primary)">' + (b2b ? 'Katalog Produk Grosir' : 'Semua Produk') + '</h1>',
      '<p class="text-sm mb-4" style="color:var(--text-muted)">' + (b2b ? 'Harga grosir bertingkat dan MOQ untuk kebutuhan perusahaan, langsung dari UMKM binaan PPU UT Cakung.' : 'Direktori resmi produk UMKM binaan PPU UT Cakung.') + '</p>',
      b2b ? bannerB2bHtml() : '',
      '<div class="card p-3 md:p-4 mb-4">',
      '<div class="flex flex-wrap gap-2 mb-3" id="katalogSektorChips"></div>',
      '<div class="flex flex-wrap items-center gap-2 text-xs" id="katalogTagCepat"><span class="font-bold uppercase" style="color:var(--text-muted); letter-spacing:.03em;">Tag Cepat:</span></div>',
      '</div>',
      '<div class="flex items-center justify-between mb-3 flex-wrap gap-2">',
      '<div id="katalogResultInfo" class="text-sm" style="color:var(--text-muted)"></div>',
      '<select id="katalogSortSelect" class="form-select" style="width:auto; height:36px;" onchange="AppState.katalogSort=this.value; renderKatalogItems();">',
      '<option value="terbaru">Urutan Utama</option>',
      '<option value="harga_rendah">Harga Terendah</option>',
      '<option value="harga_tinggi">Harga Tertinggi</option>',
      '</select>',
      '</div>',
      '<div id="katalogGrid" class="product-grid"></div>',
      '<div id="katalogPagination" class="pagination"></div>',
      '</div>'
    ].join('');

    // Urutan kategori: Kuliner -> Pertanian -> Kerajinan. "Paket Promo" & "Sering Dipesan" hanya di mode ritel.
    const sektorList = [
        { key: 'Semua', label: 'Semua Produk' },
        { key: 'PortoRasa', label: 'PortoRasa (Kuliner)' },
        { key: 'PortoTani', label: 'PortoTani (Pertanian)' },
        { key: 'PortoKriya', label: 'PortoKriya (Kerajinan)' }
    ];
    if (!b2b) {
        sektorList.push({ key: 'PromoB2B', label: 'Paket Promo' });
        sektorList.push({ key: 'SeringDipesan', label: 'Produk Sering Dipesan' });
    }
    document.getElementById('katalogSektorChips').innerHTML = sektorList.map(function(s) {
        return '<button class="chip chip-solid ' + (f.kategori === s.key ? 'active' : '') + '" onclick="setKatalogKategori(\'' + s.key + '\')">' + s.label + '</button>';
    }).join('');

    const tagList = String(AppState.config.tagCepatList || '').split(',').map(function(t) { return t.trim(); }).filter(Boolean);
    const tagWrap = document.getElementById('katalogTagCepat');
    tagList.forEach(function(tag) {
        const btn = document.createElement('span');
        btn.className = 'tag-quick';
        btn.textContent = tag;
        btn.onclick = function() {
            AppState.katalogFilter.search = tag;
            AppState.katalogFilter.page = 1;
            loadKatalogData();
        };
        tagWrap.appendChild(btn);
    });

    loadKatalogData();
}

function setKatalogKategori(k) {
    AppState.katalogFilter.kategori = k;
    AppState.katalogFilter.subKategori = '';
    AppState.katalogFilter.search = '';
    AppState.katalogFilter.page = 1;
    renderKatalogPage();
}
let katalogRawItems = [];
let katalogReq = 0;

function loadKatalogData() {
    const f = AppState.katalogFilter;
    const mode = modeAktif();
    const cacheKey = 'katalog:' + mode + ':' + JSON.stringify(f);
    const req = ++katalogReq; // jawaban lama yang datang terlambat diabaikan
    const cached = ambilDariCache(cacheKey);
    if (cached) {
        katalogRawItems = cached.items;
        document.getElementById('katalogResultInfo').textContent = ('Menampilkan ' + (cached.items.length) + ' dari ' + (cached.total) + ' produk (halaman ' + (cached.page) + '/' + (cached.total_pages) + ')');
        renderKatalogItems();
        renderKatalogPagination(cached);
        return;
    }
    document.getElementById('katalogGrid').innerHTML = '<div class="empty-state col-span-full"><div class="spinner-brand" style="margin:0 auto;"></div></div>';
    dbRpc('get_produk_list', {
        p_kategori: f.kategori || 'Semua',
        p_sub_kategori: f.subKategori || '',
        p_search: f.search || '',
        p_page: f.page || 1,
        p_per_page: f.perPage || 40,
        p_mode: mode
    }).then(function(res) {
        if (req !== katalogReq) return;
        if (!res.success || !res.data) {
            showToast('Error', res.message || 'Gagal memuat produk.', 'danger');
            katalogRawItems = [];
            renderProductGrid('katalogGrid', []);
            return;
        }
        simpanKeCache(cacheKey, res.data);
        katalogRawItems = res.data.items;
        document.getElementById('katalogResultInfo').textContent = ('Menampilkan ' + (res.data.items.length) + ' dari ' + (res.data.total) + ' produk (halaman ' + (res.data.page) + '/' + (res.data.total_pages) + ')');
        renderKatalogItems();
        renderKatalogPagination(res.data);
    });
}
/** Acuan harga untuk pengurutan: harga grosir terendah di mode grosir, harga ritel di mode ritel. */
function hargaUrutKatalog(p) {
    if (isB2B() && p.grosir_min != null) return Number(p.grosir_min);
    return hargaRitelProduk(p);
}
function renderKatalogItems() {
    let items = katalogRawItems.slice();
    if (AppState.katalogSort === 'harga_rendah')
        items.sort((a, b) => hargaUrutKatalog(a) - hargaUrutKatalog(b));
    if (AppState.katalogSort === 'harga_tinggi')
        items.sort((a, b) => hargaUrutKatalog(b) - hargaUrutKatalog(a));
    renderProductGrid('katalogGrid', items);
}

function renderKatalogPagination(pageData) {
    const el = document.getElementById('katalogPagination');
    if (!el || pageData.total_pages <= 1) {
        if (el)
            el.innerHTML = '';
        return;
    }
    let html = ('<button class="page-btn" ' + (pageData.page <= 1 ? 'disabled' : '') + ' onclick="gotoKatalogPage(' + (pageData.page - 1) + ')"><i class="bi bi-chevron-left"></i></button>');
    for (let i = 1; i <= pageData.total_pages; i++) {
        if (i === 1 || i === pageData.total_pages || Math.abs(i - pageData.page) <= 1) {
            html += ('<button class="page-btn ' + (i === pageData.page ? 'active' : '') + '" onclick="gotoKatalogPage(' + (i) + ')">' + (i) + '</button>');
        }
        else if (Math.abs(i - pageData.page) === 2) {
            html += '<span class="px-1">...</span>';
        }
    }
    html += ('<button class="page-btn" ' + (pageData.page >= pageData.total_pages ? 'disabled' : '') + ' onclick="gotoKatalogPage(' + (pageData.page + 1) + ')"><i class="bi bi-chevron-right"></i></button>');
    el.innerHTML = html;
}
function gotoKatalogPage(p) { AppState.katalogFilter.page = p; loadKatalogData(); window.scrollTo(0, 0); }

// -------------------- MITRA PEMASARAN (PUBLIK) --------------------
function renderMitraPage() {
    const container = document.getElementById('app-container');
    container.innerHTML = [
      '<div class="page-wrap">',
      '<h1 class="text-xl md:text-2xl font-extrabold mb-1" style="color:var(--text-primary)">Mitra Pemasaran</h1>',
      '<p class="text-sm mb-5" style="color:var(--text-muted)">Perusahaan/corporate yang pernah berkolaborasi dengan UMKM binaan PPU UT Cakung.</p>',
      '<div id="mitraGrid" class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));"></div>',
      '</div>'
    ].join('');
    const cached = ambilDariCache('mitraList');
    if (cached) { renderMitraGrid(cached); return; }
    dbSelect('mitra_pemasaran').then(function(res) {
        const data = res.success ? res.data : [];
        simpanKeCache('mitraList', data);
        renderMitraGrid(data);
    });
}
function renderMitraGrid(items) {
    const el = document.getElementById('mitraGrid');
    if (!el) return;
    if (!items.length) { el.innerHTML = '<div class="empty-state col-span-full"><i class="bi bi-building"></i>Belum ada mitra pemasaran ditambahkan.</div>'; return; }
    el.innerHTML = items.map(function(m) {
        return [
          '<div class="card p-4 flex flex-col items-center justify-center gap-2" style="min-height:120px;">',
          m.logo_url ? ('<img src="' + m.logo_url + '" alt="' + escapeHtml(m.nama_perusahaan) + '" style="max-height:56px; max-width:100%; object-fit:contain;">') : '<i class="bi bi-building" style="font-size:32px; color:var(--border-color);"></i>',
          '<div class="text-xs font-semibold text-center" style="color:var(--text-body);">', escapeHtml(m.nama_perusahaan || ''), '</div>',
          '</div>'
        ].join('');
    }).join('');
}

