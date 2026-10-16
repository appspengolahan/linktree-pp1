import React, { useState } from 'react';
import {
  Download,
  Monitor,
  Smartphone,
  Apple,
  X,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Zap,
  WifiOff,
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Logo153 } from './Logo153';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isDesktop, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'device' | 'desktop' | 'android' | 'ios'>(() => {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'desktop';
  });
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-900/60 via-slate-900 to-slate-900 p-5 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800/90 border border-blue-500/30 rounded-xl shadow-inner shrink-0">
              <Logo153 size="md" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  Install Link Hub 153
                </h3>
                {isInstalled && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" /> Terpasang
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Aplikasi Resmi Divisi Produksi I PT Batu Karang
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-200">
          {/* Keuntungan Memasang Aplikasi */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-center">
            <div className="flex flex-col items-center">
              <Zap className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-[11px] font-bold text-white">0.01 Detik</span>
              <span className="text-[9px] text-slate-400">Buka langsung</span>
            </div>
            <div className="flex flex-col items-center border-x border-slate-700/60 px-1">
              <WifiOff className="w-4 h-4 text-sky-400 mb-1" />
              <span className="text-[11px] font-bold text-white">Mode Offline</span>
              <span className="text-[9px] text-slate-400">Data tercache</span>
            </div>
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-[11px] font-bold text-white">Layar Penuh</span>
              <span className="text-[9px] text-slate-400">Tanpa URL bar</span>
            </div>
          </div>

          {/* Tombol Install Langsung (Jika Browser Mendukung BeforeInstallPrompt) */}
          {isInstallable && !isInstalled && (
            <div className="p-4 bg-gradient-to-r from-blue-900/40 to-indigo-900/30 border border-blue-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Perangkat Siap Dipasang!
                </h4>
                <p className="text-xs text-blue-200/80 mt-0.5">
                  Tekan tombol di samping untuk menginstal langsung ke layar perangkat Anda.
                </p>
              </div>
              <button
                onClick={handleDirectInstall}
                disabled={isInstalling}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-900/30 transition-all shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isInstalling ? 'Memasang...' : 'Pasang Sekarang'}</span>
              </button>
            </div>
          )}

          {installSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Aplikasi berhasil dipasang! Cek layar utama PC/HP Anda.</span>
            </div>
          )}

          {/* Tab Selector Panduan Perangkat */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300">
                Pilih Panduan Perangkat Anda:
              </label>
              <span className="text-[10px] text-slate-400">
                {isIOS ? 'Terdeteksi: iPhone/iPad' : isAndroid ? 'Terdeteksi: Android' : 'Terdeteksi: PC/Laptop'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/80">
              <button
                onClick={() => setActiveTab('desktop')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'desktop'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>PC / Laptop</span>
              </button>

              <button
                onClick={() => setActiveTab('android')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'android'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Android</span>
              </button>

              <button
                onClick={() => setActiveTab('ios')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ios'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Apple className="w-3.5 h-3.5 text-slate-200" />
                <span>iPhone / iPad</span>
              </button>
            </div>
          </div>

          {/* Panduan PC / Laptop */}
          {activeTab === 'desktop' && (
            <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Monitor className="w-4 h-4 text-blue-400" />
                <span>Cara Install di PC / Laptop (Google Chrome, MS Edge, Brave):</span>
              </div>

              <ol className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 font-bold flex items-center justify-center shrink-0 text-[11px] border border-blue-500/40">
                    1
                  </span>
                  <div>
                    <strong>Lihat Ujung Kanan Address Bar Browser:</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Cari ikon <strong>Install / Pasang Aplikasi</strong> (berbentuk monitor kecil dengan panah bawah atau tanda <code className="bg-slate-700 px-1 py-0.5 rounded text-blue-300">⊕</code>) di samping ikon bintang bookmark.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 font-bold flex items-center justify-center shrink-0 text-[11px] border border-blue-500/40">
                    2
                  </span>
                  <div>
                    <strong>Atau Lewat Menu Browser:</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Klik tombol titik tiga <strong>(⋮)</strong> di pojok kanan atas browser &gt; pilih <strong>"Simpan dan bagikan" / "Aplikasi"</strong> &gt; pilih <strong>"Pasang halaman ini sebagai aplikasi (Install Link Hub)"</strong>.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 font-bold flex items-center justify-center shrink-0 text-[11px] border border-blue-500/40">
                    3
                  </span>
                  <div>
                    <strong>Selesai!</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Ikon <strong>Link Hub 153</strong> akan otomatis muncul di Desktop, Taskbar, dan Start Menu Windows / Mac Launchpad Anda.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          )}

          {/* Panduan Android */}
          {activeTab === 'android' && (
            <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Cara Install di HP Android (Chrome / Edge / Samsung Internet):</span>
              </div>

              <ol className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[11px] border border-emerald-500/40">
                    1
                  </span>
                  <div>
                    <strong>Tekan Titik Tiga (⋮) di Chrome:</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Buka browser Chrome di HP, lalu ketuk ikon menu titik tiga di kanan atas layar.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[11px] border border-emerald-500/40">
                    2
                  </span>
                  <div>
                    <strong>Pilih "Tambahkan ke Layar Utama" / "Instal Aplikasi":</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Ketuk menu <strong>"Instal Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[11px] border border-emerald-500/40">
                    3
                  </span>
                  <div>
                    <strong>Konfirmasi Pasang:</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Ketuk <strong>"Instal"</strong>. Logo Link Hub 153 akan langsung terpasang di layar utama HP seperti aplikasi dari Google Play Store.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          )}

          {/* Panduan iPhone / iPad (iOS Safari) */}
          {activeTab === 'ios' && (
            <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Apple className="w-4 h-4 text-slate-200" />
                <span>Cara Install di iPhone / iPad (Safari):</span>
              </div>

              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[11px] text-amber-300 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Buka portal ini melalui peramban <strong>Safari</strong> bawaan iOS.</span>
              </div>

              <ol className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center shrink-0 text-[11px] border border-slate-600">
                    1
                  </span>
                  <div>
                    <strong>Ketuk Tombol Bagikan (Share):</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Ketuk ikon <strong>Kotak dengan Panah Ke Atas</strong> <span className="inline-block bg-slate-700 px-1.5 py-0.5 rounded text-white font-mono">⎋ / [↑]</span> di bilah navigasi bawah Safari.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center shrink-0 text-[11px] border border-slate-600">
                    2
                  </span>
                  <div>
                    <strong>Pilih "Tambah ke Layar Utama":</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Gulir menu ke bawah lalu ketuk <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center shrink-0 text-[11px] border border-slate-600">
                    3
                  </span>
                  <div>
                    <strong>Ketuk "Tambah" (Add):</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Ketuk <strong>Tambah</strong> di pojok kanan atas. Ikon Link Hub 153 akan langsung tampil di beranda iPhone Anda!
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            PWA Standalone • Ringan &amp; Tanpa Unduhan Berat
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
