import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Factory,
  FileSpreadsheet,
  TestTube2,
  HardHat,
  Database,
  ExternalLink,
  ShieldAlert,
  Settings,
  Sparkles,
  Layers,
  UserCheck,
} from 'lucide-react';
import { Logo153 } from './Logo153';
import { Role } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
  totalLinksCount: number;
  currentRole: Role;
  onOpenAdmin: () => void;
  onOpenGasCenter: () => void;
  onOpenRbac: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  totalLinksCount,
  currentRole,
  onOpenAdmin,
  onOpenGasCenter,
  onOpenRbac,
  isOpenMobile,
  onCloseMobile,
}) => {
  const categories = [
    { id: 'Semua', label: 'Semua Direktori', icon: LayoutGrid },
    { id: 'Operasional & Lini', label: 'Operasional & Lini', icon: Factory },
    { id: 'Formulir & Shift', label: 'Formulir & Shift', icon: FileSpreadsheet },
    { id: 'Kendali Mutu (QC)', label: 'Kendali Mutu (QC)', icon: TestTube2 },
    { id: 'K3LH & SOP', label: 'K3LH & SOP Pabrik', icon: HardHat },
    { id: 'Kontak & Database', label: 'Kontak & Database', icon: Database },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 select-none">
      {/* Brand & Collapse Header */}
      <div className={`p-4 border-b border-slate-800 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed ? (
          <div className="flex items-center gap-3 min-w-0">
            <Logo153 size="md" />
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-sm text-white tracking-tight leading-tight truncate">
                PT. BATU KARANG
              </span>
              <span className="text-xs font-semibold text-blue-400 tracking-wider uppercase truncate">
                Divisi Produksi I
              </span>
            </div>
          </div>
        ) : (
          <Logo153 size="sm" />
        )}

        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          aria-label="Toggle sidebar collapse"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role Pill Display - Clickable to open RBAC Matrix */}
      {!collapsed && (
        <button
          onClick={() => {
            onOpenRbac();
            onCloseMobile();
          }}
          className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-xs hover:bg-slate-800 transition-colors group text-left"
          title="Klik untuk membuka Menu Hak Akses RBAC"
        >
          <div className="flex items-center gap-1.5 text-slate-400">
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Peran:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-blue-400 group-hover:text-blue-300">
              {currentRole}
            </span>
            <span className="text-[9px] bg-blue-600/30 text-blue-300 font-mono font-bold px-1 py-0.2 rounded border border-blue-500/30">
              RBAC
            </span>
          </div>
        </button>
      )}

      {/* Navigation Category Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        {!collapsed && (
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Kategori Direktori
          </div>
        )}

        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          const count = cat.id === 'Semua' ? totalLinksCount : categoryCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              onClick={() => {
                onSelectCategory(cat.id);
                onCloseMobile();
              }}
              title={collapsed ? `${cat.label} (${count})` : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              } ${collapsed ? 'justify-center' : 'justify-between'}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                {!collapsed && <span className="truncate">{cat.label}</span>}
              </div>

              {!collapsed && (
                <span
                  className={`text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-full font-bold ${
                    isSelected ? 'bg-blue-700/80 text-blue-100' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {/* Quick Industrial Links */}
        {!collapsed && (
          <div className="pt-5 pb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Konfigurasi &amp; Akses
          </div>
        )}

        {/* Dedicated Menu RBAC */}
        <button
          onClick={() => {
            onOpenRbac();
            onCloseMobile();
          }}
          title={collapsed ? 'Menu Hak Akses (RBAC)' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <UserCheck className="w-4 h-4 text-blue-400 shrink-0" />
          {!collapsed && <span className="truncate font-semibold">Menu Hak Akses (RBAC)</span>}
        </button>

        <a
          href="https://monitoring-stock-pp-1-pro-api.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? 'Monitoring Stock PP1' : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <ExternalLink className="w-4 h-4 text-emerald-400 shrink-0" />
          {!collapsed && <span className="truncate">Monitoring Stock PP1</span>}
        </a>

        {/* PWA Install Button in Sidebar */}
        <div className={collapsed ? 'px-1' : ''}>
          <PWAInstallButton variant="sidebar" />
        </div>

        <button
          onClick={() => {
            onOpenGasCenter();
            onCloseMobile();
          }}
          title={collapsed ? 'Headless GAS Center' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <Settings className="w-4 h-4 text-sky-400 shrink-0" />
          {!collapsed && <span className="truncate">Headless GAS Center</span>}
        </button>

        <button
          onClick={() => {
            onOpenAdmin();
            onCloseMobile();
          }}
          title={collapsed ? 'Panel Admin Passcode' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          {!collapsed && <span className="truncate">Kelola Link &amp; Statistik</span>}
        </button>
      </div>

      {/* Footer Area */}
      <div className={`p-3 border-t border-slate-800 text-[11px] text-slate-400 ${collapsed ? 'text-center' : ''}`}>
        {!collapsed ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-semibold">PT Batu Karang</span>
              <span className="text-[10px] font-mono text-emerald-400">v2.4 Live</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Link Tree &amp; Hub Dokumen Divisi Produksi I
            </p>
          </div>
        ) : (
          <span className="text-[10px] font-mono text-slate-400 font-bold">153</span>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 h-[calc(100vh-53px)] sticky top-[53px] ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
