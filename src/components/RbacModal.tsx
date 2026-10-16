import React from 'react';
import {
  X,
  ShieldCheck,
  Check,
  Ban,
  UserCheck,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  Users,
  KeyRound,
  Settings,
} from 'lucide-react';
import { Role } from '../types';
import { ROLE_PERMISSIONS } from '../services/rbac';
import { Logo153 } from './Logo153';

interface RbacModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: Role;
  onSelectRole: (role: Role) => void;
  filterByRoleOnly: boolean;
  onToggleFilterByRole: (val: boolean) => void;
  onOpenAdmin: () => void;
  onOpenStaffManagement?: () => void;
}

export const RbacModal: React.FC<RbacModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSelectRole,
  filterByRoleOnly,
  onToggleFilterByRole,
  onOpenAdmin,
  onOpenStaffManagement,
}) => {
  if (!isOpen) return null;

  const roles: Role[] = ['Site Engineer', 'Project Manager', 'Manajer operasional', 'Admin'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-base tracking-tight leading-tight">
                  Menu Hak Akses Peran (RBAC)
                </h2>
                <span className="px-2 py-0.2 rounded text-[10px] font-bold font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Role-Based Access
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pilih peran operasional Anda untuk menyesuaikan prioritas direktori dan otorisasi fitur
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          {/* Personalized Role Filter Toggle */}
          <div className="p-4 rounded-2xl bg-linear-to-r from-blue-50 to-indigo-50/50 border border-blue-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                  Tampilan Pintar Sesuai Peran Aktif
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Secara otomatis memprioritaskan dan menyorot tautan/dokumen yang relevan bagi peran{' '}
                  <strong className="text-blue-700">{currentRole}</strong>.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none shrink-0 self-end sm:self-center">
              <span className="text-xs font-bold text-slate-700">
                {filterByRoleOnly ? 'Aktif' : 'Nonaktif'}
              </span>
              <div
                onClick={() => onToggleFilterByRole(!filterByRoleOnly)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  filterByRoleOnly ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    filterByRoleOnly ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </label>
          </div>

          {/* Role Cards Matrix */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Pilih Peran Operasional (Role Switcher)
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                Peran Aktif: <strong className="text-blue-600">{currentRole}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {roles.map((r) => {
                const perm = ROLE_PERMISSIONS[r];
                const isCurrent = currentRole === r;

                return (
                  <div
                    key={r}
                    onClick={() => {
                      onSelectRole(r);
                      if (r === 'Admin') {
                        onClose();
                        onOpenAdmin();
                      }
                    }}
                    className={`relative rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                      isCurrent
                        ? 'border-blue-500 bg-blue-50/40 shadow-sm ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                    <div>
                      {/* Top Role Header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{perm.icon}</span>
                          <div>
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug">
                              {r}
                            </h4>
                            <span className="text-[10px] text-slate-500 font-medium">{perm.title}</span>
                          </div>
                        </div>

                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
                            <Check className="w-3 h-3" />
                            Aktif
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline shrink-0"
                          >
                            Pilih
                          </button>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                        {perm.deskripsi}
                      </p>

                      {/* Permissions List */}
                      <div className="space-y-1.5 pt-2.5 border-t border-slate-100 text-[11px]">
                        <div className="flex items-center justify-between text-slate-700">
                          <span>Akses Direktori Publik</span>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        </div>

                        <div className="flex items-center justify-between text-slate-700">
                          <span>Kelola / Tambah / Hapus Link</span>
                          {perm.canEditLinks ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Ban className="w-3.5 h-3.5 text-slate-300" />
                          )}
                        </div>

                        <div className="flex items-center justify-between text-slate-700">
                          <span>Headless GAS Center</span>
                          {perm.canAccessGasCenter ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Ban className="w-3.5 h-3.5 text-slate-300" />
                          )}
                        </div>

                        <div className="flex items-center justify-between text-slate-700">
                          <span>Analitik &amp; Statistik Kunjungan</span>
                          {perm.canViewAnalytics ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Ban className="w-3.5 h-3.5 text-slate-300" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Priority Categories Tags */}
                    <div className="mt-3 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Fokus Kategori:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {perm.priorityCategories.map((cat, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] font-medium"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pengaturan Peran & Otorisasi Edit Staf (Developer / Super Admin) */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-400 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-xs sm:text-sm text-white">
                    Pengaturan Staf &amp; Hak Edit Unit
                  </h4>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Developer &amp; Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  Tambah/kelola staf penanggung jawab (Nama, Jabatan, Email, PIN) serta batasi link yang boleh diedit oleh masing-masing unit.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenStaffManagement) {
                  onOpenStaffManagement();
                } else {
                  onOpenAdmin();
                }
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Kelola Staf &amp; PIN</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Info footnote */}
          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-600">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Peran <strong>Admin</strong> dilindungi passcode (default: <code className="font-mono font-bold text-slate-800">bkr153</code>). Memilih Admin akan membuka gerbang passcode agar perubahan struktur link hanya dapat dilakukan oleh personel terotorisasi.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Role saat ini: <strong className="text-slate-800">{currentRole}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-colors shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
