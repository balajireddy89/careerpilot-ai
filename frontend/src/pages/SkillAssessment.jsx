import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Check, Plus, AlertCircle, Play, ChevronRight, RefreshCw } from 'lucide-react';
import { TECH_QUIZZES } from '../mock/mockData';
import { extractSkillsFromResume, getSkillGapAnalysis } from '../lib/aiService';
import { extractTextFromFile } from '../lib/aiUtils';
import { getProfileKey, useFeatureSession } from '../hooks/useFeatureSession';

const SKILL_SESSION_DEFAULT = {
  newSkill: '',
  resumeParsed: false,
  resumeSummary: '',
  selectedTopic: null,
  quizStarted: false,
  currentQIndex: 0,
  selectedAnswer: '',
  score: 0,
  quizFinished: false,
  skillGap: null,
};

export default function SkillAssessment({ profile, setProfile }) {
  const profileKey = getProfileKey(profile);
  const [session, setSession] = useFeatureSession('skill-assessment', profileKey, SKILL_SESSION_DEFAULT);
  const [parsingResume, setParsingResume] = useState(false);
  const [loadingGap, setLoadingGap] = useState(false);

  const {
    newSkill, resumeParsed, resumeSummary, selectedTopic,
    quizStarted, currentQIndex, selectedAnswer, score, quizFinished, skillGap,
  } = session;

  useEffect(() => {
    if (skillGap || loadingGap) return;
    setLoadingGap(true);
    getSkillGapAnalysis({ profile })
      .then((gap) => setSession((prev) => ({ ...prev, skillGap: gap })))
      .catch((err) => console.warn('Skill gap AI failed:', err))
      .finally(() => setLoadingGap(false));
  }, [profile.email]);

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    const skill = newSkill.trim();
    if (!profile.skills.includes(skill)) {
      setProfile({
        ...profile,
        skills: [...profile.skills, skill],
        skillsProficiency: { ...profile.skillsProficiency, [skill]: 'Beginner' },
        points: profile.points + 50,
      });
    }
    setSession((prev) => ({ ...prev, newSkill: '' }));
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setParsingResume(true);

    try {
      const resumeText = await extractTextFromFile(file);
      const { skills, summary } = await extractSkillsFromResume({ profile, resumeText, fileName: file.name });
      const newSkills = skills.filter((s) => !profile.skills.includes(s));
      const newProficiency = { ...profile.skillsProficiency };
      newSkills.forEach((s) => { newProficiency[s] = 'Intermediate'; });

      setProfile({
        ...profile,
        skills: [...profile.skills, ...newSkills],
        skillsProficiency: newProficiency,
        points: profile.points + 100,
        resumeDetails: {
          ...profile.resumeDetails,
          fileName: file.name,
          uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        },
      });

      setSession((prev) => ({
        ...prev,
        resumeParsed: true,
        resumeSummary: summary + (newSkills.length ? ` Added: ${newSkills.join(', ')}` : ''),
      }));
    } catch (err) {
      console.error('Resume skill extraction failed:', err);
      alert('AI skill extraction failed. Check OpenRouter API key.');
    } finally {
      setParsingResume(false);
    }
  };

  const startQuiz = (topic) => {
    setSession((prev) => ({
      ...prev,
      selectedTopic: topic,
      quizStarted: true,
      currentQIndex: 0,
      selectedAnswer: '',
      score: 0,
      quizFinished: false,
    }));
  };

  const handleNextQuestion = () => {
    const questions = TECH_QUIZZES[selectedTopic];
    const newScore = selectedAnswer === questions[currentQIndex].a ? score + 1 : score;

    if (currentQIndex + 1 < questions.length) {
      setSession((prev) => ({
        ...prev,
        currentQIndex: prev.currentQIndex + 1,
        selectedAnswer: '',
        score: newScore,
      }));
    } else {
      const finalQuizScore = Math.round((newScore / questions.length) * 100);
      const profLevel = finalQuizScore >= 90 ? 'Expert' : finalQuizScore >= 70 ? 'Advanced' : finalQuizScore >= 50 ? 'Intermediate' : 'Beginner';
      let newBadges = [...profile.badges];
      const badgeId = `${selectedTopic.toLowerCase().replace(' ', '_')}_verified`;

      if (finalQuizScore === 100 && !newBadges.some((b) => b.id === badgeId)) {
        newBadges.push({
          id: badgeId,
          name: `${selectedTopic} Master`,
          icon: '🎓',
          desc: `Scored 100% in the ${selectedTopic} assessment quiz!`,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        });
      }

      let updatedSkills = [...profile.skills];
      if (finalQuizScore >= 70 && !updatedSkills.includes(selectedTopic)) {
        updatedSkills.push(selectedTopic);
      }

      setProfile({
        ...profile,
        points: profile.points + (finalQuizScore === 100 ? 150 : 50),
        badges: newBadges,
        skills: updatedSkills,
        skillsProficiency: { ...profile.skillsProficiency, [selectedTopic]: profLevel },
        interviewStats: {
          ...profile.interviewStats,
          techScore: Math.round((profile.interviewStats.techScore + finalQuizScore) / 2),
        },
      });

      setSession((prev) => ({ ...prev, score: newScore, quizFinished: true }));
    }
  };

  const questions = selectedTopic ? TECH_QUIZZES[selectedTopic] : [];
  const missingSkills = skillGap?.missingSkills || ['React', 'Spring Boot', 'MySQL', 'REST APIs'];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">AI Skill Assessment</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          OpenRouter-powered skill extraction, gap analysis, and verification quizzes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8 lg:col-span-2">
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-bold">Skills Catalog</h2>
            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter a skill..."
                value={newSkill}
                onChange={(e) => setSession((prev) => ({ ...prev, newSkill: e.target.value }))}
                className="glass-input flex-1 py-2"
              />
              <button type="submit" className="bg-brand-600 text-white px-5 rounded-xl font-bold flex items-center gap-1.5 text-sm">
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>
            <div className="flex flex-wrap gap-2.5 pt-2">
              {profile.skills.map((skill, index) => (
                <span key={index} className="px-3.5 py-1.5 bg-brand-100/60 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-bold">AI Resume Skill Extractor</h2>
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center relative">
              <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleResumeUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={parsingResume} />
              <FileText className="w-10 h-10 text-slate-400 mb-2 mx-auto" />
              {parsingResume ? (
                <p className="text-sm font-bold flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> OpenRouter extracting skills...
                </p>
              ) : resumeParsed ? (
                <p className="text-sm font-bold text-emerald-500">{resumeSummary || 'Resume parsed successfully!'}</p>
              ) : (
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Click to upload resume for AI skill extraction</p>
              )}
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-bold">Verify Skills via Quiz</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(TECH_QUIZZES).map((topic) => (
                <div key={topic} className="flex justify-between items-center p-4 bg-slate-100/50 dark:bg-slate-900/30 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-brand-500" />
                    <div>
                      <h4 className="text-sm font-bold">{topic}</h4>
                      <p className="text-xs text-slate-500">{TECH_QUIZZES[topic].length} Questions</p>
                    </div>
                  </div>
                  <button onClick={() => startQuiz(topic)} className="p-2 bg-brand-600 text-white rounded-xl">
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-bold">AI Skill Gap Analysis</h2>
            <div className="text-xs text-slate-500">Role: <span className="font-bold text-slate-800 dark:text-white">{profile.targetRole}</span></div>
            {loadingGap ? (
              <p className="text-xs text-slate-400 flex items-center gap-2"><RefreshCw className="w-3 h-3 animate-spin" /> Loading AI analysis...</p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <div className="text-xs text-rose-500 font-bold">MISSING SKILLS</div>
                  <div className="flex flex-wrap gap-1.5">
                    {missingSkills.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-rose-100/40 text-rose-600 rounded-md text-[10px] font-bold">{s}</span>
                    ))}
                  </div>
                </div>
                {skillGap?.recommendation && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">{skillGap.recommendation}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {quizStarted && (
            <div className="glass-card p-6 space-y-6 border border-brand-500 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-md font-bold">{selectedTopic} Quiz</h3>
                <span className="text-xs bg-brand-100 text-brand-600 font-semibold px-2 py-0.5 rounded">Q {currentQIndex + 1}/{questions.length}</span>
              </div>
              {!quizFinished ? (
                <div className="space-y-4">
                  <p className="text-sm font-semibold">{questions[currentQIndex].q}</p>
                  <div className="space-y-2">
                    {questions[currentQIndex].options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSession((prev) => ({ ...prev, selectedAnswer: opt }))}
                        className={`w-full text-left px-4 py-2.5 rounded-xl border text-xs font-semibold ${
                          selectedAnswer === opt ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleNextQuestion} disabled={!selectedAnswer} className="w-full bg-brand-600 text-white py-2.5 rounded-xl font-bold text-xs disabled:opacity-50">
                    Next Question <ChevronRight className="w-4 h-4 inline" />
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <h4 className="font-bold">Quiz Finished!</h4>
                  <p className="text-xs">Score: {score}/{questions.length}</p>
                  <button onClick={() => setSession((prev) => ({ ...prev, quizStarted: false, selectedTopic: null }))} className="w-full bg-slate-200 dark:bg-slate-800 py-2 rounded-xl text-xs font-bold">
                    Close Assessment
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
