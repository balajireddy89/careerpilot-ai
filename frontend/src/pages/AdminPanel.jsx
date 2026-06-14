import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  Users, BookOpen, Download, CheckCircle, RefreshCw, ShieldAlert,
  Code2, Brain, Map, Shield, MessageSquare,
} from 'lucide-react';
import { fetchAllStudents, computeAdminStats, exportStudentsCsv, setStudentAdminStatus } from '../lib/adminService';
import { TECH_INTERVIEW_TOPICS } from '../lib/csSkillsCatalog';
import { APTITUDE_DEFAULTS } from '../lib/questionBankService';
import QuestionBankEditor from '../components/admin/QuestionBankEditor';
import RoadmapEditor from '../components/admin/RoadmapEditor';
import HRQuestionBankEditor from '../components/admin/HRQuestionBankEditor';
import JsonSchemaGuide from '../components/admin/JsonSchemaGuide';

const PRIMARY_ADMIN_EMAIL = 'reddy.kuppila2006@gmail.com';

export default function AdminPanel({ profile }) {
  const [activeSubTab, setActiveSubTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');
  const [adminMsg, setAdminMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) => s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const stats = computeAdminStats(filteredStudents.length ? filteredStudents : students);

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
    if (profile.isAdmin) loadStudents();
    else setLoading(false);
  }, [profile.isAdmin]);

  const handleToggleAdmin = async (student) => {
    const next = !student.isAdmin;
    const label = next ? 'grant admin access to' : 'revoke admin access from';
    if (!window.confirm(`Are you sure you want to ${label} ${student.email}?`)) return;
    try {
      await setStudentAdminStatus(student.userId, next);
      setAdminMsg(`${student.email} is now ${next ? 'an admin' : 'a regular user'}.`);
      setTimeout(() => setAdminMsg(''), 3000);
      await loadStudents();
    } catch (err) {
      alert(err.message || 'Failed to update admin status.');
    }
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
            Run migrations in Supabase SQL Editor, then sign in with the admin account.
          </p>
          <div className="text-left max-w-lg mx-auto space-y-2 text-xs text-slate-500">
            <p><strong>1.</strong> Run <code className="text-brand-500">supabase/schema.sql</code></p>
            <p><strong>2.</strong> Run <code className="text-brand-500">supabase/admin_migration.sql</code></p>
            <p><strong>3.</strong> Run <code className="text-brand-500">supabase/question_bank_migration.sql</code></p>
            <p><strong>4.</strong> Sign up / log in as <code className="text-brand-500">{PRIMARY_ADMIN_EMAIL}</code></p>
            <p><strong>5.</strong> Open sidebar → <strong>Admin Panel</strong></p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'students', label: 'Students', icon: Users },
    { id: 'technical', label: 'Technical Interview', icon: BookOpen },
    { id: 'coding', label: 'Coding Practice', icon: Code2 },
    { id: 'aptitude', label: 'Aptitude Prep', icon: Brain },
    { id: 'hr-questions', label: 'HR Questions', icon: MessageSquare },
    { id: 'roadmap', label: 'Learning Roadmap', icon: Map },
    { id: 'reports', label: 'Reports', icon: Download },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Admin Management Portal</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage students, question banks, and roadmaps — synced live with the student app via Supabase.
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Students', value: stats.total, color: 'text-brand-500' },
          { label: 'Onboarded', value: stats.onboarded, color: 'text-blue-500' },
          { label: 'Mean Readiness', value: `${stats.avgReadiness}%`, color: 'text-emerald-500' },
          { label: 'Avg Profile', value: `${stats.avgCompletion}%`, color: 'text-emerald-500' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">{s.label}</span>
            <div className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-500 font-semibold">{error}</div>
      )}
      {adminMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 text-xs text-emerald-600 flex gap-2"><CheckCircle className="w-4 h-4" />{adminMsg}</div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="flex border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/20 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex-shrink-0 px-4 py-3 text-center text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
                  activeSubTab === tab.id
                    ? 'border-brand-500 text-brand-500 bg-white/40 dark:bg-slate-800/20'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeSubTab === 'students' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">Grant or revoke admin access. Primary admin: {PRIMARY_ADMIN_EMAIL}</p>
              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="glass-input w-full pl-10 py-2.5 text-sm"
                />
              </div>
              {loading ? (
                <p className="text-sm text-slate-500 animate-pulse">Loading students...</p>
              ) : filteredStudents.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {students.length === 0 ? 'No student profiles found.' : 'No students match your search.'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <th className="pb-3 pr-4 font-bold text-sm">NAME</th>
                        <th className="pb-3 pr-4 font-bold text-sm">EMAIL</th>
                        <th className="pb-3 pr-4 font-bold text-sm">COLLEGE</th>
                        <th className="pb-3 pr-4 font-bold text-sm text-center">XP</th>
                        <th className="pb-3 pr-4 font-bold text-sm text-center">READINESS</th>
                        <th className="pb-3 font-bold text-sm text-right">ADMIN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="border-b border-slate-100 dark:border-slate-800/50 text-slate-700 dark:text-slate-300">
                          <td className="py-4 pr-4 font-bold text-base">{student.name}</td>
                          <td className="py-4 pr-4 text-sm">{student.email}</td>
                          <td className="py-4 pr-4 text-sm">{student.college || '—'}</td>
                          <td className="py-4 pr-4 text-center font-mono text-base">{student.points}</td>
                          <td className="py-4 pr-4 text-center font-mono text-base">{student.readiness}%</td>
                          <td className="py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleToggleAdmin(student)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                                student.isAdmin
                                  ? 'bg-brand-500/15 text-brand-600'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                              }`}
                            >
                              <Shield className="w-3.5 h-3.5" />
                              {student.isAdmin ? 'Admin' : 'Make Admin'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'technical' && (
            <div className="space-y-4">
              <JsonSchemaGuide type="technical" />
              <QuestionBankEditor
                moduleType="technical"
                defaultCategories={TECH_INTERVIEW_TOPICS}
                title="Import MCQ JSON per subject. Questions persist until deleted."
              />
            </div>
          )}

          {activeSubTab === 'coding' && (
            <div className="space-y-4">
              <JsonSchemaGuide type="coding" />
              <QuestionBankEditor
                moduleType="coding"
                isCoding
                defaultCategories={['General', 'Java', 'Python', 'JavaScript']}
                title="Import coding JSON. JavaScript & Python auto-run tests in the IDE."
              />
            </div>
          )}

          {activeSubTab === 'aptitude' && (
            <div className="space-y-4">
              <JsonSchemaGuide type="aptitude" />
              <QuestionBankEditor
                moduleType="aptitude"
                defaultCategories={APTITUDE_DEFAULTS.map((c) => c.id)}
                title="Import aptitude MCQ JSON for quantitative, logical, or verbal categories."
              />
            </div>
          )}

          {activeSubTab === 'roadmap' && <RoadmapEditor />}

          {activeSubTab === 'hr-questions' && (
            <div className="space-y-4">
              <JsonSchemaGuide type="hr" />
              <HRQuestionBankEditor />
            </div>
          )}

          {activeSubTab === 'reports' && (
            <div className="space-y-6 max-w-md">
              <p className="text-xs text-slate-500">Export live Supabase student data as CSV.</p>
              <div className="grid grid-cols-2 gap-4">
                {['placement', 'interview'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleExport(type)}
                    disabled={exporting || students.length === 0}
                    className="p-5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold disabled:opacity-50"
                  >
                    <Download className="w-6 h-6 text-brand-500" />
                    {type === 'placement' ? 'Placement Metrics' : 'Interview Metrics'}
                  </button>
                ))}
              </div>
              {exportMsg && <p className="text-xs text-brand-600">{exportMsg}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
