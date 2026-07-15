import axios from 'axios';

// Mesmo padrao ja usado pelo Socket.IO (ver src/pages/cozinha/index.tsx):
// le VITE_API_URL do ambiente, com o mesmo valor de producao como fallback
// caso a variavel nao esteja definida. Antes disso, essa baseURL estava
// fixa no codigo — rodar o frontend localmente sempre dependia da API de
// producao estar no ar, mesmo com um backend local rodando do lado.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'https://mestre-dos-tragos-api.onrender.com';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
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