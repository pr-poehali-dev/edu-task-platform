import { useState, useEffect } from 'react';
import { User } from '@/pages/Index';
import { apiGetAssignments, apiSubmitSolution } from '@/lib/api';

interface Assignment {
  id: number;
  title: string;
  description: string;
  deadline: string | null;
  max_score: number;
  solution_id: number | null;
  submitted_at: string | null;
  score: number | null;
  comment: string | null;
}

interface Props {
  user: User;
  onLogout: () => void;
}

const inp = "w-full px-3 py-2 border border-border rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

export default function StudentDashboard({ user, onLogout }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [solutionText, setSolutionText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const res = await apiGetAssignments(user.id, 'student');
    if (res.success) setAssignments(res.assignments);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    const res = await apiSubmitSolution({
      assignment_id: selected.id,
      student_id: user.id,
      solution_text: solutionText,
      answer_text: answerText,
    });
    setSaving(false);
    if (res.success) {
      setSelected(null);
      setSolutionText('');
      setAnswerText('');
      setMsg('Решение отправлено');
      setTimeout(() => setMsg(''), 3000);
      load();
    }
  };

  const getStatus = (a: Assignment) => {
    if (a.score !== null) return 'graded';
    if (a.solution_id) return 'submitted';
    return 'pending';
  };

  const fmt = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const counts = {
    all: assignments.length,
    pending: assignments.filter(a => getStatus(a) === 'pending').length,
    submitted: assignments.filter(a => getStatus(a) === 'submitted').length,
    graded: assignments.filter(a => getStatus(a) === 'graded').length,
  };

  const filtered = assignments.filter(a => filter === 'all' || getStatus(a) === filter);

  const statusLabel = (a: Assignment) => {
    const s = getStatus(a);
    if (s === 'graded') return <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">Оценено</span>;
    if (s === 'submitted') return <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">На проверке</span>;
    return <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">Не сдано</span>;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <span className="font-bold text-foreground">Учебная платформа</span>
            <span className="ml-2 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">Студент</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user.full_name}</span>
            <button onClick={onLogout} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Выйти</button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto w-full px-4 py-5 flex-1">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {([
            { key: 'all', label: 'Всего' },
            { key: 'pending', label: 'Не сдано' },
            { key: 'submitted', label: 'На проверке' },
            { key: 'graded', label: 'Оценено' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`border rounded-lg p-3 text-left transition-colors ${filter === key ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-secondary'}`}
            >
              <p className="text-lg font-bold text-foreground">{counts[key]}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </button>
          ))}
        </div>

        {msg && <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{msg}</div>}

        {/* Assignments */}
        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Загрузка...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
            <p className="font-medium">Нет заданий</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(a => (
              <div key={a.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-foreground">{a.title}</span>
                      {statusLabel(a)}
                    </div>
                    <p className="text-sm text-muted-foreground">{a.description}</p>
                    <div className="flex flex-wrap gap-x-4 mt-1.5 text-xs text-muted-foreground">
                      <span>Дедлайн: {fmt(a.deadline)}</span>
                      <span>Макс. балл: {a.max_score}</span>
                      {a.score !== null && <span className="text-green-700 font-medium">Получено: {a.score}/{a.max_score}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(a)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      getStatus(a) === 'pending'
                        ? 'bg-primary text-primary-foreground hover:opacity-90'
                        : 'border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    {getStatus(a) === 'pending' ? 'Сдать' : 'Открыть'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="bg-card border border-border rounded-lg w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground">{selected.title}</h3>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-secondary rounded p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">УСЛОВИЕ</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{selected.description}</p>
              </div>

              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Дедлайн: {fmt(selected.deadline)}</span>
                <span>Макс. балл: {selected.max_score}</span>
              </div>

              {/* Graded result */}
              {selected.score !== null && (
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-green-700">РЕЗУЛЬТАТ</p>
                    <p className="text-xl font-bold text-green-700">{selected.score} <span className="text-sm font-normal">/ {selected.max_score}</span></p>
                  </div>
                  {selected.comment && (
                    <>
                      <p className="text-xs font-medium text-green-700 mt-2 mb-1">КОММЕНТАРИЙ ПРЕПОДАВАТЕЛЯ</p>
                      <p className="text-sm text-green-900 whitespace-pre-wrap">{selected.comment}</p>
                    </>
                  )}
                </div>
              )}

              {/* Submitted, waiting */}
              {selected.solution_id && selected.score === null && (
                <div className="bg-blue-50 border border-blue-200 rounded p-4 text-center">
                  <p className="text-sm font-medium text-blue-700">Решение отправлено, ожидайте проверки</p>
                  <p className="text-xs text-blue-500 mt-1">Сдано: {fmt(selected.submitted_at)}</p>
                </div>
              )}

              {/* Submit form */}
              {!selected.solution_id && (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Решение <span className="text-red-500">*</span></label>
                    <textarea
                      className={inp + ' resize-none'}
                      rows={5}
                      value={solutionText}
                      onChange={e => setSolutionText(e.target.value)}
                      placeholder="Опишите ход решения..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Ответ</label>
                    <input
                      className={inp + ' font-mono'}
                      type="text"
                      value={answerText}
                      onChange={e => setAnswerText(e.target.value)}
                      placeholder="Итоговый ответ"
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setSelected(null)} className="flex-1 py-2 border border-border rounded text-sm font-medium hover:bg-secondary transition-colors">Отмена</button>
                    <button type="submit" disabled={saving} className="flex-1 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                      {saving ? 'Отправка...' : 'Отправить решение'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}