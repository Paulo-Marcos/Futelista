import { GameManager } from "@/src/domain/GameManager";
import { RepositorioPelada } from "@/src/domain/ports/RepositorioPelada";

/**
 * Adapter de persistencia em memoria.
 *
 * Mantem a referencia do GameManager em um Map modulo-level, o que
 * preserva o estado entre remounts do provider (util com fast refresh)
 * dentro do mesmo runtime do JS. Nao sobrevive a recarga completa do app.
 */
const cache = new Map<string, GameManager>();

export class RepositorioPeladaEmMemoria implements RepositorioPelada {
  async carregar(peladaId: string): Promise<GameManager | null> {
    return cache.get(peladaId) ?? null;
  }

  async salvar(jogo: GameManager): Promise<void> {
    cache.set(jogo.id, jogo);
  }

  async limpar(peladaId: string): Promise<void> {
    cache.delete(peladaId);
  }
}
