import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  inn?: number;
  ogrn?: number;
}

interface LoginResponse {
  access_token: string;
  user?: User;
}

interface RegisterResponse {
  access_token: string;
  user?: User;
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

  const handleAuthSuccess = (user: User | undefined, accessToken: string) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);
    }
    localStorage.setItem('access_token', accessToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
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
              <LoginPage onAuth={handleAuthSuccess} />
            )
          }
        />
        <Route
          path="/register"
          element={
            currentUser ? (
              <Navigate to="/dashboard" />
            ) : (
              <RegisterPage onAuth={handleAuthSuccess} />
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

// логин

interface LoginPageProps {
  onAuth: (user: User | undefined, accessToken: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onAuth }) => {
  const [useEmail, setUseEmail] = useState(true);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (useEmail && !email) {
      setError('Введите email');
      return;
    }
    if (!useEmail && !phone) {
      setError('Введите телефон');
      return;
    }
    if (!password) {
      setError('Введите пароль');
      return;
    }

    const body: any = { password };
    if (useEmail) body.email = email;
    else body.phone = phone;

    setLoading(true);
    try {
      const response = await fetch('https://localhost:7278/Auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.message || 'Ошибка входа');
      }

      const data: LoginResponse = await response.json();
      if (!data.access_token) {
        throw new Error('Не получен access_token');
      }

      onAuth(data.user, data.access_token);
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

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            style={{
              ...toggleButtonStyle,
              background: useEmail ? '#2563eb' : '#e5e7eb',
              color: useEmail ? '#fff' : '#111827',
            }}
            onClick={() => setUseEmail(true)}
          >
            Email
          </button>
          <button
            type="button"
            style={{
              ...toggleButtonStyle,
              background: !useEmail ? '#2563eb' : '#e5e7eb',
              color: !useEmail ? '#fff' : '#111827',
            }}
            onClick={() => setUseEmail(false)}
          >
            Телефон
          </button>
        </div>

        {useEmail ? (
          <input
            type="email"
            placeholder="Email"
            style={inputStyle}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        ) : (
          <input
            type="tel"
            placeholder="Телефон"
            style={inputStyle}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        )}

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

// регистрация

interface RegisterPageProps {
  onAuth: (user: User | undefined, accessToken: string) => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onAuth }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [inn, setInn] = useState('');
  const [ogrn, setOgrn] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !inn || !ogrn || !password) {
      setError('Заполните все поля');
      return;
    }
    if (password.length < 6) {
      setError('Пароль минимум 6 символов');
      return;
    }
    if (isNaN(Number(inn)) || isNaN(Number(ogrn))) {
      setError('ИНН и ОГРН должны быть числами');
      return;
    }

    const body = {
      name,
      email,
      inn: Number(inn),
      ogrn: Number(ogrn),
      password,
    };

    setLoading(true);
    try {
      const response = await fetch('https://localhost:7278/Auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.message || 'Ошибка регистрации');
      }

      const data: RegisterResponse = await response.json();
      if (!data.access_token) {
        throw new Error('Не получен access_token');
      }

      onAuth(data.user, data.access_token);
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
          type="text"
          placeholder="ИНН (число)"
          style={inputStyle}
          value={inn}
          onChange={(e) => setInn(e.target.value)}
        />
        <input
          type="text"
          placeholder="ОГРН (число)"
          style={inputStyle}
          value={ogrn}
          onChange={(e) => setOgrn(e.target.value)}
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

// главный экран

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const token = localStorage.getItem('access_token');

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
          marginBottom: 16,
        }}
      >
        <h2>Профиль</h2>
        <p>
          <strong>ID:</strong> {user.id}
        </p>
        {user.email && (
          <p>
            <strong>Email:</strong> {user.email}
          </p>
        )}
        {user.phone && (
          <p>
            <strong>Телефон:</strong> {user.phone}
          </p>
        )}
        {user.name && (
          <p>
            <strong>Имя:</strong> {user.name}
          </p>
        )}
        {user.inn && (
          <p>
            <strong>ИНН:</strong> {user.inn}
          </p>
        )}
        {user.ogrn && (
          <p>
            <strong>ОГРН:</strong> {user.ogrn}
          </p>
        )}
      </section>

      <section
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        }}
      >
        <h2>Токен</h2>
        <p>
          <strong>access_token:</strong>{' '}
          {token ? token : 'Токен не найден в localStorage'}
        </p>
      </section>
    </div>
  );
};

// стили

const authWrapperStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
};

const authFormStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
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

const toggleButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 8px',
  borderRadius: 999,
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
};

export default App;
export {};
