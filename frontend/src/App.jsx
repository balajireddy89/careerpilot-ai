import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, Award, FileText, TrendingUp,
  MessageSquare, BookOpen, Code2, Brain, Target, Users, Sun, Moon, Menu, X, Zap, UserCircle,
  Compass, Briefcase
} from 'lucide-react';
import { INITIAL_PROFILE } from './mock/mockData';
import { useAuth } from './context/AuthContext';
import { fetchProfile, saveProfile as saveProfileToSupabase } from './lib/profileService';
import RocketLoader from './components/RocketLoader';

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

export default function App() {
  const { session, user, loading: authLoading } = useAuth();
  const userId = session?.user?.id;
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const loadedUserIdRef = useRef(null);
  const saveTimerRef = useRef(null);
  const pendingProfileRef = useRef(null);
  const [activePage, setActivePage] = useState(() => {
    try {
      return sessionStorage.getItem('careerpilot_active_page') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [theme, setTheme] = useState('dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredNavId, setHoveredNavId] = useState(null);

  const [loadingAnimation, setLoadingAnimation] = useState(true);
  const [animationPhase, setAnimationPhase] = useState('playing'); // 'playing', 'morphing', 'fade-out'

  const handleVideoEnd = useCallback(() => {
    setAnimationPhase('morphing');
    setTimeout(() => {
      setAnimationPhase('fade-out');
      setTimeout(() => {
        setLoadingAnimation(false);
      }, 500);
    }, 1000);
  }, []);

  // auto fallback if video fails to play/load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (animationPhase === 'playing') {
        handleVideoEnd();
      }
    }, 4500);
    return () => clearTimeout(timer);
  }, [animationPhase, handleVideoEnd]);

  const navigateTo = useCallback((pageId) => {
    setActivePage(pageId);
    try { sessionStorage.setItem('careerpilot_active_page', pageId); } catch { /* ignore */ }
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      loadedUserIdRef.current = null;
      return;
    }

    if (loadedUserIdRef.current === userId && profile) {
      return;
    }

    let cancelled = false;
    const isFirstLoad = loadedUserIdRef.current !== userId;
    if (isFirstLoad) setProfileLoading(true);
    setProfileError('');

    fetchProfile(userId, session.user.email ?? '')
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
          loadedUserIdRef.current = userId;
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setProfileError(err.message || 'Failed to load profile.');
          setProfile({ ...INITIAL_PROFILE, email: session.user.email ?? '' });
          loadedUserIdRef.current = userId;
        }
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    return () => { cancelled = true; };
  }, [userId, session?.user?.email]);

  const updateProfile = useCallback(async (newProfile, options = {}) => {
    const { immediate = false } = options;
    setProfile(newProfile);
    if (!userId) return newProfile;

    pendingProfileRef.current = newProfile;

    if (immediate) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      try {
        const saved = await saveProfileToSupabase(userId, newProfile);
        setProfile(saved);
        return saved;
      } catch (err) {
        console.error('Profile save failed:', err);
        throw err;
      }
    }

    return new Promise((resolve) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          const saved = await saveProfileToSupabase(userId, pendingProfileRef.current);
          setProfile(saved);
          resolve(saved);
        } catch (err) {
          console.error('Profile save failed:', err);
          resolve(pendingProfileRef.current);
        }
      }, 450);
    });
  }, [userId]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  if (authLoading) return <RocketLoader label="Checking session..." />;
  if (!session) return <AuthPage />;

  // If the profile is loaded and the user is not onboarded, redirect to onboarding wizard
  if (profile && !profile.onboarded) {
    return <OnboardingWizard profile={profile} setProfile={updateProfile} />;
  }

  const displayRole = profile?.primaryPriority || profile?.targetRole || profile?.preferredPaths?.[0] || 'Your career path';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'skill-assessment', label: 'Skill Assessment', icon: Award },
    { id: 'career-guidance', label: 'Career Guidance', icon: Compass },
    { id: 'resume', label: 'Resume Analyzer', icon: FileText },
    { id: 'internship', label: 'Internship Engine', icon: Briefcase },
    { id: 'predictor', label: 'Placement Predictor', icon: TrendingUp },
    { id: 'hr-interview', label: 'HR Interview', icon: MessageSquare },
    { id: 'tech-interview', label: 'Technical Interview', icon: BookOpen },
    { id: 'coding', label: 'Coding Platform', icon: Code2 },
    { id: 'aptitude', label: 'Aptitude Prep', icon: Brain },
    { id: 'roadmap', label: 'Learning Roadmap', icon: Target },
    { id: 'chatbot', label: 'Career Chatbot', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: UserCircle },
    ...(profile?.isAdmin ? [{ id: 'admin', label: 'Admin Panel', icon: Users }] : []),
  ];

  const renderActivePage = () => {
    if (!profile) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    const props = { profile, setProfile: updateProfile, onNavigate: navigateTo };
    switch (activePage) {
      case 'dashboard': return <Dashboard {...props} />;
      case 'skill-assessment': return <SkillAssessment {...props} />;
      case 'career-guidance': return <CareerGuidance {...props} />;
      case 'resume': return <ResumeAnalyzer {...props} />;
      case 'internship': return <InternshipEngine {...props} />;
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
    <>
      {loadingAnimation && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md transition-opacity duration-500 ${
          animationPhase === 'fade-out' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}>
          <div className={`fixed transition-all duration-1000 ease-in-out z-[110] flex items-center justify-center ${
            animationPhase === 'playing'
              ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80'
              : 'top-5 left-5 w-8 h-8 translate-x-0 translate-y-0'
          }`}>
            <video
              src="/animated_video.mp4"
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnd}
              className={`absolute inset-0 w-full h-full object-cover rounded-xl transition-opacity duration-500 ${
                animationPhase === 'playing' ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <img
              src="/logo.png"
              alt="CareerPilot AI Logo"
              className={`absolute inset-0 w-full h-full object-contain rounded-xl transition-opacity duration-1000 ${
                animationPhase !== 'playing' ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
        </div>
      )}

      <div className="min-h-screen flex text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">

        <aside className={`fixed inset-y-0 left-0 z-50 w-64 glass-panel border-r border-slate-200 dark:border-slate-800/80 p-5 transform transition-transform duration-300 lg:translate-x-0 flex flex-col justify-between ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="space-y-6 flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="CareerPilot AI Logo"
                  className="w-8 h-8 rounded-xl object-contain shadow-md shadow-brand-500/20"
                />
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
              const isHighlighted = isActive || hoveredNavId === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  onMouseEnter={() => setHoveredNavId(item.id)}
                  onMouseLeave={() => setHoveredNavId(null)}
                  onFocus={() => setHoveredNavId(item.id)}
                  onBlur={() => setHoveredNavId(null)}
                  className={`nav-tab-item w-full flex items-center gap-3 px-3.5 rounded-xl text-xs font-bold origin-left ${
                    isHighlighted ? 'py-3 scale-[1.04]' : 'py-2.5 scale-100'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600 to-indigo-500 text-white shadow-md shadow-brand-500/20'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-900/40'
                  }`}
                >
                  <Icon className={`shrink-0 transition-all duration-200 ${isHighlighted ? 'w-5 h-5' : 'w-4.5 h-4.5'} ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className={`transition-all duration-200 ${isHighlighted ? 'text-[13px]' : 'text-xs'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          onClick={() => navigateTo('profile')}
          className="border-t border-slate-200 dark:border-slate-800/60 pt-4 mt-4 flex items-center gap-3 w-full text-left hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-600 to-indigo-500 flex items-center justify-center font-bold text-white text-sm">
            {profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'CP'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{profile?.name || 'Loading profile...'}</p>
            <p className="text-[10px] text-slate-400 truncate">{displayRole}</p>
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
              <span>{profile?.points ?? 0} XP</span>
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
    </>
  );
}
