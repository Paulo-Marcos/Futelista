import { Player } from "../Player";
import { CreateTeam } from "./CreateTeam.abstract";

/**
 * Estratégia BY_ORDER — monta times respeitando a ordem de cadastro dos
 * jogadores. Os primeiros `playersPerTeam` viram o time 1, os seguintes
 * o time 2, etc. Útil quando a ordem de chegada deve refletir os times
 * ("quem chega primeiro joga primeiro").
 */
export class CreateTeamByOrder extends CreateTeam {
  protected prepararLista(players: Player[]): Player[] {
    return players;
  }
}
