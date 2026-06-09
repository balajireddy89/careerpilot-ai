import React, { useMemo } from 'react';
import { Award, Zap, CheckCircle2, ChevronRight, TrendingUp, Star } from 'lucide-react';
import {
  recalculateReadiness,
  calculateProfileCompletion,
  getProfileChecklist,
  getSkillVerificationEntries,
} from '../mock/mockData';

export default function Dashboard({ profile }) {
  const profileCompletion = calculateProfileCompletion(profile);
  const checklist = getProfileChecklist(profile);
  const overallReadiness = recalculateReadiness(profile);
  const resumeScore = profile.resumeDetails?.score ?? 0;
  const internshipReadiness = Math.round(resumeScore * 0.3 + overallReadiness * 0.7);
  const skillEntries = getSkillVerificationEntries(profile);
  const interviewAvg = Math.round(
    ((profile.interviewStats?.hrScore ?? 0) + (profile.interviewStats?.techScore ?? 0)) / 2
  );
  const aptitudeAvg = Math.round(
    ((profile.aptitudeStats?.quantitative ?? 0)
      + (profile.aptitudeStats?.logical ?? 0)
      + (profile.aptitudeStats?.verbal ?? 0)) / 3
  );

  const codingTrendData = useMemo(() => {
    const total = profile.codingStats?.score ?? 0;
    if (total <= 0) return [0, 0, 0, 0, 0];
    return [0.15, 0.35, 0.55, 0.75, 1].map((f) => Math.round(total * f));
  }, [profile.codingStats?.score]);

  const skillCount = profile.skills?.length ?? 0;
  const skillGrowthPct = skillCount > 0 ? Math.min(200, skillCount * 25) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden glass-card p-6 md:p-8 bg-gradient-to-r from-brand-900/40 via-purple-900/20 to-slate-900/40 border border-brand-500/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-pink-400">{profile.name || 'Student'}</span>!
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-2">
              {profile.college || 'Complete your profile'} • Focus: <span className="font-semibold">{profile.primaryPriority || profile.targetRole || profile.preferredPaths?.[0] || 'Set in Profile'}</span>
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 dark:border-slate-800/60">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              <div>
                <div className="text-xs text-slate-500 font-semibold">STREAK</div>
                <div className="text-sm font-bold">{profile.dailyStreak} Days</div>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-500" />
              <div>
                <div className="text-xs text-slate-500 font-semibold">POINTS</div>
                <div className="text-sm font-bold">{profile.points} XP</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 flex flex-col items-center text-center">
          <h3 className="text-sm font-semibold uppercase text-slate-500 tracking-wider">Placement Readiness</h3>
          <div className="relative my-6">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="54" className="stroke-slate-200 dark:stroke-slate-800 fill-none" strokeWidth="8" />
              <circle cx="64" cy="64" r="54" className="stroke-brand-500 fill-none transition-all duration-1000" strokeWidth="8"
                strokeDasharray={2 * Math.PI * 54}
                strokeDashoffset={2 * Math.PI * 54 * (1 - overallReadiness / 100)} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-3xl font-extrabold">{overallReadiness}%</div>
          </div>
          <p className="text-xs text-slate-500">Live from Supabase profile stats</p>
        </div>

        <div className="glass-card p-6 flex flex-col items-center text-center">
          <h3 className="text-sm font-semibold uppercase text-slate-500 tracking-wider">Internship Readiness</h3>
          <div className="relative my-6">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="54" className="stroke-slate-200 dark:stroke-slate-800 fill-none" strokeWidth="8" />
              <circle cx="64" cy="64" r="54" className="stroke-blue-500 fill-none transition-all duration-1000" strokeWidth="8"
                strokeDasharray={2 * Math.PI * 54}
                strokeDashoffset={2 * Math.PI * 54 * (1 - internshipReadiness / 100)} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-3xl font-extrabold">{internshipReadiness}%</div>
          </div>
          <p className="text-xs text-slate-500">Resume + readiness composite</p>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase text-slate-500 tracking-wider">Profile Status</h3>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold">{profileCompletion}%</span>
              <span className="text-xs text-brand-500 font-semibold">Complete</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-brand-500 h-full rounded-full transition-all" style={{ width: `${profileCompletion}%` }} />
            </div>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 mt-4">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${item.done ? 'text-emerald-500' : 'text-slate-400'}`} />
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold uppercase text-slate-500 tracking-wider mb-2">Module Breakdown</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 bg-slate-100/50 dark:bg-slate-800/30 rounded-xl text-center">
              <div className="text-[10px] text-slate-500 font-semibold">RESUME</div>
              <div className="text-lg font-bold">{resumeScore}/100</div>
            </div>
            <div className="p-2.5 bg-slate-100/50 dark:bg-slate-800/30 rounded-xl text-center">
              <div className="text-[10px] text-slate-500 font-semibold">CODING</div>
              <div className="text-lg font-bold">{profile.codingStats?.score ?? 0} XP</div>
            </div>
            <div className="p-2.5 bg-slate-100/50 dark:bg-slate-800/30 rounded-xl text-center">
              <div className="text-[10px] text-slate-500 font-semibold">APTITUDE</div>
              <div className="text-lg font-bold">{aptitudeAvg}%</div>
            </div>
            <div className="p-2.5 bg-slate-100/50 dark:bg-slate-800/30 rounded-xl text-center">
              <div className="text-[10px] text-slate-500 font-semibold">INTERVIEW</div>
              <div className="text-lg font-bold">{interviewAvg}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-card p-6 lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <TrendingUp className="w-5 h-5 text-brand-500" />
            <h2 className="text-lg font-bold">Performance Analytics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-semibold flex justify-between">
                <span>SKILLS TRACKED</span>
                <span className="text-emerald-500 font-bold">{skillCount} skills</span>
              </div>
              <div className="h-40 bg-slate-100/50 dark:bg-slate-900/40 rounded-xl border flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-extrabold text-brand-500">{skillCount}</div>
                  <div className="text-xs text-slate-500 mt-1">in your Supabase profile</div>
                  {skillGrowthPct > 0 && <div className="text-[10px] text-emerald-500 mt-2">+{skillGrowthPct}% catalog growth</div>}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-semibold flex justify-between">
                <span>CODING XP</span>
                <span className="text-brand-500 font-bold">{profile.codingStats?.score ?? 0} XP</span>
              </div>
              <div className="h-40 bg-slate-100/50 dark:bg-slate-900/40 rounded-xl border flex items-end justify-between p-6">
                {codingTrendData.map((val, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5 w-8">
                    <div className="w-full bg-gradient-to-t from-brand-600 to-indigo-500 rounded-md" style={{ height: `${Math.max(8, (val / Math.max(...codingTrendData, 1)) * 100)}px` }} />
                    <span className="text-[9px] text-slate-400">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h2 className="text-lg font-bold">Achievements</h2>
          </div>
          {profile.badges?.length > 0 ? (
            <div className="space-y-4">
              {profile.badges.map((badge) => (
                <div key={badge.id} className="flex items-center gap-3 p-3 bg-slate-100/50 dark:bg-slate-800/30 rounded-xl">
                  <div className="text-2xl">{badge.icon}</div>
                  <div>
                    <div className="text-sm font-bold">{badge.name}</div>
                    <div className="text-xs text-slate-500">{badge.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-6">Complete quizzes and modules to earn badges.</p>
          )}
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-bold mb-2">Skill Verification Tracker</h2>
        <p className="text-xs text-slate-500 mb-6">Synced from profile skills & proficiency (Supabase)</p>
        {skillEntries.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            No skills yet. Add skills in <strong>Skill Assessment</strong> or upload your resume.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {skillEntries.map((skill) => (
              <div key={skill.name} className="p-4 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 rounded-xl">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-2">
                  <span className="truncate pr-2">{skill.name}</span>
                  <span className="text-slate-800 dark:text-white shrink-0">{skill.val}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className={`bg-gradient-to-r ${skill.color} h-full rounded-full`} style={{ width: `${skill.val}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 mt-1.5">{skill.level}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
