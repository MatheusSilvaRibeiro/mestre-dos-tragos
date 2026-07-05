import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { useAuth } from '../context/authContext';
import api from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [usuario, setUsuario] = useState('');
  const [senha,   setSenha]   = useState('');
  const [loading, setLoading] = useState(false);
  const [erro,    setErro]    = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { usuario, senha });
      const { token, funcionario } = res.data;
      // flushSync garante que o contexto e atualizado antes da navegacao
      flushSync(() => login(token, funcionario));
      if      (funcionario.role === 'ADMIN')   navigate('/selecionar', { replace: true });
      else if (funcionario.role === 'COZINHA') navigate('/cozinha',    { replace: true });
      else                                     navigate('/atendente',  { replace: true });
    } catch (err: any) {
      setErro(err?.response?.data?.erro || 'Usuario ou senha invalidos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ height: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>

      {/* LADO ESQUERDO — BRANDING */}
      <div style={{
        background:     'linear-gradient(160deg, #111827 0%, #0b0e18 60%, rgba(245,158,11,0.06) 100%)',
        borderRight:    '1px solid var(--border-color)',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '3rem',
        gap:            '2rem',
      }}>
        {/* Logo */}
        <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', boxShadow: '0 8px 32px rgba(245,158,11,0.3)' }}>
          🍺
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
            Mestre dos{' '}
            <span style={{ color: 'var(--brand-primary)' }}>Tragos</span>
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-tertiary)', maxWidth: 260 }}>
            Plataforma completa de gestao para sua lancheria
          </p>
        </div>

        {/* Features destacadas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
          {[
            { emoji: '🧾', text: 'Gestao de pedidos em tempo real' },
            { emoji: '📊', text: 'Dashboard com metricas completas' },
            { emoji: '👨‍🍳', text: 'Painel da cozinha integrado' },
          ].map(f => (
            <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <span style={{ width: 32, height: 32, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9375rem', flexShrink: 0 }}>
                {f.emoji}
              </span>
              {f.text}
            </div>
          ))}
        </div>
      </div>

      {/* LADO DIREITO — FORMULARIO */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-base)' }}>
        <div style={{ width: '100%', maxWidth: 380, animation: 'fadeIn 0.3s ease' }}>

          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.375rem' }}>
              Bem-vindo de volta
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
              Acesse com suas credenciais
            </p>
          </div>

          <div className="surface-elevated" style={{ padding: '1.75rem' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

              <div className="input-wrapper">
                <label className="input-label">Usuario</label>
                <div className="input-icon-wrapper">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    className="input-field has-icon"
                    value={usuario}
                    onChange={e => setUsuario(e.target.value)}
                    required
                    autoFocus
                    autoComplete="username"
                    placeholder="seu.usuario"
                  />
                </div>
              </div>

              <div className="input-wrapper">
                <label className="input-label">Senha</label>
                <div className="input-icon-wrapper">
                  <span className="input-icon">🔑</span>
                  <input
                    type="password"
                    className="input-field has-icon"
                    placeholder="••••••••"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* Mensagem de erro — visivel apenas quando houver falha no login */}
              {erro && (
                <div className="alert alert-error">
                  <span>⚠️</span> {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.25rem', fontSize: '0.9375rem' }}
              >
                {loading
                  ? <><span className="spinner spinner-sm" /> Entrando...</>
                  : 'Entrar'
                }
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '1.5rem' }}>
            © {new Date().getFullYear()} Mestre dos Tragos
          </p>
        </div>
      </div>
    </div>
  );
}