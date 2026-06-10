import React, { useEffect, useState } from 'react';
import { BookOpen, Check, Play, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import BackButton from '../components/BackButton';
import {
  fetchCategoryNames,
  fetchMcqForQuiz,
  mapMcqToTechQuiz,
  DEFAULT_TECH_TOPICS,
} from '../lib/questionBankService';
import { recordQuizCompletion } from '../lib/quizRewards';
import { getProfileKey, useFeatureSession } from '../hooks/useFeatureSession';

const TECH_SESSION_DEFAULT = {
  selectedTopic: null,
  activeQuiz: false,
  currentQIndex: 0,
  selectedAnswer: '',
  score: 0,
  submitted: false,
  quizComplete: false,
  questions: [],
  loading: false,
  xpMessage: '',
};

export default function TechnicalInterview({ profile, setProfile }) {
  const profileKey = getProfileKey(profile);
  const [session, setSession] = useFeatureSession('tech-interview', profileKey, TECH_SESSION_DEFAULT);
  const [loadError, setLoadError] = useState('');
  const [topics, setTopics] = useState(DEFAULT_TECH_TOPICS);

  const {
    selectedTopic, activeQuiz, currentQIndex, selectedAnswer,
    score, submitted, quizComplete, questions, loading, xpMessage,
  } = session;

  useEffect(() => {
    fetchCategoryNames('technical', DEFAULT_TECH_TOPICS).then(setTopics).catch(() => {});
  }, []);

  const startQuiz = async (topic) => {
    setLoadError('');
    setSession({
      ...TECH_SESSION_DEFAULT,
      selectedTopic: topic,
      activeQuiz: true,
      loading: true,
    });

    try {
      const rows = await fetchMcqForQuiz('technical', topic, 10);
      if (!rows.length) {
        setLoadError(`No questions available for "${topic}" yet. Ask admin to import questions in Admin Panel.`);
        setSession(TECH_SESSION_DEFAULT);
        return;
      }
      const mapped = rows.map(mapMcqToTechQuiz);
      setSession((prev) => ({
        ...prev,
        questions: mapped,
        loading: false,
      }));
    } catch (err) {
      console.error('Quiz load failed:', err);
      setLoadError(err.message || 'Failed to load questions from Supabase.');
      setSession(TECH_SESSION_DEFAULT);
    }
  };

  const handleAnswerSubmit = () => {
    const q = questions[currentQIndex];
    const isCorrect = selectedAnswer === q.a;
    setSession((prev) => ({
      ...prev,
      score: isCorrect ? prev.score + 1 : prev.score,
      submitted: true,
    }));
  };

  const handleBackToTopics = () => {
    if (activeQuiz && !quizComplete && questions.length > 0) {
      const confirmed = window.confirm('Leave this quiz? Your progress will be lost.');
      if (!confirmed) return;
    }
    setSession({ ...TECH_SESSION_DEFAULT });
    setLoadError('');
  };

  const handleNext = () => {
    if (currentQIndex + 1 < questions.length) {
      setSession((prev) => ({
        ...prev,
        currentQIndex: prev.currentQIndex + 1,
        selectedAnswer: '',
        submitted: false,
      }));
    } else {
      const finalScorePct = Math.round((score / questions.length) * 100);
      const profLevel = finalScorePct >= 90 ? 'Expert' : finalScorePct >= 70 ? 'Advanced' : finalScorePct >= 50 ? 'Intermediate' : 'Beginner';
      const quizKey = `tech:${selectedTopic}`;
      const { profile: updatedProfile, xpEarned, alreadyRewarded } = recordQuizCompletion(
        profile,
        quizKey,
        finalScorePct,
        100
      );

      setProfile({
        ...updatedProfile,
        skillsProficiency: { ...updatedProfile.skillsProficiency, [selectedTopic]: profLevel },
        interviewStats: {
          ...updatedProfile.interviewStats,
          techScore: Math.round((updatedProfile.interviewStats.techScore + finalScorePct) / 2),
        },
      });

      let msg = `Score: ${finalScorePct}%`;
      if (xpEarned > 0) msg += ` — +${xpEarned} XP earned!`;
      else if (alreadyRewarded) msg += ' — XP already earned for this topic (retry allowed, no extra points).';

      setSession((prev) => ({ ...prev, quizComplete: true, xpMessage: msg }));
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Technical Interview Module</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Admin-curated MCQ bank per subject. Questions are loaded from Supabase — no AI generation.
        </p>
      </div>

      {loadError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-600 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {loadError}
        </div>
      )}

      {!activeQuiz ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => {
            const rewarded = profile.quizRewards?.[`tech:${topic}`]?.xpAwarded;
            return (
              <div key={topic} className="glass-card p-6 flex flex-col justify-between hover:border-brand-500 transition-colors">
                <div className="space-y-3">
                  <BookOpen className="w-5 h-5 text-brand-500" />
                  <h3 className="text-base font-bold">{topic}</h3>
                  <p className="text-xs text-slate-500">Up to 10 questions from admin bank</p>
                  {rewarded && (
                    <span className="inline-block text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      XP earned
                    </span>
                  )}
                </div>
                <button onClick={() => startQuiz(topic)} className="mt-6 w-full py-2 bg-brand-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                  Start Technical Quiz <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <BackButton onClick={handleBackToTopics} label="Back to Topics" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6 md:p-8 space-y-6 border border-brand-500/15">
                {loading ? (
                  <p className="text-sm flex items-center gap-2 text-slate-500">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Loading {selectedTopic} questions…
                  </p>
                ) : !quizComplete ? (
                  <div className="space-y-6">
                    <span className="text-xs font-bold uppercase text-slate-400">
                      Question {currentQIndex + 1} of {questions.length} — {selectedTopic}
                    </span>
                    <p className="text-base font-bold">{questions[currentQIndex]?.q}</p>
                    <div className="space-y-3">
                      {questions[currentQIndex]?.options.map((opt, idx) => {
                        const isSelected = selectedAnswer === opt;
                        const isCorrectAnswer = opt === questions[currentQIndex].a;
                        let btnClass = 'border-slate-200 dark:border-slate-800';
                        if (submitted) {
                          if (isCorrectAnswer) btnClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-600';
                          else if (isSelected) btnClass = 'border-rose-500 bg-rose-500/10 text-rose-600';
                        } else if (isSelected) btnClass = 'border-brand-500 bg-brand-500 text-white';

                        return (
                          <button
                            key={idx}
                            disabled={submitted}
                            onClick={() => setSession((prev) => ({ ...prev, selectedAnswer: opt }))}
                            className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold ${btnClass}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex justify-end pt-4">
                      {!submitted ? (
                        <button onClick={handleAnswerSubmit} disabled={!selectedAnswer} className="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs disabled:opacity-50">
                          Submit Answer
                        </button>
                      ) : (
                        <button onClick={handleNext} className="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1">
                          {currentQIndex + 1 === questions.length ? 'Finish Test' : 'Next Question'} <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-6 py-4">
                    <div className="text-3xl font-extrabold text-brand-500">{score}/{questions.length}</div>
                    <h3 className="text-lg font-bold">Technical Test Completed!</h3>
                    <p className="text-sm text-slate-500">{xpMessage}</p>
                    <BackButton onClick={handleBackToTopics} label="Back to Topics" className="mx-auto" />
                  </div>
                )}
              </div>
            </div>
            <div className="glass-card p-6 space-y-2 text-xs text-slate-500">
              <div className="flex gap-2 items-center"><Check className="w-4 h-4 text-emerald-500" /> Admin-curated question bank</div>
              <div className="flex gap-2 items-center"><Check className="w-4 h-4 text-emerald-500" /> XP awarded once per topic (70%+)</div>
              <div className="flex gap-2 items-center"><Check className="w-4 h-4 text-emerald-500" /> Scores sync to Supabase</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
