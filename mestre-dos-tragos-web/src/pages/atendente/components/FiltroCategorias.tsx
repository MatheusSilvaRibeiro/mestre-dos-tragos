interface Props {
  categorias: string[];
  categoriaAtiva: string;
  onCategoria: (cat: string) => void;
}

const CATEGORIA_EMOJI: Record<string, string> = {
  Todos: '🍽️',
  Lanches: '🍔',
  Porcoes: '🍟',
  Porções: '🍟',
  Bebidas: '🍺',
  Sobremesas: '🍫',
};

export function FiltroCategorias({ categorias, categoriaAtiva, onCategoria }: Props) {
  return (
    <aside
      style={{
        width: 96,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '0.875rem 0.625rem',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        overflowY: 'auto',
      }}
    >
      <p
        style={{
          fontSize: '0.625rem',
          fontWeight: 800,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          textAlign: 'center',
          marginBottom: '0.25rem',
        }}
      >
        Menu
      </p>

      {categorias.map(cat => {
        const ativo = categoriaAtiva === cat;

        return (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoria(cat)}
            title={cat}
            style={{
              minHeight: 72,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.625rem 0.35rem',
              borderRadius: 'var(--radius-lg)',
              border: ativo ? '1px solid var(--border-brand)' : '1px solid transparent',
              cursor: 'pointer',
              background: ativo ? 'var(--brand-primary-glow)' : 'transparent',
              color: ativo ? 'var(--brand-primary)' : 'var(--text-secondary)',
              transition: 'var(--transition-fast)',
            }}
          >
            <span style={{ fontSize: '1.45rem', lineHeight: 1 }}>
              {CATEGORIA_EMOJI[cat] ?? '🍽️'}
            </span>

            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: ativo ? 800 : 600,
                textAlign: 'center',
                lineHeight: 1.15,
                maxWidth: 70,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </span>
          </button>
        );
      })}
    </aside>
  );
}