/**
 * ============================================================
 * PortoUMKM - Utilitas UI (dipakai di banyak tempat)
 * ============================================================
 */
function showToast(title, message, type) {
    type = type || 'info';
    const icon = { success: 'bi-check-circle-fill', danger: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' }[type];
    const el = document.createElement('div');
    el.className = 'toast-item ' + type;
    el.innerHTML = ('<i class="bi ' + (icon) + '"></i><div><strong>' + (title) + '</strong><div>' + (message) + '</div></div>');
    document.getElementById('toastContainer').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 4000);
}
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

/**
 * Popup konfirmasi milik aplikasi sendiri - tampil di TENGAH layar, bukan
 * menempel di atas browser seperti window.confirm() bawaan. Posisi popup
 * bawaan itu diatur browser dan tidak bisa diubah dari halaman, jadi satu-
 * satunya cara memusatkannya adalah memakai modal sendiri seperti ini.
 *
 * Sifatnya tidak menghentikan kode seperti window.confirm(), jadi lanjutan
 * pekerjaannya ditaruh di onYa.
 *
 * konfirmasiAksi({
 *   judul: 'Judul Popup',
 *   pesan: 'Baris pertama.\n\nBaris kedua.',   // \n jadi baris baru
 *   labelYa: 'Ya, Lanjutkan',
 *   gaya: 'bahaya',                            // tombol merah; selain itu biru
 *   onYa:    function () { ... },
 *   onTidak: function () { ... }               // juga dipanggil saat ditutup
 * });
 */
let aksiKonfirmasi = null;
function konfirmasiAksi(opsi) {
    opsi = opsi || {};
    aksiKonfirmasi = { onYa: opsi.onYa || null, onTidak: opsi.onTidak || null };
    document.getElementById('konfirmasiJudul').textContent = opsi.judul || 'Konfirmasi';
    // Pesannya di-escape dulu: isinya bisa memuat nomor pesanan dari database.
    document.getElementById('konfirmasiPesan').innerHTML =
        escapeHtml(String(opsi.pesan || '')).replace(/\n/g, '<br>');
    const btn = document.getElementById('konfirmasiYaBtn');
    btn.textContent = opsi.labelYa || 'Ya, Lanjutkan';
    btn.className = (opsi.gaya === 'bahaya') ? 'btn-danger' : 'btn-primary';
    openModal('konfirmasiModal');
}
/**
 * Menutup popup konfirmasi. Dipanggil oleh tombol Ya, tombol Batal, tombol
 * silang, maupun klik di luar kotaknya - ketiga cara terakhir dihitung
 * sebagai "tidak", supaya layar yang terlanjur berubah bisa dikembalikan.
 */
function tutupKonfirmasi(jawaban) {
    closeModal('konfirmasiModal');
    const aksi = aksiKonfirmasi;
    aksiKonfirmasi = null;           // dikosongkan dulu supaya tidak terpanggil dua kali
    if (!aksi) return;
    if (jawaban === 'ya') { if (aksi.onYa) aksi.onYa(); }
    else if (aksi.onTidak) { aksi.onTidak(); }
}
function formatRupiah(n) {
    n = Number(n) || 0;
    return 'Rp ' + n.toLocaleString('id-ID');
}
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
}
function hideLoadingOverlay() {
    const el = document.getElementById('loadingOverlay');
    if (el) {
        el.style.opacity = '0';
        setTimeout(() => el.style.display = 'none', 250);
    }
}
/**
 * Bangun URL wa.me dengan konteks lengkap produk (nama produk, nama UMKM,
 * harga) supaya Admin langsung tahu produk apa yang ditanyakan customer
 * begitu chat masuk. Dipakai di ikon "Tanya via WA" pada kartu produk dan
 * halaman detail produk.
 */
function waLinkHref(produkNama, namaUMKM, harga) {
    const waNumber = String(AppState.config.waAdminNumber || '').replace(/[^0-9]/g, '');
    if (!waNumber) return '';
    let text;
    if (produkNama) {
        text = 'Halo Admin PortoUMKM, saya ingin bertanya tentang produk berikut:\n\n';
        text += ('*Produk:* ' + produkNama + '\n');
        if (namaUMKM) text += ('*UMKM:* ' + namaUMKM + '\n');
        if (harga) text += ('*Harga:* ' + formatRupiah(harga) + '\n');
    } else {
        text = 'Halo Admin PortoUMKM, saya ingin bertanya tentang katalog produk.';
    }
    return 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(text);
}

/**
 * Escape untuk nilai ATRIBUT HTML (value="...", title="..."): berbeda dari
 * escapeHtml() yang hanya aman untuk isi teks. Tanda kutip ' dan " ikut
 * di-escape supaya teks bebas (nama produk, deskripsi) tidak bisa merusak atribut.
 */
function escapeAttr(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
        .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
/** Rapikan nomor WhatsApp/HP ke format internasional tanpa tanda baca (0812... -> 62812...). */
function normalisasiNoWa(no) {
    let d = String(no || '').replace(/[^0-9]/g, '');
    if (d.startsWith('0')) d = '62' + d.slice(1);
    return d;
}

/**
 * Apakah produk ini sedang habis?
 *
 * Hanya produk yang stoknya memang DIKELOLA (pakai_stok) yang bisa dianggap
 * habis. Produk yang dibuat per pesanan - nasi box, katering - tidak punya
 * persediaan, jadi selamanya dianggap tersedia.
 *
 * Nilai stok ikut terbawa dari database lewat get_produk_list dan
 * get_produk_detail tanpa perlu permintaan tambahan.
 */
function stokHabis(p) {
    if (!p || p.pakai_stok !== true) return false;
    return (Number(p.stok) || 0) <= 0;
}

/** Sisa stok sebagai angka; 0 kalau produknya tidak dikelola stoknya. */
function sisaStok(p) {
    if (!p || p.pakai_stok !== true) return 0;
    return Math.max(0, Number(p.stok) || 0);
}

// ============================================================
// PEMBAGIAN HALAMAN TABEL ADMIN
// ============================================================
/**
 * Semua tabel di portal Admin dibatasi 20 baris per halaman.
 *
 * Ditulis sekali di sini dan dipakai bersama oleh semua tabel - bukan
 * disalin ke tiap berkas - supaya tampilan dan perilakunya seragam, dan
 * supaya mengubah angkanya cukup di satu tempat.
 */
const BARIS_PER_HALAMAN = 20;

/**
 * Potong daftar jadi satu halaman.
 * Nomor halaman otomatis dijepit ke rentang yang sah, jadi aman dipanggil
 * dengan nomor lama setelah data menyusut (mis. sesudah menghapus atau
 * menyaring).
 */
function potongHalaman(daftar, halaman) {
    const isi = Array.isArray(daftar) ? daftar : [];
    const total = isi.length;
    const totalHalaman = Math.max(Math.ceil(total / BARIS_PER_HALAMAN), 1);
    const h = Math.min(Math.max(1, Number(halaman) || 1), totalHalaman);
    const mulai = (h - 1) * BARIS_PER_HALAMAN;
    return {
        baris: isi.slice(mulai, mulai + BARIS_PER_HALAMAN),
        halaman: h,
        totalHalaman: totalHalaman,
        total: total,
        dari: total ? mulai + 1 : 0,
        sampai: Math.min(mulai + BARIS_PER_HALAMAN, total)
    };
}

/**
 * Gambar deretan tombol halaman ke dalam elemen berisi id tertentu.
 * fnGanti = nama fungsi global yang menerima nomor halaman.
 *
 * Satu halaman saja tetap diberi keterangan jumlah baris - admin perlu tahu
 * ada berapa data seluruhnya, bukan hanya yang terlihat.
 */
function gambarKontrolHalaman(idWadah, potongan, fnGanti) {
    const el = document.getElementById(idWadah);
    if (!el) return;
    const p = potongan;
    if (!p.total) { el.innerHTML = ''; return; }

    const info = '<span class="pu-hal-info">Menampilkan <b>' + p.dari + '–' + p.sampai +
                 '</b> dari <b>' + p.total + '</b> baris</span>';
    if (p.totalHalaman <= 1) { el.innerHTML = info; return; }

    const tombol = function (nomor, isi, mati, aktif) {
        return '<button class="page-btn' + (aktif ? ' active' : '') + '"' +
               (mati ? ' disabled' : ' onclick="' + fnGanti + '(' + nomor + ')"') + '>' + isi + '</button>';
    };
    let html = tombol(p.halaman - 1, '<i class="bi bi-chevron-left"></i>', p.halaman <= 1, false);
    for (let i = 1; i <= p.totalHalaman; i++) {
        // Hanya halaman pertama, terakhir, dan sekitar halaman aktif yang
        // ditampilkan - supaya deretannya tidak memanjang keluar layar
        // saat datanya ratusan.
        if (i === 1 || i === p.totalHalaman || Math.abs(i - p.halaman) <= 1) {
            html += tombol(i, String(i), false, i === p.halaman);
        } else if (Math.abs(i - p.halaman) === 2) {
            html += '<span class="pu-hal-titik">…</span>';
        }
    }
    html += tombol(p.halaman + 1, '<i class="bi bi-chevron-right"></i>', p.halaman >= p.totalHalaman, false);
    el.innerHTML = '<div class="pu-hal-baris">' + info + '<div class="pu-hal-tombol">' + html + '</div></div>';
}

/**
 * Nama lembaga/cabang pengelola, mis. "PPU UT Cakung" atau "PPU UT Bandung".
 *
 * Dulu nama ini tertanam di 15 titik di dalam kode - termasuk di footer PDF
 * invoice dan di halaman kebijakan privasi - sehingga cabang baru akan
 * menerbitkan dokumen atas nama cabang lain. Sekarang diisi tiap cabang
 * sendiri lewat menu Pengaturan, dan dibaca dari satu tempat ini.
 */
function namaLembaga() {
    const v = (AppState.config && AppState.config.namaLembaga) || '';
    return String(v).trim() || 'Pusat Pendampingan UMKM';
}
