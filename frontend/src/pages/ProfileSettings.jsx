import React, { useState } from 'react';
import { Save, User, Briefcase, GraduationCap, LogOut, Award, Sliders, Heart, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ALL_CS_SKILLS } from '../lib/csSkillsCatalog';
import { PREFERRED_COMPANY_OPTIONS } from '../lib/companyOptions';

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
    skillsProficiency: profile.skillsProficiency || {},
    preferredCompanies: profile.preferredCompanies || [],
    preferredPaths: profile.preferredPaths || [],
    aims: profile.aims || [],
    interests: profile.interests || [],
    codingRating: profile.codingRating || { dsa: 1, algorithms: 1, problemSolving: 1 },
    hrRating: profile.hrRating || { confidence: 1, publicSpeaking: 1, communication: 1, englishProficiency: 1 },
    personalityResults: profile.personalityResults || {
      enjoyCoding: true,
      enjoyData: false,
      preferDesign: false,
      likeMath: true,
      enjoyTeamwork: true,
    },
    onboardingAptitudeScore: profile.onboardingAptitudeScore ?? null,
  });

  const [newSkill, setNewSkill] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const filteredSuggestions = ALL_CS_SKILLS.filter(
    (s) =>
      s.toLowerCase().includes(newSkill.toLowerCase()) &&
      !form.skills.includes(s)
  ).slice(0, 5);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleRatingChange = (category, metric, value) => {
    setForm((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [metric]: Number(value),
      },
    }));
    setSaved(false);
  };

  const toggleListItem = (field, value) => {
    setForm((prev) => {
      const list = prev[field] || [];
      const updated = list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value];
      return { ...prev, [field]: updated };
    });
    setSaved(false);
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const sName = newSkill.trim();
    if (!sName || form.skills.includes(sName)) return;
    setForm((prev) => ({
      ...prev,
      skills: [...prev.skills, sName],
      skillsProficiency: {
        ...prev.skillsProficiency,
        [sName]: 'Intermediate',
      },
    }));
    setNewSkill('');
    setShowSuggestions(false);
    setSaved(false);
  };

  const handleRemoveSkill = (skill) => {
    setForm((prev) => {
      const updatedSkills = prev.skills.filter((s) => s !== skill);
      const updatedProficiency = { ...prev.skillsProficiency };
      delete updatedProficiency[skill];
      return {
        ...prev,
        skills: updatedSkills,
        skillsProficiency: updatedProficiency,
      };
    });
    setSaved(false);
  };

  const handleProficiencyChange = (skill, level) => {
    setForm((prev) => ({
      ...prev,
      skillsProficiency: {
        ...prev.skillsProficiency,
        [skill]: level,
      },
    }));
    setSaved(false);
  };

  const selectSuggestedSkill = (skillName) => {
    if (form.skills.includes(skillName)) return;
    setForm((prev) => ({
      ...prev,
      skills: [...prev.skills, skillName],
      skillsProficiency: {
        ...prev.skillsProficiency,
        [skillName]: 'Intermediate',
      },
    }));
    setNewSkill('');
    setShowSuggestions(false);
    setSaved(false);
  };

  const handlePersonalityToggle = (key) => {
    setForm((prev) => ({
      ...prev,
      personalityResults: {
        ...prev.personalityResults,
        [key]: !prev.personalityResults[key],
      },
    }));
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
    <div className="space-y-8 animate-fade-in pb-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-8 h-8 text-brand-500" /> Profile
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
            Update your details anytime. Changes sync with your dashboard and AI advisor.
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
        
        {/* COLUMN 1: Basic details and Self-ratings */}
        <div className="space-y-6">
          <section className="glass-card p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-brand-500" /> Basic Details
            </h2>
            {['name', 'email', 'phone', 'college', 'degree', 'branch', 'cgpa'].map((field) => (
              <div key={field}>
                <label className="text-xs font-bold uppercase text-slate-400 mb-1.5 block">
                  {field === 'cgpa' ? 'CGPA / Percentage' : field.replace(/([A-Z])/g, ' $1')}
                </label>
                <input
                  name={field}
                  value={form[field]}
                  onChange={handleChange}
                  disabled={field === 'email'}
                  className="glass-input w-full text-sm disabled:opacity-60"
                  placeholder={`Your ${field}`}
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-1.5 block">Current Year</label>
                <select name="currentYear" value={form.currentYear} onChange={handleChange} className="glass-input w-full text-sm">
                  {['1st', '2nd', '3rd', '4th', 'Graduated'].map((y) => (
                    <option key={y} value={y}>{y} Year</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-1.5 block">Graduation Year</label>
                <input
                  type="number"
                  name="graduationYear"
                  value={form.graduationYear}
                  onChange={handleChange}
                  className="glass-input w-full text-sm"
                />
              </div>
            </div>
          </section>

          <section className="glass-card p-6 space-y-5">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-500" /> Self-Assessment Ratings
            </h2>
            
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-brand-500 uppercase tracking-wider">Coding Ability Self-Rating (1-5)</h4>
              {[
                { key: 'dsa', label: 'Data Structures & Algorithms' },
                { key: 'algorithms', label: 'Algorithms & Complexity' },
                { key: 'problemSolving', label: 'General Problem Solving' }
              ].map((metric) => (
                <div key={metric.key} className="space-y-1">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{metric.label}</span>
                    <span className="text-brand-500 font-extrabold text-sm">{form.codingRating[metric.key]}/5</span>
                  </div>
                  <input
                    type="range" min="1" max="5"
                    value={form.codingRating[metric.key]}
                    onChange={(e) => handleRatingChange('codingRating', metric.key, e.target.value)}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg accent-brand-500 cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-4" />

            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-brand-500 uppercase tracking-wider">HR Readiness Self-Rating (1-10)</h4>
              {[
                { key: 'confidence', label: 'Confidence level' },
                { key: 'publicSpeaking', label: 'Public speaking ability' },
                { key: 'communication', label: 'General communication' },
                { key: 'englishProficiency', label: 'English fluency' }
              ].map((metric) => (
                <div key={metric.key} className="space-y-1">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{metric.label}</span>
                    <span className="text-brand-500 font-extrabold text-sm">{form.hrRating[metric.key]}/10</span>
                  </div>
                  <input
                    type="range" min="1" max="10"
                    value={form.hrRating[metric.key]}
                    onChange={(e) => handleRatingChange('hrRating', metric.key, e.target.value)}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg accent-brand-500 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* COLUMN 2: Preferences, Interests, Skills catalog */}
        <div className="space-y-6">
          <section className="glass-card p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-500" /> Career Preferences
            </h2>

            {/* Aims Multi-select */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">What are you aiming for?</label>
              <div className="flex flex-wrap gap-1.5">
                {["Internship", "Placement", "Higher Studies", "Freelancing", "Startup"].map((aim) => {
                  const isSelected = form.aims.includes(aim);
                  return (
                    <button
                      key={aim}
                      type="button"
                      onClick={() => toggleListItem('aims', aim)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        isSelected 
                          ? 'bg-brand-600 border-brand-600 text-white' 
                          : 'bg-white/40 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      {aim}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-400 mb-1.5 block">Primary Career Goal / Focus</label>
              <select name="primaryPriority" value={form.primaryPriority} onChange={handleChange} className="glass-input w-full text-sm">
                <option value="">Select your main focus</option>
                {PATH_OPTIONS.map((path) => (
                  <option key={path} value={path}>{path}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-1.5 block">Work Type</label>
                <select name="workType" value={form.workType} onChange={handleChange} className="glass-input w-full text-sm">
                  {['On-site', 'Remote', 'Hybrid'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-1.5 block">Weekly Hours</label>
                <select name="weeklyHours" value={form.weeklyHours} onChange={handleChange} className="glass-input w-full text-sm">
                  {['5-10', '10-20', '20-30', '30+'].map((h) => (
                    <option key={h} value={h}>{h} hours</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Other Career Paths Multi-select */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Additional Career Paths of Interest</label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {PATH_OPTIONS.map((path) => {
                  const isSelected = form.preferredPaths.includes(path);
                  return (
                    <button
                      key={path}
                      type="button"
                      onClick={() => toggleListItem('preferredPaths', path)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all ${
                        isSelected 
                          ? 'bg-brand-600 border-brand-600 text-white' 
                          : 'bg-white/40 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      {path}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Companies Multi-select */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Preferred Target Companies</label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {COMPANY_OPTIONS.map((company) => (
                  <button
                    key={company}
                    type="button"
                    onClick={() => toggleListItem('preferredCompanies', company)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all ${
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

          {/* Interests Section */}
          <section className="glass-card p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Heart className="w-4 h-4 text-brand-500" /> Areas of Interest
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {["Web Development", "Backend Development", "Frontend Development", "Mobile Apps", "Database Systems", "AI/ML", "Data Science", "DevOps & Cloud", "Cybersecurity", "UI/UX Design", "Game Development"].map((interest) => {
                const isSelected = form.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleListItem('interests', interest)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      isSelected 
                        ? 'bg-brand-600 border-brand-600 text-white' 
                        : 'bg-white/40 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Skills Assessment Section with custom skill adding & proficiency selects */}
          <section className="glass-card p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-500" /> Skills Catalog
            </h2>

            {/* Custom skill add input form */}
            <form onSubmit={handleAddSkill} className="relative">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a skill and press Add..."
                  value={newSkill}
                  onChange={(e) => {
                    setNewSkill(e.target.value);
                    setShowSuggestions(true);
                  }}
                  className="glass-input flex-1 py-2 text-sm"
                  autoComplete="off"
                />
                <button 
                  type="submit" 
                  disabled={!newSkill.trim()}
                  className="bg-brand-600 disabled:opacity-50 text-white px-4 rounded-xl font-bold flex items-center gap-1 text-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              
              {showSuggestions && newSkill.trim() && filteredSuggestions.length > 0 && (
                <ul className="absolute z-10 left-0 right-14 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden">
                  {filteredSuggestions.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => selectSuggestedSkill(s)}
                        className="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-brand-500/10 text-slate-700 dark:text-slate-300"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </form>

            {/* List of current skills with proficiency dropdowns and deletes */}
            <div className="space-y-2.5 pt-2 max-h-64 overflow-y-auto pr-1">
              {form.skills.length === 0 ? (
                <p className="text-xs text-slate-500">No skills added yet. Use the search bar above to catalog your skills.</p>
              ) : (
                form.skills.map((skill) => {
                  const currentLevel = form.skillsProficiency[skill] || 'Intermediate';
                  return (
                    <div 
                      key={skill} 
                      className="flex items-center justify-between gap-3 p-2.5 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 rounded-xl"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-800 dark:text-white truncate">{skill}</div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <select 
                          value={currentLevel}
                          onChange={(e) => handleProficiencyChange(skill, e.target.value)}
                          className="glass-input text-xs font-bold py-1 px-2 cursor-pointer"
                        >
                          {["Beginner", "Intermediate", "Advanced", "Expert"].map(lvl => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title={`Remove ${skill}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="glass-card p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-500" /> Career Personality
            </h2>
            <div className="space-y-2">
              {[
                { key: 'enjoyCoding', label: 'Enjoy coding' },
                { key: 'enjoyData', label: 'Enjoy data analysis' },
                { key: 'preferDesign', label: 'Prefer design over logic' },
                { key: 'likeMath', label: 'Like mathematics' },
                { key: 'enjoyTeamwork', label: 'Enjoy teamwork' },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.personalityResults[item.key])}
                    onChange={() => handlePersonalityToggle(item.key)}
                    className="accent-brand-500 rounded"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
            {form.onboardingAptitudeScore != null && (
              <p className="text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                Onboarding aptitude baseline: <strong className="text-brand-500">{form.onboardingAptitudeScore}%</strong>
              </p>
            )}
          </section>
        </div>

      </div>

      {/* Save action floating panel / footer */}
      <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 shadow-md shadow-brand-500/10"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving updates...' : 'Save Profile Changes'}
        </button>
        {saved && <span className="text-xs text-emerald-500 font-bold flex items-center gap-1 animate-fade-in">✓ Profile synced</span>}
      </div>
    </div>
  );
}
