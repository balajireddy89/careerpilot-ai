import React, { useState, useEffect } from 'react';
import { Mic, MicOff, MessageSquare, Award, Send, RefreshCw, ChevronLeft, ChevronRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { fetchHRQuestions } from '../lib/questionBankService';
import { evaluateHRAnswer } from '../lib/aiService';
import { getProfileKey, useFeatureSession } from '../hooks/useFeatureSession';

const HR_SESSION_DEFAULT = {
  selectedCompany: null,
  currentQuestionIndex: 0,
  answerText: '',
  evaluationResult: null,
};

const COMPANY_CARDS = [
  { name: 'TCS', desc: 'Tata Consultancy Services', descDetail: 'Focuses on service-based hiring, flexibility, relocation, and team collaboration.', logo: 'TCS', color: 'from-blue-600 to-cyan-500' },
  { name: 'Infosys', desc: 'Infosys Limited', descDetail: 'Tests technical adaptability, training readiness, and problem-solving mistakes.', logo: 'INFY', color: 'from-sky-500 to-indigo-600' },
  { name: 'Wipro', desc: 'Wipro Technologies', descDetail: 'Assesses alignment with core values (Spirit of Wipro), legacy tech, and task prioritization.', logo: 'WIP', color: 'from-purple-500 to-indigo-500' },
  { name: 'Google', desc: 'Google LLC', descDetail: 'High focus on ambiguity, Googlyness, user-first mindset, and system conceptualization.', logo: 'GOOG', color: 'from-red-500 via-yellow-500 to-emerald-500' },
  { name: 'Microsoft', desc: 'Microsoft Corp.', descDetail: 'Evaluates growth mindset, risk tolerance, customer empathy, and code optimization.', logo: 'MSFT', color: 'from-blue-500 to-orange-500' },
  { name: 'Accenture', desc: 'Accenture plc', descDetail: 'Screens client communications, change adaptation, and digital transformation interest.', logo: 'ACN', color: 'from-purple-600 to-pink-500' },
  { name: 'Amazon', desc: 'Amazon.com, Inc.', descDetail: 'Strictly based on the 16 Leadership Principles, bias for action, and customer obsession.', logo: 'AMZN', color: 'from-amber-500 to-orange-600' },
  { name: 'General', desc: 'General HR Placement', descDetail: 'Standard placement behavioral questions like strengths, weaknesses, and balance.', logo: 'GEN', color: 'from-brand-600 to-purple-500' }
];

export default function HRInterview({ profile, setProfile }) {
  const profileKey = getProfileKey(profile);
  const [session, setSession, resetSession] = useFeatureSession('hr-interview', profileKey, HR_SESSION_DEFAULT);
  const { selectedCompany, currentQuestionIndex, answerText, evaluationResult } = session;

  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (!selectedCompany) {
      setQuestions([]);
      return;
    }
    setLoadingQuestions(true);
    fetchHRQuestions(selectedCompany)
      .then(rows => {
        setQuestions(rows);
      })
      .catch(err => {
        console.warn('Failed to load HR questions:', err);
      })
      .finally(() => {
        setLoadingQuestions(false);
      });
  }, [selectedCompany]);

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
        setSession((prev) => ({
          ...prev,
          answerText: `${prev.answerText} ${finalTranscript}`.trim()
        }));
      };

      rec.onerror = () => setIsRecording(false);
      rec.onend = () => setIsRecording(false);
      setRecognition(rec);
    }
  }, [setSession]);

  const selectCompany = (companyName) => {
    setSession({
      selectedCompany: companyName,
      currentQuestionIndex: 0,
      answerText: '',
      evaluationResult: null
    });
  };

  const handleBackToCompanies = () => {
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    }
    setSession({
      selectedCompany: null,
      currentQuestionIndex: 0,
      answerText: '',
      evaluationResult: null
    });
  };

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
    if (!answerText.trim() || questions.length === 0) return;
    setEvaluating(true);

    try {
      const questionObj = questions[currentQuestionIndex];
      const result = await evaluateHRAnswer({
        profile,
        question: questionObj.question_text,
        answer: answerText.trim(),
      });
      
      setSession(prev => ({ ...prev, evaluationResult: result }));

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
      alert('AI evaluation failed. Please try again in a moment.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (questions.length === 0) return;
    setSession((prev) => ({
      ...prev,
      answerText: '',
      evaluationResult: null,
      currentQuestionIndex: (prev.currentQuestionIndex + 1) % questions.length,
    }));
  };

  const handlePrevQuestion = () => {
    if (questions.length === 0) return;
    setSession((prev) => ({
      ...prev,
      answerText: '',
      evaluationResult: null,
      currentQuestionIndex: (prev.currentQuestionIndex - 1 + questions.length) % questions.length,
    }));
  };

  // 1. Company Selection Screen
  if (!selectedCompany) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-brand-500" /> AI HR Interview Simulator
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Choose a target company to begin your customized mock interview. The questions are tailored to each company's specific campus interview model.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {COMPANY_CARDS.map((comp) => (
            <button
              key={comp.name}
              onClick={() => selectCompany(comp.name)}
              className="glass-card text-left p-6 hover:border-brand-500 hover:scale-[1.03] transition-all flex flex-col justify-between h-64 group relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${comp.color} flex items-center justify-center text-white font-extrabold text-xs shadow-md`}>
                  {comp.logo}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">{comp.name}</h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed line-clamp-3">{comp.descDetail}</p>
              </div>
              <div className="text-[10px] text-brand-500 font-bold uppercase tracking-wider mt-4 flex items-center gap-1">
                Start Interview <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  // 2. Mock Simulator screen
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <button
          onClick={handleBackToCompanies}
          className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Companies
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 bg-brand-500/10 text-brand-600 rounded-full">
            {selectedCompany} Mock
          </span>
          <button
            type="button"
            onClick={resetSession}
            disabled={evaluating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:text-brand-600 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0"
          >
            <RefreshCw className="w-3 h-3" /> Reset Session
          </button>
        </div>
      </div>

      {loadingQuestions ? (
        <div className="text-center py-16 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-500 mx-auto" />
          <p className="text-sm text-slate-500">Loading {selectedCompany} questions from database...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="glass-card p-8 text-center space-y-3 border border-dashed border-slate-200">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="font-bold">No Questions Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are no interview questions uploaded for {selectedCompany} yet. You can import them in the Admin Panel or try again.
          </p>
          <button onClick={handleBackToCompanies} className="bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold">
            Choose Another Company
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Question card */}
            <div className="glass-card p-6 border-l-4 border-brand-500 space-y-3 relative overflow-hidden">
              <div className="text-xs uppercase font-bold text-brand-600 dark:text-brand-400 tracking-wider">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
              <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed">
                &ldquo;{currentQuestion?.question_text}&rdquo;
              </p>
            </div>

            {/* Answer editor panel */}
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
                onChange={(e) => setSession(prev => ({ ...prev, answerText: e.target.value }))}
                className="glass-input w-full text-base font-medium leading-relaxed resize-none"
                disabled={evaluating}
              />

              <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
                <span className="text-[11px] text-slate-400 font-semibold">
                  Word Count: {answerText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handlePrevQuestion}
                    className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  
                  <button
                    onClick={handleEvaluate}
                    disabled={!answerText.trim() || evaluating}
                    className="bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 hover:bg-brand-500 disabled:opacity-50 transition-all text-xs"
                  >
                    {evaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {evaluating ? 'AI Evaluating...' : 'Evaluate Answer'}
                  </button>

                  <button
                    onClick={handleNextQuestion}
                    className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AI Scorecard panel */}
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
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{evaluationResult.feedback}</p>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-brand-500">IDEAL SAMPLE ANSWER</div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 bg-brand-500/5 p-3 rounded-xl border border-brand-500/10 leading-relaxed italic">
                    &ldquo;{evaluationResult.sampleAnswer}&rdquo;
                  </p>
                </div>
              </div>
            ) : (
              <div className="glass-card p-6 text-center flex flex-col items-center justify-center min-h-[300px] border border-dashed border-slate-200 dark:border-slate-800/80">
                <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Analysis Pending</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
                  Submit your answer for AI evaluation of tone, structure, and professionalism.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
