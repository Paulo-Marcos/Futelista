/**
 * Constantes da camada app-shell.
 *
 * Centraliza valores que antes ficavam soltos em providers/componentes:
 *  - tempos de espera (autosave)
 *  - rótulos default (nome de execução avulsa)
 *  - rotas internas do Expo Router (única fonte para `router.push`)
 *
 * Quando um valor migra para configuração de usuário, troca-se aqui e o
 * resto do app reflete automaticamente.
 */

/** Debounce entre mudanças no GestorJogo e gravação no repositório. */
export const AUTOSAVE_DEBOUNCE_MS = 500;

/** Nome aplicado a execuções "avulsas" sem tipo de Pelada associado. */
export const NOME_AVULSA_DEFAULT = "Pelada avulsa";

/**
 * Rotas do Expo Router consumidas via `router.push`.
 *
 * `as const` mantém a string literal — útil pra checagem de typos
 * em tempo de tipo, sem precisar inventar tipos custom.
 */
export const ROUTES = {
  REGRAS: "/regras",
  PARTIDA: "/partida",
} as const;
