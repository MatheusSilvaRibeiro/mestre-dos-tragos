// 
// TIPOS DO MODULO FUNCIONARIOS
// Compartilhados entre Funcionarios.tsx, components.tsx, modais.tsx e config.ts.
// 

export interface Funcionario {
  id:       string;
  nome:     string;
  usuario:  string;
  role:     'ADMIN' | 'ATENDENTE' | 'COZINHA';
  ativo:    boolean;
  criadoEm: string; // ISO string — formatar com toLocaleDateString antes de exibir
}

// Controla qual modal esta aberto — null significa nenhum
export type ModalTipo = 'criar' | 'editar' | 'resetar' | 'deletar' | null;

export interface FormCriar {
  nome:    string;
  usuario: string;
  senha:   string;
  role:    string;
}

export interface FormEditar {
  nome:    string;
  usuario: string;
  role:    string;
  ativo:   boolean;
}

// Formulario de reset usa confirmacao separada — validada no cliente antes de enviar
export interface FormSenha {
  senha:     string;
  confirmar: string;
}