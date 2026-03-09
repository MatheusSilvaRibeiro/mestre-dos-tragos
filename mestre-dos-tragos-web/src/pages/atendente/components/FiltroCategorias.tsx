interface Props {
  categorias:     string[];
  categoriaAtiva: string;
  onCategoria:    (cat: string) => void;
}

// Emoji por nome de categoria — fallback para icone generico se nao encontrado
const CATEGORIA_EMOJI: Record<string, string> = {
  'Todos':      '🍽️',
  'Lanches':    '🍔',
  'Porcoes':    '🍟',
  'Bebidas':    '🍺',
  'Sobremesas': '🍫',
};

// 
// FILTRO DE CATEGORIAS
// Coluna lateral esquerda com botoes de filtro em formato de icone + label.
// A categoria ativa recebe fundo amarelo e texto escuro.
// 
export function FiltroCategorias({ categorias, categoriaAtiva, onCategoria }: Props) {
  return (
    <div style={{ width: 72, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.75rem 0.5rem', background: 'var(--bg-surface)', borderRight: '1px solid var(--bg-elevated)', overflowY: 'auto' }}>
      {categorias.map(cat => {
        const ativo = categoriaAtiva === cat;
        return (
          <button
            key={cat}
            onClick={() => onCategoria(cat)}
            title={cat} // tooltip para categorias com nome truncado
            style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '0.25rem',
              padding:        '0.625rem 0.25rem',
              borderRadius:   'var(--radius-md)',
              border:         'none',
              cursor:         'pointer',
              background:     ativo ? 'var(--brand-primary)' : 'transparent',
              color:          ativo ? '#000' : 'var(--text-tertiary)',
              transition:     'all 0.15s',
              width:          '100%',
            }}
          >
            <span style={{ fontSize: '1.375rem', lineHeight: 1 }}>
              {CATEGORIA_EMOJI[cat] ?? '🍽️'}
            </span>
            <span style={{ fontSize: '0.5625rem', fontWeight: ativo ? 700 : 500, textAlign: 'center', lineHeight: 1.2, maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cat}
            </span>
          </button>
        );
      })}
    </div>
  );
}