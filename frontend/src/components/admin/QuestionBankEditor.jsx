import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Upload, RefreshCw, CheckCircle, AlertCircle, FileJson } from 'lucide-react';
import {
  fetchCategoryNames,
  createCategory,
  fetchMcqQuestions,
  createMcqQuestion,
  bulkCreateMcqQuestions,
  deleteMcqQuestion,
  bulkDeleteMcqQuestions,
  fetchCodingChallenges,
  createCodingChallenge,
  bulkCreateCodingChallenges,
  deleteCodingChallenge,
  bulkDeleteCodingChallenges,
} from '../../lib/questionBankService';
import { parseMcqJson, parseCodingJson, readFilesAsText } from '../../lib/questionImportParser';

export default function QuestionBankEditor({ moduleType, title, defaultCategories = [], isCoding = false }) {
  const [categories, setCategories] = useState(defaultCategories);
  const [selectedCategory, setSelectedCategory] = useState(defaultCategories[0] || '');
  const [newCategory, setNewCategory] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [answer, setAnswer] = useState('');
  const [jsonPaste, setJsonPaste] = useState('');

  const [codeTitle, setCodeTitle] = useState('');
  const [codeDesc, setCodeDesc] = useState('');
  const [codeTests, setCodeTests] = useState('');

  const catModule = isCoding ? 'coding' : moduleType;

  const loadCategories = useCallback(async () => {
    try {
      const names = await fetchCategoryNames(catModule, defaultCategories);
      setCategories(names);
      if (!selectedCategory && names.length) setSelectedCategory(names[0]);
    } catch (e) {
      console.warn(e);
    }
  }, [catModule, defaultCategories, selectedCategory]);

  const loadQuestions = useCallback(async () => {
    if (!selectedCategory && !isCoding) return;
    setLoading(true);
    setErr('');
    try {
      if (isCoding) {
        const rows = await fetchCodingChallenges(difficulty, { admin: true, categoryName: selectedCategory || 'General' });
        setQuestions(rows);
      } else {
        const rows = await fetchMcqQuestions(moduleType, selectedCategory, { admin: true });
        setQuestions(rows);
      }
    } catch (e) {
      setErr(e.message || 'Failed to load questions');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [moduleType, selectedCategory, difficulty, isCoding]);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  useEffect(() => {
    setSelectedIds([]);
  }, [selectedCategory, difficulty]);

  const flash = (text, isError = false) => {
    if (isError) setErr(text);
    else setMsg(text);
    setTimeout(() => { setMsg(''); setErr(''); }, 3500);
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await createCategory(catModule, newCategory.trim());
      setSelectedCategory(newCategory.trim());
      setNewCategory('');
      await loadCategories();
      flash(`Category "${newCategory.trim()}" added`);
    } catch (e) {
      flash(e.message, true);
    }
  };

  const handleManualMcq = async (e) => {
    e.preventDefault();
    const options = [optA, optB, optC, optD].filter(Boolean);
    if (!qText.trim() || options.length < 2 || !answer.trim()) return;
    try {
      await createMcqQuestion({
        module_type: moduleType,
        category_name: selectedCategory,
        question_text: qText.trim(),
        options,
        correct_answer: answer.trim(),
        is_active: true,
      });
      setQText(''); setOptA(''); setOptB(''); setOptC(''); setOptD(''); setAnswer('');
      await loadQuestions();
      flash('Question saved to Supabase');
    } catch (e) {
      flash(e.message, true);
    }
  };

  const handleManualCoding = async (e) => {
    e.preventDefault();
    if (!codeDesc.trim()) return;
    let testCases = [];
    try {
      testCases = JSON.parse(codeTests || '[]');
    } catch {
      flash('Test cases must be valid JSON array', true);
      return;
    }
    try {
      await createCodingChallenge({
        difficulty,
        category_name: selectedCategory || 'General',
        title: codeTitle.trim() || codeDesc.slice(0, 60),
        description: codeDesc.trim(),
        test_cases: testCases.map((tc) => ({
          input: String(tc.input ?? ''),
          expected: String(tc.output ?? tc.expected ?? ''),
        })),
        is_active: true,
      });
      setCodeTitle(''); setCodeDesc(''); setCodeTests('');
      await loadQuestions();
      flash('Challenge saved to Supabase');
    } catch (e) {
      flash(e.message, true);
    }
  };

  const importJsonTexts = async (texts) => {
    let allRows = [];
    for (const { name, text } of texts) {
      try {
        if (isCoding) {
          const rows = parseCodingJson(text, difficulty, selectedCategory || 'General');
          allRows = allRows.concat(rows);
        } else {
          const rows = parseMcqJson(text, moduleType, selectedCategory);
          allRows = allRows.concat(rows);
        }
      } catch {
        flash(`Invalid JSON in ${name}`, true);
        return;
      }
    }
    if (!allRows.length) {
      flash('No valid questions found in file(s)', true);
      return;
    }
    try {
      if (isCoding) await bulkCreateCodingChallenges(allRows);
      else await bulkCreateMcqQuestions(allRows);
      await loadQuestions();
      flash(`Imported ${allRows.length} item(s) from ${texts.length} file(s)`);
    } catch (e) {
      flash(e.message, true);
    }
  };

  const handlePasteImport = async () => {
    if (!jsonPaste.trim()) return;
    await importJsonTexts([{ name: 'paste', text: jsonPaste }]);
    setJsonPaste('');
  };

  const handleFiles = async (files) => {
    const texts = await readFilesAsText(files);
    await importJsonTexts(texts);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this question?')) return;
    try {
      if (isCoding) await deleteCodingChallenge(id);
      else await deleteMcqQuestion(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      await loadQuestions();
      flash('Deleted');
    } catch (e) {
      flash(e.message, true);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Permanently delete the ${selectedIds.length} selected question(s)?`)) return;
    setLoading(true);
    try {
      if (isCoding) {
        await bulkDeleteCodingChallenges(selectedIds);
      } else {
        await bulkDeleteMcqQuestions(selectedIds);
      }
      setSelectedIds([]);
      await loadQuestions();
      flash(`Successfully deleted ${selectedIds.length} question(s)`);
    } catch (e) {
      flash(e.message || 'Failed to delete selected questions', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Subject / Category</label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="glass-input text-xs py-2 min-w-[160px]">
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {isCoding && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="glass-input text-xs py-2">
              {['Easy', 'Medium', 'Hard'].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <input
            type="text"
            placeholder="New subject name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="glass-input text-xs py-2 w-40"
          />
          <button type="button" onClick={handleAddCategory} className="px-3 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-800 rounded-xl">
            <Plus className="w-3.5 h-3.5 inline" /> Add
          </button>
        </div>
        <button type="button" onClick={loadQuestions} className="ml-auto flex items-center gap-1 text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <p className="text-xs text-slate-500">{title}</p>

      {msg && <div className="p-3 rounded-xl bg-emerald-500/10 text-xs text-emerald-600 flex gap-2"><CheckCircle className="w-4 h-4" />{msg}</div>}
      {err && <div className="p-3 rounded-xl bg-rose-500/10 text-xs text-rose-600 flex gap-2"><AlertCircle className="w-4 h-4" />{err}</div>}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${dragOver ? 'border-brand-500 bg-brand-500/5' : 'border-slate-300 dark:border-slate-700'}`}
      >
        <Upload className="w-8 h-8 text-brand-500 mx-auto mb-2 opacity-70" />
        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Drag & drop JSON file(s) here</p>
        <p className="text-[10px] text-slate-500 mt-1">Supports multiple files · MCQ: id, question, choices, answer · Coding: id, challenge, test_cases</p>
        <label className="inline-block mt-3 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl cursor-pointer">
          Browse files
          <input type="file" accept=".json,application/json" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </label>
      </div>

      <div className="glass-card p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><FileJson className="w-4 h-4" /> Paste JSON</div>
        <textarea rows={4} value={jsonPaste} onChange={(e) => setJsonPaste(e.target.value)} className="glass-input text-xs font-mono w-full resize-none" placeholder='[{"id":1,"question":"...","choices":["A","B"],"answer":"A"}]' />
        <button type="button" onClick={handlePasteImport} className="text-xs font-bold text-brand-600 hover:underline">Import pasted JSON</button>
      </div>

      {!isCoding ? (
        <form onSubmit={handleManualMcq} className="glass-card p-5 space-y-3 max-w-2xl">
          <div className="text-xs font-bold text-slate-400 uppercase">Add question manually</div>
          <textarea rows={2} value={qText} onChange={(e) => setQText(e.target.value)} className="glass-input text-xs w-full" placeholder="Question text" required />
          <div className="grid grid-cols-2 gap-2">
            {[[optA, setOptA, 'A'], [optB, setOptB, 'B'], [optC, setOptC, 'C'], [optD, setOptD, 'D']].map(([v, set, label]) => (
              <input key={label} value={v} onChange={(e) => set(e.target.value)} className="glass-input text-xs" placeholder={`Option ${label}`} required={label === 'A' || label === 'B'} />
            ))}
          </div>
          <input value={answer} onChange={(e) => setAnswer(e.target.value)} className="glass-input text-xs" placeholder="Correct answer (exact match)" required />
          <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1"><Plus className="w-4 h-4" /> Save</button>
        </form>
      ) : (
        <form onSubmit={handleManualCoding} className="glass-card p-5 space-y-3 max-w-2xl">
          <div className="text-xs font-bold text-slate-400 uppercase">Add coding challenge manually</div>
          <input value={codeTitle} onChange={(e) => setCodeTitle(e.target.value)} className="glass-input text-xs w-full" placeholder="Title (optional)" />
          <textarea rows={3} value={codeDesc} onChange={(e) => setCodeDesc(e.target.value)} className="glass-input text-xs w-full" placeholder="Challenge description" required />
          <textarea rows={3} value={codeTests} onChange={(e) => setCodeTests(e.target.value)} className="glass-input text-xs font-mono w-full" placeholder='[{"input":"2, 3","output":"5"}]' />
          <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1"><Plus className="w-4 h-4" /> Save</button>
        </form>
      )}

      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-400 uppercase flex items-center justify-between">
          <span>Stored questions ({questions.length}) — synced to student app</span>
        </div>

        {questions.length > 0 && !loading && (
          <div className="flex items-center gap-4 py-2 border-b border-slate-200 dark:border-slate-800 text-xs select-none">
            <label className="flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={questions.length > 0 && selectedIds.length === questions.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedIds(questions.map((q) => q.id));
                  } else {
                    setSelectedIds([]);
                  }
                }}
                className="w-4 h-4 rounded text-brand-600 border-slate-300 dark:border-slate-700 bg-transparent cursor-pointer"
              />
              Select All ({questions.length})
            </label>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleBulkDelete}
                className="flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-600 px-2 py-1 rounded bg-rose-500/10 transition-colors ml-auto animate-fade-in"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedIds.length})
              </button>
            )}
          </div>
        )}

        {loading ? (
          <p className="text-xs text-slate-500 animate-pulse">Loading...</p>
        ) : questions.length === 0 ? (
          <p className="text-xs text-slate-500">No questions yet for this subject. Import JSON or add manually.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {questions.map((q) => (
              <div key={q.id} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(q.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds((prev) => [...prev, q.id]);
                      } else {
                        setSelectedIds((prev) => prev.filter((id) => id !== q.id));
                      }
                    }}
                    className="w-4 h-4 rounded text-brand-600 border-slate-300 dark:border-slate-700 bg-transparent shrink-0 mt-0.5 cursor-pointer"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-white truncate">
                      {isCoding ? q.title : q.question_text}
                    </p>
                    {!isCoding && (
                      <p className="text-slate-500 mt-0.5">Answer: {q.correct_answer}</p>
                    )}
                    {isCoding && (
                      <p className="text-slate-500 mt-0.5 line-clamp-2">{q.description}</p>
                    )}
                  </div>
                </div>
                <button type="button" onClick={() => handleDelete(q.id)} className="shrink-0 p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
