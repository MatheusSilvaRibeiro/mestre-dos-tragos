import type { Pedido } from './types';
import { STATUS_CONFIG, moeda } from './types';

interface Props {
  pedido:      Pedido;
  onAceitar:   (id: string) => void;
  onFinalizar: (id: string) => void;
}

// Retorna o tempo decorrido apenas em minutos — mais legivel para cozinha
function tempoEmMinutos(criadoEm: string): string {
  const mins = Math.floor((Date.now() - new Date(criadoEm).getTime()) / 60000);
  if (mins < 1) return 'agora';
  return `${mins} min`;
}

// 
// CARD DE PEDIDO — exibido nas colunas do kanban da cozinha
// Fica vermelho quando o pedido tem mais de 10 minutos — alerta visual de urgencia.
// Aceitar muda para EM_PREPARO | Finalizar muda para PRONTO e sai da tela.
// 
export default function PedidoCard({ pedido, onAceitar, onFinalizar }: Props) {
  const cfg        = STATUS_CONFIG[pedido.status];
  const mins       = Math.floor((Date.now() - new Date(pedido.criadoEm).getTime()) / 60000);
  const urgente    = mins >= 10;   // borda vermelha apos 10 minutos de espera
  const isPendente = pedido.status === 'PENDENTE';

  // Garante arrays mesmo que a API retorne undefined
  const itens = pedido.itens ?? [];

  return (
    <div style={{
      background:    '#1a1f2e',
      borderLeft:    `4px solid ${urgente ? '#ef4444' : cfg.cor}`,
      borderRadius:  '8px',
      boxShadow:     '0 2px 8px rgba(0,0,0,0.45)',
      padding:       '1rem',
      display:       'flex',
      flexDirection: 'column',
      gap:           '0.5rem',
    }}>

      {/* TOPO — nome do cliente, ID curto, timer e badge de status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#e2e8f0' }}>
            {pedido.nomeCliente ?? 'Sem nome'}
          </div>
          {/* Exibe apenas os ultimos 6 caracteres do ID — suficiente para identificar */}
          <div style={{ fontSize: '0.6875rem', color: '#475569' }}>
            #{pedido.id.slice(-6).toUpperCase()}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
          {/* Timer fica vermelho quando urgente */}
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: urgente ? '#ef4444' : '#475569' }}>
            {tempoEmMinutos(pedido.criadoEm)}
          </span>
          <span style={{ padding: '0.125rem 0.5rem', borderRadius: 999, background: cfg.bg, color: cfg.cor, fontWeight: 700, fontSize: '0.6875rem' }}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* ITENS — lista com quantidade, nome, tamanho, adicionais e sabores */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {itens.map((item, i) => {
          const adicionais = item.adicionais ?? [];
          const sabores    = item.sabores    ?? [];

          return (
            <div
              key={i}
              style={{
                paddingBottom: '0.4rem',
                borderBottom:  i < itens.length - 1 ? '1px solid #1e2535' : 'none',
              }}
            >
              <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.875rem' }}>
                {item.quantidade}x {item.produto?.nome ?? 'Produto removido'}
                {item.tamanho && (
                  <span style={{ fontWeight: 400, color: '#475569', fontSize: '0.8125rem' }}>
                    {' '}({item.tamanho})
                  </span>
                )}
              </div>
              {/* Adicionais listados separados por virgula */}
              {adicionais.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                  + {adicionais.map(a => a.adicional?.nome ?? '').join(', ')}
                </div>
              )}
              {/* Sabores de PORCAO_MISTA separados por ponto */}
              {sabores.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                  {sabores.map(s => s.nome ?? '').join(' · ')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* OBSERVACOES — destaque em amarelo quando presente */}
      {pedido.observacoes && (
        <div style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', fontSize: '0.8125rem' }}>
          📝 {pedido.observacoes}
        </div>
      )}

      {/* RODAPE — valor total e botao de acao */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #1e2535' }}>
        <span style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.9rem' }}>
          {moeda(pedido.valorTotal)}
        </span>
        {/* Botao muda conforme o status — Aceitar para PENDENTE, Pronto para EM_PREPARO */}
        {isPendente ? (
          <button
            onClick={() => onAceitar(pedido.id)}
            style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.4rem 1.1rem', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontSize: '0.8125rem' }}
          >
            Aceitar
          </button>
        ) : (
          <button
            onClick={() => onFinalizar(pedido.id)}
            style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.4rem 1.1rem', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontSize: '0.8125rem' }}
          >
            Pronto
          </button>
        )}
      </div>
    </div>
  );
}