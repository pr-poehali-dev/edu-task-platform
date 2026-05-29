import { useState, useEffect } from 'react';
import { User } from '@/pages/Index';
import { apiGetAssignments, apiSubmitSolution } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Assignment {
  id: number;
  title: string;
  description: string;
  deadline: string | null;
  max_score: number;
  created_at: string;
  solution_id: number | null;
  submitted_at: string | null;
  score: number | null;
  comment: string | null;
}

interface Props {
  user: User;
  onLogout: () => void;
}

export default function StudentDashboard({ user, onLogout }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [form, setForm] = useState({ solution_text: '', answer_text: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
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
      solution_text: form.solution_text,
      answer_text: form.answer_text,
    });
    setSaving(false);
    if (res.success) {
      setMsg('Решение отправлено!');
      setSelected(null);
      setForm({ solution_text: '', answer_text: '' });
      loadAssignments();
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const openAssignment = (a: Assignment) => {
    setSelected(a);
    if (a.solution_id) {
      setForm({ solution_text: '', answer_text: '' });
    } else {
      setForm({ solution_text: '', answer_text: '' });
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const getStatus = (a: Assignment) => {
    if (a.score !== null) return 'graded';
    if (a.solution_id) return 'submitted';
    return 'pending';
  };

  const filtered = assignments.filter(a => {
    if (filter === 'all') return true;
    return getStatus(a) === filter;
  });

  const counts = {
    all: assignments.length,
    pending: assignments.filter(a => getStatus(a) === 'pending').length,
    submitted: assignments.filter(a => getStatus(a) === 'submitted').length,
    graded: assignments.filter(a => getStatus(a) === 'graded').length,
  };

  const statusBadge = (a: Assignment) => {
    const s = getStatus(a);
    if (s === 'graded') return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Оценено</span>;
    if (s === 'submitted') return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">На проверке</span>;
    if (isOverdue(a.deadline)) return <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">Просрочено</span>;
    return <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Не сдано</span>;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-[hsl(var(--edu-navy))] text-white px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--edu-accent))] flex items-center justify-center">
              <Icon name="GraduationCap" size={18} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-sm leading-none">ЭдуПортал</div>
              <div className="text-slate-400 text-xs mt-0.5">Студент</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-300 hidden sm:block">{user.full_name}</span>
            <button onClick={onLogout} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
              <Icon name="LogOut" size={16} />
              <span className="hidden sm:block">Выйти</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full px-4 py-6 flex-1">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { key: 'all', label: 'Всего', icon: 'BookOpen', color: 'text-foreground' },
            { key: 'pending', label: 'Не сдано', icon: 'Clock', color: 'text-amber-600' },
            { key: 'submitted', label: 'На проверке', icon: 'Send', color: 'text-blue-600' },
            { key: 'graded', label: 'Оценено', icon: 'CheckCircle', color: 'text-green-600' },
          ].map(({ key, label, icon, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              className={`bg-card border rounded-xl p-3 text-left transition-all ${filter === key ? 'border-[hsl(var(--edu-accent))] shadow-md' : 'border-border hover:shadow-sm'}`}
            >
              <div className={`flex items-center gap-1.5 ${color} mb-1`}>
                <Icon name={icon} size={14} />
                <span className="text-xs font-semibold">{label}</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{counts[key as keyof typeof counts]}</div>
            </button>
          ))}
        </div>

        {msg && (
          <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2.5 text-sm animate-fade-in">
            <Icon name="CheckCircle" size={15} />
            {msg}
          </div>
        )}

        {/* Assignments List */}
        <div className="space-y-3 animate-fade-in">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">
              <Icon name="Loader2" size={32} className="mx-auto mb-3 animate-spin opacity-40" />
              Загрузка...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border border-border">
              <Icon name="BookOpen" size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Заданий нет</p>
            </div>
          ) : (
            filtered.map(a => (
              <div key={a.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow animate-slide-up">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-foreground">{a.title}</h3>
                      {statusBadge(a)}
                    </div>
                    <p className="text-muted-foreground text-sm line-clamp-2">{a.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Icon name="Calendar" size={12} />
                        Дедлайн: {formatDate(a.deadline)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="Trophy" size={12} />
                        Макс: {a.max_score} баллов
                      </span>
                      {a.score !== null && (
                        <span className="flex items-center gap-1 text-green-600 font-semibold">
                          <Icon name="Star" size={12} />
                          Получено: {a.score}/{a.max_score}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openAssignment(a)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      getStatus(a) === 'pending'
                        ? 'bg-[hsl(var(--edu-blue))] text-white hover:bg-[hsl(var(--edu-navy))]'
                        : 'bg-secondary text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon name={getStatus(a) === 'pending' ? 'Send' : 'Eye'} size={14} />
                    <span className="hidden sm:inline">{getStatus(a) === 'pending' ? 'Сдать' : 'Детали'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4 animate-fade-in" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-bold text-foreground text-base pr-4 leading-tight">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                <Icon name="X" size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-muted rounded-xl p-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Условие задания</div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{selected.description}</p>
              </div>

              <div className="flex items-center gap-4 text-sm flex-wrap">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Icon name="Calendar" size={14} />
                  {formatDate(selected.deadline)}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Icon name="Trophy" size={14} />
                  {selected.max_score} баллов
                </span>
              </div>

              {/* Already graded */}
              {selected.score !== null && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-green-700 uppercase tracking-wider">Результат</div>
                    <div className="text-2xl font-bold text-green-700">{selected.score}<span className="text-sm font-normal text-green-500">/{selected.max_score}</span></div>
                  </div>
                  {selected.comment && (
                    <div>
                      <div className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Комментарий преподавателя</div>
                      <p className="text-sm text-green-800">{selected.comment}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Submitted, waiting */}
              {selected.solution_id && selected.score === null && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <Icon name="Clock" size={24} className="mx-auto text-blue-400 mb-2" />
                  <p className="text-sm font-semibold text-blue-700">Решение отправлено</p>
                  <p className="text-xs text-blue-500 mt-1">Ожидайте проверки преподавателем</p>
                  <p className="text-xs text-blue-400 mt-1">Сдано: {formatDate(selected.submitted_at)}</p>
                </div>
              )}

              {/* Submit form */}
              {!selected.solution_id && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Решение <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.solution_text}
                      onChange={e => setForm(f => ({ ...f, solution_text: e.target.value }))}
                      placeholder="Опишите ход решения подробно..."
                      required
                      rows={5}
                      className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--edu-accent))] bg-background text-foreground resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Ответ
                    </label>
                    <input
                      type="text"
                      value={form.answer_text}
                      onChange={e => setForm(f => ({ ...f, answer_text: e.target.value }))}
                      placeholder="Итоговый ответ..."
                      className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--edu-accent))] bg-background text-foreground font-mono-edu"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setSelected(null)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-secondary transition-colors">
                      Отмена
                    </button>
                    <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-[hsl(var(--edu-blue))] text-white text-sm font-semibold hover:bg-[hsl(var(--edu-navy))] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                      <Icon name="Send" size={14} />
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
