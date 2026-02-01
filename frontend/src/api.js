import axios from 'axios';

const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  register: async (userData) => {
    const response = await axios.post(`${API_BASE}/auth/register`, userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await axios.post(`${API_BASE}/auth/login`, credentials);
    return response.data;
  },

  getProfile: async () => {
    const response = await axios.get(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  uploadResume: async (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    const response = await axios.post(`${API_BASE}/resume/upload`, formData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getMyResumes: async () => {
    const response = await axios.get(`${API_BASE}/resume/my`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getResumeStatus: async (resumeId) => {
    const response = await axios.get(`${API_BASE}/resume/${resumeId}/status`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getResumeResult: async (resumeId) => {
    const response = await axios.get(`${API_BASE}/resume/${resumeId}/result`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  createJob: async (jobData) => {
    const response = await axios.post(`${API_BASE}/jobs`, jobData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getMyJobs: async () => {
    const response = await axios.get(`${API_BASE}/jobs/my`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getAllJobs: async () => {
    const response = await axios.get(`${API_BASE}/jobs`);
    return response.data;
  },

  triggerMatch: async (resumeId, jobId) => {
    const response = await axios.post(`${API_BASE}/match`, { resumeId, jobId }, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};
