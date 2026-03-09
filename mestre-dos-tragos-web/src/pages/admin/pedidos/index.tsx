import { useEffect, useState } from 'react';
import api from '../../../services/api';
import { moeda } from '../cardapio/types';

type Filtro       = 'hoje' | 'semana' | 'mes';
type StatusPedido = 'PENDENTE' | 'EM_PREPARO' | 'PRONTO' | 'ENTREGUE' | 'CANCELADO';

interface ItemPedido {
  id:         string;
  quantidade: number;
  precoUnit:  number;
  subtotal:   number;
  tamanho:    string | null;
  produto:    { nome: string; emoji: string | null };
  adicionais: { adicional: { nome: string } }[];
}

interface Pedido {
  id:           string;
  numeroPedido: number;
  nomeCliente:  string | null;
  status:       StatusPedido;
  valorTotal:   number;
  criadoEm:     string;
  usuario:      { nome: string } | null;
  itens:        ItemPedido[];
}

// 
// CONFIGURACAO DE STATUS
// Centraliza icone, label, cor e fundo de cada status.
// Usado nos badges da listagem e no icone da linha principal.
// 
const STATUS_CONFIG: Record<StatusPedido, { icone: string; label: string; cor: string; bg: string }> = {
  PENDENTE:   { icone: '⏳', label: 'Aguardando', cor: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  EM_PREPARO: { icone: '🔥', label: 'Em Preparo', cor: '#f97316', bg: 'rgba(249,115,22,0.12)'  },
  PRONTO:     { icone: '🔔', label: 'Pronto',     cor: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  ENTREGUE:   { icone: '✅', label: 'Entregue',   cor: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  CANCELADO:  { icone: '❌', label: 'Cancelado',  cor: '#f43f5e', bg: 'rgba(244,63,94,0.12)'   },
};

// Opcoes de filtro exibidas como pills na tela
const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'hoje',   label: 'Hoje'           },
  { key: 'semana', label: 'Ultimos 7 dias' },
  { key: 'mes',    label: 'Ultimos 30 dias'},
];

// Formata ISO string para dd/mm/aaaa hh:mm no padrao brasileiro
function formatarData(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Calcula a data de inicio do filtro — retorna string no formato YYYY-MM-DD
function calcularInicio(filtro: Filtro): string {
  const hoje = new Date();
  if (filtro === 'semana') hoje.setDate(hoje.getDate() - 6);
  if (filtro === 'mes')    hoje.setDate(hoje.getDate() - 29);
  return hoje.toISOString().split('T')[0];
}

export default function HistoricoPedidos() {
  const [filtro,    setFiltro]    = useState<Filtro>('hoje');
  const [pedidos,   setPedidos]   = useState<Pedido[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null); // id do pedido com itens visiveis

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setExpandido(null); // fecha qualquer pedido expandido ao trocar de filtro

        const fim    = new Date().toISOString().split('T')[0];
        const inicio = calcularInicio(filtro);

        const r = await api.get(`/pedidos?dataInicio=${inicio}&dataFim=${fim}&limit=200`);

        // Compativel com diferentes formatos de resposta da API
        const lista: Pedido[] = Array.isArray(r.data)
          ? r.data
          : r.data.pedidos ?? r.data.data ?? [];

        // Ordena do mais recente para o mais antigo
        setPedidos([...lista].sort((a, b) =>
          new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
        ));
      } catch {
        setPedidos([]);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [filtro]); // recarrega sempre que o filtro mudar

  // Metricas calculadas no cliente — sem requisicao adicional
  const totalReceita    = pedidos.filter(p => p.status === 'ENTREGUE').reduce((s, p) => s + Number(p.valorTotal), 0);
  const totalEntregues  = pedidos.filter(p => p.status === 'ENTREGUE').length;
  const totalCancelados = pedidos.filter(p => p.status === 'CANCELADO').length;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 860, margin: '0 auto' }}>

      {/* CABECALHO */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Historico de Pedidos
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', margin: '0.25rem 0 0' }}>
          Visualize todos os pedidos realizados
        </p>
      </div>

      {/* FILTROS — pills de periodo */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {FILTROS.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            style={{
              padding:      '0.4rem 1rem',
              borderRadius: 999,
              border:       `1.5px solid ${filtro === f.key ? 'var(--brand-primary)' : 'var(--bg-elevated)'}`,
              background:   filtro === f.key ? 'rgba(245,158,11,0.12)' : 'var(--bg-elevated)',
              color:        filtro === f.key ? 'var(--brand-primary)' : 'var(--text-secondary)',
              fontSize:     '0.8125rem',
              fontWeight:   700,
              cursor:       'pointer',
              transition:   'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* CARDS RESUMO — total de pedidos, receita e cancelamentos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total de pedidos',    valor: pedidos.length,      cor: '#3b82f6', icone: '📦' },
          { label: 'Receita (entregues)', valor: moeda(totalReceita), cor: '#10b981', icone: '💰' },
          { label: 'Cancelados',          valor: totalCancelados,     cor: '#f43f5e', icone: '❌' },
        ].map(c => (
          <div
            key={c.label}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-elevated)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}
          >
            <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{c.icone}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: c.cor }}>{c.valor}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.125rem' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* LISTA DE PEDIDOS */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
          Carregando pedidos...
        </div>
      ) : pedidos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🍽️</div>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Nenhum pedido encontrado.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {pedidos.map(p => {
            const cfg    = STATUS_CONFIG[p.status];
            const aberto = expandido === p.id;

            return (
              <div
                key={p.id}
                style={{
                  background:   'var(--bg-surface)',
                  // Borda amarela destaca o pedido expandido
                  border:       `1px solid ${aberto ? 'var(--brand-primary)' : 'var(--bg-elevated)'}`,
                  borderRadius: 'var(--radius-lg)',
                  overflow:     'hidden',
                  transition:   'border 0.15s',
                }}
              >
                {/* LINHA PRINCIPAL — clicavel, expande/recolhe os itens */}
                <button
                  onClick={() => setExpandido(aberto ? null : p.id)}
                  style={{
                    width:          '100%',
                    padding:        '0.875rem 1rem',
                    background:     'transparent',
                    border:         'none',
                    cursor:         'pointer',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'space-between',
                    gap:            '0.75rem',
                    textAlign:      'left',
                  }}
                >
                  {/* ESQUERDA — icone de status, numero do pedido e data */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 'var(--radius-md)',
                      background: cfg.bg, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0,
                    }}>
                      {cfg.icone}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          #{p.numeroPedido}
                        </span>
                        {p.nomeCliente && (
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            · {p.nomeCliente}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span>{formatarData(p.criadoEm)}</span>
                        {/* Exibe o atendente que registrou o pedido, se disponivel */}
                        {p.usuario && <span>· {p.usuario.nome}</span>}
                      </div>
                    </div>
                  </div>

                  {/* DIREITA — valor total, badge de status e seta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {moeda(Number(p.valorTotal))}
                    </span>
                    <div style={{ padding: '0.25rem 0.625rem', borderRadius: 999, background: cfg.bg, border: `1px solid ${cfg.cor}44` }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: cfg.cor, whiteSpace: 'nowrap' }}>
                        {cfg.label}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                      {aberto ? '▲' : '▼'}
                    </span>
                  </div>
                </button>

                {/* ITENS EXPANDIDOS — visivel apenas quando o pedido esta selecionado */}
                {aberto && (
                  <div style={{ borderTop: '1px solid var(--bg-elevated)', padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {p.itens?.length > 0 ? p.itens.map(item => (
                      <div
                        key={item.id}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.5rem 0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', gap: '0.5rem' }}
                      >
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {item.produto.emoji ?? ''} {item.quantidade}x {item.produto.nome}
                            {/* Tamanho exibido entre parenteses quando presente (P, M, G) */}
                            {item.tamanho && (
                              <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>
                                {' '}({item.tamanho})
                              </span>
                            )}
                          </div>
                          {/* Lista de adicionais separados por virgula */}
                          {item.adicionais?.length > 0 && (
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>
                              + {item.adicionais.map(a => a.adicional.nome).join(', ')}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>
                          {moeda(Number(item.subtotal))}
                        </span>
                      </div>
                    )) : (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', margin: 0 }}>
                        Sem itens detalhados.
                      </p>
                    )}

                    {/* TOTAL — alinhado a direita, separado dos itens por borda */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--bg-elevated)', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Total: {moeda(Number(p.valorTotal))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* RODAPE — contagem resumida dos resultados */}
      {!loading && pedidos.length > 0 && (
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '1rem' }}>
          {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} encontrado{pedidos.length !== 1 ? 's' : ''}
          {' · '}{totalEntregues} entregue{totalEntregues !== 1 ? 's' : ''}
          {totalCancelados > 0 && ` · ${totalCancelados} cancelado${totalCancelados !== 1 ? 's' : ''}`}
        </p>
      )}
    </div>
  );
}