/**
 * Ponto único de definição das chaves usadas no AsyncStorage do FuteLista.
 *
 * Mudar o namespace ou um prefixo aqui se propaga automaticamente para o
 * repositório, para o slot de pelada ativa e para o devSeed. Evita strings
 * cruas espalhadas e o risco de divergência entre escrita e filtro/limpeza.
 *
 * `EXEC_LEGACY` é mantido só como leitor — qualquer escrita nova usa `EXEC`.
 */

export const STORAGE_NAMESPACE = "futelista:" as const;

export const STORAGE_KEYS = {
  /** Prefixo das execuções (sessões jogadas, payload do GestorJogo). */
  EXEC: `${STORAGE_NAMESPACE}execucao:`,
  /** Prefixo herdado, anterior ao conceito de tipo de Pelada. Somente leitura. */
  EXEC_LEGACY: `${STORAGE_NAMESPACE}pelada:`,
  /** Prefixo dos tipos de Pelada cadastrados. */
  PELADA_TIPO: `${STORAGE_NAMESPACE}peladaTipo:`,
  /** Slot que guarda o id da execução ativa entre boots do app. */
  ATIVA_ID: `${STORAGE_NAMESPACE}pelada:ativa-id`,
  /** Preferência de tema visual (id da paleta + modo). */
  THEME: `${STORAGE_NAMESPACE}theme`,
} as const;

/** Compõe a chave de execução a partir do id. */
export function execucaoKey(id: string): string {
  return `${STORAGE_KEYS.EXEC}${id}`;
}

/** Compõe a chave herdada (apenas leitura) — usada na migração silenciosa. */
export function execucaoKeyLegado(id: string): string {
  return `${STORAGE_KEYS.EXEC_LEGACY}${id}`;
}

/** Compõe a chave do tipo de Pelada a partir do id. */
export function peladaTipoKey(id: string): string {
  return `${STORAGE_KEYS.PELADA_TIPO}${id}`;
}
