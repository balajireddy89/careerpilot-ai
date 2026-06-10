import React, { useState } from 'react';
import { Save, User, Briefcase, GraduationCap, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { ALL_CS_SKILLS } from '../lib/csSkillsCatalog';
import { PREFERRED_COMPANY_OPTIONS } from '../lib/companyOptions';

const SKILL_OPTIONS = ALL_CS_SKILLS.slice(0, 24);
const COMPANY_OPTIONS = PREFERRED_COMPANY_OPTIONS;
const PATH_OPTIONS = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile Developer',
  'Data Scientist', 'AI/ML Engineer', 'DevOps Engineer', 'Cloud Engineer', 'Cybersecurity Analyst',
  'Database Administrator', 'Software Engineer', 'UI/UX Designer', 'Computer Science (General)',
];

export default function ProfileSettings({ profile, setProfile }) {
  const { signOut } = useAuth();
  const [form, setForm] = useState({
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    college: profile.college || '',
    degree: profile.degree || '',
    branch: profile.branch || '',
    currentYear: profile.currentYear || '3rd',
    graduationYear: profile.graduationYear || 2027,
    cgpa: profile.cgpa || '',
    targetRole: profile.targetRole || profile.primaryPriority || '',
    primaryPriority: profile.primaryPriority || profile.targetRole || '',
    workType: profile.workType || 'Hybrid',
    weeklyHours: profile.weeklyHours || '10-20',
    skills: profile.skills || [],
    preferredCompanies: profile.preferredCompanies || [],
    preferredPaths: profile.preferredPaths || [],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const toggleListItem = (field, value) => {
    setForm((prev) => {
      const list = prev[field];
      const updated = list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value];
      return { ...prev, [field]: updated };
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setProfile({
        ...profile,
        ...form,
        targetRole: form.primaryPriority || form.targetRole || form.preferredPaths[0] || '',
        primaryPriority: form.primaryPriority || form.targetRole || form.preferredPaths[0] || '',
      }, { immediate: true });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-8 h-8 text-brand-500" /> Profile
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
            Update your details anytime. Changes are saved to your Supabase account.
          </p>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-500 border border-red-500/30 rounded-xl hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-brand-500" /> Basic Details
          </h2>
          {['name', 'email', 'phone', 'college', 'degree', 'branch', 'cgpa'].map((field) => (
            <div key={field}>
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">
                {field.replace(/([A-Z])/g, ' $1')}
              </label>
              <input
                name={field}
                value={form[field]}
                onChange={handleChange}
                disabled={field === 'email'}
                className="glass-input w-full text-xs disabled:opacity-60"
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Current Year</label>
              <select name="currentYear" value={form.currentYear} onChange={handleChange} className="glass-input w-full text-xs">
                {['1st', '2nd', '3rd', '4th', 'Graduated'].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Graduation Year</label>
              <input
                type="number"
                name="graduationYear"
                value={form.graduationYear}
                onChange={handleChange}
                className="glass-input w-full text-xs"
              />
            </div>
          </div>
        </section>

        <section className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand-500" /> Career Preferences
          </h2>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Primary Learning Priority</label>
            <select name="primaryPriority" value={form.primaryPriority || form.targetRole} onChange={handleChange} className="glass-input w-full text-xs">
              <option value="">Select your main focus</option>
              {PATH_OPTIONS.map((path) => (
                <option key={path} value={path}>{path}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Work Type</label>
              <select name="workType" value={form.workType} onChange={handleChange} className="glass-input w-full text-xs">
                {['On-site', 'Remote', 'Hybrid'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Weekly Hours</label>
              <select name="weeklyHours" value={form.weeklyHours} onChange={handleChange} className="glass-input w-full text-xs">
                {['5-10', '10-20', '20-30', '30+'].map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleListItem('skills', skill)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    form.skills.includes(skill)
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Preferred Companies</p>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {COMPANY_OPTIONS.map((company) => (
                <button
                  key={company}
                  type="button"
                  onClick={() => toggleListItem('preferredCompanies', company)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    form.preferredCompanies.includes(company)
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  {company}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
        {saved && <span className="text-xs text-emerald-500 font-semibold">Saved to Supabase</span>}
      </div>
    </div>
  );
}
