import { Match, ResultMatch } from './Match';
import { Player } from './Player';
import { ScreenTime } from './ScreenTime';
import { Team } from './Team';

describe('Teste da classe Match', () => {
  it('Deverá criar uma partida', () => {
    const teamA = new Team(4);
    const teamB = new Team(4);
    const match = new Match(teamA, teamB);
    expect(match).toBeDefined();
    expect(teamA.matches[0].id).toBe(match.id);
    expect(teamB.matches[0].id).toBe(match.id);
    expect(match).toBeDefined();
    expect(match.teams.has(teamA)).toBe(true);
    expect(match.teams.has(teamB)).toBe(true);
  });
  describe('Teste do Resultado', () => {
    it('Deverá definir o ganhador da partida TimeA', () => {
      const teamA = new Team(4);
      const playerA = new Player('teste');
      teamA.addPlayer(playerA);
      const teamB = new Team(4);
      const playerB = new Player('teste');
      teamB.addPlayer(playerB);
      const match = new Match(teamA, teamB);
      match.addGoal(teamA, playerA, new ScreenTime(2, 6));
      match.setResult();
      expect(match.result).toBe(ResultMatch.VICTORY);
      expect(match.winner).toEqual(teamA);
      expect(match.loser).toEqual(teamB);
    });
    it('Deverá definir o ganhador da partida TimeB', () => {
      const teamA = new Team(4);
      const playerA = new Player('teste');
      teamA.addPlayer(playerA);
      const teamB = new Team(4);
      const playerB = new Player('teste');
      teamB.addPlayer(playerB);
      const match = new Match(teamA, teamB);
      match.addGoal(teamB, playerB, new ScreenTime(2, 6));
      match.setResult();
      expect(match.result).toBe(ResultMatch.VICTORY);
      expect(match.winner).toEqual(teamB);
      expect(match.loser).toEqual(teamA);
    });
    it('Deverá resultar em empate', () => {
      const teamA = new Team(4);
      const playerA = new Player('teste');
      teamA.addPlayer(playerA);
      const teamB = new Team(4);
      const playerB = new Player('teste');
      teamB.addPlayer(playerB);
      const match = new Match(teamA, teamB);
      match.setResult();
      expect(match.result).toBe(ResultMatch.DRAW);
      expect(match.winner).toBeUndefined();
      expect(match.loser).toBeUndefined();
    });
  });
  describe('Quando adiciona gol', () => {
    it('Deverá adicionar corretamente', () => {
      const player = new Player('teste');
      const teamA = new Team(4);
      teamA.addPlayer(player);
      const teamB = new Team(4);
      const match = new Match(teamA, teamB);
      match.addGoal(teamA, player, new ScreenTime(2, 6));
      expect(match.goals.length).toBe(1);
      expect(teamA.goals.length).toBe(1);
      expect(player.goals.length).toBe(1);
    });
    it('Deverá adicionar um gol contra', () => {
      const player = new Player('teste');
      const teamA = new Team(4);
      teamA.addPlayer(player);
      const playerB = new Player('teste');
      const teamB = new Team(4);
      teamB.addPlayer(playerB);
      const match = new Match(teamA, teamB);
      match.addGoal(teamA, playerB, new ScreenTime(2, 6));
      expect(match.goals.length).toBe(1);
      expect(teamA.goals.length).toBe(1);
      expect(playerB.goals.length).toBe(0);
    });
    it('Deverá lançar erro se o gol não for da partida', () => {
      const player = new Player('teste');
      const teamA = new Team(4);
      teamA.addPlayer(player);
      const teamB = new Team(4);
      const match = new Match(teamA, teamB);

      expect(() => {
        match.addGoal(new Team(5), player, new ScreenTime(2, 6));
      }).toThrowError('Time que fez o gol não está nessa partida.');
    });
  });
  describe('Quando substitui um jogador', () => {
    it('Deverá substituir corretamente', () => {
      const player = new Player('teste');
      const teamA = new Team(4);
      teamA.addPlayer(player);
      const teamB = new Team(4);
      const match = new Match(teamA, teamB);
      const newPlayer = new Player('teste');
      expect(match.teamA.hasPlayer(player)).toBe(true);
      match.switchPlayer(newPlayer, player, teamA);
      expect(match.teamA.hasPlayer(newPlayer)).toBe(true);
    });
    it('Deverá lançar erro quando o time não estiver na partida', () => {
      const player = new Player('teste');
      const teamA = new Team(4);
      teamA.addPlayer(player);
      const teamB = new Team(4);
      const match = new Match(teamA, teamB);
      const newPlayer = new Player('teste');
      expect(() => match.switchPlayer(newPlayer, player, new Team(5))).toThrowError(
        'Timer para troca não está nessa partida.',
      );
    });
  });
});
