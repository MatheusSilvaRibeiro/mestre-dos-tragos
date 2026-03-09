import type { FormCriar, FormEditar, FormSenha } from './tipos';

// 
// CONFIGURACAO DE ROLES
// Centraliza cores, fundos e labels de cada cargo.
// Usado em SeletorRole, LinhaFuncionario e qualquer badge de role.
// Alterar aqui reflete em toda a aplicacao automaticamente.
// 
export const ROLE_CONFIG: Record<string, {
  label: string;
  cor:   string;
  bg:    string;
}> = {
  ADMIN:     { label: 'Admin',     cor: '#f43f5e', bg: 'rgba(244,63,94,0.08)'   },
  ATENDENTE: { label: 'Atendente', cor: '#6366f1', bg: 'rgba(99,102,241,0.08)'  },
  COZINHA:   { label: 'Cozinha',   cor: '#f59e0b', bg: 'rgba(245,158,11,0.08)'  },
};

// 
// FORMULARIOS INICIAIS
// Valores padrao usados ao abrir os modais — evita estado residual de interacoes anteriores.
// Sempre resetar para esses valores ao abrir um modal novo.
// 
export const FORM_CRIAR_INICIAL: FormCriar = {
  nome:    '',
  usuario: '',
  senha:   '',
  role:    'ATENDENTE', // role padrao para novos funcionarios
};

export const FORM_EDITAR_INICIAL: FormEditar = {
  nome:    '',
  usuario: '',
  role:    'ATENDENTE',
  ativo:   true,
};

export const FORM_SENHA_INICIAL: FormSenha = {
  senha:     '',
  confirmar: '',
};