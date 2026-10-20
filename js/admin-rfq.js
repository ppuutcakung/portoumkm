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
let adminRfqTahun = 'Semua';
let adminRfqHalaman = 1;    // Semua | '2026' | '2027' | ...
/** Tahun pengajuan diambil dari tanggal masuknya. '' kalau tanggalnya tidak sah. */
function tahunRfq(r) {
    // Dijaga dua lapis: new Date(null) menghasilkan tahun 1970, BUKAN tanggal
    // tidak sah - tanpa pemeriksaan pertama ini akan muncul chip "1970" palsu.
    if (!r || !r.created_at) return '';
    const d = new Date(r.created_at);
    return isNaN(d) ? '' : String(d.getFullYear());
}
/** Daftar tahun yang benar-benar ada di data, terbaru lebih dulu. */
function daftarTahunRfq() {
    const set = {};
    adminRfqCache.forEach(function(r) { const t = tahunRfq(r); if (t) set[t] = true; });
    return Object.keys(set).sort().reverse();
}
const STATUS_RFQ = ['Baru', 'Diproses', 'Selesai', 'Batal'];
const JENIS_RFQ = ['RFQ', 'Sampel', 'Kustom'];

function renderAdminRfqPage() {
    const container = document.getElementById('app-container');
    container.innerHTML = adminPageShell('B2B: RFQ &amp; Permintaan Sampel', [
      '<p class="text-sm mb-3" style="color:var(--text-muted)">Pengajuan yang <b>sudah dikonfirmasi</b> Admin. Pengajuan baru menunggu di menu Konfirmasi Pesanan. Klik ikon PDF untuk mengunduh dokumen terstandar lengkap dengan foto produk.<br>Setelah UMKM dan customer sepakat soal jumlah dan harga, tekan <b>Konfirmasi Kesepakatan</b> &mdash; pengajuan berubah menjadi pesanan di <b>Monitoring Pesanan</b> dan terkunci di sini.</p>',
      '<div class="pu-tahun-baris"><span class="pu-tahun-label">Tahun:</span><span class="flex flex-wrap gap-2" id="rfqTahunChips"></span></div>',
      '<div class="flex flex-wrap gap-2 mb-2" id="rfqJenisChips"></div>',
      '<div class="flex flex-wrap gap-2 mb-3" id="rfqFilterChips"></div>',
      '<div class="table-wrap">',
      '<table class="data-table">',
      '<thead><tr><th>Tanggal</th><th>Dokumen</th><th>Perusahaan / PIC</th><th>Produk / UMKM</th><th>Jumlah / Harga Diminta</th><th>Kesepakatan</th><th>Status</th><th></th></tr></thead>',
      '<tbody id="rfqTbody"><tr><td colspan="8" class="text-center py-4">Memuat...</td></tr></tbody>',
      '</table>',
      '</div>',
      '<div id="rfqPagination" class="pagination"></div>'
    ].join(''));
    adminRfqFilter = 'Semua';
    adminRfqJenis = 'Semua';
    adminRfqTahun = 'Semua';
    loadAdminRfq();
}
function loadAdminRfq() {
    const cached = ambilDariCache('adminRfqList');
    if (cached) { adminRfqCache = cached; renderRfqTabel(); return; }
    dbSelect('rfq', { eq: { status_konfirmasi: 'Dikonfirmasi' }, order: 'created_at', ascending: false }).then(function(res) {
        adminRfqCache = res.success ? res.data : [];
        if (!res.success) showToast('Error', res.message, 'danger');
        simpanKeCache('adminRfqList', adminRfqCache);
        renderRfqTabel();
    });
}
// Ganti saringan selalu kembali ke halaman 1.
function setFilterRfq(status) { adminRfqFilter = status; adminRfqHalaman = 1; renderRfqTabel(); }
function setJenisRfq(jenis) { adminRfqJenis = jenis; adminRfqHalaman = 1; renderRfqTabel(); }
function setTahunRfq(t) { adminRfqTahun = t; adminRfqHalaman = 1; renderRfqTabel(); }

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

    // Di tab ini tidak ada ringkasan statistik, jadi saringan tahun menyaring
    // TABELNYA. Dipasang paling awal supaya hitungan pada chip Jenis dan
    // Status ikut mengikuti tahun yang sedang dipilih.
    const tahunChips = document.getElementById('rfqTahunChips');
    if (tahunChips) {
        tahunChips.innerHTML =
            '<select class="form-select pu-tahun-pilih" onchange="setTahunRfq(this.value)">' +
            ['Semua'].concat(daftarTahunRfq()).map(function(t) {
                const jml = t === 'Semua' ? adminRfqCache.length : adminRfqCache.filter(function(r) { return tahunRfq(r) === t; }).length;
                return '<option value="' + escapeAttr(t) + '"' + (adminRfqTahun === t ? ' selected' : '') + '>' +
                       (t === 'Semua' ? 'Semua Tahun' : t) + ' (' + jml + ')</option>';
            }).join('') + '</select>';
    }
    const sesuaiTahun = adminRfqTahun === 'Semua' ? adminRfqCache
        : adminRfqCache.filter(function(r) { return tahunRfq(r) === adminRfqTahun; });

    jenisChips.innerHTML = ['Semua'].concat(JENIS_RFQ).map(function(j) {
        const jml = j === 'Semua' ? sesuaiTahun.length : sesuaiTahun.filter(function(r) { return r.jenis === j; }).length;
        return '<button class="chip ' + (adminRfqJenis === j ? 'active' : '') + '" onclick="setJenisRfq(\'' + j + '\')">' + (j === 'Semua' ? 'Semua Jenis' : j) + ' (' + jml + ')</button>';
    }).join('');
    const sesuaiJenis = adminRfqJenis === 'Semua' ? sesuaiTahun : sesuaiTahun.filter(function(r) { return r.jenis === adminRfqJenis; });
    chips.innerHTML = ['Semua'].concat(STATUS_RFQ).map(function(st) {
        const jml = st === 'Semua' ? sesuaiJenis.length : sesuaiJenis.filter(function(r) { return r.status === st; }).length;
        return '<button class="chip chip-solid ' + (adminRfqFilter === st ? 'active' : '') + '" onclick="setFilterRfq(\'' + st + '\')">' + (st === 'Semua' ? 'Semua Status' : st) + ' (' + jml + ')</button>';
    }).join('');
    const items = adminRfqFilter === 'Semua' ? sesuaiJenis : sesuaiJenis.filter(function(r) { return r.status === adminRfqFilter; });
    if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4" style="color:var(--text-muted)">' + (adminRfqCache.length ? 'Tidak ada data dengan filter ini.' : 'Belum ada pengajuan masuk.') + '</td></tr>';
        gambarKontrolHalaman('rfqPagination', potongHalaman([], 1), 'gotoHalamanRfq');
        return;
    }
    const pot = potongHalaman(items, adminRfqHalaman);
    adminRfqHalaman = pot.halaman;
    tbody.innerHTML = pot.baris.map(function(r) {
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
          '<td style="white-space:normal; min-width:150px;">' + selKesepakatan(r) + '</td>',
          '<td><select class="form-select" style="height:32px; font-size:12px; width:auto;" onchange="ubahStatusRfq(\'' + id + '\', this.value)">' + opsi + '</select></td>',
          '<td class="whitespace-nowrap">',
          '<button class="btn-icon-sm" onclick="unduhPdfRfqById(\'' + id + '\')" title="Unduh PDF"><i class="bi bi-file-earmark-pdf" style="color:#dc2626;"></i></button> ',
          '<button class="btn-icon-sm" onclick="lihatRfq(\'' + id + '\')" title="Lihat detail"><i class="bi bi-eye"></i></button> ',
          (sudahDeal(r)
            ? '<span class="btn-icon-sm pu-terkunci" title="Sudah disepakati - terkunci, tidak bisa dihapus"><i class="bi bi-lock-fill"></i></span>'
            : '<button class="btn-icon-sm" onclick="hapusRfq(\'' + id + '\')" title="Hapus"><i class="bi bi-trash text-red-500"></i></button>'),
          '</td>',
          '</tr>'
        ].join('');
    }).join('');
    gambarKontrolHalaman('rfqPagination', pot, 'gotoHalamanRfq');
}
function cariRfq(id) { return adminRfqCache.find(function(x) { return x.id === id; }); }

// -------------------- KESEPAKATAN: PENGAJUAN MENJADI PESANAN --------------------
function sudahDeal(r) { return !!r && r.status_kesepakatan === 'Deal'; }
/** Isi kolom Kesepakatan: ringkasan bila sudah deal, tombol bila belum. */
function selKesepakatan(r) {
    const id = idAman(r.id);
    if (!sudahDeal(r)) {
        return '<button class="btn-primary pu-btn-deal" onclick="bukaFormKesepakatan(\'' + id + '\')">' +
               '<i class="bi bi-patch-check"></i> Konfirmasi Kesepakatan</button>';
    }
    const jml = Number(r.jumlah_deal) || 0, hrg = Number(r.harga_deal) || 0;
    return '<div class="pu-deal-box">' +
           '<span class="pu-deal-badge"><i class="bi bi-patch-check-fill"></i> Disepakati</span>' +
           '<div class="pu-deal-rinci">' + jml + ' ' + escapeHtml(r.satuan || '') + ' &times; ' + formatRupiah(hrg) +
           ' = <b>' + formatRupiah(jml * hrg) + '</b></div>' +
           '</div>';
}
function unduhPdfRfqById(id) {
    const r = cariRfq(id);
    if (!r) { showToast('Gagal', 'Data tidak ditemukan. Muat ulang halaman lalu coba lagi.', 'danger'); return; }
    unduhPdfRfq(r);
}
let rfqDealId = '';
/**
 * Form kesepakatan: hanya jumlah dan harga yang benar-benar disepakati.
 * Angka awal diambil dari pengajuan (jumlah target & harga yang diminta)
 * supaya Admin tinggal membetulkan yang berubah saja.
 */
function bukaFormKesepakatan(id) {
    const r = cariRfq(id);
    if (!r) { showToast('Gagal', 'Data tidak ditemukan. Muat ulang halaman lalu coba lagi.', 'danger'); return; }
    if (sudahDeal(r)) { showToast('Sudah disepakati', 'Pengajuan ini sudah menjadi pesanan.', 'info'); return; }
    rfqDealId = r.id;
    const sampel = r.jenis === 'Sampel';
    const hargaAwal = (r.harga_diminta !== null && r.harga_diminta !== undefined && r.harga_diminta !== '')
        ? r.harga_diminta
        : ((r.harga_estimasi_satuan !== null && r.harga_estimasi_satuan !== undefined) ? r.harga_estimasi_satuan : '');
    document.getElementById('previewModalTitle').textContent = 'Konfirmasi Kesepakatan ' + (r.nomor || '');
    document.getElementById('previewModalContent').innerHTML = [
      '<form id="dealForm" class="text-left" onsubmit="simpanKesepakatan(event)">',
      '<p class="text-xs mb-3" style="color:var(--text-muted)">Isi jumlah dan harga yang <b>benar-benar disepakati</b> antara UMKM dan customer. Setelah disimpan, pengajuan ini menjadi <b>pesanan</b> di Monitoring Pesanan dan terkunci di sini.</p>',
      '<div class="pu-deal-ringkas">',
      '<div><span>Produk</span><b>' + escapeHtml(r.nama_produk || '-') + '</b></div>',
      '<div><span>UMKM</span><b>' + escapeHtml(r.nama_umkm || '-') + '</b></div>',
      '<div><span>Pemesan</span><b>' + escapeHtml(namaPerusahaanRfq(r) || r.nama_pic || '-') + '</b></div>',
      (r.model ? '<div><span>Model / Tipe</span><b>' + escapeHtml(r.model) + '</b></div>' : ''),
      '<div><span>Diajukan</span><b>' + r.target_jumlah + ' ' + escapeHtml(r.satuan || '') +
        ((r.harga_diminta !== null && r.harga_diminta !== undefined && r.harga_diminta !== '') ? (' &middot; diminta ' + formatRupiah(r.harga_diminta)) : '') + '</b></div>',
      '</div>',
      '<div class="grid grid-cols-2 gap-3">',
      '<div class="form-group"><label class="form-label">Jumlah Disepakati *</label>',
      '<input class="form-input" type="number" min="1" id="dealJumlah" required value="' + escapeAttr(String(r.target_jumlah || 1)) + '" oninput="hitungTotalDeal()">',
      '<p class="pf-foto-info">Satuan: ' + escapeHtml(r.satuan || '-') + '</p></div>',
      '<div class="form-group"><label class="form-label">Harga Satuan Disepakati (Rp) *</label>',
      '<input class="form-input" type="number" min="0" id="dealHarga" required value="' + escapeAttr(String(hargaAwal)) + '" oninput="hitungTotalDeal()">',
      '<p class="pf-foto-info">' + (sampel ? 'Isi 0 bila sampelnya dipinjamkan.' : 'Harga akhir per satuan.') + '</p></div>',
      '</div>',
      '<div class="pu-deal-total">Total nilai pesanan: <b id="dealTotal">-</b></div>',
      '<div class="grid grid-cols-2 gap-3">',
      '<div class="form-group"><label class="form-label">Tanggal Kirim</label>',
      '<input class="form-input" type="date" id="dealTanggal" value="' + escapeAttr(r.batas_waktu || '') + '">',
      '<p class="pf-foto-info">Kosong = memakai batas waktu pengajuan.</p></div>',
      '<div class="form-group"><label class="form-label">Maks. Jam Sampai</label>',
      '<input class="form-input" type="time" id="dealJam"></div>',
      '</div>',
      '<div class="form-group"><label class="form-label">Catatan Kesepakatan (opsional)</label>',
      '<textarea class="form-textarea" id="dealCatatan" maxlength="1000" placeholder="Misal: harga sudah termasuk ongkir, pelunasan H-3"></textarea></div>',
      '<button type="submit" class="btn-primary w-full" style="height:46px;"><i class="bi bi-patch-check"></i> Setujui &amp; Jadikan Pesanan</button>',
      '</form>'
    ].join('');
    openModal('previewModal');
    hitungTotalDeal();
}
function hitungTotalDeal() {
    const el = document.getElementById('dealTotal');
    if (!el) return;
    const j = parseInt((document.getElementById('dealJumlah') || {}).value, 10) || 0;
    const h = Number((document.getElementById('dealHarga') || {}).value) || 0;
    el.textContent = (j > 0) ? formatRupiah(j * h) : '-';
}
function simpanKesepakatan(e) {
    e.preventDefault();
    const r = cariRfq(rfqDealId);
    if (!r) { showToast('Gagal', 'Data tidak ditemukan. Muat ulang halaman lalu coba lagi.', 'danger'); return; }
    const jumlah = parseInt(document.getElementById('dealJumlah').value, 10);
    const harga = Number(document.getElementById('dealHarga').value);
    if (!(jumlah >= 1)) { showToast('Peringatan', 'Jumlah yang disepakati minimal 1.', 'warning'); return; }
    if (!(harga >= 0)) { showToast('Peringatan', 'Harga yang disepakati tidak boleh kosong atau negatif.', 'warning'); return; }
    const btn = e.target.querySelector('button[type="submit"]');
    const asli = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-inline"></span> Memproses...';
    btn.disabled = true;
    dbRpc('setujui_rfq', {
        p_rfq_id: rfqDealId,
        p_jumlah: jumlah,
        p_harga: harga,
        p_tanggal_kirim: document.getElementById('dealTanggal').value || null,
        p_jam: document.getElementById('dealJam').value || '',
        p_catatan: document.getElementById('dealCatatan').value.trim()
    }).then(function(res) {
        btn.innerHTML = asli;
        btn.disabled = false;
        if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }
        closeModal('previewModal');
        AppState.cache = {};
        const nomor = (res.data && res.data.nomor) || '';
        showToast('Kesepakatan disimpan', 'Pesanan ' + nomor + ' sudah masuk ke Monitoring Pesanan.', 'success');
        loadAdminRfq();
    });
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
    const r = cariRfq(id);
    // Pengaman di layar; kuncinya sendiri ada di database, jadi tetap aman
    // walaupun ada jalur lain yang mencoba menghapus.
    if (sudahDeal(r)) {
        showToast('Terkunci', 'Pengajuan ini sudah disepakati dan menjadi pesanan. Hapus dulu pesanannya di Monitoring Pesanan bila memang ingin dibatalkan.', 'warning');
        return;
    }
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
        (r.model ? baris('Model / Tipe', r.model) : '') +
        baris(sampel ? 'Jumlah Sampel' : 'Target Jumlah', r.target_jumlah + ' ' + (r.satuan || '')) +
        baris('Harga yang Diminta', hargaDiminta) +
        baris('Acuan skema grosir', r.harga_estimasi_satuan ? formatRupiah(r.harga_estimasi_satuan) : '') +
        baris(sampel ? 'Skema Sampel' : 'Opsi pembayaran', teksPembayaran(r.opsi_pembayaran, r.dp_persen)) +
        baris('Batas waktu kirim', r.batas_waktu ? tanggalDateIndo(r.batas_waktu) : '') +
        baris('Spesifikasi', r.spesifikasi) +
        baris('Status', r.status) +
        (sudahDeal(r)
          ? (baris('Kesepakatan', 'Disepakati pada ' + tanggalIndo(r.tanggal_deal)) +
             baris('Jumlah disepakati', (Number(r.jumlah_deal) || 0) + ' ' + (r.satuan || '')) +
             baris('Harga disepakati', formatRupiah(r.harga_deal) + (r.satuan ? ' / ' + r.satuan : '')) +
             baris('Total nilai pesanan', formatRupiah((Number(r.jumlah_deal) || 0) * (Number(r.harga_deal) || 0))) +
             (r.catatan_deal ? baris('Catatan kesepakatan', r.catatan_deal) : '') +
             '<p class="text-xs mt-2" style="color:var(--text-muted)"><i class="bi bi-lock-fill"></i> Pengajuan ini terkunci karena sudah menjadi pesanan. Rinciannya ada di Monitoring Pesanan.</p>')
          : '') +
        '<div class="flex gap-2 mt-4 flex-wrap">' +
        (sudahDeal(r) ? '' : '<button type="button" class="btn-primary" style="flex:1; min-width:150px; height:44px;" onclick="bukaFormKesepakatan(\'' + idAman(r.id) + '\')"><i class="bi bi-patch-check"></i> Konfirmasi Kesepakatan</button>') +
        '<button type="button" class="' + (sudahDeal(r) ? 'btn-primary' : 'btn-ghost') + '" style="flex:1; min-width:150px; height:44px;" onclick="unduhPdfRfqById(\'' + idAman(r.id) + '\')"><i class="bi bi-file-earmark-pdf"></i> Unduh PDF</button>' +
        (noWa ? '<a class="btn-wa" style="flex:1; min-width:150px; height:44px;" href="https://wa.me/' + noWa + '?text=' + encodeURIComponent(pesan) + '" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> Hubungi PIC</a>' : '') +
        '</div></div>';
    openModal('previewModal');
}

/** Pindah halaman tabel RFQ; isi tabel digambar ulang tanpa memuat data lagi. */
function gotoHalamanRfq(h) {
    adminRfqHalaman = h;
    renderRfqTabel();
    window.scrollTo(0, 0);
}
