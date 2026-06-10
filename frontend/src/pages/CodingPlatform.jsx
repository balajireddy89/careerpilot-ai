import React, { useState } from 'react';
import { Code2, Play, Terminal, CheckCircle, XCircle, RefreshCw, HelpCircle } from 'lucide-react';
import BackButton from '../components/BackButton';
import { fetchCodingChallenges } from '../lib/questionBankService';
import { mapDbChallengeToUi, getTemplate, getSolution, reviewCodeLocally } from '../lib/codingRunner';
import { recordCodingSolve } from '../lib/quizRewards';
import { getProfileKey, useFeatureSession } from '../hooks/useFeatureSession';

const CODING_SESSION_DEFAULT = {
  phase: 'difficulty',
  difficulty: null,
  challenges: [],
  challengeIndex: 0,
  selectedLanguage: 'JavaScript',
  editorCode: '',
  runLogs: [],
  testResult: null,
  feedback: '',
  showHelp: false,
  loading: false,
};

export default function CodingPlatform({ profile, setProfile, onNavigate }) {
  const profileKey = getProfileKey(profile);
  const [session, setSession] = useFeatureSession('coding', profileKey, CODING_SESSION_DEFAULT);
  const [compiling, setCompiling] = useState(false);
  const [loadError, setLoadError] = useState('');

  const selectedChallenge = session.challenges[session.challengeIndex];

  const handleBackFromDifficulty = () => {
    if (session.loading) {
      setSession(CODING_SESSION_DEFAULT);
      return;
    }
    if (onNavigate) onNavigate('dashboard');
  };

  const selectDifficulty = async (difficulty) => {
    setLoadError('');
    setSession({ ...CODING_SESSION_DEFAULT, difficulty, loading: true });
    try {
      const rows = await fetchCodingChallenges(difficulty);
      if (!rows.length) {
        setLoadError(`No ${difficulty} challenges yet. Admin can import JSON in Admin Panel → Coding Practice.`);
        setSession(CODING_SESSION_DEFAULT);
        return;
      }
      const challenges = rows.map(mapDbChallengeToUi);
      const first = challenges[0];
      setSession({
        ...CODING_SESSION_DEFAULT,
        phase: 'coding',
        difficulty,
        challenges,
        challengeIndex: 0,
        selectedLanguage: 'JavaScript',
        editorCode: getTemplate(first, 'JavaScript'),
      });
    } catch (err) {
      console.error('Challenge load failed:', err);
      setLoadError(err.message || 'Failed to load challenges from Supabase.');
      setSession(CODING_SESSION_DEFAULT);
    }
  };

  const handleSelectChallenge = (index) => {
    const challenge = session.challenges[index];
    setSession((prev) => ({
      ...prev,
      challengeIndex: index,
      editorCode: getTemplate(challenge, prev.selectedLanguage),
      testResult: null,
      runLogs: [],
      feedback: '',
      showHelp: false,
    }));
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setSession((prev) => ({
      ...prev,
      selectedLanguage: lang,
      editorCode: getTemplate(selectedChallenge, lang),
      testResult: null,
      runLogs: [],
      showHelp: false,
    }));
  };

  const handleRunCode = async () => {
    if (!selectedChallenge) return;
    setCompiling(true);
    setSession((prev) => ({ ...prev, runLogs: ['Running local test cases...'], showHelp: false }));

    const result = reviewCodeLocally({
      code: session.editorCode,
      challenge: selectedChallenge,
      language: session.selectedLanguage,
    });

    setSession((prev) => ({
      ...prev,
      testResult: result.passed ? 'passed' : 'failed',
      runLogs: result.logs,
      feedback: result.feedback,
    }));

    if (result.passed) {
      const challengeKey = `${session.difficulty}:${selectedChallenge.dbId || selectedChallenge.id}`;
      const isEasy = session.difficulty === 'Easy';
      const isMed = session.difficulty === 'Medium';
      const { profile: updated, xpEarned } = recordCodingSolve(profile, challengeKey, 200);

      const newEasy = isEasy ? profile.codingStats.solvedEasy + 1 : profile.codingStats.solvedEasy;
      const newMed = isMed ? profile.codingStats.solvedMedium + 1 : profile.codingStats.solvedMedium;
      const newHard = !isEasy && !isMed ? profile.codingStats.solvedHard + 1 : profile.codingStats.solvedHard;

      setProfile({
        ...updated,
        codingStats: {
          ...updated.codingStats,
          solvedEasy: Math.min(updated.codingStats.totalEasy, newEasy),
          solvedMedium: Math.min(updated.codingStats.totalMedium, newMed),
          solvedHard: Math.min(updated.codingStats.totalHard, newHard),
          score: updated.codingStats.score + (xpEarned > 0 ? 100 : 0),
        },
      });
    }

    setCompiling(false);
  };

  const handleManualPass = () => {
    if (!selectedChallenge) return;
    if (!window.confirm('Confirm you verified all test cases manually?')) return;
    const challengeKey = `${session.difficulty}:${selectedChallenge.dbId || selectedChallenge.id}`;
    const { profile: updated, xpEarned } = recordCodingSolve(profile, challengeKey, 200);
    if (xpEarned > 0) {
      setProfile({ ...updated, codingStats: { ...updated.codingStats, score: updated.codingStats.score + 100 } });
      setSession((prev) => ({
        ...prev,
        testResult: 'passed',
        runLogs: [...prev.runLogs, 'Manual verification accepted. XP awarded once per challenge.'],
        feedback: 'Marked complete.',
      }));
    } else {
      setSession((prev) => ({
        ...prev,
        runLogs: [...prev.runLogs, 'XP already earned for this challenge.'],
      }));
    }
  };

  const handleBackToDifficulty = () => {
    if (selectedChallenge) {
      const defaultCode = getTemplate(selectedChallenge, session.selectedLanguage);
      const hasProgress = session.testResult || session.editorCode !== defaultCode;
      if (hasProgress) {
        const confirmed = window.confirm('Leave this challenge? Your code and progress will be lost.');
        if (!confirmed) return;
      }
    }
    setSession(CODING_SESSION_DEFAULT);
  };

  if (session.phase === 'difficulty' || session.loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <BackButton onClick={handleBackFromDifficulty} label={session.loading ? 'Cancel' : 'Back to Dashboard'} />
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Code2 className="w-8 h-8 text-brand-500" /> Coding Practice Platform
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Admin-curated challenges from Supabase. JavaScript runs locally; Java/Python use manual verification.
          </p>
        </div>
        {loadError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-600">{loadError}</div>
        )}
        {session.loading ? (
          <div className="space-y-3">
            <p className="text-sm flex items-center gap-2 text-slate-500">
              <RefreshCw className="w-4 h-4 animate-spin" /> Loading challenges...
            </p>
            <BackButton onClick={() => setSession(CODING_SESSION_DEFAULT)} label="Cancel loading" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['Easy', 'Medium', 'Hard'].map((d) => (
              <button
                key={d}
                onClick={() => selectDifficulty(d)}
                className="glass-card p-8 text-center hover:border-brand-500 transition-colors"
              >
                <div className="text-2xl font-extrabold text-brand-500">{d}</div>
                <p className="text-xs text-slate-500 mt-2">Admin-imported problems</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const helpSolution = getSolution(selectedChallenge, session.selectedLanguage);

  return (
    <div className="space-y-8 animate-fade-in">
      <BackButton onClick={handleBackToDifficulty} label="Back to Difficulty" />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Code2 className="w-8 h-8 text-brand-500" /> {session.difficulty} Challenges
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Problem {session.challengeIndex + 1} of {session.challenges.length}
          </p>
        </div>
        <select value={session.selectedLanguage} onChange={handleLanguageChange} className="glass-input text-xs font-semibold py-1.5">
          <option value="JavaScript">JavaScript</option>
          <option value="Java">Java</option>
          <option value="Python">Python</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 space-y-4 max-h-[520px] overflow-y-auto">
            <h2 className="text-lg font-bold">Challenges</h2>
            {session.challenges.map((c, i) => (
              <button
                key={c.dbId || c.id}
                onClick={() => handleSelectChallenge(i)}
                className={`w-full text-left p-3 rounded-xl border text-xs ${
                  session.challengeIndex === i ? 'border-brand-500 bg-brand-500/5' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="font-bold">{c.title}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {selectedChallenge && (
            <>
              <div className="glass-card p-6 space-y-3">
                <h2 className="text-lg font-bold">{selectedChallenge.title}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">{selectedChallenge.description}</p>
                <div className="text-xs text-slate-500">
                  <strong>Test cases:</strong>
                  <ul className="mt-1 space-y-1">
                    {selectedChallenge.testCases?.map((tc, i) => (
                      <li key={i}>Input: {tc.input} → Expected: {tc.expected}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="glass-card overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-900/60 px-4 py-2.5 flex justify-between items-center border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-brand-500" /> Editor
                  </span>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {helpSolution && (
                      <button
                        type="button"
                        onClick={() => setSession((prev) => ({ ...prev, showHelp: !prev.showHelp }))}
                        className="text-xs font-bold text-slate-500 hover:text-brand-600 flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        {session.showHelp ? 'Hide solution' : 'Show solution'}
                      </button>
                    )}
                    {session.selectedLanguage !== 'JavaScript' && (
                      <button
                        type="button"
                        onClick={handleManualPass}
                        className="text-xs font-bold text-emerald-600 border border-emerald-500/30 px-3 py-1.5 rounded-lg"
                      >
                        Mark verified
                      </button>
                    )}
                    <button
                      onClick={handleRunCode}
                      disabled={compiling}
                      className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1"
                    >
                      {compiling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      Run Tests
                    </button>
                  </div>
                </div>
                <textarea
                  value={session.editorCode}
                  onChange={(e) => setSession((prev) => ({ ...prev, editorCode: e.target.value }))}
                  className="w-full bg-slate-950 text-emerald-400 font-mono text-sm p-4 min-h-[280px] focus:outline-none resize-none"
                  spellCheck="false"
                  placeholder={session.selectedLanguage === 'JavaScript' ? 'function solve(...args) { /* your code */ }' : 'Write your solution here'}
                />
              </div>

              {session.showHelp && helpSolution && (
                <div className="glass-card p-4 border border-amber-500/20 bg-amber-500/5">
                  <p className="text-[10px] font-bold text-amber-600 uppercase mb-2">Reference solution</p>
                  <pre className="text-xs font-mono text-slate-600 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">
                    {helpSolution}
                  </pre>
                </div>
              )}

              <div className="glass-card p-6 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase">Test Console</h3>
                <div className="bg-slate-900 p-4 rounded-xl font-mono text-xs text-slate-300 min-h-[80px]">
                  {session.runLogs.length === 0 ? (
                    <span className="text-slate-500 italic">Run your code to check test cases.</span>
                  ) : (
                    session.runLogs.map((log, index) => <div key={index}>{log}</div>)
                  )}
                </div>
                {session.testResult && (
                  <div className={`p-4 rounded-xl border flex gap-2.5 text-sm ${
                    session.testResult === 'passed'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400'
                  }`}>
                    {session.testResult === 'passed' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
                    <div>
                      <strong>{session.testResult === 'passed' ? 'All test cases passed!' : 'Not all test cases passed.'}</strong>
                      {session.feedback && <p className="mt-0.5 opacity-90">{session.feedback}</p>}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
