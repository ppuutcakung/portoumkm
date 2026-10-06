/**
 * ============================================================
 * PortoUMKM - Dokumen PDF terstandar untuk RFQ B2B & Permintaan Sampel
 * Dibuat langsung di browser Admin saat tombol PDF diklik (tidak ada file
 * yang disimpan di server), jadi setiap RFQ/sampel yang tercatat selalu
 * punya dokumen dengan format yang sama.
 *
 * Tiga lapis:
 *  1. susunDokumenRfq()     : data -> isi dokumen (murni, mudah diuji)
 *  2. gambarDokumenRfq()    : isi dokumen -> gambar halaman lewat "adaptor"
 *  3. buatAdapterJsPdf()    : adaptor tipis ke pustaka jsPDF (dimuat saat dibutuhkan)
 * ============================================================
 */
const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
let jsPdfPromise = null;

// -------------------- 1. ISI DOKUMEN --------------------
/** Pustaka PDF hanya mendukung huruf Latin dasar: rapikan tanda kutip/strip "pintar", buang emoji dsb. */
function bersihkanTeksPdf(s) {
    return String(s == null ? '' : s)
        .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '?')
        .replace(/[\u2018\u2019\u201B]/g, "'").replace(/[\u201C\u201D\u201F]/g, '"')
        .replace(/[\u2013\u2014\u2212]/g, '-').replace(/\u2026/g, '...').replace(/[\u2022\u00B7]/g, '-')
        .replace(/\u00A0/g, ' ').replace(/\t/g, ' ').replace(/\r/g, '')
        .replace(/[^\n\x20-\x7E\u00A1-\u00FF]/g, '?');
}
function rupiahPdf(n) { return bersihkanTeksPdf(formatRupiah(n)); }

/** Ubah satu baris data rfq menjadi isi dokumen (judul, nomor, tabel-tabel). */
function susunDokumenRfq(r) {
    const sampel = r.jenis === 'Sampel', kustom = r.jenis === 'Kustom';
    const satuan = r.satuan || '';
    const jumlah = Number(r.target_jumlah) || 0;
    const nomor = r.nomor || ((sampel ? 'SMP-' : 'RFQ-') + String(r.id || '').slice(0, 8).toUpperCase());
    const hargaDiminta = (r.harga_diminta !== null && r.harga_diminta !== undefined && r.harga_diminta !== '') ? Number(r.harga_diminta) : null;
    const produk = [
        ['Nama Produk / Kebutuhan', r.nama_produk || '-'],
        ['UMKM Pemilik', r.nama_umkm || '-'],
        [sampel ? 'Jumlah Sampel' : 'Target Jumlah', jumlah + (satuan ? ' ' + satuan : '')]
    ];
    if (!(sampel && r.opsi_pembayaran === 'Pinjam sementara')) {
        produk.push(['Harga yang Diminta', hargaDiminta !== null ? rupiahPdf(hargaDiminta) + (satuan ? ' / ' + satuan : '') : '-']);
        if (hargaDiminta !== null) produk.push(['Perkiraan Total', rupiahPdf(hargaDiminta * jumlah) + ' (pada harga yang diminta)']);
    }
    if (r.harga_estimasi_satuan) produk.push(['Acuan Harga Skema Grosir', rupiahPdf(r.harga_estimasi_satuan) + (satuan ? ' / ' + satuan : '')]);
    const nomorFile = nomor.replace(/[^A-Za-z0-9_-]/g, '');
    return {
        judul: sampel ? 'PERMINTAAN PAKET SAMPEL' : (kustom ? 'REQUEST FOR QUOTATION (RFQ) KUSTOM' : 'REQUEST FOR QUOTATION (RFQ)'),
        sampel: sampel,
        nomor: nomor,
        namaFile: (sampel ? 'Sampel-' : 'RFQ-') + nomorFile.replace(/^(RFQ|SMP)-?/, '') + '.pdf',
        tanggal: tanggalIndo(r.created_at),
        jenis: r.jenis || 'RFQ',
        status: r.status || 'Baru',
        pemohon: [
            ['Nama Perusahaan', r.nama_perusahaan || r.nama_pembeli || '-'],
            ['PIC / Pembeli', r.nama_pic || '-'],
            ['WhatsApp / HP', r.kontak || '-'],
            ['Alamat Penerima', r.alamat_penerima || '-']
        ],
        produk: produk,
        ketentuan: [
            [sampel ? 'Skema Sampel' : 'Opsi Pembayaran', teksPembayaran(r.opsi_pembayaran, r.dp_persen) || '-'],
            ['Batas Waktu Pengiriman', r.batas_waktu ? tanggalDateIndo(r.batas_waktu) : '-']
        ],
        spesifikasi: r.spesifikasi || '-',
        namaPic: r.nama_pic || ''
    };
}

// -------------------- 2. TATA LETAK --------------------
/** Pecah teks menjadi baris-baris yang muat dalam lebar (mm), menghormati baris baru dan kata sangat panjang. */
function bungkusTeks(pdf, teks, lebar) {
    const hasil = [];
    String(teks).split('\n').forEach(function(para) {
        if (para.trim() === '') { hasil.push(''); return; }
        let baris = '';
        para.split(/\s+/).filter(Boolean).forEach(function(kata) {
            while (pdf.lebarTeks(kata) > lebar) {            // kata lebih panjang dari satu baris: potong per huruf
                if (baris) { hasil.push(baris); baris = ''; }
                let n = kata.length;
                while (n > 1 && pdf.lebarTeks(kata.slice(0, n)) > lebar) n--;
                hasil.push(kata.slice(0, n));
                kata = kata.slice(n);
            }
            const calon = baris ? baris + ' ' + kata : kata;
            if (pdf.lebarTeks(calon) <= lebar) baris = calon;
            else { hasil.push(baris); baris = kata; }
        });
        if (baris) hasil.push(baris);
    });
    return hasil.length ? hasil : [''];
}

/**
 * Gambar seluruh dokumen. pdf = adaptor (lihat buatAdapterJsPdf). foto = {dataUrl,width,height} atau null.
 * opsi = {aksen:'#rrggbb', namaApp:string}
 */
function gambarDokumenRfq(pdf, doc, foto, opsi) {
    opsi = opsi || {};
    const aksen = opsi.aksen || '#0284c7';
    const namaApp = bersihkanTeksPdf(opsi.namaApp || 'PortoUMKM');
    const GELAP = '#0f172a', TEKS = '#111827', REDUP = '#6b7280', GARIS = '#d1d5db', MUDA = '#f3f4f6', PUTIH = '#ffffff';
    const M = 15, CW = pdf.lebar - 2 * M, BAWAH = pdf.tinggi - 22;
    const LH = 4.5;
    let y = 0;

    function teksKanan(s, xKanan, yy) { pdf.teks(s, xKanan - pdf.lebarTeks(s), yy); }
    function kepalaPertama() {
        pdf.warnaIsi(GELAP); pdf.kotak(0, 0, pdf.lebar, 32, 'F');
        pdf.warnaIsi(aksen); pdf.kotak(0, 32, pdf.lebar, 2.2, 'F');
        pdf.font('bold', 16); pdf.warnaTeks(PUTIH); pdf.teks(bersihkanTeksPdf(doc.judul), M, 14);
        pdf.font('normal', 8.5); pdf.warnaTeks('#cbd5e1'); pdf.teks(bersihkanTeksPdf(namaApp + ' - Katalog Digital UMKM Binaan PPU UT Cakung'), M, 21);
        pdf.font('normal', 7.5); pdf.warnaTeks('#94a3b8'); teksKanan('NO. DOKUMEN', pdf.lebar - M, 11);
        pdf.font('bold', 12); pdf.warnaTeks(PUTIH); teksKanan(bersihkanTeksPdf(doc.nomor), pdf.lebar - M, 18);
        y = 42;
        [['TANGGAL', doc.tanggal], ['JENIS DOKUMEN', doc.jenis], ['STATUS', doc.status]].forEach(function(c, i) {
            const x = M + i * 60;
            pdf.font('normal', 7.5); pdf.warnaTeks(REDUP); pdf.teks(c[0], x, y);
            pdf.font('bold', 10); pdf.warnaTeks(TEKS); pdf.teks(bersihkanTeksPdf(c[1]), x, y + 5.5);
        });
        y += 11;
        pdf.warnaGaris(GARIS); pdf.tebalGaris(0.3); pdf.garis(M, y, M + CW, y);
        y += 6;
    }
    function kepalaRingkas() {
        pdf.font('bold', 8.5); pdf.warnaTeks(GELAP); pdf.teks(bersihkanTeksPdf(doc.nomor + '   |   ' + doc.judul), M, 12);
        pdf.warnaGaris(aksen); pdf.tebalGaris(0.6); pdf.garis(M, 15, M + CW, 15);
        y = 22;
    }
    function pastikanRuang(tinggi) {
        if (y + tinggi > BAWAH) { pdf.halamanBaru(); kepalaRingkas(); }
    }
    function bagian(judul) {
        pastikanRuang(18);
        pdf.warnaIsi(MUDA); pdf.kotak(M, y, CW, 7, 'F');
        pdf.warnaIsi(aksen); pdf.kotak(M, y, 1.6, 7, 'F');
        pdf.font('bold', 9.5); pdf.warnaTeks(GELAP); pdf.teks(bersihkanTeksPdf(judul), M + 4.5, y + 4.9);
        y += 10;
    }
    // ----- tabel label : nilai -----
    function pecahBaris(rows, w, labelW) {
        return rows.map(function(r) {
            pdf.font('normal', 8.5);
            const lab = bungkusTeks(pdf, bersihkanTeksPdf(r[0]), labelW - 3);
            pdf.font('normal', 9.5);
            const nil = bungkusTeks(pdf, bersihkanTeksPdf(r[1]), w - labelW - 2);
            return { lab: lab, nil: nil, h: Math.max(lab.length, nil.length) * LH + 3.2 };
        });
    }
    function tinggiTabel(rows, w, labelW) { return pecahBaris(rows, w, labelW).reduce(function(a, b) { return a + b.h; }, 0); }
    function gambarTabel(rows, x, w, labelW) {
        let yy = y;
        pecahBaris(rows, w, labelW).forEach(function(b) {
            pdf.font('normal', 8.5); pdf.warnaTeks(REDUP);
            b.lab.forEach(function(l, i) { pdf.teks(l, x + 1, yy + 4.6 + i * LH); });
            pdf.font('normal', 9.5); pdf.warnaTeks(TEKS);
            b.nil.forEach(function(l, i) { pdf.teks(l, x + labelW, yy + 4.6 + i * LH); });
            yy += b.h;
            pdf.warnaGaris(GARIS); pdf.tebalGaris(0.2); pdf.garis(x, yy, x + w, yy);
        });
        return yy;
    }
    function tabelBerhalaman(rows, labelW) {
        rows.forEach(function(r) {                       // satu baris per langkah supaya bisa pindah halaman
            const h = tinggiTabel([r], CW, labelW);
            pastikanRuang(h);
            y = gambarTabel([r], M, CW, labelW);
        });
        y += 5;
    }

    // ================= ISI =================
    kepalaPertama();

    bagian('A. DATA PEMOHON');
    tabelBerhalaman(doc.pemohon, 48);

    bagian('B. ' + (doc.sampel ? 'SAMPEL YANG DIMINTA' : 'PRODUK YANG DIMINTA'));
    const FOTO = 50, GAP = 5, XT = M + FOTO + GAP, WT = CW - FOTO - GAP;
    const tinggiBlok = Math.max(FOTO + 2, tinggiTabel(doc.produk, WT, 44));
    pastikanRuang(tinggiBlok + 4);
    pdf.warnaGaris(GARIS); pdf.tebalGaris(0.3); pdf.warnaIsi(PUTIH); pdf.kotak(M, y, FOTO, FOTO, 'S');
    if (foto && foto.dataUrl && foto.width > 0 && foto.height > 0) {
        const skala = Math.min((FOTO - 4) / foto.width, (FOTO - 4) / foto.height);
        const fw = foto.width * skala, fh = foto.height * skala;
        pdf.gambar(foto.dataUrl, M + (FOTO - fw) / 2, y + (FOTO - fh) / 2, fw, fh);
    } else {
        pdf.font('normal', 8); pdf.warnaTeks(REDUP);
        const t1 = 'Foto produk', t2 = 'tidak tersedia';
        pdf.teks(t1, M + (FOTO - pdf.lebarTeks(t1)) / 2, y + FOTO / 2 - 1);
        pdf.teks(t2, M + (FOTO - pdf.lebarTeks(t2)) / 2, y + FOTO / 2 + 3);
    }
    const yAkhirTabel = gambarTabel(doc.produk, XT, WT, 44);
    y = Math.max(y + FOTO, yAkhirTabel) + 6;

    bagian('C. KETENTUAN');
    tabelBerhalaman(doc.ketentuan, 48);

    bagian('D. SPESIFIKASI / KEBUTUHAN KHUSUS');
    pdf.font('normal', 9.5); pdf.warnaTeks(TEKS);
    bungkusTeks(pdf, bersihkanTeksPdf(doc.spesifikasi), CW - 2).forEach(function(l) {
        pastikanRuang(LH + 2);
        pdf.font('normal', 9.5); pdf.warnaTeks(TEKS);
        pdf.teks(l, M + 1, y + 3.6);
        y += LH;
    });
    y += 6;

    // ----- tanda tangan ----- (tinggi sebenarnya ~33mm; cadangan 36mm supaya dokumen
    // berukuran wajar tetap muat satu halaman dan tidak pecah hanya karena selisih milimeter)
    pastikanRuang(36);
    const bw = (CW - 12) / 2;
    [['Pemohon', doc.namaPic ? bersihkanTeksPdf(doc.namaPic) : '(nama jelas)'], ['Penerima Pengajuan', 'Admin ' + namaApp]].forEach(function(t, i) {
        const x = M + i * (bw + 12);
        pdf.font('bold', 8.5); pdf.warnaTeks(GELAP); pdf.teks(t[0], x, y + 3);
        pdf.warnaGaris(REDUP); pdf.tebalGaris(0.3); pdf.garis(x, y + 27, x + bw, y + 27);
        pdf.font('normal', 8.5); pdf.warnaTeks(REDUP); pdf.teks(t[1], x, y + 31.5);
    });
    y += 36;

    // ----- catatan kaki & nomor halaman di semua halaman -----
    const n = pdf.jumlahHalaman();
    for (let i = 1; i <= n; i++) {
        pdf.keHalaman(i);
        pdf.warnaGaris(GARIS); pdf.tebalGaris(0.3); pdf.garis(M, pdf.tinggi - 17, M + CW, pdf.tinggi - 17);
        pdf.font('normal', 7); pdf.warnaTeks(REDUP);
        pdf.teks('Dokumen dibuat otomatis oleh sistem ' + namaApp + '. Dokumen ini adalah pengajuan, bukan penawaran harga atau konfirmasi pesanan.', M, pdf.tinggi - 12.5);
        pdf.teks('Harga final dan ketersediaan mengikuti penawaran resmi dari produsen UMKM.', M, pdf.tinggi - 9);
        const hal = 'Halaman ' + i + ' / ' + n;
        pdf.font('bold', 7.5); pdf.warnaTeks(GELAP); teksKanan(hal, M + CW, pdf.tinggi - 12.5);
    }
}

// -------------------- 3. ADAPTOR jsPDF + PEMUAT --------------------
/** Adaptor tipis: semua satuan dalam milimeter, titik (0,0) di kiri-ATAS halaman. */
function buatAdapterJsPdf(JsPDF) {
    const doc = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const rgb = function(h) { return hexKeRgb(h); };
    return {
        lebar: doc.internal.pageSize.getWidth(),
        tinggi: doc.internal.pageSize.getHeight(),
        font: function(gaya, ukuran) { doc.setFont('helvetica', gaya); doc.setFontSize(ukuran); },
        warnaTeks: function(h) { const c = rgb(h); doc.setTextColor(c[0], c[1], c[2]); },
        warnaIsi: function(h) { const c = rgb(h); doc.setFillColor(c[0], c[1], c[2]); },
        warnaGaris: function(h) { const c = rgb(h); doc.setDrawColor(c[0], c[1], c[2]); },
        tebalGaris: function(t) { doc.setLineWidth(t); },
        kotak: function(x, y, w, h, mode) { doc.rect(x, y, w, h, mode); },
        garis: function(x1, y1, x2, y2) { doc.line(x1, y1, x2, y2); },
        teks: function(s, x, y) { doc.text(String(s), x, y); },
        lebarTeks: function(s) { return doc.getTextWidth(String(s)); },
        gambar: function(dataUrl, x, y, w, h) { doc.addImage(dataUrl, 'JPEG', x, y, w, h); },
        halamanBaru: function() { doc.addPage(); },
        jumlahHalaman: function() { return doc.getNumberOfPages(); },
        keHalaman: function(i) { doc.setPage(i); },
        simpan: function(nama) { doc.save(nama); }
    };
}
/** Pustaka jsPDF dimuat HANYA saat Admin menekan tombol PDF (pengunjung biasa tidak mengunduhnya). */
function muatJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    if (jsPdfPromise) return jsPdfPromise;
    jsPdfPromise = new Promise(function(resolve, reject) {
        const s = document.createElement('script');
        s.src = JSPDF_URL;
        s.onload = function() {
            if (window.jspdf && window.jspdf.jsPDF) resolve(window.jspdf.jsPDF);
            else { jsPdfPromise = null; reject(new Error('Pustaka PDF termuat tetapi tidak dikenali.')); }
        };
        s.onerror = function() { jsPdfPromise = null; reject(new Error('Gagal memuat pustaka PDF. Periksa koneksi internet lalu coba lagi.')); };
        document.head.appendChild(s);
    });
    return jsPdfPromise;
}
/**
 * Ambil foto produk sebagai JPEG (jsPDF tidak bisa membaca WebP) dan kecilkan.
 * Hanya mengambil dari Google Drive (lh3.googleusercontent.com). Gagal => null,
 * dan dokumen tetap dibuat dengan kotak "foto tidak tersedia".
 */
async function muatFotoUntukPdf(url) {
    if (!url || !/^https:\/\/lh3\.googleusercontent\.com\//.test(url)) return null;
    try {
        const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        const timer = ctrl ? setTimeout(function() { ctrl.abort(); }, 15000) : null;
        const res = await fetch(url, { mode: 'cors', cache: 'reload', signal: ctrl ? ctrl.signal : undefined });
        if (timer) clearTimeout(timer);
        if (!res.ok) return null;
        const blob = await res.blob();
        if (!/^image\//.test(blob.type || '')) return null;
        const objUrl = URL.createObjectURL(blob);
        try {
            return await new Promise(function(resolve) {
                const img = new Image();
                img.onload = function() {
                    try {
                        let w = img.naturalWidth, h = img.naturalHeight;
                        if (!w || !h) { resolve(null); return; }
                        const skala = Math.min(1, 700 / Math.max(w, h));
                        w = Math.round(w * skala); h = Math.round(h * skala);
                        const c = document.createElement('canvas');
                        c.width = w; c.height = h;
                        const g = c.getContext('2d');
                        g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
                        g.drawImage(img, 0, 0, w, h);
                        resolve({ dataUrl: c.toDataURL('image/jpeg', 0.85), width: w, height: h });
                    } catch (e) { resolve(null); }
                };
                img.onerror = function() { resolve(null); };
                img.src = objUrl;
            });
        } finally { URL.revokeObjectURL(objUrl); }
    } catch (e) { return null; }
}

/** Dipanggil tombol PDF di halaman Admin RFQ. */
async function unduhPdfRfq(r) {
    showToast('Membuat PDF', 'Mohon tunggu sebentar...', 'info');
    try {
        const JsPDF = await muatJsPdf();
        let fotoUrl = r.foto_url || '';
        if (!fotoUrl && r.produk_id) {
            const res = await dbSelect('produk', { eq: { id: r.produk_id }, limit: 1 });
            if (res.success && res.data && res.data[0]) fotoUrl = res.data[0].foto_url || '';
        }
        const foto = await muatFotoUntukPdf(fotoUrl);
        const pdf = buatAdapterJsPdf(JsPDF);
        const doc = susunDokumenRfq(r);
        gambarDokumenRfq(pdf, doc, foto, {
            aksen: normalisasiHex((AppState.config || {}).warnaB2b) || '#0284c7',
            namaApp: (AppState.config || {}).appName || 'PortoUMKM'
        });
        pdf.simpan(doc.namaFile);
        showToast('Berhasil', 'PDF ' + doc.nomor + ' diunduh.' + (fotoUrl && !foto ? ' Foto produk tidak bisa dimuat, jadi dokumen dibuat tanpa foto.' : ''), 'success');
    } catch (e) {
        console.error('unduhPdfRfq gagal:', e);
        showToast('Gagal membuat PDF', e && e.message ? e.message : String(e), 'danger');
    }
}
