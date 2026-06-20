import { Building2, Users, Trash2 } from 'lucide-react';
import { Card } from '../ui/Primitives';
import { scoreColor } from '../../utils/status';

function parseSkills(raw) {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export default function JobCard({ job, variant = 'browse', onDelete, delay = 0 }) {
  const skills = parseSkills(job.skills);
  const matches = job.matches || [];

  return (
    <Card
      hover
      className="j-card"
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay, type: 'spring', stiffness: 280, damping: 26 }}
      whileHover={{ y: -3 }}
    >
      <div className="row spread">
        <span className="j-icon">
          <Building2 size={20} />
        </span>
        {variant === 'mine' && onDelete && (
          <button
            className="icon-btn"
            style={{ width: 30, height: 30 }}
            title="Delete"
            onClick={() => onDelete(job)}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <h3>{job.title}</h3>
      <p className="j-desc">{job.description}</p>

      {skills.length > 0 && (
        <div className="j-skills">
          {skills.slice(0, 6).map((s) => (
            <span className="chip" key={s}>
              {s}
            </span>
          ))}
        </div>
      )}

      {variant === 'browse' && job.user?.name && (
        <div className="dim" style={{ fontSize: 12 }}>
          Posted by {job.user.name}
        </div>
      )}

      {variant === 'mine' && (
        <div className="j-matches">
          <div className="row gap-2 muted" style={{ fontSize: 12.5, fontWeight: 600 }}>
            <Users size={14} />
            {matches.length} candidate{matches.length !== 1 ? 's' : ''} matched
          </div>
          {matches.slice(0, 5).map((m) => (
            <div className="match-row" key={m.id}>
              <span className="mr-name">
                <span>{m.resume?.originalName || 'Resume'}</span>
              </span>
              <span
                className="score-pill"
                style={{ color: scoreColor(m.score), background: `${scoreColor(m.score)}1f` }}
              >
                {m.score}%
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
