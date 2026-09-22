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

      '<section class="page-wrap">',
      '<div class="flex items-end justify-between mb-4 flex-wrap gap-2">',
      '<div>',
      '<div class="text-xs font-bold uppercase tracking-wide" style="color:var(--primary)">Sektor Prioritas</div>',
      '<h2 class="text-xl md:text-2xl font-extrabold" style="color:var(--text-primary)">3 Klaster <span style="color:var(--primary)">Produk UMKM</span></h2>',
      '</div>',
      '</div>',
      '<div class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr));" id="sectorCardsWrap"></div>',
      '</section>',

      '<section class="page-wrap">',
      '<div class="flex items-end justify-between mb-3 flex-wrap gap-2">',
      '<div>',
      '<h2 class="text-2xl md:text-3xl font-extrabold" style="color:var(--text-primary)">Katalog <span style="color:var(--primary)">Produk UMKM</span></h2>',
      '</div>',
      '</div>',
      '<div id="homeProductGridRasa" class="product-grid mb-4"></div>',
      '<div id="homeProductGridKriya" class="product-grid mb-4"></div>',
      '<div id="homeProductGridTani" class="product-grid mb-4"></div>',
      '<div class="text-center mt-2"><button class="btn-ghost" onclick="navigateTo(\'katalog\')">Lihat Semua Produk <i class="bi bi-arrow-right"></i></button></div>',
      '</section>'
    ].join('');

    renderSectorCards();
    loadHeroCarousel();
    loadPromoBanner();
    loadHomeProducts();
    const brosurBtn = document.getElementById('brosurPdfBtn');
    if (brosurBtn && AppState.config.brosurPdfUrl) brosurBtn.style.display = 'inline-flex';
}

function renderSectorCards() {
    const wrap = document.getElementById('sectorCardsWrap');
    if (!wrap) return;
    const cfg = AppState.config || {};
    const DEFAULT_TITLE = { PortoRasa: 'Kuliner & Katering Nusantara', PortoKriya: 'Kerajinan & Souvenir Custom', PortoTani: 'Urban Farming & Hasil Tani' };
    const DEFAULT_DESC = { PortoRasa: 'Snack box rapat, nasi box tradisional, sambal, dan bumbu kopi khas Cakung.', PortoKriya: 'Tas anyaman ramah lingkungan, gantungan kunci akrilik, plakat, dan pouch tenun.', PortoTani: 'Sayuran hidroponik bebas pestisida, madu murni, dan hasil kebun pekarangan.' };
    const DEFAULT_TAGS = { PortoRasa: 'Snack Rapat,Nasi Box,Frozen Food', PortoKriya: 'Hampers Event,Tas Anyaman,Merchandise', PortoTani: 'Hidroponik Fresh,Madu Murni,Bibit Unggul' };
    const sectorKeys = ['PortoRasa', 'PortoKriya', 'PortoTani'];
    const sectors = sectorKeys.map(function(key) {
        const tagsStr = cfg['sectorTags' + key] || DEFAULT_TAGS[key];
        return {
            key: key,
            title: escapeHtml(cfg['sectorTitle' + key] || DEFAULT_TITLE[key]),
            desc: escapeHtml(cfg['sectorDesc' + key] || DEFAULT_DESC[key]),
            tags: tagsStr.split(',').map(function(t) { return t.trim(); }).filter(Boolean),
            img: cfg['sectorImg' + key]
        };
    });
    wrap.innerHTML = sectors.map(function(s) {
        var imgSrc = s.img || ('https://placehold.co/480x300/8c2f3a/ffffff?text=' + encodeURIComponent(s.key));
        return [
          '<div class="sector-card" onclick="navigateTo(\'katalog\',{katalogFilter:{kategori:\'' + s.key + '\',subKategori:\'\',search:\'\',page:1}})" style="cursor:pointer;">',
          '<div style="position:relative;">',
          '<img class="sector-card-img" src="' + imgSrc + '" alt="' + s.key + '">',
          '<span class="sector-tag">' + s.key + '</span>',
          '</div>',
          '<div class="p-4">',
          '<h3 class="font-bold text-[15px]" style="color:var(--text-primary)">' + s.title + '</h3>',
          '<p class="text-[13px] mt-1" style="color:var(--text-muted)">' + s.desc + '</p>',
          '<div class="flex flex-wrap gap-1.5 mt-3 mb-3">',
          s.tags.map(function(t) {
              return '<span class="chip" style="height:26px; padding:0 10px; font-size:11px; cursor:pointer;" onclick="event.stopPropagation(); navigateTo(\'katalog\',{katalogFilter:{kategori:\'' + s.key + '\',subKategori:\'\',search:\'' + t.replace(/'/g, "\\'") + '\',page:1}})">' + escapeHtml(t) + '</span>';
          }).join(''),
          '</div>',
          '<button class="btn-ghost w-full" onclick="event.stopPropagation(); navigateTo(\'katalog\',{katalogFilter:{kategori:\'' + s.key + '\',subKategori:\'\',search:\'\',page:1}})">Lihat Produk ' + s.key + ' <i class="bi bi-arrow-right"></i></button>',
          '</div>',
          '</div>'
        ].join('');
    }).join('');
}

let heroCarouselItems = [];
let heroCarouselIndex = 0;
let heroCarouselTimer = null;

function loadHeroCarousel() {
    const cached = ambilDariCache('heroCarousel');
    if (cached) { heroCarouselItems = cached; renderHeroCarousel(); return; }
    apiGet('getHeroCarousel').then(function(res) {
        const items = (res.success ? res.data : []).filter(function(p) { return p.FotoURL; });
        heroCarouselItems = items.length ? items : [{ FotoURL: '', NamaProduk: 'PortoUMKM', ID: '' }];
        simpanKeCache('heroCarousel', heroCarouselItems);
        renderHeroCarousel();
    });
}

function renderHeroCarousel() {
    const el = document.getElementById('heroCarousel');
    if (!el) return;
    clearInterval(heroCarouselTimer);
    if (heroCarouselIndex >= heroCarouselItems.length) heroCarouselIndex = 0;
    const p = heroCarouselItems[heroCarouselIndex];
    const src = p.FotoURL || ('https://placehold.co/640x480/0284c7/ffffff?text=' + encodeURIComponent('PortoUMKM'));
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

function loadPromoBanner() {
    const cached = ambilDariCache('promoBanner');
    if (cached) { promoBannerData = cached; renderPromoBannerSlider(); return; }
    apiGet('getFlyerAktif').then(function(res) {
        promoBannerData = res.success ? res.data.slice(0, 3) : [];
        simpanKeCache('promoBanner', promoBannerData);
        renderPromoBannerSlider();
    });
}

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
        const src = f.GambarURL || ('https://placehold.co/1600x320/0ea5e9/ffffff?text=' + encodeURIComponent(f.Judul || 'Promo'));
        const dots = promoBannerData.map(function(_, i) {
            return '<span class="' + (i === promoBannerIndex ? 'active' : '') + '" onclick="event.stopPropagation(); goToPromoBanner(' + i + ')"></span>';
        }).join('');
        el.innerHTML = [
          '<img class="promo-banner-slide" src="' + src + '" alt="' + escapeHtml(f.Judul) + '" onclick="previewImage(\'' + f.GambarURL + '\',\'' + escapeHtml(f.Judul) + '\')">',
          '<div class="promo-banner-caption">',
          '<div class="text-[10px] font-bold uppercase tracking-wide opacity-80">' + escapeHtml(f.Jenis || 'Promo') + '</div>',
          '<div class="font-bold text-sm md:text-base">' + escapeHtml(f.Judul) + '</div>',
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

function loadHomeProducts() {
    const cached = ambilDariCache('homeProdukKategori');
    if (cached) {
        renderProductGrid('homeProductGridRasa', cached.PortoRasa || []);
        renderProductGrid('homeProductGridKriya', cached.PortoKriya || []);
        renderProductGrid('homeProductGridTani', cached.PortoTani || []);
        return;
    }
    apiGet('getProdukUnggulanPerKategori', { perKategori: 4 }).then(function(res) {
        const d = res.success ? res.data : { PortoRasa: [], PortoKriya: [], PortoTani: [] };
        simpanKeCache('homeProdukKategori', d);
        renderProductGrid('homeProductGridRasa', d.PortoRasa || []);
        renderProductGrid('homeProductGridKriya', d.PortoKriya || []);
        renderProductGrid('homeProductGridTani', d.PortoTani || []);
    });
}

function downloadBrosurPdf() {
    if (!AppState.config.brosurPdfUrl) return;
    const a = document.createElement('a');
    a.href = AppState.config.brosurPdfUrl; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
}

function renderProductGrid(containerId, items) {
    const el = document.getElementById(containerId);
    if (!el)
        return;
    if (!items || !items.length) {
        el.innerHTML = '<div class="empty-state col-span-full"><i class="bi bi-inbox"></i>Belum ada produk untuk ditampilkan.</div>';
        return;
    }
    const cardsHtml = [];
    items.forEach(function(p) {
        try {
            cardsHtml.push(productCardHtml(p));
        } catch (err) {
            console.error('Gagal render 1 kartu produk:', err, p);
        }
    });
    el.innerHTML = cardsHtml.length ? cardsHtml.join('') : '<div class="empty-state col-span-full"><i class="bi bi-exclamation-triangle"></i>Data produk ada tapi gagal ditampilkan. Cek Console (F12).</div>';
}
function productCardHtml(p) {
    const hargaNormal = Number(p.HargaNormal) || 0;
    const hargaPromo = p.HargaPromo !== '' && p.HargaPromo != null ? Number(p.HargaPromo) : null;
    const hargaTampil = hargaPromo || hargaNormal;
    const diskon = hargaPromo ? Math.round((1 - hargaPromo / hargaNormal) * 100) : 0;
    const badgeText = p.Badge ? escapeHtml(String(p.Badge)) : (diskon > 0 ? ('-' + diskon + '%') : '');
    const ratingNum = Number(p.Rating);
    const ratingVal = isFinite(ratingNum) ? ratingNum : 0;
    const namaProduk = String(p.NamaProduk || '');
    const namaUMKM = String(p.NamaUMKM || '');
    const kategori = String(p.Kategori || '');
    const satuan = String(p.Satuan || 'pcs');
    const produkId = String(p.ID || '');
    const deskripsi = String(p.Deskripsi || '');
    const img = p.FotoURL ? ('<img src="' + p.FotoURL + '" alt="' + escapeHtml(namaProduk) + '">') : '<div class="no-img"><i class="bi bi-image"></i></div>';
    return [
      '<div class="product-card" onclick="navigateTo(\'produkDetail\',{produkId:\'' + produkId + '\'})">',
      '<div class="product-card-img-wrap">',
      img,
      badgeText ? ('<span class="badge-discount">' + badgeText + '</span>') : '',
      ratingVal > 0 ? ('<span class="badge-rating"><i class="bi bi-star-fill"></i> ' + ratingVal.toFixed(1) + (p.JumlahUlasan ? (' (' + p.JumlahUlasan + ')') : '') + '</span>') : '',
      '</div>',
      '<div class="product-card-body">',
      '<div class="product-umkm-row">',
      '<span class="badge-category" style="position:static;">' + escapeHtml(kategori) + '</span>',
      '</div>',
      '<div class="product-umkm"><i class="bi bi-shop"></i> ' + escapeHtml(namaUMKM) + '</div>',
      '<div class="product-title">' + escapeHtml(namaProduk) + '</div>',
      deskripsi ? ('<div class="product-desc">' + escapeHtml(deskripsi) + '</div>') : '',
      '<div class="product-price-row">',
      '<span class="price-now">' + formatRupiah(hargaTampil) + '</span>',
      '<span class="price-unit">/ ' + escapeHtml(satuan) + '</span>',
      '</div>',
      hargaPromo ? ('<span class="price-old">' + formatRupiah(hargaNormal) + '</span>') : '',
      '</div>',
      '<div class="product-card-footer" onclick="event.stopPropagation()">',
      '<button class="btn-primary flex-1" onclick="addToCart(\'' + produkId + '\',\'' + escapeHtml(namaProduk).replace(/'/g, "\\'") + '\',' + hargaTampil + ',\'' + escapeHtml(satuan).replace(/'/g, "\\'") + '\',\'' + escapeHtml(namaUMKM).replace(/'/g, "\\'") + '\')"><i class="bi bi-cart-plus"></i> Keranjang</button>',
      (waLinkHref(namaProduk, namaUMKM, hargaTampil) ? ('<a class="btn-icon-sm" href="' + waLinkHref(namaProduk, namaUMKM, hargaTampil) + '" target="_blank" rel="noopener" title="Tanya via WA"><i class="bi bi-whatsapp"></i></a>') : ''),
      '</div>',
      '</div>'
    ].join('');
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
    const container = document.getElementById('app-container');
    container.innerHTML = [
      '<div class="page-wrap">',
      '<h1 class="text-xl md:text-2xl font-extrabold mb-1" style="color:var(--text-primary)">Semua Produk</h1>',
      '<p class="text-sm mb-4" style="color:var(--text-muted)">Direktori resmi produk UMKM binaan PPU UT Cakung.</p>',
      '<div class="card p-3 md:p-4 mb-4">',
      '<div class="flex flex-wrap gap-2 mb-3" id="katalogSektorChips"></div>',
      '<div class="flex flex-wrap items-center gap-2 text-xs" id="katalogTagCepat"><span class="font-bold uppercase" style="color:var(--text-muted); letter-spacing:.03em;">Tag Cepat:</span></div>',
      '</div>',
      '<div class="flex items-center justify-between mb-3 flex-wrap gap-2">',
      '<div id="katalogResultInfo" class="text-sm" style="color:var(--text-muted)"></div>',
      '<select id="katalogSortSelect" class="form-select" style="width:auto; height:36px;" onchange="AppState.katalogSort=this.value; renderKatalogItems();">',
      '<option value="terbaru">Terbaru</option>',
      '<option value="harga_rendah">Harga Terendah</option>',
      '<option value="harga_tinggi">Harga Tertinggi</option>',
      '</select>',
      '</div>',
      '<div id="katalogGrid" class="product-grid"></div>',
      '<div id="katalogPagination" class="pagination"></div>',
      '</div>'
    ].join('');

    const sektorList = [
        { key: 'Semua', label: 'Semua Produk' },
        { key: 'PortoRasa', label: 'PortoRasa (Kuliner)' },
        { key: 'PortoKriya', label: 'PortoKriya (Kerajinan)' },
        { key: 'PortoTani', label: 'PortoTani (Pertanian)' },
        { key: 'PromoB2B', label: 'Paket Promo' },
        { key: 'SeringDipesan', label: 'Produk Sering Dipesan' }
    ];
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

function loadKatalogData() {
    const f = AppState.katalogFilter;
    const cacheKey = 'katalog:' + JSON.stringify(f);
    const cached = ambilDariCache(cacheKey);
    if (cached) {
        katalogRawItems = cached.items;
        document.getElementById('katalogResultInfo').textContent = ('Menampilkan ' + (cached.items.length) + ' dari ' + (cached.total) + ' produk (halaman ' + (cached.page) + '/' + (cached.totalPages) + ')');
        renderKatalogItems();
        renderKatalogPagination(cached);
        return;
    }
    document.getElementById('katalogGrid').innerHTML = '<div class="empty-state col-span-full"><div class="spinner-brand" style="margin:0 auto;"></div></div>';
    apiGet('getProdukList', f).then(function(res) {
        if (!res.success) {
            showToast('Error', res.message, 'danger');
            return;
        }
        simpanKeCache(cacheKey, res.data);
        katalogRawItems = res.data.items;
        document.getElementById('katalogResultInfo').textContent = ('Menampilkan ' + (res.data.items.length) + ' dari ' + (res.data.total) + ' produk (halaman ' + (res.data.page) + '/' + (res.data.totalPages) + ')');
        renderKatalogItems();
        renderKatalogPagination(res.data);
    });
}
function renderKatalogItems() {
    let items = katalogRawItems.slice();
    if (AppState.katalogSort === 'harga_rendah')
        items.sort((a, b) => (a.HargaPromo || a.HargaNormal) - (b.HargaPromo || b.HargaNormal));
    if (AppState.katalogSort === 'harga_tinggi')
        items.sort((a, b) => (b.HargaPromo || b.HargaNormal) - (a.HargaPromo || a.HargaNormal));
    renderProductGrid('katalogGrid', items);
}

function renderKatalogPagination(pageData) {
    const el = document.getElementById('katalogPagination');
    if (!el || pageData.totalPages <= 1) {
        if (el)
            el.innerHTML = '';
        return;
    }
    let html = ('<button class="page-btn" ' + (pageData.page <= 1 ? 'disabled' : '') + ' onclick="gotoKatalogPage(' + (pageData.page - 1) + ')"><i class="bi bi-chevron-left"></i></button>');
    for (let i = 1; i <= pageData.totalPages; i++) {
        if (i === 1 || i === pageData.totalPages || Math.abs(i - pageData.page) <= 1) {
            html += ('<button class="page-btn ' + (i === pageData.page ? 'active' : '') + '" onclick="gotoKatalogPage(' + (i) + ')">' + (i) + '</button>');
        }
        else if (Math.abs(i - pageData.page) === 2) {
            html += '<span class="px-1">...</span>';
        }
    }
    html += ('<button class="page-btn" ' + (pageData.page >= pageData.totalPages ? 'disabled' : '') + ' onclick="gotoKatalogPage(' + (pageData.page + 1) + ')"><i class="bi bi-chevron-right"></i></button>');
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
    apiGet('getMitraPemasaran').then(function(res) {
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
          m.LogoURL ? ('<img src="' + m.LogoURL + '" alt="' + escapeHtml(m.NamaPerusahaan) + '" style="max-height:56px; max-width:100%; object-fit:contain;">') : '<i class="bi bi-building" style="font-size:32px; color:var(--border-color);"></i>',
          '<div class="text-xs font-semibold text-center" style="color:var(--text-body);">', escapeHtml(m.NamaPerusahaan || ''), '</div>',
          '</div>'
        ].join('');
    }).join('');
}

// -------------------- DETAIL PRODUK --------------------
function renderProdukDetailPage(produkId) {
    const container = document.getElementById('app-container');
    container.innerHTML = '<div class="page-wrap"><div class="empty-state"><div class="spinner-brand" style="margin:0 auto;"></div></div></div>';
    apiGet('getProdukById', { id: produkId }).then(function(res) {
        if (!res.success) {
            container.innerHTML = '<div class="page-wrap empty-state"><i class="bi bi-exclamation-circle"></i>' + res.message + '</div>';
            return;
        }
        const p = res.data;
        const hargaNormal = Number(p.HargaNormal) || 0;
        const hargaPromo = p.HargaPromo !== '' && p.HargaPromo != null ? Number(p.HargaPromo) : null;
        const hargaTampil = hargaPromo || hargaNormal;
        const foto1 = p.FotoURL || '';
        const foto2 = p.FotoURL2 || '';
        const fotoList = [foto1, foto2].filter(Boolean);
        const mainFotoSrc = fotoList[0] || '';
        const mainFotoHtml = mainFotoSrc
            ? ('<img id="detailMainFoto" src="' + mainFotoSrc + '" alt="' + escapeHtml(p.NamaProduk) + '">')
            : '<div class="no-img"><i class="bi bi-image" style="font-size:56px;"></i></div>';
        const thumbHtml = fotoList.length > 1 ? fotoList.map(function(src) {
            return '<img src="' + src + '" onclick="gantiFotoDetail(this.src)" style="width:56px;height:56px;object-fit:cover;border-radius:6px;border:1px solid var(--border-color);cursor:pointer;">';
        }).join('') : '';
        container.innerHTML = [
          '<div class="page-wrap">',
          '<button class="btn-ghost mb-4" onclick="navigateTo(\'katalog\')"><i class="bi bi-arrow-left"></i> Kembali ke Katalog</button>',
          '<div class="grid gap-6" style="grid-template-columns:1fr;" id="detailGridWrap">',
          '<div>',
          '<div class="product-card-img-wrap card" style="aspect-ratio:1/1; max-width:420px;">', mainFotoHtml, '</div>',
          thumbHtml ? ('<div class="flex gap-2 mt-2">' + thumbHtml + '</div>') : '',
          '</div>',
          '<div>',
          '<span class="badge-category" style="position:static;">', escapeHtml(p.Kategori), ' - ', escapeHtml(p.SubKategori || ''), '</span>',
          '<h1 class="text-2xl font-extrabold mt-2" style="color:var(--text-primary)">', escapeHtml(p.NamaProduk), '</h1>',
          '<div class="product-umkm mt-1" style="font-size:13px;"><i class="bi bi-shop"></i> ', escapeHtml(p.NamaUMKM), '</div>',
          '<div class="flex items-baseline gap-3 mt-3">',
          '<span class="price-now" style="font-size:24px;">', formatRupiah(hargaTampil), '</span>',
          '<span class="price-unit">/ ', escapeHtml(p.Satuan || 'pcs'), '</span>',
          hargaPromo ? ('<span class="price-old">' + formatRupiah(hargaNormal) + '</span>') : '',
          '</div>',
          p.MinimalOrder ? ('<div class="text-xs mt-1" style="color:var(--text-muted);"><i class="bi bi-info-circle"></i> Minimal Order: ' + escapeHtml(p.MinimalOrder) + '</div>') : '',
          '<p class="mt-4 text-[14px]" style="color:var(--text-body); line-height:1.6;">', escapeHtml(p.Deskripsi), '</p>',
          '<div class="flex gap-2 mt-6 flex-wrap">',
          '<div class="qty-stepper">',
          '<button onclick="stepDetailQty(-1)">-</button>',
          '<span id="detailQty">1</span>',
          '<button onclick="stepDetailQty(1)">+</button>',
          '</div>',
          '<button class="btn-primary" style="height:44px; padding:0 20px;" onclick="addToCartFromDetail(\'' + p.ID + '\',\'' + escapeHtml(p.NamaProduk).replace(/'/g, "\\'") + '\',' + hargaTampil + ',\'' + escapeHtml(p.Satuan || 'pcs') + '\',\'' + escapeHtml(p.NamaUMKM).replace(/'/g, "\\'") + '\')"><i class="bi bi-cart-plus"></i> Tambah ke Keranjang</button>',
          '<a class="btn-wa" style="height:44px; padding:0 20px;" href="' + waLinkHref(p.NamaProduk, p.NamaUMKM, hargaTampil) + '" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> Tanya Admin</a>',
          '</div>',
          '</div>',
          '</div>',
          '</div>'
        ].join('');
        const wrap = document.getElementById('detailGridWrap');
        if (window.innerWidth >= 768) wrap.style.gridTemplateColumns = '380px 1fr';
    });
}
function gantiFotoDetail(src) {
    const el = document.getElementById('detailMainFoto');
    if (el) el.src = src;
}
let detailQty = 1;
function stepDetailQty(delta) {
    detailQty = Math.max(1, detailQty + delta);
    document.getElementById('detailQty').textContent = detailQty;
}
function addToCartFromDetail(id, nama, harga, satuan, umkm) {
    addToCart(id, nama, harga, satuan, umkm, detailQty);
    detailQty = 1;
}
