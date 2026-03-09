import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3333/api',
});

// 
// INTERCEPTOR DE REQUEST
// Injeta o token JWT do localStorage em TODAS as requisicoes automaticamente.
// Evita ter que passar o header manualmente em cada chamada.
// 
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 
// INTERCEPTOR DE RESPONSE
// Loga erros da API no console para facilitar o debug.
// Rejeita a promise para que os catch dos componentes funcionem normalmente.
// 
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('[API] ERRO', error?.response?.data ?? error);
    return Promise.reject(error);
  }
);

export default api;