import React, { useEffect, useState } from 'react';
import { Users, BookOpen, Settings, BarChart2, Plus, Download, CheckCircle, RefreshCw, ShieldAlert } from 'lucide-react';
import { fetchAllStudents, computeAdminStats, exportStudentsCsv } from '../lib/adminService';

export default function AdminPanel({ profile }) {
  const [activeSubTab, setActiveSubTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  const [newQuestionTopic, setNewQuestionTopic] = useState('Java');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptA, setNewOptA] = useState('');
  const [newOptB, setNewOptB] = useState('');
  const [newOptC, setNewOptC] = useState('');
  const [newOptD, setNewOptD] = useState('');
  const [correctOption, setCorrectOption] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  const stats = computeAdminStats(students);

  const loadStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAllStudents();
      setStudents(data);
    } catch (err) {
      setError(err.message || 'Failed to load students from Supabase.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile.isAdmin) {
      loadStudents();
    } else {
      setLoading(false);
    }
  }, [profile.isAdmin]);

  const handleCreateQuestion = (e) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !newOptA || !newOptB || !correctOption) return;
    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setNewQuestionText('');
      setNewOptA('');
      setNewOptB('');
      setNewOptC('');
      setNewOptD('');
      setCorrectOption('');
    }, 2500);
  };

  const handleExport = async (type) => {
    setExporting(true);
    setExportMsg(`Exporting ${type} report...`);
    try {
      exportStudentsCsv(students, type);
      setExportMsg(`Success! careerpilot_${type}_report.csv downloaded.`);
    } catch (err) {
      setExportMsg(err.message || 'Export failed.');
    } finally {
      setExporting(false);
      setTimeout(() => setExportMsg(''), 4000);
    }
  };

  if (!profile.isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="glass-card p-8 text-center space-y-4 border border-amber-500/20">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Admin Access Required</h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Run <code className="text-brand-500">supabase/admin_migration.sql</code> in Supabase SQL Editor,
            then set your account as admin:
          </p>
          <pre className="text-xs bg-slate-900 text-slate-200 p-4 rounded-xl text-left max-w-lg mx-auto overflow-x-auto">
{`update public.student_profiles
set is_admin = true
where email = 'your@email.com';`}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Admin Management Portal</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Live data from Supabase — all registered student profiles.
          </p>
        </div>
        <button
          onClick={loadStudents}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Registered</span>
            <div className="text-2xl font-bold mt-1">{stats.total} Students</div>
          </div>
          <Users className="w-8 h-8 text-brand-500 opacity-60" />
        </div>
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Onboarded</span>
            <div className="text-2xl font-bold mt-1 text-blue-500">{stats.onboarded}</div>
          </div>
          <BarChart2 className="w-8 h-8 text-blue-500 opacity-60" />
        </div>
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mean Readiness</span>
            <div className="text-2xl font-bold mt-1 text-emerald-500">{stats.avgReadiness}%</div>
          </div>
          <BarChart2 className="w-8 h-8 text-emerald-500 opacity-60" />
        </div>
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Profile</span>
            <div className="text-2xl font-bold mt-1 text-emerald-500">{stats.avgCompletion}%</div>
          </div>
          <Settings className="w-8 h-8 text-emerald-500 opacity-60" />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-500 font-semibold">
          {error}
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="flex border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/20">
          {[
            { id: 'students', label: 'Manage Students', icon: Users },
            { id: 'assessments', label: 'Configure Assessments', icon: BookOpen },
            { id: 'reports', label: 'Export & Reporting', icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
                  activeSubTab === tab.id
                    ? 'border-brand-500 text-brand-500 dark:text-brand-400 bg-white/40 dark:bg-slate-800/20'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4.5 h-4.5" /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeSubTab === 'students' && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Registered profiles from Supabase
              </div>

              {loading ? (
                <p className="text-xs text-slate-500 animate-pulse">Loading students...</p>
              ) : students.length === 0 ? (
                <p className="text-xs text-slate-500">No student profiles found yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <th className="pb-3 font-bold">NAME</th>
                        <th className="pb-3 font-bold">EMAIL</th>
                        <th className="pb-3 font-bold">COLLEGE</th>
                        <th className="pb-3 font-bold text-center">CODING XP</th>
                        <th className="pb-3 font-bold text-center">RESUME</th>
                        <th className="pb-3 font-bold text-center">PROFILE %</th>
                        <th className="pb-3 font-bold text-right">READINESS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} className="border-b border-slate-100 dark:border-slate-800/50 text-slate-700 dark:text-slate-300">
                          <td className="py-3.5 font-bold text-slate-800 dark:text-white">{student.name}</td>
                          <td className="py-3.5">{student.email}</td>
                          <td className="py-3.5">{student.college || '—'}</td>
                          <td className="py-3.5 text-center font-mono">{student.codingScore} XP</td>
                          <td className="py-3.5 text-center font-mono">{student.resumeScore}/100</td>
                          <td className="py-3.5 text-center font-mono">{student.profileCompletion}%</td>
                          <td className="py-3.5 text-right">
                            <span
                              className={`px-2.5 py-1 rounded-full font-bold font-mono ${
                                student.readiness >= 80
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                  : student.readiness >= 65
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                              }`}
                            >
                              {student.readiness}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'assessments' && (
            <form onSubmit={handleCreateQuestion} className="space-y-5 max-w-xl">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Create New Quiz Question</div>
              <p className="text-xs text-slate-500">Question bank sync to Supabase coming soon. Form preview only for now.</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Topic Module</label>
                  <select
                    value={newQuestionTopic}
                    onChange={(e) => setNewQuestionTopic(e.target.value)}
                    className="glass-input text-xs py-2 focus:ring-1"
                  >
                    <option value="Java">Java</option>
                    <option value="Python">Python</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Databases">Databases</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Question Text</label>
                <textarea
                  rows="3"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="glass-input text-xs resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const key = `newOpt${opt}`;
                  const val = { A: newOptA, B: newOptB, C: newOptC, D: newOptD }[opt];
                  const setter = { A: setNewOptA, B: setNewOptB, C: setNewOptC, D: setNewOptD }[opt];
                  return (
                    <div key={opt} className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Option {opt}</label>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => setter(e.target.value)}
                        className="glass-input text-xs py-2"
                        required={opt === 'A' || opt === 'B'}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Correct Answer</label>
                <input
                  type="text"
                  value={correctOption}
                  onChange={(e) => setCorrectOption(e.target.value)}
                  className="glass-input text-xs py-2"
                  required
                />
              </div>

              {formSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4.5 h-4.5" /> Question saved locally (DB sync pending).
                </div>
              )}

              <button
                type="submit"
                className="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Save Question
              </button>
            </form>
          )}

          {activeSubTab === 'reports' && (
            <div className="space-y-6 max-w-md">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Batch Reporting Exporters</div>
              <p className="text-xs text-slate-500 leading-normal">
                Export live Supabase student data as CSV.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleExport('placement')}
                  disabled={exporting || students.length === 0}
                  className="p-5 bg-slate-100/50 dark:bg-slate-900/30 hover:bg-brand-500/5 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Download className="w-6 h-6 text-brand-500" />
                  <span className="text-xs font-bold">Placement Metrics</span>
                </button>

                <button
                  onClick={() => handleExport('interview')}
                  disabled={exporting || students.length === 0}
                  className="p-5 bg-slate-100/50 dark:bg-slate-900/30 hover:bg-brand-500/5 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Download className="w-6 h-6 text-brand-500" />
                  <span className="text-xs font-bold">Interview Metrics</span>
                </button>
              </div>

              {exportMsg && (
                <div className={`p-4 rounded-xl border text-xs font-semibold ${
                  exportMsg.includes('Success')
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                    : 'bg-brand-500/10 border-brand-500/20 text-brand-700 dark:text-brand-400'
                }`}>
                  {exportMsg}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
