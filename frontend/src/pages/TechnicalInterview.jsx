import React, { useState } from 'react';
import { BookOpen, Check, Play, ChevronRight, RefreshCw } from 'lucide-react';
import { TECH_QUIZZES } from '../mock/mockData';
import { explainQuizAnswer } from '../lib/aiService';
import { getProfileKey, useFeatureSession } from '../hooks/useFeatureSession';

const TECH_SESSION_DEFAULT = {
  selectedTopic: null,
  activeQuiz: false,
  currentQIndex: 0,
  selectedAnswer: '',
  score: 0,
  submitted: false,
  quizComplete: false,
  aiExplanation: '',
};

export default function TechnicalInterview({ profile, setProfile }) {
  const profileKey = getProfileKey(profile);
  const [session, setSession] = useFeatureSession('tech-interview', profileKey, TECH_SESSION_DEFAULT);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  const {
    selectedTopic, activeQuiz, currentQIndex, selectedAnswer,
    score, submitted, quizComplete, aiExplanation,
  } = session;

  const startQuiz = (topic) => {
    setSession({
      ...TECH_SESSION_DEFAULT,
      selectedTopic: topic,
      activeQuiz: true,
    });
  };

  const handleAnswerSubmit = async () => {
    const qList = TECH_QUIZZES[selectedTopic];
    const q = qList[currentQIndex];
    const isCorrect = selectedAnswer === q.a;
    const newScore = isCorrect ? score + 1 : score;

    setSession((prev) => ({
      ...prev,
      score: newScore,
      submitted: true,
      aiExplanation: '',
    }));

    setLoadingExplanation(true);
    try {
      const explanation = await explainQuizAnswer({
        question: q.q,
        options: q.options,
        correctAnswer: q.a,
        userAnswer: selectedAnswer,
        topic: selectedTopic,
      });
      setSession((prev) => ({ ...prev, aiExplanation: explanation }));
    } catch (err) {
      console.warn('AI explanation failed:', err);
      setSession((prev) => ({
        ...prev,
        aiExplanation: isCorrect ? 'Correct! Well done.' : `The correct answer is: ${q.a}`,
      }));
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleNext = () => {
    const qList = TECH_QUIZZES[selectedTopic];
    if (currentQIndex + 1 < qList.length) {
      setSession((prev) => ({
        ...prev,
        currentQIndex: prev.currentQIndex + 1,
        selectedAnswer: '',
        submitted: false,
        aiExplanation: '',
      }));
    } else {
      setSession((prev) => {
        const qList = TECH_QUIZZES[prev.selectedTopic];
        const lastCorrect = prev.selectedAnswer === qList[prev.currentQIndex].a;
        const finalScore = lastCorrect ? prev.score + 1 : prev.score;
        const finalScorePct = Math.round((finalScore / qList.length) * 100);
        const profLevel = finalScorePct >= 90 ? 'Expert' : finalScorePct >= 70 ? 'Advanced' : finalScorePct >= 50 ? 'Intermediate' : 'Beginner';

        setProfile({
          ...profile,
          points: profile.points + (finalScorePct >= 80 ? 150 : 60),
          skillsProficiency: { ...profile.skillsProficiency, [prev.selectedTopic]: profLevel },
          interviewStats: {
            ...profile.interviewStats,
            techScore: Math.round((profile.interviewStats.techScore + finalScorePct) / 2),
          },
        });

        return { ...prev, score: finalScore, quizComplete: true };
      });
    }
  };

  const questions = selectedTopic ? TECH_QUIZZES[selectedTopic] : [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Technical Interview Module</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">MCQ quizzes with OpenRouter AI explanations for each answer.</p>
      </div>

      {!activeQuiz ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.keys(TECH_QUIZZES).map((topic) => (
            <div key={topic} className="glass-card p-6 flex flex-col justify-between hover:border-brand-500 transition-colors">
              <div className="space-y-3">
                <BookOpen className="w-5 h-5 text-brand-500" />
                <h3 className="text-base font-bold">{topic}</h3>
                <p className="text-xs text-slate-500">{TECH_QUIZZES[topic].length} questions with AI review</p>
              </div>
              <button onClick={() => startQuiz(topic)} className="mt-6 w-full py-2 bg-brand-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                Start Technical Quiz <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 md:p-8 space-y-6 border border-brand-500/15">
              {!quizComplete ? (
                <div className="space-y-6">
                  <span className="text-xs font-bold uppercase text-slate-400">Question {currentQIndex + 1} of {questions.length}</span>
                  <p className="text-base font-bold">{questions[currentQIndex].q}</p>
                  <div className="space-y-3">
                    {questions[currentQIndex].options.map((opt, idx) => {
                      const isSelected = selectedAnswer === opt;
                      const isCorrectAnswer = opt === questions[currentQIndex].a;
                      let btnClass = 'border-slate-200 dark:border-slate-800';
                      if (submitted) {
                        if (isCorrectAnswer) btnClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-600';
                        else if (isSelected) btnClass = 'border-rose-500 bg-rose-500/10 text-rose-600';
                      } else if (isSelected) btnClass = 'border-brand-500 bg-brand-500 text-white';

                      return (
                        <button key={idx} disabled={submitted} onClick={() => setSession((prev) => ({ ...prev, selectedAnswer: opt }))}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-semibold ${btnClass}`}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {submitted && (
                    <div className="p-3 bg-brand-500/5 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                      {loadingExplanation ? (
                        <span className="flex items-center gap-2"><RefreshCw className="w-3 h-3 animate-spin" /> AI explaining...</span>
                      ) : (
                        <><strong>AI Explanation:</strong> {aiExplanation}</>
                      )}
                    </div>
                  )}
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
                  <button onClick={() => setSession({ ...TECH_SESSION_DEFAULT })} className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl">
                    Go Back to Topics
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="glass-card p-6 space-y-2 text-xs text-slate-500">
            <div className="flex gap-2 items-center"><Check className="w-4 h-4 text-emerald-500" /> OpenRouter AI explanations</div>
            <div className="flex gap-2 items-center"><Check className="w-4 h-4 text-emerald-500" /> Scores sync to profile</div>
          </div>
        </div>
      )}
    </div>
  );
}
