import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Upload, RefreshCw, CheckCircle, AlertCircle, FileJson } from 'lucide-react';
import {
  fetchHRQuestions,
  createHRQuestion,
  bulkCreateHRQuestions,
  deleteHRQuestion,
  bulkDeleteHRQuestions
} from '../../lib/questionBankService';
import { parseHRQuestionsJson, readFilesAsText } from '../../lib/questionImportParser';

export default function HRQuestionBankEditor() {
  const [companies, setCompanies] = useState(['General', 'TCS', 'Infosys', 'Wipro', 'Google', 'Microsoft', 'Accenture', 'Amazon']);
  const [selectedCompany, setSelectedCompany] = useState('General');
  const [newCompany, setNewCompany] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [qText, setQText] = useState('');
  const [jsonPaste, setJsonPaste] = useState('');

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const rows = await fetchHRQuestions(selectedCompany, { admin: true });
      setQuestions(rows);
    } catch (e) {
      setErr(e.message || 'Failed to load HR questions from Supabase.');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    setSelectedIds([]);
  }, [selectedCompany]);

  const flash = (text, isError = false) => {
    if (isError) setErr(text);
    else setMsg(text);
    setTimeout(() => { setMsg(''); setErr(''); }, 3500);
  };

  const handleAddCompany = () => {
    const cName = newCompany.trim();
    if (!cName) return;
    if (companies.some(c => c.toLowerCase() === cName.toLowerCase())) {
      setSelectedCompany(companies.find(c => c.toLowerCase() === cName.toLowerCase()));
      setNewCompany('');
      return;
    }
    setCompanies(prev => [...prev, cName].sort());
    setSelectedCompany(cName);
    setNewCompany('');
    flash(`Company "${cName}" added to dropdown list`);
  };

  const handleManualSave = async (e) => {
    e.preventDefault();
    if (!qText.trim()) return;
    try {
      await createHRQuestion({
        company_name: selectedCompany,
        question_text: qText.trim(),
        is_active: true
      });
      setQText('');
      await loadQuestions();
      flash('HR Question saved to Supabase');
    } catch (e) {
      flash(e.message || 'Failed to save question', true);
    }
  };

  const importJsonTexts = async (texts) => {
    let allRows = [];
    for (const { name, text } of texts) {
      try {
        const rows = parseHRQuestionsJson(text, selectedCompany);
        allRows = allRows.concat(rows);
      } catch (e) {
        flash(`Invalid JSON structure in ${name}. Make sure it is an array of questions.`, true);
        return;
      }
    }
    if (!allRows.length) {
      flash('No valid questions found in file(s). Make sure they have a "question" or "question_text" field.', true);
      return;
    }
    try {
      await bulkCreateHRQuestions(allRows);
      await loadQuestions();
      flash(`Imported ${allRows.length} HR question(s) successfully!`);
    } catch (e) {
      flash(e.message || 'Failed to bulk import questions', true);
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
    if (!window.confirm('Permanently delete this interview question?')) return;
    try {
      await deleteHRQuestion(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      await loadQuestions();
      flash('Question deleted successfully');
    } catch (e) {
      flash(e.message || 'Failed to delete question', true);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Permanently delete the ${selectedIds.length} selected HR question(s)?`)) return;
    setLoading(true);
    try {
      await bulkDeleteHRQuestions(selectedIds);
      setSelectedIds([]);
      await loadQuestions();
      flash(`Successfully deleted ${selectedIds.length} HR question(s)`);
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
          <label className="text-[10px] font-bold text-slate-500 uppercase">Select Target Company</label>
          <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} className="glass-input text-xs py-2 min-w-[180px]">
            {companies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 items-end">
          <input
            type="text"
            placeholder="Or type custom company..."
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            className="glass-input text-xs py-2 w-48"
          />
          <button type="button" onClick={handleAddCompany} className="px-3 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-800 rounded-xl">
            <Plus className="w-3.5 h-3.5 inline mr-1" /> Add
          </button>
        </div>

        <button type="button" onClick={loadQuestions} className="ml-auto flex items-center gap-1 text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Import HR questions for <strong>{selectedCompany}</strong>. Questions uploaded here will appear dynamically in the student's HR mock interview dashboard.
      </p>

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
        <p className="text-[10px] text-slate-500 mt-1">{"Supports JSON arrays: [\"Question 1\", \"Question 2\"] or [{\"question\": \"Text\"}]"}</p>
        <label className="inline-block mt-3 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl cursor-pointer">
          Browse files
          <input type="file" accept=".json,application/json" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </label>
      </div>

      <div className="glass-card p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><FileJson className="w-4 h-4" /> Paste JSON</div>
        <textarea rows={4} value={jsonPaste} onChange={(e) => setJsonPaste(e.target.value)} className="glass-input text-xs font-mono w-full resize-none" placeholder='["Tell me about a time you led a team.", "Why should we hire you?"]' />
        <button type="button" onClick={handlePasteImport} className="text-xs font-bold text-brand-600 hover:underline">Import pasted JSON</button>
      </div>

      <form onSubmit={handleManualSave} className="glass-card p-5 space-y-3 max-w-2xl">
        <div className="text-xs font-bold text-slate-400 uppercase">Add HR question manually</div>
        <textarea rows={2} value={qText} onChange={(e) => setQText(e.target.value)} className="glass-input text-xs w-full resize-none" placeholder="Enter interview question..." required />
        <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1"><Plus className="w-4 h-4" /> Save Question</button>
      </form>

      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-400 uppercase flex items-center justify-between">
          <span>Stored questions ({questions.length}) — synced live to HR simulator</span>
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
          <p className="text-xs text-slate-500 animate-pulse">Loading questions...</p>
        ) : questions.length === 0 ? (
          <p className="text-xs text-slate-500">No questions seeded for {selectedCompany}. Import a JSON list or add one manually above.</p>
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
                    <p className="font-semibold text-slate-800 dark:text-white leading-relaxed">
                      {q.question_text}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => handleDelete(q.id)} className="shrink-0 p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
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
