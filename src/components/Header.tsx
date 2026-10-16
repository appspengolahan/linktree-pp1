import React, { useState } from 'react';
import {
  RefreshCw,
  Database,
  ShieldCheck,
  UserCheck,
  Search,
  Menu,
  MoreVertical,
  SlidersHorizontal,
  Shield,
} from 'lucide-react';
import { Role, GasConfig } from '../types';
import { Logo153 } from './Logo153';

interface HeaderProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  onOpenAdmin: () => void;
  onOpenGasCenter: () => void;
  onOpenRbac: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  gasConfig: GasConfig;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleSidebarMobile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  onOpenAdmin,
  onOpenGasCenter,
  onOpenRbac,
  onRefresh,
  isRefreshing,
  gasConfig,
  searchQuery,
  onSearchChange,
  onToggleSidebarMobile,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white w-full max-w-full overflow-x-hidden">
      <div className="px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Zone 1: Mobile Sidebar Toggle + Brand */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onToggleSidebarMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-transform shrink-0"
              aria-label="Buka navigasi sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <Logo153 size="sm" className="shrink-0" />
              <div className="flex flex-col min-w-0 leading-none">
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white truncate">
                    PT. BATU KARANG
                  </span>
                  <span className="bg-blue-600/80 border border-blue-400/40 text-blue-200 text-[9px] font-mono px-1 py-0.2 rounded font-bold shrink-0">
                    PP1
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase truncate mt-0.5">
                  Divisi Produksi I
                </span>
              </div>
            </div>
          </div>

          {/* Zone 2: Desktop Search & Live Status Indicator */}
          <div className="hidden md:flex flex-1 max-w-md items-center gap-2.5 mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari tautan, dokumen, SOP..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/80 shrink-0"
              title={gasConfig.webAppUrl ? 'Terhubung ke Google Sheets (GAS Live)' : 'Offline LocalStorage 0.01s'}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-semibold text-slate-300 whitespace-nowrap">
                {gasConfig.webAppUrl ? 'GAS Live' : '0.01s Sync'}
              </span>
            </div>
          </div>

          {/* Zone 3: Desktop Interactive Controls */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {/* RBAC Menu Button Trigger */}
            <button
              onClick={onOpenRbac}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all active:scale-95 shadow-2xs"
              title="Buka Menu Hak Akses & Matriks Peran (RBAC)"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Peran: <strong className="text-blue-300">{currentRole}</strong></span>
              <span className="text-[9px] bg-blue-600/30 text-blue-300 px-1.5 py-0.2 rounded font-mono font-bold ml-0.5 border border-blue-500/30">
                RBAC
              </span>
            </button>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all active:scale-95"
              title="Refresh data terbaru"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            </button>

            {/* GAS Center */}
            <button
              onClick={onOpenGasCenter}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-all active:scale-95"
              title="Pengaturan Headless GAS"
            >
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline">GAS Center</span>
            </button>

            {/* Admin */}
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              title="Panel Admin Passcode"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>

          {/* Mobile Right Controls: Compact & Touch-Friendly */}
          <div className="flex sm:hidden items-center gap-1.5 shrink-0">
            {/* Mobile RBAC Menu Button */}
            <button
              onClick={onOpenRbac}
              className="flex items-center gap-1 bg-slate-800 border border-slate-700 text-blue-400 text-[11px] font-bold rounded-lg px-2 py-1 active:scale-95"
              title="Buka Menu RBAC"
            >
              <UserCheck className="w-3 h-3 text-blue-400 shrink-0" />
              <span className="max-w-[70px] truncate">{currentRole.split(' ')[0]}</span>
              <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 py-0.2 rounded font-mono">
                RBAC
              </span>
            </button>

            {/* Mobile Quick Action Dropdown Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white active:scale-95 transition-transform"
              aria-label="Aksi Cepat Mobile"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Action Dropdown Popup */}
        {isMobileMenuOpen && (
          <div className="sm:hidden mt-2 pt-2 border-t border-slate-800 grid grid-cols-4 gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
            <button
              onClick={() => {
                onOpenRbac();
                setIsMobileMenuOpen(false);
              }}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-800 text-[10px] font-bold text-blue-300 active:bg-slate-700"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Menu RBAC</span>
            </button>

            <button
              onClick={() => {
                onRefresh();
                setIsMobileMenuOpen(false);
              }}
              disabled={isRefreshing}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-800 text-[10px] font-semibold text-slate-200 active:bg-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => {
                onOpenGasCenter();
                setIsMobileMenuOpen(false);
              }}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-800 text-[10px] font-semibold text-sky-400 active:bg-slate-700"
            >
              <Database className="w-3.5 h-3.5" />
              <span>GAS API</span>
            </button>

            <button
              onClick={() => {
                onOpenAdmin();
                setIsMobileMenuOpen(false);
              }}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-blue-600 text-[10px] font-bold text-white active:bg-blue-700"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        )}

        {/* Mobile Search Input */}
        <div className="mt-2 md:hidden">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari tautan, dokumen, atau SOP..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
