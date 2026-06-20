import { motion } from 'framer-motion';

export function Button({ variant = 'primary', size, className = '', children, ...props }) {
  const cls = ['btn', `btn-${variant}`, size === 'sm' && 'btn-sm', className].filter(Boolean).join(' ');
  return (
    <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} className={cls} {...props}>
      {children}
    </motion.button>
  );
}

export function IconButton({ className = '', children, ...props }) {
  return (
    <motion.button whileTap={{ scale: 0.9 }} className={`icon-btn ${className}`} {...props}>
      {children}
    </motion.button>
  );
}

export function Card({ className = '', hover = false, children, ...props }) {
  return (
    <motion.div className={`card ${hover ? 'card-hover' : ''} ${className}`} {...props}>
      {children}
    </motion.div>
  );
}

export function Badge({ color, live = false, children, className = '' }) {
  return (
    <span
      className={`badge ${live ? 'live' : ''} ${className}`}
      style={{ color, background: `${color}1f`, border: `1px solid ${color}33` }}
    >
      <span className="dot" />
      {children}
    </span>
  );
}

export function Spinner({ size = 18 }) {
  return <span className="spinner" style={{ width: size, height: size }} />;
}
