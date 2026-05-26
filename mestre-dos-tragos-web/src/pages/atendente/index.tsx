import { useState } from 'react';
import { useAuth } from '../../context/authContext';
import { useAtendente } from './atendente.hooks';
import { ModalConfig } from './components/ModalConfig';
import { ModalConsultaPedido } from './components/ModalConsultaPedido';
import { Carrinho } from './components/Carrinho';
import { FiltroCategorias } from './components/FiltroCategorias';
import { CardProduto } from './components/CardProduto';

export default function Atendente() {
  const { funcionario } = useAuth();
  const [busca, setBusca] = useState('');
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

  if (loading) {
    return (
      <div className="loading-page" style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        <div className="loading-page-content">
          <div className="spinner" />
          <span>Carregando cardápio...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        height: '100vh',
        background: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {modalProd && (
        <ModalConfig
          produto={modalProd}
          onConfirm={adicionarItem}
          onClose={() => setModalProd(null)}
        />
      )}

      {modalConsulta && (
        <ModalConsultaPedido onClose={() => setModalConsulta(false)} />
      )}

      <header
        style={{
          height: 74,
          padding: '0 1.25rem',
          background: 'rgba(17,17,17,0.92)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexShrink: 0,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--brand-primary-glow)',
              border: '1px solid var(--border-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-primary)',
              fontWeight: 900,
              fontSize: '0.85rem',
              letterSpacing: '-0.03em',
            }}
          >
            MT
          </div>

          <div style={{ lineHeight: 1.2 }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {funcionario?.nome?.split(' ')[0] ?? 'Atendente'}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: '0.15rem 0 0' }}>
              Terminal de pedidos
            </p>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          <input
            type="text"
            placeholder="Buscar produto pelo nome..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="input-field"
            style={{
              height: 44,
              fontSize: '0.9rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          />
        </div>

        <div
          style={{
            width: 220,
            flexShrink: 0,
          }}
        >
          <input
            type="text"
            placeholder="Nome do cliente"
            value={nomeCliente}
            onChange={e => setNomeCliente(e.target.value)}
            className="input-field"
            style={{
              height: 44,
              fontWeight: 700,
              color: nomeCliente ? 'var(--brand-primary)' : 'var(--text-primary)',
              borderColor: nomeCliente ? 'var(--border-brand)' : 'var(--border-subtle)',
              background: nomeCliente ? 'rgba(251,191,36,0.08)' : 'var(--bg-elevated)',
            }}
          />
        </div>

        <button
          onClick={() => setModalConsulta(true)}
          className="btn btn-secondary"
          style={{ height: 44, flexShrink: 0 }}
        >
          Status dos pedidos
        </button>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <FiltroCategorias
          categorias={categorias}
          categoriaAtiva={categoria}
          onCategoria={setCategoria}
        />

        <main
          style={{
            flex: 3,
            minWidth: 0,
            overflowY: 'auto',
            padding: '1.25rem',
          }}
        >
          <section
            style={{
              minHeight: '100%',
              background: 'rgba(255,255,255,0.015)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: '1.25rem',
                gap: '1rem',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-tertiary)',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '0.2rem',
                  }}
                >
                  Cardápio
                </p>

                <h2
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    margin: 0,
                    letterSpacing: '-0.03em',
                  }}
                >
                  {categoria}
                </h2>
              </div>

              <span className="badge badge-default">
                {filtrados.length} {filtrados.length === 1 ? 'item' : 'itens'}
              </span>
            </div>

            {filtrados.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">⌕</div>
                <p className="empty-state-title">Nenhum produto encontrado</p>
                <p className="empty-state-description">
                  Tente mudar a busca ou selecionar outra categoria.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '1.25rem',
                  alignItems: 'stretch',
                }}
              >
                {filtrados.map(produto => (
                  <CardProduto
                    key={produto.id}
                    produto={produto}
                    qtd={qtdNoCarrinho(produto.id)}
                    onClick={() => setModalProd(produto)}
                  />
                ))}
              </div>
            )}
          </section>
        </main>

        <aside
          style={{
            flex: 1.25,
            minWidth: 380,
            maxWidth: 460,
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid var(--border-subtle)',
            overflow: 'hidden',
          }}
        >
          <Carrinho
            carrinho={carrinho}
            total={total}
            totalItens={totalItens}
            obs={obs}
            nomeCliente={nomeCliente}
            enviando={enviando}
            sucesso={sucesso}
            onObs={setObs}
            onLimpar={() => setCarrinho([])}
            onAlterarQtd={alterarQtd}
            onRemover={removerItem}
            onEnviar={enviarPedido}
          />
        </aside>
      </div>
    </div>
  );
}