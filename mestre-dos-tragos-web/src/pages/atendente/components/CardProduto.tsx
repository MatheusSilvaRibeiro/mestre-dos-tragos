import type { Produto } from '../atendente.types';
import { moeda } from '../atendente.helpers';

interface Props {
  produto: Produto;
  qtd:     number;
  onClick: () => void;
}

// Emoji de fallback por tipo — usado quando o produto nao tem emoji proprio
const EMOJI_TIPO: Record<string, string> = {
  LANCHE:       '🍔',
  BATATA_FRITA: '🍟',
  PORCAO_MISTA: '🍟',
};

export function CardProduto({ produto, qtd, onClick }: Props) {
  const inativo     = !produto.disponivel;
  const emoji       = produto.emoji ?? EMOJI_TIPO[produto.tipo] ?? '🍽️';
  const selecionado = qtd > 0; // true quando o produto ja esta no carrinho

  // LANCHE exibe preco fixo — BATATA_FRITA e PORCAO_MISTA exibem "a partir de" com "+"
  const precoBase  = Number(produto.tamanhos[0]?.preco ?? produto.preco);
  const precoLabel = produto.tipo === 'LANCHE'
    ? moeda(Number(produto.preco))
    : `${moeda(precoBase)}+`;

  return (
    <div
      onClick={() => { if (!inativo) onClick(); }}
      style={{
        position:      'relative',
        background:    selecionado ? 'rgba(245,158,11,0.06)' : 'var(--bg-surface)',
        border:        `1.5px solid ${selecionado ? 'var(--brand-primary)' : 'var(--bg-elevated)'}`,
        borderRadius:  'var(--radius-lg)',
        cursor:        inativo ? 'not-allowed' : 'pointer',
        opacity:       inativo ? 0.4 : 1,
        userSelect:    'none',
        transition:    'border 0.15s, background 0.15s',
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
      }}
    >
      {/* AREA DO EMOJI — fundo muda de cor quando selecionado */}
      <div style={{
        height:         60,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        background:     selecionado ? 'rgba(245,158,11,0.1)' : 'var(--bg-elevated)',
        fontSize:       '2.0rem',
        transition:     'background 0.15s',
        position:       'relative',
        flexShrink:     0,
      }}>
        {emoji}
        {/* Overlay de indisponivel — sobrepos o emoji com icone de bloqueio */}
        {inativo && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
            🚫
          </div>
        )}
      </div>

      {/* INFO — nome e preco */}
      <div style={{ padding: '0.5rem 0.625rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
        <p style={{
          fontSize:        '0.8rem',
          fontWeight:      700,
          color:           'var(--text-primary)',
          margin:          0,
          lineHeight:      1.25,
          // Limita a 2 linhas — trunca com reticencias se ultrapassar
          display:           '-webkit-box',
          WebkitLineClamp:   2,
          WebkitBoxOrient:   'vertical',
          overflow:          'hidden',
        }}>
          {produto.nome}
        </p>
        <p style={{
          fontSize:     '0.8125rem',
          fontWeight:   800,
          color:        'var(--brand-primary)',
          margin:       '0.1rem 0 0',
          whiteSpace:   'nowrap',
          overflow:     'hidden',
          textOverflow: 'ellipsis',
        }}>
          {precoLabel}
        </p>
      </div>

      {/* BADGE DE QUANTIDADE — visivel apenas quando o produto esta no carrinho */}
      {selecionado && (
        <div style={{
          position:       'absolute',
          top:            '0.35rem',
          right:          '0.35rem',
          width:          20,
          height:         20,
          borderRadius:   '50%',
          background:     'var(--brand-primary)',
          color:          '#000',
          fontSize:       '0.6875rem',
          fontWeight:     800,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          boxShadow:      '0 2px 6px rgba(0,0,0,0.3)',
        }}>
          {qtd}
        </div>
      )}
    </div>
  );
}