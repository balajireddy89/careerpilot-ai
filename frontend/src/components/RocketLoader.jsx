import React from 'react';

export default function RocketLoader({ label = 'Loading...' }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <div className="relative flex items-center justify-center">
        {/* Pulsing ring */}
        <div className="absolute w-20 h-20 rounded-full border-4 border-brand-500/30 animate-pulse"></div>
        {/* Spinning border */}
        <div className="w-16 h-16 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
        {/* Inner logo */}
        <img
          src="/logo.png"
          alt="CareerPilot AI"
          className="absolute w-10 h-10 rounded-lg object-contain"
        />
      </div>
      <p className="text-xs font-bold text-slate-400 tracking-wider uppercase animate-pulse mt-2">{label}</p>
    </div>
  );
}

