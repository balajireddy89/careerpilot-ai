import React from 'react';
import { Target, CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react';
import { recalculateReadiness } from '../mock/mockData';
import { getProfileKey, useFeatureSession } from '../hooks/useFeatureSession';

function buildSimDefaults(profile) {
  const aptitudeAvg = Math.round(
    ((profile.aptitudeStats?.quantitative ?? 0)
      + (profile.aptitudeStats?.logical ?? 0)
      + (profile.aptitudeStats?.verbal ?? 0)) / 3
  );
  return {
    simResume: profile.resumeDetails.score,
    simCoding: Math.round(profile.codingStats.score / 10),
    simAptitude: aptitudeAvg,
    simInterview: Math.round((profile.interviewStats.hrScore + profile.interviewStats.techScore) / 2),
  };
}

export default function PlacementPredictor({ profile }) {
  const profileKey = getProfileKey(profile);
  const [session, setSession, resetSession] = useFeatureSession(
    'placement-predictor',
    profileKey,
    buildSimDefaults(profile)
  );

  const currentScore = recalculateReadiness(profile);
  const { simResume, simCoding, simAptitude, simInterview } = session;
  const simulatedScore = Math.round(simResume * 0.25 + simCoding * 0.25 + simAptitude * 0.2 + simInterview * 0.3);

  const sliders = [
    { key: 'simResume', label: 'Resume Score', value: simResume },
    { key: 'simCoding', label: 'Coding Proficiency', value: simCoding },
    { key: 'simAptitude', label: 'Aptitude Index', value: simAptitude },
    { key: 'simInterview', label: 'Interview Readiness', value: simInterview },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Placement Readiness Predictor</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Weighted formula from your live profile — slider positions persist across tabs.</p>
        </div>
        <button type="button" onClick={() => resetSession()} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-500 border border-slate-200 dark:border-slate-800 rounded-lg shrink-0">
          <RefreshCw className="w-3 h-3" /> Reset Sliders
        </button>
      </div>

      <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-1.5"><Target className="w-5 h-5 text-brand-500" /> Overall Placement Readiness</h2>
          <p className="text-xs text-slate-500 mt-1">Resume 25% · Coding 25% · Aptitude 20% · Interview 30%</p>
        </div>
        <div className="flex gap-8 items-center">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-slate-500">{currentScore}%</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">CURRENT</div>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-400" />
          <div className="text-center bg-brand-500/10 border border-brand-500/25 px-5 py-4 rounded-2xl">
            <div className="text-4xl font-extrabold text-brand-500">{simulatedScore}%</div>
            <div className="text-[10px] text-brand-500 font-bold uppercase">SIMULATED</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sliders.map(({ key, label, value }) => (
          <div key={key} className="glass-card p-6 space-y-3">
            <div className="flex justify-between text-xs font-bold">
              <span>{label}</span>
              <span className="text-brand-500">{value}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={value}
              onChange={(e) => setSession((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
              className="w-full accent-brand-500"
            />
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <h3 className="text-sm font-bold uppercase text-emerald-500 mb-3">Live Profile Strengths</h3>
        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Skills tracked: {profile.skills.length}</li>
          <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> HR score: {profile.interviewStats.hrScore}/100</li>
          <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Tech score: {profile.interviewStats.techScore}/100</li>
        </ul>
      </div>
    </div>
  );
}
