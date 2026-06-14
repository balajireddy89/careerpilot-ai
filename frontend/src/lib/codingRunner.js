import { callOpenRouter } from './openRouter';
import { isOpenRouterConfigured } from './config';

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
  if (lang === 'Java') return challenge.templateJava || challenge.solutionJava || 'public class Solution {\n    // Write your Java code here\n}';
  if (lang === 'Python') return challenge.templatePython || challenge.solutionPython || 'def solve(*args):\n    # Write your Python code here\n    pass';
  if (lang === 'C') return '// C Solution\n#include <stdio.h>\n\nvoid solve() {\n    // Write your C code here\n}';
  if (lang === 'C++') return '// C++ Solution\n#include <iostream>\nusing namespace std;\n\nvoid solve() {\n    // Write your C++ code here\n}';
  if (lang === 'Rust') return '// Rust Solution\nfn solve() {\n    // Write your Rust code here\n}';
  return challenge.templateJS || challenge.solutionJS || 'function solve(input) {\n    // Write your JavaScript code here\n}';
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

function parseTestArgs(rawInput) {
  if (rawInput.includes(',')) {
    return rawInput.split(',').map((s) => {
      const t = s.trim();
      const n = Number(t);
      return Number.isNaN(n) ? t.replace(/^['"]|['"]$/g, '') : n;
    });
  }
  const t = rawInput.trim();
  if (t.startsWith('[') && t.endsWith(']')) {
    try {
      return [JSON.parse(t.replace(/'/g, '"'))];
    } catch {
      return [t.replace(/^['"]|['"]$/g, '')];
    }
  }
  const n = Number(t);
  return [Number.isNaN(n) ? t.replace(/^['"]|['"]$/g, '') : n];
}

let pyodidePromise = null;

async function loadPyodideRuntime() {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = new Promise((resolve, reject) => {
    if (window.loadPyodide) {
      window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' }).then(resolve).catch(reject);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
    script.onload = () => {
      window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' }).then(resolve).catch(reject);
    };
    script.onerror = () => reject(new Error('Failed to load Python runtime'));
    document.head.appendChild(script);
  });
  return pyodidePromise;
}

async function runPythonTests(code, testCases) {
  const logs = ['Loading Python runtime (first run may take a few seconds)...'];
  let passed = 0;

  try {
    const pyodide = await loadPyodideRuntime();
    logs.push('Python runtime ready.');

    for (const tc of testCases) {
      try {
        await pyodide.runPythonAsync(code);
        const args = parseTestArgs(tc.input);
        const argLiteral = args.map((a) => JSON.stringify(a)).join(', ');
        const result = await pyodide.runPythonAsync(`solve(${argLiteral})`);
        const output = result?.toJs?.() ?? result;
        const ok = normalizeOutput(output) === normalizeOutput(tc.expected);
        if (ok) {
          passed++;
          logs.push(`Test ${tc.id}: PASS (input: ${tc.input} → ${output})`);
        } else {
          logs.push(`Test ${tc.id}: FAIL — expected "${tc.expected}", got "${output}"`);
        }
      } catch (err) {
        logs.push(`Test ${tc.id}: ERROR — ${err.message}`);
      }
    }
  } catch (err) {
    logs.push(`Python runtime error: ${err.message}`);
    return { passed: false, logs, feedback: 'Could not run Python tests.' };
  }

  return {
    passed: passed === testCases.length && testCases.length > 0,
    logs,
    feedback: passed === testCases.length
      ? 'All test cases passed!'
      : `${passed}/${testCases.length} test cases passed.`,
  };
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
      const args = parseTestArgs(rawInput);

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

async function runCodeWithAi(code, challenge, language) {
  const testCases = challenge.testCases || [];
  const systemPrompt = `You are an expert programming compiler and code execution engine.
Your task is to dry-run or compile and run the provided code in the specified programming language against the given test cases.
Evaluate the correctness of the code. Run the code logic step-by-step for each input to see if it yields the expected output.
Return ONLY a valid JSON object matching this schema:
{
  "passed": boolean,
  "logs": string[],
  "feedback": string
}
Do not include any markdown formatting, markdown code blocks, or explanations outside the JSON object. Just return the raw JSON.`;

  const userMessage = `Language: ${language}
Challenge: ${challenge.title}
Description: ${challenge.description}
Test Cases: ${JSON.stringify(testCases)}
Code:
${code}`;

  try {
    const response = await callOpenRouter({
      systemPrompt,
      userMessage,
      temperature: 0.1,
    });
    
    const cleanJson = response.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    const result = JSON.parse(cleanJson);
    return {
      passed: Boolean(result.passed),
      logs: Array.isArray(result.logs) ? result.logs : ['AI evaluation complete.'],
      feedback: String(result.feedback || ''),
    };
  } catch (err) {
    console.error('AI code run failed:', err);
    return {
      passed: false,
      logs: [`AI compiler execution failed: ${err.message}`],
      feedback: 'Failed to evaluate code with AI.',
    };
  }
}

export async function reviewCodeLocally({ code, challenge, language }) {
  const testCases = challenge?.testCases || [];
  if (!testCases.length) {
    return { passed: false, logs: ['No test cases defined for this challenge.'], feedback: 'No test cases.' };
  }

  if (language === 'JavaScript') {
    return runJavaScriptTests(code, testCases);
  }

  if (language === 'Python') {
    return runPythonTests(code, testCases);
  }

  if (isOpenRouterConfigured) {
    return runCodeWithAi(code, challenge, language);
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
      `OpenRouter API key is not configured. Please add VITE_OPENROUTER_API_KEY to your .env file to enable automated runs for ${language}.`,
      solution ? 'Tip: open "Show solution" if you are stuck.' : 'Ask admin to add a reference solution.',
    ],
    feedback: `Manual verification required for ${language}. Use "Mark verified" after checking test cases.`,
    needsManualConfirm: true,
  };
}

export function pickRandomQuestions(questions, count = 10) {
  return shuffleArray(questions).slice(0, count);
}
