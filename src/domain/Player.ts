import "react-native-get-random-values";
import * as uuid from "uuid";
import { Goal } from "./Goal";
import { Team } from "./Team";
import { Match } from "./Match";

export class Player {
  id: string = uuid.v4();
  goals: Goal[] = [];
  teams: Team[] = [];
  matches: Match[] = [];
  currentTeam?: Team;
  situation = PlayerSituation.NO_TEAM;
  constructor(readonly name: string) {}

  addGoal(goal: Goal): void {
    if (goal.player.id !== this.id)
      throw Error("Gol não pertence a esse jogador");
    this.goals.push(goal);
  }

  addTeam(team: Team): void {
    if (!team.hasPlayer(this)) throw Error("Jogador não pertence a esse time");
    this.teams.push(team);
    this.currentTeam = team;
    this.setSituation(PlayerSituation.ACTIVE);
  }

  addMatch(match: Match): void {
    if (!this.teams.find((team) => match.teams.has(team)))
      throw Error("Jogador não pertence a essa partida");
    this.matches.push(match);
  }

  setSituation(situation: PlayerSituation): void {
    this.situation = situation;
  }
}

export enum PlayerSituation {
  STOPPED,
  ACTIVE,
  NO_TEAM,
}
