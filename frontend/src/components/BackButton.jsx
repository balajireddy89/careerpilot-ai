import React from 'react';
import { ChevronLeft } from 'lucide-react';

export default function BackButton({ onClick, label = 'Back', className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900/60 transition-all border border-slate-200 dark:border-slate-800 ${className}`}
    >
      <ChevronLeft className="w-4 h-4" /> {label}
    </button>
  );
}
