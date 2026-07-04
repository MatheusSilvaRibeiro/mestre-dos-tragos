import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

// 
// SPLASH SCREEN
// Exibida na raiz "/" por 1.8s antes de redirecionar.
// Redireciona para login se nao autenticado.
// Redireciona para a tela correta conforme o role do funcionario.
// 
export default function Splash() {
  const { isAuthenticated, funcionario } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthenticated) { navigate('/login'); return; }
      if      (funcionario?.role === 'ADMIN')   navigate('/admin');
      else if (funcionario?.role === 'COZINHA') navigate('/cozinha');
      else                                       navigate('/atendente');
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', gap: '2rem' }}>

      {/* LOGO — animacao de entrada com spring */}
      <div style={{ animation: 'splashIn 0.65s cubic-bezier(0.34,1.56,0.64,1) forwards', opacity: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ width: 100, height: 100, background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', borderRadius: 'var(--radius-2xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', boxShadow: '0 8px 40px rgba(245,158,11,0.35)' }}>
          🍺
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Mestre dos{' '}
            <span style={{ color: 'var(--brand-primary)' }}>Tragos</span>
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
            Sistema de Gestao
          </p>
        </div>
      </div>

      {/* LOADING DOTS — 3 bolinhas com bounce escalonado */}
      <div style={{ display: 'flex', gap: '0.4rem', animation: 'fadeIn 0.4s ease 0.9s forwards', opacity: 0 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--brand-primary)', animation: `dotBounce 1.2s ease ${i * 0.18}s infinite` }} />
        ))}
      </div>

      {/* VERSAO — aparece por ultimo */}
      <p style={{ position: 'absolute', bottom: '1.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)', animation: 'fadeIn 0.4s ease 1.2s forwards', opacity: 0 }}>
        v2.0 · {new Date().getFullYear()}
      </p>
    </div>
  );
}