/**
 * ============================================================
 * PortoUMKM - Laporan Keuangan
 * ============================================================
 *
 * Datanya diambil dari pesanan yang sudah DIKONFIRMASI di Monitoring
 * Pesanan - sama seperti hitungan stok dan "Produk Sering Dipesan", supaya
 * angka antar halaman tidak saling bertentangan. Pesanan yang masih
 * Menunggu belum tentu jadi, jadi tidak ikut dihitung.
 *
 * Seluruh angka datang dari satu panggilan get_laporan_keuangan(hari, tahun);
 * halaman ini tidak menghitung ulang apa pun sendiri, supaya tidak ada
 * kemungkinan layar dan ekspor menampilkan angka berbeda.
 *
 * Ada dua cara memilih periode, dan keduanya memang dibutuhkan:
 *  - rentang berjalan (7/30/90/365 hari) untuk memantau keadaan terkini;
 *  - tahun kalender untuk pelaporan ke stakeholder, karena rentang berjalan
 *    ikut bergeser tiap hari dan di pertengahan Januari akan mencampur dua
 *    tahun sekaligus.
 */

let keuData = null;
let keuHari = 30;
// Kalau diisi, yang dipakai adalah satu TAHUN KALENDER penuh dan keuHari
// diabaikan. Rentang bergulir ("90 hari terakhir") ikut bergeser tiap hari,
// jadi tidak cocok untuk laporan tahunan ke stakeholder: pada pertengahan
// Januari 2027 ia akan mencampur 2027 dengan hampir seluruh 2026.
let keuTahun = null;
let keuGagal = '';
let chartKeuTren = null;
let chartKeuJalur = null;

const KEU_RENTANG = [
    { hari: 7,   label: '7 hari terakhir' },
    { hari: 30,  label: '30 hari terakhir' },
    { hari: 90,  label: '90 hari terakhir' },
    { hari: 365, label: '1 tahun terakhir' }
];

// Pustaka pembuat berkas Excel, dimuat hanya saat tombolnya ditekan -
// pola yang sama dengan jsPDF pada invoice RFQ, supaya halaman tidak jadi
// berat untuk admin yang tidak pernah mengekspor.
const SHEETJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
let sheetJsPromise = null;

function muatSheetJs() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (sheetJsPromise) return sheetJsPromise;
    sheetJsPromise = new Promise(function (resolve, reject) {
        const s = document.createElement('script');
        s.src = SHEETJS_URL;
        s.onload = function () {
            if (window.XLSX) resolve(window.XLSX);
            else reject(new Error('Pustaka Excel gagal dimuat.'));
        };
        s.onerror = function () { reject(new Error('Pustaka Excel tidak bisa diunduh. Periksa koneksi.')); };
        document.head.appendChild(s);
    });
    return sheetJsPromise;
}

// ============================================================
// HALAMAN
// ============================================================

function renderAdminKeuanganPage() {
    const container = document.getElementById('app-container');
    container.innerHTML = adminPageShell('Laporan Keuangan',
        '<div class="pu-keu-alat">' +
          '<label class="pu-stok-label">Rentang laporan:</label>' +
          '<select class="form-select pu-stok-rentang" id="keuRentang" ' +
            'onchange="setRentangKeuangan(this.value)">' + opsiRentangKeu() + '</select>' +
          '<div class="pu-keu-tombol">' +
            '<button class="btn btn-secondary" id="btnKeuExcel" onclick="unduhKeuanganExcel()">' +
              '<i class="bi bi-file-earmark-spreadsheet"></i> Unduh Excel</button>' +
            '<button class="btn btn-secondary" id="btnKeuPdf" onclick="unduhKeuanganPdf()">' +
              '<i class="bi bi-file-earmark-pdf"></i> Unduh PDF</button>' +
          '</div>' +
        '</div>' +
        '<div id="keuIsi"><div class="empty-state"><div class="spinner-brand" style="margin:0 auto;"></div>' +
        '<p class="mt-3">Memuat laporan...</p></div></div>');
    muatDataKeuangan();
}

async function muatDataKeuangan() {
    const res = await dbRpc('get_laporan_keuangan',
        { p_hari: keuHari, p_tahun: keuTahun });
    if (!res.success) {
        keuGagal = res.message || 'Tidak diketahui';
        keuData = null;
        gambarGagalKeuangan();
        return;
    }
    keuGagal = '';
    keuData = res.data || null;
    segarkanPilihanRentangKeu();
    gambarLaporanKeuangan();
}

function gambarGagalKeuangan() {
    const el = document.getElementById('keuIsi');
    if (!el) return;
    el.innerHTML = '<div class="card p-4"><div class="empty-state">' +
        '<i class="bi bi-exclamation-triangle" style="color:#b45309"></i>Gagal memuat laporan keuangan.' +
        '<div class="text-xs mt-2" style="color:var(--text-muted)">' + escapeHtml(keuGagal) + '</div>' +
        '<button class="btn btn-primary mt-3" onclick="muatDataKeuangan()">' +
        '<i class="bi bi-arrow-clockwise"></i> Coba Lagi</button></div></div>';
}

function setRentangKeuangan(v) {
    const t = String(v === null || v === undefined ? '' : v);
    if (t.indexOf('th:') === 0) {
        keuTahun = Number(t.slice(3)) || null;
    } else {
        keuTahun = null;
        keuHari = Number(t) || 30;
    }
    muatDataKeuangan();
}

function gambarLaporanKeuangan() {
    const el = document.getElementById('keuIsi');
    if (!el) return;
    const d = keuData || {};
    const r = d.ringkas || {};

    if (!r.jumlah_transaksi) {
        el.innerHTML = '<div class="card p-4"><div class="empty-state"><i class="bi bi-graph-up"></i>' +
            'Belum ada pesanan terkonfirmasi pada <b>' + escapeHtml(labelRentangKeu()) + '</b>.<br>' +
            '<span class="text-xs">Laporan hanya menghitung pesanan yang sudah <b>Dikonfirmasi</b> ' +
            'di menu Konfirmasi Pesanan.</span></div></div>';
        return;
    }

    const kartu = [
        ['Omzet Terkonfirmasi', formatRupiah(r.omzet || 0), 'bi-cash-stack', 'biasa'],
        ['Sudah Dibayar', formatRupiah(r.sudah_bayar || 0), 'bi-check2-circle', 'cepat'],
        ['Belum Dibayar', formatRupiah(r.belum_bayar || 0), 'bi-hourglass-split', (r.belum_bayar ? 'lambat' : 'biasa')],
        ['Jumlah Transaksi', (r.jumlah_transaksi || 0) + ' pesanan', 'bi-receipt', 'biasa']
    ].map(function (k) {
        return '<div class="pu-stok-kartu ' + k[3] + '"><div class="pu-stok-kartu-ikon"><i class="bi ' + k[2] + '"></i></div>' +
               '<div><div class="pu-keu-angka">' + k[1] + '</div>' +
               '<div class="pu-stok-kartu-label">' + k[0] + '</div></div></div>';
    }).join('');

    el.innerHTML =
        '<div class="pu-stok-kartu-baris">' + kartu + '</div>' +
        '<div class="pu-stok-catatan"><i class="bi bi-info-circle"></i> ' +
          'Periode <b>' + escapeHtml(d.mulai || '') + '</b> sampai <b>' + escapeHtml(d.sampai || '') + '</b>. ' +
          'Yang dihitung <b>hanya pesanan berstatus Dikonfirmasi</b> — pesanan yang masih menunggu konfirmasi ' +
          'tidak ikut. Rata-rata nilai transaksi <b>' + formatRupiah(r.rata_transaksi || 0) + '</b>, ' +
          'dengan <b>' + (r.transaksi_lunas || 0) + '</b> dari <b>' + (r.jumlah_transaksi || 0) + '</b> pesanan sudah lunas.' +
        '</div>' +
        catatanSelisihKeuangan(r, d) +
        '<div class="pu-stok-chart-baris">' +
          '<div class="card p-4"><h3 class="font-bold mb-3" style="color:var(--text-primary)">' +
            '<i class="bi bi-graph-up-arrow"></i> Tren Penjualan</h3>' +
            '<canvas id="chartKeuTren" height="250"></canvas></div>' +
          '<div class="card p-4"><h3 class="font-bold mb-3" style="color:var(--text-primary)">' +
            '<i class="bi bi-pie-chart"></i> Ritel vs Grosir</h3>' +
            '<canvas id="chartKeuJalur" height="250"></canvas></div>' +
        '</div>' +
        tabelKeuangan('Rekap per UMKM', 'bi-shop',
            ['UMKM', 'Transaksi', 'Unit', 'Nilai'],
            (d.per_umkm || []).map(function (x) {
                return [escapeHtml(x.nama), x.transaksi, x.unit, formatRupiah(x.nilai)];
            })) +
        tabelKeuangan('Produk Terlaris (menurut nilai)', 'bi-box-seam',
            ['Produk', 'UMKM', 'Transaksi', 'Unit', 'Nilai'],
            (d.per_produk || []).map(function (x) {
                return [escapeHtml(x.nama), escapeHtml(x.umkm), x.transaksi, x.unit, formatRupiah(x.nilai)];
            })) +
        tabelKeuangan('Rekap per Kategori', 'bi-tags',
            ['Kategori', 'Unit', 'Nilai'],
            (d.per_kategori || []).map(function (x) {
                return [escapeHtml(x.nama), x.unit, formatRupiah(x.nilai)];
            })) +
        tabelKeuangan('Ritel vs Grosir', 'bi-diagram-3',
            ['Jalur', 'Transaksi', 'Nilai', 'Rata-rata'],
            (d.per_jalur || []).map(function (x) {
                return [escapeHtml(x.jalur), x.transaksi, formatRupiah(x.nilai), formatRupiah(x.rata)];
            })) +
        // Tabel ini sengaja ditaruh paling bawah: isinya bukan hasil penjualan,
        // melainkan daftar data yang perlu dibetulkan supaya laporan berikutnya
        // benar. Kalau tidak ada yang bermasalah, tabelnya tidak muncul.
        tabelKeuangan('Perlu Dibetulkan — terjual tapi harga tercatat Rp 0', 'bi-wrench-adjustable',
            ['Produk', 'UMKM', 'Transaksi', 'Unit'],
            (d.tanpa_harga || []).map(function (x) {
                return [escapeHtml(x.nama), escapeHtml(x.umkm), x.transaksi, x.unit];
            }));

    gambarChartKeuangan(d);
    if (typeof terapkanLabelTabelHp === 'function') terapkanLabelTabelHp();
}

/**
 * Jumlah tabel rekap bisa tidak sama persis dengan omzet. Versi pertama
 * catatan ini langsung menyimpulkan penyebabnya "total pesanan pernah
 * dikoreksi manual" - padahal itu cuma salah satu dari tiga kemungkinan,
 * dan menyebut sebab yang salah lebih buruk daripada tidak menyebut sama
 * sekali. Sekarang penyebab yang benar-benar terdeteksi disebut satu per
 * satu, dan sisanya baru disebut sebagai koreksi manual.
 */
function catatanSelisihKeuangan(r, d) {
    const kotak = [];
    const dd = d || {};
    const nol = dd.tanpa_harga || [];
    const kosong = dd.pesanan_tanpa_item || {};

    // 1) Barang terjual yang harganya tercatat nol - ini yang membuat sebuah
    //    UMKM tampil "35 unit, Rp 0" dan tampak seperti laporan salah hitung.
    if (nol.length) {
        const unit = nol.reduce(function (a, x) { return a + (Number(x.unit) || 0); }, 0);
        kotak.push('<div class="pu-stok-alarm"><i class="bi bi-exclamation-triangle-fill"></i> <span>' +
            '<b>' + unit + ' unit</b> dari <b>' + nol.length + ' produk</b> terjual dengan harga tercatat ' +
            '<b>Rp 0</b>, jadi menambah jumlah unit tapi tidak menambah nilai. ' +
            'Biasanya karena produknya belum diisi harga di Manajemen Produk saat pesanan dibuat. ' +
            'Daftarnya ada di tabel <b>Perlu Dibetulkan</b> di bawah. ' +
            'Perbaiki harga produknya supaya pesanan berikutnya tercatat benar — ' +
            'pesanan yang sudah terlanjur tersimpan tidak ikut berubah.' +
            '</span></div>');
    }

    // 2) Pesanan dikonfirmasi yang tidak punya baris produk sama sekali.
    if (Number(kosong.jumlah) > 0) {
        kotak.push('<div class="pu-stok-alarm"><i class="bi bi-exclamation-triangle-fill"></i> <span>' +
            '<b>' + kosong.jumlah + ' pesanan</b> senilai <b>' + formatRupiah(kosong.nilai || 0) + '</b> ' +
            'tidak punya rincian produk, jadi ikut dihitung di omzet tapi tidak bisa muncul di tabel ' +
            'rekap mana pun — nama UMKM dan produknya hanya ada di rincian itu.' +
            '</span></div>');
    }

    // 3) Sisa selisih yang tidak terjelaskan oleh dua hal di atas.
    const s = Number(r.selisih_rekap) || 0;
    const terjelaskan = Number(kosong.nilai) || 0;
    const sisa = s - terjelaskan;
    if (Math.abs(sisa) >= 1) {
        kotak.push('<div class="pu-stok-catatan"><i class="bi bi-info-circle"></i> ' +
            'Jumlah tabel rekap (<b>' + formatRupiah(r.nilai_rekap || 0) + '</b>) berbeda ' +
            formatRupiah(Math.abs(sisa)) + ' dari omzet (<b>' + formatRupiah(r.omzet || 0) + '</b>) ' +
            'di luar dua hal di atas. Penyebab yang paling mungkin: ada total pesanan yang pernah ' +
            'dikoreksi manual di Monitoring Pesanan. Omzet memakai total pesanan yang disepakati, ' +
            'sedangkan tabel rekap dihitung dari baris produknya.' +
            '</div>');
    }
    return kotak.join('');
}

function tabelKeuangan(judul, ikon, kepala, baris) {
    if (!baris.length) return '';
    return '<div class="card p-4 mb-4">' +
        '<h3 class="font-bold mb-3" style="color:var(--text-primary)"><i class="bi ' + ikon + '"></i> ' + judul + '</h3>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        kepala.map(function (h) { return '<th>' + h + '</th>'; }).join('') +
        '</tr></thead><tbody>' +
        baris.map(function (b) {
            return '<tr>' + b.map(function (c, i) {
                return '<td' + (i === 0 ? ' class="font-semibold"' : '') + '>' + c + '</td>';
            }).join('') + '</tr>';
        }).join('') +
        '</tbody></table></div></div>';
}

function gambarChartKeuangan(d) {
    if (typeof Chart === 'undefined') return;

    const tren = d.tren || [];
    const ctxT = document.getElementById('chartKeuTren');
    if (ctxT) {
        if (chartKeuTren) chartKeuTren.destroy();
        chartKeuTren = new Chart(ctxT, {
            type: 'line',
            data: {
                labels: tren.map(function (t) { return t.label; }),
                datasets: [{
                    label: 'Nilai penjualan',
                    data: tren.map(function (t) { return t.nilai; }),
                    borderColor: '#8c2f3a',
                    backgroundColor: 'rgba(140,47,58,0.10)',
                    fill: true, tension: 0.3, pointRadius: tren.length > 40 ? 0 : 3
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    const jalur = d.per_jalur || [];
    const ctxJ = document.getElementById('chartKeuJalur');
    if (ctxJ) {
        if (chartKeuJalur) chartKeuJalur.destroy();
        chartKeuJalur = new Chart(ctxJ, {
            type: 'doughnut',
            data: {
                labels: jalur.map(function (x) { return x.jalur; }),
                datasets: [{
                    data: jalur.map(function (x) { return x.nilai; }),
                    backgroundColor: jalur.map(function (x) {
                        return x.jalur === 'B2B Grosir' ? '#1d4ed8' : '#8c2f3a';
                    }),
                    borderWidth: 0
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
    }
}

// ============================================================
// EKSPOR - FORMAT BAKU
// ============================================================
/**
 * Susunan berkas ekspor sengaja TETAP: judul, periode, ringkasan, lalu
 * empat tabel dengan urutan kolom yang selalu sama. Jadi sekali klik
 * langsung jadi, dan berkas bulan ini bisa ditumpuk/dibandingkan dengan
 * berkas bulan lalu tanpa dirapikan ulang.
 */
function labelRentangKeu() {
    if (keuTahun) return 'Tahun ' + keuTahun;
    const o = KEU_RENTANG.filter(function (x) { return x.hari === keuHari; })[0];
    return o ? o.label : (keuHari + ' hari terakhir');
}

/** Nilai pilihan yang sedang aktif, dalam bentuk yang dipakai <select>. */
function nilaiRentangKeu() {
    return keuTahun ? ('th:' + keuTahun) : String(keuHari);
}

/** Isi pilihan rentang: rentang bergulir + tahun kalender yang ADA datanya.
 *  Daftar tahunnya datang dari database, jadi tidak perlu disentuh lagi
 *  setiap kali ganti tahun. */
function opsiRentangKeu() {
    let html = '<optgroup label="Rentang berjalan">' +
        KEU_RENTANG.map(function (o) {
            return '<option value="' + o.hari + '"' +
                   (!keuTahun && keuHari === o.hari ? ' selected' : '') + '>' + o.label + '</option>';
        }).join('') + '</optgroup>';
    const tahun = ((keuData || {}).tahun_tersedia) || [];
    // Tahun yang sedang dipilih tetap ditampilkan walau datanya kosong,
    // kalau tidak pilihannya akan melompat sendiri dan membingungkan.
    const daftar = tahun.slice();
    if (keuTahun && daftar.indexOf(keuTahun) === -1) daftar.unshift(keuTahun);
    if (daftar.length) {
        html += '<optgroup label="Tahun kalender">' + daftar.map(function (t) {
            return '<option value="th:' + t + '"' +
                   (keuTahun === Number(t) ? ' selected' : '') + '>Tahun ' + t + '</option>';
        }).join('') + '</optgroup>';
    }
    return html;
}

/** Perbarui isi <select> setelah data dimuat, karena daftar tahunnya baru
 *  diketahui dari jawaban database. */
function segarkanPilihanRentangKeu() {
    const sel = document.getElementById('keuRentang');
    if (!sel) return;
    sel.innerHTML = opsiRentangKeu();
    sel.value = nilaiRentangKeu();
}

function namaBerkasKeu(ext) {
    const d = keuData || {};
    return 'Laporan-Keuangan_' + (d.mulai || '') + '_sd_' + (d.sampai || '') + '.' + ext;
}

/** Baris-baris ringkasan; dipakai Excel maupun PDF supaya keduanya sama. */
function barisRingkasKeu() {
    const r = (keuData || {}).ringkas || {};
    return [
        ['Omzet terkonfirmasi', Number(r.omzet) || 0],
        ['Sudah dibayar', Number(r.sudah_bayar) || 0],
        ['Belum dibayar', Number(r.belum_bayar) || 0],
        ['Jumlah transaksi', Number(r.jumlah_transaksi) || 0],
        ['Transaksi lunas', Number(r.transaksi_lunas) || 0],
        ['Rata-rata nilai transaksi', Number(r.rata_transaksi) || 0],
        ['Unit terjual', Number(r.unit_terjual) || 0]
    ];
}

async function unduhKeuanganExcel() {
    if (!keuData) { showToast('Belum siap', 'Laporan belum selesai dimuat.', 'warning'); return; }
    const btn = document.getElementById('btnKeuExcel');
    const asli = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-inline"></span> Menyiapkan...'; }
    try {
        const XLSX = await muatSheetJs();
        const d = keuData;
        const wb = XLSX.utils.book_new();
        const RP = '"Rp"#,##0;[Red]-"Rp"#,##0';   // format angka rupiah
        const BIL = '#,##0';                       // ribuan untuk cacah/unit

        /** Rapikan satu lembar: lebar kolom, format angka, dan saringan kolom.
         *  CATATAN JUJUR: SheetJS versi gratis TIDAK bisa menulis huruf tebal
         *  atau warna latar ke dalam berkas xlsx - itu hanya ada di versi
         *  berbayar. Jadi yang bisa dirapikan di sini adalah lebar kolom,
         *  format angka, baris judul, saringan, dan baris TOTAL. */
        const rapikan = function (ws, lebar, format, barisKepala, jumlahBaris) {
            ws['!cols'] = lebar.map(function (w) { return { wch: w }; });
            const R = XLSX.utils.decode_range(ws['!ref']);
            for (let c = 0; c < format.length; c++) {
                if (!format[c]) continue;
                for (let r = barisKepala + 1; r <= R.e.r; r++) {
                    const sel = ws[XLSX.utils.encode_cell({ r: r, c: c })];
                    if (sel && sel.t === 'n') sel.z = format[c];
                }
            }
            // Saringan hanya dipasang kalau benar-benar ada isinya; memasang
            // saringan pada tabel kosong membuat Excel mengeluh saat dibuka.
            if (jumlahBaris > 0) {
                ws['!autofilter'] = { ref: XLSX.utils.encode_range(
                    { s: { r: barisKepala, c: 0 }, e: { r: R.e.r, c: R.e.c } }) };
            }
            return ws;
        };

        // Sama seperti PDF: baris TOTAL memakai angka dari database, bukan
        // hasil menjumlah ulang di sini.
        const rk = d.ringkas || {};
        const TNILAI = Number(rk.nilai_rekap) || 0;
        const TUNIT = Number(rk.unit_terjual) || 0;
        const TOMZET = Number(rk.omzet) || 0;
        const TTRANS = Number(rk.jumlah_transaksi) || 0;
        const jum = function (arr, k) {
            return arr.reduce(function (a, x) { return a + (Number(x[k]) || 0); }, 0);
        };

        // ---------- Lembar 1: Ringkasan ----------
        const namaApp = (AppState.config && AppState.config.appName) || 'PortoUMKM';
        const lembaga = (typeof namaLembaga === 'function') ? namaLembaga() : '';
        const ring = [
            ['LAPORAN KEUANGAN - ' + namaApp + (lembaga ? ' (' + lembaga + ')' : '')],
            ['Rentang', labelRentangKeu()],
            ['Periode', (d.mulai || '') + ' s/d ' + (d.sampai || '')],
            ['Dasar perhitungan', 'Hanya pesanan berstatus Dikonfirmasi'],
            [],
            ['Keterangan', 'Nilai']
        ].concat(barisRingkasKeu());

        // Catatan kelengkapan data ikut ditulis, supaya orang yang hanya
        // menerima berkas Excel-nya tetap tahu kenapa angkanya bisa berselisih.
        const nol = d.tanpa_harga || [];
        const kosong = d.pesanan_tanpa_item || {};
        if (nol.length || Number(kosong.jumlah) > 0) {
            ring.push([], ['Perlu diperiksa']);
            if (nol.length) ring.push(['Unit terjual berharga Rp 0', jum(nol, 'unit'),
                'dari ' + nol.length + ' produk - lihat lembar "Perlu Dibetulkan"']);
            if (Number(kosong.jumlah) > 0) ring.push(['Pesanan tanpa rincian produk',
                Number(kosong.jumlah), 'senilai ' + formatRupiah(kosong.nilai || 0) +
                ' - ikut di omzet, tidak bisa masuk rekap']);
        }
        const wsR = XLSX.utils.aoa_to_sheet(ring);
        wsR['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 58 }];
        // Baris Ringkasan: empat yang pertama nilai rupiah, sisanya cacah.
        [['B7', RP], ['B8', RP], ['B9', RP], ['B10', BIL], ['B11', BIL], ['B12', RP], ['B13', BIL]]
            .forEach(function (x) { if (wsR[x[0]] && wsR[x[0]].t === 'n') wsR[x[0]].z = x[1]; });
        XLSX.utils.book_append_sheet(wb, wsR, 'Ringkasan');

        // ---------- Lembar rekap ----------
        const lembar = function (nama, kepala, rows, lebar, format, totalRow) {
            const isi = [kepala].concat(rows);
            if (totalRow && rows.length) isi.push(totalRow);
            const ws = XLSX.utils.aoa_to_sheet(isi);
            XLSX.utils.book_append_sheet(wb, rapikan(ws, lebar, format, 0, rows.length), nama);
        };

        const umkm = d.per_umkm || [];
        lembar('Per UMKM', ['UMKM', 'Transaksi', 'Unit', 'Nilai'],
            umkm.map(function (x) { return [x.nama, Number(x.transaksi), Number(x.unit), Number(x.nilai)]; }),
            [34, 12, 12, 18], [null, BIL, BIL, RP],
            // Kolom Transaksi sengaja dikosongkan di baris TOTAL: isinya cacah
            // pesanan unik per UMKM, jadi menjumlahkannya akan melebihi jumlah
            // transaksi yang sebenarnya.
            ['TOTAL', null, TUNIT, TNILAI]);

        const prod = d.per_produk || [];
        lembar('Per Produk', ['Produk', 'UMKM', 'Transaksi', 'Unit', 'Nilai'],
            prod.map(function (x) { return [x.nama, x.umkm, Number(x.transaksi), Number(x.unit), Number(x.nilai)]; }),
            [40, 28, 12, 12, 18], [null, null, BIL, BIL, RP],
            ['TOTAL', null, null, TUNIT, TNILAI]);

        const kat = d.per_kategori || [];
        lembar('Per Kategori', ['Kategori', 'Unit', 'Nilai'],
            kat.map(function (x) { return [x.nama, Number(x.unit), Number(x.nilai)]; }),
            [28, 14, 18], [null, BIL, RP],
            ['TOTAL', TUNIT, TNILAI]);

        const jalur = d.per_jalur || [];
        lembar('Ritel vs Grosir', ['Jalur', 'Transaksi', 'Nilai', 'Rata-rata'],
            jalur.map(function (x) { return [x.jalur, Number(x.transaksi), Number(x.nilai), Number(x.rata)]; }),
            [20, 12, 18, 18], [null, BIL, RP, RP],
            ['TOTAL', TTRANS, TOMZET, null]);

        const tren = d.tren || [];
        lembar('Tren', ['Periode', 'Tanggal', 'Jumlah Pesanan', 'Nilai'],
            tren.map(function (x) { return [x.label, x.tanggal, Number(x.jumlah), Number(x.nilai)]; }),
            [16, 14, 16, 18], [null, null, BIL, RP],
            ['TOTAL', null, TTRANS, TOMZET]);

        if (nol.length) {
            lembar('Perlu Dibetulkan', ['Produk', 'UMKM', 'Transaksi', 'Unit'],
                nol.map(function (x) { return [x.nama, x.umkm, Number(x.transaksi), Number(x.unit)]; }),
                [40, 28, 12, 12], [null, null, BIL, BIL],
                ['TOTAL', null, null, jum(nol, 'unit')]);
        }

        XLSX.writeFile(wb, namaBerkasKeu('xlsx'));
        showToast('Berhasil', 'Berkas Excel diunduh.', 'success');
    } catch (e) {
        showToast('Gagal', 'Tidak bisa membuat berkas Excel: ' + e.message, 'danger');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = asli; }
    }
}

async function unduhKeuanganPdf() {
    if (!keuData) { showToast('Belum siap', 'Laporan belum selesai dimuat.', 'warning'); return; }
    const btn = document.getElementById('btnKeuPdf');
    const asli = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-inline"></span> Menyiapkan...'; }
    try {
        const JsPDF = await muatJsPdf();          // pustaka yang sama dengan invoice RFQ
        const pdf = buatAdapterJsPdf(JsPDF);
        const d = keuData;
        const r = d.ringkas || {};

        // Palet disamakan dengan invoice RFQ supaya kedua dokumen terlihat
        // berasal dari satu aplikasi, bukan dua gaya yang berbeda.
        const AKSEN = '#0284c7', GELAP = '#0f172a', TEKS = '#111827',
              REDUP = '#6b7280', GARIS = '#d1d5db', MUDA = '#f3f4f6',
              ZEBRA = '#f8fafc', PUTIH = '#ffffff';
        const M = 14;
        const CW = pdf.lebar - M * 2;             // lebar isi
        const BAWAH = pdf.tinggi - 18;            // batas bawah sebelum catatan kaki
        const namaApp = (AppState.config && AppState.config.appName) || 'PortoUMKM';
        const lembaga = (typeof namaLembaga === 'function') ? namaLembaga() : '';
        let y = 0;

        const T = function (v) { return bersihkanTeksPdf(String(v === null || v === undefined ? '' : v)); };
        const kanan = function (s, xKanan, yy) { pdf.teks(s, xKanan - pdf.lebarTeks(s), yy); };

        // ---------- kepala halaman ----------
        const kepalaHalaman = function (pertama) {
            const tinggi = pertama ? 30 : 18;
            pdf.warnaIsi(GELAP); pdf.kotak(0, 0, pdf.lebar, tinggi, 'F');
            pdf.warnaIsi(AKSEN); pdf.kotak(0, tinggi, pdf.lebar, 2.2, 'F');
            if (pertama) {
                pdf.font('bold', 16); pdf.warnaTeks(PUTIH);
                pdf.teks(T('LAPORAN KEUANGAN'), M, 14);
                pdf.font('normal', 8.5); pdf.warnaTeks('#cbd5e1');
                pdf.teks(T(namaApp + (lembaga ? ' - ' + lembaga : '')), M, 21);
                pdf.font('normal', 7.5); pdf.warnaTeks('#94a3b8');
                kanan(T('PERIODE'), pdf.lebar - M, 11);
                pdf.font('bold', 11); pdf.warnaTeks(PUTIH);
                kanan(T(labelRentangKeu()), pdf.lebar - M, 18);
                pdf.font('normal', 7.5); pdf.warnaTeks('#94a3b8');
                kanan(T((d.mulai || '') + '  s/d  ' + (d.sampai || '')), pdf.lebar - M, 24);
            } else {
                pdf.font('bold', 9); pdf.warnaTeks(PUTIH);
                pdf.teks(T(namaApp + '  |  Laporan Keuangan'), M, 11.5);
                pdf.font('normal', 8); pdf.warnaTeks('#94a3b8');
                kanan(T((d.mulai || '') + ' s/d ' + (d.sampai || '')), pdf.lebar - M, 11.5);
            }
            y = tinggi + 10;
        };
        const halamanBaru = function () { pdf.halamanBaru(); kepalaHalaman(false); };
        const muat = function (butuh) { if (y + butuh > BAWAH) halamanBaru(); };

        // ---------- judul bagian: pita abu dengan garis aksen ----------
        const bagian = function (judul) {
            muat(20);
            pdf.warnaIsi(MUDA); pdf.kotak(M, y, CW, 7.5, 'F');
            pdf.warnaIsi(AKSEN); pdf.kotak(M, y, 1.6, 7.5, 'F');
            pdf.font('bold', 9.5); pdf.warnaTeks(GELAP);
            pdf.teks(T(judul), M + 4.5, y + 5.2);
            y += 12;
        };

        // ---------- tabel berbingkai, berkepala warna, berselang-seling ----------
        // kolom: { judul, lebar, angka }  - angka = dirapatkan ke kanan
        const tabel = function (kolom, rows, totalRow) {
            if (!rows.length) return;
            const TH = 8, TR = 7;
            const gambarKepala = function () {
                pdf.warnaIsi(GELAP); pdf.kotak(M, y, CW, TH, 'F');
                pdf.font('bold', 8); pdf.warnaTeks(PUTIH);
                let x = M;
                kolom.forEach(function (k) {
                    if (k.angka) kanan(T(k.judul), x + k.lebar - 3, y + 5.4);
                    else pdf.teks(T(k.judul), x + 3, y + 5.4);
                    x += k.lebar;
                });
                y += TH;
            };
            muat(TH + TR * 2);
            gambarKepala();

            rows.forEach(function (b, idx) {
                if (y + TR > BAWAH) { halamanBaru(); gambarKepala(); }
                if (idx % 2 === 1) { pdf.warnaIsi(ZEBRA); pdf.kotak(M, y, CW, TR, 'F'); }
                pdf.font('normal', 8); pdf.warnaTeks(TEKS);
                let x = M;
                kolom.forEach(function (k, i) {
                    let s = T(b[i]);
                    if (k.angka) {
                        kanan(s, x + k.lebar - 3, y + 4.9);
                    } else {
                        // Potong teks yang kepanjangan supaya tidak menabrak kolom
                        // sebelah. Spasi di ujung dibuang dulu, kalau tidak hasilnya
                        // jadi "Nama Yang ." dengan titik menggantung.
                        const maks = k.lebar - 6;
                        if (pdf.lebarTeks(s) > maks) {
                            while (s.length > 2 && pdf.lebarTeks(s + '...') > maks) s = s.slice(0, -1);
                            s = s.replace(/[\s,.;:-]+$/, '') + '...';
                        }
                        pdf.teks(s, x + 3, y + 4.9);
                    }
                    x += k.lebar;
                });
                pdf.warnaGaris('#e5e7eb'); pdf.tebalGaris(0.15);
                pdf.garis(M, y + TR, M + CW, y + TR);
                y += TR;
            });

            if (totalRow) {
                if (y + TR + 2 > BAWAH) { halamanBaru(); gambarKepala(); }
                pdf.warnaIsi('#e8eef5'); pdf.kotak(M, y, CW, TR + 0.5, 'F');
                pdf.font('bold', 8.3); pdf.warnaTeks(GELAP);
                let x = M;
                kolom.forEach(function (k, i) {
                    const s = T(totalRow[i]);
                    if (!s) { x += k.lebar; return; }
                    if (k.angka) kanan(s, x + k.lebar - 3, y + 5.1);
                    else pdf.teks(s, x + 3, y + 5.1);
                    x += k.lebar;
                });
                y += TR + 0.5;
            }
            pdf.warnaGaris(GARIS); pdf.tebalGaris(0.3);
            pdf.garis(M, y, M + CW, y);
            y += 9;
        };

        // Baris TOTAL memakai angka yang DIKEMBALIKAN DATABASE, bukan hasil
        // menjumlah ulang baris di layar. Kalau halaman menjumlah sendiri,
        // suatu saat totalnya bisa berbeda dari ringkasan di atasnya dan tidak
        // ada yang tahu mana yang benar. Satu sumber angka, satu kebenaran.
        const TNILAI = Number(r.nilai_rekap) || 0;      // jumlah seluruh baris item
        const TUNIT = Number(r.unit_terjual) || 0;
        const TOMZET = Number(r.omzet) || 0;
        const TTRANS = Number(r.jumlah_transaksi) || 0;
        const jum = function (arr, k) {
            return arr.reduce(function (a, x) { return a + (Number(x[k]) || 0); }, 0);
        };

        // ================= isi dokumen =================
        kepalaHalaman(true);

        // --- kotak dasar perhitungan ---
        pdf.warnaIsi('#eff6ff'); pdf.kotak(M, y, CW, 13, 'F');
        pdf.warnaIsi(AKSEN); pdf.kotak(M, y, 1.6, 13, 'F');
        pdf.font('normal', 8); pdf.warnaTeks('#1e3a5f');
        pdf.teks(T('Dasar perhitungan: hanya pesanan berstatus "Dikonfirmasi". Pesanan yang masih'), M + 4.5, y + 5.3);
        pdf.teks(T('menunggu konfirmasi tidak ikut dihitung.'), M + 4.5, y + 9.8);
        y += 19;

        // --- ringkasan: enam kotak statistik ---
        bagian('Ringkasan');
        const stat = [
            ['Omzet Terkonfirmasi', formatRupiah(r.omzet || 0)],
            ['Sudah Dibayar', formatRupiah(r.sudah_bayar || 0)],
            ['Belum Dibayar', formatRupiah(r.belum_bayar || 0)],
            ['Jumlah Transaksi', String(r.jumlah_transaksi || 0) + ' pesanan'],
            ['Transaksi Lunas', String(r.transaksi_lunas || 0) + ' pesanan'],
            ['Rata-rata per Transaksi', formatRupiah(r.rata_transaksi || 0)]
        ];
        const KW = (CW - 6) / 3, KH = 16;
        stat.forEach(function (k, i) {
            const kol = i % 3, bar = Math.floor(i / 3);
            const x = M + kol * (KW + 3), yy = y + bar * (KH + 3);
            pdf.warnaIsi(PUTIH); pdf.warnaGaris(GARIS); pdf.tebalGaris(0.25);
            pdf.kotak(x, yy, KW, KH, 'FD');
            pdf.font('normal', 7); pdf.warnaTeks(REDUP);
            pdf.teks(T(k[0]), x + 3.5, yy + 5.5);
            pdf.font('bold', 10.5); pdf.warnaTeks(GELAP);
            pdf.teks(T(k[1]), x + 3.5, yy + 12.5);
        });
        y += KH * 2 + 3 + 9;

        // --- peringatan data, kalau ada ---
        const nol = d.tanpa_harga || [];
        const kosong = d.pesanan_tanpa_item || {};
        if (nol.length || Number(kosong.jumlah) > 0) {
            const pesan = [];
            if (nol.length) pesan.push(jum(nol, 'unit') + ' unit dari ' + nol.length +
                ' produk terjual dengan harga tercatat Rp 0 (lihat tabel terakhir).');
            if (Number(kosong.jumlah) > 0) pesan.push(kosong.jumlah + ' pesanan senilai ' +
                formatRupiah(kosong.nilai || 0) + ' tidak punya rincian produk.');
            const tinggi = 7 + pesan.length * 4.6;
            muat(tinggi + 4);
            pdf.warnaIsi('#fff7ed'); pdf.kotak(M, y, CW, tinggi, 'F');
            pdf.warnaIsi('#ea580c'); pdf.kotak(M, y, 1.6, tinggi, 'F');
            pdf.font('bold', 8); pdf.warnaTeks('#9a3412');
            pdf.teks(T('Perlu diperiksa'), M + 4.5, y + 5);
            pdf.font('normal', 7.8); pdf.warnaTeks('#7c2d12');
            pesan.forEach(function (t, i) { pdf.teks(T('- ' + t), M + 4.5, y + 9.8 + i * 4.6); });
            y += tinggi + 7;
        }

        // --- tabel rekap ---
        const umkm = d.per_umkm || [];
        bagian('Rekap per UMKM');
        tabel([{ judul: 'UMKM', lebar: 74 }, { judul: 'Transaksi', lebar: 28, angka: true },
               { judul: 'Unit', lebar: 26, angka: true }, { judul: 'Nilai', lebar: 54, angka: true }],
            umkm.map(function (x) { return [x.nama, x.transaksi, x.unit, formatRupiah(x.nilai)]; }),
            // Kolom Transaksi SENGAJA tidak dijumlah. Isinya cacah pesanan unik
            // per UMKM; satu pesanan yang memuat produk dari dua UMKM terhitung
            // di keduanya, jadi jumlahnya akan melebihi jumlah transaksi
            // sebenarnya dan terbaca seperti laporan yang salah.
            ['TOTAL', '', TUNIT, formatRupiah(TNILAI)]);

        const prod = d.per_produk || [];
        bagian('Produk Terlaris (menurut nilai)');
        tabel([{ judul: 'Produk', lebar: 58 }, { judul: 'UMKM', lebar: 44 },
               { judul: 'Transaksi', lebar: 24, angka: true }, { judul: 'Unit', lebar: 20, angka: true },
               { judul: 'Nilai', lebar: 36, angka: true }],
            prod.map(function (x) { return [x.nama, x.umkm, x.transaksi, x.unit, formatRupiah(x.nilai)]; }),
            ['TOTAL', '', '', TUNIT, formatRupiah(TNILAI)]);

        const kat = d.per_kategori || [];
        bagian('Rekap per Kategori');
        tabel([{ judul: 'Kategori', lebar: 92 }, { judul: 'Unit', lebar: 36, angka: true },
               { judul: 'Nilai', lebar: 54, angka: true }],
            kat.map(function (x) { return [x.nama, x.unit, formatRupiah(x.nilai)]; }),
            ['TOTAL', TUNIT, formatRupiah(TNILAI)]);

        const jalur = d.per_jalur || [];
        bagian('Ritel vs Grosir');
        tabel([{ judul: 'Jalur', lebar: 56 }, { judul: 'Transaksi', lebar: 30, angka: true },
               { judul: 'Nilai', lebar: 48, angka: true }, { judul: 'Rata-rata', lebar: 48, angka: true }],
            jalur.map(function (x) { return [x.jalur, x.transaksi, formatRupiah(x.nilai), formatRupiah(x.rata)]; }),
            ['TOTAL', TTRANS, formatRupiah(TOMZET), '']);

        const tren = d.tren || [];
        if (tren.length) {
            bagian('Tren Penjualan');
            tabel([{ judul: 'Periode', lebar: 52 }, { judul: 'Tanggal', lebar: 40 },
                   { judul: 'Jumlah Pesanan', lebar: 40, angka: true },
                   { judul: 'Nilai', lebar: 50, angka: true }],
                tren.map(function (x) { return [x.label, x.tanggal, x.jumlah, formatRupiah(x.nilai)]; }),
                ['TOTAL', '', TTRANS, formatRupiah(TOMZET)]);
        }

        if (nol.length) {
            bagian('Perlu Dibetulkan - terjual tapi harga tercatat Rp 0');
            tabel([{ judul: 'Produk', lebar: 74 }, { judul: 'UMKM', lebar: 56 },
                   { judul: 'Transaksi', lebar: 26, angka: true }, { judul: 'Unit', lebar: 26, angka: true }],
                nol.map(function (x) { return [x.nama, x.umkm, x.transaksi, x.unit]; }),
                ['TOTAL', '', '', jum(nol, 'unit')]);
        }

        // ---------- catatan kaki di setiap halaman ----------
        const total = pdf.jumlahHalaman();
        for (let i = 1; i <= total; i++) {
            pdf.keHalaman(i);
            pdf.warnaGaris(GARIS); pdf.tebalGaris(0.2);
            pdf.garis(M, pdf.tinggi - 14, pdf.lebar - M, pdf.tinggi - 14);
            pdf.font('normal', 7.5); pdf.warnaTeks('#94a3b8');
            pdf.teks(T(namaApp + ' - Laporan Keuangan' + (lembaga ? ' - ' + lembaga : '')), M, pdf.tinggi - 9.5);
            const h = 'Halaman ' + i + ' dari ' + total;
            kanan(T(h), pdf.lebar - M, pdf.tinggi - 9.5);
        }
        pdf.simpan(namaBerkasKeu('pdf'));
        showToast('Berhasil', 'Berkas PDF diunduh.', 'success');
    } catch (e) {
        showToast('Gagal', 'Tidak bisa membuat PDF: ' + e.message, 'danger');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = asli; }
    }
}
