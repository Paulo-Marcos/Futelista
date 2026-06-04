import { GestorJogo } from "@/src/domain/GestorJogo";
import { Pelada } from "@/src/domain/Pelada";
import {
  RepositorioPelada,
  ResumoExecucao,
  ResumoPeladaTipo,
} from "@/src/domain/ports/RepositorioPelada";

/**
 * Adapter de persistencia em memoria.
 *
 * Mantem instancias em Maps modulo-level, o que preserva o estado entre
 * remounts do provider (util com fast refresh) dentro do mesmo runtime JS.
 * Nao sobrevive a recarga completa do app.
 */
const execucoes = new Map<string, GestorJogo>();
const peladas = new Map<string, Pelada>();

export class RepositorioPeladaEmMemoria implements RepositorioPelada {
  async carregar(execucaoId: string): Promise<GestorJogo | null> {
    return execucoes.get(execucaoId) ?? null;
  }

  async salvar(jogo: GestorJogo): Promise<void> {
    execucoes.set(jogo.id, jogo);
  }

  async limpar(execucaoId: string): Promise<void> {
    execucoes.delete(execucaoId);
  }

  async listar(): Promise<ResumoExecucao[]> {
    return [...execucoes.values()].map(toResumoExecucao).sort(porRecencia);
  }

  async listarExecucoesDe(peladaId: string): Promise<ResumoExecucao[]> {
    return [...execucoes.values()]
      .filter((g) => g.peladaId === peladaId)
      .map(toResumoExecucao)
      .sort(porRecencia);
  }

  async carregarPelada(peladaId: string): Promise<Pelada | null> {
    return peladas.get(peladaId) ?? null;
  }

  async salvarPelada(pelada: Pelada): Promise<void> {
    peladas.set(pelada.id, pelada);
  }

  async excluirPelada(peladaId: string): Promise<void> {
    peladas.delete(peladaId);
  }

  async listarPeladas(): Promise<ResumoPeladaTipo[]> {
    return [...peladas.values()]
      .map((p) => ({
        id: p.id,
        nome: p.nome,
        createdAt: p.createdAt,
        regras: {
          playersPerTeam: p.regras.playersPerTeam,
          timeMatch: p.regras.timeMatch,
          numberTimes: p.regras.numberTimes,
          goalLimit: p.regras.goalLimit,
        },
        totalExecucoes: [...execucoes.values()].filter(
          (g) => g.peladaId === p.id,
        ).length,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }
}

function toResumoExecucao(g: GestorJogo): ResumoExecucao {
  return {
    id: g.id,
    name: g.name,
    status: g.status,
    createdAt: g.createdAt,
    startedAt: g.startedAt,
    endedAt: g.endedAt,
    totalJogadores: g.players.length,
    totalPartidas: g.matches.length,
    peladaId: g.peladaId,
  };
}

function porRecencia(a: ResumoExecucao, b: ResumoExecucao): number {
  return (
    (b.endedAt ?? b.startedAt ?? b.createdAt) -
    (a.endedAt ?? a.startedAt ?? a.createdAt)
  );
}
