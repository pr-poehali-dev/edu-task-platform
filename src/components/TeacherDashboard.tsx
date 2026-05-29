import { useState, useEffect } from 'react';
import { User } from '@/pages/Index';
import { apiGetAssignments, apiCreateAssignment, apiGetSolutions, apiGradeSolution, apiCreateStudent, apiGetStudents } from '@/lib/api';

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
}

interface Student {
  id: number;
  username: string;
  full_name: string;
}

interface Props {
  user: User;
  onLogout: () => void;
}

type Tab = 'assignments' | 'solutions' | 'students';

const inp = "w-full px-3 py-2 border border-border rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary";
const btn = "px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity";
const btnSecondary = "px-4 py-2 bg-secondary text-secondary-foreground border border-border rounded text-sm font-medium hover:bg-muted transition-colors";

export default function TeacherDashboard({ user, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>('assignments');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showGrade, setShowGrade] = useState<Solution | null>(null);
  const [showCreateStudent, setShowCreateStudent] = useState(false);

  const [aForm, setAForm] = useState({ title: '', description: '', deadline: '', max_score: '100' });
  const [sForm, setSForm] = useState({ username: '', password: '', full_name: '' });
  const [gradeForm, setGradeForm] = useState({ score: '', comment: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => { loadAssignments(); }, []);

  const flash = (text: string, isErr = false) => {
    if (isErr) { setErr(text); setTimeout(() => setErr(''), 3000); }
    else { setMsg(text); setTimeout(() => setMsg(''), 3000); }
  };

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

  const loadStudents = async () => {
    const res = await apiGetStudents();
    if (res.success) setStudents(res.students);
  };

  const handleTabStudents = () => {
    setTab('students');
    loadStudents();
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiCreateAssignment({
      title: aForm.title, description: aForm.description,
      deadline: aForm.deadline || undefined,
      max_score: parseInt(aForm.max_score) || 100,
      teacher_id: user.id,
    });
    setSaving(false);
    if (res.success) {
      setShowCreateAssignment(false);
      setAForm({ title: '', description: '', deadline: '', max_score: '100' });
      loadAssignments();
      flash('Задание создано');
    } else {
      flash(res.error || 'Ошибка', true);
    }
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showGrade || !selectedAssignment) return;
    setSaving(true);
    const res = await apiGradeSolution({
      solution_id: showGrade.id, score: parseInt(gradeForm.score),
      comment: gradeForm.comment, teacher_id: user.id,
    });
    setSaving(false);
    if (res.success) {
      setShowGrade(null);
      setGradeForm({ score: '', comment: '' });
      const updated = await apiGetSolutions(selectedAssignment.id);
      if (updated.success) setSolutions(updated.solutions);
      flash('Оценка сохранена');
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiCreateStudent(sForm.username.trim(), sForm.password.trim(), sForm.full_name.trim());
    setSaving(false);
    if (res.success) {
      setShowCreateStudent(false);
      setSForm({ username: '', password: '', full_name: '' });
      loadStudents();
      flash('Студент добавлен');
    } else {
      flash(res.error || 'Ошибка', true);
    }
  };

  const fmt = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <span className="font-bold text-foreground">Учебная платформа</span>
            <span className="ml-2 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">Преподаватель</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user.full_name}</span>
            <button onClick={onLogout} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Выйти</button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full px-4 py-5 flex-1">
        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-border">
          {[
            { key: 'assignments', label: `Задания (${assignments.length})` },
            { key: 'solutions', label: selectedAssignment ? `Решения — ${selectedAssignment.title}` : 'Решения', disabled: !selectedAssignment },
            { key: 'students', label: 'Студенты' },
          ].map(({ key, label, disabled }) => (
            <button
              key={key}
              disabled={disabled}
              onClick={() => key === 'students' ? handleTabStudents() : !disabled && setTab(key as Tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Flash messages */}
        {msg && <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{msg}</div>}
        {err && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{err}</div>}

        {/* === ASSIGNMENTS === */}
        {tab === 'assignments' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Список заданий</h2>
              <button onClick={() => setShowCreateAssignment(true)} className={btn}>+ Новое задание</button>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Загрузка...</p>
            ) : assignments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
                <p className="font-medium">Заданий пока нет</p>
                <p className="text-sm mt-1">Нажмите «Новое задание», чтобы добавить</p>
              </div>
            ) : (
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-secondary text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium text-foreground">Название</th>
                    <th className="px-3 py-2 font-medium text-foreground hidden sm:table-cell">Дедлайн</th>
                    <th className="px-3 py-2 font-medium text-foreground hidden sm:table-cell">Балл</th>
                    <th className="px-3 py-2 font-medium text-foreground">Решений</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a, i) => (
                    <tr key={a.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                      <td className="px-3 py-2.5 font-medium text-foreground">{a.title}</td>
                      <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">{fmt(a.deadline)}</td>
                      <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">{a.max_score}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{a.solutions_count}</td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => loadSolutions(a)}
                          className="text-primary text-sm hover:underline font-medium"
                        >
                          Решения
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* === SOLUTIONS === */}
        {tab === 'solutions' && selectedAssignment && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h2 className="font-semibold text-foreground">{selectedAssignment.title}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{selectedAssignment.description}</p>
              </div>
              <button onClick={() => setTab('assignments')} className={btnSecondary}>← К заданиям</button>
            </div>

            {solutions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
                <p className="font-medium">Решений ещё нет</p>
              </div>
            ) : (
              <div className="space-y-3">
                {solutions.map(s => (
                  <div key={s.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-medium text-foreground">{s.student_name}</p>
                        <p className="text-xs text-muted-foreground">@{s.student_username} · {fmt(s.submitted_at)}</p>
                      </div>
                      {s.score !== null ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded">
                            {s.score} / {selectedAssignment.max_score}
                          </span>
                          <button
                            onClick={() => { setShowGrade(s); setGradeForm({ score: String(s.score), comment: s.comment || '' }); }}
                            className="text-xs text-muted-foreground hover:text-foreground border border-border rounded px-2 py-1"
                          >
                            Изменить
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setShowGrade(s); setGradeForm({ score: '', comment: '' }); }}
                          className={btn}
                        >
                          Оценить
                        </button>
                      )}
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="bg-secondary rounded p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">РЕШЕНИЕ</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{s.solution_text}</p>
                      </div>
                      {s.answer_text && (
                        <div className="bg-blue-50 border border-blue-100 rounded p-3">
                          <p className="text-xs font-medium text-blue-600 mb-1">ОТВЕТ</p>
                          <p className="text-sm font-mono text-blue-900">{s.answer_text}</p>
                        </div>
                      )}
                      {s.comment && (
                        <div className="bg-amber-50 border border-amber-100 rounded p-3">
                          <p className="text-xs font-medium text-amber-600 mb-1">КОММЕНТАРИЙ</p>
                          <p className="text-sm text-amber-900">{s.comment}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === STUDENTS === */}
        {tab === 'students' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Студенты</h2>
              <button onClick={() => setShowCreateStudent(true)} className={btn}>+ Добавить студента</button>
            </div>
            {students.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
                <p className="font-medium">Студентов пока нет</p>
                <p className="text-sm mt-1">Добавьте первого студента</p>
              </div>
            ) : (
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-secondary text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium text-foreground">ФИО</th>
                    <th className="px-3 py-2 font-medium text-foreground">Логин</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                      <td className="px-3 py-2.5 font-medium text-foreground">{s.full_name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{s.username}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modal: Create Assignment */}
      {showCreateAssignment && (
        <Modal title="Новое задание" onClose={() => setShowCreateAssignment(false)}>
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <Field label="Название">
              <input className={inp} type="text" value={aForm.title} onChange={e => setAForm(f => ({ ...f, title: e.target.value }))} placeholder="Например: Контрольная работа №1" required />
            </Field>
            <Field label="Условие задания">
              <textarea className={inp + ' resize-none'} rows={4} value={aForm.description} onChange={e => setAForm(f => ({ ...f, description: e.target.value }))} placeholder="Опишите задание подробно" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Дедлайн">
                <input className={inp} type="datetime-local" value={aForm.deadline} onChange={e => setAForm(f => ({ ...f, deadline: e.target.value }))} />
              </Field>
              <Field label="Макс. балл">
                <input className={inp} type="number" value={aForm.max_score} onChange={e => setAForm(f => ({ ...f, max_score: e.target.value }))} min="1" />
              </Field>
            </div>
            <ModalActions onCancel={() => setShowCreateAssignment(false)} saving={saving} label="Создать" />
          </form>
        </Modal>
      )}

      {/* Modal: Grade */}
      {showGrade && (
        <Modal title="Выставить оценку" onClose={() => setShowGrade(null)}>
          <div className="bg-secondary rounded p-3 mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">СТУДЕНТ</p>
            <p className="text-sm font-medium">{showGrade.student_name}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{showGrade.solution_text}</p>
          </div>
          <form onSubmit={handleGrade} className="space-y-4">
            <Field label={`Оценка (макс. ${selectedAssignment?.max_score})`}>
              <input className={inp} type="number" value={gradeForm.score} onChange={e => setGradeForm(f => ({ ...f, score: e.target.value }))} min="0" max={selectedAssignment?.max_score} required placeholder="0" autoFocus />
            </Field>
            <Field label="Комментарий">
              <textarea className={inp + ' resize-none'} rows={3} value={gradeForm.comment} onChange={e => setGradeForm(f => ({ ...f, comment: e.target.value }))} placeholder="Комментарий к работе..." />
            </Field>
            <ModalActions onCancel={() => setShowGrade(null)} saving={saving} label="Сохранить" />
          </form>
        </Modal>
      )}

      {/* Modal: Create Student */}
      {showCreateStudent && (
        <Modal title="Добавить студента" onClose={() => setShowCreateStudent(false)}>
          <form onSubmit={handleCreateStudent} className="space-y-4">
            <Field label="ФИО">
              <input className={inp} type="text" value={sForm.full_name} onChange={e => setSForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Иванов Иван Иванович" required autoFocus />
            </Field>
            <Field label="Логин">
              <input className={inp} type="text" value={sForm.username} onChange={e => setSForm(f => ({ ...f, username: e.target.value }))} placeholder="ivanov_ivan" required />
            </Field>
            <Field label="Пароль">
              <input className={inp} type="text" value={sForm.password} onChange={e => setSForm(f => ({ ...f, password: e.target.value }))} placeholder="Придумайте пароль" required />
            </Field>
            {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{err}</p>}
            <ModalActions onCancel={() => setShowCreateStudent(false)} saving={saving} label="Добавить" />
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-card border border-border rounded-lg w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}

function ModalActions({ onCancel, saving, label }: { onCancel: () => void; saving: boolean; label: string }) {
  return (
    <div className="flex gap-3 pt-1">
      <button type="button" onClick={onCancel} className="flex-1 py-2 border border-border rounded text-sm font-medium hover:bg-secondary transition-colors">Отмена</button>
      <button type="submit" disabled={saving} className="flex-1 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
        {saving ? 'Сохранение...' : label}
      </button>
    </div>
  );
}