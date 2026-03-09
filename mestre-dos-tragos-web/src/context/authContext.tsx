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

// 
// PARSE SEGURO DO LOCALSTORAGE
// Evita crashes quando o valor salvo esta corrompido, indefinido ou nulo.
// Remove automaticamente a chave invalida para nao acumular lixo no storage.
// 
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

// 
// AUTH PROVIDER
// Gerencia o estado de autenticacao global da aplicacao.
// O token e o funcionario sao persistidos no localStorage para sobreviver ao refresh da pagina.
// Na inicializacao, recupera os dados ja salvos — se estiverem corrompidos, ignora com seguranca.
// 
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('token')
  );

  const [funcionario, setFuncionario] = useState<Funcionario | null>(
    () => parseSafe<Funcionario>('funcionario')
  );

  // Salva token e funcionario no estado e no localStorage simultaneamente
  function login(novoToken: string, novoFuncionario: Funcionario) {
    localStorage.setItem('token', novoToken);
    localStorage.setItem('funcionario', JSON.stringify(novoFuncionario));
    setToken(novoToken);
    setFuncionario(novoFuncionario);
  }

  // Remove todos os dados de sessao — usado no botao de sair
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
      // Autenticado somente se tiver AMBOS — token e dados do funcionario
      isAuthenticated: !!token && !!funcionario,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook de acesso ao contexto — uso: const { funcionario, login, logout } = useAuth()
export function useAuth() {
  return useContext(AuthContext);
}