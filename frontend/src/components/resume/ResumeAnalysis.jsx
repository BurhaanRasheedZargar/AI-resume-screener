import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Play, Loader2, Sparkles, FileSearch } from 'lucide-react';
import { api, errorMessage } from '../../api';
import { useResumeStatus } from '../../hooks/useResumeStatus';
import { useToast } from '../../context/ToastContext';
import { statusColor, statusLabel, isTerminal } from '../../utils/status';
import { Card, Button, Badge } from '../ui/Primitives';
import StatusPipeline from './StatusPipeline';
import ScoreRing from './ScoreRing';

const PROCESSING = ['UPLOADED', 'PARSING', 'MATCHING_REQUESTED'];

export default function ResumeAnalysis({ resume, jobs, onCompleted }) {
  const { status, setStatus, result, repoll } = useResumeStatus(resume.id, resume.status);
  const [jobId, setJobId] = useState('');
  const [starting, setStarting] = useState(false);
  const toast = useToast();

  const processing = PROCESSING.includes(status);
  const completedRef = status === 'COMPLETED';

  useEffect(() => {
    if (status === 'COMPLETED') onCompleted?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const run = async () => {
    if (!jobId) return toast('Pick a job to match against', 'info');
    setStarting(true);
    try {
      await api.triggerMatch(resume.id, jobId);
      setStatus('MATCHING_REQUESTED');
      repoll();
      toast('Analysis started', 'success');
    } catch (err) {
      toast(errorMessage(err, 'Failed to start analysis'), 'error');
    } finally {
      setStarting(false);
    }
  };

  return (
    <Card initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="row spread" style={{ marginBottom: 18 }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 17, marginBottom: 6 }}>Analysis</h2>
          <div className="muted" style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {resume.originalName}
          </div>
        </div>
        <Badge color={statusColor(status)} live={!isTerminal(status)}>
          {statusLabel(status)}
        </Badge>
      </div>

      <StatusPipeline status={status} />

      <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />

      <div className="field" style={{ marginBottom: 12 }}>
        <label>
          <FileSearch size={15} /> Match against a job
        </label>
        <div className="row gap-3">
          <select value={jobId} onChange={(e) => setJobId(e.target.value)} style={{ flex: 1 }}>
            <option value="">Select a job…</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
          <Button onClick={run} disabled={starting || processing || !jobId}>
            {starting || processing ? <Loader2 className="spinner" size={16} /> : <Play size={16} />}
            {processing ? 'Working…' : completedRef ? 'Re-run' : 'Analyze'}
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === 'FAILED' && (
          <motion.div key="failed" className="alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            We couldn't process this resume. Try re-uploading a text-based PDF or DOCX.
          </motion.div>
        )}

        {result && status === 'COMPLETED' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 18px' }}>
              <ScoreRing score={Number(result.score) || 0} />
            </div>
            {result.jobTitle && result.jobTitle !== 'Pending' && (
              <div className="row gap-2" style={{ justifyContent: 'center', marginBottom: 16 }}>
                <span className="muted" style={{ fontSize: 13 }}>vs</span>
                <strong style={{ fontSize: 14 }}>{result.jobTitle}</strong>
              </div>
            )}
            <div className="row gap-2" style={{ marginBottom: 6 }}>
              <Sparkles size={16} className="gradient-text" />
              <h3 style={{ fontSize: 15 }}>AI Feedback</h3>
            </div>
            <div className="feedback">
              <ReactMarkdown>{result.feedback}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
