import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  name?: string;
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.clear();
      }
    }
  }, []);

  const login = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const LoginForm = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      login({ id: '1', email: formData.email, name: 'Test User' });
    };

    return (
      <div style={{ 
        maxWidth: 400, 
        margin: '100px auto', 
        padding: 40, 
        borderRadius: 12, 
        background: 'white', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)' 
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: 30, color: '#333' }}>🔐 Вход</h2>
        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Email" 
            value={formData.email} 
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
            style={{ width: '100%', padding: 15, marginBottom: 20, borderRadius: 8, border: '1px solid #ddd' }} 
            required 
          />
          <input 
            type="password" 
            placeholder="Пароль" 
            value={formData.password} 
            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
            style={{ width: '100%', padding: 15, marginBottom: 20, borderRadius: 8, border: '1px solid #ddd' }} 
            required 
          />
          <button 
            type="submit" 
            style={{ 
              width: '100%', 
              padding: 15, 
              background: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: 8, 
              fontSize: 16,
              fontWeight: 'bold'
            }}
          >
            ✅ Войти
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/register" style={{ color: '#007bff' }}>Создать аккаунт</a>
        </p>
      </div>
    );
  };

  const Dashboard = () => (
    <div style={{ padding: 50, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <h1 style={{ color: '#333' }}>🎉 Добро пожаловать!</h1>
        <button 
          onClick={logout} 
          style={{ 
            padding: 12, 
            background: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: 8, 
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🚪 Выйти
        </button>
      </div>
      <div style={{ background: '#f8f9fa', padding: 30, borderRadius: 12 }}>
        <h3>👤 Пользователь:</h3>
        <p><strong>ID:</strong> {user?.id}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Имя:</strong> {user?.name || 'Не указано'}</p>
      </div>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <LoginForm /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
