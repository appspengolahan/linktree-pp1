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
} from 'lucide-react';

import { LinkItem, Role, GasConfig, StatistikData, StaffMember, BannerConfig } from './types';
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
} from './services/storage';
import { fetchGasLinks, postGasRecordClick } from './services/gasApi';
import { isLinkRelevantForRole } from './services/rbac';

import { LinkCard } from './components/LinkCard';
import { GroupCard } from './components/GroupCard';
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

    // Silent Background Sync jika GAS dikonfigurasi
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

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);
    saveUserRole(role);
    showToast(`Beralih ke hak akses: ${role}`);
    if (role === 'Admin') {
      setIsAdminOpen(true);
    }
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
    const activeStaffAllowedIds = activeStaff ? activeStaff.allowedLinkIds || [] : [];

    // Tautan yang tampil:
    // 1. Publik hanya melihat tautan dengan aktif === TRUE
    // 2. Staf yang sedang login juga dapat melihat tautan miliknya meskipun disembunyikan
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

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Curved Midnight Navy Hero Section (Identitas Resmi Divisi Produksi I PT Batu Karang) */}
      <section className="bg-gradient-to-r from-[#091b31] via-[#0d223d] to-[#071326] text-white pt-3.5 pb-6 sm:pb-7 px-4 rounded-b-[32px] sm:rounded-b-[44px] shadow-md border-b border-[#1e3250] relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Top Utility Bar: Berbeda antara Mode Publik Bersih dan Mode Kelola */}
        {isPublicMode ? (
          <div className="max-w-xl mx-auto flex items-center justify-between text-xs pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-slate-200 text-[11px] font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
              </span>
              <span className="font-semibold text-white tracking-wide">Portal Resmi</span>
              <span className="text-white/30">|</span>
              <span className="text-slate-300">PT Batu Karang</span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Toggle Cari Tautan */}
              <button
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  if (isSearchOpen) setSearchQuery('');
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                  isSearchOpen
                    ? 'bg-white text-[#0066ff] border-white shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/10'
                }`}
                title={isSearchOpen ? 'Tutup Pencarian' : 'Cari Tautan...'}
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              {/* Kembali ke Mode Kelola jika admin sedang pratinjau */}
              <button
                onClick={togglePublicMode}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors text-[11px] font-semibold cursor-pointer border border-white/10"
                title="Beralih ke Mode Kelola Internal"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mode Kelola</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto flex items-center justify-between text-xs pb-3 mb-3 border-b border-white/10">
            {/* Status Sinkronisasi GAS (Identik Tombol Auto-Sync Hijau Mint) */}
            <div
              onClick={() => setIsGasCenterOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#ecfdf5] border border-[#a7f3d0] hover:bg-[#d1fae5] text-[#047857] cursor-pointer transition-colors text-[11px] font-semibold shadow-2xs"
              title={gasConfig.webAppUrl ? 'GAS Live terhubung ke Google Sheets' : 'Local Cache 0.01s (Klik untuk atur GAS)'}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span>
                {gasConfig.webAppUrl ? 'GAS Live' : '0.01s Sync'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Tombol Salin Link Publik Bersih */}
              <button
                onClick={handleCopyPublicLink}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0066ff]/20 hover:bg-[#0066ff]/35 text-sky-200 hover:text-white transition-colors text-[11px] font-semibold cursor-pointer border border-sky-400/40"
                title="Salin tautan publik bersih khusus pengunjung / umum"
              >
                <Share2 className="w-3.5 h-3.5 text-sky-300" />
                <span className="hidden sm:inline">Link Publik</span>
              </button>

              {/* Tombol Pratinjau Tampilan Publik Bersih */}
              <button
                onClick={togglePublicMode}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors cursor-pointer border border-white/10"
                title="Pratinjau tampilan publik bersih (Clean View)"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>

              {/* Tombol Ubah Teks Banner Secara Manual */}
              <button
                onClick={() => setIsEditBannerOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors text-[11px] font-semibold cursor-pointer border border-white/10"
                title="Ubah teks banner secara manual"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ubah Teks</span>
              </button>

              {/* Toggle Cari Tautan (Opsional) */}
              <button
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  if (isSearchOpen) setSearchQuery('');
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                  isSearchOpen
                    ? 'bg-white text-[#0066ff] border-white shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/10'
                }`}
                title={isSearchOpen ? 'Tutup Pencarian' : 'Cari Tautan...'}
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              {/* Tombol Peran RBAC (Identik Pill Putih di Web Apps Monitoring Stock) */}
              <button
                onClick={() => setIsRbacModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-800 transition-colors text-[11px] font-semibold cursor-pointer border border-slate-200/90 shadow-2xs"
                title="Ganti Peran Hak Akses (RBAC)"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#0066ff]" />
                <span className="max-w-[90px] truncate">{currentRole}</span>
              </button>

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors cursor-pointer border border-white/10"
                title="Segarkan data terbaru"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
              </button>

              {/* Tombol Akses Admin (Identik Electric Royal Blue #0066ff) */}
              <button
                onClick={() => setIsAdminOpen(true)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#0066ff] hover:bg-[#0052cc] text-white font-bold transition-all text-[11px] shadow-xs active:scale-95 cursor-pointer"
                title="Panel Kelola & Statistik (Passcode)"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        )}

        {/* Profile Card Header: Logo Sejajar dengan Teks (Kompak & Rendah Sesuai Permintaan) */}
        <div className="max-w-md mx-auto text-center flex flex-col items-center">
          <div className="flex items-center justify-center gap-3 sm:gap-4 text-left">
            {/* Logo Avatar Lingkaran Putih */}
            <div className="relative shrink-0">
              <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-white p-1.5 shadow-md border-2 border-white/40 flex items-center justify-center">
                <img
                  src="/logo.svg"
                  alt="Logo 153 PT Batu Karang"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Teks Sejajar: Sub-judul Emas/Cyan & Judul Utama */}
            <div className="flex flex-col min-w-0">
              <p className="text-[#38bdf8] font-bold tracking-wider text-[11px] sm:text-xs uppercase truncate flex items-center gap-1">
                <span>{bannerConfig.badge}</span>
              </p>
              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-tight truncate">
                {bannerConfig.title}
              </h1>
            </div>

            {/* Tombol Cepat Edit Teks Banner (Pensil) - Disembunyikan di Mode Publik */}
            {!isPublicMode && (
              <button
                onClick={() => setIsEditBannerOpen(true)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sky-300 hover:text-white transition-colors cursor-pointer shrink-0 ml-0.5 border border-white/10"
                title="Ubah teks banner ini secara manual"
                aria-label="Ubah Teks Banner"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Deskripsi Subtitle */}
          {bannerConfig.description && (
            <p className="text-slate-300 text-xs sm:text-[13px] mt-2.5 max-w-md mx-auto leading-relaxed px-2 font-normal">
              {bannerConfig.description}
            </p>
          )}

          {/* Input Pencarian Hanya Muncul Jika Ikon Search di Bilah Atas Diklik */}
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
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
        {/* Banner Sesi Staf jika login */}
        {activeStaff && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 shadow-sm border border-emerald-500">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0"></span>
              <span className="truncate">
                Mode Edit: <strong>{activeStaff.nama}</strong> ({activeStaff.jabatan})
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsStaffAuthModalOpen(true)}
                className="px-2 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-[10px] font-bold"
              >
                Ganti PIN
              </button>
              <button
                onClick={handleStaffLogout}
                className="px-2 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-[10px] font-bold"
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
              const canEditGroup = activeStaff ? activeStaff.allowedLinkIds.includes(item.id) : false;
              const childAllowedIds = activeStaff ? activeStaff.allowedLinkIds : [];

              return (
                <GroupCard
                  key={item.id}
                  group={item}
                  onClickLink={handleClickLink}
                  canEditStaffGroup={canEditGroup}
                  canEditStaffChildIds={childAllowedIds}
                  onStaffEdit={(target) => setStaffEditingTarget(target)}
                />
              );
            }

            const canEditSingle = activeStaff ? activeStaff.allowedLinkIds.includes(item.id) : false;
            return (
              <LinkCard
                key={item.id}
                link={item}
                onClickLink={handleClickLink}
                canEditByStaff={canEditSingle}
                onStaffEdit={(target) => setStaffEditingTarget(target)}
              />
            );
          })
        )}

        {/* Akses Cepat Masuk Staf (Hanya di Mode Internal, Disembunyikan di Mode Publik Bersih) */}
        {!activeStaff && !isPublicMode && (
          <div className="pt-2 text-center">
            <button
              onClick={() => setIsStaffAuthModalOpen(true)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>Penanggung Jawab Unit? Masuk dengan PIN Staf</span>
            </button>
          </div>
        )}
      </main>

      {/* 3. Footer: Sederhana & Bersih (Persis Referensi) */}
      <footer className="py-6 px-4 text-center text-xs text-slate-400 border-t border-slate-200/60 mt-auto space-y-2">
        <p>© 2026 PT Batu Karang · Divisi Produksi I</p>
        
        {isPublicMode ? (
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            {/* Akses Internal Tersembunyi/Sederhana untuk Pengelola */}
            <button
              onClick={togglePublicMode}
              className="text-slate-400/60 hover:text-slate-600 transition-colors flex items-center gap-1 cursor-pointer py-0.5 px-2 rounded"
              title="Masuk ke Mode Kelola Internal"
            >
              <Lock className="w-3 h-3" />
              <span>Akses Internal</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 flex-wrap">
            <button
              onClick={handleCopyPublicLink}
              className="text-[#0066ff] hover:text-[#0052cc] font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Share2 className="w-3 h-3" />
              Salin Link Publik
            </button>
            <span>·</span>
            <button
              onClick={() => setIsEditBannerOpen(true)}
              className="hover:text-slate-700 transition-colors cursor-pointer"
            >
              Ubah Teks Banner
            </button>
            <span>·</span>
            <button
              onClick={() => setIsAdminOpen(true)}
              className="hover:text-slate-700 transition-colors cursor-pointer"
            >
              Panel Admin
            </button>
            <span>·</span>
            <button
              onClick={() => setIsRbacModalOpen(true)}
              className="hover:text-slate-700 transition-colors cursor-pointer"
            >
              Hak Akses RBAC
            </button>
            <span>·</span>
            <button
              onClick={() => setIsGasCenterOpen(true)}
              className="hover:text-slate-700 transition-colors cursor-pointer"
            >
              Integrasi GAS
            </button>
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

      {/* 2. Modal Edit Tautan Khusus Staf (Scoped Authorization) */}
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
        onToggleFilterByRole={(val) => {
          setFilterByRoleOnly(val);
          localStorage.setItem('bkr_filter_role_only', val ? 'true' : 'false');
          showToast(val ? `Filter khusus peran ${currentRole} diaktifkan` : 'Menampilkan seluruh direktori');
        }}
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
