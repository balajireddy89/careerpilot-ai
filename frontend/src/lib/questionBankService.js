import { supabase } from './supabase';
import { TECH_INTERVIEW_TOPICS } from './csSkillsCatalog';
import { pickRandomQuestions } from './codingRunner';

const APTITUDE_DEFAULTS = [
  { id: 'quantitative', label: 'Quantitative Aptitude' },
  { id: 'logical', label: 'Logical Reasoning' },
  { id: 'verbal', label: 'Verbal Ability' },
];

export { APTITUDE_DEFAULTS };

export function mapMcqToTechQuiz(row) {
  return {
    id: row.id,
    q: row.question_text,
    options: row.options || [],
    a: row.correct_answer,
  };
}

export function mapMcqToAptitude(row) {
  return {
    id: row.id,
    question: row.question_text,
    options: row.options || [],
    answer: row.correct_answer,
  };
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export async function fetchCategories(moduleType) {
  const { data, error } = await supabase
    .from('content_categories')
    .select('*')
    .eq('module_type', moduleType)
    .order('name');

  if (error) throw error;
  return data ?? [];
}

export async function fetchCategoryNames(moduleType, fallback = []) {
  try {
    const cats = await fetchCategories(moduleType);
    const names = cats.map((c) => c.name);
    const merged = [...new Set([...fallback, ...names])];
    return merged.sort();
  } catch {
    return fallback;
  }
}

export async function createCategory(moduleType, name) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Category name required');
  const { data, error } = await supabase
    .from('content_categories')
    .insert({ module_type: moduleType, name: trimmed })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('content_categories').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// MCQ questions
// ---------------------------------------------------------------------------
export async function fetchMcqQuestions(moduleType, categoryName, { admin = false } = {}) {
  let query = supabase
    .from('mcq_questions')
    .select('*')
    .eq('module_type', moduleType)
    .eq('category_name', categoryName)
    .order('created_at', { ascending: true });

  if (!admin) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchMcqForQuiz(moduleType, categoryName, count = 10) {
  const rows = await fetchMcqQuestions(moduleType, categoryName);
  return pickRandomQuestions(rows, Math.min(count, rows.length));
}

export async function createMcqQuestion(payload) {
  const { data, error } = await supabase
    .from('mcq_questions')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function bulkCreateMcqQuestions(rows) {
  if (!rows.length) return [];
  const { data, error } = await supabase.from('mcq_questions').insert(rows).select();
  if (error) throw error;
  return data ?? [];
}

export async function deleteMcqQuestion(id) {
  const { error } = await supabase.from('mcq_questions').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleMcqActive(id, isActive) {
  const { data, error } = await supabase
    .from('mcq_questions')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Coding challenges
// ---------------------------------------------------------------------------
export async function fetchCodingChallenges(difficulty, { admin = false, categoryName = null } = {}) {
  let query = supabase
    .from('coding_challenges')
    .select('*')
    .eq('difficulty', difficulty)
    .order('created_at', { ascending: true });

  if (categoryName) query = query.eq('category_name', categoryName);
  if (!admin) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createCodingChallenge(payload) {
  const { data, error } = await supabase
    .from('coding_challenges')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function bulkCreateCodingChallenges(rows) {
  if (!rows.length) return [];
  const { data, error } = await supabase.from('coding_challenges').insert(rows).select();
  if (error) throw error;
  return data ?? [];
}

export async function deleteCodingChallenge(id) {
  const { error } = await supabase.from('coding_challenges').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Roadmap templates
// ---------------------------------------------------------------------------
export async function fetchRoadmapTemplates() {
  const { data, error } = await supabase
    .from('roadmap_templates')
    .select('*')
    .eq('is_active', true)
    .order('course_name');
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllRoadmapTemplates() {
  const { data, error } = await supabase
    .from('roadmap_templates')
    .select('*')
    .order('course_name');
  if (error) throw error;
  return data ?? [];
}

export async function upsertRoadmapTemplate(courseName, months) {
  const { data, error } = await supabase
    .from('roadmap_templates')
    .upsert({ course_name: courseName, months, is_active: true }, { onConflict: 'course_name' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRoadmapTemplate(id) {
  const { error } = await supabase.from('roadmap_templates').delete().eq('id', id);
  if (error) throw error;
}

export async function findRoadmapTemplate(courseName) {
  const { data, error } = await supabase
    .from('roadmap_templates')
    .select('*')
    .ilike('course_name', courseName)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchHRQuestions(companyName, { admin = false } = {}) {
  try {
    let query = supabase
      .from('hr_questions')
      .select('*')
      .order('created_at', { ascending: true });

    if (companyName) {
      query = query.eq('company_name', companyName);
    }
    if (!admin) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase hr_questions query failed, using mock data:', error);
      return getFallbackHRQuestions(companyName);
    }
    if (!data || data.length === 0) {
      return getFallbackHRQuestions(companyName);
    }
    return data;
  } catch (err) {
    console.warn('Supabase hr_questions error, using mock data:', err);
    return getFallbackHRQuestions(companyName);
  }
}

function getFallbackHRQuestions(companyName) {
  const defaults = {
    "TCS": [
      "Why do you want to join TCS, and what do you know about our service-based model?",
      "Are you comfortable with relocating to different project locations and working in night shifts?",
      "Tell me about a challenging project you did in college and your role in it.",
      "TCS works heavily in teams. Share an instance where you worked with a difficult team member and how you handled it."
    ],
    "Infosys": [
      "Why Infosys? What interests you about our training program at Mysore?",
      "How do you handle rapid technological shifts? If asked to learn a new programming language in a week, how would you approach it?",
      "Describe a time when you made a mistake in a project. How did you identify and resolve it?",
      "What are your expectations from this role, and where do you see yourself in the next 5 years?"
    ],
    "Wipro": [
      "Why Wipro, and how do you align with our core values (Spirit of Wipro)?",
      "If you are assigned to a project that uses a legacy technology instead of a modern framework, how would you react?",
      "Describe a situation where you had to lead a project or initiative at college.",
      "How do you prioritize tasks when you are overwhelmed with multiple deadlines?"
    ],
    "Google": [
      "Explain a complex technical concept or system design challenge you solved recently in simple terms.",
      "Describe a time when you disagreed with a peer or supervisor on a design choice. How did you find common ground?",
      "How do you ensure 'Googlyness' and keep a user-first mindset when developing software?",
      "Share an example of an ambiguous problem you faced and how you structured a solution from scratch."
    ],
    "Microsoft": [
      "Microsoft's mission is to empower every person and organization. How does your passion for technology fit into this mission?",
      "Tell me about a time you took a calculated risk that failed. What did you learn?",
      "How do you handle customer feedback or criticism of your product or code?",
      "Describe a technically complex feature you built and how you optimized its performance."
    ],
    "Accenture": [
      "Accenture focuses heavily on digital transformation. What industry trends are you most excited to work on?",
      "Describe a situation where you had to adapt quickly to a major change in a project's requirements.",
      "How do you communicate technical requirements to non-technical business clients?",
      "Describe a successful collaborative project you participated in and your key contributions."
    ],
    "Amazon": [
      "Amazon operates on 16 Leadership Principles. Which of these principles resonated most with you and why?",
      "Tell me about a time you had to make a quick decision without all the necessary data.",
      "Describe a situation where you went above and beyond for a customer or project.",
      "Tell me about a time you failed to meet a deadline. What did you do to remediate the situation?"
    ],
    "General": [
      "Tell me about yourself.",
      "Why do you want to join our company?",
      "What are your greatest strengths and weaknesses?",
      "How do you manage stress and maintain a healthy work-life balance?"
    ]
  };
  const list = defaults[companyName] || defaults["General"];
  return list.map((q, i) => ({
    id: `mock-hr-${companyName}-${i}`,
    company_name: companyName,
    question_text: q,
    is_active: true
  }));
}

export async function createHRQuestion(payload) {
  const { data, error } = await supabase
    .from('hr_questions')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function bulkCreateHRQuestions(rows) {
  if (!rows.length) return [];
  const { data, error } = await supabase.from('hr_questions').insert(rows).select();
  if (error) throw error;
  return data ?? [];
}

export async function deleteHRQuestion(id) {
  const { error } = await supabase.from('hr_questions').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchMcqQuestionsCounts(moduleType) {
  try {
    const { data, error } = await supabase
      .from('mcq_questions')
      .select('category_name')
      .eq('module_type', moduleType)
      .eq('is_active', true);
    
    if (error) throw error;
    
    const counts = {};
    data?.forEach((row) => {
      const cat = row.category_name;
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  } catch (err) {
    console.warn('Failed to fetch MCQ question counts from Supabase:', err);
    return {};
  }
}

export const DEFAULT_TECH_TOPICS = TECH_INTERVIEW_TOPICS;
