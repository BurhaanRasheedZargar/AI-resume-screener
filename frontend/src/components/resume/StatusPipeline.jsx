import { motion } from 'framer-motion';
import { Upload, FileSearch, Target, Sparkles, Check, X } from 'lucide-react';
import { PIPELINE_STAGES, pipelineState } from '../../utils/status';

const ICONS = [Upload, FileSearch, Target, Sparkles];

export default function StatusPipeline({ status }) {
  const { completed, active, failed } = pipelineState(status);
  const fillPct = (Math.max(0, completed) / (PIPELINE_STAGES.length - 1)) * 100;

  return (
    <div className="pipeline">
      <div className="pl-track">
        <motion.div
          className="pl-fill"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(fillPct, 100)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {PIPELINE_STAGES.map((label, i) => {
        const Icon = ICONS[i];
        const isDone = i < completed;
        const isActive = i === active;
        const isFailed = failed && i === completed;
        const nodeClass = isFailed ? 'failed' : isDone ? 'done' : isActive ? 'active' : '';

        return (
          <div className="pl-step" key={label}>
            <motion.div
              className={`pl-node ${nodeClass}`}
              initial={false}
              animate={{ scale: isActive ? 1.08 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {isFailed ? <X size={17} /> : isDone ? <Check size={17} /> : <Icon size={16} />}
            </motion.div>
            <span className={`pl-label ${isDone || isActive ? 'on' : ''}`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
