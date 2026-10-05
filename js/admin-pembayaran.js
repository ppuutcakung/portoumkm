/**
 * ============================================================
 * PortoUMKM - Admin: Monitoring Pembayaran
 * ============================================================
 */
let adminPembayaranCache = [];
function renderAdminPembayaranPage() {
    const container = document.getElementById('app-container');
    container.innerHTML = adminPageShell('Monitoring Pembayaran', [
      '<p class="text-sm mb-3" style="color:var(--text-muted)">Pantau status pembayaran pesanan yang masuk dari customer (semacam monitoring piutang).</p>',
      '<div class="flex flex-wrap gap-2 mb-3" id="pembayaranFilterTabs"></div>',
      '<div class="table-wrap">',
      '<table class="data-table">',
      '<thead><tr><th>UMKM</th><th>Produk</th><th>Tanggal Dipesan</th><th>Customer</th><th>No. HP</th><th>Total</th><th>Konfirmasi</th><th></th></tr></thead>',
      '<tbody id="pembayaranTbody"><tr><td colspan="8" class="text-center py-4">Memuat...</td></tr></tbody>',
      '</table>',
      '</div>'
    ].join(''));
    loadAdminPembayaran();
}

/**
 * Ambil Pesanan BESERTA rincian itemnya sekaligus dalam SATU permintaan,
 * memakai fitur nested-select PostgREST (pesanan_items(*)) - jauh lebih
 * rapi dibanding sistem lama yang harus parsing teks gabungan manual.
 */
function loadAdminPembayaran() {
    const cached = ambilDariCache('adminPembayaranList');
    if (cached) { adminPembayaranCache = cached; renderPembayaranFilterTabs('Semua'); return; }
    dbSelect('pesanan', { select: '*, pesanan_items(*)', order: 'created_at', ascending: false }).then(function(res) {
        adminPembayaranCache = res.success ? res.data : [];
        if (!res.success) showToast('Error', res.message, 'danger');
        simpanKeCache('adminPembayaranList', adminPembayaranCache);
        renderPembayaranFilterTabs('Semua');
    });
}
function renderPembayaranFilterTabs(active) {
    const counts = {
        Semua: adminPembayaranCache.length,
        'Sudah Bayar': adminPembayaranCache.filter(function(p) { return p.status_bayar === 'Sudah Bayar'; }).length,
        'Belum Bayar': adminPembayaranCache.filter(function(p) { return p.status_bayar !== 'Sudah Bayar'; }).length
    };
    const tabs = ['Semua', 'Sudah Bayar', 'Belum Bayar'];
    document.getElementById('pembayaranFilterTabs').innerHTML = tabs.map(function(t) {
        return '<button class="chip chip-solid ' + (t === active ? 'active' : '') + '" onclick="renderPembayaranFilterTabs(\'' + t + '\')">' + t + ' (' + counts[t] + ')</button>';
    }).join('');
    let items = adminPembayaranCache;
    if (active === 'Sudah Bayar') items = adminPembayaranCache.filter(function(p) { return p.status_bayar === 'Sudah Bayar'; });
    if (active === 'Belum Bayar') items = adminPembayaranCache.filter(function(p) { return p.status_bayar !== 'Sudah Bayar'; });
    renderPembayaranTable(items);
}
function renderPembayaranTable(items) {
    const tbody = document.getElementById('pembayaranTbody');
    if (!items || !items.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4" style="color:var(--text-muted)">Belum ada pesanan.</td></tr>';
        return;
    }
    const rowsHtml = [];
    items.forEach(function(p) {
        try {
            const pesananItems = p.pesanan_items || [];
            const produkStr = pesananItems.map(function(it) { return it.nama_produk + (it.warna ? ' [' + it.warna + ']' : '') + ' x' + it.qty + (it.satuan || ''); }).join('; ') || '-';
            const umkmSet = [...new Set(pesananItems.map(function(it) { return it.nama_umkm; }).filter(Boolean))];
            const umkmStr = umkmSet.join(', ') || '-';
            const tanggal = p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
            const statusBayar = p.status_bayar === 'Sudah Bayar' ? 'Sudah Bayar' : 'Belum Bayar';
            const idSafe = String(p.id || '');
            const totalNum = Number(p.total_estimasi) || 0;
            rowsHtml.push([
              '<tr>',
              '<td>' + escapeHtml(umkmStr) + '</td>',
              '<td style="max-width:220px; white-space:normal;">' + escapeHtml(produkStr) + '</td>',
              '<td class="whitespace-nowrap">' + tanggal + '</td>',
              '<td>' + escapeHtml(String(p.nama_pemesan || '')) + '</td>',
              '<td class="whitespace-nowrap">' + escapeHtml(String(p.no_hp || '')) + '</td>',
              '<td class="whitespace-nowrap">' + formatRupiah(totalNum) + " <button class='btn-icon-sm' onclick='openEditNominalPesanan(" + JSON.stringify(idSafe) + ',' + totalNum + ")' title='Edit nominal'><i class='bi bi-pencil'></i></button></td>",
              "<td><span class='status-pill " + (statusBayar === 'Sudah Bayar' ? 'aktif' : 'nonaktif') + "' style='cursor:pointer;' onclick='toggleStatusBayar(" + JSON.stringify(idSafe) + ',' + JSON.stringify(statusBayar) + ")'>" + statusBayar + '</span></td>',
              "<td><button class='btn-icon-sm' onclick='confirmDeleteRecord(" + JSON.stringify('pesanan') + ',' + JSON.stringify(idSafe) + ", loadAdminPembayaran)'><i class='bi bi-trash text-red-500'></i></button></td>",
              '</tr>'
            ].join(''));
        } catch (err) {
            console.error('Gagal render 1 baris pesanan:', err, p);
        }
    });
    tbody.innerHTML = rowsHtml.length ? rowsHtml.join('') : '<tr><td colspan="8" class="text-center py-4">Data ada tapi gagal ditampilkan. Cek Console.</td></tr>';
}
function toggleStatusBayar(id, currentStatus) {
    const newStatus = currentStatus === 'Sudah Bayar' ? 'Belum Bayar' : 'Sudah Bayar';
    dbUpdate('pesanan', id, { status_bayar: newStatus }).then(function(res) {
        if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }
        AppState.cache = {};
        showToast('Berhasil', 'Status pembayaran diperbarui.', 'success');
        loadAdminPembayaran();
    });
}
function openEditNominalPesanan(id, currentTotal) {
    document.getElementById('previewModalTitle').textContent = 'Edit Nominal Pesanan';
    document.getElementById('previewModalContent').innerHTML = [
      '<form onsubmit="submitEditNominalPesanan(event)" class="text-left">',
      '<input type="hidden" id="epId" value="', id, '">',
      '<div class="form-group"><label class="form-label">Total Estimasi (Rp)</label><input class="form-input" type="number" id="epNominal" required value="', currentTotal, '"></div>',
      '<button type="submit" class="btn-primary w-full" style="height:42px;"><i class="bi bi-check-lg"></i> Simpan</button>',
      '</form>'
    ].join('');
    openModal('previewModal');
}
function submitEditNominalPesanan(e) {
    e.preventDefault();
    const id = document.getElementById('epId').value;
    const nominal = Number(document.getElementById('epNominal').value) || 0;
    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = '<span class="spinner-inline"></span> Menyimpan...';
    btn.disabled = true;
    dbUpdate('pesanan', id, { total_estimasi: nominal }).then(function(res) {
        btn.disabled = false;
        if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }
        AppState.cache = {};
        showToast('Berhasil', 'Nominal diperbarui.', 'success');
        closeModal('previewModal');
        loadAdminPembayaran();
    });
}
