import { Player } from '../Player';
import { CreateTeam } from './CreateTeam.abstract';

/**
 * Estratégia BY_MIXING_TEAMS — embaralha todos os jogadores antes de
 * distribuir em times. Independente da ordem de cadastro.
 *
 * `shuffledList` fica exposto para que testes/UI consigam mostrar a lista
 * final usada pela rodada.
 */
export class CreateTeamMixed extends CreateTeam {
  shuffledList?: Player[];

  protected prepararLista(players: Player[]): Player[] {
    this.shuffledList = this.shuffle(players);
    return this.shuffledList;
  }
}
