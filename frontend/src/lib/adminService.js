import { supabase } from './supabase';
import { calculateProfileCompletion, hasUploadedResume, INITIAL_PROFILE } from '../mock/mockData';
import { recalculateReadiness } from './placementReadiness';

function mapRowToProfile(row) {
  return {
    ...INITIAL_PROFILE,
    name: row.name ?? '',
    email: row.email ?? '',
    college: row.college ?? '',
    branch: row.branch ?? '',
    cgpa: row.cgpa ?? '',
    targetRole: row.target_role ?? 'Full Stack Developer',
    skills: row.skills ?? [],
    onboarded: row.onboarded ?? false,
    isAdmin: row.is_admin ?? false,
    points: row.points ?? 0,
    dailyStreak: row.daily_streak ?? 1,
    profileCompletion: row.profile_completion ?? 0,
    resumeDetails: { ...INITIAL_PROFILE.resumeDetails, ...(row.resume_details ?? {}) },
    codingStats: { ...INITIAL_PROFILE.codingStats, ...(row.coding_stats ?? {}) },
    aptitudeStats: { ...INITIAL_PROFILE.aptitudeStats, ...(row.aptitude_stats ?? {}) },
    interviewStats: { ...INITIAL_PROFILE.interviewStats, ...(row.interview_stats ?? {}) },
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

export function mapRowToAdminStudent(row) {
  const profile = mapRowToProfile(row);
  return {
    id: row.id,
    userId: row.user_id,
    isAdmin: profile.isAdmin,
    name: profile.name || 'Unnamed',
    email: profile.email,
    college: profile.college,
    targetRole: profile.targetRole,
    onboarded: profile.onboarded,
    readiness: recalculateReadiness(profile),
    codingScore: profile.codingStats?.score ?? 0,
    resumeScore: hasUploadedResume(profile) ? (profile.resumeDetails?.score ?? 0) : 0,
    profileCompletion: calculateProfileCompletion(profile),
    points: profile.points,
    dailyStreak: profile.dailyStreak,
    hrScore: profile.interviewStats?.hrScore ?? 0,
    techScore: profile.interviewStats?.techScore ?? 0,
    updatedAt: profile.updatedAt,
  };
}

export async function fetchAllStudents() {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapRowToAdminStudent);
}

export function computeAdminStats(students) {
  const total = students.length;
  const onboarded = students.filter((s) => s.onboarded).length;
  const avgReadiness = total
    ? Math.round(students.reduce((sum, s) => sum + s.readiness, 0) / total)
    : 0;
  const avgCompletion = total
    ? Math.round(students.reduce((sum, s) => sum + s.profileCompletion, 0) / total)
    : 0;

  return { total, onboarded, avgReadiness, avgCompletion };
}

export async function setStudentAdminStatus(userId, isAdmin) {
  const { data, error } = await supabase
    .from('student_profiles')
    .update({ is_admin: isAdmin })
    .eq('user_id', userId)
    .select('user_id, email, is_admin')
    .single();

  if (error) throw error;
  return data;
}

export async function updateStudentStreakAndPoints(userId, points, dailyStreak) {
  const { data, error } = await supabase
    .from('student_profiles')
    .update({ points, daily_streak: dailyStreak })
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return mapRowToAdminStudent(data);
}

export async function resetAllStudentsPointsAndStreak() {
  const { data, error } = await supabase
    .from('student_profiles')
    .update({ points: 100, daily_streak: 1 })
    .neq('user_id', '00000000-0000-0000-0000-000000000000');

  if (error) throw error;
  return data;
}

export function exportStudentsCsv(students, type = 'placement') {
  const headers =
    type === 'interview'
      ? ['Name', 'Email', 'HR Score', 'Tech Score', 'Readiness %']
      : ['Name', 'Email', 'College', 'Target Role', 'Coding XP', 'Resume Score', 'Readiness %', 'Profile %'];

  const rows = students.map((s) => {
    if (type === 'interview') {
      return [s.name, s.email, s.hrScore, s.techScore, s.readiness];
    }
    return [s.name, s.email, s.college, s.targetRole, s.codingScore, s.resumeScore, s.readiness, s.profileCompletion];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `careerpilot_${type}_report_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
