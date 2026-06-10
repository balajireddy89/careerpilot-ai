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

export const DEFAULT_TECH_TOPICS = TECH_INTERVIEW_TOPICS;
