import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import { SectionTitle, SeletorRole, LinhaFuncionario, HeaderTabela } from './components';
import { ModalOverlay, CampoInput, FooterModal }                      from './modais';
import { FORM_CRIAR_INICIAL, FORM_EDITAR_INICIAL, FORM_SENHA_INICIAL } from './config';
import type { Funcionario, ModalTipo, FormCriar, FormEditar, FormSenha } from './tipos';

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [salvando,     setSalvando]     = useState(false);
  const [busca,        setBusca]        = useState('');
  const [modal,        setModal]        = useState<ModalTipo>(null);
  const [selecionado,  setSelecionado]  = useState<Funcionario | null>(null);
  const [formCriar,    setFormCriar]    = useState<FormCriar>(FORM_CRIAR_INICIAL);
  const [formEditar,   setFormEditar]   = useState<FormEditar>(FORM_EDITAR_INICIAL);
  const [formSenha,    setFormSenha]    = useState<FormSenha>(FORM_SENHA_INICIAL);

  useEffect(() => { carregar(); }, []);

  // Busca todos os funcionarios da API
  async function carregar() {
    setLoading(true);
    try {
      const res = await api.get('/usuarios');
      setFuncionarios(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Erro ao carregar funcionarios', err);
      setFuncionarios([]);
    } finally {
      setLoading(false);
    }
  }

  // 
  // CRUD
  // Cada funcao valida o minimo necessario, chama a API e recarrega a lista.
  // setSalvando desabilita os botoes enquanto a requisicao esta em andamento.
  // 

  async function criar() {
    if (!formCriar.nome || !formCriar.usuario || !formCriar.senha) return;
    setSalvando(true);
    try {
      await api.post('/usuarios', formCriar);
      await carregar();
      fechar();
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  }

  async function editar() {
    if (!selecionado) return;
    setSalvando(true);
    try {
      await api.put(`/usuarios/${selecionado.id}`, formEditar);
      await carregar();
      fechar();
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  }

  async function resetarSenha() {
    if (!selecionado || !formSenha.senha) return;
    // Valida confirmacao antes de enviar para a API
    if (formSenha.senha !== formSenha.confirmar) {
      alert('As senhas nao conferem!');
      return;
    }
    setSalvando(true);
    try {
      await api.put(`/usuarios/${selecionado.id}`, {
        nome:    selecionado.nome,
        usuario: selecionado.usuario,
        role:    selecionado.role,
        ativo:   selecionado.ativo,
        senha:   formSenha.senha,
      });
      fechar();
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  }

  async function deletar() {
    if (!selecionado) return;
    setSalvando(true);
    try {
      await api.delete(`/usuarios/${selecionado.id}`);
      await carregar();
      fechar();
    } catch (err) {
      console.error('Erro ao deletar funcionario:', err);
      alert('Erro ao deletar funcionario. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  // Alterna ativo/inativo direto na listagem — sem abrir modal
  async function toggleAtivo(f: Funcionario) {
    try {
      await api.put(`/usuarios/${f.id}`, {
        nome: f.nome, usuario: f.usuario, role: f.role, ativo: !f.ativo,
      });
      await carregar();
    } catch (err) {
      console.error(err);
    }
  }

  // 
  // CONTROLE DE MODAIS
  // Cada funcao "abrir" pre-preenche o formulario correspondente antes de exibir o modal.
  // fechar() sempre limpa o selecionado para evitar dados residuais.
  // 
  function abrirCriar()                 { setFormCriar(FORM_CRIAR_INICIAL); setModal('criar'); }
  function abrirEditar(f: Funcionario)  { setSelecionado(f); setFormEditar({ nome: f.nome, usuario: f.usuario, role: f.role, ativo: f.ativo }); setModal('editar'); }
  function abrirResetar(f: Funcionario) { setSelecionado(f); setFormSenha(FORM_SENHA_INICIAL); setModal('resetar'); }
  function abrirDeletar(f: Funcionario) { setSelecionado(f); setModal('deletar'); }
  function fechar()                     { setModal(null); setSelecionado(null); }

  // Filtra por nome ou usuario em tempo real — sem requisicao adicional
  const filtrados = funcionarios.filter(f =>
    f.nome.toLowerCase().includes(busca.toLowerCase()) ||
    f.usuario.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: '0.75rem', color: 'var(--text-tertiary)' }}>
      Carregando funcionarios...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* CABECALHO — titulo, contagem e botao de novo cadastro */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Funcionarios
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', margin: 0 }}>
            {funcionarios.length} funcionario{funcionarios.length !== 1 ? 's' : ''} cadastrado{funcionarios.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={abrirCriar} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          + Novo Funcionario
        </button>
      </div>

      {/* BUSCA — filtra por nome ou usuario em tempo real */}
      <section>
        <SectionTitle emoji="🔍" title="Buscar" />
        <div className="surface-elevated" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: 400 }}>
          <input
            type="text"
            placeholder="Buscar por nome ou usuario..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '0.875rem', color: 'var(--text-primary)' }}
          />
        </div>
      </section>

      {/* LISTA DE FUNCIONARIOS */}
      <section>
        <SectionTitle emoji="👥" title="Equipe" />
        <div className="surface-elevated">
          {filtrados.length === 0 ? (
            // Estado vazio — exibe CTA para cadastrar o primeiro funcionario
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
                Nenhum funcionario encontrado
              </p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', margin: '0 0 1.25rem' }}>
                Cadastre o primeiro funcionario agora
              </p>
              <button onClick={abrirCriar} className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
                + Cadastrar funcionario
              </button>
            </div>
          ) : (
            <React.Fragment>
              <HeaderTabela />
              <div>
                {filtrados.map(f => (
                  <LinhaFuncionario
                    key={f.id}
                    f={f}
                    onEditar={abrirEditar}
                    onResetar={abrirResetar}
                    onToggle={toggleAtivo}
                    onDeletar={abrirDeletar}
                  />
                ))}
              </div>
            </React.Fragment>
          )}
        </div>
      </section>

      {/* MODAL CRIAR */}
      {modal === 'criar' && (
        <ModalOverlay onFechar={fechar} titulo="Novo Funcionario">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <CampoInput label="Nome completo"  placeholder="Ex: Joao Silva"      value={formCriar.nome}    onChange={v => setFormCriar({ ...formCriar, nome:    v })} />
            <CampoInput label="Usuario"        placeholder="Ex: joao.silva"      value={formCriar.usuario} onChange={v => setFormCriar({ ...formCriar, usuario: v })} />
            <CampoInput label="Senha"          placeholder="Minimo 6 caracteres" value={formCriar.senha}   onChange={v => setFormCriar({ ...formCriar, senha:   v })} type="password" />
            <SeletorRole value={formCriar.role} onChange={r => setFormCriar({ ...formCriar, role: r })} />
          </div>
          <FooterModal onCancelar={fechar} onConfirmar={criar} salvando={salvando} labelConfirmar="Cadastrar" />
        </ModalOverlay>
      )}

      {/* MODAL EDITAR */}
      {modal === 'editar' && (
        <ModalOverlay onFechar={fechar} titulo="Editar Funcionario">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <CampoInput label="Nome completo" placeholder="Ex: Joao Silva" value={formEditar.nome}    onChange={v => setFormEditar({ ...formEditar, nome:    v })} />
            <CampoInput label="Usuario"       placeholder="Ex: joao.silva" value={formEditar.usuario} onChange={v => setFormEditar({ ...formEditar, usuario: v })} />
            <SeletorRole value={formEditar.role} onChange={r => setFormEditar({ ...formEditar, role: r })} />
            {/* Toggle de ativo/inativo — interruptor visual */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Funcionario ativo
              </span>
              <button
                type="button"
                onClick={() => setFormEditar({ ...formEditar, ativo: !formEditar.ativo })}
                style={{ width: 48, height: 24, borderRadius: 999, border: 'none', background: formEditar.ativo ? 'var(--brand-primary)' : 'var(--border-color)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}
              >
                <span style={{ position: 'absolute', top: 4, left: formEditar.ativo ? 28 : 4, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
              </button>
            </div>
          </div>
          <FooterModal onCancelar={fechar} onConfirmar={editar} salvando={salvando} labelConfirmar="Salvar alteracoes" />
        </ModalOverlay>
      )}

      {/* MODAL RESETAR SENHA */}
      {modal === 'resetar' && (
        <ModalOverlay onFechar={fechar} titulo="Resetar Senha">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', margin: 0 }}>
              Definindo nova senha para{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{selecionado?.nome}</strong>
            </p>
            <CampoInput label="Nova senha"      placeholder="Minimo 6 caracteres" value={formSenha.senha}     onChange={v => setFormSenha({ ...formSenha, senha:     v })} type="password" />
            <CampoInput label="Confirmar senha" placeholder="Repita a senha"      value={formSenha.confirmar} onChange={v => setFormSenha({ ...formSenha, confirmar: v })} type="password" />
          </div>
          <FooterModal onCancelar={fechar} onConfirmar={resetarSenha} salvando={salvando} labelConfirmar="Confirmar reset" />
        </ModalOverlay>
      )}

      {/* MODAL DELETAR — confirmacao com aviso de acao irreversivel */}
      {modal === 'deletar' && (
        <ModalOverlay onFechar={fechar} titulo="Deletar Funcionario">
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
              Deletar funcionario?
            </p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', margin: 0 }}>
              Voce esta prestes a deletar{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{selecionado?.nome}</strong>.<br />
              Esta acao <strong>nao pode ser desfeita</strong>.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" onClick={fechar} disabled={salvando} className="btn btn-ghost">
              Cancelar
            </button>
            <button
              type="button"
              onClick={deletar}
              disabled={salvando}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-md)', border: 'none', background: salvando ? 'rgba(244,63,94,0.6)' : 'var(--color-danger)', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: salvando ? 'not-allowed' : 'pointer', transition: 'all var(--transition-fast)' }}
            >
              {salvando
                ? <><span className="spinner spinner-sm" /> Deletando...</>
                : 'Sim, deletar'
              }
            </button>
          </div>
        </ModalOverlay>
      )}

    </div>
  );
}