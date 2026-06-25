import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5053';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: aggiunge il token JWT ad ogni richiesta
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Scarica un blob da una url qualsiasi (relativa all'API o assoluta verso S3).
// Il frontend legge solo `documento.url` e passa questa: non sa né gli importa
// dove il file risieda fisicamente.
export async function fetchBlob(url: string): Promise<Blob> {
  const { data } = await api.get(url, { responseType: 'blob' });
  return data;
}

export async function downloadBlob(url: string, nomeFile: string): Promise<void> {
  const blob = await fetchBlob(url);
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = nomeFile;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

// Interceptor: gestisce gli errori 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
