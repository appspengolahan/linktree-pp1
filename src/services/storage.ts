import { LinkItem, GasConfig, StatistikData, Role, StaffMember, DEFAULT_STAFF_PIN, BannerConfig, CompanyUser } from '../types';
import { INITIAL_LINKS, INITIAL_STATISTIK } from './defaultData';

const CACHE_KEY_LINKS = 'bkr_linkhub_cache_v3';
const CACHE_KEY_STATS = 'bkr_linkhub_stats_v3';
const CACHE_KEY_CONFIG = 'bkr_gas_config';
const CACHE_KEY_ROLE = 'bkr_user_role';
const CACHE_KEY_SIDEBAR = 'bkr_sidebar_collapsed';
const CACHE_KEY_VISIT_DATE = 'bkr_last_visit_date_v3';
const CACHE_KEY_STAFF_LIST = 'bkr_staff_list_v2';
const CACHE_KEY_ACTIVE_STAFF = 'bkr_active_staff_session';
const CACHE_KEY_BANNER = 'bkr_banner_config_v1';
const CACHE_KEY_COMPANY_USER = 'bkr_company_auth_user_v1';
const CACHE_KEY_DELETED_IDS = 'bkr_deleted_link_ids_v2';
const CACHE_KEY_DELETED_LABELS = 'bkr_deleted_link_labels_v2';

// Data Staf Awal Berdasarkan Unit Operasional
export const INITIAL_STAFF_LIST: StaffMember[] = [
  {
    id: 'STF-DEV',
    nama: 'Lead Developer / Engineer',
    jabatan: 'Developer',
    email: 'divisi1.bkr@gmail.com',
    pin: DEFAULT_STAFF_PIN,
    unit: 'DevOps & Engineering',
    allowedLinkIds: ['*'],
    aktif: true,
  },
  {
    id: 'STF-ENG',
    nama: 'Lalu Mahendra',
    jabatan: 'Site Engineer',
    email: 'lalu.engineer@batukarang.co.id',
    pin: DEFAULT_STAFF_PIN,
    unit: 'Divisi Produksi I',
    allowedLinkIds: ['*'],
    aktif: true,
  },
  {
    id: 'STF-MGR',
    nama: 'Manajer Operasional',
    jabatan: 'Manajer operasional',
    email: 'manajer.ops@batukarang.co.id',
    pin: DEFAULT_STAFF_PIN,
    unit: 'Manajemen Operasional',
    allowedLinkIds: ['*'],
    aktif: true,
  },
  {
    id: 'STF-01',
    nama: 'Budi Santoso',
    jabatan: 'Supervisor QC & Laboratorium',
    email: 'budi.qc@batukarang.co.id',
    pin: DEFAULT_STAFF_PIN, // 123456
    unit: 'Kendali Mutu (QC)',
    allowedLinkIds: ['GRP-03', 'LNK-09', 'LNK-10', 'LNK-11'],
    aktif: true,
  },
  {
    id: 'STF-02',
    nama: 'Agus Prasetyo',
    jabatan: 'Koordinator Lini & Mesin',
    email: 'agus.lini@batukarang.co.id',
    pin: DEFAULT_STAFF_PIN,
    unit: 'Operasional & Lini',
    allowedLinkIds: ['GRP-01', 'LNK-01', 'LNK-02', 'LNK-03', 'LNK-04'],
    aktif: true,
  },
  {
    id: 'STF-03',
    nama: 'Rian Kurniawan',
    jabatan: 'Kepala Regu Shift & Ritase',
    email: 'rian.shift@batukarang.co.id',
    pin: DEFAULT_STAFF_PIN,
    unit: 'Formulir & Shift',
    allowedLinkIds: ['GRP-02', 'LNK-05', 'LNK-06', 'LNK-07', 'LNK-08'],
    aktif: true,
  },
  {
    id: 'STF-04',
    nama: 'Dewi Kartika',
    jabatan: 'Koordinator K3LH & Keselamatan',
    email: 'dewi.k3@batukarang.co.id',
    pin: DEFAULT_STAFF_PIN,
    unit: 'K3LH & SOP',
    allowedLinkIds: ['GRP-04', 'LNK-12', 'LNK-13', 'LNK-14'],
    aktif: true,
  },
  {
    id: 'STF-05',
    nama: 'Hendra Saputra',
    jabatan: 'Admin Gudang & Monitoring Stock',
    email: 'hendra.stock@batukarang.co.id',
    pin: DEFAULT_STAFF_PIN,
    unit: 'Kontak & Database',
    allowedLinkIds: ['LNK-PIN-01', 'LNK-01', 'LNK-08', 'LNK-15'],
    aktif: true,
  },
];

// ------------------------------------------------------------
// STAF & PIN MANAGEMENT
// ------------------------------------------------------------

export function getStoredStaffList(): StaffMember[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY_STAFF_LIST);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let updated = false;
        if (!parsed.some((s) => s.jabatan === 'Manajer operasional')) {
          parsed.splice(2, 0, INITIAL_STAFF_LIST[2]);
          updated = true;
        }
        if (updated) {
          localStorage.setItem(CACHE_KEY_STAFF_LIST, JSON.stringify(parsed));
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Gagal membaca data staf:', e);
  }
  localStorage.setItem(CACHE_KEY_STAFF_LIST, JSON.stringify(INITIAL_STAFF_LIST));
  return INITIAL_STAFF_LIST;
}

export function saveStoredStaffList(staffList: StaffMember[]): void {
  localStorage.setItem(CACHE_KEY_STAFF_LIST, JSON.stringify(staffList));
}

// Sesi Staf yang Sedang Login
export function getActiveStaffSession(): StaffMember | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY_ACTIVE_STAFF) || localStorage.getItem(CACHE_KEY_ACTIVE_STAFF);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Gagal membaca sesi staf aktif:', e);
  }
  return null;
}

export function setActiveStaffSession(staff: StaffMember | null): void {
  if (staff) {
    const serialized = JSON.stringify(staff);
    sessionStorage.setItem(CACHE_KEY_ACTIVE_STAFF, serialized);
    localStorage.setItem(CACHE_KEY_ACTIVE_STAFF, serialized);
  } else {
    sessionStorage.removeItem(CACHE_KEY_ACTIVE_STAFF);
    localStorage.removeItem(CACHE_KEY_ACTIVE_STAFF);
  }
}

// Autentikasi Staf via Email / ID dan PIN
export function authenticateStaff(
  identifier: string,
  pin: string
): { success: boolean; staff?: StaffMember; message: string } {
  const staffList = getStoredStaffList();
  const found = staffList.find(
    (s) =>
      (s.email.toLowerCase() === identifier.toLowerCase().trim() || s.id === identifier || s.nama.toLowerCase() === identifier.toLowerCase().trim()) &&
      s.aktif
  );

  if (!found) {
    return { success: false, message: 'Akun staf tidak ditemukan atau berstatus nonaktif.' };
  }

  if (String(found.pin).trim() !== String(pin).trim()) {
    return { success: false, message: 'PIN yang Anda masukkan salah.' };
  }

  // Update last login
  found.terakhirLogin = new Date().toISOString();
  saveStoredStaffList(staffList);
  setActiveStaffSession(found);

  return { success: true, staff: found, message: `Selamat datang, ${found.nama}!` };
}

// Ganti PIN Mandiri oleh Staf
export function changeStaffPin(
  staffId: string,
  oldPin: string,
  newPin: string
): { success: boolean; message: string } {
  if (!newPin || newPin.trim().length < 4) {
    return { success: false, message: 'PIN baru minimal harus 4 digit angka.' };
  }

  const staffList = getStoredStaffList();
  const staff = staffList.find((s) => s.id === staffId);
  if (!staff) {
    return { success: false, message: 'Data staf tidak ditemukan.' };
  }

  if (String(staff.pin).trim() !== String(oldPin).trim()) {
    return { success: false, message: 'PIN lama Anda tidak cocok.' };
  }

  staff.pin = newPin.trim();
  saveStoredStaffList(staffList);

  // Update session jika staf yang sama sedang aktif
  const active = getActiveStaffSession();
  if (active && active.id === staffId) {
    active.pin = newPin.trim();
    setActiveStaffSession(active);
  }

  return { success: true, message: 'PIN Anda berhasil diperbarui.' };
}

// Reset PIN oleh Developer / Super Admin
export function resetStaffPinByAdmin(
  staffId: string,
  customNewPin?: string
): { success: boolean; newPin: string; message: string } {
  const targetPin = (customNewPin && customNewPin.trim()) || DEFAULT_STAFF_PIN;
  const staffList = getStoredStaffList();
  const staff = staffList.find((s) => s.id === staffId);

  if (!staff) {
    return { success: false, newPin: '', message: 'Data staf tidak ditemukan.' };
  }

  staff.pin = targetPin;
  saveStoredStaffList(staffList);

  // Update session jika staf yang sama sedang aktif
  const active = getActiveStaffSession();
  if (active && active.id === staffId) {
    active.pin = targetPin;
    setActiveStaffSession(active);
  }

  return {
    success: true,
    newPin: targetPin,
    message: `PIN untuk ${staff.nama} berhasil direset ke: ${targetPin}`,
  };
}

// Reset Semua PIN Staf ke Standar oleh Developer
export function resetAllStaffPinsToDefault(): { success: boolean; count: number; message: string } {
  const staffList = getStoredStaffList();
  staffList.forEach((s) => {
    s.pin = DEFAULT_STAFF_PIN;
  });
  saveStoredStaffList(staffList);

  const active = getActiveStaffSession();
  if (active) {
    active.pin = DEFAULT_STAFF_PIN;
    setActiveStaffSession(active);
  }

  return {
    success: true,
    count: staffList.length,
    message: `Seluruh akun staf (${staffList.length} orang) berhasil direset ke PIN standar: ${DEFAULT_STAFF_PIN}`,
  };
}

// Simpan atau Edit Staf oleh Admin
export function saveOrUpdateStaff(staffData: Partial<StaffMember>): { success: boolean; staff: StaffMember } {
  const staffList = getStoredStaffList();
  const id = staffData.id || `STF-${Date.now().toString().slice(-4)}`;

  const toSave: StaffMember = {
    id,
    nama: (staffData.nama || '').trim(),
    jabatan: (staffData.jabatan || '').trim(),
    email: (staffData.email || '').trim().toLowerCase(),
    pin: (staffData.pin && staffData.pin.trim()) || DEFAULT_STAFF_PIN,
    unit: staffData.unit || 'Operasional & Lini',
    allowedLinkIds: Array.isArray(staffData.allowedLinkIds) ? staffData.allowedLinkIds : [],
    aktif: staffData.aktif !== undefined ? staffData.aktif : true,
  };

  const idx = staffList.findIndex((s) => s.id === id);
  if (idx !== -1) {
    staffList[idx] = toSave;
  } else {
    staffList.push(toSave);
  }

  saveStoredStaffList(staffList);
  return { success: true, staff: toSave };
}

// Hapus Staf oleh Admin
export function deleteStoredStaff(id: string): { success: boolean } {
  const staffList = getStoredStaffList();
  const remaining = staffList.filter((s) => s.id !== id);
  saveStoredStaffList(remaining);

  const active = getActiveStaffSession();
  if (active && active.id === id) {
    setActiveStaffSession(null);
  }

  return { success: true };
}

// Cek Apakah Staf Memiliki Izin Mengedit Link Tertentu
export function canStaffEditLink(staff: StaffMember | null, linkId: string, linkItem?: LinkItem): boolean {
  if (!staff || !staff.aktif) return false;

  // 1. Akses Penuh Mutlak (Full Access): Developer, Site Engineer, Manajer operasional, atau wildcard '*'
  const jab = (staff.jabatan || '').toLowerCase().trim();
  if (
    staff.allowedLinkIds.includes('*') ||
    jab === 'developer' ||
    jab === 'site engineer' ||
    jab === 'manajer operasional'
  ) {
    return true;
  }

  // 2. Cek apakah linkItem secara eksplisit memuat ID staf ini di allowedStaffIds
  if (linkItem && Array.isArray(linkItem.allowedStaffIds) && linkItem.allowedStaffIds.includes(staff.id)) {
    return true;
  }

  // 3. Cek apakah allowedLinkIds milik staf memuat linkId ini langsung
  if (Array.isArray(staff.allowedLinkIds) && staff.allowedLinkIds.includes(linkId)) {
    return true;
  }

  // 4. Jika linkItem memiliki parentId (berada dalam grup) dan staf diberi akses ke grup induk tersebut
  if (linkItem && linkItem.parentId && Array.isArray(staff.allowedLinkIds) && staff.allowedLinkIds.includes(linkItem.parentId)) {
    return true;
  }

  // 5. Periksa jika linkItem belum disediakan tapi tersimpan di database lokal
  try {
    const allStored = getStoredLinks();
    const current = linkItem || allStored.find((l) => l.id === linkId);
    if (current) {
      if (Array.isArray(current.allowedStaffIds) && current.allowedStaffIds.includes(staff.id)) {
        return true;
      }
      if (current.parentId && Array.isArray(staff.allowedLinkIds) && staff.allowedLinkIds.includes(current.parentId)) {
        return true;
      }
    }
  } catch {
    // fallback
  }

  return false;
}

// Perbarui Tautan Khusus Oleh Staf (Hanya untuk link yang diizinkan)
export function updateLinkByStaff(
  linkId: string,
  updates: { url?: string; deskripsi?: string; aktif?: boolean; label?: string },
  staff: StaffMember
): { success: boolean; message: string; updatedLink?: LinkItem } {
  const links = getStoredLinks();
  const target = links.find((l) => l.id === linkId);
  if (!target) {
    return { success: false, message: 'Tautan tidak ditemukan.' };
  }

  if (!canStaffEditLink(staff, linkId, target)) {
    return { success: false, message: 'Anda tidak memiliki hak wewenang untuk mengedit tautan ini.' };
  }

  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (updates.url !== undefined && target.tipe !== 'Grup') {
    target.url = updates.url.trim();
  }
  if (updates.label !== undefined) {
    target.label = updates.label.trim();
  }
  if (updates.deskripsi !== undefined) {
    target.deskripsi = updates.deskripsi.trim();
  }
  if (updates.aktif !== undefined) {
    target.aktif = updates.aktif;
  }
  target.terakhirUpdate = timeStr;
  target.picName = staff.nama;

  saveStoredLinks(links);
  return { success: true, message: `Tautan "${target.label}" berhasil diperbarui oleh ${staff.nama}.`, updatedLink: target };
}

// ------------------------------------------------------------
// GENERAL APP CONFIG & LINKS
// ------------------------------------------------------------

export const PRODUCTION_GAS_URL = 'https://script.google.com/macros/s/AKfycbyJUOR2Tfxwazv2wdOLCSqAUNu6P4GSLLNVZy8E6Ps-oQ_skI8yRxvmLdu5FJ7TAUMKsQ/exec';

export function getGasConfig(): GasConfig {
  let defaultUrl = PRODUCTION_GAS_URL;
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GAS_URL) {
      defaultUrl = String(import.meta.env.VITE_GAS_URL).trim() || PRODUCTION_GAS_URL;
    }
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem(CACHE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.webAppUrl) {
        parsed.webAppUrl = defaultUrl;
      }
      return parsed;
    }
  } catch (e) {
    console.error('Gagal membaca GAS config:', e);
  }
  return {
    webAppUrl: defaultUrl,
    adminPasscode: 'bkr153',
    autoSync: true,
    syncIntervalMinutes: 5,
    syncStatus: 'online',
  };
}

export function saveGasConfig(config: GasConfig): void {
  localStorage.setItem(CACHE_KEY_CONFIG, JSON.stringify(config));
}

export function getSidebarCollapsed(): boolean {
  return localStorage.getItem(CACHE_KEY_SIDEBAR) === 'true';
}

export function saveSidebarCollapsed(collapsed: boolean): void {
  localStorage.setItem(CACHE_KEY_SIDEBAR, collapsed ? 'true' : 'false');
}

export function getUserRole(): Role {
  const role = localStorage.getItem(CACHE_KEY_ROLE) as Role;
  if (role && ['Developer', 'Site Engineer', 'Project Manager', 'Manajer operasional', 'Admin'].includes(role)) {
    return role;
  }
  return 'Site Engineer';
}

export function saveUserRole(role: Role): void {
  localStorage.setItem(CACHE_KEY_ROLE, role);
}

// ------------------------------------------------------------
// BLACKLIST / TOMBSTONE UNTUK TWO-WAY SYNC (Mencegah Link Terhapus Muncul Kembali)
// ------------------------------------------------------------

export function getDeletedLinkIds(): string[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY_DELETED_IDS);
    const parsed: string[] = raw ? JSON.parse(raw) : [];
    // Pastikan LNK-08 (Permintaan Penarikan Bahan Baku Silo) selalu ada di daftar hapus
    if (!parsed.includes('LNK-08')) {
      parsed.push('LNK-08');
    }
    return parsed;
  } catch {
    return ['LNK-08'];
  }
}

export function getDeletedLinkLabels(): string[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY_DELETED_LABELS);
    const parsed: string[] = raw ? JSON.parse(raw) : [];
    const target = 'permintaan penarikan bahan baku silo';
    if (!parsed.includes(target)) {
      parsed.push(target);
    }
    return parsed;
  } catch {
    return ['permintaan penarikan bahan baku silo'];
  }
}

export function addDeletedLinkRecord(id: string, label?: string): void {
  try {
    const ids = getDeletedLinkIds();
    if (id && !ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(CACHE_KEY_DELETED_IDS, JSON.stringify(ids));
    }
    if (label && label.trim()) {
      const labels = getDeletedLinkLabels();
      const norm = label.trim().toLowerCase();
      if (!labels.includes(norm)) {
        labels.push(norm);
        localStorage.setItem(CACHE_KEY_DELETED_LABELS, JSON.stringify(labels));
      }
    }
  } catch (e) {
    console.error('Gagal mencatat link yang dihapus:', e);
  }
}

// ------------------------------------------------------------
// COMPANY USER AUTHENTICATION GATE (Sesi Login Satu Kali di Local Cache)
// ------------------------------------------------------------

export function getAuthenticatedCompanyUser(): CompanyUser | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY_COMPANY_USER);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.nama && parsed.email) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Gagal membaca data sesi login perusahaan:', e);
  }
  return null;
}

export function saveAuthenticatedCompanyUser(user: CompanyUser): void {
  try {
    localStorage.setItem(CACHE_KEY_COMPANY_USER, JSON.stringify(user));
  } catch (e) {
    console.error('Gagal menyimpan sesi login perusahaan:', e);
  }
}

export function clearAuthenticatedCompanyUser(): void {
  try {
    localStorage.removeItem(CACHE_KEY_COMPANY_USER);
    localStorage.removeItem(CACHE_KEY_ACTIVE_STAFF);
    sessionStorage.removeItem(CACHE_KEY_ACTIVE_STAFF);
  } catch (e) {
    console.error('Gagal menghapus sesi login:', e);
  }
}

// ------------------------------------------------------------
// NORMALISASI & MANIPULASI LINK
// ------------------------------------------------------------

export function normalizeAndFlattenLinks(rawLinks: LinkItem[]): LinkItem[] {
  if (!Array.isArray(rawLinks)) return [];
  const flat: LinkItem[] = [];
  const seenIds = new Set<string>();

  const deletedIds = new Set(getDeletedLinkIds());
  const deletedLabels = new Set(getDeletedLinkLabels());

  const isDeleted = (item: LinkItem) => {
    if (!item) return true;
    if (item.id && deletedIds.has(item.id)) return true;
    if (item.label && deletedLabels.has(item.label.trim().toLowerCase())) return true;
    return false;
  };

  for (const item of rawLinks) {
    if (!item || !item.id || isDeleted(item)) continue;
    const { children, ...parentProps } = item;
    if (!seenIds.has(item.id)) {
      flat.push({
        ...parentProps,
        parentId: parentProps.parentId || '',
        tipe: parentProps.tipe || 'Link',
        allowedStaffIds: parentProps.allowedStaffIds || [],
      } as LinkItem);
      seenIds.add(item.id);
    }
    if (children && Array.isArray(children)) {
      for (const child of children) {
        if (child && child.id && !seenIds.has(child.id) && !isDeleted(child)) {
          flat.push({
            ...child,
            parentId: child.parentId || item.id,
            tipe: 'Link',
            allowedStaffIds: child.allowedStaffIds || [],
          });
          seenIds.add(child.id);
        }
      }
    }
  }
  return flat;
}


export function getStoredLinks(): LinkItem[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY_LINKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeAndFlattenLinks(parsed);
      }
    }
  } catch (e) {
    console.error('Gagal membaca cache link:', e);
  }

  const initial = normalizeAndFlattenLinks(INITIAL_LINKS);
  localStorage.setItem(CACHE_KEY_LINKS, JSON.stringify(initial));
  return initial;
}

export function saveStoredLinks(links: LinkItem[]): void {
  const normalized = normalizeAndFlattenLinks(links);
  localStorage.setItem(CACHE_KEY_LINKS, JSON.stringify(normalized));
}

export function getStoredStats(): StatistikData {
  try {
    const raw = localStorage.getItem(CACHE_KEY_STATS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Gagal membaca cache stats:', e);
  }
  localStorage.setItem(CACHE_KEY_STATS, JSON.stringify(INITIAL_STATISTIK));
  return INITIAL_STATISTIK;
}

export function saveStoredStats(stats: StatistikData): void {
  localStorage.setItem(CACHE_KEY_STATS, JSON.stringify(stats));
}

// Reset data statistik (kunjungan & klik) ke kondisi 0 bersih
export function resetAllStatistics(): StatistikData {
  const cleanStats: StatistikData = {
    totalKunjungan: 0,
    kunjunganHariIni: 0,
    totalKlik: 0,
    totalLinkAktif: getStoredLinks().filter((l) => String(l.aktif).toUpperCase() === 'TRUE').length,
    trend14Hari: [],
    topLinks: [],
  };
  saveStoredStats(cleanStats);
  localStorage.removeItem(CACHE_KEY_VISIT_DATE);

  // Reset juga jumlah klik pada seluruh link
  const cleanLinks = getStoredLinks().map((l) => ({ ...l, klik: 0 }));
  saveStoredLinks(cleanLinks);

  return cleanStats;
}

// Reset daftar tautan ke konfigurasi awal tanpa link dummy
export function resetAllLinksToDefault(): LinkItem[] {
  localStorage.setItem(CACHE_KEY_LINKS, JSON.stringify(INITIAL_LINKS));
  return INITIAL_LINKS;
}

// Factory Reset menyeluruh (Statistik 0 + Links Bersih)
export function factoryResetAll(): { links: LinkItem[]; stats: StatistikData } {
  localStorage.removeItem(CACHE_KEY_LINKS);
  localStorage.removeItem(CACHE_KEY_STATS);
  localStorage.removeItem(CACHE_KEY_VISIT_DATE);

  const cleanLinks = INITIAL_LINKS.map((l) => ({ ...l, klik: 0 }));
  const cleanStats: StatistikData = {
    totalKunjungan: 0,
    kunjunganHariIni: 0,
    totalKlik: 0,
    totalLinkAktif: cleanLinks.filter((l) => l.aktif && l.tipe !== 'Grup').length,
    trend14Hari: [],
    topLinks: [],
  };

  saveStoredLinks(cleanLinks);
  saveStoredStats(cleanStats);
  return { links: cleanLinks, stats: cleanStats };
}

export function recordLocalVisit(): void {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const lastVisit = localStorage.getItem(CACHE_KEY_VISIT_DATE);
    const stats = getStoredStats();

    stats.totalKunjungan += 1;

    if (lastVisit === today) {
      stats.kunjunganHariIni += 1;
    } else {
      stats.kunjunganHariIni = 1;
      localStorage.setItem(CACHE_KEY_VISIT_DATE, today);
    }

    const existingIndex = stats.trend14Hari.findIndex((t) => t.tanggal === today);
    if (existingIndex !== -1) {
      stats.trend14Hari[existingIndex].jumlah += 1;
    } else {
      stats.trend14Hari.push({ tanggal: today, jumlah: 1 });
      if (stats.trend14Hari.length > 14) {
        stats.trend14Hari.shift();
      }
    }

    saveStoredStats(stats);
  } catch (e) {
    console.error('Gagal mencatat visit lokal:', e);
  }
}

export function recordLocalClick(id: string): void {
  try {
    const links = getStoredLinks();
    let clickedItem: LinkItem | null = null;

    const updated = links.map((l) => {
      if (l.id === id) {
        const newCount = (l.klik || 0) + 1;
        clickedItem = { ...l, klik: newCount };
        return clickedItem;
      }
      return l;
    });

    saveStoredLinks(updated);

    const stats = getStoredStats();
    stats.totalKlik += 1;

    if (clickedItem) {
      const topIdx = stats.topLinks.findIndex((t) => t.label === (clickedItem as LinkItem).label);
      if (topIdx !== -1) {
        stats.topLinks[topIdx].klik = (clickedItem as LinkItem).klik;
      } else {
        stats.topLinks.push({
          label: (clickedItem as LinkItem).label,
          klik: (clickedItem as LinkItem).klik,
          tipe: (clickedItem as LinkItem).tipe,
        });
      }
      stats.topLinks.sort((a, b) => b.klik - a.klik);
      stats.topLinks = stats.topLinks.slice(0, 5);
    }

    saveStoredStats(stats);
  } catch (e) {
    console.error('Gagal mencatat klik lokal:', e);
  }
}

export function saveOrUpdateLink(link: Partial<LinkItem>): { success: boolean; id: string } {
  const links = getStoredLinks();
  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const isGroup = link.tipe === 'Grup';
  const prefix = isGroup ? 'GRP' : 'LNK';
  const newId = link.id || `${prefix}-${Date.now().toString().slice(-6)}`;

  const existingIdx = links.findIndex((l) => l.id === newId);

  const itemToSave: LinkItem = {
    id: newId,
    label: (link.label || '').trim(),
    url: isGroup ? '' : (link.url || '').trim(),
    icon: (link.icon || (isGroup ? '🗂️' : '🔗')).trim(),
    kategori: isGroup ? 'Operasional & Lini' : (link.kategori || 'Operasional & Lini'),
    deskripsi: (link.deskripsi || '').trim(),
    urutan: Number(link.urutan) || (links.length + 1) * 10,
    aktif: link.aktif !== undefined ? link.aktif : true,
    pinned: isGroup ? false : (link.pinned !== undefined ? link.pinned : false),
    klik: link.klik || 0,
    terakhirUpdate: timeStr,
    tipe: isGroup ? 'Grup' : 'Link',
    parentId: isGroup ? '' : (link.parentId || ''),
    picName: link.picName || '',
    allowedStaffIds: Array.isArray(link.allowedStaffIds)
      ? link.allowedStaffIds
      : existingIdx !== -1
      ? links[existingIdx].allowedStaffIds || []
      : [],
  };

  if (existingIdx !== -1) {
    itemToSave.klik = links[existingIdx].klik;
    links[existingIdx] = itemToSave;
  } else {
    links.push(itemToSave);
  }

  saveStoredLinks(links);

  // Sinkronisasi otomatis ke daftar staf (Staff Member allowedLinkIds)
  if (Array.isArray(link.allowedStaffIds)) {
    try {
      const staffList = getStoredStaffList();
      let staffUpdated = false;
      staffList.forEach((st) => {
        if (st.allowedLinkIds.includes('*')) return;
        const shouldHave = link.allowedStaffIds!.includes(st.id);
        const currentlyHas = st.allowedLinkIds.includes(newId);
        if (shouldHave && !currentlyHas) {
          st.allowedLinkIds.push(newId);
          staffUpdated = true;
        } else if (!shouldHave && currentlyHas) {
          st.allowedLinkIds = st.allowedLinkIds.filter((id) => id !== newId);
          staffUpdated = true;
        }
      });
      if (staffUpdated) {
        saveStoredStaffList(staffList);
      }
    } catch (e) {
      console.error('Gagal sinkronisasi hak staf:', e);
    }
  }

  const stats = getStoredStats();
  stats.totalLinkAktif = links.filter((l) => String(l.aktif).toUpperCase() === 'TRUE' && l.tipe !== 'Grup').length;
  saveStoredStats(stats);

  return { success: true, id: newId };
}

// Atur Hak Akses Staf Khusus untuk Suatu Tautan
export function setLinkStaffPermissions(linkId: string, staffIds: string[]): { success: boolean; message: string } {
  const links = getStoredLinks();
  const link = links.find((l) => l.id === linkId);
  if (!link) return { success: false, message: 'Tautan tidak ditemukan.' };

  link.allowedStaffIds = staffIds;
  saveStoredLinks(links);

  // Sinkronkan ke staffList
  try {
    const staffList = getStoredStaffList();
    staffList.forEach((st) => {
      if (st.allowedLinkIds.includes('*')) return;
      const shouldHave = staffIds.includes(st.id);
      const currentlyHas = st.allowedLinkIds.includes(linkId);
      if (shouldHave && !currentlyHas) {
        st.allowedLinkIds.push(linkId);
      } else if (!shouldHave && currentlyHas) {
        st.allowedLinkIds = st.allowedLinkIds.filter((id) => id !== linkId);
      }
    });
    saveStoredStaffList(staffList);
  } catch (e) {
    console.error('Gagal sinkronisasi hak staf:', e);
  }

  return { success: true, message: `Hak akses staf untuk "${link.label}" berhasil diperbarui.` };
}

// Toggle Cepat Status Ditampilkan / Disembunyikan (Aktif / Nonaktif)
export function toggleLinkVisibility(id: string): { success: boolean; newStatus: boolean; label: string } {
  const links = getStoredLinks();
  const target = links.find((l) => l.id === id);
  if (!target) {
    return { success: false, newStatus: false, label: '' };
  }

  const currentStatus = String(target.aktif).toUpperCase() === 'TRUE';
  const nextStatus = !currentStatus;
  target.aktif = nextStatus;

  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  target.terakhirUpdate = timeStr;

  saveStoredLinks(links);

  const stats = getStoredStats();
  stats.totalLinkAktif = links.filter((l) => String(l.aktif).toUpperCase() === 'TRUE' && l.tipe !== 'Grup').length;
  saveStoredStats(stats);

  return { success: true, newStatus: nextStatus, label: target.label };
}

export function deleteStoredLink(id: string, label?: string): { success: boolean; deletedCount: number } {
  const links = getStoredLinks();
  const target = links.find((l) => l.id === id);

  if (!target) return { success: false, deletedCount: 0 };

  const targetLabel = label || target.label;
  addDeletedLinkRecord(id, targetLabel);

  // Jika item adalah grup, catat juga semua id dan label anak yang ikut terhapus
  if (target.tipe === 'Grup') {
    const children = links.filter((l) => l.parentId === id);
    children.forEach((c) => {
      addDeletedLinkRecord(c.id, c.label);
    });
  }

  const remaining = links.filter((l) => l.id !== id && l.parentId !== id);
  const deletedCount = links.length - remaining.length;

  saveStoredLinks(remaining);

  const stats = getStoredStats();
  stats.totalLinkAktif = remaining.filter((l) => String(l.aktif).toUpperCase() === 'TRUE' && l.tipe !== 'Grup').length;
  saveStoredStats(stats);

  return { success: true, deletedCount };
}

export function reorderStoredLinks(orderedIds: string[]): boolean {
  const links = getStoredLinks();
  orderedIds.forEach((id, index) => {
    const found = links.find((l) => l.id === id);
    if (found) {
      found.urutan = (index + 1) * 10;
    }
  });

  saveStoredLinks(links);
  return true;
}

export const DEFAULT_BANNER_CONFIG: BannerConfig = {
  badge: 'PT. BATU KARANG — 153',
  title: 'Divisi Produksi I',
  description: 'Semua tautan penting Divisi Produksi I PT Batu Karang ada di sini — formulir shift, SOP pabrik, kendali mutu (QC), dan kontak resmi.',
};

export function getStoredBannerConfig(): BannerConfig {
  try {
    const raw = localStorage.getItem(CACHE_KEY_BANNER);
    if (!raw) return DEFAULT_BANNER_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      badge: parsed.badge || DEFAULT_BANNER_CONFIG.badge,
      title: parsed.title || DEFAULT_BANNER_CONFIG.title,
      description: parsed.description !== undefined ? parsed.description : DEFAULT_BANNER_CONFIG.description,
    };
  } catch {
    return DEFAULT_BANNER_CONFIG;
  }
}

export function saveStoredBannerConfig(config: BannerConfig): void {
  try {
    localStorage.setItem(CACHE_KEY_BANNER, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save banner config:', e);
  }
}

export function resetToFactoryDefault(): void {
  saveStoredLinks(INITIAL_LINKS);
  saveStoredStats(INITIAL_STATISTIK);
  saveStoredStaffList(INITIAL_STAFF_LIST);
  saveStoredBannerConfig(DEFAULT_BANNER_CONFIG);
  setActiveStaffSession(null);
}

