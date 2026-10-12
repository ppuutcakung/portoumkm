/**
 * ============================================================
 * PortoUMKM - Admin: Promosi WhatsApp
 *
 * Mengirim informasi produk ke customer yang pernah bertransaksi.
 *
 * CARA KIRIMNYA SENGAJA MANUAL. Aplikasi menyiapkan daftar penerima dan
 * teks pesannya, lalu membuka WhatsApp milik Admin satu per satu lewat
 * tautan wa.me. Tidak memakai gateway pihak ketiga, sehingga tidak ada
 * token yang disimpan, tidak ada biaya bulanan, dan nomor WA Admin tidak
 * menanggung risiko diblokir karena terdeteksi sebagai pengirim massal.
 *
 * Semua tombol hanya membawa ID / nomor urut, tidak pernah data mentah.
 * ============================================================
 */
let promoCustomer = [];       // daftar customer dari database
let promoPilih = {};          // { no_hp: true } yang dicentang
let promoAntrean = null;      // { blastId, target: [], idx }
let promoFlyer = null;        // { url, path } hasil unggah, opsional

const PROMO_CONTOH = 'Halo {nama}, salam dari PortoUMKM.\n\nAda produk baru dan promo dari UMKM binaan PPU UT Cakung minggu ini. Silakan lihat katalognya ya.';

function renderAdminPromosiPage() {
    const container = document.getElementById('app-container');
    container.innerHTML = adminPageShell('Promosi WhatsApp', [
      '<p class="text-sm mb-3" style="color:var(--text-muted)">Kirim informasi produk ke customer yang pernah bertransaksi. Pesan dibuka lewat <b>WhatsApp Anda sendiri</b> satu per satu, jadi tidak ada risiko nomor diblokir seperti pada layanan blast otomatis.</p>',
      '<div class="pu-promo-langkah">',
      '<div class="pu-promo-kol">',
      '<div class="pf-section-title">1. Pilih Customer</div>',
      '<div class="flex flex-wrap gap-2 mb-2" id="promoChips"></div>',
      '<div class="flex flex-wrap gap-2 mb-2">',
      '<button type="button" class="btn-ghost pu-btn-kecil" onclick="promoPilihSemua(true)">Pilih semua</button>',
      '<button type="button" class="btn-ghost pu-btn-kecil" onclick="promoPilihSemua(false)">Kosongkan</button>',
      '</div>',
      '<div id="promoDaftar" class="pu-promo-daftar"><div class="empty-state"><div class="spinner-brand" style="margin:0 auto;"></div></div></div>',
      '</div>',
      '<div class="pu-promo-kol">',
      '<div class="pf-section-title">2. Tulis Pesan</div>',
      '<div class="form-group"><label class="form-label">Judul kiriman (untuk catatan Anda sendiri)</label>',
      '<input class="form-input" id="promoJudul" maxlength="200" placeholder="Misal: Promo Ramadan 2026"></div>',
      '<div class="form-group"><label class="form-label">Isi Pesan *</label>',
      '<textarea class="form-textarea" id="promoPesan" rows="7" maxlength="3000" oninput="promoPratinjau()"></textarea>',
      '<p class="pf-foto-info">Tulis <b>{nama}</b> untuk menyapa tiap customer dengan namanya. Link katalog otomatis ditambahkan di bawah pesan.</p></div>',
      '<div class="form-group"><label class="form-label">Link Katalog *</label>',
      '<input class="form-input" id="promoLink" maxlength="500" oninput="promoPratinjau()"></div>',
      '<div class="form-group"><label class="form-label">Flyer (opsional)</label>',
      '<input type="file" accept="image/*" id="promoFlyerFile" class="form-input" onchange="promoUnggahFlyer(this)">',
      '<div id="promoFlyerInfo" class="pf-foto-info">Rasio 1:1. Flyer dikirim sebagai <b>tautan gambar</b> di dalam pesan, bukan gambar menempel &mdash; WhatsApp hanya bisa menempelkan gambar lewat layanan berbayar.</div></div>',
      '<div class="pf-section-title">3. Pratinjau Pesan</div>',
      '<div class="pu-promo-pratinjau" id="promoPratinjauBox"></div>',
      '<button type="button" class="btn-primary w-full mt-3" style="height:46px;" onclick="promoMulaiKirim()"><i class="bi bi-whatsapp"></i> Siapkan Pengiriman</button>',
      '</div>',
      '</div>',
      '<div class="pf-section-title mt-4">Riwayat Kiriman</div>',
      '<div id="promoRiwayat"></div>'
    ].join(''));
    promoPilih = {};
    promoAntrean = null;
    promoFlyer = null;
    const pesan = document.getElementById('promoPesan');
    if (pesan) pesan.value = PROMO_CONTOH;
    const link = document.getElementById('promoLink');
    if (link) link.value = (AppState.config || {}).linkKatalog || window.location.origin + window.location.pathname;
    loadCustomerPromo();
    loadRiwayatBlast();
    promoPratinjau();
}

// -------------------- DAFTAR CUSTOMER --------------------
let promoSaring = 'Semua';
function loadCustomerPromo() {
    dbRpc('get_customer_promo').then(function(res) {
        if (!res.success) { showToast('Error', res.message || 'Gagal memuat daftar customer.', 'danger'); promoCustomer = []; }
        else promoCustomer = Array.isArray(res.data) ? res.data : [];
        // Yang dikecualikan tidak dicentang otomatis.
        promoCustomer.forEach(function(c) { if (!c.dikecualikan) promoPilih[c.no_hp] = true; });
        renderDaftarPromo();
    });
}
function setSaringPromo(s) { promoSaring = s; renderDaftarPromo(); }
function customerTersaring() {
    if (promoSaring === 'Pesanan') return promoCustomer.filter(function(c) { return /Pesanan/.test(c.asal); });
    if (promoSaring === 'B2B') return promoCustomer.filter(function(c) { return /B2B/.test(c.asal); });
    if (promoSaring === 'Dikecualikan') return promoCustomer.filter(function(c) { return c.dikecualikan; });
    return promoCustomer;
}
function renderDaftarPromo() {
    const chips = document.getElementById('promoChips');
    const el = document.getElementById('promoDaftar');
    if (!chips || !el) return;
    const n = function(f) { return promoCustomer.filter(f).length; };
    chips.innerHTML = [
      ['Semua', 'Semua', promoCustomer.length],
      ['Pesanan', 'Dari Pesanan', n(function(c) { return /Pesanan/.test(c.asal); })],
      ['B2B', 'Dari Pengajuan B2B', n(function(c) { return /B2B/.test(c.asal); })],
      ['Dikecualikan', 'Dikecualikan', n(function(c) { return c.dikecualikan; })]
    ].map(function(c) {
        return '<button class="chip chip-solid ' + (promoSaring === c[0] ? 'active' : '') + '" onclick="setSaringPromo(\'' + c[0] + '\')">' + c[1] + ' (' + c[2] + ')</button>';
    }).join('');

    const list = customerTersaring();
    if (!list.length) {
        el.innerHTML = '<div class="empty-state"><i class="bi bi-person-x"></i>' +
            (promoCustomer.length ? 'Tidak ada customer pada saringan ini.' : 'Belum ada customer yang bertransaksi.') + '</div>';
        promoPratinjau();
        return;
    }
    el.innerHTML = list.map(function(c) {
        const i = promoCustomer.indexOf(c);
        const dipilih = !c.dikecualikan && promoPilih[c.no_hp] === true;
        return [
          '<div class="pu-promo-baris' + (c.dikecualikan ? ' pu-promo-kecuali' : '') + '">',
          '<label class="pu-promo-cek">',
          '<input type="checkbox" ' + (dipilih ? 'checked' : '') + (c.dikecualikan ? ' disabled' : '') +
            ' onchange="promoCentang(' + i + ', this.checked)">',
          '<span>',
          '<b>' + escapeHtml(c.nama || '(tanpa nama)') + '</b>',
          c.perusahaan ? ('<span class="pu-promo-pt"> &middot; ' + escapeHtml(c.perusahaan) + '</span>') : '',
          '<div class="pu-promo-meta">' + escapeHtml(c.no_hp) + ' &middot; ' + escapeHtml(c.asal) +
            ' &middot; ' + c.jumlah_transaksi + 'x, terakhir ' + tanggalIndo(c.transaksi_terakhir) +
            (c.terakhir_dikirimi ? (' &middot; <i class="bi bi-send-check"></i> dikirimi ' + tanggalIndo(c.terakhir_dikirimi)) : '') +
            '</div>',
          '</span>',
          '</label>',
          (c.dikecualikan
            ? '<button type="button" class="pu-promo-aksi" onclick="promoBatalKecuali(' + i + ')" title="Izinkan dikirimi lagi"><i class="bi bi-arrow-counterclockwise"></i> Izinkan</button>'
            : '<button type="button" class="pu-promo-aksi pu-promo-aksi-merah" onclick="promoKecualikan(' + i + ')" title="Tandai tidak perlu dikirimi"><i class="bi bi-slash-circle"></i> Jangan kirim</button>'),
          '</div>'
        ].join('');
    }).join('');
    promoPratinjau();
}
function promoCentang(i, nilai) {
    const c = promoCustomer[i];
    if (!c) return;
    promoPilih[c.no_hp] = !!nilai;
    promoPratinjau();
}
function promoPilihSemua(nilai) {
    customerTersaring().forEach(function(c) { if (!c.dikecualikan) promoPilih[c.no_hp] = !!nilai; });
    renderDaftarPromo();
}
/** Tandai permanen: nomor ini tidak ikut kiriman promosi berikutnya. */
function promoKecualikan(i) {
    const c = promoCustomer[i];
    if (!c) return;
    dbInsert('promo_optout', { no_hp: c.no_hp, nama: c.nama || '' }).then(function(res) {
        if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }
        c.dikecualikan = true;
        promoPilih[c.no_hp] = false;
        showToast('Ditandai', (c.nama || c.no_hp) + ' tidak akan dikirimi promosi.', 'success');
        renderDaftarPromo();
    });
}
function promoBatalKecuali(i) {
    const c = promoCustomer[i];
    if (!c) return;
    dbDeleteWhere('promo_optout', 'no_hp', c.no_hp).then(function(res) {
        if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }
        c.dikecualikan = false;
        promoPilih[c.no_hp] = true;
        showToast('Diizinkan', (c.nama || c.no_hp) + ' bisa dikirimi promosi lagi.', 'success');
        renderDaftarPromo();
    });
}

// -------------------- PESAN --------------------
function promoTerpilih() {
    return promoCustomer.filter(function(c) { return !c.dikecualikan && promoPilih[c.no_hp] === true; });
}
/** Susun teks akhir untuk satu customer: sapaan + isi + flyer + link katalog. */
function susunPesanPromo(nama) {
    const isi = (document.getElementById('promoPesan') || {}).value || '';
    const link = ((document.getElementById('promoLink') || {}).value || '').trim();
    const sapaan = String(nama || '').trim() || 'Bapak/Ibu';
    let t = isi.replace(/\{nama\}/g, sapaan).trim();
    if (promoFlyer && promoFlyer.url) t += '\n\nFlyer: ' + promoFlyer.url;
    if (link) t += '\n\nKatalog produk UMKM: ' + link;
    return t;
}
function promoPratinjau() {
    const box = document.getElementById('promoPratinjauBox');
    if (!box) return;
    const dipilih = promoTerpilih();
    const contoh = dipilih.length ? (dipilih[0].nama || '') : 'Bapak/Ibu';
    const teks = susunPesanPromo(contoh);
    box.innerHTML = '<div class="pu-promo-gelembung">' + escapeHtml(teks).replace(/\n/g, '<br>') + '</div>' +
        '<div class="pu-promo-hitung"><b>' + dipilih.length + '</b> customer dipilih &middot; ' + teks.length + ' karakter' +
        (dipilih.length ? ('<div class="pu-promo-sampel">Contoh di atas memakai nama: <b>' + escapeHtml(contoh || 'Bapak/Ibu') + '</b></div>') : '') + '</div>';
}
function promoUnggahFlyer(input) {
    const file = input && input.files && input.files[0];
    const info = document.getElementById('promoFlyerInfo');
    if (!file) { promoFlyer = null; promoPratinjau(); return; }
    if (info) info.innerHTML = '<span class="spinner-inline"></span> Mengunggah flyer...';
    uploadFile(file, 'flyerFolderId').then(function(res) {
        if (!res || !res.success || !res.data) {
            promoFlyer = null;
            if (info) info.innerHTML = '<span style="color:#dc2626;">Gagal mengunggah flyer: ' + escapeHtml((res && res.message) || 'tidak diketahui') + '</span>';
            return;
        }
        promoFlyer = { url: res.data.url, path: res.data.fileId || '' };
        if (info) info.innerHTML = '<i class="bi bi-check-circle-fill" style="color:#16a34a;"></i> Flyer siap. Tautannya ikut di dalam pesan. ' +
            '<button type="button" class="pu-menu-reset" onclick="promoHapusFlyer()">Hapus flyer</button>';
        promoPratinjau();
    });
}
function promoHapusFlyer() {
    promoFlyer = null;
    const f = document.getElementById('promoFlyerFile');
    if (f) f.value = '';
    const info = document.getElementById('promoFlyerInfo');
    if (info) info.innerHTML = 'Rasio 1:1. Flyer dikirim sebagai <b>tautan gambar</b> di dalam pesan, bukan gambar menempel.';
    promoPratinjau();
}

// -------------------- PENGIRIMAN SATU PER SATU --------------------
function promoMulaiKirim() {
    const dipilih = promoTerpilih();
    if (!dipilih.length) { showToast('Peringatan', 'Belum ada customer yang dipilih.', 'warning'); return; }
    const isi = (document.getElementById('promoPesan').value || '').trim();
    if (!isi) { showToast('Peringatan', 'Isi pesan tidak boleh kosong.', 'warning'); document.getElementById('promoPesan').focus(); return; }
    const link = (document.getElementById('promoLink').value || '').trim();
    if (!link) { showToast('Peringatan', 'Link katalog wajib diisi.', 'warning'); document.getElementById('promoLink').focus(); return; }

    dbRpc('mulai_blast_promo', {
        p_judul: document.getElementById('promoJudul').value.trim(),
        p_pesan: isi,
        p_link_katalog: link,
        p_link_flyer: (promoFlyer && promoFlyer.url) || '',
        p_penerima: dipilih.map(function(c) { return { no_hp: c.no_hp, nama: c.nama || '' }; })
    }).then(function(res) {
        if (!res.success || !res.data) { showToast('Gagal', res.message || 'Gagal menyiapkan pengiriman.', 'danger'); return; }
        promoAntrean = { blastId: res.data.blast_id, target: res.data.target || [], idx: 0 };
        bukaAntreanKirim();
    });
}
function bukaAntreanKirim() {
    document.getElementById('previewModalTitle').textContent = 'Kirim Promosi';
    gambarAntreanKirim();
    openModal('previewModal');
}
function gambarAntreanKirim() {
    const a = promoAntrean;
    const box = document.getElementById('previewModalContent');
    if (!a || !box) return;
    const selesai = a.target.filter(function(t) { return t.status !== 'Menunggu'; }).length;
    const terkirim = a.target.filter(function(t) { return t.status === 'Terkirim'; }).length;
    if (a.idx >= a.target.length) {
        box.innerHTML = [
          '<div class="text-center py-4">',
          '<i class="bi bi-check-circle-fill" style="font-size:44px; color:#16a34a;"></i>',
          '<h3 class="font-bold mt-3" style="color:var(--text-primary)">Pengiriman Selesai</h3>',
          '<p class="text-sm mt-1" style="color:var(--text-body)"><b>' + terkirim + '</b> terkirim dari ' + a.target.length + ' customer.</p>',
          '<button class="btn-primary w-full mt-4" style="height:44px;" onclick="promoTutupAntrean()">Tutup</button>',
          '</div>'
        ].join('');
        return;
    }
    const t = a.target[a.idx];
    const nomor = String(t.no_hp || '').replace(/[^0-9]/g, '');
    const url = 'https://wa.me/' + nomor + '?text=' + encodeURIComponent(susunPesanPromo(t.nama));
    box.innerHTML = [
      '<div class="text-left">',
      '<div class="pu-antre-bar"><div class="pu-antre-isi" style="width:' + Math.round(selesai / a.target.length * 100) + '%"></div></div>',
      '<p class="text-xs mb-3" style="color:var(--text-muted)">Penerima <b>' + (a.idx + 1) + '</b> dari <b>' + a.target.length + '</b> &middot; ' + terkirim + ' sudah terkirim</p>',
      '<div class="pu-antre-kartu">',
      '<div class="pu-antre-nama">' + escapeHtml(t.nama || '(tanpa nama)') + '</div>',
      '<div class="pu-antre-hp">' + escapeHtml(t.no_hp) + '</div>',
      '</div>',
      '<p class="text-xs mt-3 mb-2" style="color:var(--text-muted)">Tekan tombol hijau: WhatsApp terbuka dengan pesan sudah terisi. Setelah Anda menekan kirim di WhatsApp, kembali ke sini lalu tekan <b>Sudah dikirim</b>.</p>',
      '<a class="btn-wa w-full" style="height:46px;" href="' + escapeAttr(url) + '" target="_blank" rel="noopener" onclick="promoTandaiDibuka()"><i class="bi bi-whatsapp" style="font-size:18px;"></i> Buka WhatsApp untuk ' + escapeHtml((t.nama || '').split(' ')[0] || 'customer') + '</a>',
      '<div class="flex gap-2 mt-3">',
      '<button type="button" class="btn-ghost" style="flex:1; height:42px;" onclick="promoLanjut(\'Dilewati\')">Lewati</button>',
      '<button type="button" class="btn-primary" style="flex:2; height:42px;" onclick="promoLanjut(\'Terkirim\')"><i class="bi bi-check-lg"></i> Sudah dikirim</button>',
      '</div>',
      '<button type="button" class="btn-ghost w-full mt-2" onclick="promoTutupAntrean()">Hentikan dulu</button>',
      '</div>'
    ].join('');
}
let promoSudahDibuka = false;
function promoTandaiDibuka() { promoSudahDibuka = true; }
function promoLanjut(status) {
    const a = promoAntrean;
    if (!a) return;
    const t = a.target[a.idx];
    if (!t) return;
    if (status === 'Terkirim' && !promoSudahDibuka) {
        showToast('Belum dibuka', 'Tekan dulu tombol hijau untuk membuka WhatsApp, atau pilih Lewati.', 'warning');
        return;
    }
    promoSudahDibuka = false;
    t.status = status;
    dbUpdate('promo_blast_target', t.id, {
        status: status,
        dikirim_pada: status === 'Terkirim' ? new Date().toISOString() : null
    }).then(function(res) {
        if (!res.success) showToast('Catatan gagal disimpan', res.message, 'warning');
    });
    a.idx += 1;
    gambarAntreanKirim();
}
function promoTutupAntrean() {
    closeModal('previewModal');
    promoAntrean = null;
    promoSudahDibuka = false;
    AppState.cache = {};
    loadCustomerPromo();
    loadRiwayatBlast();
}

// -------------------- RIWAYAT --------------------
function loadRiwayatBlast() {
    dbRpc('get_riwayat_blast').then(function(res) {
        const el = document.getElementById('promoRiwayat');
        if (!el) return;
        const list = (res.success && Array.isArray(res.data)) ? res.data : [];
        if (!list.length) { el.innerHTML = '<div class="empty-state"><i class="bi bi-clock-history"></i>Belum ada kiriman promosi.</div>'; return; }
        el.innerHTML = '<div class="table-wrap"><table class="data-table"><thead><tr><th>Tanggal</th><th>Judul</th><th>Terkirim</th><th>Isi Pesan</th></tr></thead><tbody>' +
            list.map(function(b) {
                return '<tr><td class="whitespace-nowrap">' + tanggalIndo(b.created_at) + '</td>' +
                       '<td>' + escapeHtml(b.judul || '(tanpa judul)') + '</td>' +
                       '<td class="whitespace-nowrap"><b>' + b.jumlah_terkirim + '</b> / ' + b.jumlah_target +
                       (b.jumlah_dilewati ? ('<div class="text-xs" style="color:var(--text-muted)">' + b.jumlah_dilewati + ' dilewati</div>') : '') + '</td>' +
                       '<td style="white-space:normal; max-width:380px;"><div class="text-xs" style="color:var(--text-muted)">' + escapeHtml(String(b.pesan || '').slice(0, 160)) + (String(b.pesan || '').length > 160 ? '...' : '') + '</div></td></tr>';
            }).join('') + '</tbody></table></div>';
    });
}
