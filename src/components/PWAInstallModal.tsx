import React, { useState } from 'react';
import {
  Download,
  Monitor,
  Smartphone,
  Apple,
  X,
  CheckCircle2,
  Sparkles,
  Zap,
  WifiOff,
  ShieldCheck,
  Copy,
  Check,
  Share2,
  ExternalLink,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { Logo153 } from './Logo153';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isDesktop, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'desktop' | 'android' | 'ios'>(() => {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'desktop';
  });
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHelperNotice, setShowHelperNotice] = useState(false);

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    setIsInstalling(true);
    setShowHelperNotice(false);

    try {
      if (isInstallable) {
        const success = await install();
        if (success) {
          setInstallSuccess(true);
          return;
        }
      }
      
      // If browser doesn't expose automatic prompt (e.g. iOS Safari, Chrome in-app webview, or manual mode)
      setShowHelperNotice(true);
    } catch (err) {
      console.warn('Direct install failed:', err);
      setShowHelperNotice(true);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Link Hub 153 - PT Batu Karang',
          text: 'Portal resmi Divisi Produksi I PT Batu Karang',
          url: window.location.origin,
        });
      } catch {
        // Ignored dismissal
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-900/80 via-slate-900 to-slate-900 p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800/90 border border-blue-500/40 rounded-xl shadow-inner shrink-0">
              <Logo153 size="md" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
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
            className="p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-200">
          {/* TOMBOL UTAMA INSTALL LANGSUNG (ALWAYS VISIBLE & PROMINENT) */}
          <div className="p-4 bg-gradient-to-br from-blue-600/20 via-indigo-900/30 to-slate-800/80 border-2 border-blue-500/60 rounded-2xl shadow-xl flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-1.5">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  {isInstalled
                    ? 'Sudah Terpasang di Perangkat Ini'
                    : isInstallable
                    ? 'Perangkat Mendukung Pasang 1-Klik'
                    : 'Instalasi Cepat ke Layar Utama'}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white">
                  {isInstalled
                    ? 'Link Hub 153 Siap Digunakan'
                    : 'Pasang Langsung ke HP / Laptop'}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {isInstalled
                    ? 'Aplikasi telah aktif dalam mode mandiri (Standalone PWA).'
                    : 'Buka lebih cepat, tanpa perlu ketik alamat URL lagi di browser.'}
                </p>
              </div>
            </div>

            {/* Tombol Install Utama */}
            {isInstalled ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Aplikasi sudah terpasang di HP/PC Anda. Silakan cek menu aplikasi utama.</span>
              </div>
            ) : (
              <button
                onClick={handleDirectInstall}
                disabled={isInstalling}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-600/40 transition-all cursor-pointer border border-blue-300/40"
              >
                <Download className={`w-5 h-5 ${isInstalling ? 'animate-bounce' : ''}`} />
                <span>
                  {isInstalling
                    ? 'Menyiapkan Pemasangan...'
                    : 'Pasang / Install Aplikasi Sekarang'}
                </span>
              </button>
            )}

            {installSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">Berhasil! Link Hub 153 telah ditambahkan ke layar perangkat Anda.</span>
              </div>
            )}

            {/* Notice jika browser memerlukan klik menu bawaan (misal di Safari iOS atau preview Chrome) */}
            {showHelperNotice && !installSuccess && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-300">
                    {isIOS
                      ? 'Gunakan Menu Safari iOS:'
                      : isAndroid
                      ? 'Gunakan Menu Chrome HP:'
                      : 'Gunakan Menu Browser PC:'}
                  </p>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    {isIOS ? (
                      <>
                        Ketuk tombol <strong>Bagikan (Share)</strong> <span className="bg-slate-800 px-1 py-0.5 rounded font-mono">⎋</span> di bagian bawah Safari, lalu pilih <strong>"Tambah ke Layar Utama"</strong>.
                      </>
                    ) : isAndroid ? (
                      <>
                        Ketuk menu <strong>titik tiga (⋮)</strong> di kanan atas Chrome, lalu pilih <strong>"Instal aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
                      </>
                    ) : (
                      <>
                        Klik tombol <strong>Install (⊞)</strong> di ujung kanan bilah alamat (address bar), atau klik menu titik tiga <strong>(⋮) &gt; Simpan dan Bagikan &gt; Pasang Halaman ini</strong>.
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Keuntungan Memasang Aplikasi */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-center">
            <div className="flex flex-col items-center">
              <Zap className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-[11px] font-bold text-white">0.01 Detik</span>
              <span className="text-[9px] text-slate-400">Akses instan</span>
            </div>
            <div className="flex flex-col items-center border-x border-slate-700/60 px-1">
              <WifiOff className="w-4 h-4 text-sky-400 mb-1" />
              <span className="text-[11px] font-bold text-white">Offline Ready</span>
              <span className="text-[9px] text-slate-400">Tersimpan lokal</span>
            </div>
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-[11px] font-bold text-white">Layar Penuh</span>
              <span className="text-[9px] text-slate-400">Seperti aplikasi native</span>
            </div>
          </div>

          {/* Panduan Cepat 2-Langkah Sesuai Perangkat */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span>Panduan Cara Pasang Manual</span>
                <span className="text-[10px] text-blue-400 font-normal">
                  ({isIOS ? 'iPhone/iPad' : isAndroid ? 'HP Android' : 'PC/Laptop'})
                </span>
              </h5>

              {/* Tab Switcher jika ingin melihat cara perangkat lain */}
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                <button
                  onClick={() => setActiveTab('android')}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                    activeTab === 'android'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Android
                </button>
                <button
                  onClick={() => setActiveTab('desktop')}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                    activeTab === 'desktop'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  PC
                </button>
                <button
                  onClick={() => setActiveTab('ios')}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                    activeTab === 'ios'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  iOS
                </button>
              </div>
            </div>

            {/* TAB ANDROID */}
            {activeTab === 'android' && (
              <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60 space-y-2.5">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Langkah Cepat di HP Android (Google Chrome):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/50 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <div>
                      <strong className="text-white">Ketuk Titik Tiga (⋮)</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Di pojok kanan atas browser Google Chrome HP Anda.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/50 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <div>
                      <strong className="text-white">Pilih "Instal Aplikasi"</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Atau pilih <strong>"Tambahkan ke Layar Utama"</strong> &gt; Klik Instal.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB DESKTOP / PC */}
            {activeTab === 'desktop' && (
              <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60 space-y-2.5">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Monitor className="w-4 h-4 text-blue-400" />
                  <span>Langkah Cepat di PC / Laptop (Chrome / Edge):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/50 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <div>
                      <strong className="text-white">Lihat Address Bar Browser</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Klik ikon <strong>Install (⊞)</strong> di ujung kanan bilah pencarian URL.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/50 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <div>
                      <strong className="text-white">Klik Tombol "Instal"</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Aplikasi langsung muncul di desktop dan taskbar PC Anda.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB IOS */}
            {activeTab === 'ios' && (
              <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60 space-y-2.5">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Apple className="w-4 h-4 text-slate-200" />
                  <span>Langkah Cepat di iPhone / iPad (Safari):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/50 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-700 text-white border border-slate-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <div>
                      <strong className="text-white">Ketuk Tombol Bagikan</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Ikon kotak panah ke atas <span className="font-mono bg-slate-800 px-1 py-0.5 rounded text-white">[↑]</span> di bilah bawah Safari.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/50 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-700 text-white border border-slate-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <div>
                      <strong className="text-white">Pilih "Tambah ke Layar Utama"</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Gulir menu ke bawah &gt; ketuk Tambahkan di pojok kanan atas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Aksi Bantu: Salin Link jika dibuka di in-app browser */}
          <div className="p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl flex items-center justify-between gap-2">
            <div className="text-[11px] text-slate-400 truncate">
              {copied ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Link berhasil disalin ke clipboard!
                </span>
              ) : (
                <span>Buka di browser Chrome/Safari untuk hasil terbaik:</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-600/60 transition-colors cursor-pointer"
                title="Salin alamat link web"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin Link'}</span>
              </button>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleShare}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-600/60 transition-colors cursor-pointer"
                  title="Bagikan aplikasi"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            PWA Standalone • Ukuran &lt; 1MB • Ringan &amp; Cepat
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
