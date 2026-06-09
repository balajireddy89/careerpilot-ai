import React, { useState } from 'react';
import { Code2, Play, Terminal, CheckCircle, XCircle, RefreshCw, HelpCircle } from 'lucide-react';
import { generateCodingChallenges, generateCodingSolution, reviewCodingSolution } from '../lib/aiService';
import { recordCodingSolve } from '../lib/quizRewards';
import { getProfileKey, useFeatureSession } from '../hooks/useFeatureSession';

function getTemplate(challenge, lang) {
  if (lang === 'Java') return challenge.templateJava || challenge.solution || '';
  if (lang === 'Python') return challenge.templatePython || challenge.solution || '';
  return challenge.templateJS || challenge.solution || '';
}

const CODING_SESSION_DEFAULT = {
  phase: 'difficulty',
  difficulty: null,
  challenges: [],
  challengeIndex: 0,
  selectedLanguage: 'Java',
  editorCode: '',
  runLogs: [],
  testResult: null,
  aiFeedback: '',
  showHelp: false,
  generating: false,
};

export default function CodingPlatform({ profile, setProfile }) {
  const profileKey = getProfileKey(profile);
  const [session, setSession] = useFeatureSession('coding', profileKey, CODING_SESSION_DEFAULT);
  const [compiling, setCompiling] = useState(false);
  const [loadingHelp, setLoadingHelp] = useState(false);

  const selectedChallenge = session.challenges[session.challengeIndex];

  const selectDifficulty = async (difficulty) => {
    setSession({ ...CODING_SESSION_DEFAULT, difficulty, generating: true });
    try {
      const challenges = await generateCodingChallenges({
        difficulty,
        count: 5,
        language: 'Java',
      });
      const first = challenges[0];
      setSession({
        ...CODING_SESSION_DEFAULT,
        phase: 'coding',
        difficulty,
        challenges,
        challengeIndex: 0,
        selectedLanguage: 'Java',
        editorCode: getTemplate(first, 'Java'),
      });
    } catch (err) {
      console.error('Challenge generation failed:', err);
      alert('Failed to generate challenges. Check OpenRouter API key.');
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
      aiFeedback: '',
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
    setSession((prev) => ({ ...prev, runLogs: ['Sending code to OpenRouter AI judge...'], showHelp: false }));

    try {
      const result = await reviewCodingSolution({
        challenge: selectedChallenge,
        code: session.editorCode,
        language: session.selectedLanguage,
      });

      setSession((prev) => ({
        ...prev,
        testResult: result.passed ? 'passed' : 'failed',
        runLogs: result.logs,
        aiFeedback: result.feedback + (result.complexity ? ` Complexity: ${result.complexity}` : ''),
      }));

      if (result.passed) {
        const challengeKey = `${session.difficulty}:${selectedChallenge.id}`;
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
    } catch (err) {
      setSession((prev) => ({
        ...prev,
        testResult: 'failed',
        runLogs: ['AI review failed. Check OpenRouter API key.'],
        aiFeedback: err.message,
      }));
    } finally {
      setCompiling(false);
    }
  };

  if (session.phase === 'difficulty' || session.generating) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Code2 className="w-8 h-8 text-brand-500" /> Coding Practice Platform
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Choose a difficulty — AI generates 5 challenges (faster). Solutions load only when you click Need help.</p>
        </div>
        {session.generating ? (
          <p className="text-sm flex items-center gap-2 text-slate-500">
            <RefreshCw className="w-4 h-4 animate-spin" /> Generating challenges...
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['Easy', 'Medium', 'Hard'].map((d) => (
              <button
                key={d}
                onClick={() => selectDifficulty(d)}
                className="glass-card p-8 text-center hover:border-brand-500 transition-colors"
              >
                <div className="text-2xl font-extrabold text-brand-500">{d}</div>
                <p className="text-xs text-slate-500 mt-2">5 AI-generated problems</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Code2 className="w-8 h-8 text-brand-500" /> {session.difficulty} Challenges
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Problem {session.challengeIndex + 1} of {session.challenges.length}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSession(CODING_SESSION_DEFAULT)}
            className="text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg"
          >
            Change Difficulty
          </button>
          <select value={session.selectedLanguage} onChange={handleLanguageChange} className="glass-input text-xs font-semibold py-1.5">
            <option value="Java">Java</option>
            <option value="Python">Python</option>
            <option value="JavaScript">JavaScript</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 space-y-4 max-h-[520px] overflow-y-auto">
            <h2 className="text-lg font-bold">Challenges</h2>
            {session.challenges.map((c, i) => (
              <button
                key={c.id}
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
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={loadingHelp}
                      onClick={async () => {
                        if (session.showHelp && selectedChallenge.solution) {
                          setSession((prev) => ({ ...prev, showHelp: false }));
                          return;
                        }
                        setLoadingHelp(true);
                        try {
                          let solution = selectedChallenge.solution;
                          if (!solution) {
                            solution = await generateCodingSolution({
                              challenge: selectedChallenge,
                              language: session.selectedLanguage,
                            });
                            const updated = session.challenges.map((c, i) =>
                              i === session.challengeIndex ? { ...c, solution } : c
                            );
                            setSession((prev) => ({ ...prev, challenges: updated, showHelp: true }));
                          } else {
                            setSession((prev) => ({ ...prev, showHelp: true }));
                          }
                        } catch (err) {
                          alert('Could not load solution. Check OpenRouter API key.');
                        } finally {
                          setLoadingHelp(false);
                        }
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-brand-600 flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                    >
                      {loadingHelp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HelpCircle className="w-3.5 h-3.5" />}
                      {loadingHelp ? 'Loading…' : 'Need help?'}
                    </button>
                    <button
                      onClick={handleRunCode}
                      disabled={compiling}
                      className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1"
                    >
                      {compiling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      Run & Review
                    </button>
                  </div>
                </div>
                <textarea
                  value={session.editorCode}
                  onChange={(e) => setSession((prev) => ({ ...prev, editorCode: e.target.value }))}
                  className="w-full bg-slate-950 text-emerald-400 font-mono text-sm p-4 min-h-[280px] focus:outline-none resize-none"
                  spellCheck="false"
                />
              </div>

              {session.showHelp && selectedChallenge.solution && (
                <div className="glass-card p-4 border border-amber-500/20 bg-amber-500/5">
                  <p className="text-[10px] font-bold text-amber-600 uppercase mb-2">Reference solution</p>
                  <pre className="text-xs font-mono text-slate-600 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">
                    {selectedChallenge.solution}
                  </pre>
                </div>
              )}

              <div className="glass-card p-6 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase">AI Review Console</h3>
                <div className="bg-slate-900 p-4 rounded-xl font-mono text-xs text-slate-300 min-h-[80px]">
                  {session.runLogs.length === 0 ? (
                    <span className="text-slate-500 italic">Run your code to get AI feedback.</span>
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
                      {session.aiFeedback && <p className="mt-0.5 opacity-90">{session.aiFeedback}</p>}
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
