import React, { useState, useEffect, useCallback } from 'react';
import { Timer, Play, RefreshCw, ChevronRight } from 'lucide-react';
import BackButton from '../components/BackButton';
import {
  fetchCategoryNames,
  fetchMcqForQuiz,
  mapMcqToAptitude,
  APTITUDE_DEFAULTS,
} from '../lib/questionBankService';
import { recordQuizCompletion } from '../lib/quizRewards';
import { getProfileKey, useFeatureSession } from '../hooks/useFeatureSession';

const APTITUDE_SESSION_DEFAULT = {
  selectedCategory: null,
  quizStarted: false,
  currentQIdx: 0,
  selectedAns: '',
  score: 0,
  timeLeft: 600,
  submittedAnswers: [],
  quizFinished: false,
  questions: [],
  loading: false,
};

const CATEGORY_META = {
  quantitative: { label: 'Quantitative Aptitude', icon: '📊' },
  logical: { label: 'Logical Reasoning', icon: '🧠' },
  verbal: { label: 'Verbal Ability', icon: '✍️' },
};

export default function AptitudePrep({ profile, setProfile }) {
  const profileKey = getProfileKey(profile);
  const [session, setSession] = useFeatureSession('aptitude', profileKey, APTITUDE_SESSION_DEFAULT);
  const [categories, setCategories] = useState(APTITUDE_DEFAULTS.map((c) => c.id));
  const [loadError, setLoadError] = useState('');

  const {
    selectedCategory, quizStarted, currentQIdx, selectedAns,
    score, timeLeft, submittedAnswers, quizFinished, questions, loading,
  } = session;

  useEffect(() => {
    fetchCategoryNames('aptitude', APTITUDE_DEFAULTS.map((c) => c.id)).then(setCategories).catch(() => {});
  }, []);

  const handleFinishQuiz = useCallback(async (finalScore = score, answers = submittedAnswers) => {
    const totalQs = questions.length || 1;
    const finalScorePct = Math.round((finalScore / totalQs) * 100);
    const quizKey = `aptitude:${selectedCategory}`;

    setSession((prev) => ({ ...prev, quizFinished: true }));

    const { profile: updatedProfile, xpEarned } = recordQuizCompletion(profile, quizKey, finalScorePct, 80);

    setProfile({
      ...updatedProfile,
      aptitudeStats: {
        ...updatedProfile.aptitudeStats,
        testsTaken: updatedProfile.aptitudeStats.testsTaken + 1,
        [selectedCategory]: Math.round((updatedProfile.aptitudeStats[selectedCategory] + finalScorePct) / 2),
        score: updatedProfile.aptitudeStats.score + (xpEarned > 0 ? 100 : 0),
      },
    });
  }, [profile, score, selectedCategory, submittedAnswers, questions, setProfile, setSession]);

  useEffect(() => {
    let timer;
    if (quizStarted && timeLeft > 0 && !quizFinished && questions.length > 0) {
      timer = setInterval(() => {
        setSession((prev) => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
    } else if (timeLeft === 0 && quizStarted && !quizFinished && questions.length > 0) {
      handleFinishQuiz();
    }
    return () => clearInterval(timer);
  }, [quizStarted, timeLeft, quizFinished, handleFinishQuiz, setSession, questions.length]);

  const handleStartQuiz = async (category) => {
    setLoadError('');
    setSession({
      ...APTITUDE_SESSION_DEFAULT,
      selectedCategory: category,
      quizStarted: true,
      loading: true,
    });

    try {
      const rows = await fetchMcqForQuiz('aptitude', category, 10);
      if (!rows.length) {
        setLoadError(`No questions for "${category}" yet. Admin can import JSON in Admin Panel → Aptitude Prep.`);
        setSession(APTITUDE_SESSION_DEFAULT);
        return;
      }
      setSession((prev) => ({
        ...prev,
        questions: rows.map(mapMcqToAptitude),
        loading: false,
      }));
    } catch (err) {
      console.error('Aptitude load failed:', err);
      setLoadError(err.message || 'Failed to load questions.');
      setSession(APTITUDE_SESSION_DEFAULT);
    }
  };

  const handleBackToCategories = () => {
    if (quizStarted && !quizFinished && questions.length > 0) {
      const confirmed = window.confirm('Leave this test? Your progress and remaining time will be lost.');
      if (!confirmed) return;
    }
    setSession({ ...APTITUDE_SESSION_DEFAULT });
    setLoadError('');
  };

  const handleNextQuestion = () => {
    const currentQuestion = questions[currentQIdx];
    const isCorrect = selectedAns === currentQuestion.answer;
    const newAnswers = [
      ...submittedAnswers,
      { questionId: currentQuestion.id, answer: selectedAns, isCorrect },
    ];
    const nextScore = isCorrect ? score + 1 : score;

    if (currentQIdx + 1 < questions.length) {
      setSession((prev) => ({
        ...prev,
        submittedAnswers: newAnswers,
        score: nextScore,
        currentQIdx: prev.currentQIdx + 1,
        selectedAns: '',
      }));
    } else {
      setSession((prev) => ({ ...prev, submittedAnswers: newAnswers, score: nextScore }));
      handleFinishQuiz(nextScore, newAnswers);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Aptitude Preparation</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Admin-curated aptitude bank — 10 questions per category, 10 min timer.</p>
      </div>

      {loadError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-600">{loadError}</div>
      )}

      {!quizStarted ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((catId) => {
            const meta = CATEGORY_META[catId] || { label: catId, icon: '📝' };
            return (
              <div key={catId} className="glass-card p-6 flex flex-col justify-between">
                <div className="text-3xl mb-3">{meta.icon}</div>
                <h3 className="text-base font-bold">{meta.label}</h3>
                <p className="text-xs text-slate-500 mt-1">10 questions · 10 min timer</p>
                <button onClick={() => handleStartQuiz(catId)} className="mt-6 w-full py-2 bg-brand-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                  Start Test <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <BackButton onClick={handleBackToCategories} label="Back to Categories" />
          <div className="glass-card p-6 md:p-8 space-y-6 border border-brand-500/15">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase text-slate-400">{selectedCategory} TEST</span>
              {!quizFinished && !loading && (
                <div className="flex items-center gap-1 text-xs text-rose-500 font-bold">
                  <Timer className="w-4 h-4" /> {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
              )}
            </div>

            {loading ? (
              <p className="text-sm flex items-center gap-2 text-slate-500">
                <RefreshCw className="w-4 h-4 animate-spin" /> Loading questions...
              </p>
            ) : !quizFinished ? (
              <div className="space-y-6">
                <p className="text-base font-bold">Q {currentQIdx + 1}/{questions.length}: {questions[currentQIdx]?.question}</p>
                <div className="space-y-2">
                  {questions[currentQIdx]?.options.map((opt, idx) => (
                    <button key={idx} onClick={() => setSession((prev) => ({ ...prev, selectedAns: opt }))}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold ${
                        selectedAns === opt ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-200 dark:border-slate-800'
                      }`}>
                      {opt}
                    </button>
                  ))}
                </div>
                <button onClick={handleNextQuestion} disabled={!selectedAns} className="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs disabled:opacity-50 flex items-center gap-1 ml-auto">
                  Next Question <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl mb-2">🏆</div>
                  <h3 className="text-lg font-bold">Score: {score}/{questions.length}</h3>
                  <p className="text-xs text-slate-500 mt-2">
                    {Math.round((score / questions.length) * 100)}% — XP awarded once per category at 70%+
                  </p>
                </div>
                <BackButton onClick={handleBackToCategories} label="Back to Categories" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
