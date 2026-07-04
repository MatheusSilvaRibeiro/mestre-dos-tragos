import { useEffect, useState } from 'react';
import api from '../../../services/api';
import type { Produto, Categoria, Adicional, Aba } from './types';
import { moeda } from './types';
import ProdutoModal from './ProdutoModal';

export default function Cardapio() {
  const [aba,        setAba]   = useState<Aba>('produtos');
  const [produtos,   setProd]  = useState<Produto[]>([]);
  const [categorias, setCateg] = useState<Categoria[]>([]);
  const [adicionais, setAdic]  = useState<Adicional[]>([]);
  const [loading,    setLoad]  = useState(true);
  const [modalProd,  setModal] = useState(false);
  const [editProd,   setEdit]  = useState<Produto | null>(null);
  const [novaCateg,  setNovaC] = useState('');
  const [novoAdic,   setNovoA] = useState({ nome: '', preco: '' });

  useEffect(() => { carregar(); }, []);

  // 
  // CARREGAMENTO INICIAL
  // Busca produtos, categorias e adicionais em paralelo para nao fazer 3 requests sequenciais.
  // Aceita tanto { produtos: [] } quanto [] direto — compativel com qualquer formato da API.
  // 
  async function carregar() {
    setLoad(true);
    try {
      const [p, c, a] = await Promise.all([
        api.get('/produtos?limit=100'),
        api.get('/categorias'),
        api.get('/adicionais'),
      ]);
      setProd(p.data.produtos ?? p.data ?? []);
      setCateg(c.data.categorias ?? c.data ?? []);
      setAdic(a.data.adicionais ?? a.data ?? []);
    } catch {
      console.error('Erro ao carregar cardapio');
    } finally {
      setLoad(false);
    }
  }

  // 
  // PRODUTOS — CRUD
  // salvarProduto detecta automaticamente se e criacao ou edicao pelo editProd.
  // Apos qualquer operacao, fecha o modal e recarrega a lista.
  // 
  async function salvarProduto(dados: Partial<Produto>) {
    try {
      editProd
        ? await api.put(`/produtos/${editProd.id}`, dados)
        : await api.post('/produtos', dados);
      setModal(false);
      setEdit(null);
      carregar();
    } catch {
      alert('Erro ao salvar produto.');
    }
  }

  // Alterna ativo/inativo sem abrir modal — acao rapida direto na listagem
  async function toggleProduto(p: Produto) {
    try {
      await api.put(`/produtos/${p.id}`, { ...p, ativo: !p.ativo });
      carregar();
    } catch {
      alert('Erro ao alterar produto.');
    }
  }

  async function deletarProduto(id: string) {
    if (!confirm('Deletar produto?')) return;
    try {
      await api.delete(`/produtos/${id}`);
      carregar();
    } catch {
      alert('Erro ao deletar produto.');
    }
  }

  // 
  // CATEGORIAS — CRUD
  // 
  async function salvarCategoria() {
    if (!novaCateg.trim()) return;
    try {
      await api.post('/categorias', { nome: novaCateg.trim(), ativo: true });
      setNovaC('');
      carregar();
    } catch {
      alert('Erro ao criar categoria.');
    }
  }

  async function toggleCategoria(c: Categoria) {
    try {
      await api.put(`/categorias/${c.id}`, { ...c, ativo: !c.ativo });
      carregar();
    } catch {
      alert('Erro ao alterar categoria.');
    }
  }

  async function deletarCategoria(id: string) {
    if (!confirm('Deletar categoria?')) return;
    try {
      await api.delete(`/categorias/${id}`);
      carregar();
    } catch {
      alert('Erro ao deletar categoria.');
    }
  }

  // 
  // ADICIONAIS — CRUD
  // O preco e convertido para float antes de enviar — o input retorna string
  // 
  async function salvarAdicional() {
    if (!novoAdic.nome.trim()) return;
    try {
      await api.post('/adicionais', {
        nome:  novoAdic.nome.trim(),
        preco: parseFloat(novoAdic.preco) || 0,
        ativo: true,
      });
      setNovoA({ nome: '', preco: '' });
      carregar();
    } catch {
      alert('Erro ao criar adicional.');
    }
  }

  async function toggleAdicional(a: Adicional) {
    try {
      await api.put(`/adicionais/${a.id}`, { ...a, ativo: !a.ativo });
      carregar();
    } catch {
      alert('Erro ao alterar adicional.');
    }
  }

  async function deletarAdicional(id: string) {
    if (!confirm('Deletar adicional?')) return;
    try {
      await api.delete(`/adicionais/${id}`);
      carregar();
    } catch {
      alert('Erro ao deletar adicional.');
    }
  }

  // Configuracao das abas — centralizado aqui para facilitar adicionar novas no futuro
  const abas = [
    { key: 'produtos'   as Aba, label: 'Produtos',   emoji: '🍔', count: produtos.length },
    { key: 'categorias' as Aba, label: 'Categorias', emoji: '🗂️', count: categorias.length },
    { key: 'adicionais' as Aba, label: 'Adicionais', emoji: '➕', count: adicionais.length },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: '0.75rem', color: 'var(--text-tertiary)' }}>
      <span className="spinner" /> Carregando cardapio...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', height: '100%', animation: 'fadeIn 0.25s ease' }}>

      {/* HEADER — titulo, subtitulo e contadores rapidos */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Cardapio</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Gerencie produtos, categorias e adicionais</p>
        </div>

        {/* Contadores: ativos, categorias e adicionais */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {[
            { label: 'Ativos',      valor: produtos.filter(p => p.ativo).length, cor: 'var(--brand-primary)' },
            { label: 'Categorias',  valor: categorias.length,                     cor: 'var(--color-info)' },
            { label: 'Adicionais',  valor: adicionais.length,                     cor: 'var(--color-success)' },
          ].map(stat => (
            <div key={stat.label} className="surface-elevated" style={{ padding: '0.5rem 0.875rem', textAlign: 'center', minWidth: 72 }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, color: stat.cor, lineHeight: 1 }}>{stat.valor}</div>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', marginTop: '0.2rem', fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ABAS — navegacao entre produtos, categorias e adicionais */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        {abas.map(a => (
          <button
            key={a.key}
            onClick={() => setAba(a.key)}
            style={{
              padding:      '0.625rem 1.125rem',
              border:       'none',
              cursor:       'pointer',
              background:   'none',
              fontWeight:   700,
              fontSize:     '0.875rem',
              color:        aba === a.key ? 'var(--brand-primary)' : 'var(--text-tertiary)',
              borderBottom: `2px solid ${aba === a.key ? 'var(--brand-primary)' : 'transparent'}`,
              transition:   'all var(--transition-fast)',
              display:      'flex',
              alignItems:   'center',
              gap:          '0.375rem',
            }}
          >
            {a.emoji} {a.label}
            <span
              className={`badge ${aba === a.key ? 'badge-brand' : ''}`}
              style={{
                background: aba === a.key ? 'var(--brand-primary)' : 'var(--bg-elevated)',
                color:      aba === a.key ? '#000' : 'var(--text-tertiary)',
              }}
            >
              {a.count}
            </span>
          </button>
        ))}
      </div>

      {/* ABA: PRODUTOS */}
      {aba === 'produtos' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => { setEdit(null); setModal(true); }} className="btn btn-primary">
              + Novo Produto
            </button>
          </div>

          {produtos.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', paddingTop: '4rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🍔</div>
              <p>Nenhum produto cadastrado ainda.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>

              {/* Cabecalho da tabela */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '1rem', padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
                {['Produto', 'Preco', 'Status', 'Acoes'].map(h => (
                  <p key={h} style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0, textAlign: h === 'Acoes' || h === 'Preco' || h === 'Status' ? 'right' : 'left' }}>
                    {h}
                  </p>
                ))}
              </div>

              {/* Linha de cada produto — borda colorida indica status ativo/inativo */}
              {produtos.map(p => (
                <div
                  key={p.id}
                  className="surface-elevated"
                  style={{
                    display:             'grid',
                    gridTemplateColumns: '1fr auto auto auto',
                    gap:                 '1rem',
                    padding:             '0.875rem 1rem',
                    alignItems:          'center',
                    borderLeft:          `3px solid ${p.ativo ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                    opacity:             p.ativo ? 1 : 0.5,
                    transition:          'opacity var(--transition-base)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{p.nome}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>
                      {/* Exibe categoria e quantidade de tamanhos se houver */}
                      {p.categoria?.nome ?? '—'}{p.tamanhos?.length > 0 ? ` · ${p.tamanhos.length} tamanhos` : ''}
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: 'var(--brand-primary)', fontSize: '0.9375rem', textAlign: 'right' }}>
                    {moeda(p.preco)}
                  </span>
                  <button onClick={() => toggleProduto(p)} className={`btn btn-sm ${p.ativo ? 'btn-success' : 'btn-ghost'}`} style={{ opacity: p.ativo ? 1 : 0.6 }}>
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                  <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => { setEdit(p); setModal(true); }} className="btn btn-icon btn-ghost" title="Editar">✏️</button>
                    <button onClick={() => deletarProduto(p.id)} className="btn btn-icon btn-danger" title="Deletar">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA: CATEGORIAS */}
      {aba === 'categorias' && (
        <div className="animate-fade-in" style={{ maxWidth: 520 }}>

          {/* Formulario de criacao rapida — Enter tambem dispara */}
          <div className="surface-elevated" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem' }}>
            <input
              className="input-field"
              style={{ flex: 1 }}
              placeholder="Nome da categoria..."
              value={novaCateg}
              onChange={e => setNovaC(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && salvarCategoria()}
            />
            <button onClick={salvarCategoria} className="btn btn-primary">+ Criar</button>
          </div>

          {categorias.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', paddingTop: '3rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🗂️</div>
              <p>Nenhuma categoria ainda.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {categorias.map(c => (
                <div
                  key={c.id}
                  className="surface-elevated"
                  style={{
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'space-between',
                    padding:        '0.75rem 1rem',
                    borderLeft:     `3px solid ${c.ativo ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                    opacity:        c.ativo ? 1 : 0.5,
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.nome}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => toggleCategoria(c)} className={`btn btn-sm ${c.ativo ? 'btn-success' : 'btn-ghost'}`}>
                      {c.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                    <button onClick={() => deletarCategoria(c.id)} className="btn btn-icon btn-danger">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA: ADICIONAIS */}
      {aba === 'adicionais' && (
        <div className="animate-fade-in" style={{ maxWidth: 520 }}>

          {/* Formulario com dois campos: nome e preco */}
          <div className="surface-elevated" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem' }}>
            <input
              className="input-field"
              style={{ flex: 1 }}
              placeholder="Nome do adicional..."
              value={novoAdic.nome}
              onChange={e => setNovoA(p => ({ ...p, nome: e.target.value }))}
            />
            <input
              className="input-field"
              type="number"
              min="0"
              step="0.01"
              placeholder="R$ 0,00"
              style={{ width: 110 }}
              value={novoAdic.preco}
              onChange={e => setNovoA(p => ({ ...p, preco: e.target.value }))}
            />
            <button onClick={salvarAdicional} className="btn btn-primary">+ Criar</button>
          </div>

          {adicionais.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', paddingTop: '3rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>➕</div>
              <p>Nenhum adicional ainda.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {adicionais.map(a => (
                <div
                  key={a.id}
                  className="surface-elevated"
                  style={{
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'space-between',
                    padding:        '0.75rem 1rem',
                    borderLeft:     `3px solid ${a.ativo ? 'var(--color-success)' : 'var(--border-color)'}`,
                    opacity:        a.ativo ? 1 : 0.5,
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{a.nome}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: '0.875rem' }}>{moeda(a.preco)}</span>
                    <button onClick={() => toggleAdicional(a)} className={`btn btn-sm ${a.ativo ? 'btn-success' : 'btn-ghost'}`}>
                      {a.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                    <button onClick={() => deletarAdicional(a.id)} className="btn btn-icon btn-danger">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de criacao e edicao de produto — renderiza so quando aberto */}
      {modalProd && (
        <ProdutoModal
          produto={editProd}
          categorias={categorias}
          adicionais={adicionais}
          onSalvar={salvarProduto}
          onFechar={() => { setModal(false); setEdit(null); }}
        />
      )}
    </div>
  );
}