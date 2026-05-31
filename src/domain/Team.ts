import "react-native-get-random-values";
import { Goal } from "./Goal";
import { Match } from "./Match";
import { Player, PlayerSituation } from "./Player";
import { Switch } from "./Switch";
import * as uuid from "uuid";

export class Team {
  players: Player[] = [];
  matches: Match[] = [];
  goals: Goal[] = [];
  Switches: Switch[] = [];
  victories: number = 0;
  draws: number = 0;
  loses: number = 0;
  id: string = uuid.v4();
  advantage: boolean = false;
  fullTeam: boolean = false;
  situation = TeamSituation.CREATED;
  constructor(readonly limit: number) {}

  setSituation(situation: TeamSituation): void {
    this.situation = situation;
  }

  updateSizeTeam(): void {
    this.fullTeam = this.players.length === this.limit;
  }

  addPlayer(player: Player): void {
    if (this.fullTeam)
      throw Error("Não é possível adicionar novo jogador. Limite alcançado.");
    this.players.push(player);
    player.addTeam(this);
    this.updateSizeTeam();
  }

  removePlayer(player: Player): Player {
    //tava deletando mais de um.
    const index = this.players.indexOf(player);
    const deletedPlayer = this.players.splice(index, 1)[0];
    player.setSituation(PlayerSituation.STOPPED);
    this.updateSizeTeam();
    return deletedPlayer;
  }

  removeNewestPlayer(): Player {
    const player = this.players.shift()!;
    this.updateSizeTeam();
    return player;
  }

  hasPlayer(playerSeek: Player): boolean {
    return this.players.find((player) => playerSeek === player) !== undefined;
  }

  switchPlayer(playerEnters: Player, playerLeaves: Player): void {
    const index = this.players.indexOf(playerLeaves);
    this.players.splice(index);
    this.players.push(playerEnters);
    this.Switches.push(new Switch(playerEnters, playerLeaves, this));
    playerEnters.addTeam(this);
  }

  addGoal(goal: Goal): void {
    if (goal.team.id !== this.id) throw Error("Gol não pertence a esse time");
    if (!goal.ownGoal) {
      if (!this.players.find((player) => goal.player === player))
        throw Error("Time não tem o autor do goal");
      goal.player.addGoal(goal);
    }
    this.goals.push(goal);
  }

  addMatch(match: Match): void {
    if (!match.teams.has(this))
      throw Error("Essa partida não pertence a esse time");
    this.players.forEach((player) => player.addMatch(match));
    this.matches.push(match);
  }
}

export enum TeamSituation {
  PLAYING,
  STOPPED,
  ON_NEXT,
  CREATED,
}
