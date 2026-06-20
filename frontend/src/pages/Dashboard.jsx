import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Briefcase, Compass, Plus, Inbox, Sparkles } from 'lucide-react';
import { api, errorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/layout/Navbar';
import PageTransition from '../components/layout/PageTransition';
import { Button, Card } from '../components/ui/Primitives';
import Modal from '../components/ui/Modal';
import UploadDropzone from '../components/resume/UploadDropzone';
import ResumeCard from '../components/resume/ResumeCard';
import ResumeAnalysis from '../components/resume/ResumeAnalysis';
import JobCard from '../components/job/JobCard';
import JobForm from '../components/job/JobForm';

function Empty({ icon: Icon, title, sub }) {
  return (
    <motion.div className="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <span className="em-icon">
        <Icon size={24} />
      </span>
      <div>
        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{title}</div>
        <div style={{ fontSize: 13 }}>{sub}</div>
      </div>
    </motion.div>
  );
}

function Skeletons({ count = 3 }) {
  return (
    <div className="grid" style={{ gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 96 }} />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const canResumes = user?.role === 'CANDIDATE' || user?.role === 'ADMIN';
  const canJobs = user?.role === 'RECRUITER' || user?.role === 'ADMIN';

  const tabs = useMemo(() => {
    const t = [];
    if (canResumes) t.push({ key: 'resumes', label: 'My Resumes', icon: FileText });
    if (canJobs) t.push({ key: 'jobs', label: 'My Jobs', icon: Briefcase });
    t.push({ key: 'browse', label: 'Browse Jobs', icon: Compass });
    return t;
  }, [canResumes, canJobs]);

  const [activeTab, setActiveTab] = useState(canResumes ? 'resumes' : 'jobs');
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadResumes = async () => {
    try {
      const d = await api.getMyResumes();
      setResumes(d.resumes || []);
    } catch {
      /* ignore */
    }
  };
  const loadJobs = async () => {
    try {
      const d = await api.getMyJobs();
      setJobs(d.jobs || []);
    } catch {
      /* ignore */
    }
  };
  const loadAllJobs = async () => {
    try {
      const d = await api.getAllJobs();
      setAllJobs(Array.isArray(d) ? d : d.jobs || []);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    (async () => {
      await Promise.all([canResumes && loadResumes(), canJobs && loadJobs(), loadAllJobs()].filter(Boolean));
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const res = await api.uploadResume(file);
      toast('Resume uploaded', 'success');
      await loadResumes();
      const id = res?.data?.resumeId;
      if (id) setSelected({ id, originalName: file.name, status: 'UPLOADED', uploadedAt: new Date().toISOString() });
    } catch (err) {
      toast(errorMessage(err, 'Upload failed'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResume = async (resume) => {
    try {
      await api.deleteResume(resume.id);
      toast('Resume deleted', 'success');
      if (selected?.id === resume.id) setSelected(null);
      loadResumes();
    } catch (err) {
      toast(errorMessage(err, 'Could not delete'), 'error');
    }
  };

  const handleDeleteJob = async (job) => {
    try {
      await api.deleteJob(job.id);
      toast('Job deleted', 'success');
      loadJobs();
      loadAllJobs();
    } catch (err) {
      toast(errorMessage(err, 'Could not delete'), 'error');
    }
  };

  return (
    <PageTransition>
      <Navbar />
      <div className="container dash">
        <motion.div className="dash-head" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1>
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p>Upload, analyze and match resumes with AI.</p>
        </motion.div>

        <div className="tabs">
          {tabs.map((t) => (
            <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
              {activeTab === t.key && <motion.span layoutId="tabpill" className="tab__pill" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 'resumes' && (
              <>
                <Card style={{ marginBottom: 24 }}>
                  <div className="section-head" style={{ margin: '0 0 14px' }}>
                    <h2>Upload a resume</h2>
                  </div>
                  <UploadDropzone onUpload={handleUpload} uploading={uploading} />
                </Card>

                <div className="dash-split">
                  <div>
                    <div className="section-head">
                      <h2>My Resumes</h2>
                      <span className="dim">{resumes.length}</span>
                    </div>
                    {!loaded ? (
                      <Skeletons />
                    ) : resumes.length ? (
                      <div className="grid" style={{ gap: 14 }}>
                        <AnimatePresence>
                          {resumes.map((r, i) => (
                            <ResumeCard
                              key={r.id}
                              resume={r}
                              delay={i * 0.05}
                              selected={selected?.id === r.id}
                              onSelect={setSelected}
                              onDelete={handleDeleteResume}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Empty icon={Inbox} title="No resumes yet" sub="Upload one above to get started." />
                    )}
                  </div>

                  <div>
                    <div className="section-head">
                      <h2>Results</h2>
                    </div>
                    {selected ? (
                      <ResumeAnalysis key={selected.id} resume={selected} jobs={allJobs} onCompleted={loadResumes} />
                    ) : (
                      <Card className="analysis-empty">
                        <span className="ae-icon">
                          <Sparkles size={26} />
                        </span>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>Select a resume</div>
                          <div style={{ fontSize: 13 }}>Pick a resume to see its pipeline, score and AI feedback.</div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'jobs' && (
              <>
                <div className="section-head">
                  <h2>My Job Postings</h2>
                  <Button onClick={() => setShowJobModal(true)}>
                    <Plus size={16} /> Create job
                  </Button>
                </div>
                {!loaded ? (
                  <Skeletons count={4} />
                ) : jobs.length ? (
                  <div className="grid grid-cards">
                    <AnimatePresence>
                      {jobs.map((j, i) => (
                        <JobCard key={j.id} job={j} variant="mine" delay={i * 0.05} onDelete={handleDeleteJob} />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Empty icon={Briefcase} title="No jobs yet" sub="Create your first job posting." />
                )}
              </>
            )}

            {activeTab === 'browse' && (
              <>
                <div className="section-head">
                  <h2>Browse All Jobs</h2>
                  <span className="dim">{allJobs.length}</span>
                </div>
                {!loaded ? (
                  <Skeletons count={6} />
                ) : allJobs.length ? (
                  <div className="grid grid-cards">
                    <AnimatePresence>
                      {allJobs.map((j, i) => (
                        <JobCard key={j.id} job={j} variant="browse" delay={i * 0.05} />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Empty icon={Compass} title="No jobs posted yet" sub="Check back soon." />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <Modal open={showJobModal} onClose={() => setShowJobModal(false)} title="Create a job">
        <JobForm
          onCreated={() => {
            setShowJobModal(false);
            loadJobs();
            loadAllJobs();
          }}
          onCancel={() => setShowJobModal(false)}
        />
      </Modal>
    </PageTransition>
  );
}
