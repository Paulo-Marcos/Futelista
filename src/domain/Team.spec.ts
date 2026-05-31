import { Goal } from './Goal';
import { Match } from './Match';
import { Player } from './Player';
import { ScreenTime } from './ScreenTime';
import { Team } from './Team';

describe('Teste da classe Team', () => {
  it('Deverá criar time corretamente', () => {
    expect(new Team(5)).toBeDefined();
  });
  describe('Teste de adicionar jogador', () => {
    it('Deverá adicionar jogador', () => {
      const teamA = new Team(5);
      const player = new Player('Teste');
      teamA.addPlayer(player);
      expect(teamA.players?.length).toBe(1);
      expect(player.teams[0].id).toBe(teamA.id);
    });
    it('Deverá lançar erro se ultrapassar o limite de jogadores no time', () => {
      const teamA = new Team(2);
      teamA.addPlayer(new Player('Teste'));
      teamA.addPlayer(new Player('Teste'));

      expect(() => teamA.addPlayer(new Player('Teste'))).toThrowError(
        'Não é possível adicionar novo jogador. Limite alcançado.',
      );
    });
  });
  describe('Teste de substituir jogador', () => {
    it('Deverá substituir jogador', () => {
      const teamA = new Team(5);
      const player = new Player('Teste');
      const playerEnters = new Player('Teste');
      teamA.addPlayer(player);
      teamA.switchPlayer(playerEnters, player);
      expect(teamA.hasPlayer(playerEnters)).toBe(true);
      expect(teamA.players?.length).toBe(1);
      expect(playerEnters.teams[0].id).toBe(teamA.id);
    });
    it('Deverá adicionar na lista de substituições do time', () => {
      const teamA = new Team(5);
      const player = new Player('Teste');
      const playerEnters = new Player('Teste');
      teamA.addPlayer(player);
      teamA.switchPlayer(playerEnters, player);
      teamA.switchPlayer(player, playerEnters);
      expect(teamA.Switches.length).toBe(2);
      expect(teamA.players?.length).toBe(1);
    });
    // Regressão: switchPlayer usava `splice(index)` (sem 2º argumento), que
    // remove do índice até o fim do array. Com mais de 1 jogador, o time era
    // esvaziado e só sobrava o playerEnters do push. O fix usa splice(index, 1).
    it('Deverá preservar os outros jogadores ao substituir um do meio', () => {
      const teamA = new Team(4);
      const playerA = new Player('A');
      const playerB = new Player('B');
      const playerC = new Player('C');
      const playerEnters = new Player('Entra');
      teamA.addPlayer(playerA);
      teamA.addPlayer(playerB);
      teamA.addPlayer(playerC);

      teamA.switchPlayer(playerEnters, playerB);

      expect(teamA.players.length).toBe(3);
      expect(teamA.hasPlayer(playerA)).toBe(true);
      expect(teamA.hasPlayer(playerC)).toBe(true);
      expect(teamA.hasPlayer(playerEnters)).toBe(true);
      expect(teamA.hasPlayer(playerB)).toBe(false);
    });
  });
  describe('Teste de adicionar gol', () => {
    it('Deverá adicionar gol', () => {
      const player = new Player('Teste');
      const teamA = new Team(5);
      const teamB = new Team(5);
      const match = new Match(teamA, teamB);
      teamA.addPlayer(player);
      const goal = new Goal(match, player, teamA, new ScreenTime(1, 25));
      teamA.addGoal(goal);
      expect(teamA.goals.length).toEqual(1);
      expect(player.goals[0]).toEqual(goal);
    });
    it('Deverá lançar erro ao enviar gol do time errado', () => {
      const player = new Player('Teste');
      const teamA = new Team(5);
      const teamB = new Team(5);
      const match = new Match(teamA, teamB);
      teamA.addPlayer(player);
      const goal = new Goal(match, player, teamB, new ScreenTime(1, 25));

      expect(() => teamA.addGoal(goal)).toThrowError('Gol não pertence a esse time');
    });
    it('Deverá lançar erro ao enviar gol se time não tiver o autor do gol', () => {
      const player = new Player('Teste');
      const teamA = new Team(5);
      const teamB = new Team(5);
      const match = new Match(teamA, teamB);
      const goal = new Goal(match, player, teamA, new ScreenTime(1, 25));

      expect(() => teamA.addGoal(goal)).toThrowError('Time não tem o autor do goal');
    });
  });
  describe('Teste de adicionar Match', () => {
    it('Deverá adicionar nova partida', () => {
      const teamA = new Team(5);
      const teamB = new Team(5);
      teamA.addPlayer(new Player('Teste'));
      teamA.addPlayer(new Player('Teste'));
      teamA.addPlayer(new Player('Teste'));
      new Match(teamA, teamB);
      expect(teamA.matches.length).toEqual(1);
      teamA.players?.forEach((player) => expect(player.matches.length).toEqual(1));
    });
    it('Deverá adicionar nova partida', () => {
      const teamA = new Team(5);
      const match = new Match(new Team(5), new Team(5));
      expect(() => teamA.addMatch(match)).toThrowError(
        'Essa partida não pertence a esse time',
      );
    });
  });
});
