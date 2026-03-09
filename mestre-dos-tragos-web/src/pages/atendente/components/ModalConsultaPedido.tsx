import { useEffect, useRef, useState } from 'react';
import api from '../../../services/api';
import { minutosDesde } from '../atendente.helpers';

interface PedidoConsulta {
  id:           string;
  numeroPedido: number;
  nomeCliente:  string | null;
  status:       'PENDENTE' | 'EM_PREPARO' | 'PRONTO' | 'ENTREGUE' | 'CANCELADO';
  criadoEm:     string;
}

interface Props {
  onClose: () => void;
}

const STATUS_CONFIG = {
  PENDENTE:   { icone: '⏳', label: 'Aguardando', cor: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  EM_PREPARO: { icone: '🔥', label: 'Em Preparo', cor: '#f97316', bg: 'rgba(249,115,22,0.12)'  },
  PRONTO:     { icone: '🔔', label: 'PRONTO!',    cor: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  ENTREGUE:   { icone: '✅', label: 'Entregue',   cor: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  CANCELADO:  { icone: '❌', label: 'Cancelado',  cor: '#f43f5e', bg: 'rgba(244,63,94,0.12)'   },
};

// Ordem de exibicao — pedidos mais urgentes aparecem primeiro
const PRIORIDADE: Record<string, number> = {
  EM_PREPARO: 0,
  PRONTO:     1,
  PENDENTE:   2,
  ENTREGUE:   3,
};

const LIMITE = 15; // maximo de pedidos exibidos por vez


// MODAL DE CONSULTA DE PEDIDO
// Permite ao atendente verificar o status de um pedido e finalizar a entrega.
// Busca em tempo real com debounce de 300ms ao digitar no campo de busca.

export function ModalConsultaPedido({ onClose }: Props) {
  const [busca,       setBusca]       = useState('');
  const [pedidos,     setPedidos]     = useState<PedidoConsulta[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [finalizando, setFinalizando] = useState<string | null>(null); // id do pedido em confirmacao
  const [salvando,    setSalvando]    = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Foca o input automaticamente ao abrir o modal
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Busca com debounce — evita requests a cada tecla digitada
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const params = busca.trim()
          ? `/pedidos?busca=${encodeURIComponent(busca.trim())}&status=PENDENTE,EM_PREPARO,PRONTO`
          : `/pedidos?status=PENDENTE,EM_PREPARO,PRONTO`;

        const r = await api.get(params);
        const lista: PedidoConsulta[] = Array.isArray(r.data)
          ? r.data
          : r.data.pedidos ?? r.data.data ?? [];

        // Ordena por prioridade de status e depois por data decrescente
        setPedidos([...lista].sort((a, b) => {
          const prioA = PRIORIDADE[a.status] ?? 9;
          const prioB = PRIORIDADE[b.status] ?? 9;
          if (prioA !== prioB) return prioA - prioB;
          return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
        }));
      } catch {
        setPedidos([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [busca]);

  async function confirmarEntrega() {
    if (!finalizando) return;
    try {
      setSalvando(true);
      await api.patch(`/pedidos/${finalizando}/status`, { status: 'ENTREGUE' });
      // Atualiza o status localmente — evita refetch desnecessario
      setPedidos(prev =>
        prev.map(p => p.id === finalizando ? { ...p, status: 'ENTREGUE' } : p)
      );
      setFinalizando(null);
    } catch {
      // silencioso — o pedido nao some da lista se falhar
    } finally {
      setSalvando(false);
    }
  }

  const visiveis = pedidos.slice(0, LIMITE);
  const total    = pedidos.length;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
    >
      <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--bg-elevated)', overflow: 'hidden' }}>

        {/* HEADER */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Consultar Pedido
            </h2>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', margin: '0.15rem 0 0' }}>
              Informe o cliente sobre o status do pedido
            </p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            x
          </button>
        </div>

        {/* CAMPO DE BUSCA — foca automaticamente ao abrir */}
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--bg-elevated)' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.875rem', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
              🔍
            </span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Nome do cliente ou numero do pedido..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.25rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--bg-elevated)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* LISTA DE PEDIDOS */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8125rem', padding: '2rem 0', margin: 0 }}>
              Buscando...
            </p>
          ) : visiveis.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-tertiary)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🍽️</div>
              <p style={{ fontSize: '0.8125rem', margin: 0 }}>
                {busca ? 'Nenhum pedido encontrado.' : 'Nenhum pedido ativo no momento.'}
              </p>
            </div>
          ) : visiveis.map(p => {
            const cfg        = STATUS_CONFIG[p.status];
            const mins       = minutosDesde(p.criadoEm);
            const isPronto   = p.status === 'PRONTO';
            const isEntregue = p.status === 'ENTREGUE';
            const emConf     = finalizando === p.id; // este pedido aguarda confirmacao

            return (
              <div
                key={p.id}
                style={{
                  padding:       '0.875rem 1rem',
                  borderRadius:  'var(--radius-md)',
                  // Cor de fundo varia por status — entregue fica opaco, pronto destaca
                  background:    isEntregue ? 'rgba(107,114,128,0.05)' : isPronto ? 'rgba(16,185,129,0.07)' : 'var(--bg-elevated)',
                  border:        `1.5px solid ${emConf ? '#f59e0b' : isPronto ? '#10b981' : isEntregue ? '#6b728033' : 'transparent'}`,
                  display:       'flex',
                  flexDirection: 'column',
                  gap:           '0.625rem',
                  transition:    'all 0.3s',
                  opacity:       isEntregue ? 0.6 : 1,
                }}
              >
                {/* LINHA PRINCIPAL — icone, numero, cliente, tempo e badge de status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                      {cfg.icone}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 800, color: isEntregue ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                          #{p.numeroPedido}
                        </span>
                        {p.nomeCliente && (
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            · {p.nomeCliente}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                        ha {mins < 1 ? 'menos de 1' : mins} min
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <div style={{ padding: '0.3rem 0.75rem', borderRadius: 999, background: cfg.bg, border: `1px solid ${cfg.cor}44` }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: cfg.cor, whiteSpace: 'nowrap' }}>
                        {cfg.label}
                      </span>
                    </div>
                    {/* Botao Finalizar — aparece apenas quando status e PRONTO e nao esta em confirmacao */}
                    {isPronto && !emConf && (
                      <button
                        onClick={() => setFinalizando(p.id)}
                        style={{ padding: '0.3rem 0.75rem', borderRadius: 999, border: '1px solid #10b98144', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        Finalizar
                      </button>
                    )}
                  </div>
                </div>

                {/* CONFIRMACAO INLINE — aparece ao clicar em Finalizar */}
                {emConf && (
                  <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-md)', padding: '0.625rem 0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#f59e0b', fontWeight: 700 }}>
                      Confirmar entrega do pedido #{p.numeroPedido}?
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      <button
                        onClick={() => setFinalizando(null)}
                        disabled={salvando}
                        style={{ padding: '0.3rem 0.75rem', borderRadius: 999, border: '1px solid var(--bg-elevated)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={confirmarEntrega}
                        disabled={salvando}
                        style={{ padding: '0.3rem 0.875rem', borderRadius: 999, border: 'none', background: '#10b981', color: '#fff', fontSize: '0.75rem', fontWeight: 800, cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1 }}
                      >
                        {salvando ? '...' : 'Confirmar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RODAPE — contagem de pedidos ativos */}
        <div style={{ padding: '0.625rem 1.25rem', borderTop: '1px solid var(--bg-elevated)', background: 'var(--bg-elevated)' }}>
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', margin: 0, textAlign: 'center' }}>
            {total === 0
              ? 'Nenhum pedido ativo'
              : total > LIMITE
              ? `Mostrando 15 de ${total} pedidos ativos · atualiza ao buscar`
              : `${total} pedido${total !== 1 ? 's' : ''} ativo${total !== 1 ? 's' : ''} · atualiza ao buscar`
            }
          </p>
        </div>
      </div>
    </div>
  );
}