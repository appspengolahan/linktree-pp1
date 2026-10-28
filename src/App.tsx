import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  CheckCircle,
  UserCheck,
  KeyRound,
  ChevronDown,
  Database,
  ArrowRight,
  Pin,
  Edit3,
  Share2,
  Eye,
  Lock,
  FolderPlus,
  ListPlus,
} from 'lucide-react';

import { LinkItem, Role, GasConfig, StatistikData, StaffMember, BannerConfig, DEFAULT_STAFF_PIN } from './types';
import {
  getStoredLinks,
  getStoredStats,
  getGasConfig,
  saveGasConfig,
  getUserRole,
  saveUserRole,
  recordLocalVisit,
  recordLocalClick,
  getActiveStaffSession,
  setActiveStaffSession,
  getStoredBannerConfig,
  saveStoredBannerConfig,
  saveStoredLinks,
  normalizeAndFlattenLinks,
  canStaffEditLink,
} from './services/storage';
import { fetchGasLinks, postGasRecordClick } from './services/gasApi';
import { isLinkRelevantForRole, hasFullAccessRole } from './services/rbac';

import { LinkCard } from './components/LinkCard';
import { GroupCard } from './components/GroupCard';
import { RoleNavToggle } from './components/RoleNavToggle';
import { AdminModal } from './components/AdminModal';
import { GasCenterModal } from './components/GasCenterModal';
import { RbacModal } from './components/RbacModal';
import { StaffAuthModal } from './components/StaffAuthModal';
import { StaffEditLinkModal } from './components/StaffEditLinkModal';
import { EditBannerModal } from './components/EditBannerModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  // Core State
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [stats, setStats] = useState<StatistikData>(getStoredStats());
  const [gasConfig, setGasConfig] = useState<GasConfig>(getGasConfig());
  const [currentRole, setCurrentRole] = useState<Role>(getUserRole());

  // Staff Authentication & Scoped Edit State
  const [activeStaff, setActiveStaff] = useState<StaffMember | null>(getActiveStaffSession());
  const [isStaffAuthModalOpen, setIsStaffAuthModalOpen] = useState<boolean>(false);
  const [staffEditingTarget, setStaffEditingTarget] = useState<LinkItem | null>(null);

  // RBAC State
  const [isRbacModalOpen, setIsRbacModalOpen] = useState<boolean>(false);
  const [filterByRoleOnly, setFilterByRoleOnly] = useState<boolean>(() => {
    return localStorage.getItem('bkr_filter_role_only') === 'true';
  });

  // UI Interactive State
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [bannerConfig, setBannerConfig] = useState<BannerConfig>(getStoredBannerConfig());
  const [isEditBannerOpen, setIsEditBannerOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [adminInitialTab, setAdminInitialTab] = useState<'stats' | 'links' | 'staff'>('stats');
  const [isGasCenterOpen, setIsGasCenterOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mode Publik Bersih (URL param: ?mode=public atau ?view=clean)
  const [isPublicMode, setIsPublicMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'public' || params.get('view') === 'clean' || params.get('public') === 'true';
  });
  const [showRoleNav, setShowRoleNav] = useState<boolean>(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const togglePublicMode = () => {
    setIsPublicMode((prev) => {
      const next = !prev;
      const url = new URL(window.location.href);
      if (next) {
        url.searchParams.set('mode', 'public');
      } else {
        url.searchParams.delete('mode');
        url.searchParams.delete('view');
        url.searchParams.delete('public');
      }
      window.history.replaceState({}, '', url.toString());
      showToast(next ? 'Beralih ke Pratinjau Tampilan Publik Bersih' : 'Kembali ke Mode Kelola Internal');
      return next;
    });
  };

  const handleCopyPublicLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'public');
    navigator.clipboard.writeText(url.toString());
    showToast('Tautan Publik Bersih berhasil disalin! Siap dibagikan.');
  };

  // Inisialisasi: Load data instan dari LocalStorage (0.01s first paint) & catat visit
  useEffect(() => {
    const cachedLinks = getStoredLinks();
    setLinks(cachedLinks);
    setStats(getStoredStats());

    // Catat kunjungan harian
    recordLocalVisit();

    // Periksa apakah URL membawa parameter ?gas= untuk auto-connect database antar-device
    let config = getGasConfig();
    try {
      const params = new URLSearchParams(window.location.search);
      const gasParam = params.get('gas');
      if (gasParam) {
        const decoded = decodeURIComponent(gasParam).trim();
        config = {
          ...config,
          webAppUrl: decoded,
          syncStatus: 'online',
          lastSyncTimestamp: Date.now(),
        };
        saveGasConfig(config);
        setGasConfig(config);
      }
    } catch {
      // ignore
    }

    // Background Sync ke Google Spreadsheet
    if (config.webAppUrl) {
      silentBackgroundSync(config);
    }
  }, []);

  const silentBackgroundSync = async (cfg: GasConfig) => {
    try {
      const res = await fetchGasLinks(cfg.webAppUrl);
      if (res.success && res.links && res.links.length > 0) {
        const flat = normalizeAndFlattenLinks(res.links);
        setLinks(flat);
        saveStoredLinks(flat); // Simpan ke cache lokal agar device lain langsung memiliki data terbaru
        setGasConfig((prev) => {
          const updated: GasConfig = {
            ...prev,
            syncStatus: 'online',
            lastSyncTimestamp: Date.now(),
          };
          saveGasConfig(updated);
          return updated;
        });
      }
    } catch (e) {
      console.log('Silent sync background note:', e);
    }
  };

  const isFullAccess = hasFullAccessRole(currentRole);

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);
    saveUserRole(role);
    const isRoleFull = hasFullAccessRole(role);
    showToast(isRoleFull ? `⚡ Peran ${role} Aktif (Akses Penuh)` : `Beralih ke hak akses: ${role}`);
    if (role === 'Admin') {
      setAdminInitialTab('links');
      setIsAdminOpen(true);
    }
  };

  const handleToggleFilterByRole = (val: boolean) => {
    setFilterByRoleOnly(val);
    localStorage.setItem('bkr_filter_role_only', val ? 'true' : 'false');
    showToast(val ? `Filter prioritas ${currentRole} diaktifkan` : 'Menampilkan seluruh tautan direktori');
  };

  const handleInitiateEdit = (target: LinkItem) => {
    if (!activeStaff && isFullAccess) {
      // Auto-assign sesi peran berwenang tanpa perlu memasukkan PIN
      const autoStaff: StaffMember = {
        id: `STF-${currentRole.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4)}`,
        nama:
          currentRole === 'Developer'
            ? 'Lead Developer / Engineer'
            : currentRole === 'Site Engineer'
            ? 'Lalu Mahendra (Site Engineer)'
            : `${currentRole} (Full Access)`,
        jabatan: currentRole,
        email: 'divisi1.bkr@gmail.com',
        pin: DEFAULT_STAFF_PIN,
        unit: 'Divisi Produksi I',
        allowedLinkIds: ['*'],
        aktif: true,
      };
      setActiveStaff(autoStaff);
      setActiveStaffSession(autoStaff);
    }
    setStaffEditingTarget(target);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (gasConfig.webAppUrl) {
      showToast('Menghubungi Google Apps Script...');
      const res = await fetchGasLinks(gasConfig.webAppUrl);
      if (res.success && res.links) {
        const flat = normalizeAndFlattenLinks(res.links);
        setLinks(flat);
        saveStoredLinks(flat);
        showToast('Data berhasil diperbarui dari Google Sheets!');
      } else {
        const local = getStoredLinks();
        setLinks(local);
        showToast('Data lokal berhasil dimuat ulang.');
      }
    } else {
      const local = getStoredLinks();
      setLinks(local);
      showToast('Cache lokal 0.01 detik berhasil dimuat ulang.');
    }

    setStats(getStoredStats());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleClickLink = (id: string) => {
    recordLocalClick(id);
    if (gasConfig.webAppUrl) {
      postGasRecordClick(gasConfig.webAppUrl, id);
    }
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, klik: (l.klik || 0) + 1 } : l))
    );
  };

  const handleStaffLogout = () => {
    setActiveStaffSession(null);
    setActiveStaff(null);
    showToast('Sesi staf telah ditutup.');
  };

  const handleUpdateBanner = (newCfg: BannerConfig) => {
    saveStoredBannerConfig(newCfg);
    setBannerConfig(newCfg);
  };

  const categories = [
    'Semua',
    'Operasional & Lini',
    'Formulir & Shift',
    'Kendali Mutu (QC)',
    'K3LH & SOP',
    'Kontak & Database',
  ];

  const structuredLinks = useMemo(() => {
    const isFullAccess = !isPublicMode && hasFullAccessRole(currentRole);
    const activeStaffAllowedIds = activeStaff ? activeStaff.allowedLinkIds || [] : [];
    const flatAll = normalizeAndFlattenLinks(links);

    // Tautan yang tampil:
    // 1. Publik HANYA melihat tautan & grup dengan aktif === TRUE
    // 2. Developer/Engineer/Project Manager/Admin (Full Access) melihat seluruh tautan
    // 3. Staf yang sedang login dapat melihat tautan miliknya
    const visibleLinks = flatAll.filter((l) => {
      const isAktif = String(l.aktif).toUpperCase() === 'TRUE';
      if (isPublicMode) {
        return isAktif;
      }
      if (isAktif) return true;
      if (isFullAccess) return true;
      if (activeStaffAllowedIds.includes(l.id)) return true;
      if (l.tipe === 'Grup') {
        const hasAuthorizedChild = flatAll.some(
          (c) => c.parentId === l.id && (isFullAccess || activeStaffAllowedIds.includes(c.id))
        );
        if (hasAuthorizedChild) return true;
      }
      return false;
    });

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = (item: LinkItem) => {
      if (!query) return true;
      return (
        item.label.toLowerCase().includes(query) ||
        (item.deskripsi && item.deskripsi.toLowerCase().includes(query)) ||
        (item.url && item.url.toLowerCase().includes(query)) ||
        (item.kategori && item.kategori.toLowerCase().includes(query))
      );
    };

    const matchesCategory = (item: LinkItem) => {
      if (selectedCategory === 'Semua') return true;
      return item.kategori === selectedCategory;
    };

    const matchesRole = (item: LinkItem) => {
      if (!filterByRoleOnly) return true;
      return isLinkRelevantForRole(item, currentRole);
    };

    const childrenByParent: Record<string, LinkItem[]> = {};
    visibleLinks.forEach((l) => {
      if (l.parentId) {
        if (!childrenByParent[l.parentId]) childrenByParent[l.parentId] = [];
        childrenByParent[l.parentId].push(l);
      }
    });

    const topLevel = visibleLinks.filter((l) => !l.parentId);

    const prepared = topLevel.map((item) => {
      if (item.tipe === 'Grup') {
        const rawChildren = childrenByParent[item.id] || [];
        const myChildren = isPublicMode
          ? rawChildren.filter((c) => String(c.aktif).toUpperCase() === 'TRUE')
          : rawChildren;

        myChildren.sort((a, b) => (Number(a.urutan) || 0) - (Number(b.urutan) || 0));

        return {
          ...item,
          children: myChildren,
        };
      }
      return item;
    });

    prepared.sort((a, b) => {
      const pinA = String(a.pinned).toUpperCase() === 'TRUE' ? 0 : 1;
      const pinB = String(b.pinned).toUpperCase() === 'TRUE' ? 0 : 1;
      if (pinA !== pinB) return pinA - pinB;
      return (Number(a.urutan) || 0) - (Number(b.urutan) || 0);
    });

    return prepared.filter((item) => {
      // Pada mode publik: jika tautan/grup tidak aktif, atau grup tidak punya anak aktif & tanpa url, JANGAN TAMPILKAN
      if (isPublicMode) {
        const isAktif = String(item.aktif).toUpperCase() === 'TRUE';
        if (!isAktif) return false;
        if (item.tipe === 'Grup') {
          const hasActiveChildren = (item.children || []).some(
            (c) => String(c.aktif).toUpperCase() === 'TRUE'
          );
          if (!hasActiveChildren && !item.url) {
            return false;
          }
        }
      }

      if (item.tipe === 'Grup') {
        const groupMatches = matchesSearch(item) && matchesCategory(item) && matchesRole(item);
        const childMatches = (item.children || []).some(
          (c) => matchesSearch(c) && matchesCategory(c) && matchesRole(c)
        );
        return groupMatches || childMatches;
      }
      return matchesSearch(item) && matchesCategory(item) && matchesRole(item);
    });
  }, [links, searchQuery, selectedCategory, filterByRoleOnly, currentRole, activeStaff, isPublicMode]);

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Curved Midnight Navy Hero Section (Identitas Resmi Divisi Produksi I PT Batu Karang) */}
      <section className="bg-gradient-to-r from-[#091b31] via-[#0d223d] to-[#071326] text-white pt-3.5 pb-6 sm:pb-7 px-4 rounded-b-[32px] sm:rounded-b-[44px] shadow-md border-b border-[#1e3250] relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Profile Card Header: Logo Sejajar dengan Teks (Kompak & Bersih Tanpa Baris Header) */}
        <div className="max-w-md mx-auto text-center flex flex-col items-center pt-2">
          <div className="flex items-center justify-center gap-3 sm:gap-4 text-left">
            {/* Logo Avatar Lingkaran Putih */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white p-1.5 shadow-md border-2 border-white/40 flex items-center justify-center">
                <img
                  src="/logo.svg"
                  alt="Logo 153 PT Batu Karang"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Teks Sejajar: Sub-judul Cyan & Judul Utama (Tanpa Tombol Pensil) */}
            <div className="flex flex-col min-w-0">
              <p className="text-[#38bdf8] font-bold tracking-wider text-[11px] sm:text-xs uppercase truncate">
                {bannerConfig.badge}
              </p>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight truncate">
                {bannerConfig.title}
              </h1>
            </div>
          </div>

          {/* Deskripsi Subtitle */}
          {bannerConfig.description && (
            <p className="text-slate-300 text-xs sm:text-[13px] mt-2.5 max-w-md mx-auto leading-relaxed px-2 font-normal">
              {bannerConfig.description}
            </p>
          )}

          {/* Input Pencarian Bersih (Jika Diaktifkan) */}
          {isSearchOpen && (
            <div className="w-full max-w-sm mt-3 relative animate-in fade-in slide-in-from-top-2 duration-150">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari tautan, formulir, atau SOP..."
                className="w-full bg-white text-slate-900 text-xs sm:text-sm rounded-full pl-9 pr-8 py-2 shadow-md focus:outline-none focus:ring-2 focus:ring-[#004771] placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 2. Main Content: Vertically Stacked Clean Cards DENGAN JARAK PROPORSONAL (TIDAK BERTUMPUK) */}
      <main className="max-w-xl w-full mx-auto px-4 mt-6 sm:mt-7 space-y-3.5 pb-16 flex-1 min-w-0">
        {/* Menu Pengaturan & Kelola Link Utama (Hanya Tampil di Mode Internal/Admin) */}
        {!isPublicMode && (
          <div className="bg-slate-900 text-white rounded-2xl p-3.5 sm:p-4 shadow-md border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
                <ListPlus className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-xs sm:text-sm text-white">
                    Menu Pengaturan Link
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {currentRole}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  Tambah link, edit, hapus, sembunyikan link &amp; atur wewenang staf
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
              <button
                type="button"
                onClick={() => {
                  setAdminInitialTab('links');
                  setIsAdminOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                title="Buka panel lengkap kelola link & staf"
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span>Pengaturan Link</span>
              </button>

              <button
                type="button"
                onClick={togglePublicMode}
                className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
                title="Beralih ke pratinjau publik bersih"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pratinjau Publik</span>
              </button>

              <button
                type="button"
                onClick={handleCopyPublicLink}
                className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
                title="Salin link publik bersih untuk dibagikan ke umum"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Salin Link</span>
              </button>
            </div>
          </div>
        )}

        {/* Toggle Navigasi Peran Cepat (Hanya muncul jika diaktifkan dari footer oleh Developer/Engineer) */}
        {showRoleNav && !isPublicMode && (
          <div className="animate-in fade-in duration-150">
            <RoleNavToggle
              currentRole={currentRole}
              onSelectRole={handleRoleChange}
              onOpenAdmin={() => setIsAdminOpen(true)}
              onOpenRbacModal={() => setIsRbacModalOpen(true)}
              filterByRoleOnly={filterByRoleOnly}
              onToggleFilterByRole={handleToggleFilterByRole}
              onTogglePublicPreview={togglePublicMode}
            />
          </div>
        )}

        {/* Banner Sesi Staf jika login */}
        {activeStaff && !isPublicMode && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 shadow-sm border border-emerald-500">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0"></span>
              <span className="truncate">
                Mode Edit: <strong>{activeStaff.nama}</strong> ({activeStaff.jabatan})
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  setAdminInitialTab('links');
                  setIsAdminOpen(true);
                }}
                className="px-2 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                title="Buka panel kelola link & grup"
              >
                <ListPlus className="w-3 h-3" />
                <span>Kelola Link</span>
              </button>
              <button
                onClick={() => setIsStaffAuthModalOpen(true)}
                className="px-2 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-[10px] font-bold cursor-pointer"
              >
                Ganti PIN
              </button>
              <button
                onClick={handleStaffLogout}
                className="px-2 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-[10px] font-bold cursor-pointer"
              >
                Keluar
              </button>
            </div>
          </div>
        )}

        {/* Daftar Kartu Tautan & Grup (Sesuai Referensi) */}
        {structuredLinks.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/90 shadow-sm space-y-3">
            <div className="text-3xl">🔍</div>
            <h3 className="font-bold text-slate-800 text-sm">Tidak ada tautan yang cocok</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Tidak ditemukan tautan dengan kata kunci "{searchQuery}" pada kategori "{selectedCategory}".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Semua');
              }}
              className="px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Pencarian</span>
            </button>
          </div>
        ) : (
          structuredLinks.map((item) => {
            if (item.tipe === 'Grup') {
              const canEditGroup =
                !isPublicMode &&
                (isFullAccess || (activeStaff ? canStaffEditLink(activeStaff, item.id, item) : false));
              const childAllowedIds =
                !isPublicMode && isFullAccess
                  ? (item.children || []).map((c) => c.id)
                  : !isPublicMode && activeStaff
                  ? (item.children || []).filter((c) => canStaffEditLink(activeStaff, c.id, c)).map((c) => c.id)
                  : [];

              return (
                <GroupCard
                  key={item.id}
                  group={item}
                  onClickLink={handleClickLink}
                  canEditStaffGroup={canEditGroup}
                  canEditStaffChildIds={childAllowedIds}
                  onStaffEdit={isPublicMode ? undefined : handleInitiateEdit}
                />
              );
            }

            const canEditSingle =
              !isPublicMode &&
              (isFullAccess || (activeStaff ? canStaffEditLink(activeStaff, item.id, item) : false));
            return (
              <LinkCard
                key={item.id}
                link={item}
                onClickLink={handleClickLink}
                canEditByStaff={canEditSingle}
                onStaffEdit={isPublicMode ? undefined : handleInitiateEdit}
              />
            );
          })
        )}

      </main>

      {/* 3. Footer: Sederhana & Bersih (Tombol Manajemen Dipindahkan ke Posisi Tidak Mencolok) */}
      <footer className="py-7 px-4 text-center text-xs text-slate-400 border-t border-slate-200/70 mt-auto space-y-2.5">
        <p className="font-medium text-slate-500">© 2026 PT Batu Karang · Divisi Produksi I</p>
        
        {isPublicMode ? (
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            {/* Akses Internal Tersembunyi & Halus */}
            <button
              onClick={togglePublicMode}
              className="text-slate-400/50 hover:text-slate-600 transition-colors flex items-center gap-1 cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-200/40"
              title="Masuk ke Mode Kelola Internal"
            >
              <Lock className="w-3 h-3" />
              <span>Akses Internal</span>
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto pt-1">
            <div className="flex items-center justify-center gap-x-3 gap-y-1.5 text-[11px] text-slate-400 flex-wrap">
              {/* Salin Link Publik */}
              <button
                onClick={handleCopyPublicLink}
                className="text-[#0066ff] hover:text-[#0052cc] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                title="Salin tautan bersih untuk dibagikan ke umum"
              >
                <Share2 className="w-3 h-3" />
                <span>Salin Link Publik</span>
              </button>

              <span>·</span>

              {/* Cari Tautan */}
              <button
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  if (isSearchOpen) setSearchQuery('');
                }}
                className="hover:text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                title={isSearchOpen ? 'Tutup Kolom Cari' : 'Buka Pencarian Tautan'}
              >
                <Search className="w-3 h-3" />
                <span>{isSearchOpen ? 'Tutup Cari' : 'Cari Tautan'}</span>
              </button>

              <span>·</span>

              {/* Toggle Navigasi Peran */}
              <button
                onClick={() => setShowRoleNav(!showRoleNav)}
                className={`transition-colors cursor-pointer flex items-center gap-1 ${
                  showRoleNav ? 'text-[#0066ff] font-bold' : 'hover:text-slate-700'
                }`}
                title="Tampilkan / Sembunyikan Tombol Navigasi Peran"
              >
                <span>Peran: {currentRole}</span>
                {isFullAccess && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                    FULL
                  </span>
                )}
              </button>

              <span>·</span>

              {/* Ubah Teks Banner */}
              <button
                onClick={() => setIsEditBannerOpen(true)}
                className="hover:text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                title="Ubah teks dan judul banner secara manual"
              >
                <Edit3 className="w-3 h-3" />
                <span>Ubah Teks Banner</span>
              </button>

              <span>·</span>

              {/* Status & Pengaturan GAS */}
              <button
                onClick={() => setIsGasCenterOpen(true)}
                className="hover:text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                title="Konfigurasi Integrasi Google Apps Script"
              >
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${gasConfig.webAppUrl ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                <span>GAS {gasConfig.webAppUrl ? 'Live' : '0.01s Sync'}</span>
              </button>

              <span>·</span>

              {/* Masuk Staf PIN */}
              {!activeStaff && (
                <>
                  <button
                    onClick={() => setIsStaffAuthModalOpen(true)}
                    className="hover:text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                    title="Masuk sebagai penanggung jawab unit dengan PIN staf"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>PIN Staf</span>
                  </button>
                  <span>·</span>
                </>
              )}

              {/* Panel Admin */}
              <button
                onClick={() => {
                  setAdminInitialTab('links');
                  setIsAdminOpen(true);
                }}
                className="hover:text-slate-700 transition-colors cursor-pointer flex items-center gap-1 font-medium"
                title="Buka Panel Kelola Admin"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        )}
      </footer>

      {/* Modals & Popups */}

      {/* 0. Modal Ubah Teks Banner Manual */}
      <EditBannerModal
        isOpen={isEditBannerOpen}
        onClose={() => setIsEditBannerOpen(false)}
        config={bannerConfig}
        onSave={handleUpdateBanner}
        showToast={showToast}
      />

      {/* 1. Modal Otentikasi Staf (PIN) */}
      <StaffAuthModal
        isOpen={isStaffAuthModalOpen}
        onClose={() => setIsStaffAuthModalOpen(false)}
        activeStaff={activeStaff}
        onStaffSessionChange={(staff) => {
          setActiveStaff(staff);
          setActiveStaffSession(staff);
        }}
        showToast={showToast}
      />

      {/* 2. Modal Edit Tautan Khusus Staf & Developer / Site Engineer (Akses Penuh) */}
      {staffEditingTarget && (activeStaff || isFullAccess) && (
        <StaffEditLinkModal
          isOpen={!!staffEditingTarget}
          onClose={() => setStaffEditingTarget(null)}
          link={staffEditingTarget}
          activeStaff={
            activeStaff || {
              id: currentRole === 'Developer' ? 'STF-DEV' : 'STF-ENG',
              nama: currentRole === 'Developer' ? 'Lead Developer / Engineer' : 'Lalu Mahendra (Site Engineer)',
              jabatan: currentRole,
              email: 'divisi1.bkr@gmail.com',
              pin: DEFAULT_STAFF_PIN,
              unit: 'Divisi Produksi I',
              allowedLinkIds: ['*'],
              aktif: true,
            }
          }
          onSaved={() => {
            setLinks(getStoredLinks());
          }}
          showToast={showToast}
        />
      )}

      {/* 3. Modal Panel Admin (Passcode Gate + Stats + Link CRUD + Staff & PIN Management) */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        allLinks={links}
        stats={stats}
        gasConfig={gasConfig}
        initialTab={adminInitialTab}
        onDataChanged={() => {
          setLinks(getStoredLinks());
          setStats(getStoredStats());
        }}
      />

      {/* 4. Modal Headless GAS Center (Config + Ping + Code.gs Generator) */}
      <GasCenterModal
        isOpen={isGasCenterOpen}
        onClose={() => setIsGasCenterOpen(false)}
        gasConfig={gasConfig}
        allLinks={links}
        onConfigUpdated={(cfg) => {
          setGasConfig(cfg);
          showToast('Konfigurasi GAS berhasil diperbarui.');
        }}
        onTriggerSync={handleRefresh}
        isSyncing={isRefreshing}
        showToast={showToast}
      />

      {/* 5. Modal Hak Akses RBAC */}
      <RbacModal
        isOpen={isRbacModalOpen}
        onClose={() => setIsRbacModalOpen(false)}
        currentRole={currentRole}
        onSelectRole={handleRoleChange}
        filterByRoleOnly={filterByRoleOnly}
        onToggleFilterByRole={handleToggleFilterByRole}
        onOpenAdmin={() => {
          setIsRbacModalOpen(false);
          setIsAdminOpen(true);
        }}
        onOpenStaffManagement={() => {
          setIsRbacModalOpen(false);
          setAdminInitialTab('staff');
          setIsAdminOpen(true);
        }}
      />

      {/* 6. Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom duration-200 border border-slate-800">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 7. PWA Installation Floating Banner & Offline Connectivity Indicator */}
      <PWAInstallBanner />
      <OfflineIndicator />
    </div>
  );
}
