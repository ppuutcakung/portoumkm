/**
 * ============================================================
 * PortoUMKM - Admin: RFQ Grosir B2B
 * Daftar pengajuan penawaran (RFQ) dan permintaan sampel dari customer
 * mode B2B Grosir. Semua tombol hanya membawa ID (bukan teks bebas).
 * ============================================================
 */
let adminRfqCache = [];
let adminRfqFilter = 'Semua';
const STATUS_RFQ = ['Baru', 'Diproses', 'Selesai', 'Batal'];

function renderAdminRfqPage() {
    const container = document.getElementById('app-container');
    container.innerHTML = adminPageShell('RFQ Grosir B2B', [
      '<p class="text-sm mb-3" style="color:var(--text-muted)">Pengajuan penawaran (RFQ) dan permintaan sampel dari customer mode B2B Grosir. Saat ini semuanya masuk ke Admin.</p>',
      '<div class="flex flex-wrap gap-2 mb-3" id="rfqFilterChips"></div>',
      '<div class="table-wrap">',
      '<table class="data-table">',
      '<thead><tr><th>Tanggal</th><th>Jenis</th><th>Pembeli</th><th>Produk / UMKM</th><th>Jumlah</th><th>Status</th><th></th></tr></thead>',
      '<tbody id="rfqTbody"><tr><td colspan="7" class="text-center py-4">Memuat...</td></tr></tbody>',
      '</table>',
      '</div>'
    ].join(''));
    adminRfqFilter = 'Semua';
    loadAdminRfq();
}
function loadAdminRfq() {
    const cached = ambilDariCache('adminRfqList');
    if (cached) { adminRfqCache = cached; renderRfqTabel(); return; }
    dbSelect('rfq', { order: 'created_at', ascending: false }).then(function(res) {
        adminRfqCache = res.success ? res.data : [];
        if (!res.success) showToast('Error', res.message, 'danger');
        simpanKeCache('adminRfqList', adminRfqCache);
        renderRfqTabel();
    });
}
function setFilterRfq(status) {
    adminRfqFilter = status;
    renderRfqTabel();
}
function tanggalIndo(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    return isNaN(d) ? String(iso) : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function tanggalDateIndo(ymd) {
    if (!ymd) return '-';
    const m = String(ymd).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return String(ymd);
    return tanggalIndo(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toISOString());
}
function renderRfqTabel() {
    const chips = document.getElementById('rfqFilterChips');
    const tbody = document.getElementById('rfqTbody');
    if (!chips || !tbody) return;
    chips.innerHTML = ['Semua'].concat(STATUS_RFQ).map(function(st) {
        const jml = st === 'Semua' ? adminRfqCache.length : adminRfqCache.filter(function(r) { return r.status === st; }).length;
        return '<button class="chip chip-solid ' + (adminRfqFilter === st ? 'active' : '') + '" onclick="setFilterRfq(\'' + st + '\')">' + st + ' (' + jml + ')</button>';
    }).join('');
    const items = adminRfqFilter === 'Semua' ? adminRfqCache : adminRfqCache.filter(function(r) { return r.status === adminRfqFilter; });
    if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4" style="color:var(--text-muted)">' + (adminRfqCache.length ? 'Tidak ada RFQ dengan status ini.' : 'Belum ada RFQ masuk.') + '</td></tr>';
        return;
    }
    tbody.innerHTML = items.map(function(r) {
        const id = idAman(r.id);
        const opsi = STATUS_RFQ.map(function(st) { return '<option' + (r.status === st ? ' selected' : '') + '>' + st + '</option>'; }).join('');
        return [
          '<tr>',
          '<td class="whitespace-nowrap">' + tanggalIndo(r.created_at) + '</td>',
          '<td>' + escapeHtml(r.jenis) + '</td>',
          '<td><div class="font-semibold" style="color:var(--text-primary)">' + escapeHtml(r.nama_pembeli) + '</div><div class="text-xs" style="color:var(--text-muted)">' + escapeHtml(r.kontak) + '</div></td>',
          '<td style="max-width:240px; white-space:normal;"><div>' + escapeHtml(r.nama_produk) + '</div><div class="text-xs" style="color:var(--text-muted)">' + escapeHtml(r.nama_umkm || '-') + '</div></td>',
          '<td class="whitespace-nowrap">' + r.target_jumlah + ' ' + escapeHtml(r.satuan || '') + '</td>',
          '<td><select class="form-select" style="height:32px; font-size:12px; width:auto;" onchange="ubahStatusRfq(\'' + id + '\', this.value)">' + opsi + '</select></td>',
          '<td class="whitespace-nowrap">',
          '<button class="btn-icon-sm" onclick="lihatRfq(\'' + id + '\')" title="Lihat detail"><i class="bi bi-eye"></i></button> ',
          '<button class="btn-icon-sm" onclick="hapusRfq(\'' + id + '\')" title="Hapus"><i class="bi bi-trash text-red-500"></i></button>',
          '</td>',
          '</tr>'
        ].join('');
    }).join('');
}
function ubahStatusRfq(id, status) {
    if (STATUS_RFQ.indexOf(status) === -1) return;
    dbUpdate('rfq', id, { status: status }).then(function(res) {
        if (!res.success) { showToast('Gagal', res.message, 'danger'); loadAdminRfq(); return; }
        const r = adminRfqCache.find(function(x) { return x.id === id; });
        if (r) r.status = status;
        simpanKeCache('adminRfqList', adminRfqCache);
        showToast('Berhasil', 'Status RFQ diperbarui menjadi ' + status + '.', 'success');
        renderRfqTabel();
    });
}
function hapusRfq(id) {
    confirmDeleteRecord('rfq', id, function() { AppState.cache = {}; loadAdminRfq(); });
}
function lihatRfq(id) {
    const r = adminRfqCache.find(function(x) { return x.id === id; });
    if (!r) return;
    const baris = function(label, nilai) {
        return '<div class="flex gap-3 py-1" style="border-bottom:1px solid #f1f5f9;"><div class="text-xs font-bold" style="width:140px; flex:none; color:var(--text-muted);">' + label + '</div><div class="text-sm" style="color:var(--text-primary); white-space:pre-line;">' + (nilai ? escapeHtml(nilai) : '-') + '</div></div>';
    };
    const noWa = normalisasiNoWa(r.kontak);
    const pesan = 'Halo ' + r.nama_pembeli + ', kami dari PortoUMKM menindaklanjuti pengajuan ' + (r.jenis === 'Sampel' ? 'sampel' : 'RFQ') + ' Anda untuk "' + r.nama_produk + '" (' + r.target_jumlah + ' ' + (r.satuan || '') + ').';
    document.getElementById('previewModalTitle').textContent = 'Detail ' + (r.jenis === 'Sampel' ? 'Permintaan Sampel' : 'RFQ');
    document.getElementById('previewModalContent').innerHTML = '<div class="text-left">' +
        baris('Tanggal masuk', tanggalIndo(r.created_at)) +
        baris('Jenis', r.jenis) +
        baris('Perusahaan/Pembeli', r.nama_pembeli) +
        baris('WhatsApp/HP', r.kontak) +
        baris('Produk', r.nama_produk) +
        baris('UMKM', r.nama_umkm) +
        baris('Jumlah', r.target_jumlah + ' ' + (r.satuan || '')) +
        baris('Estimasi harga satuan', r.harga_estimasi_satuan ? formatRupiah(r.harga_estimasi_satuan) : '') +
        baris('Opsi pembayaran', r.opsi_pembayaran) +
        baris('Batas waktu kirim', r.batas_waktu ? tanggalDateIndo(r.batas_waktu) : '') +
        baris('Spesifikasi', r.spesifikasi) +
        baris('Status', r.status) +
        (noWa ? '<a class="btn-wa w-full mt-4" style="height:44px;" href="https://wa.me/' + noWa + '?text=' + encodeURIComponent(pesan) + '" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> Hubungi Pembeli via WhatsApp</a>' : '') +
        '</div>';
    openModal('previewModal');
}
