import { callOpenRouter } from './openRouter';
import { buildStudentContext } from './chatContext';
import { parseAIJson, clamp } from './aiUtils';

const JSON_ONLY = 'Respond with valid JSON only. No markdown fences or extra text.';

export async function evaluateHRAnswer({ profile, question, answer }) {
  const ctx = buildStudentContext(profile);
  const systemPrompt = `You are an expert HR interview coach for Indian tier-1 campus placements.
Evaluate student answers for confidence, clarity, and professionalism.
${JSON_ONLY}
Schema: {"confidence":1-10,"clarity":1-10,"professionalism":1-10,"score":0-100,"feedback":"2-3 sentences","sampleAnswer":"ideal 3-4 sentence answer"}`;

  const userMessage = `Student: ${ctx.profile.name}, target role: ${ctx.profile.targetRole}, skills: ${ctx.profile.skills.join(', ') || 'none'}
Question: ${question}
Answer: ${answer}`;

  const raw = await callOpenRouter({ systemPrompt, userMessage, temperature: 0.4 });
  const parsed = parseAIJson(raw);
  if (!parsed) throw new Error('Invalid AI response');

  return {
    confidence: clamp(Math.round(parsed.confidence || 7), 1, 10),
    clarity: clamp(Math.round(parsed.clarity || 7), 1, 10),
    professionalism: clamp(Math.round(parsed.professionalism || 7), 1, 10),
    score: clamp(Math.round(parsed.score || 75), 0, 100),
    feedback: parsed.feedback || 'Solid attempt — add a concrete project example and tie it to the role.',
    sampleAnswer: parsed.sampleAnswer || 'Structure your answer: hook, skills/projects, motivation for the company.',
  };
}

export async function analyzeResumeWithAI({ profile, resumeText, fileName }) {
  const ctx = buildStudentContext(profile);
  const systemPrompt = `You are an ATS resume analyst for ${ctx.profile.targetRole} campus hiring.
${JSON_ONLY}
Schema: {
  "score":0-100,"atsScore":0-100,"formattingScore":0-100,"keywordsScore":0-100,
  "detectedKeywords":["..."],
  "missingKeywords":["..."],
  "suggestions":["3-5 actionable bullets"],
  "extractedSkills":["..."],
  "checklist":[{"title":"...","status":true/false,"desc":"..."}]
}`;

  const userMessage = `Target role: ${ctx.profile.targetRole}
Current skills: ${ctx.profile.skills.join(', ') || 'none'}
File: ${fileName}
Resume text:
${resumeText.slice(0, 12000)}`;

  const raw = await callOpenRouter({ systemPrompt, userMessage, temperature: 0.3 });
  const parsed = parseAIJson(raw);
  if (!parsed) throw new Error('Invalid AI response');
  return parsed;
}

export async function extractSkillsFromResume({ profile, resumeText, fileName }) {
  const systemPrompt = `Extract technical skills from a student resume for a ${profile.targetRole || 'software'} role.
${JSON_ONLY}
Schema: {"skills":["skill names only, max 15"],"summary":"one sentence on what was found"}`;

  const userMessage = `File: ${fileName}
Existing skills: ${profile.skills?.join(', ') || 'none'}
Resume text:
${resumeText.slice(0, 10000)}`;

  const raw = await callOpenRouter({ systemPrompt, userMessage, temperature: 0.2 });
  const parsed = parseAIJson(raw, { skills: [], summary: '' });
  return {
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    summary: parsed.summary || 'Skills extracted from resume.',
  };
}

export async function reviewCodingSolution({ challenge, code, language }) {
  const systemPrompt = `You are a coding interview judge. Evaluate if the student's ${language} solution correctly solves the problem.
${JSON_ONLY}
Schema: {
  "passed":true/false,
  "logs":["step-by-step execution log lines as strings"],
  "feedback":"brief explanation",
  "complexity":"time/space if passed"
}`;

  const userMessage = `Problem: ${challenge.title}
Description: ${challenge.description}
Test cases: ${JSON.stringify(challenge.testCases)}
Language: ${language}
Student code:
${code}`;

  const raw = await callOpenRouter({ systemPrompt, userMessage, temperature: 0.2 });
  const parsed = parseAIJson(raw);
  if (!parsed) throw new Error('Invalid AI response');
  return {
    passed: Boolean(parsed.passed),
    logs: Array.isArray(parsed.logs) ? parsed.logs : ['AI review completed.'],
    feedback: parsed.feedback || '',
    complexity: parsed.complexity || '',
  };
}

export async function explainQuizAnswer({ question, options, correctAnswer, userAnswer, topic }) {
  const systemPrompt = `You are a technical interviewer explaining quiz answers concisely for ${topic}.`;
  const userMessage = `Question: ${question}
Options: ${options.join(' | ')}
Correct: ${correctAnswer}
Student picked: ${userAnswer || 'none'}
Explain in 2-3 sentences why the correct answer is right.`;

  return callOpenRouter({ systemPrompt, userMessage, temperature: 0.5 });
}

export async function getSkillGapAnalysis({ profile }) {
  const ctx = buildStudentContext(profile);
  const systemPrompt = `Analyze skill gaps for a student targeting ${ctx.profile.targetRole}.
${JSON_ONLY}
Schema: {"missingSkills":["..."],"recommendation":"2 sentences","currentStrengths":["..."]}`;

  const userMessage = `Skills: ${ctx.profile.skills.join(', ') || 'none'}
Target role: ${ctx.profile.targetRole}
Readiness: ${ctx.profile.profileCompletionPercent}%`;

  const raw = await callOpenRouter({ systemPrompt, userMessage, temperature: 0.4 });
  return parseAIJson(raw, {
    missingSkills: ['React', 'Spring Boot'],
    recommendation: 'Focus on full-stack integration projects.',
    currentStrengths: ctx.profile.skills.slice(0, 5),
  });
}

export async function analyzeCareerPathFit({ profile, careerPath }) {
  const ctx = buildStudentContext(profile);
  const systemPrompt = `Career counselor for campus placements. Assess fit between student and career path.
${JSON_ONLY}
Schema: {"matchPercent":0-100,"reasoning":"2-3 sentences","nextSteps":["..."]}`;

  const userMessage = `Student skills: ${ctx.profile.skills.join(', ') || 'none'}
Target role: ${ctx.profile.targetRole}
Path: ${careerPath.name}
Path description: ${careerPath.description}
Required skills: ${(careerPath.requiredSkills || careerPath.required || []).join(', ')}`;

  const raw = await callOpenRouter({ systemPrompt, userMessage, temperature: 0.4 });
  return parseAIJson(raw, {
    matchPercent: careerPath.match || 70,
    reasoning: careerPath.description,
    nextSteps: ['Complete skill assessment quizzes', 'Update learning roadmap'],
  });
}

export async function rankInternshipsWithAI({ profile, internships }) {
  const ctx = buildStudentContext(profile);
  const systemPrompt = `Rank internships for a student. Return match percentages based on skill overlap.
${JSON_ONLY}
Schema: {"rankings":[{"id":"internship id","match":0-100,"reason":"one short sentence"}]}`;

  const userMessage = `Student skills: ${ctx.profile.skills.join(', ') || 'none'}
Target: ${ctx.profile.targetRole}
Work preference: ${ctx.profile.workType}
Internships: ${JSON.stringify(internships.map((j) => ({ id: j.id, role: j.role, company: j.company, required: j.required })))}`;

  const raw = await callOpenRouter({ systemPrompt, userMessage, temperature: 0.3 });
  const parsed = parseAIJson(raw, { rankings: [] });
  return Array.isArray(parsed.rankings) ? parsed.rankings : [];
}

export async function generateRoadmapWithAI({ profile }) {
  const ctx = buildStudentContext(profile);
  const systemPrompt = `Create a 4-month learning roadmap for a student targeting ${ctx.profile.targetRole}.
${JSON_ONLY}
Schema: {"months":[{"month":"Month N","title":"...","desc":"...","topics":[{"name":"...","status":false}]}]}`;

  const userMessage = `Skills: ${ctx.profile.skills.join(', ') || 'none'}
Missing gaps to address. Keep 4 months, 3 topics each.`;

  const raw = await callOpenRouter({ systemPrompt, userMessage, temperature: 0.5 });
  const parsed = parseAIJson(raw);
  if (!parsed?.months?.length) throw new Error('Invalid roadmap response');
  return parsed.months;
}

export async function analyzeAllCareerPaths({ profile, paths }) {
  const ctx = buildStudentContext(profile);
  const systemPrompt = `Career counselor. Assess student fit for each career path.
${JSON_ONLY}
Schema: {"paths":[{"id":"path id","matchPercent":0-100,"reasoning":"1-2 sentences","missingSkills":["..."],"nextSteps":["..."]}]}`;

  const userMessage = `Student skills: ${ctx.profile.skills.join(', ') || 'none'}
Target: ${ctx.profile.targetRole}
Paths: ${JSON.stringify(paths.map((p) => ({ id: p.id, name: p.name, description: p.description, required: p.missingSkills })))}`;

  const raw = await callOpenRouter({ systemPrompt, userMessage, temperature: 0.4 });
  const parsed = parseAIJson(raw, { paths: [] });
  return Array.isArray(parsed.paths) ? parsed.paths : [];
}

export async function getAptitudeTestReview({ profile, category, questions, submittedAnswers, score }) {
  const systemPrompt = `Aptitude coach. Summarize test performance and give study advice.
Write 2 short paragraphs in plain text, no JSON.`;

  const userMessage = `Category: ${category}
Score: ${score}/${questions.length}
Student: ${profile.name}
Wrong answers: ${submittedAnswers.filter((a) => !a.isCorrect).length}`;

  return callOpenRouter({ systemPrompt, userMessage, temperature: 0.5 });
}
