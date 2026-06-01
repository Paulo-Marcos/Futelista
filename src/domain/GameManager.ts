import "react-native-get-random-values";
import * as uuid from "uuid";
import { Match } from "./Match";
import { Player, PlayerSituation } from "./Player";
import { DataRules, Rules } from "./Rules";
import { Team, TeamSituation } from "./Team";
import { CreateTeamFactory } from "./TeamBuilder/CreateTeam.factory";
import { Timer, TimerStatus } from "./Timer";
import { FinalResultProcessor } from "./UpdateDraw/UpdateDray.processor";

/**
 * GameManager — agregado raiz da pelada.
 *
 * Reatividade: implementa o contrato de "external store" do React
 * (subscribe + version snapshot) para uso com useSyncExternalStore.
 * Cada metodo publico que muda estado chama `notify()` no final.
 * O Timer recebe um callback de tick para que decrementos do cronometro
 * tambem disparem notificacao.
 */
export class GameManager {
  id: string = uuid.v4();
  players: Player[] = [];
  next: Team[] = [];
  playing?: Match;
  matches: Match[] = [];
  advantageToNext?: Team = undefined;
  timer?: Timer;
  playersWithoutTeam: number = 0;
  name: string;
  rules: Rules;
  private updateResult = new FinalResultProcessor();

  private _version = 0;
  private listeners = new Set<() => void>();

  constructor(name: string, rules: Rules) {
    this.name = name;
    this.rules = rules;
  }

  // ----- Reatividade ------------------------------------------------------

  /** Numero monotonico incrementado a cada notify(); usado como snapshot. */
  get version(): number {
    return this._version;
  }

  /** Registra um listener; retorna funcao de unsubscribe. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this._version++;
    this.listeners.forEach((listener) => listener());
  }

  // ----- Times e jogadores ------------------------------------------------

  getTeams(): Team[] {
    return this.next;
  }

  addPlayerList(names: string[]): Player[] {
    this.players = [];
    names.forEach((name) => {
      const newPlayer = new Player(name);
      this.players.push(newPlayer);
      this.playersWithoutTeam++;
    });
    this.notify();
    return this.players;
  }

  addPlayer(name: string): Player {
    const newPlayer = new Player(name);
    this.players.push(newPlayer);
    this.playersWithoutTeam++;
    this.notify();
    return newPlayer;
  }

  createTeams(): Team[] {
    if (this.next.length > 0) throw Error("Times já foram criados");
    const createTeam = CreateTeamFactory.fabricate(this.rules.choosingTeams);
    this.next = createTeam.create(this.players, this.rules.playersPerTeam);
    this.notify();
    return this.next;
  }

  setPlayingGame(): void {
    if (this.playing !== undefined)
      throw Error("Já existe uma partida acontecendo.");
    this.playing = new Match(this.removeFirstNext(), this.removeFirstNext());
    this.notify();
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
    this.notify();
  }

  addToLastTeam(player: Player): void {
    const lastTeam = this.getLastTeam();
    lastTeam.fullTeam ? this.addToNewTeam(player) : lastTeam.addPlayer(player);
    this.notify();
  }

  relocatePlayersWithoutTeam(): void {
    if (this.playersWithoutTeam === 0) return;
    this.players.forEach((player) => {
      if (!player.currentTeam) {
        this.addToLastTeam(player);
      }
    });
    this.notify();
  }

  switchPlayerLeft(playerIn: Player, playerOut: Player): void {
    const teamToOut = playerIn.currentTeam!;
    teamToOut.removePlayer(playerIn);
    const teamToIn = playerOut.currentTeam!;
    teamToIn.removePlayer(playerOut)!;
    teamToIn.addPlayer(playerIn);
    this.updateTeams(teamToOut);
    this.notify();
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

  // remover jogador da pelada sem incluir outro no lugar
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
    this.notify();
  }

  // Trocar jogador entre Times
  switchPlayerFromTeam(player1: Player, player2: Player): void {
    const team1 = player1.currentTeam!;
    const team2 = player2.currentTeam!;
    team1.switchPlayer(player2, player1);
    team2.switchPlayer(player1, player2);
    this.notify();
  }

  // ----- Gestão de jogadores e times --------------------------------------

  /**
   * Remove um jogador definitivamente da pelada. Se ele estiver em um time,
   * tira do time primeiro (usando o caminho já testado de removeFromGame).
   */
  removePlayer(player: Player): void {
    const index = this.players.indexOf(player);
    if (index === -1) throw Error("Jogador não está na pelada.");
    if (player.currentTeam) {
      this.removeFromGame(player);
    } else if (this.playersWithoutTeam > 0) {
      this.playersWithoutTeam--;
    }
    this.players.splice(index, 1);
    this.notify();
  }

  /**
   * Renomeia um jogador da pelada. Delega a validação de nome para Player.rename.
   */
  renamePlayer(player: Player, novoNome: string): void {
    if (!this.players.includes(player))
      throw Error("Jogador não está na pelada.");
    player.rename(novoNome);
    this.notify();
  }

  /**
   * Limpa a fila de times e o estado de vantagem, devolvendo todos os jogadores
   * para a situação "sem time". Permite re-sortear depois com createTeams().
   *
   * Bloqueado quando há partida em andamento — mudar times no meio do jogo
   * deixaria refs inconsistentes em playing.
   */
  resetTimes(): void {
    if (this.playing)
      throw Error(
        "Não é possível resetar times com partida em andamento.",
      );
    this.next = [];
    this.advantageToNext = undefined;
    this.players.forEach((p) => {
      p.currentTeam = undefined;
      p.situation = PlayerSituation.NO_TEAM;
    });
    this.playersWithoutTeam = this.players.length;
    this.notify();
  }

  /**
   * Atualiza um subconjunto de campos das regras. Campos não informados
   * preservam o valor atual.
   *
   * Guards (independentes da validação de Rules):
   *  - playersPerTeam: não pode mudar com times já criados ou partida em andamento.
   *  - numberTimes: não pode mudar com cronômetro ativo (running/paused/interval).
   *  - choosingTeams: não pode mudar com times já formados (resetar antes).
   *
   * As validações de domínio de cada campo (faixa de valores etc) ficam no
   * próprio construtor de Rules.
   */
  atualizarRegras(parcial: DataRules): Rules {
    this.validarMudancaPlayersPerTeam(parcial.playersPerTeam);
    this.validarMudancaNumberTimes(parcial.numberTimes);
    this.validarMudancaChoosingTeams(parcial.choosingTeams);

    this.rules = new Rules({
      id: this.rules.id,
      name: parcial.name ?? this.rules.name,
      playersPerTeam: parcial.playersPerTeam ?? this.rules.playersPerTeam,
      timeMatch: parcial.timeMatch ?? this.rules.timeMatch,
      numberTimes: parcial.numberTimes ?? this.rules.numberTimes,
      goalLimit: parcial.goalLimit ?? this.rules.goalLimit,
      choosingTeams: parcial.choosingTeams ?? this.rules.choosingTeams,
    });
    this.notify();
    return this.rules;
  }

  private validarMudancaPlayersPerTeam(novo?: number): void {
    if (novo === undefined || novo === this.rules.playersPerTeam) return;
    if (this.playing || this.next.length > 0)
      throw Error(
        "Não é possível mudar jogadores por time com times montados ou partida em andamento.",
      );
  }

  private validarMudancaNumberTimes(novo?: number): void {
    if (novo === undefined || novo === this.rules.numberTimes) return;
    if (!this.timer) return;
    const status = this.timer.status;
    if (status !== TimerStatus.CREATED && status !== TimerStatus.ENDED)
      throw Error(
        "Não é possível mudar o número de tempos com cronômetro ativo.",
      );
  }

  private validarMudancaChoosingTeams(novo?: number): void {
    if (novo === undefined || novo === this.rules.choosingTeams) return;
    if (this.next.length > 0)
      throw Error(
        "Não é possível mudar o modo de sorteio com times já formados. Resete os times antes.",
      );
  }

  // ----- Partida atual ----------------------------------------------------

  start(): void {
    if (!this.timer || this.timer.status === TimerStatus.ENDED)
      this.timer = new Timer(
        this.rules.numberTimes,
        this.rules.getDurationMatch(),
        () => this.notify(),
      );
    this.timer.start();
    this.notify();
  }

  pause(): void {
    this.timer?.pause();
    this.notify();
  }

  continue(): void {
    this.timer?.continue();
    this.notify();
  }

  addGoal(team: Team, playerGoal: Player): void {
    this.playing?.addGoal(team, playerGoal, this.timer!.getTime());
    this.notify();
  }

  setResult(): void {
    this.playing?.setResult();
    this.notify();
  }

  // Atualiza os novos times, considerando o resultado do jogo.
  setNextMatch(teamWithExternalAdvantage?: Team): void {
    this.updateResult.process({
      game: this,
      externalAdvantage: teamWithExternalAdvantage,
    });
    this.notify();
  }

  relocateTeam(team: Team): void {
    const lastTeam = this.next.pop();
    if (!lastTeam?.fullTeam) this.relocatePlayers(team, lastTeam!);
    lastTeam && this.next.push(lastTeam);
    this.next.push(team);
  }

  // Pegar o outro time que esta jogando
  getOtherPlayingTeam(team: Team): Team {
    return this.playing!.getOtherTeam(team);
  }
}
