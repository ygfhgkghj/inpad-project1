import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

interface User {
  email?: string;
  phone?: string;
  orgName?: string;
  firstName?: string;
  lastName?: string;
  inn?: number;
  ogrn?: number;
  orgID?: string;
  personID?: string;
}

interface AuthResponse {
  access_token: string;
  user?: User;
}

interface LoginPageProps {
  onAuth: (user: User | undefined, accessToken: string) => void;
  fetchUserInfo: (accessToken: string) => Promise<void>;
}

interface RegisterPageProps {
  onAuth: (user: User | undefined, accessToken: string) => void;
  fetchUserInfo: (accessToken: string) => Promise<void>;
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
    localStorage.setItem('access_token', accessToken);
    
    if (user && (user.firstName || user.lastName || user.orgName)) {
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);
    }
  }, []);

  const fetchUserInfo = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch('https://localhost:7278/user/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Failed to fetch user info:', response.status);
        throw new Error('Failed to fetch user info');
      }

      const userInfo = await response.json();
      console.log('User info received:', userInfo);
      
      const updatedUser: User = {
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        orgName: userInfo.orgName,
        orgID: userInfo.orgID,
        personID: userInfo.personID,
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      console.log('User info updated:', updatedUser);
    } catch (err) {
      console.error('Error fetching user info:', err);
    }
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
              <LoginPage onAuth={handleAuthSuccess} fetchUserInfo={fetchUserInfo} />
            )
          }
        />

        <Route
          path="/register"
          element={
            currentUser ? (
              <Navigate to="/dashboard" />
            ) : (
              <RegisterPage onAuth={handleAuthSuccess} fetchUserInfo={fetchUserInfo} />
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

const LoginPage: React.FC<LoginPageProps> = ({ onAuth, fetchUserInfo }) => {
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

      await fetchUserInfo(data.access_token);

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

const RegisterPage: React.FC<RegisterPageProps> = ({ onAuth, fetchUserInfo }) => {
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

      await fetchUserInfo(data.access_token);
      
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
  const [search, setSearch] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'main' | 'docs'>('main');

  // Убрал as const - теперь без ошибок
  const documents = [
    { id: '1', name: 'Название проекта 1', updatedAt: '24-11-2025', version: 'v1.05', status: 'Завершен' },
    { id: '2', name: 'Название проекта 2', updatedAt: '17-11-2025', version: 'v1.05', status: 'На проверке' },
  ];

  const filteredDocs = documents.filter(doc =>
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  const fullName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.orgName || 'Пользователь';

  const handleDocSelect = (id: string) => {
    setSelectedDocs(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div style={dashboardRoot}>
      <header style={topbar}>
        <div style={tabs}>
          <button 
            style={{
              ...tabStyle,
              ...(activeTab === 'main' ? activeTabStyle : {})
            }}
            onClick={() => setActiveTab('main')}
          >
            Главная
          </button>
          <button 
            style={{
              ...tabStyle,
              ...(activeTab === 'docs' ? activeTabStyle : {})
            }}
            onClick={() => setActiveTab('docs')}
          >
            Документы
          </button>
        </div>
        <div style={topbarRight}>
          <button style={profileBtn}>👤</button>
          <button style={logoutBtn} onClick={onLogout}>Выйти</button>
        </div>
      </header>

      <main style={dashboardContent}>
        <section style={welcomeBlock}>
          <h1 style={welcomeTitle}>Добро пожаловать, {fullName}!</h1>
          <p style={welcomeRole}>Ваша роль: {user.orgName ? 'Руководитель организации' : 'Пользователь'}</p>
        </section>

        <section style={actionsSection}>
          <button style={primaryBtn}>Создать пояснительную записку</button>
          <button style={secondaryBtn}>Импорт XML</button>
        </section>

        <section style={documentsSection}>
          <div style={sectionHeader}>
            <h2 style={sectionTitle}>Мои документы</h2>
            <div style={searchContainer}>
              <input 
                style={searchInput}
                placeholder="Поиск..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span style={searchIcon}>🔍</span>
            </div>
          </div>

          <table style={docsTable}>
            <thead>
              <tr>
                <th style={tableHeader}><input 
                  type="checkbox" 
                  style={selectAllCheckbox}
                  checked={selectedDocs.length === documents.length}
                  onChange={() => setSelectedDocs(
                    selectedDocs.length === documents.length ? [] : documents.map(d => d.id)
                  )}
                /></th>
                <th style={tableHeader}>Название проекта</th>
                <th style={tableHeader}>Дата изменения</th>
                <th style={tableHeader}>Версия</th>
                <th style={tableHeader}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map(doc => (
                <tr 
                  key={doc.id}
                  style={{
                    ...(selectedDocs.includes(doc.id) ? rowSelected : {}),
                    ...tableRow
                  }}
                  onClick={() => handleDocSelect(doc.id)}
                >
                  <td style={tableCell}>
                    <input 
                      type="checkbox" 
                      style={checkboxStyle}
                      checked={selectedDocs.includes(doc.id)}
                      onChange={(e) => handleDocSelect(doc.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td style={tableCell}>{doc.name}</td>
                  <td style={tableCell}>{doc.updatedAt}</td>
                  <td style={tableCell}>{doc.version}</td>
                  <td style={tableCell}>
                    <span style={{
                      ...statusBadge,
                      ...(doc.status === 'Завершен' ? statusCompleted : statusPending)
                    }}>
                      {doc.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={5} style={emptyCell}>Нет документов</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section style={bottomActions}>
          <button style={{
            ...secondaryBtn,
            ...(selectedDocs.length === 0 ? disabledBtn : {})
          }}>
            Проверить на ошибки
          </button>
          <button style={{
            ...secondaryBtn,
            ...(selectedDocs.length === 0 ? disabledBtn : {})
          }}>
            Выгрузить XML
          </button>
          <button style={{
            ...secondaryBtn,
            ...(selectedDocs.length !== 1 ? disabledBtn : {})
          }}>
            История изменений
          </button>
        </section>
      </main>
    </div>
  );
};


// Стили для LandingPage и Auth
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

// Стили для DashboardPage
const dashboardRoot: React.CSSProperties = {
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'system-ui, sans-serif',
  background: '#f8f9fa',
};

const topbar: React.CSSProperties = {
  background: '#003f91',
  height: 64,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 32px',
  color: 'white',
};

const tabs: React.CSSProperties = {
  display: 'flex',
  gap: 32,
};

const tabStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#cfd8ff',
  fontSize: 16,
  padding: '8px 0',
  cursor: 'pointer',
  borderBottom: '3px solid transparent',
};

const activeTabStyle: React.CSSProperties = {
  color: 'white',
  fontWeight: 600,
  borderBottomColor: 'white',
};

const topbarRight: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
};

const profileBtn: React.CSSProperties = {
  background: 'none',
  border: '2px solid white',
  color: 'white',
  padding: '8px 16px',
  borderRadius: 50,
  cursor: 'pointer',
  width: 40,
  height: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const logoutBtn: React.CSSProperties = {
  background: 'none',
  border: '2px solid white',
  color: 'white',
  padding: '8px 16px',
  borderRadius: 6,
  cursor: 'pointer',
};

const dashboardContent: React.CSSProperties = {
  flex: 1,
  padding: '32px 48px',
  overflow: 'auto',
};

const welcomeBlock: React.CSSProperties = {
  marginBottom: 32,
};

const welcomeTitle: React.CSSProperties = {
  fontSize: 28,
  margin: '0 0 8px 0',
  color: '#1a1a1a',
};

const welcomeRole: React.CSSProperties = {
  color: '#666',
  margin: 0,
};

const actionsSection: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  marginBottom: 32,
};

const primaryBtn: React.CSSProperties = {
  background: '#2f4bff',
  color: 'white',
  border: 'none',
  padding: '12px 24px',
  borderRadius: 6,
  fontWeight: 500,
  cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  background: 'white',
  color: '#2f4bff',
  border: '1px solid #2f4bff',
  padding: '12px 24px',
  borderRadius: 6,
  fontWeight: 500,
  cursor: 'pointer',
};

const disabledBtn: React.CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
};

const documentsSection: React.CSSProperties = {
  marginBottom: 32,
};

const sectionHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
};

const searchContainer: React.CSSProperties = {
  position: 'relative',
};

const searchInput: React.CSSProperties = {
  padding: '8px 32px 8px 12px',
  border: '1px solid #ddd',
  borderRadius: 6,
  width: 240,
  fontSize: 14,
};

const searchIcon: React.CSSProperties = {
  position: 'absolute',
  right: 10,
  top: '50%',
  transform: 'translateY(-50%)',
};

const docsTable: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  background: 'white',
  borderRadius: 8,
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

const tableHeader: React.CSSProperties = {
  background: '#f1f1f7',
  padding: '16px 12px',
  textAlign: 'left' as const,
  fontWeight: 600,
};

const tableRow: React.CSSProperties = {
  cursor: 'pointer',
};

const rowSelected: React.CSSProperties = {
  background: '#eef4ff',
};

const tableCell: React.CSSProperties = {
  padding: '16px 12px',
  borderBottom: '1px solid #eee',
};

const checkboxStyle: React.CSSProperties = {
  margin: 0,
};

const selectAllCheckbox: React.CSSProperties = {
  margin: 0,
};

const statusBadge: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: 12,
  fontSize: 12,
  fontWeight: 500,
};

const statusCompleted: React.CSSProperties = {
  background: '#d4edda',
  color: '#155724',
};

const statusPending: React.CSSProperties = {
  background: '#fff3cd',
  color: '#856404',
};

const emptyCell: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: 48,
  color: '#999',
};

const bottomActions: React.CSSProperties = {
  display: 'flex',
  gap: 16,
};

export default App;
export {};
