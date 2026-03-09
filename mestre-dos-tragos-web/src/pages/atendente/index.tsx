import { useState } from 'react';
import { useAuth } from '../../context/authContext';
import { useAtendente } from './atendente.hooks';
import { ModalConfig }         from './components/ModalConfig';
import { ModalConsultaPedido } from './components/ModalConsultaPedido';
import { Carrinho }            from './components/Carrinho';
import { FiltroCategorias }    from './components/FiltroCategorias';
import { CardProduto }         from './components/CardProduto';

export default function Atendente() {
  const { funcionario } = useAuth();
  const [busca,         setBusca]         = useState('');
  const [modalConsulta, setModalConsulta] = useState(false);

  const {
    carrinho, categoria, nomeCliente, obs,
    loading, enviando, sucesso, modalProd,
    categorias, filtrados, total, totalItens,
    setCategoria, setNomeCliente, setObs,
    setModalProd, setCarrinho,
    adicionarItem, alterarQtd, removerItem,
    qtdNoCarrinho, enviarPedido,
  } = useAtendente(busca);

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', color: 'var(--text-tertiary)', gap: '0.75rem' }}>
      Carregando cardapio...
    </div>
  );

  return (
    <div style={{ height: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Modais — renderizados fora do fluxo normal para ficarem sobre tudo */}
      {modalProd && (
        <ModalConfig produto={modalProd} onConfirm={adicionarItem} onClose={() => setModalProd(null)} />
      )}
      {modalConsulta && (
        <ModalConsultaPedido onClose={() => setModalConsulta(false)} />
      )}

      {/* HEADER — logo, busca, campo de cliente e botao de status */}
      <header style={{ padding: '0 1rem', height: 52, background: 'var(--bg-surface)', borderBottom: '1px solid var(--bg-elevated)', display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0, overflow: 'hidden' }}>

        {/* LOGO + NOME DO ATENDENTE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
          <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>🍺</span>
          <div style={{ lineHeight: 1.2 }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap' }}>
              {funcionario?.nome?.split(' ')[0]}
            </p>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', margin: 0 }}>Atendente</p>
          </div>
        </div>

        <div style={{ width: 1, height: 28, background: 'var(--bg-elevated)', flexShrink: 0 }} />

        {/* CAMPO DE BUSCA — filtra produtos em tempo real via useAtendente */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <span style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8125rem', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar produto..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ width: '100%', padding: '0.4rem 0.625rem 0.4rem 2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-elevated)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.8125rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* CAMPO CLIENTE — borda amarela quando preenchido */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: nomeCliente ? 'rgba(245,158,11,0.1)' : 'var(--bg-elevated)', border: `1px solid ${nomeCliente ? 'var(--brand-primary)' : 'var(--bg-elevated)'}`, borderRadius: 'var(--radius-md)', padding: '0.375rem 0.625rem', transition: 'all 0.2s', flexShrink: 0 }}>
          <span style={{ fontSize: '0.8125rem' }}>👤</span>
          <input
            type="text"
            placeholder="Cliente..."
            value={nomeCliente}
            onChange={e => setNomeCliente(e.target.value)}
            style={{ width: 110, border: 'none', background: 'transparent', color: nomeCliente ? 'var(--brand-primary)' : 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 700, outline: 'none' }}
          />
        </div>

        {/* BOTAO DE CONSULTA DE STATUS */}
        <button
          onClick={() => setModalConsulta(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-elevated)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          📋 Status
        </button>
      </header>

      {/* BODY — sidebar de categorias + grid de produtos + carrinho */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* FILTRO DE CATEGORIAS — coluna lateral fixa de 72px */}
        <FiltroCategorias
          categorias={categorias}
          categoriaAtiva={categoria}
          onCategoria={setCategoria}
        />

        {/* GRID DE PRODUTOS — ocupa 3/5 do espaco disponivel */}
        <div style={{
          flex:                3,
          minWidth:            0,
          overflowY:           'auto',
          padding:             '1rem',
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap:                 '0.75rem',
          alignContent:        'start',
        }}>
          {/* CABECALHO DO GRID — nome da categoria e contagem */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {categoria}
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              {filtrados.length} {filtrados.length === 1 ? 'item' : 'itens'}
            </span>
          </div>

          {filtrados.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0', color: 'var(--text-tertiary)' }}>
              <div style={{ fontSize: '2rem' }}>😕</div>
              Nenhum produto encontrado.
            </div>
          ) : filtrados.map(produto => (
            <CardProduto
              key={produto.id}
              produto={produto}
              qtd={qtdNoCarrinho(produto.id)}
              onClick={() => setModalProd(produto)}
            />
          ))}
        </div>

        {/* CARRINHO — ocupa 2/5 do espaco com minimo de 280px */}
        <div style={{ flex: 2, minWidth: 280, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--bg-elevated)', overflow: 'hidden' }}>
          <Carrinho
            carrinho={carrinho} total={total} totalItens={totalItens}
            obs={obs} nomeCliente={nomeCliente} enviando={enviando} sucesso={sucesso}
            onObs={setObs} onLimpar={() => setCarrinho([])}
            onAlterarQtd={alterarQtd} onRemover={removerItem} onEnviar={enviarPedido}
          />
        </div>
      </div>
    </div>
  );
}