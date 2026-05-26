import type { Produto } from '../atendente.types';
import { moeda } from '../atendente.helpers';

interface Props {
  produto: Produto;
  qtd: number;
  onClick: () => void;
}

function tipoLabel(tipo?: string) {
  if (tipo === 'LANCHE') return 'Lanche';
  if (tipo === 'BATATA_FRITA') return 'Batata';
  if (tipo === 'PORCAO_MISTA') return 'Porção';
  return 'Produto';
}

export function CardProduto({ produto, qtd, onClick }: Props) {
  const inativo = produto.disponivel === false;
  const selecionado = qtd > 0;

  const precoBase = Number(produto.tamanhos?.[0]?.preco ?? produto.preco ?? 0);

  const precoLabel =
    produto.tipo && produto.tipo !== 'LANCHE'
      ? `a partir de ${moeda(precoBase)}`
      : moeda(Number(produto.preco ?? precoBase));

  return (
    <button
      type="button"
      onClick={() => {
        if (!inativo) onClick();
      }}
      disabled={inativo}
      className="surface-interactive"
      style={{
        position: 'relative',
        textAlign: 'left',
        padding: 0,
        overflow: 'hidden',
        border: selecionado
          ? '1px solid var(--brand-primary)'
          : '1px solid var(--border-subtle)',
        background: selecionado
          ? 'linear-gradient(180deg, rgba(251,191,36,0.10), var(--bg-surface))'
          : 'linear-gradient(180deg, rgba(255,255,255,0.025), var(--bg-surface))',
        opacity: inativo ? 0.45 : 1,
        cursor: inativo ? 'not-allowed' : 'pointer',
        minHeight: 178,
      }}
    >
      <div
        style={{
          padding: '0.85rem 0.9rem 0.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.25rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            background: selecionado ? 'var(--brand-primary-glow)' : 'var(--bg-elevated)',
            color: selecionado ? 'var(--brand-primary)' : 'var(--text-tertiary)',
            border: selecionado ? '1px solid var(--border-brand)' : '1px solid var(--border-subtle)',
            fontSize: '0.62rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
          }}
        >
          {tipoLabel(produto.tipo)}
        </span>

        {selecionado && (
          <span
            style={{
              minWidth: 24,
              height: 24,
              padding: '0 0.45rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--brand-primary)',
              color: '#0A0A0A',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 900,
            }}
          >
            {qtd}
          </span>
        )}
      </div>

      <div
        style={{
          padding: '0.35rem 0.95rem 0.95rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          height: 'calc(100% - 42px)',
        }}
      >
        <div
          className="line-clamp-2"
          style={{
            fontSize: '0.98rem',
            fontWeight: 900,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            letterSpacing: '-0.025em',
            minHeight: 38,
          }}
        >
          {produto.nome}
        </div>

        {produto.descricao && (
          <div
            className="line-clamp-2"
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-tertiary)',
              lineHeight: 1.4,
              minHeight: 34,
            }}
          >
            {produto.descricao}
          </div>
        )}

        <div
          style={{
            marginTop: 'auto',
            paddingTop: '0.65rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '0.62rem',
                color: 'var(--text-tertiary)',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Preço
            </p>

            <strong
              style={{
                display: 'block',
                marginTop: '0.1rem',
                fontSize: '0.9rem',
                fontWeight: 900,
                color: 'var(--brand-primary)',
              }}
            >
              {precoLabel}
            </strong>
          </div>

          <span
            style={{
              minWidth: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: selecionado ? 'var(--brand-primary)' : 'var(--bg-elevated)',
              color: selecionado ? '#0A0A0A' : 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: selecionado ? '0.75rem' : '1.1rem',
              fontWeight: 900,
              border: selecionado ? '1px solid var(--brand-primary)' : '1px solid var(--border-default)',
            }}
          >
            {selecionado ? 'OK' : '+'}
          </span>
        </div>
      </div>

      {inativo && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
          }}
        >
          Indisponível
        </div>
      )}
    </button>
  );
}