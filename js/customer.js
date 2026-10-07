/**
 * Judul hero dijaga agar MUAT SATU BARIS di layar HP (tidak terpotong ke baris
 * baru). Ukuran hurufnya dikecilkan bertahap sampai pas, jadi tetap aman berapa
 * pun panjang judul yang Admin tulis di Pengaturan. Di layar lebar, ukurannya
 * dikembalikan ke bawaan css/style.css.
 */
const JUDUL_HERO_MIN_PX = 11;
function muatkanJudulHero() {
    const el = document.querySelector('.hero-title');
    if (!el) return;
    el.style.fontSize = '';                       // kembalikan ke ukuran bawaan dulu
    if (!window.matchMedia || !window.matchMedia('(max-width: 720px)').matches) return;
    // Lebar acuan diambil dari yang TERKECIL antara elemen, pembungkusnya, dan layar.
    // Elemen ber-nowrap bisa ikut melebar, jadi lebarnya sendiri tidak bisa dipercaya.
    const kandidat = [el.clientWidth, el.parentElement ? el.parentElement.clientWidth : 0, window.innerWidth - 32]
        .filter(function(x) { return x > 0; });
    if (!kandidat.length) return;
    const tersedia = Math.min.apply(null, kandidat);
    let ukuran = parseFloat(window.getComputedStyle(el).fontSize) || 24;
    let putaran = 0;
    while (el.scrollWidth > tersedia && ukuran > JUDUL_HERO_MIN_PX && putaran++ < 60) {
        ukuran -= 1;
        el.style.fontSize = ukuran + 'px';
    }
}
/** Ukur ulang saat layar diputar atau jendela diubah ukurannya. */
function pantauJudulHero() {
    let tunda = null;
    const ukurUlang = function() {
        clearTimeout(tunda);
        tunda = setTimeout(muatkanJudulHero, 150);
    };
    window.addEventListener('resize', ukurUlang);
    window.addEventListener('orientationchange', ukurUlang);
}

/**
 * ============================================================
 * POPUP FLYER PROMO
 * Muncul sekali saat customer pertama kali membuka aplikasi. Isinya flyer
 * yang ditandai Admin (maksimal 3), bergulir otomatis, dan bisa ditutup.
 * ============================================================
 */
const POPUP_PROMO_KEY = 'portoumkm_popup_promo';
const POPUP_PROMO_MAKS = 3;
const POPUP_PROMO_JEDA = 4000;
let popupPromoItems = [];
let popupPromoIdx = 0;
let popupPromoTimer = null;

/** Sudah pernah ditampilkan pada sesi peramban ini? */
function popupPromoSudahTampil() {
    try { return sessionStorage.getItem(POPUP_PROMO_KEY) === '1'; } catch (e) { return false; }
}
function tandaiPopupPromoTampil() {
    try { sessionStorage.setItem(POPUP_PROMO_KEY, '1'); } catch (e) { /* aman diabaikan */ }
}
/** Dipanggil saat aplikasi pertama kali dibuka. */
function cekPopupPromo() {
    if (popupPromoSudahTampil()) return;
    dbSelect('flyer_promo', { eq: { status: 'Aktif', tampil_popup: true }, order: 'urutan', limit: POPUP_PROMO_MAKS }).then(function(res) {
        const items = (res.success ? res.data : []).filter(function(f) { return f.gambar_url; }).slice(0, POPUP_PROMO_MAKS);
        if (!items.length) return;          // tidak ada flyer popup: jangan ganggu customer
        tandaiPopupPromoTampil();
        tampilkanPopupPromo(items);
    });
}
function tampilkanPopupPromo(items) {
    popupPromoItems = items;
    popupPromoIdx = 0;
    const banyak = items.length > 1;
    document.getElementById('popupPromoBody').innerHTML = [
      '<button type="button" class="pu-promo-tutup" onclick="tutupPopupPromo()" aria-label="Tutup"><i class="bi bi-x-lg"></i></button>',
      '<div class="pu-promo-bingkai">',
      items.map(function(f, i) {
          const gbr = '<img src="' + escapeAttr(f.gambar_url) + '" alt="' + escapeAttr(f.judul || 'Promo') + '" loading="lazy">';
          return '<div class="pu-promo-slide' + (i === 0 ? ' aktif' : '') + '" data-slide="' + i + '">' + gbr + '</div>';
      }).join(''),
      '</div>',
      banyak ? ('<div class="pu-promo-dots">' + items.map(function(f, i) {
          return '<button type="button" class="pu-promo-dot' + (i === 0 ? ' aktif' : '') + '" onclick="keSlidePromo(' + i + ')" aria-label="Promo ' + (i + 1) + '"></button>';
      }).join('') + '</div>') : ''
    ].join('');
    openModal('popupPromoModal');
    if (banyak) mulaiGulirPromo();
}
function gambarSlidePromo() {
    document.querySelectorAll('#popupPromoBody .pu-promo-slide').forEach(function(el, i) {
        el.classList.toggle('aktif', i === popupPromoIdx);
    });
    document.querySelectorAll('#popupPromoBody .pu-promo-dot').forEach(function(el, i) {
        el.classList.toggle('aktif', i === popupPromoIdx);
    });
}
function mulaiGulirPromo() {
    clearInterval(popupPromoTimer);
    popupPromoTimer = setInterval(function() {
        popupPromoIdx = (popupPromoIdx + 1) % popupPromoItems.length;
        gambarSlidePromo();
    }, POPUP_PROMO_JEDA);
}
/** Klik titik: pindah slide dan hitung ulang jedanya agar tidak langsung berganti. */
function keSlidePromo(i) {
    popupPromoIdx = i;
    gambarSlidePromo();
    mulaiGulirPromo();
}
function tutupPopupPromo() {
    clearInterval(popupPromoTimer);
    popupPromoTimer = null;
    closeModal('popupPromoModal');
}

/**
 * ============================================================
 * PortoUMKM - Halaman Customer: Beranda, Semua Produk,
 * Detail Produk, Customer
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
    muatkanJudulHero();
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
        // Flyer yang ditandai sebagai popup TIDAK ikut ke banner Beranda: bentuk gambarnya
        // persegi (1:1), sedangkan banner memanjang, jadi akan terpotong kalau dicampur.
        dbSelect('flyer_promo', { eq: { status: 'Aktif', tampil_popup: false }, limit: 3 }),
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
/** Teks tombol: versi panjang untuk layar lebar, versi pendek supaya muat di kartu HP. */
function labelDua(ikon, panjang, pendek) {
    return '<i class="bi ' + ikon + '"></i> <span class="pu-t-long">' + panjang + '</span><span class="pu-t-short">' + pendek + '</span>';
}
function labelAksiKartu(p) {
    if (isB2B()) return bolehPesanLangsungB2b(p)
        ? labelDua('bi-cart-plus', 'Pesan Langsung', 'Pesan')
        : labelDua('bi-file-earmark-text', 'RFQ B2B', 'RFQ');
    if (daftarWarna(p).length) return labelDua('bi-palette', 'Pilih Warna', 'Warna');
    if (p.tipe_pemesanan === 'Paket') return labelDua('bi-list-check', 'Pilih Paket', 'Paket');
    if (p.tipe_pemesanan === 'Custom') return labelDua('bi-pencil-square', 'Pesan Custom', 'Custom');
    return labelDua('bi-cart-plus', 'Keranjang', 'Beli');
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
      '<button type="button" class="btn-ghost" onclick="bukaDetailProduk(\'' + id + '\')">' + labelDua('bi-eye', 'Detail', 'Detail') + '</button>',
      '<button type="button" class="btn-primary" onclick="aksiUtamaKartu(\'' + id + '\')">' + labelAksiKartu(p) + '</button>',
      '</div>',
      '</div>'
    ].join('');
}
/**
 * Tombol utama di kartu. Apa pun yang butuh pilihan (jumlah, paket, warna, harga
 * bertingkat) dibuka lewat popup Detail supaya alurnya satu pintu dan kalkulatornya ikut.
 */
function aksiUtamaKartu(id) {
    const p = AppState.produkIndex[id];
    if (!p) return;
    if (isB2B()) {
        if (bolehPesanLangsungB2b(p)) bukaDetailProduk(id);   // perlu jumlah & harga bertingkat
        else bukaRfqUntukProdukId(id, 'RFQ');
        return;
    }
    if (daftarWarna(p).length || p.tipe_pemesanan === 'Paket') { bukaDetailProduk(id); return; }
    if (p.tipe_pemesanan === 'Custom') {
        bukaPesananCustom({ id: p.id, nama: p.nama_produk, harga: hargaRitelProduk(p), satuan: p.satuan || 'pcs', umkm: p.nama_umkm, warna: '' });
        return;
    }
    addToCart(p.id, p.nama_produk, hargaRitelProduk(p), p.satuan || 'pcs', p.nama_umkm);
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
      info.model ? ('<p class="text-xs mb-1" style="color:var(--text-muted)">Model dipilih: <b>' + escapeHtml(info.model) + '</b></p>') : '',
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
    addToCart(c.id, c.nama, harga, c.satuan, c.umkm, 1, catatan, c.warna || '', 'b2c', c.model || '');
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
        { key: 'Semua', label: 'Semua Produk', ikon: 'bi-grid-fill', warna: 'netral' },
        { key: 'PortoRasa', label: 'PortoRasa (Kuliner)', ikon: 'bi-egg-fried', warna: 'rasa' },
        { key: 'PortoTani', label: 'PortoTani (Pertanian)', ikon: 'bi-flower1', warna: 'tani' },
        { key: 'PortoKriya', label: 'PortoKriya (Kerajinan)', ikon: 'bi-palette-fill', warna: 'kriya' }
    ];
    if (!b2b) {
        sektorList.push({ key: 'PromoB2B', label: 'Paket Promo', ikon: 'bi-tags-fill', warna: 'promo' });
        sektorList.push({ key: 'SeringDipesan', label: 'Produk Sering Dipesan', ikon: 'bi-fire', warna: 'sering' });
    }
    // Ikon ada di kiri tulisan; tiap sektor punya warna sendiri (lihat .pu-chip-* di b2b-fitur.css)
    document.getElementById('katalogSektorChips').innerHTML = sektorList.map(function(s) {
        return '<button class="chip chip-solid pu-chip pu-chip-' + s.warna + ' ' + (f.kategori === s.key ? 'active' : '') +
               '" onclick="setKatalogKategori(\'' + s.key + '\')"><i class="bi ' + s.ikon + '"></i><span>' + s.label + '</span></button>';
    }).join('');

    renderTagCepat();

    loadKatalogData();
}

/**
 * Tag Cepat dibuat OTOMATIS dari sub-kategori produk yang benar-benar ada dan
 * aktif pada mode yang sedang dibuka. Klik tag menyaring sub_kategori PERSIS,
 * bukan mencari teks, sehingga tag tidak pernah menunjuk ke hasil kosong -
 * termasuk sub-kategori yang Admin tulis sendiri lewat pilihan "Lainnya".
 */
function renderTagCepat() {
    const wrap = document.getElementById('katalogTagCepat');
    if (!wrap) return;
    const mode = modeAktif();
    const kategori = AppState.katalogFilter.kategori || 'Semua';
    const cacheKey = 'tagCepat:' + mode + ':' + kategori;
    const cached = ambilDariCache(cacheKey);
    if (cached) { gambarTagCepat(cached); return; }
    dbRpc('get_sub_kategori_aktif', { p_mode: mode, p_kategori: kategori }).then(function(res) {
        const list = (res.success && Array.isArray(res.data)) ? res.data : [];
        simpanKeCache(cacheKey, list);
        if (mode === modeAktif() && kategori === (AppState.katalogFilter.kategori || 'Semua')) gambarTagCepat(list);
    });
}
let tagCepatList = [];
function gambarTagCepat(list) {
    const wrap = document.getElementById('katalogTagCepat');
    if (!wrap) return;
    tagCepatList = list || [];
    const aktif = AppState.katalogFilter.subKategori || '';
    wrap.innerHTML = '<span class="font-bold uppercase" style="color:var(--text-muted); letter-spacing:.03em;">Tag Cepat:</span>';
    if (!tagCepatList.length) {
        wrap.innerHTML += '<span style="color:var(--text-muted)">belum ada sub-kategori pada mode ini.</span>';
        return;
    }
    wrap.innerHTML += tagCepatList.map(function(t, i) {
        return '<span class="tag-quick' + (aktif === t.sub_kategori ? ' active' : '') + '" onclick="pilihTagCepat(' + i + ')">' + escapeHtml(t.sub_kategori) + ' <span class="tag-quick-n">' + t.jumlah + '</span></span>';
    }).join('');
}
/** Klik tag: saring sub-kategori itu; klik lagi pada tag yang sama = batalkan saringan. */
function pilihTagCepat(i) {
    const t = tagCepatList[i];
    if (!t) return;
    const f = AppState.katalogFilter;
    f.subKategori = (f.subKategori === t.sub_kategori) ? '' : t.sub_kategori;
    f.search = '';
    f.page = 1;
    gambarTagCepat(tagCepatList);
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
        document.getElementById('katalogResultInfo').textContent = teksInfoKatalog(cached);
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
        document.getElementById('katalogResultInfo').textContent = teksInfoKatalog(res.data);
        renderKatalogItems();
        renderKatalogPagination(res.data);
    });
}
/** Acuan harga untuk pengurutan: harga grosir terendah di mode grosir, harga ritel di mode ritel. */
function teksInfoKatalog(d) {
    const f = AppState.katalogFilter;
    const saring = f.subKategori ? (' - tag "' + f.subKategori + '"') : (f.search ? (' - pencarian "' + f.search + '"') : '');
    return 'Menampilkan ' + d.items.length + ' dari ' + d.total + ' produk' + saring + ' (halaman ' + d.page + '/' + d.total_pages + ')';
}
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
      '<h1 class="text-xl md:text-2xl font-extrabold mb-1" style="color:var(--text-primary)">Customer</h1>',
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

