import "react-native-get-random-values";
import * as uuid from "uuid";
import { Goal } from "./Goal";
import { Team, TeamSituation } from "./Team";
import { Player } from "./Player";
import { ScreenTime } from "./ScreenTime";

/**
 * Partida entre dois times. Mantém o conjunto de gols, decide vencedor e
 * perdedor via `setResult()` e expõe troca de jogador delegando ao próprio Team.
 *
 * O construtor tem efeitos colaterais: registra a partida em ambos os times
 * (`addMatch`) e muda a situação deles para PLAYING. Por isso, na
 * reidratação de payload, instâncias de Match são montadas via Object.create
 * para evitar re-disparar esses efeitos.
 */
export class Match {
  winner?: Team = undefined;
  loser?: Team = undefined;
  result?: ResultMatch = undefined;
  goals: Goal[] = [];
  teams: Set<Team>;
  id: string = uuid.v4();

  constructor(
    readonly teamA: Team,
    readonly teamB: Team,
  ) {
    this.teams = new Set([teamA, teamB]);
    teamA.addMatch(this);
    teamA.setSituation(TeamSituation.PLAYING);
    teamB.addMatch(this);
    teamB.setSituation(TeamSituation.PLAYING);
  }

  getOtherTeam(thisTeam: Team): Team {
    return [...this.teams].find((team) => team !== thisTeam)!;
  }

  countGoals(): { teamA: number; teamB: number } {
    return this.goals.reduce(
      (resultGoals, goal) => {
        goal.team.id === this.teamA.id
          ? (resultGoals.teamA += 1)
          : (resultGoals.teamB += 1);
        return resultGoals;
      },
      { teamA: 0, teamB: 0 },
    );
  }

  private setWinner(resultGoals: { teamA: number; teamB: number }): void {
    if (resultGoals.teamA > resultGoals.teamB) {
      this.winner = this.teamA;
      this.loser = this.teamB;
    } else if (resultGoals.teamA < resultGoals.teamB) {
      this.winner = this.teamB;
      this.loser = this.teamA;
    }
  }

  setResult(): void {
    const resultGoals = this.countGoals();
    if (resultGoals.teamA === resultGoals.teamB) {
      this.result = ResultMatch.DRAW;
      return;
    }
    this.result = ResultMatch.VICTORY;
    this.setWinner(resultGoals);
  }

  addGoal(team: Team, playerGoal: Player, screenTime: ScreenTime): void {
    if (!this.teams.has(team))
      throw Error("Time que fez o gol não está nessa partida.");
    const goal = new Goal(
      this,
      playerGoal,
      team,
      screenTime,
      !team.hasPlayer(playerGoal),
    );
    this.goals.push(goal);
    team.addGoal(goal);
  }

  switchPlayer(playerEnters: Player, playerLeaves: Player, team: Team): void {
    if (!this.teams.has(team))
      throw Error("Timer para troca não está nessa partida.");
    team.switchPlayer(playerEnters, playerLeaves);
  }
}

/**
 * Resultado final de uma partida.
 *
 *  - DRAW:    empate (ambos os times com mesmo número de gols).
 *  - VICTORY: vitória de um dos times — `winner` e `loser` definidos.
 */
export enum ResultMatch {
  DRAW,
  VICTORY,
}
