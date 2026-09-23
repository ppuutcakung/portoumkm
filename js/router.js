/**
 * ============================================================
 * PortoUMKM - Router SPA & Inisialisasi Aplikasi
 * ============================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    // Pengaman: jika inisialisasi gagal/macet, jangan biarkan layar terkunci di "Memuat..." selamanya.
    const safetyTimeout = setTimeout(() => {
        hideLoadingOverlay();
        showToast('Peringatan', 'Inisialisasi lambat/gagal. Cek koneksi atau buka Console (F12) untuk detail error.', 'warning');
    }, 8000);
    window.addEventListener('error', function(e) {
        console.error('Uncaught error:', e.message, e.filename, e.lineno);
        hideLoadingOverlay();
        clearTimeout(safetyTimeout);
    });

    try {
        loadCartFromStorage();
        // Satu permintaan gabungan (config + kategori) - bukan 2 permintaan
        // terpisah yang datang bersamaan dengan permintaan Beranda lainnya.
        apiGet('getInitData').then(res => {
            clearTimeout(safetyTimeout);
            if (res.success) {
                applyConfig(res.data.config);
                AppState.kategoriStruktur = res.data.kategoriStruktur;
                renderKategoriChipsGlobal();
            } else {
                showToast('Error', 'Gagal memuat konfigurasi: ' + res.message, 'danger');
            }
            navigateTo('home', { noHistory: true });
            hideLoadingOverlay();
        });
    } catch (e) {
        clearTimeout(safetyTimeout);
        console.error('Init error:', e);
        hideLoadingOverlay();
        showToast('Error', 'Gagal inisialisasi: ' + e.message, 'danger');
    }
});

function applyConfig(config) {
    AppState.config = config;
    if (config.appName)
        document.getElementById('footerAppName').textContent = config.appName;
    if (config.logoUrl) {
        ['appLogo', 'adminLogo'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.src = config.logoUrl;
                el.classList.remove('hidden');
            }
        });
    }
    if (config.emailKontak)
        document.getElementById('footerContact').textContent = 'email: ' + config.emailKontak + (config.waAdminNumber ? ' | ' + config.waAdminNumber : '');
    if (config.footerQuoteText) {
        const q = document.getElementById('footerQuoteText');
        if (q) q.textContent = config.footerQuoteText;
    }
}

/**
 * Dipakai oleh ikon kunci di toolbar publik. Kalau sesi Admin masih aktif
 * (belum logout, cuma sedang "intip" tampilan customer lewat Lihat Katalog
 * Publik), langsung kembali ke Dashboard - tanpa perlu login ulang.
 * Kalau sesi sudah habis/belum login, baru arahkan ke halaman login.
 */
function bukaAdminAtauLogin() {
    if (AppState.sessionToken) {
        navigateTo('adminDashboard');
    } else {
        navigateTo('adminLogin');
    }
}

function navigateTo(pageName, options) {
    options = options || {};
    closeMobileSearch();
    closeMobileNav();
    if (ADMIN_PAGES.includes(pageName) && !AppState.sessionToken) {
        pageName = 'adminLogin';
    }
    const isAdminPage = ADMIN_PAGES.includes(pageName);
    document.body.classList.toggle('admin-mode', isAdminPage);
    document.getElementById('adminSidebar').classList.toggle('hidden', !isAdminPage);
    document.getElementById('adminSidebarToggle').classList.toggle('hidden', !isAdminPage);
    if (!isAdminPage)
        document.getElementById('adminSidebar').classList.remove('show');
    AppState.currentPage = pageName;
    const footerQuoteWrap = document.getElementById('footerQuoteWrap');
    if (footerQuoteWrap) {
        const showQuoteOn = ['home', 'katalog', 'keranjang'];
        footerQuoteWrap.style.display = showQuoteOn.includes(pageName) ? '' : 'none';
    }
    document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.page === pageName));
    document.querySelectorAll('.mobile-nav-link').forEach(l => l.classList.toggle('active', l.dataset.page === pageName));
    document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.toggle('active', l.dataset.page === pageName));
    const container = document.getElementById('app-container');
    container.innerHTML = '<div class="page-wrap"><div class="empty-state"><div class="spinner-brand" style="margin:0 auto;"></div><p class="mt-3">Memuat halaman...</p></div></div>';
    window.scrollTo(0, 0);
    const renderers = {
        home: renderHomePage,
        katalog: renderKatalogPage,
        mitra: renderMitraPage,
        produkDetail: () => renderProdukDetailPage(options.produkId),
        keranjang: renderKeranjangPage,
        adminLogin: renderAdminLoginPage,
        adminDashboard: renderAdminDashboardPage,
        adminProduk: renderAdminProdukPage,
        adminHero: renderAdminHeroPage,
        adminFlyer: renderAdminFlyerPage,
        adminMitra: renderAdminMitraPage,
        adminUmkm: renderAdminUmkmPage,
        adminPembayaran: renderAdminPembayaranPage,
        adminSettings: renderAdminSettingsPage
    };
    if (options.katalogFilter)
        Object.assign(AppState.katalogFilter, options.katalogFilter);
    const fn = renderers[pageName];
    if (fn)
        fn();
    else
        container.innerHTML = '<div class="page-wrap empty-state"><i class="bi bi-question-circle"></i>Halaman tidak ditemukan.</div>';
}

function runNavSearch() {
    const q = document.getElementById('navSearchInput').value.trim();
    navigateTo('katalog', { katalogFilter: { kategori: 'Semua', subKategori: '', search: q, page: 1 } });
}
function toggleMobileSearch() {
    const row = document.getElementById('mobileSearchRow');
    row.classList.toggle('hidden');
    if (!row.classList.contains('hidden')) {
        setTimeout(function() {
            const inp = document.getElementById('navSearchInputMobile');
            if (inp) inp.focus();
        }, 50);
    }
}
function closeMobileSearch() {
    const row = document.getElementById('mobileSearchRow');
    if (row) row.classList.add('hidden');
}
function toggleMobileNav() {
    const panel = document.getElementById('mobileNavPanel');
    if (panel) panel.classList.toggle('hidden');
}
function closeMobileNav() {
    const panel = document.getElementById('mobileNavPanel');
    if (panel) panel.classList.add('hidden');
}
document.addEventListener('click', function() {
    closeMobileSearch();
    closeMobileNav();
});
function runNavSearchMobile() {
    const q = document.getElementById('navSearchInputMobile').value.trim();
    document.getElementById('mobileSearchRow').classList.add('hidden');
    navigateTo('katalog', { katalogFilter: { kategori: 'Semua', subKategori: '', search: q, page: 1 } });
}
function renderKategoriChipsGlobal() {
    // dipanggil ulang oleh halaman yang butuh render chip kategori setelah data tersedia
    if (AppState.currentPage === 'katalog')
        renderKatalogPage();
}
