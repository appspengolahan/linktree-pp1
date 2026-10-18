import React, { useState } from 'react';
import { ChevronRight, ExternalLink, Copy, Check, Pin, Eye, Edit3, ShieldCheck } from 'lucide-react';
import { LinkItem } from '../types';

interface LinkCardProps {
  link: LinkItem;
  onClickLink: (id: string) => void;
  canEditByStaff?: boolean;
  onStaffEdit?: (link: LinkItem) => void;
}

export const LinkCard: React.FC<LinkCardProps> = ({
  link,
  onClickLink,
  canEditByStaff = false,
  onStaffEdit,
}) => {
  const [copied, setCopied] = useState(false);
  const isPinned = String(link.pinned).toUpperCase() === 'TRUE';
  const isHidden = String(link.aktif).toUpperCase() !== 'TRUE';

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!link.url) return;
    navigator.clipboard.writeText(link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClick = () => {
    onClickLink(link.id);
  };

  return (
    <div className="relative group w-full">
      {link.url ? (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className={`w-full bg-white rounded-2xl p-3.5 sm:p-4.5 border transition-all duration-200 flex items-center justify-between gap-3.5 text-left shadow-xs hover:shadow-md active:scale-[0.99] select-none ${
            isHidden
              ? 'border-dashed border-rose-300 bg-rose-50/20 opacity-80'
              : isPinned
              ? 'border-amber-300/80 hover:border-amber-400 bg-linear-to-r from-amber-50/20 via-white to-white'
              : canEditByStaff
              ? 'border-emerald-300 hover:border-emerald-400 bg-emerald-50/10'
              : 'border-[#dbe5ed] hover:border-[#0284c7]/70 hover:bg-slate-50/50'
          }`}
        >
          {/* Sisi Kiri: Ikon Khas Referensi */}
          <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl sm:text-2xl group-hover:scale-105 transition-transform shadow-2xs">
            {link.icon || '🔗'}
          </div>

          {/* Bagian Tengah: Judul Huruf Kapital + Subtitle Keterangan */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-[#004771] transition-colors uppercase tracking-tight truncate">
                {link.label}
              </h3>

              {isPinned && !isHidden && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-100/90 px-1.5 py-0.2 rounded border border-amber-300 shrink-0">
                  <Pin className="w-2.5 h-2.5 fill-amber-700" />
                  PIN
                </span>
              )}

              {canEditByStaff && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300 shrink-0">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-700" />
                  Wewenang Anda
                </span>
              )}
            </div>

            <p className="text-[11px] sm:text-xs text-slate-500 font-normal mt-0.5 line-clamp-1">
              {link.deskripsi || link.kategori || 'Tautan Operasional Resmi PT Batu Karang'}
            </p>
          </div>

          {/* Sisi Kanan: Chevron Panah Khas Referensi */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Quick Copy Link (Hover Only) */}
            <button
              onClick={handleCopy}
              className="hidden sm:group-hover:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Salin URL"
              aria-label="Salin URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Tombol Staf Edit jika berwenang */}
            {canEditByStaff && onStaffEdit && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onStaffEdit(link);
                }}
                className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors mr-1"
                title="Perbarui Tautan ini"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-sky-500 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </a>
      ) : (
        /* Status jika tautan belum diisi */
        <div className="w-full bg-white/80 rounded-2xl p-3.5 sm:p-4.5 border border-dashed border-slate-300 flex items-center justify-between gap-3.5 text-left shadow-2xs opacity-75">
          <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl sm:text-2xl text-slate-400">
            {link.icon || '🔗'}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-700 uppercase tracking-tight truncate">
              {link.label}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
              {link.deskripsi || 'Menunggu penambahan URL resmi'}
            </p>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg shrink-0">
            Belum Ada URL
          </span>
        </div>
      )}
    </div>
  );
};
