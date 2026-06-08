import "react-native-get-random-values";
import * as uuid from "uuid";
import { Goal } from "./Goal";
import { Team } from "./Team";
import { Match, ResultMatch } from "./Match";

/**
 * Jogador participante de uma pelada.
 *
 * Mantém o histórico de times pelos quais passou, partidas que jogou e
 * gols que marcou. `currentTeam` aponta para o time onde está agora; nulo
 * quando o jogador acabou de chegar (NO_TEAM) ou foi removido (STOPPED).
 *
 * Sempre que entra em um Time, `Player` é registrado em `teams` e a
 * situação vira ACTIVE — feito a partir do próprio `Team.addPlayer`.
 */
export type PlayerInput = {
  name: string;
  /** Id preexistente — usado em reidratação para manter identidade. */
  id?: string;
};

export class Player {
  id: string = uuid.v4();
  goals: Goal[] = [];
  teams: Team[] = [];
  matches: Match[] = [];
  currentTeam?: Team;
  situation = PlayerSituation.NO_TEAM;
  name: string;
  /**
   * URI local da foto do jogador (F-19). Apontamos para um arquivo já
   * copiado pra `FileSystem.documentDirectory` para sobreviver a
   * exclusões da galeria. `undefined` = avatar gradient + iniciais.
   */
  fotoUri?: string;
  constructor(input: PlayerInput) {
    this.name = input.name;
    if (input.id) this.id = input.id;
  }

  /**
   * Aponta a foto do jogador para `uri`. Trim e validação mínima
   * (precisa começar com `file://`, `http://`, `https://` ou `data:`).
   * `undefined` é equivalente a `removerFoto()`.
   */
  definirFoto(uri: string | undefined): void {
    if (uri === undefined) {
      this.fotoUri = undefined;
      return;
    }
    const limpo = uri.trim();
    if (limpo.length === 0) {
      this.fotoUri = undefined;
      return;
    }
    if (!/^(file:|https?:|data:)/i.test(limpo)) {
      throw Error(`URI de foto inválida: ${limpo}`);
    }
    this.fotoUri = limpo;
  }

  /** Atalho para limpar a foto custom. */
  removerFoto(): void {
    this.fotoUri = undefined;
  }

  /** Renomeia o jogador. Recusa nome vazio (whitespace só). */
  rename(novoNome: string): void {
    const limpo = novoNome.trim();
    if (limpo.length === 0)
      throw Error("Nome do jogador não pode ser vazio.");
    this.name = limpo;
  }

  /** Registra um gol marcado pelo próprio jogador (rejeita gol de outro). */
  addGoal(goal: Goal): void {
    if (goal.player.id !== this.id)
      throw Error("Gol não pertence a esse jogador");
    this.goals.push(goal);
  }

  /** Vincula o jogador ao time e marca como ACTIVE. Espera que o Team já o tenha incluído. */
  addTeam(team: Team): void {
    if (!team.hasPlayer(this)) throw Error("Jogador não pertence a esse time");
    this.teams.push(team);
    this.currentTeam = team;
    this.setSituation(PlayerSituation.ACTIVE);
  }

  /** Registra a participação do jogador em uma partida (apenas se algum time seu joga nela). */
  addMatch(match: Match): void {
    if (!this.teams.find((team) => match.teams.has(team)))
      throw Error("Jogador não pertence a essa partida");
    this.matches.push(match);
  }

  setSituation(situation: PlayerSituation): void {
    this.situation = situation;
  }

  /**
   * Estatísticas agregadas do jogador na pelada corrente.
   *
   * - `gols`: gols feitos.
   * - `partidas`: partidas em que entrou (inclui partidas em andamento).
   * - `vitorias` / `empates` / `derrotas`: contam apenas partidas com
   *   `result` definido (encerradas).
   *
   * **Limitação conhecida**: para decidir se a partida foi vitória ou
   * derrota, olhamos quem é o vencedor da Match e checamos se o jogador
   * está no time corrente (`Team.hasPlayer`). Se o jogador trocou de
   * time via switch depois da partida, o cálculo pode classificar
   * incorretamente — o domínio não guarda histórico por-partida do
   * vínculo jogador↔time. Para a maioria das peladas (sem rodízio
   * agressivo durante a partida) essa aproximação acerta.
   */
  stats(): EstatisticasJogador {
    let vitorias = 0;
    let empates = 0;
    let derrotas = 0;
    for (const match of this.matches) {
      if (match.result === undefined) continue;
      if (match.result === ResultMatch.DRAW) {
        empates += 1;
        continue;
      }
      if (match.winner?.hasPlayer(this)) {
        vitorias += 1;
      } else if (match.loser?.hasPlayer(this)) {
        derrotas += 1;
      }
    }
    return {
      gols: this.goals.length,
      partidas: this.matches.length,
      vitorias,
      empates,
      derrotas,
    };
  }
}

export type EstatisticasJogador = {
  gols: number;
  partidas: number;
  vitorias: number;
  empates: number;
  derrotas: number;
};

/**
 * Estado momentâneo do jogador na pelada.
 *
 *  - NO_TEAM: cadastrado mas ainda sem time atribuído.
 *  - ACTIVE:  está em um time (`currentTeam` definido).
 *  - STOPPED: foi removido do time e não joga até voltar.
 */
export enum PlayerSituation {
  STOPPED,
  ACTIVE,
  NO_TEAM,
}
