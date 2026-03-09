import { useEffect, useState } from 'react';
import { useAuth } from '../../context/authContext';
import api from '../../services/api';

interface MetricasHoje   { pedidosHoje: number; faturamentoHoje: number; ticketMedio: number; pedidosPendentes: number; }
interface ProdutoTop     { nome: string; quantidade: number; emoji?: string; }
interface FaturamentoPer { data: string; faturamento: number; pedidos: number; }
interface ResumoGeral    { totalPedidos: number; totalFaturamento: number; totalProdutos: number; totalFuncionarios: number; }

function moeda(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

// 
// CARD DE METRICA
// Componente reutilizavel para exibir um indicador com icone, label e valor.
// A borda colorida na esquerda e o icone usam as variaveis de cor do tema.
// 
function CardMetrica({ emoji, label, valor, cor, bg }: {
  emoji: string;
  label: string;
  valor: string;
  cor:   string;
  bg:    string;
}) {
  return (
    <div
      className="surface-elevated"
      style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `3px solid ${cor}`, transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)', cursor: 'default' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform  = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform  = '';
        (e.currentTarget as HTMLElement).style.boxShadow = '';
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
        {emoji}
      </div>
      <div>
        <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.2rem' }}>
          {label}
        </p>
        <p style={{ fontSize: '1.375rem', fontWeight: 800, color: cor, letterSpacing: '-0.02em', lineHeight: 1 }}>
          {valor}
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { funcionario } = useAuth();

  const [hoje,    setHoje]   = useState<MetricasHoje | null>(null);
  const [resumo,  setResumo] = useState<ResumoGeral | null>(null);
  const [top,     setTop]    = useState<ProdutoTop[]>([]);
  const [periodo, setPer]    = useState<FaturamentoPer[]>([]);
  const [loading, setLoad]   = useState(true);
  const [filtro,  setFiltro] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    (async () => {
      setLoad(true);
      try {
        // Busca todas as metricas em paralelo — evita waterfalls de requests
        const [rH, rR, rT, rP] = await Promise.all([
          api.get('/dashboard/hoje'),
          api.get('/dashboard/resumo'),
          api.get('/dashboard/top-produtos'),
          api.get(`/dashboard/faturamento?periodo=${filtro}`),
        ]);
        setHoje(rH.data);
        setResumo(rR.data);
        setTop(rT.data);
        setPer(rP.data);
      } catch {
        // Em caso de erro, exibe zeros em vez de tela quebrada
        setHoje({ pedidosHoje: 0, faturamentoHoje: 0, ticketMedio: 0, pedidosPendentes: 0 });
        setResumo({ totalPedidos: 0, totalFaturamento: 0, totalProdutos: 0, totalFuncionarios: 0 });
        setTop([]);
        setPer([]);
      } finally {
        setLoad(false);
      }
    })();
  }, [filtro]); // recarrega sempre que o filtro de periodo mudar

  // Saudacao dinamica baseada na hora atual
  const hora     = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  // Valores base para calcular proporcao das barras de progresso
  const maxQtd  = top[0]?.quantidade ?? 1;
  const maxFat  = Math.max(...periodo.map(d => d.faturamento), 1);

  // Metricas derivadas — calculadas no cliente sem request adicional
  const pedidosPendentes = hoje?.pedidosPendentes ?? 0;
  const pedidosHoje      = hoje?.pedidosHoje      ?? 0;
  const totalPedidosPer  = periodo.reduce((acc, d) => acc + d.pedidos,     0);
  const totalFatPer      = periodo.reduce((acc, d) => acc + d.faturamento, 0);
  const mediaDiaria      = periodo.length > 0 ? totalFatPer / periodo.length : 0;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: '0.75rem', color: 'var(--text-tertiary)' }}>
      <span className="spinner" /> Carregando metricas...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', maxWidth: 1200 }}>

      {/* CABECALHO — saudacao personalizada e alerta de pedidos pendentes */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            {saudacao}, {funcionario?.nome?.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {/* Alerta animado — aparece somente quando ha pedidos aguardando */}
        {pedidosPendentes > 0 && (
          <div className="alert alert-warning" style={{ animation: 'fadeIn 0.3s ease' }}>
            ⏳ {pedidosPendentes} pedido{pedidosPendentes > 1 ? 's' : ''} pendente{pedidosPendentes > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* METRICAS DE HOJE — 4 cards: pedidos, faturamento, ticket medio e pendentes */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span>📅</span>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>Vendas de Hoje</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <CardMetrica emoji="🧾" label="Pedidos"      valor={String(pedidosHoje)}              cor="var(--brand-primary)" bg="var(--brand-primary-dim)" />
          <CardMetrica emoji="💰" label="Faturamento"  valor={moeda(hoje?.faturamentoHoje ?? 0)} cor="var(--color-success)"  bg="var(--color-success-dim)" />
          <CardMetrica emoji="🎯" label="Ticket Medio" valor={moeda(hoje?.ticketMedio ?? 0)}     cor="var(--color-info)"     bg="var(--color-info-dim)" />
          <CardMetrica emoji="⏳" label="Pendentes"    valor={String(pedidosPendentes)}          cor="var(--color-danger)"   bg="var(--color-danger-dim)" />
        </div>
        {/* Aviso quando nenhum pedido foi feito no dia */}
        {pedidosHoje === 0 && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--brand-primary-dim)', border: '1px dashed var(--brand-primary)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            🕐 Nenhum pedido hoje ainda. Os dados aparecerao assim que o primeiro pedido for feito.
          </div>
        )}
      </section>

      {/* TOP PRODUTOS — ranking com barra de progresso proporcional a maior quantidade */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span>🏆</span>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>Produtos com Mais Saida</h2>
        </div>
        <div className="surface-elevated" style={{ padding: '1.5rem' }}>
          {top.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0', margin: 0 }}>
              Nenhum pedido registrado ainda.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {top.map((p, i) => (
                <div key={p.nome} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  {/* Medalha para os 3 primeiros, posicao numerica para os demais */}
                  <span style={{ width: 28, fontSize: '0.875rem', fontWeight: 700, textAlign: 'center', flexShrink: 0 }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', width: 160, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.emoji} {p.nome}
                  </span>
                  {/* Barra proporcional ao produto lider (maxQtd) */}
                  <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--bg-base)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(p.quantidade / maxQtd) * 100}%`, borderRadius: 999, background: i === 0 ? 'var(--brand-primary)' : 'var(--text-tertiary)', transition: 'width 0.6s ease' }} />
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', width: 36, textAlign: 'right', flexShrink: 0 }}>
                    {p.quantidade}x
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FATURAMENTO POR PERIODO — grafico de barras horizontal + totais */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📈</span>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>Faturamento por Periodo</h2>
          </div>
          {/* Seletor de periodo — recarrega os dados ao mudar */}
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {(['7d', '30d', '90d'] as const).map(op => (
              <button
                key={op}
                onClick={() => setFiltro(op)}
                className={`btn btn-sm ${filtro === op ? 'btn-primary' : 'btn-ghost'}`}
              >
                {op === '7d' ? '7 dias' : op === '30d' ? '30 dias' : '90 dias'}
              </button>
            ))}
          </div>
        </div>

        <div className="surface-elevated" style={{ padding: '1.5rem' }}>
          {periodo.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0', margin: 0 }}>
              Sem dados para este periodo.
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {periodo.map(d => (
                  <div key={d.data} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', width: 72, flexShrink: 0 }}>
                      {new Date(d.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', width: 56, flexShrink: 0 }}>
                      {d.pedidos} ped.
                    </span>
                    {/* Barra proporcional ao dia de maior faturamento (maxFat) */}
                    <div style={{ flex: 1, height: 5, borderRadius: 999, background: 'var(--bg-base)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(d.faturamento / maxFat) * 100}%`, background: 'var(--color-success)', borderRadius: 999 }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-success)', width: 100, textAlign: 'right', flexShrink: 0 }}>
                      {moeda(d.faturamento)}
                    </span>
                  </div>
                ))}
              </div>

              {/* TOTAIS DO PERIODO — total de pedidos, media diaria e faturamento total */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '2px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.2rem' }}>
                      Total de Pedidos
                    </p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>
                      {totalPedidosPer}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.2rem' }}>
                      Media Diaria
                    </p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>
                      {moeda(mediaDiaria)}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.2rem' }}>
                    Total do Periodo
                  </p>
                  <p style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-success)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {moeda(totalFatPer)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* VISAO GERAL DO SISTEMA — totalizadores historicos de toda a plataforma */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span>🗂️</span>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>Visao Geral do Sistema</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <CardMetrica emoji="📦" label="Total Pedidos"  valor={resumo?.totalPedidos.toLocaleString('pt-BR') ?? '0'} cor="var(--color-info)"    bg="var(--color-info-dim)" />
          <CardMetrica emoji="💵" label="Fat. Total"     valor={moeda(resumo?.totalFaturamento ?? 0)}                 cor="var(--color-success)" bg="var(--color-success-dim)" />
          <CardMetrica emoji="🍔" label="Itens Cardapio" valor={resumo?.totalProdutos.toString() ?? '0'}              cor="var(--brand-primary)" bg="var(--brand-primary-dim)" />
          <CardMetrica emoji="👥" label="Funcionarios"   valor={resumo?.totalFuncionarios.toString() ?? '0'}          cor="var(--color-danger)"  bg="var(--color-danger-dim)" />
        </div>
      </section>

    </div>
  );
}