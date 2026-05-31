import "react-native-get-random-values";
import * as uuid from "uuid";
import { Match } from "./Match";
import { Player, PlayerSituation } from "./Player";
import { Rules } from "./Rules";
import { Team, TeamSituation } from "./Team";
import { CreateTeamFactory } from "./TeamBuilder/CreateTeam.factory";
import { Timer, TimerStatus } from "./Timer";
import { FinalResultProcessor } from "./UpdateDraw/UpdateDray.processor";

export class GameManager {
  id: string = uuid.v4();
  players: Player[] = [];
  next: Team[] = [];
  playing?: Match;
  matches: Match[] = [];
  advantageToNext?: Team = undefined;
  timer?: Timer;
  playersWithoutTeam: number = 0;
  private updateResult = new FinalResultProcessor();
  observers: Function[];
  constructor(
    readonly name: string,
    readonly rules: Rules,
  ) {
    this.observers = [];
    // , readonly teams: Team[],
    // this.next = teams.slice(2)
    // this.matches.push(this.playing)
  }

  // Método para adicionar observadores
  adicionarObserver(observer: Function) {
    this.observers.push(observer);
  }

  // Método para notificar os observadores
  notificarObservers(type: string, value: any) {
    this.observers.forEach((observer) => observer(type, value));
  }

  getTeams(): Team[] {
    return this.next;
  }

  addPlayerList(names: string[]): Player[] {
    //TEMP
    this.players = [];
    names.forEach((name) => this.addPlayer(name));
    return this.players;
  }

  addPlayer(name: string): Player {
    const newPlayer = new Player(name);
    this.players.push(newPlayer);
    this.playersWithoutTeam++;
    return newPlayer;
  }

  createTeams(): Team[] {
    if (this.next.length > 0) throw Error("Times já foram criados");
    const createTeam = CreateTeamFactory.fabricate(this.rules.choosingTeams);
    this.next = createTeam.create(this.players, this.rules.playersPerTeam);
    this.notificarObservers("teams", this.next);
    return this.next;
  }

  setPlayingGame(): void {
    if (this.playing !== undefined)
      throw Error("Já existe uma partida acontecendo.");
    this.playing = new Match(this.removeFirstNext(), this.removeFirstNext());
  }

  removeFirstNext(): Team {
    return this.next.shift()!;
  }

  getNthNext(nextNumber: number): Team {
    return this.next[nextNumber - 1];
  }

  getLastTeam(): Team {
    return this.next[this.next.length - 1];
  }

  addToNewTeam(player: Player): void {
    const newTeam = new Team(this.rules.playersPerTeam);
    newTeam.addPlayer(player);
    this.next.push(newTeam);
  }

  addToLastTeam(player: Player): void {
    const lastTeam = this.getLastTeam();
    lastTeam.fullTeam ? this.addToNewTeam(player) : lastTeam.addPlayer(player);
  }

  relocatePlayersWithoutTeam(): void {
    if (this.playersWithoutTeam === 0) return;
    this.players.forEach((player) => {
      if (!player.currentTeam) {
        this.addToLastTeam(player);
      }
    });
  }

  switchPlayerLeft(playerIn: Player, playerOut: Player): void {
    const teamToOut = playerIn.currentTeam!;
    teamToOut.removePlayer(playerIn);
    const teamToIn = playerOut.currentTeam!;
    teamToIn.removePlayer(playerOut)!;
    teamToIn.addPlayer(playerIn);
    this.updateTeams(teamToOut);
  }

  resizeTeams(beginTeam?: Team): void {
    const begin = beginTeam ? this.next.indexOf(beginTeam) : 0;
    for (let i = begin; i <= this.next.length - 2; i++) {
      if (this.next[i].fullTeam) continue;
      this.relocatePlayers(this.next[i + 1], this.next[i]);
    }
  }

  relocatePlayers(teamFrom: Team, teamTo: Team): void {
    while (!teamTo.fullTeam && teamFrom.players.length !== 0) {
      teamTo.addPlayer(teamFrom.removeNewestPlayer());
    }
  }

  resizePlayingGame(team: Team): void {
    const playerEnters = this.next[0].removeNewestPlayer();
    team.addPlayer(playerEnters);
    this.resizeTeams();
  }

  //remover jogador da pelada sem incluir outro no lugar

  updateTeams(beginTeam: Team): void {
    beginTeam.situation === TeamSituation.PLAYING
      ? this.resizePlayingGame(beginTeam)
      : this.resizeTeams(beginTeam);
  }

  removeFromGame(removedPlayer: Player): void {
    const team = removedPlayer.currentTeam!;
    team.removePlayer(removedPlayer);
    removedPlayer.setSituation(PlayerSituation.STOPPED);
    this.updateTeams(team);
  }

  // Trocar jogador de Times

  switchPlayerFromTeam(player1: Player, player2: Player): void {
    const team1 = player1.currentTeam!;
    const team2 = player2.currentTeam!;
    team1.switchPlayer(player2, player1);
    team2.switchPlayer(player1, player2);
  }

  //inicia a partida atual

  start(): void {
    if (!this.timer || this.timer.status === TimerStatus.ENDED)
      this.timer = new Timer(
        this.rules.numberTimes,
        this.rules.getDurationMatch(),
      );
    this.timer.start();
  }

  pause(): void {
    this.timer?.pause();
  }

  continue(): void {
    this.timer?.continue();
  }

  addGoal(team: Team, playerGoal: Player): void {
    this.playing?.addGoal(team, playerGoal, this.timer!.getTime());
  }

  setResult(): void {
    this.playing?.setResult();
  }

  // Atualiza os novos times, considerando o resultado do jogo.

  setNextMatch(teamWithExternalAdvantage?: Team): void {
    this.updateResult.process({
      game: this,
      externalAdvantage: teamWithExternalAdvantage,
    });
  }

  relocateTeam(team: Team): void {
    const lastTeam = this.next.pop();
    if (!lastTeam?.fullTeam) this.relocatePlayers(team, lastTeam!);
    lastTeam && this.next.push(lastTeam);
    this.next.push(team);
  }

  //Pegar o outro time que está jogando

  getOtherPlayingTeam(team: Team): Team {
    return this.playing!.getOtherTeam(team);
  }
}
