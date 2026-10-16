import React from 'react';
import { LayoutGrid, Factory, FileSpreadsheet, Database, ShieldCheck, Flame } from 'lucide-react';

interface BottomNavProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenGasCenter: () => void;
  onOpenAdmin: () => void;
  pinnedCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  selectedCategory,
  onSelectCategory,
  onOpenGasCenter,
  onOpenAdmin,
}) => {
  const navItems = [
    { id: 'Semua', label: 'Semua', icon: LayoutGrid },
    { id: 'Operasional & Lini', label: 'Lini', icon: Factory },
    { id: 'Formulir & Shift', label: 'Shift', icon: FileSpreadsheet },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/90 px-3 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-around select-none shadow-2xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = selectedCategory === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectCategory(item.id)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all active:scale-95 ${
              isActive
                ? 'text-white bg-blue-600/30 border border-blue-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
            <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
          </button>
        );
      })}

      <button
        onClick={onOpenGasCenter}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-2xl text-slate-400 hover:text-slate-200 transition-all active:scale-95"
      >
        <Database className="w-4 h-4 text-sky-400" />
        <span className="text-[10px] font-bold tracking-tight text-sky-300">GAS</span>
      </button>

      <button
        onClick={onOpenAdmin}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-2xl text-slate-400 hover:text-slate-200 transition-all active:scale-95"
      >
        <ShieldCheck className="w-4 h-4 text-amber-400" />
        <span className="text-[10px] font-bold tracking-tight text-amber-300">Admin</span>
      </button>
    </nav>
  );
};
