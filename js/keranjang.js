/**
 * ============================================================
 * PortoUMKM - Keranjang & Checkout
 * ============================================================
 */
function loadCartFromStorage() {
    try {
        const raw = localStorage.getItem('portoumkm_cart');
        AppState.cart = raw ? JSON.parse(raw) : [];
    }
    catch (e) {
        AppState.cart = [];
    }
    updateCartBadge();
}
function saveCartToStorage() {
    localStorage.setItem('portoumkm_cart', JSON.stringify(AppState.cart));
    updateCartBadge();
}
function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const totalQty = AppState.cart.reduce((s, i) => s + i.qty, 0);
    if (badge) {
        badge.textContent = totalQty;
        badge.classList.toggle('hidden', totalQty === 0);
    }
}
function addToCart(id, nama, harga, satuan, umkm, qty) {
    qty = qty || 1;
    const existing = AppState.cart.find(i => i.id === id);
    if (existing)
        existing.qty += qty;
    else
        AppState.cart.push({ id, nama, hargaSatuan: harga, satuan, umkm, qty });
    saveCartToStorage();
    showToast('Ditambahkan', nama + ' masuk ke keranjang.', 'success');
}

function renderKeranjangPage() {
    const container = document.getElementById('app-container');
    if (!AppState.cart.length) {
        container.innerHTML = '\n      <div class="page-wrap">\n        <div class="empty-state">\n          <i class="bi bi-cart-x"></i>\n          <p class="font-semibold" style="color:var(--text-primary)">Keranjang Anda masih kosong</p>\n          <button class="btn-primary mt-3" onclick="navigateTo(\'katalog\')"><i class="bi bi-grid"></i> Jelajahi Katalog</button>\n        </div>\n      </div>';
        return;
    }
    const total = AppState.cart.reduce((s, i) => s + i.hargaSatuan * i.qty, 0);
    container.innerHTML = ('\n    <div class="page-wrap" style="display:grid; gap:24px; grid-template-columns:1fr;" id="cartGridWrap">\n      <div>\n        <h1 class="text-xl font-extrabold mb-4" style="color:var(--text-primary)">Keranjang &amp; Pesanan</h1>\n        <div id="cartItemsWrap"></div>\n        <button class="btn-ghost mt-2" onclick="navigateTo(\'katalog\')"><i class="bi bi-plus-lg"></i> Tambah Produk Lain dari Katalog</button>\n        <div class="card p-4 mt-4 flex items-center justify-between">\n          <span class="font-bold" style="color:var(--text-primary)">Total Estimasi Di Bayar</span>\n          <span class="text-xl font-extrabold" style="color:var(--primary)">' + (formatRupiah(total)) + '</span>\n        </div>\n      </div>\n      <div>\n        <div class="card p-4 md:p-5"><div id="checkoutCardBody">\n          <h3 class="font-bold text-center mb-1" style="color:var(--text-primary)"><i class="bi bi-patch-check-fill" style="color:#16a34a;"></i> Data Pemesan</h3>\n          <p class="text-center text-xs mb-4" style="color:var(--text-muted)">Lengkapi data untuk membuat format pesanan resmi</p>\n          <form id="checkoutForm" onsubmit="handleCheckoutSubmit(event)">\n            <div class="form-group">\n              <label class="form-label">Nama Lengkap Pemesan / Instansi *</label>\n              <input class="form-input" id="cfNama" required placeholder="Bpk/Ibu ... (Divisi/Instansi)">\n            </div>\n            <div class="form-group">\n              <label class="form-label">Nomor WhatsApp / HP Aktif *</label>\n              <input class="form-input" id="cfHp" required placeholder="08xxxxxxxxxx">\n            </div>\n            <div class="form-group">\n              <label class="form-label">Alamat Pengiriman Lengkap *</label>\n              <textarea class="form-textarea" id="cfAlamat" required placeholder="Nama gedung, jalan, kecamatan, kota"></textarea>\n            </div>\n            <div class="grid grid-cols-2 gap-3">\n              <div class="form-group">\n                <label class="form-label">Tanggal Kirim *</label>\n                <input class="form-input" type="date" id="cfTanggal" required>\n              </div>\n              <div class="form-group">\n                <label class="form-label">Maks. Jam Sampai *</label>\n                <input class="form-input" type="time" id="cfJam" required>\n              </div>\n            </div>\n            <div class="form-group">\n              <label class="form-label">Catatan Tambahan (Opsional)</label>\n              <textarea class="form-textarea" id="cfCatatan" placeholder="Contoh: titip di resepsionis / tidak pakai pedas..."></textarea>\n            </div>\n            <button type="submit" class="btn-wa w-full" style="height:46px;"><i class="bi bi-whatsapp" style="font-size:18px;"></i> Kirim Pesanan via WhatsApp Admin</button>\n            <p class="text-center text-[11px] mt-2" style="color:var(--text-muted)">Langsung terhubung ke WhatsApp Admin - Tanpa Login</p>\n          </form></div>\n        </div>\n      </div>\n    </div>\n  ');
    if (window.innerWidth >= 992)
        document.getElementById('cartGridWrap').style.gridTemplateColumns = '1.4fr 1fr';
    renderCartItems();
}

function renderCartItems() {
    const wrap = document.getElementById('cartItemsWrap');
    if (!wrap)
        return;
    wrap.innerHTML = AppState.cart.map((item, idx) => ('\n    <div class="cart-item">\n      <div class="flex-1">\n        <div class="text-xs font-semibold" style="color:var(--primary)">' + (escapeHtml(item.umkm)) + '</div>\n        <div class="font-bold text-sm" style="color:var(--text-primary)">' + (escapeHtml(item.nama)) + '</div>\n        <div class="flex items-center justify-between mt-2 flex-wrap gap-2">\n          <div class="qty-stepper">\n            <button onclick="changeCartQty(' + (idx) + ', -1)">-</button>\n            <input type="number" min="1" class="qty-input" value="' + (item.qty) + '" onclick="event.stopPropagation()" onchange="setCartQty(' + (idx) + ', this.value)">\n            <button onclick="changeCartQty(' + (idx) + ', 1)">+</button>\n            <span class="px-2 text-xs" style="color:var(--text-muted)">' + (escapeHtml(item.satuan)) + '</span>\n          </div>\n          <div class="text-right">\n            <div class="text-xs" style="color:var(--text-muted)">' + (formatRupiah(item.hargaSatuan)) + ' / ' + (escapeHtml(item.satuan)) + '</div>\n            <div class="font-bold" style="color:var(--primary)">' + (formatRupiah(item.hargaSatuan * item.qty)) + '</div>\n          </div>\n        </div>\n      </div>\n      <button class="btn-icon-sm self-start" onclick="removeCartItem(' + (idx) + ')"><i class="bi bi-trash text-red-500"></i></button>\n    </div>\n  ')).join('');
}
function changeCartQty(idx, delta) {
    AppState.cart[idx].qty = Math.max(1, AppState.cart[idx].qty + delta);
    saveCartToStorage();
    renderKeranjangPage();
}
function setCartQty(idx, value) {
    const qty = Math.max(1, parseInt(value, 10) || 1);
    AppState.cart[idx].qty = qty;
    saveCartToStorage();
    renderKeranjangPage();
}
function removeCartItem(idx) {
    AppState.cart.splice(idx, 1);
    saveCartToStorage();
    renderKeranjangPage();
}

function handleCheckoutSubmit(e) {
    e.preventDefault();
    const nama = document.getElementById('cfNama').value.trim();
    const hp = document.getElementById('cfHp').value.trim();
    const alamat = document.getElementById('cfAlamat').value.trim();
    const tanggal = document.getElementById('cfTanggal').value;
    const jam = document.getElementById('cfJam').value;
    const catatan = document.getElementById('cfCatatan').value.trim();
    if (!nama || !hp || !alamat || !tanggal || !jam) {
        showToast('Peringatan', 'Lengkapi semua field wajib.', 'warning');
        return;
    }
    if (!AppState.cart.length) {
        showToast('Peringatan', 'Keranjang masih kosong.', 'warning');
        return;
    }
    const rincian = AppState.cart.map(i => (i.nama + ' x' + i.qty + i.satuan + '\n   UMKM: ' + i.umkm)).join('\n\n');
    const total = AppState.cart.reduce((s, i) => s + i.hargaSatuan * i.qty, 0);
    const btn = e.target.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-inline"></span> Memproses...';
    btn.disabled = true;
    apiPost('submitPesanan', { namaPemesan: nama, rincianProduk: rincian, totalEstimasi: total, noHP: hp, alamatKirim: alamat, tanggalKirim: tanggal, jamMaksimal: jam, catatan }).then(function(res) {
        btn.innerHTML = original;
        btn.disabled = false;
        if (!res.success) {
            showToast('Gagal', res.message, 'danger');
            return;
        }
        AppState.cart = [];
        saveCartToStorage();
        tampilkanKonfirmasiWhatsApp({ nama, hp, alamat, tanggal, jam, catatan, rincian, total });
    });
}
/**
 * Setelah pesanan tersimpan, tampilkan tautan WhatsApp asli (bukan tombol
 * yang memicu JS) di dalam #checkoutCardBody - elemen ini dirender lewat
 * innerHTML (dinamis), sehingga aman dari masalah render popup/sandbox.
 */
function tampilkanKonfirmasiWhatsApp(order) {
    const waNumber = String(AppState.config.waAdminNumber || '').replace(/[^0-9]/g, '');
    let text = 'Halo Admin PortoUMKM, saya ingin memesan:\n\n';
    text += ('*Rincian Pesanan:*\n' + (order.rincian) + '\n\n');
    text += ('*Total Estimasi:* ' + (formatRupiah(order.total)) + '\n\n');
    text += ('*Nama Pemesan:* ' + (order.nama) + '\n');
    text += ('*No. HP:* ' + (order.hp) + '\n');
    text += ('*Alamat Kirim:* ' + (order.alamat) + '\n');
    text += ('*Tanggal Kirim:* ' + (order.tanggal) + '\n');
    text += ('*Maks. Jam Sampai:* ' + (order.jam) + '\n');
    if (order.catatan)
        text += ('*Catatan:* ' + (order.catatan) + '\n');
    const url = waNumber ? ('https://wa.me/' + waNumber + '?text=' + encodeURIComponent(text)) : '';
    const body = document.getElementById('checkoutCardBody');
    if (!body) return;
    body.innerHTML = [
      '<div class="text-center py-4">',
      '<i class="bi bi-check-circle-fill" style="font-size:44px; color:#16a34a;"></i>',
      '<h3 class="font-bold mt-3" style="color:var(--text-primary)">Pesanan Tersimpan!</h3>',
      '<p class="text-sm mt-1 mb-5" style="color:var(--text-muted)">Klik tombol di bawah untuk mengirim rincian pesanan ke WhatsApp Admin.</p>',
      url
        ? ('<a href="' + url + '" target="_blank" rel="noopener" class="btn-wa w-full" style="height:48px; font-size:15px;"><i class="bi bi-whatsapp" style="font-size:20px;"></i> Buka WhatsApp Sekarang</a>')
        : '<p style="color:#d97706;">Nomor WhatsApp Admin belum dikonfigurasi.</p>',
      '<button class="btn-ghost w-full mt-3" onclick="navigateTo(\'home\')">Kembali ke Beranda</button>',
      '</div>'
    ].join('');
}
