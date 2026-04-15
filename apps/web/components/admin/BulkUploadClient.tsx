'use client';
import { useEffect, useMemo, useState } from 'react';

const JSON_TEMPLATE = JSON.stringify(
  [
    {
      question_text: 'Which of the following is NOT an input device?',
      question_image_url: '',
      options: [
        { index: 0, text: 'Mouse', image_url: '' },
        { index: 1, text: 'Keyboard', image_url: '' },
        { index: 2, text: 'Monitor', image_url: '' },
        { index: 3, text: 'Scanner', image_url: '' },
      ],
      correct_answer: 2,
      explanation: 'Monitor is an output device.',
      difficulty: 'easy',
      year: 2023,
      tags: ['hardware', 'devices'],
    },
  ],
  null,
  2
);

const CSV_TEMPLATE = [
  'question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,difficulty,year,tags,question_image_url,option_a_image_url,option_b_image_url,option_c_image_url,option_d_image_url',
  '"Which device is an output device?","Mouse","Keyboard","Monitor","Scanner",2,"Monitor displays output.","easy",2023,"hardware|devices","","","","",""',
].join('\n');

type ParsedQuestion = {
  question_text: string;
  question_image_url?: string;
  options: Array<{ index: number; text: string; image_url?: string }>;
  correct_answer: number;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  year?: number;
  tags?: string[];
};

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

function parseCsvLine(line: string) {
  const out: string[] = [];
  let curr = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        curr += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(curr);
      curr = '';
    } else {
      curr += ch;
    }
  }
  out.push(curr);
  return out.map((x) => x.trim());
}

function csvToQuestions(csv: string): ParsedQuestion[] {
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

  const out: ParsedQuestion[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const rawCorrect = String(cols[ca] ?? '').trim().toUpperCase();
    const correct =
      rawCorrect === 'A' ? 0 :
      rawCorrect === 'B' ? 1 :
      rawCorrect === 'C' ? 2 :
      rawCorrect === 'D' ? 3 :
      Number(rawCorrect);

    const q: ParsedQuestion = {
      question_text: String(cols[qi] ?? '').trim(),
      question_image_url: idx('question_image_url') >= 0 ? String(cols[idx('question_image_url')] ?? '').trim() : '',
      options: [
        { index: 0, text: String(cols[a] ?? '').trim(), image_url: idx('option_a_image_url') >= 0 ? String(cols[idx('option_a_image_url')] ?? '').trim() : '' },
        { index: 1, text: String(cols[b] ?? '').trim(), image_url: idx('option_b_image_url') >= 0 ? String(cols[idx('option_b_image_url')] ?? '').trim() : '' },
        { index: 2, text: String(cols[c] ?? '').trim(), image_url: idx('option_c_image_url') >= 0 ? String(cols[idx('option_c_image_url')] ?? '').trim() : '' },
        { index: 3, text: String(cols[d] ?? '').trim(), image_url: idx('option_d_image_url') >= 0 ? String(cols[idx('option_d_image_url')] ?? '').trim() : '' },
      ],
      correct_answer: Number.isFinite(correct) ? correct : -1,
      explanation: idx('explanation') >= 0 ? String(cols[idx('explanation')] ?? '').trim() : '',
      difficulty: (idx('difficulty') >= 0 ? String(cols[idx('difficulty')] ?? '').trim().toLowerCase() : 'medium') as any,
      year: idx('year') >= 0 && String(cols[idx('year')] ?? '').trim() ? Number(cols[idx('year')]) : undefined,
      tags:
        idx('tags') >= 0
          ? String(cols[idx('tags')] ?? '')
              .split('|')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
    };
    out.push(q);
  }
  return out;
}

export function BulkUploadClient({ exams }: { exams: any[] }) {
  const [examId, setExamId] = useState(exams[0]?._id ?? '');
  const [subjectId, setSubjectId] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);

  const [jsonText, setJsonText] = useState('');
  const [parsed, setParsed] = useState<ParsedQuestion[] | null>(null);
  const [parseErr, setParseErr] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState('');
  const [uploadMode, setUploadMode] = useState<'json' | 'csv'>('json');

  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [exporting, setExporting] = useState(false);

  async function loadSubjects(eid: string) {
    setExamId(eid);
    if (!eid) {
      setSubjects([]);
      setSubjectId('');
      return;
    }
    const r = await fetch(`/api/subjects?exam_id=${eid}`);
    const d = await r.json();
    if (d.success) {
      setSubjects(d.data);
      setSubjectId(d.data[0]?._id ?? '');
    }
  }

  useEffect(() => {
    if (examId && subjects.length === 0) {
      loadSubjects(examId);
    }
  }, [examId, subjects.length]);

  const parsedCount = parsed?.length ?? 0;
  const selectedSubjectName = useMemo(() => subjects.find((s) => s._id === subjectId)?.name ?? '', [subjects, subjectId]);

  function validateParsed(data: ParsedQuestion[]) {
    for (let i = 0; i < data.length; i++) {
      const q = data[i];
      if (!q.question_text?.trim()) throw new Error(`Q${i + 1}: question_text required`);
      if (!Array.isArray(q.options) || q.options.length !== 4) throw new Error(`Q${i + 1}: exactly 4 options required`);
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j]?.text?.trim()) throw new Error(`Q${i + 1}: option ${j + 1} text required`);
      }
      if (typeof q.correct_answer !== 'number' || q.correct_answer < 0 || q.correct_answer > 3) {
        throw new Error(`Q${i + 1}: correct_answer must be 0-3 (or A-D in CSV)`);
      }
      if (q.difficulty && !['easy', 'medium', 'hard'].includes(q.difficulty)) {
        throw new Error(`Q${i + 1}: difficulty must be easy/medium/hard`);
      }
    }
  }

  function validateFromJsonText() {
    setParseErr('');
    setParsed(null);
    try {
      const arr = JSON.parse(jsonText);
      const data = Array.isArray(arr) ? arr : [arr];
      validateParsed(data);
      setParsed(data);
    } catch (e: any) {
      setParseErr(e.message);
    }
  }

  function validateFromCsvText(csv: string) {
    setParseErr('');
    setParsed(null);
    try {
      const data = csvToQuestions(csv);
      validateParsed(data);
      setParsed(data);
    } catch (e: any) {
      setParseErr(e.message);
    }
  }

  async function onFilePick(file: File | null) {
    if (!file) return;
    const name = file.name.toLowerCase();
    const text = await file.text();
    if (name.endsWith('.json')) {
      setUploadMode('json');
      setJsonText(text);
      setParsed(null);
      setParseErr('');
      return;
    }
    if (name.endsWith('.csv')) {
      setUploadMode('csv');
      validateFromCsvText(text);
      return;
    }
    setParseErr('Unsupported file type. Use .json or .csv');
  }

  async function upload() {
    if (!parsed || !examId || !subjectId) return;
    setUploading(true);
    setResult('');
    try {
      const payload = parsed.map((q) => ({ ...q, exam_id: examId, subject_id: subjectId }));
      const r = await fetch('/api/questions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: payload }),
      });
      const d = await r.json();
      setResult(d.success ? `✓ ${d.data.inserted} questions uploaded successfully` : `Error: ${d.error}`);
      if (d.success) {
        setJsonText('');
        setParsed(null);
      }
    } finally {
      setUploading(false);
    }
  }

  async function exportQuestions() {
    setExporting(true);
    setResult('');
    try {
      const q = new URLSearchParams();
      q.set('format', exportFormat);
      if (examId) q.set('exam_id', examId);
      if (subjectId) q.set('subject_id', subjectId);
      q.set('limit', '20000');
      const r = await fetch(`/api/questions/export?${q.toString()}`);
      if (!r.ok) {
        const tx = await r.text();
        setResult(`Error: export failed (${tx || r.status})`);
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const suffix = `${(selectedSubjectName || 'all-subjects').toLowerCase().replace(/\s+/g, '-')}.${exportFormat}`;
      a.href = url;
      a.download = `question-export-${suffix}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setResult('✓ Export completed');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Exam</label>
          <select value={examId} onChange={(e) => loadSubjects(e.target.value)} className="input">
            {exams.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Subject</label>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="input" disabled={!subjects.length}>
            {subjects.length === 0 && <option>Select exam first</option>}
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <p className="text-sm font-semibold text-[var(--text)]">Import Questions</p>
          <div className="flex items-center gap-2">
            <button className={`btn-secondary text-xs px-3 py-1.5 ${uploadMode === 'json' ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setUploadMode('json')}>
              JSON
            </button>
            <button className={`btn-secondary text-xs px-3 py-1.5 ${uploadMode === 'csv' ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setUploadMode('csv')}>
              CSV
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="btn-secondary text-xs px-3 py-1.5 cursor-pointer">
            Import File (.json/.csv)
            <input
              type="file"
              accept=".json,.csv,text/csv,application/json"
              className="hidden"
              onChange={(e) => onFilePick(e.target.files?.[0] ?? null)}
            />
          </label>
          <button onClick={() => downloadText('questions-template.json', JSON_TEMPLATE, 'application/json')} className="btn-secondary text-xs px-3 py-1.5">
            Download JSON Template
          </button>
          <button onClick={() => downloadText('questions-template.csv', CSV_TEMPLATE, 'text/csv')} className="btn-secondary text-xs px-3 py-1.5">
            Download CSV Template
          </button>
        </div>

        {uploadMode === 'json' ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">JSON Questions</label>
              <button
                onClick={() => {
                  setJsonText(JSON_TEMPLATE);
                  setParsed(null);
                  setParseErr('');
                }}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Load JSON template
              </button>
            </div>
            <textarea
              value={jsonText}
              rows={12}
              placeholder="Paste JSON array of questions here..."
              onChange={(e) => {
                setJsonText(e.target.value);
                setParsed(null);
                setParseErr('');
              }}
              className="input font-mono text-xs resize-none"
            />
            <button onClick={validateFromJsonText} disabled={!jsonText.trim()} className="btn-secondary disabled:opacity-50 mt-3">
              Validate JSON
            </button>
          </div>
        ) : (
          <div className="text-sm text-[var(--muted)] bg-[var(--brand-soft)]/35 rounded-lg p-3">
            CSV mode uses uploaded `.csv` file based on the template format.
            <div className="mt-1 text-xs">
              Required columns: `question_text`, `option_a..option_d`, `correct_answer`.
              Optional: `explanation`, `difficulty`, `year`, `tags`, `question_image_url`, `option_*_image_url`.
            </div>
          </div>
        )}

        <div className="text-xs text-[var(--muted)] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
          Media support: use image URLs in `question_image_url` and `option_*_image_url`.
        </div>

        {parseErr && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-lg">⚠ {parseErr}</p>}
        {parsed && <p className="text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-3 py-2 rounded-lg">✓ {parsedCount} valid questions ready to upload</p>}
        {result && <p className={`text-sm px-3 py-2 rounded-lg ${result.startsWith('✓') ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-950 text-red-600'}`}>{result}</p>}

        <button onClick={upload} disabled={!parsed || uploading || !subjectId} className="btn-primary disabled:opacity-50">
          {uploading ? 'Uploading...' : `Upload ${parsedCount} Questions`}
        </button>
      </div>

      <div className="card p-4 space-y-3">
        <p className="text-sm font-semibold text-[var(--text)]">Export Questions</p>
        <div className="flex flex-wrap items-center gap-2">
          <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')} className="input max-w-[160px]">
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
          <button onClick={exportQuestions} disabled={exporting} className="btn-secondary">
            {exporting ? 'Exporting...' : 'Export Selected Exam/Subject'}
          </button>
        </div>
      </div>
    </div>
  );
}
