import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Award, Target, FileText, Briefcase, TrendingUp,
  MessageSquare, BookOpen, Code2, Brain, Compass, Users, Sun, Moon, Menu, X, Zap, UserCircle
} from 'lucide-react';
import { INITIAL_PROFILE } from './mock/mockData';
import { useAuth } from './context/AuthContext';
import { fetchProfile, saveProfile as saveProfileToSupabase } from './lib/profileService';

import Dashboard from './pages/Dashboard';
import SkillAssessment from './pages/SkillAssessment';
import CareerGuidance from './pages/CareerGuidance';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import InternshipEngine from './pages/InternshipEngine';
import PlacementPredictor from './pages/PlacementPredictor';
import HRInterview from './pages/HRInterview';
import TechnicalInterview from './pages/TechnicalInterview';
import CodingPlatform from './pages/CodingPlatform';
import AptitudePrep from './pages/AptitudePrep';
import LearningRoadmap from './pages/LearningRoadmap';
import CareerChatbot from './pages/CareerChatbot';
import AdminPanel from './pages/AdminPanel';
import OnboardingWizard from './pages/OnboardingWizard';
import AuthPage from './pages/AuthPage';
import ProfileSettings from './pages/ProfileSettings';

function LoadingScreen({ label = 'Loading...' }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <p className="text-sm font-semibold text-slate-500 animate-pulse">{label}</p>
    </div>
  );
}

export default function App() {
  const { session, user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [activePage, setActivePage] = useState(() => {
    try {
      return sessionStorage.getItem('careerpilot_active_page') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [theme, setTheme] = useState('dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    setProfileLoading(true);
    setProfileError('');

    fetchProfile(session.user.id, session.user.email ?? '')
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setProfileError(err.message || 'Failed to load profile.');
          setProfile({ ...INITIAL_PROFILE, email: session.user.email ?? '' });
        }
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    return () => { cancelled = true; };
  }, [session]);

  const updateProfile = async (newProfile) => {
    setProfile(newProfile);
    if (!session?.user) return newProfile;

    try {
      const saved = await saveProfileToSupabase(session.user.id, newProfile);
      setProfile(saved);
      return saved;
    } catch (err) {
      console.error('Profile save failed:', err);
      throw err;
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  if (authLoading) return <LoadingScreen label="Checking session..." />;
  if (!session) return <AuthPage />;
  if (profileLoading || !profile) return <LoadingScreen label="Loading your profile..." />;

  if (!profile.onboarded) {
    return <OnboardingWizard profile={profile} setProfile={updateProfile} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assessment', label: 'Skill Assessment', icon: Award },
    { id: 'guidance', label: 'Career Guidance', icon: Compass },
    { id: 'resume', label: 'Resume Analyzer', icon: FileText },
    { id: 'internships', label: 'Internships', icon: Briefcase },
    { id: 'predictor', label: 'Placement Predictor', icon: TrendingUp },
    { id: 'hr-interview', label: 'HR Interview', icon: MessageSquare },
    { id: 'tech-interview', label: 'Technical Interview', icon: BookOpen },
    { id: 'coding', label: 'Coding Practice', icon: Code2 },
    { id: 'aptitude', label: 'Aptitude Prep', icon: Brain },
    { id: 'roadmap', label: 'Learning Roadmap', icon: Target },
    { id: 'chatbot', label: 'Career Chatbot', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: UserCircle },
    ...(profile.isAdmin ? [{ id: 'admin', label: 'Admin Panel', icon: Users }] : []),
  ];

  const renderActivePage = () => {
    const props = { profile, setProfile: updateProfile };
    switch (activePage) {
      case 'dashboard': return <Dashboard {...props} />;
      case 'assessment': return <SkillAssessment {...props} />;
      case 'guidance': return <CareerGuidance {...props} />;
      case 'resume': return <ResumeAnalyzer {...props} />;
      case 'internships': return <InternshipEngine {...props} />;
      case 'predictor': return <PlacementPredictor {...props} />;
      case 'hr-interview': return <HRInterview {...props} />;
      case 'tech-interview': return <TechnicalInterview {...props} />;
      case 'coding': return <CodingPlatform {...props} />;
      case 'aptitude': return <AptitudePrep {...props} />;
      case 'roadmap': return <LearningRoadmap {...props} />;
      case 'chatbot': return <CareerChatbot {...props} />;
      case 'profile': return <ProfileSettings {...props} />;
      case 'admin': return <AdminPanel {...props} />;
      default: return <Dashboard {...props} />;
    }
  };

  return (
    <div className="min-h-screen flex text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 glass-panel border-r border-slate-200 dark:border-slate-800/80 p-5 transform transition-transform duration-300 lg:translate-x-0 flex flex-col justify-between ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="space-y-6 flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-brand-500/20">
                🚀
              </div>
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 font-sans">
                CareerPilot AI
              </span>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <nav className="space-y-1.5 flex-1 overflow-y-auto pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    try { sessionStorage.setItem('careerpilot_active_page', item.id); } catch { /* ignore */ }
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600 to-indigo-500 text-white shadow-sm shadow-brand-500/10'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-900/40'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          onClick={() => setActivePage('profile')}
          className="border-t border-slate-200 dark:border-slate-800/60 pt-4 mt-4 flex items-center gap-3 w-full text-left hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-600 to-indigo-500 flex items-center justify-center font-bold text-white text-sm">
            {profile.name ? profile.name.substring(0, 2).toUpperCase() : 'BR'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{profile.name || 'Student Name'}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email || profile.email}</p>
          </div>
        </button>
      </aside>

      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <Menu className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {profileError && (
              <span className="text-[10px] text-amber-500 font-semibold hidden md:inline">{profileError}</span>
            )}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{profile.points} XP</span>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl transition-all"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-brand-600" />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto pb-16">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}
