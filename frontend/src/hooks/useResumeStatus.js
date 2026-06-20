import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../api';

export function useResumeStatus(resumeId, initialStatus = '') {
  const [status, setStatus] = useState(initialStatus);
  const [result, setResult] = useState(null);
  const timer = useRef(null);

  const fetchResult = useCallback(async (id) => {
    try {
      const r = await api.getResumeResult(id);
      setResult(r);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setStatus(initialStatus);
    setResult(null);
    if (!resumeId) return;

    let active = true;

    const poll = async () => {
      try {
        const data = await api.getResumeStatus(resumeId);
        if (!active) return;
        setStatus(data.status);
        if (data.status === 'COMPLETED') {
          fetchResult(resumeId);
          return;
        }
        if (data.status === 'FAILED') return;
        timer.current = setTimeout(poll, 2000);
      } catch {
        if (active) timer.current = setTimeout(poll, 3000);
      }
    };

    if (initialStatus === 'COMPLETED') {
      fetchResult(resumeId);
    }
    poll();

    return () => {
      active = false;
      clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  const repoll = useCallback(() => {
    clearTimeout(timer.current);
    let cancelled = false;
    const poll = async () => {
      try {
        const data = await api.getResumeStatus(resumeId);
        if (cancelled) return;
        setStatus(data.status);
        if (data.status === 'COMPLETED') return fetchResult(resumeId);
        if (data.status === 'FAILED') return;
        timer.current = setTimeout(poll, 2000);
      } catch {
        timer.current = setTimeout(poll, 3000);
      }
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [resumeId, fetchResult]);

  return { status, setStatus, result, repoll };
}
