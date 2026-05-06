import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

const clientApi = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error handling
clientApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can handle global errors here (e.g., redirect to login on 401)
    if (error.response?.status === 401) {
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default clientApi;
