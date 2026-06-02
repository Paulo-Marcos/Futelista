import { GameManager, PeladaStatus } from "@/src/domain/GameManager";
import { Pelada } from "@/src/domain/Pelada";

/**
 * Porta de persistencia.
 *
 * O domínio define o contrato; quem implementa fica em
 * `src/infrastructure/storage/`. Adapters disponíveis: em memória (testes)
 * e AsyncStorage (produção).
 *
 * Cobre duas entidades:
 *  - `Pelada` (tipo cadastrado: nome + regras)
 *  - `GameManager` / Execução (sessão jogada, com estado, partidas etc.)
 *
 * Assinatura assíncrona para suportar adapters de I/O sem quebra de contrato.
 */
export interface RepositorioPelada {
  // ---- Execução (GameManager) ----------------------------------------
  carregar(execucaoId: string): Promise<GameManager | null>;
  salvar(jogo: GameManager): Promise<void>;
  limpar(execucaoId: string): Promise<void>;
  /** Lista todas as execuções (todas as peladas jogadas, agregado). */
  listar(): Promise<ResumoExecucao[]>;
  /** Lista execuções de uma Pelada (tipo) específica. */
  listarExecucoesDe(peladaId: string): Promise<ResumoExecucao[]>;

  // ---- Pelada (tipo cadastrado) --------------------------------------
  carregarPelada(peladaId: string): Promise<Pelada | null>;
  salvarPelada(pelada: Pelada): Promise<void>;
  excluirPelada(peladaId: string): Promise<void>;
  listarPeladas(): Promise<ResumoPeladaTipo[]>;
}

/**
 * Resumo leve de uma execução (sessão) sem reidratar o agregado inteiro.
 */
export type ResumoExecucao = {
  id: string;
  name: string;
  status: PeladaStatus;
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  totalJogadores: number;
  totalPartidas: number;
  peladaId?: string;
};

/**
 * Resumo de uma Pelada (tipo cadastrado) — útil pra listar na tela
 * "Minhas peladas" sem precisar abrir cada uma.
 */
export type ResumoPeladaTipo = {
  id: string;
  nome: string;
  createdAt: number;
  /** Snapshot das regras default da pelada. */
  regras: {
    playersPerTeam: number;
    timeMatch: string;
    numberTimes: number;
    goalLimit: number;
  };
  /** Quantas execuções já existem registradas para essa Pelada. */
  totalExecucoes: number;
};

/**
 * Alias retro-compatível. O nome antigo era "ResumoPelada" e referia-se
 * à execução. Mantido como `ResumoPelada` por compatibilidade com código
 * que ainda não migrou.
 *
 * @deprecated Use ResumoExecucao para execuções ou ResumoPeladaTipo para tipos.
 */
export type ResumoPelada = ResumoExecucao;
