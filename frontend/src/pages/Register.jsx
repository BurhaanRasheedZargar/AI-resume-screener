import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, User, Mail, Lock, Loader2, AlertCircle, GraduationCap, Briefcase } from 'lucide-react';
import { api, errorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/layout/PageTransition';
import { Button } from '../components/ui/Primitives';

const ROLES = [
  { value: 'CANDIDATE', title: 'Candidate', desc: 'Upload & analyze resumes', icon: GraduationCap },
  { value: 'RECRUITER', title: 'Recruiter', desc: 'Post jobs & screen talent', icon: Briefcase },
];

export default function Register() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CANDIDATE' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.register(form);
      login(res.user, res.token);
      navigate('/dashboard');
    } catch (err) {
      setError(errorMessage(err, 'Registration failed. Please try again.'));
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
            <motion.div className="auth-badge" whileHover={{ rotate: 8, scale: 1.05 }}>
              <UserPlus size={26} />
            </motion.div>
            <h1>Create account</h1>
            <p>Join in seconds to get started</p>
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
                <User size={15} /> Full name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jane Doe"
                required
              />
            </div>
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
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </div>

            <div className="field">
              <label>
                <User size={15} /> Account type
              </label>
              <div className="role-picker">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const active = form.role === r.value;
                  return (
                    <motion.button
                      type="button"
                      key={r.value}
                      className={`role-opt ${active ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, role: r.value })}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Icon size={18} className={active ? 'gradient-text' : 'muted'} />
                      <span className="t">{r.title}</span>
                      <span className="d">{r.desc}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <Button type="submit" variant="primary" className="btn-block" disabled={loading}>
              {loading ? <Loader2 className="spinner" size={16} /> : <UserPlus size={16} />}
              {loading ? 'Creating…' : 'Create account'}
            </Button>
          </form>

          <p className="auth-foot">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </PageTransition>
  );
}
