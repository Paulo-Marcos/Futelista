// Barrel publico do dominio. Importe daqui (`@/src/domain`) sempre
// que possivel, para reduzir caminhos longos e tornar a fronteira do
// dominio explicita.

export { GestorJogo, PeladaStatus } from "./GestorJogo";
export type { DadosExecucao } from "./GestorJogo";
export { Pelada } from "./Pelada";
export type { DadosPelada } from "./Pelada";
export { Goal } from "./Goal";
export { Match, ResultMatch } from "./Match";
export { Player, PlayerSituation } from "./Player";
export { Rules, ChoosingTeams } from "./Rules";
export { ScreenTime } from "./ScreenTime";
export { Switch } from "./Switch";
export { Team, TeamSituation } from "./Team";
export { Timer, TimerStatus } from "./Timer";

export type {
  RepositorioPelada,
  ResumoExecucao,
  ResumoPeladaTipo,
} from "./ports/RepositorioPelada";
