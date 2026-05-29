import { useState, useEffect } from 'react';
import { User } from '@/pages/Index';
import { apiGetAssignments, apiCreateAssignment, apiGetSolutions, apiGradeSolution } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Assignment {
  id: number;
  title: string;
  description: string;
  deadline: string | null;
  max_score: number;
  created_at: string;
  solutions_count: number;
}

interface Solution {
  id: number;
  solution_text: string;
  answer_text: string;
  submitted_at: string;
  student_name: string;
  student_username: string;
  score: number | null;
  comment: string | null;
  graded_at: string | null;
}

interface Props {
  user: User;
  onLogout: () => void;
}

export default function TeacherDashboard({ user, onLogout }: Props) {
  const [tab, setTab] = useState<'assignments' | 'solutions'>('assignments');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [gradeModal, setGradeModal] = useState<Solution | null>(null);

  const [form, setForm] = useState({ title: '', description: '', deadline: '', max_score: '100' });
  const [gradeForm, setGradeForm] = useState({ score: '', comment: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    setLoading(true);
    const res = await apiGetAssignments(user.id, 'teacher');
    if (res.success) setAssignments(res.assignments);
    setLoading(false);
  };

  const loadSolutions = async (a: Assignment) => {
    setSelectedAssignment(a);
    setTab('solutions');
    const res = await apiGetSolutions(a.id);
    if (res.success) setSolutions(res.solutions);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiCreateAssignment({
      title: form.title,
      description: form.description,
      deadline: form.deadline || undefined,
      max_score: parseInt(form.max_score) || 100,
      teacher_id: user.id,
    });
    setSaving(false);
    if (res.success) {
      setShowCreate(false);
      setForm({ title: '', description: '', deadline: '', max_score: '100' });
      loadAssignments();
    }
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeModal) return;
    setSaving(true);
    const res = await apiGradeSolution({
      solution_id: gradeModal.id,
      score: parseInt(gradeForm.score),
      comment: gradeForm.comment,
      teacher_id: user.id,
    });
    setSaving(false);
    if (res.success) {
      setMsg('Оценка выставлена');
      setGradeModal(null);
      setGradeForm({ score: '', comment: '' });
      if (selectedAssignment) {
        const updated = await apiGetSolutions(selectedAssignment.id);
        if (updated.success) setSolutions(updated.solutions);
      }
      setTimeout(() => setMsg(''), 3000);
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-[hsl(var(--edu-navy))] text-white px-4 py-3 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--edu-accent))] flex items-center justify-center">
              <Icon name="GraduationCap" size={18} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-sm leading-none">ЭдуПортал</div>
              <div className="text-slate-400 text-xs mt-0.5">Преподаватель</div>
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

      <div className="max-w-5xl mx-auto w-full px-4 py-6 flex-1">
        {/* Tabs */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex bg-secondary rounded-lg p-1">
            <button
              onClick={() => setTab('assignments')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${tab === 'assignments' ? 'bg-[hsl(var(--edu-blue))] text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <span className="flex items-center gap-2"><Icon name="BookOpen" size={15} />Задания ({assignments.length})</span>
            </button>
            {selectedAssignment && (
              <button
                onClick={() => setTab('solutions')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${tab === 'solutions' ? 'bg-[hsl(var(--edu-blue))] text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <span className="flex items-center gap-2"><Icon name="FileText" size={15} />Решения ({solutions.length})</span>
              </button>
            )}
          </div>
          {tab === 'assignments' && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--edu-blue))] text-white rounded-lg text-sm font-semibold hover:bg-[hsl(var(--edu-navy))] transition-colors"
            >
              <Icon name="Plus" size={16} />
              Новое задание
            </button>
          )}
        </div>

        {msg && (
          <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2.5 text-sm animate-fade-in">
            <Icon name="CheckCircle" size={15} />
            {msg}
          </div>
        )}

        {/* Assignments tab */}
        {tab === 'assignments' && (
          <div className="space-y-3 animate-fade-in">
            {loading ? (
              <div className="text-center py-16 text-muted-foreground">
                <Icon name="Loader2" size={32} className="mx-auto mb-3 animate-spin opacity-40" />
                Загрузка...
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border border-border">
                <Icon name="BookOpen" size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-semibold">Заданий пока нет</p>
                <p className="text-sm mt-1">Нажмите «Новое задание», чтобы добавить первое</p>
              </div>
            ) : (
              assignments.map(a => (
                <div key={a.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow animate-slide-up">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground text-base">{a.title}</h3>
                        {isOverdue(a.deadline) && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Истёк срок</span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{a.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Icon name="Calendar" size={12} />
                          Дедлайн: {formatDate(a.deadline)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="Trophy" size={12} />
                          Макс. балл: {a.max_score}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="Users" size={12} />
                          Решений: {a.solutions_count}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => loadSolutions(a)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-secondary text-[hsl(var(--edu-blue))] rounded-lg text-sm font-semibold hover:bg-[hsl(var(--edu-blue))] hover:text-white transition-colors"
                    >
                      <Icon name="Eye" size={14} />
                      <span className="hidden sm:inline">Решения</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Solutions tab */}
        {tab === 'solutions' && selectedAssignment && (
          <div className="animate-fade-in">
            <div className="bg-[hsl(var(--edu-blue))] text-white rounded-xl p-4 mb-4">
              <button onClick={() => setTab('assignments')} className="flex items-center gap-1 text-blue-200 text-sm mb-2 hover:text-white transition-colors">
                <Icon name="ChevronLeft" size={15} />
                К заданиям
              </button>
              <h2 className="font-bold text-lg">{selectedAssignment.title}</h2>
              <p className="text-blue-100 text-sm mt-1">{selectedAssignment.description}</p>
            </div>
            <div className="space-y-3">
              {solutions.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border border-border">
                  <Icon name="FileText" size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">Решений ещё нет</p>
                </div>
              ) : (
                solutions.map(s => (
                  <div key={s.id} className="bg-card border border-border rounded-xl p-4 animate-slide-up">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="font-bold text-foreground">{s.student_name}</div>
                        <div className="text-xs text-muted-foreground">@{s.student_username} · {formatDate(s.submitted_at)}</div>
                      </div>
                      {s.score !== null ? (
                        <div className="flex items-center gap-2">
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                            {s.score}/{selectedAssignment.max_score}
                          </span>
                          <button
                            onClick={() => { setGradeModal(s); setGradeForm({ score: String(s.score), comment: s.comment || '' }); }}
                            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border transition-colors"
                          >
                            Изменить
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setGradeModal(s); setGradeForm({ score: '', comment: '' }); }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-[hsl(var(--edu-blue))] text-white rounded-lg text-sm font-semibold hover:bg-[hsl(var(--edu-navy))] transition-colors"
                        >
                          <Icon name="Star" size={14} />
                          Оценить
                        </button>
                      )}
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Решение</div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{s.solution_text}</p>
                      </div>
                      {s.answer_text && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Ответ</div>
                          <p className="text-sm font-mono-edu text-blue-900">{s.answer_text}</p>
                        </div>
                      )}
                      {s.comment && (
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Комментарий преподавателя</div>
                          <p className="text-sm text-amber-900">{s.comment}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Assignment Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4 animate-fade-in" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold text-foreground text-lg">Новое задание</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="X" size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Название</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Контрольная работа №1"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--edu-accent))] bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Описание / условие задачи</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Подробно опишите задание..."
                  required
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--edu-accent))] bg-background text-foreground resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Дедлайн</label>
                  <input
                    type="datetime-local"
                    value={form.deadline}
                    onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--edu-accent))] bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Макс. балл</label>
                  <input
                    type="number"
                    value={form.max_score}
                    onChange={e => setForm(f => ({ ...f, max_score: e.target.value }))}
                    min="1"
                    max="1000"
                    className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--edu-accent))] bg-background text-foreground"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors">
                  Отмена
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-[hsl(var(--edu-blue))] text-white text-sm font-semibold hover:bg-[hsl(var(--edu-navy))] transition-colors disabled:opacity-60">
                  {saving ? 'Создание...' : 'Создать задание'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {gradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4 animate-fade-in" onClick={e => e.target === e.currentTarget && setGradeModal(null)}>
          <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold text-foreground text-lg">Выставить оценку</h2>
              <button onClick={() => setGradeModal(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="X" size={20} />
              </button>
            </div>
            <div className="px-6 py-3 bg-muted/50 border-b border-border">
              <div className="text-sm font-semibold text-foreground">{gradeModal.student_name}</div>
              <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{gradeModal.solution_text}</div>
            </div>
            <form onSubmit={handleGrade} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Оценка / баллы (макс. {selectedAssignment?.max_score})
                </label>
                <input
                  type="number"
                  value={gradeForm.score}
                  onChange={e => setGradeForm(f => ({ ...f, score: e.target.value }))}
                  placeholder="0"
                  min="0"
                  max={selectedAssignment?.max_score}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--edu-accent))] bg-background text-foreground font-mono-edu text-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Комментарий</label>
                <textarea
                  value={gradeForm.comment}
                  onChange={e => setGradeForm(f => ({ ...f, comment: e.target.value }))}
                  placeholder="Развёрнутый комментарий к работе..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--edu-accent))] bg-background text-foreground resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setGradeModal(null)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-secondary transition-colors">
                  Отмена
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-[hsl(var(--edu-blue))] text-white text-sm font-semibold hover:bg-[hsl(var(--edu-navy))] transition-colors disabled:opacity-60">
                  {saving ? 'Сохранение...' : 'Сохранить оценку'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
