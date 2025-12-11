import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  name?: string;
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogin = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            currentUser ? (
              <Navigate to="/dashboard" />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/register"
          element={
            currentUser ? (
              <Navigate to="/dashboard" />
            ) : (
              <RegisterPage onRegister={handleLogin} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            currentUser ? (
              <DashboardPage user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/"
          element={
            currentUser ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

// ЛОГИН 

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Заполните все поля');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://localhost:7278/Auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.message || 'Ошибка входа');
      }

      const data = await response.json();
      // Если твой .NET возвращает другой формат — поправь тут
      const user: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
      };

      onLogin(user);
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={authWrapperStyle}>
      <form onSubmit={handleSubmit} style={authFormStyle}>
        <h2 style={titleStyle}>Вход</h2>
        {error && <div style={errorStyle}>{error}</div>}
        <input
          type="email"
          placeholder="Email"
          style={inputStyle}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Пароль"
          style={inputStyle}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" style={primaryButtonStyle} disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
        <p style={linkTextStyle}>
          Нет аккаунта?{' '}
          <button
            type="button"
            style={linkButtonStyle}
            onClick={() => navigate('/register')}
          >
            Регистрация
          </button>
        </p>
      </form>
    </div>
  );
};

//  РЕГИСТРАЦИЯ 

interface RegisterPageProps {
  onRegister: (user: User) => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Заполните все поля');
      return;
    }
    if (password.length < 6) {
      setError('Пароль минимум 6 символов');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://localhost:7278/Auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.message || 'Ошибка регистрации');
      }

      const data = await response.json();
      const user: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
      };

      onRegister(user);
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={authWrapperStyle}>
      <form onSubmit={handleSubmit} style={authFormStyle}>
        <h2 style={titleStyle}>Регистрация</h2>
        {error && <div style={errorStyle}>{error}</div>}
        <input
          type="text"
          placeholder="Имя"
          style={inputStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          style={inputStyle}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Пароль"
          style={inputStyle}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" style={primaryButtonStyle} disabled={loading}>
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
        <p style={linkTextStyle}>
          Уже есть аккаунт?{' '}
          <button
            type="button"
            style={linkButtonStyle}
            onClick={() => navigate('/login')}
          >
            Войти
          </button>
        </p>
      </form>
    </div>
  );
};

// ГЛАВНЫЙ ЭКРАН 

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardProps> = ({ user, onLogout }) => {
  return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: '0 16px' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h1>Главный экран</h1>
        <button style={dangerButtonStyle} onClick={onLogout}>
          Выйти
        </button>
      </header>

      <section
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        }}
      >
        <h2>Профиль</h2>
        <p>
          <strong>ID:</strong> {user.id}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Имя:</strong> {user.name || 'Не указано'}
        </p>
      </section>
    </div>
  );
};

// -------- СТИЛИ --------

const authWrapperStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
};

const authFormStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 400,
  background: '#fff',
  borderRadius: 12,
  padding: 24,
  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const titleStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  fontSize: 14,
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};

const dangerButtonStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: 'none',
  background: '#dc2626',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};

const errorStyle: React.CSSProperties = {
  background: '#fee2e2',
  color: '#b91c1c',
  padding: '8px 10px',
  borderRadius: 8,
  fontSize: 13,
};

const linkTextStyle: React.CSSProperties = {
  fontSize: 14,
  textAlign: 'center',
};

const linkButtonStyle: React.CSSProperties = {
  border: 'none',
  background: 'none',
  color: '#2563eb',
  cursor: 'pointer',
  padding: 0,
  fontSize: 14,
};

export default App;
export {};
