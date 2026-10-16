import React, { useState } from 'react';
import { ChevronDown, ExternalLink, Copy, Check, Eye, EyeOff, Edit3, ShieldCheck } from 'lucide-react';
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
  defaultExpanded = true,
  canEditStaffGroup = false,
  canEditStaffChildIds = [],
  onStaffEdit,
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const isGroupHidden = String(group.aktif).toUpperCase() !== 'TRUE';

  const children = group.children || [];

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      onClickLink(group.id);
    }
  };

  const handleCopy = (e: React.MouseEvent, url: string, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden w-full min-w-0 ${
        isGroupHidden
          ? 'border-dashed border-rose-300 bg-rose-50/10 opacity-90'
          : canEditStaffGroup
          ? 'border-emerald-300 shadow-2xs hover:border-emerald-400'
          : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
      }`}
    >
      {/* Group Header (Interactive Accordion) */}
      <div
        onClick={handleToggle}
        className="w-full p-3.5 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 active:bg-slate-100/80 transition-colors select-none"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-xl sm:text-2xl shadow-2xs">
            {group.icon || '🗂️'}
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-base leading-snug truncate">
                {group.label}
              </h3>
              <span className="text-[9px] sm:text-[10px] font-bold text-blue-700 bg-blue-100/90 px-2 py-0.2 rounded-full border border-blue-200 shrink-0">
                {children.length} tautan
              </span>
              {isGroupHidden && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-800 bg-rose-100/90 px-1.5 py-0.2 rounded border border-rose-300 shrink-0">
                  <EyeOff className="w-2.5 h-2.5 text-rose-700" />
                  Grup Disembunyikan
                </span>
              )}
              {canEditStaffGroup && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded border border-emerald-300 shrink-0">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-700" />
                  Wewenang Anda
                </span>
              )}
            </div>

            {group.deskripsi ? (
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1">{group.deskripsi}</p>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                <span>Direktori Dropdown</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums flex items-center gap-1">
                  <Eye className="w-3 h-3 text-slate-400" />
                  {group.klik || 0}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Chevron & Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-400 hidden xs:inline">
            {isOpen ? 'Tutup Dropdown' : 'Buka Dropdown'}
          </span>

          {canEditStaffGroup && onStaffEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStaffEdit(group);
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold shadow-2xs"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit Grup</span>
            </button>
          )}

          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 transition-transform duration-200 ${
              isOpen ? 'rotate-180 bg-blue-50 text-blue-600' : ''
            }`}
          >
            <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
      </div>

      {/* Group Children Links (Expandable Dropdown) */}
      {isOpen && (
        <div className="border-t border-slate-100 bg-slate-50/70 p-2.5 sm:p-4 animate-in fade-in duration-200">
          {children.length === 0 ? (
            <div className="text-center py-3 text-xs text-slate-400">
              Belum ada tautan di dalam grup ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {children.map((child) => {
                const canEditChild = canEditStaffChildIds.includes(child.id);
                const isChildHidden = String(child.aktif).toUpperCase() !== 'TRUE';

                return (
                  <div
                    key={child.id}
                    className={`bg-white rounded-xl border p-3 transition-all flex items-center justify-between gap-2.5 group active:scale-[0.99] ${
                      isChildHidden
                        ? 'border-dashed border-rose-300 bg-rose-50/15 opacity-90 hover:opacity-100'
                        : canEditChild
                        ? 'border-emerald-300 bg-emerald-50/15'
                        : 'border-slate-200/80 hover:border-blue-400'
                    }`}
                  >
                    <a
                      href={child.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onClickLink(child.id)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer focus:outline-none"
                    >
                      <span className="text-lg shrink-0">{child.icon || '🔗'}</span>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                            {child.label}
                          </span>
                          {isChildHidden && (
                            <span className="inline-flex items-center gap-0.5 text-[8px] font-bold bg-rose-100 text-rose-800 px-1 py-0.2 rounded border border-rose-300 shrink-0">
                              <EyeOff className="w-2 h-2 text-rose-700" />
                              Disembunyikan
                            </span>
                          )}
                          {canEditChild && !isChildHidden && (
                            <span className="text-[8px] font-bold bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded border border-emerald-300 shrink-0">
                              Bisa Diedit
                            </span>
                          )}
                        </div>
                        {child.deskripsi ? (
                          <span className="text-[10px] text-slate-500 truncate">{child.deskripsi}</span>
                        ) : child.url ? (
                          <span className="text-[10px] font-mono text-slate-400 truncate">
                            {child.url.replace(/^https?:\/\//, '')}
                          </span>
                        ) : null}
                      </div>
                    </a>

                    <div className="flex items-center gap-1 shrink-0">
                      {canEditChild && onStaffEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStaffEdit(child);
                          }}
                          className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                          title="Perbarui link ini"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}

                      <button
                        onClick={(e) => handleCopy(e, child.url, child.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-90 transition-all"
                        title="Salin tautan"
                        aria-label="Salin URL"
                      >
                        {copiedId === child.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <a
                        href={child.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onClickLink(child.id)}
                        className="p-1.5 rounded-lg bg-slate-900 group-hover:bg-blue-600 text-white transition-colors active:scale-95"
                        title="Buka tautan"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
