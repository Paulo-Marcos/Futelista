import { Player } from './Player';
import { Switch } from './Switch';
import { Team } from './Team';

describe('Teste da classe Switch', () => {
  it('Deverá criar uma Substituição', () => {
    const teamA = new Team(5);
    const player = new Player('teste');
    teamA.addPlayer(player);
    expect(new Switch(new Player('teste'), player, teamA)).toBeDefined();
  });
});
