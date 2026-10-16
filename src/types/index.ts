/**
 * Definisi Tipe Data Utama
 * PT Batu Karang - Divisi Produksi I
 */

export type Role = 'Project Manager' | 'Site Engineer' | 'Manajer operasional' | 'Admin';

export const DEFAULT_STAFF_PIN = '123456';

export interface StaffMember {
  id: string; // misal: STF-01
  nama: string;
  jabatan: string;
  email: string;
  pin: string; // PIN akses staf (default: 123456, bisa diganti staf sendiri)
  unit: string;
  allowedLinkIds: string[]; // Daftar ID link/grup yang berhak diedit oleh staf ini
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
