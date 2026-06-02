import { Player } from './Player';
import { Team } from './Team';

/**
 * Troca de jogador num time — value object imutável.
 *
 * Registrado a cada `Team.switchPlayer`; serve de histórico para auditar
 * quem entrou/saiu sem precisar diffar listas de jogadores entre partidas.
 */
export class Switch {
  constructor(
    readonly playerEnters: Player,
    readonly playerLeaves: Player,
    readonly team: Team,
  ) {}
}
