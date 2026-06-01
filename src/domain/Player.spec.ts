import { Goal } from './Goal';
import { Match } from './Match';
import { Player } from './Player';
import { ScreenTime } from './ScreenTime';
import { Team } from './Team';

describe('Teste da classe Player', () => {
  it('Deverá criar um jogador com id definido', () => {
    const player = new Player('Paulo Marcos');
    expect(player.id).toBeDefined();
  });
  it('Deverá adicionar um gol ao jogador', () => {
    const player = new Player('Paulo Marcos');
    const teamA = new Team(5);
    const teamB = new Team(5);
    const match = new Match(teamA, teamB);
    const goal = new Goal(match, player, teamA, new ScreenTime(1, 125));
    player.addGoal(goal);
    expect(player.goals[0]).toBe(goal);
  });
  it('Deverá Lançar erro se o gol não pertence ao jogador', () => {
    const player = new Player('Paulo Marcos');
    const player2 = new Player('Paulo Marcos');
    const teamA = new Team(5);
    const teamB = new Team(5);
    const match = new Match(teamA, teamB);
    const goal = new Goal(match, player2, teamA, new ScreenTime(1, 125));
    expect(() => player.addGoal(goal)).toThrowError('Gol não pertence a esse jogador');
  });
  it('Deverá adicionar um novo time para o jogador', () => {
    const player = new Player('Paulo Marcos');
    const team = new Team(5);
    team.addPlayer(player);
    player.addTeam(team);
    expect(player.teams[0]).toBe(team);
  });
  it('Deverá lançar erro se jogador não pertencer ao time', () => {
    const player = new Player('Paulo Marcos');
    const player2 = new Player('Paulo Marcos');
    const team = new Team(5);
    team.addPlayer(player2);
    expect(() => player.addTeam(team)).toThrowError('Jogador não pertence a esse time');
  });
  it('Deverá adicionar uma partida ao jogador', () => {
    const player = new Player('Paulo Marcos');
    const teamA = new Team(5);
    teamA.addPlayer(player);
    const teamB = new Team(5);
    const match = new Match(teamA, teamB);
    player.addTeam(teamA);
    player.addMatch(match);
    expect(player.matches[0]).toBe(match);
  });
  it('Deverá lançar erro se nenhum time do jogador pertencer a partida', () => {
    const player = new Player('Paulo Marcos');
    const teamA = new Team(5);
    const teamB = new Team(5);
    const match = new Match(teamA, teamB);
    expect(() => player.addMatch(match)).toThrowError(
      'Jogador não pertence a essa partida',
    );
  });

  describe('Quando renomear o jogador', () => {
    it('deverá atualizar o nome com a string informada', () => {
      const player = new Player('Antigo');
      player.rename('Novo Nome');
      expect(player.name).toBe('Novo Nome');
    });

    it('deverá remover espaços nas pontas', () => {
      const player = new Player('Antigo');
      player.rename('   Pedro   ');
      expect(player.name).toBe('Pedro');
    });

    it('deverá lançar erro quando o novo nome é vazio', () => {
      const player = new Player('Antigo');
      expect(() => player.rename('')).toThrowError(
        'Nome do jogador não pode ser vazio.',
      );
    });

    it('deverá lançar erro quando o novo nome é só espaços', () => {
      const player = new Player('Antigo');
      expect(() => player.rename('   ')).toThrowError(
        'Nome do jogador não pode ser vazio.',
      );
    });
  });
});
