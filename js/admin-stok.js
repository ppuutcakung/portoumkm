/**
 * ============================================================
 * PortoUMKM - Manajemen Stok & Laporan Pergerakan Barang
 * ============================================================
 *
 * Dua bagian dalam satu halaman:
 *  1. Manajemen Stok  - daftar produk ber-stok, sorotan yang menipis/habis,
 *                       penyesuaian manual, dan riwayat mutasinya.
 *  2. Laporan & Analitik - barang cepat laku (fast moving) vs tertahan
 *                       (slow moving), lengkap dengan chart.
 *
 * Angka stok TIDAK pernah diubah langsung dari sini lewat update tabel.
 * Semuanya lewat fungsi set_stok() di database supaya setiap perubahan
 * meninggalkan jejak di stok_mutasi dan tidak bisa dikarang.
 */

let stokData = null;          // hasil get_laporan_stok terakhir
let stokGagal = '';           // pesan error terakhir, kalau pemuatan gagal
let stokHari = 30;            // rentang hari laporan yang sedang dipilih
let stokTab = 'kelola';       // 'kelola' | 'laporan'
let stokCariTeks = '';
let stokSaringan = 'Semua';   // Semua | Menipis | Habis | Aman
let chartStokGerak = null;
let chartStokTerjual = null;

const STOK_RENTANG = [
    { hari: 7, label: '7 hari' },
    { hari: 30, label: '30 hari' },
    { hari: 90, label: '90 hari' },
    { hari: 365, label: '1 tahun' }
];

function renderAdminStokPage() {
    const container = document.getElementById('app-container');
    container.innerHTML = adminPageShell('Manajemen Stok &amp; Laporan Barang',
        '<div class="pu-stok-tabbar">' +
          '<button class="pu-stok-tab" id="stokTabKelola" onclick="gantiTabStok(\'kelola\')"><i class="bi bi-box-seam"></i> Manajemen Stok</button>' +
          '<button class="pu-stok-tab" id="stokTabLaporan" onclick="gantiTabStok(\'laporan\')"><i class="bi bi-graph-up-arrow"></i> Laporan &amp; Analitik</button>' +
        '</div>' +
        '<div id="stokIsi"><div class="empty-state"><div class="spinner-brand" style="margin:0 auto;"></div><p class="mt-3">Memuat data stok...</p></div></div>');
    muatDataStok();
}

async function muatDataStok() {
    const res = await dbRpc('get_laporan_stok', { p_hari: stokHari });
    if (!res.success) {
        // Pesan error disimpan, bukan sekadar ditulis sekali ke layar.
        // Kalau tidak, pindah tab akan menampilkan "belum ada produk" -
        // keliru, karena masalahnya gagal memuat, bukan datanya kosong.
        stokGagal = res.message || 'Tidak diketahui';
        stokData = null;
        gambarIsiStok();
        return;
    }
    stokGagal = '';
    stokData = res.data || { ringkas: {}, items: [] };
    gambarIsiStok();
}

function gambarGagalStok() {
    document.getElementById('stokIsi').innerHTML =
        '<div class="card p-4"><div class="empty-state">' +
        '<i class="bi bi-exclamation-triangle" style="color:#b45309"></i>' +
        'Gagal memuat data stok.' +
        '<div class="text-xs mt-2" style="color:var(--text-muted)">' + escapeHtml(stokGagal) + '</div>' +
        '<button class="btn btn-primary mt-3" onclick="muatDataStok()">' +
        '<i class="bi bi-arrow-clockwise"></i> Coba Lagi</button>' +
        '</div></div>';
}

function gantiTabStok(tab) {
    stokTab = tab;
    gambarIsiStok();
}

function gambarIsiStok() {
    const bKelola = document.getElementById('stokTabKelola');
    const bLaporan = document.getElementById('stokTabLaporan');
    if (bKelola) bKelola.classList.toggle('aktif', stokTab === 'kelola');
    if (bLaporan) bLaporan.classList.toggle('aktif', stokTab === 'laporan');
    if (stokGagal) { gambarGagalStok(); return; }
    if (stokTab === 'kelola') gambarKelolaStok();
    else gambarLaporanStok();
}

// ============================================================
// BAGIAN 1 - MANAJEMEN STOK
// ============================================================

function daftarStokTersaring() {
    const items = (stokData && stokData.items) || [];
    const cari = stokCariTeks.trim().toLowerCase();
    return items.filter(function (it) {
        if (stokSaringan !== 'Semua' && it.status_stok !== stokSaringan) return false;
        if (!cari) return true;
        return (it.nama_produk || '').toLowerCase().indexOf(cari) !== -1 ||
               (it.nama_umkm || '').toLowerCase().indexOf(cari) !== -1;
    });
}

function gambarKelolaStok() {
    const r = (stokData && stokData.ringkas) || {};
    const items = (stokData && stokData.items) || [];

    if (!items.length) {
        document.getElementById('stokIsi').innerHTML =
            '<div class="card p-4"><div class="empty-state"><i class="bi bi-box"></i>' +
            'Belum ada produk yang dikelola stoknya.<br><span class="text-xs">' +
            'Buka menu <b>Kelola Produk</b>, edit produk yang punya persediaan, lalu centang ' +
            '<b>"Ya, produk ini punya persediaan yang perlu dihitung"</b>.</span></div></div>';
        return;
    }

    const kartu = [
        ['Produk Dikelola', r.jumlah_produk || 0, 'bi-box-seam', 'biasa'],
        ['Stok Menipis', r.jumlah_menipis || 0, 'bi-exclamation-triangle', (r.jumlah_menipis ? 'awas' : 'biasa')],
        ['Stok Habis', r.jumlah_habis || 0, 'bi-x-octagon', (r.jumlah_habis ? 'bahaya' : 'biasa')],
        ['Nilai Persediaan', formatRupiah(r.nilai_persediaan || 0), 'bi-cash-stack', 'biasa']
    ].map(function (k) {
        return '<div class="pu-stok-kartu ' + k[3] + '"><div class="pu-stok-kartu-ikon"><i class="bi ' + k[2] + '"></i></div>' +
               '<div><div class="pu-stok-kartu-angka">' + k[1] + '</div>' +
               '<div class="pu-stok-kartu-label">' + k[0] + '</div></div></div>';
    }).join('');

    const saringanChip = ['Semua', 'Menipis', 'Habis', 'Aman'].map(function (s) {
        const n = s === 'Semua' ? items.length : items.filter(function (i) { return i.status_stok === s; }).length;
        return '<button class="pu-stok-chip' + (stokSaringan === s ? ' aktif' : '') +
               '" onclick="setSaringanStok(\'' + s + '\')">' + s + ' (' + n + ')</button>';
    }).join('');

    document.getElementById('stokIsi').innerHTML =
        '<div class="pu-stok-kartu-baris">' + kartu + '</div>' +
        (r.jumlah_habis || r.jumlah_menipis
          ? '<div class="pu-stok-alarm"><i class="bi bi-bell-fill"></i> <span><b>' +
            ((r.jumlah_habis || 0) + (r.jumlah_menipis || 0)) + ' produk</b> perlu diisi ulang' +
            (r.jumlah_habis ? ' — <b>' + r.jumlah_habis + '</b> di antaranya sudah habis dan tidak bisa dipesan customer' : '') +
            '.</span></div>'
          : '') +
        '<div class="card p-4">' +
          '<div class="pu-stok-alat">' +
            '<input class="form-input pu-stok-cari" id="stokCari" placeholder="Cari nama produk atau UMKM..." ' +
              'value="' + escapeAttr(stokCariTeks) + '" oninput="setCariStok(this.value)">' +
            '<div class="flex flex-wrap gap-2">' + saringanChip + '</div>' +
          '</div>' +
          '<div class="table-wrap"><table class="data-table"><thead><tr>' +
            '<th>Produk</th><th>Stok</th><th>Batas Menipis</th><th>Status</th><th>Perkiraan Habis</th><th>Aksi</th>' +
          '</tr></thead><tbody id="stokTbody"></tbody></table></div>' +
        '</div>';
    gambarBarisStok();
}

function setCariStok(v) {
    stokCariTeks = v;
    gambarBarisStok();
}

function setSaringanStok(s) {
    stokSaringan = s;
    gambarKelolaStok();
    // Fokus dikembalikan supaya admin bisa langsung mengetik lagi.
    const c = document.getElementById('stokCari');
    if (c) c.focus();
}

function gambarBarisStok() {
    const tbody = document.getElementById('stokTbody');
    if (!tbody) return;
    const rows = daftarStokTersaring();
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3">Tidak ada produk yang cocok.</td></tr>';
        return;
    }
    tbody.innerHTML = rows.map(function (it) {
        const kelas = it.status_stok === 'Habis' ? 'habis' : (it.status_stok === 'Menipis' ? 'menipis' : 'aman');
        const perkiraan = (it.hari_tersisa === null || it.hari_tersisa === undefined)
            ? '<span class="pu-stok-samar">belum ada penjualan</span>'
            : ('± ' + it.hari_tersisa + ' hari lagi');
        return '<tr>' +
            '<td><div class="font-bold">' + escapeHtml(it.nama_produk) + '</div>' +
              '<div class="text-xs pu-stok-samar">' + escapeHtml(it.nama_umkm || '-') + '</div></td>' +
            '<td><span class="pu-stok-angka ' + kelas + '">' + it.stok + '</span> ' +
              '<span class="text-xs pu-stok-samar">' + escapeHtml(it.satuan || 'pcs') + '</span></td>' +
            '<td>' + it.stok_minimum + '</td>' +
            '<td><span class="pu-stok-tanda ' + kelas + '">' + it.status_stok + '</span></td>' +
            '<td>' + perkiraan + '</td>' +
            '<td><div class="flex gap-2">' +
              '<button class="btn btn-sm btn-primary" onclick="bukaUbahStok(\'' + it.produk_id + '\')">' +
                '<i class="bi bi-pencil-square"></i> Ubah</button>' +
              '<button class="btn btn-sm btn-secondary" onclick="bukaRiwayatStok(\'' + it.produk_id + '\')">' +
                '<i class="bi bi-clock-history"></i> Riwayat</button>' +
            '</div></td>' +
        '</tr>';
    }).join('');
    if (typeof terapkanLabelTabelHp === 'function') terapkanLabelTabelHp();
}

function cariItemStok(id) {
    return ((stokData && stokData.items) || []).filter(function (i) { return i.produk_id === id; })[0] || null;
}

function bukaUbahStok(id) {
    const it = cariItemStok(id);
    if (!it) return;
    document.getElementById('previewModalTitle').textContent = 'Ubah Stok - ' + it.nama_produk;
    document.getElementById('previewModalContent').innerHTML =
        '<form class="text-left" onsubmit="simpanUbahStok(event, \'' + id + '\')">' +
          '<div class="pu-stok-kini">Stok tercatat sekarang: <b>' + it.stok + ' ' +
            escapeHtml(it.satuan || 'pcs') + '</b></div>' +
          '<div class="form-group"><label class="form-label">Jumlah Stok Baru *</label>' +
            '<input class="form-input" type="number" min="0" id="usJumlah" required value="' + it.stok + '"></div>' +
          '<div class="form-group"><label class="form-label">Catatan (opsional)</label>' +
            '<input class="form-input" id="usCatatan" maxlength="300" placeholder="mis. Kulakan 20 pcs, atau koreksi hasil stok opname"></div>' +
          '<p class="pf-foto-info">Perubahan ini dicatat di riwayat stok lengkap dengan selisihnya, ' +
            'jadi selalu bisa ditelusuri siapa mengubah apa dan kapan.</p>' +
          '<div class="flex gap-2 mt-3"><button type="submit" class="btn btn-primary">Simpan</button>' +
          '<button type="button" class="btn btn-secondary" onclick="closeModal(\'previewModal\')">Batal</button></div>' +
        '</form>';
    openModal('previewModal');
}

async function simpanUbahStok(e, id) {
    e.preventDefault();
    const jumlah = Number(document.getElementById('usJumlah').value);
    const catatan = document.getElementById('usCatatan').value.trim();
    if (!(jumlah >= 0)) {
        showToast('Peringatan', 'Jumlah stok tidak boleh kosong atau minus.', 'warning');
        return;
    }
    const btn = e.target.querySelector('button[type="submit"]');
    const asli = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-inline"></span> Menyimpan...';

    const res = await dbRpc('set_stok', { p_produk_id: id, p_stok_baru: jumlah, p_catatan: catatan });
    btn.disabled = false;
    btn.innerHTML = asli;
    if (!res.success) {
        showToast('Error', 'Gagal menyimpan stok: ' + res.message, 'danger');
        return;
    }
    closeModal('previewModal');
    showToast('Berhasil', 'Stok diperbarui.', 'success');
    await muatDataStok();
}

async function bukaRiwayatStok(id) {
    const it = cariItemStok(id);
    document.getElementById('previewModalTitle').textContent =
        'Riwayat Stok - ' + (it ? it.nama_produk : '');
    document.getElementById('previewModalContent').innerHTML =
        '<div class="empty-state"><div class="spinner-brand" style="margin:0 auto;"></div><p class="mt-3">Memuat riwayat...</p></div>';
    openModal('previewModal');

    const res = await dbRpc('get_riwayat_stok', { p_produk_id: id, p_batas: 50 });
    const isi = document.getElementById('previewModalContent');
    if (!isi) return;
    if (!res.success) {
        isi.innerHTML = '<div class="empty-state"><i class="bi bi-exclamation-circle"></i>Gagal memuat riwayat.</div>';
        return;
    }
    const baris = res.data || [];
    if (!baris.length) {
        isi.innerHTML = '<div class="empty-state"><i class="bi bi-clock-history"></i>Belum ada perubahan stok untuk produk ini.</div>';
        return;
    }
    isi.innerHTML = '<div class="table-wrap" style="max-height:60vh; overflow-y:auto;">' +
        '<table class="data-table"><thead><tr><th>Waktu</th><th>Perubahan</th><th>Sisa</th><th>Sebab</th><th>Keterangan</th></tr></thead><tbody>' +
        baris.map(function (m) {
            const naik = m.perubahan > 0;
            const ket = m.nomor_pesanan ? m.nomor_pesanan : (m.catatan || '-');
            return '<tr><td>' + formatTanggalJam(m.created_at) + '</td>' +
                '<td><span class="pu-stok-delta ' + (naik ? 'naik' : 'turun') + '">' +
                  (naik ? '+' : '') + m.perubahan + '</span></td>' +
                '<td>' + m.stok_sesudah + '</td>' +
                '<td>' + escapeHtml(m.sebab) + '</td>' +
                '<td class="text-xs">' + escapeHtml(ket) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
}

/** Tanggal + jam ringkas untuk tabel riwayat. */
function formatTanggalJam(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    const p = function (n) { return String(n).padStart(2, '0'); };
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() +
           ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

// ============================================================
// BAGIAN 2 - LAPORAN & ANALITIK
// ============================================================

function gambarLaporanStok() {
    const r = (stokData && stokData.ringkas) || {};
    const items = (stokData && stokData.items) || [];

    if (!items.length) {
        document.getElementById('stokIsi').innerHTML =
            '<div class="card p-4"><div class="empty-state"><i class="bi bi-graph-up"></i>' +
            'Belum ada produk ber-stok untuk dianalisa.</div></div>';
        return;
    }

    const opsiRentang = STOK_RENTANG.map(function (o) {
        return '<option value="' + o.hari + '"' + (stokHari === o.hari ? ' selected' : '') + '>' + o.label + '</option>';
    }).join('');

    const kartu = [
        ['Cepat Laku', r.jumlah_cepat || 0, 'bi-lightning-charge-fill', 'cepat'],
        ['Lambat', r.jumlah_lambat || 0, 'bi-hourglass-split', 'lambat'],
        ['Tidak Bergerak', r.jumlah_diam || 0, 'bi-pause-circle', 'diam'],
        ['Total Terjual', (r.total_terjual || 0), 'bi-bag-check', 'biasa']
    ].map(function (k) {
        return '<div class="pu-stok-kartu ' + k[3] + '"><div class="pu-stok-kartu-ikon"><i class="bi ' + k[2] + '"></i></div>' +
               '<div><div class="pu-stok-kartu-angka">' + k[1] + '</div>' +
               '<div class="pu-stok-kartu-label">' + k[0] + '</div></div></div>';
    }).join('');

    document.getElementById('stokIsi').innerHTML =
        '<div class="pu-stok-alat">' +
          '<label class="pu-stok-label">Hitung penjualan dalam:</label>' +
          '<select class="form-select pu-stok-rentang" onchange="setRentangStok(this.value)">' + opsiRentang + '</select>' +
        '</div>' +
        '<div class="pu-stok-kartu-baris">' + kartu + '</div>' +
        '<div class="pu-stok-catatan"><i class="bi bi-info-circle"></i> ' +
          'Rata-rata penjualan produk yang laku dalam ' + (r.hari || stokHari) + ' hari terakhir adalah <b>' +
          (r.rata_terjual || 0) + '</b>. Produk yang terjual <b>sama atau lebih</b> dari angka itu disebut ' +
          '<b>Cepat Laku</b>, yang di bawahnya <b>Lambat</b>, dan yang sama sekali belum terjual ' +
          '<b>Tidak Bergerak</b>. Hanya pesanan berstatus <b>Dikonfirmasi</b> yang dihitung.' +
        '</div>' +
        '<div class="pu-stok-chart-baris">' +
          '<div class="card p-4"><h3 class="font-bold mb-3" style="color:var(--text-primary)">' +
            '<i class="bi bi-bar-chart"></i> 10 Barang Paling Laku</h3>' +
            '<canvas id="chartStokTerjual" height="260"></canvas></div>' +
          '<div class="card p-4"><h3 class="font-bold mb-3" style="color:var(--text-primary)">' +
            '<i class="bi bi-pie-chart"></i> Sebaran Pergerakan</h3>' +
            '<canvas id="chartStokGerak" height="260"></canvas></div>' +
        '</div>' +
        '<div class="card p-4">' +
          '<h3 class="font-bold mb-3" style="color:var(--text-primary)"><i class="bi bi-table"></i> Rincian per Produk</h3>' +
          '<div class="table-wrap"><table class="data-table"><thead><tr>' +
            '<th>Produk</th><th>Terjual</th><th>Nilai Penjualan</th><th>Laju/Hari</th>' +
            '<th>Sisa Stok</th><th>Terakhir Laku</th><th>Pergerakan</th>' +
          '</tr></thead><tbody>' + barisLaporanStok(items) + '</tbody></table></div>' +
        '</div>';

    gambarChartStok(items, r);
    if (typeof terapkanLabelTabelHp === 'function') terapkanLabelTabelHp();
}

function barisLaporanStok(items) {
    return items.map(function (it) {
        const kelasGerak = it.status_gerak === 'Cepat' ? 'cepat'
                         : (it.status_gerak === 'Lambat' ? 'lambat' : 'diam');
        const terakhir = (it.hari_sejak_terjual === null || it.hari_sejak_terjual === undefined)
            ? '<span class="pu-stok-samar">belum pernah</span>'
            : (it.hari_sejak_terjual === 0 ? 'hari ini' : (it.hari_sejak_terjual + ' hari lalu'));
        const kelasStok = it.status_stok === 'Habis' ? 'habis' : (it.status_stok === 'Menipis' ? 'menipis' : 'aman');
        return '<tr>' +
            '<td><div class="font-bold">' + escapeHtml(it.nama_produk) + '</div>' +
              '<div class="text-xs pu-stok-samar">' + escapeHtml(it.nama_umkm || '-') + '</div></td>' +
            '<td><b>' + it.terjual + '</b> ' + escapeHtml(it.satuan || 'pcs') + '</td>' +
            '<td>' + formatRupiah(it.nilai_terjual || 0) + '</td>' +
            '<td>' + it.laju_harian + '</td>' +
            '<td><span class="pu-stok-angka ' + kelasStok + '">' + it.stok + '</span></td>' +
            '<td>' + terakhir + '</td>' +
            '<td><span class="pu-stok-gerak ' + kelasGerak + '">' + it.status_gerak + '</span></td>' +
        '</tr>';
    }).join('');
}

function setRentangStok(v) {
    stokHari = Number(v) || 30;
    muatDataStok();
}

function gambarChartStok(items, ringkas) {
    if (typeof Chart === 'undefined') return;

    // --- Batang: 10 barang paling laku ---
    const top = items.slice().sort(function (a, b) { return b.terjual - a.terjual; }).slice(0, 10);
    const ctxB = document.getElementById('chartStokTerjual');
    if (ctxB) {
        if (chartStokTerjual) chartStokTerjual.destroy();
        chartStokTerjual = new Chart(ctxB, {
            type: 'bar',
            data: {
                labels: top.map(function (t) { return potongLabel(t.nama_produk, 22); }),
                datasets: [{
                    label: 'Terjual',
                    data: top.map(function (t) { return t.terjual; }),
                    // Warna mengikuti status pergerakan, bukan sekadar hiasan -
                    // jadi batang panjang yang "Lambat" tetap terbaca sebagai lambat.
                    backgroundColor: top.map(function (t) { return warnaGerak(t.status_gerak); }),
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
            }
        });
    }

    // --- Donat: sebaran pergerakan ---
    const ctxD = document.getElementById('chartStokGerak');
    if (ctxD) {
        if (chartStokGerak) chartStokGerak.destroy();
        chartStokGerak = new Chart(ctxD, {
            type: 'doughnut',
            data: {
                labels: ['Cepat Laku', 'Lambat', 'Tidak Bergerak'],
                datasets: [{
                    data: [ringkas.jumlah_cepat || 0, ringkas.jumlah_lambat || 0, ringkas.jumlah_diam || 0],
                    backgroundColor: [warnaGerak('Cepat'), warnaGerak('Lambat'), warnaGerak('Tidak Bergerak')],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
    }
}

function warnaGerak(status) {
    if (status === 'Cepat') return '#15803d';
    if (status === 'Lambat') return '#d97706';
    return '#9ca3af';
}

function potongLabel(teks, maks) {
    const t = String(teks || '');
    return t.length > maks ? (t.slice(0, maks - 1) + '…') : t;
}
