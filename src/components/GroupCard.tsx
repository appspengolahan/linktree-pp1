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
  isPublicMode?: boolean;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  onClickLink,
  defaultExpanded = false,
  canEditStaffGroup = false,
  canEditStaffChildIds = [],
  onStaffEdit,
  isPublicMode = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const isGroupHidden = String(group.aktif).toUpperCase() !== 'TRUE';
  const allChildren = group.children || [];
  const children = isPublicMode
    ? allChildren.filter((c) => String(c.aktif).toUpperCase() === 'TRUE')
    : allChildren;

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
      <div
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        className={`w-full bg-white rounded-2xl p-3.5 sm:p-4.5 border transition-all duration-200 flex items-center justify-between gap-3.5 text-left shadow-xs hover:shadow-md active:scale-[0.99] select-none cursor-pointer group ${
          isGroupHidden
            ? 'border-dashed border-rose-300 bg-rose-50/20 opacity-80'
            : canEditStaffGroup
            ? 'border-emerald-300 hover:border-emerald-400 bg-emerald-50/10'
            : isOpen
            ? 'border-[#0066ff] ring-2 ring-[#0066ff]/15 bg-slate-50/40'
            : 'border-slate-200/90 hover:border-[#0066ff]/60 hover:bg-slate-50/50'
        }`}
      >
        {/* Sisi Kiri: Ikon Grup */}
        <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-[#f0f7ff] border border-[#dbeafe] flex items-center justify-center text-xl sm:text-2xl group-hover:scale-105 transition-transform shadow-2xs">
          {group.icon || '🗂️'}
        </div>

        {/* Bagian Tengah: Label Huruf Kapital + Subtitle Keterangan */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-[#0066ff] transition-colors uppercase tracking-tight truncate">
              {group.label}
            </h3>

            <span className="text-[9px] font-bold text-[#0066ff] bg-[#eff6ff] px-1.5 py-0.2 rounded-full border border-[#bfdbfe] shrink-0">
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

        {/* Sisi Kanan: Tombol Edit & Chevron Dropdown Panah */}
        <div className="flex items-center gap-1 shrink-0">
          {canEditStaffGroup && onStaffEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onStaffEdit(group);
              }}
              className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors mr-1 cursor-pointer"
              title="Edit nama grup atau kategori ini"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          <ChevronDown
            className={`w-4 h-4 sm:w-5 sm:h-5 text-[#0066ff] transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

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
                    <div
                      role="link"
                      tabIndex={0}
                      onClick={() => {
                        onClickLink(child.id);
                        if (child.url) window.open(child.url, '_blank', 'noopener,noreferrer');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onClickLink(child.id);
                          if (child.url) window.open(child.url, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className={`w-full bg-white rounded-xl p-3 border transition-all duration-150 flex items-center justify-between gap-3 text-left shadow-2xs hover:shadow-sm hover:border-blue-400 cursor-pointer group/sub ${
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
                          <h4 className="font-bold text-xs text-slate-900 group-hover/sub:text-[#0066ff] uppercase tracking-tight truncate">
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
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onStaffEdit(child);
                            }}
                            className="p-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors mr-1 cursor-pointer"
                            title="Perbarui Tautan"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        )}
                        <ChevronRight className="w-4 h-4 text-[#0066ff] group-hover/sub:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full bg-white/80 rounded-xl p-3 border border-dashed border-slate-300 flex items-center justify-between text-xs text-slate-500 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{child.icon || '📄'}</span>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 truncate block">{child.label}</span>
                          <span className="text-[10px] text-slate-400 truncate block">{child.deskripsi || 'Belum ada URL'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {canEditChild && onStaffEdit && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onStaffEdit(child);
                            }}
                            className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                            title="Isi URL tautan"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                            <span>Isi URL</span>
                          </button>
                        )}
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Belum Ada URL</span>
                      </div>
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
