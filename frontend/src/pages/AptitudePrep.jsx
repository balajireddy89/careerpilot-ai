import React, { useState, useEffect, useCallback } from 'react';
import { Timer, Play, RefreshCw, ChevronRight } from 'lucide-react';
import { APTITUDE_QUESTIONS } from '../mock/mockData';
import { getAptitudeTestReview } from '../lib/aiService';
import { getProfileKey, useFeatureSession } from '../hooks/useFeatureSession';

const APTITUDE_SESSION_DEFAULT = {
  selectedCategory: null,
  quizStarted: false,
  currentQIdx: 0,
  selectedAns: '',
  score: 0,
  timeLeft: 60,
  submittedAnswers: [],
  quizFinished: false,
  aiReview: '',
};

export default function AptitudePrep({ profile, setProfile }) {
  const profileKey = getProfileKey(profile);
  const [session, setSession] = useFeatureSession('aptitude', profileKey, APTITUDE_SESSION_DEFAULT);
  const [loadingReview, setLoadingReview] = useState(false);

  const {
    selectedCategory, quizStarted, currentQIdx, selectedAns,
    score, timeLeft, submittedAnswers, quizFinished, aiReview,
  } = session;

  const handleFinishQuiz = useCallback(async (finalScore = score, answers = submittedAnswers) => {
    const qList = APTITUDE_QUESTIONS[selectedCategory];
    const totalQs = answers.length || qList?.length || 1;
    const finalScorePct = Math.round((finalScore / totalQs) * 100);

    setSession((prev) => ({ ...prev, quizFinished: true }));

    setProfile({
      ...profile,
      points: profile.points + (finalScorePct >= 80 ? 120 : 50),
      aptitudeStats: {
        ...profile.aptitudeStats,
        testsTaken: profile.aptitudeStats.testsTaken + 1,
        [selectedCategory]: Math.round((profile.aptitudeStats[selectedCategory] + finalScorePct) / 2),
        score: profile.aptitudeStats.score + (finalScorePct >= 80 ? 100 : 50),
      },
    });

    setLoadingReview(true);
    try {
      const review = await getAptitudeTestReview({
        profile,
        category: selectedCategory,
        questions: qList,
        submittedAnswers: answers,
        score: finalScore,
      });
      setSession((prev) => ({ ...prev, aiReview: review }));
    } catch (err) {
      console.warn('Aptitude AI review failed:', err);
    } finally {
      setLoadingReview(false);
    }
  }, [profile, score, selectedCategory, submittedAnswers, setProfile, setSession]);

  useEffect(() => {
    let timer;
    if (quizStarted && timeLeft > 0 && !quizFinished) {
      timer = setInterval(() => {
        setSession((prev) => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
    } else if (timeLeft === 0 && quizStarted && !quizFinished) {
      handleFinishQuiz();
    }
    return () => clearInterval(timer);
  }, [quizStarted, timeLeft, quizFinished, handleFinishQuiz, setSession]);

  const handleStartQuiz = (category) => {
    setSession({
      ...APTITUDE_SESSION_DEFAULT,
      selectedCategory: category,
      quizStarted: true,
    });
  };

  const handleNextQuestion = () => {
    const qList = APTITUDE_QUESTIONS[selectedCategory];
    const currentQuestion = qList[currentQIdx];
    const isCorrect = selectedAns === currentQuestion.answer;
    const newAnswers = [
      ...submittedAnswers,
      { questionId: currentQuestion.id, answer: selectedAns, isCorrect, explanation: currentQuestion.explanation },
    ];
    const nextScore = isCorrect ? score + 1 : score;

    if (currentQIdx + 1 < qList.length) {
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

  const questions = selectedCategory ? APTITUDE_QUESTIONS[selectedCategory] : [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Aptitude Preparation</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Timed tests with OpenRouter AI performance review at the end.</p>
      </div>

      {!quizStarted ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { id: 'quantitative', label: 'Quantitative Aptitude', icon: '📊' },
            { id: 'logical', label: 'Logical Reasoning', icon: '🧠' },
            { id: 'verbal', label: 'Verbal Ability', icon: '✍️' },
          ].map((cat) => (
            <div key={cat.id} className="glass-card p-6 flex flex-col justify-between">
              <div className="text-3xl mb-3">{cat.icon}</div>
              <h3 className="text-base font-bold">{cat.label}</h3>
              <button onClick={() => handleStartQuiz(cat.id)} className="mt-6 w-full py-2 bg-brand-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                Start Timed Test <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-6 md:p-8 space-y-6 border border-brand-500/15">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-xs font-bold uppercase text-slate-400">{selectedCategory} TEST</span>
            {!quizFinished && (
              <div className="flex items-center gap-1 text-xs text-rose-500 font-bold">
                <Timer className="w-4 h-4" /> {timeLeft}s
              </div>
            )}
          </div>

          {!quizFinished ? (
            <div className="space-y-6">
              <p className="text-base font-bold">Q {currentQIdx + 1}/{questions.length}: {questions[currentQIdx].question}</p>
              <div className="space-y-2">
                {questions[currentQIdx].options.map((opt, idx) => (
                  <button key={idx} onClick={() => setSession((prev) => ({ ...prev, selectedAns: opt }))}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-semibold ${
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
              </div>
              {loadingReview ? (
                <p className="text-xs flex items-center gap-2 text-slate-500"><RefreshCw className="w-3 h-3 animate-spin" /> Generating AI review...</p>
              ) : aiReview ? (
                <div className="p-4 bg-brand-500/5 rounded-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong>AI Coach Review:</strong> {aiReview}
                </div>
              ) : null}
              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const ansObj = submittedAnswers[idx] || { isCorrect: false, answer: 'Not Answered' };
                  return (
                    <div key={q.id} className="p-4 bg-slate-100/50 dark:bg-slate-900/30 rounded-2xl text-xs">
                      <p className="font-bold">{q.question}</p>
                      <p className="text-emerald-500 mt-1">Correct: {q.answer}</p>
                      <p className={ansObj.isCorrect ? 'text-emerald-500' : 'text-rose-500'}>Selected: {ansObj.answer}</p>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setSession({ ...APTITUDE_SESSION_DEFAULT })} className="bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs">
                Close Review
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
