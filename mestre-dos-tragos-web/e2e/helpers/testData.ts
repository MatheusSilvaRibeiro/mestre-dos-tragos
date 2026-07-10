/**
 * testData.ts
 * -----------------------------------------------------------------------
 * Helpers para gerar dados de teste com nomes unicos (timestamp) e para
 * ler credenciais de teste a partir de variaveis de ambiente.
 *
 * IMPORTANTE:
 * O frontend aponta para uma API em producao (Render), hardcoded em
 * src/services/api.ts (`https://mestre-dos-tragos-api.onrender.com/api`).
 * Isso significa que estes testes E2E, do jeito que o projeto esta hoje,
 * vao gravar dados reais nessa API. Antes de rodar em CI:
 *
 *   1. Garanta que exista um usuario ADMIN "descartavel" so para os
 *      testes (nao use sua conta real de producao).
 *   2. Configure as credenciais via variaveis de ambiente (ver abaixo),
 *      nunca commitadas no repositorio.
 *   3. Considere criar uma variavel de ambiente para a baseURL da API
 *      (ex: VITE_API_URL, seguindo o mesmo padrao ja usado no
 *      socket.io em src/pages/cozinha/index.tsx) para permitir apontar
 *      para um ambiente de staging/homologacao ao rodar E2E.
 * -----------------------------------------------------------------------
 */

export interface Credenciais {
  usuario: string;
  senha: string;
}

/** Le uma variavel de ambiente obrigatoria, com valor de fallback para dev local. */
function env(key: string, fallback: string): string {
  return process.env[key]?.trim() || fallback;
}

/** Credenciais de um usuario ADMIN de teste. */
export function credenciaisAdmin(): Credenciais {
  return {
    usuario: env('E2E_ADMIN_USUARIO', 'admin.teste'),
    senha: env('E2E_ADMIN_SENHA', 'senha-invalida-configure-o-env'),
  };
}

/** Credenciais de um usuario ATENDENTE de teste (usado nas suites de pedidos). */
export function credenciaisAtendente(): Credenciais {
  return {
    usuario: env('E2E_ATENDENTE_USUARIO', 'atendente.teste'),
    senha: env('E2E_ATENDENTE_SENHA', 'senha-invalida-configure-o-env'),
  };
}

/** Credenciais de um usuario COZINHA de teste (usado na suite de cozinha). */
export function credenciaisCozinha(): Credenciais {
  return {
    usuario: env('E2E_COZINHA_USUARIO', 'cozinha.teste'),
    senha: env('E2E_COZINHA_SENHA', 'senha-invalida-configure-o-env'),
  };
}

/** Sufixo unico baseado em timestamp — evita colisao entre execucoes/paralelismo. */
export function sufixoUnico(): string {
  return Date.now().toString(36);
}

/** Nome de categoria de teste com sufixo unico. */
export function nomeCategoriaTeste(prefixo = 'Categoria E2E'): string {
  return `${prefixo} ${sufixoUnico()}`;
}

/** Nome de produto de teste com sufixo unico. */
export function nomeProdutoTeste(prefixo = 'Produto E2E'): string {
  return `${prefixo} ${sufixoUnico()}`;
}

/** Nome de adicional de teste com sufixo unico. */
export function nomeAdicionalTeste(prefixo = 'Adicional E2E'): string {
  return `${prefixo} ${sufixoUnico()}`;
}