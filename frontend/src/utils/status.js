export const STATUS_COLOR = {
  UPLOADED: '#60a5fa',
  PARSING: '#fbbf24',
  PARSED: '#a78bfa',
  MATCHING_REQUESTED: '#a78bfa',
  MATCHED: '#34d399',
  COMPLETED: '#34d399',
  FAILED: '#f87171',
  DELETED: '#686e84',
};

export const statusColor = (s) => STATUS_COLOR[s] || '#686e84';

export const isTerminal = (s) => s === 'COMPLETED' || s === 'FAILED';

export const statusLabel = (s) =>
  ({
    MATCHING_REQUESTED: 'MATCHING',
  })[s] || s || 'PENDING';

export const PIPELINE_STAGES = ['Upload', 'Parse', 'Match', 'Feedback'];

const COMPLETED_COUNT = {
  UPLOADED: 1,
  PARSING: 1,
  PARSED: 2,
  MATCHING_REQUESTED: 2,
  MATCHED: 3,
  COMPLETED: 4,
  FAILED: 0,
};

export function pipelineState(status) {
  const completed = COMPLETED_COUNT[status] ?? 0;
  const failed = status === 'FAILED';
  const done = status === 'COMPLETED';
  const active = done || failed ? -1 : completed;
  return { completed, active, failed, done };
}

export const scoreColor = (score) =>
  score >= 75 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';
