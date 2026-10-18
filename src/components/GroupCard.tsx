import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Pin, ShieldCheck, Edit3 } from 'lucide-react';
import { LinkItem } from '../types';

interface GroupCardProps {
  group: LinkItem;
  onClickLink: (id: string) => void;
  defaultExpanded?: boolean;
  canEditStaffGroup?: boolean;
  canEditStaffChildIds?: string[];
  onStaffEdit?: (link: LinkItem) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  onClickLink,
  defaultExpanded = false,
  canEditStaffGroup = false,
  canEditStaffChildIds = [],
  onStaffEdit,
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const isGroupHidden = String(group.aktif).toUpperCase() !== 'TRUE';
  const children = group.children || [];

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      onClickLink(group.id);
    }
  };

  return (
    <div className="w-full space-y-2">
      {/* Kartu Utama Grup (Identik dengan LinkCard) */}
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full bg-white rounded-2xl p-3.5 sm:p-4.5 border transition-all duration-200 flex items-center justify-between gap-3.5 text-left shadow-xs hover:shadow-md active:scale-[0.99] select-none cursor-pointer group ${
          isGroupHidden
            ? 'border-dashed border-rose-300 bg-rose-50/20 opacity-80'
            : canEditStaffGroup
            ? 'border-emerald-300 hover:border-emerald-400 bg-emerald-50/10'
            : isOpen
            ? 'border-[#0284c7] ring-2 ring-[#0284c7]/15 bg-slate-50/40'
            : 'border-[#dbe5ed] hover:border-[#0284c7]/70 hover:bg-slate-50/50'
        }`}
      >
        {/* Sisi Kiri: Ikon Grup */}
        <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl sm:text-2xl group-hover:scale-105 transition-transform shadow-2xs">
          {group.icon || '🗂️'}
        </div>

        {/* Bagian Tengah: Label Huruf Kapital + Subtitle Keterangan */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-[#004771] transition-colors uppercase tracking-tight truncate">
              {group.label}
            </h3>

            <span className="text-[9px] font-bold text-blue-700 bg-blue-100/90 px-1.5 py-0.2 rounded-full border border-blue-200 shrink-0">
              {children.length}
            </span>

            {canEditStaffGroup && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300 shrink-0">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-700" />
                Wewenang Anda
              </span>
            )}
          </div>

          <p className="text-[11px] sm:text-xs text-slate-500 font-normal mt-0.5 line-clamp-1">
            {group.deskripsi || `${children.length} tautan & formulir terintegrasi`}
          </p>
        </div>

        {/* Sisi Kanan: Chevron Dropdown Panah */}
        <div className="flex items-center gap-1 shrink-0">
          <ChevronDown
            className={`w-4 h-4 sm:w-5 sm:h-5 text-sky-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600' : ''
            }`}
          />
        </div>
      </button>

      {/* Sub-Items / Anak Tautan (Jika Terbuka) */}
      {isOpen && (
        <div className="pl-3 sm:pl-5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150 border-l-2 border-blue-200 ml-5 sm:ml-6 py-1">
          {children.length === 0 ? (
            <div className="p-3 bg-white/70 rounded-xl text-center text-xs text-slate-400 border border-slate-200">
              Belum ada tautan di dalam grup ini.
            </div>
          ) : (
            children.map((child) => {
              const canEditChild = canEditStaffChildIds.includes(child.id);
              const isChildHidden = String(child.aktif).toUpperCase() !== 'TRUE';

              return (
                <div key={child.id} className="w-full">
                  {child.url ? (
                    <a
                      href={child.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onClickLink(child.id)}
                      className={`w-full bg-white rounded-xl p-3 border transition-all duration-150 flex items-center justify-between gap-3 text-left shadow-2xs hover:shadow-sm hover:border-blue-400 group/sub ${
                        isChildHidden
                          ? 'border-dashed border-rose-300 opacity-80'
                          : canEditChild
                          ? 'border-emerald-300 bg-emerald-50/15'
                          : 'border-slate-200/90'
                      }`}
                    >
                      <div className="w-9 h-9 shrink-0 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg group-hover/sub:scale-105 transition-transform shadow-2xs">
                        {child.icon || '📄'}
                      </div>

                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs text-slate-900 group-hover/sub:text-blue-600 uppercase tracking-tight truncate">
                            {child.label}
                          </h4>
                          {canEditChild && (
                            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded shrink-0">
                              Wewenang Anda
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {child.deskripsi || child.url.replace(/^https?:\/\//, '')}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {canEditChild && onStaffEdit && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onStaffEdit(child);
                            }}
                            className="p-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors mr-1"
                            title="Perbarui Tautan"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        )}
                        <ChevronRight className="w-4 h-4 text-sky-500 group-hover/sub:translate-x-0.5 transition-transform" />
                      </div>
                    </a>
                  ) : (
                    <div className="w-full bg-white/70 rounded-xl p-3 border border-dashed border-slate-200 flex items-center justify-between text-xs text-slate-400">
                      <span>{child.label}</span>
                      <span className="text-[10px]">Belum Ada URL</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
