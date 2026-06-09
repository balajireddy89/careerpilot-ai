import React, { useState, useEffect } from 'react';
import { Mic, MicOff, MessageSquare, Award, Send, RefreshCw } from 'lucide-react';
import { HR_QUESTIONS } from '../mock/mockData';
import { evaluateHRAnswer } from '../lib/aiService';
import { getProfileKey, useFeatureSession } from '../hooks/useFeatureSession';

const HR_SESSION_DEFAULT = {
  currentQuestionIndex: 0,
  answerText: '',
  evaluationResult: null,
};

export default function HRInterview({ profile, setProfile }) {
  const profileKey = getProfileKey(profile);
  const [session, setSession, resetSession] = useFeatureSession('hr-interview', profileKey, HR_SESSION_DEFAULT);
  const { currentQuestionIndex, answerText, evaluationResult } = session;

  const setAnswerText = (value) => {
    setSession((prev) => ({
      ...prev,
      answerText: typeof value === 'function' ? value(prev.answerText) : value,
    }));
  };

  const setEvaluationResult = (value) => {
    setSession((prev) => ({ ...prev, evaluationResult: value }));
  };

  const [isRecording, setIsRecording] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        setAnswerText((prev) => `${prev} ${finalTranscript}`.trim());
      };

      rec.onerror = () => setIsRecording(false);
      rec.onend = () => setIsRecording(false);
      setRecognition(rec);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      alert('Speech Recognition API is not supported in this browser. Please type your response instead.');
      return;
    }
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognition.start();
    }
  };

  const handleEvaluate = async () => {
    if (!answerText.trim()) return;
    setEvaluating(true);

    try {
      const result = await evaluateHRAnswer({
        profile,
        question: HR_QUESTIONS[currentQuestionIndex],
        answer: answerText.trim(),
      });
      setEvaluationResult(result);

      const updatedProfile = {
        ...profile,
        points: profile.points + 120,
        interviewStats: {
          ...profile.interviewStats,
          hrScore: Math.round((profile.interviewStats.hrScore + result.score) / 2),
          communication: Math.round((profile.interviewStats.communication + result.clarity * 10) / 2),
          confidence: Math.round((profile.interviewStats.confidence + result.confidence * 10) / 2),
          sessionsCount: profile.interviewStats.sessionsCount + 1,
        },
      };
      setProfile(updatedProfile);
    } catch (err) {
      console.error('HR evaluation failed:', err);
      alert('AI evaluation failed. Check your OpenRouter API key in .env and try again.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    setSession((prev) => ({
      ...prev,
      answerText: '',
      evaluationResult: null,
      currentQuestionIndex: (prev.currentQuestionIndex + 1) % HR_QUESTIONS.length,
    }));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">AI HR Interview Simulator</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Practice standard HR interview sessions. Record answers via Voice or type them to receive OpenRouter AI feedback.
          </p>
        </div>
        <button
          type="button"
          onClick={resetSession}
          disabled={evaluating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:text-brand-600 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0"
        >
          <RefreshCw className="w-3 h-3" /> Reset Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 border-l-4 border-brand-500 space-y-3 relative overflow-hidden">
            <div className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400 tracking-wider">QUESTION {currentQuestionIndex + 1} OF {HR_QUESTIONS.length}</div>
            <p className="text-lg font-bold text-slate-900 dark:text-white leading-normal">
              &ldquo;{HR_QUESTIONS[currentQuestionIndex]}&rdquo;
            </p>
          </div>

          <div className="glass-card p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Response</span>
              <button
                onClick={toggleRecording}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isRecording
                    ? 'bg-rose-500 border-rose-500 text-white animate-pulse'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-800 dark:text-slate-300'
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-brand-500" />}
                {isRecording ? 'Stop Recording' : 'Use Speech Mode'}
              </button>
            </div>

            <textarea
              rows="6"
              placeholder="Record your response using your microphone, or type your answer here..."
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              className="glass-input w-full text-sm font-medium leading-relaxed resize-none"
              disabled={evaluating}
            />

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-400 font-semibold">
                Word Count: {answerText.trim().split(/\s+/).filter(Boolean).length} words
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleEvaluate}
                  disabled={!answerText.trim() || evaluating}
                  className="bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 hover:bg-brand-500 disabled:opacity-50 transition-all text-xs"
                >
                  {evaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {evaluating ? 'AI Evaluating...' : 'Evaluate Answer'}
                </button>
                {evaluationResult && (
                  <button
                    onClick={handleNextQuestion}
                    className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-4 py-2.5 rounded-xl font-bold text-xs"
                  >
                    Next Question
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {evaluationResult ? (
            <div className="glass-card p-6 space-y-6 border border-brand-500/20 animate-fade-in">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="text-md font-bold text-slate-800 dark:text-white">AI Analysis Scorecard</h3>
              </div>

              <div className="space-y-4">
                <div className="text-center p-3 bg-brand-500/10 rounded-2xl">
                  <div className="text-3xl font-extrabold text-brand-500">{evaluationResult.score}%</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">HR Readiness index</div>
                </div>

                {['confidence', 'clarity', 'professionalism'].map((key, i) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                      <span className="text-slate-800 dark:text-white font-bold">{evaluationResult[key]}/10</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${['bg-brand-500', 'bg-blue-500', 'bg-emerald-500'][i]}`} style={{ width: `${evaluationResult[key] * 10}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-400">CONSTRUCTIVE FEEDBACK</div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">{evaluationResult.feedback}</p>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] uppercase font-bold text-brand-500">IDEAL SAMPLE ANSWER</div>
                <p className="text-xs text-slate-600 dark:text-slate-300 bg-brand-500/5 p-3 rounded-xl border border-brand-500/10 leading-relaxed italic">
                  &ldquo;{evaluationResult.sampleAnswer}&rdquo;
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-card p-6 text-center flex flex-col items-center justify-center min-h-[300px] border border-dashed border-slate-200 dark:border-slate-800/80">
              <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">Analysis Pending</h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
                Submit your answer for OpenRouter AI evaluation of tone, structure, and professionalism.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
