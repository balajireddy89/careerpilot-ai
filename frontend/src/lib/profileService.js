import { supabase } from './supabase';
import { INITIAL_PROFILE, calculateProfileCompletion } from '../mock/mockData';

function rowToProfile(row) {
  if (!row) return { ...INITIAL_PROFILE };

  return {
    ...INITIAL_PROFILE,
    onboarded: row.onboarded ?? false,
    name: row.name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    college: row.college ?? '',
    degree: row.degree ?? '',
    branch: row.branch ?? '',
    currentYear: row.current_year ?? '3rd',
    graduationYear: row.graduation_year ?? 2027,
    cgpa: row.cgpa ?? '',
    targetRole: row.target_role ?? '',
    primaryPriority: row.primary_priority ?? row.target_role ?? '',
    learningRoadmap: row.learning_roadmap ?? [],
    quizRewards: row.quiz_rewards ?? {},
    codingRewards: row.coding_rewards ?? {},
    aims: row.aims ?? [],
    preferredPaths: row.preferred_paths ?? [],
    skills: row.skills ?? [],
    skillsProficiency: row.skills_proficiency ?? {},
    resumeDetails: { ...INITIAL_PROFILE.resumeDetails, ...(row.resume_details ?? {}) },
    projects: row.projects ?? [],
    certifications: row.certifications ?? [],
    codingRating: { ...INITIAL_PROFILE.codingRating, ...(row.coding_rating ?? {}) },
    codingStats: { ...INITIAL_PROFILE.codingStats, ...(row.coding_stats ?? {}) },
    aptitudeStats: { ...INITIAL_PROFILE.aptitudeStats, ...(row.aptitude_stats ?? {}) },
    hrRating: { ...INITIAL_PROFILE.hrRating, ...(row.hr_rating ?? {}) },
    interviewStats: { ...INITIAL_PROFILE.interviewStats, ...(row.interview_stats ?? {}) },
    preferredCompanies: row.preferred_companies ?? [],
    workType: row.work_type ?? 'Hybrid',
    interests: row.interests ?? [],
    weeklyHours: row.weekly_hours ?? '10-20',
    personalityResults: { ...INITIAL_PROFILE.personalityResults, ...(row.personality_results ?? {}) },
    points: row.points ?? 100,
    dailyStreak: row.daily_streak ?? 1,
    badges: row.badges ?? [],
    profileCompletion: row.profile_completion ?? 0,
    isAdmin: row.is_admin ?? false,
  };
}

function prepareProfile(row) {
  let profile = rowToProfile(row);

  if (profile.resumeDetails?.fileName === 'Manual_Setup.pdf') {
    profile = {
      ...profile,
      resumeDetails: { ...INITIAL_PROFILE.resumeDetails },
    };
  }

  return {
    ...profile,
    profileCompletion: calculateProfileCompletion(profile),
  };
}

function profileToRow(profile, userId) {
  const targetRole =
    profile.targetRole ||
    profile.primaryPriority ||
    profile.preferredPaths?.[0] ||
    '';

  return {
    user_id: userId,
    onboarded: profile.onboarded ?? false,
    name: profile.name ?? '',
    email: profile.email ?? '',
    phone: profile.phone ?? '',
    college: profile.college ?? '',
    degree: profile.degree ?? '',
    branch: profile.branch ?? '',
    current_year: profile.currentYear ?? '3rd',
    graduation_year: Number(profile.graduationYear) || 2027,
    cgpa: profile.cgpa ?? '',
    target_role: targetRole,
    primary_priority: profile.primaryPriority || targetRole,
    learning_roadmap: profile.learningRoadmap ?? [],
    quiz_rewards: profile.quizRewards ?? {},
    coding_rewards: profile.codingRewards ?? {},
    aims: profile.aims ?? [],
    preferred_paths: profile.preferredPaths ?? [],
    skills: profile.skills ?? [],
    skills_proficiency: profile.skillsProficiency ?? {},
    resume_details: profile.resumeDetails ?? INITIAL_PROFILE.resumeDetails,
    projects: profile.projects ?? [],
    certifications: profile.certifications ?? [],
    coding_rating: profile.codingRating ?? INITIAL_PROFILE.codingRating,
    coding_stats: profile.codingStats ?? INITIAL_PROFILE.codingStats,
    aptitude_stats: profile.aptitudeStats ?? INITIAL_PROFILE.aptitudeStats,
    hr_rating: profile.hrRating ?? INITIAL_PROFILE.hrRating,
    interview_stats: profile.interviewStats ?? INITIAL_PROFILE.interviewStats,
    preferred_companies: profile.preferredCompanies ?? [],
    work_type: profile.workType ?? 'Hybrid',
    interests: profile.interests ?? [],
    weekly_hours: profile.weeklyHours ?? '10-20',
    personality_results: profile.personalityResults ?? INITIAL_PROFILE.personalityResults,
    points: profile.points ?? 100,
    daily_streak: profile.dailyStreak ?? 1,
    badges: profile.badges ?? [],
    profile_completion: profile.profileCompletion ?? 0,
  };
}

export async function fetchProfile(userId, userEmail = '') {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const { data: created, error: insertError } = await supabase
      .from('student_profiles')
      .insert({ user_id: userId, email: userEmail })
      .select('*')
      .single();

    if (insertError) throw insertError;
    return prepareProfile(created);
  }

  const profile = prepareProfile(data);
  const needsSync =
    profile.profileCompletion !== (data.profile_completion ?? 0) ||
    data.resume_details?.fileName === 'Manual_Setup.pdf';

  if (needsSync) {
    try {
      await saveProfile(userId, profile);
    } catch (syncError) {
      console.warn('Profile sync failed:', syncError);
    }
  }

  return profile;
}

export async function saveProfile(userId, profile) {
  const completion = calculateProfileCompletion(profile);
  const row = profileToRow({ ...profile, profileCompletion: completion }, userId);

  const { data, error } = await supabase
    .from('student_profiles')
    .upsert(row, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) throw error;
  const saved = rowToProfile(data);
  return { ...saved, profileCompletion: calculateProfileCompletion(saved) };
}
