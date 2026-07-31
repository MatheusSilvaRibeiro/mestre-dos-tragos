import type { Pedido } from './types';
import { STATUS_CONFIG, moeda } from './types';

interface Props {
  pedido:      Pedido;
  agora:       number;
  onAceitar:   (id: string) => void;
  onFinalizar: (id: string) => void;
  onImprimir:  (pedido: Pedido) => void;
}

function tempoEmMinutos(criadoEm: string, agora: number): string {
  const mins = Math.floor((agora - new Date(criadoEm).getTime()) / 60000);
  if (mins < 1) return 'agora';
  return `${mins} min`;
}

export default function PedidoCard({ pedido, agora, onAceitar, onFinalizar, onImprimir }: Props) {
  const cfg        = STATUS_CONFIG[pedido.status];
  const mins       = Math.floor((agora - new Date(pedido.criadoEm).getTime()) / 60000);
  const urgente    = mins >= 10;
  const isPendente = pedido.status === 'PENDENTE';

  const itens = pedido.itens ?? [];

  const classeCard = [
    'pedido-card',
    !isPendente && 'pedido-card--em-preparo',
    urgente && 'pedido-card--urgente',
  ].filter(Boolean).join(' ');

  return (
    <div data-testid="cozinha-pedido-card" data-pedido-id={pedido.id} className={classeCard}>
      <div className="pedido-card-header">
        <div>
          <div className="pedido-card-cliente">{pedido.nomeCliente ?? 'Sem nome'}</div>
          <div className="pedido-card-id">#{pedido.id.slice(-6).toUpperCase()}</div>
        </div>

        <div className="pedido-card-meta">
          <span className={`pedido-card-tempo ${urgente ? 'pedido-card-tempo--urgente' : ''}`}>
            {tempoEmMinutos(pedido.criadoEm, agora)}
          </span>
          <span data-testid="cozinha-pedido-status" className={`badge ${isPendente ? 'badge-brand' : 'badge-info'}`}>
            {cfg.label}
          </span>
        </div>
      </div>

      <div className="pedido-card-itens">
        {itens.map((item, i) => {
          const adicionais = item.adicionais ?? [];
          const sabores    = item.sabores    ?? [];

          return (
            <div className="pedido-card-item" key={i}>
              <div className="pedido-card-item-nome">
                {item.quantidade}x {item.produto?.nome ?? 'Produto removido'}
                {item.tamanho && (
                  <span className="pedido-card-item-tamanho"> ({item.tamanho})</span>
                )}
              </div>

              {adicionais.length > 0 && (
                <div className="pedido-card-adicionais">
                  + {adicionais.map(a => a.adicional?.nome ?? '').join(', ')}
                </div>
              )}

              {sabores.length > 0 && (
                <div className="pedido-card-sabores">
                  {sabores.map(s => s.nome ?? '').join(' · ')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {pedido.observacoes && (
        <div className="alert alert-warning">
          📝 {pedido.observacoes}
        </div>
      )}

      <div className="pedido-card-footer">
        <span className="pedido-card-total">{moeda(pedido.valorTotal)}</span>

        <div className="pedido-card-acoes">
          <button
            onClick={() => onImprimir(pedido)}
            data-testid="cozinha-imprimir-btn"
            className="btn btn-ghost"
          >
            🖨️ Imprimir
          </button>

          {isPendente ? (
            <button
              onClick={() => onAceitar(pedido.id)}
              data-testid="cozinha-aceitar-btn"
              className="btn btn-primary btn-lg"
            >
              Aceitar
            </button>
          ) : (
            <button
              onClick={() => onFinalizar(pedido.id)}
              data-testid="cozinha-finalizar-btn"
              className="btn btn-success btn-lg"
            >
              Pronto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
