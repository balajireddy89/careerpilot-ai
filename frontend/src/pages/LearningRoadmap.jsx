import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Award, Circle, RefreshCw, AlertCircle } from 'lucide-react';
import { findRoadmapTemplate, fetchRoadmapTemplates } from '../lib/questionBankService';
import { getProfileKey, useFeatureSession } from '../hooks/useFeatureSession';

const ROADMAP_SESSION_DEFAULT = { customCourse: '' };

function topicRewardKey(monthIndex, topicIndex) {
  return `${monthIndex}-${topicIndex}`;
}

export default function LearningRoadmap({ profile, setProfile }) {
  const profileKey = getProfileKey(profile);
  const [session, setSession] = useFeatureSession('learning-roadmap', profileKey, ROADMAP_SESSION_DEFAULT);
  const [loading, setLoading] = useState(false);
  const [availableRoadmaps, setAvailableRoadmaps] = useState([]);
  const [searchError, setSearchError] = useState('');

  const displayFocus = profile.primaryPriority || profile.targetRole || profile.preferredPaths?.[0] || '';
  const roadmapState = profile.learningRoadmap?.length > 0 ? profile.learningRoadmap : [];
  const canShowTarget = Boolean(profile.college?.trim() && profile.graduationYear);

  useEffect(() => {
    async function getAvailable() {
      try {
        const templates = await fetchRoadmapTemplates();
        setAvailableRoadmaps(templates);
      } catch (err) {
        console.warn('Failed to fetch available roadmaps:', err);
      }
    }
    getAvailable();
  }, []);

  const loadTemplate = async (courseFocus) => {
    const focus = courseFocus || displayFocus;
    if (!focus) return;
    setLoading(true);
    setSearchError('');
    try {
      const template = await findRoadmapTemplate(focus);
      if (template?.months?.length) {
        await setProfile({ ...profile, learningRoadmap: template.months });
      } else {
        setSearchError(`No admin roadmap template found for "${focus}". Please choose from the available roadmaps below.`);
      }
    } catch (err) {
      console.warn('Roadmap template load failed:', err);
      setSearchError(err.message || 'Failed to load roadmap template.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTopic = async (monthIndex, topicIndex) => {
    const topic = roadmapState[monthIndex].topics[topicIndex];
    const rewardKey = topicRewardKey(monthIndex, topicIndex);
    const alreadyRewarded = profile.roadmapRewards?.[rewardKey]?.xpAwarded;
    const willComplete = !topic.status;

    const newRoadmap = roadmapState.map((m, mi) => ({
      ...m,
      topics: m.topics.map((t, ti) => (mi === monthIndex && ti === topicIndex ? { ...t, status: !t.status } : t)),
    }));

    let points = profile.points;
    let roadmapRewards = { ...(profile.roadmapRewards || {}) };

    if (willComplete && !alreadyRewarded) {
      points += 40;
      roadmapRewards[rewardKey] = { xpAwarded: true, completedAt: new Date().toISOString() };
    }

    await setProfile({ ...profile, learningRoadmap: newRoadmap, points, roadmapRewards });
  };

  const handleCustomGenerate = (e) => {
    e.preventDefault();
    const course = session.customCourse.trim();
    if (!course) return;
    loadTemplate(course);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Personalized Learning Roadmap</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {displayFocus ? (
              <>Tailored for <strong>{displayFocus}</strong> — loaded from admin roadmap templates.</>
            ) : (
              'Set your primary learning priority in Profile or onboarding.'
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadTemplate()}
          disabled={loading || !displayFocus}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-500 border border-slate-200 dark:border-slate-800 rounded-lg shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Load template
        </button>
      </div>

      <form onSubmit={handleCustomGenerate} className="glass-card p-4 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Course name e.g. Java, Machine Learning..."
          value={session.customCourse}
          onChange={(e) => setSession((prev) => ({ ...prev, customCourse: e.target.value }))}
          className="glass-input flex-1 text-sm"
        />
        <button type="submit" disabled={loading} className="bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold shrink-0">
          Load Roadmap
        </button>
      </form>

      {searchError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-600 dark:text-rose-400 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{searchError}</span>
        </div>
      )}

      {availableRoadmaps.length > 0 && (
        <div className="glass-card p-4 space-y-3">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
            <span>Available Subjects</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal normal-case">(Click to switch roadmaps)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableRoadmaps.map((r) => {
              const isDefault = displayFocus && r.course_name.toLowerCase() === displayFocus.toLowerCase();
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setSession((prev) => ({ ...prev, customCourse: r.course_name }));
                    loadTemplate(r.course_name);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    isDefault
                      ? 'bg-brand-500/15 border-brand-500/40 text-brand-600 dark:text-brand-400 font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {r.course_name} {isDefault && '★'}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {roadmapState.length === 0 && !loading && (
        <div className="glass-card p-8 text-center text-sm text-slate-500">
          No roadmap yet. Click Load template or select an available subject from the list above.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8 relative pl-8 border-l border-slate-200 dark:border-slate-800">
          {roadmapState.map((milestone, mIdx) => {
            const completedCount = milestone.topics.filter((t) => t.status).length;
            const pctComplete = Math.round((completedCount / milestone.topics.length) * 100);
            return (
              <div key={mIdx} className="relative">
                <div className={`absolute -left-11 top-1.5 w-9 h-9 rounded-full border-4 flex items-center justify-center font-bold text-xs ${
                  pctComplete === 100 ? 'bg-emerald-500 border-emerald-200 text-white' : 'bg-brand-500 border-brand-200 text-white'
                }`}>
                  {mIdx + 1}
                </div>
                <div className="glass-card p-6 space-y-4">
                  <div className="flex justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-brand-600">{milestone.month}</span>
                      <h3 className="text-base font-bold">{milestone.title}</h3>
                      <p className="text-xs text-slate-500">{milestone.desc}</p>
                    </div>
                    <span className="text-[10px] font-bold text-brand-500">{pctComplete}% Done</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {milestone.topics.map((topic, tIdx) => {
                      const rewarded = profile.roadmapRewards?.[topicRewardKey(mIdx, tIdx)]?.xpAwarded;
                      return (
                        <button
                          key={tIdx}
                          onClick={() => handleToggleTopic(mIdx, tIdx)}
                          className={`text-left p-3 rounded-xl border text-xs font-semibold flex items-start gap-2 ${
                            topic.status ? 'bg-emerald-500/5 border-emerald-500/20' : 'border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {topic.status ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Circle className="w-4 h-4 text-slate-400 shrink-0" />}
                          <span>
                            {topic.name}
                            {rewarded && <span className="block text-[9px] text-emerald-500 mt-0.5">XP earned</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="glass-card p-6 space-y-4">
          <Award className="w-5 h-5 text-amber-500" />
          <p className="text-xs text-slate-500">
            Each topic awards +40 XP <strong>once</strong>. Unchecking does not remove XP, and re-checking will not award XP again.
          </p>
          {canShowTarget ? (
            <div className="p-3 bg-brand-500/10 rounded-xl flex items-center gap-2 text-xs">
              <Calendar className="w-4 h-4 text-brand-500" />
              Target graduation: {profile.graduationYear}
              {profile.college && ` · ${profile.college}`}
            </div>
          ) : (
            <p className="text-[10px] text-slate-400">Add college and graduation year in Profile to see your target timeline.</p>
          )}
        </div>
      </div>
    </div>
  );
}
