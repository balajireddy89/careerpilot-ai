/** Local test runner — no AI required */

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function mapDbChallengeToUi(row) {
  const testCases = (row.test_cases || []).map((tc, i) => ({
    input: tc.input ?? '',
    expected: tc.expected ?? tc.output ?? '',
    id: i + 1,
  }));

  return {
    id: row.external_id || row.id,
    dbId: row.id,
    title: row.title,
    description: row.description,
    difficulty: row.difficulty,
    testCases,
    solution: row.solution_js || row.solution_java || row.solution_python || '',
    templateJava: row.template_java || '',
    templatePython: row.template_python || '',
    templateJS: row.template_js || '',
    solutionJava: row.solution_java || '',
    solutionPython: row.solution_python || '',
    solutionJS: row.solution_js || '',
  };
}

export function getTemplate(challenge, lang) {
  if (!challenge) return '';
  if (lang === 'Java') return challenge.templateJava || challenge.solutionJava || '';
  if (lang === 'Python') return challenge.templatePython || challenge.solutionPython || '';
  return challenge.templateJS || challenge.solutionJS || '';
}

export function getSolution(challenge, lang) {
  if (!challenge) return '';
  if (lang === 'Java') return challenge.solutionJava || '';
  if (lang === 'Python') return challenge.solutionPython || '';
  return challenge.solutionJS || '';
}

function normalizeOutput(val) {
  return String(val ?? '').trim().replace(/\s+/g, ' ');
}

function runJavaScriptTests(code, testCases) {
  const logs = [];
  let passed = 0;

  for (const tc of testCases) {
    try {
      const fn = new Function(`
        ${code}
        return typeof solve === 'function' ? solve : null;
      `)();
      if (typeof fn !== 'function') {
        logs.push(`Test ${tc.id}: define a solve(input) function that returns the answer.`);
        continue;
      }
      const rawInput = tc.input;
      const args = rawInput.includes(',')
        ? rawInput.split(',').map((s) => {
            const t = s.trim();
            const n = Number(t);
            return Number.isNaN(n) ? t.replace(/^['"]|['"]$/g, '') : n;
          })
        : [rawInput.trim().replace(/^['"]|['"]$/g, '')];

      const result = fn(...args);
      const ok = normalizeOutput(result) === normalizeOutput(tc.expected);
      if (ok) {
        passed++;
        logs.push(`Test ${tc.id}: PASS (input: ${tc.input} → ${result})`);
      } else {
        logs.push(`Test ${tc.id}: FAIL — expected "${tc.expected}", got "${result}"`);
      }
    } catch (err) {
      logs.push(`Test ${tc.id}: ERROR — ${err.message}`);
    }
  }

  return {
    passed: passed === testCases.length && testCases.length > 0,
    logs,
    feedback: passed === testCases.length
      ? 'All test cases passed!'
      : `${passed}/${testCases.length} test cases passed.`,
  };
}

export function reviewCodeLocally({ code, challenge, language }) {
  const testCases = challenge?.testCases || [];
  if (!testCases.length) {
    return { passed: false, logs: ['No test cases defined for this challenge.'], feedback: 'No test cases.' };
  }

  if (language === 'JavaScript') {
    return runJavaScriptTests(code, testCases);
  }

  const solution = getSolution(challenge, language);
  const logs = testCases.map(
    (tc) => `Test ${tc.id}: input="${tc.input}" → expected="${tc.expected}"`
  );

  if (solution && normalizeOutput(code) === normalizeOutput(solution)) {
    return { passed: true, logs: [...logs, 'Solution matches reference.'], feedback: 'Reference solution match!' };
  }

  return {
    passed: false,
    logs: [
      ...logs,
      `Automated run is available for JavaScript. For ${language}, compare your output with expected results above.`,
      solution ? 'Tip: open "Show solution" if you are stuck.' : 'Ask admin to add a reference solution.',
    ],
    feedback: `Manual verification required for ${language}. Ensure all test cases pass before marking complete.`,
    needsManualConfirm: true,
  };
}

export function pickRandomQuestions(questions, count = 10) {
  return shuffleArray(questions).slice(0, count);
}
