import React, { useState, useEffect } from 'react';
import { X, Check, RotateCcw, Type, Sparkles } from 'lucide-react';
import { BannerConfig } from '../types';
import { DEFAULT_BANNER_CONFIG } from '../services/storage';

interface EditBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BannerConfig;
  onSave: (newConfig: BannerConfig) => void;
  showToast: (msg: string) => void;
}

export const EditBannerModal: React.FC<EditBannerModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  showToast,
}) => {
  const [badge, setBadge] = useState(config.badge);
  const [title, setTitle] = useState(config.title);
  const [description, setDescription] = useState(config.description);

  useEffect(() => {
    if (isOpen) {
      setBadge(config.badge);
      setTitle(config.title);
      setDescription(config.description);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Judul utama tidak boleh kosong.');
      return;
    }
    const updated: BannerConfig = {
      badge: badge.trim() || DEFAULT_BANNER_CONFIG.badge,
      title: title.trim(),
      description: description.trim(),
    };
    onSave(updated);
    showToast('Teks banner berhasil diperbarui!');
    onClose();
  };

  const handleResetDefault = () => {
    if (window.confirm('Kembalikan teks banner ke format default awal?')) {
      setBadge(DEFAULT_BANNER_CONFIG.badge);
      setTitle(DEFAULT_BANNER_CONFIG.title);
      setDescription(DEFAULT_BANNER_CONFIG.description);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-5 py-4 bg-[#091b31] text-white flex items-center justify-between border-b border-[#1e3250]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-amber-300">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                Ubah Teks Banner Utama
              </h3>
              <p className="text-[11px] text-sky-300">
                Kustomisasi teks judul, sub-judul, dan deskripsi portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/15 text-slate-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-slate-800 flex-1">
          {/* Live Preview Box */}
          <div className="bg-gradient-to-r from-[#091b31] via-[#0d223d] to-[#071326] rounded-2xl p-4 text-white text-center shadow-inner relative overflow-hidden border border-[#1e3250]">
            <div className="text-[10px] uppercase font-bold text-sky-300 mb-2 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>Pratinjau Langsung (Live Preview)</span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white p-1 border-2 border-white/20 shadow-sm shrink-0 flex items-center justify-center">
                <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="text-amber-400 font-bold text-[10px] uppercase tracking-wider truncate">
                  {badge || 'SUB-JUDUL KOSONG'}
                </span>
                <span className="text-base sm:text-lg font-black text-white leading-tight truncate">
                  {title || 'Judul Utama Kosong'}
                </span>
              </div>
            </div>

            {description && (
              <p className="text-xs text-[#d4e5f2] mt-2 line-clamp-2 px-2 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Input 1: Sub-Judul / Badge */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Teks Atas (Badge / Sub-judul Emas)
            </label>
            <input
              type="text"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="Contoh: PT. BATU KARANG — 153"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#004771] focus:border-transparent"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Teks kecil berwarna emas yang terletak sejajar di atas nama divisi
            </span>
          </div>

          {/* Input 2: Judul Utama */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Judul Utama (Putih Tebal) *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Divisi Produksi I"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#004771] focus:border-transparent"
            />
          </div>

          {/* Input 3: Deskripsi Banner */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Deskripsi / Keterangan Banner
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan keterangan singkat mengenai portal ini..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleResetDefault}
              className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Default</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0066ff] hover:bg-[#0052cc] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
