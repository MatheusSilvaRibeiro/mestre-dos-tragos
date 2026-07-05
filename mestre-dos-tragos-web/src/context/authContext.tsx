/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface Funcionario {
  id:      string;
  usuario: string;
  nome:    string;
  role:    'ADMIN' | 'ATENDENTE' | 'COZINHA';
}

interface AuthContextData {
  funcionario:     Funcionario | null;
  token:           string | null;
  login:           (token: string, funcionario: Funcionario) => void;
  logout:          () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

function parseSafe<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('token')
  );

  const [funcionario, setFuncionario] = useState<Funcionario | null>(
    () => parseSafe<Funcionario>('funcionario')
  );

  function login(novoToken: string, novoFuncionario: Funcionario) {
    localStorage.setItem('token', novoToken);
    localStorage.setItem('funcionario', JSON.stringify(novoFuncionario));
    setToken(novoToken);
    setFuncionario(novoFuncionario);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('funcionario');
    setToken(null);
    setFuncionario(null);
  }

  return (
    <AuthContext.Provider value={{
      token,
      funcionario,
      login,
      logout,
      isAuthenticated: !!token && !!funcionario,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}