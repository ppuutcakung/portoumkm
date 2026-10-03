/**
 * ============================================================
 * PortoUMKM - State Aplikasi (di memori JS browser)
 * ============================================================
 */
const AppState = {
    currentPage: null,
    session: null,       // objek sesi Supabase Auth (null kalau belum login)
    adminNama: null,
    config: {},
    kategoriStruktur: {
        // Struktur kategori tetap statis di frontend (jarang berubah,
        // sama seperti versi GAS sebelumnya) - tidak perlu bolak-balik ke server.
        PortoRasa: { label: 'PortoRasa (Kuliner)', sub: ['Snack Box', 'Nasi Box', 'Frozen Food', 'Minuman', 'Buffet/Prasmanan'] },
        PortoKriya: { label: 'PortoKriya (Kerajinan)', sub: ['Tas Anyaman', 'Aksesoris', 'Merchandise', 'Souvenir', 'Lainnya'] },
        PortoTani: { label: 'PortoTani (Pertanian)', sub: ['Sayuran', 'Buah', 'Madu', 'Bibit', 'Hasil Olahan'] }
    },
    cart: [], // { id, nama, hargaSatuan, satuan, qty, umkm }
    katalogFilter: { kategori: 'Semua', subKategori: '', search: '', page: 1, perPage: 40 },
    katalogSort: 'terbaru',
    cache: {} // { heroCarousel: {data, ts}, promoBanner: {...}, homeProdukKategori: {...}, mitraList: {...} }
};

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 menit - data dianggap masih segar, hindari ambil ulang dari server
function ambilDariCache(key) {
    const entry = AppState.cache[key];
    if (entry && (Date.now() - entry.ts) < CACHE_TTL_MS) return entry.data;
    return null;
}
function simpanKeCache(key, data) {
    AppState.cache[key] = { data: data, ts: Date.now() };
}

const KATEGORI_LABEL = { PortoRasa: 'PortoRasa (Kuliner)', PortoKriya: 'PortoKriya (Kerajinan)', PortoTani: 'PortoTani (Pertanian)' };

const PUBLIC_PAGES = ['home', 'katalog', 'mitra', 'produkDetail', 'keranjang', 'adminLogin'];
const ADMIN_PAGES = ['adminDashboard', 'adminProduk', 'adminHero', 'adminFlyer', 'adminMitra', 'adminUmkm', 'adminPembayaran', 'adminSettings'];
