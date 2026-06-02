import AsyncStorage from "@react-native-async-storage/async-storage";

import { GameManager, PeladaStatus } from "@/src/domain/GameManager";
import { Pelada } from "@/src/domain/Pelada";
import {
  RepositorioPelada,
  ResumoExecucao,
  ResumoPeladaTipo,
} from "@/src/domain/ports/RepositorioPelada";

import {
  deserializePelada,
  parseResumoPelada,
  serializePelada,
} from "./peladaSerializer";
import {
  deserializeGameManager,
  Payload,
  serializeGameManager,
} from "./serializer";

/**
 * Adapter de persistência sobre AsyncStorage.
 *
 * Chaves:
 *  - execução (GameManager): `futelista:execucao:<id>` (legado: `futelista:pelada:<id>`)
 *  - pelada (tipo): `futelista:peladaTipo:<id>`
 *
 * O prefixo legado `futelista:pelada:` ainda é lido para não perder dados
 * salvos antes do conceito de "tipo de Pelada", mas escrita nova usa
 * `futelista:execucao:`.
 *
 * Falhas de I/O propagam ao chamador; itens corrompidos no `listar()` são
 * descartados silenciosamente.
 */
export class AsyncStoragePeladaRepository implements RepositorioPelada {
  private static readonly EXECUCAO_PREFIX = "futelista:execucao:";
  private static readonly EXECUCAO_PREFIX_LEGADO = "futelista:pelada:";
  private static readonly PELADA_PREFIX = "futelista:peladaTipo:";

  // ---- Execução -------------------------------------------------------

  async carregar(execucaoId: string): Promise<GameManager | null> {
    const raw =
      (await AsyncStorage.getItem(this.execucaoKey(execucaoId))) ??
      (await AsyncStorage.getItem(this.execucaoKeyLegado(execucaoId)));
    if (!raw) return null;
    return deserializeGameManager(raw);
  }

  async salvar(jogo: GameManager): Promise<void> {
    const raw = serializeGameManager(jogo);
    await AsyncStorage.setItem(this.execucaoKey(jogo.id), raw);
    // Limpa cópia legada se existir (evita item-fantasma após upgrade).
    await AsyncStorage.removeItem(this.execucaoKeyLegado(jogo.id));
  }

  async limpar(execucaoId: string): Promise<void> {
    await AsyncStorage.removeItem(this.execucaoKey(execucaoId));
    await AsyncStorage.removeItem(this.execucaoKeyLegado(execucaoId));
  }

  async listar(): Promise<ResumoExecucao[]> {
    const todos = await this.lerTodasExecucoes();
    return todos.sort((a, b) => recencia(b) - recencia(a));
  }

  async listarExecucoesDe(peladaId: string): Promise<ResumoExecucao[]> {
    const todos = await this.lerTodasExecucoes();
    return todos
      .filter((e) => e.peladaId === peladaId)
      .sort((a, b) => recencia(b) - recencia(a));
  }

  private async lerTodasExecucoes(): Promise<ResumoExecucao[]> {
    const keys = await AsyncStorage.getAllKeys();
    const execucaoKeys = keys.filter(
      (k) =>
        k.startsWith(AsyncStoragePeladaRepository.EXECUCAO_PREFIX) ||
        k.startsWith(AsyncStoragePeladaRepository.EXECUCAO_PREFIX_LEGADO),
    );
    if (execucaoKeys.length === 0) return [];
    const entries = await AsyncStorage.multiGet(execucaoKeys);
    const resumos: ResumoExecucao[] = [];
    for (const [, raw] of entries) {
      if (!raw) continue;
      const resumo = parseResumoExecucao(raw);
      if (resumo) resumos.push(resumo);
    }
    return resumos;
  }

  // ---- Pelada (tipo) --------------------------------------------------

  async carregarPelada(peladaId: string): Promise<Pelada | null> {
    const raw = await AsyncStorage.getItem(this.peladaKey(peladaId));
    if (!raw) return null;
    return deserializePelada(raw);
  }

  async salvarPelada(pelada: Pelada): Promise<void> {
    await AsyncStorage.setItem(
      this.peladaKey(pelada.id),
      serializePelada(pelada),
    );
  }

  async excluirPelada(peladaId: string): Promise<void> {
    await AsyncStorage.removeItem(this.peladaKey(peladaId));
  }

  async listarPeladas(): Promise<ResumoPeladaTipo[]> {
    const keys = await AsyncStorage.getAllKeys();
    const peladaKeys = keys.filter((k) =>
      k.startsWith(AsyncStoragePeladaRepository.PELADA_PREFIX),
    );
    if (peladaKeys.length === 0) return [];
    const entries = await AsyncStorage.multiGet(peladaKeys);
    const execucoes = await this.lerTodasExecucoes();
    const contagem = contarPorPelada(execucoes);
    const resumos: ResumoPeladaTipo[] = [];
    for (const [, raw] of entries) {
      if (!raw) continue;
      const base = parseResumoPelada(raw);
      if (!base) continue;
      resumos.push({
        id: base.id,
        nome: base.nome,
        createdAt: base.createdAt,
        regras: {
          playersPerTeam: base.regras.playersPerTeam,
          timeMatch: base.regras.timeMatch,
          numberTimes: base.regras.numberTimes,
          goalLimit: base.regras.goalLimit,
        },
        totalExecucoes: contagem.get(base.id) ?? 0,
      });
    }
    return resumos.sort((a, b) => b.createdAt - a.createdAt);
  }

  // ---- Chaves ---------------------------------------------------------

  private execucaoKey(id: string): string {
    return `${AsyncStoragePeladaRepository.EXECUCAO_PREFIX}${id}`;
  }
  private execucaoKeyLegado(id: string): string {
    return `${AsyncStoragePeladaRepository.EXECUCAO_PREFIX_LEGADO}${id}`;
  }
  private peladaKey(id: string): string {
    return `${AsyncStoragePeladaRepository.PELADA_PREFIX}${id}`;
  }
}

function parseResumoExecucao(raw: string): ResumoExecucao | null {
  try {
    const payload = JSON.parse(raw) as Payload;
    return {
      id: payload.pelada.id,
      name: payload.pelada.name,
      status: payload.pelada.status ?? PeladaStatus.ATIVA,
      createdAt: payload.pelada.createdAt ?? 0,
      startedAt: payload.pelada.startedAt ?? undefined,
      endedAt: payload.pelada.endedAt ?? undefined,
      totalJogadores: payload.players?.length ?? 0,
      totalPartidas: payload.matchHistoryIds?.length ?? 0,
      peladaId: payload.pelada.peladaId ?? undefined,
    };
  } catch {
    return null;
  }
}

function contarPorPelada(execucoes: ResumoExecucao[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of execucoes) {
    if (!e.peladaId) continue;
    map.set(e.peladaId, (map.get(e.peladaId) ?? 0) + 1);
  }
  return map;
}

function recencia(r: ResumoExecucao): number {
  return r.endedAt ?? r.startedAt ?? r.createdAt;
}
