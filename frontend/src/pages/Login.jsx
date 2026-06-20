import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { api, errorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/layout/PageTransition';
import { Button } from '../components/ui/Primitives';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(form);
      login(res.user, res.token);
      navigate('/dashboard');
    } catch (err) {
      setError(errorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="auth-wrap">
        <motion.div
          className="card auth-card"
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 26 }}
        >
          <div className="auth-head">
            <motion.div className="auth-badge" whileHover={{ rotate: -8, scale: 1.05 }}>
              <LogIn size={26} />
            </motion.div>
            <h1>Welcome back</h1>
            <p>Sign in to continue to your dashboard</p>
          </div>

          {error && (
            <motion.div className="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={submit}>
            <div className="field">
              <label>
                <Mail size={15} /> Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="field">
              <label>
                <Lock size={15} /> Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" variant="primary" className="btn-block" disabled={loading}>
              {loading ? <Loader2 className="spinner" size={16} /> : <LogIn size={16} />}
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="auth-foot">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </motion.div>
      </div>
    </PageTransition>
  );
}
