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
      <div className="comanda-horario">
        Pedido #{pedido.id.slice(-6).toUpperCase()} · {horario}
      </div>

      <div className="comanda-divisor" />

      {itens.map((item, i) => {
        const adicionais = item.adicionais ?? [];
        const sabores = item.sabores ?? [];

        return (
          <div className="comanda-item" key={item.id ?? i}>
            <div className="comanda-item-linha">
              <span className="comanda-item-nome">
                {item.quantidade}x {item.produto?.nome ?? 'Produto removido'}
                {item.tamanho ? ` (${item.tamanho})` : ''}
              </span>
              <span className="comanda-item-valor">{moeda(item.subtotal)}</span>
            </div>

            {sabores.length > 0 && (
              <div className="comanda-sabores">
                SABORES: {sabores.map(sabor => sabor.nome).join(' / ')}
              </div>
            )}

            {adicionais.map((a, ai) => (
              <div className="comanda-adicional" key={ai}>
                + {a.adicional?.nome}
              </div>
            ))}

            {item.observacoes && (
              <div className="comanda-observacoes comanda-observacoes--item">
                OBS. DO ITEM: {item.observacoes}
              </div>
            )}
          </div>
        );
      })}

      <div className="comanda-divisor" />

      {pedido.observacoes && (
        <div className="comanda-observacoes">
          OBS. DO PEDIDO: {pedido.observacoes}
        </div>
      )}

      <div className="comanda-total">
        <span>TOTAL</span>
        <span>{moeda(pedido.valorTotal)}</span>
      </div>
    </div>
  );
}
