import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — JWT token attach
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sanchoy_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — auto logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sanchoy_token');
      localStorage.removeItem('sanchoy_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
