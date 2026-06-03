import "react-native-get-random-values";
import * as uuid from "uuid";
import { Goal } from "./Goal";
import { Team } from "./Team";
import { Match } from "./Match";

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
  constructor(input: PlayerInput) {
    this.name = input.name;
    if (input.id) this.id = input.id;
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
}

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
