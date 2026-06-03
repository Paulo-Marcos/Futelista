import { Player } from '../Player';
import { CreateTeam } from './CreateTeam.abstract';

/**
 * Estratégia BY_ORDER_MIXING_TOP_TWO_TEAMS — embaralha apenas os primeiros
 * 2 × playersPerTeam jogadores (os "top 2 times"), preservando a ordem dos
 * demais. Útil quando os primeiros a chegar competem entre si, mas o restante
 * mantém a ordem de espera.
 */
export class CreateTeamMixingTopTwoTeams extends CreateTeam {
  shuffledList?: Player[];

  protected prepararLista(
    players: Player[],
    playersPerTeam: number,
  ): Player[] {
    const limite = playersPerTeam * 2;
    const topo = this.shuffle(players.slice(0, limite));
    const restante = players.slice(limite);
    this.shuffledList = [...topo, ...restante];
    return this.shuffledList;
  }
}
