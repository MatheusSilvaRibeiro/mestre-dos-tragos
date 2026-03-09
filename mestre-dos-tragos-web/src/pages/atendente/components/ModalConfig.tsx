import { useState } from 'react';
import type { Produto, ItemCarrinho, Adicional, Tamanho } from '../atendente.types';
import { moeda, getPrecoTamanho, getPrecoAdicional, TAMANHO_LABEL } from '../atendente.helpers';

interface Props {
  produto:   Produto;
  onConfirm: (item: ItemCarrinho) => void;
  onClose:   () => void;
}

const EMOJI_TIPO: Record<string, string> = {
  LANCHE:       '🍔',
  BATATA_FRITA: '🍟',
  PORCAO_MISTA: '🍟',
};

// 
// MODAL DE CONFIGURACAO DO ITEM
// Abre ao clicar em um produto — permite selecionar tamanho, adicionais,
// sabores (PORCAO_MISTA) e quantidade antes de adicionar ao carrinho.
// 
export function ModalConfig({ produto, onConfirm, onClose }: Props) {
  // Inicializa com o primeiro tamanho disponivel, se houver
  const tamanhoInicial = produto.tamanhos.length > 0 ? produto.tamanhos[0].tamanho : undefined;

  const [tamanho,    setTamanho]    = useState<Tamanho | undefined>(tamanhoInicial);
  const [adicionais, setAdicionais] = useState<{ adicional: Adicional; preco: number }[]>([]);
  const [sabores,    setSabores]    = useState<string[]>(['']); // PORCAO_MISTA — sempre inicia com 1 campo
  const [quantidade, setQtd]        = useState(1);

  const emoji       = produto.emoji ?? EMOJI_TIPO[produto.tipo] ?? '🍽️';
  const precoBase   = tamanho ? getPrecoTamanho(produto, tamanho) : Number(produto.preco);
  const saboresValid = sabores.filter(s => s.trim().length > 0);
  const qtdExtras    = Math.max(0, saboresValid.length - 1); // 1 sabor incluso, demais cobram extra
  const precoExtras  = produto.tipo === 'PORCAO_MISTA' ? qtdExtras * precoBase : 0;
  const precoAdics   = adicionais.reduce((acc, a) => acc + a.preco, 0);
  const totalUnit    = precoBase + precoAdics + precoExtras;

  // PORCAO_MISTA exige ao menos 1 sabor valido para liberar o botao
  const podeConfirmar = produto.tipo !== 'PORCAO_MISTA' || saboresValid.length > 0;

  // Ao mudar tamanho, recalcula o preco de cada adicional ja selecionado
  function mudarTamanho(t: Tamanho) {
    setTamanho(t);
    setAdicionais(prev => prev.map(a => ({ ...a, preco: getPrecoAdicional(a.adicional, t) })));
  }

  function toggleAdicional(adicional: Adicional) {
    const existe = adicionais.find(a => a.adicional.id === adicional.id);
    if (existe) setAdicionais(prev => prev.filter(a => a.adicional.id !== adicional.id));
    else        setAdicionais(prev => [...prev, { adicional, preco: getPrecoAdicional(adicional, tamanho) }]);
  }

  function confirmar() {
    onConfirm({ produto, quantidade, tamanho, adicionais, sabores: saboresValid, precoUnit: totalUnit });
  }

  return (
    // Clicar no overlay fecha o modal
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
    >
      <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 440, maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--bg-elevated)', overflow: 'hidden' }}>

        {/* HEADER — emoji, nome e tipo do produto */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--bg-elevated)', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', flexShrink: 0 }}>
            {emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {produto.nome}
            </h2>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', margin: '0.15rem 0 0' }}>
              {produto.tipo === 'LANCHE'       && 'Lanche'}
              {produto.tipo === 'BATATA_FRITA' && 'Batata Frita — escolha o tamanho'}
              {produto.tipo === 'PORCAO_MISTA' && 'Porcao Mista — tamanho + sabores'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            x
          </button>
        </div>

        {/* CORPO — scrollavel */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* TAMANHO — visivel apenas para BATATA_FRITA e PORCAO_MISTA */}
          {produto.tipo !== 'LANCHE' && produto.tamanhos.length > 0 && (
            <div>
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-tertiary)', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Tamanho</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {produto.tamanhos.map(pt => {
                  const sel = tamanho === pt.tamanho;
                  return (
                    <button
                      key={pt.tamanho}
                      onClick={() => mudarTamanho(pt.tamanho)}
                      style={{ flex: 1, padding: '0.625rem 0.5rem', borderRadius: 'var(--radius-md)', border: `2px solid ${sel ? 'var(--brand-primary)' : 'var(--bg-elevated)'}`, background: sel ? 'rgba(245,158,11,0.1)' : 'var(--bg-elevated)', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center' }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: sel ? 'var(--brand-primary)' : 'var(--text-primary)' }}>{pt.tamanho}</div>
                      <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>{TAMANHO_LABEL[pt.tamanho]}</div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-primary)', marginTop: '0.2rem' }}>{moeda(Number(pt.preco))}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SABORES — exclusivo de PORCAO_MISTA */}
          {produto.tipo === 'PORCAO_MISTA' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div>
                  <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-tertiary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Sabores</p>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', margin: '0.15rem 0 0' }}>
                    1 incluso · cada extra <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>+{moeda(precoBase)}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSabores(prev => [...prev, ''])}
                  style={{ padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)', cursor: 'pointer' }}
                >
                  + Sabor
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {sabores.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type="text"
                        placeholder={i === 0 ? 'Sabor principal — incluso' : `Sabor ${i + 1} — +${moeda(precoBase)}`}
                        value={s}
                        onChange={e => setSabores(prev => prev.map((v, idx) => idx === i ? e.target.value : v))}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', paddingRight: i > 0 ? '4.5rem' : '0.75rem', borderRadius: 'var(--radius-md)', border: `1px solid ${i === 0 ? 'var(--bg-elevated)' : 'rgba(245,158,11,0.35)'}`, background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.8125rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                      {/* Indicador de preco extra — visivel nos sabores adicionais */}
                      {i > 0 && (
                        <span style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.625rem', fontWeight: 700, color: 'var(--brand-primary)', pointerEvents: 'none' }}>
                          +{moeda(precoBase)}
                        </span>
                      )}
                    </div>
                    {sabores.length > 1 && (
                      <button onClick={() => setSabores(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f43f5e', fontSize: '0.875rem', padding: '0.25rem', flexShrink: 0 }}>x</button>
                    )}
                  </div>
                ))}
              </div>

              {/* RESUMO DOS SABORES — quantidade e custo dos extras */}
              {saboresValid.length > 0 && (
                <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', fontSize: '0.6875rem', color: 'var(--brand-primary)', fontWeight: 700 }}>
                  {saboresValid.length} {saboresValid.length === 1 ? 'sabor' : 'sabores'}
                  {qtdExtras > 0 ? ` · ${qtdExtras} extra${qtdExtras > 1 ? 's' : ''} · +${moeda(precoExtras)}` : ' · incluso no preco'}
                </div>
              )}
            </div>
          )}

          {/* ADICIONAIS — chips selecionaveis, ocultos para PORCAO_MISTA */}
          {produto.tipo !== 'PORCAO_MISTA' && produto.adicionaisProduto.length > 0 && (
            <div>
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-tertiary)', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Adicionais</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {produto.adicionaisProduto.map(({ adicional }) => {
                  const sel   = !!adicionais.find(a => a.adicional.id === adicional.id);
                  const preco = getPrecoAdicional(adicional, tamanho);
                  return (
                    <div
                      key={adicional.id}
                      onClick={() => toggleAdicional(adicional)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: `1.5px solid ${sel ? 'var(--brand-primary)' : 'var(--bg-elevated)'}`, background: sel ? 'rgba(245,158,11,0.07)' : 'var(--bg-elevated)', cursor: 'pointer', transition: 'all 0.15s' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* Checkbox customizado — muda cor conforme selecao */}
                        <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${sel ? 'var(--brand-primary)' : 'var(--text-tertiary)'}`, background: sel ? 'var(--brand-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', color: '#000', fontWeight: 900, flexShrink: 0 }}>
                          {sel && 'v'}
                        </div>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: sel ? 600 : 400 }}>{adicional.nome}</span>
                      </div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-primary)' }}>+{moeda(preco)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* QUANTIDADE */}
          <div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-tertiary)', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Quantidade</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button onClick={() => setQtd(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--bg-elevated)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', minWidth: 28, textAlign: 'center' }}>{quantidade}</span>
              <button onClick={() => setQtd(q => q + 1)} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--brand-primary)', color: '#000', cursor: 'pointer', fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
          </div>
        </div>

        {/* RODAPE — total e botao de confirmar */}
        <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', background: 'var(--bg-elevated)' }}>
          <div>
            {/* Exibe "Nx preco" quando quantidade > 1, senso exibe apenas "Total" */}
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', margin: 0, fontWeight: 600 }}>
              {quantidade > 1 ? `${quantidade}x ${moeda(totalUnit)}` : 'Total'}
            </p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-primary)', margin: 0, lineHeight: 1.1 }}>
              {moeda(totalUnit * quantidade)}
            </p>
          </div>
          <button
            onClick={confirmar}
            disabled={!podeConfirmar}
            style={{ padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', border: 'none', background: podeConfirmar ? 'var(--brand-primary)' : 'var(--bg-surface)', color: podeConfirmar ? '#000' : 'var(--text-tertiary)', fontWeight: 800, fontSize: '0.875rem', cursor: podeConfirmar ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
          >
            Adicionar ao Pedido
          </button>
        </div>
      </div>
    </div>
  );
}