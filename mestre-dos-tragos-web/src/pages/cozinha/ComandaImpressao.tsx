import type { Pedido } from './types';
import { moeda } from './types';

interface Props {
  pedido: Pedido | null;
}

/**
 * Conteudo da comanda, formatado pra bobina termica de 80mm.
 * So aparece na tela quando o navegador esta imprimindo — ver
 * ".comanda-print" em src/styles/global.css. Renderizado sempre,
 * mesmo fora de impressao, pra existir no DOM no momento do print.
 */
export default function ComandaImpressao({ pedido }: Props) {
  if (!pedido) return null;

  const itens   = pedido.itens ?? [];
  const horario = new Date(pedido.criadoEm).toLocaleTimeString('pt-BR', {
    hour:   '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="comanda-print">
      <div className="comanda-tipo">BALCÃO</div>
      <div className="comanda-cliente">{pedido.nomeCliente ?? 'Sem nome'}</div>
      <div className="comanda-horario">{horario}</div>

      <div className="comanda-divisor" />

      {itens.map((item, i) => {
        const adicionais = item.adicionais ?? [];

        return (
          <div className="comanda-item" key={item.id ?? i}>
            <div className="comanda-item-linha">
              <span>
                {item.quantidade}x {item.produto?.nome ?? 'Produto removido'}
                {item.tamanho ? ` (${item.tamanho})` : ''}
              </span>
              <span>{moeda(item.subtotal)}</span>
            </div>

            {adicionais.map((a, ai) => (
              <div className="comanda-adicional" key={ai}>
                + {a.adicional?.nome} — {moeda(a.preco)}
              </div>
            ))}
          </div>
        );
      })}

      <div className="comanda-divisor" />

      {pedido.observacoes && (
        <div className="comanda-observacoes">Obs: {pedido.observacoes}</div>
      )}

      <div className="comanda-total">
        <span>TOTAL</span>
        <span>{moeda(pedido.valorTotal)}</span>
      </div>
    </div>
  );
}
