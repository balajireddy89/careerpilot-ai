import React, { useState, useEffect } from 'react';
import { BookOpen, Check, Plus, AlertCircle, X, RefreshCw, ExternalLink } from 'lucide-react';
import { hasUploadedResume } from '../mock/mockData';
import { getSkillGapAnalysis } from '../lib/aiService';
import { filterSkillSuggestions } from '../lib/csSkillsCatalog';
import { getProfileKey, useFeatureSession } from '../hooks/useFeatureSession';

const SKILL_SESSION_DEFAULT = {
  newSkill: '',
  showSuggestions: false,
  skillGap: null,
};

export default function SkillAssessment({ profile, setProfile, onNavigate }) {
  const profileKey = getProfileKey(profile);
  const [session, setSession] = useFeatureSession('skill-assessment', profileKey, SKILL_SESSION_DEFAULT);
  const [loadingGap, setLoadingGap] = useState(false);

  const { newSkill, skillGap } = session;
  const suggestions = filterSkillSuggestions(newSkill, profile.skills);

  const displayRole = profile.primaryPriority || profile.targetRole || profile.preferredPaths?.[0] || 'your target role';

  useEffect(() => {
    if (skillGap || loadingGap) return;
    setLoadingGap(true);
    getSkillGapAnalysis({ profile })
      .then((gap) => setSession((prev) => ({ ...prev, skillGap: gap })))
      .catch((err) => console.warn('Skill gap AI failed:', err))
      .finally(() => setLoadingGap(false));
  }, [profile.skills?.length, displayRole]);

  const addSkill = (skillName) => {
    const skill = skillName.trim();
    if (!skill || profile.skills.includes(skill)) return;
    setProfile({
      ...profile,
      skills: [...profile.skills, skill],
      skillsProficiency: { ...profile.skillsProficiency, [skill]: 'Beginner' },
      points: profile.points + 25,
    });
    setSession((prev) => ({ ...prev, newSkill: '', showSuggestions: false }));
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    addSkill(newSkill);
  };

  const handleRemoveSkill = (skill) => {
    const updatedSkills = profile.skills.filter((s) => s !== skill);
    const updatedProficiency = { ...profile.skillsProficiency };
    delete updatedProficiency[skill];
    setProfile({
      ...profile,
      skills: updatedSkills,
      skillsProficiency: updatedProficiency,
    });
  };

  const missingSkills = skillGap?.missingSkills || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">AI Skill Assessment</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Manage your skills catalog and view AI gap analysis for <strong>{displayRole}</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8 lg:col-span-2">
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-bold">Skills Catalog</h2>
            <form onSubmit={handleAddSkill} className="relative">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a skill and press Enter..."
                  value={newSkill}
                  onChange={(e) => setSession((prev) => ({
                    ...prev,
                    newSkill: e.target.value,
                    showSuggestions: true,
                  }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill(newSkill);
                    }
                  }}
                  className="glass-input flex-1 py-2"
                  autoComplete="off"
                />
                <button type="submit" className="bg-brand-600 text-white px-5 rounded-xl font-bold flex items-center gap-1.5 text-sm">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              {session.showSuggestions && newSkill.trim() && suggestions.length > 0 && (
                <ul className="absolute z-10 left-0 right-14 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden">
                  {suggestions.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => addSkill(s)}
                        className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-brand-500/10"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[10px] text-slate-400 mt-2">
                Pick from suggestions or press Enter to add a custom skill.
              </p>
            </form>
            <div className="flex flex-wrap gap-2.5 pt-2">
              {profile.skills.length === 0 ? (
                <p className="text-xs text-slate-500">No skills yet — add your first skill above.</p>
              ) : (
                profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3.5 py-1.5 bg-brand-100/60 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 rounded-xl text-xs font-bold flex items-center gap-1.5 group"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-0.5 p-0.5 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-500"
                      title="Remove skill"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {!hasUploadedResume(profile) && (
            <div className="glass-card p-5 border border-amber-500/30 bg-amber-500/5 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Resume not uploaded yet</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  To auto-extract skills from your resume, upload it in the <strong>Resume Analyzer</strong> tab.
                  Skill extraction uses the same OpenRouter AI model as the career chatbot.
                </p>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('resume')}
                    className="text-xs font-bold text-brand-600 flex items-center gap-1 hover:underline"
                  >
                    Go to Resume Analyzer <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-bold">Verify Your Skills</h2>
            <p className="text-xs text-slate-500">
              Take AI-generated MCQ quizzes in the Technical Interview module. Scores sync to your profile and award XP once per topic.
            </p>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('tech-interview')}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" /> Click here to check your skills
              </button>
            )}
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-bold">AI Skill Gap Analysis</h2>
          <div className="text-xs text-slate-500">
            Role: <span className="font-bold text-slate-800 dark:text-white">{displayRole}</span>
          </div>
          {loadingGap ? (
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-3 h-3 animate-spin" /> Loading AI analysis...
            </p>
          ) : (
            <>
              {missingSkills.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs text-rose-500 font-bold">MISSING SKILLS</div>
                  <div className="flex flex-wrap gap-1.5">
                    {missingSkills.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-rose-100/40 text-rose-600 rounded-md text-[10px] font-bold">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {skillGap?.recommendation && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">{skillGap.recommendation}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
