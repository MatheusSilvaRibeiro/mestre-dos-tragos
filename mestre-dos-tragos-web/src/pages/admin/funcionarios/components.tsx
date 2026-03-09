import { ROLE_CONFIG } from './config';
import type { Funcionario } from './tipos';

// 
// SECTION TITLE
// Cabecalho padrao de secao — emoji + titulo alinhados horizontalmente.
// Usado para separar visualmente blocos dentro de modais e formularios.
// 
export function SectionTitle({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
      <span style={{ fontSize: '1rem' }}>{emoji}</span>
      <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
        {title}
      </h2>
    </div>
  );
}

// 
// SELETOR DE ROLE
// Exibe os 3 cargos (ADMIN, ATENDENTE, COZINHA) como botoes selecionaveis.
// A cor e o fundo de cada botao vem do ROLE_CONFIG — nao esta hardcoded aqui.
// 
export function SeletorRole({ value, onChange }: {
  value:    string;
  onChange: (r: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
        Cargo
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        {Object.entries(ROLE_CONFIG).map(([key, val]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            style={{
              padding:      '0.75rem 0.5rem',
              borderRadius: 'var(--radius-lg)',
              // Borda e fundo mudam conforme o role selecionado
              border:       `2px solid ${value === key ? val.cor : 'var(--border-color)'}`,
              background:   value === key ? val.bg : 'transparent',
              color:        value === key ? val.cor : 'var(--text-tertiary)',
              fontSize:     '0.8125rem',
              fontWeight:   700,
              cursor:       'pointer',
              transition:   'all 0.15s ease',
            }}
          >
            {val.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// 
// LINHA DA TABELA DE FUNCIONARIOS
// Exibe uma linha completa com avatar, nome, cargo, status, data e acoes.
// O avatar e gerado com a inicial do nome — sem necessidade de imagem.
// 
export function LinhaFuncionario({ f, onEditar, onResetar, onToggle, onDeletar }: {
  f:         Funcionario;
  onEditar:  (f: Funcionario) => void;
  onResetar: (f: Funcionario) => void;
  onToggle:  (f: Funcionario) => void;
  onDeletar: (f: Funcionario) => void;
}) {
  const role = ROLE_CONFIG[f.role];

  return (
    <div
      style={{
        display:             'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
        gap:                 '1rem',
        padding:             '0.875rem 1.25rem',
        alignItems:          'center',
        borderBottom:        '1px solid var(--bg-elevated)',
        transition:          'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* NOME + USUARIO — avatar gerado pela inicial do nome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width:          40,
          height:         40,
          borderRadius:   'var(--radius-lg)',
          background:     role?.bg  ?? 'var(--bg-elevated)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontWeight:     800,
          fontSize:       '1rem',
          color:          role?.cor ?? 'var(--text-tertiary)',
          flexShrink:     0,
        }}>
          {f.nome.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem', margin: 0 }}>
            {f.nome}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>
            @{f.usuario}
          </p>
        </div>
      </div>

      {/* CARGO — badge colorido conforme o ROLE_CONFIG */}
      <div>
        <span style={{
          padding:      '0.25rem 0.625rem',
          borderRadius: 'var(--radius-md)',
          background:   role?.bg  ?? 'var(--bg-elevated)',
          color:        role?.cor ?? 'var(--text-tertiary)',
          fontSize:     '0.75rem',
          fontWeight:   700,
        }}>
          {role?.label ?? f.role}
        </span>
      </div>

      {/* STATUS — ponto verde/cinza + texto Ativo/Inativo */}
      <div>
        <span style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '0.375rem',
          fontSize:   '0.75rem',
          fontWeight: 700,
          color:      f.ativo ? '#10b981' : 'var(--text-tertiary)',
        }}>
          <span style={{
            width:        7,
            height:       7,
            borderRadius: '50%',
            background:   f.ativo ? '#10b981' : 'var(--text-tertiary)',
            flexShrink:   0,
          }} />
          {f.ativo ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      {/* DATA DE CADASTRO — formatada para pt-BR */}
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
        {new Date(f.criadoEm).toLocaleDateString('pt-BR')}
      </div>

      {/* ACOES — 4 botoes: editar, resetar senha, ativar/desativar, deletar */}
      <div style={{ display: 'flex', gap: '0.375rem' }}>
        {[
          { title: 'Editar',                              emoji: '✏️',                          cor: '#6366f1',            bg: 'rgba(99,102,241,0.08)',  fn: () => onEditar(f)  },
          { title: 'Resetar senha',                       emoji: '🔑',                          cor: '#f59e0b',            bg: 'rgba(245,158,11,0.08)',  fn: () => onResetar(f) },
          { title: f.ativo ? 'Desativar' : 'Ativar',     emoji: f.ativo ? '✅' : '⭕',         cor: f.ativo ? '#10b981' : 'var(--text-tertiary)', bg: f.ativo ? 'rgba(16,185,129,0.08)' : 'var(--bg-elevated)', fn: () => onToggle(f) },
          { title: 'Deletar',                             emoji: '🗑️',                          cor: '#f43f5e',            bg: 'rgba(244,63,94,0.08)',   fn: () => onDeletar(f) },
        ].map(btn => (
          <button
            key={btn.title}
            title={btn.title}
            onClick={btn.fn}
            style={{
              width:          32,
              height:         32,
              borderRadius:   'var(--radius-md)',
              border:         'none',
              background:     btn.bg,
              color:          btn.cor,
              cursor:         'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       '0.875rem',
              transition:     'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {btn.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// 
// HEADER DA TABELA
// Cabecalho fixo com os mesmos gridTemplateColumns da LinhaFuncionario
// para garantir alinhamento perfeito entre cabecalho e linhas.
// 
export function HeaderTabela() {
  const cols = ['Funcionario', 'Cargo', 'Status', 'Cadastro', 'Acoes'];

  return (
    <div style={{
      display:             'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
      gap:                 '1rem',
      padding:             '0.625rem 1.25rem',
      borderBottom:        '1px solid var(--border-color)',
    }}>
      {cols.map(c => (
        <p key={c} style={{
          fontSize:      '0.6875rem',
          fontWeight:    700,
          color:         'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          margin:        0,
        }}>
          {c}
        </p>
      ))}
    </div>
  );
}