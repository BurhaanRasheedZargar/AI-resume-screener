import { useState } from 'react';
import { Briefcase, FileText, Tags, Loader2 } from 'lucide-react';
import { api, errorMessage } from '../../api';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Primitives';

export default function JobForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({ title: '', description: '', skills: '' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const skills_required = form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await api.createJob({ title: form.title, description: form.description, skills_required });
      toast('Job posted', 'success');
      onCreated?.();
    } catch (err) {
      toast(errorMessage(err, 'Could not create job'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label>
          <Briefcase size={15} /> Job title
        </label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Senior Software Engineer"
          required
        />
      </div>
      <div className="field">
        <label>
          <FileText size={15} /> Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Responsibilities, requirements, tech stack…"
          rows={5}
          required
        />
      </div>
      <div className="field">
        <label>
          <Tags size={15} /> Required skills (comma-separated)
        </label>
        <input
          value={form.skills}
          onChange={(e) => setForm({ ...form, skills: e.target.value })}
          placeholder="React, Node.js, PostgreSQL"
        />
      </div>
      <div className="row gap-3" style={{ justifyContent: 'flex-end' }}>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="spinner" size={16} /> : <Briefcase size={16} />}
          Post job
        </Button>
      </div>
    </form>
  );
}
