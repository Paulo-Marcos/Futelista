import { Player } from '../Player';
import { CreateTeamMixed } from './CreateTeamMixed';

describe('Teste da classe CreateTeamMixed', () => {
  it('deverá criar times de forma aleatória', () => {
    const creator = new CreateTeamMixed();
    const players = [
      new Player('a'),
      new Player('b'),
      new Player('c'),
      new Player('d'),
      new Player('e'),
    ];
    const teams = creator.create(players, 2);
    const shuffledList = creator.shuffledList;
    for (let i = 0; i < teams.length; i++) {
      teams[i].players.forEach((player) => {
        expect(player).toEqual(shuffledList!.shift()!);
      });
    }
  });
  it('deverá lançar erro se a quantidade de jogadores for menor que 2 vezes numero de jogadores por time', () => {
    const creator = new CreateTeamMixed();
    const players = [new Player('a'), new Player('b'), new Player('c')];
    expect(() => creator.create(players, 2)).toThrowError(
      'Quantidade de jogadores insuficiente para determinar os times.',
    );
  });
});
