import React from 'react';

interface Logo153Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export const Logo153: React.FC<Logo153Props> = ({ size = 'md', className = '', showText = false }) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative ${sizeMap[size]} shrink-0 flex items-center justify-center rounded-xl bg-white p-1 shadow-sm border border-slate-200/90 overflow-hidden`}>
        <img
          src="/logo.svg"
          alt="Logo 153 PT Batu Karang Divisi Produksi I"
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-tight text-slate-900 text-sm md:text-base leading-tight truncate">
              PT. BATU KARANG
            </span>
            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold font-mono-numbers">
              153
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase truncate">
            Divisi Produksi I
          </span>
        </div>
      )}
    </div>
  );
};
