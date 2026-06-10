import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw, Save } from 'lucide-react';
import { fetchAllRoadmapTemplates, upsertRoadmapTemplate, deleteRoadmapTemplate } from '../../lib/questionBankService';

const EMPTY_MONTH = {
  month: 'Month 1',
  title: 'Foundations',
  desc: '',
  topics: [{ name: 'Topic 1', status: false }],
};

export default function RoadmapEditor() {
  const [templates, setTemplates] = useState([]);
  const [courseName, setCourseName] = useState('');
  const [months, setMonths] = useState([EMPTY_MONTH]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllRoadmapTemplates();
      setTemplates(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!courseName.trim()) return;
    try {
      await upsertRoadmapTemplate(courseName.trim(), months);
      setMsg('Roadmap template saved');
      setTimeout(() => setMsg(''), 3000);
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  const loadTemplate = (t) => {
    setCourseName(t.course_name);
    setMonths(t.months?.length ? t.months : [EMPTY_MONTH]);
  };

  const addMonth = () => {
    setMonths((prev) => [
      ...prev,
      { ...EMPTY_MONTH, month: `Month ${prev.length + 1}`, title: `Phase ${prev.length + 1}` },
    ]);
  };

  const addTopic = (mi) => {
    setMonths((prev) =>
      prev.map((m, i) =>
        i === mi ? { ...m, topics: [...m.topics, { name: 'New topic', status: false }] } : m
      )
    );
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-slate-500">
        Create syllabus templates students can load. Each topic awards +40 XP once when completed (anti-spam enabled).
      </p>

      {msg && <p className="text-xs text-emerald-600 font-bold">{msg}</p>}

      <div className="flex flex-wrap gap-2">
        <input
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          placeholder="Course name e.g. Java, Full Stack"
          className="glass-input text-sm flex-1 min-w-[200px]"
        />
        <button type="button" onClick={handleSave} className="flex items-center gap-1 bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold">
          <Save className="w-4 h-4" /> Save template
        </button>
        <button type="button" onClick={load} className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-bold">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-4">
        {months.map((m, mi) => (
          <div key={mi} className="glass-card p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input value={m.month} onChange={(e) => setMonths((prev) => prev.map((x, i) => i === mi ? { ...x, month: e.target.value } : x))} className="glass-input text-xs" placeholder="Month label" />
              <input value={m.title} onChange={(e) => setMonths((prev) => prev.map((x, i) => i === mi ? { ...x, title: e.target.value } : x))} className="glass-input text-xs" placeholder="Title" />
              <input value={m.desc} onChange={(e) => setMonths((prev) => prev.map((x, i) => i === mi ? { ...x, desc: e.target.value } : x))} className="glass-input text-xs" placeholder="Description" />
            </div>
            {m.topics.map((t, ti) => (
              <div key={ti} className="flex gap-2">
                <input
                  value={t.name}
                  onChange={(e) =>
                    setMonths((prev) =>
                      prev.map((x, i) =>
                        i === mi
                          ? { ...x, topics: x.topics.map((tp, j) => (j === ti ? { ...tp, name: e.target.value } : tp)) }
                          : x
                      )
                    )
                  }
                  className="glass-input text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={() =>
                    setMonths((prev) =>
                      prev.map((x, i) => (i === mi ? { ...x, topics: x.topics.filter((_, j) => j !== ti) } : x))
                    )
                  }
                  className="p-2 text-rose-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addTopic(mi)} className="text-xs font-bold text-brand-600 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add topic
            </button>
          </div>
        ))}
        <button type="button" onClick={addMonth} className="text-xs font-bold text-brand-600 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Add month
        </button>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-400 uppercase">Saved templates</div>
        {templates.length === 0 ? (
          <p className="text-xs text-slate-500">No templates yet.</p>
        ) : (
          templates.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <button type="button" onClick={() => loadTemplate(t)} className="font-bold text-left hover:text-brand-600">
                {t.course_name} <span className="text-slate-400 font-normal">({t.months?.length || 0} months)</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm('Delete this template?')) return;
                  await deleteRoadmapTemplate(t.id);
                  await load();
                }}
                className="text-rose-500 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
