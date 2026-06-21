import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FileCheck, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { IconButton } from '../ui/Primitives';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const initials = (user?.name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -68, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
    >
      <div className="container nav-inner">
        <div className="nav-brand">
          <span className="logo">
            <FileCheck size={20} />
          </span>
          <span>
            Resume<span className="gradient-text">Screener</span>
          </span>
        </div>

        <div className="nav-user">
          <div className="user-chip">
            <span className="user-avatar">{initials}</span>
            <span className="user-meta">
              <span className="name">{user?.name}</span>
              <span className="role">{user?.role}</span>
            </span>
          </div>
          <IconButton onClick={handleLogout} title="Log out" aria-label="Log out">
            <LogOut size={17} />
          </IconButton>
        </div>
      </div>
    </motion.nav>
  );
}
