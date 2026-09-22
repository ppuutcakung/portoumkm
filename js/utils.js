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
