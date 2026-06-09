import {
  CAREER_PATHS,
  MOCK_INTERNSHIPS,
  CODING_CHALLENGES,
  APTITUDE_QUESTIONS,
  HR_QUESTIONS,
  recalculateReadiness,
  calculateProfileCompletion,
  hasUploadedResume,
} from '../mock/mockData';
import { ROADMAPS_BY_ROLE } from '../data/learningRoadmaps';

function skillMatchScore(userSkills, requiredSkills) {
  if (!requiredSkills?.length) return 0;
  const normalized = userSkills.map((s) => s.toLowerCase());
  const matched = requiredSkills.filter((s) =>
    normalized.some((us) => us.includes(s.toLowerCase()) || s.toLowerCase().includes(us))
  );
  return Math.round((matched.length / requiredSkills.length) * 100);
}

export function buildStudentContext(profile) {
  const readiness = recalculateReadiness(profile);
  const profileCompletion = calculateProfileCompletion(profile);
  const targetRole = profile.targetRole || 'Full Stack Developer';
  const roadmap = ROADMAPS_BY_ROLE[targetRole] || ROADMAPS_BY_ROLE['Full Stack Developer'];

  const careerPaths = CAREER_PATHS.map((path) => ({
    name: path.name,
    matchPercent: path.match,
    missingSkills: path.missingSkills,
    nextSteps: path.nextSteps,
  }));

  const internships = MOCK_INTERNSHIPS.map((job) => ({
    role: job.role,
    company: job.company,
    location: job.location,
    stipend: job.stipend,
    requiredSkills: job.required,
    matchPercent: skillMatchScore(profile.skills || [], job.required),
  })).sort((a, b) => b.matchPercent - a.matchPercent);

  return {
    profile: {
      name: profile.name,
      email: profile.email,
      college: profile.college,
      branch: profile.branch,
      cgpa: profile.cgpa,
      targetRole,
      aims: profile.aims,
      preferredPaths: profile.preferredPaths,
      preferredCompanies: profile.preferredCompanies,
      workType: profile.workType,
      weeklyHours: profile.weeklyHours,
      skills: profile.skills,
      skillsProficiency: profile.skillsProficiency,
      profileCompletionPercent: profileCompletion,
      points: profile.points,
      dailyStreak: profile.dailyStreak,
    },
    skillAssessment: {
      skills: profile.skills,
      skillsProficiency: profile.skillsProficiency,
      codingRating: profile.codingRating,
      codingStats: profile.codingStats,
    },
    careerGuidance: {
      targetRole,
      careerPaths,
    },
    resumeAnalyzer: {
      uploaded: hasUploadedResume(profile),
      fileName: profile.resumeDetails?.fileName || '',
      score: profile.resumeDetails?.score ?? 0,
      atsScore: profile.resumeDetails?.atsScore ?? 0,
      detectedKeywords: profile.resumeDetails?.detectedKeywords ?? [],
      missingKeywords: profile.resumeDetails?.missingKeywords ?? [],
      suggestions: profile.resumeDetails?.suggestions ?? [],
    },
    internships: { recommendations: internships },
    placementPredictor: {
      overallReadinessPercent: readiness,
      breakdown: {
        resumeWeight25: profile.resumeDetails?.score ?? 0,
        codingWeight25: Math.round((profile.codingStats?.score ?? 0) / 10),
        aptitudeWeight20: profile.aptitudeStats?.score ?? 0,
        interviewWeight30: Math.round(
          ((profile.interviewStats?.hrScore ?? 0) + (profile.interviewStats?.techScore ?? 0)) / 2
        ),
      },
    },
    hrInterview: {
      hrRating: profile.hrRating,
      interviewStats: profile.interviewStats,
      sampleQuestions: HR_QUESTIONS,
    },
    technicalInterview: {
      codingStats: profile.codingStats,
      techScore: profile.interviewStats?.techScore ?? 0,
    },
    codingPractice: {
      totalChallenges: CODING_CHALLENGES.length,
      solvedEasy: profile.codingStats?.solvedEasy ?? 0,
      solvedMedium: profile.codingStats?.solvedMedium ?? 0,
      solvedHard: profile.codingStats?.solvedHard ?? 0,
      challenges: CODING_CHALLENGES.map((c) => ({
        title: c.title,
        difficulty: c.difficulty,
        category: c.category,
      })),
    },
    aptitudePrep: {
      stats: profile.aptitudeStats,
      sampleQuestionCount: Object.values(APTITUDE_QUESTIONS).flat().length,
      categories: Object.keys(APTITUDE_QUESTIONS),
    },
    learningRoadmap: {
      targetRole,
      months: roadmap,
    },
  };
}

export function buildChatSystemPrompt(profile) {
  const context = buildStudentContext(profile);

  return `You are CareerPilot AI, an expert placement and career advisor embedded in the CareerPilot platform.

CRITICAL RULES:
- Answer ONLY using the STUDENT_CONTEXT JSON below. Never invent scores, skills, or company matches.
- If data is missing or zero, say what is missing and direct the user to the relevant app section.
- Reference the correct feature module when giving advice (Skill Assessment, Career Guidance, Resume Analyzer, Internships, Placement Predictor, HR Interview, Technical Interview, Coding Practice, Aptitude Prep, Learning Roadmap).
- Be specific with numbers from the context (readiness %, resume score, coding XP, match %).
- Do not claim the student uploaded a resume unless resumeAnalyzer.uploaded is true.

STUDENT_CONTEXT:
${JSON.stringify(context, null, 2)}

FORMAT every response as clean markdown:
- Start with a ## heading summarizing the answer
- Short intro (2-3 sentences)
- Use markdown tables for comparisons (each row on its own line)
- Use bullet lists for action steps
- Blank line between sections`;
}
