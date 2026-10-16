import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Sparkles } from 'lucide-react';
import { Logo153 } from './Logo153';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed banner within the last 3 days
    const dismissedTime = localStorage.getItem('bkr_pwa_banner_dismissed');
    if (dismissedTime) {
      const diff = Date.now() - Number(dismissedTime);
      if (diff < 3 * 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
        return;
      }
    }
    // Delay displaying banner slightly so page loads gracefully first
    const timer = setTimeout(() => {
      setIsDismissed(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('bkr_pwa_banner_dismissed', String(Date.now()));
  };

  const handleAction = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  // If already running in standalone PWA or user dismissed
  if (isInstalled || isDismissed) {
    return isModalOpen ? (
      <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    ) : null;
  }

  return (
    <>
      <div className="fixed bottom-16 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 z-40 sm:max-w-md animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-slate-900/95 backdrop-blur-md border border-blue-500/40 rounded-2xl p-3.5 shadow-2xl text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-slate-800 rounded-xl border border-slate-700 shrink-0">
              <Logo153 size="sm" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs text-white tracking-tight truncate">
                  Pasang Link Hub 153
                </span>
                <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold px-1 py-0.2 rounded">
                  PWA
                </span>
              </div>
              <p className="text-[10px] text-slate-300 truncate mt-0.5">
                {isIOS
                  ? 'Pasang di iPhone / iPad tanpa App Store'
                  : isAndroid
                  ? 'Buka lebih cepat & hemat kuota di Android'
                  : 'Aplikasi desktop untuk Windows / Mac'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleAction}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Tutup pemberitahuan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
