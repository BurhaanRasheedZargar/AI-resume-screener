import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle, Loader2, Play, Briefcase, Plus, List, TrendingUp } from 'lucide-react';
import { api } from '../api';
import './Dashboard.css';

function Dashboard({ user }) {
  const [activeTab, setActiveTab] = useState(user?.role === 'CANDIDATE' ? 'resumes' : 'jobs');
  const [file, setFile] = useState(null);
  const [resumeId, setResumeId] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [showJobForm, setShowJobForm] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', description: '', skills_required: [] });
  const intervalRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [user, activeTab]);

  useEffect(() => {
    if (resumeId && status !== 'COMPLETED' && status !== 'FAILED') {
      intervalRef.current = setInterval(async () => {
        try {
          const data = await api.getResumeStatus(resumeId);
          setStatus(data.status);
          
          if (data.status === 'COMPLETED') {
            const resultData = await api.getResumeResult(resumeId);
            setResult(resultData);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            loadData();
          }
        } catch (err) {
          console.error('[ERROR] Status polling error:', err);
        }
      }, 2000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [resumeId, status]);

  const loadData = async () => {
    try {
      if (user?.role === 'CANDIDATE' || user?.role === 'ADMIN') {
        const resumesData = await api.getMyResumes();
        setResumes(resumesData.resumes || []);
      }
      if (user?.role === 'RECRUITER' || user?.role === 'ADMIN') {
        const jobsData = await api.getMyJobs();
        setJobs(jobsData.jobs || []);
      }
      const allJobsData = await api.getAllJobs();
      setAllJobs(allJobsData || []);
    } catch (err) {
      console.error('[ERROR] Load data error:', err);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const response = await api.uploadResume(file);
      setResumeId(response.data.resumeId);
      setStatus('UPLOADED');
      setFile(null);
      loadData();
    } catch (err) {
      console.error('[ERROR] Upload failed:', err);
      alert(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createJob = async () => {
    try {
      await api.createJob(newJob);
      setShowJobForm(false);
      setNewJob({ title: '', description: '', skills_required: [] });
      loadData();
    } catch (err) {
      console.error('[ERROR] Job creation failed:', err);
      alert(err.response?.data?.error || 'Job creation failed.');
    }
  };

  const triggerMatch = async (resumeIdToMatch, jobIdToMatch) => {
    try {
      await api.triggerMatch(resumeIdToMatch, jobIdToMatch);
      setStatus('MATCHING_REQUESTED');
      loadData();
    } catch (err) {
      console.error('[ERROR] Match trigger failed:', err);
      alert('Failed to start analysis.');
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'UPLOADED': '#3b82f6',
      'PARSING': '#f59e0b',
      'PARSED': '#8b5cf6',
      'MATCHING_REQUESTED': '#8b5cf6',
      'MATCHED': '#10b981',
      'COMPLETED': '#10b981',
      'FAILED': '#ef4444'
    };
    return statusMap[status] || '#6b7280';
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name}</p>
      </div>

      <div className="dashboard-tabs">
        {user?.role === 'CANDIDATE' && (
          <button
            className={activeTab === 'resumes' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('resumes')}
          >
            <FileText size={18} /> My Resumes
          </button>
        )}
        {(user?.role === 'RECRUITER' || user?.role === 'ADMIN') && (
          <button
            className={activeTab === 'jobs' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('jobs')}
          >
            <Briefcase size={18} /> My Jobs
          </button>
        )}
        <button
          className={activeTab === 'browse' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('browse')}
        >
          <List size={18} /> Browse Jobs
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'resumes' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Upload Resume</h2>
            </div>
            <div className="card">
              <div className="upload-area">
                <input
                  type="file"
                  onChange={e => setFile(e.target.files[0])}
                  accept=".pdf,.docx"
                  className="file-input"
                />
                <button
                  onClick={handleUpload}
                  disabled={loading || !file}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <Loader2 className="spinner" size={18} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Upload Resume
                    </>
                  )}
                </button>
              </div>
            </div>

            {resumeId && (
              <div className="card">
                <div className="status-section">
                  <h3>Current Upload Status</h3>
                  <div className="status-indicator-wrapper">
                    <div
                      className="status-dot"
                      style={{ backgroundColor: getStatusColor(status) }}
                    />
                    <span className="status-text">{status || 'PENDING'}</span>
                  </div>
                  {status !== 'COMPLETED' && status !== 'FAILED' && selectedJob && (
                    <button
                      onClick={() => triggerMatch(resumeId, selectedJob)}
                      disabled={status === 'MATCHING_REQUESTED'}
                      className="btn btn-primary"
                    >
                      <Play size={18} /> Start Analysis
                    </button>
                  )}
                </div>
                {status !== 'COMPLETED' && status !== 'FAILED' && (
                  <div className="progress-bar-container">
                    <div className="progress-bar" />
                  </div>
                )}
              </div>
            )}

            {result && (
              <div className="card result-card">
                <div className="result-header">
                  <CheckCircle className="success-icon" size={24} />
                  <h2>Analysis Complete</h2>
                </div>
                <div className="score-display">
                  <span className="score-label">Match Score</span>
                  <span className="score-value">{result.score}%</span>
                </div>
                <div className="feedback-section">
                  <h3>AI Feedback</h3>
                  <div className="feedback-content">{result.feedback}</div>
                </div>
              </div>
            )}

            <div className="section-header">
              <h2>My Resumes</h2>
            </div>
            <div className="resumes-grid">
              {resumes.map((resume) => (
                <div key={resume.id} className="resume-card">
                  <FileText size={24} />
                  <h3>{resume.originalName}</h3>
                  <div className="status-badge" style={{ backgroundColor: getStatusColor(resume.status) + '20', color: getStatusColor(resume.status) }}>
                    {resume.status}
                  </div>
                  {resume.matches?.[0] && (
                    <div className="match-info">
                      <TrendingUp size={16} />
                      <span>Score: {resume.matches[0].score}%</span>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setResumeId(resume.id);
                      setStatus(resume.status);
                      if (resume.status === 'COMPLETED') {
                        api.getResumeResult(resume.id).then(setResult);
                      }
                    }}
                    className="btn btn-secondary"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>My Job Postings</h2>
              <button onClick={() => setShowJobForm(!showJobForm)} className="btn btn-primary">
                <Plus size={18} /> Create Job
              </button>
            </div>

            {showJobForm && (
              <div className="card">
                <h3>Create New Job</h3>
                <div className="form-group">
                  <label>Job Title</label>
                  <input
                    type="text"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    placeholder="Job description and requirements..."
                    rows="5"
                  />
                </div>
                <div className="form-group">
                  <label>Required Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={newJob.skills_required.join(', ')}
                    onChange={(e) => setNewJob({
                      ...newJob,
                      skills_required: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    })}
                    placeholder="e.g., JavaScript, React, Node.js"
                  />
                </div>
                <div className="form-actions">
                  <button onClick={createJob} className="btn btn-primary">Create Job</button>
                  <button onClick={() => setShowJobForm(false)} className="btn btn-secondary">Cancel</button>
                </div>
              </div>
            )}

            <div className="jobs-grid">
              {jobs.map((job) => (
                <div key={job.id} className="job-card">
                  <Building2 size={24} />
                  <h3>{job.title}</h3>
                  <p className="job-description">{job.description.substring(0, 150)}...</p>
                  {job.matches?.length > 0 && (
                    <div className="match-count">
                      {job.matches.length} resume{job.matches.length !== 1 ? 's' : ''} matched
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'browse' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Browse All Jobs</h2>
            </div>
            <div className="jobs-grid">
              {allJobs.map((job) => (
                <div key={job.id} className="job-card">
                  <Building2 size={24} />
                  <h3>{job.title}</h3>
                  <p className="job-description">{job.description.substring(0, 150)}...</p>
                  {user?.role === 'CANDIDATE' && resumeId && (
                    <button
                      onClick={() => {
                        setSelectedJob(job.id);
                        triggerMatch(resumeId, job.id);
                      }}
                      className="btn btn-primary"
                    >
                      Match Resume
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

