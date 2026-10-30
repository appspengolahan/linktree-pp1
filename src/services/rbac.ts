import { Role, RolePermission, LinkItem } from '../types';

export const ROLE_PERMISSIONS: Record<Role, RolePermission> = {
  Developer: {
    role: 'Developer',
    title: 'Developer / DevOps Lead',
    icon: '💻',
    badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    deskripsi: 'Akses penuh tanpa batas: debug teknis, bypass otentikasi staf, edit semua tautan/grup, integrasi GAS, dan navigasi peran instan.',
    canViewAllLinks: true,
    canEditLinks: true,
    canAccessGasCenter: true,
    canViewAnalytics: true,
    canConfigureRoles: true,
    priorityCategories: ['Operasional & Lini', 'Formulir & Shift', 'Kendali Mutu (QC)', 'K3LH & SOP', 'Kontak & Database'],
  },
  'Site Engineer': {
    role: 'Site Engineer',
    title: 'Site Engineer (Full Access)',
    icon: '👷',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    deskripsi: 'Akses penuh tanpa batas: pengawasan teknis lini mesin, edit link & formulir shift, kendali mutu QC, integrasi GAS, dan koordinasi lapangan.',
    canViewAllLinks: true,
    canEditLinks: true,
    canAccessGasCenter: true,
    canViewAnalytics: true,
    canConfigureRoles: true,
    priorityCategories: ['Operasional & Lini', 'Formulir & Shift', 'Kendali Mutu (QC)', 'K3LH & SOP', 'Kontak & Database'],
  },
  'Project Manager': {
    role: 'Project Manager',
    title: 'Project Manager Produksi',
    icon: '📋',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    deskripsi: 'Akses penuh operasional: monitoring stock persediaan bahan baku (tembakau, cengkeh, blend), edit direktori link & formulir, dan koordinasi PIC.',
    canViewAllLinks: true,
    canEditLinks: true,
    canAccessGasCenter: true,
    canViewAnalytics: true,
    canConfigureRoles: true,
    priorityCategories: ['Operasional & Lini', 'Formulir & Shift', 'Kendali Mutu (QC)', 'K3LH & SOP', 'Kontak & Database'],
  },
  'Manajer operasional': {
    role: 'Manajer operasional',
    title: 'Manajer Operasional Pabrik',
    icon: '🏭',
    badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    deskripsi: 'Akses supervisi & edit menyeluruh: evaluasi efisiensi OEE, rekapitulasi ritase harian, kepatuhan K3LH, dan manajemen link.',
    canViewAllLinks: true,
    canEditLinks: true,
    canAccessGasCenter: true,
    canViewAnalytics: true,
    canConfigureRoles: true,
    priorityCategories: ['Operasional & Lini', 'Formulir & Shift', 'Kendali Mutu (QC)', 'K3LH & SOP', 'Kontak & Database'],
  },
  Admin: {
    role: 'Admin',
    title: 'Admin Unit / Staf PIC Terdaftar',
    icon: '⚙️',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    deskripsi: 'Akses terarah: hanya dapat mengedit dan memperbarui tautan/grup yang secara resmi diberikan wewenang pada pengaturan.',
    canViewAllLinks: true,
    canEditLinks: false, // Hanya tautan wewenang sendiri
    canAccessGasCenter: false,
    canViewAnalytics: true,
    canConfigureRoles: false,
    priorityCategories: ['Operasional & Lini', 'Formulir & Shift', 'Kendali Mutu (QC)', 'K3LH & SOP', 'Kontak & Database'],
  },
};

export function hasFullAccessRole(role?: Role | string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase().trim();
  return (
    r === 'developer' ||
    r === 'site engineer' ||
    r === 'manajer operasional'
  );
}

export function isLinkRelevantForRole(link: LinkItem, role: Role): boolean {
  if (hasFullAccessRole(role)) return true;
  const perm = ROLE_PERMISSIONS[role];
  if (!perm) return true;

  // Jika link punya targetRoles eksplisit
  if (link.targetRoles && link.targetRoles.length > 0) {
    return link.targetRoles.includes(role);
  }

  // Jika tidak, cocokkan dengan kategori prioritas peran
  return perm.priorityCategories.includes(link.kategori);
}
