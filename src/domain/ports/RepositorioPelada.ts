import { GameManager } from "@/src/domain/GameManager";

/**
 * Porta de persistencia da pelada (Repository pattern).
 *
 * O dominio define o contrato; quem implementa fica em
 * `src/infrastructure/storage/`. Hoje o unico adapter e em memoria;
 * quando precisar sobreviver a reloads, troque por um adapter sobre
 * AsyncStorage ou expo-sqlite sem tocar no dominio.
 *
 * Assinatura assincrona para nao quebrar contrato quando um adapter
 * de I/O for adicionado.
 */
export interface RepositorioPelada {
  carregar(peladaId: string): Promise<GameManager | null>;
  salvar(jogo: GameManager): Promise<void>;
  limpar(peladaId: string): Promise<void>;
}
