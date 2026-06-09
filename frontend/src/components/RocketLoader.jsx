import React from 'react';

export default function RocketLoader({ label = 'Loading...' }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-6 overflow-hidden">
      <div className="rocket-scene relative w-48 h-48">
        <div className="rocket-stars absolute inset-0" aria-hidden />
        <div className="rocket-body absolute left-1/2 bottom-8 -translate-x-1/2 text-5xl animate-rocket-launch">
          🚀
        </div>
        <div className="rocket-flame absolute left-1/2 bottom-4 -translate-x-1/2 w-3 h-10 bg-gradient-to-t from-orange-500 via-amber-400 to-transparent rounded-full animate-flame" />
        <div className="rocket-trail absolute left-1/2 bottom-0 -translate-x-1/2 w-1 h-24 bg-gradient-to-t from-brand-500/60 to-transparent animate-trail" />
      </div>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 animate-pulse">{label}</p>
    </div>
  );
}
