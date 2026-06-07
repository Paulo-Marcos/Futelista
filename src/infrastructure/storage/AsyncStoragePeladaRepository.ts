import AsyncStorage from "@react-native-async-storage/async-storage";

import { GestorJogo, PeladaStatus } from "@/src/domain/GestorJogo";
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
  deserializeGestorJogo,
  Payload,
  serializeGestorJogo,
} from "./serializer";
import {
  STORAGE_KEYS,
  execucaoKey,
  execucaoKeyLegado,
  peladaTipoKey,
} from "./storageKeys";

/**
 * Adapter de persistência sobre AsyncStorage.
 *
 * Chaves:
 *  - execução (GestorJogo): `futelista:execucao:<id>` (legado: `futelista:pelada:<id>`)
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
  // ---- Execução -------------------------------------------------------

  async carregar(execucaoId: string): Promise<GestorJogo | null> {
    const raw =
      (await AsyncStorage.getItem(execucaoKey(execucaoId))) ??
      (await AsyncStorage.getItem(execucaoKeyLegado(execucaoId)));
    if (!raw) return null;
    return deserializeGestorJogo(raw);
  }

  async salvar(jogo: GestorJogo): Promise<void> {
    const raw = serializeGestorJogo(jogo);
    await AsyncStorage.setItem(execucaoKey(jogo.id), raw);
    // Limpa cópia legada se existir (evita item-fantasma após upgrade).
    await AsyncStorage.removeItem(execucaoKeyLegado(jogo.id));
  }

  async limpar(execucaoId: string): Promise<void> {
    await AsyncStorage.removeItem(execucaoKey(execucaoId));
    await AsyncStorage.removeItem(execucaoKeyLegado(execucaoId));
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

  async carregarExecucoesDe(peladaId: string): Promise<GestorJogo[]> {
    const resumos = await this.lerTodasExecucoes();
    const ids = resumos
      .filter((r) => r.peladaId === peladaId)
      .map((r) => r.id);
    const carregadas: GestorJogo[] = [];
    for (const id of ids) {
      const exec = await this.carregar(id);
      if (exec) carregadas.push(exec);
    }
    return carregadas.sort((a, b) => a.createdAt - b.createdAt);
  }

  private async lerTodasExecucoes(): Promise<ResumoExecucao[]> {
    const keys = await AsyncStorage.getAllKeys();
    const execKeys = keys.filter(
      (k) =>
        k.startsWith(STORAGE_KEYS.EXEC) ||
        k.startsWith(STORAGE_KEYS.EXEC_LEGACY),
    );
    if (execKeys.length === 0) return [];
    const entries = await AsyncStorage.multiGet(execKeys);
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
    const raw = await AsyncStorage.getItem(peladaTipoKey(peladaId));
    if (!raw) return null;
    return deserializePelada(raw);
  }

  async salvarPelada(pelada: Pelada): Promise<void> {
    await AsyncStorage.setItem(
      peladaTipoKey(pelada.id),
      serializePelada(pelada),
    );
  }

  async excluirPelada(peladaId: string): Promise<void> {
    await AsyncStorage.removeItem(peladaTipoKey(peladaId));
  }

  async listarPeladas(opcoes?: {
    incluirArquivadas?: boolean;
  }): Promise<ResumoPeladaTipo[]> {
    const incluirArquivadas = opcoes?.incluirArquivadas ?? false;
    const keys = await AsyncStorage.getAllKeys();
    const peladaKeys = keys.filter((k) =>
      k.startsWith(STORAGE_KEYS.PELADA_TIPO),
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
      if (!incluirArquivadas && base.arquivadaEm !== undefined) continue;
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
        dia: base.dia,
        hora: base.hora,
        local: base.local,
        arquivadaEm: base.arquivadaEm,
      });
    }
    return resumos.sort((a, b) => b.createdAt - a.createdAt);
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
