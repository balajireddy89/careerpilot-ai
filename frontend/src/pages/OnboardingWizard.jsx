import React, { useState } from 'react';
import { User, Briefcase, Award, UploadCloud, CheckCircle2, ChevronRight, ChevronLeft, Brain } from 'lucide-react';
import { recalculateReadiness, calculateProfileCompletion, INITIAL_PROFILE } from '../mock/mockData';
import { findRoadmapTemplate } from '../lib/questionBankService';
import { PREFERRED_COMPANY_OPTIONS } from '../lib/companyOptions';

export default function OnboardingWizard({ profile, setProfile }) {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [resumeLoaded, setResumeLoaded] = useState(false);

  // Form local state matching profile fields
  const [formData, setFormData] = useState({
    name: profile.name || "",
    email: profile.email || "",
    phone: profile.phone || "",
    college: profile.college || "",
    degree: profile.degree || "",
    branch: profile.branch || "",
    currentYear: profile.currentYear || "3rd",
    graduationYear: profile.graduationYear || 2027,
    cgpa: profile.cgpa || "",
    aims: profile.aims || [],
    primaryPriority: profile.primaryPriority || profile.targetRole || '',
    preferredPaths: profile.preferredPaths || [],
    skills: profile.skills || [],
    skillsProficiency: profile.skillsProficiency || {},
    codingRating: profile.codingRating || { dsa: 3, algorithms: 3, problemSolving: 3 },
    hrRating: profile.hrRating || { confidence: 6, publicSpeaking: 6, communication: 6, englishProficiency: 6 },
    preferredCompanies: profile.preferredCompanies || [],
    workType: profile.workType || "Hybrid",
    interests: profile.interests || [],
    weeklyHours: profile.weeklyHours || "10-20",
    personalityResults: profile.personalityResults || {
      enjoyCoding: true,
      enjoyData: false,
      preferDesign: false,
      likeMath: true,
      enjoyTeamwork: true
    }
  });

  // Aptitude state
  const [aptAnswers, setAptAnswers] = useState({ q1: "", q2: "", q3: "" });

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelect = (field, value) => {
    setFormData(prev => {
      const current = prev[field];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleSkillToggle = (skill) => {
    setFormData(prev => {
      const updatedSkills = prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill];
      
      const updatedProficiency = { ...prev.skillsProficiency };
      if (!prev.skills.includes(skill)) {
        updatedProficiency[skill] = "Intermediate"; // default
      } else {
        delete updatedProficiency[skill];
      }

      return {
        ...prev,
        skills: updatedSkills,
        skillsProficiency: updatedProficiency
      };
    });
  };

  const handleProficiencyChange = (skill, level) => {
    setFormData(prev => ({
      ...prev,
      skillsProficiency: {
        ...prev.skillsProficiency,
        [skill]: level
      }
    }));
  };

  // Simulated Resume Upload which auto-fills fields
  const handleResumeFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setResumeLoaded(true);
      // Auto-extract and fill form data
      setFormData(prev => ({
        ...prev,
        name: prev.name || "Balaji Reddy",
        email: prev.email || "balaji.reddy@college.edu",
        college: prev.college || "National Institute of Technology",
        degree: prev.degree || "Bachelor of Technology",
        branch: prev.branch || "Computer Science",
        skills: [...new Set([...prev.skills, "Java", "HTML", "CSS", "SQL", "Git"])],
        skillsProficiency: {
          ...prev.skillsProficiency,
          "Java": "Advanced",
          "HTML": "Advanced",
          "CSS": "Intermediate",
          "SQL": "Intermediate",
          "Git": "Intermediate"
        }
      }));
    }, 2000);
  };

  const handleNextStep = () => {
    if (step === 1 && !formData.name.trim()) {
      alert('Please enter your full name to continue.');
      return;
    }
    if (step === 2 && !formData.primaryPriority) {
      alert('Please select your main learning priority / career path.');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleCompleteOnboarding = async () => {
    let correctCount = 0;
    if (aptAnswers.q1 === "150 metres") correctCount++;
    if (aptAnswers.q2 === "22") correctCount++;
    if (aptAnswers.q3 === "Flexible") correctCount++;
    const finalAptPct = Math.round((correctCount / 3) * 100);

    let learningRoadmap = [];
    try {
      const template = await findRoadmapTemplate(formData.primaryPriority);
      if (template?.months?.length) learningRoadmap = template.months;
    } catch (err) {
      console.warn('Roadmap template load during onboarding failed:', err);
    }

    const completedProfile = {
      ...profile,
      onboarded: true,
      name: formData.name,
      email: formData.email || profile.email,
      primaryPriority: formData.primaryPriority,
      targetRole: formData.primaryPriority,
      preferredPaths: formData.primaryPriority ? [formData.primaryPriority, ...formData.preferredPaths.filter((p) => p !== formData.primaryPriority)] : formData.preferredPaths,
      learningRoadmap,
      phone: formData.phone,
      college: formData.college,
      degree: formData.degree,
      branch: formData.branch,
      currentYear: formData.currentYear,
      graduationYear: Number(formData.graduationYear),
      cgpa: formData.cgpa,
      aims: formData.aims,
      preferredPaths: formData.preferredPaths,
      skills: formData.skills,
      skillsProficiency: formData.skillsProficiency,
      codingRating: formData.codingRating,
      hrRating: formData.hrRating,
      preferredCompanies: formData.preferredCompanies,
      workType: formData.workType,
      interests: formData.interests,
      weeklyHours: formData.weeklyHours,
      personalityResults: formData.personalityResults,
      points: profile.points + 500,
      aptitudeStats: { ...INITIAL_PROFILE.aptitudeStats },
      codingStats: { ...INITIAL_PROFILE.codingStats },
      interviewStats: { ...INITIAL_PROFILE.interviewStats },
      resumeDetails: { ...INITIAL_PROFILE.resumeDetails },
    };

    completedProfile.profileCompletion = calculateProfileCompletion(completedProfile);
    await setProfile(completedProfile, { immediate: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 md:p-6 transition-colors duration-300">
      <div className="w-full max-w-4xl glass-card border border-brand-500/10 p-6 md:p-10 space-y-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -z-10"></div>

        {/* Top title & step progress indicator bar */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400">
              CareerPilot AI Onboarding
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure your career objectives, profile criteria, and skill milestones.
            </p>
          </div>
          <span className="text-xs font-extrabold bg-brand-100 dark:bg-brand-950/80 text-brand-600 dark:text-brand-300 px-3 py-1 rounded-full border border-brand-200/50">
            Step {step} of 6
          </span>
        </div>

        {/* Step 1: Basic Details */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-brand-500" /> Step 1: Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name <span className="text-rose-500">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleTextChange} placeholder="e.g. Balaji Reddy" className="glass-input text-xs py-2" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Email Address <span className="text-rose-500">*</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleTextChange} placeholder="e.g. balaji@college.edu" className="glass-input text-xs py-2" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleTextChange} placeholder="Optional" className="glass-input text-xs py-2" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">College Name</label>
                <input type="text" name="college" value={formData.college} onChange={handleTextChange} placeholder="Optional" className="glass-input text-xs py-2" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Degree Type</label>
                <input type="text" name="degree" value={formData.degree} onChange={handleTextChange} placeholder="Optional (e.g. B.Tech)" className="glass-input text-xs py-2" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Branch / Department</label>
                <input type="text" name="branch" value={formData.branch} onChange={handleTextChange} placeholder="Optional (e.g. Computer Science)" className="glass-input text-xs py-2" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Current Year</label>
                <select name="currentYear" value={formData.currentYear} onChange={handleTextChange} className="glass-input text-xs py-2">
                  <option value="1st">1st Year</option>
                  <option value="2nd">2nd Year</option>
                  <option value="3rd">3rd Year</option>
                  <option value="4th">4th Year</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Graduation Year</label>
                <input type="number" name="graduationYear" value={formData.graduationYear} onChange={handleTextChange} className="glass-input text-xs py-2" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">CGPA / Percentage</label>
                <input type="text" name="cgpa" value={formData.cgpa} onChange={handleTextChange} placeholder="Optional (e.g. 8.5)" className="glass-input text-xs py-2" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Career Goals */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-brand-500" /> Step 2: Career Goals
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-500 uppercase block mb-2">What are you aiming for?</label>
                <div className="flex flex-wrap gap-2.5">
                  {["Internship", "Placement", "Higher Studies", "Freelancing", "Startup"].map((aim) => {
                    const isSelected = formData.aims.includes(aim);
                    return (
                      <button
                        key={aim}
                        onClick={() => handleMultiSelect("aims", aim)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          isSelected 
                            ? 'bg-brand-600 text-white border-brand-600' 
                            : 'bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {aim}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-500 uppercase block mb-2">
                  Main Learning Priority <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    "Frontend Developer", "Backend Developer", "Full Stack Developer",
                    "AI/ML Engineer", "Data Scientist", "Cybersecurity Analyst",
                    "Cloud Engineer", "DevOps Engineer", "Mobile Developer", "UI/UX Designer",
                    "Computer Science (General)", "Database Administrator",
                  ].map((path) => {
                    const isSelected = formData.primaryPriority === path;
                    return (
                      <button
                        key={path}
                        type="button"
                        onClick={() => setFormData((prev) => ({
                          ...prev,
                          primaryPriority: path,
                          preferredPaths: prev.preferredPaths.includes(path) ? prev.preferredPaths : [path, ...prev.preferredPaths],
                        }))}
                        className={`text-left p-3 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {path}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Skills Assessment */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-500" /> Step 3: Skills Assessment
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[380px] overflow-y-auto pr-2">
              {[
                { cat: "Programming Languages", items: ["Java", "Python", "JavaScript", "C", "C++", "C#"] },
                { cat: "Web Development", items: ["HTML", "CSS", "React", "Angular", "Node.js"] },
                { cat: "Databases", items: ["MySQL", "PostgreSQL", "MongoDB"] },
                { cat: "Other Technologies", items: ["Git", "Docker", "AWS", "Spring Boot"] }
              ].map((group) => (
                <div key={group.cat} className="space-y-3 p-4 bg-slate-100/40 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800 rounded-2xl">
                  <h4 className="text-xs font-bold text-brand-500 uppercase tracking-wider">{group.cat}</h4>
                  
                  <div className="space-y-3.5">
                    {group.items.map((skill) => {
                      const hasSkill = formData.skills.includes(skill);
                      return (
                        <div key={skill} className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={hasSkill} 
                              onChange={() => handleSkillToggle(skill)}
                              className="accent-brand-500 rounded"
                            />
                            <span>{skill}</span>
                          </label>

                          {hasSkill && (
                            <div className="flex gap-4 pl-6 text-[10px]">
                              {["Beginner", "Intermediate", "Advanced"].map((lvl) => (
                                <label key={lvl} className="flex items-center gap-1 cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name={`proficiency-${skill}`}
                                    checked={formData.skillsProficiency[skill] === lvl}
                                    onChange={() => handleProficiencyChange(skill, lvl)}
                                    className="accent-brand-500"
                                  />
                                  <span className="text-slate-500 dark:text-slate-400 font-bold">{lvl}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Resume Upload */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-brand-500" /> Step 4: Resume Upload
            </h2>

            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 transition-all bg-white/10 dark:bg-slate-900/10 relative">
              <input 
                type="file" 
                accept=".pdf,.docx" 
                onChange={handleResumeFile} 
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <UploadCloud className="w-12 h-12 text-slate-400 mb-2 animate-pulse" />
              
              {uploading ? (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Extracting profile details using OpenRouter gpt-oss-120b...</p>
                  <div className="w-44 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mx-auto overflow-hidden">
                    <div className="bg-brand-500 h-full rounded-full animate-[shimmer_1.5s_infinite]" style={{ width: '50%' }}></div>
                  </div>
                </div>
              ) : resumeLoaded ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-emerald-500 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Resume Parsed Successfully!
                  </p>
                  <p className="text-xs text-slate-500">Skills catalog and basic student metrics auto-filled.</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Click to upload your resume (PDF/DOCX)</p>
                  <p className="text-xs text-slate-400 mt-1">Allows AI extraction of Skills, Projects, and Certifications.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Aptitude & HR Assessment */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in max-h-[440px] overflow-y-auto pr-2">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-brand-500" /> Step 5: Aptitude & HR Assessment
            </h2>

            {/* Coding Ratings */}
            <div className="space-y-3 p-4 bg-slate-100/40 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800 rounded-2xl">
              <h4 className="text-xs font-bold text-slate-500 uppercase">Coding Ability Self-Rating (1-5)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["dsa", "algorithms", "problemSolving"].map((metric) => (
                  <div key={metric} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="capitalize">{metric}</span>
                      <span className="text-brand-500 font-bold">{formData.codingRating[metric]}/5</span>
                    </div>
                    <input 
                      type="range" min="1" max="5" 
                      value={formData.codingRating[metric]} 
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        codingRating: { ...prev.codingRating, [metric]: Number(e.target.value) }
                      }))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg accent-brand-500 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Timed mini quiz */}
            <div className="space-y-4 p-4 bg-slate-100/40 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800 rounded-2xl">
              <h4 className="text-xs font-bold text-slate-500 uppercase">Mini Aptitude Challenge</h4>
              
              <div className="space-y-3 text-xs">
                <div className="space-y-1.5">
                  <p className="font-semibold">Q1. A train running at 60 km/h crosses a pole in 9s. Length?</p>
                  <select 
                    value={aptAnswers.q1} 
                    onChange={(e) => setAptAnswers(prev => ({ ...prev, q1: e.target.value }))}
                    className="glass-input py-1 text-xs"
                  >
                    <option value="">Choose Answer</option>
                    <option value="120 metres">120 metres</option>
                    <option value="150 metres">150 metres</option>
                    <option value="180 metres">180 metres</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <p className="font-semibold">Q2. Next in series: 36, 34, 30, 28, 24, ...?</p>
                  <select 
                    value={aptAnswers.q2} 
                    onChange={(e) => setAptAnswers(prev => ({ ...prev, q2: e.target.value }))}
                    className="glass-input py-1 text-xs"
                  >
                    <option value="">Choose Answer</option>
                    <option value="20">20</option>
                    <option value="22">22</option>
                    <option value="24">24</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <p className="font-semibold">Q3. Opposite meaning of: OBSTINATE?</p>
                  <select 
                    value={aptAnswers.q3} 
                    onChange={(e) => setAptAnswers(prev => ({ ...prev, q3: e.target.value }))}
                    className="glass-input py-1 text-xs"
                  >
                    <option value="">Choose Answer</option>
                    <option value="Stubborn">Stubborn</option>
                    <option value="Flexible">Flexible</option>
                    <option value="Rigid">Rigid</option>
                  </select>
                </div>
              </div>
            </div>

            {/* HR Readiness Ratings */}
            <div className="space-y-3 p-4 bg-slate-100/40 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800 rounded-2xl">
              <h4 className="text-xs font-bold text-slate-500 uppercase">HR Readiness Self-Rating (1-10)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["confidence", "publicSpeaking", "communication", "englishProficiency"].map((metric) => (
                  <div key={metric} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="capitalize">{metric.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-brand-500 font-bold">{formData.hrRating[metric]}/10</span>
                    </div>
                    <input 
                      type="range" min="1" max="10" 
                      value={formData.hrRating[metric]} 
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        hrRating: { ...prev.hrRating, [metric]: Number(e.target.value) }
                      }))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg accent-brand-500 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Company and Work Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 p-4 bg-slate-100/40 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Preferred Companies</h4>
                <div className="flex flex-wrap gap-2">
                  {PREFERRED_COMPANY_OPTIONS.slice(0, 20).map((comp) => {
                    const isSelected = formData.preferredCompanies.includes(comp);
                    return (
                      <button
                        key={comp}
                        onClick={() => handleMultiSelect("preferredCompanies", comp)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                          isSelected 
                            ? 'bg-brand-600 border-brand-600 text-white' 
                            : 'bg-white/40 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {comp}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 p-4 bg-slate-100/40 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Work Type & Study Hours</h4>
                <div className="grid grid-cols-1 gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <label className="font-bold text-slate-400">TYPE:</label>
                    {["On-site", "Remote", "Hybrid"].map(type => (
                      <label key={type} className="flex items-center gap-1 font-semibold cursor-pointer">
                        <input 
                          type="radio" 
                          name="workType" 
                          checked={formData.workType === type}
                          onChange={() => setFormData(prev => ({ ...prev, workType: type }))}
                          className="accent-brand-500"
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="font-bold text-slate-400">HOURS:</label>
                    {["5-10", "10-20", "20-30", "30+"].map(hrs => (
                      <label key={hrs} className="flex items-center gap-1 font-semibold cursor-pointer">
                        <input 
                          type="radio" 
                          name="weeklyHours" 
                          checked={formData.weeklyHours === hrs}
                          onChange={() => setFormData(prev => ({ ...prev, weeklyHours: hrs }))}
                          className="accent-brand-500"
                        />
                        <span>{hrs}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Personality Quiz */}
            <div className="space-y-3 p-4 bg-slate-100/40 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800 rounded-2xl">
              <h4 className="text-xs font-bold text-slate-500 uppercase">AI Career Personality Quiz</h4>
              <div className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {[
                  { key: "enjoyCoding", label: "Do you enjoy coding?" },
                  { key: "enjoyData", label: "Do you enjoy data analysis?" },
                  { key: "preferDesign", label: "Do you prefer design over logic?" },
                  { key: "likeMath", label: "Do you like mathematics?" },
                  { key: "enjoyTeamwork", label: "Do you enjoy teamwork?" }
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.personalityResults[item.key]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalityResults: { ...prev.personalityResults, [item.key]: e.target.checked }
                      }))}
                      className="accent-brand-500 rounded"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Step 6: AI-Generated Results Page */}
        {step === 6 && (
          <div className="space-y-8 animate-fade-in max-h-[440px] overflow-y-auto pr-2">
            <div className="text-center space-y-2">
              <span className="text-3xl">🤖</span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">AI Analysis & Metrics Scorecard</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Analysis completed based on onboarding inputs.</p>
            </div>

            {/* Readiness score cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { title: "Placement Readiness", val: 82, color: "text-brand-500" },
                { title: "Internship Readiness", val: 78, color: "text-blue-500" },
                { title: "Resume Score", val: 85, color: "text-purple-500" },
                { title: "HR Score", val: 72, color: "text-emerald-500" },
                { title: "Coding Score", val: 80, color: "text-cyan-500" }
              ].map((item, index) => (
                <div key={index} className="p-3 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{item.title}</div>
                  <div className={`text-2xl font-black mt-1 ${item.color}`}>{item.val}%</div>
                </div>
              ))}
            </div>

            {/* Recommendations & roadmap details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-4 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider">Skill Gap Report</h4>
                <p className="font-semibold">Target: {formData.primaryPriority || 'Not set'}</p>
                <div className="space-y-1 text-slate-500">
                  <div>Skills selected: {formData.skills.length}</div>
                  <div>Complete quizzes in Technical Interview to verify skills.</div>
                </div>
              </div>

              <div className="p-4 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Your Focus</h4>
                <p className="font-semibold text-slate-700 dark:text-slate-300">{formData.primaryPriority}</p>
                <p className="text-slate-500">A personalized 4-month roadmap will be generated when you unlock the dashboard.</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer controls: Back and Next buttons */}
        <div className="flex justify-between items-center pt-5 border-t border-slate-200 dark:border-slate-800">
          {step > 1 && step < 6 ? (
            <button
              onClick={handlePrevStep}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900/60 transition-all border border-slate-200 dark:border-slate-800"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div></div>
          )}

          {step < 6 ? (
            <button
              onClick={handleNextStep}
              className="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCompleteOnboarding}
              className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-brand-500/10"
            >
              Unlock Student Dashboard <ChevronRight className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
