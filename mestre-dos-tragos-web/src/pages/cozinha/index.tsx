import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../../services/api';
import type { Pedido } from './types';
import PedidoCard from './PedidoCard';
import ComandaImpressao from './ComandaImpressao';
import { tocarSomNotificacao } from './notificationSound';

export default function Cozinha() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [agora, setAgora] = useState(() => Date.now());
  const [pedidoParaImprimir, setPedidoParaImprimir] = useState<Pedido | null>(null);
  const pedidoImprimindoRef = useRef<Pedido | null>(null);

  // Atualiza o horario atual a cada 10s para recalcular os timers dos cards
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);

  // Carrega pedidos ativos (PENDENTE e EM_PREPARO) na montagem
  useEffect(() => {
    api.get('/pedidos?status=PENDENTE,EM_PREPARO&limit=50')
      .then(res => {
        const lista: Pedido[] = res.data.pedidos ?? [];
        setPedidos(
          lista.sort((a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime())
        );
      })
      .catch(() => setPedidos([]))
      .finally(() => setLoading(false));
  }, []);

  // WEBSOCKET — atualizacoes em tempo real
  useEffect(() => {
    const s = io(import.meta.env.VITE_API_URL ?? 'https://mestre-dos-tragos-api.onrender.com');

    s.on('pedido:novo', (p: Pedido) => {
      if (!['PENDENTE', 'EM_PREPARO'].includes(p.status)) return;

      tocarSomNotificacao();

      setPedidos(prev => {
        if (prev.find(x => x.id === p.id)) return prev;

        return [...prev, p].sort(
          (a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime()
        );
      });
    });

    s.on('pedido:atualizado', (p: Pedido) => {
      if (['PENDENTE', 'EM_PREPARO'].includes(p.status)) {
        setPedidos(prev => prev.map(x => x.id === p.id ? p : x));
      } else {
        setPedidos(prev => prev.filter(x => x.id !== p.id));
      }
    });

    return () => {
      s.disconnect();
    };
  }, []);

  // Aceitar pedido — muda status para EM_PREPARO e atualiza localmente
  async function aceitar(id: string) {
    try {
      await api.patch(`/pedidos/${id}/status`, { status: 'EM_PREPARO' });
      setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: 'EM_PREPARO' } : p));
    } catch {
      alert('Erro ao aceitar pedido.');
    }
  }

  // Finalizar pedido — muda para PRONTO e remove da tela da cozinha
  async function finalizar(id: string) {
    try {
      await api.patch(`/pedidos/${id}/status`, { status: 'PRONTO' });
      setPedidos(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('Erro ao finalizar pedido.');
    }
  }

  // Imprimir comanda — abre a caixa de impressao do navegador. Ao fechar
  // (imprimindo ou cancelando), o "afterprint" abaixo aceita o pedido
  // automaticamente, se ainda estiver PENDENTE. Reimpressao (pedido ja
  // EM_PREPARO) so reabre a caixa, sem mudar status de novo.
  function imprimir(pedido: Pedido) {
    pedidoImprimindoRef.current = pedido;
    setPedidoParaImprimir(pedido);
    requestAnimationFrame(() => window.print());
  }

  useEffect(() => {
    function aoFecharImpressao() {
      const pedido = pedidoImprimindoRef.current;
      if (pedido?.status === 'PENDENTE') {
        aceitar(pedido.id);
      }
    }

    window.addEventListener('afterprint', aoFecharImpressao);
    return () => window.removeEventListener('afterprint', aoFecharImpressao);
  }, []);

  const pendentes = pedidos.filter(p => p.status === 'PENDENTE');
  const emPreparo = pedidos.filter(p => p.status === 'EM_PREPARO');
  const totalItens = pedidos.reduce(
    (total, pedido) => total + (pedido.itens ?? []).reduce((soma, item) => soma + item.quantidade, 0),
    0,
  );

  if (loading) return (
    <div data-testid="cozinha-loading" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', gap: '0.75rem', color: 'var(--text-tertiary)' }}>
      <span className="spinner" /> Carregando pedidos...
    </div>
  );

  return (
    <div data-testid="cozinha-content" className="cozinha-page">
      <header className="cozinha-header">
        <div className="cozinha-brand">
          <div className="cozinha-brand-icon" aria-hidden="true">👨‍🍳</div>
          <div className="cozinha-brand-copy">
            <span className="cozinha-eyebrow">Central de produção</span>
            <h1>Cozinha</h1>
          </div>
          <div className="topbar-status cozinha-live">
            <span className="topbar-status-dot" /> Ao vivo
          </div>
        </div>

        <div className="cozinha-resumo" aria-label="Resumo dos pedidos ativos">
          {[
            { label: 'Na fila', valor: pendentes.length, classe: 'pendente' },
            { label: 'Produzindo', valor: emPreparo.length, classe: 'preparo' },
            { label: 'Itens ativos', valor: totalItens, classe: 'itens' },
          ].map(s => (
            <div key={s.label} className={`cozinha-resumo-item cozinha-resumo-item--${s.classe}`}>
              <strong>{s.valor}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </header>

      {pedidos.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--text-tertiary)' }}>
          <span style={{ fontSize: '3.5rem' }}>✅</span>
          <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-secondary)', fontSize: '1rem' }}>Nenhum pedido no momento!</p>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Aguardando novos pedidos...</p>
        </div>
      ) : (
        <main className="cozinha-board">
          <section className="cozinha-lane cozinha-lane--pendente" data-testid="cozinha-coluna-pendentes">
            <div className="cozinha-lane-header">
              <div>
                <span className="cozinha-lane-kicker">Entrada</span>
                <h2><span aria-hidden="true">🔔</span> Pedidos pendentes</h2>
              </div>
              <span className="badge badge-brand">{pendentes.length}</span>
            </div>
            <div className="cozinha-lane-content">
              {pendentes.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-tertiary)', paddingTop: '3rem' }}>
                <span style={{ fontSize: '2.5rem' }}>📋</span>
                <span style={{ fontSize: '0.875rem' }}>Nenhum pendente</span>
              </div>
            ) : pendentes.map(p => (
              <PedidoCard key={p.id} pedido={p} agora={agora} onAceitar={aceitar} onFinalizar={finalizar} onImprimir={imprimir} />
            ))}
            </div>
          </section>

          <section className="cozinha-lane cozinha-lane--preparo" data-testid="cozinha-coluna-em-preparo">
            <div className="cozinha-lane-header">
              <div>
                <span className="cozinha-lane-kicker">Chapa</span>
                <h2><span aria-hidden="true">🔥</span> Em preparo</h2>
              </div>
              <span className="badge badge-info">{emPreparo.length}</span>
            </div>
            <div className="cozinha-lane-content">
              {emPreparo.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-tertiary)', paddingTop: '3rem' }}>
                <span style={{ fontSize: '2.5rem' }}>👨‍🍳</span>
                <span style={{ fontSize: '0.875rem' }}>Nenhum em preparo</span>
              </div>
            ) : emPreparo.map(p => (
              <PedidoCard key={p.id} pedido={p} agora={agora} onAceitar={aceitar} onFinalizar={finalizar} onImprimir={imprimir} />
            ))}
            </div>
          </section>
        </main>
      )}

      <ComandaImpressao pedido={pedidoParaImprimir} />
    </div>
  );
}
