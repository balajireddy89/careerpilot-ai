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
    missingSkills: [],
    recommendation: 'Add skills and take Technical Interview quizzes to refine this analysis.',
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

export async function generateRoadmapWithAI({ profile, courseFocus = null }) {
  const ctx = buildStudentContext(profile);
  const focus = courseFocus || profile.primaryPriority || profile.targetRole || profile.preferredPaths?.[0] || 'Computer Science';
  const systemPrompt = `Create a 4-month learning roadmap for a student focusing on: ${focus}.
${JSON_ONLY}
Schema: {"months":[{"month":"Month N","title":"...","desc":"...","topics":[{"name":"...","status":false}]}]}`;

  const userMessage = `Primary course/goal: ${focus}
Skills: ${ctx.profile.skills.join(', ') || 'none'}
Branch: ${profile.branch || 'Computer Science'}
Keep 4 months, 3-4 topics each. Tailor to the chosen focus — not generic full-stack unless that is the focus.`;

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

export async function generateMCQQuestions({ topic, count = 10, profile = null }) {
  const role = profile?.targetRole || profile?.primaryPriority || 'software engineering';
  const systemPrompt = `You are a technical interviewer creating ${count} multiple-choice questions for campus placements.
${JSON_ONLY}
Schema: {"questions":[{"question":"string","options":["A","B","C","D"],"answer":"must exactly match one option string"}]}
Rules: exactly ${count} questions. answer must be one of the 4 options verbatim. No explanations field.`;

  const userMessage = `Topic: ${topic}
Student target role: ${role}
Difficulty: mixed campus-placement level`;

  const raw = await callOpenRouter({ systemPrompt, userMessage, temperature: 0.7 });
  const parsed = parseAIJson(raw, { questions: [] });
  const questions = (parsed.questions || [])
    .filter((q) => q.question && Array.isArray(q.options) && q.options.length === 4 && q.answer)
    .slice(0, count)
    .map((q, i) => ({
      id: `${topic}-${i}`,
      q: q.question,
      options: q.options,
      a: q.answer,
    }));
  if (questions.length < 3) throw new Error('AI returned too few valid questions');
  return questions;
}

export async function generateCodingChallenges({ difficulty, count = 10, language = 'Java' }) {
  const systemPrompt = `Generate ${count} unique ${difficulty} coding challenges for ${language}.
${JSON_ONLY}
Schema: {"challenges":[{"id":"unique-id","title":"...","description":"problem statement","difficulty":"${difficulty}","testCases":[{"input":"...","expected":"..."}],"solution":"working ${language} solution passing all test cases"}]}
Each challenge must have exactly 3 testCases.`;

  const raw = await callOpenRouter({
    systemPrompt,
    userMessage: `Generate ${count} ${difficulty} challenges. Vary topics: arrays, strings, math, logic.`,
    temperature: 0.8,
  });
  const parsed = parseAIJson(raw, { challenges: [] });
  const challenges = (parsed.challenges || []).slice(0, count).map((c, i) => ({
    id: c.id || `ai-${difficulty.toLowerCase()}-${i}`,
    title: c.title || `Challenge ${i + 1}`,
    description: c.description || '',
    difficulty,
    testCases: (c.testCases || []).slice(0, 3),
    solution: c.solution || '',
    templateJava: c.solution || `public class Solution {\n    // Write your code\n}`,
    templatePython: c.solution || `class Solution:\n    pass`,
    templateJS: c.solution || `function solve() {\n    // Write your code\n}`,
  }));
  if (challenges.length < 1) throw new Error('AI returned no coding challenges');
  return challenges;
}

export async function generateAptitudeQuestions({ category, count = 10 }) {
  const labels = {
    quantitative: 'Quantitative Aptitude (math, percentages, ratios, time-speed-distance)',
    logical: 'Logical Reasoning (patterns, puzzles, deductions)',
    verbal: 'Verbal Ability (synonyms, antonyms, reading comprehension)',
  };
  const systemPrompt = `Generate ${count} ${labels[category] || category} MCQ questions for placement exams.
${JSON_ONLY}
Schema: {"questions":[{"question":"...","options":["A","B","C","D"],"answer":"exact option text"}]}`;

  const raw = await callOpenRouter({
    systemPrompt,
    userMessage: `Category: ${category}. Campus placement difficulty.`,
    temperature: 0.75,
  });
  const parsed = parseAIJson(raw, { questions: [] });
  return (parsed.questions || []).slice(0, count).map((q, i) => ({
    id: `${category}-${i}`,
    question: q.question,
    options: q.options,
    answer: q.answer,
  }));
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
