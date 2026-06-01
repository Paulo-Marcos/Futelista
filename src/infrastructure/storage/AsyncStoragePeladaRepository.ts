import AsyncStorage from "@react-native-async-storage/async-storage";

import { GameManager } from "@/src/domain/GameManager";
import { RepositorioPelada } from "@/src/domain/ports/RepositorioPelada";

import { deserializeGameManager, serializeGameManager } from "./serializer";

/**
 * Adapter de persistência sobre AsyncStorage.
 *
 * Chave de cada pelada: `futelista:pelada:<id>`.
 * Não usa transação — uma pelada por chave é suficiente para o escopo atual.
 *
 * Falhas de I/O são propagadas ao chamador para que ele decida a estratégia
 * de fallback (mostrar erro na UI, criar pelada nova etc).
 */
export class AsyncStoragePeladaRepository implements RepositorioPelada {
  private static readonly PREFIX = "futelista:pelada:";

  async carregar(peladaId: string): Promise<GameManager | null> {
    const raw = await AsyncStorage.getItem(this.keyOf(peladaId));
    if (!raw) return null;
    return deserializeGameManager(raw);
  }

  async salvar(jogo: GameManager): Promise<void> {
    const raw = serializeGameManager(jogo);
    await AsyncStorage.setItem(this.keyOf(jogo.id), raw);
  }

  async limpar(peladaId: string): Promise<void> {
    await AsyncStorage.removeItem(this.keyOf(peladaId));
  }

  private keyOf(peladaId: string): string {
    return `${AsyncStoragePeladaRepository.PREFIX}${peladaId}`;
  }
}
