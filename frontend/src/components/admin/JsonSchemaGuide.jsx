import React, { useState } from 'react';
import { FileJson, ChevronDown, ChevronUp } from 'lucide-react';

const SCHEMAS = {
  technical: {
    title: 'Technical Interview (MCQ)',
    fileHint: 'pythonquestions.json · javaquestions.json',
    example: `[
  {
    "id": 1,
    "question": "What is the time complexity of binary search?",
    "choices": ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
    "answer": "O(log n)"
  }
]`,
    notes: 'Import under the matching subject/category. Fields: id (optional), question, choices[], answer (exact match).',
  },
  coding: {
    title: 'Coding Practice',
    fileHint: 'codingeasy.json',
    example: `[
  {
    "id": 1,
    "challenge": "Write a function that takes two numbers and returns their sum.",
    "test_cases": [
      { "input": "2, 3", "output": "5" },
      { "input": "-1, 5", "output": "4" }
    ],
    "solution_python": "def solve(a, b):\\n    return a + b",
    "solution_js": "function solve(a, b) { return a + b; }"
  }
]`,
    notes: 'Students must define solve(...). JavaScript & Python run tests automatically. Optional: solution_python, solution_js, template_* fields.',
  },
  aptitude: {
    title: 'Aptitude Prep (MCQ)',
    fileHint: 'quantitativequestions.json',
    example: `[
  {
    "id": 1,
    "question": "A train at 60 km/h crosses a pole in 9s. Length?",
    "choices": ["120 m", "150 m", "180 m", "200 m"],
    "answer": "150 m"
  }
]`,
    notes: 'Same MCQ format as Technical Interview. Pick category: quantitative, logical, or verbal.',
  },
  hr: {
    title: 'HR Questions',
    fileHint: 'hr-tcs.json',
    example: `[
  { "id": 1, "question": "Tell me about yourself in a way not written in your resume." },
  { "id": 2, "question": "Why do you want to join TCS?" }
]`,
    notes: 'Select target company before import. Supports string arrays or { id, question } objects. Syncs live with HR Interview simulator.',
  },
  roadmap: {
    title: 'Learning Roadmap',
    fileHint: 'roadmap.json',
    example: `{
  "roadmapTitle": "Python Developer Roadmap",
  "targetYear": 2026,
  "phases": [
    {
      "phaseId": 1,
      "phaseName": "Setup & Essentials",
      "estimatedTime": "Week 0",
      "topics": [
        {
          "name": "Environment Installation",
          "details": ["Python 3.12+ installation", "VS Code setup"]
        }
      ]
    }
  ]
}`,
    notes: 'Also accepts months[] format: [{ "month": "Month 1", "title": "Foundations", "desc": "...", "topics": [{ "name": "Topic 1", "status": false }] }]. Phases auto-convert on import.',
  },
};

export default function JsonSchemaGuide({ type }) {
  const [open, setOpen] = useState(false);
  const schema = SCHEMAS[type];
  if (!schema) return null;

  return (
    <div className="glass-card border border-brand-500/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-brand-500/5 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400">
          <FileJson className="w-4 h-4" />
          JSON format guide — {schema.title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] text-slate-500 pt-3">
            Reference file: <code className="text-brand-500">{schema.fileHint}</code>
          </p>
          <p className="text-[10px] text-slate-500">{schema.notes}</p>
          <pre className="text-[10px] font-mono bg-slate-950 text-emerald-400 p-3 rounded-xl overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
            {schema.example}
          </pre>
        </div>
      )}
    </div>
  );
}
