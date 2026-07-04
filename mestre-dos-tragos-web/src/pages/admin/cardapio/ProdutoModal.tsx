import { useState } from 'react';
import type { Produto, Categoria, Adicional } from './types';

type TipoForm = 'LANCHE' | 'BATATA_FRITA' | 'PORCAO_MISTA';

interface TamanhoForm { tamanho: string; preco: string; }

interface Props {
  produto:    Produto | null;
  categorias: Categoria[];
  adicionais: Adicional[];
  onSalvar:   (dados: any) => void;
  onFechar:   () => void;
}

// Estilos reutilizaveis — centralizados aqui para nao repetir em cada campo
const input: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem',
  borderRadius: '6px', background: '#0f1117',
  border: '1px solid #1e2535', color: '#e2e8f0',
  fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem', color: '#64748b',
  marginBottom: '0.25rem', display: 'block',
};

// 
// MODAL DE PRODUTO — criacao e edicao
// Detecta automaticamente se e edicao ou criacao pelo prop "produto":
//   - produto !== null → modo edicao, campos pre-preenchidos
//   - produto === null → modo criacao, campos vazios
// 
export default function ProdutoModal({ produto, categorias, adicionais, onSalvar, onFechar }: Props) {
  const [nome,        setNome]        = useState(produto?.nome              ?? '');
  const [descricao,   setDescricao]   = useState(produto?.descricao         ?? '');
  const [emoji,       setEmoji]       = useState(produto?.emoji             ?? '');
  const [preco,       setPreco]       = useState(produto?.preco?.toString() ?? '');
  const [categoriaId, setCategoriaId] = useState(produto?.categoriaId       ?? '');
  const [disponivel,  setDisponivel]  = useState(produto?.ativo             ?? true);
  const [tipo,        setTipo]        = useState<TipoForm>(
    (produto as any)?.tipo ?? 'LANCHE'
  );

  // Tamanhos — usados apenas para BATATA_FRITA e PORCAO_MISTA
  const [tamanhos, setTamanhos] = useState<TamanhoForm[]>(
    produto?.tamanhos?.map((t: any) => ({
      tamanho: t.tamanho ?? t.nome ?? '',
      preco:   t.preco?.toString() ?? '',
    })) ?? []
  );

  // IDs dos adicionais selecionados — compativel com ambos os formatos da API
  const [adicSel, setAdicSel] = useState<string[]>(
    produto?.adicionaisProduto?.map((ap: any) => ap.adicional?.id ?? ap.id)
    ?? produto?.adicionais?.map((a: any) => a.id)
    ?? []
  );

  // Alterna selecao de adicional — adiciona se nao estiver, remove se estiver
  function toggleAdicional(id: string) {
    setAdicSel(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function addTamanho() {
    setTamanhos(prev => [...prev, { tamanho: '', preco: '' }]);
  }

  function removeTamanho(i: number) {
    setTamanhos(prev => prev.filter((_, idx) => idx !== i));
  }

  function atualizarTamanho(i: number, campo: keyof TamanhoForm, valor: string) {
    setTamanhos(prev => prev.map((t, j) => j === i ? { ...t, [campo]: valor } : t));
  }

  // 
  // VALIDACAO E ENVIO
  // Regras por tipo:
  //   LANCHE       → obrigatorio ter preco base
  //   BATATA_FRITA → obrigatorio ter ao menos um tamanho
  //   PORCAO_MISTA → obrigatorio ter ao menos um tamanho
  // 
  function salvar() {
    if (!nome.trim())   { alert('Informe o nome do produto.');   return; }
    if (!categoriaId)   { alert('Selecione uma categoria.');     return; }
    if (!tipo)          { alert('Selecione o tipo do produto.'); return; }

    if (tipo === 'LANCHE' && !preco) {
      alert('Lanche precisa de um preco base.'); return;
    }

    if ((tipo === 'BATATA_FRITA' || tipo === 'PORCAO_MISTA') && tamanhos.length === 0) {
      alert('Batata Frita e Porcao Mista precisam de tamanhos (P, M, G).'); return;
    }

    const payload: any = {
      nome:        nome.trim(),
      descricao:   descricao.trim() || null,
      emoji:       emoji.trim()     || null,
      preco:       parseFloat(preco) || 0,
      categoriaId,
      disponivel,
      tipo,
      // Filtra tamanhos vazios antes de enviar
      tamanhos: tamanhos
        .filter(t => t.tamanho.trim())
        .map(t => ({ tamanho: t.tamanho.trim(), preco: parseFloat(t.preco) || 0 })),
      adicionaisIds: adicSel,
    };

    onSalvar(payload);
  }

  return (
    // Overlay escuro que cobre toda a tela
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#161b27', borderRadius: '12px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', border: '1px solid #1e2535', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* HEADER — titulo dinamico e botao de fechar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#e2e8f0' }}>
            {produto ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.25rem' }}>x</button>
        </div>

        {/* TIPO — determina quais campos aparecem abaixo */}
        <div>
          <span style={labelStyle}>Tipo *</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {([
              { value: 'LANCHE',       label: 'Lanche'       },
              { value: 'BATATA_FRITA', label: 'Batata Frita' },
              { value: 'PORCAO_MISTA', label: 'Porcao Mista' },
            ] as { value: TipoForm; label: string }[]).map(op => (
              <button
                key={op.value}
                type="button"
                onClick={() => setTipo(op.value)}
                style={{
                  flex: 1, padding: '0.5rem 0.25rem',
                  borderRadius: '6px',
                  border:      `2px solid ${tipo === op.value ? '#f59e0b' : '#1e2535'}`,
                  background:   tipo === op.value ? 'rgba(245,158,11,0.12)' : '#1e2535',
                  color:        tipo === op.value ? '#f59e0b' : '#64748b',
                  fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                }}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>

        {/* NOME + EMOJI — emoji e opcional, nome e obrigatorio */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem' }}>
          <div>
            <span style={labelStyle}>Nome *</span>
            <input style={input} value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: X-Burguer" />
          </div>
          <div>
            <span style={labelStyle}>Emoji</span>
            <input
              style={{ ...input, width: 64, textAlign: 'center', fontSize: '1.25rem' }}
              value={emoji}
              onChange={e => setEmoji(e.target.value)}
              placeholder="?"
            />
          </div>
        </div>

        {/* DESCRICAO — opcional */}
        <div>
          <span style={labelStyle}>Descricao</span>
          <textarea
            style={{ ...input, minHeight: '60px', resize: 'vertical' }}
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Descricao opcional..."
          />
        </div>

        {/* PRECO + CATEGORIA */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            {/* Label muda conforme o tipo — Lanche exige preco, outros e opcional */}
            <span style={labelStyle}>
              {tipo === 'LANCHE' ? 'Preco (R$) *' : 'Preco base (R$)'}
            </span>
            <input
              style={input} type="number" min="0" step="0.01"
              value={preco} onChange={e => setPreco(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <div>
            <span style={labelStyle}>Categoria *</span>
            {/* Exibe apenas categorias ativas no select */}
            <select style={{ ...input, cursor: 'pointer' }} value={categoriaId} onChange={e => setCategoriaId(e.target.value)}>
              <option value="">Selecione...</option>
              {categorias.filter(c => c.ativo).map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {/* DISPONIVEL — checkbox para ativar/desativar no cardapio */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={disponivel} onChange={e => setDisponivel(e.target.checked)} />
          <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Produto disponivel no cardapio</span>
        </label>

        {/* TAMANHOS — visivel apenas para BATATA_FRITA e PORCAO_MISTA */}
        {(tipo === 'BATATA_FRITA' || tipo === 'PORCAO_MISTA') && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={labelStyle}>Tamanhos *</span>
              <button
                type="button"
                onClick={addTamanho}
                style={{ background: '#1e2535', border: 'none', color: '#94a3b8', cursor: 'pointer', borderRadius: '6px', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
              >
                + Adicionar
              </button>
            </div>
            {tamanhos.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: 0 }}>
                Adicione ao menos um tamanho (ex: P, M, G)
              </p>
            )}
            {/* Linha por tamanho: nome, preco e botao de remover */}
            {tamanhos.map((t, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <input
                  style={input}
                  placeholder="Ex: P / M / G"
                  value={t.tamanho}
                  onChange={e => atualizarTamanho(i, 'tamanho', e.target.value)}
                />
                <input
                  style={input} type="number"
                  placeholder="Preco"
                  value={t.preco}
                  onChange={e => atualizarTamanho(i, 'preco', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeTamanho(i)}
                  style={{ background: 'rgba(239,68,68,0.15)', border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: '6px', padding: '0 0.5rem' }}
                >x</button>
              </div>
            ))}
          </div>
        )}

        {/* ADICIONAIS — chips selecionaveis, visivel apenas se houver adicionais ativos */}
        {adicionais.filter(a => a.ativo).length > 0 && (
          <div>
            <span style={labelStyle}>Adicionais disponiveis</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {adicionais.filter(a => a.ativo).map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleAdicional(a.id)}
                  style={{
                    padding: '0.3rem 0.75rem', borderRadius: 999,
                    border: 'none', cursor: 'pointer',
                    fontSize: '0.75rem', fontWeight: 700,
                    // Cor muda conforme selecao
                    background: adicSel.includes(a.id) ? 'rgba(245,158,11,0.2)' : '#1e2535',
                    color:      adicSel.includes(a.id) ? '#f59e0b'              : '#64748b',
                  }}
                >
                  {a.nome}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* BOTOES — cancelar descarta, salvar valida e envia */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
          <button
            type="button"
            onClick={onFechar}
            style={{ background: '#1e2535', border: 'none', color: '#94a3b8', padding: '0.5rem 1.25rem', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={salvar}
            style={{ background: '#f59e0b', border: 'none', color: '#000', padding: '0.5rem 1.5rem', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}