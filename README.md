# Panduan Instalasi PortoUMKM (Arsitektur Baru)

PortoUMKM sekarang terdiri dari **2 bagian terpisah**:
1. **Backend** — Google Apps Script (GAS), berfungsi sebagai REST API murni (JSON). Menyimpan data di Google Sheets & Drive seperti sebelumnya.
2. **Frontend** — file statis (HTML/CSS/JS) yang di-hosting gratis di **GitHub Pages**.

Kedua bagian ini **wajib dipasang berurutan**: Backend dulu (untuk mendapatkan URL API), baru Frontend (yang butuh URL itu untuk bisa terhubung).

---

## BAGIAN A — Pasang Backend (Google Apps Script)

### A1. Buat/pakai project Apps Script
Kalau Anda **sudah punya** project Apps Script PortoUMKM lama:
1. Buka project itu di [script.google.com](https://script.google.com)
2. **Hapus semua file HTML** yang ada (Index, Stylesheet, JSPart1-9) — file-file ini **tidak dipakai lagi** di arsitektur baru
3. Buka `Kode.gs`, hapus semua isinya, ganti dengan isi `Kode.gs` yang baru (file terpisah yang sudah diberikan)

Kalau **mulai dari nol**:
1. Buka [script.google.com](https://script.google.com) → **New project**
2. Hapus isi `Code.gs` bawaan, ganti namanya jadi `Kode.gs` (klik titik tiga di sebelah nama file → Rename)
3. Tempel isi `Kode.gs` yang diberikan

### A2. Jalankan setup awal (hanya sekali)
1. Di editor Apps Script, pilih fungsi **`setupAppEnvironment`** dari dropdown di toolbar atas
2. Klik **Run** (▶)
3. Kalau muncul minta izin akses, klik **Review permissions** → pilih akun Google Anda → **Advanced** → **Go to (nama project) (unsafe)** → **Allow**
4. Cek log (View → Logs atau Ctrl+Enter) — harus muncul `[OK] Setup selesai!` beserta link Spreadsheet

> Kalau ini **instalasi lama yang di-upgrade**, jalankan juga fungsi **`migrateV2`** setelah `setupAppEnvironment`, supaya kolom/sheet baru otomatis ditambahkan tanpa menghapus data lama.

### A3. Deploy sebagai Web App
1. Klik **Deploy** (kanan atas) → **New deployment**
2. Klik ikon gerigi ⚙️ di samping "Select type" → pilih **Web app**
3. Isi:
   - **Description**: bebas, misal `PortoUMKM API v2`
   - **Execute as**: **Me**
   - **Who has access**: **Anyone**
4. Klik **Deploy**
5. **Salin URL yang muncul** (formatnya seperti `https://script.google.com/macros/s/AKfycb.../exec`) — URL ini akan dipakai di frontend

> ⚠️ **Penting**: URL ini berakhiran `/exec`, BUKAN `/dev`. Kalau nanti Anda membuat deployment baru (bukan edit versi), URL-nya akan berbeda — pastikan selalu pakai URL yang aktif.

### A4. Uji backend langsung dari browser
Buka URL yang tadi disalin, tambahkan di belakangnya: `?action=getKategoriStruktur`

Contoh: `https://script.google.com/macros/s/AKfycb.../exec?action=getKategoriStruktur`

Kalau berhasil, browser akan menampilkan teks JSON seperti:
```json
{"success":true,"data":{"PortoRasa":{...},...},"message":"OK"}
```
Kalau muncul ini, **backend sudah siap**. Lanjut ke Bagian B.

---

## BAGIAN B — Pasang Frontend (GitHub Pages)

Frontend ada di dalam **1 file ZIP terpisah** yang diberikan bersama panduan ini. Ekstrak dulu ZIP tersebut ke sebuah folder di komputer Anda (misal `Documents/portoumkm-frontend`).

### B1. Isi `js/config.js` dengan URL backend
Sebelum di-upload, buka file `js/config.js` di dalam folder hasil ekstrak, pakai Notepad atau editor teks apa saja. Ganti baris:
```js
const GAS_API_URL = 'PASTE_URL_WEB_APP_GAS_ANDA_DI_SINI';
```
menjadi (pakai URL dari langkah A3 tadi):
```js
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
```
Simpan file.

### B2. Ikuti langkah-langkah standar deploy ke GitHub Pages
Mulai dari sini, ikuti alur skill **github-pages-deploy-guide** secara berurutan:

1. **Cek/install Git** — pastikan `git --version` bisa dijalankan di terminal
2. **Buat akun GitHub** kalau belum punya
3. **Setup identitas Git** (`git config --global user.name` dan `user.email`)
4. **Buat repository baru** di github.com — pilih **Public**, jangan centang README/.gitignore
5. **Masuk ke folder hasil ekstrak ZIP** — folder inilah yang **langsung** jadi folder kerja `git init` (isinya harus langsung `index.html`, `css/`, `js/`, `assets/` — bukan dibungkus folder lain lagi):
   ```bash
   cd "path/ke/folder/hasil-ekstrak"
   ```
   Verifikasi dengan `dir` (PowerShell) atau `ls -la` (Mac/Linux/Git Bash) — pastikan `index.html` langsung terlihat di situ.
6. **Inisialisasi & push**:
   ```bash
   git init
   git add .
   git commit -m "Upload pertama - PortoUMKM"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git push -u origin main
   ```
   Kalau diminta login, gunakan **Personal Access Token** (bukan password akun) — lihat skill github-pages-deploy-guide bagian "Tahap 6g" kalau butuh cara membuatnya.
7. **Aktifkan GitHub Pages**: di repo → **Settings** → **Pages** → Source: **Deploy from a branch**, Branch: **main** + **/ (root)** → **Save**
8. Tunggu 1-2 menit, buka `https://USERNAME.github.io/NAMA-REPO/`

### B3. Uji aplikasi
Buka situs yang sudah online. Coba:
- Beranda tampil dengan produk (kalau masih kosong, itu wajar karena Sheet Produk masih data contoh — isi lewat Admin)
- Login Admin (klik ikon kunci di navbar) — user default: `admin` / `admin123` (**segera ganti password ini lewat Sheet `Users` di Spreadsheet Anda**)
- Coba tambah 1 produk baru dari Admin, cek apakah muncul di katalog

Kalau ada error, buka **Console browser** (F12 → tab Console) dan screenshot pesan errornya untuk didiagnosis.

---

## Update di Kemudian Hari

**Backend** (`Kode.gs`): edit langsung di editor Apps Script → **Deploy → Manage deployments → ikon pensil → Version: New version → Deploy**. URL `/exec` tetap sama, tidak perlu update `config.js` lagi.

**Frontend**: edit file di folder lokal, lalu dari folder yang sama:
```bash
git add .
git commit -m "Deskripsi perubahan"
git push
```
GitHub Pages otomatis rebuild dalam 1-2 menit. Kalau tampilan masih versi lama, tekan **Ctrl+Shift+R** (hard refresh).

---

## Catatan Keamanan

- Aksi Admin (tambah/edit/hapus data, lihat statistik, dll) sekarang **wajib token sesi valid** yang dicek ulang oleh backend di setiap request — bukan lagi otomatis aman karena "hanya dipanggil dari dalam GAS" seperti arsitektur lama.
- **Segera ganti password default** (`admin`/`admin123`) langsung di Sheet `Users` pada Spreadsheet `DB_PortoUMKM`.
- URL backend (`GAS_API_URL`) bersifat publik (siapa saja yang tahu URL-nya bisa mengakses aksi PUBLIK seperti lihat katalog) — ini normal dan diperlukan agar frontend bisa mengambil data. Aksi ADMIN tetap terlindungi token.
