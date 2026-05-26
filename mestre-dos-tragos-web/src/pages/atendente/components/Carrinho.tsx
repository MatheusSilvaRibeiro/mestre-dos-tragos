import type { ItemCarrinho } from '../atendente.types';
import { moeda } from '../atendente.helpers';

interface Props {
  carrinho: ItemCarrinho[];
  total: number;
  totalItens: number;
  obs: string;
  nomeCliente: string;
  enviando: boolean;
  sucesso: boolean;
  onObs: (v: string) => void;
  onLimpar: () => void;
  onAlterarQtd: (index: number, delta: number) => void;
  onRemover: (index: number) => void;
  onEnviar: () => void;
}

export function Carrinho({
  carrinho,
  total,
  totalItens,
  obs,
  nomeCliente,
  enviando,
  sucesso,
  onObs,
  onLimpar,
  onAlterarQtd,
  onRemover,
  onEnviar,
}: Props) {
  const desabilitado = carrinho.length === 0 || enviando || sucesso;

  return (
    <aside
      style={{
        height: '100%',
        background: 'linear-gradient(180deg, var(--bg-surface), #0d0d0d)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: '1rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <p
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-tertiary)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.2rem',
            }}
          >
            Pedido atual
          </p>

          <h2
            style={{
              fontSize: '1rem',
              color: 'var(--text-primary)',
              margin: 0,
              fontWeight: 800,
            }}
          >
            {nomeCliente.trim() ? nomeCliente : 'Cliente não informado'}
          </h2>
        </div>

        {totalItens > 0 && (
          <span className="badge badge-brand">
            {totalItens} {totalItens === 1 ? 'item' : 'itens'}
          </span>
        )}
      </header>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
        }}
      >
        {carrinho.length === 0 ? (
          <div className="empty-state" style={{ height: '100%' }}>
            <div className="empty-state-icon">🧾</div>
            <p className="empty-state-title">Nenhum item no pedido</p>
            <p className="empty-state-description">
              Selecione um produto do cardápio para começar a montar o pedido.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {carrinho.map((item, index) => (
              <div
                key={index}
                className="surface-elevated"
                style={{
                  padding: '0.875rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.625rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        margin: 0,
                        lineHeight: 1.25,
                      }}
                    >
                      {item.produto.nome}
                    </p>

                    {item.tamanho && (
                      <p
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--brand-primary)',
                          fontWeight: 700,
                          margin: '0.2rem 0 0',
                        }}
                      >
                        Tamanho {item.tamanho}
                      </p>
                    )}
                  </div>

                  {!sucesso && (
                    <button
                      onClick={() => onRemover(index)}
                      className="btn btn-ghost btn-icon"
                      style={{
                        width: 28,
                        height: 28,
                        flexShrink: 0,
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>

                {item.adicionais.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.35rem',
                    }}
                  >
                    {item.adicionais.map(a => (
                      <span key={a.adicional.id} className="badge badge-default">
                        + {a.adicional.nome}
                      </span>
                    ))}
                  </div>
                )}

                {item.sabores.length > 0 && (
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      margin: 0,
                    }}
                  >
                    Sabores: {item.sabores.join(' · ')}
                  </p>
                )}

                {item.observacoes && (
                  <div
                    style={{
                      padding: '0.625rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(251,191,36,0.08)',
                      border: '1px solid rgba(251,191,36,0.18)',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '0.6875rem',
                        color: 'var(--text-tertiary)',
                        textTransform: 'uppercase',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        margin: '0 0 0.2rem',
                      }}
                    >
                      Observação do item
                    </p>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-primary)',
                        margin: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      {item.observacoes}
                    </p>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    paddingTop: '0.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      onClick={() => onAlterarQtd(index, -1)}
                      disabled={sucesso}
                      className="btn btn-secondary btn-icon"
                      style={{ width: 28, height: 28 }}
                    >
                      -
                    </button>

                    <span
                      style={{
                        minWidth: 24,
                        textAlign: 'center',
                        fontWeight: 900,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {item.quantidade}
                    </span>

                    <button
                      onClick={() => onAlterarQtd(index, 1)}
                      disabled={sucesso}
                      className="btn btn-primary btn-icon"
                      style={{ width: 28, height: 28 }}
                    >
                      +
                    </button>
                  </div>

                  <strong
                    style={{
                      color: 'var(--brand-primary)',
                      fontSize: '0.95rem',
                    }}
                  >
                    {moeda(item.precoUnit * item.quantidade)}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer
        style={{
          padding: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          background: 'rgba(10,10,10,0.92)',
        }}
      >
        <textarea
          placeholder="Observação geral do pedido..."
          value={obs}
          onChange={e => onObs(e.target.value)}
          rows={2}
          disabled={sucesso}
          className="input-field"
          style={{
            resize: 'none',
            fontSize: '0.8125rem',
            opacity: sucesso ? 0.5 : 1,
          }}
        />

        {!nomeCliente.trim() && carrinho.length > 0 && !sucesso && (
          <div className="alert alert-warning" style={{ padding: '0.625rem 0.75rem' }}>
            Pedido sem identificação de cliente.
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div>
            <p
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-tertiary)',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.15rem',
              }}
            >
              Total do pedido
            </p>
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              {totalItens} {totalItens === 1 ? 'item' : 'itens'}
            </p>
          </div>

          <strong
            style={{
              fontSize: '1.45rem',
              color: 'var(--brand-primary)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
            }}
          >
            {moeda(total)}
          </strong>
        </div>

        <button
          onClick={onEnviar}
          disabled={desabilitado}
          className={desabilitado ? 'btn btn-secondary btn-lg' : 'btn btn-primary btn-lg'}
          style={{ width: '100%' }}
        >
          {enviando ? 'Enviando...' : sucesso ? 'Pedido enviado' : 'Enviar para cozinha'}
        </button>

        {carrinho.length > 0 && !sucesso && (
          <button
            onClick={onLimpar}
            className="btn btn-ghost"
            style={{ width: '100%' }}
          >
            Limpar pedido
          </button>
        )}

        {sucesso && (
          <div className="alert alert-success">
            Pedido enviado para a cozinha.
          </div>
        )}
      </footer>
    </aside>
  );
}