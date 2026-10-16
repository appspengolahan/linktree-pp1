import React, { useState } from 'react';
import { X, Edit3, CheckCircle, ExternalLink, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { LinkItem, StaffMember } from '../types';
import { updateLinkByStaff } from '../services/storage';

interface StaffEditLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: LinkItem | null;
  activeStaff: StaffMember;
  onSaved: () => void;
  showToast: (msg: string) => void;
}

export const StaffEditLinkModal: React.FC<StaffEditLinkModalProps> = ({
  isOpen,
  onClose,
  link,
  activeStaff,
  onSaved,
  showToast,
}) => {
  if (!isOpen || !link) return null;

  const [label, setLabel] = useState(link.label || '');
  const [url, setUrl] = useState(link.url || '');
  const [deskripsi, setDeskripsi] = useState(link.deskripsi || '');
  const [aktif, setAktif] = useState(String(link.aktif).toUpperCase() === 'TRUE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = updateLinkByStaff(
      link.id,
      {
        label,
        url: link.tipe === 'Grup' ? '' : url,
        deskripsi,
        aktif,
      },
      activeStaff
    );

    setIsSubmitting(false);

    if (res.success) {
      showToast(res.message);
      onSaved();
      onClose();
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                Perbarui Tautan Unit Anda
              </h3>
              <p className="text-[11px] text-slate-400">
                Oleh PIC: <strong className="text-white">{activeStaff.nama}</strong> ({activeStaff.jabatan})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Target link pill */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-700">
            <span className="text-xl">{link.icon || '🔗'}</span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                ID: {link.id} · {link.kategori}
              </span>
              <strong className="text-slate-900 text-xs block truncate">{link.label}</strong>
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Judul / Label Tautan *</label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* URL (If not group) */}
          {link.tipe !== 'Grup' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Alamat URL Tujuan (Form Baru / Spreadsheet Baru) *
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Ganti dengan tautan Google Form, Sheet, atau berkas terbaru yang ingin dibagikan.
              </span>
            </div>
          )}

          {/* Deskripsi */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Keterangan / Deskripsi Ringkas</label>
            <input
              type="text"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Instruksi pengisian atau catatan teknis"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Mode Ditampilkan / Disembunyikan */}
          <div className="pt-1">
            <label className="block font-bold text-slate-700 mb-1.5">
              Mode Visibilitas di Portal Publik *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAktif(true)}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                  aktif
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>👁️ Ditampilkan</span>
              </button>

              <button
                type="button"
                onClick={() => setAktif(false)}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                  !aktif
                    ? 'border-rose-400 bg-rose-50 text-rose-800 shadow-xs ring-1 ring-rose-400'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                <EyeOff className="w-4 h-4 text-rose-600" />
                <span>👁️‍🗨️ Disembunyikan</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {aktif
                ? '🟢 Tautan dapat dilihat dan diakses publik oleh seluruh staf & operator pabrik.'
                : '🔴 Tautan disembunyikan dari portal publik. Hanya Anda (PIC) yang dapat melihatnya untuk perbaikan.'}
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 font-semibold text-slate-600"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition-colors"
            >
              Simpan Pembaruan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
