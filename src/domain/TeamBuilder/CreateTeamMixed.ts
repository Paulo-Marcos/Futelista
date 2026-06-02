import { Player } from '../Player';
import { Team } from '../Team';

/**
 * Estratégia BY_MIXING_TEAMS — embaralha todos os jogadores antes de
 * distribuir em times. Independente da ordem de cadastro.
 *
 * `shuffledList` fica exposto para que testes/UI consigam mostrar a lista
 * final usada pela rodada.
 */
export class CreateTeamMixed {
  shuffledList?: Player[];

  create(players: Player[], playersPerTeam: number): Team[] {
    if (players.length < 2 * playersPerTeam)
      throw Error('Quantidade de jogadores insuficiente para determinar os times.');
    const newList = this.shuffleList(players);
    this.shuffledList = newList;
    return this.createTeams(newList, playersPerTeam);
  }

  createTeams(players: Player[], playersPerTeam: number): Team[] {
    const teams: Team[] = [];
    players.forEach((player, index) => {
      if (index % playersPerTeam === 0) teams.push(new Team(playersPerTeam));
      const indexTeam = Math.floor(index / playersPerTeam);
      teams[indexTeam].addPlayer(player);
    });
    return teams;
  }

  private shuffleList(list: Player[]): Player[] {
    for (let index = list.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [list[index], list[randomIndex]] = [list[randomIndex], list[index]];
    }
    return list;
  }
}
