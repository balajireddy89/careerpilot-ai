import React, { useState, useMemo } from 'react';
import { Code2, Play, Terminal, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { CODING_CHALLENGES } from '../mock/mockData';
import { reviewCodingSolution } from '../lib/aiService';
import { getProfileKey, useFeatureSession } from '../hooks/useFeatureSession';

function getTemplate(challenge, lang) {
  if (lang === 'Java') return challenge.templateJava;
  if (lang === 'Python') return challenge.templatePython;
  return challenge.templateJS;
}

const CODING_SESSION_DEFAULT = {
  challengeId: CODING_CHALLENGES[0].id,
  selectedLanguage: 'Java',
  editorCode: getTemplate(CODING_CHALLENGES[0], 'Java'),
  runLogs: [],
  testResult: null,
  aiFeedback: '',
};

export default function CodingPlatform({ profile, setProfile }) {
  const profileKey = getProfileKey(profile);
  const [session, setSession] = useFeatureSession('coding', profileKey, CODING_SESSION_DEFAULT);
  const [compiling, setCompiling] = useState(false);

  const selectedChallenge = useMemo(
    () => CODING_CHALLENGES.find((c) => c.id === session.challengeId) || CODING_CHALLENGES[0],
    [session.challengeId]
  );

  const handleSelectChallenge = (challenge) => {
    setSession((prev) => ({
      ...prev,
      challengeId: challenge.id,
      editorCode: getTemplate(challenge, prev.selectedLanguage),
      testResult: null,
      runLogs: [],
      aiFeedback: '',
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
      aiFeedback: '',
    }));
  };

  const handleRunCode = async () => {
    setCompiling(true);
    setSession((prev) => ({ ...prev, runLogs: ['Sending code to OpenRouter AI judge...'] }));

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
        const isEasy = selectedChallenge.difficulty === 'Easy';
        const isMed = selectedChallenge.difficulty === 'Medium';
        const newEasy = isEasy ? profile.codingStats.solvedEasy + 1 : profile.codingStats.solvedEasy;
        const newMed = isMed ? profile.codingStats.solvedMedium + 1 : profile.codingStats.solvedMedium;
        const newHard = !isEasy && !isMed ? profile.codingStats.solvedHard + 1 : profile.codingStats.solvedHard;

        setProfile({
          ...profile,
          points: profile.points + 200,
          codingStats: {
            ...profile.codingStats,
            solvedEasy: Math.min(profile.codingStats.totalEasy, newEasy),
            solvedMedium: Math.min(profile.codingStats.totalMedium, newMed),
            solvedHard: Math.min(profile.codingStats.totalHard, newHard),
            score: profile.codingStats.score + 100,
          },
        });
      }
    } catch (err) {
      console.error('Code review failed:', err);
      setSession((prev) => ({
        ...prev,
        testResult: 'failed',
        runLogs: ['AI review failed. Check OpenRouter API key in .env'],
        aiFeedback: err.message,
      }));
    } finally {
      setCompiling(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Code2 className="w-8 h-8 text-brand-500" /> Coding Practice Platform
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Submit solutions for OpenRouter AI code review against test cases.
          </p>
        </div>
        <select
          value={session.selectedLanguage}
          onChange={handleLanguageChange}
          className="glass-input text-xs font-semibold py-1.5"
        >
          <option value="Java">Java SE 8</option>
          <option value="Python">Python 3.x</option>
          <option value="JavaScript">JavaScript ES6</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-bold">Coding Challenges</h2>
            <div className="space-y-3 max-h-[480px] overflow-y-auto">
              {CODING_CHALLENGES.map((challenge) => (
                <button
                  key={challenge.id}
                  onClick={() => handleSelectChallenge(challenge)}
                  className={`w-full text-left p-4 rounded-2xl border text-xs transition-all ${
                    session.challengeId === challenge.id
                      ? 'border-brand-500 bg-brand-500/5 ring-1 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className="font-bold text-slate-800 dark:text-white">{challenge.title}</div>
                  <div className="text-slate-500">{challenge.difficulty}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card p-6 space-y-3">
            <h2 className="text-lg font-bold">{selectedChallenge.title}</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">{selectedChallenge.description}</p>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900/60 px-4 py-2.5 flex justify-between items-center border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-brand-500" /> Editor
              </span>
              <button
                onClick={handleRunCode}
                disabled={compiling}
                className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1"
              >
                {compiling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                {compiling ? 'AI Reviewing...' : 'Run & Review'}
              </button>
            </div>
            <textarea
              value={session.editorCode}
              onChange={(e) => setSession((prev) => ({ ...prev, editorCode: e.target.value }))}
              className="w-full bg-slate-950 text-emerald-400 font-mono text-xs p-4 min-h-[300px] focus:outline-none resize-none"
              spellCheck="false"
            />
          </div>

          <div className="glass-card p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase">AI Review Console</h3>
            <div className="bg-slate-900 p-4 rounded-xl font-mono text-xs text-slate-300 min-h-[100px]">
              {session.runLogs.length === 0 ? (
                <span className="text-slate-500 italic">Run your code to get OpenRouter AI feedback.</span>
              ) : (
                session.runLogs.map((log, index) => (
                  <div key={index} className={log.includes('SUCCESS') || log.includes('passed') ? 'text-emerald-400' : log.includes('FAIL') ? 'text-rose-400' : ''}>
                    {log}
                  </div>
                ))
              )}
            </div>
            {session.testResult && (
              <div className={`p-4 rounded-xl border flex gap-2.5 text-xs ${
                session.testResult === 'passed'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400'
              }`}>
                {session.testResult === 'passed' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
                <div>
                  <strong>{session.testResult === 'passed' ? 'All Test Cases Passed!' : 'Solution needs work.'}</strong>
                  {session.aiFeedback && <p className="mt-0.5 opacity-90">{session.aiFeedback}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
