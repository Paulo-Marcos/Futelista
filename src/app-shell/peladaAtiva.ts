import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "@/src/infrastructure/storage/storageKeys";

/**
 * Persistência do id da pelada ativa (qual pelada o app deve abrir no boot).
 *
 * Separado do RepositorioPelada porque é responsabilidade de UI/aplicação,
 * não de domínio: o domínio não tem o conceito de "pelada selecionada".
 */
export async function lerPeladaAtivaId(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.ATIVA_ID);
}

export async function definirPeladaAtivaId(id: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ATIVA_ID, id);
}

export async function limparPeladaAtivaId(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.ATIVA_ID);
}
