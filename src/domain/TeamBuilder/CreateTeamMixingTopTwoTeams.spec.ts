import { Player } from '../Player';
import { CreateTeamMixingTopTwoTeams } from './CreateTeamMixingTopTwoTeams';

describe('Teste da classe CreateTeamMixingTopTwoTeams', () => {
  it('deverá criar times de forma aleatória 2 primeiros times', () => {
    const creator = new CreateTeamMixingTopTwoTeams();
    const players = [
      new Player('a'),
      new Player('b'),
      new Player('c'),
      new Player('d'),
      new Player('e'),
    ];
    const teams = creator.create(players, 2);
    const shuffledList = creator.shuffledList;
    for (let i = 0; i < 2; i++) {
      teams[i].players.forEach((player, index) => {
        expect(player).toEqual(shuffledList!.shift()!);
      });
    }
    expect(teams[2].players[0]).toEqual(shuffledList![0]);
  });
  it('deverá lançar erro se a quantidade de jogadores for menor que 2 vezes numero de jogadores por time', () => {
    const creator = new CreateTeamMixingTopTwoTeams();
    const players = [new Player('a'), new Player('b'), new Player('c')];
    expect(() => creator.create(players, 2)).toThrowError(
      'Quantidade de jogadores insuficiente para determinar os times.',
    );
  });
});
