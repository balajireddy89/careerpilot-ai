import React, { useCallback, useEffect, useState } from 'react';

export default function RocketLoader({ label = 'Loading...' }) {
  const [phase, setPhase] = useState('playing');

  const finish = useCallback(() => {
    setPhase('done');
  }, []);

  useEffect(() => {
    const timer = setTimeout(finish, 4500);
    return () => clearTimeout(timer);
  }, [finish]);

  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <img
          src="/logo.png"
          alt="CareerPilot AI"
          className="w-16 h-16 rounded-xl object-contain animate-pulse"
        />
        <p className="text-sm font-semibold text-slate-400">{label}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 overflow-hidden">
      <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
        <video
          src="/animated_video.mp4"
          autoPlay
          muted
          playsInline
          onEnded={finish}
          onError={finish}
          className="w-full h-full object-contain rounded-xl"
        />
      </div>
      <p className="text-sm font-semibold text-slate-400 animate-pulse">{label}</p>
    </div>
  );
}
