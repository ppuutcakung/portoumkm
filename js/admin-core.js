/**
 * ============================================================
 * PortoUMKM - Admin: Login, Logout, Dashboard, Hapus Generik
 * ============================================================
 */
function renderAdminLoginPage() {
    const container = document.getElementById('app-container');
    container.innerHTML = '\n    <div class="login-wrap">\n      <div class="login-card">\n        <div class="text-center mb-4">\n          <i class="bi bi-shield-lock" style="font-size:34px; color:var(--primary);"></i>\n          <h2 class="text-lg font-extrabold mt-2" style="color:var(--text-primary)">Portal Super Admin</h2>\n          <p class="text-xs" style="color:var(--text-muted)">PIC Pemasaran PortoUMKM</p>\n        </div>\n        <form id="loginForm" onsubmit="handleAdminLogin(event)">\n          <div class="form-group">\n            <label class="form-label">Username</label>\n            <input class="form-input" id="loginUsername" required autocomplete="username">\n          </div>\n          <div class="form-group">\n            <label class="form-label">Password</label>\n            <input class="form-input" id="loginPassword" type="password" required autocomplete="current-password">\n          </div>\n          <button type="submit" class="btn-primary w-full" style="height:44px;"><i class="bi bi-box-arrow-in-right"></i> Masuk</button>\n        </form>\n        <button class="btn-ghost w-full mt-3" onclick="navigateTo(\'home\')"><i class="bi bi-arrow-left"></i> Kembali ke Katalog Publik</button>\n      </div>\n    </div>\n  ';
}
function handleAdminLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = e.target.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-inline"></span> Memproses...';
    btn.disabled = true;
    apiPost('doLogin', { username: username, password: password }).then(function(res) {
        btn.innerHTML = original;
        btn.disabled = false;
        if (!res.success) {
            showToast('Gagal', res.message, 'danger');
            return;
        }
        AppState.sessionToken = res.data.token;
        AppState.adminNama = res.data.nama;
        showToast('Selamat Datang', 'Halo, ' + res.data.nama + '!', 'success');
        navigateTo('adminDashboard', { noHistory: true });
    });
}
function handleAdminLogout() {
    apiGet('doLogout').then(function() {
        AppState.sessionToken = null;
        AppState.adminNama = null;
        navigateTo('home', { noHistory: true });
    });
}
// Wrapper untuk halaman admin: judul + tabbar konsisten dengan referensi desain
function adminPageShell(activeLabel, contentHtml) {
    return ('\n    <div class="page-wrap-fluid">\n      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">\n        <div>\n          <div class="text-xs font-bold" style="color:var(--primary)"><i class="bi bi-shield-check"></i> PORTAL SUPER ADMIN</div>\n          <h1 class="text-lg md:text-xl font-extrabold" style="color:var(--text-primary)">' + (activeLabel) + '</h1>\n        </div>\n        <span class="status-pill aktif"><i class="bi bi-circle-fill" style="font-size:6px;"></i> Aktif - Sesi Aman</span>\n      </div>\n      ' + (contentHtml) + '\n    </div>\n  ');
}

// -------------------- DASHBOARD --------------------
let dashboardChart = null;
function renderAdminDashboardPage() {
    const container = document.getElementById('app-container');
    container.innerHTML = adminPageShell('Ringkasan &amp; Statistik Pesanan', '\n    <div id="dashboardKpiWrap" class="grid gap-3 mb-4" style="grid-template-columns:repeat(2,1fr);"></div>\n    <div class="grid gap-4" style="grid-template-columns:1fr;" id="dashboardChartWrap">\n      <div class="card p-4">\n        <h3 class="font-bold mb-3" style="color:var(--text-primary)">Distribusi Produk per Kategori</h3>\n        <canvas id="chartKategori" height="220"></canvas>\n      </div>\n      <div class="card p-4">\n        <h3 class="font-bold mb-3" style="color:var(--text-primary)"><i class="bi bi-graph-up"></i> Rekap Akses Aplikasi per Bulan</h3>\n        <div class="table-wrap"><table class="data-table" style="background:#fff;"><thead><tr><th style="background:#fff; color:#000; border-bottom:2px solid var(--border-color);">Bulan</th><th style="background:#fff; color:#000; border-bottom:2px solid var(--border-color);">Jumlah Akses</th></tr></thead><tbody id="aksesBulananTbody" style="color:#000;"><tr><td colspan="2" class="text-center py-3">Memuat...</td></tr></tbody></table></div>\n      </div>\n    </div>\n  ');
    if (window.innerWidth >= 992) {
        document.getElementById('dashboardKpiWrap').style.gridTemplateColumns = 'repeat(4,1fr)';
        document.getElementById('dashboardChartWrap').style.gridTemplateColumns = '1.4fr 1fr';
    }
    loadDashboardData();
}

function loadDashboardData() {
    apiGet('getDashboardData').then(function(res) {
        if (!res.success) {
            showToast('Error', res.message, 'danger');
            return;
        }
        const d = res.data;
        document.getElementById('dashboardKpiWrap').innerHTML = ('\n        <div class="stat-card"><div class="stat-value">' + (d.totalProduk) + '</div><div class="stat-label">TOTAL PRODUK AKTIF</div></div>\n        <div class="stat-card"><div class="stat-value">' + (d.totalPesanan) + '</div><div class="stat-label">TOTAL PESANAN TERCATAT</div></div>\n        <div class="stat-card"><div class="stat-value">' + (Object.keys(d.kategoriCounts).length) + '</div><div class="stat-label">KATEGORI AKTIF</div></div>\n        <div class="stat-card"><div class="stat-value">' + (d.topProduk.length ? d.topProduk[0][1] : 0) + '</div><div class="stat-label">PESANAN PRODUK TERLARIS</div></div>\n      ');
        renderKategoriChart(d.kategoriCounts);
    });
    apiGet('getAksesBulanan').then(function(res) {
        if (res.success) renderAksesTable(res.data);
    });
}
function renderAksesTable(rows) {
    const tbody = document.getElementById('aksesBulananTbody');
    if (!tbody) return;
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="2" class="text-center py-3" style="color:var(--text-muted)">Belum ada data akses tercatat.</td></tr>';
        return;
    }
    const bulanNama = { '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April', '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus', '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember' };
    const rowsDesc = rows.slice().reverse();
    tbody.innerHTML = rowsDesc.map(function(r) {
        const parts = r.bulanTahun.split('-');
        const label = (bulanNama[parts[1]] || parts[1]) + ' ' + parts[0];
        return '<tr><td>' + label + '</td><td>' + r.jumlah + ' kali</td></tr>';
    }).join('');
}
function renderKategoriChart(kategoriCounts) {
    const ctx = document.getElementById('chartKategori');
    if (!ctx)
        return;
    if (dashboardChart)
        dashboardChart.destroy();
    dashboardChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(kategoriCounts).map(k => KATEGORI_LABEL[k] || k),
            datasets: [{ data: Object.values(kategoriCounts), backgroundColor: ['#8c2f3a', '#a83c49', '#c97b85', '#e8aeb4'], borderWidth: 0 }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}

// -------------------- HAPUS GENERIK (dipakai semua modul Admin) --------------------
let pendingDelete = null;
function confirmDeleteRecord(sheetName, id, onDoneCallback) {
    pendingDelete = { sheetName, id, onDoneCallback };
    openModal('deleteModal');
}
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
        if (!pendingDelete)
            return;
        const { sheetName, id, onDoneCallback } = pendingDelete;
        apiPost('deleteRecord', { sheetName: sheetName, id: id }).then(function(res) {
            closeModal('deleteModal');
            if (res.success) {
                AppState.cache = {}; // data berubah - bersihkan cache supaya tampilan customer tidak nyangkut data lama
                showToast('Berhasil', res.message, 'success');
                if (onDoneCallback)
                    onDoneCallback();
            }
            else
                showToast('Gagal', res.message, 'danger');
        });
    });
});
