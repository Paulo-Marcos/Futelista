import { Player } from '../Player';
import { Team } from '../Team';

/**
 * Estratégia BY_ORDER_MIXING_TOP_TWO_TEAMS — embaralha apenas os primeiros
 * 2 × playersPerTeam jogadores (os "top 2 times"), preservando a ordem dos
 * demais. Útil quando os primeiros a chegar competem entre si, mas o restante
 * mantém a ordem de espera.
 */
export class CreateTeamMixingTopTwoTeams {
  shuffledList?: Player[];

  create(players: Player[], playersPerTeam: number): Team[] {
    if (players.length < 2 * playersPerTeam)
      throw Error('Quantidade de jogadores insuficiente para determinar os times.');
    const newList = this.shufflePlayers(players, playersPerTeam * 2);
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

  private shufflePlayers(players: Player[], numberOfPlayersToShuffle: number): Player[] {
    const playersToShuffle = players.slice(0, numberOfPlayersToShuffle);
    const rest = players.slice(numberOfPlayersToShuffle);
    const shuffledPlayers = this.shuffleList(playersToShuffle);
    return [...shuffledPlayers, ...rest];
  }

  private shuffleList(list: Player[]): Player[] {
    for (let index = list.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [list[index], list[randomIndex]] = [list[randomIndex], list[index]];
    }
    return list;
  }
}
