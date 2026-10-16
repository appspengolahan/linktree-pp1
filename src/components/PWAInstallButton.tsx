import React, { useState } from 'react';
import { Download, CheckCircle2, Smartphone, Monitor } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'compact' | 'badge';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = async () => {
    // If the browser supports beforeinstallprompt and it is available, trigger directly
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setIsModalOpen(true);
      }
    } else {
      // Otherwise open the guided install modal (iOS Safari, Desktop Chrome manual, etc.)
      setIsModalOpen(true);
    }
  };

  // If app is already running as standalone PWA
  if (isInstalled) {
    if (variant === 'badge') {
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 ${className}`}>
          <CheckCircle2 className="w-3 h-3" /> App PWA
        </span>
      );
    }
    if (variant === 'sidebar') {
      return (
        <button
          onClick={() => setIsModalOpen(true)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-slate-800 transition-colors ${className}`}
          title="Aplikasi telah terpasang dalam mode PWA Standalone"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="truncate">Aplikasi Terpasang</span>
        </button>
      );
    }
    return null;
  }

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleClick}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-900/30 transition-all active:scale-95 cursor-pointer border border-blue-400/30 ${className}`}
          title="Pasang aplikasi di PC/Laptop atau Handphone"
        >
          <Download className="w-3.5 h-3.5 animate-bounce" />
          <span>Install App</span>
        </button>
      )}

      {variant === 'compact' && (
        <button
          onClick={handleClick}
          className={`flex items-center gap-1 p-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer ${className}`}
          title="Install Link Hub ke Layar Utama"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="text-[11px]">Install</span>
        </button>
      )}

      {variant === 'sidebar' && (
        <button
          onClick={handleClick}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-500 hover:to-indigo-500 border border-blue-400/40 shadow-sm transition-all active:scale-95 cursor-pointer ${className}`}
          title="Install Link Hub di PC atau HP"
        >
          <Download className="w-4 h-4 text-white shrink-0" />
          <span className="truncate">Install Aplikasi</span>
          <span className="ml-auto text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-mono">
            {isIOS ? 'iOS' : isAndroid ? 'HP' : 'PC'}
          </span>
        </button>
      )}

      <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
