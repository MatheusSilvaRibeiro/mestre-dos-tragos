import type { ItemCarrinho } from '../atendente.types';
import { moeda } from '../atendente.helpers';

interface Props {
  carrinho:     ItemCarrinho[];
  total:        number;
  totalItens:   number;   // soma das quantidades — exibido no badge do header
  obs:          string;
  nomeCliente:  string;
  enviando:     boolean;
  sucesso:      boolean;  // true apos pedido enviado — bloqueia edicao
  onObs:        (v: string) => void;
  onLimpar:     () => void;
  onAlterarQtd: (index: number, delta: number) => void;
  onRemover:    (index: number) => void;
  onEnviar:     () => void;
}

export function Carrinho({
  carrinho, total, totalItens, obs, nomeCliente,
  enviando, sucesso, onObs, onLimpar,
  onAlterarQtd, onRemover, onEnviar,
}: Props) {
  // Botao desabilitado se carrinho vazio, enviando ou ja enviado com sucesso
  const desabilitado = carrinho.length === 0 || enviando || sucesso;

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', overflow: 'hidden', height: '100%' }}>

      {/* HEADER — titulo, contagem de itens e botao de limpar */}
      <div style={{ padding: '0.625rem 1rem', borderBottom: '1px solid var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ fontSize: '0.9375rem' }}>🛒</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>Pedido</span>
          {totalItens > 0 && (
            <span style={{ background: 'var(--brand-primary)', color: '#000', borderRadius: 999, fontSize: '0.6875rem', fontWeight: 800, padding: '0.1rem 0.45rem' }}>
              {totalItens}
            </span>
          )}
        </div>
        {/* Limpar so aparece se tiver itens e o pedido ainda nao foi enviado */}
        {carrinho.length > 0 && !sucesso && (
          <button
            onClick={onLimpar}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#f43f5e', fontWeight: 600, padding: 0 }}
          >
            Limpar
          </button>
        )}
      </div>

      {/* LISTA DE ITENS — scrollavel */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.625rem 1rem' }}>
        {carrinho.length === 0 ? (
          // Estado vazio — instrucao para o atendente
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem', color: 'var(--text-tertiary)', paddingTop: '2.5rem' }}>
            <span style={{ fontSize: '2rem' }}>🛒</span>
            <p style={{ margin: 0, fontSize: '0.8125rem', textAlign: 'center' }}>
              Nenhum item.<br />
              <span style={{ fontSize: '0.75rem' }}>Clique nos produtos ao lado.</span>
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {carrinho.map((item, index) => (
              <div
                key={index}
                style={{ padding: '0.5rem 0.625rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
              >
                {/* NOME + BOTAO DE REMOVER */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.375rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.produto.emoji} {item.produto.nome}
                    {item.tamanho && <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}> ({item.tamanho})</span>}
                  </span>
                  {!sucesso && (
                    <button onClick={() => onRemover(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '0.8125rem', padding: 0, lineHeight: 1, flexShrink: 0 }}>
                      x
                    </button>
                  )}
                </div>

                {/* ADICIONAIS — lista separada por virgula */}
                {item.adicionais.length > 0 && (
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    + {item.adicionais.map(a => a.adicional.nome).join(', ')}
                  </p>
                )}

                {/* SABORES — exclusivo de PORCAO_MISTA */}
                {item.sabores.length > 0 && (
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.sabores.join(' · ')}
                  </p>
                )}

                {/* CONTROLES DE QUANTIDADE + PRECO */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.125rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <button
                      onClick={() => onAlterarQtd(index, -1)}
                      disabled={sucesso}
                      style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid var(--bg-surface)', background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: sucesso ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', width: 16, textAlign: 'center' }}>
                      {item.quantidade}
                    </span>
                    <button
                      onClick={() => onAlterarQtd(index, 1)}
                      disabled={sucesso}
                      style={{ width: 20, height: 20, borderRadius: '50%', border: 'none', background: sucesso ? 'var(--bg-elevated)' : 'var(--brand-primary)', color: sucesso ? 'var(--text-tertiary)' : '#000', cursor: sucesso ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      +
                    </button>
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-primary)', flexShrink: 0 }}>
                    {moeda(item.precoUnit * item.quantidade)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RODAPE — observacao, total e botao de envio */}
      <div style={{ padding: '0.625rem 1rem', borderTop: '1px solid var(--bg-elevated)', display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0, background: 'var(--bg-surface)' }}>

        {/* CAMPO DE OBSERVACAO — desabilitado apos envio */}
        <textarea
          placeholder="Observacao (opcional)..."
          value={obs}
          onChange={e => onObs(e.target.value)}
          rows={2}
          disabled={sucesso}
          style={{ width: '100%', padding: '0.4rem 0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-elevated)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.75rem', resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.4, opacity: sucesso ? 0.5 : 1 }}
        />

        {/* TOTAL */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total</span>
          <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
            {moeda(total)}
          </span>
        </div>

        {/* AVISO — pedido sem identificacao de cliente */}
        {!nomeCliente.trim() && carrinho.length > 0 && !sucesso && (
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', margin: 0, fontWeight: 600 }}>
            Pedido sem identificacao de cliente.
          </p>
        )}

        {/* BOTAO ENVIAR — desabilitado quando carrinho vazio, enviando ou ja enviado */}
        <button
          onClick={onEnviar}
          disabled={desabilitado}
          style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', border: 'none', background: desabilitado ? 'var(--bg-elevated)' : 'var(--brand-primary)', color: desabilitado ? 'var(--text-tertiary)' : '#000', fontWeight: 800, fontSize: '0.875rem', cursor: desabilitado ? 'not-allowed' : 'pointer', width: '100%', transition: 'all 0.15s' }}
        >
          {enviando ? 'Enviando...' : 'Enviar para Cozinha'}
        </button>

        {/* FEEDBACK DE SUCESSO — aparece apos o pedido ser enviado */}
        {sucesso && (
          <div style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.10)', border: '1px solid var(--brand-primary)', display: 'flex', flexDirection: 'column', gap: '0.2rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
              Pedido enviado para a cozinha!
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
              O faturamento e contabilizado apos a entrega.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}