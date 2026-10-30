# Rencana Implementasi: Pencatatan User Login, Frekuensi Akses & Riwayat Tautan (Selesai)

Pengembangan fitur audit trail dan pelacakan akses pengguna untuk Divisi Produksi I PT Batu Karang telah selesai diimplementasikan. Mencakup pencatatan login otomatis tanpa duplikasi email, penambahan counter frekuensi akses per pengguna, serta visualisasi riwayat tautan yang diakses pada Dashboard Manajemen dan Google Spreadsheet.

---

## 1. Analisis Kebutuhan & Rekomendasi Arsitektur

### A. Pencatatan User Login Tanpa Duplikasi (Upsert Logika)
* **Kebutuhan**: Setiap nama & email yang dimasukkan saat login di portal tersimpan secara otomatis. Jika email yang sama login kembali di waktu mendatang, jangan menambahkan baris baru, melainkan perbarui data yang ada.
* **Solusi**: 
  * Di sisi aplikasi: Menggunakan struktur data `UserAccessRecord` dengan kunci unik `email` (case-insensitive).
  * Di Google Spreadsheet: Menambahkan/menginisialisasi tab terpisah bernama **`User_Akses`**. Script mencocokkan kolom Email. Jika ditemukan, sistem memperbarui kolom *Terakhir Akses* dan menambah *Total Akses*. Jika belum ada, sistem menambahkan baris baru.

### B. Penghitungan Jumlah Akses / Frekuensi Login Pengguna
* **Kebutuhan**: Mengetahui berapa kali masing-masing staf/karyawan mengakses portal link.
* **Solusi**: Setiap kali proses otentikasi login berhasil di `CompanyLoginGate`, counter `totalAkses` bertambah (`totalAkses + 1`) dan kolom `terakhirAkses` diperbarui dengan waktu terkini (*timestamp*).

### C. Riwayat Kunjungan & Link yang Diakses (Audit Trail)
* **Kebutuhan**: Mengetahui siapa yang mengakses link apa dan kapan waktu aksesnya.
* **Solusi**: 
  * Menyimpan log riwayat aktivitas lokal (`ActivityLogEntry`) berisi: Waktu akses, Nama Pengguna, Email, Tipe Aksi (*Login*, *Klik Link*), Judul Tautan, dan URL.
  * Mengirimkan data aktivitas ke Google Spreadsheet tab **`Log_Aktivitas`** secara *asynchronous* (tidak mengganggu kecepatan buka link).
  * Menampilkan tabel riwayat aktivitas yang interaktif, dapat dicari, dan difilter pada Tab **Statistik & Analitik** di Dashboard Manajemen.

---

## 2. Struktur Data & Skema

### A. TypeScript Interface (`src/types/index.ts`)
```typescript
export interface UserAccessRecord {
  id: string;
  email: string;
  nama: string;
  jabatan?: string;
  peran?: string;
  pertamaKaliLogin: string; // DD/MM/YYYY HH:mm
  pertamaLogin?: string;
  terakhirAkses: string;    // DD/MM/YYYY HH:mm
  totalAkses: number;       // Counter frekuensi login
  status: 'Aktif' | 'Nonaktif';
}

export interface ActivityLogEntry {
  id: string;
  timestamp: number;
  waktuStr: string;        // DD/MM/YYYY HH:mm:ss
  userEmail: string;
  userName: string;
  actionType: 'LOGIN' | 'KLIK_LINK' | 'BUKA_GRUP';
  targetLabel: string;     // Judul link atau grup
  targetUrl?: string;
  targetId?: string;
}
```

### B. Struktur Tab Google Spreadsheet
1. **Tab `User_Akses`**:
   | A: Email | B: Nama Pengguna | C: Peran | D: Total Akses | E: Pertama Login | F: Terakhir Akses | G: Status |
2. **Tab `Log_Aktivitas`**:
   | A: Waktu | B: Email | C: Nama Pengguna | D: Aksi | E: Target Tautan / Fitur | F: URL |

---

## 3. Implementasi Kode Sumber yang Dijalankan

- [x] **Tahap 1: Pengelolaan Penyimpanan Lokal (`src/services/storage.ts`)**:
  - `getStoredUserAccessList()`, `recordUserLoginAccess()`, `getStoredActivityLogs()`, `recordActivityLog()`, `clearStoredActivityLogs()`.
- [x] **Tahap 2: Sinkronisasi Google Apps Script (`src/services/gasApi.ts`)**:
  - `postGasRecordUserLogin()`, `postGasRecordActivity()`, dan pembaruan `generateProductionCodeGs()` untuk tab `User_Akses` dan `Log_Aktivitas`.
- [x] **Tahap 3: Integrasi Titik Pemicu (*Event Triggers*)**:
  - `CompanyLoginGate.tsx` memicu pencatatan login dan audit login.
  - `App.tsx` memicu pencatatan audit klik tautan dengan user aktif.
- [x] **Tahap 4: Antarmuka Dashboard Manajemen (`src/components/ManagementDashboard.tsx`)**:
  - 4 Kartu Metrik Utama (Total Kunjungan, Kunjungan Hari Ini, Pengguna Terdaftar, Total Frekuensi Login).
  - Tabel Direktori Pengguna & Frekuensi Akses (pencarian, pengurutan, export CSV).
  - Tabel Riwayat Kunjungan & Link yang Diakses / Audit Trail (filter jenis aksi, pencarian real-time, bersihkan log).
- [x] **Tahap 5: Verifikasi & Kompilasi**:
  - `tsc --noEmit` lulus bersih tanpa galat.
  - `npm run build` sukses 100%.
