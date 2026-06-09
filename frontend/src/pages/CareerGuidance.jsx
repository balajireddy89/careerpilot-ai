import React, { useEffect, useState, useMemo } from 'react';
import { Compass, Target, Check, ArrowRight, RefreshCw } from 'lucide-react';
import { CAREER_PATHS } from '../mock/mockData';
import { analyzeAllCareerPaths } from '../lib/aiService';
import { getProfileKey, useFeatureSession } from '../hooks/useFeatureSession';

const GUIDANCE_SESSION_DEFAULT = { aiPaths: null };

export default function CareerGuidance({ profile, setProfile }) {
  const profileKey = getProfileKey(profile);
  const [session, setSession] = useFeatureSession('career-guidance', profileKey, GUIDANCE_SESSION_DEFAULT);
  const [loading, setLoading] = useState(false);

  const loadAiAnalysis = () => {
    setLoading(true);
    analyzeAllCareerPaths({ profile, paths: CAREER_PATHS })
      .then((paths) => setSession({ aiPaths: paths }))
      .catch((err) => console.warn('Career AI analysis failed:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!session.aiPaths) loadAiAnalysis();
  }, [profile.email]);

  const pathsWithAi = useMemo(() => {
    const aiMap = Object.fromEntries((session.aiPaths || []).map((p) => [p.id, p]));
    return CAREER_PATHS.map((path) => {
      const ai = aiMap[path.id];
      return {
        ...path,
        match: ai?.matchPercent ?? path.match,
        whyMatch: ai?.reasoning || path.whyMatch,
        missingSkills: ai?.missingSkills?.length ? ai.missingSkills : path.missingSkills,
        nextSteps: ai?.nextSteps?.length ? ai.nextSteps : path.nextSteps,
      };
    });
  }, [session.aiPaths]);

  const handleSelectTargetRole = (roleName) => {
    setProfile({ ...profile, targetRole: roleName, points: profile.points + 20 });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">AI Career Guidance</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">OpenRouter analyzes your skills against each career path.</p>
        </div>
        <button type="button" onClick={loadAiAnalysis} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-500 border border-slate-200 dark:border-slate-800 rounded-lg shrink-0">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh AI
        </button>
      </div>

      <div className="glass-card p-6 bg-gradient-to-r from-blue-900/10 to-brand-900/10 border border-brand-500/10 flex items-center gap-3">
        <Target className="w-6 h-6 text-brand-500" />
        <div>
          <h3 className="text-sm text-slate-500">Current Target</h3>
          <p className="text-xl font-extrabold">{profile.targetRole}</p>
        </div>
      </div>

      {loading && !session.aiPaths && (
        <p className="text-xs text-slate-400 flex items-center gap-2"><RefreshCw className="w-3 h-3 animate-spin" /> OpenRouter analyzing career paths...</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pathsWithAi.map((path) => {
          const isTargeted = profile.targetRole.toLowerCase() === path.name.toLowerCase();
          return (
            <div key={path.id} className={`glass-card p-6 flex flex-col justify-between ${isTargeted ? 'border-brand-500 ring-2 ring-brand-500/20' : ''}`}>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-md font-bold">{path.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{path.description}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-brand-500/10 text-brand-500">{path.match}% Match</span>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-brand-500" /> AI MATCH ANALYSIS
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic">&ldquo;{path.whyMatch}&rdquo;</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {path.missingSkills.map((skill, index) => (
                    <span key={index} className="px-2 py-0.5 bg-rose-100/30 text-rose-600 rounded-md text-[10px] font-bold">{skill}</span>
                  ))}
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc pl-4">
                  {path.nextSteps.map((step, index) => <li key={index}>{step}</li>)}
                </ul>
              </div>
              <div className="pt-6">
                {isTargeted ? (
                  <div className="w-full py-2 bg-emerald-500/10 text-emerald-500 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4" /> Active Goal
                  </div>
                ) : (
                  <button onClick={() => handleSelectTargetRole(path.name)} className="w-full py-2 border border-slate-200 dark:border-slate-800 hover:border-brand-500 font-bold rounded-xl text-xs flex items-center justify-center gap-1">
                    Select as Target <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
