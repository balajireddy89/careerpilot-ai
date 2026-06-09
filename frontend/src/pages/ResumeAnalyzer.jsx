import React, { useState } from 'react';
import { FileText, AlertTriangle, CheckCircle, UploadCloud, RefreshCw, Sparkles } from 'lucide-react';
import { analyzeResumeWithAI } from '../lib/aiService';
import { extractTextFromFile } from '../lib/aiUtils';
import { getProfileKey, useFeatureSession } from '../hooks/useFeatureSession';

const RESUME_SESSION_DEFAULT = {
  fileName: null,
  activeTab: 'suggestions',
  checklist: [],
};

export default function ResumeAnalyzer({ profile, setProfile }) {
  const profileKey = getProfileKey(profile);
  const [session, setSession] = useFeatureSession('resume-analyzer', profileKey, RESUME_SESSION_DEFAULT);
  const [analyzing, setAnalyzing] = useState(false);

  const activeTab = session.activeTab;
  const setActiveTab = (tab) => setSession((prev) => ({ ...prev, activeTab: tab }));
  const checklist = session.checklist?.length
    ? session.checklist
    : [
        { title: 'No Tables/Graphics in Layout', status: true, desc: 'ATS systems parse linear texts better.' },
        { title: 'Standard Section Headers', status: true, desc: "Clear headings like 'Education', 'Experience'." },
        { title: 'Grammar & Spelling', status: true, desc: 'Review after AI analysis.' },
        { title: 'Active Action Verbs Used', status: false, desc: 'Needs active phrases (e.g. Led, Solved).' },
      ];

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setAnalyzing(true);
    setSession((prev) => ({ ...prev, fileName: uploadedFile.name }));

    try {
      const resumeText = await extractTextFromFile(uploadedFile);
      const analysis = await analyzeResumeWithAI({
        profile,
        resumeText,
        fileName: uploadedFile.name,
      });

      const newSkills = (analysis.extractedSkills || []).filter((s) => !profile.skills.includes(s));
      const newProficiency = { ...profile.skillsProficiency };
      newSkills.forEach((s) => { newProficiency[s] = 'Intermediate'; });

      const updatedProfile = {
        ...profile,
        points: profile.points + 150,
        skills: [...profile.skills, ...newSkills],
        skillsProficiency: newProficiency,
        resumeDetails: {
          fileName: uploadedFile.name,
          uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          score: analysis.score ?? 75,
          atsScore: analysis.atsScore ?? 70,
          formattingScore: analysis.formattingScore ?? 75,
          keywordsScore: analysis.keywordsScore ?? 70,
          detectedKeywords: analysis.detectedKeywords || [],
          missingKeywords: analysis.missingKeywords || [],
          suggestions: analysis.suggestions || [],
        },
      };

      setProfile(updatedProfile);
      setSession((prev) => ({
        ...prev,
        fileName: uploadedFile.name,
        checklist: analysis.checklist || prev.checklist,
      }));
    } catch (err) {
      console.error('Resume analysis failed:', err);
      alert('AI resume analysis failed. Check your OpenRouter API key in .env and try again.');
      setSession((prev) => ({ ...prev, fileName: null }));
    } finally {
      setAnalyzing(false);
    }
  };

  const resume = profile.resumeDetails;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">AI Resume Analyzer</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Upload your resume for real OpenRouter ATS analysis — scores, keywords, and optimization tips.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upload Resume File</h2>
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 transition-colors relative bg-white/10 dark:bg-slate-900/10">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={analyzing}
              />
              <UploadCloud className="w-12 h-12 text-slate-400 mb-2 animate-bounce" />

              {analyzing ? (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">OpenRouter AI analyzing resume...</p>
                  <p className="text-xs text-slate-500">Checking ATS keywords, formatting, and skill alignment.</p>
                  <RefreshCw className="w-5 h-5 text-brand-500 animate-spin mx-auto" />
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {session.fileName || resume.fileName ? `Selected: ${session.fileName || resume.fileName}` : 'Drag & Drop your resume (PDF/DOCX/TXT) or click to browse'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Powered by OpenRouter AI</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-5 text-center flex flex-col items-center justify-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Resume Score</div>
              <div className="text-4xl font-extrabold text-brand-500 my-3">{resume.score}/100</div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-brand-500 h-full rounded-full" style={{ width: `${resume.score}%` }} />
              </div>
            </div>
            <div className="glass-card p-5 text-center flex flex-col items-center justify-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">ATS Compatibility</div>
              <div className="text-4xl font-extrabold text-blue-500 my-3">{resume.atsScore}/100</div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${resume.atsScore}%` }} />
              </div>
            </div>
            <div className="glass-card p-5 text-center flex flex-col items-center justify-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Keyword Density</div>
              <div className="text-4xl font-extrabold text-emerald-500 my-3">{resume.keywordsScore}/100</div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${resume.keywordsScore}%` }} />
              </div>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="flex border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/20">
              {[
                { id: 'suggestions', label: 'AI Suggestions', count: resume.suggestions.length },
                { id: 'keywords', label: 'ATS Keywords', count: resume.missingKeywords.length },
                { id: 'checklist', label: 'Layout & Grammar', count: checklist.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-brand-500 text-brand-500 bg-white/40 dark:bg-slate-800/20'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label} <span className="ml-1 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-[10px] rounded-full">{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'suggestions' && (
                <div className="space-y-4">
                  {resume.suggestions.length === 0 ? (
                    <p className="text-xs text-slate-500">Upload a resume to get AI suggestions.</p>
                  ) : (
                    resume.suggestions.map((suggestion, index) => (
                      <div key={index} className="flex gap-3 items-start p-3 bg-slate-100/50 dark:bg-slate-900/30 rounded-xl text-xs">
                        <Sparkles className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                        <p className="text-slate-700 dark:text-slate-300 font-medium">{suggestion}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'keywords' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-500 uppercase mb-2">Detected Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {resume.detectedKeywords.map((keyword, index) => (
                        <span key={index} className="px-2.5 py-1 bg-emerald-100/40 text-emerald-600 rounded-lg text-xs font-bold">{keyword}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-rose-500 uppercase mb-2">Missing Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {resume.missingKeywords.map((keyword, index) => (
                        <span key={index} className="px-2.5 py-1 bg-rose-100/40 text-rose-600 rounded-lg text-xs font-bold">{keyword}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'checklist' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {checklist.map((item, index) => (
                    <div key={index} className="p-3.5 bg-slate-100/50 dark:bg-slate-900/30 rounded-xl flex items-start gap-3">
                      {item.status ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-white">{item.title}</h5>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-500" />
            <h3 className="text-md font-bold text-slate-800 dark:text-white">ATS Guidelines</h3>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-3">
            <li>Use standard fonts and export as PDF or DOCX.</li>
            <li>List technical skills as comma-separated keywords.</li>
            <li>Integrate keywords into project bullet points.</li>
            <li>Results sync with Career Chatbot and Placement Predictor.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
