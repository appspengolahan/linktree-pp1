import React from 'react';
import {
  Laptop,
  HardHat,
  ClipboardList,
  Factory,
  ShieldCheck,
  Zap,
  SlidersHorizontal,
  Sparkles,
  Eye,
  KeyRound,
} from 'lucide-react';
import { Role } from '../types';
import { hasFullAccessRole } from '../services/rbac';

interface RoleNavToggleProps {
  currentRole: Role;
  onSelectRole: (role: Role) => void;
  onOpenAdmin: () => void;
  onOpenRbacModal: () => void;
  filterByRoleOnly: boolean;
  onToggleFilterByRole: (val: boolean) => void;
  onTogglePublicPreview?: () => void;
}

const ROLE_ITEMS: {
  role: Role;
  shortLabel: string;
  icon: string;
  isFullAccess: boolean;
  colorScheme: {
    active: string;
    badge: string;
  };
}[] = [
  {
    role: 'Developer',
    shortLabel: 'Developer',
    icon: '💻',
    isFullAccess: true,
    colorScheme: {
      active: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border-indigo-500',
      badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    },
  },
  {
    role: 'Site Engineer',
    shortLabel: 'Site Engineer',
    icon: '👷',
    isFullAccess: true,
    colorScheme: {
      active: 'bg-[#0066ff] text-white shadow-md shadow-[#0066ff]/30 border-[#0052cc]',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
  },
  {
    role: 'Project Manager',
    shortLabel: 'Project Mgr',
    icon: '📋',
    isFullAccess: false,
    colorScheme: {
      active: 'bg-blue-600 text-white shadow-md shadow-blue-600/30 border-blue-500',
      badge: 'bg-blue-100 text-blue-700 border-blue-200',
    },
  },
  {
    role: 'Manajer operasional',
    shortLabel: 'Manajer Ops',
    icon: '🏭',
    isFullAccess: false,
    colorScheme: {
      active: 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border-purple-500',
      badge: 'bg-purple-100 text-purple-700 border-purple-200',
    },
  },
  {
    role: 'Admin',
    shortLabel: 'Admin',
    icon: '⚙️',
    isFullAccess: true,
    colorScheme: {
      active: 'bg-amber-600 text-white shadow-md shadow-amber-600/30 border-amber-500',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
    },
  },
];

export const RoleNavToggle: React.FC<RoleNavToggleProps> = ({
  currentRole,
  onSelectRole,
  onOpenAdmin,
  onOpenRbacModal,
  filterByRoleOnly,
  onToggleFilterByRole,
  onTogglePublicPreview,
}) => {
  const isFull = hasFullAccessRole(currentRole);

  return (
    <div className="w-full bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs space-y-2.5">
      {/* Baris Atas: Label Navigasi & Status Akses */}
      <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
          </span>
          <span className="tracking-tight text-[11px] sm:text-xs">
            Navigasi Peran Cepat:
          </span>
          {isFull ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
              <Zap className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
              Full Akses Aktif
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Mode Supervisi
            </span>
          )}
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
          {/* Filter Relevan Saja Toggle */}
          <button
            onClick={() => onToggleFilterByRole(!filterByRoleOnly)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-semibold transition-colors cursor-pointer ${
              filterByRoleOnly
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
            }`}
            title="Saring hanya link yang sesuai dengan prioritas peran saat ini"
          >
            <Sparkles className="w-2.5 h-2.5" />
            <span>{filterByRoleOnly ? 'Filter Peran ON' : 'Semua Link'}</span>
          </button>

          {/* Buka Modal RBAC Lengkap */}
          <button
            onClick={onOpenRbacModal}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Buka rincian matriks hak akses (RBAC)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Segmented Role Buttons (Swipeable / Horizontal Scrollable on Mobile) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {ROLE_ITEMS.map((item) => {
          const isActive = currentRole === item.role;
          return (
            <button
              key={item.role}
              type="button"
              onClick={() => onSelectRole(item.role)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer border select-none ${
                isActive
                  ? item.colorScheme.active
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <span className="text-sm shrink-0">{item.icon}</span>
              <span>{item.shortLabel}</span>
              {item.isFullAccess && (
                <span
                  className={`text-[9px] font-extrabold px-1 rounded ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  FULL
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
