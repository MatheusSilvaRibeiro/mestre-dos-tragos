import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../../services/api';
import type { Pedido } from './types';
import PedidoCard from './PedidoCard';

export default function Cozinha() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setSocket] = useState<Socket | null>(null);
  const [, setTick]   = useState(0);

  // Tick a cada 10s para re-renderizar os timers dos cards sem precisar de estado nos filhos
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 10_000);
    return () => clearInterval(t);
  }, []);

  // Carrega pedidos ativos (PENDENTE e EM_PREPARO) na montagem
  useEffect(() => {
    api.get('/pedidos?status=PENDENTE,EM_PREPARO&limit=50')
      .then(res => {
        const lista: Pedido[] = res.data.pedidos ?? [];
        // Ordena do mais antigo para o mais novo — prioridade visual para quem esperou mais
        setPedidos(lista.sort((a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime()));
      })
      .catch(() => setPedidos([]))
      .finally(() => setLoading(false));
  }, []);

  // 
  // WEBSOCKET — atualizacoes em tempo real
  // pedido:novo     → adiciona se for PENDENTE ou EM_PREPARO e ainda nao existir na lista
  // pedido:atualizado → atualiza se ainda ativo, remove se mudou para PRONTO/ENTREGUE/CANCELADO
  // 
  useEffect(() => {
    const s = io(import.meta.env.VITE_API_URL ?? 'http://localhost:3333');

    s.on('pedido:novo', (p: Pedido) => {
      if (!['PENDENTE', 'EM_PREPARO'].includes(p.status)) return;
      setPedidos(prev => {
        if (prev.find(x => x.id === p.id)) return prev; // evita duplicatas
        return [...prev, p].sort((a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime());
      });
    });

    s.on('pedido:atualizado', (p: Pedido) => {
      if (['PENDENTE', 'EM_PREPARO'].includes(p.status))
        setPedidos(prev => prev.map(x => x.id === p.id ? p : x));
      else
        setPedidos(prev => prev.filter(x => x.id !== p.id));
    });

    setSocket(s);
    return () => { s.disconnect(); };
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

  const pendentes = pedidos.filter(p => p.status === 'PENDENTE');
  const emPreparo = pedidos.filter(p => p.status === 'EM_PREPARO');

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', gap: '0.75rem', color: 'var(--text-tertiary)' }}>
      <span className="spinner" /> Carregando pedidos...
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', overflow: 'hidden' }}>

      {/* HEADER — identidade, status ao vivo e contadores */}
      <header style={{
        height:         58,
        background:     'var(--bg-surface)',
        borderBottom:   '1px solid var(--border-color)',
        padding:        '0 1.5rem',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        flexShrink:     0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, background: 'var(--brand-primary-dim)', border: '1.5px solid var(--brand-primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
            👨‍🍳
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)' }}>Cozinha</h1>
            <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Pedidos em tempo real</p>
          </div>
          <div className="topbar-status" style={{ marginLeft: '0.5rem' }}>
            <span className="topbar-status-dot" /> Ao vivo
          </div>
        </div>

        {/* Contadores de pedidos por coluna */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          {[
            { label: 'Pendentes',  valor: pendentes.length, cor: 'var(--brand-primary)' },
            { label: 'Em Preparo', valor: emPreparo.length, cor: 'var(--color-info)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: s.cor, lineHeight: 1 }}>{s.valor}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '0.2rem', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </header>

      {/* CONTEUDO — estado vazio ou kanban de duas colunas */}
      {pedidos.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--text-tertiary)' }}>
          <span style={{ fontSize: '3.5rem' }}>✅</span>
          <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-secondary)', fontSize: '1rem' }}>Nenhum pedido no momento!</p>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Aguardando novos pedidos...</p>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* COLUNA PENDENTES */}
          <div className="kanban-col" style={{ borderTop: '3px solid var(--brand-primary)', borderRight: '1px solid var(--border-color)' }}>
            <div className="kanban-col-header">
              <span>🔔</span>
              <span className="kanban-col-title">Pendentes</span>
              <span className="badge badge-brand">{pendentes.length}</span>
            </div>
            {pendentes.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-tertiary)', paddingTop: '3rem' }}>
                <span style={{ fontSize: '2.5rem' }}>📋</span>
                <span style={{ fontSize: '0.875rem' }}>Nenhum pendente</span>
              </div>
            ) : pendentes.map(p => (
              <PedidoCard key={p.id} pedido={p} onAceitar={aceitar} onFinalizar={finalizar} />
            ))}
          </div>

          {/* COLUNA EM PREPARO */}
          <div className="kanban-col" style={{ borderTop: '3px solid var(--color-success)' }}>
            <div className="kanban-col-header">
              <span>🔥</span>
              <span className="kanban-col-title">Em Preparo</span>
              <span className="badge badge-success">{emPreparo.length}</span>
            </div>
            {emPreparo.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-tertiary)', paddingTop: '3rem' }}>
                <span style={{ fontSize: '2.5rem' }}>👨‍🍳</span>
                <span style={{ fontSize: '0.875rem' }}>Nenhum em preparo</span>
              </div>
            ) : emPreparo.map(p => (
              <PedidoCard key={p.id} pedido={p} onAceitar={aceitar} onFinalizar={finalizar} />
            ))}
          </div>

        </div>
      )}
    </div>
  );
}