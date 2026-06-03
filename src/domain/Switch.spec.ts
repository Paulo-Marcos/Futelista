import { Player } from './Player';
import { Switch } from './Switch';
import { Team } from './Team';

describe('Teste da classe Switch', () => {
  it('Deverá criar uma Substituição', () => {
    const teamA = new Team({ limit: 5 });
    const player = new Player({ name: 'teste' });
    teamA.addPlayer(player);
    expect(new Switch(new Player({ name: 'teste' }), player, teamA)).toBeDefined();
  });
});
