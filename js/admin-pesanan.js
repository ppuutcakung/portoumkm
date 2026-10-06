/**
 * ============================================================
 * PortoUMKM - Admin: Monitoring Pesanan
 * Rekap SEMUA pembelian (B2C Ritel dan B2B Grosir) beserta rincian item dan
 * invoice PDF. Pengajuan RFQ TIDAK masuk ke sini - RFQ ada di menu B2B
 * tersendiri, karena sifatnya pengajuan harga, bukan pembelian.
 * ============================================================
 */
let adminPesananCache = [];
let adminPesananRingkas = {};
let adminPesananMode = 'Semua';    // Semua | b2c | b2b
let adminPesananStatus = 'Semua';  // Semua | Sudah Bayar | Belum Bayar
const STATUS_BAYAR = ['Belum Bayar', 'Sudah Bayar'];
function sudahBayar(p) { return p.status_bayar === 'Sudah Bayar'; }

function renderAdminPesananPage() {
    const container = document.getElementById('app-container');
    container.innerHTML = adminPageShell('Monitoring Pesanan', [
      '<p class="text-sm mb-3" style="color:var(--text-muted)">Rekap seluruh pembelian dari etalase B2C Ritel maupun B2B Grosir. Pengajuan RFQ tidak dimasukkan ke sini karena belum berupa pembelian; lihat menu B2B untuk RFQ.</p>',
      '<div id="pesananRingkas" class="pu-stat-grid"></div>',
      '<div class="flex flex-wrap gap-2 mb-2" id="pesananModeChips"></div>',
      '<div class="flex flex-wrap gap-2 mb-3" id="pesananStatusChips"></div>',
      '<div class="table-wrap">',
      '<table class="data-table">',
      '<thead><tr><th>Tanggal</th><th>No. Pesanan</th><th>Pemesan</th><th>Kirim</th><th>Item</th><th>Total</th><th>Status</th><th></th></tr></thead>',
      '<tbody id="pesananTbody"><tr><td colspan="8" class="text-center py-4">Memuat...</td></tr></tbody>',
      '</table>',
      '</div>'
    ].join(''));
    adminPesananMode = 'Semua';
    adminPesananStatus = 'Semua';
    loadAdminPesanan();
}
function loadAdminPesanan() {
    const cached = ambilDariCache('adminPesananRekap');
    if (cached) { adminPesananCache = cached.pesanan; adminPesananRingkas = cached.ringkas; renderPesananTabel(); return; }
    dbRpc('get_rekap_pesanan').then(function(res) {
        if (!res.success || !res.data) {
            showToast('Error', res.message || 'Gagal memuat rekap pesanan.', 'danger');
            adminPesananCache = []; adminPesananRingkas = {};
            renderPesananTabel();
            return;
        }
        adminPesananCache = res.data.pesanan || [];
        adminPesananRingkas = res.data.ringkas || {};
        simpanKeCache('adminPesananRekap', { pesanan: adminPesananCache, ringkas: adminPesananRingkas });
        renderPesananTabel();
    });
}
function setModePesananAdmin(m) { adminPesananMode = m; renderPesananTabel(); }
function setStatusPesananAdmin(st) { adminPesananStatus = st; renderPesananTabel(); }

function labelModePesanan(m) { return m === 'b2b' ? 'B2B Grosir' : 'B2C Ritel'; }
function tagModePesanan(m) {
    return '<span class="pu-mode-tag ' + (m === 'b2b' ? 'pu-mode-b2b' : 'pu-mode-b2c') + '">' + (m === 'b2b' ? 'B2B' : 'B2C') + '</span>';
}
function itemsPesanan(p) { return Array.isArray(p.items) ? p.items : []; }

/** Ringkasan nilai mengikuti baris yang sedang tampil (ikut filter). */
function renderRingkasPesanan(items) {
    const el = document.getElementById('pesananRingkas');
    if (!el) return;
    const n = function(x) { return Number(x.total_estimasi) || 0; };
    const total = items.reduce(function(a, b) { return a + n(b); }, 0);
    const lunas = items.filter(sudahBayar);
    const belum = items.filter(function(x) { return !sudahBayar(x); });
    const b2c = items.filter(function(x) { return (x.mode || 'b2c') !== 'b2b'; });
    const b2b = items.filter(function(x) { return (x.mode || 'b2c') === 'b2b'; });
    const kartu = [
        { label: 'Total Nilai Pesanan', nilai: total, sub: items.length + ' pesanan', warna: '#0f172a', ikon: 'bi-receipt' },
        { label: 'Sudah Dibayar', nilai: lunas.reduce(function(a, b) { return a + n(b); }, 0), sub: lunas.length + ' pesanan', warna: '#16a34a', ikon: 'bi-check-circle' },
        { label: 'Belum Dibayar', nilai: belum.reduce(function(a, b) { return a + n(b); }, 0), sub: belum.length + ' pesanan', warna: '#dc2626', ikon: 'bi-hourglass-split' },
        { label: 'Nilai B2C Ritel', nilai: b2c.reduce(function(a, b) { return a + n(b); }, 0), sub: b2c.length + ' pesanan', warna: '#475569', ikon: 'bi-person' },
        { label: 'Nilai B2B Grosir', nilai: b2b.reduce(function(a, b) { return a + n(b); }, 0), sub: b2b.length + ' pesanan', warna: '#0284c7', ikon: 'bi-building' }
    ];
    el.innerHTML = kartu.map(function(k) {
        return '<div class="pu-stat"><div class="pu-stat-ico" style="background:' + k.warna + '"><i class="bi ' + k.ikon + '"></i></div>' +
               '<div><div class="pu-stat-label">' + k.label + '</div>' +
               '<div class="pu-stat-nilai" style="color:' + k.warna + '">' + formatRupiah(k.nilai) + '</div>' +
               '<div class="pu-stat-sub">' + k.sub + '</div></div></div>';
    }).join('');
}

function renderPesananTabel() {
    const modeChips = document.getElementById('pesananModeChips');
    const statusChips = document.getElementById('pesananStatusChips');
    const tbody = document.getElementById('pesananTbody');
    if (!modeChips || !statusChips || !tbody) return;

    modeChips.innerHTML = [['Semua', 'Semua Jalur'], ['b2c', 'B2C Ritel'], ['b2b', 'B2B Grosir']].map(function(m) {
        const jml = m[0] === 'Semua' ? adminPesananCache.length : adminPesananCache.filter(function(x) { return (x.mode || 'b2c') === m[0]; }).length;
        return '<button class="chip ' + (adminPesananMode === m[0] ? 'active' : '') + '" onclick="setModePesananAdmin(\'' + m[0] + '\')">' + m[1] + ' (' + jml + ')</button>';
    }).join('');

    const sesuaiMode = adminPesananMode === 'Semua' ? adminPesananCache : adminPesananCache.filter(function(x) { return (x.mode || 'b2c') === adminPesananMode; });
    statusChips.innerHTML = ['Semua'].concat(STATUS_BAYAR).map(function(st) {
        const jml = st === 'Semua' ? sesuaiMode.length : sesuaiMode.filter(function(x) { return st === 'Sudah Bayar' ? sudahBayar(x) : !sudahBayar(x); }).length;
        return '<button class="chip chip-solid ' + (adminPesananStatus === st ? 'active' : '') + '" onclick="setStatusPesananAdmin(\'' + st + '\')">' + (st === 'Semua' ? 'Semua Status' : st) + ' (' + jml + ')</button>';
    }).join('');

    const items = adminPesananStatus === 'Semua' ? sesuaiMode
        : sesuaiMode.filter(function(x) { return adminPesananStatus === 'Sudah Bayar' ? sudahBayar(x) : !sudahBayar(x); });
    renderRingkasPesanan(items);

    if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4" style="color:var(--text-muted)">' + (adminPesananCache.length ? 'Tidak ada pesanan dengan filter ini.' : 'Belum ada pesanan masuk.') + '</td></tr>';
        return;
    }
    tbody.innerHTML = items.map(function(p) {
        const id = idAman(p.id);
        const mode = p.mode || 'b2c';
        const its = itemsPesanan(p);
        const ringkasItem = its.slice(0, 2).map(function(i) {
            return escapeHtml(i.nama_produk + (i.warna ? ' [' + i.warna + ']' : '') + ' x' + i.qty + (i.satuan || ''));
        }).join('<br>') + (its.length > 2 ? ('<div class="text-xs" style="color:var(--text-muted)">+' + (its.length - 2) + ' item lain</div>') : '');
        const pemesan = (mode === 'b2b' && p.nama_perusahaan)
            ? '<div class="font-semibold" style="color:var(--text-primary)">' + escapeHtml(p.nama_perusahaan) + '</div><div class="text-xs" style="color:var(--text-muted)">' + escapeHtml(p.nama_pemesan) + ' &middot; ' + escapeHtml(p.no_hp || '') + '</div>'
            : '<div class="font-semibold" style="color:var(--text-primary)">' + escapeHtml(p.nama_pemesan) + '</div><div class="text-xs" style="color:var(--text-muted)">' + escapeHtml(p.no_hp || '') + '</div>';
        return [
          '<tr>',
          '<td class="whitespace-nowrap">' + tanggalIndo(p.created_at) + '<div>' + tagModePesanan(mode) + '</div></td>',
          '<td class="whitespace-nowrap font-semibold" style="color:var(--text-primary)">' + escapeHtml(p.nomor || '-') + '</td>',
          '<td style="max-width:200px; white-space:normal;">' + pemesan + '</td>',
          '<td class="whitespace-nowrap text-xs">' + tanggalKirimSederhana(p.tanggal_kirim) + '<div style="color:var(--text-muted)">' + escapeHtml(jamSederhana(p.jam_maksimal)) + '</div></td>',
          '<td style="max-width:220px; white-space:normal;" class="text-xs">' + (ringkasItem || '-') + '</td>',
          '<td class="whitespace-nowrap font-semibold">' + formatRupiah(p.total_estimasi) +
            ' <button class="btn-icon-sm" onclick="editTotalPesanan(\'' + id + '\')" title="Edit total"><i class="bi bi-pencil"></i></button></td>',
          '<td><select class="form-select" style="height:32px; font-size:12px; width:auto;" onchange="ubahStatusBayar(\'' + id + '\', this.value)">' +
            STATUS_BAYAR.map(function(st) { return '<option' + (p.status_bayar === st ? ' selected' : '') + '>' + st + '</option>'; }).join('') + '</select></td>',
          '<td class="whitespace-nowrap">',
          '<button class="btn-icon-sm" onclick="unduhInvoiceById(\'' + id + '\')" title="Unduh PDF Detail Pesanan"><i class="bi bi-file-earmark-pdf" style="color:#dc2626;"></i></button> ',
          '<button class="btn-icon-sm" onclick="lihatPesananAdmin(\'' + id + '\')" title="Lihat detail"><i class="bi bi-eye"></i></button> ',
          '<button class="btn-icon-sm" onclick="hapusPesananAdmin(\'' + id + '\')" title="Hapus pesanan"><i class="bi bi-trash text-red-500"></i></button>',
          '</td>',
          '</tr>'
        ].join('');
    }).join('');
}
/** Tanggal kirim ditampilkan sederhana: "01 Des 2026". Nilai kosong/aneh jadi "-". */
function tanggalKirimSederhana(nilai) {
    if (!nilai) return '-';
    const teks = String(nilai).trim();
    const m = teks.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : new Date(teks);
    if (isNaN(d)) return escapeHtml(teks);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
/**
 * Jam ditampilkan sederhana: "09:00". Data lama bisa berbentuk panjang seperti
 * "09:00:00 GMT+0700 (WIB)" atau tanggal penuh; diambil jam & menitnya saja.
 */
function jamSederhana(nilai) {
    if (!nilai && nilai !== 0) return '-';
    const teks = String(nilai).trim();
    if (!teks) return '-';
    const m = teks.match(/(\d{1,2}):(\d{2})/);
    if (m) return String(m[1]).padStart(2, '0') + ':' + m[2];
    const d = new Date(teks);
    if (!isNaN(d)) return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    return teks;
}
/** Ubah status bayar lewat dropdown di tabel. */
function ubahStatusBayar(id, status) {
    if (STATUS_BAYAR.indexOf(status) === -1) return;
    dbUpdate('pesanan', id, { status_bayar: status }).then(function(res) {
        if (!res.success) { showToast('Gagal', res.message, 'danger'); AppState.cache = {}; loadAdminPesanan(); return; }
        const p = cariPesananAdmin(id);
        if (p) p.status_bayar = status;
        simpanKeCache('adminPesananRekap', { pesanan: adminPesananCache, ringkas: adminPesananRingkas });
        showToast('Berhasil', 'Status pembayaran diperbarui menjadi ' + status + '.', 'success');
        renderPesananTabel();
    });
}
/** Admin bisa menyesuaikan total (mis. ongkos kirim atau koreksi harga). */
let pesananEditId = null;   // ID pesanan yang sedang diedit totalnya
function editTotalPesanan(id) {
    const p = cariPesananAdmin(id);
    if (!p) { showToast('Gagal', 'Data pesanan tidak ditemukan. Muat ulang halaman lalu coba lagi.', 'danger'); return; }
    const jumlahItem = itemsPesanan(p).reduce(function(a, i) { return a + (Number(i.harga_satuan) || 0) * (Number(i.qty) || 0); }, 0);
    pesananEditId = id;
    document.getElementById('previewModalTitle').textContent = 'Edit Total Pesanan';
    document.getElementById('previewModalContent').innerHTML = [
      '<form onsubmit="submitEditTotalPesanan(event)" class="text-left">',
      '<p class="text-sm mb-1" style="color:var(--text-primary)">No. Pesanan: <b>' + escapeHtml(p.nomor || '-') + '</b></p>',
      '<p class="text-xs mb-3" style="color:var(--text-muted)">Jumlah rincian item: <b>' + formatRupiah(jumlahItem) + '</b>. Ubah angka di bawah bila ada ongkos kirim atau penyesuaian lain.</p>',
      '<div class="form-group"><label class="form-label">Total Pesanan (Rp) *</label>',
      '<input class="form-input" type="number" min="0" step="any" id="etTotal" required value="' + escapeAttr(p.total_estimasi) + '"></div>',
      '<div class="flex gap-2">',
      '<button type="button" class="btn-ghost" style="flex:1;" onclick="document.getElementById(\'etTotal\').value=' + jumlahItem + '">Samakan dengan rincian item</button>',
      '<button type="submit" class="btn-primary" style="flex:1; height:42px;"><i class="bi bi-check-lg"></i> Simpan</button>',
      '</div></form>'
    ].join('');
    openModal('previewModal');
}
function submitEditTotalPesanan(e) {
    e.preventDefault();
    const id = pesananEditId;
    const nilai = Number(document.getElementById('etTotal').value);
    if (!id) { showToast('Gagal', 'Pesanan yang diedit tidak dikenali. Tutup jendela ini lalu coba lagi.', 'danger'); return; }
    if (!(nilai >= 0)) { showToast('Peringatan', 'Total tidak boleh kosong atau negatif.', 'warning'); return; }
    const btn = e.target.querySelector('button[type="submit"]');
    const asli = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-inline"></span> Menyimpan...';
    btn.disabled = true;
    dbUpdate('pesanan', id, { total_estimasi: nilai }).then(function(res) {
        btn.innerHTML = asli;
        btn.disabled = false;
        if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }
        const p = cariPesananAdmin(id);
        if (p) p.total_estimasi = nilai;
        simpanKeCache('adminPesananRekap', { pesanan: adminPesananCache, ringkas: adminPesananRingkas });
        showToast('Berhasil', 'Total pesanan diperbarui.', 'success');
        closeModal('previewModal');
        renderPesananTabel();
    });
}
/** Hapus pesanan (mis. data salah atau pesanan iseng). Rincian itemnya ikut terhapus. */
function hapusPesananAdmin(id) {
    const p = cariPesananAdmin(id);
    if (!p) { showToast('Gagal', 'Data pesanan tidak ditemukan. Muat ulang halaman lalu coba lagi.', 'danger'); return; }
    confirmDeleteRecord('pesanan', id, function() { AppState.cache = {}; loadAdminPesanan(); }, [], {
        pesanKonfirmasi: 'Hapus pesanan ' + (p.nomor || '') + ' atas nama ' + (p.nama_pemesan || '') + ' senilai ' + formatRupiah(p.total_estimasi) + '? Seluruh rincian itemnya ikut terhapus dan tidak bisa dikembalikan.'
    });
}
function cariPesananAdmin(id) { return adminPesananCache.find(function(x) { return x.id === id; }); }
function unduhInvoiceById(id) {
    const p = cariPesananAdmin(id);
    if (!p) { showToast('Gagal', 'Data pesanan tidak ditemukan. Muat ulang halaman lalu coba lagi.', 'danger'); return; }
    unduhInvoicePesanan(p);
}
function lihatPesananAdmin(id) {
    const p = cariPesananAdmin(id);
    if (!p) return;
    const mode = p.mode || 'b2c';
    const baris = function(label, nilai) {
        return '<div class="flex gap-3 py-1" style="border-bottom:1px solid #f1f5f9;"><div class="text-xs font-bold" style="width:150px; flex:none; color:var(--text-muted);">' + label + '</div><div class="text-sm" style="color:var(--text-primary); white-space:pre-line;">' + (nilai ? escapeHtml(nilai) : '-') + '</div></div>';
    };
    const its = itemsPesanan(p);
    const tabelItem = its.length ? ('<table class="data-table" style="margin-top:10px;"><thead><tr><th>Produk</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead><tbody>' +
        its.map(function(i) {
            const sub = (Number(i.harga_satuan) || 0) * (Number(i.qty) || 0);
            return '<tr><td style="white-space:normal;">' + escapeHtml(i.nama_produk) + (i.warna ? ' <span class="text-xs">[' + escapeHtml(i.warna) + ']</span>' : '') +
                   '<div class="text-xs" style="color:var(--text-muted)">' + escapeHtml(i.nama_umkm || '') + (i.catatan ? ' &middot; ' + escapeHtml(i.catatan) : '') + '</div></td>' +
                   '<td class="whitespace-nowrap">' + i.qty + ' ' + escapeHtml(i.satuan || '') + '</td>' +
                   '<td class="whitespace-nowrap">' + formatRupiah(i.harga_satuan) + '</td>' +
                   '<td class="whitespace-nowrap">' + formatRupiah(sub) + '</td></tr>';
        }).join('') + '</tbody></table>') : '<p class="text-sm mt-2" style="color:var(--text-muted)">Rincian item tidak tersedia.</p>';
    const noWa = normalisasiNoWa(p.no_hp);
    const pesan = 'Halo ' + (p.nama_pemesan || '') + ', kami dari PortoUMKM menindaklanjuti pesanan ' + (p.nomor || '') + ' senilai ' + formatRupiah(p.total_estimasi) + '.';
    document.getElementById('previewModalTitle').textContent = 'Detail Pesanan';
    document.getElementById('previewModalContent').innerHTML = '<div class="text-left">' +
        baris('No. Pesanan', p.nomor) +
        baris('Jalur', labelModePesanan(mode)) +
        baris('Tanggal pesan', tanggalIndo(p.created_at)) +
        (mode === 'b2b' ? baris('Nama Perusahaan', p.nama_perusahaan) : '') +
        baris(mode === 'b2b' ? 'PIC / Pemesan' : 'Nama Pemesan', p.nama_pemesan) +
        baris('WhatsApp/HP', p.no_hp) +
        baris('Alamat Penerima', p.alamat_kirim) +
        baris('Tanggal dikirim', tanggalKirimSederhana(p.tanggal_kirim)) +
        baris('Maksimal jam sampai', jamSederhana(p.jam_maksimal)) +
        baris('Catatan tambahan', p.catatan) +
        baris('Status bayar', p.status_bayar) +
        baris('Total', formatRupiah(p.total_estimasi)) +
        tabelItem +
        '<div class="flex gap-2 mt-4 flex-wrap">' +
        '<button type="button" class="btn-primary" style="flex:1; min-width:150px; height:44px;" onclick="unduhInvoiceById(\'' + idAman(p.id) + '\')"><i class="bi bi-file-earmark-pdf"></i> Unduh PDF Detail Pesanan</button>' +
        (noWa ? '<a class="btn-wa" style="flex:1; min-width:150px; height:44px;" href="https://wa.me/' + noWa + '?text=' + encodeURIComponent(pesan) + '" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> Hubungi Pemesan</a>' : '') +
        '</div></div>';
    openModal('previewModal');
}
