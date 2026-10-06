/**
 * ============================================================
 * PortoUMKM - Admin: B2B (RFQ, Permintaan Sampel, RFQ Kustom)
 * Setiap pengajuan tercatat dengan nomor dokumen dan bisa diunduh sebagai
 * PDF terstandar (lihat rfq-pdf.js). Semua tombol hanya membawa ID.
 * ============================================================
 */
let adminRfqCache = [];
let adminRfqFilter = 'Semua';   // status
let adminRfqJenis = 'Semua';    // RFQ | Sampel | Kustom
const STATUS_RFQ = ['Baru', 'Diproses', 'Selesai', 'Batal'];
const JENIS_RFQ = ['RFQ', 'Sampel', 'Kustom'];

function renderAdminRfqPage() {
    const container = document.getElementById('app-container');
    container.innerHTML = adminPageShell('B2B: RFQ &amp; Permintaan Sampel', [
      '<p class="text-sm mb-3" style="color:var(--text-muted)">Pengajuan penawaran (RFQ), permintaan paket sampel, dan RFQ kustom dari customer mode B2B Grosir. Klik ikon PDF untuk mengunduh dokumen terstandar lengkap dengan foto produk.</p>',
      '<div class="flex flex-wrap gap-2 mb-2" id="rfqJenisChips"></div>',
      '<div class="flex flex-wrap gap-2 mb-3" id="rfqFilterChips"></div>',
      '<div class="table-wrap">',
      '<table class="data-table">',
      '<thead><tr><th>Tanggal</th><th>Dokumen</th><th>Perusahaan / PIC</th><th>Produk / UMKM</th><th>Jumlah / Harga Diminta</th><th>Status</th><th></th></tr></thead>',
      '<tbody id="rfqTbody"><tr><td colspan="7" class="text-center py-4">Memuat...</td></tr></tbody>',
      '</table>',
      '</div>'
    ].join(''));
    adminRfqFilter = 'Semua';
    adminRfqJenis = 'Semua';
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
function setFilterRfq(status) { adminRfqFilter = status; renderRfqTabel(); }
function setJenisRfq(jenis) { adminRfqJenis = jenis; renderRfqTabel(); }

function tanggalIndo(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    return isNaN(d) ? String(iso) : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function tanggalDateIndo(ymd) {
    if (!ymd) return '-';
    const m = String(ymd).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return String(ymd);
    return tanggalIndo(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12).toISOString());
}
function namaPerusahaanRfq(r) { return r.nama_perusahaan || r.nama_pembeli || ''; }

function renderRfqTabel() {
    const jenisChips = document.getElementById('rfqJenisChips');
    const chips = document.getElementById('rfqFilterChips');
    const tbody = document.getElementById('rfqTbody');
    if (!chips || !tbody || !jenisChips) return;
    jenisChips.innerHTML = ['Semua'].concat(JENIS_RFQ).map(function(j) {
        const jml = j === 'Semua' ? adminRfqCache.length : adminRfqCache.filter(function(r) { return r.jenis === j; }).length;
        return '<button class="chip ' + (adminRfqJenis === j ? 'active' : '') + '" onclick="setJenisRfq(\'' + j + '\')">' + (j === 'Semua' ? 'Semua Jenis' : j) + ' (' + jml + ')</button>';
    }).join('');
    const sesuaiJenis = adminRfqJenis === 'Semua' ? adminRfqCache : adminRfqCache.filter(function(r) { return r.jenis === adminRfqJenis; });
    chips.innerHTML = ['Semua'].concat(STATUS_RFQ).map(function(st) {
        const jml = st === 'Semua' ? sesuaiJenis.length : sesuaiJenis.filter(function(r) { return r.status === st; }).length;
        return '<button class="chip chip-solid ' + (adminRfqFilter === st ? 'active' : '') + '" onclick="setFilterRfq(\'' + st + '\')">' + (st === 'Semua' ? 'Semua Status' : st) + ' (' + jml + ')</button>';
    }).join('');
    const items = adminRfqFilter === 'Semua' ? sesuaiJenis : sesuaiJenis.filter(function(r) { return r.status === adminRfqFilter; });
    if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4" style="color:var(--text-muted)">' + (adminRfqCache.length ? 'Tidak ada data dengan filter ini.' : 'Belum ada pengajuan masuk.') + '</td></tr>';
        return;
    }
    tbody.innerHTML = items.map(function(r) {
        const id = idAman(r.id);
        const opsi = STATUS_RFQ.map(function(st) { return '<option' + (r.status === st ? ' selected' : '') + '>' + st + '</option>'; }).join('');
        const harga = (r.harga_diminta !== null && r.harga_diminta !== undefined && r.harga_diminta !== '')
            ? '<div class="text-xs" style="color:var(--text-muted)">Diminta ' + formatRupiah(r.harga_diminta) + '/' + escapeHtml(r.satuan || 'sat') + '</div>' : '';
        return [
          '<tr>',
          '<td class="whitespace-nowrap">' + tanggalIndo(r.created_at) + '</td>',
          '<td class="whitespace-nowrap"><div class="font-semibold" style="color:var(--text-primary)">' + escapeHtml(r.nomor || '-') + '</div><div class="text-xs" style="color:var(--text-muted)">' + escapeHtml(r.jenis) + '</div></td>',
          '<td><div class="font-semibold" style="color:var(--text-primary)">' + escapeHtml(namaPerusahaanRfq(r)) + '</div><div class="text-xs" style="color:var(--text-muted)">' + escapeHtml(r.nama_pic || '-') + ' &middot; ' + escapeHtml(r.kontak) + '</div></td>',
          '<td style="max-width:220px; white-space:normal;"><div>' + escapeHtml(r.nama_produk) + '</div><div class="text-xs" style="color:var(--text-muted)">' + escapeHtml(r.nama_umkm || '-') + '</div></td>',
          '<td class="whitespace-nowrap">' + r.target_jumlah + ' ' + escapeHtml(r.satuan || '') + harga + '</td>',
          '<td><select class="form-select" style="height:32px; font-size:12px; width:auto;" onchange="ubahStatusRfq(\'' + id + '\', this.value)">' + opsi + '</select></td>',
          '<td class="whitespace-nowrap">',
          '<button class="btn-icon-sm" onclick="unduhPdfRfqById(\'' + id + '\')" title="Unduh PDF"><i class="bi bi-file-earmark-pdf" style="color:#dc2626;"></i></button> ',
          '<button class="btn-icon-sm" onclick="lihatRfq(\'' + id + '\')" title="Lihat detail"><i class="bi bi-eye"></i></button> ',
          '<button class="btn-icon-sm" onclick="hapusRfq(\'' + id + '\')" title="Hapus"><i class="bi bi-trash text-red-500"></i></button>',
          '</td>',
          '</tr>'
        ].join('');
    }).join('');
}
function cariRfq(id) { return adminRfqCache.find(function(x) { return x.id === id; }); }
function unduhPdfRfqById(id) {
    const r = cariRfq(id);
    if (!r) { showToast('Gagal', 'Data tidak ditemukan. Muat ulang halaman lalu coba lagi.', 'danger'); return; }
    unduhPdfRfq(r);
}
function ubahStatusRfq(id, status) {
    if (STATUS_RFQ.indexOf(status) === -1) return;
    dbUpdate('rfq', id, { status: status }).then(function(res) {
        if (!res.success) { showToast('Gagal', res.message, 'danger'); loadAdminRfq(); return; }
        const r = cariRfq(id);
        if (r) r.status = status;
        simpanKeCache('adminRfqList', adminRfqCache);
        showToast('Berhasil', 'Status diperbarui menjadi ' + status + '.', 'success');
        renderRfqTabel();
    });
}
function hapusRfq(id) {
    confirmDeleteRecord('rfq', id, function() { AppState.cache = {}; loadAdminRfq(); });
}
function lihatRfq(id) {
    const r = cariRfq(id);
    if (!r) return;
    const sampel = r.jenis === 'Sampel';
    const baris = function(label, nilai) {
        return '<div class="flex gap-3 py-1" style="border-bottom:1px solid #f1f5f9;"><div class="text-xs font-bold" style="width:150px; flex:none; color:var(--text-muted);">' + label + '</div><div class="text-sm" style="color:var(--text-primary); white-space:pre-line;">' + (nilai ? escapeHtml(nilai) : '-') + '</div></div>';
    };
    const hargaDiminta = (r.harga_diminta !== null && r.harga_diminta !== undefined && r.harga_diminta !== '') ? formatRupiah(r.harga_diminta) + (r.satuan ? ' / ' + r.satuan : '') : '';
    const noWa = normalisasiNoWa(r.kontak);
    const pesan = 'Halo ' + (r.nama_pic || namaPerusahaanRfq(r)) + ', kami dari PortoUMKM menindaklanjuti pengajuan ' + (sampel ? 'sampel' : 'RFQ') + ' ' + (r.nomor || '') + ' untuk "' + r.nama_produk + '" (' + r.target_jumlah + ' ' + (r.satuan || '') + ').';
    document.getElementById('previewModalTitle').textContent = 'Detail ' + (sampel ? 'Permintaan Sampel' : 'RFQ');
    document.getElementById('previewModalContent').innerHTML = '<div class="text-left">' +
        baris('No. Dokumen', r.nomor) +
        baris('Jenis', r.jenis) +
        baris('Tanggal masuk', tanggalIndo(r.created_at)) +
        baris('Nama Perusahaan', namaPerusahaanRfq(r)) +
        baris('PIC / Pembeli', r.nama_pic) +
        baris('WhatsApp/HP', r.kontak) +
        baris('Alamat Penerima', r.alamat_penerima) +
        baris('Produk', r.nama_produk) +
        baris('UMKM', r.nama_umkm) +
        baris(sampel ? 'Jumlah Sampel' : 'Target Jumlah', r.target_jumlah + ' ' + (r.satuan || '')) +
        baris('Harga yang Diminta', hargaDiminta) +
        baris('Acuan skema grosir', r.harga_estimasi_satuan ? formatRupiah(r.harga_estimasi_satuan) : '') +
        baris(sampel ? 'Skema Sampel' : 'Opsi pembayaran', teksPembayaran(r.opsi_pembayaran, r.dp_persen)) +
        baris('Batas waktu kirim', r.batas_waktu ? tanggalDateIndo(r.batas_waktu) : '') +
        baris('Spesifikasi', r.spesifikasi) +
        baris('Status', r.status) +
        '<div class="flex gap-2 mt-4 flex-wrap">' +
        '<button type="button" class="btn-primary" style="flex:1; min-width:150px; height:44px;" onclick="unduhPdfRfqById(\'' + idAman(r.id) + '\')"><i class="bi bi-file-earmark-pdf"></i> Unduh PDF</button>' +
        (noWa ? '<a class="btn-wa" style="flex:1; min-width:150px; height:44px;" href="https://wa.me/' + noWa + '?text=' + encodeURIComponent(pesan) + '" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> Hubungi PIC</a>' : '') +
        '</div></div>';
    openModal('previewModal');
}
