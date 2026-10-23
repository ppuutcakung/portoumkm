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
 * Seluruh angka datang dari satu panggilan get_laporan_keuangan(hari);
 * halaman ini tidak menghitung ulang apa pun sendiri, supaya tidak ada
 * kemungkinan layar dan ekspor menampilkan angka berbeda.
 */

let keuData = null;
let keuHari = 30;
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
          '<select class="form-select pu-stok-rentang" onchange="setRentangKeuangan(this.value)">' +
            KEU_RENTANG.map(function (o) {
                return '<option value="' + o.hari + '"' + (keuHari === o.hari ? ' selected' : '') + '>' + o.label + '</option>';
            }).join('') +
          '</select>' +
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
    const res = await dbRpc('get_laporan_keuangan', { p_hari: keuHari });
    if (!res.success) {
        keuGagal = res.message || 'Tidak diketahui';
        keuData = null;
        gambarGagalKeuangan();
        return;
    }
    keuGagal = '';
    keuData = res.data || null;
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
    keuHari = Number(v) || 30;
    muatDataKeuangan();
}

function gambarLaporanKeuangan() {
    const el = document.getElementById('keuIsi');
    if (!el) return;
    const d = keuData || {};
    const r = d.ringkas || {};

    if (!r.jumlah_transaksi) {
        el.innerHTML = '<div class="card p-4"><div class="empty-state"><i class="bi bi-graph-up"></i>' +
            'Belum ada pesanan terkonfirmasi pada rentang ini.<br>' +
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
        catatanSelisihKeuangan(r) +
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
            }));

    gambarChartKeuangan(d);
    if (typeof terapkanLabelTabelHp === 'function') terapkanLabelTabelHp();
}

/**
 * Kalau Admin pernah mengoreksi total sebuah pesanan secara manual, jumlah
 * rekap per UMKM/produk tidak akan sama persis dengan omzet. Itu wajar -
 * tapi harus dikatakan, bukan dibiarkan jadi teka-teki.
 */
function catatanSelisihKeuangan(r) {
    const s = Number(r.selisih_rekap) || 0;
    if (!s) return '';
    return '<div class="pu-stok-alarm"><i class="bi bi-info-circle-fill"></i> <span>' +
        'Jumlah tabel rekap di bawah (<b>' + formatRupiah(r.nilai_rekap || 0) + '</b>) berbeda ' +
        formatRupiah(Math.abs(s)) + ' dari omzet (<b>' + formatRupiah(r.omzet || 0) + '</b>). ' +
        'Ini terjadi karena ada total pesanan yang pernah dikoreksi manual di Monitoring Pesanan. ' +
        'Omzet memakai total pesanan yang disepakati; tabel rekap dihitung dari baris produknya.' +
        '</span></div>';
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
    const o = KEU_RENTANG.filter(function (x) { return x.hari === keuHari; })[0];
    return o ? o.label : (keuHari + ' hari terakhir');
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

        // --- Ringkasan ---
        const ring = [
            ['LAPORAN KEUANGAN - ' + ((AppState.config && AppState.config.appName) || 'PortoUMKM')],
            ['Rentang', labelRentangKeu()],
            ['Periode', (d.mulai || '') + ' s/d ' + (d.sampai || '')],
            ['Dasar perhitungan', 'Hanya pesanan berstatus Dikonfirmasi'],
            [],
            ['Keterangan', 'Nilai']
        ].concat(barisRingkasKeu());
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ring), 'Ringkasan');

        // --- Empat tabel rekap; angka ditulis sebagai ANGKA, bukan teks,
        //     supaya bisa langsung dijumlah dan diurutkan di Excel. ---
        const lembar = function (nama, kepala, rows) {
            XLSX.utils.book_append_sheet(wb,
                XLSX.utils.aoa_to_sheet([kepala].concat(rows)), nama);
        };
        lembar('Per UMKM', ['UMKM', 'Transaksi', 'Unit', 'Nilai'],
            (d.per_umkm || []).map(function (x) {
                return [x.nama, Number(x.transaksi), Number(x.unit), Number(x.nilai)]; }));
        lembar('Per Produk', ['Produk', 'UMKM', 'Transaksi', 'Unit', 'Nilai'],
            (d.per_produk || []).map(function (x) {
                return [x.nama, x.umkm, Number(x.transaksi), Number(x.unit), Number(x.nilai)]; }));
        lembar('Per Kategori', ['Kategori', 'Unit', 'Nilai'],
            (d.per_kategori || []).map(function (x) {
                return [x.nama, Number(x.unit), Number(x.nilai)]; }));
        lembar('Ritel vs Grosir', ['Jalur', 'Transaksi', 'Nilai', 'Rata-rata'],
            (d.per_jalur || []).map(function (x) {
                return [x.jalur, Number(x.transaksi), Number(x.nilai), Number(x.rata)]; }));
        lembar('Tren', ['Periode', 'Tanggal', 'Jumlah Pesanan', 'Nilai'],
            (d.tren || []).map(function (x) {
                return [x.label, x.tanggal, Number(x.jumlah), Number(x.nilai)]; }));

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
        const M = 14;
        const namaApp = (AppState.config && AppState.config.appName) || 'PortoUMKM';
        let y = 20;

        const judul = function (t, ukuran) {
            pdf.font('bold', ukuran || 13); pdf.warnaTeks('#0f172a');
            pdf.teks(bersihkanTeksPdf(t), M, y); y += (ukuran || 13) * 0.55 + 3;
        };
        const baris = function (kiri, kanan) {
            pdf.font('normal', 9); pdf.warnaTeks('#334155');
            pdf.teks(bersihkanTeksPdf(kiri), M, y);
            if (kanan !== undefined) {
                const s = bersihkanTeksPdf(String(kanan));
                pdf.teks(s, pdf.lebar - M - pdf.lebarTeks(s), y);
            }
            y += 5.2;
        };
        const cekHalaman = function (butuh) {
            if (y + (butuh || 10) > pdf.tinggi - 18) { pdf.halamanBaru(); y = 20; }
        };
        const tabel = function (nama, kepala, rows, lebarKolom) {
            if (!rows.length) return;
            cekHalaman(24); y += 3; judul(nama, 11);
            pdf.font('bold', 8.5); pdf.warnaTeks('#64748b');
            let x = M;
            kepala.forEach(function (h, i) { pdf.teks(bersihkanTeksPdf(h), x, y); x += lebarKolom[i]; });
            y += 2; pdf.warnaGaris('#e2e8f0'); pdf.tebalGaris(0.3);
            pdf.garis(M, y, pdf.lebar - M, y); y += 4;
            rows.forEach(function (b) {
                cekHalaman(8);
                pdf.font('normal', 8.5); pdf.warnaTeks('#0f172a');
                let xx = M;
                b.forEach(function (c, i) {
                    const s = bersihkanTeksPdf(String(c));
                    // Kolom angka dirapatkan ke kanan supaya mudah dibaca menurun
                    if (i > 0 && /^[\d.,Rp ]+$/.test(s)) pdf.teks(s, xx + lebarKolom[i] - 4 - pdf.lebarTeks(s), y);
                    else pdf.teks(s.length > 34 ? s.slice(0, 33) + '.' : s, xx, y);
                    xx += lebarKolom[i];
                });
                y += 5;
            });
            y += 2;
        };

        judul(namaApp + ' - LAPORAN KEUANGAN', 15);
        baris('Rentang: ' + labelRentangKeu());
        baris('Periode: ' + (d.mulai || '') + ' s/d ' + (d.sampai || ''));
        baris('Dasar perhitungan: hanya pesanan berstatus Dikonfirmasi');
        y += 3;

        judul('Ringkasan', 11);
        barisRingkasKeu().forEach(function (b) {
            const angkaRupiah = /Omzet|dibayar|Rata-rata/.test(b[0]);
            baris(b[0], angkaRupiah ? formatRupiah(b[1]) : String(b[1]));
        });

        tabel('Rekap per UMKM', ['UMKM', 'Transaksi', 'Unit', 'Nilai'],
            (d.per_umkm || []).map(function (x) {
                return [x.nama, x.transaksi, x.unit, formatRupiah(x.nilai)]; }),
            [80, 28, 24, 50]);
        tabel('Produk Terlaris', ['Produk', 'UMKM', 'Transaksi', 'Nilai'],
            (d.per_produk || []).map(function (x) {
                return [x.nama, x.umkm, x.transaksi, formatRupiah(x.nilai)]; }),
            [66, 52, 28, 36]);
        tabel('Rekap per Kategori', ['Kategori', 'Unit', 'Nilai'],
            (d.per_kategori || []).map(function (x) {
                return [x.nama, x.unit, formatRupiah(x.nilai)]; }),
            [92, 40, 50]);
        tabel('Ritel vs Grosir', ['Jalur', 'Transaksi', 'Nilai', 'Rata-rata'],
            (d.per_jalur || []).map(function (x) {
                return [x.jalur, x.transaksi, formatRupiah(x.nilai), formatRupiah(x.rata)]; }),
            [52, 30, 50, 50]);

        // Catatan kaki di setiap halaman
        const total = pdf.jumlahHalaman();
        for (let i = 1; i <= total; i++) {
            pdf.keHalaman(i);
            pdf.font('normal', 7.5); pdf.warnaTeks('#94a3b8');
            pdf.teks(bersihkanTeksPdf(namaApp + ' - Laporan Keuangan'), M, pdf.tinggi - 10);
            const h = 'Halaman ' + i + ' dari ' + total;
            pdf.teks(h, pdf.lebar - M - pdf.lebarTeks(h), pdf.tinggi - 10);
        }
        pdf.simpan(namaBerkasKeu('pdf'));
        showToast('Berhasil', 'Berkas PDF diunduh.', 'success');
    } catch (e) {
        showToast('Gagal', 'Tidak bisa membuat PDF: ' + e.message, 'danger');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = asli; }
    }
}
