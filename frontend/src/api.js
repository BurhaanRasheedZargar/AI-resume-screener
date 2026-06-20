import axios from 'axios';

const client = axios.create({ baseURL: '/api' });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register');
    if (err.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(err);
  }
);

export const api = {
  register: (data) => client.post('/auth/register', data).then((r) => r.data),
  login: (data) => client.post('/auth/login', data).then((r) => r.data),
  getProfile: () => client.get('/auth/me').then((r) => r.data),

  uploadResume: (file) => {
    const form = new FormData();
    form.append('resume', file);
    return client.post('/resume/upload', form).then((r) => r.data);
  },
  getMyResumes: () => client.get('/resume/my').then((r) => r.data),
  getResumeStatus: (id) => client.get(`/resume/${id}/status`).then((r) => r.data),
  getResumeResult: (id) => client.get(`/resume/${id}/result`).then((r) => r.data),
  deleteResume: (id) => client.delete(`/resume/${id}`).then((r) => r.data),

  createJob: (data) => client.post('/jobs', data).then((r) => r.data),
  getMyJobs: () => client.get('/jobs/my').then((r) => r.data),
  getAllJobs: () => client.get('/jobs').then((r) => r.data),
  deleteJob: (id) => client.delete(`/jobs/${id}`).then((r) => r.data),

  triggerMatch: (resumeId, jobId) =>
    client.post('/match', { resumeId, jobId }).then((r) => r.data),
};

export function errorMessage(err, fallback = 'Something went wrong') {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (Array.isArray(data.details) && data.details.length) {
    return data.details.map((d) => d.message).join(', ');
  }
  return data.error || fallback;
}
