import "react-native-get-random-values";
import { Goal } from "./Goal";
import { Match } from "./Match";
import { Player, PlayerSituation } from "./Player";
import { Switch } from "./Switch";
import * as uuid from "uuid";

/**
 * Time de pelada — agrupamento de até `limit` jogadores.
 *
 * Acumula histórico de partidas (vitórias, empates, derrotas), gols marcados,
 * trocas de jogador e bandeira `advantage` (vantagem para a próxima partida).
 * `fullTeam` espelha `players.length === limit` e é atualizado em qualquer
 * mutação da lista.
 *
 * Invariantes:
 *  - addPlayer respeita `limit`.
 *  - removePlayer marca o jogador como STOPPED.
 *  - addGoal exige que o autor pertença ao time, exceto em gol-contra.
 */
export type TeamInput = {
  /** Quantos jogadores cabem no time (definido pelas Rules da pelada). */
  limit: number;
  /** Id preexistente — usado em reidratação para manter identidade. */
  id?: string;
};

export class Team {
  players: Player[] = [];
  matches: Match[] = [];
  goals: Goal[] = [];
  switches: Switch[] = [];
  victories: number = 0;
  draws: number = 0;
  loses: number = 0;
  id: string = uuid.v4();
  advantage: boolean = false;
  fullTeam: boolean = false;
  situation = TeamSituation.CREATED;
  readonly limit: number;
  /**
   * Nome personalizado do time (ex.: "Vermelhos"). Quando ausente, a UI
   * cai num rótulo posicional ("Time 1", "Time 2"...). Trim no setter:
   * string vazia ou só espaços = remove o custom.
   */
  nomeCustom?: string;
  /**
   * Cor personalizada do time (hex, ex.: "#E11D2A"). Quando ausente, a
   * UI deriva uma cor determinística do `id` (TeamCrest). Setter valida
   * formato; vazio remove.
   */
  corCustom?: string;

  constructor(input: TeamInput) {
    this.limit = input.limit;
    if (input.id) this.id = input.id;
  }

  setSituation(situation: TeamSituation): void {
    this.situation = situation;
  }

  /**
   * Renomeia o time para um label custom — passar `undefined` ou string
   * vazia restaura o rótulo posicional default. Limita a 30 chars pra
   * evitar quebra de layout em tudo que renderiza nome de time.
   */
  renomear(novoNome?: string): void {
    if (novoNome === undefined) {
      this.nomeCustom = undefined;
      return;
    }
    const limpo = novoNome.trim().slice(0, 30);
    this.nomeCustom = limpo.length === 0 ? undefined : limpo;
  }

  /**
   * Define a cor custom do time. Aceita hex de 6 ou 8 dígitos com `#`.
   * Passar `undefined` ou string vazia remove o override.
   */
  mudarCor(cor?: string): void {
    if (cor === undefined || cor.trim() === "") {
      this.corCustom = undefined;
      return;
    }
    const limpo = cor.trim();
    if (!/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(limpo)) {
      throw Error(`Cor inválida: ${limpo} (use formato hex #RRGGBB).`);
    }
    this.corCustom = limpo.toUpperCase();
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
    // splice(index, 1) remove APENAS o jogador alvo. Sem o segundo argumento,
    // splice(index) remove do índice até o fim — bug histórico que esvaziava
    // o time em times maiores que 1 jogador. Regressão em Team.spec.ts.
    this.players.splice(index, 1);
    this.players.push(playerEnters);
    this.switches.push(new Switch(playerEnters, playerLeaves, this));
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

/**
 * Situação atual do time na fila/partida.
 *
 *  - CREATED:  recém-formado, ainda não entrou na fila de próximos.
 *  - ON_NEXT:  aguardando na fila para entrar em partida.
 *  - PLAYING:  jogando partida atual.
 *  - STOPPED:  saiu da rodada (perdeu, foi removido manualmente etc.).
 */
export enum TeamSituation {
  PLAYING,
  STOPPED,
  ON_NEXT,
  CREATED,
}
