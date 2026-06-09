import React from 'react';
import { Target, CheckCircle2, TrendingUp, FileText, Code2, Brain, MessageSquare } from 'lucide-react';
import { recalculateReadiness, hasUploadedResume } from '../mock/mockData';

function buildBreakdown(profile) {
  const resumeScore = hasUploadedResume(profile) ? (profile.resumeDetails?.score || 0) : 0;
  const codingTotal = profile.codingStats?.totalEasy + profile.codingStats?.totalMedium + profile.codingStats?.totalHard || 90;
  const codingSolved = (profile.codingStats?.solvedEasy || 0) + (profile.codingStats?.solvedMedium || 0) + (profile.codingStats?.solvedHard || 0);
  const codingScore = Math.min(100, Math.round((codingSolved / codingTotal) * 100) || Math.min(100, (profile.codingStats?.score ?? 0) / 10));
  const aptitudeScore = Math.round(
    ((profile.aptitudeStats?.quantitative ?? 0)
      + (profile.aptitudeStats?.logical ?? 0)
      + (profile.aptitudeStats?.verbal ?? 0)) / 3
  );
  const interviewScore = Math.round(
    ((profile.interviewStats?.hrScore ?? 0) + (profile.interviewStats?.techScore ?? 0)) / 2
  );
  const skillsBonus = Math.min(15, (profile.skills?.length ?? 0) * 2);
  const overall = recalculateReadiness(profile);

  return { resumeScore, codingScore, aptitudeScore, interviewScore, skillsBonus, overall };
}

export default function PlacementPredictor({ profile }) {
  const { resumeScore, codingScore, aptitudeScore, interviewScore, skillsBonus, overall } = buildBreakdown(profile);
  const displayRole = profile.primaryPriority || profile.targetRole || profile.preferredPaths?.[0] || 'your career path';

  const factors = [
    { icon: FileText, label: 'Resume (AI score)', value: resumeScore, weight: '25%', color: 'text-purple-500' },
    { icon: Code2, label: 'Coding practice', value: codingScore, weight: '25%', color: 'text-cyan-500' },
    { icon: Brain, label: 'Aptitude tests', value: aptitudeScore, weight: '20%', color: 'text-blue-500' },
    { icon: MessageSquare, label: 'Interview scores', value: interviewScore, weight: '30%', color: 'text-emerald-500' },
  ];

  const readinessLabel = overall >= 80 ? 'Strong candidate' : overall >= 60 ? 'Making progress' : overall >= 40 ? 'Needs work' : 'Just getting started';

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Placement Readiness Predictor</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Calculated automatically from your skills, resume, quizzes, coding, aptitude, and interview results — synced with Supabase.
        </p>
      </div>

      <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-1.5">
            <Target className="w-5 h-5 text-brand-500" /> Overall Placement Readiness
          </h2>
          <p className="text-xs text-slate-500 mt-1">Target: <strong>{displayRole}</strong></p>
          <p className="text-xs text-slate-400 mt-1">Resume 25% · Coding 25% · Aptitude 20% · Interview 30%</p>
        </div>
        <div className="text-center bg-brand-500/10 border border-brand-500/25 px-8 py-6 rounded-2xl">
          <div className="text-5xl font-extrabold text-brand-500">{overall}%</div>
          <div className="text-xs text-brand-500 font-bold uppercase mt-1">{readinessLabel}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {factors.map(({ icon: Icon, label, value, weight, color }) => (
          <div key={label} className="glass-card p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold flex items-center gap-2">
                <Icon className={`w-4 h-4 ${color}`} /> {label}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">{weight}</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white">{value}%</div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-brand-500 h-full rounded-full transition-all" style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase text-emerald-500 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> How to improve your score
        </h3>
        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
          {!hasUploadedResume(profile) && (
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" /> Upload resume in Resume Analyzer for AI scoring</li>
          )}
          <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Skills tracked: {profile.skills.length} (+{skillsBonus}% profile depth)</li>
          <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Complete Technical Interview quizzes</li>
          <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Solve coding challenges in Coding Practice</li>
          <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Take Aptitude Prep timed tests</li>
          <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Practice HR Interview for communication scores</li>
        </ul>
      </div>
    </div>
  );
}
