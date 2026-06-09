import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Award, Circle, RefreshCw } from 'lucide-react';
import { generateRoadmapWithAI } from '../lib/aiService';
import { getProfileKey, useFeatureSession } from '../hooks/useFeatureSession';

const FALLBACK_ROADMAP = [
  {
    month: 'Month 1',
    title: 'Core Foundations',
    desc: 'Build programming and database fundamentals.',
    topics: [
      { name: 'OOP Principles', status: false },
      { name: 'SQL Basics', status: false },
      { name: 'Git Version Control', status: false },
    ],
  },
  {
    month: 'Month 2',
    title: 'Frontend Skills',
    desc: 'Learn modern web development.',
    topics: [
      { name: 'JavaScript ES6+', status: false },
      { name: 'React Fundamentals', status: false },
      { name: 'Responsive UI', status: false },
    ],
  },
  {
    month: 'Month 3',
    title: 'Backend Development',
    desc: 'APIs and server-side logic.',
    topics: [
      { name: 'REST API Design', status: false },
      { name: 'Database Integration', status: false },
      { name: 'Authentication', status: false },
    ],
  },
  {
    month: 'Month 4',
    title: 'Interview Prep',
    desc: 'Placement readiness and mock interviews.',
    topics: [
      { name: 'Coding Practice', status: false },
      { name: 'HR Mock Sessions', status: false },
      { name: 'Resume Optimization', status: false },
    ],
  },
];

const ROADMAP_SESSION_DEFAULT = { roadmapState: null, aiGenerated: false };

export default function LearningRoadmap({ profile, setProfile }) {
  const profileKey = getProfileKey(profile);
  const [session, setSession] = useFeatureSession('learning-roadmap', profileKey, ROADMAP_SESSION_DEFAULT);
  const [generating, setGenerating] = useState(false);

  const roadmapState = session.roadmapState || FALLBACK_ROADMAP;

  const generateRoadmap = () => {
    setGenerating(true);
    generateRoadmapWithAI({ profile })
      .then((months) => setSession({ roadmapState: months, aiGenerated: true }))
      .catch((err) => {
        console.warn('Roadmap AI failed:', err);
        if (!session.roadmapState) setSession({ roadmapState: FALLBACK_ROADMAP, aiGenerated: false });
      })
      .finally(() => setGenerating(false));
  };

  useEffect(() => {
    if (!session.roadmapState) generateRoadmap();
  }, [profile.email]);

  const handleToggleTopic = (monthIndex, topicIndex) => {
    const newRoadmap = roadmapState.map((m, mi) => ({
      ...m,
      topics: m.topics.map((t, ti) => (mi === monthIndex && ti === topicIndex ? { ...t, status: !t.status } : t)),
    }));
    setSession((prev) => ({ ...prev, roadmapState: newRoadmap }));

    const topic = roadmapState[monthIndex].topics[topicIndex];
    if (!topic.status) {
      setProfile({ ...profile, points: profile.points + 40 });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">AI Personalized Roadmap</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {session.aiGenerated ? 'OpenRouter-generated plan' : 'Default plan'} for <strong>{profile.targetRole}</strong>. Progress persists across tabs.
          </p>
        </div>
        <button type="button" onClick={generateRoadmap} disabled={generating} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-500 border border-slate-200 dark:border-slate-800 rounded-lg shrink-0">
          <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} /> Regenerate
        </button>
      </div>

      {generating && !session.roadmapState && (
        <p className="text-xs text-slate-400 flex items-center gap-2"><RefreshCw className="w-3 h-3 animate-spin" /> OpenRouter building your roadmap...</p>
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
                    {milestone.topics.map((topic, tIdx) => (
                      <button
                        key={tIdx}
                        onClick={() => handleToggleTopic(mIdx, tIdx)}
                        className={`text-left p-3 rounded-xl border text-xs font-semibold flex items-start gap-2 ${
                          topic.status ? 'bg-emerald-500/5 border-emerald-500/20' : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {topic.status ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Circle className="w-4 h-4 text-slate-400 shrink-0" />}
                        {topic.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="glass-card p-6 space-y-4">
          <Award className="w-5 h-5 text-amber-500" />
          <p className="text-xs text-slate-500">Each completed topic awards +40 XP. Roadmap checklist state is saved in your browser session.</p>
          <div className="p-3 bg-brand-500/10 rounded-xl flex items-center gap-2 text-xs">
            <Calendar className="w-4 h-4 text-brand-500" />
            Target: {profile.graduationYear || 2027}
          </div>
        </div>
      </div>
    </div>
  );
}
