const PLACEHOLDER_RESUME_NAMES = new Set(['', 'Manual_Setup.pdf', 'Resume_Extracted.pdf']);

function hasUploadedResume(profile) {
  const fileName = profile?.resumeDetails?.fileName?.trim() ?? '';
  return fileName.length > 0 && !PLACEHOLDER_RESUME_NAMES.has(fileName);
}

/** Count verified activities from Supabase-backed profile fields */
function countTechQuizzes(profile) {
  return Object.keys(profile.quizRewards ?? {}).filter((k) => k.startsWith('tech:') && profile.quizRewards[k]?.xpAwarded).length;
}

function countAptitudeTests(profile) {
  return profile.aptitudeStats?.testsTaken ?? 0;
}

function countCodingSolves(profile) {
  const solved = (profile.codingStats?.solvedEasy ?? 0)
    + (profile.codingStats?.solvedMedium ?? 0)
    + (profile.codingStats?.solvedHard ?? 0);
  if (solved > 0) return solved;
  return Object.keys(profile.codingRewards ?? {}).filter((k) => profile.codingRewards[k]?.xpAwarded).length;
}

/**
 * Placement readiness derived only from real completed activities stored in Supabase.
 * New students with no quizzes/resume/tests start at 0%.
 */
export function buildPlacementBreakdown(profile) {
  const hasResume = hasUploadedResume(profile);
  const resumeScore = hasResume ? Math.min(100, profile.resumeDetails?.score ?? 0) : 0;

  const codingSolved = countCodingSolves(profile);
  const codingTotal = (profile.codingStats?.totalEasy ?? 30)
    + (profile.codingStats?.totalMedium ?? 40)
    + (profile.codingStats?.totalHard ?? 20);
  const codingScore = codingSolved > 0
    ? Math.min(100, Math.round((codingSolved / codingTotal) * 100))
    : 0;

  const aptitudeTests = countAptitudeTests(profile);
  const aptitudeScore = aptitudeTests > 0
    ? Math.round(
        ((profile.aptitudeStats?.quantitative ?? 0)
          + (profile.aptitudeStats?.logical ?? 0)
          + (profile.aptitudeStats?.verbal ?? 0)) / 3
      )
    : 0;

  const hrSessions = profile.interviewStats?.sessionsCount ?? 0;
  const techQuizzes = countTechQuizzes(profile);
  const hrScore = hrSessions > 0 ? (profile.interviewStats?.hrScore ?? 0) : 0;
  const techScore = techQuizzes > 0 ? (profile.interviewStats?.techScore ?? 0) : 0;

  let interviewScore = 0;
  if (hrSessions > 0 && techQuizzes > 0) {
    interviewScore = Math.round((hrScore + techScore) / 2);
  } else if (hrSessions > 0) {
    interviewScore = hrScore;
  } else if (techQuizzes > 0) {
    interviewScore = techScore;
  }

  const skillsBonus = Math.min(15, (profile.skills?.length ?? 0) * 2);
  const weighted = Math.round(
    resumeScore * 0.25
    + codingScore * 0.25
    + aptitudeScore * 0.20
    + interviewScore * 0.30
  );

  return {
    resumeScore,
    codingScore,
    aptitudeScore,
    interviewScore,
    skillsBonus,
    overall: Math.min(100, Math.max(0, weighted)),
    hasResume,
    codingSolved,
    aptitudeTests,
    hrSessions,
    techQuizzes,
  };
}

export function recalculateReadiness(profile) {
  return buildPlacementBreakdown(profile).overall;
}
