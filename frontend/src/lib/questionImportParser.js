/** Parse admin JSON imports for MCQ and coding challenges */

function normalizeMcqItem(item, moduleType, categoryName) {
  const question = item.question || item.q || item.question_text || '';
  const choices = item.choices || item.options || [];
  const answer = item.answer || item.correct_answer || item.a || '';
  if (!question || !choices.length || !answer) return null;

  return {
    module_type: moduleType,
    category_name: categoryName,
    external_id: item.id != null ? String(item.id) : null,
    question_text: String(question).trim(),
    options: choices.slice(0, 6).map((c) => String(c).trim()),
    correct_answer: String(answer).trim(),
    is_active: true,
  };
}

function normalizeCodingItem(item, difficulty, categoryName) {
  const description = item.challenge || item.description || item.title || '';
  if (!description) return null;

  const rawCases = item.test_cases || item.testCases || [];
  const testCases = rawCases.map((tc, i) => ({
    input: String(tc.input ?? ''),
    expected: String(tc.output ?? tc.expected ?? ''),
    id: i + 1,
  }));

  const title = item.title || String(description).slice(0, 60) + (description.length > 60 ? '…' : '');

  return {
    difficulty,
    category_name: categoryName,
    external_id: item.id != null ? String(item.id) : null,
    title,
    description: String(description).trim(),
    test_cases: testCases,
    solution_java: item.solution_java || item.solutionJava || '',
    solution_python: item.solution_python || item.solutionPython || '',
    solution_js: item.solution_js || item.solutionJs || item.solution || '',
    template_java: item.template_java || item.templateJava || '',
    template_python: item.template_python || item.templatePython || '',
    template_js: item.template_js || item.templateJs || '',
    is_active: true,
  };
}

export function parseMcqJson(text, moduleType, categoryName) {
  const parsed = JSON.parse(text);
  const items = Array.isArray(parsed) ? parsed : parsed.questions || [parsed];
  return items
    .map((item) => normalizeMcqItem(item, moduleType, categoryName))
    .filter(Boolean);
}

export function parseCodingJson(text, difficulty, categoryName) {
  const parsed = JSON.parse(text);
  const items = Array.isArray(parsed) ? parsed : parsed.challenges || [parsed];
  return items
    .map((item) => normalizeCodingItem(item, difficulty, categoryName))
    .filter(Boolean);
}

export function parseRoadmapJson(text) {
  const parsed = JSON.parse(text);

  if (Array.isArray(parsed)) {
    return { courseName: '', months: normalizeMonthsArray(parsed) };
  }

  if (parsed.months && Array.isArray(parsed.months)) {
    return {
      courseName: parsed.courseName || parsed.roadmapTitle || parsed.course_name || '',
      months: normalizeMonthsArray(parsed.months),
    };
  }

  if (parsed.phases && Array.isArray(parsed.phases)) {
    const months = parsed.phases.map((phase, index) => ({
      month: phase.estimatedTime || `Phase ${phase.phaseId ?? index + 1}`,
      title: phase.phaseName || `Phase ${index + 1}`,
      desc: phase.difficultyLevel || '',
      topics: (phase.topics || []).map((topic) => ({
        name: topic.name || 'Untitled topic',
        status: false,
        details: topic.details || [],
      })),
    }));
    return {
      courseName: parsed.roadmapTitle || parsed.courseName || '',
      months,
    };
  }

  throw new Error('Unrecognized roadmap format. Use roadmap.json (phases) or months[] array.');
}

function normalizeMonthsArray(months) {
  return months.map((m, index) => ({
    month: m.month || `Month ${index + 1}`,
    title: m.title || m.phaseName || '',
    desc: m.desc || m.description || '',
    topics: (m.topics || []).map((t) => ({
      name: typeof t === 'string' ? t : t.name || 'Topic',
      status: Boolean(t.status),
      details: t.details || [],
    })),
  }));
}

export async function readFilesAsText(fileList) {
  const files = Array.from(fileList || []);
  const results = await Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ name: file.name, text: reader.result });
          reader.onerror = reject;
          reader.readAsText(file);
        })
    )
  );
  return results;
}

export function parseHRQuestionsJson(text, companyName) {
  const parsed = JSON.parse(text);
  const items = Array.isArray(parsed) ? parsed : [parsed];
  return items
    .map((item) => {
      let qText = '';
      if (typeof item === 'string') {
        qText = item;
      } else if (item && typeof item === 'object') {
        qText = item.question || item.q || item.question_text || '';
      }
      qText = String(qText).trim();
      if (!qText) return null;

      return {
        company_name: companyName,
        question_text: qText,
        is_active: true,
      };
    })
    .filter(Boolean);
}
