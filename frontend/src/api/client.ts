import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.error?.includes('verify your email')) {
      // Show a browser alert for email verification required
      alert('Please verify your email first. Check your inbox for the verification link.');
    }
    return Promise.reject(error);
  }
);

export default api;
