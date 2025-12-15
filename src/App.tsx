import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email?: string;
  phone?: string;
  orgName?: string;
  firstName?: string;
  lastName?: string;
  inn?: number;
  ogrn?: number;
}

interface AuthResponse {
  access_token: string;
  user?: User;
}

interface LoginPageProps {
  onAuth: (user: User | undefined, accessToken: string) => void;
}

interface RegisterPageProps {
  onAuth: (user: User | undefined, accessToken: string) => void;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
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

  const handleAuthSuccess = useCallback((user: User | undefined, accessToken: string) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);
    }
    localStorage.setItem('access_token', accessToken);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    setCurrentUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            currentUser ? <Navigate to="/dashboard" /> : <LandingPage />
          }
        />

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
          path="*"
          element={
            currentUser ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

// ЛЕНДИНГ 

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={landingRoot}>
      <header style={topBarLanding}>
        <button
          style={loginButtonLanding}
          onClick={() => navigate('/login')}
        >
          Войти
        </button>

        <div style={dividerLineLanding} />

        <button
          style={registerButtonLanding}
          onClick={() => navigate('/register')}
        >
          Регистрация
        </button>
      </header>

      <main>
        <section style={heroBlock}>
          <h1 style={heroTitle}>
            Создавайте пояснительные записки<br />
            для проектной документации быстро и без ошибок
          </h1>

          <ul style={heroList}>
            <li>Соответствует требованиям Минстроя</li>
            <li>Проверка на ошибки перед выгрузкой</li>
            <li>Использование в экспертизах и госзадаче</li>
          </ul>

          <p style={heroSubText}>
            Для проектных организаций и экспертных центров
          </p>

          <button
            style={startButton}
            onClick={() => navigate('/register')}
          >
            Начать работу
          </button>
        </section>
      </main>
    </div>
  );
};

// логин

const LoginPage: React.FC<LoginPageProps> = ({ onAuth }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier || !password) {
      setError('Заполните все поля');
      return;
    }

    const body: any = { password };
    if (identifier.includes('@')) body.email = identifier;
    else body.phone = identifier;

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

      const data: AuthResponse = await response.json();
      if (!data.access_token) {
        throw new Error('Не получен access_token');
      }

      onAuth(data.user, data.access_token);

      
      setTimeout(() => {
        navigate('/dashboard');
      }, 0);
    } catch (err: any) {
      setError(err.message || 'Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageRoot}>
      <div style={topBarSimple} />

      <div style={formOuter}>
        <h2 style={pageTitle}>Вход в систему</h2>

        <form onSubmit={handleSubmit} style={segmentForm}>
          {error && <div style={errorStyle}>{error}</div>}

          <div style={segmentInnerLogin}>
            <div style={lineInputWrapper}>
              <input
                type="text"
                placeholder="Email или телефон"
                style={lineInput}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <div style={lineInputWrapper}>
              <input
                type="password"
                placeholder="Пароль"
                style={lineInput}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <label style={checkRow}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span style={{ marginLeft: 8 }}>Запомнить меня</span>
            </label>

            <button type="submit" style={outlinePrimaryButton} disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </form>

        <div style={bottomLinks}>
          <button type="button" style={linkButtonStyle} onClick={() => {}}>
            Забыли пароль?
          </button>
          <div style={{ marginTop: 8 }}>
            Еще нет аккаунта?{' '}
            <button
              type="button"
              style={linkButtonStyle}
              onClick={() => navigate('/register')}
            >
              Зарегистрироваться
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== РЕГИСТРАЦИЯ =====

const RegisterPage: React.FC<RegisterPageProps> = ({ onAuth }) => {
  const [orgName, setOrgName] = useState('');
  const [inn, setInn] = useState('');
  const [ogrn, setOgrn] = useState('');
  const [fio, setFio] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!orgName || !inn || !ogrn || !fio || !email || !phone || !password || !password2) {
      setError('Заполните все поля');
      return;
    }
    if (password !== password2) {
      setError('Пароли не совпадают');
      return;
    }
    if (!agree) {
      setError('Нужно согласиться с условиями использования');
      return;
    }
    if (isNaN(Number(inn)) || isNaN(Number(ogrn))) {
      setError('ИНН и ОГРН должны быть числами');
      return;
    }

    const parts = fio.trim().split(/\s+/);
    const firstName = parts[1] ? parts[1] : parts[0];
    const lastName = parts[0];

    const body = {
      orgName,
      inn: Number(inn),
      ogrn: Number(ogrn),
      firstName,
      lastName,
      email,
      phone,
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

      const data: AuthResponse = await response.json();
      if (!data.access_token) {
        throw new Error('Не получен access_token');
      }

      onAuth(data.user, data.access_token);
      setTimeout(() => {
        navigate('/dashboard');
      }, 0);
    } catch (err: any) {
      setError(err.message || 'Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => navigate('/login');

  return (
    <div style={pageRoot}>
      <div style={topBarWithText}>
        <div style={topBarRight}>
          <span style={{ color: '#FFFFFF', marginRight: 8 }}>У Вас уже есть аккаунт?</span>
          <button style={topBarLoginBtn} onClick={navigateToLogin}>
            Войти
          </button>
        </div>
      </div>

      <div style={formOuter}>
        <h2 style={pageTitle}>Регистрация организации</h2>

        <form onSubmit={handleSubmit} style={segmentForm}>
          {error && <div style={errorStyle}>{error}</div>}

          <div style={segmentBlock}>
            <div style={segmentHeader}>Данные организации:</div>
            <div style={segmentInner}>
              <div style={lineInputWrapper}>
                <input
                  type="text"
                  placeholder="Название организации"
                  style={lineInput}
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
              <div style={lineInputWrapper}>
                <input
                  type="text"
                  placeholder="ИНН"
                  style={lineInput}
                  value={inn}
                  onChange={(e) => setInn(e.target.value)}
                />
              </div>
              <div style={lineInputWrapper}>
                <input
                  type="text"
                  placeholder="ОГРН"
                  style={lineInput}
                  value={ogrn}
                  onChange={(e) => setOgrn(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ ...segmentBlock, marginTop: 24 }}>
            <div style={segmentHeader}>Контактное лицо:</div>
            <div style={segmentInner}>
              <div style={lineInputWrapper}>
                <input
                  type="text"
                  placeholder="ФИО"
                  style={lineInput}
                  value={fio}
                  onChange={(e) => setFio(e.target.value)}
                />
              </div>
              <div style={lineInputWrapper}>
                <input
                  type="email"
                  placeholder="Email"
                  style={lineInput}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div style={lineInputWrapper}>
                <input
                  type="tel"
                  placeholder="Телефон"
                  style={lineInput}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div style={lineInputWrapper}>
                <input
                  type="password"
                  placeholder="Пароль"
                  style={lineInput}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div style={lineInputWrapper}>
                <input
                  type="password"
                  placeholder="Подтверждение пароля"
                  style={lineInput}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                />
              </div>
            </div>
          </div>

          <label style={checkRow}>
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span style={{ marginLeft: 8 }}>
              Согласен с{' '}
              <button type="button" style={linkButtonStyle}>
                условиями использования
              </button>
            </span>
          </label>

          <button type="submit" style={outlinePrimaryButton} disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>

          <div style={{ marginTop: 12 }}>
            У Вас уже есть аккаунт?{' '}
            <button type="button" style={linkButtonStyle} onClick={navigateToLogin}>
              Войти
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
      {user.orgName && (
        <p>
          <strong>Организация:</strong> {user.orgName}
        </p>
      )}
      {user.firstName && (
        <p>
          <strong>Имя:</strong> {user.firstName}
        </p>
      )}
      {user.lastName && (
        <p>
          <strong>Фамилия:</strong> {user.lastName}
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
        {token ? `${token.substring(0, 20)}...` : 'Токен не найден в localStorage'}
      </p>
    </section>
  </div>
  );
};


const landingRoot: React.CSSProperties = {
  minHeight: '100vh',
  background: '#FFFFFF',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
};

const topBarLanding: React.CSSProperties = {
  width: '100%',
  height: 64,
  background: '#020557',
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  margin: '0 auto',
};

const loginButtonLanding: React.CSSProperties = {
  position: 'absolute',
  left: 930,
  top: 9,
  width: 152,
  height: 46,
  background: '#FFFbfb',
  color: '#020557',
  border: '1px solid #020557',
  borderRadius: 0,
  cursor: 'pointer',
  fontSize: 16,
  fontWeight: 500,
};

const dividerLineLanding: React.CSSProperties = {
  position: 'absolute',
  left: 1100,
  top: 9,
  width: 1,
  height: 46,
  background: '#FFFFFF',
};

const registerButtonLanding: React.CSSProperties = {
  position: 'absolute',
  left: 1118,
  top: 9,
  width: 275,
  height: 46,
  background: '#C0BFBF',
  color: '#020557',
  border: 'none',
  borderRadius: 0,
  cursor: 'pointer',
  fontSize: 16,
  fontWeight: 500,
};

const heroBlock: React.CSSProperties = {
  marginLeft: 105,
  marginTop: 314 - 64,
  maxWidth: 700,
};

const heroTitle: React.CSSProperties = {
  fontSize: 32,
  lineHeight: 1.25,
  fontWeight: 700,
  color: '#000000',
  marginBottom: 24,
};

const heroList: React.CSSProperties = {
  marginLeft: 16,
  marginBottom: 12,
  lineHeight: 1.4,
} as React.CSSProperties;

const heroSubText: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 24,
  fontSize: 14,
};

const startButton: React.CSSProperties = {
  marginTop: 16,
  width: 152,
  height: 46,
  background: '#020557',
  color: '#FFFFFF',
  border: 'none',
  cursor: 'pointer',
  fontSize: 16,
  fontWeight: 500,
};


const pageRoot: React.CSSProperties = {
  minHeight: '100vh',
  background: '#FFFFFF',
};

const topBarSimple: React.CSSProperties = {
  width: '100%',
  height: 64,
  background: '#020557',
};

const topBarWithText: React.CSSProperties = {
  width: '100%',
  height: 64,
  background: '#020557',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
};

const topBarRight: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginRight: 40,
};

const topBarLoginBtn: React.CSSProperties = {
  padding: '6px 16px',
  border: '1px solid #FFFFFF',
  background: 'transparent',
  color: '#FFFFFF',
  cursor: 'pointer',
};

const formOuter: React.CSSProperties = {
  maxWidth: 860,
  margin: '64px auto',
  background: '#E6E6F2',
  padding: 40,
};

const pageTitle: React.CSSProperties = {
  textAlign: 'center',
  fontSize: 24,
  fontWeight: 700,
  marginBottom: 24,
  color: '#020557',
};

const segmentForm: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const segmentBlock: React.CSSProperties = {
  background: '#EDEDF5',
  padding: 16,
};

const segmentHeader: React.CSSProperties = {
  fontWeight: 600,
  marginBottom: 8,
};

const segmentInner: React.CSSProperties = {
  background: '#EDEDF5',
  padding: 16,
};

const segmentInnerLogin: React.CSSProperties = {
  background: '#EDEDF5',
  padding: 24,
};

const lineInputWrapper: React.CSSProperties = {
  marginBottom: 8,
};

const lineInput: React.CSSProperties = {
  width: '100%',
  border: 'none',
  borderBottom: '1px solid #4B4B4B',
  background: 'transparent',
  padding: '4px 0',
  outline: 'none',
};

const checkRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginTop: 8,
};

const outlinePrimaryButton: React.CSSProperties = {
  marginTop: 16,
  padding: '8px 24px',
  borderRadius: 0,
  border: '1px solid #020557',
  background: '#FFFFFF',
  color: '#020557',
  cursor: 'pointer',
  alignSelf: 'flex-start',
};

const bottomLinks: React.CSSProperties = {
  marginTop: 24,
};


const errorStyle: React.CSSProperties = {
  background: '#fee2e2',
  color: '#b91c1c',
  padding: '8px 10px',
  borderRadius: 8,
  fontSize: 13,
};

const linkButtonStyle: React.CSSProperties = {
  border: 'none',
  background: 'none',
  color: '#2563eb',
  cursor: 'pointer',
  padding: 0,
  fontSize: 14,
  textDecoration: 'underline',
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

export default App;
export {};
