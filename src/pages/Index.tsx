import { useState, useEffect } from 'react';
import LoginPage from '@/components/LoginPage';
import TeacherDashboard from '@/components/TeacherDashboard';
import StudentDashboard from '@/components/StudentDashboard';

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: 'teacher' | 'student';
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('edu_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleLogin = (u: User) => {
    localStorage.setItem('edu_user', JSON.stringify(u));
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('edu_user');
    setUser(null);
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;
  if (user.role === 'teacher') return <TeacherDashboard user={user} onLogout={handleLogout} />;
  return <StudentDashboard user={user} onLogout={handleLogout} />;
}
