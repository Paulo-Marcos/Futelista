import { Goal } from './Goal';
import { Match } from './Match';
import { Player } from './Player';
import { ScreenTime } from './ScreenTime';
import { Team } from './Team';

function preparaPartida(teamA: Team, teamB: Team, jogadorA: Player, jogadorB: Player): Match {
  teamA.addPlayer(jogadorA);
  teamB.addPlayer(jogadorB);
  jogadorA.addTeam(teamA);
  jogadorB.addTeam(teamB);
  // O construtor de Match chama teamA.addMatch(match) + teamB.addMatch(match),
  // e Team.addMatch já propaga player.addMatch(match) para cada jogador —
  // não chamar manualmente aqui (causa contagem duplicada).
  return new Match(teamA, teamB);
}

describe('Teste da classe Player', () => {
  it('Deverá criar um jogador com id definido', () => {
    const player = new Player({ name: 'Paulo Marcos' });
    expect(player.id).toBeDefined();
  });
  it('Deverá adicionar um gol ao jogador', () => {
    const player = new Player({ name: 'Paulo Marcos' });
    const teamA = new Team({ limit: 5 });
    const teamB = new Team({ limit: 5 });
    const match = new Match(teamA, teamB);
    const goal = new Goal(match, player, teamA, new ScreenTime(1, 125));
    player.addGoal(goal);
    expect(player.goals[0]).toBe(goal);
  });
  it('Deverá Lançar erro se o gol não pertence ao jogador', () => {
    const player = new Player({ name: 'Paulo Marcos' });
    const player2 = new Player({ name: 'Paulo Marcos' });
    const teamA = new Team({ limit: 5 });
    const teamB = new Team({ limit: 5 });
    const match = new Match(teamA, teamB);
    const goal = new Goal(match, player2, teamA, new ScreenTime(1, 125));
    expect(() => player.addGoal(goal)).toThrowError('Gol não pertence a esse jogador');
  });
  it('Deverá adicionar um novo time para o jogador', () => {
    const player = new Player({ name: 'Paulo Marcos' });
    const team = new Team({ limit: 5 });
    team.addPlayer(player);
    player.addTeam(team);
    expect(player.teams[0]).toBe(team);
  });
  it('Deverá lançar erro se jogador não pertencer ao time', () => {
    const player = new Player({ name: 'Paulo Marcos' });
    const player2 = new Player({ name: 'Paulo Marcos' });
    const team = new Team({ limit: 5 });
    team.addPlayer(player2);
    expect(() => player.addTeam(team)).toThrowError('Jogador não pertence a esse time');
  });
  it('Deverá adicionar uma partida ao jogador', () => {
    const player = new Player({ name: 'Paulo Marcos' });
    const teamA = new Team({ limit: 5 });
    teamA.addPlayer(player);
    const teamB = new Team({ limit: 5 });
    const match = new Match(teamA, teamB);
    player.addTeam(teamA);
    player.addMatch(match);
    expect(player.matches[0]).toBe(match);
  });
  it('Deverá lançar erro se nenhum time do jogador pertencer a partida', () => {
    const player = new Player({ name: 'Paulo Marcos' });
    const teamA = new Team({ limit: 5 });
    const teamB = new Team({ limit: 5 });
    const match = new Match(teamA, teamB);
    expect(() => player.addMatch(match)).toThrowError(
      'Jogador não pertence a essa partida',
    );
  });

  describe('stats()', () => {
    it('jogador recém-criado retorna zeros', () => {
      const p = new Player({ name: 'A' });
      expect(p.stats()).toEqual({
        gols: 0,
        partidas: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
      });
    });

    it('conta gols feitos e partidas (mesmo em andamento)', () => {
      const teamA = new Team({ limit: 1 });
      const teamB = new Team({ limit: 1 });
      const jogA = new Player({ name: 'A' });
      const jogB = new Player({ name: 'B' });
      const match = preparaPartida(teamA, teamB, jogA, jogB);
      const goal = new Goal(match, jogA, teamA, new ScreenTime(1, 30));
      jogA.addGoal(goal);
      const stats = jogA.stats();
      expect(stats.gols).toBe(1);
      expect(stats.partidas).toBe(1);
      // sem setResult: nenhuma vitória/empate/derrota contabilizada
      expect(stats.vitorias + stats.empates + stats.derrotas).toBe(0);
    });

    it('contabiliza vitória quando time do jogador venceu', () => {
      const teamA = new Team({ limit: 1 });
      const teamB = new Team({ limit: 1 });
      const jogA = new Player({ name: 'A' });
      const jogB = new Player({ name: 'B' });
      const match = preparaPartida(teamA, teamB, jogA, jogB);
      jogA.addGoal(new Goal(match, jogA, teamA, new ScreenTime(1, 10)));
      match.addGoal(teamA, jogA, new ScreenTime(1, 10));
      match.setResult();
      expect(jogA.stats().vitorias).toBe(1);
      expect(jogB.stats().derrotas).toBe(1);
    });

    it('contabiliza empate quando a partida termina sem vencedor', () => {
      const teamA = new Team({ limit: 1 });
      const teamB = new Team({ limit: 1 });
      const jogA = new Player({ name: 'A' });
      const jogB = new Player({ name: 'B' });
      const match = preparaPartida(teamA, teamB, jogA, jogB);
      match.setResult();
      expect(jogA.stats().empates).toBe(1);
      expect(jogB.stats().empates).toBe(1);
    });

    it('soma várias partidas (vitória + empate + derrota)', () => {
      const teamA = new Team({ limit: 1 });
      const teamB = new Team({ limit: 1 });
      const jogA = new Player({ name: 'A' });
      const jogB = new Player({ name: 'B' });
      // 1) Empate
      const m1 = preparaPartida(teamA, teamB, jogA, jogB);
      m1.setResult();
      // 2) Vitória de A — construir Match já propaga via Team.addMatch.
      const m2 = new Match(teamA, teamB);
      m2.addGoal(teamA, jogA, new ScreenTime(1, 10));
      m2.setResult();
      // 3) Vitória de B
      const m3 = new Match(teamA, teamB);
      m3.addGoal(teamB, jogB, new ScreenTime(1, 10));
      m3.setResult();

      expect(jogA.stats()).toEqual({
        gols: 1,
        partidas: 3,
        vitorias: 1,
        empates: 1,
        derrotas: 1,
      });
    });
  });

  describe('Quando renomear o jogador', () => {
    it('deverá atualizar o nome com a string informada', () => {
      const player = new Player({ name: 'Antigo' });
      player.rename('Novo Nome');
      expect(player.name).toBe('Novo Nome');
    });

    it('deverá remover espaços nas pontas', () => {
      const player = new Player({ name: 'Antigo' });
      player.rename('   Pedro   ');
      expect(player.name).toBe('Pedro');
    });

    it('deverá lançar erro quando o novo nome é vazio', () => {
      const player = new Player({ name: 'Antigo' });
      expect(() => player.rename('')).toThrowError(
        'Nome do jogador não pode ser vazio.',
      );
    });

    it('deverá lançar erro quando o novo nome é só espaços', () => {
      const player = new Player({ name: 'Antigo' });
      expect(() => player.rename('   ')).toThrowError(
        'Nome do jogador não pode ser vazio.',
      );
    });
  });
});
