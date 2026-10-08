/**
 * ============================================================
 * PortoUMKM - Admin: Konfirmasi Pesanan
 *
 * Aplikasi terbuka tanpa login, jadi semua pesanan dan pengajuan masuk
 * ke antrean ini lebih dulu. Setelah Admin menekan Konfirmasi, barulah
 * datanya muncul di Monitoring Pesanan (untuk pembelian) atau menu
 * B2B (untuk RFQ dan permintaan sampel). Yang iseng cukup dihapus.
 * ============================================================
 */
let antrianPesanan = [];
let antrianRfq = [];
let antrianJenis = 'Semua';   // Semua | Pesanan | Pengajuan

function renderAdminKonfirmasiPage() {
    const container = document.getElementById('app-container');
    container.innerHTML = adminPageShell('Konfirmasi Pesanan', [
      '<p class="text-sm mb-3" style="color:var(--text-muted)">Semua pesanan dan pengajuan masuk ke sini lebih dulu. Tekan <b>Konfirmasi</b> agar datanya diteruskan ke Monitoring Pesanan atau menu B2B, atau <b>Hapus</b> bila datanya tidak benar.</p>',
      '<div class="flex flex-wrap gap-2 mb-3" id="konfirmasiChips"></div>',
      '<div id="konfirmasiIsi"></div>'
    ].join(''));
    antrianJenis = 'Semua';
    loadAntrianKonfirmasi();
}

function loadAntrianKonfirmasi(pakaiCache) {
    if (pakaiCache !== false) {
        const cached = ambilDariCache('antrianKonfirmasi');
        if (cached) { antrianPesanan = cached.pesanan; antrianRfq = cached.rfq; renderAntrian(); return; }
    }
    const isi = document.getElementById('konfirmasiIsi');
    if (isi) isi.innerHTML = '<div class="empty-state"><div class="spinner-brand" style="margin:0 auto;"></div></div>';
    dbRpc('get_antrian_konfirmasi').then(function(res) {
        if (!res.success || !res.data) {
            showToast('Error', res.message || 'Gagal memuat antrean konfirmasi.', 'danger');
            antrianPesanan = []; antrianRfq = [];
            renderAntrian();
            return;
        }
        antrianPesanan = res.data.pesanan || [];
        antrianRfq = res.data.rfq || [];
        simpanKeCache('antrianKonfirmasi', { pesanan: antrianPesanan, rfq: antrianRfq });
        perbaruiLencanaKonfirmasi(antrianPesanan.length + antrianRfq.length);
        renderAntrian();
    });
}
function setJenisAntrian(j) { antrianJenis = j; renderAntrian(); }

function renderAntrian() {
    const chips = document.getElementById('konfirmasiChips');
    const isi = document.getElementById('konfirmasiIsi');
    if (!chips || !isi) return;
    const total = antrianPesanan.length + antrianRfq.length;
    chips.innerHTML = [['Semua', 'Semua', total], ['Pesanan', 'Pesanan Pembelian', antrianPesanan.length], ['Pengajuan', 'Pengajuan RFQ &amp; Sampel', antrianRfq.length]]
        .map(function(c) {
            return '<button class="chip chip-solid ' + (antrianJenis === c[0] ? 'active' : '') + '" onclick="setJenisAntrian(\'' + c[0] + '\')">' + c[1] + ' (' + c[2] + ')</button>';
        }).join('');

    const tampilPesanan = antrianJenis !== 'Pengajuan';
    const tampilRfq = antrianJenis !== 'Pesanan';
    const bagian = [];
    if (tampilPesanan && antrianPesanan.length) {
        bagian.push('<h3 class="text-sm font-bold mb-2 mt-1" style="color:var(--text-primary)">Pesanan Pembelian (' + antrianPesanan.length + ')</h3>');
        bagian.push('<div class="pu-antri-grid">' + antrianPesanan.map(kartuPesananAntri).join('') + '</div>');
    }
    if (tampilRfq && antrianRfq.length) {
        bagian.push('<h3 class="text-sm font-bold mb-2 mt-4" style="color:var(--text-primary)">Pengajuan RFQ &amp; Sampel (' + antrianRfq.length + ')</h3>');
        bagian.push('<div class="pu-antri-grid">' + antrianRfq.map(kartuRfqAntri).join('') + '</div>');
    }
    isi.innerHTML = bagian.length ? bagian.join('')
        : '<div class="empty-state"><i class="bi bi-check2-circle"></i>' + (total ? 'Tidak ada data pada saringan ini.' : 'Tidak ada yang menunggu konfirmasi. Semua pesanan sudah diproses.') + '</div>';
}

function barisKartu(label, nilai) {
    return '<div class="pu-antri-baris"><span>' + label + '</span><b>' + (nilai ? escapeHtml(nilai) : '-') + '</b></div>';
}
function kartuPesananAntri(p) {
    const id = idAman(p.id);
    const mode = p.mode || 'b2c';
    const its = Array.isArray(p.items) ? p.items : [];
    const daftar = its.map(function(i) {
        const jam = i.jam_maksimal || p.jam_maksimal || '';
        return '<li>' + escapeHtml(i.nama_produk) + (i.model ? ' <b class="pu-model-tag">' + escapeHtml(i.model) + '</b>' : '') + (i.warna ? ' <span class="text-xs">[' + escapeHtml(i.warna) + ']</span>' : '') +
               ' &times;' + i.qty + ' ' + escapeHtml(i.satuan || '') +
               ' &middot; ' + formatRupiah((Number(i.harga_satuan) || 0) * (Number(i.qty) || 0)) +
               (jam ? '<div class="pu-jam-tag"><i class="bi bi-clock"></i> Maks. jam sampai <b>' + escapeHtml(jamSederhana(jam)) + '</b></div>' : '') +
               (i.catatan ? '<div class="text-xs" style="color:var(--text-muted)">' + escapeHtml(i.catatan) + '</div>' : '') + '</li>';
    }).join('');
    return [
      '<div class="pu-antri-kartu">',
      '<div class="pu-antri-kepala"><span class="pu-antri-nomor">' + escapeHtml(p.nomor || '-') + '</span>' + tagModePesanan(mode) + '<span class="pu-antri-waktu">' + tanggalIndo(p.created_at) + '</span></div>',
      (mode === 'b2b' || p.nama_perusahaan) ? barisKartu('Perusahaan', p.nama_perusahaan) : '',
      barisKartu('PIC / Pemesan', p.nama_pemesan),
      barisKartu('WhatsApp / HP', p.no_hp),
      barisKartu('Alamat Penerima', p.alamat_kirim),
      barisKartu('Dikirim', tanggalKirimSederhana(p.tanggal_kirim) + ' ' + ringkasJamItem(its, p.jam_maksimal)),
      p.catatan ? barisKartu('Catatan', p.catatan) : '',
      '<div class="pu-antri-item"><ul>' + (daftar || '<li>Rincian item tidak tersedia.</li>') + '</ul></div>',
      '<div class="pu-antri-total">Total: <b>' + formatRupiah(p.total_estimasi) + '</b></div>',
      '<div class="pu-antri-aksi">',
      '<button type="button" class="btn-ghost" onclick="hapusAntrianPesanan(\'' + id + '\')"><i class="bi bi-trash text-red-500"></i> Hapus</button>',
      '<button type="button" class="btn-primary" onclick="konfirmasiPesanan(\'' + id + '\')"><i class="bi bi-check-lg"></i> Konfirmasi</button>',
      '</div>',
      '</div>'
    ].join('');
}
function kartuRfqAntri(r) {
    const id = idAman(r.id);
    const sampel = r.jenis === 'Sampel';
    const hargaDiminta = (r.harga_diminta !== null && r.harga_diminta !== undefined && r.harga_diminta !== '')
        ? formatRupiah(r.harga_diminta) + (r.satuan ? ' / ' + r.satuan : '') : '';
    return [
      '<div class="pu-antri-kartu">',
      '<div class="pu-antri-kepala"><span class="pu-antri-nomor">' + escapeHtml(r.nomor || '-') + '</span><span class="pu-mode-tag pu-mode-b2b">' + escapeHtml(r.jenis) + '</span><span class="pu-antri-waktu">' + tanggalIndo(r.created_at) + '</span></div>',
      barisKartu('Perusahaan', r.nama_perusahaan || r.nama_pembeli),
      barisKartu('PIC / Pembeli', r.nama_pic),
      barisKartu('WhatsApp / HP', r.kontak),
      barisKartu('Alamat Penerima', r.alamat_penerima),
      barisKartu('Produk', r.nama_produk),
      r.model ? barisKartu('Model / Tipe', r.model) : '',
      barisKartu('UMKM', r.nama_umkm),
      barisKartu(sampel ? 'Jumlah Sampel' : 'Target Jumlah', r.target_jumlah + ' ' + (r.satuan || '')),
      hargaDiminta ? barisKartu('Harga Diminta', hargaDiminta) : '',
      barisKartu(sampel ? 'Skema Sampel' : 'Opsi Pembayaran', teksPembayaran(r.opsi_pembayaran, r.dp_persen)),
      r.spesifikasi ? barisKartu('Spesifikasi', r.spesifikasi) : '',
      '<div class="pu-antri-aksi">',
      '<button type="button" class="btn-ghost" onclick="hapusAntrianRfq(\'' + id + '\')"><i class="bi bi-trash text-red-500"></i> Hapus</button>',
      '<button type="button" class="btn-primary" onclick="konfirmasiRfq(\'' + id + '\')"><i class="bi bi-check-lg"></i> Konfirmasi</button>',
      '</div>',
      '</div>'
    ].join('');
}

/** Tandai sudah dikonfirmasi; setelah ini datanya muncul di menu tujuannya. */
function konfirmasiAntrian(tabel, id, pesanBerhasil) {
    dbUpdate(tabel, id, { status_konfirmasi: 'Dikonfirmasi' }).then(function(res) {
        if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }
        AppState.cache = {};
        showToast('Dikonfirmasi', pesanBerhasil, 'success');
        loadAntrianKonfirmasi(false);
    });
}
function konfirmasiPesanan(id) {
    konfirmasiAntrian('pesanan', id, 'Pesanan diteruskan ke Monitoring Pesanan.');
}
function konfirmasiRfq(id) {
    konfirmasiAntrian('rfq', id, 'Pengajuan diteruskan ke menu B2B.');
}
function hapusAntrianPesanan(id) {
    const p = antrianPesanan.find(function(x) { return x.id === id; });
    if (!p) { showToast('Gagal', 'Data tidak ditemukan. Muat ulang halaman lalu coba lagi.', 'danger'); return; }
    confirmDeleteRecord('pesanan', id, function() { AppState.cache = {}; loadAntrianKonfirmasi(false); }, [], {
        pesanKonfirmasi: 'Hapus pesanan ' + (p.nomor || '') + ' atas nama ' + (p.nama_pemesan || '') + ' senilai ' + formatRupiah(p.total_estimasi) + '? Rincian itemnya ikut terhapus dan tidak bisa dikembalikan.'
    });
}
function hapusAntrianRfq(id) {
    const r = antrianRfq.find(function(x) { return x.id === id; });
    if (!r) { showToast('Gagal', 'Data tidak ditemukan. Muat ulang halaman lalu coba lagi.', 'danger'); return; }
    confirmDeleteRecord('rfq', id, function() { AppState.cache = {}; loadAntrianKonfirmasi(false); }, [], {
        pesanKonfirmasi: 'Hapus pengajuan ' + (r.nomor || '') + ' dari ' + (r.nama_perusahaan || r.nama_pembeli || '') + '? Tindakan ini tidak bisa dibatalkan.'
    });
}

// -------------------- LENCANA ANGKA DI MENU --------------------
/** Tulis angka pada menu "Konfirmasi Pesanan" di sidebar Admin. */
function perbaruiLencanaKonfirmasi(jumlah) {
    const el = document.getElementById('lencanaKonfirmasi');
    if (!el) return;
    const n = Number(jumlah) || 0;
    el.textContent = n > 99 ? '99+' : String(n);
    el.style.display = n > 0 ? 'inline-flex' : 'none';
}
/** Ambil jumlah antrean dari server (dipanggil saat halaman Admin dibuka). */
function muatLencanaKonfirmasi() {
    if (!AppState.session) return;
    dbRpc('get_jumlah_konfirmasi').then(function(res) {
        if (res.success) perbaruiLencanaKonfirmasi(res.data);
    });
}
