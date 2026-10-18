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
} from 'lucide-react';

import { LinkItem, Role, GasConfig, StatistikData, StaffMember } from './types';
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
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [adminInitialTab, setAdminInitialTab] = useState<'stats' | 'links' | 'staff'>('stats');
  const [isGasCenterOpen, setIsGasCenterOpen] = useState<boolean>(false);
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
    <div className="min-h-screen bg-[#f0f4f8] text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Curved Deep Navy Hero Section (Persis Sesuai Gambar Referensi) */}
      <section className="bg-gradient-to-b from-[#082846] via-[#0b385c] to-[#0d416b] text-white pt-4 pb-12 sm:pb-16 px-4 rounded-b-[40px] sm:rounded-b-[52px] shadow-lg relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Minimalist Floating Top Utility Bar */}
        <div className="max-w-xl mx-auto flex items-center justify-between text-xs pb-4 mb-4 border-b border-white/10">
          {/* Status Sinkronisasi GAS */}
          <div
            onClick={() => setIsGasCenterOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 cursor-pointer transition-colors backdrop-blur-xs text-[11px]"
            title={gasConfig.webAppUrl ? 'GAS Live terhubung ke Google Sheets' : 'Local Cache 0.01s (Klik untuk atur GAS)'}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="font-semibold text-slate-200">
              {gasConfig.webAppUrl ? 'GAS Live' : '0.01s Sync'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Tombol Peran RBAC */}
            <button
              onClick={() => setIsRbacModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 transition-colors text-[11px] font-semibold cursor-pointer"
              title="Ganti Peran Hak Akses (RBAC)"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-300" />
              <span>{currentRole}</span>
            </button>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
              title="Segarkan data terbaru"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-300' : ''}`} />
            </button>

            {/* Tombol Akses Admin */}
            <button
              onClick={() => setIsAdminOpen(true)}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all text-[11px] shadow-2xs cursor-pointer"
              title="Panel Kelola & Statistik (Passcode)"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Profile Card Header: Logo Lingkaran + Teks Referensi */}
        <div className="max-w-md mx-auto text-center flex flex-col items-center">
          {/* Logo Avatar Lingkaran Putih di Bagian Tengah Atas */}
          <div className="relative mb-3">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white p-2.5 shadow-xl border-4 border-white/20 flex items-center justify-center">
              <img
                src="/logo.svg"
                alt="Logo 153 PT Batu Karang"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Subtitle Kuning Emas Huruf Kapital (Identik Referensi) */}
          <p className="text-amber-400 font-bold tracking-widest text-[11px] sm:text-xs uppercase">
            PT. BATU KARANG — 153
          </p>

          {/* Judul Utama Huruf Tebal Putih (Identik Referensi) */}
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Divisi Produksi I
          </h1>

          {/* Deskripsi Subtitle (Identik Referensi) */}
          <p className="text-slate-200 text-xs sm:text-sm mt-2 leading-relaxed px-2 font-normal">
            Semua tautan penting Divisi Produksi I PT Batu Karang ada di sini — formulir shift, SOP pabrik, kendali mutu (QC), dan kontak resmi.
          </p>

          {/* Search Box Sederhana & Bersih */}
          <div className="w-full max-w-sm mt-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tautan, formulir, atau SOP..."
              className="w-full bg-white/95 text-slate-900 text-xs sm:text-sm rounded-full pl-9 pr-8 py-2.5 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400"
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

          {/* Kategori Filter Pills */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap mt-3.5 max-w-lg">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-blue-900 shadow-sm font-bold'
                      : 'bg-white/15 text-slate-200 hover:bg-white/25 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. Main Content: Vertically Stacked Clean Cards (Sesuai Referensi) */}
      <main className="max-w-xl w-full mx-auto px-4 -mt-5 sm:-mt-6 space-y-3 pb-16 flex-1 min-w-0">
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

        {/* Akses Cepat Masuk Staf jika belum login */}
        {!activeStaff && (
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

      {/* 3. Footer Sederhana & Bersih (Persis Referensi) */}
      <footer className="py-6 px-4 text-center text-xs text-slate-400 border-t border-slate-200/60 mt-auto space-y-2">
        <p>© 2026 PT Batu Karang · Divisi Produksi I</p>
        <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400">
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
      </footer>

      {/* Modals & Popups */}

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
