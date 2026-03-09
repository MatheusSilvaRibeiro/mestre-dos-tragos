import React from 'react';

// 
// MODAL OVERLAY
// Container base para todos os modais — overlay escuro + caixa centralizada.
// Clicar fora da caixa (no overlay) fecha o modal automaticamente.
// 
export function ModalOverlay({ titulo, onFechar, children }: {
  titulo:   string;
  onFechar: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onFechar(); }}
    >
      <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
        {/* HEADER — titulo e botao de fechar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{titulo}</h3>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '1.25rem', lineHeight: 1 }}>x</button>
        </div>
        {/* BODY — conteudo passado como children */}
        <div style={{ padding: '1.5rem' }}>{children}</div>
      </div>
    </div>
  );
}

// 
// CAMPO INPUT
// Input padronizado para os formularios dos modais.
// Borda muda para brand-primary no focus — feedback visual imediato.
// 
export function CampoInput({ label, placeholder, value, onChange, type = 'text' }: {
  label:       string;
  placeholder: string;
  value:       string;
  onChange:    (v: string) => void;
  type?:       string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--brand-primary)')}
        onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border-color)')}
      />
    </div>
  );
}

// 
// FOOTER MODAL
// Rodape padrao com botoes Cancelar e Confirmar.
// O botao de confirmar fica desabilitado enquanto salvando=true.
// O prop danger troca a cor para vermelho — usado no modal de deletar.
// 
export function FooterModal({ onCancelar, onConfirmar, salvando, labelConfirmar, danger = false }: {
  onCancelar:     () => void;
  onConfirmar:    () => void;
  salvando:       boolean;
  labelConfirmar: string;
  danger?:        boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
      <button onClick={onCancelar} className="btn btn-ghost" style={{ flex: 1 }}>Cancelar</button>
      <button
        onClick={onConfirmar}
        disabled={salvando}
        style={{ flex: 1, padding: '0.625rem', borderRadius: 'var(--radius-md)', border: 'none', background: danger ? '#f43f5e' : 'var(--brand-primary)', color: danger ? '#fff' : 'var(--brand-text)', fontWeight: 700, fontSize: '0.875rem', cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.6 : 1 }}
      >
        {salvando ? '...' : labelConfirmar}
      </button>
    </div>
  );
}
