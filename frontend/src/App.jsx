import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle, Loader2, Play, Briefcase, LogOut, User, Home, FileCheck, Building2 } from 'lucide-react';
import { api } from './api';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setCurrentView('dashboard');
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setCurrentView('login');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 className="spinner" size={48} />
      </div>
    );
  }

  if (currentView === 'login') {
    return (
      <>
        <Login onLogin={handleLogin} />
        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
          <a href="#register" onClick={() => setCurrentView('register')} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
            Don't have an account? Sign up
          </a>
        </div>
      </>
    );
  }

  if (currentView === 'register') {
    return (
      <>
        <Register onLogin={handleLogin} />
        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
          <a href="#login" onClick={() => setCurrentView('login')} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
            Already have an account? Sign in
          </a>
        </div>
      </>
    );
  }

  return (
    <div className="app-wrapper">
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-brand">
            <FileCheck size={24} />
            <span>Resume Screener</span>
          </div>
          <div className="nav-user">
            <div className="user-info">
              <User size={18} />
              <span>{user?.name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
            <button onClick={handleLogout} className="btn-icon" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <Dashboard user={user} />
    </div>
  );
}

export default App;
