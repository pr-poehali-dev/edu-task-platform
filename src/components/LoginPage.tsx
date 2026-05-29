import { useState } from 'react';
import { apiLogin, apiRegister } from '@/lib/api';
import { User } from '@/pages/Index';
import Icon from '@/components/ui/icon';

interface Props {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (mode === 'login') {
        res = await apiLogin(username.trim(), password.trim());
      } else {
        res = await apiRegister(username.trim(), password.trim(), fullName.trim());
      }
      if (res.success) {
        onLogin(res.user);
      } else {
        setError(res.error || 'Произошла ошибка');
      }
    } catch {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--edu-navy))] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[hsl(var(--edu-accent))] mb-4">
            <Icon name="GraduationCap" size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ЭдуПортал</h1>
          <p className="text-slate-400 text-sm mt-1">Учебная платформа для учреждений</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex border-b border-border">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-3.5 text-sm font-600 transition-colors ${mode === 'login' ? 'bg-[hsl(var(--edu-blue))] text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Войти
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${mode === 'register' ? 'bg-[hsl(var(--edu-blue))] text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Регистрация студента
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Полное имя
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--edu-accent))] focus:border-transparent transition"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Логин
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Введите логин"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--edu-accent))] focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--edu-accent))] focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">
                <Icon name="AlertCircle" size={15} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-[hsl(var(--edu-blue))] text-white font-semibold text-sm hover:bg-[hsl(var(--edu-navy))] transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? 'Загрузка...' : mode === 'login' ? 'Войти в систему' : 'Зарегистрироваться'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
