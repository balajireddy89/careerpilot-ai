import React, { useEffect, useState, useMemo } from 'react';
import { Briefcase, MapPin, DollarSign, Search, CheckCircle, ArrowUpRight, RefreshCw } from 'lucide-react';
import { MOCK_INTERNSHIPS } from '../mock/mockData';
import { rankInternshipsWithAI } from '../lib/aiService';
import { getProfileKey, useFeatureSession } from '../hooks/useFeatureSession';

const INTERNSHIP_SESSION_DEFAULT = {
  searchTerm: '',
  filterLocation: 'All',
  appliedJobs: [],
  aiRankings: null,
};

export default function InternshipEngine({ profile, setProfile }) {
  const profileKey = getProfileKey(profile);
  const [session, setSession] = useFeatureSession('internships', profileKey, INTERNSHIP_SESSION_DEFAULT);
  const [ranking, setRanking] = useState(false);

  const { searchTerm, filterLocation, appliedJobs, aiRankings } = session;

  useEffect(() => {
    if (aiRankings) return;
    setRanking(true);
    rankInternshipsWithAI({ profile, internships: MOCK_INTERNSHIPS })
      .then((rankings) => setSession((prev) => ({ ...prev, aiRankings: rankings })))
      .catch((err) => console.warn('Internship AI ranking failed:', err))
      .finally(() => setRanking(false));
  }, [profile.email]);

  const jobsWithMatch = useMemo(() => {
    const rankMap = Object.fromEntries((aiRankings || []).map((r) => [r.id, r]));
    return MOCK_INTERNSHIPS.map((job) => ({
      ...job,
      match: rankMap[job.id]?.match ?? job.match,
      aiReason: rankMap[job.id]?.reason || '',
    }));
  }, [aiRankings]);

  const handleApplyJob = (jobId) => {
    if (appliedJobs.includes(jobId)) return;
    setSession((prev) => ({ ...prev, appliedJobs: [...prev.appliedJobs, jobId] }));
    setProfile({ ...profile, points: profile.points + 80 });
  };

  const filteredJobs = jobsWithMatch.filter((job) => {
    const matchesSearch = job.role.toLowerCase().includes(searchTerm.toLowerCase())
      || job.company.toLowerCase().includes(searchTerm.toLowerCase())
      || job.required.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLocation = filterLocation === 'All'
      || (filterLocation === 'Remote' && job.location.toLowerCase().includes('remote'))
      || (filterLocation === 'On-site' && !job.location.toLowerCase().includes('remote'));
    return matchesSearch && matchesLocation;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">AI Internship Recommendations</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          OpenRouter ranks internships against your skills and target role.
          {ranking && <span className="ml-2 text-brand-500 inline-flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Ranking...</span>}
        </p>
      </div>

      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by role, company, or skill..."
            value={searchTerm}
            onChange={(e) => setSession((prev) => ({ ...prev, searchTerm: e.target.value }))}
            className="glass-input pl-10 w-full text-xs py-2"
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Remote', 'On-site'].map((loc) => (
            <button
              key={loc}
              onClick={() => setSession((prev) => ({ ...prev, filterLocation: loc }))}
              className={`px-4 py-2 rounded-xl text-xs font-bold ${
                filterLocation === loc ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredJobs.map((job) => {
          const isApplied = appliedJobs.includes(job.id);
          return (
            <div key={job.id} className="glass-card p-6 space-y-4 hover:border-brand-500/30 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-md font-bold text-slate-800 dark:text-white">{job.role}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{job.company}</p>
                </div>
                <span className="px-2.5 py-1 bg-brand-500/10 text-brand-500 rounded-full text-xs font-extrabold">{job.match}% Match</span>
              </div>
              {job.aiReason && <p className="text-[11px] text-slate-500 italic">{job.aiReason}</p>}
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> {job.stipend}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {job.required.map((skill, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    profile.skills.includes(skill) ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                  }`}>{skill}</span>
                ))}
              </div>
              <button
                onClick={() => handleApplyJob(job.id)}
                disabled={isApplied}
                className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
                  isApplied ? 'bg-emerald-500/10 text-emerald-500' : 'bg-brand-600 text-white hover:bg-brand-500'
                }`}
              >
                {isApplied ? <><CheckCircle className="w-4 h-4" /> Applied</> : <>Apply Now <ArrowUpRight className="w-4 h-4" /></>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
