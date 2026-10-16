import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Pin, Eye, EyeOff, Edit3, ShieldCheck } from 'lucide-react';
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
    <div
      className={`group relative bg-white rounded-2xl border transition-all duration-200 p-3.5 sm:p-5 flex flex-col justify-between w-full min-w-0 ${
        isHidden
          ? 'border-dashed border-rose-300 bg-rose-50/10 opacity-90 hover:opacity-100 hover:border-rose-400'
          : isPinned
          ? 'border-amber-300/90 shadow-2xs hover:shadow-md hover:border-amber-400 bg-linear-to-b from-amber-50/25 to-white'
          : canEditByStaff
          ? 'border-emerald-300 shadow-2xs hover:shadow-md hover:border-emerald-400 bg-emerald-50/10'
          : 'border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-400/90'
      }`}
    >
      {/* Top Banner or Pin Indicator */}
      <div className="flex items-start justify-between gap-2.5 mb-2.5 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-xl bg-slate-100/90 border border-slate-200 flex items-center justify-center text-xl sm:text-2xl group-hover:scale-105 transition-transform">
            {link.icon || '🔗'}
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug group-hover:text-blue-600 transition-colors truncate">
                {link.label}
              </h3>
              {isHidden && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-800 bg-rose-100/90 px-1.5 py-0.2 rounded border border-rose-300 shrink-0">
                  <EyeOff className="w-2.5 h-2.5 text-rose-700" />
                  Disembunyikan
                </span>
              )}
              {isPinned && !isHidden && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-100/90 px-1.5 py-0.2 rounded border border-amber-300 shrink-0">
                  <Pin className="w-2.5 h-2.5 fill-amber-700" />
                  PIN
                </span>
              )}
              {canEditByStaff && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded border border-emerald-300 shrink-0">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-700" />
                  Wewenang Anda
                </span>
              )}
            </div>
            {/* Unboxed metadata */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 truncate">
              <span className="truncate">{link.kategori || 'Operasional'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums flex items-center gap-1 shrink-0">
                <Eye className="w-3 h-3 text-slate-400" />
                {link.klik || 0}
              </span>
              {link.picName && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-400 truncate">PIC: {link.picName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Copy Quick Action */}
        <button
          onClick={handleCopy}
          className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-90 transition-all shrink-0"
          title="Salin tautan ke clipboard"
          aria-label="Salin URL"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Description */}
      {link.deskripsi && (
        <p className="text-xs text-slate-600 mb-3 leading-relaxed line-clamp-2">
          {link.deskripsi}
        </p>
      )}

      {/* Action Footer */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto min-w-0">
        <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 truncate flex-1 min-w-0">
          {link.url.replace(/^https?:\/\//, '')}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Tombol Khusus Staf: Perbarui Link */}
          {canEditByStaff && onStaffEdit && (
            <button
              onClick={() => onStaffEdit(link)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shadow-2xs transition-all active:scale-95"
              title="Perbarui alamat URL atau keterangan dokumen ini"
            >
              <Edit3 className="w-3 h-3" />
              <span>Perbarui</span>
            </button>
          )}

          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-[11px] font-bold shadow-xs transition-all active:scale-95"
          >
            <span>Buka</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
