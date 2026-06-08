import { STORAGE_NAMESPACE } from "./storageKeys";

/**
 * Backup JSON do estado completo persistido pelo FuteLista. A estratégia
 * é "tudo o que está sob o namespace `futelista:`", sem tentar entender
 * o schema interno — assim o backup sobrevive a campos novos no domínio
 * sem precisar de migração aqui.
 *
 * Formato (v1):
 *
 * ```json
 * {
 *   "version": 1,
 *   "app": "FuteLista",
 *   "exportadoEm": 1717804800000,
 *   "items": [
 *     { "key": "futelista:peladaTipo:abc", "value": "{...}" },
 *     { "key": "futelista:execucao:xyz",  "value": "{...}" }
 *   ]
 * }
 * ```
 *
 * Os `value` são strings (JSON dentro de JSON) — preserva exatamente o
 * que `AsyncStorage.setItem` escreveu, sem risco de re-serialização
 * mudar campos.
 */

/**
 * API mínima de AsyncStorage que o gerador depende. Tipar aqui ao invés
 * de importar o módulo permite spec roda sem mock pesado.
 */
export type StorageAPI = {
  getAllKeys(): Promise<readonly string[]>;
  multiGet(
    keys: readonly string[],
  ): Promise<readonly (readonly [string, string | null])[]>;
};

export type BackupPayloadV1 = {
  version: 1;
  app: "FuteLista";
  exportadoEm: number;
  items: { key: string; value: string }[];
};

/**
 * Gera o payload de backup como objeto JS. Útil pra testar a forma sem
 * passar pelo `JSON.stringify`.
 *
 * `agora` é injetado em vez de chamar `Date.now()` aqui — facilita teste
 * determinístico e mantém a função pura.
 */
export async function gerarBackup(
  storage: StorageAPI,
  agora: number = Date.now(),
): Promise<BackupPayloadV1> {
  const chaves = await storage.getAllKeys();
  const doFuteLista = chaves
    .filter((k) => k.startsWith(STORAGE_NAMESPACE))
    .sort(); // sort estável → diffs entre backups ficam previsíveis
  const entries = doFuteLista.length === 0 ? [] : await storage.multiGet(doFuteLista);
  const items: { key: string; value: string }[] = [];
  for (const [key, value] of entries) {
    if (value === null) continue;
    items.push({ key, value });
  }
  return {
    version: 1,
    app: "FuteLista",
    exportadoEm: agora,
    items,
  };
}

/**
 * Conveniência: gera o JSON pronto pra compartilhar. Indentação 2
 * espaços — equilíbrio entre legível pelo usuário (que pode abrir no
 * Drive) e tamanho do payload.
 */
export async function gerarBackupJSON(
  storage: StorageAPI,
  agora?: number,
): Promise<string> {
  const payload = await gerarBackup(storage, agora);
  return JSON.stringify(payload, null, 2);
}
