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
