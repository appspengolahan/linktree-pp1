/**
 * Definisi Tipe Data Utama
 * PT Batu Karang - Divisi Produksi I
 */

export type Role = 'Developer' | 'Site Engineer' | 'Project Manager' | 'Manajer operasional' | 'Admin';

export const DEFAULT_STAFF_PIN = '123456';

export type StaffFeatureKey =
  | 'manage_staff'       // 👥 Kelola Hak Akses Staf & PIN
  | 'sync_sheets'        // ☁️ Sinkronisasi Google Sheets & Cadangan JSON
  | 'create_links'       // ➕ Tambah Tautan & Grup Baru
  | 'delete_links'       // 🗑️ Hapus Tautan & Grup
  | 'assign_pic'         // 👤 Atur Penugasan Staf PIC Tautan
  | 'view_analytics';    // 📊 Statistik & Analitik Kunjungan

export interface StaffFeatureDefinition {
  key: StaffFeatureKey;
  label: string;
  deskripsi: string;
  icon: string;
  kategori: string;
}

export const SYSTEM_FEATURES: StaffFeatureDefinition[] = [
  {
    key: 'manage_staff',
    label: 'Kelola Hak Akses Staf & PIN',
    deskripsi: 'Melihat tab staf, menambah/mengedit akun staf lain, reset PIN staf',
    icon: '👥',
    kategori: 'Administrasi',
  },
  {
    key: 'sync_sheets',
    label: 'Sinkronisasi Google Sheets & Backup',
    deskripsi: 'Melihat tab sinkronisasi spreadsheet, push data masal, dan cadangan JSON',
    icon: '☁️',
    kategori: 'Integrasi',
  },
  {
    key: 'create_links',
    label: 'Tambah Tautan & Grup Baru',
    deskripsi: 'Menambahkan link langsung, grup, atau sub-link baru ke direktori',
    icon: '➕',
    kategori: 'Manajemen Konten',
  },
  {
    key: 'delete_links',
    label: 'Hapus Tautan & Grup',
    deskripsi: 'Menghapus tautan atau grup dari direktori dan spreadsheet',
    icon: '🗑️',
    kategori: 'Manajemen Konten',
  },
  {
    key: 'assign_pic',
    label: 'Atur Penugasan Staf PIC Tautan',
    deskripsi: 'Mengatur staf yang berhak menjadi penanggung jawab pengisian tautan',
    icon: '👤',
    kategori: 'Administrasi',
  },
  {
    key: 'view_analytics',
    label: 'Statistik & Analitik Kunjungan',
    deskripsi: 'Melihat tab analitik, grafik kunjungan harian, dan ringkasan metrik',
    icon: '📊',
    kategori: 'Laporan',
  },
];

export interface StaffMember {
  id: string; // misal: STF-01
  nama: string;
  jabatan: string;
  email: string;
  pin: string; // PIN akses staf (default: 123456, bisa diganti staf sendiri)
  unit: string;
  allowedLinkIds: string[]; // Kategori 1: Daftar ID link/grup yang berhak diedit
  allowedFeatures?: StaffFeatureKey[]; // Kategori 2: Fitur yang boleh diakses (disembunyikan jika tidak ada izin)
  aktif: boolean;
  terakhirLogin?: string;
}

export interface RolePermission {
  role: Role;
  title: string;
  icon: string;
  badgeColor: string;
  deskripsi: string;
  canViewAllLinks: boolean;
  canEditLinks: boolean;
  canAccessGasCenter: boolean;
  canViewAnalytics: boolean;
  canConfigureRoles: boolean;
  priorityCategories: string[];
}

export interface LinkItem {
  id: string;
  label: string;
  url: string;
  icon?: string;
  kategori: string;
  deskripsi: string;
  urutan: number;
  aktif: boolean | string;
  pinned: boolean | string;
  klik: number;
  terakhirUpdate?: string;
  tipe: 'Link' | 'Grup';
  parentId?: string;
  children?: LinkItem[];
  targetRoles?: Role[];
  picName?: string; // Nama PIC penanggung jawab unit
  allowedStaffIds?: string[]; // Daftar ID staf yang berhak mengedit tautan ini
}

export interface GasConfig {
  webAppUrl: string;
  adminPasscode: string;
  autoSync: boolean;
  syncIntervalMinutes: number;
  lastSyncTimestamp?: number;
  syncStatus: 'online' | 'cached' | 'syncing' | 'error';
  lastPingMs?: number;
  errorMessage?: string;
}

export interface DayStat {
  tanggal: string; // yyyy-MM-dd
  jumlah: number;
}

export interface TopLinkStat {
  label: string;
  klik: number;
  tipe?: string;
}

export interface StatistikData {
  totalKunjungan: number;
  kunjunganHariIni: number;
  totalKlik: number;
  totalLinkAktif: number;
  trend14Hari: DayStat[];
  topLinks: TopLinkStat[];
}

export interface CategoryFilter {
  id: string;
  label: string;
  iconName?: string;
}

export interface BannerConfig {
  badge: string;
  title: string;
  description: string;
}

export interface CompanyUser {
  nama: string;
  email: string;
  jabatan: string;
  unit: string;
  role?: Role;
  staffId?: string;
  loginAt: string;
}

