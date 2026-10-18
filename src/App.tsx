import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Pin,
  FolderTree,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  Database,
  CheckCircle,
  Sparkles,
  Zap,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  UserCheck,
  SlidersHorizontal,
  KeyRound,
  Lock,
  LogOut,
  Edit3,
} from 'lucide-react';

import { LinkItem, Role, GasConfig, StatistikData, StaffMember } from './types';
import {
  getStoredLinks,
  getStoredStats,
  getGasConfig,
  saveGasConfig,
  getUserRole,
  saveUserRole,
  getSidebarCollapsed,
  saveSidebarCollapsed,
  recordLocalVisit,
  recordLocalClick,
  getActiveStaffSession,
  setActiveStaffSession,
  canStaffEditLink,
} from './services/storage';
import { fetchGasLinks, postGasRecordClick } from './services/gasApi';
import { isLinkRelevantForRole, ROLE_PERMISSIONS } from './services/rbac';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LinkCard } from './components/LinkCard';
import { GroupCard } from './components/GroupCard';
import { AdminModal } from './components/AdminModal';
import { GasCenterModal } from './components/GasCenterModal';
import { RbacModal } from './components/RbacModal';
import { StaffAuthModal } from './components/StaffAuthModal';
import { StaffEditLinkModal } from './components/StaffEditLinkModal';
import { BottomNav } from './components/BottomNav';
import { Logo153 } from './components/Logo153';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  // Core State
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [stats, setStats] = useState<StatistikData>(getStoredStats());
  const [gasConfig, setGasConfig] = useState<GasConfig>(getGasConfig());
  const [currentRole, setCurrentRole] = useState<Role>(getUserRole());
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(getSidebarCollapsed());

  // Staff Authentication & Scoped Edit State
  const [activeStaff, setActiveStaff] = useState<StaffMember | null>(getActiveStaffSession());
  const [isStaffAuthModalOpen, setIsStaffAuthModalOpen] = useState<boolean>(false);
  const [staffEditingTarget, setStaffEditingTarget] = useState<LinkItem | null>(null);

  // RBAC Personalized Filter State
  const [isRbacModalOpen, setIsRbacModalOpen] = useState<boolean>(false);
  const [filterByRoleOnly, setFilterByRoleOnly] = useState<boolean>(() => {
    return localStorage.getItem('bkr_filter_role_only') === 'true';
  });

  // UI Interactive State
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [adminInitialTab, setAdminInitialTab] = useState<'stats' | 'links' | 'staff'>('stats');
  const [isGasCenterOpen, setIsGasCenterOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Inisialisasi: Load data instan dari LocalStorage (0.01s first paint) & catat visit
  useEffect(() => {
    const cachedLinks = getStoredLinks();
    setLinks(cachedLinks);
    setStats(getStoredStats());

    // Fire-and-forget: Catat kunjungan harian
    recordLocalVisit();

    // Silent Background Sync
    const config = getGasConfig();
    if (config.webAppUrl) {
      silentBackgroundSync(config);
    }
  }, []);

  const silentBackgroundSync = async (cfg: GasConfig) => {
    try {
      const res = await fetchGasLinks(cfg.webAppUrl);
      if (res.success && res.links && res.links.length > 0) {
        setLinks(res.links);
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

  const handleToggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    saveSidebarCollapsed(next);
  };

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);
    saveUserRole(role);
    showToast(`Beralih ke hak akses: ${role}`);
    if (role === 'Admin') {
      setIsAdminOpen(true);
    }
  };

  const handleToggleFilterByRole = (val: boolean) => {
    setFilterByRoleOnly(val);
    localStorage.setItem('bkr_filter_role_only', val ? 'true' : 'false');
    showToast(val ? `Filter khusus peran ${currentRole} diaktifkan` : 'Menampilkan seluruh direktori');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (gasConfig.webAppUrl) {
      showToast('Menghubungi Google Apps Script...');
      const res = await fetchGasLinks(gasConfig.webAppUrl);
      if (res.success && res.links) {
        setLinks(res.links);
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

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    links
      .filter((l) => String(l.aktif).toUpperCase() === 'TRUE')
      .forEach((l) => {
        const cat = l.kategori || 'Operasional & Lini';
        counts[cat] = (counts[cat] || 0) + 1;
      });
    return counts;
  }, [links]);

  const structuredLinks = useMemo(() => {
    const activeStaffAllowedIds = activeStaff ? activeStaff.allowedLinkIds || [] : [];

    // Tautan yang tampil:
    // 1. Pengunjung publik hanya melihat tautan dengan aktif === TRUE
    // 2. Staf yang sedang login juga dapat melihat tautan / anak tautan yang diizinkan untuknya meskipun disembunyikan
    const visibleLinks = links.filter((l) => {
      const isAktif = String(l.aktif).toUpperCase() === 'TRUE';
      if (isAktif) return true;
      if (activeStaffAllowedIds.includes(l.id)) return true;
      if (l.tipe === 'Grup') {
        const hasAuthorizedChild = links.some(
          (c) => c.parentId === l.id && activeStaffAllowedIds.includes(c.id)
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
        const myChildren = (childrenByParent[item.id] || []).sort(
          (a, b) => (Number(a.urutan) || 0) - (Number(b.urutan) || 0)
        );
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
      if (item.tipe === 'Grup') {
        const groupMatches = matchesSearch(item) && matchesCategory(item) && matchesRole(item);
        const childMatches = (item.children || []).some(
          (c) => matchesSearch(c) && matchesCategory(c) && matchesRole(c)
        );
        return groupMatches || childMatches;
      }
      return matchesSearch(item) && matchesCategory(item) && matchesRole(item);
    });
  }, [links, searchQuery, selectedCategory, filterByRoleOnly, currentRole, activeStaff]);

  const pinnedLinks = useMemo(() => {
    return structuredLinks.filter((l) => String(l.pinned).toUpperCase() === 'TRUE' && l.tipe !== 'Grup');
  }, [structuredLinks]);

  const regularLinksAndGroups = useMemo(() => {
    return structuredLinks.filter((l) => String(l.pinned).toUpperCase() !== 'TRUE' || l.tipe === 'Grup');
  }, [structuredLinks]);

  const masterSheetLink = useMemo(() => links.find((l) => l.id === 'LNK-PIN-01'), [links]);
  const hotlineLink = useMemo(() => links.find((l) => l.id === 'LNK-PIN-02'), [links]);

  const categories = [
    'Semua',
    'Operasional & Lini',
    'Formulir & Shift',
    'Kendali Mutu (QC)',
    'K3LH & SOP',
    'Kontak & Database',
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans w-full max-w-full antialiased">
      {/* 1. Header Kontrak Tiga Zona (Responsive, Zero-Overflow, with RBAC Trigger) */}
      <Header
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenGasCenter={() => setIsGasCenterOpen(true)}
        onOpenRbac={() => setIsRbacModalOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        gasConfig={gasConfig}
        onToggleSidebarMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* 2. Container Layout Utama: Sidebar (Locked/Sticky) + Viewport Konten */}
      <div className="flex flex-1 w-full max-w-7xl mx-auto min-w-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categoryCounts={categoryCounts}
          totalLinksCount={links.filter((l) => String(l.aktif).toUpperCase() === 'TRUE').length}
          currentRole={currentRole}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onOpenGasCenter={() => setIsGasCenterOpen(true)}
          onOpenRbac={() => setIsRbacModalOpen(true)}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* 3. Main Content Viewport (Scrollable with locked sidebar) */}
        <main className="flex-1 min-w-0 w-full px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 lg:pb-12 overflow-x-hidden">
          {/* Staff Session Status Alert Banner */}
          {activeStaff ? (
            <div className="mb-4 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl text-xs font-semibold flex flex-wrap items-center justify-between gap-2 shadow-xs border border-emerald-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                <span>
                  Mode Edit Aktif: <strong>{activeStaff.nama}</strong> ({activeStaff.jabatan} · Unit {activeStaff.unit})
                </span>
                <span className="bg-emerald-700 text-emerald-100 text-[10px] font-mono px-2 py-0.5 rounded-md font-bold">
                  {activeStaff.allowedLinkIds.length} link wewenang Anda
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsStaffAuthModalOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-[11px] font-bold transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Ganti PIN</span>
                </button>
                <button
                  onClick={handleStaffLogout}
                  className="px-2.5 py-1 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4 bg-slate-900 text-slate-300 px-3.5 py-2 rounded-xl text-[11px] flex items-center justify-between border border-slate-800 shadow-2xs">
              <span>
                Penanggung jawab unit ingin memperbarui link formulir/SOP?
              </span>
              <button
                onClick={() => setIsStaffAuthModalOpen(true)}
                className="text-blue-400 hover:text-white font-bold flex items-center gap-1 underline underline-offset-2 shrink-0 ml-2"
              >
                <KeyRound className="w-3 h-3" />
                <span>Masuk Staf (PIN)</span>
              </button>
            </div>
          )}
          {/* Dynamic Hero Profile Banner */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-4 sm:p-7 mb-5 sm:mb-8 border border-slate-800 shadow-md">
            <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-blue-600/10 blur-2xl pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-600/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
              <div className="relative shrink-0">
                <div className="p-1.5 bg-white rounded-2xl shadow-xl ring-2 ring-blue-400/40">
                  <Logo153 size="md" className="sm:hidden" />
                  <Logo153 size="lg" className="hidden sm:flex" />
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-center sm:justify-start mb-1.5">
                  <span className="text-[10px] sm:text-xs font-bold tracking-wider text-blue-400 uppercase">
                    DIVISI PRODUKSI I . PT BATU KARANG
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
                  Link Hub &amp; Direktori Operasional
                </h1>

                <p className="mt-1.5 text-xs text-slate-300 leading-relaxed max-w-xl line-clamp-2 sm:line-clamp-none">
                  Pusat akses cepat tautan resmi pabrik, monitoring stock PP1, formulir ritase shift, lembar kendali mutu (QC), dan SOP K3LH.
                </p>

                {/* Interactive Dynamic Metrics Strip */}
                <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span className="font-mono font-bold text-white">
                      {links.filter((l) => String(l.aktif).toUpperCase() === 'TRUE').length}
                    </span>
                    <span className="text-slate-400">Tautan</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-200">
                    <TrendingUp className="w-3 h-3 text-sky-400" />
                    <span className="font-mono font-bold text-white">{stats.totalKlik}</span>
                    <span className="text-slate-400">Akses</span>
                  </div>

                  <button
                    onClick={() => setIsRbacModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-blue-200 transition-colors cursor-pointer group"
                  >
                    <UserCheck className="w-3 h-3 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span>Peran: <strong className="text-white">{currentRole}</strong></span>
                    <span className="text-[9px] bg-blue-500/40 text-blue-200 px-1 py-0.2 rounded font-mono font-bold">
                      RBAC ⚙️
                    </span>
                  </button>

                  {/* Tombol Masuk Staf PIN */}
                  {!activeStaff && (
                    <button
                      onClick={() => setIsStaffAuthModalOpen(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 transition-colors cursor-pointer font-bold"
                    >
                      <KeyRound className="w-3 h-3 text-amber-400" />
                      <span>Masuk Staf (PIN)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Pencarian (Search Bar) di Bawah Banner Utama */}
          <div className="mb-4 sm:mb-6">
            <div className="relative flex items-center bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all p-1.5 sm:p-2">
              <div className="pl-2.5 sm:pl-3.5 pr-2.5 text-slate-400 flex items-center pointer-events-none">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
              </div>
              <input
                type="text"
                placeholder="Cari tautan, dokumen operasional, SOP, formulir..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none py-1.5 sm:py-2 pr-2"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                  title="Hapus pencarian"
                >
                  <span className="text-sm font-bold leading-none">✕</span>
                  <span className="hidden sm:inline text-[11px]">Hapus</span>
                </button>
              )}
            </div>

            {searchQuery && (
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500 px-2 animate-in fade-in duration-150">
                <span>
                  Ditemukan <strong className="text-slate-900 font-bold">{structuredLinks.length}</strong> tautan untuk pencarian "<span className="text-blue-600 font-semibold">{searchQuery}</span>"
                </span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Reset Pencarian
                </button>
              </div>
            )}
          </div>

          {/* Quick Shortcuts Bar (Mobile Friendly Cards) */}
          <div className="grid grid-cols-3 gap-2 mb-4 sm:hidden">
            <a
              href="https://monitoring-stock-pp-1-pro-api.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center text-center p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs active:scale-95 transition-transform"
            >
              <span className="text-xl mb-1">📦</span>
              <span className="text-[10px] font-bold text-slate-800 line-clamp-1">Stock PP1</span>
            </a>

            {hotlineLink?.url ? (
              <a
                href={hotlineLink.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleClickLink(hotlineLink.id)}
                className="flex flex-col items-center text-center p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs active:scale-95 transition-transform"
              >
                <span className="text-xl mb-1">🚨</span>
                <span className="text-[10px] font-bold text-slate-800 line-clamp-1">Hotline 153</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() => showToast('Nomor Hotline 153 belum diatur. Silakan atur di Panel Admin.')}
                className="flex flex-col items-center text-center p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 opacity-75 active:scale-95 transition-transform"
              >
                <span className="text-xl mb-1">🚨</span>
                <span className="text-[10px] font-bold text-slate-500 line-clamp-1">Hotline 153</span>
              </button>
            )}

            {masterSheetLink?.url ? (
              <a
                href={masterSheetLink.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleClickLink(masterSheetLink.id)}
                className="flex flex-col items-center text-center p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs active:scale-95 transition-transform"
              >
                <span className="text-xl mb-1">📊</span>
                <span className="text-[10px] font-bold text-slate-800 line-clamp-1">Master Sheet</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsGasCenterOpen(true);
                  showToast('Hubungkan spreadsheet Anda di menu Integrasi GAS.');
                }}
                className="flex flex-col items-center text-center p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 opacity-75 active:scale-95 transition-transform"
              >
                <span className="text-xl mb-1">📊</span>
                <span className="text-[10px] font-bold text-slate-500 line-clamp-1">Master Sheet</span>
              </button>
            )}
          </div>

          {/* RBAC Smart Filter Active Alert Banner */}
          {filterByRoleOnly && (
            <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-slate-800 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg shrink-0">🎯</span>
                <span className="text-slate-700 truncate">
                  Filter Pintar Aktif: Menampilkan tautan prioritas untuk{' '}
                  <strong className="text-blue-800">{currentRole}</strong>
                </span>
              </div>
              <button
                onClick={() => handleToggleFilterByRole(false)}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline shrink-0"
              >
                Tampilkan Semua
              </button>
            </div>
          )}

          {/* Dynamic Horizontal Scrollable Category Chips */}
          <div className="mb-5 w-full">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 w-full -mx-1 px-1">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                const count = cat === 'Semua'
                  ? links.filter((l) => String(l.aktif).toUpperCase() === 'TRUE').length
                  : categoryCounts[cat] || 0;

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 active:scale-95 ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/90'
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section A: Pinned Items */}
          {pinnedLinks.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-2.5">
                <Pin className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Prioritas Disematkan (Pinned)
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {pinnedLinks.map((link) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    onClickLink={handleClickLink}
                    canEditByStaff={canStaffEditLink(activeStaff, link.id)}
                    onStaffEdit={(item) => setStaffEditingTarget(item)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section B: All Links & Sticky Expandable Groups */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <FolderTree className="w-3.5 h-3.5 text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {selectedCategory === 'Semua' ? 'Direktori & Grup Tautan' : `Kategori: ${selectedCategory}`}
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {regularLinksAndGroups.length} entri
              </span>
            </div>

            {regularLinksAndGroups.length === 0 ? (
              <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2.5 text-2xl">
                  🔍
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Tidak ada tautan ditemukan</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {filterByRoleOnly
                    ? `Peran ${currentRole} tidak memiliki tautan di kategori ini. Anda dapat menonaktifkan filter peran.`
                    : 'Coba kata kunci lain atau pilih tab "Semua" untuk melihat seluruh direktori.'}
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  {filterByRoleOnly && (
                    <button
                      onClick={() => handleToggleFilterByRole(false)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
                    >
                      Buka Filter Peran
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('Semua');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-blue-600 transition-colors"
                  >
                    Lihat Semua Tautan
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {regularLinksAndGroups.map((item) => {
                  if (item.tipe === 'Grup') {
                    return (
                      <GroupCard
                        key={item.id}
                        group={item}
                        onClickLink={handleClickLink}
                        defaultExpanded={true}
                        canEditStaffGroup={canStaffEditLink(activeStaff, item.id)}
                        canEditStaffChildIds={activeStaff?.allowedLinkIds || []}
                        onStaffEdit={(target) => setStaffEditingTarget(target)}
                      />
                    );
                  }
                  return (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <LinkCard
                        link={item}
                        onClickLink={handleClickLink}
                        canEditByStaff={canStaffEditLink(activeStaff, item.id)}
                        onStaffEdit={(target) => setStaffEditingTarget(target)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Footnote */}
          <footer className="mt-10 pt-5 border-t border-slate-200 text-center text-xs text-slate-500 space-y-1.5">
            <p className="font-bold text-slate-700">
              © {new Date().getFullYear()} PT Batu Karang · Divisi Produksi I (PP1)
            </p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Sistem direktori terpadu berbasis Headless Google Apps Script &amp; Sheets dengan otorisasi RBAC dan delegasi PIN staf unit.
            </p>
          </footer>
        </main>
      </div>

      {/* 4. Bottom Navigation Bar untuk Mobile/Tablet */}
      <BottomNav
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenGasCenter={() => setIsGasCenterOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* 5. Menu Hak Akses (RBAC) Modal */}
      <RbacModal
        isOpen={isRbacModalOpen}
        onClose={() => setIsRbacModalOpen(false)}
        currentRole={currentRole}
        onSelectRole={handleRoleChange}
        filterByRoleOnly={filterByRoleOnly}
        onToggleFilterByRole={handleToggleFilterByRole}
        onOpenAdmin={() => {
          setAdminInitialTab('stats');
          setIsAdminOpen(true);
        }}
        onOpenStaffManagement={() => {
          setAdminInitialTab('staff');
          setIsAdminOpen(true);
        }}
      />

      {/* 6. Modal Autentikasi Staf & Ganti PIN */}
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

      {/* 7. Modal Edit Tautan Khusus Staf (Scoped Authorization) */}
      {staffEditingTarget && activeStaff && (
        <StaffEditLinkModal
          isOpen={!!staffEditingTarget}
          onClose={() => setStaffEditingTarget(null)}
          link={staffEditingTarget}
          activeStaff={activeStaff}
          onSaved={() => {
            setLinks(getStoredLinks());
          }}
          showToast={showToast}
        />
      )}

      {/* 8. Modal Panel Admin (Passcode Gate + Stats + Link CRUD + Staff & PIN Management) */}
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

      {/* 9. Modal Headless GAS Center (Config + Ping + Code.gs Generator) */}
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

      {/* 10. Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom duration-200 border border-slate-800">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 11. PWA Installation Floating Banner & Offline Connectivity Indicator */}
      <PWAInstallBanner />
      <OfflineIndicator />
    </div>
  );
}
