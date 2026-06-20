import { FileText, TrendingUp, Trash2 } from 'lucide-react';
import { Card, Badge } from '../ui/Primitives';
import { statusColor, statusLabel } from '../../utils/status';

export default function ResumeCard({ resume, selected, onSelect, onDelete, delay = 0 }) {
  const match = resume.matches?.[0];
  return (
    <Card
      hover
      className={`r-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(resume)}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay, type: 'spring', stiffness: 280, damping: 26 }}
      whileHover={{ y: -3 }}
    >
      <div className="r-top">
        <div className="r-file">
          <span className="fi">
            <FileText size={19} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div className="r-name">{resume.originalName}</div>
            <div className="r-sub">{new Date(resume.uploadedAt).toLocaleDateString()}</div>
          </div>
        </div>
        <button
          className="icon-btn"
          style={{ width: 30, height: 30 }}
          title="Delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(resume);
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="row spread">
        <Badge color={statusColor(resume.status)} live={!['COMPLETED', 'FAILED'].includes(resume.status)}>
          {statusLabel(resume.status)}
        </Badge>
        {match && (
          <span className="r-score">
            <TrendingUp size={14} />
            {match.score}%
          </span>
        )}
      </div>
    </Card>
  );
}
