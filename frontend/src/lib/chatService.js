import { buildChatSystemPrompt, buildStudentContext } from './chatContext';
import { callOpenRouter } from './openRouter';
import { recalculateReadiness, hasUploadedResume } from '../mock/mockData';

export async function sendChatMessage({ profile, userMessage, history = [] }) {
  const lower = userMessage.toLowerCase();
  const blockedPatterns = [
    'tech stack', 'technology stack', 'what ai model', 'which model', 'openrouter', 'supabase',
    'how does this website work', 'how does the website work', 'source code', 'built with',
    'what framework', 'vercel', 'spring boot', 'admin panel json', 'environment variable',
  ];
  if (blockedPatterns.some((p) => lower.includes(p))) {
    return `## Career guidance only

I help with **career planning, skills, interviews, coding practice, aptitude, and your learning roadmap** — not internal website or AI infrastructure details.

Try asking:
- What skills am I missing for my target role?
- How can I improve my resume or interview scores?
- What should I study next on my roadmap?`;
  }

  const systemPrompt = buildChatSystemPrompt(profile);
  const recentHistory = history
    .filter((m) => m.sender === 'user' || m.sender === 'bot')
    .slice(-10)
    .map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

  return callOpenRouter({
    systemPrompt,
    userMessage,
    temperature: 0.6,
    history: recentHistory,
  });
}

export function buildFallbackResponse(profile, userMessage) {
  const ctx = buildStudentContext(profile);
  const lower = userMessage.toLowerCase();
  const name = profile.name || 'Student';
  const readiness = recalculateReadiness(profile);

  if (lower.includes('skill') || lower.includes('roadmap') || lower.includes('missing')) {
    const path = ctx.careerGuidance.careerPaths.find(
      (p) => p.name.toLowerCase().includes((profile.targetRole || '').toLowerCase().split(' ')[0])
    ) || ctx.careerGuidance.careerPaths[0];

    return `## Skill Gap Analysis for ${name}

Based on your **${ctx.profile.targetRole}** target and current skills (${ctx.profile.skills.join(', ') || 'none listed'}):

**Profile completion:** ${ctx.profile.profileCompletionPercent}%

| Missing Skill | Priority |
|---------------|----------|
${(path?.missingSkills || []).map((s) => `| ${s} | High |`).join('\n')}

**Learning Roadmap highlights:**
${ctx.learningRoadmap.months.map((m) => `- **${m.month}**: ${m.title}`).join('\n')}

Open **Learning Roadmap** and **Skill Assessment** to track progress.`;
  }

  if (lower.includes('resume') || lower.includes('ats')) {
    const r = ctx.resumeAnalyzer;
    if (!r.uploaded) {
      return `## Resume Status

You have **not uploaded a resume** yet. Go to **Resume Analyzer** to upload and get your ATS score.`;
    }
    return `## Resume Analysis

- **Score:** ${r.score}/100
- **ATS Score:** ${r.atsScore}/100
- **Missing keywords:** ${r.missingKeywords.join(', ') || 'None'}
- **Suggestions:** ${r.suggestions.join('; ') || 'Upload again for fresh analysis'}`;
  }

  if (lower.includes('ready') || lower.includes('placement') || lower.includes('predict')) {
    const b = ctx.placementPredictor.breakdown;
    return `## Placement Readiness — ${name}

**Overall readiness: ${readiness}%**

| Module | Score |
|--------|-------|
| Resume (25%) | ${b.resumeWeight25} |
| Coding (25%) | ${b.codingWeight25} |
| Aptitude (20%) | ${b.aptitudeWeight20} |
| Interview (30%) | ${b.interviewWeight30} |

**Target companies:** ${ctx.profile.preferredCompanies.join(', ') || 'Not set — add in Profile'}

Use **Placement Predictor** to simulate score improvements.`;
  }

  if (lower.includes('internship')) {
    const jobs = ctx.internships.recommendations.slice(0, 3);
    return `## Internship Matches

| Role | Company | Match |
|------|---------|-------|
${jobs.map((j) => `| ${j.role} | ${j.company} | ${j.matchPercent}% |`).join('\n')}

Visit **Internships** to apply. Preferred work type: **${ctx.profile.workType}**.`;
  }

  if (lower.includes('interview') || lower.includes('hr')) {
    return `## Interview Readiness

- **HR score:** ${ctx.hrInterview.interviewStats.hrScore ?? 0}/100
- **Tech score:** ${ctx.technicalInterview.techScore}/100
- **Sessions completed:** ${ctx.hrInterview.interviewStats.sessionsCount ?? 0}

Practice in **HR Interview** and **Technical Interview** modules.`;
  }

  if (lower.includes('coding') || lower.includes('aptitude')) {
    return `## Practice Progress

**Coding:** ${ctx.codingPractice.solvedEasy} easy / ${ctx.codingPractice.solvedMedium} medium / ${ctx.codingPractice.solvedHard} hard solved (${ctx.codingPractice.totalChallenges} challenges available)

**Aptitude:** ${ctx.aptitudePrep.stats.score ?? 0}% overall — ${ctx.aptitudePrep.stats.testsTaken ?? 0} tests taken

Use **Coding Practice** and **Aptitude Prep** to improve scores.`;
  }

  if (lower.includes('career') || lower.includes('choose') || lower.includes('path')) {
    const top = ctx.careerGuidance.careerPaths.slice(0, 3);
    return `## Career Path Recommendations

| Path | Match |
|------|-------|
${top.map((p) => `| ${p.name} | ${p.matchPercent}% |`).join('\n')}

Current target: **${ctx.profile.targetRole}**. Explore **Career Guidance** to compare paths.`;
  }

  return `## Hello ${name}!

I'm connected to your live CareerPilot data:

- **Readiness:** ${readiness}%
- **Profile:** ${ctx.profile.profileCompletionPercent}% complete
- **Skills:** ${ctx.profile.skills.length} listed
- **Resume:** ${hasUploadedResume(profile) ? 'uploaded' : 'not uploaded yet'}

Ask about skills, resume, placements, internships, interviews, coding, or aptitude prep.`;
}
