import { GestorJogo, PeladaStatus } from "@/src/domain/GestorJogo";
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
 *  - `GestorJogo` / Execução (sessão jogada, com estado, partidas etc.)
 *
 * Assinatura assíncrona para suportar adapters de I/O sem quebra de contrato.
 */
export interface RepositorioPelada {
  // ---- Execução (GestorJogo) ----------------------------------------
  carregar(execucaoId: string): Promise<GestorJogo | null>;
  salvar(jogo: GestorJogo): Promise<void>;
  limpar(execucaoId: string): Promise<void>;
  /** Lista todas as execuções (todas as peladas jogadas, agregado). */
  listar(): Promise<ResumoExecucao[]>;
  /** Lista execuções de uma Pelada (tipo) específica. */
  listarExecucoesDe(peladaId: string): Promise<ResumoExecucao[]>;
  /**
   * Reidrata **todas** as execuções da Pelada (tipo) — necessário para
   * gerar agregados cross-execução (artilharia, sequências). Custo é
   * proporcional ao número de execuções, normalmente OK para uma pelada
   * pessoal (~dezenas). Execuções não encontradas no storage são
   * ignoradas (lista parcial).
   */
  carregarExecucoesDe(peladaId: string): Promise<GestorJogo[]>;

  // ---- Pelada (tipo cadastrado) --------------------------------------
  carregarPelada(peladaId: string): Promise<Pelada | null>;
  salvarPelada(pelada: Pelada): Promise<void>;
  excluirPelada(peladaId: string): Promise<void>;
  /**
   * Lista peladas cadastradas. Por padrão omite as arquivadas (soft delete).
   * Passe `{ incluirArquivadas: true }` para vir tudo, com o flag
   * `arquivadaEm` populado nos resumos arquivados.
   */
  listarPeladas(opcoes?: {
    incluirArquivadas?: boolean;
  }): Promise<ResumoPeladaTipo[]>;
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
  /** Dia preferencial (ex.: "Quartas"). Opcional — decorativo. */
  dia?: string;
  /** Horário preferencial (ex.: "21:00"). Opcional — decorativo. */
  hora?: string;
  /** Local preferencial (ex.: "Quadra do CEF"). Opcional — decorativo. */
  local?: string;
  /**
   * Timestamp em que a pelada foi arquivada (soft delete). Quando definido,
   * o adapter por default omite o registro de `listarPeladas()` — só vem
   * quando o chamador passa `incluirArquivadas: true`.
   */
  arquivadaEm?: number;
};
