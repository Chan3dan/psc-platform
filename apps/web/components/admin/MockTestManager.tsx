'use client';
import { useEffect, useMemo, useState } from 'react';

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function toPercent(v: number) {
  return v <= 1 ? v * 100 : v;
}

interface DistRow {
  subject_id: string;
  count: number;
  difficulty_split: { easy: number; medium: number; hard: number };
}

interface EditDraft {
  _id: string;
  exam_id: string;
  title: string;
  slug: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  negative_percent: number;
  is_active: boolean;
  rows: DistRow[];
}

type ImportedQuestion = {
  question_text: string;
  question_image_url?: string;
  options: Array<{ index: number; text: string; image_url?: string }>;
  correct_answer: number;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  year?: number;
  tags?: string[];
  subject_name?: string;
  subject_id?: string;
  subject?: string;
};

const IMPORT_JSON_TEMPLATE = JSON.stringify(
  [
    {
      subject_name: 'Computer Fundamental',
      question_text: 'Which memory is volatile?',
      options: [
        { index: 0, text: 'ROM' },
        { index: 1, text: 'RAM' },
        { index: 2, text: 'DVD' },
        { index: 3, text: 'SSD' },
      ],
      correct_answer: 1,
      explanation: 'RAM loses data when power is off.',
      difficulty: 'easy',
      year: 2023,
      tags: ['memory', 'past-question'],
      question_image_url: '',
    },
  ],
  null,
  2
);

const IMPORT_CSV_TEMPLATE = [
  'subject_name,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,difficulty,year,tags,question_image_url',
  '"Computer Fundamental","Which memory is volatile?","ROM","RAM","DVD","SSD",1,"RAM loses data when power is off.","easy",2023,"memory|past-question",""',
].join('\n');

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const COMPUTER_OPERATOR_SYLLABUS_50: Record<string, number> = {
  'General Awareness': 10,
  'Public Management': 10,
  'Computer Fundamental': 3,
  'Operating System': 2,
  'Word Processing': 4,
  'Electronic Spreadsheet': 3,
  'Database Management System': 3,
  'Presentation System': 2,
  'Web Designing and Social Media': 2,
  'Computer Network': 2,
  'Cyber Security': 3,
  'Hardware Maintenance and Troubleshooting': 2,
  'Relevant Legislations and Institutions': 4,
};

function buildRowsBySyllabus(subjectList: any[], totalQuestions: number, examSlug?: string): DistRow[] {
  if (!subjectList.length) return [];

  if (examSlug === 'computer-operator') {
    const baseTotal = 50;
    const draft = subjectList.map((s: any, idx: number) => {
      const baseCount = COMPUTER_OPERATOR_SYLLABUS_50[s.name] ?? 0;
      const exact = (baseCount / baseTotal) * totalQuestions;
      const floored = Math.floor(exact);
      return { subject_id: s._id, exact, count: floored, remainder: exact - floored, order: idx };
    });

    let assigned = draft.reduce((sum, r) => sum + r.count, 0);
    let remaining = Math.max(0, totalQuestions - assigned);

    draft.sort((a, b) => b.remainder - a.remainder);
    for (let i = 0; i < draft.length && remaining > 0; i++) {
      draft[i].count += 1;
      remaining -= 1;
    }
    assigned = draft.reduce((sum, r) => sum + r.count, 0);

    if (assigned > totalQuestions) {
      draft.sort((a, b) => a.remainder - b.remainder);
      let over = assigned - totalQuestions;
      for (let i = 0; i < draft.length && over > 0; i++) {
        if (draft[i].count > 0) {
          draft[i].count -= 1;
          over -= 1;
        }
      }
    }

    return draft
      .filter((r) => r.count > 0)
      .sort((a, b) => a.order - b.order)
      .map((r) => ({
        subject_id: r.subject_id,
        count: r.count,
        difficulty_split: { easy: 40, medium: 40, hard: 20 },
      }));
  }

  const baseCount = Math.max(1, Math.floor(totalQuestions / subjectList.length));
  const leftover = totalQuestions - baseCount * subjectList.length;
  return subjectList.map((s: any, i: number) => ({
    subject_id: s._id,
    count: baseCount + (i < leftover ? 1 : 0),
    difficulty_split: { easy: 40, medium: 40, hard: 20 },
  }));
}

function parseCsvLine(line: string) {
  const out: string[] = [];
  let curr = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') { curr += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(curr);
      curr = '';
    } else curr += ch;
  }
  out.push(curr);
  return out.map((x) => x.trim());
}

function csvToQuestions(csv: string): ImportedQuestion[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (name: string) => headers.indexOf(name);

  const qi = idx('question_text');
  const a = idx('option_a');
  const b = idx('option_b');
  const c = idx('option_c');
  const d = idx('option_d');
  const ca = idx('correct_answer');
  if (qi < 0 || a < 0 || b < 0 || c < 0 || d < 0 || ca < 0) {
    throw new Error('CSV must include: question_text, option_a..option_d, correct_answer');
  }

  const out: ImportedQuestion[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const rawCorrect = String(cols[ca] ?? '').trim().toUpperCase();
    const correct =
      rawCorrect === 'A' ? 0 :
      rawCorrect === 'B' ? 1 :
      rawCorrect === 'C' ? 2 :
      rawCorrect === 'D' ? 3 :
      Number(rawCorrect);

    out.push({
      question_text: String(cols[qi] ?? '').trim(),
      options: [
        { index: 0, text: String(cols[a] ?? '').trim() },
        { index: 1, text: String(cols[b] ?? '').trim() },
        { index: 2, text: String(cols[c] ?? '').trim() },
        { index: 3, text: String(cols[d] ?? '').trim() },
      ],
      correct_answer: Number.isFinite(correct) ? correct : -1,
      explanation: idx('explanation') >= 0 ? String(cols[idx('explanation')] ?? '').trim() : '',
      difficulty: (idx('difficulty') >= 0 ? String(cols[idx('difficulty')] ?? '').trim().toLowerCase() : 'medium') as any,
      year: idx('year') >= 0 && String(cols[idx('year')] ?? '').trim() ? Number(cols[idx('year')]) : undefined,
      tags: idx('tags') >= 0 ? String(cols[idx('tags')] ?? '').split('|').map((t) => t.trim()).filter(Boolean) : ['past-question'],
      subject_name: idx('subject_name') >= 0 ? String(cols[idx('subject_name')] ?? '').trim() : '',
      question_image_url: idx('question_image_url') >= 0 ? String(cols[idx('question_image_url')] ?? '').trim() : '',
    });
  }
  return out;
}

function DistEditor({
  rows,
  setRows,
  subjects,
  totalQuestions,
}: {
  rows: DistRow[];
  setRows: React.Dispatch<React.SetStateAction<DistRow[]>>;
  subjects: any[];
  totalQuestions: number;
}) {
  const totalCount = useMemo(() => rows.reduce((s, r) => s + (Number(r.count) || 0), 0), [rows]);

  return (
    <div className="card p-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-[var(--text)]">Subject Distribution</p>
        <p className={`text-xs ${totalCount === totalQuestions ? 'text-emerald-600' : 'text-amber-600'}`}>
          Total selected: {totalCount} / {totalQuestions}
        </p>
      </div>
      <div className="hidden md:grid grid-cols-6 gap-2 px-1 mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        <span className="md:col-span-2">Subject</span>
        <span>Questions</span>
        <span>Easy %</span>
        <span>Medium %</span>
        <span>Hard %</span>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {rows.map((r, i) => (
          <div key={`${r.subject_id}-${i}`} className="grid grid-cols-1 md:grid-cols-6 gap-2 rounded-2xl border border-[var(--line)] p-3 md:p-0 md:border-0">
            <select
              className="input text-sm md:col-span-2"
              value={r.subject_id}
              onChange={(e) => setRows((prev) => prev.map((x, idx) => idx === i ? { ...x, subject_id: e.target.value } : x))}
            >
              {subjects.map((s) => <option key={s._id} value={s._id}>{s.name ?? 'Unnamed Subject'}</option>)}
            </select>
            <input
              className="input text-sm"
              type="number"
              value={r.count}
              onChange={(e) => setRows((prev) => prev.map((x, idx) => idx === i ? { ...x, count: Number(e.target.value) || 0 } : x))}
              placeholder="Questions"
            />
            <input
              className="input text-sm"
              type="number"
              value={r.difficulty_split.easy}
              onChange={(e) => setRows((prev) => prev.map((x, idx) => idx === i ? { ...x, difficulty_split: { ...x.difficulty_split, easy: Number(e.target.value) || 0 } } : x))}
              placeholder="Easy%"
            />
            <input
              className="input text-sm"
              type="number"
              value={r.difficulty_split.medium}
              onChange={(e) => setRows((prev) => prev.map((x, idx) => idx === i ? { ...x, difficulty_split: { ...x.difficulty_split, medium: Number(e.target.value) || 0 } } : x))}
              placeholder="Medium%"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className="input text-sm"
                type="number"
                value={r.difficulty_split.hard}
                onChange={(e) => setRows((prev) => prev.map((x, idx) => idx === i ? { ...x, difficulty_split: { ...x.difficulty_split, hard: Number(e.target.value) || 0 } } : x))}
                placeholder="Hard%"
              />
              <button className="btn-secondary px-3 text-xs" onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        className="btn-secondary mt-3 text-sm"
        onClick={() => setRows((prev) => [...prev, {
          subject_id: subjects[0]?._id ?? '',
          count: 1,
          difficulty_split: { easy: 40, medium: 40, hard: 20 },
        }])}
      >
        + Add Distribution Row
      </button>
    </div>
  );
}

export function MockTestManager({ exams, initialMocks }: { exams: any[]; initialMocks: any[] }) {
  const [mocks, setMocks] = useState<any[]>(initialMocks);
  const [examId, setExamId] = useState(exams[0]?._id ?? '');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [duration, setDuration] = useState(45);
  const [totalQuestions, setTotalQuestions] = useState(50);
  const [totalMarks, setTotalMarks] = useState(100);
  const [negativePercent, setNegativePercent] = useState(20);
  const [rows, setRows] = useState<DistRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [examFilter, setExamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [existingModalOpen, setExistingModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'json' | 'csv'>('json');
  const [importTitle, setImportTitle] = useState('');
  const [importSlug, setImportSlug] = useState('');
  const [importDuration, setImportDuration] = useState(45);
  const [importTotalMarks, setImportTotalMarks] = useState(0);
  const [importNegativePercent, setImportNegativePercent] = useState(20);
  const [importDefaultSubject, setImportDefaultSubject] = useState('');
  const [importText, setImportText] = useState('');
  const [importQuestions, setImportQuestions] = useState<ImportedQuestion[] | null>(null);
  const [importErr, setImportErr] = useState('');
  const [importing, setImporting] = useState(false);
  const [showImportTemplate, setShowImportTemplate] = useState(false);

  const [editing, setEditing] = useState<EditDraft | null>(null);
  const [editSubjects, setEditSubjects] = useState<any[]>([]);
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const createMarksPerQuestion = useMemo(
    () => (totalQuestions > 0 ? totalMarks / totalQuestions : 0),
    [totalMarks, totalQuestions]
  );
  const createNegativePerWrong = useMemo(
    () => parseFloat(((createMarksPerQuestion * negativePercent) / 100).toFixed(4)),
    [createMarksPerQuestion, negativePercent]
  );

  const filteredMocks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mocks.filter((m) => {
      const examName = String(m.exam_id?.name ?? '').toLowerCase();
      const titleMatch = String(m.title ?? '').toLowerCase();
      const slugMatch = String(m.slug ?? '').toLowerCase();
      const textOk = !q || titleMatch.includes(q) || slugMatch.includes(q) || examName.includes(q);
      const examOk = examFilter === 'all' || String(m.exam_id?._id ?? m.exam_id) === examFilter;
      const statusOk = statusFilter === 'all' || (statusFilter === 'active' ? m.is_active : !m.is_active);
      return textOk && examOk && statusOk;
    });
  }, [mocks, search, examFilter, statusFilter]);

  useEffect(() => {
    if (!title) return;
    setSlug(slugify(title));
  }, [title]);
  useEffect(() => {
    if (!importTitle) return;
    setImportSlug(slugify(importTitle));
  }, [importTitle]);

  useEffect(() => {
    if (!examId) return;
    const exam = exams.find((e: any) => e._id === examId);
    const examNegative = Number(exam?.negative_marking ?? 20);
    setNegativePercent(examNegative <= 1 ? examNegative * 100 : examNegative);

    fetch(`/api/subjects?exam_id=${examId}`)
      .then((r) => r.json())
      .then((d) => {
        const list = d.success ? d.data : [];
        setSubjects(list);
        if (list.length && !importDefaultSubject) setImportDefaultSubject(list[0]._id);
        if (list.length) setRows(buildRowsBySyllabus(list, totalQuestions, exam?.slug));
        else setRows([]);
      })
      .catch(() => setSubjects([]));
  }, [examId, totalQuestions, exams, importDefaultSubject]);

  async function createMock() {
    if (!examId || !title || !slug) {
      setError('Exam, title and slug are required.');
      return;
    }
    if (!rows.length) {
      setError('Add at least one subject distribution row.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/mock-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: examId,
          title,
          slug,
          duration_minutes: duration,
          total_questions: totalQuestions,
          total_marks: totalMarks,
          negative_marking: negativePercent,
          subject_distribution: rows,
        }),
      });
      const d = await res.json();
      if (!d.success) {
        setError(d.error ?? 'Failed to create mock');
        return;
      }
      setMocks((prev) => [d.data, ...prev]);
      setTitle('');
      setSlug('');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch(`/api/mock-tests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    });
    const d = await res.json();
    if (d.success) {
      setMocks((prev) => prev.map((m) => (m._id === id ? d.data : m)));
    }
  }

  async function removeMock(id: string) {
    const res = await fetch(`/api/mock-tests/${id}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) {
      setMocks((prev) => prev.filter((m) => m._id !== id));
    }
  }

  async function openEdit(mock: any) {
    const examValue = String(mock.exam_id?._id ?? mock.exam_id ?? '');
    const dist = Array.isArray(mock?.config?.subject_distribution)
      ? mock.config.subject_distribution.map((d: any) => ({
          subject_id: String(d?.subject_id?._id ?? d?.subject_id ?? ''),
          count: Number(d?.count ?? 0),
          difficulty_split: {
            easy: Number(d?.difficulty_split?.easy ?? 40),
            medium: Number(d?.difficulty_split?.medium ?? 40),
            hard: Number(d?.difficulty_split?.hard ?? 20),
          },
        }))
      : [];

    setEditing({
      _id: mock._id,
      exam_id: examValue,
      title: String(mock.title ?? ''),
      slug: String(mock.slug ?? ''),
      duration_minutes: Number(mock.duration_minutes ?? 45),
      total_questions: Number(mock.total_questions ?? 50),
      total_marks: Number(mock.total_marks ?? 100),
      negative_percent: toPercent(Number(mock.negative_marking ?? 20)),
      is_active: Boolean(mock.is_active),
      rows: dist,
    });
    setEditError('');
    setEditSubjects([]);

    const res = await fetch(`/api/subjects?exam_id=${examValue}`);
    const data = await res.json();
    const list = data.success ? data.data : [];
    setEditSubjects(list);
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editing.title || !editing.slug) {
      setEditError('Title and slug are required.');
      return;
    }
    if (!editing.rows.length) {
      setEditError('At least one distribution row is required.');
      return;
    }

    setUpdating(true);
    setEditError('');
    try {
      const res = await fetch(`/api/mock-tests/${editing._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: editing.exam_id,
          title: editing.title,
          slug: editing.slug,
          duration_minutes: editing.duration_minutes,
          total_questions: editing.total_questions,
          total_marks: editing.total_marks,
          negative_marking: editing.negative_percent,
          is_active: editing.is_active,
          subject_distribution: editing.rows,
        }),
      });
      const d = await res.json();
      if (!d.success) {
        setEditError(d.error ?? 'Failed to update mock');
        return;
      }
      setMocks((prev) => prev.map((m) => (m._id === editing._id ? d.data : m)));
      setEditing(null);
      setEditSubjects([]);
    } finally {
      setUpdating(false);
    }
  }

  function validateImported(data: ImportedQuestion[]) {
    for (let i = 0; i < data.length; i++) {
      const q = data[i];
      if (!q.question_text?.trim()) throw new Error(`Q${i + 1}: question_text required`);
      if (!Array.isArray(q.options) || q.options.length !== 4) throw new Error(`Q${i + 1}: 4 options required`);
      for (let j = 0; j < 4; j++) if (!q.options[j]?.text?.trim()) throw new Error(`Q${i + 1}: option ${j + 1} required`);
      if (typeof q.correct_answer !== 'number' || q.correct_answer < 0 || q.correct_answer > 3) throw new Error(`Q${i + 1}: correct_answer must be 0-3 (or A-D in CSV)`);
    }
  }

  async function pickImportFile(file: File | null) {
    if (!file) return;
    const text = await file.text();
    const name = file.name.toLowerCase();
    setImportErr('');
    setImportQuestions(null);
    if (name.endsWith('.json')) {
      setImportMode('json');
      setImportText(text);
      return;
    }
    if (name.endsWith('.csv')) {
      setImportMode('csv');
      try {
        const arr = csvToQuestions(text);
        validateImported(arr);
        setImportQuestions(arr);
      } catch (e: any) {
        setImportErr(e.message);
      }
      return;
    }
    setImportErr('Unsupported file type. Use .json or .csv');
  }

  function validateImportText() {
    setImportErr('');
    setImportQuestions(null);
    try {
      const parsed = JSON.parse(importText);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      validateImported(arr);
      setImportQuestions(arr);
    } catch (e: any) {
      setImportErr(e.message);
    }
  }

  async function createPastMockFromImport() {
    if (!examId) { setImportErr('Select exam first'); return; }
    if (!importTitle.trim()) { setImportErr('Title is required'); return; }
    if (!importQuestions || importQuestions.length === 0) { setImportErr('Import and validate questions first'); return; }
    if (!importDefaultSubject) {
      const missingSubjectRow = importQuestions.findIndex((q) => {
        return !String(q.subject_id ?? '').trim() && !String(q.subject_name ?? '').trim() && !String(q.subject ?? '').trim();
      });
      if (missingSubjectRow >= 0) {
        setImportErr(`Row ${missingSubjectRow + 1}: subject missing. Provide subject_name/subject_id in file or choose fallback subject.`);
        return;
      }
    }

    setImporting(true);
    setImportErr('');
    try {
      const res = await fetch('/api/mock-tests/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: examId,
          title: importTitle,
          slug: importSlug,
          duration_minutes: importDuration,
          total_marks: importTotalMarks > 0 ? importTotalMarks : undefined,
          negative_marking: importNegativePercent,
          default_subject_id: importDefaultSubject || undefined,
          questions: importQuestions,
        }),
      });
      const d = await res.json();
      if (!d.success) { setImportErr(d.error ?? 'Import failed'); return; }
      setMocks((prev) => [d.data.mock, ...prev]);
      setImportModalOpen(false);
      setImportTitle('');
      setImportSlug('');
      setImportText('');
      setImportQuestions(null);
      setImportErr('');
    } finally {
      setImporting(false);
    }
  }

  const editMarksPerQuestion = editing?.total_questions
    ? editing.total_marks / editing.total_questions
    : 0;
  const editNegativePerWrong = parseFloat(((editMarksPerQuestion * (editing?.negative_percent ?? 0)) / 100).toFixed(4));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
        <button className="btn-secondary shrink-0 w-full sm:w-auto" onClick={() => setImportModalOpen(true)}>
          Import Past Mock (CSV/JSON)
        </button>
        <button className="btn-secondary shrink-0 w-full sm:w-auto" onClick={() => setExistingModalOpen(true)}>
          Existing Mock Tests
        </button>
      </div>

      <div className="card glass p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">Mock Tests</h2>
          <p className="text-sm text-[var(--muted)]">Create and manage mock tests with chapter-wise distribution.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="label">Exam</label>
            <select className="input" value={examId} onChange={(e) => setExamId(e.target.value)}>
              {exams.map((e: any) => (
                <option key={e._id} value={e._id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Computer Operator Model Mock #1" />
          </div>
          <div>
            <label className="label">Slug</label>
            <input className="input font-mono text-sm" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div>
            <label className="label">Duration (min)</label>
            <input type="number" className="input" value={duration} onChange={(e) => setDuration(Number(e.target.value) || 45)} />
          </div>
          <div>
            <label className="label">Total Questions</label>
            <input type="number" className="input" value={totalQuestions} onChange={(e) => setTotalQuestions(Number(e.target.value) || 50)} />
          </div>
          <div>
            <label className="label">Total Marks</label>
            <input type="number" className="input" value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value) || 100)} />
          </div>
          <div>
            <label className="label">Negative Marking (%)</label>
            <input type="number" step="0.1" className="input" value={negativePercent} onChange={(e) => setNegativePercent(Number(e.target.value) || 0)} />
          </div>
        </div>
        <p className="text-xs text-[var(--muted)]">
          Deduction per wrong: <span className="font-semibold text-[var(--text)]">{createNegativePerWrong}</span> ({negativePercent}% of {createMarksPerQuestion.toFixed(2)} marks/question)
        </p>

        <DistEditor rows={rows} setRows={setRows} subjects={subjects} totalQuestions={totalQuestions} />

        {error && <p className="text-sm text-red-500">{error}</p>}
        <button className="btn-primary w-full sm:w-auto" onClick={createMock} disabled={saving}>
          {saving ? 'Creating...' : 'Create Mock Test'}
        </button>
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-[3px] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}
        >
          <div className="w-full max-w-5xl max-h-[100dvh] md:max-h-[92vh] overflow-y-auto card glass rounded-none md:rounded-2xl p-4 md:p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-[var(--text)]">Edit Mock Test</h3>
              <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => setEditing(null)}>Close</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="label">Exam</label>
                <select
                  className="input"
                  value={editing.exam_id}
                  onChange={async (e) => {
                    const nextExamId = e.target.value;
                    const exam = exams.find((x: any) => x._id === nextExamId);
                    const res = await fetch(`/api/subjects?exam_id=${nextExamId}`);
                    const data = await res.json();
                    const list = data.success ? data.data : [];
                    setEditSubjects(list);
                    setEditing((prev) => prev ? ({
                      ...prev,
                      exam_id: nextExamId,
                      rows: buildRowsBySyllabus(list, prev.total_questions, exam?.slug),
                    }) : prev);
                  }}
                >
                  {exams.map((e: any) => <option key={e._id} value={e._id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Title</label>
                <input className="input" value={editing.title} onChange={(e) => setEditing((p) => p ? { ...p, title: e.target.value } : p)} />
              </div>
              <div>
                <label className="label">Slug</label>
                <input className="input font-mono text-sm" value={editing.slug} onChange={(e) => setEditing((p) => p ? { ...p, slug: e.target.value } : p)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <div>
                <label className="label">Duration (min)</label>
                <input type="number" className="input" value={editing.duration_minutes} onChange={(e) => setEditing((p) => p ? { ...p, duration_minutes: Number(e.target.value) || 45 } : p)} />
              </div>
              <div>
                <label className="label">Total Questions</label>
                <input type="number" className="input" value={editing.total_questions} onChange={(e) => setEditing((p) => p ? { ...p, total_questions: Number(e.target.value) || 50 } : p)} />
              </div>
              <div>
                <label className="label">Total Marks</label>
                <input type="number" className="input" value={editing.total_marks} onChange={(e) => setEditing((p) => p ? { ...p, total_marks: Number(e.target.value) || 100 } : p)} />
              </div>
              <div>
                <label className="label">Negative Marking (%)</label>
                <input type="number" step="0.1" className="input" value={editing.negative_percent} onChange={(e) => setEditing((p) => p ? { ...p, negative_percent: Number(e.target.value) || 0 } : p)} />
              </div>
            </div>

            <p className="text-xs text-[var(--muted)]">
              Deduction per wrong: <span className="font-semibold text-[var(--text)]">{editNegativePerWrong}</span> ({editing.negative_percent}% of {editMarksPerQuestion.toFixed(2)} marks/question)
            </p>

            <DistEditor rows={editing.rows} setRows={(next) => setEditing((p) => p ? { ...p, rows: typeof next === 'function' ? next(p.rows) : next } : p)} subjects={editSubjects} totalQuestions={editing.total_questions} />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {editError ? <p className="text-sm text-red-500">{editError}</p> : <div />}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <button className="btn-secondary text-sm" onClick={() => setEditing((p) => p ? { ...p, slug: slugify(p.title) } : p)}>Regenerate Slug</button>
                <button className="btn-primary text-sm" onClick={saveEdit} disabled={updating}>
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {existingModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-[3px] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setExistingModalOpen(false); }}
        >
          <div className="w-full max-w-6xl max-h-[100dvh] md:max-h-[92vh] overflow-y-auto card glass rounded-none md:rounded-2xl p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-[var(--text)]">Existing Mock Tests</h3>
              <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => setExistingModalOpen(false)}>Close</button>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
              <input
                className="input md:col-span-2"
                placeholder="Search title / slug / exam..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="input" value={examFilter} onChange={(e) => setExamFilter(e.target.value)}>
                <option value="all">All Exams</option>
                {exams.map((e: any) => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
              <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-3">
              {filteredMocks.map((m) => {
                const marksPerQ = m.total_questions ? m.total_marks / m.total_questions : 0;
                const negPct = toPercent(Number(m.negative_marking ?? 20));
                const negPerWrong = ((marksPerQ * negPct) / 100).toFixed(2);
                return (
                  <div key={m._id} className="card p-4 border border-[var(--line)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-[var(--muted)]">{m.exam_id?.name}</p>
                        <p className="font-semibold text-[var(--text)] truncate">{m.title}</p>
                        <p className="text-xs text-[var(--muted)] mt-0.5">slug: {m.slug}</p>
                      </div>
                      <span className={`badge text-xs ${m.is_active ? 'badge-green' : 'badge-gray'}`}>{m.is_active ? 'active' : 'inactive'}</span>
                    </div>
                    <div className="mt-3 text-xs text-[var(--muted)] grid grid-cols-2 gap-y-1">
                      <span>Duration: {m.duration_minutes}m</span>
                      <span>Questions: {m.total_questions}</span>
                      <span>Total marks: {m.total_marks}</span>
                      <span>Negative: {negPct}% ({negPerWrong}/wrong)</span>
                    </div>
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                      <button className="btn-secondary text-xs px-3 py-1.5 w-full sm:w-auto" onClick={() => openEdit(m)}>Edit</button>
                      <button className="btn-secondary text-xs px-3 py-1.5 w-full sm:w-auto" onClick={() => toggleActive(m._id, m.is_active)}>
                        {m.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300 w-full sm:w-auto"
                        onClick={() => setDeleteTarget({ id: m._id, title: m.title })}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-[3px] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
        >
          <div className="w-full max-w-md card glass p-5 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text)]">Delete Mock Test</h3>
              <p className="text-sm text-[var(--muted)] mt-1">
                This will permanently delete <span className="font-semibold text-[var(--text)]">{deleteTarget.title}</span>.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                onClick={async () => {
                  const target = deleteTarget;
                  setDeleteTarget(null);
                  if (!target) return;
                  await removeMock(target.id);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {importModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-[3px] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setImportModalOpen(false); }}
        >
          <div className="w-full max-w-4xl max-h-[100dvh] md:max-h-[92vh] overflow-y-auto card glass rounded-none md:rounded-2xl p-4 md:p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-[var(--text)]">Import Past Questions as Mock Test</h3>
              <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => setImportModalOpen(false)}>Close</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="label">Exam</label>
                <select className="input" value={examId} onChange={(e) => setExamId(e.target.value)}>
                  {exams.map((e: any) => (
                    <option key={e._id} value={e._id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Title</label>
                <input className="input" value={importTitle} onChange={(e) => setImportTitle(e.target.value)} placeholder="Computer Operator Past Paper Mock 2080" />
              </div>
              <div>
                <label className="label">Slug</label>
                <input className="input font-mono text-sm" value={importSlug} onChange={(e) => setImportSlug(e.target.value)} />
              </div>
              <div>
                <label className="label">Fallback Subject</label>
                <select className="input" value={importDefaultSubject} onChange={(e) => setImportDefaultSubject(e.target.value)}>
                  <option value="">None (subject must come from file)</option>
                  {subjects.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Fallback Subject is optional. It is only used when a row in CSV/JSON has no `subject_name`/`subject_id`.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <div>
                <label className="label">Duration (min)</label>
                <input type="number" className="input" value={importDuration} onChange={(e) => setImportDuration(Number(e.target.value) || 45)} />
              </div>
              <div>
                <label className="label">Total Marks (optional)</label>
                <input type="number" className="input" value={importTotalMarks || ''} onChange={(e) => setImportTotalMarks(Number(e.target.value) || 0)} placeholder="Auto if empty" />
              </div>
              <div>
                <label className="label">Negative Marking (%)</label>
                <input type="number" step="0.1" className="input" value={importNegativePercent} onChange={(e) => setImportNegativePercent(Number(e.target.value) || 0)} />
              </div>
              <div>
                <label className="label">Format</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button className={`btn-secondary text-xs px-3 py-2 ${importMode === 'json' ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setImportMode('json')}>JSON</button>
                  <button className={`btn-secondary text-xs px-3 py-2 ${importMode === 'csv' ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setImportMode('csv')}>CSV</button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
              <label className="btn-secondary text-xs px-3 py-1.5 cursor-pointer">
                Select File (.json/.csv)
                <input
                  type="file"
                  accept=".json,.csv,text/csv,application/json"
                  className="hidden"
                  onChange={(e) => pickImportFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <button
                className="btn-secondary text-xs px-3 py-1.5"
                onClick={() => downloadText('past-mock-template.json', IMPORT_JSON_TEMPLATE, 'application/json')}
              >
                Download JSON Template
              </button>
              <button
                className="btn-secondary text-xs px-3 py-1.5"
                onClick={() => downloadText('past-mock-template.csv', IMPORT_CSV_TEMPLATE, 'text/csv')}
              >
                Download CSV Template
              </button>
              <button
                className="btn-secondary text-xs px-3 py-1.5"
                onClick={() => {
                  setImportMode('json');
                  setImportText(IMPORT_JSON_TEMPLATE);
                  setShowImportTemplate((v) => !v);
                  setImportErr('');
                  setImportQuestions(null);
                }}
              >
                {showImportTemplate ? 'Hide Template' : 'View Template'}
              </button>
              {importMode === 'json' && (
                <button className="btn-secondary text-xs px-3 py-1.5" onClick={validateImportText}>
                  Validate JSON
                </button>
              )}
            </div>

            {importMode === 'json' && (
              <textarea
                className="input font-mono text-xs resize-none"
                rows={10}
                value={importText}
                onChange={(e) => { setImportText(e.target.value); setImportErr(''); setImportQuestions(null); }}
                placeholder="Paste JSON array with question_text, options[4], correct_answer..."
              />
            )}

            {importErr && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-lg">⚠ {importErr}</p>}
            {importQuestions && <p className="text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-3 py-2 rounded-lg">✓ {importQuestions.length} questions ready to import</p>}

            <div className="flex justify-end">
              <button className="btn-primary w-full sm:w-auto" onClick={createPastMockFromImport} disabled={importing || !importQuestions?.length}>
                {importing ? 'Importing...' : 'Create Past Mock Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
