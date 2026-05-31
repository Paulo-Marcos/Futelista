import { Goal } from './Goal';
import { Match } from './Match';
import { Player } from './Player';
import { ScreenTime } from './ScreenTime';
import { Team } from './Team';

describe('Teste da classe Goal', () => {
  it('Deverá criar um Gol', () => {
    const player = new Player('teste');
    const teamA = new Team(5);
    const teamB = new Team(5);
    const match = new Match(teamA, teamB);
    const goal = new Goal(match, player, teamA, new ScreenTime(1, 125));
    expect(goal).toBeDefined();
  });
  it('Deverá criar um Gol contra', () => {
    const player = new Player('teste');
    const teamA = new Team(5);
    const teamB = new Team(5);
    const match = new Match(teamA, teamB);
    const goal = new Goal(match, player, teamA, new ScreenTime(1, 125), true);
    expect(goal.ownGoal).toBe(true);
  });
});
