import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Persistência do id da pelada ativa (qual pelada o app deve abrir no boot).
 *
 * Separado do RepositorioPelada porque é responsabilidade de UI/aplicação,
 * não de domínio: o domínio não tem o conceito de "pelada selecionada".
 */
const STORAGE_KEY = "futelista:pelada:ativa-id";

export async function lerPeladaAtivaId(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEY);
}

export async function definirPeladaAtivaId(id: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, id);
}

export async function limparPeladaAtivaId(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
