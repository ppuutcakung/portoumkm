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
/**
 * @param {string} [warna] - warna yang dipilih customer (opsional, untuk produk yang punya pilihan warna).
 * @param {'b2c'|'b2b'} [mode] - jalur pemesanan; menentukan harga yang dipakai dan jenis pesanan yang tercatat.
 * @param {string} [catatan] - pilihan paket / permintaan custom (opsional).
 *   Item dengan id SAMA tapi catatan BEDA diperlakukan sebagai baris
 *   terpisah di keranjang (mis. "Snack Box - Paket A" dan "Snack Box -
 *   Paket B" dari produk yang sama, tidak digabung jadi satu baris).
 */
function addToCart(id, nama, harga, satuan, umkm, qty, catatan, warna, mode, model, menu) {
    qty = Math.max(1, parseInt(qty, 10) || 1);
    catatan = catatan || '';
    warna = warna || '';
    model = model || '';
    menu = menu || '';
    mode = mode === 'b2b' ? 'b2b' : 'b2c';
    // Baris digabung hanya kalau produk, catatan, warna, DAN mode-nya sama: harga grosir
    // dan harga ritel berbeda, jadi tidak boleh tercampur dalam satu baris.
    // Baris yang jamnya SUDAH diatur sendiri tidak ikut digabung. Dengan begitu
    // produk yang sama bisa dipesan untuk dua jam berbeda: atur jam pada baris
    // pertama, lalu tambahkan produk itu lagi - muncul sebagai baris baru.
    // menuAsli disimpan terpisah sebagai menu STANDAR paket. Isinya tidak pernah
    // ikut berubah saat customer mengedit, jadi selalu ada pembanding.
    // Menu ikut jadi penentu baris: dua paket berbeda dari produk yang sama
    // harus tetap terpisah walaupun harganya kebetulan sama.
    const existing = AppState.cart.find(i => i.id === id && (i.catatan || '') === catatan && (i.warna || '') === warna && (i.model || '') === model && (i.menuAsli || '') === menu && (i.mode || 'b2c') === mode && i.hargaSatuan === harga && !(i.jam || '') && !menuDiubah(i));
    if (existing)
        existing.qty += qty;
    else
        AppState.cart.push({ id, nama, hargaSatuan: harga, satuan, umkm, qty, catatan, warna, model, mode, jam: '', menu: menu, menuAsli: menu });
    saveCartToStorage();
    showToast('Ditambahkan', nama + [warna, model].filter(Boolean).map(function(x) { return ' (' + x + ')'; }).join('') + ' masuk ke keranjang.', 'success');
}

function renderKeranjangPage() {
    const container = document.getElementById('app-container');
    if (!AppState.cart.length) {
        container.innerHTML = '\n      <div class="page-wrap">\n        <div class="empty-state">\n          <i class="bi bi-cart-x"></i>\n          <p class="font-semibold" style="color:var(--text-primary)">Keranjang Anda masih kosong</p>\n          <button class="btn-primary mt-3" onclick="navigateTo(\'katalog\')"><i class="bi bi-grid"></i> Jelajahi Katalog</button>\n        </div>\n      </div>';
        return;
    }
    const total = AppState.cart.reduce((s, i) => s + i.hargaSatuan * i.qty, 0);
    container.innerHTML = ('\n    <div class="page-wrap" style="display:grid; gap:24px; grid-template-columns:1fr;" id="cartGridWrap">\n      <div>\n        <h1 class="text-xl font-extrabold mb-4" style="color:var(--text-primary)">Keranjang &amp; Pesanan</h1>\n        <div id="cartItemsWrap"></div>\n        <button class="btn-ghost mt-2" onclick="navigateTo(\'katalog\')"><i class="bi bi-plus-lg"></i> Tambah Produk Lain dari Katalog</button>\n        <div class="card p-4 mt-4 flex items-center justify-between">\n          <span class="font-bold" style="color:var(--text-primary)">Total Estimasi Di Bayar</span>\n          <span class="text-xl font-extrabold" style="color:var(--primary)">' + (formatRupiah(total)) + '</span>\n        </div>\n      </div>\n      <div>\n        <div class="card p-4 md:p-5"><div id="checkoutCardBody">\n          <h3 class="font-bold text-center mb-1" style="color:var(--text-primary)"><i class="bi bi-patch-check-fill" style="color:#16a34a;"></i> Data Pemesan</h3>\n          <p class="text-center text-xs mb-4" style="color:var(--text-muted)">Lengkapi data untuk membuat format pesanan resmi</p>\n          <form id="checkoutForm" onsubmit="handleCheckoutSubmit(event)">\n            <div class="form-group" id="cfPerusahaanWrap">\n              <label class="form-label" id="cfPerusahaanLabel">Nama Perusahaan / Instansi (opsional)</label>\n              <input class="form-input" id="cfPerusahaan" maxlength="200" placeholder="PT / CV / Toko / Instansi">\n            </div>\n            <div class="form-group">\n              <label class="form-label" id="cfNamaLabel">PIC / Pemesan *</label>\n              <input class="form-input" id="cfNama" required placeholder="Nama orang yang dihubungi">\n            </div>\n            <div class="form-group">\n              <label class="form-label">Nomor WhatsApp / HP Aktif *</label>\n              <input class="form-input" id="cfHp" required placeholder="08xxxxxxxxxx">\n            </div>\n            <div class="form-group">\n              <label class="form-label">Alamat Pengiriman Lengkap *</label>\n              <textarea class="form-textarea" id="cfAlamat" required placeholder="Nama gedung, jalan, kecamatan, kota"></textarea>\n            </div>\n            <div class="grid grid-cols-2 gap-3">\n              <div class="form-group">\n                <label class="form-label">Tanggal Kirim *</label>\n                <input class="form-input" type="date" id="cfTanggal" required>\n              </div>\n              <div class="form-group">\n                <label class="form-label">Maks. Jam Sampai (umum) *</label>\n                <input class="form-input" type="time" id="cfJam" required>\n              </div>\n            </div>\n            <div class="pu-jam-ringkas" id="cfJamRingkas"></div>\n            <div class="form-group">\n              <label class="form-label">Catatan Tambahan (Opsional)</label>\n              <textarea class="form-textarea" id="cfCatatan" placeholder="Contoh: titip di resepsionis / tidak pakai pedas..."></textarea>\n            </div>\n            <button type="submit" class="btn-wa w-full" style="height:46px;"><i class="bi bi-whatsapp" style="font-size:18px;"></i> Kirim Pesanan via WhatsApp Admin</button>\n            <p class="text-center text-[11px] mt-2" style="color:var(--text-muted)">Langsung terhubung ke WhatsApp Admin - Tanpa Login</p>\n          </form></div>\n        </div>\n      </div>\n    </div>\n  ');
    if (window.innerWidth >= 992)
        document.getElementById('cartGridWrap').style.gridTemplateColumns = '1.4fr 1fr';
    renderCartItems();
    terapkanModePesanan();
}
/** Pesanan dianggap B2B kalau ada satu saja item yang dipesan lewat jalur Grosir. */
function modePesanan() {
    return AppState.cart.some(function(i) { return (i.mode || 'b2c') === 'b2b'; }) ? 'b2b' : 'b2c';
}
/**
 * Kolom isian sama untuk kedua jalur: Nama Perusahaan dan PIC/Pemesan selalu
 * tampil. Bedanya hanya kewajiban mengisi - pada pesanan Grosir nama perusahaan
 * WAJIB, sedangkan pada pesanan Ritel boleh dikosongkan karena pembelinya bisa
 * perorangan.
 */
function terapkanModePesanan() {
    const b2b = modePesanan() === 'b2b';
    const wrap = document.getElementById('cfPerusahaanWrap');
    const labelPt = document.getElementById('cfPerusahaanLabel');
    const inputPt = document.getElementById('cfPerusahaan');
    const label = document.getElementById('cfNamaLabel');
    if (wrap) wrap.classList.remove('hidden');
    if (labelPt) labelPt.textContent = b2b ? 'Nama Perusahaan *' : 'Nama Perusahaan / Instansi (opsional)';
    if (inputPt) inputPt.placeholder = b2b ? 'PT / CV / Toko / Instansi' : 'Kosongkan bila pembelian pribadi';
    if (label) label.textContent = 'PIC / Pemesan *';
}

function renderCartItems() {
    const wrap = document.getElementById('cartItemsWrap');
    if (!wrap)
        return;
    wrap.innerHTML = AppState.cart.map(function(item, idx) {
        return [
          '<div class="cart-item">',
          '<div class="flex-1">',
          '<div class="text-xs font-semibold" style="color:var(--primary)">' + escapeHtml(item.umkm) + '</div>',
          '<div class="font-bold text-sm" style="color:var(--text-primary)">' + escapeHtml(item.nama) + '</div>',
          item.model ? ('<div class="text-xs mt-0.5" style="color:var(--text-body)"><i class="bi bi-images"></i> Model: <b>' + escapeHtml(item.model) + '</b></div>') : '',
          item.warna ? ('<div class="text-xs mt-0.5" style="color:var(--text-body)"><i class="bi bi-palette"></i> Warna: <b>' + escapeHtml(item.warna) + '</b></div>') : '',
          item.catatan ? ('<div class="text-xs mt-0.5" style="color:var(--text-muted)"><i class="bi bi-info-circle"></i> ' + escapeHtml(item.catatan) + '</div>') : '',
          blokMenuKeranjang(item, idx),
          '<div class="flex items-center justify-between mt-2 flex-wrap gap-2">',
          '<div class="qty-stepper">',
          '<button onclick="changeCartQty(' + idx + ', -1)">-</button>',
          '<input type="number" min="1" class="qty-input" value="' + item.qty + '" onclick="event.stopPropagation()" onchange="setCartQty(' + idx + ', this.value)">',
          '<button onclick="changeCartQty(' + idx + ', 1)">+</button>',
          '<span class="px-2 text-xs" style="color:var(--text-muted)">' + escapeHtml(item.satuan) + '</span>',
          '</div>',
          '<div class="text-right">',
          '<div class="text-xs" style="color:var(--text-muted)">' + formatRupiah(item.hargaSatuan) + ' / ' + escapeHtml(item.satuan) + '</div>',
          '<div class="font-bold" style="color:var(--primary)">' + formatRupiah(item.hargaSatuan * item.qty) + '</div>',
          '</div>',
          '</div>',
          // Jam sampai khusus produk ini. Dikosongkan = ikut jam umum di form pemesan.
          '<div class="pu-jam-item">',
          '<label for="cartJam' + idx + '"><i class="bi bi-clock"></i> Maks. jam sampai</label>',
          '<input type="time" id="cartJam' + idx + '" class="form-input pu-jam-input" value="' + escapeAttr(item.jam || '') + '"',
          ' onclick="event.stopPropagation()" onchange="setCartJam(' + idx + ', this.value)">',
          (item.jam ? '<button type="button" class="pu-jam-reset" onclick="setCartJam(' + idx + ', \'\')">Ikut jam umum</button>'
                    : '<span class="pu-jam-info">ikut jam umum</span>'),
          '</div>',
          '</div>',
          '<button class="btn-icon-sm self-start" onclick="removeCartItem(' + idx + ')"><i class="bi bi-trash text-red-500"></i></button>',
          '</div>'
        ].join('');
    }).join('');
    perbaruiRingkasanJam();
}
/** Benar bila customer sudah mengubah rincian menu paket ini. */
function menuDiubah(item) {
    if (!item || !item.menuAsli) return false;
    return String(item.menu || '').trim() !== String(item.menuAsli || '').trim();
}
/**
 * Rincian menu paket yang bisa diketik ulang customer. Yang berubah HANYA
 * baris keranjang ini - menu standar pada kartu produk tidak tersentuh,
 * karena menu standarnya disimpan terpisah di menuAsli dan tidak pernah ditulis
 * balik ke database.
 */
function blokMenuKeranjang(item, idx) {
    if (!item.menuAsli) return '';          // produk tanpa paket: tidak ada yang diedit
    const diubah = menuDiubah(item);
    return [
      '<div class="pu-menu-edit' + (diubah ? ' pu-menu-diubah' : '') + '">',
      '<div class="pu-menu-kepala">',
      '<span><i class="bi bi-list-ul"></i> Rincian menu</span>',
      diubah ? '<span class="pu-menu-badge">diubah</span>' : '',
      '</div>',
      '<textarea class="pu-menu-teks" rows="2" maxlength="1000"',
      ' placeholder="Tulis rincian menu yang Anda inginkan"',
      ' onclick="event.stopPropagation()" onchange="setCartMenu(' + idx + ', this.value)">' + escapeHtml(item.menu || '') + '</textarea>',
      diubah
        ? ('<div class="pu-menu-asli">Menu standar: ' + escapeHtml(item.menuAsli) +
           ' <button type="button" class="pu-menu-reset" onclick="resetCartMenu(' + idx + ')">Kembalikan</button></div>')
        : '<div class="pu-menu-bantuan">Boleh diubah bila ada menu yang ingin diganti, misalnya telor balado diganti telor dadar.</div>',
      '</div>'
    ].join('');
}
/** Simpan rincian menu hasil ketikan customer untuk baris ini saja. */
function setCartMenu(idx, nilai) {
    if (!AppState.cart[idx]) return;
    const teks = String(nilai || '').trim();
    // Dikosongkan sama saja dengan memakai menu standarnya kembali.
    AppState.cart[idx].menu = teks || AppState.cart[idx].menuAsli;
    saveCartToStorage();
    renderCartItems();
}
function resetCartMenu(idx) {
    if (!AppState.cart[idx]) return;
    AppState.cart[idx].menu = AppState.cart[idx].menuAsli;
    saveCartToStorage();
    renderCartItems();
}
/** Simpan jam khusus satu produk. Kosong berarti produk itu ikut jam umum. */
function setCartJam(idx, nilai) {
    if (!AppState.cart[idx]) return;
    AppState.cart[idx].jam = String(nilai || '').trim();
    saveCartToStorage();
    renderCartItems();
}
/**
 * Keterangan di bawah kolom jam umum. Tujuannya supaya customer tahu persis
 * produk mana yang jamnya sudah diatur sendiri, sebelum pesanan dikirim.
 */
function perbaruiRingkasanJam() {
    const el = document.getElementById('cfJamRingkas');
    if (!el) return;
    const khusus = AppState.cart.filter(function(i) { return i.jam; });
    if (!khusus.length) {
        el.innerHTML = 'Berlaku untuk semua produk. Kalau ada produk yang jam sampainya berbeda, atur pada produknya di keranjang.';
        el.className = 'pu-jam-ringkas';
        return;
    }
    el.innerHTML = '<b>Jam berbeda per produk:</b> ' + khusus.map(function(i) {
        return escapeHtml(i.nama) + ' maks. ' + escapeHtml(i.jam);
    }).join('; ') + '. Produk lainnya memakai jam umum di atas.';
    el.className = 'pu-jam-ringkas pu-jam-ringkas-aktif';
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
    const mode = modePesanan();
    const nama = document.getElementById('cfNama').value.trim();
    const perusahaan = document.getElementById('cfPerusahaan').value.trim();
    const hp = document.getElementById('cfHp').value.trim();
    const alamat = document.getElementById('cfAlamat').value.trim();
    const tanggal = document.getElementById('cfTanggal').value;
    const jam = document.getElementById('cfJam').value;
    const catatan = document.getElementById('cfCatatan').value.trim();
    if (!nama || !hp || !alamat || !tanggal || !jam) {
        showToast('Peringatan', 'Lengkapi semua field wajib.', 'warning');
        return;
    }
    if (mode === 'b2b' && !perusahaan) {
        showToast('Peringatan', 'Nama Perusahaan wajib diisi untuk pesanan grosir.', 'warning');
        document.getElementById('cfPerusahaan').focus();
        return;
    }
    if (!AppState.cart.length) {
        showToast('Peringatan', 'Keranjang masih kosong.', 'warning');
        return;
    }
    // Jam ditulis pada SETIAP item, bukan hanya yang berbeda. UMKM dan kurir
    // membaca barisnya masing-masing, jadi tiap baris harus bisa dibaca sendiri.
    // Menu yang diubah ditulis dengan penanda jelas plus menu standarnya, supaya
    // Admin dan UMKM langsung tahu bagian mana yang diganti.
    const rincianTampilan = AppState.cart.map(i => (i.nama + ' x' + i.qty + i.satuan + '\n   UMKM: ' + i.umkm
        + (i.model ? ('\n   Model: ' + i.model) : '')
        + (i.warna ? ('\n   Warna: ' + i.warna) : '')
        + (i.menu ? ('\n   Menu: ' + i.menu) : '')
        + (menuDiubah(i) ? ('\n   *MENU DIUBAH* (standar: ' + i.menuAsli + ')') : '')
        + '\n   Maks. jam sampai: ' + (i.jam || jam)
        + (i.catatan ? ('\n   Catatan: ' + i.catatan) : ''))).join('\n\n');
    const total = AppState.cart.reduce((s, i) => s + i.hargaSatuan * i.qty, 0);
    const items = AppState.cart.map(i => ({
        produk_id: i.id, nama_produk: i.nama, nama_umkm: i.umkm,
        qty: i.qty, satuan: i.satuan, harga_satuan: i.hargaSatuan, catatan: i.catatan || '', warna: i.warna || '', model: i.model || '',
        jam_maksimal: i.jam || jam, menu: i.menu || '', menu_asli: i.menuAsli || ''
    }));
    const jamBeda = AppState.cart.some(function(i) { return i.jam && i.jam !== jam; });
    const btn = e.target.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-inline"></span> Memproses...';
    btn.disabled = true;
    dbRpc('submit_pesanan', {
        p_nama_pemesan: nama, p_nama_perusahaan: perusahaan, p_no_hp: hp, p_alamat_kirim: alamat,
        p_tanggal_kirim: tanggal, p_jam_maksimal: jam, p_catatan: catatan, p_total_estimasi: total,
        p_items: items, p_mode: mode
    }).then(function(res) {
        btn.innerHTML = original;
        btn.disabled = false;
        if (!res.success) {
            showToast('Gagal', res.message, 'danger');
            return;
        }
        AppState.cart = [];
        saveCartToStorage();
        tampilkanKonfirmasiWhatsApp({ nama, perusahaan, hp, alamat, tanggal, jam, jamBeda, catatan, rincian: rincianTampilan, total, mode, nomor: (res.data && res.data.nomor) || '' });
    });
}
/**
 * Setelah pesanan tersimpan, tampilkan tautan WhatsApp asli (bukan tombol
 * yang memicu JS) di dalam #checkoutCardBody - elemen ini dirender lewat
 * innerHTML (dinamis), sehingga aman dari masalah render popup/sandbox.
 */
function tampilkanKonfirmasiWhatsApp(order) {
    const waNumber = String(AppState.config.waAdminNumber || '').replace(/[^0-9]/g, '');
    let text = (order.mode === 'b2b' ? 'Halo Admin PortoUMKM, saya ingin memesan (GROSIR B2B):\n\n' : 'Halo Admin PortoUMKM, saya ingin memesan:\n\n');
    text += ('*Rincian Pesanan:*\n' + (order.rincian) + '\n\n');
    text += ('*Total Estimasi:* ' + (formatRupiah(order.total)) + '\n\n');
    if (order.nomor) text += ('*No. Pesanan:* ' + (order.nomor) + '\n');
    if (order.perusahaan) text += ('*Perusahaan:* ' + (order.perusahaan) + '\n');
    text += ((order.mode === 'b2b' ? '*PIC/Pemesan:* ' : '*Nama Pemesan:* ') + (order.nama) + '\n');
    text += ('*No. HP:* ' + (order.hp) + '\n');
    text += ('*Alamat Kirim:* ' + (order.alamat) + '\n');
    text += ('*Tanggal Kirim:* ' + (order.tanggal) + '\n');
    // Kalau ada produk yang jamnya sendiri, jam umum TIDAK ditulis sebagai satu
    // angka supaya pembaca tidak memakainya untuk seluruh pesanan.
    text += (order.jamBeda
        ? '*Maks. Jam Sampai:* berbeda per produk - lihat rincian di atas\n'
        : ('*Maks. Jam Sampai:* ' + (order.jam) + '\n'));
    if (order.catatan)
        text += ('*Catatan:* ' + (order.catatan) + '\n');
    const url = waNumber ? ('https://wa.me/' + waNumber + '?text=' + encodeURIComponent(text)) : '';
    const body = document.getElementById('checkoutCardBody');
    if (!body) return;
    body.innerHTML = [
      '<div class="text-center py-4">',
      '<i class="bi bi-check-circle-fill" style="font-size:44px; color:#16a34a;"></i>',
      '<h3 class="font-bold mt-3" style="color:var(--text-primary)">Pesanan Tersimpan!</h3>',
      order.nomor ? ('<p class="text-sm mt-1" style="color:var(--text-body)">No. Pesanan: <b>' + escapeHtml(order.nomor) + '</b></p>') : '',
      '<p class="text-sm mt-1 mb-5" style="color:var(--text-muted)">Klik tombol di bawah untuk mengirim rincian pesanan ke WhatsApp Admin.</p>',
      url
        ? ('<a href="' + url + '" target="_blank" rel="noopener" class="btn-wa w-full" style="height:48px; font-size:15px;"><i class="bi bi-whatsapp" style="font-size:20px;"></i> Buka WhatsApp Sekarang</a>')
        : '<p style="color:#d97706;">Nomor WhatsApp Admin belum dikonfigurasi.</p>',
      '<button class="btn-ghost w-full mt-3" onclick="navigateTo(\'home\')">Kembali ke Beranda</button>',
      '</div>'
    ].join('');
}
